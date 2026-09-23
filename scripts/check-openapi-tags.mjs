// Every tag used by an operation must also be declared in the spec's top-level
// `tags` array. starlight-openapi only generates a tag page for a declared tag,
// and astro.config.mjs builds the sidebar from the same list — so an undeclared
// tag means its operations vanish from the nav and their "back to group" links
// 404, with a green build.
//
// The specs are synced from each service repo, so this guards the sync.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const DIR = 'src/openapi';
let failed = false;

for (const file of readdirSync(DIR).filter((f) => f.endsWith('.json'))) {
  const spec = JSON.parse(readFileSync(join(DIR, file), 'utf8'));
  const declared = new Set((spec.tags ?? []).map((t) => t.name));
  const used = new Map();

  for (const ops of Object.values(spec.paths ?? {})) {
    for (const op of Object.values(ops)) {
      if (!op || typeof op !== 'object') continue;
      for (const tag of op.tags ?? []) used.set(tag, (used.get(tag) ?? 0) + 1);
    }
  }

  const missing = [...used].filter(([tag]) => !declared.has(tag));
  if (missing.length) {
    failed = true;
    console.error(`${file}: ${missing.length} tag(s) used but not declared in \`tags\`:`);
    for (const [tag, n] of missing) console.error(`  ${tag} (${n} operation${n === 1 ? '' : 's'})`);
    console.error('  Fix in the source repo, then re-sync.');
  } else {
    console.log(`${file}: ${declared.size} tags, all used tags declared.`);
  }
}

process.exit(failed ? 1 : 0);
