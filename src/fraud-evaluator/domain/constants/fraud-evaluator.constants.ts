export class FraudEvaluatorConstants {
  static readonly KINESIS_PROCESS_CHUNK_SIZE = 25;
  static readonly DECISION_SCORE_REJECT = 3;
  static readonly DECISION_SCORE_REVIEW = 2;
  static readonly DECISION_SCORE_APPROVE = 1;
  static readonly NO_RULE_TRIGGERED = 'NO_RULE_TRIGGERED';
  static readonly NO_ANOMALY_DETECTED = 'NO_ANOMALY_DETECTED';
}
