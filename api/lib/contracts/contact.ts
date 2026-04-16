import { z } from 'zod';

export const contactCategory = z.enum([
  'general',
  'sponsorship',
  'speaking',
  'venue',
  'press',
  'other',
]);
export type ContactCategory = z.infer<typeof contactCategory>;

export const contactSubmission = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(200),
  organisation: z.string().max(120).optional(),
  category: contactCategory,
  subject: z.string().min(4).max(200),
  message: z.string().min(20).max(4000),
  turnstileToken: z.string().min(1),
});

export type ContactSubmission = z.infer<typeof contactSubmission>;

export const contactResponse = z.object({
  ok: z.boolean(),
  error: z.string().optional(),
});
export type ContactResponse = z.infer<typeof contactResponse>;
