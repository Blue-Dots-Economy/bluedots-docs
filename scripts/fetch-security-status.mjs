// Writes src/data/security-status.json for the Security status page.
//
// Runs in the deploy workflow before the site build, on the runner's own
// Node, before `pnpm install`. Uses Node built-ins only.
//
// Environment:
//   SECURITY_STATUS_TOKEN     GitHub App installation token with code scanning
//                             read access. Without it, the file is written with
//                             the on/off flags and no scan dates.
//
// SonarCloud ratings come from its public API and need no token.
//   SECURITY_STATUS_DISABLED  Optional. Comma-separated `repo`, `repo:sonar` or
//                             `repo:scans` entries to switch reports off.
//
// Never print or write the token. The script always exits 0: a failed fetch
// must not stop the docs from deploying.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GITHUB_ORG, SECURITY_STATUS_COMPONENTS } from '../src/config/security-status.config.mjs';
import {
  applyDisabled,
  latestScanDates,
  allScanGroupsFound,
  buildStatusFile,
  sonarMeasuresUrl,
  sonarRatings,
} from '../src/lib/security-status.mjs';

const OUTPUT = resolve(dirname(fileURLToPath(import.meta.url)), '../src/data/security-status.json');
const API = 'https://api.github.com';
const PER_PAGE = 100;
// Analyses are listed newest first. Five pages covers every scan type in the
// busiest repo; older pages only hold older dates.
const MAX_PAGES = 5;
const REQUEST_TIMEOUT_MS = 15_000;

/**
 * Lists code scanning analyses on main, newest first, until every column has
 * a date or MAX_PAGES is reached.
 * @param {string} repo
 * @param {string} token
 */
async function fetchScanDates(repo, token) {
  /** @type {object[]} */
  const seen = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const url = `${API}/repos/${GITHUB_ORG}/${repo}/code-scanning/analyses?ref=refs/heads/main&per_page=${PER_PAGE}&page=${page}`;
    const res = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'bluedots-docs-security-status',
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    // 404: code scanning has never run on this repo, so nothing is set up.
    if (res.status === 404) break;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const batch = await res.json();
    if (!Array.isArray(batch)) throw new Error('unexpected response');
    seen.push(...batch);
    if (batch.length < PER_PAGE || allScanGroupsFound(latestScanDates(seen))) break;
  }
  return latestScanDates(seen);
}

/**
 * Reads the SonarCloud ratings of one project.
 * @param {string} repo
 * @returns {Promise<import('../src/lib/security-status.mjs').SonarResult>}
 */
async function fetchSonar(repo) {
  const res = await fetch(sonarMeasuresUrl(repo), {
    headers: { Accept: 'application/json', 'User-Agent': 'bluedots-docs-security-status' },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = await res.json();
  const measures = body?.component?.measures;
  if (!Array.isArray(measures)) throw new Error('unexpected response');
  return { state: 'ok', ...sonarRatings(measures) };
}

async function main() {
  const { components, warnings } = applyDisabled(SECURITY_STATUS_COMPONENTS, process.env.SECURITY_STATUS_DISABLED);
  for (const w of warnings) console.warn(`::warning::${w}`);

  const token = process.env.SECURITY_STATUS_TOKEN ?? '';
  const scansFetched = token !== '';
  if (!scansFetched) console.warn('::warning::No SECURITY_STATUS_TOKEN; the page will show no scan dates.');

  /** @type {Record<string, import('../src/lib/security-status.mjs').RepoScans>} */
  const scans = {};
  if (scansFetched) {
    for (const c of components) {
      if (!c.scans) continue;
      try {
        scans[c.repo] = { state: 'ok', dates: await fetchScanDates(c.repo, token) };
      } catch (err) {
        // Log the repo and status only; the response body is not printed.
        console.warn(`::warning::Scan dates for ${c.repo} not available (${err instanceof Error ? err.message : 'error'}).`);
        scans[c.repo] = { state: 'unavailable' };
      }
    }
  }

  /** @type {Record<string, import('../src/lib/security-status.mjs').SonarResult>} */
  const sonar = {};
  for (const c of components) {
    if (!c.sonar) continue;
    try {
      sonar[c.repo] = await fetchSonar(c.repo);
    } catch (err) {
      console.warn(`::warning::SonarCloud ratings for ${c.repo} not available (${err instanceof Error ? err.message : 'error'}).`);
      sonar[c.repo] = { state: 'unavailable' };
    }
  }

  const file = buildStatusFile({ components, scans, sonar, scansFetched, generatedAt: new Date().toISOString() });
  mkdirSync(dirname(OUTPUT), { recursive: true });
  writeFileSync(OUTPUT, `${JSON.stringify(file, null, 2)}\n`);
  console.log(`Wrote ${OUTPUT}: ${file.components.length} components, scan dates ${scansFetched ? 'fetched' : 'not fetched'}.`);
}

main().catch((err) => {
  console.warn(`::warning::Security status fetch failed (${err instanceof Error ? err.message : 'error'}).`);
  // Still write the on/off flags, so a switched-off report stays hidden.
  try {
    const { components } = applyDisabled(SECURITY_STATUS_COMPONENTS, process.env.SECURITY_STATUS_DISABLED);
    const file = buildStatusFile({ components, scans: {}, sonar: {}, scansFetched: false, generatedAt: new Date().toISOString() });
    mkdirSync(dirname(OUTPUT), { recursive: true });
    writeFileSync(OUTPUT, `${JSON.stringify(file, null, 2)}\n`);
  } catch {
    console.warn('::warning::Security status file not written.');
  }
});
