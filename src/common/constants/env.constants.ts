export class EnvConstants {
  static readonly AWS_REGION = 'AWS_REGION';
  static readonly KINESIS_STREAM_NAME = 'KINESIS_STREAM_NAME';
  static readonly PROFILE_AGGREGATOR_TABLE_NAME = 'PROFILE_AGGREGATOR_TABLE_NAME';

  static readonly REQUERIDAS_TX_INGESTER: readonly string[] = [EnvConstants.KINESIS_STREAM_NAME];
  static readonly REQUERIDAS_PROFILE_AGGREGATOR: readonly string[] = [EnvConstants.PROFILE_AGGREGATOR_TABLE_NAME];
}
