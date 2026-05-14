export const AwsErrorCodes = {
  DYNAMO_CONDITIONAL_CHECK_FAILED: 'ConditionalCheckFailedException',
  KINESIS_THROUGHPUT_EXCEEDED:     'ProvisionedThroughputExceededException',
  KINESIS_RESOURCE_NOT_FOUND:      'ResourceNotFoundException',
} as const;
