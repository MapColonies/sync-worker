import { promises as fsp, readFileSync } from 'fs';
import crypto from 'crypto';
import { Logger } from '@map-colonies/js-logger';
import { inject, singleton } from 'tsyringe';
import { Services } from './common/constants';
import { ICryptoConfig } from './common/interfaces';

interface IEncryptedHash {
  iv: Buffer;
  sig: Buffer;
}

@singleton()
export class CryptoManager {
  private readonly key: string;
  public constructor(
    @inject(Services.LOGGER) private readonly logger: Logger,
    @inject(Services.CRYPTO_CONFIG) private readonly cryptoConfig: ICryptoConfig
  ) {
    this.logger = logger;
    this.key = readFileSync(this.cryptoConfig.pem, { encoding: 'utf8' });
  }

  public async generateSignedFile(filePath: string, buffer: Buffer): Promise<Buffer> {
    try {
      const fileHash = await this.computeHash(filePath);
      const encryptedHash = this.encryptHash(fileHash);
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

  private async computeHash(filePath: string): Promise<Buffer> {
    const secret = await fsp.readFile(filePath, { encoding: 'binary' });
    const hash = crypto.createHash('sha512');
    hash.update(String(secret));
    const hashKey = hash.digest();
    return hashKey;
  }

  private encryptHash(fileHash: Buffer): IEncryptedHash {
    const ivSize = 16;
    const iv = Buffer.allocUnsafe(ivSize);
    const cipher = crypto.createCipheriv('aes-256-cfb', this.key, iv);
    const sig = cipher.update(fileHash);
    const encryptedHash: IEncryptedHash = {
      iv,
      sig,
    };

    return encryptedHash;
  }
}
