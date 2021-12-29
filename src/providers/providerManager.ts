import { Logger } from '@map-colonies/js-logger';
import { Services } from '../common/constants';
import { IConfig } from '../common/interfaces';
import { InjectionObject } from '../common/dependencyRegistration';
import { StorageProviderType } from '../common/enums';
import { FsStorageProvider } from './fs/fsStorageProvider';
import { S3StorageProvider } from './s3/s3StorageProvider';

export function getProviders(config: IConfig, logger: Logger): InjectionObject<unknown>[] {
  const providers: InjectionObject<unknown>[] = [];
  const storageProviderType = config.get<string>('storageProvider');
  switch (storageProviderType.toUpperCase()) {
    case StorageProviderType.FS:
      providers.push({ token: Services.STORAGE_PROVIDER, provider: FsStorageProvider });
      break;
    case StorageProviderType.S3:
      providers.push({ token: Services.STORAGE_PROVIDER, provider: S3StorageProvider });
      break;
    default:
      logger.error(`invalid storage provider configuration: ${storageProviderType}`);
      throw new Error(`invalid storage provider configuration: ${storageProviderType}`);
  }
  logger.info(`using ${storageProviderType} storage provider`);
  return providers;
}
