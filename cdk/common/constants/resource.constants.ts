import { NamingConstants } from './naming.constants';

export class ResourceConstants {
  static readonly LAMBDA_TX_INGESTER  = NamingConstants.LMB_001;
  static readonly LAMBDA_PROFILE_AGGREGATOR = NamingConstants.LMB_002;
  static readonly LAMBDA_FRAUD_EVALUATOR = NamingConstants.LMB_003;
  static readonly API_NAME            = NamingConstants.APG_001;
  static readonly WORKER_ROLE         = NamingConstants.ROL_001;
  static readonly KINESIS_STREAM      = NamingConstants.KDS_001;
  static readonly PROFILE_AGGREGATOR_TABLE = NamingConstants.DDB_001;
  static readonly FRAUD_RULES_TABLE = NamingConstants.DDB_002;
  static readonly FRAUD_DECISIONS_TABLE = NamingConstants.DDB_003;
  static readonly FRAUD_ALERTS_TOPIC = NamingConstants.SNS_001;
  static readonly AUDIT_DELIVERY_ROLE = NamingConstants.ROL_002;
  static readonly AUDIT_READER_ROLE   = NamingConstants.ROL_003;
  static readonly AUDIT_FIREHOSE      = NamingConstants.FHS_001;
  static readonly AUDIT_BUCKET        = NamingConstants.S3_001;
}
