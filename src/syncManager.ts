import { Logger } from '@map-colonies/js-logger';
import { inject, singleton } from 'tsyringe';
import { QueueClient } from './clients/queueClient';
import { Services } from './common/constants';
import { ICryptoConfig, IQueueConfig, ITilesConfig } from './common/interfaces';
import { CryptoManager } from './cryptoManager';

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
  public constructor(
    @inject(Services.LOGGER) private readonly logger: Logger,
    @inject(Services.QUEUE_CONFIG) private readonly queueConfig: IQueueConfig,
    @inject(Services.TILES_CONFIG) private readonly tilesConfig: ITilesConfig,
    @inject(Services.CRYPTO_CONFIG) private readonly cryptoConfig: ICryptoConfig,
    private readonly queueClient: QueueClient,
    private readonly cryptoManager: CryptoManager
  ) {
    this.logger = logger;
  }

  public async sync(): Promise<void> {
    try {
      //const task = await this.queueClient.queueHandler.waitForTask();
      // const params = task?.parameters as IParameters;
      // const batch = params.batch;
      const batch: ITileRange[] = [
        {
          minX: 0,
          minY: 0,
          maxX: 8,
          maxY: 4,
          zoom: 2,
        },
      ];
      this.logger.debug(`tiles signature is set to: ${this.tilesConfig.sigIsNeeded.toString()}`);
      for (const tile of this.tilesGenerator(batch)) {
        const path = `${this.tilesConfig.path}/${tile.zoom}/${tile.x}/${tile.y}.${this.tilesConfig.format}`;
        if (this.tilesConfig.sigIsNeeded) {
          await this.cryptoManager.generateSingedFile(this.cryptoConfig.pem, path);
        }
        // TODO: UPLOAD THE TILE TO THE GATEWAY.
        // this.logger.debug(`uploading tile: ${tile.zoom}/${tile.x}/${tile.y}`)
        // this.upload(tile);
      }
    } catch (error) {
      console.log(error);
    }
  }

  private *tilesGenerator(rangeGen: Iterable<ITileRange>): Generator<ITile> {
    for (const range of rangeGen) {
      for (let x = range.minX; x < range.maxX; x++) {
        for (let y = range.minY; y < range.maxY; y++) {
          yield {
            x,
            y,
            zoom: range.zoom,
          };
        }
      }
    }
  }
}
