// Remark plugin: demote headings in release files so a file's `##` lands under
// the page's `## <rc>` heading. notes.md shifts by 2, components/<repo>.md by 3.

const NOTES = /\/src\/releases\/.+\/notes\.md$/;
const COMPONENT = /\/src\/releases\/.+\/components\/[^/]+\.md$/;

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
