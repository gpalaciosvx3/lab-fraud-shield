export interface ClientProfile {
  clientId: string;
  averageAmount: number;
  habitualRegion: string;
  frequency30d: number;
  lastUpdatedAt: string;
  processedTransactions: number;
  validAmountWindow: number[];
  regionWindow: string[];
  frequencyWindow: string[];
  version: number;
  [key: string]: unknown;
}
