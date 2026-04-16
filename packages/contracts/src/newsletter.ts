import { z } from 'zod';

export const newsletterSubscription = z.object({
  email: z.string().email().max(200),
  consent: z.literal(true),
  turnstileToken: z.string().min(1),
});

export type NewsletterSubscription = z.infer<typeof newsletterSubscription>;

export const newsletterResponse = z.object({
  ok: z.boolean(),
  error: z.string().optional(),
});
export type NewsletterResponse = z.infer<typeof newsletterResponse>;
