// Pure helpers for the Releases pages. No IO, no dependencies.
// Entries are { id, data, body }, the shape Astro glob-loader entries have.

/**
 * @typedef {{ id: string, data: Record<string, any>, body?: string }} Entry
 * @typedef {{ repo: string, tag: string, changed: boolean }} ComponentRow
 * @typedef {{ tag: string, rc: string, date: string, notes: Entry | null,
 *   components: ComponentRow[], fragments: Entry[] }} Rc
 * @typedef {{ sprint: string, rcs: Rc[], latestDate: string, summary: string | null,
 *   hasBreaking: boolean, hasDeployOrdering: boolean }} Sprint
 */

const SPRINT_TAG = /^(20\d{4}-s(\d+))-rc(\d+)$/;
const HTML_COMMENT = /<!--[\s\S]*?-->/g;
const HEADING = /^\s{0,3}(#{1,6})\s+/;

/**
 * @param {string} tag
 * @returns {{ sprint: string, rc: string, rcNum: number, sprintKey: [number, number] } | null}
 */
export function parseSprintTag(tag) {
  const m = typeof tag === 'string' ? SPRINT_TAG.exec(tag) : null;
  if (!m) return null;
  return {
    sprint: m[1],
    rc: `rc${m[3]}`,
    rcNum: Number(m[3]),
    sprintKey: [Number(m[1].slice(0, 6)), Number(m[2])],
  };
}

function mustParse(tag) {
  const p = parseSprintTag(tag);
  if (!p) throw new Error(`Not a sprint tag: ${tag}`);
  return p;
}

/** Ascending comparison of two sprint tags. Throws on a non-sprint tag. */
export function compareTags(a, b) {
  const pa = mustParse(a);
  const pb = mustParse(b);
  return (
    pa.sprintKey[0] - pb.sprintKey[0] ||
    pa.sprintKey[1] - pb.sprintKey[1] ||
    pa.rcNum - pb.rcNum
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

const maxDate = (dates) => dates.reduce((m, d) => (d > m ? d : m), '');

/**
 * Group fragments and notes into sprints, newest sprint first, rcs newest first.
 * Entries whose tag is not a sprint tag are ignored.
 * @param {Entry[]} fragments
 * @param {Entry[]} notes
 * @returns {Sprint[]}
 */
export function buildSprints(fragments, notes) {
  const frags = fragments.filter((e) => parseSprintTag(e.data.tag));
  const nts = notes.filter((e) => parseSprintTag(e.data.tag));
  const tags = [...new Set([...frags, ...nts].map((e) => e.data.tag))].sort(compareTags).reverse();

  /** @type {Map<string, Rc[]>} */
  const bySprint = new Map();
  for (const tag of tags) {
    const { sprint, rc } = parseSprintTag(tag);
    const own = frags
      .filter((e) => e.data.tag === tag)
      .sort((a, b) => a.data.repo.localeCompare(b.data.repo));
    const rcEntry = {
      tag,
      rc,
      date: maxDate(own.map((e) => e.data.cut_at)),
      notes: nts.find((e) => e.data.tag === tag) ?? null,
      components: componentTable(frags, tag),
      fragments: own,
    };
    if (!bySprint.has(sprint)) bySprint.set(sprint, []);
    bySprint.get(sprint).push(rcEntry);
  }

  return [...bySprint].map(([sprint, rcs]) => {
    const withNotes = rcs.find((r) => r.notes);
    const body = withNotes?.notes?.body ?? '';
    const summary =
      (extractSection(body, 'Summary') ?? '')
        .split('\n')
        .map((l) => l.trim())
        .find(Boolean) ?? null;
    return {
      sprint,
      rcs,
      latestDate: maxDate(rcs.map((r) => r.date)),
      summary,
      hasBreaking: !isNone(extractSection(body, 'Breaking changes / config')),
      hasDeployOrdering: !isNone(extractSection(body, 'Deploy ordering')),
    };
  });
}
