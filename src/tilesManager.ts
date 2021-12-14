import { Readable } from 'stream';
import { Logger } from '@map-colonies/js-logger';
import { inject, singleton } from 'tsyringe';
import { GatewayClient } from './clients/services/gatewayClient';
import { Services } from './common/constants';
import { LayerSpecClient } from './clients/services/layerSpecClient';
import { ITilesConfig } from './common/interfaces';

@singleton()
export class TilesManager {
  public constructor(
    @inject(Services.LOGGER) private readonly logger: Logger,
    @inject(Services.TILES_CONFIG) private readonly tilesConfig: ITilesConfig,
    private readonly gatewayClient: GatewayClient,
    private readonly layerSpecClient: LayerSpecClient
  ) {}

  public async updateTilesCount(layerId: string, tilesCount: number, target: string): Promise<void> {
    try {
      this.logger.debug(`updating tiles count=${tilesCount}, for layerId=${layerId}, target=${target}`);
      await this.layerSpecClient.updateTilesCount(layerId, tilesCount, target);
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      this.logger.error(`tiles count=${tilesCount}, update failed for layerId=${layerId}, target=${target}, with error: ${error}`);
    }
  }

  public async uploadTile(tileRelativePath: string, data: Buffer | Readable): Promise<void> {
    try {
      await this.gatewayClient.uploadImageToGW(data, tileRelativePath);
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      this.logger.error(`upload failed for tile: ${tileRelativePath} with error: ${error}`);
      throw error;
    }
  }
}
