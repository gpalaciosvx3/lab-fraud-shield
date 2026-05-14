import { KinesisClient } from '../../../common/kinesis/kinesis.client';
import { KinesisRepository } from '../../domain/repository/kinesis.repository';
import { TransactionPayload } from '../../domain/types/transaction.types';

export class KinesisRepositoryImpl extends KinesisRepository {
  constructor(
    private readonly streamName: string,
    private readonly kinesisClient: KinesisClient,
  ) {
    super();
  }

  async putRecord(payload: TransactionPayload): Promise<void> {
    await this.kinesisClient.putRecord(
      this.streamName,
      Buffer.from(JSON.stringify(payload)),
      payload.clientId,
    );
  }
}
