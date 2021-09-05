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
    super(logger, '', 'layer-spec', config.get<IHttpRetryConfig>('httpRetry'));
    this.axiosOptions.baseURL = config.get<string>('layerSpecBaseUrl');
  }

  public async updateTilesCount(layerId: string, tilesCount: number): Promise<void> {
    const updateRequest: ITilesCountUpdateRequest = {
      tilesBatchCount: tilesCount,
    };
    await this.put(`/tilesCount/${layerId}`, updateRequest);
  }
}
