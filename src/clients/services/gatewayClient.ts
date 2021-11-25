import { Readable } from 'stream';
import { inject, singleton } from 'tsyringe';
import { Logger } from '@map-colonies/js-logger';
import { HttpClient, IHttpRetryConfig } from '@map-colonies/mc-utils';
import { IConfig } from '../../common/interfaces';
import { Services } from '../../common/constants';

@singleton()
export class GatewayClient extends HttpClient {
  public gatewayImageRouteId: string;
  public gatewayJsonRouteId: string;

  public constructor(@inject(Services.LOGGER) logger: Logger, @inject(Services.CONFIG) private readonly config: IConfig) {
    super(logger, config.get<string>('gateway.url'), 'GatewayClient', config.get<IHttpRetryConfig>('httpRetry'));
    this.gatewayImageRouteId = this.config.get<string>('gateway.imageRouteId');
    this.gatewayJsonRouteId = this.config.get<string>('gateway.jsonRouteId');
  }

  public async uploadImageToGW(data: Buffer | Readable, filename: string): Promise<void> {
    return this.internalUploadFile(this.gatewayImageRouteId, data, filename);
  }

  public async uploadJsonToGW(buffer: Buffer, filename: string): Promise<void> {
    return this.internalUploadFile(this.gatewayJsonRouteId, buffer, filename);
  }

  private async internalUploadFile(routeId: string, data: Buffer | Readable, filename: string): Promise<void> {
    this.axiosOptions.headers = {
      'content-type': 'application/octet-stream',
    };
    const queryParams = {
      filename: encodeURIComponent(filename),
      routeId: routeId,
    };
    await this.post('/', data, queryParams);
  }
}
