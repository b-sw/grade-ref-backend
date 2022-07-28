import { Injectable, Logger } from '@nestjs/common';
import { S3 } from 'aws-sdk';
import { S3Bucket, S3BucketNames } from './constants/aws.constants';

@Injectable()
export class S3Service {
  private s3: S3;

  constructor() {
    this.initializeS3();
  }

  private initializeS3(): void {
    this.s3 = new S3({
      region: 'eu-west-1',
    });
  }

  async upload(bucket: S3Bucket, key: string, file) {
    const { originalname, buffer } = file;
    Logger.log(originalname, 'S3 Uploaded file buffer');

    const params = {
      Bucket: S3BucketNames[bucket],
      Key: key,
      Body: buffer,
    };
    return new Promise((resolve, reject) => {
      this.s3.upload(params, (err, data) => {
        if (err) {
          Logger.error(err, 'S3 Upload error');
          reject(err.message);
        }
        resolve(data);
      });
    });
  }

  async getPresignedUrl(bucket: S3Bucket, key: string) {
    const params = {
      Bucket: S3BucketNames[bucket],
      Key: key,
    };

    return this.s3.getSignedUrlPromise('getObject', params);
  }
}
