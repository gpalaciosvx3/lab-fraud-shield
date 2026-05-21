import { Injectable, Logger } from '@nestjs/common';
import { ClientProfileDbRepository } from '../repository/client-profile.db.repository';
import { FraudAlertRepository } from '../repository/fraud-alert.repository';
import { FraudDecisionDbRepository } from '../repository/fraud-decision.db.repository';
import { FraudRuleDbRepository } from '../repository/fraud-rule.db.repository';
import { FraudDecisionEntity } from '../entities/fraud-decision.entity';
import { FraudAlertMapper } from '../mapper/fraud-alert.mapper';
import { FraudRuleEvaluator } from './fraud-rule-evaluator.service';
import { FraudEvaluationResultMapper } from '../mapper/fraud-evaluation-result.mapper';
import { FraudDecisionRecord, FraudDecisionStatuses } from '../types/fraud-decision.types';
import { FraudEvaluationResult } from '../types/fraud-evaluation-result.types';
import { StreamTransactionEvent } from '../types/stream-transaction-event.types';

@Injectable()
export class FraudEvaluatorService {
  private readonly logger = new Logger(FraudEvaluatorService.name);

  constructor(
    private readonly fraudDecisionRepository: FraudDecisionDbRepository,
    private readonly fraudRuleRepository: FraudRuleDbRepository,
    private readonly clientProfileRepository: ClientProfileDbRepository,
    private readonly fraudAlertRepository: FraudAlertRepository,
  ) {}

  async evaluate(transaction: StreamTransactionEvent): Promise<FraudEvaluationResult> {
    this.logger.log(`[PASO 1] Verificando idempotencia inicial => transactionId: ${transaction.transactionId}`);
    const existingDecision = await this.fraudDecisionRepository.findByTransactionId(transaction.transactionId);
    if (existingDecision) return FraudEvaluationResultMapper.duplicate(transaction.transactionId);

    this.logger.log(`[PASO 2] Consultando reglas activas => transactionType: ${transaction.type}`);
    const rules = await this.fraudRuleRepository.findActiveByTransactionType(transaction.type);

    this.logger.log(`[PASO 3] Consultando perfil de cliente => clientId: ${transaction.clientId}`);
    const profile = await this.clientProfileRepository.findByClientId(transaction.clientId);

    this.logger.log(`[PASO 4] Evaluando reglas contra transaccion y perfil => transactionId: ${transaction.transactionId}`);
    const selectedRule = FraudRuleEvaluator.selectMostRestrictive(rules, transaction, profile);
    const decisionEntity = selectedRule
      ? FraudDecisionEntity.fromRule(transaction, selectedRule)
      : FraudDecisionEntity.approveByDefault(transaction);

    return this.persistAndNotify(transaction, decisionEntity);
  }

  private async persistAndNotify(
    transaction: StreamTransactionEvent,
    decisionEntity: FraudDecisionEntity,
  ): Promise<FraudEvaluationResult> {
    this.logger.log(`[PASO 5] Persistiendo decision idempotente => transactionId: ${transaction.transactionId}`);
    const decision = decisionEntity.toRecord();
    const wasPersisted = await this.fraudDecisionRepository.saveIfAbsent(decision);
    if (!wasPersisted) return FraudEvaluationResultMapper.duplicate(transaction.transactionId);

    if (decision.decision === FraudDecisionStatuses.APPROVE) {
      return FraudEvaluationResultMapper.evaluated(transaction.transactionId, decision);
    }

    await this.notifyRiskTeam(decision, transaction);
    return FraudEvaluationResultMapper.evaluated(transaction.transactionId, decision);
  }

  private async notifyRiskTeam(decision: FraudDecisionRecord, transaction: StreamTransactionEvent): Promise<void> {
    this.logger.log(`[PASO 6] Notificando equipo de riesgo => transactionId: ${decision.transactionId}`);
    const alert = FraudAlertMapper.fromDecision(decision, transaction);

    const [notification] = await Promise.allSettled([this.fraudAlertRepository.publish(alert)]);
    if (notification.status === 'fulfilled') return;

    const reason = notification.reason instanceof Error ? notification.reason.message : String(notification.reason);
    this.logger.warn(`No se pudo notificar alerta => transactionId: ${decision.transactionId} | reason: ${reason}`);
  }
}
