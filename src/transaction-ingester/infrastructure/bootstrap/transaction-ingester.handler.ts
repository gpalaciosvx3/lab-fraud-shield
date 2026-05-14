import { APIGatewayProxyEventV2, APIGatewayProxyResult } from 'aws-lambda';
import { createLambdaHandler } from '../../../common/bootstrap/lambda.factory';
import { LambdaEventMiddleware } from '../../../common/middleware/lambda-event.middleware';
import { ApiGwExtracted } from '../../../common/middleware/types/lambda-event.types';
import { TransactionIngesterModule } from './transaction-ingester.module';
import { TransactionIngesterController } from '../controller/transaction-ingester.controller';

export const handler = createLambdaHandler<TransactionIngesterController, APIGatewayProxyEventV2, APIGatewayProxyResult>(
  TransactionIngesterModule,
  TransactionIngesterController,
  (ctrl, event) => {
    const extracted = LambdaEventMiddleware.extract(event) as ApiGwExtracted;
    return ctrl.handle(extracted.body);
  },
);
