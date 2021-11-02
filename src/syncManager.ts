import path from 'path';
import { promises as fsp } from 'fs';
import { IConfig } from 'config';
import { Logger } from '@map-colonies/js-logger';
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

interface IParameters {
  batch: ITileRange[];
  resourceId: string;
  resourceVersion: string;
  layerRelativePath: string;
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
      const layerId = `${params.resourceId}-${params.resourceVersion}`;
      const layerRelativePath = params.layerRelativePath;

      if (attempts <= this.syncAttempts) {
        try {
          this.logger.info(`Running sync task for taskId: ${task.id}, on jobId=${task.jobId}`);
          const generator = tilesGenerator(batch);
          let batchArray = [];

          for (const tile of generator) {
            const tileRelativePath = `${layerRelativePath}/${tile.zoom}/${tile.x}/${tile.y}.${this.tilesConfig.format}`;
            const fullPath = path.join(this.tilesConfig.path, tileRelativePath);

            if (await isFileExists(fullPath)) {
              batchArray.push(this.signAndUpload(fullPath, tileRelativePath));
            }

            if (batchArray.length === this.tilesConfig.uploadBatchSize) {
              await Promise.all(batchArray);
              await this.tilesManager.updateTilesCount(layerId, batchArray.length);
              batchArray = [];
            }
          }
          // resolved left overs
          await Promise.all(batchArray);

          await this.tilesManager.updateTilesCount(layerId, batchArray.length);

          await this.queueClient.queueHandler.ack(jobId, taskId);
          await this.nifiClient.notifyNifiOnComplete(jobId, layerId);
        } catch (error) {
          await this.queueClient.queueHandler.reject(jobId, taskId, true, (error as Error).message);
          await this.nifiClient.notifyNifiOnComplete(jobId, layerId);
        }
      } else {
        await this.queueClient.queueHandler.reject(jobId, taskId, false);
        await this.nifiClient.notifyNifiOnComplete(jobId, layerId);
      }
    }
  }

  private async signAndUpload(fullPath: string, tileRelativePath: string): Promise<void> {
    let fileBuffer = await fsp.readFile(fullPath);
    if (this.tilesConfig.sigIsNeeded) {
      fileBuffer = await this.cryptoManager.generateSignedFile(fullPath, fileBuffer);
    }
    await this.tilesManager.uploadTile(tileRelativePath, fileBuffer);
  }
}
