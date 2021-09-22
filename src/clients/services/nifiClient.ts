import { inject, singleton } from 'tsyringe';
import { Logger } from '@map-colonies/js-logger';
import { HttpClient, IHttpRetryConfig } from '@map-colonies/mc-utils';
import { IConfig } from '../../common/interfaces';
import { Services } from '../../common/constants';

export interface OnSuccessUpdateRequest {
  layerId: string;
  jobId: string;
}

@singleton()
export class NifiClient extends HttpClient {
  public constructor(@inject(Services.LOGGER) logger: Logger, @inject(Services.CONFIG) private readonly config: IConfig) {
    super(logger, config.get<string>('nifiBaseUrl'), 'NifiClient', config.get<IHttpRetryConfig>('httpRetry'));
  }

  public async notifyNifiOnSuccess(jobId: string, layerId: string): Promise<void> {
    const body: OnSuccessUpdateRequest = {
      layerId: layerId,
      jobId: jobId,
    };
    this.logger.info(`Updating Nifi on succes for jobId=${jobId}, layerId=${layerId}`);
    await this.post(`/`, body);
  }
}
