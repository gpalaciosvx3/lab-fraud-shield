import { FraudDecisionRecord } from './fraud-decision.types';

export interface FraudEvaluationResult {
  transactionId: string;
  duplicated: boolean;
  decision: FraudDecisionRecord | null;
}
