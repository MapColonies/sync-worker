import { Logger } from '@map-colonies/js-logger';
import { inject, injectable } from 'tsyringe';
import { Services } from '../../common/constants';

const resourceInstance: ITilesCountResponse = {
  tilesCount: 5,
};

export interface ITilesCountResponse {
  tilesCount: number;
}

@injectable()
export class TilesManager {
  public constructor(@inject(Services.LOGGER) private readonly logger: Logger) {}
  public getTilesCount(): ITilesCountResponse {
    return resourceInstance;
  }
  public createResource(resource: ITilesCountResponse): ITilesCountResponse {
    return { ...resource };
  }
}
