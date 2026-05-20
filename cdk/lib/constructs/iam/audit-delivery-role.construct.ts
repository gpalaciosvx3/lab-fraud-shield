import * as iam from 'aws-cdk-lib/aws-iam';
import * as kinesis from 'aws-cdk-lib/aws-kinesis';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { InfraConstants } from '../../../common/constants/infra.constants';
import { ResourceConstants } from '../../../common/constants/resource.constants';

interface AuditDeliveryRoleProps {
  stream: kinesis.Stream;
  bucket: s3.Bucket;
}

export class AuditDeliveryRoleConstruct extends Construct {
  readonly role: iam.Role;

  constructor(scope: Construct, id: string, props: AuditDeliveryRoleProps) {
    super(scope, id);

    this.role = new iam.Role(this, 'Role', {
      roleName: ResourceConstants.AUDIT_DELIVERY_ROLE,
      assumedBy: new iam.ServicePrincipal('firehose.amazonaws.com'),
      inlinePolicies: {
        AuditBucketWriteOnly: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: ['s3:AbortMultipartUpload', 's3:GetBucketLocation', 's3:ListBucket', 's3:ListBucketMultipartUploads'],
              resources: [props.bucket.bucketArn],
            }),
            new iam.PolicyStatement({
              actions: ['s3:PutObject'],
              resources: [props.bucket.arnForObjects(InfraConstants.AUDIT_OBJECT_PATH_PATTERN)],
            }),
          ],
        }),
      },
    });

    props.stream.grantRead(this.role);
  }
}
