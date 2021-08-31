import config from 'config';
import { logMethod } from '@map-colonies/telemetry';
import { trace } from '@opentelemetry/api';
import { DependencyContainer } from 'tsyringe/dist/typings/types';
import jsLogger, { LoggerOptions } from '@map-colonies/js-logger';
import { Metrics } from '@map-colonies/telemetry';
import { Services } from './common/constants';
import { tracing } from './common/tracing';
import { tilesRouterFactory, TILES_ROUTER_SYMBOL } from './tiles/routes/tilesRouter';
import { InjectionObject, registerDependencies } from './common/dependencyRegistration';
import { ICryptoConfig, IDBConfig, IQueueConfig, ITilesConfig } from './common/interfaces';

export interface RegisterOptions {
  override?: InjectionObject<unknown>[];
  useChild?: boolean;
}

export const registerExternalValues = (options?: RegisterOptions): DependencyContainer => {
  const loggerConfig = config.get<LoggerOptions>('telemetry.logger');
  // @ts-expect-error the signature is wrong
  const logger = jsLogger({ ...loggerConfig, prettyPrint: loggerConfig.prettyPrint, hooks: { logMethod } });
  const queueConfig = config.get<IQueueConfig>('queue');
  const tilesConfig = config.get<ITilesConfig>('tiles');
  const cryptoConfig = config.get<ICryptoConfig>('crypto');
  const dbConfig = config.get<IDBConfig>('db');
  const metrics = new Metrics('app');
  const meter = metrics.start();

  tracing.start();
  const tracer = trace.getTracer('app');

  const dependencies: InjectionObject<unknown>[] = [
    { token: Services.CONFIG, provider: { useValue: config } },
    { token: Services.LOGGER, provider: { useValue: logger } },
    { token: Services.DB_CONFIG, provider: { useValue: dbConfig } },
    { token: Services.QUEUE_CONFIG, provider: { useValue: queueConfig } },
    { token: Services.TILES_CONFIG, provider: { useValue: tilesConfig } },
    { token: Services.CRYPTO_CONFIG, provider: { useValue: cryptoConfig } },
    { token: Services.TRACER, provider: { useValue: tracer } },
    { token: Services.METER, provider: { useValue: meter } },
    { token: TILES_ROUTER_SYMBOL, provider: { useFactory: tilesRouterFactory } },
    {
      token: 'onSignal',
      provider: {
        useValue: {
          useValue: async (): Promise<void> => {
            await Promise.all([tracing.stop(), metrics.stop()]);
          },
        },
      },
    },
  ];

  return registerDependencies(dependencies, options?.override, options?.useChild);
};
