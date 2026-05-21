import { FraudDecisionStatus } from './fraud-decision.types';

export const FraudRuleOperators = {
  EQUALS: 'EQUALS',
  NOT_EQUALS: 'NOT_EQUALS',
  GREATER_THAN: 'GREATER_THAN',
  GREATER_OR_EQUALS: 'GREATER_OR_EQUALS',
  LESS_THAN: 'LESS_THAN',
  LESS_OR_EQUALS: 'LESS_OR_EQUALS',
  GREATER_THAN_PROFILE_MULTIPLIER: 'GREATER_THAN_PROFILE_MULTIPLIER',
} as const;

export type FraudRuleOperator = (typeof FraudRuleOperators)[keyof typeof FraudRuleOperators];

export const FraudRuleSources = {
  TRANSACTION: 'transaction',
  PROFILE: 'profile',
} as const;

export type FraudRuleSource = (typeof FraudRuleSources)[keyof typeof FraudRuleSources];

export type FraudRuleConditionValue = string | number | boolean;

export interface FraudRuleCondition {
  field: string;
  operator: FraudRuleOperator;
  value: FraudRuleConditionValue;
  source?: FraudRuleSource;
  profileField?: string;
}

export interface FraudRule {
  ruleId: string;
  transactionType: string;
  decision: FraudDecisionStatus;
  priority: number;
  active: boolean;
  anomaly: string;
  conditions: FraudRuleCondition[];
}
