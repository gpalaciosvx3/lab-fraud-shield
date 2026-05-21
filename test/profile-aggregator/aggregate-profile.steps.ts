import 'reflect-metadata';
import { defineFeature, loadFeature } from 'jest-cucumber';
import { AggregateProfileUseCase } from '../../src/profile-aggregator/application/use-cases/aggregate-profile.usecase';
import { ProcessRecordResult } from '../../src/profile-aggregator/application/types/process-record-result.types';
import { ProfileAggregatorService } from '../../src/profile-aggregator/domain/service/profile-aggregator.service';
import { ProfileAggregatorConstants } from '../../src/profile-aggregator/domain/constants/profile-aggregator.constants';
import { ClientProfileDbRepository } from '../../src/profile-aggregator/domain/repository/client-profile.db.repository';
import { ClientProfileEntity } from '../../src/profile-aggregator/domain/entities/client-profile.entity';
import { ClientProfile } from '../../src/profile-aggregator/domain/types/client-profile.types';
import { KinesisMessage } from '../../src/common/middleware/types/lambda-event.types';

const feature = loadFeature('./test/profile-aggregator/features/aggregate-profile.feature');

const BASE_TIMESTAMP = '2026-05-21T12:00:00.000Z';
const PREV_TIMESTAMPS = [
  '2026-05-20T12:00:00.000Z',
  '2026-05-19T12:00:00.000Z',
  '2026-05-18T12:00:00.000Z',
  '2026-05-17T12:00:00.000Z',
  '2026-05-16T12:00:00.000Z',
  '2026-05-15T12:00:00.000Z',
  '2026-05-14T12:00:00.000Z',
  '2026-05-13T12:00:00.000Z',
  '2026-05-12T12:00:00.000Z',
  '2026-05-11T12:00:00.000Z',
];

class InMemoryProfileRepository extends ClientProfileDbRepository {
  private readonly records = new Map<string, ClientProfile>();

  async findByClientId(clientId: string): Promise<ClientProfileEntity | null> {
    const record = this.records.get(clientId);
    if (!record) return null;
    return ClientProfileEntity.fromRecord({ ...record });
  }

  async create(profile: ClientProfileEntity): Promise<boolean> {
    const record = profile.toRecord();
    if (this.records.has(record.clientId)) return false;
    this.records.set(record.clientId, record);
    return true;
  }

  async update(profile: ClientProfileEntity, expectedVersion: number): Promise<boolean> {
    const record = profile.toRecord();
    const current = this.records.get(record.clientId);
    if (!current) return false;
    if (current.version !== expectedVersion) return false;
    this.records.set(record.clientId, record);
    return true;
  }

  seed(record: ClientProfile): void {
    this.records.set(record.clientId, { ...record });
  }

  getByClientId(clientId: string): ClientProfile | undefined {
    const record = this.records.get(clientId);
    if (!record) return undefined;
    return { ...record };
  }
}

