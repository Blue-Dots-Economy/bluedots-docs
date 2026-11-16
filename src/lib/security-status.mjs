// Pure helpers for the Security status page. No IO, no dependencies, so the
// fetch script can import them before `pnpm install` runs.
//
// The status file holds only component names, on/off flags, scan dates and
// SonarCloud ratings. Never copy counts, rule or alert data, IDs, URLs, refs
// or commits into it: the page is public and those fields describe open
// findings.

import { GITHUB_ORG, SCAN_AGE_DAYS, SONAR_METRICS } from '../config/security-status.config.mjs';

/**
 * @typedef {import('../config/security-status.config.mjs').StatusComponent} StatusComponent
 * @typedef {'code' | 'image' | 'codeAnalysis'} ScanGroup
 * @typedef {Record<ScanGroup, string | null>} ScanDates
 * @typedef {{ state: 'ok', dates: ScanDates } | { state: 'unavailable' }} RepoScans
 * @typedef {'A' | 'B' | 'C' | 'D' | 'E'} Rating
 * @typedef {{ qualityGate: 'passed' | 'failed' | null, security: Rating | null,
 *   reliability: Rating | null, maintainability: Rating | null, coverage: number | null }} SonarRatings
 * @typedef {({ state: 'ok' } & SonarRatings) | { state: 'unavailable' }} SonarResult
 * @typedef {{ repo: string, name: string, sonar: boolean, scans: boolean,
 *   scanResult: RepoScans | null, sonarResult: SonarResult | null }} StatusRow
 * @typedef {{ version: 2, generatedAt: string, scansFetched: boolean, components: StatusRow[] }} StatusFile
 * @typedef {'recent' | 'monthly' | 'stale'} AgeLevel
 */

export const STATUS_FILE_VERSION = 2;

/**
 * Scan rows, in page order. The code scan and the secret scan run in the same
 * workflow run, so they share one row.
 */
export const SCAN_GROUPS = /** @type {const} */ ([
  { key: 'code', label: 'Packages and secrets', tools: 'Trivy and Gitleaks' },
  { key: 'image', label: 'Container images', tools: 'Trivy' },
  { key: 'codeAnalysis', label: 'Code analysis', tools: 'CodeQL' },
]);

const REPORTS = new Set(['sonar', 'scans']);
const RATINGS = /** @type {const} */ (['A', 'B', 'C', 'D', 'E']);
const DAY_MS = 86_400_000;

/**
 * Parses SECURITY_STATUS_DISABLED: a comma-separated list of `repo`,
 * `repo:sonar` or `repo:scans`. Spaces are trimmed and case is ignored.
 * @param {string | undefined} value
 * @param {readonly StatusComponent[]} components
 * @returns {{ off: Map<string, Set<'sonar' | 'scans'>>, warnings: string[] }}
 */
export function parseDisabled(value, components) {
  const known = new Set(components.map((c) => c.repo.toLowerCase()));
  /** @type {Map<string, Set<'sonar' | 'scans'>>} */
  const off = new Map();
  const warnings = [];
  for (const raw of (value ?? '').split(',')) {
    const item = raw.trim().toLowerCase();
    if (!item) continue;
    const [repo, report, ...rest] = item.split(':').map((s) => s.trim());
    if (!known.has(repo)) {
      warnings.push(`SECURITY_STATUS_DISABLED: unknown repo "${repo}", ignored.`);
      continue;
    }
    if (rest.length > 0 || (report !== undefined && !REPORTS.has(report))) {
      warnings.push(`SECURITY_STATUS_DISABLED: unknown entry "${item}", ignored.`);
      continue;
    }
    const set = off.get(repo) ?? new Set();
    if (report === 'sonar' || report === 'scans') set.add(report);
    else {
      set.add('sonar');
      set.add('scans');
    }
    off.set(repo, set);
  }
  return { off, warnings };
}

/**
 * Applies the deploy-time override to the committed defaults. The override
 * can only switch reports off. A component with both reports off is left out.
 * @param {readonly StatusComponent[]} components
 * @param {string | undefined} disabledValue
 * @returns {{ components: StatusComponent[], warnings: string[] }}
 */
