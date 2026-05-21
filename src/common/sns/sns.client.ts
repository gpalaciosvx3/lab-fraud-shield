import { Injectable } from '@nestjs/common';
import { PublishCommand } from '@aws-sdk/client-sns';
import { snsClient } from '../config/aws.config';
import { awsError } from '../errors/aws-error.mapper';
import { ErrorDictionary } from '../errors/error.dictionary';

export type SnsMessageAttributes = Record<string, string>;

@Injectable()
export class SnsClient {
  async publish(topicArn: string, message: string, attributes: SnsMessageAttributes): Promise<void> {
    const messageAttributes = Object.entries(attributes).reduce<Record<string, { DataType: 'String'; StringValue: string }>>(
      (accumulator, [key, value]) => ({
        ...accumulator,
        [key]: {
          DataType: 'String',
          StringValue: value,
        },
      }),
      {},
    );

    await awsError(
      () => snsClient.send(new PublishCommand({
        TopicArn: topicArn,
        Message: message,
        MessageAttributes: messageAttributes,
      })),
      ErrorDictionary.SNS_UNAVAILABLE,
    );
  }
}
