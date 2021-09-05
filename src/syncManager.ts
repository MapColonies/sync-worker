import { IConfig } from 'config';
import { Logger } from '@map-colonies/js-logger';
import { IUpdateJobRequestPayload, TaskStatus } from '@map-colonies/mc-priority-queue';
import { inject, singleton } from 'tsyringe';
import { tilesGenerator } from '@map-colonies/mc-utils/dist/geo/tilesGenerator';
import { QueueClient } from './clients/queueClient';
import { Services } from './common/constants';
import { ICryptoConfig, ITilesConfig } from './common/interfaces';
import { CryptoManager } from './cryptoManager';
import { TilesManager } from './tilesManager';
import { isFileExists } from './common/utils';
import { NifiClient } from './clients/services/nifiClient';

interface ITileRange {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  zoom: number;
}

interface ITile {
  x: number;
  y: number;
  zoom: number;
}

interface IParameters {
  batch: ITileRange[];
  resourceId: string;
  resourceVersion: string;
}

@singleton()
export class SyncManager {
  private readonly syncAttempts: number;
  public constructor(
    @inject(Services.LOGGER) private readonly logger: Logger,
    @inject(Services.CONFIG) private readonly config: IConfig,
    @inject(Services.TILES_CONFIG) private readonly tilesConfig: ITilesConfig,
    @inject(Services.CRYPTO_CONFIG) private readonly cryptoConfig: ICryptoConfig,
    private readonly queueClient: QueueClient,
    private readonly tilesManager: TilesManager,
    private readonly cryptoManager: CryptoManager,
    private readonly nifiClient: NifiClient
  ) {
    this.logger = logger;
    this.syncAttempts = this.config.get<number>('syncAttempts');
  }

  public async runSync(): Promise<void> {
    const task = await this.queueClient.queueHandler.waitForTask();
    if (task) {
      const params = task.parameters as IParameters;
      const jobId = task.jobId;
      const taskId = task.id;
      const batch = params.batch;
      const attempts = task.attempts;
      //const layerId = `${params.resourceId}-${params.resourceVersion}`;
      const layerId = 'bluemarble_4km';

      if (attempts <= this.syncAttempts) {
        try {
          this.logger.debug(`tiles signature is set to: ${this.tilesConfig.sigIsNeeded.toString()}`);
          const generator = tilesGenerator(batch);
          let batchArray = [];

          for (const tile of generator) {
            const path = `${this.tilesConfig.path}/${layerId}/${tile.zoom}/${tile.x}/${tile.y}.${this.tilesConfig.format}`;
            if (await isFileExists(path)) {
              batchArray.push(this.signAndUpload(tile, path));
            }
            if (batchArray.length === this.tilesConfig.uploadBatchSize) {
              await Promise.all(batchArray);
              await this.tilesManager.updateTilesCount(layerId, batchArray.length);
              batchArray = [];
            }
            // resolved left overs
            await Promise.all(batchArray);
          }
          console.log(batchArray.length);

          await this.tilesManager.updateTilesCount(layerId, batchArray.length);

          await this.queueClient.queueHandler.ack(jobId, taskId);
          await this.finishJob(jobId, layerId);
        } catch (error) {
          await this.queueClient.queueHandler.reject(jobId, taskId, true, (error as Error).message);
        }
      } else {
        await this.queueClient.queueHandler.reject(jobId, taskId, false);
        await this.finishJob(jobId, layerId, false);
      }
    }
  }

  private async signAndUpload(tile: ITile, path: string): Promise<void> {
    if (this.tilesConfig.sigIsNeeded) {
      await this.cryptoManager.generateSingedFile(this.cryptoConfig.pem, path);
    }
    await this.tilesManager.uploadTile(tile, path);
    return;
  }

  private async finishJob(jobId: string, layerId: string, isSuccess = true, errorReason: string | undefined = undefined): Promise<void> {
    this.logger.info(`Update Job status to success=${String(isSuccess)} jobId=${jobId}`);
    const joUpdatePayload: IUpdateJobRequestPayload = {
      status: isSuccess ? TaskStatus.COMPLETED : TaskStatus.FAILED,
      reason: errorReason,
    };
    await this.queueClient.queueHandler.jobManagerClient.updateJob(jobId, joUpdatePayload);
    if (isSuccess) {
      this.logger.info(`Update Nifi on success for jobId=${jobId}, layerId=${layerId}`);
      //await this.nifiClient.notifyNifiOnSuccess(jobId, layerId);
    }
  }
}
