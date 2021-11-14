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
    this.key = this.readKeyFile(this.cryptoConfig.pem);
  }

  public async generateSignedFile(fullPath: string, buffer?: Buffer | string): Promise<Buffer> {
    try {
      if (!buffer) {
        buffer = await this.readFile(fullPath);
      }
      const fileHash = this.computeHash(buffer as Buffer);
      const encryptedHash = this.encryptHash(fileHash);
      this.logger.debug(`appending iv and signature into generated file from: ${fullPath}`);
      buffer = Buffer.concat([buffer, encryptedHash.iv]);
      buffer = Buffer.concat([buffer, encryptedHash.sig]);
      return buffer;
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      this.logger.error(`Failed to generate sign file: ${fullPath} with error: ${error}`);
      throw error;
    }
  }

  private computeHash(buffer: Buffer): Buffer {
    const hash = crypto.createHash(this.cryptoConfig.shaSize);
    hash.update(String(buffer));
    const hashKey = hash.digest();
    return hashKey;
  }

  private async readFile(filePath: string): Promise<string | Buffer> {
    const secret = await fsp.readFile(filePath, { encoding: 'binary' });
    return secret;
  }

  private encryptHash(fileHash: Buffer): IEncryptedHash {
    const ivSize = 16;
    const iv = Buffer.allocUnsafe(ivSize);
    const cipher = crypto.createCipheriv(this.cryptoConfig.algoritm, this.key, iv);
    const sig = cipher.update(fileHash);

    const encryptedHash: IEncryptedHash = {
      iv,
      sig,
    };

    return encryptedHash;
  }

  private readKeyFile(filePath: string): string {
    try {
      const key = readFileSync(filePath, { encoding: 'utf8' });
      return key;
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      this.logger.fatal(`Could not read key from provided file path: ${filePath}, error: ${error}`);
      throw error;
    }
  }
}
