import { promises as fsp } from 'fs';
import jsLogger from '@map-colonies/js-logger';
import config from 'config';
import { container } from 'tsyringe';
import { CryptoManager } from '../../src/cryptoManager';

let readFileStub: jest.SpyInstance;
let cryptoManager: CryptoManager;

describe('cryptoManager', () => {
  beforeAll(function () {
    cryptoManager = new CryptoManager(jsLogger({ enabled: false }));
  });

  //   beforeEach(function () {
  //   });

  afterEach(() => {
    container.reset();
    container.clearInstances();
    jest.clearAllMocks();
  });

  describe('#generateSingedFile', () => {
    // eslint-disable-next-line jest/expect-expect
    it('should successfully return hash', async function () {
      // mock
      readFileStub = jest.spyOn(fsp, 'readFile').mockRejectedValue(new Error());
      const notExistsKeyFilePath = 'tests/mock/mockTile.png';
      // action
      const action = async () => {
        await cryptoManager.generateSingedFile(notExistsKeyFilePath, notExistsKeyFilePath);
      };
      // expectation;
      await expect(action).rejects.toThrow();
      expect(readFileStub).toHaveBeenCalledTimes(1);
    });
  });
});
