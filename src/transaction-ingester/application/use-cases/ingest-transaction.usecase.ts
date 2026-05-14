import { Injectable, Logger } from '@nestjs/common';
import { TransactionIngesterService } from '../../domain/service/transaction-ingester.service';
import { TransactionRequestDto } from '../dtos/transaction.request.dto';
import { IngestResult } from '../../domain/types/transaction.types';
import { ValidationException } from '../../../common/errors/custom.exception';
import { ErrorDictionary } from '../../../common/errors/error.dictionary';

@Injectable()
export class IngestTransactionUseCase {
  private readonly logger = new Logger(IngestTransactionUseCase.name);

  constructor(private readonly service: TransactionIngesterService) {}

  async execute(raw: unknown): Promise<IngestResult> {
    this.logger.log(`Body recibido: ${JSON.stringify(raw)}`);
    const result = TransactionRequestDto.safeParse(raw);

    if (!result.success) throw new ValidationException(ErrorDictionary.VALIDATION_ERROR, result.error.issues);
    this.logger.log(`Transacción validada => transactionId: ${result.data.transactionId}`);

    await this.service.ingest(result.data);
    this.logger.log(`Resultado => transactionId: ${result.data.transactionId} aceptada`);
    return { transactionId: result.data.transactionId, status: 'ACCEPTED' };
  }
}
