import { inject, singleton } from 'tsyringe';
import { Logger } from '@map-colonies/js-logger';
import { HttpClient, IHttpRetryConfig } from '@map-colonies/mc-utils';
import { IConfig } from '../../common/interfaces';
import { Services } from '../../common/constants';

interface ITilesCountUpdateRequest {
  tilesBatchCount: number;
}

@singleton()
export class LayerSpecClient extends HttpClient {
  public constructor(@inject(Services.LOGGER) logger: Logger, @inject(Services.CONFIG) private readonly config: IConfig) {
    super(logger, config.get<string>('layerSpecBaseUrl'), 'LayerSpecClient', config.get<IHttpRetryConfig>('httpRetry'));
  }

  public async updateTilesCount(layerId: string, tilesCount: number, target: string): Promise<void> {
    const updateRequest: ITilesCountUpdateRequest = {
      tilesBatchCount: tilesCount,
    };
    this.logger.info(`Updating ${tilesCount} tiles count layerId=${layerId}, target=${target}`);
    await this.put(`/tilesCount/${layerId}/${target}`, updateRequest);
  }
}
