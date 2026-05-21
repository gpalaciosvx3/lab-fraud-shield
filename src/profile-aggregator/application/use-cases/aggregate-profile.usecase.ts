import { Injectable, Logger } from '@nestjs/common';
import { ProfileAggregatorService } from '../../domain/service/profile-aggregator.service';
import { StreamTransactionRequestDto } from '../dtos/stream-transaction.request.dto';
import { ValidationException } from '../../../common/errors/custom.exception';
import { ErrorDictionary } from '../../../common/errors/error.dictionary';
import { KinesisMessage } from '../../../common/middleware/types/lambda-event.types';
import { ProcessRecordResult } from '../../../common/types/process-record-result.types';
import { ProfileAggregatorConstants } from '../../domain/constants/profile-aggregator.constants';
import {
  classifyBatchFailure,
  executeChunkedBatch,
  summarizeBatchResults,
} from '../../../common/helpers/batch-processing.helper';

@Injectable()
export class AggregateProfileUseCase {
  private readonly logger = new Logger(AggregateProfileUseCase.name);

  constructor(private readonly profileAggregatorService: ProfileAggregatorService) {}

  async executeBatch(records: KinesisMessage[]): Promise<ProcessRecordResult[]> {
    this.logger.log(`Lote recibido => total: ${records.length}`);

    const results = await executeChunkedBatch(
      records,
      ProfileAggregatorConstants.KINESIS_PROCESS_CHUNK_SIZE,
      record => this.executeOne(record),
      (sequenceNumber, error) => this.classifyFailure(sequenceNumber, error),
    );

    const summary = summarizeBatchResults(results);

    this.logger.log(`Resultado batch => total: ${summary.total} | success: ${summary.success} | discarded: ${summary.discarded} | retryable: ${summary.retryable}`);
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

  private classifyFailure(sequenceNumber: string, error: unknown): ProcessRecordResult {
    const reason = error instanceof Error ? error.message : String(error);
    this.logger.warn(`Error al procesar registro => sequenceNumber: ${sequenceNumber} | reason: ${reason}`);

    if (error instanceof ValidationException) {
      this.logger.error(`Registro descartado por validación => sequenceNumber: ${sequenceNumber}`);
    }

    return classifyBatchFailure(sequenceNumber, error);
  }

}
