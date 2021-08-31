import { promises as fsp } from 'fs';
import crypto, { Cipher } from 'crypto';
import { Logger } from '@map-colonies/js-logger';
import { inject, singleton } from 'tsyringe';
import { QueueClient } from './clients/queueClient';
import { Services } from './common/constants';
import { ICryptoConfig } from './common/interfaces';

@singleton()
export class CryptoManager {
  public constructor(
    @inject(Services.LOGGER) private readonly logger: Logger,
    @inject(Services.CRYPTO_CONFIG) private readonly cryptoConfig: ICryptoConfig
  ) {
    this.logger = logger;
  }

  public encryptHash(key: string, fileHash: string): { iv: Buffer; buffer: Buffer } | undefined {
    try {
      const ivSize = 16;
      const iv = Buffer.allocUnsafe(ivSize);
      const cipher = crypto.createCipheriv('aes-256-cfb', Buffer.from(key, 'base64'), iv);
      const buffer = cipher.update(fileHash);

      const obj = {
        iv,
        buffer,
      };

      return obj;
    } catch (error) {
      console.log(error);
    }
  }

  private async computeHash(keyPath: string): Promise<Buffer | undefined> {
    try {
      const key = await fsp.readFile(keyPath, { encoding: 'binary' });
      const hash = crypto.createHash('sha256');
      hash.update(key);
      return hash.digest();
    } catch (error) {
      this.logger.debug(`Failed to computeHash: ${(error as Error).message}`);
    }
  }

  public async generateSingedFile(keyPath: string, filePath: string): Promise<void> {
    const fileHash = await this.computeHash(filePath);
    const key = await fsp.readFile(this.cryptoConfig.pem, { encoding: 'binary' });
    if (fileHash) {
      const encryptedHash = this.encryptHash(key, fileHash.toString());
      if (encryptedHash) {
        await fsp.appendFile(filePath, encryptedHash.iv);
        await fsp.appendFile(filePath, encryptedHash.buffer);
      }
    }
  }
}
