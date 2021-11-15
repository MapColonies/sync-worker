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

  public async updateTilesCount(layerId: string, tilesCount: number): Promise<void> {
    try {
      this.logger.debug(`updating tiles count for layerId=${layerId}`);
      await this.layerSpecClient.updateTilesCount(layerId, tilesCount);
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      this.logger.error(`tiles count update failed for layerId=${layerId} with error: ${error}`);
    }
  }

  public async uploadTile(tileRelativePath: string, buffer: Buffer): Promise<void> {
    try {
      await this.gatewayClient.uploadImageToGW(buffer, tileRelativePath);
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      this.logger.error(`upload failed for tile: ${tileRelativePath} with error: ${error}`);
      throw error;
    }
  }
}
