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
import { GatewayClient } from './clients/services/gatewayClient';

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
  tocData?: Record<string, unknown>;
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
    private readonly nifiClient: NifiClient,
    private readonly gatewayClient: GatewayClient
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
          this.logger.info(`Running sync task for taskId: ${task.id}, on jobId=${task.jobId}, attempt: ${attempts}`);
          if (params.tocData) {
            const tocContentString = JSON.stringify(params.tocData);
            this.logger.info(`sign and upload toc data ${tocContentString}`);
            const tocContentBuffer = Buffer.from(tocContentString);
            await this.signAndUploadJson(`${layerRelativePath}/toc.json`, tocContentBuffer);
            await this.queueClient.queueHandler.ack(jobId, taskId);
            await this.nifiClient.notifyNifiOnComplete(jobId, layerId);
          } else {
            this.logger.info(`sign and upload tiles`);
            const generator = tilesGenerator(batch);
            let batchArray = [];
            let uploadedTiles = 0;

            for (const tile of generator) {
              const tileRelativePath = `${layerRelativePath}/${tile.zoom}/${tile.x}/${tile.y}.${this.tilesConfig.format}`;
              const fullPath = path.join(this.tilesConfig.path, tileRelativePath);

              if (await isFileExists(fullPath)) {
                batchArray.push(this.signAndUpload(fullPath, tileRelativePath));
              }

              if (batchArray.length === this.tilesConfig.uploadBatchSize) {
                await Promise.all(batchArray);
                uploadedTiles += batchArray.length;
                batchArray = [];
              }
            }
            // resolved left overs
            await Promise.all(batchArray);
            uploadedTiles += batchArray.length;

            await this.tilesManager.updateTilesCount(layerId, uploadedTiles);
            try {
              await this.queueClient.queueHandler.ack(jobId, taskId);
            } catch (error) {
              // reduce the number of the tiles if ack fails
              await this.tilesManager.updateTilesCount(layerId, -uploadedTiles);
              throw error;
            }
            await this.nifiClient.notifyNifiOnComplete(jobId, layerId);
          }
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
      fileBuffer = this.cryptoManager.generateSignedFile(fullPath, fileBuffer);
    }
    await this.tilesManager.uploadTile(tileRelativePath, fileBuffer);
  }

  private async signAndUploadJson(fileName: string, buffer: Buffer): Promise<void> {
    if (this.tilesConfig.sigIsNeeded) {
      buffer = this.cryptoManager.generateSignedFile(fileName, buffer);
    }
    await this.gatewayClient.uploadJsonToGW(buffer, fileName);
  }
}
