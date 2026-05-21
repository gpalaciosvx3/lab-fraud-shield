import { EnvConstants } from '../constants/env.constants';

export const envConfig = {
  awsRegion:                  process.env[EnvConstants.AWS_REGION] ?? 'us-east-1',
  kinesisStreamName:          process.env[EnvConstants.KINESIS_STREAM_NAME] ?? '',
  profileAggregatorTableName: process.env[EnvConstants.PROFILE_AGGREGATOR_TABLE_NAME] ?? '',
  fraudRulesTableName:        process.env[EnvConstants.FRAUD_RULES_TABLE_NAME] ?? '',
  fraudDecisionsTableName:    process.env[EnvConstants.FRAUD_DECISIONS_TABLE_NAME] ?? '',
  fraudAlertsTopicArn:        process.env[EnvConstants.FRAUD_ALERTS_TOPIC_ARN] ?? '',
};
