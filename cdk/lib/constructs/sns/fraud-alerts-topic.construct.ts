import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';
import { InfraConstants } from '../../../common/constants/infra.constants';
import { ResourceConstants } from '../../../common/constants/resource.constants';

interface FraudAlertsTopicConstructProps {
  riskAlertEmailClientA: string;
  riskAlertEmailClientB: string;
}

export class FraudAlertsTopicConstruct extends Construct {
  readonly topic: sns.Topic;

  constructor(scope: Construct, id: string, props: FraudAlertsTopicConstructProps) {
    super(scope, id);

    this.topic = new sns.Topic(this, 'Topic', {
      topicName: ResourceConstants.FRAUD_ALERTS_TOPIC,
    });

    this.topic.addSubscription(new subscriptions.EmailSubscription(
      props.riskAlertEmailClientA,
      {
        filterPolicy: {
          clientId: sns.SubscriptionFilter.stringFilter({
            allowlist: [InfraConstants.RISK_ALERT_CLIENT_ID_CLIENT_A],
          }),
        },
      },
    ));

    this.topic.addSubscription(new subscriptions.EmailSubscription(
      props.riskAlertEmailClientB,
      {
        filterPolicy: {
          clientId: sns.SubscriptionFilter.stringFilter({
            allowlist: [InfraConstants.RISK_ALERT_CLIENT_ID_CLIENT_B],
          }),
        },
      },
    ));
  }
}