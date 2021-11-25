import jsLogger from '@map-colonies/js-logger';
import { container } from 'tsyringe';
import { Services } from '../../../src/common/constants';
import { FsStorageProvider } from '../../../src/providers/fs/fsStorageProvider';
import { getProviders } from '../../../src/providers/providerManager';
import { S3StorageProvider } from '../../../src/providers/s3/s3StorageProvider';
import { configMock, init as initConfig, clear as clearConfig, setValue as setConfigValue } from '../../mocks/config';
import { logger } from '../../mocks/logger';

describe('ProviderFactory', () => {
  beforeEach(function () {
    initConfig();
    container.register(Services.CONFIG, { useValue: configMock });
    container.register(Services.LOGGER, { useValue: jsLogger({ enabled: false }) });
  });

  afterEach(() => {
    clearConfig();
    jest.resetAllMocks();
    container.clearInstances();
  });

  describe('#GetProvider', () => {
    it('returns Fs provider on fs config', function () {
      setConfigValue('storageProvider', 'Fs');
      // action
      const providerRegistration = getProviders(configMock, logger);

      // expectation
      expect(providerRegistration).toHaveLength(1);
      expect(providerRegistration[0].provider).toBe(FsStorageProvider);
    });

    it('returns S3 provider on s3 config', function () {
      setConfigValue('storageProvider', 's3');
      // action
      const providerRegistration = getProviders(configMock, logger);

      // expectation
      expect(providerRegistration).toHaveLength(1);
      expect(providerRegistration[0].provider).toBe(S3StorageProvider);
    });
  });
});
