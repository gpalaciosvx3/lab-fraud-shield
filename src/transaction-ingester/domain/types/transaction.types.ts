export interface TransactionPayload {
  transactionId: string;
  clientId:      string;
  amount:        number;
  region:        string;
  type:          string;
  timestamp:     string;
}

export interface IngestResult {
  transactionId: string;
  status:        'ACCEPTED';
}
