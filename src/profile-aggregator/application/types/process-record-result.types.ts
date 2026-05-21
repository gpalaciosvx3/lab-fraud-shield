import { CustomException } from '../../../common/errors/custom.exception';

export interface ProcessRecordResult {
  sequenceNumber: string;
  retry: boolean;
  error?: CustomException;
}
