import { Readable } from 'stream';
import { inject, singleton } from 'tsyringe';
import { Logger } from '@map-colonies/js-logger';
import { HttpClient, IHttpRetryConfig } from '@map-colonies/mc-utils';
import { AxiosBasicCredentials } from 'axios';
import { IGatewayAuthConfig, IConfig } from '../../common/interfaces';
import { Services } from '../../common/constants';

@singleton()
export class GatewayClient extends HttpClient {
  private readonly gatewayImageRouteId: string;
  private readonly gatewayJsonRouteId: string;
  private readonly gatewayAuthConfig: IGatewayAuthConfig;
  private readonly authOptions?: AxiosBasicCredentials;

  public constructor(@inject(Services.LOGGER) logger: Logger, @inject(Services.CONFIG) private readonly config: IConfig) {
    super(logger, config.get<string>('gateway.url'), 'GatewayClient', config.get<IHttpRetryConfig>('httpRetry'));
    this.gatewayImageRouteId = this.config.get<string>('gateway.imageRouteId');
    this.gatewayJsonRouteId = this.config.get<string>('gateway.jsonRouteId');
    this.gatewayAuthConfig = this.config.get<IGatewayAuthConfig>('gateway.auth');

    if (this.gatewayAuthConfig.enabled) {
      const { enabled, ...authOptions } = this.gatewayAuthConfig;
      this.authOptions = authOptions;
    }
  }

  public async uploadImageToGW(data: Buffer | Readable, filename: string): Promise<void> {
    return this.internalUploadFile(this.gatewayImageRouteId, data, filename);
  }

  public async uploadJsonToGW(buffer: Buffer, filename: string): Promise<void> {
    return this.internalUploadFile(this.gatewayJsonRouteId, buffer, filename);
  }

  private async internalUploadFile(routeId: string, data: Buffer | Readable, filename: string): Promise<void> {
    const addedHeaders = {
      'content-type': 'application/octet-stream',
    };
    const acceptableFilename = this.gwAcceptableFilename(filename);

    const queryParams = {
      filename: acceptableFilename,
      routeID: routeId,
      filesize: (data as Buffer).length || (data as Readable).readableLength,
    };
    await this.post('', data, queryParams, undefined, this.authOptions, addedHeaders);
  }

  private gwAcceptableFilename(filename: string): string {
    return filename.replace(/\//g, '~~');
  }
}
