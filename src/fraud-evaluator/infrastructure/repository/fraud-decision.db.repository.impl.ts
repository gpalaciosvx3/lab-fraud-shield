import { DynamoClient } from '../../../common/dynamo/dynamo.client';
import { FraudDecisionDbRepository } from '../../domain/repository/fraud-decision.db.repository';
import { FraudDecisionRecord } from '../../domain/types/fraud-decision.types';

export class FraudDecisionDbRepositoryImpl extends FraudDecisionDbRepository {
  constructor(
    private readonly tableName: string,
    private readonly dynamoClient: DynamoClient,
  ) {
    super();
  }

  async findByTransactionId(transactionId: string): Promise<FraudDecisionRecord | null> {
    return this.dynamoClient.get<FraudDecisionRecord>(this.tableName, { transactionId });
  }

  async saveIfAbsent(decision: FraudDecisionRecord): Promise<boolean> {
    return this.dynamoClient.putIfNotExists(this.tableName, 'transactionId', decision);
  }
}
