import { promises as fsp } from 'fs';
import crypto from 'crypto';
import jsLogger from '@map-colonies/js-logger';
import { container } from 'tsyringe';
import { CryptoManager } from '../../src/cryptoManager';

// fsp module stubs
let concatStub: jest.SpyInstance;
let readFileStub: jest.SpyInstance;
// crypto module stubs
let createHashStub: jest.SpyInstance;
let createCipherivStub: jest.SpyInstance;

let cryptoManager: CryptoManager;

const keyFile = 'tests/mocks/files/validKey.pem';
const mockFileToSign = 'tests/mocks/files/mockTile.png';
const mockKeyPem = '!%F=-?Pst970ss33445adfcF#-c3dafd';

const getMockFileBuffer = (): Buffer => {
  const fileBuffer = Buffer.from(['mockData']);
  return fileBuffer;
};

describe('cryptoManager', () => {
  beforeAll(function () {
    cryptoManager = new CryptoManager(jsLogger({ enabled: false }));
  });

  beforeEach(function () {
    concatStub = jest.spyOn(Buffer, 'concat');
    concatStub.mockImplementation(async () => Promise.resolve());
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
      // mock
      readFileStub.mockResolvedValue(mockKeyPem);
      // action
      const action = async () => {
        const fileBuffer = getMockFileBuffer();
        await cryptoManager.generateSignedFile(keyFile, mockFileToSign, fileBuffer);
      };
      // expectation;
      await expect(action()).resolves.not.toThrow();
      expect(readFileStub).toHaveBeenCalledTimes(1);
      expect(concatStub).toHaveBeenCalledTimes(2);
      expect(createCipherivStub).toHaveBeenCalledTimes(1);
    });

    it('should reject generate singed files due key file is not exists', async function () {
      // mock
      const notExistsKeyFilePath = '/mocks/files/keyNotExists.pem';
      // action
      const action = async () => {
        const fileBuffer = getMockFileBuffer();
        await cryptoManager.generateSignedFile(notExistsKeyFilePath, mockFileToSign, fileBuffer);
      };
      // expectation;
      await expect(action).rejects.toThrow();
      expect(readFileStub).toHaveBeenCalledTimes(1);
      expect(concatStub).toHaveBeenCalledTimes(0);
      expect(createCipherivStub).toHaveBeenCalledTimes(0);
    });

    it('should reject generate singed files with create hash error', async function () {
      // mock
      createHashStub.mockImplementation(() => {
        throw new Error();
      });
      readFileStub.mockResolvedValue(mockKeyPem);
      // action
      const action = async () => {
        const fileBuffer = getMockFileBuffer();
        await cryptoManager.generateSignedFile(keyFile, mockFileToSign, fileBuffer);
      };
      // expectation;
      await expect(action).rejects.toThrow();
      expect(readFileStub).toHaveBeenCalledTimes(1);
      expect(concatStub).toHaveBeenCalledTimes(0);
      expect(createCipherivStub).toHaveBeenCalledTimes(0);
    });

    it('should reject generate singed files with create Cipher iv error', async function () {
      // mock
      createCipherivStub.mockImplementation(() => {
        throw new Error();
      });
      readFileStub.mockResolvedValue(mockKeyPem);
      // action
      const action = async () => {
        const fileBuffer = getMockFileBuffer();
        await cryptoManager.generateSignedFile(keyFile, mockFileToSign, fileBuffer);
      };
      // expectation;
      await expect(action).rejects.toThrow();
      expect(readFileStub).toHaveBeenCalledTimes(1);
      expect(concatStub).toHaveBeenCalledTimes(0);
      expect(createCipherivStub).toHaveBeenCalledTimes(1);
    });
  });
});
