import { spawnSync } from 'child_process';
import { ResourceConstants } from '../cdk/common/constants/resource.constants';
import { FraudDecisionStatuses } from '../src/fraud-evaluator/domain/types/fraud-decision.types';
import { FraudRuleOperators, FraudRuleSources } from '../src/fraud-evaluator/domain/types/fraud-rule.types';

const tableName = process.env['FRAUD_RULES_TABLE_NAME'] ?? ResourceConstants.FRAUD_RULES_TABLE;

const requestItems = {
  [tableName]: [
    {
      PutRequest: {
        Item: {
          transactionType: { S: 'PAYMENT' },
          ruleId: { S: 'RULE-REJECT-AMOUNT-REGION' },
          decision: { S: FraudDecisionStatuses.REJECT },
          priority: { N: '1' },
          active: { BOOL: true },
          anomaly: { S: 'monto_fuera_rango_y_region_atipica' },
          conditions: {
            L: [
              {
                M: {
                  field: { S: 'amount' },
                  operator: { S: FraudRuleOperators.GREATER_THAN_PROFILE_MULTIPLIER },
                  value: { N: '3' },
                  source: { S: FraudRuleSources.TRANSACTION },
                  profileField: { S: 'averageAmount' },
                },
              },
              {
                M: {
                  field: { S: 'region' },
                  operator: { S: FraudRuleOperators.NOT_EQUALS },
                  value: { S: 'PE-LIM' },
                  source: { S: FraudRuleSources.TRANSACTION },
                },
              },
            ],
          },
        },
      },
    },
    {
      PutRequest: {
        Item: {
          transactionType: { S: 'PAYMENT' },
          ruleId: { S: 'RULE-REVIEW-AMOUNT-HIGH' },
          decision: { S: FraudDecisionStatuses.REVIEW },
          priority: { N: '2' },
          active: { BOOL: true },
          anomaly: { S: 'monto_elevado_requiere_revision' },
          conditions: {
            L: [
              {
                M: {
                  field: { S: 'amount' },
                  operator: { S: FraudRuleOperators.GREATER_THAN },
                  value: { N: '3000' },
                  source: { S: FraudRuleSources.TRANSACTION },
                },
              },
            ],
          },
        },
      },
    },
  ],
};

const execution = spawnSync(
  'awslocal',
  ['dynamodb', 'batch-write-item', '--request-items', JSON.stringify(requestItems)],
  { stdio: 'inherit' },
);

if (execution.status !== 0) process.exit(execution.status ?? 1);

console.log(`Reglas de prueba insertadas en tabla ${tableName}`);
