// bounty.js — one bounty's detail, at two sizes: renderPane fills
// the split board's right-hand pane, and render is the bounty's own
// page (#/bounty/<slug>). Both read the same competition answer
// through net.js's cache, so opening the full page after the pane
// costs no second request — the strip shows exactly that.

import { competition, leaderboard, submissions } from './net.js';
import { dateUtc, esc, feeLabel, money, num, timeLeft, winRate } from './fmt.js';
import { md } from './md.js';

function rewardRows(c, limit) {
  let rows;
  if (Array.isArray(c.rewardsNow) && c.rewardsNow.length) {
    rows = c.rewardsNow;
  } else {
    rows = Object.entries(c.rewards || {}).map(([place, base]) => (
      { place: Number(place), baseUsd: base, feeShareUsd: 0, amountUsd: base }));
  }
  return rows.slice(0, limit).map((r) =>
    '<tr><td class="n">' + r.place + '</td>'
    + '<td class="n"><b>' + money(r.amountUsd) + '</b></td>'
    + '<td class="n">' + money(r.baseUsd) + '</td>'
    + '<td class="n">' + money(r.feeShareUsd) + '</td></tr>').join('');
}

const REWARDS_HEAD = '<table><tr><th class="n">Place</th><th class="n">Prize now</th>'
  + '<th class="n">Base</th><th class="n">Fee share</th></tr>';

// The phase timeline: a fill for the elapsed share of the entry
// window, and the four labels the reader needs — when it opened,
// where now sits, the deadline, and when results land.
function timeline(c) {
  const open = new Date(c.opensAt || c.publishedAt).getTime();
  const end = new Date(c.deadline).getTime();
  const pct = Math.min(100, Math.max(0, ((Date.now() - open) / (end - open)) * 100));
  const left = timeLeft(c.deadline);
  const fin = (c.phases || []).find((p) => p.key === 'final');
  let labels = '<span>Opened ' + dateUtc(c.opensAt || c.publishedAt) + '</span>'
    + '<span>' + (left.live ? 'Now — ' + left.text : 'Now — ended') + '</span>'
    + '<span>Deadline ' + dateUtc(c.deadline) + '</span>';
  if (fin && fin.endsAt) labels += '<span>Results by ' + dateUtc(fin.endsAt) + '</span>';
  return '<div class="tl"><div class="tl-track"><div class="tl-fill" style="width:'
    + pct.toFixed(1) + '%"></div></div><div class="tl-labels">' + labels + '</div></div>';
}

function factTile(key, value, sub, style) {
  return '<div class="fact"><div class="k">' + key + '</div><div class="v"'
    + (style ? ' style="' + style + '"' : '') + '>' + value + '</div><div class="s">' + sub + '</div></div>';
}

function facts(c) {
  const left = timeLeft(c.deadline);
  const tiles = [
    factTile('Live pot', money(c.potUsd),
      money(c.rewardAmount) + ' pool + ' + money(c.entryFeesUsd || 0) + ' fees'),
    factTile('Entry fee', Number(c.entryFeeUsd) > 0 ? money(c.entryFeeUsd) : 'Free',
      c.entryFeePayers ? 'paid by ' + num(c.entryFeePayers) + ' entrants' : 'no fee on this bounty'),
    factTile('Status', left.live ? 'Taking entries' : 'Ended — awaiting results',
      'by its deadline, not its status flag', 'font-size:14.5px'),
    factTile('Time left', left.text, 'deadline ' + dateUtc(c.deadline)),
    factTile('Entries', num(c.submissionCount || 0), 'opened ' + dateUtc(c.opensAt || c.publishedAt)),
    factTile('Category', esc(c.category || '—'),
      esc(feeLabel(c.entryFeeUsd)) + ' · escrowed on Solana', 'font-size:14.5px'),
  ];
  return '<div class="facts">' + tiles.join('') + '</div>' + timeline(c);
}

