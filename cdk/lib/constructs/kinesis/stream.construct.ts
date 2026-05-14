import * as cdk from 'aws-cdk-lib';
import * as kinesis from 'aws-cdk-lib/aws-kinesis';
import { Construct } from 'constructs';
import { InfraConstants } from '../../../common/constants/infra.constants';
import { ResourceConstants } from '../../../common/constants/resource.constants';

export class KinesisStreamConstruct extends Construct {
  readonly stream: kinesis.Stream;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.stream = new kinesis.Stream(this, 'Stream', {
      streamName:      ResourceConstants.KINESIS_STREAM,
      shardCount:      InfraConstants.KINESIS_SHARD_COUNT,
      retentionPeriod: cdk.Duration.days(InfraConstants.KINESIS_RETENTION_DAYS),
      encryption:      kinesis.StreamEncryption.MANAGED,
    });
  }
}
