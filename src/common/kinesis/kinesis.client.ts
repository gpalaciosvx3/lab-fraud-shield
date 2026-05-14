import { Injectable } from '@nestjs/common';
import { PutRecordCommand } from '@aws-sdk/client-kinesis';
import { kinesisClient } from '../config/aws.config';
import { awsError } from '../errors/aws-error.mapper';
import { ErrorDictionary } from '../errors/error.dictionary';

@Injectable()
export class KinesisClient {
  async putRecord(streamName: string, data: Buffer, partitionKey: string): Promise<void> {
    await awsError(
      () => kinesisClient.send(new PutRecordCommand({ StreamName: streamName, Data: data, PartitionKey: partitionKey })),
      ErrorDictionary.KINESIS_UNAVAILABLE,
    );
  }
}
