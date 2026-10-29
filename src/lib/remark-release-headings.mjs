// Remark plugin: demote headings in release files so a file's `##` lands under
// the page's `## <tag>` heading. notes.md shifts by 2, components/<repo>.md by 3.

// <entry> is rcN (candidate), release or hotfixN, the same names as the collection glob.
const NOTES = /\/src\/releases\/[^/]+\/(?:rc\d+|release|hotfix\d+)\/notes\.md$/;
const COMPONENT = /\/src\/releases\/[^/]+\/(?:rc\d+|release|hotfix\d+)\/components\/[^/]+\.md$/;

/**
 * @param {{ children?: any[], type?: string, depth?: number }} node
 * @param {number} by
 */
export function shiftHeadings(node, by) {
  if (node.type === 'heading') node.depth = Math.min(6, node.depth + by);
  for (const child of node.children ?? []) shiftHeadings(child, by);
}

export default function remarkReleaseHeadings() {
  return (tree, file) => {
    const path = String(file?.path ?? '').replaceAll('\\', '/');
    const by = NOTES.test(path) ? 2 : COMPONENT.test(path) ? 3 : 0;
    if (by) shiftHeadings(tree, by);
  };
}
