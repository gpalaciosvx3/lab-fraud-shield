export type ApiGwExtracted = {
  source: 'api-gw';
  body: unknown;
  pathParameters: Record<string, string>;
  queryStringParameters: Record<string, string>;
};

export type KinesisMessage = {
  body: unknown;
  partitionKey: string;
  sequenceNumber: string;
};

export type KinesisExtracted = {
  source: 'kinesis';
  records: KinesisMessage[];
};

export type LambdaExtracted = ApiGwExtracted | KinesisExtracted;
