import { Module } from '@nestjs/common';
import { EnvValidationMiddleware } from '../../../common/middleware/env-validation.middleware';
import { EnvConstants } from '../../../common/constants/env.constants';
import { envConfig } from '../../../common/config/env.config';
import { DynamoClient } from '../../../common/dynamo/dynamo.client';
import { SnsClient } from '../../../common/sns/sns.client';
import { ClientProfileDbRepository } from '../../domain/repository/client-profile.db.repository';
import { FraudAlertRepository } from '../../domain/repository/fraud-alert.repository';
import { FraudDecisionDbRepository } from '../../domain/repository/fraud-decision.db.repository';
import { FraudRuleDbRepository } from '../../domain/repository/fraud-rule.db.repository';
import { FraudEvaluatorService } from '../../domain/service/fraud-evaluator.service';
import { EvaluateFraudUseCase } from '../../application/use-cases/evaluate-fraud.usecase';
import { FraudEvaluatorController } from '../controller/fraud-evaluator.controller';
import { ClientProfileDbRepositoryImpl } from '../repository/client-profile.db.repository.impl';
import { FraudAlertRepositoryImpl } from '../repository/fraud-alert.repository.impl';
import { FraudDecisionDbRepositoryImpl } from '../repository/fraud-decision.db.repository.impl';
import { FraudRuleDbRepositoryImpl } from '../repository/fraud-rule.db.repository.impl';

@Module({
  providers: [
    EnvValidationMiddleware.register(EnvConstants.REQUERIDAS_FRAUD_EVALUATOR),
    {
      provide: DynamoClient,
      useFactory: () => new DynamoClient(),
    },
    {
      provide: SnsClient,
      useFactory: () => new SnsClient(),
    },
    {
      provide: ClientProfileDbRepository,
      useFactory: (client: DynamoClient) =>
        new ClientProfileDbRepositoryImpl(envConfig.profileAggregatorTableName, client),
      inject: [DynamoClient],
    },
    {
      provide: FraudRuleDbRepository,
      useFactory: (client: DynamoClient) =>
        new FraudRuleDbRepositoryImpl(envConfig.fraudRulesTableName, client),
      inject: [DynamoClient],
    },
    {
      provide: FraudDecisionDbRepository,
      useFactory: (client: DynamoClient) =>
        new FraudDecisionDbRepositoryImpl(envConfig.fraudDecisionsTableName, client),
      inject: [DynamoClient],
    },
    {
      provide: FraudAlertRepository,
      useFactory: (snsClient: SnsClient) =>
        new FraudAlertRepositoryImpl(envConfig.fraudAlertsTopicArn, snsClient),
      inject: [SnsClient],
    },
    {
      provide: FraudEvaluatorService,
      useFactory: (
        fraudDecisionRepository: FraudDecisionDbRepository,
        fraudRuleRepository: FraudRuleDbRepository,
        clientProfileRepository: ClientProfileDbRepository,
        fraudAlertRepository: FraudAlertRepository,
      ) => new FraudEvaluatorService(
        fraudDecisionRepository,
        fraudRuleRepository,
        clientProfileRepository,
        fraudAlertRepository,
      ),
      inject: [
        FraudDecisionDbRepository,
        FraudRuleDbRepository,
        ClientProfileDbRepository,
        FraudAlertRepository,
      ],
    },
    {
      provide: EvaluateFraudUseCase,
      useFactory: (service: FraudEvaluatorService) => new EvaluateFraudUseCase(service),
      inject: [FraudEvaluatorService],
    },
    {
      provide: FraudEvaluatorController,
      useFactory: (useCase: EvaluateFraudUseCase) => new FraudEvaluatorController(useCase),
      inject: [EvaluateFraudUseCase],
    },
  ],
})
export class FraudEvaluatorModule {}
