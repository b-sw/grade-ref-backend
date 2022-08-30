import { Injectable, Logger } from '@nestjs/common';
import { S3 } from 'aws-sdk';
import { S3Bucket, S3BucketNames } from 'src/modules/aws/constants/aws.constants';

@Injectable()
export class S3Service {
    private static readonly S3_REGION = 'eu-west-1';
    private static readonly S3_UPLOADED_FILE_BUFFER_MESSAGE = 'S3 Uploaded file buffer';
    private static readonly S3_UPLOAD_ERROR_MESSAGE = 'S3 Upload error';

    private s3: S3;

    constructor() {
        this._initializeS3();
    }

    private _initializeS3(): void {
        this.s3 = new S3({
            region: S3Service.S3_REGION,
        });
    }

    async upload(s3Bucket: S3Bucket, fileKey: string, file) {
        const { originalname, buffer: fileBuffer } = file;
        Logger.log(originalname, S3Service.S3_UPLOADED_FILE_BUFFER_MESSAGE);

        const uploadParams = {
            Bucket: S3BucketNames[s3Bucket],
            Key: fileKey,
            Body: fileBuffer,
        };

        return new Promise((resolve, reject) => {
            this.s3.upload(uploadParams, (error, data) => {
                if (error) {
                    Logger.error(error, S3Service.S3_UPLOAD_ERROR_MESSAGE);
                    reject(error.message);
                }
                resolve(data);
            });
        });
    }

    async getPresignedUrl(s3Bucket: S3Bucket, fileKey: string): Promise<string> {
        const presignedUrlParams = {
            Bucket: S3BucketNames[s3Bucket],
            Key: fileKey,
        };

        return await this.s3.getSignedUrlPromise('getObject', presignedUrlParams);
    }
}
