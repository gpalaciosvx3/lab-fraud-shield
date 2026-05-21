import { EnvConstants } from '../constants/env.constants';

export const envConfig = {
  awsRegion:                  process.env[EnvConstants.AWS_REGION] ?? 'us-east-1',
  kinesisStreamName:          process.env[EnvConstants.KINESIS_STREAM_NAME] ?? '',
  profileAggregatorTableName: process.env[EnvConstants.PROFILE_AGGREGATOR_TABLE_NAME] ?? '',
};
