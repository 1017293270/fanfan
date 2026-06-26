import { z } from 'zod';

export const RegisterSchema = z.object({
  inviteCode: z.string().trim().min(1).max(80),
  username: z.string().trim().min(3).max(32).regex(/^[a-zA-Z0-9_-]+$/),
  displayName: z.string().trim().min(1).max(40),
  password: z.string().min(8).max(128)
});

export const LoginSchema = z.object({
  username: z.string().trim().min(1).max(32),
  password: z.string().min(1).max(128)
});
