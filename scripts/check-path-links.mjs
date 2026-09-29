// Checks every href in the Start Here PhaseTimeline lists against the built
// site. starlight-links-validator cannot see these: they live inside a JSX
// expression attribute (phases={[{ href: … }]}), not a plain string attribute.
//
// Run after `pnpm build`:  node scripts/check-path-links.mjs
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const HUBS = 'src/content/docs/start';
const DIST = 'dist';

let checked = 0;
const broken = [];

for (const file of readdirSync(HUBS).filter((f) => f.endsWith('.mdx'))) {
  const src = readFileSync(join(HUBS, file), 'utf8');
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
console.log(`All ${checked} Start Here path links resolve.`);
