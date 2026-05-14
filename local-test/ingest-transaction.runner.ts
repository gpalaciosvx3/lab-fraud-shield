import 'dotenv/config';
import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { handler } from '../src/transaction-ingester/infrastructure/bootstrap/transaction-ingester.handler';

const payload = {
  transactionId: process.env['TEST_TX_ID'],
  clientId:      process.env['TEST_CLIENT_ID'],
  amount:        Number(process.env['TEST_AMOUNT']),
  region:        process.env['TEST_REGION'],
  type:          process.env['TEST_TX_TYPE'],
  timestamp:     process.env['TEST_TIMESTAMP'],
};

const event: APIGatewayProxyEventV2 = {
  version: '2.0',
  routeKey: 'POST /v1/transactions',
  rawPath: '/v1/transactions',
  rawQueryString: '',
  headers: { 'content-type': 'application/json' },
  requestContext: {
    accountId: '000000000000',
    apiId: 'local',
    domainName: 'localhost',
    domainPrefix: 'local',
    http: { method: 'POST', path: '/v1/transactions', protocol: 'HTTP/1.1', sourceIp: '127.0.0.1', userAgent: 'local-runner' },
    requestId: 'local-req-tx',
    routeKey: 'POST /v1/transactions',
    stage: '$default',
    time: new Date().toISOString(),
    timeEpoch: Date.now(),
  },
  body: JSON.stringify(payload),
  isBase64Encoded: false,
};

handler(event).then(result => {
  if (typeof result === 'object') {
    console.log('status:', result.statusCode);
    console.log('body:  ', JSON.parse(result.body as string));
  }
}).catch(console.error);