async function previewHtml(slug) {
  try {
    const lb = await leaderboard(slug);
    const top = (lb.entries || []).slice(0, 5);
    if (!top.length) return '<p class="note">No ranked entries yet.</p>';
    const rows = top.map((e) =>
      '<tr><td class="n">' + e.rank + '</td>'
      + '<td><a href="#/u/' + esc(e.handle) + '">@' + esc(e.handle) + '</a></td>'
      + '<td class="n">' + winRate(e.values && e.values.judge) + '</td></tr>').join('');
    return '<table><tr><th class="n">#</th><th>Entrant</th><th class="n">Win rate</th></tr>' + rows + '</table>';
  } catch {
    return '<p class="note">Leaderboard preview unavailable right now.</p>';
  }
}

export async function renderPane(el, slug, stub) {
  if (!slug) { el.innerHTML = '<p class="note">No bounty selected.</p>'; return null; }
  el.innerHTML = '<h1>' + esc((stub && stub.title) || slug) + '</h1><p class="note">Loading its page…</p>';
  const c = await competition(slug);
  el.innerHTML = '<h1>' + esc(c.title) + '</h1>'
    + '<p class="sub">' + esc(c.summary || '') + '</p>'
    + facts(c)
    + '<h2>Rewards at the live pot</h2>' + REWARDS_HEAD + rewardRows(c, 10) + '</table>'
    + '<div class="cols">'
    + '<div><h2>Leaderboard preview</h2><div id="pane-lb"></div>'
    + '<p><a href="#/bounty/' + esc(slug) + '/leaderboard">Full leaderboard →</a></p></div>'
    + '<div><h2>About this bounty</h2><div class="md">' + md((c.description || '').slice(0, 1200)) + '</div>'
    + '<p><a href="#/bounty/' + esc(slug) + '">Open the full bounty page →</a></p></div>'
    + '</div>';
  const paneLb = el.querySelector('#pane-lb');
  if (paneLb) paneLb.innerHTML = await previewHtml(slug);
  return c;
}

export async function render(el, slug) {
  window.__shotReady = false;
  el.innerHTML = '<p class="note">Loading the bounty…</p>';
  const c = await competition(slug);
  let latest = '';
  try {
    const s = await submissions(slug);
    latest = (s.items || []).slice(0, 6).map((it) =>
      '<tr><td><a href="#/u/' + esc(it.handle) + '">@' + esc(it.handle) + '</a></td>'
      + '<td>' + esc(it.title || '') + '</td><td>' + esc(it.status || '') + '</td>'
      + '<td>' + dateUtc(it.created_at) + '</td></tr>').join('');
  } catch { latest = ''; }
  el.innerHTML = '<p class="sub"><a href="#/board/' + esc(slug) + '">← Board</a> · Bounty</p>'
    + '<section class="pane">'
    + '<h1>' + esc(c.title) + '</h1>'
    + '<p class="sub">' + esc(c.summary || '') + '</p>'
    + facts(c)
    + '<h2>Rewards at the live pot</h2>' + REWARDS_HEAD + rewardRows(c, 20) + '</table>'
    + '<div class="cols">'
    + '<div><h2>Leaderboard preview</h2><div id="page-lb"></div>'
    + '<p><a href="#/bounty/' + esc(slug) + '/leaderboard">Full leaderboard →</a></p></div>'
    + '<div><h2>Latest entries</h2>'
    + (latest
      ? '<table><tr><th>Entrant</th><th>Entry</th><th>Status</th><th>Received</th></tr>' + latest + '</table>'
      : '<p class="note">No entries yet.</p>')
    + '</div></div>'
    + '<h2>The brief</h2><div class="md">' + md(c.description) + '</div>'
    + '<h2>Rules</h2><div class="md">' + md(c.rules || c.description) + '</div>'
    + '</section>';
  const pageLb = el.querySelector('#page-lb');
  if (pageLb) pageLb.innerHTML = await previewHtml(slug);
  window.__shotReady = true;
}
