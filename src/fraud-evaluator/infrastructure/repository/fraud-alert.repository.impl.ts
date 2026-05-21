import { SnsClient } from '../../../common/sns/sns.client';
import { FraudAlertRepository } from '../../domain/repository/fraud-alert.repository';
import { FraudAlert } from '../../domain/types/fraud-alert.types';

export class FraudAlertRepositoryImpl extends FraudAlertRepository {
  constructor(
    private readonly topicArn: string,
    private readonly snsClient: SnsClient,
  ) {
    super();
  }

  async publish(alert: FraudAlert): Promise<void> {
    await this.snsClient.publish(this.topicArn, JSON.stringify(alert), { clientId: alert.clientId });
  }
}
