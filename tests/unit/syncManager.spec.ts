import jsLogger from '@map-colonies/js-logger';
import * as tilesGenerator from '@map-colonies/mc-utils/dist/geo/tilesGenerator';
import { IUpdateJobRequestPayload, TaskStatus } from '@map-colonies/mc-priority-queue';
import config from 'config';
import { JobManagerClient } from '@map-colonies/mc-priority-queue';
import { SyncManager } from '../../src/syncManager';
import { task } from '../mocks/files/task';
import { QueueClient } from '../../src/clients/queueClient';
import { CryptoManager } from '../../src/cryptoManager';
import { ICryptoConfig, ITilesConfig } from '../../src/common/interfaces';
import { TilesManager } from '../../src/tilesManager';
import { NifiClient } from '../../src/clients/services/nifiClient';
import { registerExternalValues } from '../ testContainerConfig';
import * as utils from '../../src/common/utils';

let syncManager: SyncManager;
let waitForTaskStub: jest.SpyInstance;
let uploadTilesStub: jest.SpyInstance;
let generateSignedFileStub: jest.SpyInstance;
let updateJobStub: jest.SpyInstance;
let updateTilesCountStub: jest.SpyInstance;
let ackStub: jest.SpyInstance;
let rejectStub: jest.SpyInstance;
let tilesGeneratorStub: jest.SpyInstance;
let notifyNifiOnSuccessStub: jest.SpyInstance;
let isFileExistsStub: jest.SpyInstance;

const container = registerExternalValues();
const cryptoManager = container.resolve(CryptoManager);
const tilesManager = container.resolve(TilesManager);
const queueClient = container.resolve(QueueClient);
const nifiClient = container.resolve(NifiClient);

const tilesConfig = config.get<ITilesConfig>('tiles');
const cryptoConfig = config.get<ICryptoConfig>('crypto');

const tilesArray = [{ zoom: 0, x: 0, y: 1 }];

describe('syncManager', () => {
  beforeAll(function () {
    jest.useFakeTimers();
    syncManager = new SyncManager(
      jsLogger({ enabled: false }),
      config,
      tilesConfig,
      cryptoConfig,
      queueClient,
      tilesManager,
      cryptoManager,
      nifiClient
    );
  });

  beforeEach(() => {
    waitForTaskStub = jest.spyOn(queueClient.queueHandler, 'waitForTask').mockResolvedValue(task);
    generateSignedFileStub = jest.spyOn(cryptoManager, 'generateSignedFile').mockImplementationOnce(async () => Promise.resolve());
    uploadTilesStub = jest.spyOn(tilesManager, 'uploadTile').mockImplementation(async () => Promise.resolve());
    updateTilesCountStub = jest.spyOn(tilesManager, 'updateTilesCount').mockImplementation(async () => Promise.resolve());
    updateJobStub = jest.spyOn(JobManagerClient.prototype, 'updateJob').mockImplementation(async () => Promise.resolve());
    ackStub = jest.spyOn(queueClient.queueHandler, 'ack').mockImplementation(async () => Promise.resolve());
    rejectStub = jest.spyOn(queueClient.queueHandler, 'reject').mockImplementation(async () => Promise.resolve());
    tilesGeneratorStub = jest.spyOn(tilesGenerator, 'tilesGenerator');
    notifyNifiOnSuccessStub = jest.spyOn(nifiClient, 'notifyNifiOnSuccess').mockImplementation(async () => Promise.resolve());
    isFileExistsStub = jest.spyOn(utils, 'isFileExists');
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
      const jobUpdatePayload: IUpdateJobRequestPayload = {
        status: TaskStatus.COMPLETED,
        reason: undefined,
      };

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

      updateJobStub.mockImplementation(async () => {
        if (ackStub.mock.calls.length !== 1) {
          throw new Error('invalid call order: ack should be called before updateJob');
        }
        return Promise.resolve();
      });

      notifyNifiOnSuccessStub.mockImplementation(async () => {
        if (updateJobStub.mock.calls.length !== 1) {
          throw new Error('invalid call order: updateJob should be called before notifyNifiOnSuccess');
        }
        return Promise.resolve();
      });

      // action
      const action = async () => {
        await syncManager.runSync();
      };
      // expectation;
      await expect(action()).resolves.not.toThrow();
      expect(waitForTaskStub).toHaveBeenCalledTimes(1);
      expect(updateTilesCountStub).toHaveBeenCalledTimes(1);
      expect(generateSignedFileStub).toHaveBeenCalledTimes(1);
      expect(uploadTilesStub).toHaveBeenCalledTimes(1);
      expect(updateJobStub).toHaveBeenCalledTimes(1);
      expect(ackStub).toHaveBeenCalledTimes(1);
      expect(tilesGeneratorStub).toHaveBeenCalledTimes(1);
      expect(notifyNifiOnSuccessStub).toHaveBeenCalledTimes(1);
      expect(rejectStub).toHaveBeenCalledTimes(0);
      expect(ackStub).toHaveBeenCalledWith(task.jobId, task.id);
      expect(updateJobStub).toHaveBeenCalledWith(task.jobId, jobUpdatePayload);
    });

    it('should not sign and upload file if its not exists', async function () {
      // mock
      isFileExistsStub.mockResolvedValueOnce(false);
      const jobUpdatePayload: IUpdateJobRequestPayload = {
        status: TaskStatus.COMPLETED,
        reason: undefined,
      };
      tilesGeneratorStub.mockReturnValue(tilesArray);
      isFileExistsStub.mockResolvedValueOnce(false);
      // action
      const action = async () => {
        await syncManager.runSync();
      };
      // expectation;
      await expect(action()).resolves.not.toThrow();
      expect(waitForTaskStub).toHaveBeenCalledTimes(1);
      expect(updateTilesCountStub).toHaveBeenCalledTimes(1);
      expect(generateSignedFileStub).toHaveBeenCalledTimes(0);
      expect(uploadTilesStub).toHaveBeenCalledTimes(0);
      expect(updateJobStub).toHaveBeenCalledTimes(1);
      expect(ackStub).toHaveBeenCalledTimes(1);
      expect(tilesGeneratorStub).toHaveBeenCalledTimes(1);
      expect(notifyNifiOnSuccessStub).toHaveBeenCalledTimes(1);
      expect(rejectStub).toHaveBeenCalledTimes(0);
      expect(ackStub).toHaveBeenCalledWith(task.jobId, task.id);
      expect(updateJobStub).toHaveBeenCalledWith(task.jobId, jobUpdatePayload);
    });

    it('should reject task due max attempts', async function () {
      // mock
      isFileExistsStub.mockResolvedValueOnce(true);
      const jobUpdatePayload: IUpdateJobRequestPayload = {
        status: TaskStatus.FAILED,
        reason: undefined,
      };
      task.attempts = 6;
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
      expect(updateJobStub).toHaveBeenCalledTimes(1);
      expect(ackStub).toHaveBeenCalledTimes(0);
      expect(tilesGeneratorStub).toHaveBeenCalledTimes(0);
      expect(notifyNifiOnSuccessStub).toHaveBeenCalledTimes(0);
      expect(rejectStub).toHaveBeenCalledTimes(1);
      expect(updateJobStub).toHaveBeenCalledWith(task.jobId, jobUpdatePayload);
      expect(rejectStub).toHaveBeenCalledWith(task.jobId, task.id, false);
    });
  });
});
