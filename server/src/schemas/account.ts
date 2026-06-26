import { z } from 'zod';

export const AccountStatusSchema = z.object({
  status: z.enum(['active', 'disabled'])
});

export const InviteCodeCreateSchema = z.object({
  code: z.string().trim().min(3).max(80).optional()
});

export const InviteCodeStatusSchema = z.object({
  status: z.enum(['unused', 'disabled'])
});
