import { ClientProfile } from '../types/client-profile.types';

export abstract class ClientProfileDbRepository {
  abstract findByClientId(clientId: string): Promise<ClientProfile | null>;
}
