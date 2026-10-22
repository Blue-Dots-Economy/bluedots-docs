import { test } from 'node:test';
import assert from 'node:assert/strict';
import remarkReleaseHeadings, { shiftHeadings } from './remark-release-headings.mjs';

const tree = () => ({
  type: 'root',
  children: [
    { type: 'heading', depth: 2, children: [] },
    { type: 'blockquote', children: [{ type: 'heading', depth: 6, children: [] }] },
  ],
});
const depths = (t) => [t.children[0].depth, t.children[1].children[0].depth];

test('shiftHeadings shifts by n and caps at 6', () => {
  const t = tree();
  shiftHeadings(t, 3);
  assert.deepEqual(depths(t), [5, 6]);
});

test('plugin leaves non-release files untouched', () => {
  const t = tree();
  remarkReleaseHeadings()(t, { path: 'src/content/docs/x.md' });
  assert.deepEqual(depths(t), [2, 6]);
});

test('plugin shifts notes.md by 2 and components by 3', () => {
  let t = tree();
  remarkReleaseHeadings()(t, { path: '/w/src/releases/202610-s5/rc1/notes.md' });
  assert.deepEqual(depths(t), [4, 6]);
  t = tree();
  remarkReleaseHeadings()(t, { path: '/w/src/releases/202610-s5/rc1/components/signals-dpg.md' });
  assert.deepEqual(depths(t), [5, 6]);
});

test('plugin tolerates a missing path', () => {
  const t = tree();
  remarkReleaseHeadings()(t, {});
  assert.deepEqual(depths(t), [2, 6]);
});
