// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightLinksValidator from 'starlight-links-validator';
import starlightImageZoom from 'starlight-image-zoom';
import starlightOpenAPI, { openAPISidebarGroups } from 'starlight-openapi';

export default defineConfig({
  site: 'https://docs-signals-dpg.bluedotseconomy.org',

  integrations: [
    starlight({
      // errorOnLocalLinks off: installation guides legitimately link to
      // http://localhost:<port> for locally running services.
      plugins: [
        starlightLinksValidator({ errorOnLocalLinks: false }),
        starlightImageZoom(),
        starlightOpenAPI([
          { base: 'api/signals-dpg', schema: './src/openapi/signals-dpg.json', label: 'Signals-DPG API' },
          { base: 'api/aggregator-dpg', schema: './src/openapi/aggregator-dpg.json', label: 'Aggregator-DPG API' },
          { base: 'api/signals-search', schema: './src/openapi/signals-search.json', label: 'Signals-Search API' },
        ]),
      ],
      expressiveCode: {
        styleOverrides: {
          borderRadius: '0.75rem',
          codeFontFamily: "'DM Mono', ui-monospace, monospace",
          uiFontFamily: "'DM Sans', system-ui, sans-serif",
        },
      },
      title: 'Documentation',
      description:
        'Open documentation for the Blue Dots Economy — the Signals and Aggregator Digital Public Goods (DPGs) that power local discovery.',
      tagline: 'Discovery infrastructure for India’s districts',
      // Header uses the PNG wordmark; the square SVG dot-mark (logo-*.svg)
      // is the hero image on the landing page.
      logo: {
        light: './src/assets/logo-light.png',
        dark: './src/assets/logo-dark.png',
        replacesTitle: false,
        alt: 'Blue Dots Economy',
      },
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/Blue-Dots-Economy',
        },
        {
          icon: 'external',
          label: 'bluedotseconomy.org',
          href: 'https://bluedotseconomy.org',
        },
      ],
      lastUpdated: true,
      pagination: true,
      customCss: [
        // Self-hosted DM superfamily (display / body / code).
        '@fontsource/dm-serif-display/400.css',
        '@fontsource/dm-serif-display/400-italic.css',
        '@fontsource/dm-sans/400.css',
        '@fontsource/dm-sans/500.css',
        '@fontsource/dm-sans/700.css',
        '@fontsource/dm-mono/400.css',
        '@fontsource/dm-mono/500.css',
        './src/styles/custom.css',
      ],
      // Client-side Mermaid rendering (no build-time dependency). Diagrams are
      // authored as <pre class="mermaid"> blocks in Markdown; this script loads
      // Mermaid from a CDN and (re-)renders on every Astro page load, matching
      // the active light/dark theme.
      head: [
        {
          tag: 'script',
          attrs: { type: 'module' },
          content: [
            "import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';",
            'function renderMermaid() {',
            "  const theme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'default';",
            "  mermaid.initialize({ startOnLoad: false, theme, themeVariables: theme === 'default' ? { primaryColor: '#d6e4ff', primaryBorderColor: '#1335b5', primaryTextColor: '#0a2540' } : {} });",
            "  const nodes = document.querySelectorAll('pre.mermaid:not([data-processed])');",
            '  if (nodes.length) mermaid.run({ nodes });',
            '}',
            "document.addEventListener('astro:page-load', renderMermaid);",
          ].join('\n'),
        },
      ],
      sidebar: [
        {
          label: 'Start Here',
          items: [
            { label: 'Build & integrate', slug: 'start/build' },
            { label: 'Deploy for a district', slug: 'start/deploy' },
            { label: 'Onboard participants', slug: 'start/onboard' },
            { label: 'Evaluate impact', slug: 'start/evaluate' },
          ],
        },
        {
          label: 'Overview',
          items: [
            { label: 'Introduction', slug: 'overview/introduction' },
            { label: 'The Paradox of Proximity', slug: 'overview/paradox-of-proximity' },
            { label: 'The Blue Dots Approach', slug: 'overview/the-blue-dots-approach' },
            { label: 'Blue Dots as a DPG', slug: 'overview/blue-dots-as-a-dpg' },
            { label: 'Who Is This For', slug: 'overview/who-is-this-for' },
          ],
        },
        {
          label: 'Core Concepts',
          items: [
            { label: 'Overview', slug: 'core-concepts' },
            { label: 'Signals (Blue Dots)', slug: 'core-concepts/signals' },
            { label: 'Aggregators', slug: 'core-concepts/aggregators' },
            { label: 'Networks, Domains & Instances', slug: 'core-concepts/networks-domains-instances' },
            { label: 'Items, Actions & Events', slug: 'core-concepts/items-actions-events' },
            { label: 'Glossary', slug: 'core-concepts/glossary' },
            {
              label: 'Architecture',
              items: [
                { label: 'High-Level Architecture', slug: 'core-concepts/architecture/high-level-architecture' },
                { label: 'Signals DPG', slug: 'core-concepts/architecture/signals-dpg' },
                { label: 'Aggregator DPG', slug: 'core-concepts/architecture/aggregator-dpg' },
                { label: 'Data Model', slug: 'core-concepts/architecture/data-model' },
                { label: 'Identity & Auth', slug: 'core-concepts/architecture/identity-and-auth' },
                { label: 'Infrastructure & Deployment', slug: 'core-concepts/architecture/infrastructure' },
              ],
            },
            {
              label: 'Technical Documentation',
              items: [
                { label: 'Overview', slug: 'core-concepts/technical/overview' },
                { label: 'Schema-Driven Model', slug: 'core-concepts/technical/schema-driven-model' },
                { label: 'Read & Write Paths', slug: 'core-concepts/technical/read-write-paths' },
                { label: 'Tech Stack', slug: 'core-concepts/technical/tech-stack' },
              ],
            },
          ],
        },
        {
          label: 'Guides',
          items: [
            { label: 'Overview', slug: 'guides' },
            {
              label: 'Installation',
              items: [
                { label: 'Prerequisites', slug: 'guides/installation/prerequisites' },
                { label: 'Local Stack (Docker)', slug: 'guides/installation/local-stack' },
                { label: 'Signals DPG Setup', slug: 'guides/installation/signals-dpg' },
                { label: 'Aggregator DPG Setup', slug: 'guides/installation/aggregator-dpg' },
              ],
            },
            { label: 'Activating in a District', slug: 'guides/district-activation' },
            { label: 'Adaptor Onboarding', slug: 'guides/adaptor-onboarding' },
            { label: 'Configuration', slug: 'guides/configuration' },
            { label: 'API Reference', slug: 'guides/api-reference' },
            { label: 'CI/CD & Build Pipeline', slug: 'guides/cicd-and-builds' },
            { label: 'Deployment', slug: 'guides/deployment' },
          ],
        },
        {
          label: 'API Reference',
          items: [{ label: 'Overview', slug: 'api' }, ...openAPISidebarGroups],
        },
        {
          label: 'Explore',
          items: [
            { label: 'Use Cases', slug: 'explore/use-cases' },
            { label: 'Pilots: Ghaziabad & Dharwad', slug: 'explore/pilots' },
            { label: 'The Economics of Local Discovery', slug: 'explore/economics' },
            { label: 'The Dots Family', slug: 'explore/beyond-livelihoods' },
          ],
        },
        {
          label: 'Community',
          items: [
            { label: 'Contributing', slug: 'community/contributing' },
            { label: 'Roadmap', slug: 'community/roadmap' },
            { label: 'Release Notes', slug: 'community/release-notes' },
          ],
        },
      ],
    }),
  ],
});
