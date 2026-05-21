import { KinesisStreamBatchResponse, KinesisStreamEvent } from 'aws-lambda';
import { createLambdaHandler } from '../../../common/bootstrap/lambda.factory';
import { LambdaEventMiddleware } from '../../../common/middleware/lambda-event.middleware';
import { KinesisExtracted } from '../../../common/middleware/types/lambda-event.types';
import { FraudEvaluatorController } from '../controller/fraud-evaluator.controller';
import { FraudEvaluatorModule } from './fraud-evaluator.module';

export const handler = createLambdaHandler<FraudEvaluatorController, KinesisStreamEvent, KinesisStreamBatchResponse>(
  FraudEvaluatorModule,
  FraudEvaluatorController,
  async (controller, event) => {
    const extracted = LambdaEventMiddleware.extract(event) as KinesisExtracted;
    const results = await controller.handle(extracted.records);
    const failingSequenceNumbers = new Set(results.filter(result => result.retry).map(result => result.sequenceNumber));

    return {
      batchItemFailures: Array.from(failingSequenceNumbers, itemIdentifier => ({ itemIdentifier })),
    };
  },
);
