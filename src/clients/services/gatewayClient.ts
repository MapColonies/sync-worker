import fs from 'fs';
import { inject, singleton } from 'tsyringe';
import FormData from 'form-data';
import { Logger } from '@map-colonies/js-logger';
import { HttpClient, IHttpRetryConfig } from '@map-colonies/mc-utils';
import { IConfig } from '../../common/interfaces';
import { Services } from '../../common/constants';

@singleton()
export class GatewayClient extends HttpClient {
  public constructor(@inject(Services.LOGGER) logger: Logger, @inject(Services.CONFIG) private readonly config: IConfig) {
    super(logger, config.get<string>('gateway.url'), 'upload', config.get<IHttpRetryConfig>('httpRetry'));
  }

  public async upload(filePath: string): Promise<void> {
    const formData = new FormData();
    formData.append('photo', fs.createReadStream(filePath));
    this.axiosOptions.headers = formData.getHeaders();
    await this.post(this.axiosOptions.baseURL as string, formData);
  }
}
