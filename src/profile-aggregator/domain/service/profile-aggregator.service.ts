import { Injectable, Logger } from '@nestjs/common';
import { ClientProfileDbRepository } from '../repository/client-profile.db.repository';
import { StreamTransactionEvent } from '../types/transaction-event.types';
import { ProfileAggregatorConfig } from '../types/profile-aggregator-config.types';
import { ClientProfileEntity } from '../entities/client-profile.entity';
import { ProfileAggregatorConstants } from '../constants/profile-aggregator.constants';
import { CustomException } from '../../../common/errors/custom.exception';
import { ErrorDictionary } from '../../../common/errors/error.dictionary';

@Injectable()
export class ProfileAggregatorService {
  private readonly logger = new Logger(ProfileAggregatorService.name);

  constructor(
    private readonly clientProfileRepository: ClientProfileDbRepository,
    private readonly config: ProfileAggregatorConfig,
  ) {}

  async aggregateWithRetry(transaction: StreamTransactionEvent, attempt = 0): Promise<void> {
    if (attempt >= ProfileAggregatorConstants.MAX_CONCURRENCY_RETRIES) {
      throw new CustomException(ErrorDictionary.PROFILE_WRITE_CONFLICT, transaction.clientId);
    }

    this.logger.log(`[PASO 1] Obteniendo perfil actual => transactionId: ${transaction.transactionId} | clientId: ${transaction.clientId}`);
    const currentProfile = await this.clientProfileRepository.findByClientId(transaction.clientId);

    if (!currentProfile) return this.createProfile(transaction, attempt);
    return this.updateProfile(currentProfile, transaction, attempt);
  }

  private async createProfile(transaction: StreamTransactionEvent, attempt: number): Promise<void> {
    this.logger.log(`[PASO 1.b] Creando perfil nuevo de forma atómica => clientId: ${transaction.clientId}`);
    const wasCreated = await this.clientProfileRepository.create(ClientProfileEntity.createNew(transaction));
    if (wasCreated) return;

    this.logger.log(`[PASO 1.c] Reintentando creación por concurrencia => clientId: ${transaction.clientId}`);
    return this.aggregateWithRetry(transaction, attempt + 1);
  }

  private async updateProfile(
    currentProfile: ClientProfileEntity,
    transaction: StreamTransactionEvent,
    attempt: number,
  ): Promise<void> {
    this.logger.log(`[PASO 2] Recalculando perfil con nueva transacción => transactionId: ${transaction.transactionId} | clientId: ${transaction.clientId}`);
    const updatedProfile = currentProfile.updateWithTransaction(transaction, this.config);

    this.logger.log(`[PASO 3] Persistiendo perfil actualizado => ${JSON.stringify(updatedProfile.toRecord())}`);
    const wasUpdated = await this.clientProfileRepository.update(updatedProfile, currentProfile.version);
    if (wasUpdated) return;

    this.logger.log(`[PASO 4] Reintentando actualización por concurrencia => clientId: ${transaction.clientId}`);
    return this.aggregateWithRetry(transaction, attempt + 1);
  }
}
