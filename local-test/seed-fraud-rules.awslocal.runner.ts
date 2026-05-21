import { BatchWriteItemCommand, DynamoDBClient, WriteRequest } from '@aws-sdk/client-dynamodb';
import { ResourceConstants } from '../cdk/common/constants/resource.constants';
import { FraudDecisionStatuses } from '../src/fraud-evaluator/domain/types/fraud-decision.types';
import { FraudRuleOperators, FraudRuleSources } from '../src/fraud-evaluator/domain/types/fraud-rule.types';

async function run(): Promise<void> {
  const tableName = process.env['FRAUD_RULES_TABLE_NAME'] ?? ResourceConstants.FRAUD_RULES_TABLE;
  const awsRegion = process.env['AWS_REGION'] ?? 'us-east-1';
  const localstackEndpoint = process.env['LOCALSTACK_ENDPOINT'] ?? 'http://localhost:4566';

  const dynamoClient = new DynamoDBClient({
    region: awsRegion,
    endpoint: localstackEndpoint,
    credentials: {
      accessKeyId: process.env['AWS_ACCESS_KEY_ID'] ?? 'test',
      secretAccessKey: process.env['AWS_SECRET_ACCESS_KEY'] ?? 'test',
    },
  });

  const requestItems: Record<string, WriteRequest[]> = {
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
        {
          PutRequest: {
            Item: {
              transactionType: { S: 'PURCHASE' },
              ruleId: { S: 'RULE-PURCHASE-REJECT-AMOUNT-REGION' },
              decision: { S: FraudDecisionStatuses.REJECT },
              priority: { N: '1' },
              active: { BOOL: true },
              anomaly: { S: 'monto_fuera_rango_y_region_atipica_compra' },
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
              transactionType: { S: 'PURCHASE' },
              ruleId: { S: 'RULE-PURCHASE-REVIEW-AMOUNT-HIGH' },
              decision: { S: FraudDecisionStatuses.REVIEW },
              priority: { N: '2' },
              active: { BOOL: true },
              anomaly: { S: 'monto_elevado_compra_requiere_revision' },
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

  const response = await dynamoClient.send(new BatchWriteItemCommand({
    RequestItems: requestItems,
  }));

  const unprocessedItems = response.UnprocessedItems?.[tableName]?.length ?? 0;
  if (unprocessedItems > 0) {
    console.error(`No se pudieron procesar ${unprocessedItems} items en ${tableName}`);
    process.exit(1);
  }

  console.log(`Reglas de prueba insertadas en tabla ${tableName}`);
}

run().catch(error => {
  console.error('Error insertando reglas de prueba');
  console.error(error);
  process.exit(1);
});
