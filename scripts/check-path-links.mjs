// Checks every href in PhaseTimeline lists against the built site.
// starlight-links-validator cannot see these: they live inside a JSX
// expression attribute (phases={[{ href: … }]}), not a plain string attribute.
//
// Run after `pnpm build`:  node scripts/check-path-links.mjs
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DOCS = 'src/content/docs';
const DIST = 'dist';

let checked = 0;
const broken = [];

const pages = readdirSync(DOCS, { recursive: true }).filter((f) => f.endsWith('.mdx'));
for (const file of pages) {
  const src = readFileSync(join(DOCS, file), 'utf8');
  if (!src.includes('<PhaseTimeline')) continue;
  for (const [, href] of src.matchAll(/href:\s*'([^']+)'/g)) {
    if (!href.startsWith('/')) continue;
    checked++;
    if (!existsSync(join(DIST, href, 'index.html'))) broken.push(`${file} -> ${href}`);
  }
}

if (broken.length) {
  console.error(`Broken path links (${broken.length}/${checked}):`);
  for (const b of broken) console.error(`  ${b}`);
  process.exit(1);
}
console.log(`All ${checked} PhaseTimeline links resolve.`);
