export class InfraConstants {
  static readonly LAMBDA_TIMEOUT_DEFAULT_SECONDS = 30;
  static readonly LAMBDA_MEMORY_DEFAULT_MB       = 256;
  static readonly API_GATEWAY_STAGE_NAME         = 'prod';

  static readonly KINESIS_SHARD_COUNT     = 2;
  static readonly KINESIS_RETENTION_DAYS  = 7;

  static readonly AUDIT_FIREHOSE_BUFFER_SECONDS = 60;
  static readonly AUDIT_FIREHOSE_BUFFER_MB      = 5;
  static readonly AUDIT_PARTITION_PREFIX         = 'year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/client=!{partitionKeyFromQuery:clientId}/';
  static readonly AUDIT_OBJECT_PATH_PATTERN      = 'year=*/month=*/day=*/client=*/*';
}
