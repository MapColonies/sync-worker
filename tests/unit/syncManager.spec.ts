import { PassThrough } from 'stream';
import fs from 'fs';
import jsLogger from '@map-colonies/js-logger';
import * as tilesGenerator from '@map-colonies/mc-utils/dist/geo/tilesGenerator';
import { DependencyContainer } from 'tsyringe';
import { SyncManager } from '../../src/syncManager';
import { getTask } from '../mocks/files/task';
import { QueueClient } from '../../src/clients/queueClient';
import { CryptoManager } from '../../src/cryptoManager';
import { TilesManager } from '../../src/tilesManager';
import { NifiClient } from '../../src/clients/services/nifiClient';
import { registerExternalValues } from '../ testContainerConfig';
import { gatewayClientMock, uploadJsonToGWMock } from '../mocks/clients/gatewayClient';
import { storageProviderMock, existMock as isFileExistsStub, getFileStreamMock, readFileMock } from '../mocks/providers/storageProvider';
import { configMock, init as initConfig, setValue as setConfigValue, clear as clearConfig } from '../mocks/config';

let syncManager: SyncManager;
let dequeueStub: jest.SpyInstance;
let uploadTilesStub: jest.SpyInstance;
let generateSignedFileStub: jest.SpyInstance;
let updateTilesCountStub: jest.SpyInstance;
let ackStubForTileTasks: jest.SpyInstance;
let ackStubForTocTasks: jest.SpyInstance;
let rejectStubForTileTasks: jest.SpyInstance;
let rejectStubForTocTasks: jest.SpyInstance;
let tilesGeneratorStub: jest.SpyInstance;
let notifyNifiOnCompleteStub: jest.SpyInstance;
let fsReadFileSync: jest.SpyInstance;

let container: DependencyContainer;
let cryptoManager: CryptoManager;
let tilesManager: TilesManager;
let queueClient: QueueClient;
let nifiClient: NifiClient;

const tilesConfig = {
  path: 'tests/mocks/tiles',
  format: 'png',
  uploadBatchSize: 100,
  sigIsNeeded: true,
};

const tilesArray = [{ zoom: 0, x: 0, y: 1 }];

