export const FraudDecisionStatuses = {
  APPROVE: 'APPROVE',
  REVIEW: 'REVIEW',
  REJECT: 'REJECT',
} as const;

export type FraudDecisionStatus = (typeof FraudDecisionStatuses)[keyof typeof FraudDecisionStatuses];

export interface FraudDecisionRecord {
  transactionId: string;
  clientId: string;
  transactionType: string;
  decision: FraudDecisionStatus;
  evaluatedAt: string;
  triggeredRuleId: string | null;
  anomaly: string | null;
  context: Record<string, unknown>;
}
