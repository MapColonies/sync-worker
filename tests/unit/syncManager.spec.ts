import fs from 'fs';
import jsLogger from '@map-colonies/js-logger';
import * as tilesGenerator from '@map-colonies/mc-utils/dist/geo/tilesGenerator';
import config from 'config';
import { DependencyContainer } from 'tsyringe';
import { SyncManager } from '../../src/syncManager';
import { getTask } from '../mocks/files/task';
import { QueueClient } from '../../src/clients/queueClient';
import { CryptoManager } from '../../src/cryptoManager';
import { ICryptoConfig, ITilesConfig } from '../../src/common/interfaces';
import { TilesManager } from '../../src/tilesManager';
import { NifiClient } from '../../src/clients/services/nifiClient';
import { registerExternalValues } from '../ testContainerConfig';
import * as utils from '../../src/common/utils';
import { gatewayClientMock, uploadJsonToGWMock } from '../mocks/clients/gatewayClient';

let syncManager: SyncManager;
let waitForTaskStub: jest.SpyInstance;
let uploadTilesStub: jest.SpyInstance;
let generateSignedFileStub: jest.SpyInstance;
let updateTilesCountStub: jest.SpyInstance;
let ackStub: jest.SpyInstance;
let rejectStub: jest.SpyInstance;
let tilesGeneratorStub: jest.SpyInstance;
let notifyNifiOnCompleteStub: jest.SpyInstance;
let isFileExistsStub: jest.SpyInstance;
let fsReadFileSync: jest.SpyInstance;

let container: DependencyContainer;

const tilesConfig = config.get<ITilesConfig>('tiles');
const cryptoConfig = config.get<ICryptoConfig>('crypto');

const tilesArray = [{ zoom: 0, x: 0, y: 1 }];

