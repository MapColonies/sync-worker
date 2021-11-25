import { promises as fsp, createReadStream, constants } from 'fs';
import { Readable } from 'stream';
import { IStorageProvider } from '../iStorageProvider';

export class FsStorageProvider implements IStorageProvider {
  public async readFile(path: string): Promise<Buffer> {
    return fsp.readFile(path);
  }

  public getFileStream(path: string): Readable {
    return createReadStream(path);
  }

  public async exist(path: string): Promise<boolean> {
    try {
      await fsp.access(path, constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }
}
