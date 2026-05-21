import { Injectable } from '@nestjs/common';
import { HandleExecution } from '../../../common/decorator/handle-execution.decorator';
import { EvaluateFraudUseCase } from '../../application/use-cases/evaluate-fraud.usecase';
import { ProcessRecordResult } from '../../../common/types/process-record-result.types';
import { KinesisMessage } from '../../../common/middleware/types/lambda-event.types';

@Injectable()
export class FraudEvaluatorController {
  constructor(private readonly useCase: EvaluateFraudUseCase) {}

  @HandleExecution('FraudEvaluator')
  async handle(records: KinesisMessage[]): Promise<ProcessRecordResult[]> {
    return this.useCase.executeBatch(records);
  }
}
