import { promises as fsp } from 'fs';
import crypto from 'crypto';
import { Logger } from '@map-colonies/js-logger';
import { inject, singleton } from 'tsyringe';
import { Services } from './common/constants';

interface IEncryptedHash {
  iv: Buffer;
  sig: Buffer;
}

@singleton()
export class CryptoManager {
  public constructor(@inject(Services.LOGGER) private readonly logger: Logger) {
    this.logger = logger;
  }

  public async generateSignedFile(keyFilePath: string, filePath: string, buffer: Buffer): Promise<Buffer> {
    try {
      const hash = await this.computeHash(keyFilePath);
      const encryptedHash = this.encryptHash(hash);
      this.logger.debug(`appending iv and signature into genereated file: ${filePath}`);
      buffer = Buffer.concat([buffer, encryptedHash.iv]);
      buffer = Buffer.concat([buffer, encryptedHash.sig]);
      return buffer;
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      this.logger.error(`Failed to generate sign file: ${filePath} with error: ${error}`);
      throw error;
    }
  }

  private async computeHash(keyFilePath: string): Promise<string> {
    this.logger.debug('computing hash key');
    const secret = await fsp.readFile(keyFilePath, { encoding: 'binary' });
    const hash = crypto.createHash('sha256');
    hash.update(String(secret));
    const hashKey = hash.digest('base64');
    return hashKey;
  }

  private encryptHash(fileHash: string): IEncryptedHash {
    const ivSize = 16;
    this.logger.debug('encrypting hash');
    const iv = Buffer.allocUnsafe(ivSize);
    const cipher = crypto.createCipheriv('aes-256-cfb', Buffer.from(fileHash, 'base64'), iv);
    const sig = cipher.update(fileHash);
    const encryptedHash: IEncryptedHash = {
      iv,
      sig,
    };

    return encryptedHash;
  }
}
