import { DynamoClient } from '../../../common/dynamo/dynamo.client';
import { ClientProfileDbRepository } from '../../domain/repository/client-profile.db.repository';
import { ClientProfile } from '../../domain/types/client-profile.types';

export class ClientProfileDbRepositoryImpl extends ClientProfileDbRepository {
  constructor(
    private readonly tableName: string,
    private readonly dynamoClient: DynamoClient,
  ) {
    super();
  }

  async findByClientId(clientId: string): Promise<ClientProfile | null> {
    return this.dynamoClient.get<ClientProfile>(this.tableName, { clientId });
  }
}
