import test from 'node:test';
import assert from 'node:assert/strict';
import { SECURITY_STATUS_COMPONENTS, SONAR_METRICS } from '../config/security-status.config.mjs';
import {
  parseDisabled,
  applyDisabled,
  scanRepos,
  scanGroup,
  latestScanDates,
  allScanGroupsFound,
  buildStatusFile,
  readStatusFile,
  sonarRatings,
  sonarMeasuresUrl,
  sonarOverviewUrl,
  scanAge,
} from './security-status.mjs';

const COMPONENTS = [
  { repo: 'signals-dpg', name: 'Signals DPG', sonar: true, scans: true },
  { repo: 'aggregator-dpg', name: 'Aggregator DPG', sonar: true, scans: true },
  { repo: 'notification-service', name: 'Notification service', sonar: false, scans: true },
];

test('applyDisabled keeps the defaults when the variable is empty or unset', () => {
  for (const value of [undefined, '', ' , ']) {
    const { components, warnings } = applyDisabled(COMPONENTS, value);
    assert.deepEqual(components, COMPONENTS);
    assert.deepEqual(warnings, []);
  }
});

test('applyDisabled: repo:sonar and repo:scans switch one report off', () => {
  const { components } = applyDisabled(COMPONENTS, 'signals-dpg:sonar,aggregator-dpg:scans');
  assert.deepEqual(components[0], { repo: 'signals-dpg', name: 'Signals DPG', sonar: false, scans: true });
  assert.deepEqual(components[1], { repo: 'aggregator-dpg', name: 'Aggregator DPG', sonar: true, scans: false });
});

test('applyDisabled: a bare repo removes the row', () => {
  const { components } = applyDisabled(COMPONENTS, 'aggregator-dpg');
  assert.deepEqual(components.map((c) => c.repo), ['signals-dpg', 'notification-service']);
});

test('applyDisabled: a row with both reports off is left out', () => {
  const { components } = applyDisabled(COMPONENTS, 'notification-service:scans');
  assert.deepEqual(components.map((c) => c.repo), ['signals-dpg', 'aggregator-dpg']);
});

test('applyDisabled trims spaces and ignores case', () => {
  const { components, warnings } = applyDisabled(COMPONENTS, '  Signals-DPG : SONAR ,AGGREGATOR-DPG ');
  assert.deepEqual(warnings, []);
  assert.deepEqual(components.map((c) => [c.repo, c.sonar, c.scans]), [
    ['signals-dpg', false, true],
    ['notification-service', false, true],
  ]);
});

test('applyDisabled can only switch reports off', () => {
  // notification-service has sonar: false in the defaults; nothing turns it on.
  const { components } = applyDisabled(COMPONENTS, 'signals-dpg:scans');
  assert.equal(components.find((c) => c.repo === 'notification-service')?.sonar, false);
  // An unknown repo is never added.
  const r = applyDisabled(COMPONENTS, 'campaign-manager-pipeline');
  assert.deepEqual(r.components, COMPONENTS);
});

test('scanRepos lists repos with scans on, after the override', () => {
  assert.deepEqual(scanRepos(applyDisabled(COMPONENTS, '').components), ['signals-dpg', 'aggregator-dpg', 'notification-service']);
  assert.deepEqual(scanRepos(applyDisabled(COMPONENTS, 'signals-dpg:scans, notification-service').components), ['aggregator-dpg']);
  assert.deepEqual(scanRepos(applyDisabled(COMPONENTS, 'signals-dpg,aggregator-dpg:scans,notification-service').components), []);
});

test('parseDisabled warns about unknown repos and entries and ignores them', () => {
  const { off, warnings } = parseDisabled('nope, signals-dpg:badges, signals-dpg:sonar:x, aggregator-dpg:sonar', COMPONENTS);
  assert.equal(warnings.length, 3);
  assert.deepEqual([...off.keys()], ['aggregator-dpg']);
});

test('applyDisabled: everything switched off leaves no rows', () => {
  const { components } = applyDisabled(COMPONENTS, 'signals-dpg,aggregator-dpg,notification-service');
  assert.deepEqual(components, []);
});

test('scanGroup maps tools and categories to rows', () => {
  assert.equal(scanGroup({ tool: { name: 'Trivy' }, category: 'trivy-fs' }), 'code');
  assert.equal(scanGroup({ tool: { name: 'Gitleaks' }, category: 'gitleaks' }), 'code');
  assert.equal(scanGroup({ tool: { name: 'Trivy' }, category: 'trivy-image-api' }), 'image');
  assert.equal(scanGroup({ tool: { name: 'CodeQL' }, category: '/language:javascript-typescript' }), 'codeAnalysis');
  assert.equal(scanGroup({ tool: { name: 'zizmor' }, category: 'zizmor' }), null);
  assert.equal(scanGroup({}), null);
});

test('latestScanDates keeps the newest date per row and skips bad dates', () => {
  const dates = latestScanDates([
    { tool: { name: 'Trivy' }, category: 'trivy-image-web', created_at: '2026-11-01T10:00:00Z' },
    { tool: { name: 'Trivy' }, category: 'trivy-image-api', created_at: '2026-11-11T10:00:00Z' },
    { tool: { name: 'Trivy' }, category: 'trivy-fs', created_at: 'not a date' },
    { tool: { name: 'Gitleaks' }, category: 'gitleaks', created_at: '2026-11-12T08:00:00Z' },
  ]);
  assert.deepEqual(dates, { code: '2026-11-12', image: '2026-11-11', codeAnalysis: null });
  assert.equal(allScanGroupsFound(dates), false);
});

const OK_SONAR = { state: 'ok', qualityGate: 'passed', security: 'A', reliability: 'C', maintainability: 'A', coverage: 88 };

