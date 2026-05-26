import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import mermaid from 'astro-mermaid';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: process.env.DOCS_SITE_URL ?? 'http://localhost:4321',
  base: process.env.DOCS_BASE ?? '/',
  integrations: [
    sitemap(),
    mermaid({
      autoTheme: true,
    }),
    starlight({
      title: 'Documentation',
      description:
        'Architecture, setup, and package documentation for the DPG backend monorepo.',
      lastUpdated: true,
      pagination: true,
      tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 3 },
      logo: { src: './src/assets/logo.png', alt: 'Blue Dots Economy', replacesTitle: false },
      components: { Footer: './src/components/CustomFooter.astro' },
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/Blue-Dots-Economy/bluedots-docs',
        },
      ],
      editLink: {
        baseUrl: 'https://github.com/Blue-Dots-Economy/bluedots-docs/edit/main/',
      },
      head: [
        { tag: 'link', attrs: { rel: 'preconnect', href: 'https://fonts.googleapis.com' } },
        { tag: 'link', attrs: { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: true } },
        { tag: 'link', attrs: { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Source+Sans+3:ital,wght@0,200..900;1,200..900&display=swap' } },
        {
          tag: 'meta',
          attrs: {
            name: 'theme-color',
            content: '#ffffff',
            media: '(prefers-color-scheme: light)',
          },
        },
        {
          tag: 'meta',
          attrs: {
            name: 'theme-color',
            content: '#0f172a',
            media: '(prefers-color-scheme: dark)',
          },
        },
        {
          tag: 'meta',
          attrs: {
            property: 'og:image',
            content: '/og-default.png',
          },
        },
      ],
      customCss: ['./src/styles/custom.css'],
      sidebar: [
        {
          label: 'Start Here',
          items: [
            { label: 'What Is DPG?', slug: 'index' },
            { label: 'Vocabulary', slug: 'concepts/vocabulary' },
            { label: 'Architecture', slug: 'concepts/architecture' },
            {
              label: 'Architecture Diagrams',
              slug: 'concepts/architecture-diagrams',
            },
            { label: 'Getting Started', slug: 'getting-started' },
            { label: 'Environment', slug: 'environment' },
          ],
        },
        {
          label: 'Hosting',
          items: [
            { label: 'Local And Docker', slug: 'hosting/local-docker' },
            { label: 'Single Instance', slug: 'hosting/single-domain' },
            {
              label: 'Multi-Instance Hosting',
              slug: 'hosting/multi-domain-instance',
            },
            {
              label: 'Dokploy',
              slug: 'hosting/dokploy',
            },
          ],
        },
        {
          label: 'Network Schema',
          items: [
            {
              label: 'Overview',
              slug: 'schemas/overview',
            },
            {
              label: 'Authoring Guide',
              slug: 'schemas/authoring',
            },
            {
              label: 'Action Flow Guide',
              slug: 'schemas/action-flow',
            },
            {
              label: 'Use Case Examples',
              slug: 'schemas/examples',
            },
            {
              label: 'Reference',
              slug: 'schemas/network-actions-domain',
            },
            {
              label: 'Existing Example Networks',
              slug: 'schemas/dot-examples',
            },
          ],
        },
        {
          label: 'API',
          items: [
            { label: 'API Overview', slug: 'apps/api' },
            { label: 'Running And Docker', slug: 'apps/api/running' },
            { label: 'Auth', slug: 'apps/api/auth' },
            { label: 'Items', slug: 'apps/api/items' },
            { label: 'Network Fetch', slug: 'apps/api/network-fetch' },
            { label: 'Actions And Events', slug: 'apps/api/actions-events' },
            { label: 'Schemas And Cache', slug: 'apps/api/schemas-cache' },
            { label: 'Route Reference', slug: 'apps/api/route-reference' },
            {
              label: 'Better Auth And OTP',
              slug: 'auth/better-auth-unified-otp',
            },
            { label: 'DB Access', slug: 'database/access' },
          ],
        },
        {
          label: 'UI',
          items: [
            { label: 'UI Overview', slug: 'apps/ui' },
            { label: 'Running The UI', slug: 'apps/ui/running' },
            {
              label: 'Credential Import And Wallets',
              slug: 'apps/ui/credential-import-and-wallets',
            },
            { label: 'Hardcoded Parts', slug: 'apps/ui/hardcoded-parts' },
            {
              label: 'Schema-Generated Parts',
              slug: 'apps/ui/schema-generated-parts',
            },
            { label: 'Components', slug: 'apps/ui/components' },
            { label: 'Utils And Packages', slug: 'apps/ui/utils-and-packages' },
            { label: 'Custom UI Guide', slug: 'apps/ui/custom-ui-guide' },
            { label: 'Maps', slug: 'apps/ui/maps' },
          ],
        },
        { label: 'Internals', items: [{ autogenerate: { directory: 'packages' } }] },
        { label: 'Services', items: [{ autogenerate: { directory: 'services' } }] },
      ],
    }),
  ],
});
