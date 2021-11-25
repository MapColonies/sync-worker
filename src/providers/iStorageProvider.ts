import { Readable } from 'stream';

export interface IStorageProvider {
  readFile: (path: string) => Promise<Buffer>;
  getFileStream: (path: string) => Readable;
  exist: (path: string) => Promise<boolean>;
}
