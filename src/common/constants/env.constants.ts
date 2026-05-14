export class EnvConstants {
  static readonly AWS_REGION = 'AWS_REGION';
  static readonly KINESIS_STREAM_NAME = 'KINESIS_STREAM_NAME';

  static readonly REQUERIDAS_TX_INGESTER: readonly string[] = [EnvConstants.KINESIS_STREAM_NAME];
}
