import { Injectable, Logger } from '@nestjs/common';
import { ProfileAggregatorService } from '../../domain/service/profile-aggregator.service';
import { StreamTransactionRequestDto } from '../dtos/stream-transaction.request.dto';
import { CustomException, ValidationException } from '../../../common/errors/custom.exception';
import { ErrorDictionary } from '../../../common/errors/error.dictionary';
import { KinesisMessage } from '../../../common/middleware/types/lambda-event.types';
import { ProcessRecordResult } from '../types/process-record-result.types';
import { ProfileAggregatorConstants } from '../../domain/constants/profile-aggregator.constants';

@Injectable()
export class AggregateProfileUseCase {
  private readonly logger = new Logger(AggregateProfileUseCase.name);

  constructor(private readonly profileAggregatorService: ProfileAggregatorService) {}

  async executeBatch(records: KinesisMessage[]): Promise<ProcessRecordResult[]> {
    this.logger.log(`Lote recibido => total: ${records.length}`);

    const results: ProcessRecordResult[] = [];
    for (const chunk of this.chunk(records, ProfileAggregatorConstants.KINESIS_PROCESS_CHUNK_SIZE)) {
      const settled = await Promise.allSettled(chunk.map(record => this.executeOne(record)));
      settled.forEach((outcome, idx) => results.push(this.toResult(chunk[idx], outcome)));
    }

    const success = results.filter(result => !result.retry && !result.error).length;
    const discarded = results.filter(result => !result.retry && result.error).length;
    const retryable = results.filter(result => result.retry).length;

    this.logger.log(`Resultado batch => total: ${results.length} | success: ${success} | discarded: ${discarded} | retryable: ${retryable}`);
    return results;
  }

  private async executeOne(record: KinesisMessage): Promise<void> {
    this.logger.log(`Registro recibido: ${JSON.stringify(record.body)}`);

    const result = StreamTransactionRequestDto.safeParse(record.body);

    if (!result.success) throw new ValidationException(ErrorDictionary.VALIDATION_ERROR, result.error.issues);
    this.logger.log(`Transacción deserializada => transactionId: ${result.data.transactionId} | clientId: ${result.data.clientId}`);

    await this.profileAggregatorService.aggregateWithRetry(result.data);
    this.logger.log(`Resultado => transactionId: ${result.data.transactionId} perfil actualizado`);
  }

  private toResult(record: KinesisMessage, outcome: PromiseSettledResult<void>): ProcessRecordResult {
    if (outcome.status === 'fulfilled') {
      return { sequenceNumber: record.sequenceNumber, retry: false };
    }
    return this.classifyFailure(record.sequenceNumber, outcome.reason);
  }

  private classifyFailure(sequenceNumber: string, error: unknown): ProcessRecordResult {
    const reason = error instanceof Error ? error.message : String(error);
    this.logger.warn(`Error al procesar registro => sequenceNumber: ${sequenceNumber} | reason: ${reason}`);

    if (error instanceof ValidationException) {
      this.logger.error(`Registro descartado por validación => sequenceNumber: ${sequenceNumber}`);
      return { sequenceNumber, retry: false, error };
    }

    if (error instanceof CustomException) {
      return { sequenceNumber, retry: true, error };
    }

    return { sequenceNumber, retry: true };
  }

  private *chunk<T>(items: T[], size: number): Generator<T[]> {
    for (let index = 0; index < items.length; index += size) {
      yield items.slice(index, index + size);
    }
  }
}
