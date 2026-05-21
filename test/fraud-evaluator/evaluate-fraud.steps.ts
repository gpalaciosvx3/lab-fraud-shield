import 'reflect-metadata';
import { defineFeature, loadFeature } from 'jest-cucumber';
import { EvaluateFraudUseCase } from '../../src/fraud-evaluator/application/use-cases/evaluate-fraud.usecase';
import { FraudEvaluatorService } from '../../src/fraud-evaluator/domain/service/fraud-evaluator.service';
import { ClientProfileDbRepository } from '../../src/fraud-evaluator/domain/repository/client-profile.db.repository';
import { FraudAlertRepository } from '../../src/fraud-evaluator/domain/repository/fraud-alert.repository';
import { FraudDecisionDbRepository } from '../../src/fraud-evaluator/domain/repository/fraud-decision.db.repository';
import { FraudRuleDbRepository } from '../../src/fraud-evaluator/domain/repository/fraud-rule.db.repository';
import { ProcessRecordResult } from '../../src/common/types/process-record-result.types';
import { KinesisMessage } from '../../src/common/middleware/types/lambda-event.types';
import { ClientProfile } from '../../src/fraud-evaluator/domain/types/client-profile.types';
import { FraudDecisionRecord, FraudDecisionStatuses } from '../../src/fraud-evaluator/domain/types/fraud-decision.types';
import { FraudRule, FraudRuleOperators, FraudRuleSources } from '../../src/fraud-evaluator/domain/types/fraud-rule.types';
import { FraudAlert } from '../../src/fraud-evaluator/domain/types/fraud-alert.types';

const feature = loadFeature('./test/fraud-evaluator/features/evaluate-fraud.feature');

const BASE_TIMESTAMP = '2026-05-21T12:00:00.000Z';

type ScenarioType = 'approve-nohit' | 'reject-static' | 'duplicate' | 'invalid-input';

class InMemoryClientProfileRepository extends ClientProfileDbRepository {
  private readonly records = new Map<string, ClientProfile>();

  async findByClientId(clientId: string): Promise<ClientProfile | null> {
    return this.records.get(clientId) ?? null;
  }

  seed(record: ClientProfile): void {
    this.records.set(record.clientId, { ...record });
  }
}

class InMemoryFraudRuleRepository extends FraudRuleDbRepository {
  private readonly records = new Map<string, FraudRule[]>();

  async findActiveByTransactionType(transactionType: string): Promise<FraudRule[]> {
    return this.records.get(transactionType) ?? [];
  }

  seed(transactionType: string, rules: FraudRule[]): void {
    this.records.set(transactionType, [...rules]);
  }
}

class InMemoryFraudDecisionRepository extends FraudDecisionDbRepository {
  private readonly records = new Map<string, FraudDecisionRecord>();

  async findByTransactionId(transactionId: string): Promise<FraudDecisionRecord | null> {
    return this.records.get(transactionId) ?? null;
  }

  async saveIfAbsent(decision: FraudDecisionRecord): Promise<boolean> {
    if (this.records.has(decision.transactionId)) return false;
    this.records.set(decision.transactionId, { ...decision });
    return true;
  }

  seed(record: FraudDecisionRecord): void {
    this.records.set(record.transactionId, { ...record });
  }

  getByTransactionId(transactionId: string): FraudDecisionRecord | undefined {
    return this.records.get(transactionId);
  }

  count(): number {
    return this.records.size;
  }
}

class InMemoryFraudAlertRepository extends FraudAlertRepository {
  private readonly alerts: FraudAlert[] = [];

  async publish(alert: FraudAlert): Promise<void> {
    this.alerts.push({ ...alert });
  }

  count(): number {
    return this.alerts.length;
  }
}

