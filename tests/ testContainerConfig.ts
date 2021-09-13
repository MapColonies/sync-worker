import config from 'config';
import { trace } from '@opentelemetry/api';
import { DependencyContainer } from 'tsyringe/dist/typings/types';
import jsLogger from '@map-colonies/js-logger';
import { Metrics } from '@map-colonies/telemetry';
import { Services } from '../src/common/constants';
import { tracing } from '../src/common/tracing';
import { InjectionObject, registerDependencies } from '../src/common/dependencyRegistration';
import { ICryptoConfig, IGatewayConfig, IQueueConfig, ITilesConfig } from '../src/common/interfaces';

export interface RegisterOptions {
  override?: InjectionObject<unknown>[];
  useChild?: boolean;
}

export const registerExternalValues = (options?: RegisterOptions): DependencyContainer => {
  const logger = jsLogger({ enabled: false });
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
  ];

  return registerDependencies(dependencies, options?.override, options?.useChild);
};
