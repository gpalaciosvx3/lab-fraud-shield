import { ProfileAggregatorConstants } from '../constants/profile-aggregator.constants';
import { ProfileAggregatorConfig } from '../types/profile-aggregator-config.types';
import { StreamTransactionEvent } from '../types/transaction-event.types';
import { ClientProfile } from '../types/client-profile.types';

export class ClientProfileEntity {
  private constructor(private readonly profile: ClientProfile) {}

  static createNew(transaction: StreamTransactionEvent): ClientProfileEntity {
    const validAmountWindow = [transaction.amount];
    const regionWindow = [transaction.region];
    const frequencyWindow = [transaction.timestamp];

    return new ClientProfileEntity({
      clientId: transaction.clientId,
      averageAmount: ClientProfileEntity.calculateAverage(validAmountWindow),
      habitualRegion: ClientProfileEntity.calculateMode(regionWindow),
      frequency30d: frequencyWindow.length,
      lastUpdatedAt: transaction.timestamp,
      processedTransactions: 1,
      validAmountWindow,
      regionWindow,
      frequencyWindow,
      version: 1,
    });
  }

  static fromRecord(record: ClientProfile): ClientProfileEntity {
    return new ClientProfileEntity({ ...record });
  }

  get clientId(): string {
    return this.profile.clientId;
  }

  get version(): number {
    return this.profile.version;
  }

  updateWithTransaction(transaction: StreamTransactionEvent, config: ProfileAggregatorConfig): ClientProfileEntity {
    const includeAmount = this.shouldIncludeAmount(transaction.amount, config.outlierCapMultiplier);
    const validAmountWindow = includeAmount
      ? ClientProfileEntity.appendAndTrim(this.profile.validAmountWindow, transaction.amount, config.windowSize)
      : [...this.profile.validAmountWindow];
    const regionWindow = ClientProfileEntity.appendAndTrim(this.profile.regionWindow, transaction.region, config.windowSize);
    const frequencyWindow = this.buildFrequencyWindow(transaction.timestamp);

    return new ClientProfileEntity({
      clientId: this.profile.clientId,
      averageAmount: ClientProfileEntity.calculateAverage(validAmountWindow),
      habitualRegion: ClientProfileEntity.calculateMode(regionWindow),
      frequency30d: frequencyWindow.length,
      lastUpdatedAt: transaction.timestamp,
      processedTransactions: this.profile.processedTransactions + 1,
      validAmountWindow,
      regionWindow,
      frequencyWindow,
      version: this.profile.version + 1,
    });
  }

  toRecord(): ClientProfile {
    return {
      clientId: this.profile.clientId,
      averageAmount: this.profile.averageAmount,
      habitualRegion: this.profile.habitualRegion,
      frequency30d: this.profile.frequency30d,
      lastUpdatedAt: this.profile.lastUpdatedAt,
      processedTransactions: this.profile.processedTransactions,
      validAmountWindow: [...this.profile.validAmountWindow],
      regionWindow: [...this.profile.regionWindow],
      frequencyWindow: [...this.profile.frequencyWindow],
      version: this.profile.version,
    };
  }

  private shouldIncludeAmount(amount: number, outlierCapMultiplier: number): boolean {
    if (this.profile.validAmountWindow.length === 0) return true;
    if (this.profile.averageAmount <= 0) return true;
    return amount <= this.profile.averageAmount * outlierCapMultiplier;
  }

  private buildFrequencyWindow(referenceTimestamp: string): string[] {
    const lowerBound = Date.parse(referenceTimestamp) - ProfileAggregatorConstants.FREQUENCY_WINDOW_MS;
    const mergedWindow = [...this.profile.frequencyWindow, referenceTimestamp];
    return mergedWindow.filter(timestamp => Date.parse(timestamp) >= lowerBound);
  }

  private static appendAndTrim<T>(values: readonly T[], value: T, maxSize: number): T[] {
    const mergedValues = [...values, value];
    if (mergedValues.length <= maxSize) return mergedValues;
    return mergedValues.slice(mergedValues.length - maxSize);
  }

  private static calculateAverage(values: readonly number[]): number {
    if (values.length === 0) return 0;
    const total = values.reduce((accumulator, current) => accumulator + current, 0);
    const average = total / values.length;
    return Number(average.toFixed(ProfileAggregatorConstants.AMOUNT_DECIMALS));
  }

  private static calculateMode(values: readonly string[]): string {
    if (values.length === 0) return '';

    const counter = values.reduce<Map<string, number>>((accumulator, current) => {
      const currentCount = accumulator.get(current) ?? 0;
      accumulator.set(current, currentCount + 1);
      return accumulator;
    }, new Map<string, number>());

    const mode = Array.from(counter.entries()).sort((left, right) => right[1] - left[1])[0];
    return mode ? mode[0] : '';
  }
}
