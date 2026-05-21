export class EnvConstants {
  static readonly AWS_REGION = 'AWS_REGION';
  static readonly KINESIS_STREAM_NAME = 'KINESIS_STREAM_NAME';
  static readonly PROFILE_AGGREGATOR_TABLE_NAME = 'PROFILE_AGGREGATOR_TABLE_NAME';
  static readonly FRAUD_RULES_TABLE_NAME = 'FRAUD_RULES_TABLE_NAME';
  static readonly FRAUD_DECISIONS_TABLE_NAME = 'FRAUD_DECISIONS_TABLE_NAME';
  static readonly FRAUD_ALERTS_TOPIC_ARN = 'FRAUD_ALERTS_TOPIC_ARN';

  static readonly REQUERIDAS_TX_INGESTER: readonly string[] = [EnvConstants.KINESIS_STREAM_NAME];
  static readonly REQUERIDAS_PROFILE_AGGREGATOR: readonly string[] = [EnvConstants.PROFILE_AGGREGATOR_TABLE_NAME];
  static readonly REQUERIDAS_FRAUD_EVALUATOR: readonly string[] = [
    EnvConstants.PROFILE_AGGREGATOR_TABLE_NAME,
    EnvConstants.FRAUD_RULES_TABLE_NAME,
    EnvConstants.FRAUD_DECISIONS_TABLE_NAME,
    EnvConstants.FRAUD_ALERTS_TOPIC_ARN,
  ];
}
