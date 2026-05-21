import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as kinesis from 'aws-cdk-lib/aws-kinesis';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';
import * as path from 'path';
import { LambdaLogGroupConstruct } from '../../cloudwatch/lambda-log-group.construct';
import { lambdaBundling } from '../shared/bundling.config';
import { InfraConstants } from '../../../../common/constants/infra.constants';
import { ResourceConstants } from '../../../../common/constants/resource.constants';

interface FraudEvaluatorFnProps {
  stream: kinesis.Stream;
  profileTable: dynamodb.Table;
  rulesTable: dynamodb.Table;
  decisionsTable: dynamodb.Table;
  alertsTopic: sns.Topic;
}

export class FraudEvaluatorFnConstruct extends Construct {
  readonly fn: NodejsFunction;

  constructor(scope: Construct, id: string, props: FraudEvaluatorFnProps) {
    super(scope, id);

    const { logGroup } = new LambdaLogGroupConstruct(this, 'LogGroup', {
      functionName: ResourceConstants.LAMBDA_FRAUD_EVALUATOR,
    });

    this.fn = new NodejsFunction(this, 'Fn', {
      functionName: ResourceConstants.LAMBDA_FRAUD_EVALUATOR,
      description: 'Evalua transacciones contra reglas y perfil para emitir decision antifraude',
      logGroup,
      entry: path.join(__dirname, '../../../../../src/fraud-evaluator/infrastructure/bootstrap/fraud-evaluator.handler.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(InfraConstants.LAMBDA_TIMEOUT_DEFAULT_SECONDS),
      memorySize: InfraConstants.LAMBDA_MEMORY_DEFAULT_MB,
      bundling: lambdaBundling,
      environment: {
        PROFILE_AGGREGATOR_TABLE_NAME: props.profileTable.tableName,
        FRAUD_RULES_TABLE_NAME: props.rulesTable.tableName,
        FRAUD_DECISIONS_TABLE_NAME: props.decisionsTable.tableName,
        FRAUD_ALERTS_TOPIC_ARN: props.alertsTopic.topicArn,
      },
    });

    this.fn.addEventSourceMapping('KinesisSource', {
      eventSourceArn: props.stream.streamArn,
      startingPosition: lambda.StartingPosition.TRIM_HORIZON,
      bisectBatchOnError: true,
      reportBatchItemFailures: true,
      batchSize: 100,
    });

    props.stream.grantRead(this.fn);
    props.profileTable.grant(this.fn, 'dynamodb:GetItem');
    props.rulesTable.grant(this.fn, 'dynamodb:Query');
    props.decisionsTable.grant(this.fn, 'dynamodb:GetItem', 'dynamodb:PutItem');
    props.alertsTopic.grantPublish(this.fn);
  }
}