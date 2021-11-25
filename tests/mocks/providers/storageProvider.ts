import { IStorageProvider } from '../../../src/providers/iStorageProvider';

const readFileMock = jest.fn();
const getFileStreamMock = jest.fn();
const existMock = jest.fn();

const storageProviderMock = {
  readFile: readFileMock,
  getFileStream: getFileStreamMock,
  exist: existMock,
} as unknown as IStorageProvider;

export { storageProviderMock, readFileMock, getFileStreamMock, existMock };
