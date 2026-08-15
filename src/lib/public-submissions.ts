import { z } from 'zod';

export const enquiryTypeSchema = z.enum(['general', 'review', 'feature', 'partnership', 'bug', 'support', 'praise']);
export const enquiryStatusSchema = z.enum(['new', 'in_progress', 'resolved']);
export const jobApplicationStatusSchema = z.enum(['new', 'reviewing', 'interview', 'rejected', 'accepted', 'withdrawn']);

const nameSchema = z.string().trim().min(1).max(120);
const emailSchema = z.string().trim().email().max(320).transform((value) => value.toLowerCase());
const optionalUrlSchema = z.string().trim().url().max(2048).optional().or(z.literal(''));

export const createEnquirySchema = z.object({
  name: nameSchema,
  email: emailSchema,
  type: enquiryTypeSchema.default('general'),
  message: z.string().trim().min(1).max(10_000),
}).strict();

export const createJobApplicationSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  role: z.string().trim().min(1).max(160),
  portfolioUrl: optionalUrlSchema,
  resumeUrl: optionalUrlSchema,
  coverLetter: z.string().trim().min(1).max(20_000),
}).strict();

export const updateEnquirySchema = z.object({
  status: enquiryStatusSchema,
}).strict();

export const updateJobApplicationSchema = z.object({
  status: jobApplicationStatusSchema,
}).strict();

export function formError(message: string, fields?: Record<string, unknown>) {
  return { error: message, code: 'VALIDATION_ERROR', ...(fields ? { fields } : {}) };
}
