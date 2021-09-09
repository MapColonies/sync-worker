import { promises as fsp } from 'fs';
import crypto from 'crypto';
import {} from '../mocks/crypto/cryptoMock';
import jsLogger from '@map-colonies/js-logger';
import { container } from 'tsyringe';
import { CryptoManager } from '../../src/cryptoManager';

// fsp module stubs
let appendFileStub: jest.SpyInstance;
let readFileStub: jest.SpyInstance;
// crypto module stubs
let createHashStub: jest.SpyInstance;
let createCipherivStub: jest.SpyInstance;

let cryptoManager: CryptoManager;

const keyFile = 'tests/mocks/files/validKey.pem';
const mockFileToSign = 'tests/mocks/files/mockTile.png';

describe('cryptoManager', () => {
  beforeAll(function () {
    cryptoManager = new CryptoManager(jsLogger({ enabled: false }));
  });

  beforeEach(function () {
    // fsp spys
    appendFileStub = jest.spyOn(fsp, 'appendFile').mockResolvedValue(undefined);
    readFileStub = jest.spyOn(fsp, 'readFile');
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
      const action = async () => {
        await cryptoManager.generateSingedFile(keyFile, mockFileToSign);
      };
      // expectation;
      await expect(action()).resolves.not.toThrow();
      expect(readFileStub).toHaveBeenCalledTimes(1);
      expect(appendFileStub).toHaveBeenCalledTimes(2);
      expect(createCipherivStub).toHaveBeenCalledTimes(1);
    });

    it('should reject generate singed files due key file is not exists', async function () {
      // mock
      const notExistsKeyFilePath = '/mocks/files/keyNotExists.pem';
      // action
      const action = async () => {
        await cryptoManager.generateSingedFile(notExistsKeyFilePath, mockFileToSign);
      };
      // expectation;
      await expect(action).rejects.toThrow();
      expect(readFileStub).toHaveBeenCalledTimes(1);
      expect(appendFileStub).toHaveBeenCalledTimes(0);
      expect(createCipherivStub).toHaveBeenCalledTimes(0);
    });

    it('should reject generate singed files with create hash error', async function () {
      // mock
      createHashStub.mockImplementation(() => {
        throw new Error();
      });
      // action
      const action = async () => {
        await cryptoManager.generateSingedFile(keyFile, mockFileToSign);
      };
      // expectation;
      await expect(action).rejects.toThrow();
      expect(readFileStub).toHaveBeenCalledTimes(1);
      expect(appendFileStub).toHaveBeenCalledTimes(0);
      expect(createCipherivStub).toHaveBeenCalledTimes(0);
    });

    it('should reject generate singed files with create Cipher iv error', async function () {
      // mock
      createCipherivStub.mockImplementation(() => {
        throw new Error();
      });
      // action
      const action = async () => {
        await cryptoManager.generateSingedFile(keyFile, mockFileToSign);
      };
      // expectation;
      await expect(action).rejects.toThrow();
      expect(readFileStub).toHaveBeenCalledTimes(1);
      expect(appendFileStub).toHaveBeenCalledTimes(0);
      expect(createCipherivStub).toHaveBeenCalledTimes(1);
    });
  });
});
