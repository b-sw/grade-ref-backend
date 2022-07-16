import { Injectable, Logger } from '@nestjs/common';
import { S3 } from 'aws-sdk';
import dayjs from 'dayjs';

export const enum S3Bucket {
  GRADES_BUCKET,
  MATCHES_BUCKET,
}

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

  private getBucketName = (bucket: S3Bucket): string => {
    switch (bucket) {
      case S3Bucket.MATCHES_BUCKET:
        return process.env.AWS_BUCKET_MATCHES;
      default:
        throw new Error(`Unknown bucket ${bucket}`);
    }
  };

  async uploadToS3(bucket: S3Bucket, file) {
    const { originalname, buffer } = file;
    Logger.log(buffer.toString(), 'S3 Uploaded file buffer');

    const params = {
      Bucket: this.getBucketName(bucket),
      Key: String(originalname + ' ' + dayjs().toString()),
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
}