test('buildStatusFile writes only allowlisted fields', () => {
  const file = buildStatusFile({
    components: COMPONENTS,
    scansFetched: true,
    generatedAt: '2026-11-12T00:00:00Z',
    scans: {
      'signals-dpg': {
        state: 'ok',
        // Extra fields from a careless caller must not reach the file.
        dates: /** @type {any} */ ({ code: '2026-11-12', image: null, codeAnalysis: '2026-11-12',
          results_count: 12, url: 'https://api.github.com/x' }),
      },
      'aggregator-dpg': { state: 'unavailable' },
    },
    sonar: {
      'signals-dpg': /** @type {any} */ ({ ...OK_SONAR, vulnerabilities: 32, bugs: 4, key: 'x' }),
      'aggregator-dpg': /** @type {any} */ ({ state: 'ok', qualityGate: 'maybe', security: 'Z', reliability: 2,
        maintainability: null, coverage: 250 }),
    },
  });
  const json = JSON.stringify(file);
  for (const banned of ['results_count', 'rules_count', 'url', 'sha', 'ref', 'commit', 'tag', 'http',
    'vulnerabilities', 'bugs', 'key', 'maybe']) {
    assert.ok(!json.includes(banned), `status file contains "${banned}"`);
  }
  assert.deepEqual(file.components[0].scanResult, {
    state: 'ok',
    dates: { code: '2026-11-12', image: null, codeAnalysis: '2026-11-12' },
  });
  assert.deepEqual(file.components[0].sonarResult, OK_SONAR);
  // Values outside the allowed set become null.
  assert.deepEqual(file.components[1].sonarResult, {
    state: 'ok', qualityGate: null, security: null, reliability: null, maintainability: null, coverage: null,
  });
  assert.deepEqual(file.components[1].scanResult, { state: 'unavailable' });
  // No result was fetched for notification-service, so its scans are unavailable.
  assert.deepEqual(file.components[2].scanResult, { state: 'unavailable' });
  // notification-service has no SonarCloud project.
  assert.equal(file.components[2].sonarResult, null);
});

test('buildStatusFile without a token keeps the on/off flags and no scan results', () => {
  const file = buildStatusFile({ components: COMPONENTS, scans: {}, sonar: {}, scansFetched: false, generatedAt: 'x' });
  assert.equal(file.scansFetched, false);
  assert.ok(file.components.every((c) => c.scanResult === null));
  assert.deepEqual(file.components.map((c) => c.sonar), [true, true, false]);
  // Ratings that were not fetched show as unavailable.
  assert.deepEqual(file.components[0].sonarResult, { state: 'unavailable' });
});

test('readStatusFile rejects missing, malformed or old data', () => {
  assert.equal(readStatusFile(undefined), null);
  assert.equal(readStatusFile({}), null);
  assert.equal(readStatusFile({ version: 1, generatedAt: 'x', scansFetched: false, components: [] }), null);
  assert.ok(readStatusFile({ version: 2, generatedAt: 'x', scansFetched: false, components: [] }));
});

test('sonarRatings turns SonarCloud measures into letters and a whole percentage', () => {
  const r = sonarRatings([
    { metric: 'alert_status', value: 'ERROR' },
    { metric: 'security_rating', value: '1.0' },
    { metric: 'reliability_rating', value: '5.0' },
    { metric: 'sqale_rating', value: '2.5' },
    { metric: 'coverage', value: '93.1' },
    { metric: 'vulnerabilities', value: '32' },
  ]);
  assert.deepEqual(r, { qualityGate: 'failed', security: 'A', reliability: 'E', maintainability: null, coverage: 93 });
  assert.deepEqual(sonarRatings([]), {
    qualityGate: null, security: null, reliability: null, maintainability: null, coverage: null,
  });
});

test('SonarCloud requests ask for ratings only', () => {
  const banned = ['vulnerabilities', 'bugs', 'code_smells', 'security_hotspots'];
  for (const metric of Object.values(SONAR_METRICS)) assert.ok(!banned.includes(metric), `${metric} is a count`);
  const url = sonarMeasuresUrl('signals-dpg');
  assert.ok(url.startsWith('https://sonarcloud.io/api/measures/component?component=Blue-Dots-Economy_signals-dpg&'));
  assert.ok(!banned.some((m) => url.includes(m)));
  assert.equal(sonarOverviewUrl('signals-dpg'), 'https://sonarcloud.io/project/overview?id=Blue-Dots-Economy_signals-dpg');
});

test('scanAge gives the age in words and a colour level', () => {
  const now = new Date('2026-11-12T18:30:00Z');
  assert.deepEqual(scanAge('2026-11-12', now), { text: 'today', level: 'recent' });
  assert.deepEqual(scanAge('2026-11-11', now), { text: '1 day ago', level: 'recent' });
  assert.deepEqual(scanAge('2026-11-05', now), { text: '7 days ago', level: 'recent' });
  assert.deepEqual(scanAge('2026-11-04', now), { text: '8 days ago', level: 'monthly' });
  assert.deepEqual(scanAge('2026-10-23', now), { text: '2 weeks ago', level: 'monthly' });
  assert.deepEqual(scanAge('2026-10-12', now), { text: '4 weeks ago', level: 'monthly' });
  assert.deepEqual(scanAge('2026-10-11', now), { text: '4 weeks ago', level: 'stale' });
  assert.deepEqual(scanAge('2026-08-01', now), { text: '3 months ago', level: 'stale' });
  // A scan day after `now` counts as today.
  assert.deepEqual(scanAge('2026-11-13', now), { text: 'today', level: 'recent' });
});

test('the committed config lists each repo once', () => {
  const repos = SECURITY_STATUS_COMPONENTS.map((c) => c.repo);
  assert.equal(new Set(repos).size, repos.length);
});
