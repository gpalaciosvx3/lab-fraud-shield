import { DynamoClient } from '../../../common/dynamo/dynamo.client';
import { FraudRuleDbRepository } from '../../domain/repository/fraud-rule.db.repository';
import { FraudRule } from '../../domain/types/fraud-rule.types';

export class FraudRuleDbRepositoryImpl extends FraudRuleDbRepository {
  constructor(
    private readonly tableName: string,
    private readonly dynamoClient: DynamoClient,
  ) {
    super();
  }

  async findActiveByTransactionType(transactionType: string): Promise<FraudRule[]> {
    const rules = await this.dynamoClient.query<FraudRule>(this.tableName, {
      keyCondition: '#transactionType = :transactionType',
      attributeNames: {
        '#transactionType': 'transactionType',
      },
      attributeValues: {
        ':transactionType': transactionType,
      },
    });

    return rules.filter(rule => rule.active);
  }
}
