import { FraudDecisionRecord } from '../types/fraud-decision.types';

export abstract class FraudDecisionDbRepository {
  abstract findByTransactionId(transactionId: string): Promise<FraudDecisionRecord | null>;
  abstract saveIfAbsent(decision: FraudDecisionRecord): Promise<boolean>;
}