describe('syncManager', () => {
  beforeAll(function () {
    jest.useFakeTimers();
  });

  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    fsReadFileSync = jest.spyOn(fs, 'readFileSync');
    fsReadFileSync.mockReturnValue('mockFileBuffer');

    container = registerExternalValues({ useChild: true });
    const cryptoManager = container.resolve(CryptoManager);
    const tilesManager = container.resolve(TilesManager);
    const queueClient = container.resolve(QueueClient);
    const nifiClient = container.resolve(NifiClient);

    generateSignedFileStub = jest
      .spyOn(cryptoManager, 'generateSignedFile')
      .mockImplementation(() => Buffer.from('mock_png_data/testId/testVersion/testProductType/0/0/1.png'));
    uploadTilesStub = jest.spyOn(tilesManager, 'uploadTile').mockImplementation(async () => Promise.resolve());
    updateTilesCountStub = jest.spyOn(tilesManager, 'updateTilesCount');
    ackStub = jest.spyOn(queueClient.queueHandler, 'ack').mockImplementation(async () => Promise.resolve());
    rejectStub = jest.spyOn(queueClient.queueHandler, 'reject').mockImplementation(async () => Promise.resolve());
    tilesGeneratorStub = jest.spyOn(tilesGenerator, 'tilesGenerator');
    notifyNifiOnCompleteStub = jest.spyOn(nifiClient, 'notifyNifiOnComplete').mockImplementation(async () => Promise.resolve());
    isFileExistsStub = jest.spyOn(utils, 'isFileExists');

    syncManager = new SyncManager(
      jsLogger({ enabled: false }),
      config,
      tilesConfig,
      cryptoConfig,
      queueClient,
      tilesManager,
      cryptoManager,
      nifiClient,
      gatewayClientMock
    );
  });

  afterEach(() => {
    container.reset();
    container.clearInstances();
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  describe('#runSync', () => {
    it('should successfully sign and upload file', async function () {
      // mock
      isFileExistsStub.mockResolvedValueOnce(true);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const queueClient = container.resolve(QueueClient);
      const task = getTask();
      waitForTaskStub = jest.spyOn(queueClient.queueHandler, 'waitForTask').mockResolvedValue(task);

      tilesGeneratorStub.mockImplementation(() => {
        if (waitForTaskStub.mock.calls.length !== 1) {
          throw new Error('invalid call order: waitForTask should be called before tilesGenerator');
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

      ackStub.mockImplementation(async () => {
        if (updateTilesCountStub.mock.calls.length !== 1) {
          throw new Error('invalid call order: updateTilesCount should be called before ack');
        }
        return Promise.resolve();
      });

      notifyNifiOnCompleteStub.mockImplementation(async () => {
        if (ackStub.mock.calls.length !== 1) {
          throw new Error('invalid call order: ack should be called before notifyNifiOnSuccess');
        }
        return Promise.resolve();
      });

      // expectation;
      await expect(syncManager.runSync()).resolves.not.toThrow();
      expect(waitForTaskStub).toHaveBeenCalledTimes(1);
      expect(updateTilesCountStub).toHaveBeenCalledTimes(1);
      expect(generateSignedFileStub).toHaveBeenCalledTimes(1);
      expect(uploadTilesStub).toHaveBeenCalledTimes(1);
      expect(ackStub).toHaveBeenCalledTimes(1);
      expect(tilesGeneratorStub).toHaveBeenCalledTimes(1);
      expect(notifyNifiOnCompleteStub).toHaveBeenCalledTimes(1);
      expect(rejectStub).toHaveBeenCalledTimes(0);
      expect(ackStub).toHaveBeenCalledWith(task.jobId, task.id);
    });

    it('should successfully sign and upload toc.json file', async function () {
      const queueClient = container.resolve(QueueClient);
      const taskWithTocData = getTask();
      (taskWithTocData.parameters as { tocData: Record<string, unknown> }).tocData = { todTestFata: 'data' };
      waitForTaskStub = jest.spyOn(queueClient.queueHandler, 'waitForTask').mockResolvedValue(taskWithTocData);

      generateSignedFileStub.mockImplementation(() => {
        if (waitForTaskStub.mock.calls.length !== 1) {
          throw new Error('invalid call order: waitForTask should be called before generateSignedFile');
        }
        return tilesArray;
      });

      notifyNifiOnCompleteStub.mockImplementation(async () => {
        if (ackStub.mock.calls.length !== 1) {
          throw new Error('invalid call order: ack should be called before notifyNifiOnSuccess');
        }
        return Promise.resolve();
      });

      await expect(syncManager.runSync()).resolves.not.toThrow();
      expect(uploadJsonToGWMock).toHaveBeenCalledTimes(1);
      expect(waitForTaskStub).toHaveBeenCalledTimes(1);
      expect(generateSignedFileStub).toHaveBeenCalledTimes(1);
      expect(ackStub).toHaveBeenCalledTimes(1);
      expect(notifyNifiOnCompleteStub).toHaveBeenCalledTimes(1);
      expect(rejectStub).toHaveBeenCalledTimes(0);
      expect(updateTilesCountStub).toHaveBeenCalledTimes(0);
      expect(uploadTilesStub).toHaveBeenCalledTimes(0);
      expect(ackStub).toHaveBeenCalledWith(taskWithTocData.jobId, taskWithTocData.id);
    });

    it('should not sign and upload file if its not exists', async function () {
      // mock
      const queueClient = container.resolve(QueueClient);
      const task = getTask();
      waitForTaskStub = jest.spyOn(queueClient.queueHandler, 'waitForTask').mockResolvedValue(task);
      isFileExistsStub.mockResolvedValueOnce(false);
      tilesGeneratorStub.mockReturnValue(tilesArray);
      // expectation;
      await expect(syncManager.runSync()).resolves.not.toThrow();
      expect(waitForTaskStub).toHaveBeenCalledTimes(1);
      expect(updateTilesCountStub).toHaveBeenCalledTimes(1);
      expect(generateSignedFileStub).toHaveBeenCalledTimes(0);
      expect(uploadTilesStub).toHaveBeenCalledTimes(0);
      expect(ackStub).toHaveBeenCalledTimes(1);
      expect(tilesGeneratorStub).toHaveBeenCalledTimes(1);
      expect(notifyNifiOnCompleteStub).toHaveBeenCalledTimes(1);
      expect(rejectStub).toHaveBeenCalledTimes(0);
      expect(ackStub).toHaveBeenCalledWith(task.jobId, task.id);
    });

    it('should reject task due max attempts', async function () {
      // mock
      const queueClient = container.resolve(QueueClient);
      const task = getTask();
      task.attempts = 6;
      waitForTaskStub = jest.spyOn(queueClient.queueHandler, 'waitForTask').mockResolvedValue(task);
      isFileExistsStub.mockResolvedValueOnce(true);
      isFileExistsStub.mockResolvedValue(true);

      // action
      const action = async () => {
        await syncManager.runSync();
      };
      // expectation;
      await expect(action()).resolves.not.toThrow();
      expect(waitForTaskStub).toHaveBeenCalledTimes(1);
      expect(updateTilesCountStub).toHaveBeenCalledTimes(0);
      expect(generateSignedFileStub).toHaveBeenCalledTimes(0);
      expect(uploadTilesStub).toHaveBeenCalledTimes(0);
      expect(ackStub).toHaveBeenCalledTimes(0);
      expect(tilesGeneratorStub).toHaveBeenCalledTimes(0);
      expect(notifyNifiOnCompleteStub).toHaveBeenCalledTimes(1);
      expect(rejectStub).toHaveBeenCalledTimes(1);
      expect(rejectStub).toHaveBeenCalledWith(task.jobId, task.id, false);
    });
  });
});
