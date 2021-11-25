import fs from 'fs';
import { Readable, PassThrough } from 'stream';
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
let fsReadFileSync: jest.SpyInstance;

const mockFileToSign = 'tests/mocks/files/mockTile.png';
const mockKeyPem = '!%F=-?Pst970ss33445adfcF#-c3dafd';
const cryptoConfig = config.get<ICryptoConfig>('crypto');

const mockData = 'mockData';
const getMockFileBuffer = (): Buffer => {
  const fileBuffer = Buffer.from(mockData);
  return fileBuffer;
};

const getMockFileStream = (): Readable => {
  const fileStream = new PassThrough();
  fileStream.write(mockData);
  fileStream.end();
  return fileStream;
};

const streamToString = async (stream: Readable): Promise<string> => {
  const chunks: Buffer[] = [];
  stream.on('data', (chunk) => {
    chunks.push(chunk as Buffer);
  });
  return new Promise((resolve, reject) => {
    stream.on('end', () => {
      const str = Buffer.concat(chunks).toString('utf-8');
      resolve(str);
    });
    stream.on('error', reject);
  });
};

describe('cryptoManager', () => {
  beforeEach(function () {
    // crpyto spys
    createHashStub = jest.spyOn(crypto, 'createHash');
    createCipherivStub = jest.spyOn(crypto, 'createCipheriv');

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    fsReadFileSync = jest.spyOn(fs, 'readFileSync');
    fsReadFileSync.mockReturnValue(mockKeyPem);
    cryptoManager = new CryptoManager(jsLogger({ enabled: false }), cryptoConfig);
  });

  afterEach(() => {
    container.reset();
    container.clearInstances();
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  describe('#signBuffer', () => {
    beforeEach(() => {
      concatStub = jest.spyOn(Buffer, 'concat');
      concatStub.mockImplementation(async () => Promise.resolve());
    });

    it('should successfully generate singed files', function () {
      // action
      const action = () => {
        const fileBuffer = getMockFileBuffer();
        cryptoManager.signBuffer(mockFileToSign, fileBuffer);
      };
      // expectation;
      expect(action).not.toThrow();
      expect(concatStub).toHaveBeenCalledTimes(2);
      expect(createCipherivStub).toHaveBeenCalledTimes(1);
    });

    it('should reject generate singed files due key file is not exists', function () {
      fsReadFileSync = jest.spyOn(fs, 'readFileSync');
      fsReadFileSync.mockImplementation(() => {
        throw new Error('failed for test');
      });
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

    it('should reject generate singed files with create hash error', function () {
      // mock
      createHashStub.mockImplementation(() => {
        throw new Error();
      });
      // action
      const action = () => {
        const fileBuffer = getMockFileBuffer();
        cryptoManager.signBuffer(mockFileToSign, fileBuffer);
      };
      // expectation;
      expect(action).toThrow();
      expect(concatStub).toHaveBeenCalledTimes(0);
      expect(createCipherivStub).toHaveBeenCalledTimes(0);
    });

    it('should reject generate singed files with create Cipher iv error', function () {
      // mock
      createCipherivStub.mockImplementation(() => {
        throw new Error();
      });
      // action
      const action = () => {
        const fileBuffer = getMockFileBuffer();
        cryptoManager.signBuffer(mockFileToSign, fileBuffer);
      };
      // expectation;
      expect(action).toThrow();
      expect(concatStub).toHaveBeenCalledTimes(0);
      expect(createCipherivStub).toHaveBeenCalledTimes(1);
    });
  });

  describe('#signStream', () => {
    // beforeEach(()=>{

    // })

    it('should successfully generate singed files', async function () {
      // action
      const fileStream = getMockFileStream();
      const responseStream = cryptoManager.signStream(mockFileToSign, fileStream);
      const res = await streamToString(responseStream);
      // expectation;
      expect(createCipherivStub).toHaveBeenCalledTimes(1);
      expect(res.startsWith(mockData)).toBe(true);
      expect(res.length).toBeGreaterThan(mockData.length);
    });

    it('should reject generate singed files due key file is not exists', function () {
      fsReadFileSync = jest.spyOn(fs, 'readFileSync');
      fsReadFileSync.mockImplementation(() => {
        throw new Error('failed for test');
      });
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

      expect(createCipherivStub).toHaveBeenCalledTimes(0);
    });

    it('should reject generate singed files with create hash error', function () {
      // mock
      createHashStub.mockImplementation(() => {
        throw new Error();
      });
      // action
      const action = () => {
        const fileStream = getMockFileStream();
        cryptoManager.signStream(mockFileToSign, fileStream);
      };
      // expectation;
      expect(action).toThrow();

      expect(createCipherivStub).toHaveBeenCalledTimes(0);
    });

    it('should reject generate singed files with create Cipher iv error', async function () {
      // mock
      createCipherivStub.mockImplementation(() => {
        throw new Error();
      });
      // action
      const action = async () => {
        const fileStream = getMockFileStream();
        const responseStream = cryptoManager.signStream(mockFileToSign, fileStream);
        await streamToString(responseStream);
      };
      // expectation;
      await expect(action).rejects.toThrow(Error);

      expect(createCipherivStub).toHaveBeenCalledTimes(1);
    });
  });
});
