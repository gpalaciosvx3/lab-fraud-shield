import { Module } from '@nestjs/common';
import { EnvValidationMiddleware } from '../../../common/middleware/env-validation.middleware';
import { EnvConstants } from '../../../common/constants/env.constants';
import { KinesisClient } from '../../../common/kinesis/kinesis.client';
import { envConfig } from '../../../common/config/env.config';
import { KinesisRepository } from '../../domain/repository/kinesis.repository';
import { KinesisRepositoryImpl } from '../repository/kinesis.repository.impl';
import { TransactionIngesterService } from '../../domain/service/transaction-ingester.service';
import { IngestTransactionUseCase } from '../../application/use-cases/ingest-transaction.usecase';
import { TransactionIngesterController } from '../controller/transaction-ingester.controller';

@Module({
  providers: [
    EnvValidationMiddleware.register(EnvConstants.REQUERIDAS_TX_INGESTER),
    {
      provide: KinesisClient,
      useFactory: () => new KinesisClient(),
    },
    {
      provide: KinesisRepository,
      useFactory: (client: KinesisClient) =>
        new KinesisRepositoryImpl(envConfig.kinesisStreamName, client),
      inject: [KinesisClient],
    },
    {
      provide: TransactionIngesterService,
      useFactory: (repo: KinesisRepository) => new TransactionIngesterService(repo),
      inject: [KinesisRepository],
    },
    {
      provide: IngestTransactionUseCase,
      useFactory: (svc: TransactionIngesterService) => new IngestTransactionUseCase(svc),
      inject: [TransactionIngesterService],
    },
    {
      provide: TransactionIngesterController,
      useFactory: (uc: IngestTransactionUseCase) => new TransactionIngesterController(uc),
      inject: [IngestTransactionUseCase],
    },
  ],
})
export class TransactionIngesterModule {}
