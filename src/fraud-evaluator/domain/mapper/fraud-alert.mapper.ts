import { FraudAlert } from '../types/fraud-alert.types';
import { FraudDecisionRecord, FraudDecisionStatuses } from '../types/fraud-decision.types';
import { StreamTransactionEvent } from '../types/stream-transaction-event.types';

export class FraudAlertMapper {
  static fromDecision(decision: FraudDecisionRecord, transaction: StreamTransactionEvent): FraudAlert {
    return {
      transactionId: decision.transactionId,
      clientId: decision.clientId,
      decision: decision.decision === FraudDecisionStatuses.REJECT
        ? FraudDecisionStatuses.REJECT
        : FraudDecisionStatuses.REVIEW,
      evaluatedAt: decision.evaluatedAt,
      triggeredRuleId: decision.triggeredRuleId,
      anomaly: decision.anomaly,
      transaction,
    };
  }
}