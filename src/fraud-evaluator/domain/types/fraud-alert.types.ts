import { StreamTransactionEvent } from './stream-transaction-event.types';
import { FraudDecisionStatuses } from './fraud-decision.types';

export type FraudAlertDecision =
  | typeof FraudDecisionStatuses.REJECT
  | typeof FraudDecisionStatuses.REVIEW;

export interface FraudAlert {
  transactionId: string;
  clientId: string;
  decision: FraudAlertDecision;
  evaluatedAt: string;
  triggeredRuleId: string | null;
  anomaly: string | null;
  transaction: StreamTransactionEvent;
}
