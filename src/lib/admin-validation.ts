import { NextResponse } from 'next/server';
import { z } from 'zod';

export const roleSchema = z.enum(['user', 'admin']);
export const planSchema = z.enum(['free', 'pro', 'enterprise']);
export const subscriptionStatusSchema = z.enum([
  'inactive',
  'active',
  'trialing',
  'past_due',
  'canceled',
  'unpaid',
]);

const nameSchema = z.string().trim().min(1).max(120);
const emailSchema = z.string().trim().email().max(320).transform((value) => value.toLowerCase());

export const createUserSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    role: roleSchema.default('user'),
    plan: planSchema.default('free'),
    upsert: z.boolean().default(true),
  })
  .strict();

export const updateUserSchema = z
  .object({
    name: nameSchema.optional(),
    role: roleSchema.optional(),
    plan: planSchema.optional(),
    subscriptionStatus: subscriptionStatusSchema.optional(),
    emailVerified: z.boolean().optional(),
  })
  .strict();

export function privateJson<T>(body: T, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      Pragma: 'no-cache',
    },
  });
}

export function validationError(error: z.ZodError) {
  const field = error.issues[0]?.path[0];
  const codeByField: Record<string, string> = {
    name: 'INVALID_NAME',
    role: 'INVALID_ROLE',
    plan: 'INVALID_PLAN',
    subscriptionStatus: 'INVALID_SUBSCRIPTION_STATUS',
    emailVerified: 'INVALID_EMAIL_VERIFIED',
    email: 'INVALID_EMAIL',
  };

  return privateJson(
    {
      error: 'Invalid request body',
      code: typeof field === 'string' ? (codeByField[field] ?? 'INVALID_REQUEST') : 'INVALID_REQUEST',
      fields: error.flatten().fieldErrors,
    },
    400,
  );
}
