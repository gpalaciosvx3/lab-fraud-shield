import 'reflect-metadata';
import { loadFeature, defineFeature } from 'jest-cucumber';
import { KinesisRepository } from '../../src/transaction-ingester/domain/repository/kinesis.repository';
import { TransactionIngesterService } from '../../src/transaction-ingester/domain/service/transaction-ingester.service';
import { IngestTransactionUseCase } from '../../src/transaction-ingester/application/use-cases/ingest-transaction.usecase';
import { IngestResult } from '../../src/transaction-ingester/domain/types/transaction.types';
import { ValidationException } from '../../src/common/errors/custom.exception';

const feature = loadFeature('./test/transaction-ingester/features/ingest-transaction.feature');

const BASE_TIMESTAMP = '2026-05-13T10:00:00.000Z';

defineFeature(feature, test => {
  test('transacción válida es aceptada y publicada en Kinesis', ({ given, when, then, and }) => {
    let useCase: IngestTransactionUseCase;
    let result: IngestResult;
    let putRecordMock: jest.Mock;
    let currentPayload: Record<string, unknown>;

    given(
      /^la transacción "(.*)" del cliente "(.*)" por monto ([\d.]+) en región "(.*)" de tipo "(.*)"$/,
      (transactionId: string, clientId: string, amount: string, region: string, type: string) => {
        putRecordMock  = jest.fn().mockResolvedValue(undefined);
        const repository = { putRecord: putRecordMock } as unknown as KinesisRepository;
        const service    = new TransactionIngesterService(repository);
        useCase          = new IngestTransactionUseCase(service);
        currentPayload   = { transactionId, clientId, amount: Number(amount), region, type, timestamp: BASE_TIMESTAMP };
      },
    );

    when('se ingesta la transacción', async () => {
      result = await useCase.execute(currentPayload);
    });

    then(
      /^la respuesta tiene status "(.*)" y transactionId "(.*)"$/,
      (expectedStatus: string, expectedTxId: string) => {
        expect(result.status).toBe(expectedStatus);
        expect(result.transactionId).toBe(expectedTxId);
      },
    );

    and(
      /^Kinesis recibió un PutRecord con partitionKey "(.*)"$/,
      (expectedClientId: string) => {
        expect(putRecordMock).toHaveBeenCalledTimes(1);
        const payload = putRecordMock.mock.calls[0][0] as Record<string, unknown>;
        expect(payload['clientId']).toBe(expectedClientId);
      },
    );
  });

  test('campo inválido en el payload es rechazado con ValidationException', ({ given, when, then }) => {
    let useCase: IngestTransactionUseCase;
    let caughtError: unknown;
    let currentPayload: Record<string, unknown>;

    const basePayload: Record<string, unknown> = {
      transactionId: 'TX-2026-001',
      clientId:      'C-001',
      amount:        5800,
      region:        'US-MIA',
      type:          'TRANSFER',
      timestamp:     BASE_TIMESTAMP,
    };

    given(/^un payload base con "(.*)" siendo "(.*)"$/, (campo: string, valor: string) => {
      const putRecordMock = jest.fn();
      const repository    = { putRecord: putRecordMock } as unknown as KinesisRepository;
      const service       = new TransactionIngesterService(repository);
      useCase             = new IngestTransactionUseCase(service);

      const parsedValue   = campo === 'amount' ? Number(valor) : valor;
      currentPayload      = { ...basePayload, [campo]: parsedValue };
    });

    when('se ingesta la transacción', async () => {
      try {
        await useCase.execute(currentPayload);
      } catch (err) {
        caughtError = err;
      }
    });

    then('se lanza una ValidationException', () => {
      expect(caughtError).toBeInstanceOf(ValidationException);
    });
  });
});

