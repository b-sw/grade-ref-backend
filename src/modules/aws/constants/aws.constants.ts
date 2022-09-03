// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

export const enum S3Bucket {
    ReportsBucket,
    MatchesBucket,
    VideoClipsBucket
}

export const S3BucketNames = {
    [S3Bucket.ReportsBucket]: process.env.AWS_BUCKET_REPORTS,
    [S3Bucket.MatchesBucket]: process.env.AWS_BUCKET_MATCHES,
    [S3Bucket.VideoClipsBucket]: process.env.AWS_BUCKET_VIDEO_CLIPS,
};

export const S3FileKeyDateFormat = 'YYYY-MM-DDTHH:mm:ss:SSS';
