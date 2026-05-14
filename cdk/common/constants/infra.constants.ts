export class InfraConstants {
  static readonly LAMBDA_TIMEOUT_DEFAULT_SECONDS = 30;
  static readonly LAMBDA_MEMORY_DEFAULT_MB       = 256;

  static readonly KINESIS_SHARD_COUNT     = 2;
  static readonly KINESIS_RETENTION_DAYS  = 7;
}