function buildService(scenario: ScenarioType) {
  const profileRepository = new InMemoryClientProfileRepository();
  const ruleRepository = new InMemoryFraudRuleRepository();
  const decisionRepository = new InMemoryFraudDecisionRepository();
  const alertRepository = new InMemoryFraudAlertRepository();

  if (scenario === 'approve-nohit') {
    ruleRepository.seed('PAYMENT', [
      {
        ruleId: 'RULE-APPROVE-NOHIT',
        transactionType: 'PAYMENT',
        decision: FraudDecisionStatuses.REJECT,
        priority: 1,
        active: true,
        anomaly: 'monto_critico',
        conditions: [
          {
            field: 'amount',
            operator: FraudRuleOperators.GREATER_THAN,
            value: 3000,
            source: FraudRuleSources.TRANSACTION,
          },
        ],
      },
    ]);
  }

  if (scenario === 'reject-static') {
    ruleRepository.seed('PAYMENT', [
      {
        ruleId: 'RULE-REJECT-STATIC',
        transactionType: 'PAYMENT',
        decision: FraudDecisionStatuses.REJECT,
        priority: 1,
        active: true,
        anomaly: 'monto_y_region_atipica',
        conditions: [
          {
            field: 'amount',
            operator: FraudRuleOperators.GREATER_THAN,
            value: 3000,
            source: FraudRuleSources.TRANSACTION,
          },
          {
            field: 'region',
            operator: FraudRuleOperators.NOT_EQUALS,
            value: 'PE-LIM',
            source: FraudRuleSources.TRANSACTION,
          },
        ],
      },
    ]);

    profileRepository.seed({
      clientId: 'C-001',
      averageAmount: 1200,
      habitualRegion: 'PE-LIM',
      frequency30d: 12,
      lastUpdatedAt: BASE_TIMESTAMP,
      processedTransactions: 20,
      validAmountWindow: [1000, 1100, 1200, 1300],
      regionWindow: ['PE-LIM', 'PE-LIM', 'PE-LIM'],
      frequencyWindow: ['2026-05-20', '2026-05-19', '2026-05-18'],
      version: 1,
    });
  }

  if (scenario === 'duplicate') {
    decisionRepository.seed({
      transactionId: 'TX-FE-DUP-001',
      clientId: 'C-001',
      transactionType: 'PAYMENT',
      decision: FraudDecisionStatuses.REVIEW,
      evaluatedAt: BASE_TIMESTAMP,
      triggeredRuleId: 'RULE-DUPLICATE-PREV',
      anomaly: 'duplicado_en_reintento',
      context: {
        origin: 'seed',
      },
    });
  }

  const service = new FraudEvaluatorService(
    decisionRepository,
    ruleRepository,
    profileRepository,
    alertRepository,
  );

  return {
    useCase: new EvaluateFraudUseCase(service),
    decisionRepository,
    alertRepository,
  };
}

