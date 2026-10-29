// Pure helpers for the Releases pages. No IO, no dependencies.
// Entries are { id, data, body }, the shape Astro glob-loader entries have.

/**
 * @typedef {{ id: string, data: Record<string, any>, body?: string }} Entry
 * @typedef {'candidate' | 'release' | 'hotfix'} Kind
 * @typedef {{ repo: string, tag: string, changed: boolean }} ComponentRow
 * @typedef {{ tag: string, kind: Kind, entry: string, date: string, notes: Entry | null,
 *   components: ComponentRow[], fragments: Entry[] }} SprintEntry
 * @typedef {{ sprint: string, entries: SprintEntry[], latestEntry: SprintEntry,
 *   releasedTag: string | null, latestDate: string, summary: string | null,
 *   hasBreaking: boolean, hasDeployOrdering: boolean }} Sprint
 */

// Sprint tag kinds: candidate `YYYYMM-sN-rcN` (cut from develop), release
// `YYYYMM-sN` (main) and hotfix `YYYYMM-sN.N` (release/YYYYMM-sN).
// Suffixed tags (`-hotfix`, `-alimco`, ...) match none of them.
const SPRINT_TAG = /^(20\d{4}-s(\d+))(?:-rc(\d+)|\.(\d+))?$/;
const KIND_ORDER = { candidate: 0, release: 1, hotfix: 2 };
const HTML_COMMENT = /<!--[\s\S]*?-->/g;
const HEADING = /^\s{0,3}(#{1,6})\s+/;

/**
 * `entry` is the folder name under src/releases/<sprint>/: rcN, release or hotfixN.
 * @param {string} tag
 * @returns {{ sprint: string, kind: Kind, num: number, entry: string,
 *   sprintKey: [number, number] } | null}
 */
export function parseSprintTag(tag) {
  const m = typeof tag === 'string' ? SPRINT_TAG.exec(tag) : null;
  if (!m) return null;
  const [, sprint, n, rc, fix] = m;
  const sprintKey = /** @type {[number, number]} */ ([Number(sprint.slice(0, 6)), Number(n)]);
  if (rc !== undefined) return { sprint, kind: 'candidate', num: Number(rc), entry: `rc${rc}`, sprintKey };
  if (fix !== undefined) return { sprint, kind: 'hotfix', num: Number(fix), entry: `hotfix${fix}`, sprintKey };
  return { sprint, kind: 'release', num: 0, entry: 'release', sprintKey };
}

function mustParse(tag) {
  const p = parseSprintTag(tag);
  if (!p) throw new Error(`Not a sprint tag: ${tag}`);
  return p;
}

/**
 * Ascending comparison of two sprint tags: sprint (YYYYMM, N), then kind
 * (candidate < release < hotfix), then number. Throws on a non-sprint tag.
 */
export function compareTags(a, b) {
  const pa = mustParse(a);
  const pb = mustParse(b);
  return (
    pa.sprintKey[0] - pb.sprintKey[0] ||
    pa.sprintKey[1] - pb.sprintKey[1] ||
    KIND_ORDER[pa.kind] - KIND_ORDER[pb.kind] ||
    pa.num - pb.num
  );
}

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');

/**
 * Body of the section under `heading` (any level, case-insensitive, extra
 * whitespace tolerated), up to the next heading of the same or higher level.
 * HTML comments are ignored. Same rule as bluedots-automation's pr-gate.
 * @param {string} markdown
 * @param {string} heading
 * @returns {string | null}
 */
export function extractSection(markdown, heading) {
  if (!markdown) return null;
  const words = heading.trim().split(/\s+/).map(escapeRegExp).join('\\s+');
  const wanted = new RegExp(`^\\s{0,3}(#{1,6})\\s*${words}\\s*$`, 'i');
  const lines = markdown.replace(HTML_COMMENT, '').split(/\r?\n/);
  const start = lines.findIndex((l) => wanted.test(l));
  if (start === -1) return null;
  const level = lines[start].match(HEADING)?.[1].length ?? lines[start].match(/#+/)[0].length;
  const out = [];
  for (let i = start + 1; i < lines.length; i++) {
    const h = lines[i].match(HEADING);
    if (h && h[1].length <= level) break;
    out.push(lines[i]);
  }
  return out.join('\n');
}

/** True for null, empty, or "None"/"None." once HTML comments are stripped. */
export function isNone(section) {
  if (section == null) return true;
  const s = section.replace(HTML_COMMENT, '').replace(/\s+/g, ' ').trim();
  return s === '' || /^none\.?$/i.test(s);
}

/**
 * Per-repo state as of `tag`: the newest fragment at or before `tag`.
 * Repos with no fragment yet are omitted. Sorted by repo.
 * @param {Entry[]} fragments
 * @param {string} tag
 * @returns {ComponentRow[]}
 */
export function componentTable(fragments, tag) {
  const latest = new Map();
  for (const fr of fragments) {
    const t = fr.data.tag;
    if (!parseSprintTag(t) || compareTags(t, tag) > 0) continue;
    const cur = latest.get(fr.data.repo);
    if (!cur || compareTags(t, cur) > 0) latest.set(fr.data.repo, t);
  }
  return [...latest]
    .map(([repo, t]) => ({ repo, tag: t, changed: t === tag }))
    .sort((a, b) => a.repo.localeCompare(b.repo));
}

/** True when any entry's notes.md has a `heading` section that is not None. */
const anyHas = (entries, heading) =>
  entries.some((e) => e.notes && !isNone(extractSection(e.notes.body ?? '', heading)));

const maxDate = (dates) => dates.reduce((m, d) => (d > m ? d : m), '');

/**
 * Group fragments and notes into sprints, newest sprint first, entries newest
 * first (hotfixes, then the release, then candidates). Entries whose tag is not
 * a sprint tag are ignored.
 * @param {Entry[]} fragments
 * @param {Entry[]} notes
 * @returns {Sprint[]}
 */
export function buildSprints(fragments, notes) {
  const frags = fragments.filter((e) => parseSprintTag(e.data.tag));
  const nts = notes.filter((e) => parseSprintTag(e.data.tag));
  const tags = [...new Set([...frags, ...nts].map((e) => e.data.tag))].sort(compareTags).reverse();

  /** @type {Map<string, SprintEntry[]>} */
  const bySprint = new Map();
  for (const tag of tags) {
    const { sprint, kind, entry } = parseSprintTag(tag);
    const own = frags
      .filter((e) => e.data.tag === tag)
      .sort((a, b) => a.data.repo.localeCompare(b.data.repo));
    const item = {
      tag,
      kind,
      entry,
      date: maxDate(own.map((e) => e.data.cut_at)),
      notes: nts.find((e) => e.data.tag === tag) ?? null,
      components: componentTable(frags, tag),
      fragments: own,
    };
    if (!bySprint.has(sprint)) bySprint.set(sprint, []);
    bySprint.get(sprint).push(item);
  }

  return [...bySprint].map(([sprint, entries]) => {
    const withNotes = entries.find((e) => e.notes);
    const body = withNotes?.notes?.body ?? '';
    const summary =
      (extractSection(body, 'Summary') ?? '')
        .split('\n')
        .map((l) => l.trim())
        .find(Boolean) ?? null;
    return {
      sprint,
      entries,
      latestEntry: entries[0],
      releasedTag: entries.find((e) => e.kind === 'release')?.tag ?? null,
      latestDate: maxDate(entries.map((e) => e.date)),
      summary,
      hasBreaking: anyHas(entries, 'Breaking changes / config'),
      hasDeployOrdering: anyHas(entries, 'Deploy ordering'),
    };
  });
}
