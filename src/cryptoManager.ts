import { promises as fsp } from 'fs';
import crypto from 'crypto';
import { Logger } from '@map-colonies/js-logger';
import { inject, singleton } from 'tsyringe';
import { Services } from './common/constants';
import { ICryptoConfig } from './common/interfaces';

interface IEncryptedHash {
  iv: Buffer;
  buffer: Buffer;
}

@singleton()
export class CryptoManager {
  public constructor(
    @inject(Services.LOGGER) private readonly logger: Logger,
    @inject(Services.CRYPTO_CONFIG) private readonly cryptoConfig: ICryptoConfig
  ) {
    this.logger = logger;
  }

  public async generateSingedFile(fileHash: string, filePath: string): Promise<void> {
    const hash = await this.computeHash(fileHash);

    if (hash !== undefined) {
      const encryptedHash = this.encryptHash(hash);
      if (encryptedHash) {
        this.logger.debug(`appending iv and buffer into file: ${filePath}`);
        await fsp.appendFile(filePath, encryptedHash.iv.toString('base64'));
        await fsp.appendFile(filePath, encryptedHash.buffer.toString('base64'));
      }
    }
  }

  private async computeHash(keyPath: string): Promise<string | undefined> {
    this.logger.debug('computing hash key');
    const secret = await fsp.readFile(keyPath, { encoding: 'binary' });
    const hash = crypto.createHash('sha256');
    hash.update(String(secret));
    return hash.digest('base64');
  }

  private encryptHash(fileHash: string): IEncryptedHash | undefined {
    const ivSize = 16;
    this.logger.debug('encrypting hash');
    const iv = Buffer.allocUnsafe(ivSize);
    const cipher = crypto.createCipheriv('aes-256-cfb', Buffer.from(fileHash, 'base64'), iv);
    const buffer = cipher.update(fileHash);

    const obj = {
      iv,
      buffer,
    };

    return obj;
  }
}
