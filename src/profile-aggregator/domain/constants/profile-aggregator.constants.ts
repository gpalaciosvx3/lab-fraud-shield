export class ProfileAggregatorConstants {
  static readonly AMOUNT_DECIMALS = 2;
  static readonly WINDOW_SIZE = 50;
  static readonly OUTLIER_CAP_MULTIPLIER = 5;
  static readonly FREQUENCY_WINDOW_DAYS = 30;
  static readonly FREQUENCY_WINDOW_MS = ProfileAggregatorConstants.FREQUENCY_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  static readonly MAX_CONCURRENCY_RETRIES = 3;
  static readonly KINESIS_PROCESS_CHUNK_SIZE = 25;
}
