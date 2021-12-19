import path from 'path';
import { Logger } from '@map-colonies/js-logger';
import { inject, singleton } from 'tsyringe';
import { tilesGenerator } from '@map-colonies/mc-utils/dist/geo/tilesGenerator';
import { QueueClient } from './clients/queueClient';
import { Services } from './common/constants';
import { IConfig, ITilesConfig } from './common/interfaces';
import { CryptoManager } from './cryptoManager';
import { TilesManager } from './tilesManager';
import { NifiClient } from './clients/services/nifiClient';
import { GatewayClient } from './clients/services/gatewayClient';
import { IStorageProvider } from './providers/iStorageProvider';

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
  target: string;
  tocData?: Record<string, unknown>;
}

@singleton()
export class SyncManager {
  private readonly syncAttempts: number;
  private readonly useStreams: boolean;

  public constructor(
    @inject(Services.LOGGER) private readonly logger: Logger,
    @inject(Services.CONFIG) private readonly config: IConfig,
    @inject(Services.TILES_CONFIG) private readonly tilesConfig: ITilesConfig,
    @inject(Services.STORAGE_PROVIDER) private readonly storageProvider: IStorageProvider,
    private readonly queueClient: QueueClient,
    private readonly tilesManager: TilesManager,
    private readonly cryptoManager: CryptoManager,
    private readonly nifiClient: NifiClient,
    private readonly gatewayClient: GatewayClient
  ) {
    this.syncAttempts = this.config.get<number>('syncAttempts');
    this.useStreams = this.config.get<boolean>('useStreams');
  }

  public async runSync(): Promise<boolean> {
    const tocTaskProcessed = await this.handleTocTask();
    const tilesTaskProcessed = await this.handleTilesTask();
    return tocTaskProcessed || tilesTaskProcessed;
  }

  public async handleTilesTask(): Promise<boolean> {
    const tilesTask = await this.queueClient.queueHandlerForTileTasks.dequeue();
    if (tilesTask) {
      const params = tilesTask.parameters as IParameters;
      const jobId = tilesTask.jobId;
      const taskId = tilesTask.id;
      const batch = params.batch;
      const target = params.target;
      const attempts = tilesTask.attempts;
      const layerId = `${params.resourceId}-${params.resourceVersion}`;
      const layerRelativePath = params.layerRelativePath;

      if (attempts <= this.syncAttempts) {
        try {
          this.logger.info(`Running sync tiles task for taskId: ${tilesTask.id}, on jobId=${tilesTask.jobId}, attempt: ${attempts}`);
          const generator = tilesGenerator(batch);
          let batchArray = [];
          let uploadedTiles = 0;

          for (const tile of generator) {
            const tileRelativePath = `${layerRelativePath}/${tile.zoom}/${tile.x}/${tile.y}.${this.tilesConfig.format}`;
            const fullPath = path.join(this.tilesConfig.path, tileRelativePath);

            if (await this.storageProvider.exist(fullPath)) {
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

          await this.tilesManager.updateTilesCount(layerId, uploadedTiles, target);
          try {
            await this.queueClient.queueHandlerForTileTasks.ack(jobId, taskId);
          } catch (error) {
            this.logger.info(`reduce the number of the tiles as ack failed`);
            // reduce the number of the tiles if ack fails
            await this.tilesManager.updateTilesCount(layerId, -uploadedTiles, target);
            throw error;
          }
          await this.nifiClient.notifyNifiOnComplete(jobId, layerId);
        } catch (error) {
          this.logger.error(`failed to handle tiles task ${(error as Error).message}`);
          await this.queueClient.queueHandlerForTileTasks.reject(jobId, taskId, true, (error as Error).message);
          await this.nifiClient.notifyNifiOnComplete(jobId, layerId);
        }
      } else {
        this.logger.error(`failed to handle tiles task - max syncAttempts reached: ${this.syncAttempts}`);
        await this.queueClient.queueHandlerForTileTasks.reject(jobId, taskId, false);
        await this.nifiClient.notifyNifiOnComplete(jobId, layerId);
      }
    }
    return Boolean(tilesTask);
  }

  public async handleTocTask(): Promise<boolean> {
    const tocTask = await this.queueClient.queueHandlerForTocTasks.dequeue();
    if (tocTask) {
      const params = tocTask.parameters as IParameters;
      const jobId = tocTask.jobId;
      const taskId = tocTask.id;
      const attempts = tocTask.attempts;
      const layerId = `${params.resourceId}-${params.resourceVersion}`;
      const layerRelativePath = params.layerRelativePath;

      if (attempts <= this.syncAttempts) {
        try {
          this.logger.info(`Running sync TOC task for taskId: ${tocTask.id}, on jobId=${tocTask.jobId}, attempt: ${attempts}`);
          const tocContentString = JSON.stringify(params.tocData);
          this.logger.info(`sign and upload toc data ${tocContentString}`);
          const tocContentBuffer = Buffer.from(tocContentString);
          await this.signAndUploadJson(`${layerRelativePath}/toc.json`, tocContentBuffer);
          await this.queueClient.queueHandlerForTocTasks.ack(jobId, taskId);
          await this.nifiClient.notifyNifiOnComplete(jobId, layerId);
        } catch (error) {
          await this.queueClient.queueHandlerForTocTasks.reject(jobId, taskId, true, (error as Error).message);
          await this.nifiClient.notifyNifiOnComplete(jobId, layerId);
        }
      } else {
        await this.queueClient.queueHandlerForTocTasks.reject(jobId, taskId, false);
        await this.nifiClient.notifyNifiOnComplete(jobId, layerId);
      }
    }
    return Boolean(tocTask);
  }

  private async signAndUpload(fullPath: string, tileRelativePath: string): Promise<void> {
    if (this.useStreams) {
      let stream = this.storageProvider.getFileStream(fullPath);
      if (this.tilesConfig.sigIsNeeded) {
        stream = this.cryptoManager.signStream(fullPath, stream);
      }
      await this.tilesManager.uploadTile(tileRelativePath, stream);
    } else {
      let fileBuffer = await this.storageProvider.readFile(fullPath);
      if (this.tilesConfig.sigIsNeeded) {
        fileBuffer = this.cryptoManager.signBuffer(fullPath, fileBuffer);
      }
      await this.tilesManager.uploadTile(tileRelativePath, fileBuffer);
    }
  }

  private async signAndUploadJson(fileName: string, buffer: Buffer): Promise<void> {
    if (this.tilesConfig.sigIsNeeded) {
      buffer = this.cryptoManager.signBuffer(fileName, buffer);
    }
    await this.gatewayClient.uploadJsonToGW(buffer, fileName);
  }
}