defineFeature(feature, test => {
  test('transacción sin regla aplicable se aprueba y no envía alerta', ({ given, and, when, then }) => {
    let useCase: EvaluateFraudUseCase;
    let decisionRepository: InMemoryFraudDecisionRepository;
    let alertRepository: InMemoryFraudAlertRepository;
    let records: KinesisMessage[];
    let result: ProcessRecordResult[];

    given(/^un repositorio de fraude preparado para "(.*)"$/, (scenario: ScenarioType) => {
      const context = buildService(scenario);
      useCase = context.useCase;
      decisionRepository = context.decisionRepository;
      alertRepository = context.alertRepository;
    });

    and(
      /^un lote de fraude con transactionId "(.*)", clientId "(.*)", amount ([\d.]+), region "(.*)", type "(.*)", sequence "(.*)"$/,
      (transactionId: string, clientId: string, amount: string, region: string, type: string, sequenceNumber: string) => {
        records = [
          {
            body: {
              transactionId,
              clientId,
              amount: Number(amount),
              region,
              type,
              timestamp: BASE_TIMESTAMP,
            },
            partitionKey: clientId,
            sequenceNumber,
          },
        ];
      },
    );

    when('se procesa el lote del fraud evaluator', async () => {
      result = await useCase.executeBatch(records);
    });

    then(/^el resultado para "(.*)" queda sin reintento$/, (sequenceNumber: string) => {
      expect(result).toHaveLength(1);
      expect(result[0].sequenceNumber).toBe(sequenceNumber);
      expect(result[0].retry).toBe(false);
    });

    and(/^la decisión persistida para "(.*)" queda "(.*)"$/, (transactionId: string, expectedDecision: string) => {
      const decision = decisionRepository.getByTransactionId(transactionId);
      expect(decision).toBeDefined();
      expect(decision?.decision).toBe(expectedDecision);
    });

    and(/^el número de alertas publicadas es ([\d]+)$/, (alertsPublished: string) => {
      expect(alertRepository.count()).toBe(Number(alertsPublished));
    });
  });

  test('transacción con regla REJECT se persiste y alerta al equipo de riesgo', ({ given, and, when, then }) => {
    let useCase: EvaluateFraudUseCase;
    let decisionRepository: InMemoryFraudDecisionRepository;
    let alertRepository: InMemoryFraudAlertRepository;
    let records: KinesisMessage[];
    let result: ProcessRecordResult[];

    given(/^un repositorio de fraude preparado para "(.*)"$/, (scenario: ScenarioType) => {
      const context = buildService(scenario);
      useCase = context.useCase;
      decisionRepository = context.decisionRepository;
      alertRepository = context.alertRepository;
    });

    and(
      /^un lote de fraude con transactionId "(.*)", clientId "(.*)", amount ([\d.]+), region "(.*)", type "(.*)", sequence "(.*)"$/,
      (transactionId: string, clientId: string, amount: string, region: string, type: string, sequenceNumber: string) => {
        records = [
          {
            body: {
              transactionId,
              clientId,
              amount: Number(amount),
              region,
              type,
              timestamp: BASE_TIMESTAMP,
            },
            partitionKey: clientId,
            sequenceNumber,
          },
        ];
      },
    );

    when('se procesa el lote del fraud evaluator', async () => {
      result = await useCase.executeBatch(records);
    });

    then(/^el resultado para "(.*)" queda sin reintento$/, (sequenceNumber: string) => {
      expect(result).toHaveLength(1);
      expect(result[0].sequenceNumber).toBe(sequenceNumber);
      expect(result[0].retry).toBe(false);
    });

    and(/^la decisión persistida para "(.*)" queda "(.*)"$/, (transactionId: string, expectedDecision: string) => {
      const decision = decisionRepository.getByTransactionId(transactionId);
      expect(decision).toBeDefined();
      expect(decision?.decision).toBe(expectedDecision);
    });

    and(/^el número de alertas publicadas es ([\d]+)$/, (alertsPublished: string) => {
      expect(alertRepository.count()).toBe(Number(alertsPublished));
    });
  });

  test('transacción duplicada se descarta sin nueva alerta', ({ given, and, when, then }) => {
    let useCase: EvaluateFraudUseCase;
    let decisionRepository: InMemoryFraudDecisionRepository;
    let alertRepository: InMemoryFraudAlertRepository;
    let records: KinesisMessage[];
    let result: ProcessRecordResult[];
    let previousDecisionCount = 0;

    given(/^un repositorio de fraude preparado para "(.*)"$/, (scenario: ScenarioType) => {
      const context = buildService(scenario);
      useCase = context.useCase;
      decisionRepository = context.decisionRepository;
      alertRepository = context.alertRepository;
      previousDecisionCount = decisionRepository.count();
    });

    and(
      /^un lote de fraude con transactionId "(.*)", clientId "(.*)", amount ([\d.]+), region "(.*)", type "(.*)", sequence "(.*)"$/,
      (transactionId: string, clientId: string, amount: string, region: string, type: string, sequenceNumber: string) => {
        records = [
          {
            body: {
              transactionId,
              clientId,
              amount: Number(amount),
              region,
              type,
              timestamp: BASE_TIMESTAMP,
            },
            partitionKey: clientId,
            sequenceNumber,
          },
        ];
      },
    );

    when('se procesa el lote del fraud evaluator', async () => {
      result = await useCase.executeBatch(records);
    });

    then(/^el resultado para "(.*)" queda sin reintento$/, (sequenceNumber: string) => {
      expect(result).toHaveLength(1);
      expect(result[0].sequenceNumber).toBe(sequenceNumber);
      expect(result[0].retry).toBe(false);
    });

    and(/^no se persiste nueva decisión para "(.*)"$/, (transactionId: string) => {
      expect(decisionRepository.getByTransactionId(transactionId)).toBeDefined();
      expect(decisionRepository.count()).toBe(previousDecisionCount);
    });

    and(/^el número de alertas publicadas es ([\d]+)$/, (alertsPublished: string) => {
      expect(alertRepository.count()).toBe(Number(alertsPublished));
    });
  });

  test('payload inválido se descarta sin reintento', ({ given, and, when, then }) => {
    let useCase: EvaluateFraudUseCase;
    let alertRepository: InMemoryFraudAlertRepository;
    let records: KinesisMessage[];
    let result: ProcessRecordResult[];

    given(/^un repositorio de fraude preparado para "(.*)"$/, (scenario: ScenarioType) => {
      const context = buildService(scenario);
      useCase = context.useCase;
      alertRepository = context.alertRepository;
    });

    and(
      /^un lote de fraude inválido con transactionId "(.*)", clientId "(.*)", amount ([\d.]+), region "(.*)", type "(.*)", sequence "(.*)"$/,
      (transactionId: string, clientId: string, amount: string, region: string, type: string, sequenceNumber: string) => {
        records = [
          {
            body: {
              transactionId,
              clientId,
              amount: Number(amount),
              region,
              type,
              timestamp: BASE_TIMESTAMP,
            },
            partitionKey: clientId || 'INVALID',
            sequenceNumber,
          },
        ];
      },
    );

    when('se procesa el lote del fraud evaluator', async () => {
      result = await useCase.executeBatch(records);
    });

    then(/^el resultado para "(.*)" se marca sin reintento$/, (sequenceNumber: string) => {
      expect(result).toHaveLength(1);
      expect(result[0].sequenceNumber).toBe(sequenceNumber);
      expect(result[0].retry).toBe(false);
    });

    and(/^el número de alertas publicadas es ([\d]+)$/, (alertsPublished: string) => {
      expect(alertRepository.count()).toBe(Number(alertsPublished));
    });
  });
});
