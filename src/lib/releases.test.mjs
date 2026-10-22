import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseSprintTag,
  compareTags,
  extractSection,
  isNone,
  componentTable,
  buildSprints,
} from './releases.mjs';

test('compareTags orders rc and sprint numerically and across years', () => {
  const tags = ['202701-s1-rc1', '202610-s2-rc1', '202610-s10-rc1', '202610-s1-rc10', '202610-s1-rc9'];
  assert.deepEqual([...tags].sort(compareTags),
    ['202610-s1-rc9', '202610-s1-rc10', '202610-s2-rc1', '202610-s10-rc1', '202701-s1-rc1']);
});
test('compareTags throws on a non-sprint tag', () => {
  assert.throws(() => compareTags('v1.0.0', '202610-s1-rc1'));
});
test('parseSprintTag parses a sprint tag', () => {
  assert.deepEqual(parseSprintTag('202610-s2-rc3'),
    { sprint: '202610-s2', rc: 'rc3', rcNum: 3, sprintKey: [202610, 2] });
});
test('parseSprintTag rejects suffixed tags', () => {
  assert.equal(parseSprintTag('202609-s2-rc1-hotfix'), null);
  assert.equal(parseSprintTag('v1.0.0'), null);
});
test('extractSection is case-insensitive and stops at same-level heading', () => {
  const md = '## release notes\n- a (#1)\n### sub\n- b\n## In Plain Terms\nx';
  assert.equal(extractSection(md, 'Release Notes').trim(), '- a (#1)\n### sub\n- b');
});
test('extractSection handles regex metacharacters, extra spaces, missing and commented headings', () => {
  const md = '## Breaking changes / config\nNone.\n## Deploy   ordering\nFirst.\n<!--\n## Verification\nhidden\n-->';
  assert.equal(extractSection(md, 'Breaking changes / config').trim(), 'None.');
  assert.equal(extractSection(md, 'Deploy ordering').trim(), 'First.');
  assert.equal(extractSection(md, 'Verification'), null);
  assert.equal(extractSection(md, 'Nope'), null);
  assert.equal(extractSection('', 'Summary'), null);
});
test('isNone', () => {
  assert.ok(isNone('None.')); assert.ok(isNone(' <!-- x --> none ')); assert.ok(isNone(null));
  assert.ok(isNone(''));
  assert.ok(!isNone('- new env var FOO'));
});

const f = (repo, tag, cut_at = '2026-10-01') => ({ id: `${tag}/${repo}`, data: { repo, tag, cut_at }, body: '' });

test('componentTable marks unchanged repos and omits not-yet-published repos', () => {
  const frags = [f('signals-dpg', '202610-s1-rc1'), f('signals-search', '202610-s1-rc1'),
                 f('signals-dpg', '202610-s1-rc2'), f('notification-service', '202610-s1-rc3')];
  assert.deepEqual(componentTable(frags, '202610-s1-rc2'), [
    { repo: 'signals-dpg', tag: '202610-s1-rc2', changed: true },
    { repo: 'signals-search', tag: '202610-s1-rc1', changed: false },
  ]);
});
test('buildSprints: empty input', () => assert.deepEqual(buildSprints([], []), []));
test('buildSprints: rc without notes.md has notes null; markers read notes sections', () => {
  const notes = [{
    id: '202610-s1/rc1',
    data: { tag: '202610-s1-rc1' },
    body: '## Summary\n\nFirst sprint release.\nMore.\n## Breaking changes / config\nNone.\n## Deploy ordering\nDeploy signals-dpg first.\n',
  }];
  const frags = [f('signals-dpg', '202610-s1-rc1', '2026-10-01'), f('signals-dpg', '202610-s1-rc2', '2026-10-05'),
                 f('aaa', '202610-s1-rc2', '2026-10-06')];
  const sprints = buildSprints(frags, notes);
  assert.equal(sprints.length, 1);
  const s = sprints[0];
  assert.equal(s.sprint, '202610-s1');
  assert.equal(s.rcs[0].tag, '202610-s1-rc2');
  assert.equal(s.rcs[0].notes, null);
  assert.equal(s.rcs[1].notes, notes[0]);
  assert.equal(s.hasBreaking, false);
  assert.equal(s.hasDeployOrdering, true);
  assert.equal(s.summary, 'First sprint release.');
  assert.equal(s.rcs[0].date, '2026-10-06');
  assert.equal(s.latestDate, '2026-10-06');
  assert.deepEqual(s.rcs[0].fragments.map((x) => x.data.repo), ['aaa', 'signals-dpg']);
  assert.equal(s.rcs[0].components.length, 2);
});
test('buildSprints: newest sprint first; non-sprint tags ignored', () => {
  const frags = [f('a', '202610-s2-rc1'), f('a', '202610-s10-rc1'), f('a', '202610-s1-rc1'), f('a', '202610-s1-rc1-hotfix')];
  assert.deepEqual(buildSprints(frags, []).map((s) => s.sprint), ['202610-s10', '202610-s2', '202610-s1']);
});
test('buildSprints: markers are true when any rc in the sprint has them', () => {
  const n = (tag, body) => ({ id: tag, data: { tag }, body });
  const notes = [
    n('202610-s1-rc1', '## Summary\nFirst.\n## Breaking changes / config\n- New env var FOO.\n## Deploy ordering\nDeploy signals-dpg first.\n'),
    n('202610-s1-rc2', '## Summary\nSecond.\n## Breaking changes / config\nNone.\n## Deploy ordering\nNone.\n'),
  ];
  const [s] = buildSprints([], notes);
  assert.equal(s.summary, 'Second.');
  assert.equal(s.hasBreaking, true);
  assert.equal(s.hasDeployOrdering, true);
});