export function applyDisabled(components, disabledValue) {
  const { off, warnings } = parseDisabled(disabledValue, components);
  const result = [];
  for (const c of components) {
    const set = off.get(c.repo.toLowerCase());
    const sonar = c.sonar && !set?.has('sonar');
    const scans = c.scans && !set?.has('scans');
    if (!sonar && !scans) continue;
    result.push({ repo: c.repo, name: c.name, sonar, scans });
  }
  return { components: result, warnings };
}

/**
 * Maps one code scanning analysis to a page row, or null to skip it.
 * @param {{ tool?: { name?: string }, category?: string }} analysis
 * @returns {ScanGroup | null}
 */
export function scanGroup(analysis) {
  const tool = (analysis.tool?.name ?? '').toLowerCase();
  const category = (analysis.category ?? '').toLowerCase();
  if (tool === 'trivy' && category === 'trivy-fs') return 'code';
  if (tool === 'gitleaks') return 'code';
  if (tool === 'trivy' && category.startsWith('trivy-image-')) return 'image';
  if (tool === 'codeql') return 'codeAnalysis';
  return null;
}

/** @returns {ScanDates} */
export function emptyScanDates() {
  return { code: null, image: null, codeAnalysis: null };
}

/**
 * Keeps the latest analysis date (YYYY-MM-DD) per row. Reads only the tool
 * name, category and created_at of each analysis.
 * @param {ReadonlyArray<{ tool?: { name?: string }, category?: string, created_at?: string }>} analyses
 * @returns {ScanDates}
 */
export function latestScanDates(analyses) {
  const dates = emptyScanDates();
  for (const a of analyses) {
    const group = scanGroup(a);
    const day = typeof a.created_at === 'string' ? a.created_at.slice(0, 10) : '';
    if (!group || !/^\d{4}-\d{2}-\d{2}$/.test(day)) continue;
    if (dates[group] === null || day > dates[group]) dates[group] = day;
  }
  return dates;
}

/**
 * True once every row has a date. The fetch script uses it to stop paging.
 * @param {ScanDates} dates
 */
export function allScanGroupsFound(dates) {
  return SCAN_GROUPS.every(({ key }) => dates[key] !== null);
}

/**
 * Turns a SonarCloud rating value ("1.0" to "5.0") into a letter.
 * @param {unknown} value
 * @returns {Rating | null}
 */
function ratingLetter(value) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= RATINGS.length ? RATINGS[n - 1] : null;
}

/**
 * Reads the SonarCloud measures response and keeps the ratings only.
 * @param {ReadonlyArray<{ metric?: string, value?: string }>} measures
 * @returns {SonarRatings}
 */
export function sonarRatings(measures) {
  /** @type {Record<string, string | undefined>} */
  const byMetric = {};
  for (const m of measures) if (typeof m.metric === 'string') byMetric[m.metric] = m.value;
  const gate = byMetric[SONAR_METRICS.qualityGate];
  const coverage = Number.parseFloat(byMetric[SONAR_METRICS.coverage] ?? '');
  return {
    qualityGate: gate === 'OK' ? 'passed' : gate === 'ERROR' ? 'failed' : null,
    security: ratingLetter(byMetric[SONAR_METRICS.security]),
    reliability: ratingLetter(byMetric[SONAR_METRICS.reliability]),
    maintainability: ratingLetter(byMetric[SONAR_METRICS.maintainability]),
    coverage: Number.isFinite(coverage) && coverage >= 0 && coverage <= 100 ? Math.round(coverage) : null,
  };
}

/**
 * Copies a SonarCloud result, keeping allowlisted fields and values only.
 * @param {SonarResult | undefined} s
 * @returns {SonarResult}
 */
