// md.js — a small, safe Markdown renderer for bounty briefs and
// rules. The source is HTML-escaped before anything else happens, and
// only a safe subset is built back up: headings, paragraphs, bullet
// and numbered lists, rules, bold, italic, inline code and http(s)
// links. Raw HTML inside a description therefore reaches the page as
// visible text, never as markup the author did not earn.

import { esc } from './fmt.js';

function inlineMarkup(text) {
  let s = text;
  s = s.replace(/`([^`]+)`/g, (m, code) => '<code>' + code + '</code>');
  s = s.replace(/\*\*([^*]+)\*\*/g, (m, bold) => '<strong>' + bold + '</strong>');
  s = s.replace(/(^|[^*\w])\*([^*\n]+)\*/g, (m, pre, ital) => pre + '<em>' + ital + '</em>');
  s = s.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g,
    (m, label, href) => '<a href="' + href + '" target="_blank" rel="noopener">' + label + '</a>');
  return s;
}

// Blocks are split on blank lines first, then each block is classified
// whole: a heading, a rule, a list (every line an item) or a paragraph.
export function md(source) {
  const blocks = esc(String(source || '')).split(/\n\s*\n/);
  const out = [];
  for (const block of blocks) {
    const lines = block.split('\n').map((line) => line.trimEnd());
    const first = lines[0] || '';
    const heading = first.match(/^(#{1,4})\s+(.*)$/);
    if (heading && lines.length === 1) {
      const level = heading[1].length;
      out.push('<h' + level + '>' + inlineMarkup(heading[2]) + '</h' + level + '>');
    } else if (lines.length === 1 && /^-{3,}$/.test(first.trim())) {
      out.push('<hr>');
    } else if (lines.every((line) => /^\s*[-*]\s+/.test(line))) {
      out.push('<ul>' + lines.map((line) => '<li>' + inlineMarkup(line.replace(/^\s*[-*]\s+/, '')) + '</li>').join('') + '</ul>');
    } else if (lines.every((line) => /^\s*\d+[.)]\s+/.test(line))) {
      out.push('<ol>' + lines.map((line) => '<li>' + inlineMarkup(line.replace(/^\s*\d+[.)]\s+/, '')) + '</li>').join('') + '</ol>');
    } else if (first.trim() !== '') {
      out.push('<p>' + lines.map(inlineMarkup).join('<br>') + '</p>');
    }
  }
  return out.join('\n');
}
