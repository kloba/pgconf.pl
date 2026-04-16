import { defineCollection, z } from 'astro:content';

const news = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    excerpt: z.string().max(280),
    date: z.coerce.date(),
    author: z.string().optional(),
    draft: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
  }),
});

const FAQ_CATEGORY = ['general', 'attendance', 'cfp', 'travel'] as const;
const faq = defineCollection({
  type: 'content',
  schema: z.object({
    question: z.string(),
    category: z.enum(FAQ_CATEGORY).default('general'),
    order: z.number().default(100),
  }),
});

export const collections = {
  news,
  faq,
};
