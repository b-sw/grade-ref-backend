// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

export const enum S3Bucket {
  ReportsBucket,
  MatchesBucket,
}

export const S3BucketNames = {
  [S3Bucket.ReportsBucket]: process.env.AWS_BUCKET_REPORTS,
  [S3Bucket.MatchesBucket]: process.env.AWS_BUCKET_MATCHES,
};

export const S3FileKeyDateFormat = 'YYYY-MM-DDTHH:mm:ss:SSS';
