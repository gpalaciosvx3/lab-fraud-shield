import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import { ResourceConstants } from '../../../common/constants/resource.constants';

export class ProfileAggregatorTableConstruct extends Construct {
  readonly table: dynamodb.Table;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.table = new dynamodb.Table(this, 'Table', {
      tableName: ResourceConstants.PROFILE_AGGREGATOR_TABLE,
      partitionKey: {
        name: 'clientId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
  }
}
