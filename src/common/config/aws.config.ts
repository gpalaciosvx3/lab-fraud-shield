import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { KinesisClient } from '@aws-sdk/client-kinesis';
import { envConfig } from './env.config';

export const dynamoDbClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: envConfig.awsRegion }));
export const kinesisClient = new KinesisClient({ region: envConfig.awsRegion });
