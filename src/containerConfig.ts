import config from 'config';
import { logMethod } from '@map-colonies/telemetry';
import { trace } from '@opentelemetry/api';
import { DependencyContainer } from 'tsyringe/dist/typings/types';
import jsLogger, { LoggerOptions } from '@map-colonies/js-logger';
import { Metrics } from '@map-colonies/telemetry';
import { Services } from './common/constants';
import { tracing } from './common/tracing';
import { InjectionObject, registerDependencies } from './common/dependencyRegistration';
import { ICryptoConfig, IGatewayConfig, IQueueConfig, ITilesConfig } from './common/interfaces';
import { getProviders } from './providers/providerManager';

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
  const gatewayConfig = config.get<IGatewayConfig>('gateway');
  const cryptoConfig = config.get<ICryptoConfig>('crypto');
  const metrics = new Metrics('app');
  const meter = metrics.start();

  tracing.start();
  const tracer = trace.getTracer('app');

  const dependencies: InjectionObject<unknown>[] = [
    { token: Services.CONFIG, provider: { useValue: config } },
    { token: Services.LOGGER, provider: { useValue: logger } },
    { token: Services.QUEUE_CONFIG, provider: { useValue: queueConfig } },
    { token: Services.TILES_CONFIG, provider: { useValue: tilesConfig } },
    { token: Services.GATEWAY_CONFIG, provider: { useValue: gatewayConfig } },
    { token: Services.CRYPTO_CONFIG, provider: { useValue: cryptoConfig } },
    { token: Services.TRACER, provider: { useValue: tracer } },
    { token: Services.METER, provider: { useValue: meter } },
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
    ...getProviders(config, logger),
  ];

  return registerDependencies(dependencies, options?.override, options?.useChild);
};
