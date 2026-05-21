import { Module } from '@nestjs/common';
import { EnvValidationMiddleware } from '../../../common/middleware/env-validation.middleware';
import { EnvConstants } from '../../../common/constants/env.constants';
import { envConfig } from '../../../common/config/env.config';
import { DynamoClient } from '../../../common/dynamo/dynamo.client';
import { ClientProfileDbRepository } from '../../domain/repository/client-profile.db.repository';
import { ClientProfileDbRepositoryImpl } from '../repository/client-profile.db.repository.impl';
import { ProfileAggregatorService } from '../../domain/service/profile-aggregator.service';
import { ProfileAggregatorConstants } from '../../domain/constants/profile-aggregator.constants';
import { AggregateProfileUseCase } from '../../application/use-cases/aggregate-profile.usecase';
import { ProfileAggregatorController } from '../controller/profile-aggregator.controller';

@Module({
  providers: [
    EnvValidationMiddleware.register(EnvConstants.REQUERIDAS_PROFILE_AGGREGATOR),
    {
      provide: DynamoClient,
      useFactory: () => new DynamoClient(),
    },
    {
      provide: ClientProfileDbRepository,
      useFactory: (client: DynamoClient) =>
        new ClientProfileDbRepositoryImpl(envConfig.profileAggregatorTableName, client),
      inject: [DynamoClient],
    },
    {
      provide: ProfileAggregatorService,
      useFactory: (repository: ClientProfileDbRepository) =>
        new ProfileAggregatorService(repository, {
          windowSize: ProfileAggregatorConstants.WINDOW_SIZE,
          outlierCapMultiplier: ProfileAggregatorConstants.OUTLIER_CAP_MULTIPLIER,
        }),
      inject: [ClientProfileDbRepository],
    },
    {
      provide: AggregateProfileUseCase,
      useFactory: (service: ProfileAggregatorService) => new AggregateProfileUseCase(service),
      inject: [ProfileAggregatorService],
    },
    {
      provide: ProfileAggregatorController,
      useFactory: (useCase: AggregateProfileUseCase) => new ProfileAggregatorController(useCase),
      inject: [AggregateProfileUseCase],
    },
  ],
})
export class ProfileAggregatorModule {}
