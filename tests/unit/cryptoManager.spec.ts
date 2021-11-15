import crypto from 'crypto';
import config from 'config';
import jsLogger from '@map-colonies/js-logger';
import { container } from 'tsyringe';
import { CryptoManager } from '../../src/cryptoManager';
import { ICryptoConfig } from '../../src/common/interfaces';

// fsp module stubs
let concatStub: jest.SpyInstance;
// crypto module stubs
let createHashStub: jest.SpyInstance;
let createCipherivStub: jest.SpyInstance;

let cryptoManager: CryptoManager;

const mockFileToSign = 'tests/mocks/files/mockTile.png';
const cryptoConfig = config.get<ICryptoConfig>('crypto');

const getMockFileBuffer = (): Buffer => {
  const fileBuffer = Buffer.from(['mockData']);
  return fileBuffer;
};

describe('cryptoManager', () => {
  beforeAll(function () {
    cryptoManager = new CryptoManager(jsLogger({ enabled: false }), cryptoConfig);
  });

  beforeEach(function () {
    concatStub = jest.spyOn(Buffer, 'concat');
    concatStub.mockImplementation(async () => Promise.resolve());
    // crpyto spys
    createHashStub = jest.spyOn(crypto, 'createHash');
    createCipherivStub = jest.spyOn(crypto, 'createCipheriv');
  });

  afterEach(() => {
    container.reset();
    container.clearInstances();
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  describe('#generateSingedFile', () => {
    it('should successfully generate singed files', async function () {
      // action
      const action = () => {
        const fileBuffer = getMockFileBuffer();
        cryptoManager.generateSignedFile(mockFileToSign, fileBuffer);
      };
      // expectation;
      await expect(action()).resolves.not.toThrow();
      expect(concatStub).toHaveBeenCalledTimes(2);
      expect(createCipherivStub).toHaveBeenCalledTimes(1);
    });

    it('should reject generate singed files due key file is not exists', function () {
      // mock
      const mockCryptoConfig: ICryptoConfig = {
        pem: 'invalid/path/to/private_key.pem',
        readFileEncoding: 'ascii',
        shaSize: 'SHA512',
        algoritm: 'aes-256-cfb',
      };
      // action
      const action = () => {
        cryptoManager = new CryptoManager(jsLogger({ enabled: false }), mockCryptoConfig);
      };
      // expectation;
      expect(action).toThrow();
      expect(concatStub).toHaveBeenCalledTimes(0);
      expect(createCipherivStub).toHaveBeenCalledTimes(0);
    });

    it('should reject generate singed files with create hash error', async function () {
      // mock
      createHashStub.mockImplementation(() => {
        throw new Error();
      });
      // action
      const action = () => {
        const fileBuffer = getMockFileBuffer();
        cryptoManager.generateSignedFile(mockFileToSign, fileBuffer);
      };
      // expectation;
      await expect(action).rejects.toThrow();
      expect(concatStub).toHaveBeenCalledTimes(0);
      expect(createCipherivStub).toHaveBeenCalledTimes(0);
    });

    it('should reject generate singed files with create Cipher iv error', async function () {
      // mock
      createCipherivStub.mockImplementation(() => {
        throw new Error();
      });
      // action
      const action = () => {
        const fileBuffer = getMockFileBuffer();
        cryptoManager.generateSignedFile(mockFileToSign, fileBuffer);
      };
      // expectation;
      await expect(action).rejects.toThrow();
      expect(concatStub).toHaveBeenCalledTimes(0);
      expect(createCipherivStub).toHaveBeenCalledTimes(1);
    });
  });
});
