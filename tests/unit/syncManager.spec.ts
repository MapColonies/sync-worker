import { promises as fsp } from 'fs';
import crypto from 'crypto';
import jsLogger from '@map-colonies/js-logger';
import config from 'config';
import * as tilesGenerator from '@map-colonies/mc-utils/dist/geo/tilesGenerator';
import { JobManagerClient } from '@map-colonies/mc-priority-queue';
import { SyncManager } from '../../src/syncManager';
import { task } from '../mocks/files/task';
import { QueueClient } from '../../src/clients/queueClient';
import { CryptoManager } from '../../src/cryptoManager';
import { Services } from '../../src/common/constants';
import { tilesGeneratorMock } from '../mocks/tilesGenerator/tilesGenratorMock';
import { IConfig, ICryptoConfig, ITilesConfig } from '../../src/common/interfaces';
import { TilesManager } from '../../src/tilesManager';
import { GatewayClient } from '../../src/clients/services/gatewayClient';
import { NifiClient } from '../../src/clients/services/nifiClient';
import { registerExternalValues } from '../ testContainerConfig';
import { mockTileGenerator } from '../mocks/generator';

let syncManager: SyncManager;
let appendFileStub: jest.SpyInstance;
let waitForTaskStub: jest.SpyInstance;
let uploadTilesStub: jest.SpyInstance;
let generateSingedFileStub: jest.SpyInstance;
let updateJobStub: jest.SpyInstance;
let updateTilesCountStub: jest.SpyInstance;
let ackStub: jest.SpyInstance;
let tilesGeneratorStub: jest.SpyInstance;

const container = registerExternalValues();
const cryptoManager = container.resolve(CryptoManager);
const tilesManager = container.resolve(TilesManager);
const gatewayClient = container.resolve(GatewayClient);
const queueClient = container.resolve(QueueClient);
const nifiClient = container.resolve(NifiClient);

const tilesConfig = config.get<ITilesConfig>('tiles');
const cryptoConfig = config.get<ICryptoConfig>('crypto');

describe('syncManager', () => {
  beforeAll(function () {
    jest.useFakeTimers();
    appendFileStub = jest.spyOn(fsp, 'appendFile').mockResolvedValue(undefined);
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

  beforeEach(function () {
    waitForTaskStub = jest.spyOn(queueClient.queueHandler, 'waitForTask').mockResolvedValue(task);
    generateSingedFileStub = jest.spyOn(cryptoManager, 'generateSingedFile').mockImplementation(async () => Promise.resolve());
    uploadTilesStub = jest.spyOn(tilesManager, 'uploadTile').mockImplementation(async () => Promise.resolve());
    updateTilesCountStub = jest.spyOn(tilesManager, 'updateTilesCount').mockImplementation(async () => Promise.resolve());
    updateJobStub = jest.spyOn(JobManagerClient.prototype, 'updateJob').mockImplementation(async () => Promise.resolve());
    ackStub = jest.spyOn(queueClient.queueHandler, 'ack').mockImplementation(async () => Promise.resolve());
    tilesGeneratorStub = jest.spyOn(tilesGenerator, 'tilesGenerator').mockReturnValue(mockTileGenerator);
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

      // action
      const action = async () => {
        await syncManager.runSync();
      };
      // expectation;
      await expect(action()).resolves.not.toThrow();
      expect(waitForTaskStub).toHaveBeenCalledTimes(1);
      expect(updateTilesCountStub).toHaveBeenCalledTimes(1);
      expect(generateSingedFileStub).toHaveBeenCalledTimes(1);
      expect(uploadTilesStub).toHaveBeenCalledTimes(1);
      expect(updateJobStub).toHaveBeenCalledTimes(1);
      expect(ackStub).toHaveBeenCalledTimes(1);
      expect(tilesGeneratorStub).toHaveBeenCalledTimes(1);
    });
  });
});