describe('syncManager', () => {
  beforeEach(() => {
    initConfig();
    setConfigValue('tiles.sigIsNeeded', true);
    fsReadFileSync = jest.spyOn(fs, 'readFileSync');
    fsReadFileSync.mockReturnValue('keyMock');

    container = registerExternalValues({ useChild: true });
    cryptoManager = container.resolve(CryptoManager);
    tilesManager = container.resolve(TilesManager);
    queueClient = container.resolve(QueueClient);
    nifiClient = container.resolve(NifiClient);

    uploadTilesStub = jest.spyOn(tilesManager, 'uploadTile').mockImplementation(async () => Promise.resolve());
    updateTilesCountStub = jest.spyOn(tilesManager, 'updateTilesCount');
    ackStubForTileTasks = jest.spyOn(queueClient.queueHandlerForTileTasks, 'ack').mockImplementation(async () => Promise.resolve());
    ackStubForTocTasks = jest.spyOn(queueClient.queueHandlerForTocTasks, 'ack').mockImplementation(async () => Promise.resolve());
    rejectStubForTileTasks = jest.spyOn(queueClient.queueHandlerForTileTasks, 'reject').mockImplementation(async () => Promise.resolve());
    rejectStubForTocTasks = jest.spyOn(queueClient.queueHandlerForTocTasks, 'reject').mockImplementation(async () => Promise.resolve());
    tilesGeneratorStub = jest.spyOn(tilesGenerator, 'tilesGenerator');
    notifyNifiOnCompleteStub = jest.spyOn(nifiClient, 'notifyNifiOnComplete').mockImplementation(async () => Promise.resolve());
  });

  afterEach(() => {
    clearConfig();
    container.reset();
    container.clearInstances();
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  describe('#runSync', () => {
    it('should successfully sign and upload file with buffers', async function () {
      // mock
      initForBuffers();
      isFileExistsStub.mockResolvedValueOnce(true);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const queueClient = container.resolve(QueueClient);
      const task = getTask();
      jest.spyOn(queueClient.queueHandlerForTocTasks, 'dequeue').mockResolvedValue(null);
      dequeueStub = jest.spyOn(queueClient.queueHandlerForTileTasks, 'dequeue').mockResolvedValue(task);
      jest.spyOn(syncManager, 'handleTocTask').mockResolvedValue(undefined);

      tilesGeneratorStub.mockImplementation(() => {
        if (dequeueStub.mock.calls.length !== 1) {
          throw new Error('invalid call order: dequeue should be called before tilesGenerator');
        }
        return tilesArray;
      });

      generateSignedFileStub.mockImplementation(async () => {
        if (tilesGeneratorStub.mock.calls.length !== 1) {
          throw new Error('invalid call order: tilesGenerator should be called before generateSignedFile');
        }
        return Promise.resolve();
      });

      uploadTilesStub.mockImplementation(async () => {
        if (generateSignedFileStub.mock.calls.length !== 1) {
          throw new Error('invalid call order: generateSignedFile should be called before uploadTile');
        }
        return Promise.resolve();
      });

      updateTilesCountStub.mockImplementation(async () => {
        if (uploadTilesStub.mock.calls.length !== 1) {
          throw new Error('invalid call order: uploadTiles should be called before updateTilesCount');
        }
        return Promise.resolve();
      });

      ackStubForTileTasks.mockImplementation(async () => {
        if (updateTilesCountStub.mock.calls.length !== 1) {
          throw new Error('invalid call order: updateTilesCount should be called before ack');
        }
        return Promise.resolve();
      });

      notifyNifiOnCompleteStub.mockImplementation(async () => {
        if (ackStubForTileTasks.mock.calls.length !== 1) {
          throw new Error('invalid call order: ack should be called before notifyNifiOnSuccess');
        }
        return Promise.resolve();
      });

      // expectation;
      await expect(syncManager.runSync()).resolves.not.toThrow();
      expect(dequeueStub).toHaveBeenCalledTimes(1);
      expect(updateTilesCountStub).toHaveBeenCalledTimes(1);
      expect(generateSignedFileStub).toHaveBeenCalledTimes(1);
      expect(uploadTilesStub).toHaveBeenCalledTimes(1);
      expect(ackStubForTileTasks).toHaveBeenCalledTimes(1);
      expect(tilesGeneratorStub).toHaveBeenCalledTimes(1);
      expect(notifyNifiOnCompleteStub).toHaveBeenCalledTimes(1);
      expect(rejectStubForTileTasks).toHaveBeenCalledTimes(0);
      expect(ackStubForTileTasks).toHaveBeenCalledWith(task.jobId, task.id);
    });

    it('should successfully sign and upload file with streams', async function () {
      // mock
      initForStreams();
      isFileExistsStub.mockResolvedValueOnce(true);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const queueClient = container.resolve(QueueClient);
      const task = getTask();
      jest.spyOn(queueClient.queueHandlerForTocTasks, 'dequeue').mockResolvedValue(null);
      dequeueStub = jest.spyOn(queueClient.queueHandlerForTileTasks, 'dequeue').mockResolvedValue(task);
      jest.spyOn(syncManager, 'handleTocTask').mockResolvedValue(undefined);

      tilesGeneratorStub.mockImplementation(() => {
        if (dequeueStub.mock.calls.length !== 1) {
          throw new Error('invalid call order: dequeue should be called before tilesGenerator');
        }
        return tilesArray;
      });

      generateSignedFileStub.mockImplementation(async () => {
        if (tilesGeneratorStub.mock.calls.length !== 1) {
          throw new Error('invalid call order: tilesGenerator should be called before generateSignedFile');
        }
        return Promise.resolve();
      });

      uploadTilesStub.mockImplementation(async () => {
        if (generateSignedFileStub.mock.calls.length !== 1) {
          throw new Error('invalid call order: generateSignedFile should be called before uploadTile');
        }
        return Promise.resolve();
      });

      updateTilesCountStub.mockImplementation(async () => {
        if (uploadTilesStub.mock.calls.length !== 1) {
          throw new Error('invalid call order: uploadTiles should be called before updateTilesCount');
        }
        return Promise.resolve();
      });

      ackStubForTileTasks.mockImplementation(async () => {
        if (updateTilesCountStub.mock.calls.length !== 1) {
          throw new Error('invalid call order: updateTilesCount should be called before ack');
        }
        return Promise.resolve();
      });

      notifyNifiOnCompleteStub.mockImplementation(async () => {
        if (ackStubForTileTasks.mock.calls.length !== 1) {
          throw new Error('invalid call order: ack should be called before notifyNifiOnSuccess');
        }
        return Promise.resolve();
      });

      // expectation;
      await expect(syncManager.runSync()).resolves.not.toThrow();
      expect(dequeueStub).toHaveBeenCalledTimes(1);
      expect(updateTilesCountStub).toHaveBeenCalledTimes(1);
      expect(generateSignedFileStub).toHaveBeenCalledTimes(1);
      expect(uploadTilesStub).toHaveBeenCalledTimes(1);
      expect(ackStubForTileTasks).toHaveBeenCalledTimes(1);
      expect(tilesGeneratorStub).toHaveBeenCalledTimes(1);
      expect(notifyNifiOnCompleteStub).toHaveBeenCalledTimes(1);
      expect(rejectStubForTileTasks).toHaveBeenCalledTimes(0);
      expect(ackStubForTileTasks).toHaveBeenCalledWith(task.jobId, task.id);
    });

    it('should successfully sign and upload toc.json file with buffers', async function () {
      initForBuffers();
      const queueClient = container.resolve(QueueClient);
      const taskWithTocData = getTask();
      (taskWithTocData.parameters as { tocData: Record<string, unknown> }).tocData = { todTestFata: 'data' };
      dequeueStub = jest.spyOn(queueClient.queueHandlerForTocTasks, 'dequeue').mockResolvedValue(taskWithTocData);
      jest.spyOn(syncManager, 'handleTilesTask').mockResolvedValue(undefined);

      generateSignedFileStub.mockImplementation(() => {
        if (dequeueStub.mock.calls.length !== 1) {
          throw new Error('invalid call order: dequeue should be called before generateSignedFile');
        }
        return tilesArray;
      });

      notifyNifiOnCompleteStub.mockImplementation(async () => {
        if (ackStubForTocTasks.mock.calls.length !== 1) {
          throw new Error('invalid call order: ack should be called before notifyNifiOnSuccess');
        }
        return Promise.resolve();
      });

      await expect(syncManager.runSync()).resolves.not.toThrow();
      expect(uploadJsonToGWMock).toHaveBeenCalledTimes(1);
      expect(dequeueStub).toHaveBeenCalledTimes(1);
      expect(generateSignedFileStub).toHaveBeenCalledTimes(1);
      expect(ackStubForTocTasks).toHaveBeenCalledTimes(1);
      expect(notifyNifiOnCompleteStub).toHaveBeenCalledTimes(1);
      expect(rejectStubForTocTasks).toHaveBeenCalledTimes(0);
      expect(updateTilesCountStub).toHaveBeenCalledTimes(0);
      expect(uploadTilesStub).toHaveBeenCalledTimes(0);
      expect(ackStubForTocTasks).toHaveBeenCalledWith(taskWithTocData.jobId, taskWithTocData.id);
    });

    it('should successfully sign and upload toc.json file with streams', async function () {
      initForStreams();
      //toc use buffer even with streams
      const signBuffer = jest
        .spyOn(cryptoManager, 'signBuffer')
        .mockReturnValue(Buffer.from('mock_png_data/testId/testVersion/testProductType/0/0/1.png'));
      const queueClient = container.resolve(QueueClient);
      const taskWithTocData = getTask();
      (taskWithTocData.parameters as { tocData: Record<string, unknown> }).tocData = { tocTestData: 'data' };
      dequeueStub = jest.spyOn(queueClient.queueHandlerForTocTasks, 'dequeue').mockResolvedValue(taskWithTocData);
      jest.spyOn(syncManager, 'handleTilesTask').mockResolvedValue(undefined);

      generateSignedFileStub.mockImplementation(() => {
        if (dequeueStub.mock.calls.length !== 1) {
          throw new Error('invalid call order: dequeue should be called before generateSignedFile');
        }
        return tilesArray;
      });

      notifyNifiOnCompleteStub.mockImplementation(async () => {
        if (ackStubForTocTasks.mock.calls.length !== 1) {
          throw new Error('invalid call order: ack should be called before notifyNifiOnSuccess');
        }
        return Promise.resolve();
      });

      await expect(syncManager.runSync()).resolves.not.toThrow();
      expect(uploadJsonToGWMock).toHaveBeenCalledTimes(1);
      expect(dequeueStub).toHaveBeenCalledTimes(1);
      expect(generateSignedFileStub).toHaveBeenCalledTimes(0); // this is the stream implementation
      expect(signBuffer).toHaveBeenCalledTimes(1);
      expect(ackStubForTocTasks).toHaveBeenCalledTimes(1);
      expect(notifyNifiOnCompleteStub).toHaveBeenCalledTimes(1);
      expect(rejectStubForTocTasks).toHaveBeenCalledTimes(0);
      expect(updateTilesCountStub).toHaveBeenCalledTimes(0);
      expect(uploadTilesStub).toHaveBeenCalledTimes(0);
      expect(ackStubForTocTasks).toHaveBeenCalledWith(taskWithTocData.jobId, taskWithTocData.id);
    });

    it('should not sign and upload file if its not exists with buffers', async function () {
      // mock
      initForBuffers();
      const queueClient = container.resolve(QueueClient);
      const task = getTask();
      dequeueStub = jest.spyOn(queueClient.queueHandlerForTileTasks, 'dequeue').mockResolvedValue(task);
      jest.spyOn(queueClient.queueHandlerForTocTasks, 'dequeue').mockResolvedValue(null);
      isFileExistsStub.mockResolvedValueOnce(false);
      tilesGeneratorStub.mockReturnValue(tilesArray);
      // expectation;
      await expect(syncManager.runSync()).resolves.not.toThrow();
      expect(dequeueStub).toHaveBeenCalledTimes(1);
      expect(updateTilesCountStub).toHaveBeenCalledTimes(1);
      expect(generateSignedFileStub).toHaveBeenCalledTimes(0);
      expect(uploadTilesStub).toHaveBeenCalledTimes(0);
      expect(ackStubForTileTasks).toHaveBeenCalledTimes(1);
      expect(tilesGeneratorStub).toHaveBeenCalledTimes(1);
      expect(notifyNifiOnCompleteStub).toHaveBeenCalledTimes(1);
      expect(rejectStubForTileTasks).toHaveBeenCalledTimes(0);
      expect(ackStubForTileTasks).toHaveBeenCalledWith(task.jobId, task.id);
    });

    it('should not sign and upload file if its not exists with streams', async function () {
      // mock
      initForStreams();
      const queueClient = container.resolve(QueueClient);
      const task = getTask();
      dequeueStub = jest.spyOn(queueClient.queueHandlerForTileTasks, 'dequeue').mockResolvedValue(task);
      jest.spyOn(queueClient.queueHandlerForTocTasks, 'dequeue').mockResolvedValue(null);
      isFileExistsStub.mockResolvedValueOnce(false);
      tilesGeneratorStub.mockReturnValue(tilesArray);
      // expectation;
      await expect(syncManager.runSync()).resolves.not.toThrow();
      expect(dequeueStub).toHaveBeenCalledTimes(1);
      expect(updateTilesCountStub).toHaveBeenCalledTimes(1);
      expect(generateSignedFileStub).toHaveBeenCalledTimes(0);
      expect(uploadTilesStub).toHaveBeenCalledTimes(0);
      expect(ackStubForTileTasks).toHaveBeenCalledTimes(1);
      expect(tilesGeneratorStub).toHaveBeenCalledTimes(1);
      expect(notifyNifiOnCompleteStub).toHaveBeenCalledTimes(1);
      expect(rejectStubForTileTasks).toHaveBeenCalledTimes(0);
      expect(ackStubForTileTasks).toHaveBeenCalledWith(task.jobId, task.id);
    });

    it('should reject task due max attempts with buffers', async function () {
      initForBuffers();
      // mock
      const queueClient = container.resolve(QueueClient);
      const task = getTask();
      task.attempts = 6;
      jest.spyOn(queueClient.queueHandlerForTocTasks, 'dequeue').mockResolvedValue(null);
      dequeueStub = jest.spyOn(queueClient.queueHandlerForTileTasks, 'dequeue').mockResolvedValue(task);
      isFileExistsStub.mockResolvedValueOnce(true);
      isFileExistsStub.mockResolvedValue(true);

      // action
      const action = async () => {
        await syncManager.runSync();
      };
      // expectation;
      await expect(action()).resolves.not.toThrow();
      expect(dequeueStub).toHaveBeenCalledTimes(1);
      expect(updateTilesCountStub).toHaveBeenCalledTimes(0);
      expect(generateSignedFileStub).toHaveBeenCalledTimes(0);
      expect(uploadTilesStub).toHaveBeenCalledTimes(0);
      expect(ackStubForTileTasks).toHaveBeenCalledTimes(0);
      expect(tilesGeneratorStub).toHaveBeenCalledTimes(0);
      expect(notifyNifiOnCompleteStub).toHaveBeenCalledTimes(1);
      expect(rejectStubForTileTasks).toHaveBeenCalledTimes(1);
      expect(rejectStubForTileTasks).toHaveBeenCalledWith(task.jobId, task.id, false);
    });

    it('should reject task due max attempts with streams', async function () {
      initForStreams();
      // mock
      const queueClient = container.resolve(QueueClient);
      const task = getTask();
      task.attempts = 6;
      jest.spyOn(queueClient.queueHandlerForTocTasks, 'dequeue').mockResolvedValue(null);
      dequeueStub = jest.spyOn(queueClient.queueHandlerForTileTasks, 'dequeue').mockResolvedValue(task);
      isFileExistsStub.mockResolvedValueOnce(true);
      isFileExistsStub.mockResolvedValue(true);

      // action
      const action = async () => {
        await syncManager.runSync();
      };
      // expectation;
      await expect(action()).resolves.not.toThrow();
      expect(dequeueStub).toHaveBeenCalledTimes(1);
      expect(updateTilesCountStub).toHaveBeenCalledTimes(0);
      expect(generateSignedFileStub).toHaveBeenCalledTimes(0);
      expect(uploadTilesStub).toHaveBeenCalledTimes(0);
      expect(ackStubForTileTasks).toHaveBeenCalledTimes(0);
      expect(tilesGeneratorStub).toHaveBeenCalledTimes(0);
      expect(notifyNifiOnCompleteStub).toHaveBeenCalledTimes(1);
      expect(rejectStubForTileTasks).toHaveBeenCalledTimes(1);
      expect(rejectStubForTileTasks).toHaveBeenCalledWith(task.jobId, task.id, false);
    });
  });
});

function initForBuffers() {
  setConfigValue('useStreams', false);
  generateSignedFileStub = jest
    .spyOn(cryptoManager, 'signBuffer')
    .mockImplementation(() => Buffer.from('mock_png_data/testId/testVersion/testProductType/0/0/1.png'));
  readFileMock.mockResolvedValue(Buffer.from('file data mock'));

  syncManager = new SyncManager(
    jsLogger({ enabled: false }),
    configMock,
    tilesConfig,
    storageProviderMock,
    queueClient,
    tilesManager,
    cryptoManager,
    nifiClient,
    gatewayClientMock
  );
}

function initForStreams() {
  setConfigValue('useStreams', true);
  const signedDataStream = new PassThrough();
  signedDataStream.write('mock_png_data/testId/testVersion/testProductType/0/0/1.png');
  signedDataStream.end();
  generateSignedFileStub = jest.spyOn(cryptoManager, 'signStream').mockReturnValue(signedDataStream);
  const fileDataStream = new PassThrough();
  fileDataStream.write('file data mock');
  fileDataStream.end();
  getFileStreamMock.mockReturnValue(fileDataStream);

  syncManager = new SyncManager(
    jsLogger({ enabled: false }),
    configMock,
    tilesConfig,
    storageProviderMock,
    queueClient,
    tilesManager,
    cryptoManager,
    nifiClient,
    gatewayClientMock
  );
}
