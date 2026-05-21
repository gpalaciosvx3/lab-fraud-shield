import { BatchWriteItemCommand, DynamoDBClient, WriteRequest } from '@aws-sdk/client-dynamodb';
import { InfraConstants } from '../cdk/common/constants/infra.constants';
import { ResourceConstants } from '../cdk/common/constants/resource.constants';

async function run(): Promise<void> {
  const tableName = process.env['PROFILE_AGGREGATOR_TABLE_NAME'] ?? ResourceConstants.PROFILE_AGGREGATOR_TABLE;
  const awsRegion = process.env['AWS_REGION'] ?? 'us-east-1';
  const localstackEndpoint = process.env['LOCALSTACK_ENDPOINT'] ?? 'http://localhost:4566';

  const dynamoClient = new DynamoDBClient({
    region: awsRegion,
    endpoint: localstackEndpoint,
    credentials: {
      accessKeyId: process.env['AWS_ACCESS_KEY_ID'] ?? 'test',
      secretAccessKey: process.env['AWS_SECRET_ACCESS_KEY'] ?? 'test',
    },
  });

  const requestItems: Record<string, WriteRequest[]> = {
    [tableName]: [
      {
        PutRequest: {
          Item: {
            clientId: { S: InfraConstants.RISK_ALERT_CLIENT_ID_CLIENT_A },
            averageAmount: { N: '1200' },
            habitualRegion: { S: 'PE-LIM' },
            frequency30d: { N: '12' },
            lastUpdatedAt: { S: '2026-05-21T00:00:00.000Z' },
            processedTransactions: { N: '45' },
            validAmountWindow: { L: [{ N: '900' }, { N: '1100' }, { N: '1200' }, { N: '1300' }] },
            regionWindow: { L: [{ S: 'PE-LIM' }, { S: 'PE-LIM' }, { S: 'PE-LIM' }] },
            frequencyWindow: { L: [{ S: '2026-05-20' }, { S: '2026-05-19' }, { S: '2026-05-18' }] },
            version: { N: '1' },
          },
        },
      },
      {
        PutRequest: {
          Item: {
            clientId: { S: InfraConstants.RISK_ALERT_CLIENT_ID_CLIENT_B },
            averageAmount: { N: '800' },
            habitualRegion: { S: 'PE-AQP' },
            frequency30d: { N: '8' },
            lastUpdatedAt: { S: '2026-05-21T00:00:00.000Z' },
            processedTransactions: { N: '30' },
            validAmountWindow: { L: [{ N: '500' }, { N: '700' }, { N: '800' }, { N: '900' }] },
            regionWindow: { L: [{ S: 'PE-AQP' }, { S: 'PE-AQP' }, { S: 'PE-AQP' }] },
            frequencyWindow: { L: [{ S: '2026-05-20' }, { S: '2026-05-19' }, { S: '2026-05-18' }] },
            version: { N: '1' },
          },
        },
      },
    ],
  };

  const response = await dynamoClient.send(new BatchWriteItemCommand({
    RequestItems: requestItems,
  }));

  const unprocessedItems = response.UnprocessedItems?.[tableName]?.length ?? 0;
  if (unprocessedItems > 0) {
    console.error(`No se pudieron procesar ${unprocessedItems} items en ${tableName}`);
    process.exit(1);
  }

  console.log(`Perfiles de prueba insertados en tabla ${tableName}`);
}

run().catch(error => {
  console.error('Error insertando perfiles de prueba');
  console.error(error);
  process.exit(1);
});
