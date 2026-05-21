import { FraudDecisionRecord } from '../types/fraud-decision.types';
import { FraudEvaluationResult } from '../types/fraud-evaluation-result.types';

export class FraudEvaluationResultMapper {
  static duplicate(transactionId: string): FraudEvaluationResult {
    return { transactionId, duplicated: true, decision: null };
  }

  static evaluated(transactionId: string, decision: FraudDecisionRecord): FraudEvaluationResult {
    return { transactionId, duplicated: false, decision };
  }
}
