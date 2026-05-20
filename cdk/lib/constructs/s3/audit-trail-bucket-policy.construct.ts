import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { InfraConstants } from '../../../common/constants/infra.constants';

interface AuditTrailBucketPolicyProps {
  bucket: s3.Bucket;
  auditReaderRole: iam.Role;
}

export class AuditTrailBucketPolicyConstruct extends Construct {
  constructor(scope: Construct, id: string, props: AuditTrailBucketPolicyProps) {
    super(scope, id);

    props.bucket.addToResourcePolicy(new iam.PolicyStatement({
      effect: iam.Effect.DENY,
      principals: [new iam.AnyPrincipal()],
      actions: ['s3:DeleteObject', 's3:DeleteObjectVersion'],
      resources: [props.bucket.arnForObjects(InfraConstants.AUDIT_OBJECT_PATH_PATTERN)],
    }));

    props.bucket.addToResourcePolicy(new iam.PolicyStatement({
      effect: iam.Effect.DENY,
      notPrincipals: [new iam.ArnPrincipal(props.auditReaderRole.roleArn)],
      actions: ['s3:GetObject'],
      resources: [props.bucket.arnForObjects(InfraConstants.AUDIT_OBJECT_PATH_PATTERN)],
    }));
  }
}