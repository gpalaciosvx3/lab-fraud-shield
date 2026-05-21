import { Injectable } from '@nestjs/common';
import { AggregateProfileUseCase } from '../../application/use-cases/aggregate-profile.usecase';
import { HandleExecution } from '../../../common/decorator/handle-execution.decorator';
import { KinesisMessage } from '../../../common/middleware/types/lambda-event.types';
import { ProcessRecordResult } from '../../application/types/process-record-result.types';

@Injectable()
export class ProfileAggregatorController {
  constructor(private readonly useCase: AggregateProfileUseCase) {}

  @HandleExecution('ProfileAggregator')
  async handle(records: KinesisMessage[]): Promise<ProcessRecordResult[]> {
    return this.useCase.executeBatch(records);
  }
}
