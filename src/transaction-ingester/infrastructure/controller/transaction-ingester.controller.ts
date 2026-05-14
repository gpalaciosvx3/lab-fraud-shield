import { Injectable, HttpStatus } from '@nestjs/common';
import { APIGatewayProxyResult } from 'aws-lambda';
import { IngestTransactionUseCase } from '../../application/use-cases/ingest-transaction.usecase';
import { ApiGwHelper } from '../../../common/helpers/api-gw.helper';
import { HandleExecution } from '../../../common/decorator/handle-execution.decorator';

@Injectable()
export class TransactionIngesterController {
  constructor(private readonly useCase: IngestTransactionUseCase) {}

  @HandleExecution('TransactionIngester', ApiGwHelper.error)
  async handle(body: unknown): Promise<APIGatewayProxyResult> {
    return ApiGwHelper.success(HttpStatus.ACCEPTED, await this.useCase.execute(body));
  }
}
