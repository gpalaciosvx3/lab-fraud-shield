import { spawnSync } from 'child_process';
import { InfraConstants } from '../cdk/common/constants/infra.constants';
import { ResourceConstants } from '../cdk/common/constants/resource.constants';

const tableName = process.env['PROFILE_AGGREGATOR_TABLE_NAME'] ?? ResourceConstants.PROFILE_AGGREGATOR_TABLE;

const requestItems = {
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

const execution = spawnSync(
  'awslocal',
  ['dynamodb', 'batch-write-item', '--request-items', JSON.stringify(requestItems)],
  { stdio: 'inherit' },
);

if (execution.status !== 0) process.exit(execution.status ?? 1);

console.log(`Perfiles de prueba insertados en tabla ${tableName}`);
