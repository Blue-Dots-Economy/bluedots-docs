// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightLinksValidator from 'starlight-links-validator';
import starlightImageZoom from 'starlight-image-zoom';
import starlightOpenAPI from 'starlight-openapi';
import { unified } from '@astrojs/markdown-remark';
import { slug } from 'github-slugger';
import { readFileSync } from 'node:fs';

// Sidebar group for one API reference: Overview + one link per tag-overview
// page (obsrv-style — individual operations are listed on the tag pages, not
// in the sidebar, which stays clean regardless of endpoint count). Tags are
// read from the committed specs, so a synced spec change updates the sidebar
// on the next build without touching this config.
function apiReferenceSidebarGroup(label, service) {
  const spec = JSON.parse(readFileSync(new URL(`./src/openapi/${service}.json`, import.meta.url), 'utf8'));
  return {
    label,
    collapsed: true,
    items: [
      { label: 'Overview', link: `/api/${service}/` },
      ...(spec.tags ?? []).map((tag) => ({
        label: tag.name,
        link: `/api/${service}/operations/tags/${slug(tag.name)}/`,
      })),
    ],
  };
}

export default defineConfig({
  site: 'https://docs.bluedotseconomy.org',

  // The hand-written API page was retired once /api/ became generated from
  // each service's OpenAPI. starlight-links-validator resolves links through
  // redirects, so inbound links stay valid. The rest keep URLs from before the
  // v1 persona restructure (Knowing about / Getting Started / Deployment) working.
  redirects: {
    '/guides/api-reference': '/api/',
    '/overview/introduction': '/about/introduction/',
    '/overview/the-blue-dots-approach': '/about/the-blue-dots-approach/',
    '/overview/blue-dots-as-a-dpg': '/about/blue-dots-as-a-dpg/',
    '/core-concepts/signals': '/about/key-concepts/signals/',
    '/core-concepts/blue-dot-lifecycle': '/about/key-concepts/blue-dot-lifecycle/',
    '/core-concepts/participant-profiles': '/about/key-concepts/participant-profiles/',
    '/core-concepts/aggregators': '/about/key-concepts/aggregators/',
    '/core-concepts/networks-domains-instances': '/about/key-concepts/networks-domains-instances/',
    '/core-concepts/items-actions-events': '/about/key-concepts/items-actions-events/',
    '/guides/district-activation': '/about/district-activation/',
    '/core-concepts/glossary': '/about/glossary/',
    '/core-concepts/architecture/high-level-architecture': '/get-started/block-diagram/',
    '/core-concepts/architecture/signals-dpg': '/get-started/architecture/signals-dpg/',
    '/core-concepts/architecture/aggregator-dpg': '/get-started/architecture/aggregator-dpg/',
    '/core-concepts/architecture/ai-diffusion-dpg': '/get-started/architecture/ai-diffusion-dpg/',
    '/core-concepts/architecture/data-model': '/get-started/architecture/data-model/',
    '/core-concepts/technical/schema-driven-model': '/get-started/architecture/schema-driven-model/',
    '/core-concepts/technical/read-write-paths': '/get-started/architecture/read-write-paths/',
    '/core-concepts/architecture/identity-and-auth': '/get-started/architecture/identity-and-auth/',
    '/core-concepts/architecture/infrastructure': '/get-started/architecture/infrastructure/',
    '/core-concepts/technical/tech-stack': '/get-started/architecture/tech-stack/',
    '/guides/adaptor-onboarding': '/deploy/steps/',
    '/guides/installation/local-setup/prerequisites': '/deploy/local/prerequisites/',
    '/guides/installation/local-setup/local-stack': '/deploy/local/local-stack/',
    '/guides/installation/local-setup/signals-dpg': '/deploy/local/signals-dpg/',
    '/guides/installation/local-setup/aggregator-dpg': '/deploy/local/aggregator-dpg/',
    '/guides/installation/local-setup/ai-diffusion-dpg': '/deploy/local/ai-diffusion-dpg/',
    '/guides/installation/cloud-setup/aws/infrastructure': '/deploy/cloud/aws-infrastructure/',
    '/guides/installation/cloud-setup/aws/deployment': '/deploy/cloud/aws-deployment/',
    '/guides/voice-ai-prompts': '/deploy/agents/voice-agent-prompts/',
    '/core-concepts/architecture/ai-diffusion-configuration': '/deploy/agents-platform/use-case-configuration/',
    '/guides/installation/local-setup/ai-diffusion-channels': '/deploy/agents-platform/optional-channels/',
    '/guides/keycloak-setup': '/deploy/configure/keycloak-setup/',
    '/core-concepts/architecture/keycloak-realm': '/deploy/configure/keycloak-realm/',
    '/guides/configuration': '/deploy/configure/configuration/',
    '/guides/customisation': '/deploy/configure/customisation/',
    '/guides/adding-a-dot': '/deploy/configure/adding-a-domain/',
    '/guides/api-conventions': '/api/conventions/',
    '/start/build': '/get-started/',
    '/start/deploy': '/deploy/',
    '/start/onboard': '/about/',
    '/start/evaluate': '/about/',
    '/overview/who-is-this-for': '/',
    '/core-concepts': '/about/',
    '/core-concepts/technical/overview': '/get-started/',
    '/guides': '/deploy/',
    '/guides/installation': '/deploy/',
  },

  // Astro 7 defaults to the new Sätteri Markdown processor, which
  // starlight-image-zoom doesn't support yet (HiDeoo/starlight-image-zoom#63).
  // Pin the classic unified/remark processor until it does.
  markdown: { processor: unified() },

  integrations: [
    starlight({
      // errorOnLocalLinks off: installation guides legitimately link to
      // http://localhost:<port> for locally running services.
      plugins: [
        starlightLinksValidator({
          errorOnLocalLinks: false,
          // The validator only inspects markdown links, frontmatter prev/next and
          // the two built-in link components. NavCard is ours, so register it —
          // otherwise every "Go deeper" card is unchecked. PhaseTimeline passes
          // its hrefs inside a JSX expression (phases={[…]}), which cannot be
          // registered at all; scripts/check-path-links.mjs covers those.
          components: [['NavCard', 'href']],
          // starlight-openapi injects its pages via a separate integration
          // (not the content collection), so starlight-links-validator can't
          // see them as valid targets — exclude the generated reference roots.
          // Pages generated by starlight-openapi are injected routes the
          // validator can't see; the plugin guarantees their internal links.
          exclude: ({ link }) =>
            ['/api/signals-dpg/', '/api/aggregator-dpg/', '/api/signals-search/'].some((prefix) =>
              link.startsWith(prefix),
            ),
        }),
        starlightImageZoom(),
        starlightOpenAPI([
          // sidebar.label replaces the deprecated top-level `label`; badges add
          // the HTTP-method chip next to each operation link (disambiguates
          // same-path operations like PATCH vs DELETE /item/{itemId}).
          {
            base: 'api/signals-dpg',
            schema: './src/openapi/signals-dpg.json',
            sidebar: { label: 'Signals-DPG API', operations: { badges: true } },
          },
          {
            base: 'api/aggregator-dpg',
            schema: './src/openapi/aggregator-dpg.json',
            sidebar: { label: 'Aggregator-DPG API', operations: { badges: true } },
          },
          {
            base: 'api/signals-search',
            schema: './src/openapi/signals-search.json',
            sidebar: { label: 'Signals-Search API', operations: { badges: true } },
          },
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
        'Documentation for Blue Dots, open-source software that helps people and organisations near each other find each other.',
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
      components: {
        // Adds the "← <group>" back link on generated API operation pages,
        // which the sidebar deliberately doesn't list. Also draws the gold
        // "updated" sparkle on changed pages and sections (changed_sections),
        // currently switched off by SHOW_CHANGED_MARKERS in that component.
        PageTitle: './src/components/ApiPageTitle.astro',
      },
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
        // Starlight's sidebar state persistence restores each group's previous
        // open/closed state on navigation, which can override the
        // server-rendered `open` on the group that contains the CURRENT page
        // (e.g. landing on a tag Overview via next/prev links leaves its group
        // collapsed). Re-open the ancestors of the active link after restore.
        {
          tag: 'script',
          content: [
            "document.addEventListener('DOMContentLoaded', () => {",
            "  let el = document.querySelector('#starlight__sidebar a[aria-current=\"page\"]');",
            '  while (el) {',
            "    el = el.parentElement && el.parentElement.closest('details');",
            '    if (el) el.open = true;',
            '  }',
            '});',
          ].join('\n'),
        },
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
          label: 'Knowing about Blue Dots',
          items: [
            { label: 'Overview', slug: 'about' },
            { label: 'Introduction', slug: 'about/introduction' },
            { label: 'The Blue Dots Approach', slug: 'about/the-blue-dots-approach' },
            { label: 'Blue Dots as a DPG', slug: 'about/blue-dots-as-a-dpg' },
            {
              label: 'Key Concepts',
              items: [
                { label: 'Signals (blue dots)', slug: 'about/key-concepts/signals' },
                { label: 'The Blue Dot Lifecycle', slug: 'about/key-concepts/blue-dot-lifecycle' },
                { label: 'Participant Profiles', slug: 'about/key-concepts/participant-profiles' },
                { label: 'Aggregators', slug: 'about/key-concepts/aggregators' },
                { label: 'Domains, Participant Types & Instances', slug: 'about/key-concepts/networks-domains-instances' },
                { label: 'Items, Actions & Events', slug: 'about/key-concepts/items-actions-events' },
              ],
            },
            { label: 'Activating Blue Dots in a District', slug: 'about/district-activation' },
            { label: 'Cost & Sizing', slug: 'about/cost-and-sizing' },
            { label: 'Glossary', slug: 'about/glossary' },
          ],
        },
        {
          label: 'Getting Started',
          items: [
            { label: 'Overview', slug: 'get-started' },
            { label: 'Block Diagram: How the DPGs Interconnect', slug: 'get-started/block-diagram' },
            {
              label: 'Architecture',
              items: [
                { label: 'Signals DPG', slug: 'get-started/architecture/signals-dpg' },
                { label: 'Signals Search', slug: 'get-started/architecture/signals-search' },
                { label: 'Aggregator DPG', slug: 'get-started/architecture/aggregator-dpg' },
                { label: 'AI Diffusion DPG', slug: 'get-started/architecture/ai-diffusion-dpg' },
                { label: 'Data Model', slug: 'get-started/architecture/data-model' },
                { label: 'Schema-Driven Model', slug: 'get-started/architecture/schema-driven-model' },
                { label: 'Read & Write Paths', slug: 'get-started/architecture/read-write-paths' },
                { label: 'Identity & Auth', slug: 'get-started/architecture/identity-and-auth' },
                { label: 'Infrastructure', slug: 'get-started/architecture/infrastructure' },
                { label: 'Tech Stack', slug: 'get-started/architecture/tech-stack' },
              ],
            },
            { label: 'Voice Bots', slug: 'get-started/voice-bots' },
          ],
        },
        {
          label: 'Start your Deployment',
          items: [
            { label: 'Overview', slug: 'deploy' },
            { label: 'Steps of Deployment', slug: 'deploy/steps' },
            {
              label: 'Deploy the DPGs: Local',
              items: [
                { label: 'Prerequisites', slug: 'deploy/local/prerequisites' },
                { label: 'Local Stack (Docker)', slug: 'deploy/local/local-stack' },
                { label: 'Signals DPG', slug: 'deploy/local/signals-dpg' },
                { label: 'Aggregator DPG', slug: 'deploy/local/aggregator-dpg' },
                { label: 'AI Diffusion DPG', slug: 'deploy/local/ai-diffusion-dpg' },
              ],
            },
            {
              label: 'Deploy the DPGs: Cloud',
              items: [
                { label: 'AWS Infrastructure', slug: 'deploy/cloud/aws-infrastructure' },
                { label: 'AWS Deployment', slug: 'deploy/cloud/aws-deployment' },
                { label: 'Tata Cloud Infrastructure Requirements', slug: 'deploy/cloud/tata-cloud-infrastructure' },
                { label: 'Tata Cloud Deployment', slug: 'deploy/cloud/tata-cloud-deployment' },
              ],
            },
            {
              label: 'Deploy the Agents: Seeker / Provider',
              items: [
                { label: 'Voice Agent Prompts', slug: 'deploy/agents/voice-agent-prompts' },
              ],
            },
            {
              label: 'Deploy the Agents: Platform',
              items: [
                { label: 'Configuring an AI Diffusion Use Case', slug: 'deploy/agents-platform/use-case-configuration' },
                { label: 'Optional Channels', slug: 'deploy/agents-platform/optional-channels' },
              ],
            },
            {
              label: 'Configure & Customise',
              items: [
                { label: 'Keycloak Setup', slug: 'deploy/configure/keycloak-setup' },
                { label: 'Keycloak Realm Reference', slug: 'deploy/configure/keycloak-realm' },
                { label: 'Configuration', slug: 'deploy/configure/configuration' },
                { label: 'Customisation & Branding', slug: 'deploy/configure/customisation' },
                { label: 'Adding a New Domain', slug: 'deploy/configure/adding-a-domain' },
              ],
            },
            {
              label: 'API Reference',
              collapsed: true,
              items: [
                { label: 'Overview', slug: 'api' },
                { label: 'API Conventions', slug: 'api/conventions' },
                { label: 'Building Search Requests', slug: 'api/search-requests' },
                apiReferenceSidebarGroup('Signals-DPG API', 'signals-dpg'),
                apiReferenceSidebarGroup('Aggregator-DPG API', 'aggregator-dpg'),
                apiReferenceSidebarGroup('Signals-Search API', 'signals-search'),
              ],
            },
          ],
        },
        // Not in the v1 sidebar, but still served so existing links keep
        // working: explore/*, overview/paradox-of-proximity (moving to
        // bluedotseconomy.org), guides/cicd-and-builds and
        // community/contributing (moving to the repos), community/roadmap and
        // community/release-notes (placement not decided).
      ],
    }),
  ],
});
