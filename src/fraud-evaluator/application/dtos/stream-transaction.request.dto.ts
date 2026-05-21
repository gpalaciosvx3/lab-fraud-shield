import { z } from 'zod';

export const StreamTransactionRequestDto = z.object({
  transactionId: z.string().min(1),
  clientId: z.string().min(1),
  amount: z.number().positive(),
  region: z.string().min(1),
  type: z.string().min(1),
  timestamp: z.string().datetime(),
}).passthrough();

export type StreamTransactionRequestDtoType = z.infer<typeof StreamTransactionRequestDto>;
