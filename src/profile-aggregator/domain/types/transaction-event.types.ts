export interface StreamTransactionEvent {
  transactionId: string;
  clientId: string;
  amount: number;
  region: string;
  type: string;
  timestamp: string;
}
