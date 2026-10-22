import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

const SPRINT_TAG = /^20[0-9]{4}-s[0-9]+-rc[0-9]+$/;

// CI writes components/<repo>.md; people write notes.md (tag only).
// cut_at stays a string: buildSprints compares it as a string.
const component = z.object({
  repo: z.string(),
  tag: z.string().regex(SPRINT_TAG),
  commit: z.string().regex(/^[0-9a-f]{40}$/),
  base: z.literal('main'),
  previous_tag: z.string().nullable(),
  cut_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  release_url: z.string().url(),
  prs: z.array(z.object({ number: z.number().int(), title: z.string(), url: z.string().url() })),
  notes_missing: z.boolean(),
});
const notes = z.object({ tag: z.string().regex(SPRINT_TAG) }).strict();

export const collections = {
  releases: defineCollection({
    loader: glob({ base: './src/releases', pattern: '*/rc*/{notes,components/*}.md' }),
    schema: z.union([component, notes]),
  }),
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
