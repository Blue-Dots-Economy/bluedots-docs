import { defineCollection, z } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      extend: z.object({
        tags: z.array(z.string()).optional(),
        audience: z.enum(['developer', 'operator', 'integrator']).optional(),
        status: z.enum(['stable', 'draft', 'deprecated']).optional(),
        lastReviewed: z.coerce.date().optional(),
      }),
    }),
  }),
};
