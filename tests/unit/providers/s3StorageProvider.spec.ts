import { PassThrough } from 'stream';
import httpStatusCode from 'http-status-codes';
import { AWSError } from 'aws-sdk';
import { S3StorageProvider } from '../../../src/providers/s3/s3StorageProvider';
import { logger } from '../../mocks/logger';
import { configMock, init as initConfig, setValue as setConfigValue, clear as clearConfig } from '../../mocks/config';
import {
  s3Mock,
  initS3Mock,
  getS3ObjectMock,
  getS3ObjectPromiseMock,
  getS3ObjectCreateReadStreamMock,
  headObjectMock,
  headObjectPromiseMock,
} from '../../mocks/s3';

let provider: S3StorageProvider;

jest.mock('aws-sdk', () => {
  return {
    ...jest.requireActual<Record<string, unknown>>('aws-sdk'),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    S3: jest.fn(() => s3Mock),
  };
});

describe('s3StorageProvider', () => {
  beforeEach(() => {
    initConfig();
    initS3Mock();
    setConfigValue('S3', {
      accessKeyId: 'keyId',
      secretAccessKey: 'secretKey',
      endpoint: 'endpoint',
      bucket: 'testBucket',
      forcePathStyle: true,
    });
    provider = new S3StorageProvider(logger, configMock);
  });

  afterEach(() => {
    clearConfig();
    //reset all mock breaks s3 mock, this cant be easily bypassed due to hoisting problems
    //jest.resetAllMocks();
    jest.clearAllMocks();
    headObjectPromiseMock.mockReset();
    jest.restoreAllMocks();
  });

  describe('readFile', () => {
    it('returns content of specified file', async () => {
      //mock
      const mockFile = Buffer.from('data data data');
      const filePath = 'testFile';
      // eslint-disable-next-line @typescript-eslint/naming-convention
      getS3ObjectPromiseMock.mockResolvedValue({ Body: mockFile });
      //action
      const res = await provider.readFile(filePath);
      //assersions
      expect(res).toEqual(mockFile);
      expect(getS3ObjectMock).toHaveBeenCalledTimes(1);
      // eslint-disable-next-line @typescript-eslint/naming-convention
      expect(getS3ObjectMock).toHaveBeenCalledWith({ Bucket: 'testBucket', Key: filePath });
      expect(getS3ObjectPromiseMock).toHaveBeenCalledTimes(1);
      expect(getS3ObjectCreateReadStreamMock).toHaveBeenCalledTimes(0);
    });

    it('returns error when file dont exists', async () => {
      //mock
      const err = new Error('test error') as AWSError;
      err.statusCode = httpStatusCode.NOT_FOUND;
      const filePath = 'testFile';
      getS3ObjectPromiseMock.mockImplementation(async () => {
        return Promise.reject(err);
      });
      //action
      const res = provider.readFile(filePath);
      //assersions
      await expect(res).rejects.toThrow(`"${filePath}" was not found in s3`);
      expect(getS3ObjectMock).toHaveBeenCalledTimes(1);
      // eslint-disable-next-line @typescript-eslint/naming-convention
      expect(getS3ObjectMock).toHaveBeenCalledWith({ Bucket: 'testBucket', Key: filePath });
      expect(getS3ObjectPromiseMock).toHaveBeenCalledTimes(1);
      expect(getS3ObjectCreateReadStreamMock).toHaveBeenCalledTimes(0);
    });
  });

  describe('getFileStream', () => {
    it('creates fileStream for specified file', () => {
      //mock
      const mockFile = new PassThrough();
      const filePath = 'testFile';
      getS3ObjectCreateReadStreamMock.mockReturnValue(mockFile);
      //action
      const res = provider.getFileStream(filePath);
      //assersions
      expect(res).toBe(mockFile);
      expect(getS3ObjectMock).toHaveBeenCalledTimes(1);
      // eslint-disable-next-line @typescript-eslint/naming-convention
      expect(getS3ObjectMock).toHaveBeenCalledWith({ Bucket: 'testBucket', Key: filePath });
      expect(getS3ObjectPromiseMock).toHaveBeenCalledTimes(0);
      expect(getS3ObjectCreateReadStreamMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('exist', () => {
    it('return true on file access', async () => {
      //mock
      const filePath = 'testFile';
      headObjectPromiseMock.mockResolvedValue(undefined);
      //action
      const res = await provider.exist(filePath);
      //assersions
      expect(res).toBe(true);
      expect(headObjectMock).toHaveBeenCalledTimes(1);
      // eslint-disable-next-line @typescript-eslint/naming-convention
      expect(headObjectMock).toHaveBeenCalledWith({ Bucket: 'testBucket', Key: filePath });
      expect(headObjectPromiseMock).toHaveBeenCalledTimes(1);
      expect(getS3ObjectMock).toHaveBeenCalledTimes(0);
    });

    it('return false on file not found error', async () => {
      //mock
      const filePath = 'testFile';
      headObjectPromiseMock.mockImplementation(async () => {
        return Promise.reject({ ...new Error('test error'), statusCode: httpStatusCode.NOT_FOUND });
      });
      //action
      const res = await provider.exist(filePath);
      //assersions
      expect(res).toBe(false);
      expect(headObjectMock).toHaveBeenCalledTimes(1);
      // eslint-disable-next-line @typescript-eslint/naming-convention
      expect(headObjectMock).toHaveBeenCalledWith({ Bucket: 'testBucket', Key: filePath });
      expect(headObjectPromiseMock).toHaveBeenCalledTimes(1);
      expect(getS3ObjectMock).toHaveBeenCalledTimes(0);
    });
  });
});
