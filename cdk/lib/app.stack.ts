import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { StageConfig } from '../common/types/stage-config.types';
import { WorkerRoleConstruct } from './constructs/iam/worker-role.construct';
import { TxIngesterFnConstruct } from './constructs/lambda/transaction-ingester/transaction-ingester-fn.construct';
import { KinesisStreamConstruct } from './constructs/kinesis/stream.construct';
import { HttpApiConstruct } from './constructs/api-gateway/http-api.construct';

interface AppStackProps extends cdk.StackProps {
  config: StageConfig;
}

export class AppStack extends cdk.Stack {
  readonly kinesisStream: KinesisStreamConstruct;

  constructor(scope: Construct, id: string, props: AppStackProps) {
    super(scope, id, props);

    new WorkerRoleConstruct(this, 'WorkerRole');

    this.kinesisStream = new KinesisStreamConstruct(this, 'KinesisStream');

    const txIngesterFn = new TxIngesterFnConstruct(this, 'TxIngesterFn', {
      stream: this.kinesisStream.stream,
    });

    const api = new HttpApiConstruct(this, 'HttpApi', {
      txIngesterFn: txIngesterFn.fn,
      stage:        props.config.stage,
    });

    new cdk.CfnOutput(this, 'ApiUrl',        { value: api.url,                                  description: 'API Gateway URL' });
    new cdk.CfnOutput(this, 'StreamArn',     { value: this.kinesisStream.stream.streamArn,      description: 'Kinesis Stream ARN' });
    new cdk.CfnOutput(this, 'StreamName',    { value: this.kinesisStream.stream.streamName,     description: 'Kinesis Stream Name' });
  }
}
