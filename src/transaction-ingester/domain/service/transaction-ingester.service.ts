import { Injectable, Logger } from '@nestjs/common';
import { KinesisRepository } from '../repository/kinesis.repository';
import { TransactionPayload } from '../types/transaction.types';

@Injectable()
export class TransactionIngesterService {
  private readonly logger = new Logger(TransactionIngesterService.name);

  constructor(private readonly kinesisRepository: KinesisRepository) {}

  async ingest(tx: TransactionPayload): Promise<void> {
    this.logger.log(`[PASO 1] Enviando transacción al stream => transactionId: ${tx.transactionId} | clientId: ${tx.clientId}`);
    await this.kinesisRepository.putRecord(tx);
  }
}
