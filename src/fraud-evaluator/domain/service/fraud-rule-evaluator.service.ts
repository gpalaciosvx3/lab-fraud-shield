import { FraudEvaluatorConstants } from '../constants/fraud-evaluator.constants';
import { ClientProfile } from '../types/client-profile.types';
import { FraudDecisionStatus, FraudDecisionStatuses } from '../types/fraud-decision.types';
import { FraudRule, FraudRuleCondition, FraudRuleOperator, FraudRuleSource, FraudRuleOperators, FraudRuleSources } from '../types/fraud-rule.types';
import { StreamTransactionEvent } from '../types/stream-transaction-event.types';

export class FraudRuleEvaluator {
  static selectMostRestrictive(
    rules: FraudRule[],
    transaction: StreamTransactionEvent,
    profile: ClientProfile | null,
  ): FraudRule | null {
    const evaluable = FraudRuleEvaluator.filterByProfileAvailability(rules, profile);
    const ordered = FraudRuleEvaluator.orderByPriority(evaluable);
    const matched = ordered.filter(rule => FraudRuleEvaluator.matchesRule(rule, transaction, profile));

    if (matched.length === 0) return null;

    const [first, ...rest] = matched;
    return rest.reduce<FraudRule>(
      (selected, current) => FraudRuleEvaluator.isMoreRestrictive(current, selected) ? current : selected,
      first,
    );
  }

  static filterByProfileAvailability(rules: FraudRule[], profile: ClientProfile | null): FraudRule[] {
    if (profile) return rules;
    return rules.filter(rule => !rule.conditions.some(FraudRuleEvaluator.isProfileDependent));
  }

  private static orderByPriority(rules: FraudRule[]): FraudRule[] {
    return [...rules].sort((left, right) => left.priority - right.priority);
  }

  private static matchesRule(rule: FraudRule, transaction: StreamTransactionEvent, profile: ClientProfile | null): boolean {
    return rule.conditions.every(condition => FraudRuleEvaluator.matchesCondition(condition, transaction, profile));
  }

  private static matchesCondition(
    condition: FraudRuleCondition,
    transaction: StreamTransactionEvent,
    profile: ClientProfile | null,
  ): boolean {
    if (condition.operator === FraudRuleOperators.GREATER_THAN_PROFILE_MULTIPLIER) {
      return FraudRuleEvaluator.matchesProfileMultiplier(condition, transaction, profile);
    }

    const source = condition.source ?? FraudRuleSources.TRANSACTION;
    const leftValue = FraudRuleEvaluator.resolveValue(source, condition.field, transaction, profile);
    return FraudRuleEvaluator.compareValues(condition.operator, leftValue, condition.value);
  }

  private static matchesProfileMultiplier(
    condition: FraudRuleCondition,
    transaction: StreamTransactionEvent,
    profile: ClientProfile | null,
  ): boolean {
    if (!profile) return false;
    if (!condition.profileField) return false;

    const leftNumber = FraudRuleEvaluator.toNumber(
      FraudRuleEvaluator.resolveValue('transaction', condition.field, transaction, profile),
    );
    const baseNumber = FraudRuleEvaluator.toNumber(
      FraudRuleEvaluator.resolveValue('profile', condition.profileField, transaction, profile),
    );

    if (leftNumber === null) return false;
    if (baseNumber === null) return false;
    if (typeof condition.value !== 'number') return false;

    return leftNumber > baseNumber * condition.value;
  }

  private static compareValues(operator: FraudRuleOperator, leftValue: unknown, rightValue: unknown): boolean {
    if (operator === FraudRuleOperators.EQUALS) return leftValue === rightValue;
    if (operator === FraudRuleOperators.NOT_EQUALS) return leftValue !== rightValue;

    const leftNumber = FraudRuleEvaluator.toNumber(leftValue);
    const rightNumber = FraudRuleEvaluator.toNumber(rightValue);
    if (leftNumber === null) return false;
    if (rightNumber === null) return false;

    if (operator === FraudRuleOperators.GREATER_THAN) return leftNumber > rightNumber;
    if (operator === FraudRuleOperators.GREATER_OR_EQUALS) return leftNumber >= rightNumber;
    if (operator === FraudRuleOperators.LESS_THAN) return leftNumber < rightNumber;
    if (operator === FraudRuleOperators.LESS_OR_EQUALS) return leftNumber <= rightNumber;
    return false;
  }

  private static resolveValue(
    source: FraudRuleSource,
    field: string,
    transaction: StreamTransactionEvent,
    profile: ClientProfile | null,
  ): unknown {
    if (source === FraudRuleSources.TRANSACTION) return transaction[field];
    if (!profile) return undefined;
    return profile[field];
  }

  private static toNumber(value: unknown): number | null {
    if (typeof value === 'number') return value;
    return null;
  }

  private static isMoreRestrictive(candidate: FraudRule, current: FraudRule): boolean {
    const candidateScore = FraudRuleEvaluator.decisionScore(candidate.decision);
    const currentScore = FraudRuleEvaluator.decisionScore(current.decision);
    if (candidateScore > currentScore) return true;
    if (candidateScore < currentScore) return false;
    return candidate.priority < current.priority;
  }

  private static decisionScore(decision: FraudDecisionStatus): number {
    if (decision === FraudDecisionStatuses.REJECT) return FraudEvaluatorConstants.DECISION_SCORE_REJECT;
    if (decision === FraudDecisionStatuses.REVIEW) return FraudEvaluatorConstants.DECISION_SCORE_REVIEW;
    return FraudEvaluatorConstants.DECISION_SCORE_APPROVE;
  }

  private static isProfileDependent(condition: FraudRuleCondition): boolean {
    if (condition.source === FraudRuleSources.PROFILE) return true;
    if (condition.operator === FraudRuleOperators.GREATER_THAN_PROFILE_MULTIPLIER) return true;
    return Boolean(condition.profileField);
  }
}
