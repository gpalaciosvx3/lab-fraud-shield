import { FraudEvaluatorConstants } from '../constants/fraud-evaluator.constants';
import { FraudDecisionRecord, FraudDecisionStatuses } from '../types/fraud-decision.types';
import { FraudRule } from '../types/fraud-rule.types';
import { StreamTransactionEvent } from '../types/stream-transaction-event.types';

export class FraudDecisionEntity {
  private constructor(private readonly record: FraudDecisionRecord) {}

  static approveByDefault(transaction: StreamTransactionEvent): FraudDecisionEntity {
    return new FraudDecisionEntity({
      transactionId: transaction.transactionId,
      clientId: transaction.clientId,
      transactionType: transaction.type,
      decision: FraudDecisionStatuses.APPROVE,
      evaluatedAt: transaction.timestamp,
      triggeredRuleId: null,
      anomaly: null,
      context: {
        reason: FraudEvaluatorConstants.NO_RULE_TRIGGERED,
      },
    });
  }

  static fromRule(transaction: StreamTransactionEvent, rule: FraudRule): FraudDecisionEntity {
    return new FraudDecisionEntity({
      transactionId: transaction.transactionId,
      clientId: transaction.clientId,
      transactionType: transaction.type,
      decision: rule.decision,
      evaluatedAt: transaction.timestamp,
      triggeredRuleId: rule.ruleId,
      anomaly: rule.anomaly,
      context: {
        ruleId: rule.ruleId,
        priority: rule.priority,
        anomaly: rule.anomaly,
      },
    });
  }

  get decision(): FraudDecisionRecord['decision'] {
    return this.record.decision;
  }

  toRecord(): FraudDecisionRecord {
    return {
      transactionId: this.record.transactionId,
      clientId: this.record.clientId,
      transactionType: this.record.transactionType,
      decision: this.record.decision,
      evaluatedAt: this.record.evaluatedAt,
      triggeredRuleId: this.record.triggeredRuleId,
      anomaly: this.record.anomaly,
      context: { ...this.record.context },
    };
  }
}
