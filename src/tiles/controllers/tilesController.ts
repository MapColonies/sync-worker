import { Logger } from '@map-colonies/js-logger';
import { Meter } from '@map-colonies/telemetry';
import { BoundCounter } from '@opentelemetry/api-metrics';
import { RequestHandler } from 'express';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import { Services } from '../../common/constants';

import { ITilesCountResponse, TilesManager } from '../models/tilesManager';

type UpdateTilesCountHandler = RequestHandler<undefined, ITilesCountResponse, ITilesCountResponse>;
type GetTilesCountHandler = RequestHandler<undefined, ITilesCountResponse>;

@injectable()
export class TilesController {
  private readonly createdResourceCounter: BoundCounter;

  public constructor(
    @inject(Services.LOGGER) private readonly logger: Logger,
    @inject(TilesManager) private readonly manager: TilesManager,
    @inject(Services.METER) private readonly meter: Meter
  ) {
    this.createdResourceCounter = meter.createCounter('created_resource');
  }

  public getTilesCount: GetTilesCountHandler = (req, res) => {
    return res.status(httpStatus.OK).json(this.manager.getTilesCount());
  };

  public updateTilesCount: UpdateTilesCountHandler = (req, res) => {
    const createdResource = this.manager.createResource(req.body);
    this.createdResourceCounter.add(1);
    return res.status(httpStatus.CREATED).json(createdResource);
  };
}
