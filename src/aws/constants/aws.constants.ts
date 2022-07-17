import { EnvironmentType } from '../../users/constants/env.constants';

export const enum S3Bucket {
  GradesBucket,
  MatchesBucket,
}

export const BucketNames = {
  [S3Bucket.GradesBucket]: {
    [EnvironmentType.Default]: process.env.AWS_BUCKET_GRADES,
    [EnvironmentType.Test]: process.env.AWS_BUCKET_GRADES_TEST,
  },
  [S3Bucket.MatchesBucket]: {
    [EnvironmentType.Default]: process.env.AWS_BUCKET_MATCHES,
    [EnvironmentType.Test]: process.env.AWS_BUCKET_MATCHES_TEST,
  }
}

export const S3FileKeyDateFormat: string = 'YYYY-MM-DDTHH:mm:ss:SSS';