import { visit } from 'unist-util-visit';

const HEBREW = /^[֐-׿יִ-ﭏ]/;

function firstText(node) {
  const c = node.children[0];
  if (!c) return '';
  if (c.type === 'text') return c.value.trimStart();
  if ((c.type === 'strong' || c.type === 'emphasis') && c.children[0]?.type === 'text')
    return c.children[0].value.trimStart();
  return '';
}

export default function remarkHebrewRtl() {
  return (tree) => {
    visit(tree, 'paragraph', (node) => {
      if (HEBREW.test(firstText(node))) {
        node.data = node.data || {};
        node.data.hProperties = { ...(node.data.hProperties || {}), dir: 'rtl' };
      }
    });
  };
}