defineFeature(feature, test => {
  test('primera transacción crea perfil del cliente', ({ given, when, then, and }) => {
    let repository: InMemoryProfileRepository;
    let useCase: AggregateProfileUseCase;
    let records: KinesisMessage[];
    let result: ProcessRecordResult[];

    given(
      /^un lote con una transacción "(.*)" del cliente "(.*)" por monto ([\d.]+) en región "(.*)"$/,
      (transactionId: string, clientId: string, amount: string, region: string) => {
        repository = new InMemoryProfileRepository();
        const service = new ProfileAggregatorService(repository, {
          windowSize: ProfileAggregatorConstants.WINDOW_SIZE,
          outlierCapMultiplier: ProfileAggregatorConstants.OUTLIER_CAP_MULTIPLIER,
        });
        useCase = new AggregateProfileUseCase(service);

        records = [{
          body: {
            transactionId,
            clientId,
            amount: Number(amount),
            region,
            type: 'TRANSFER',
            timestamp: BASE_TIMESTAMP,
          },
          partitionKey: clientId,
          sequenceNumber: 'S-001',
        }];
      },
    );

    when('se procesa el lote del profile aggregator', async () => {
      result = await useCase.executeBatch(records);
    });

    then(/^el resultado para "(.*)" queda sin reintento$/, (sequenceNumber: string) => {
      expect(result).toHaveLength(1);
      expect(result[0].sequenceNumber).toBe(sequenceNumber);
      expect(result[0].retry).toBe(false);
    });

    and(
      /^el perfil del cliente "(.*)" queda con promedio ([\d.]+), región "(.*)" y frecuencia ([\d]+)$/,
      (clientId: string, averageAmount: string, habitualRegion: string, frequency30d: string) => {
        const savedProfile = repository.getByClientId(clientId);

        expect(savedProfile).toBeDefined();
        expect(savedProfile?.averageAmount).toBe(Number(averageAmount));
        expect(savedProfile?.habitualRegion).toBe(habitualRegion);
        expect(savedProfile?.frequency30d).toBe(Number(frequency30d));
      },
    );
  });

  test('transacción outlier no altera el promedio pero sí cuenta en frecuencia y región', ({ given, and, when, then }) => {
    let repository: InMemoryProfileRepository;
    let useCase: AggregateProfileUseCase;
    let records: KinesisMessage[];
    let result: ProcessRecordResult[];

    given(
      /^existe un perfil del cliente "(.*)" con promedio ([\d.]+) y ([\d]+) transacciones$/,
      (clientId: string, averageAmount: string, processedTransactions: string) => {
        repository = new InMemoryProfileRepository();
        repository.seed({
          clientId,
          averageAmount: Number(averageAmount),
          habitualRegion: 'PE-LIM',
          frequency30d: Number(processedTransactions),
          lastUpdatedAt: PREV_TIMESTAMPS[0],
          processedTransactions: Number(processedTransactions),
          validAmountWindow: Array.from({ length: Number(processedTransactions) }, () => Number(averageAmount)),
          regionWindow: ['PE-LIM', 'PE-LIM', 'PE-LIM', 'PE-LIM', 'PE-LIM', 'PE-LIM', 'PE-LIM', 'PE-LIM', 'PE-CUS', 'PE-CUS'],
          frequencyWindow: PREV_TIMESTAMPS,
          version: 3,
        });

        const service = new ProfileAggregatorService(repository, {
          windowSize: ProfileAggregatorConstants.WINDOW_SIZE,
          outlierCapMultiplier: ProfileAggregatorConstants.OUTLIER_CAP_MULTIPLIER,
        });
        useCase = new AggregateProfileUseCase(service);
      },
    );

    and(
      /^un lote con una transacción outlier "(.*)" por monto ([\d.]+) en región "(.*)" y sequence "(.*)"$/,
      (transactionId: string, amount: string, region: string, sequenceNumber: string) => {
        records = [{
          body: {
            transactionId,
            clientId: 'C-001',
            amount: Number(amount),
            region,
            type: 'TRANSFER',
            timestamp: BASE_TIMESTAMP,
          },
          partitionKey: 'C-001',
          sequenceNumber,
        }];
      },
    );

    when('se procesa el lote del profile aggregator', async () => {
      result = await useCase.executeBatch(records);
    });

    then(/^el resultado para "(.*)" queda sin reintento$/, (sequenceNumber: string) => {
      expect(result).toHaveLength(1);
      expect(result[0].sequenceNumber).toBe(sequenceNumber);
      expect(result[0].retry).toBe(false);
    });

    and(/^el promedio del cliente "(.*)" permanece en ([\d.]+)$/, (clientId: string, averageAmount: string) => {
      const savedProfile = repository.getByClientId(clientId);
      expect(savedProfile).toBeDefined();
      expect(savedProfile?.averageAmount).toBe(Number(averageAmount));
    });

    and(/^la frecuencia del cliente "(.*)" aumenta a ([\d]+)$/, (clientId: string, frequency30d: string) => {
      const savedProfile = repository.getByClientId(clientId);
      expect(savedProfile).toBeDefined();
      expect(savedProfile?.frequency30d).toBe(Number(frequency30d));
      expect(savedProfile?.regionWindow.includes('PE-AQP')).toBe(true);
    });
  });

  test('payload inválido se descarta sin reintento', ({ given, when, then }) => {
    let useCase: AggregateProfileUseCase;
    let result: ProcessRecordResult[];

    given('un lote con un registro inválido sin clientId', () => {
      const repository = new InMemoryProfileRepository();
      const service = new ProfileAggregatorService(repository, {
        windowSize: ProfileAggregatorConstants.WINDOW_SIZE,
        outlierCapMultiplier: ProfileAggregatorConstants.OUTLIER_CAP_MULTIPLIER,
      });
      useCase = new AggregateProfileUseCase(service);
    });

    when('se procesa el lote del profile aggregator', async () => {
      result = await useCase.executeBatch([
        {
          body: {
            transactionId: 'TX-INVALID-001',
            clientId: '',
            amount: 100,
            region: 'PE-LIM',
            type: 'TRANSFER',
            timestamp: BASE_TIMESTAMP,
          },
          partitionKey: 'INVALID',
          sequenceNumber: 'S-INVALID-001',
        },
      ]);
    });

    then(/^el resultado para "(.*)" se marca sin reintento$/, (sequenceNumber: string) => {
      expect(result).toHaveLength(1);
      expect(result[0].sequenceNumber).toBe(sequenceNumber);
      expect(result[0].retry).toBe(false);
    });
  });
});
