import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { ResourceConstants } from '../../../common/constants/resource.constants';

interface HttpApiProps {
  txIngesterFn:  lambda.IFunction;
  stage:         string;
}

export class HttpApiConstruct extends Construct {
  readonly url: string;

  constructor(scope: Construct, id: string, props: HttpApiProps) {
    super(scope, id);

    const api = new apigateway.RestApi(this, 'Api', {
      restApiName: ResourceConstants.API_NAME,
      description: 'API REST de Fraud Shield para ingestión de transacciones',
      deployOptions: {
        stageName: props.stage,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: ['POST', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
      },
    });

    const apiKey = new apigateway.ApiKey(this, 'ApiKey', {
      apiKeyName: `${ResourceConstants.API_NAME}-KEY`,
      description: 'API Key para acceso al API',
    });

    const usagePlan = new apigateway.UsagePlan(this, 'UsagePlan', {
      name: `${ResourceConstants.API_NAME}-PLAN`,
      apiStages: [{ api, stage: api.deploymentStage }],
      throttle: { rateLimit: 100, burstLimit: 200 },
    });

    usagePlan.addApiKey(apiKey);

    const txIngesterIntegration = new apigateway.LambdaIntegration(props.txIngesterFn);

    const v1           = api.root.addResource('v1');
    const transactions = v1.addResource('transactions');

    transactions.addMethod('POST', txIngesterIntegration, { apiKeyRequired: true });

    this.url = api.url;
  }
}
