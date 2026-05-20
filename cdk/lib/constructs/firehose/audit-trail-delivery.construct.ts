import * as firehose from 'aws-cdk-lib/aws-kinesisfirehose';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kinesis from 'aws-cdk-lib/aws-kinesis';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { InfraConstants } from '../../../common/constants/infra.constants';
import { ResourceConstants } from '../../../common/constants/resource.constants';

interface AuditTrailDeliveryProps {
  stream: kinesis.Stream;
  bucket: s3.Bucket;
  role: iam.Role;
}

export class AuditTrailDeliveryConstruct extends Construct {
  readonly deliveryStream: firehose.CfnDeliveryStream;

  constructor(scope: Construct, id: string, props: AuditTrailDeliveryProps) {
    super(scope, id);

    this.deliveryStream = new firehose.CfnDeliveryStream(this, 'DeliveryStream', {
      deliveryStreamName: ResourceConstants.AUDIT_FIREHOSE,
      deliveryStreamType: 'KinesisStreamAsSource',
      kinesisStreamSourceConfiguration: {
        kinesisStreamArn: props.stream.streamArn,
        roleArn: props.role.roleArn,
      },
      extendedS3DestinationConfiguration: {
        bucketArn: props.bucket.bucketArn,
        roleArn: props.role.roleArn,
        bufferingHints: {
          intervalInSeconds: InfraConstants.AUDIT_FIREHOSE_BUFFER_SECONDS,
          sizeInMBs: InfraConstants.AUDIT_FIREHOSE_BUFFER_MB,
        },
        compressionFormat: 'UNCOMPRESSED',
        dynamicPartitioningConfiguration: {
          enabled: true,
        },
        prefix: InfraConstants.AUDIT_PARTITION_PREFIX,
        errorOutputPrefix: 'errors/!{firehose:error-output-type}/',
        processingConfiguration: {
          enabled: true,
          processors: [
            {
              type: 'MetadataExtraction',
              parameters: [
                {
                  parameterName: 'MetadataExtractionQuery',
                  parameterValue: '{clientId:(.clientId // .client_id // .customerId // .customer_id // "unknown")}',
                },
                {
                  parameterName: 'JsonParsingEngine',
                  parameterValue: 'JQ-1.6',
                },
              ],
            },
          ],
        },
      },
    });
  }
}
