// board.js — the split board (routes #/ and #/board/<slug>): the
// live bounty list on the left, the selected bounty's detail pane on
// the right, in one frame. Picking a row swaps the pane in place and
// rewrites the hash with replaceState, so the URL stays shareable
// and neither the list nor the page is rebuilt for a selection
// change. Filter and sort repaint only the list's rows.

import { boardList, setDrawn } from './net.js';
import { esc, feeLabel, money, num, timeLeft } from './fmt.js';
import { renderPane } from './bounty.js';

const ui = { q: '', cat: 'All', sort: 'closing' };
let items = null;
let selected = null;
let paneEl = null;
let rowsEl = null;

const SORTS = {
  // Live first, nearest deadline first; ended bounties sink.
  closing: (a, b) => (timeLeft(a.deadline).live ? 0 : 1) - (timeLeft(b.deadline).live ? 0 : 1)
    || new Date(a.deadline) - new Date(b.deadline),
  pot: (a, b) => Number(b.potUsd) - Number(a.potUsd),
  entries: (a, b) => (b.submissionCount || 0) - (a.submissionCount || 0),
};

function visible() {
  const q = ui.q.trim().toLowerCase();
  return items
    .filter((c) => (ui.cat === 'All' || c.category === ui.cat)
      && (!q || (c.title + ' ' + c.slug).toLowerCase().includes(q)))
    .sort(SORTS[ui.sort]);
}

function rowHtml(c) {
  const left = timeLeft(c.deadline);
  return '<a class="brow' + (c.slug === selected ? ' sel' : '') + '" href="#/board/' + esc(c.slug)
    + '" data-slug="' + esc(c.slug) + '"><span class="t">' + esc(c.title) + '</span>'
    + '<span class="m"><span class="pot">' + money(c.potUsd ?? c.rewardAmount) + '</span> '
    + '<span>' + esc(feeLabel(c.entryFeeUsd)) + '</span> '
    + '<span class="' + (left.live ? 'live' : 'ended') + '">' + left.text + '</span> '
    + '<span><b>' + num(c.submissionCount || 0) + '</b> entries</span></span></a>';
}

function paintRows(root) {
  const list = visible();
  root.innerHTML = list.map(rowHtml).join('') || '<p class="note">No bounty matches that filter.</p>';
  setDrawn(list.length + ' of ' + items.length + ' rows drawn');
}

async function showPane(slug) {
  selected = slug;
  const stub = items.find((c) => c.slug === slug);
  const fresh = await renderPane(paneEl, slug, stub);
  // The pane's competition answer is fresher than the list's: sync
  // its entry count and live pot back into the row, so both sides of
  // the frame agree — unless the board was navigated away from while
  // the pane was loading.
  if (stub && fresh) {
    let dirty = false;
    if (fresh.submissionCount != null && stub.submissionCount !== fresh.submissionCount) {
      stub.submissionCount = fresh.submissionCount;
      dirty = true;
    }
    if (fresh.potUsd != null && stub.potUsd !== fresh.potUsd) {
      stub.potUsd = fresh.potUsd;
      dirty = true;
    }
    if (dirty && rowsEl && rowsEl.isConnected) paintRows(rowsEl);
  }
}

export async function render(el, slug) {
  window.__shotReady = false;
  el.innerHTML = '<p class="note">Loading the live board…</p>';
  items = await boardList();
  const cats = ['All', ...new Set(items.map((c) => c.category).filter(Boolean))];
  if (!cats.includes(ui.cat)) ui.cat = 'All';
  selected = slug && items.some((c) => c.slug === slug) ? slug
    : items.some((c) => c.slug === 'makefun-frontend-01') ? 'makefun-frontend-01'
      : (items[0] && items[0].slug);
  const live = items.filter((c) => timeLeft(c.deadline).live);
  const potTotal = live.reduce((sum, c) => sum + Number(c.potUsd || 0), 0);
  const catOpts = cats.map((c) =>
    '<option' + (c === ui.cat ? ' selected' : '') + '>' + esc(c) + '</option>').join('');
  const sortOpt = (value, label) =>
    '<option value="' + value + '"' + (ui.sort === value ? ' selected' : '') + '>' + label + '</option>';
  el.innerHTML = '<p class="stats"><span><b>' + live.length + '</b> live bounties</span>'
    + '·<span><b>' + money(potTotal) + '</b> in live pots</span></p>'
    + '<div class="tools"><input type="search" id="q" placeholder="Filter bounties by name" value="'
    + esc(ui.q) + '" aria-label="Filter bounties">'
    + '<select id="cat" aria-label="Category">' + catOpts + '</select>'
    + '<select id="sort" aria-label="Sort">' + sortOpt('closing', 'Closing soon')
    + sortOpt('pot', 'Biggest pot') + sortOpt('entries', 'Most entries') + '</select></div>'
    + '<div class="split"><div class="board" id="rows"></div>'
    + '<section class="pane" id="pane">Loading the selected bounty…</section></div>';
  const rows = el.querySelector('#rows');
  rowsEl = rows;
  paneEl = el.querySelector('#pane');
  paintRows(rows);
  el.querySelector('#q').addEventListener('input', (e) => { ui.q = e.target.value; paintRows(rows); });
  el.querySelector('#cat').addEventListener('change', (e) => { ui.cat = e.target.value; paintRows(rows); });
  el.querySelector('#sort').addEventListener('change', (e) => { ui.sort = e.target.value; paintRows(rows); });
  rows.addEventListener('click', (e) => {
    const a = e.target.closest('a.brow');
    if (!a) return;
    e.preventDefault();
    const next = a.getAttribute('data-slug');
    if (next === selected) return;
    rows.querySelectorAll('.brow.sel').forEach((n) => n.classList.remove('sel'));
    a.classList.add('sel');
    history.replaceState(null, '', '#/board/' + encodeURIComponent(next));
    showPane(next);
  });
  await showPane(selected);
  window.__shotReady = true;
}
