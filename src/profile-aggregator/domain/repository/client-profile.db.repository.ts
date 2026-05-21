import { ClientProfileEntity } from '../entities/client-profile.entity';

export abstract class ClientProfileDbRepository {
  abstract findByClientId(clientId: string): Promise<ClientProfileEntity | null>;
  abstract create(profile: ClientProfileEntity): Promise<boolean>;
  abstract update(profile: ClientProfileEntity, expectedVersion: number): Promise<boolean>;
}
