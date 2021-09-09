/* eslint-disable import/first */
// this import must be called before the first import of tsyring
import 'reflect-metadata';
import { createServer } from 'http';
import { createTerminus } from '@godaddy/terminus';
import { Logger } from '@map-colonies/js-logger';
import { container } from 'tsyringe';
import { get } from 'config';
import { DEFAULT_SERVER_PORT, Services } from './common/constants';
import { getApp } from './app';
import { SyncManager } from './syncManager';
import { CryptoManager } from './cryptoManager';

interface IServerConfig {
  port: string;
}

const serverConfig = get<IServerConfig>('server');
const port: number = parseInt(serverConfig.port) || DEFAULT_SERVER_PORT;

const app = getApp();
const cryptoManager = container.resolve(CryptoManager);
const logger = container.resolve<Logger>(Services.LOGGER);
const syncManager = container.resolve(SyncManager);
const stubHealthcheck = async (): Promise<void> => Promise.resolve();
const server = createTerminus(createServer(app), { healthChecks: { '/liveness': stubHealthcheck, onSignal: container.resolve('onSignal') } });

server.listen(port, () => {
  logger.info(`app started on port ${port}`);
});

const mainLoop = async (): Promise<void> => {
  const isRunning = true;
  await cryptoManager.generateSingedFile(
    '/media/shlomiko/3180c99e-5d8d-43ac-b594-f4ed4d2be27c1/repos/sync-worker/tests/mocks/files/invalidKey.pem',
    '/tmp/1.png'
  );
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition

  // while (isRunning) {
  //   try {
  //     await syncManager.runSync();
  //   } catch (error) {
  //     logger.error(`mainLoop: Error: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`);
  //   }
  // }
};

void mainLoop();
