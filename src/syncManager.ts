import { promises as fsp } from 'fs';
import crypto from 'crypto';
import { Logger } from '@map-colonies/js-logger';
import { inject, singleton } from 'tsyringe';
import { PgClient } from './clients/pgClient';
import { QueueClient } from './clients/queueClient';
import { Services } from './common/constants';
import { ICryptoConfig, IQueueConfig } from './common/interfaces';
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
    @inject(Services.CRYPTO_CONFIG) private readonly cryptoConfig: ICryptoConfig,
    private readonly queueClient: QueueClient,
    private readonly cryptoManager: CryptoManager
  ) {
    this.logger = logger;
  }

  public async sync(): Promise<void> {
    try {
      const task = await this.queueClient.queueHandler.waitForTask();
      const params = task?.parameters as IParameters;
      const batch = params.batch;
      for (const tile of this.tilesGenerator(batch)) {
        const path = `/home/shlomiko/Desktop/bluemarble_4km/${tile.zoom}/${tile.x}/${tile.y}.png`;
        const tileBuffer = await this.cryptoManager.generateSingedFile(this.cryptoConfig.pem, path);
        console.log(tileBuffer);

        // if (tileBuffer) {
        //   await this.sign(tileBuffer, path);
        // }
        // this.upload(tile);
      }
    } catch (error) {
      console.log(error);
    }
  }

  //   private async getTile(path: string): Promise<Buffer | undefined> {
  //     try {
  //       const file = await fsp.readFile(path);
  //       return file;
  //     } catch (error) {
  //       this.logger.debug(`Failed to get tile: ${(error as Error).message}`);
  //     }
  //   }

  //   private async sign(buffer: Buffer, path: string): Promise<void> {
  //     const key = await fsp.readFile(this.cryptoConfig.pem, { encoding: this.cryptoConfig.readFileEncoding });

  //     const signer = crypto.createSign(this.cryptoConfig.algoritm);
  //     signer.update(buffer);
  //     const signature = signer.sign(key, this.cryptoConfig.signEncoding);
  //     await fsp.writeFile(path, signature);
  //   }

  //   private upload(tile: ITile): void {
  //     console.log('uploaded');
  //   }

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
