import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { InfraConstants } from '../../../common/constants/infra.constants';
import { ResourceConstants } from '../../../common/constants/resource.constants';

interface AuditReaderRoleProps {
  bucket: s3.Bucket;
}

export class AuditReaderRoleConstruct extends Construct {
  readonly role: iam.Role;

  constructor(scope: Construct, id: string, props: AuditReaderRoleProps) {
    super(scope, id);

    this.role = new iam.Role(this, 'Role', {
      roleName: ResourceConstants.AUDIT_READER_ROLE,
      assumedBy: new iam.AccountRootPrincipal(),
      inlinePolicies: {
        AuditBucketReadOnly: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: ['s3:GetObject'],
              resources: [props.bucket.arnForObjects(InfraConstants.AUDIT_OBJECT_PATH_PATTERN)],
            }),
            new iam.PolicyStatement({
              actions: ['s3:ListBucket'],
              resources: [props.bucket.bucketArn],
            }),
          ],
        }),
      },
    });
  }
}
