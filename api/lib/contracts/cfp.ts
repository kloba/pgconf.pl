import { z } from 'zod';

export const cfpTalkFormat = z.enum(['talk-25', 'talk-45', 'workshop-90', 'lightning-5']);
export type CfpTalkFormat = z.infer<typeof cfpTalkFormat>;

export const cfpLevel = z.enum(['beginner', 'intermediate', 'advanced']);
export type CfpLevel = z.infer<typeof cfpLevel>;

export const cfpSubmission = z.object({
  speakerName: z.string().min(2).max(120),
  speakerEmail: z.string().email().max(200),
  speakerBio: z.string().min(40).max(1500),
  speakerCompany: z.string().max(120).optional(),
  speakerCountry: z.string().min(2).max(80),
  speakerPronouns: z.string().max(40).optional(),
  talkTitle: z.string().min(8).max(160),
  talkAbstract: z.string().min(120).max(3000),
  talkFormat: cfpTalkFormat,
  talkLevel: cfpLevel,
  talkTopics: z.array(z.string().min(2).max(40)).min(1).max(5),
  needsTravelSupport: z.boolean().default(false),
  notes: z.string().max(1000).optional(),
  turnstileToken: z.string().min(1),
});

export type CfpSubmission = z.infer<typeof cfpSubmission>;

export const cfpResponse = z.object({
  ok: z.boolean(),
  id: z.string().optional(),
  error: z.string().optional(),
});
export type CfpResponse = z.infer<typeof cfpResponse>;
