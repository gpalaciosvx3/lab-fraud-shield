import { TransactionPayload } from '../types/transaction.types';

export abstract class KinesisRepository {
  abstract putRecord(payload: TransactionPayload): Promise<void>;
}
