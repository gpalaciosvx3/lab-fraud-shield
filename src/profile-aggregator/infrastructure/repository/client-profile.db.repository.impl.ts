import { DynamoClient } from '../../../common/dynamo/dynamo.client';
import { ClientProfileDbRepository } from '../../domain/repository/client-profile.db.repository';
import { ClientProfileEntity } from '../../domain/entities/client-profile.entity';
import { ClientProfile } from '../../domain/types/client-profile.types';

export class ClientProfileDbRepositoryImpl extends ClientProfileDbRepository {
  constructor(
    private readonly tableName: string,
    private readonly dynamoClient: DynamoClient,
  ) {
    super();
  }

  async findByClientId(clientId: string): Promise<ClientProfileEntity | null> {
    const record = await this.dynamoClient.get<ClientProfile>(this.tableName, { clientId });
    if (!record) return null;
    return ClientProfileEntity.fromRecord(record);
  }

  async create(profile: ClientProfileEntity): Promise<boolean> {
    return this.dynamoClient.putIfNotExists(this.tableName, 'clientId', profile.toRecord());
  }

  async update(profile: ClientProfileEntity, expectedVersion: number): Promise<boolean> {
    const record = profile.toRecord();
    const { clientId, ...fields } = record;
    return this.dynamoClient.updateFieldsWithCondition(
      this.tableName,
      { clientId },
      fields,
      { field: 'version', value: expectedVersion },
    );
  }
}
