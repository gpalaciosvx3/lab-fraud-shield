import { Injectable, Logger } from '@nestjs/common';
import { StreamTransactionRequestDto } from '../dtos/stream-transaction.request.dto';
import { FraudEvaluatorService } from '../../domain/service/fraud-evaluator.service';
import { ProcessRecordResult } from '../../../common/types/process-record-result.types';
import { KinesisMessage } from '../../../common/middleware/types/lambda-event.types';
import { ValidationException } from '../../../common/errors/custom.exception';
import { ErrorDictionary } from '../../../common/errors/error.dictionary';
import {
  classifyBatchFailure,
  executeChunkedBatch,
  summarizeBatchResults,
} from '../../../common/helpers/batch-processing.helper';
import { FraudEvaluatorConstants } from '../../domain/constants/fraud-evaluator.constants';

@Injectable()
export class EvaluateFraudUseCase {
  private readonly logger = new Logger(EvaluateFraudUseCase.name);

  constructor(private readonly fraudEvaluatorService: FraudEvaluatorService) {}

  async executeBatch(records: KinesisMessage[]): Promise<ProcessRecordResult[]> {
    this.logger.log(`Lote recibido => total: ${records.length}`);

    const results = await executeChunkedBatch(
      records,
      FraudEvaluatorConstants.KINESIS_PROCESS_CHUNK_SIZE,
      record => this.executeOne(record),
      (sequenceNumber, error) => this.classifyFailure(sequenceNumber, error),
    );

    const summary = summarizeBatchResults(results);

    this.logger.log(`Resultado batch => total: ${summary.total} | success: ${summary.success} | discarded: ${summary.discarded} | retryable: ${summary.retryable}`);
    return results;
  }

  private async executeOne(record: KinesisMessage): Promise<void> {
    this.logger.log(`Registro recibido => sequenceNumber: ${record.sequenceNumber}`);
    const parseResult = StreamTransactionRequestDto.safeParse(record.body);

    if (!parseResult.success) throw new ValidationException(ErrorDictionary.VALIDATION_ERROR, parseResult.error.issues);
    const transaction = parseResult.data;

    this.logger.log(`Transaccion deserializada => transactionId: ${transaction.transactionId} | clientId: ${transaction.clientId}`);
    const evaluationResult = await this.fraudEvaluatorService.evaluate(transaction);

    if (evaluationResult.duplicated) {
      this.logger.log(`Registro duplicado descartado => transactionId: ${evaluationResult.transactionId}`);
      return;
    }

    if (!evaluationResult.decision) return;
    this.logger.log(`Resultado => transactionId: ${evaluationResult.decision.transactionId} | decision: ${evaluationResult.decision.decision}`);
  }

  private classifyFailure(sequenceNumber: string, error: unknown): ProcessRecordResult {
    const reason = error instanceof Error ? error.message : String(error);
    this.logger.warn(`Error al procesar registro => sequenceNumber: ${sequenceNumber} | reason: ${reason}`);
    return classifyBatchFailure(sequenceNumber, error);
  }

}
