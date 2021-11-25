import fs from 'fs';
import { PassThrough } from 'stream';
import { FsStorageProvider } from '../../../src/providers/fs/fsStorageProvider';

let provider: FsStorageProvider;

describe('fsStorageProvider', () => {
  beforeEach(() => {
    provider = new FsStorageProvider();
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('readFile', () => {
    it('returns content of specified file', async () => {
      //mock
      const mockFile = 'data data data';
      const filePath = 'testFile';
      const readFileMock = jest.spyOn(fs.promises, 'readFile');
      readFileMock.mockResolvedValue(mockFile);
      //action
      const res = await provider.readFile(filePath);
      //assersions
      expect(res).toBe(mockFile);
      expect(readFileMock).toHaveBeenCalledTimes(1);
      expect(readFileMock).toHaveBeenCalledWith(filePath);
    });
  });

  describe('getFileStream', () => {
    it('creates fileStream for specified file', () => {
      //mock
      const mockFile = new PassThrough();
      const filePath = 'testFile';
      const createReadStreamMock = jest.spyOn(fs, 'createReadStream');
      createReadStreamMock.mockReturnValue(mockFile as unknown as fs.ReadStream);
      //action
      const res = provider.getFileStream(filePath);
      //assersions
      expect(res).toBe(mockFile);
      expect(createReadStreamMock).toHaveBeenCalledTimes(1);
      expect(createReadStreamMock).toHaveBeenCalledWith(filePath);
    });
  });

  describe('exist', () => {
    it('return true on file access', async () => {
      //mock
      const filePath = 'testFile';
      const accessMock = jest.spyOn(fs.promises, 'access');
      accessMock.mockResolvedValue(undefined);
      //action
      const res = await provider.exist(filePath);
      //assersions
      expect(res).toBe(true);
      expect(accessMock).toHaveBeenCalledTimes(1);
      expect(accessMock).toHaveBeenCalledWith(filePath, fs.constants.F_OK);
    });

    it('return false on file access error', async () => {
      //mock
      const filePath = 'testFile';
      const accessMock = jest.spyOn(fs.promises, 'access');
      accessMock.mockImplementation(() => {
        throw new Error('test error');
      });
      //action
      const res = await provider.exist(filePath);
      //assersions
      expect(res).toBe(false);
      expect(accessMock).toHaveBeenCalledTimes(1);
      expect(accessMock).toHaveBeenCalledWith(filePath, fs.constants.F_OK);
    });
  });
});
