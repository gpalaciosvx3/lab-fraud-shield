import { FraudAlert } from '../types/fraud-alert.types';

export abstract class FraudAlertRepository {
  abstract publish(alert: FraudAlert): Promise<void>;
}
