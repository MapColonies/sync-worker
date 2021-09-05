import { Logger } from '@map-colonies/js-logger';
import { inject, singleton } from 'tsyringe';
import { GatewayClient } from './clients/services/gatewayClient';
import { Services } from './common/constants';
import { LayerSpecClient } from './clients/services/layerSpecClient';

interface ITile {
  x: number;
  y: number;
  zoom: number;
}

@singleton()
export class TilesManager {
  public constructor(
    @inject(Services.LOGGER) private readonly logger: Logger,
    private readonly gatewayClient: GatewayClient,
    private readonly layerSpecClient: LayerSpecClient
  ) {
    this.logger = logger;
  }

  public async updateTilesCount(layerId: string, tilesCount: number): Promise<void> {
    try {
      this.logger.debug(`updating tiles count for layerId=${layerId}`);
      await this.layerSpecClient.updateTilesCount(layerId, tilesCount);
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      this.logger.error(`tiles count update failed for layerId=${layerId} with error: ${error}`);
    }
  }

  public async uploadTile(tile: ITile, path: string): Promise<void> {
    try {
      await this.gatewayClient.upload(path);
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      this.logger.error(`upload failed for tile: ${tile.zoom}/${tile.x}/${tile.y} with error: ${error}`);
      throw error;
    }
  }
}
