import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as kinesis from 'aws-cdk-lib/aws-kinesis';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import * as path from 'path';
import { LambdaLogGroupConstruct } from '../../cloudwatch/lambda-log-group.construct';
import { lambdaBundling } from '../shared/bundling.config';
import { InfraConstants } from '../../../../common/constants/infra.constants';
import { ResourceConstants } from '../../../../common/constants/resource.constants';

interface ProfileAggregatorFnProps {
  stream: kinesis.Stream;
  profileTable: dynamodb.Table;
}

export class ProfileAggregatorFnConstruct extends Construct {
  readonly fn: NodejsFunction;

  constructor(scope: Construct, id: string, props: ProfileAggregatorFnProps) {
    super(scope, id);

    const { logGroup } = new LambdaLogGroupConstruct(this, 'LogGroup', {
      functionName: ResourceConstants.LAMBDA_PROFILE_AGGREGATOR,
    });

    this.fn = new NodejsFunction(this, 'Fn', {
      functionName: ResourceConstants.LAMBDA_PROFILE_AGGREGATOR,
      description: 'Consume eventos de Kinesis y actualiza perfil estadistico por cliente',
      logGroup,
      entry: path.join(__dirname, '../../../../../src/profile-aggregator/infrastructure/bootstrap/profile-aggregator.handler.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(InfraConstants.LAMBDA_TIMEOUT_DEFAULT_SECONDS),
      memorySize: InfraConstants.LAMBDA_MEMORY_DEFAULT_MB,
      bundling: lambdaBundling,
      environment: {
        PROFILE_AGGREGATOR_TABLE_NAME: props.profileTable.tableName,
      },
    });

    this.fn.addEventSourceMapping('KinesisSource', {
      eventSourceArn: props.stream.streamArn,
      startingPosition: lambda.StartingPosition.TRIM_HORIZON,
      bisectBatchOnError: true,
      reportBatchItemFailures: true,
    });

    props.stream.grantRead(this.fn);
    props.profileTable.grantReadWriteData(this.fn);
  }
}
