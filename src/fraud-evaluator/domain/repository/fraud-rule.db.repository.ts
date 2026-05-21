import { FraudRule } from '../types/fraud-rule.types';

export abstract class FraudRuleDbRepository {
  abstract findActiveByTransactionType(transactionType: string): Promise<FraudRule[]>;
}
