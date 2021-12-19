import { readFileSync } from 'fs';
import { Readable, Transform } from 'stream';
import crypto from 'crypto';
import { Logger } from '@map-colonies/js-logger';
import { inject, singleton } from 'tsyringe';
import { Services } from './common/constants';
import { IConfig, ICryptoConfig } from './common/interfaces';

interface IEncryptedHash {
  iv: Buffer;
  sig: Buffer;
}

@singleton()
export class CryptoManager {
  private readonly key: Buffer | undefined;

  public constructor(
    @inject(Services.LOGGER) private readonly logger: Logger,
    @inject(Services.CRYPTO_CONFIG) private readonly cryptoConfig: ICryptoConfig,
    @inject(Services.CONFIG) config: IConfig
  ) {
    this.logger = logger;
    this.key = config.get<boolean>('tiles.sigIsNeeded') ? this.readKeyFile(this.cryptoConfig.pem) : undefined;
  }

  public signStream(fullPath: string, stream: Readable): Readable {
    const hasher = crypto.createHash(this.cryptoConfig.shaSize);
    const logger = this.logger;
    const encryptHash = this.encryptHash;
    const outputStream = new Transform({
      transform: function (chunk, encoding, cb): void {
        hasher.update(chunk);
        cb(undefined, chunk);
      },
      flush: function (cb): void {
        try {
          const hash = hasher.digest();
          const encryptedHash = encryptHash(hash);
          logger.debug(`appending iv and signature into generated file from: ${fullPath}`);
          const signature = Buffer.concat([encryptedHash.iv, encryptedHash.sig]);
          cb(undefined, signature);
        } catch (err) {
          cb(err as Error);
        }
      },
    });
    stream.pipe(outputStream);
    return outputStream;
  }

  public signBuffer(fullPath: string, buffer: Buffer): Buffer {
    try {
      const fileHash = this.computeHash(buffer);
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
    hash.update(buffer);
    const hashKey = hash.digest();
    return hashKey;
  }

  private readonly encryptHash = (fileHash: Buffer): IEncryptedHash => {
    const ivSize = 16;
    const iv = Buffer.allocUnsafe(ivSize);
    const cipher = crypto.createCipheriv(this.cryptoConfig.algoritm, this.key as Buffer, iv);
    const sig = cipher.update(fileHash);

    const encryptedHash: IEncryptedHash = {
      iv,
      sig,
    };

    return encryptedHash;
  };

  private readKeyFile(filePath: string): Buffer {
    try {
      const key = readFileSync(filePath);
      return key;
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      this.logger.fatal(`Could not read key from provided file path: ${filePath}, error: ${error}`);
      throw error;
    }
  }
}
