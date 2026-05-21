import { APIGatewayProxyEvent, APIGatewayProxyEventV2, KinesisStreamEvent } from 'aws-lambda';
import { LambdaExtracted } from './types/lambda-event.types';

export class LambdaEventMiddleware {
  static extract(event: unknown): LambdaExtracted {
    if (LambdaEventMiddleware.isApiGwV2(event)) {
      const e = event as APIGatewayProxyEventV2;
      return {
        source: 'api-gw',
        body: JSON.parse(e.body ?? '{}'),
        pathParameters: (e.pathParameters ?? {}) as Record<string, string>,
        queryStringParameters: (e.queryStringParameters ?? {}) as Record<string, string>,
      };
    }

    if (LambdaEventMiddleware.isApiGwV1(event)) {
      const e = event as APIGatewayProxyEvent;
      return {
        source: 'api-gw',
        body: JSON.parse(e.body ?? '{}'),
        pathParameters: (e.pathParameters ?? {}) as Record<string, string>,
        queryStringParameters: (e.queryStringParameters ?? {}) as Record<string, string>,
      };
    }

    if (LambdaEventMiddleware.isKinesis(event)) {
      const e = event as KinesisStreamEvent;
      return {
        source: 'kinesis',
        records: e.Records.map(r => ({
          body: JSON.parse(Buffer.from(r.kinesis.data, 'base64').toString('utf-8')),
          partitionKey: r.kinesis.partitionKey,
          sequenceNumber: r.kinesis.sequenceNumber,
        })),
      };
    }

    throw new Error(`Evento no reconocido`);
  }

  private static isApiGwV2(event: unknown): boolean {
    const e = event as Record<string, unknown>;
    return (
      typeof e === 'object' &&
      e !== null &&
      typeof e['requestContext'] === 'object' &&
      e['requestContext'] !== null &&
      'http' in (e['requestContext'] as object)
    );
  }

  private static isApiGwV1(event: unknown): boolean {
    const e = event as Record<string, unknown>;
    return (
      typeof e === 'object' &&
      e !== null &&
      typeof e['requestContext'] === 'object' &&
      e['requestContext'] !== null &&
      'httpMethod' in (e['requestContext'] as object)
    );
  }

  private static isKinesis(event: unknown): boolean {
    const e = event as Record<string, unknown>;
    return (
      typeof e === 'object' &&
      e !== null &&
      Array.isArray(e['Records']) &&
      (e['Records'] as unknown[]).length > 0 &&
      typeof (e['Records'] as Record<string, unknown>[])[0]['eventSource'] === 'string' &&
      (e['Records'] as Record<string, unknown>[])[0]['eventSource'] === 'aws:kinesis'
    );
  }
}