function cleanSonarResult(s) {
  if (s?.state !== 'ok') return { state: 'unavailable' };
  /** @param {unknown} v */
  const letter = (v) => (RATINGS.includes(/** @type {Rating} */ (v)) ? /** @type {Rating} */ (v) : null);
  const { coverage } = s;
  return {
    state: 'ok',
    qualityGate: s.qualityGate === 'passed' || s.qualityGate === 'failed' ? s.qualityGate : null,
    security: letter(s.security),
    reliability: letter(s.reliability),
    maintainability: letter(s.maintainability),
    coverage: Number.isInteger(coverage) && coverage >= 0 && coverage <= 100 ? coverage : null,
  };
}

/**
 * Builds the status file from allowlisted values only.
 * @param {{ components: readonly StatusComponent[], scans: Record<string, RepoScans>,
 *   sonar: Record<string, SonarResult>, scansFetched: boolean, generatedAt: string }} input
 * @returns {StatusFile}
 */
export function buildStatusFile({ components, scans, sonar, scansFetched, generatedAt }) {
  return {
    version: STATUS_FILE_VERSION,
    generatedAt,
    scansFetched,
    components: components.map((c) => {
      const s = c.scans && scansFetched ? scans[c.repo] : undefined;
      /** @type {RepoScans | null} */
      let scanResult = null;
      if (s?.state === 'ok') {
        const dates = emptyScanDates();
        for (const { key } of SCAN_GROUPS) dates[key] = s.dates[key] ?? null;
        scanResult = { state: 'ok', dates };
      } else if (c.scans && scansFetched) {
        scanResult = { state: 'unavailable' };
      }
      const sonarResult = c.sonar ? cleanSonarResult(sonar[c.repo]) : null;
      return { repo: c.repo, name: c.name, sonar: c.sonar, scans: c.scans, scanResult, sonarResult };
    }),
  };
}

/**
 * Checks a parsed status file and returns it, or null when it is missing or
 * not in the expected shape.
 * @param {unknown} data
 * @returns {StatusFile | null}
 */
export function readStatusFile(data) {
  if (!data || typeof data !== 'object') return null;
  const d = /** @type {Partial<StatusFile>} */ (data);
  if (d.version !== STATUS_FILE_VERSION || !Array.isArray(d.components) || typeof d.generatedAt !== 'string') {
    return null;
  }
  return /** @type {StatusFile} */ (d);
}

/** @param {string} repo */
export function sonarProjectKey(repo) {
  return `${GITHUB_ORG}_${repo}`;
}

/**
 * SonarCloud API URL for the rating measures of one project.
 * @param {string} repo
 */
export function sonarMeasuresUrl(repo) {
  const key = encodeURIComponent(sonarProjectKey(repo));
  const metrics = Object.values(SONAR_METRICS).join(',');
  return `https://sonarcloud.io/api/measures/component?component=${key}&metricKeys=${metrics}`;
}

/**
 * SonarCloud overview page of one project.
 * @param {string} repo
 */
export function sonarOverviewUrl(repo) {
  return `https://sonarcloud.io/project/overview?id=${encodeURIComponent(sonarProjectKey(repo))}`;
}

/**
 * Whole days between a scan day (YYYY-MM-DD, UTC) and `now`. Never negative.
 * @param {string} isoDay
 * @param {Date} now
 */
export function daysSince(isoDay, now) {
  const then = Date.parse(`${isoDay}T00:00:00Z`);
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.max(0, Math.round((today - then) / DAY_MS));
}

/**
 * Age of a scan as words ("today", "1 day ago", "3 weeks ago") and a level
 * for the freshness badge.
 * @param {string} isoDay
 * @param {Date} now
 * @returns {{ text: string, level: AgeLevel }}
 */
export function scanAge(isoDay, now) {
  const days = daysSince(isoDay, now);
  const level = days <= SCAN_AGE_DAYS.recent ? 'recent' : days <= SCAN_AGE_DAYS.monthly ? 'monthly' : 'stale';
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'always' });
  let text;
  if (days === 0) text = 'today';
  else if (days < 14) text = rtf.format(-days, 'day');
  else if (days < 60) text = rtf.format(-Math.floor(days / 7), 'week');
  else text = rtf.format(-Math.floor(days / 30), 'month');
  return { text, level };
}
