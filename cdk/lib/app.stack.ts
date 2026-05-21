import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { WorkerRoleConstruct } from './constructs/iam/worker-role.construct';
import { TxIngesterFnConstruct } from './constructs/lambda/transaction-ingester/transaction-ingester-fn.construct';
import { KinesisStreamConstruct } from './constructs/kinesis/stream.construct';
import { HttpApiConstruct } from './constructs/api-gateway/http-api.construct';
import { AuditTrailBucketConstruct } from './constructs/s3/audit-trail-bucket.construct';
import { AuditTrailBucketPolicyConstruct } from './constructs/s3/audit-trail-bucket-policy.construct';
import { AuditDeliveryRoleConstruct } from './constructs/iam/audit-delivery-role.construct';
import { AuditReaderRoleConstruct } from './constructs/iam/audit-reader-role.construct';
import { AuditTrailDeliveryConstruct } from './constructs/firehose/audit-trail-delivery.construct';
import { ProfileAggregatorTableConstruct } from './constructs/dynamo/profile-aggregator-table.construct';
import { ProfileAggregatorFnConstruct } from './constructs/lambda/profile-aggregator/profile-aggregator-fn.construct';

export class AppStack extends cdk.Stack {
  readonly kinesisStream: KinesisStreamConstruct;

  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    new WorkerRoleConstruct(this, 'WorkerRole');

    this.kinesisStream = new KinesisStreamConstruct(this, 'KinesisStream');

    const auditTrailBucket = new AuditTrailBucketConstruct(this, 'AuditTrailBucket');

    const auditDeliveryRole = new AuditDeliveryRoleConstruct(this, 'AuditDeliveryRole', {
      stream: this.kinesisStream.stream,
      bucket: auditTrailBucket.bucket,
    });

    const auditReaderRole = new AuditReaderRoleConstruct(this, 'AuditReaderRole', {
      bucket: auditTrailBucket.bucket,
    });

    new AuditTrailBucketPolicyConstruct(this, 'AuditTrailBucketPolicy', {
      bucket: auditTrailBucket.bucket,
      auditReaderRole: auditReaderRole.role,
    });

    const auditTrailDelivery = new AuditTrailDeliveryConstruct(this, 'AuditTrailDelivery', {
      stream: this.kinesisStream.stream,
      bucket: auditTrailBucket.bucket,
      role: auditDeliveryRole.role,
    });

    const txIngesterFn = new TxIngesterFnConstruct(this, 'TxIngesterFn', {
      stream: this.kinesisStream.stream,
    });

    const profileAggregatorTable = new ProfileAggregatorTableConstruct(this, 'ProfileAggregatorTable');

    new ProfileAggregatorFnConstruct(this, 'ProfileAggregatorFn', {
      stream: this.kinesisStream.stream,
      profileTable: profileAggregatorTable.table,
    });

    const api = new HttpApiConstruct(this, 'HttpApi', {
      txIngesterFn: txIngesterFn.fn,
    });

    new cdk.CfnOutput(this, 'ApiUrl',        { value: api.url,                                  description: 'API Gateway URL' });
    new cdk.CfnOutput(this, 'StreamArn',     { value: this.kinesisStream.stream.streamArn,      description: 'Kinesis Stream ARN' });
    new cdk.CfnOutput(this, 'StreamName',    { value: this.kinesisStream.stream.streamName,     description: 'Kinesis Stream Name' });
    new cdk.CfnOutput(this, 'AuditBucket',   { value: auditTrailBucket.bucket.bucketName,       description: 'S3 Bucket Name for immutable audit trail' });
    new cdk.CfnOutput(this, 'AuditFirehose', { value: auditTrailDelivery.deliveryStream.ref,    description: 'Firehose Delivery Stream Name for audit trail' });
    new cdk.CfnOutput(this, 'ProfileTableName', { value: profileAggregatorTable.table.tableName, description: 'DynamoDB table name for client profile aggregation' });
  }
}
