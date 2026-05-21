import * as cdk from 'aws-cdk-lib';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';
import { InfraConstants } from '../../../common/constants/infra.constants';
import { ResourceConstants } from '../../../common/constants/resource.constants';

export class FraudAlertsTopicConstruct extends Construct {
  readonly topic: sns.Topic;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const riskAlertEmailClientA = new cdk.CfnParameter(this, 'RiskAlertEmailClientA', {
      type: 'String',
      description: 'Email del equipo de riesgo para client A',
    });

    const riskAlertEmailClientB = new cdk.CfnParameter(this, 'RiskAlertEmailClientB', {
      type: 'String',
      description: 'Email del equipo de riesgo para client B',
    });

    this.topic = new sns.Topic(this, 'Topic', {
      topicName: ResourceConstants.FRAUD_ALERTS_TOPIC,
    });

    this.topic.addSubscription(new subscriptions.EmailSubscription(
      riskAlertEmailClientA.valueAsString,
      {
        filterPolicy: {
          clientId: sns.SubscriptionFilter.stringFilter({
            allowlist: [InfraConstants.RISK_ALERT_CLIENT_ID_CLIENT_A],
          }),
        },
      },
    ));

    this.topic.addSubscription(new subscriptions.EmailSubscription(
      riskAlertEmailClientB.valueAsString,
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