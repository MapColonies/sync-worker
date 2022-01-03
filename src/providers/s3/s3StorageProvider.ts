import { Readable } from 'stream';
import { S3, Request, AWSError } from 'aws-sdk';
import { autoInjectable, inject } from 'tsyringe';
import { Logger } from '@map-colonies/js-logger';
import httpStatusCode from 'http-status-codes';
import { Services } from '../../common/constants';
import { IStorageProvider } from '../iStorageProvider';
import { IConfig } from '../../common/interfaces';
import { IS3Config } from './iS3Config';

@autoInjectable()
export class S3StorageProvider implements IStorageProvider {
  private readonly s3Config: IS3Config;
  private readonly s3: S3;

  public constructor(@inject(Services.LOGGER) private readonly logger: Logger, @inject(Services.CONFIG) config: IConfig) {
    this.s3Config = config.get<IS3Config>('S3');
    this.s3 = new S3({
      credentials: {
        accessKeyId: this.s3Config.accessKeyId,
        secretAccessKey: this.s3Config.secretAccessKey,
      },
      endpoint: this.s3Config.endpoint,
      s3ForcePathStyle: this.s3Config.forcePathStyle,
    });
  }

  public async readFile(path: string): Promise<Buffer> {
    try {
      const res = await this.getS3Object(path).promise();
      if (res.Body != undefined) {
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        return Buffer.from(res.Body.toString('binary'), 'binary');
      }
      //this should never happen as s3 errors should reject the promise
      throw new Error('failed to read file from s3');
    } catch (err) {
      throw this.handleError(path, err as Error);
    }
  }

  public getFileStream(path: string): Readable {
    return this.getS3Object(path)
      .createReadStream()
      .on('error', (err) => {
        throw this.handleError(path, err);
      });
  }

  public async exist(path: string): Promise<boolean> {
    const params = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Bucket: this.s3Config.bucket,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Key: this.fixWinPath(path),
    };

    return this.s3
      .headObject(params)
      .promise()
      .then(() => {
        return true;
      })
      .catch((err) => {
        const error = err as AWSError;
        this.logger.debug(`cant access file in s3: ${error.message}`);
        if (error.statusCode !== httpStatusCode.NOT_FOUND) {
          throw err;
        }
        return false;
      });
  }

  private readonly handleError = (path: string, err: Error): Error => {
    const error = err as AWSError;
    if (error.statusCode === httpStatusCode.NOT_FOUND) {
      this.logger.warn(`"${path}" was not found in s3`);
      return new Error(`"${path}" was not found in s3`);
    } else {
      this.logger.error(`failed to get file from s3: ${error.message}`);
      return err;
    }
  };

  private readonly getS3Object = (key: string): Request<S3.GetObjectOutput, AWSError> => {
    const options: S3.GetObjectRequest = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Bucket: this.s3Config.bucket,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Key: this.fixWinPath(key),
    };
    return this.s3.getObject(options);
  };

  private fixWinPath(path: string): string {
    if (process.platform === 'win32') {
      return path.replace(/\\/g, '/');
    }
    return path;
  }
}
