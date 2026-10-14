import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      extend: z.object({
        // Heading ids (or "_top" for the intro) that get the gold "updated"
        // sparkle in the page and its table of contents. See PageTitle override.
        changed_sections: z.array(z.string()).optional(),
      }),
    }),
  }),
};
