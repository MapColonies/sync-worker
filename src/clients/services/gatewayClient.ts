import { inject, singleton } from 'tsyringe';
import { Logger } from '@map-colonies/js-logger';
import { HttpClient, IHttpRetryConfig } from '@map-colonies/mc-utils';
import { IConfig } from '../../common/interfaces';
import { Services } from '../../common/constants';

@singleton()
export class GatewayClient extends HttpClient {
  public constructor(@inject(Services.LOGGER) logger: Logger, @inject(Services.CONFIG) private readonly config: IConfig) {
    super(logger, config.get<string>('gateway.url'), 'GatewayClient', config.get<IHttpRetryConfig>('httpRetry'));
  }

  public async uploadBin(buffer: Buffer, filename: string): Promise<void> {
    const routeId = this.config.get<string>('gateway.routeId');
    this.axiosOptions.headers = {
      'content-type': 'application/octet-stream',
    };
    const queryParams = {
      filename: encodeURIComponent(filename),
      routeId: routeId,
    };
    await this.post('/', buffer, queryParams);
  }
}
