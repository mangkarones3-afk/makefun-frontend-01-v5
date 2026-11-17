// leaderboard.js — a bounty's full leaderboard (route
// #/bounty/<slug>/leaderboard). Boards run to hundreds of ranked
// entries, so the table is windowed: 60 rows live in the DOM at a
// time and each "Show more" appends the next window in place — the
// whole list is never built at once. The note under the heading and
// the strip's rows-drawn count both state that on the page itself.

import { competition, leaderboard, setDrawn } from './net.js';
import { esc, imgUrl, num, winRate } from './fmt.js';

const WINDOW = 60;

function rowHtml(e) {
  const j = e.judge || {};
  const record = j.wins != null
    ? j.wins + 'W · ' + (j.draws || 0) + 'D · ' + (j.losses || 0) + 'L' : '—';
  const interval = e.interval ? winRate(e.interval.low) + ' – ' + winRate(e.interval.high) : '—';
  const avatar = imgUrl(e.image);
  const img = avatar
    ? '<img class="avatar" crossorigin="anonymous" src="' + esc(avatar) + '" alt="" width="22" height="22" loading="lazy">'
    : '';
  const rate = e.values && e.values.judge != null ? winRate(e.values.judge) : '—';
  const dossier = e.values && e.values.bytes ? (Number(e.values.bytes) / 1024).toFixed(1) + ' KB' : '—';
  return '<tr><td class="n"><b>' + e.rank + '</b></td>'
    + '<td>' + img + '<a href="#/u/' + esc(e.handle) + '">@' + esc(e.handle) + '</a>'
    + '<div class="note">' + esc(e.title || '') + '</div></td>'
    + '<td class="n"><b>' + rate + '</b></td>'
    + '<td class="n">' + interval + '</td>'
    + '<td class="n">' + record + '</td>'
    + '<td class="n">' + dossier + '</td></tr>';
}

export async function render(el, slug) {
  window.__shotReady = false;
  el.innerHTML = '<p class="note">Loading the leaderboard…</p>';
  const [lb, c] = await Promise.all([
    leaderboard(slug),
    competition(slug).catch(() => null),
  ]);
  const entries = lb.entries || [];
  const paidNote = c && Array.isArray(c.rewardsNow) && c.rewardsNow.length
    ? ' · places pay the top ' + c.rewardsNow.length : '';
  let shown = 0;
  el.innerHTML = '<p class="sub"><a href="#/bounty/' + esc(slug) + '">← '
    + esc((c && c.title) || slug) + '</a> · Leaderboard</p>'
    + '<section class="pane">'
    + '<h1>' + esc((c && c.title) || slug) + ' — leaderboard</h1>'
    + '<p class="sub">' + num(entries.length) + ' ranked entries · '
    + esc((lb.phase && lb.phase.title) || 'Development')
    + ' phase, provisional until the final heat' + paidNote + '</p>'
    + '<p class="note" id="lb-note"></p>'
    + '<table><tr><th class="n">#</th><th>Entrant · entry</th><th class="n">Win rate</th>'
    + '<th class="n">90% interval</th><th class="n">Record</th><th class="n">Dossier</th></tr>'
    + '<tbody id="lb-body"></tbody></table>'
    + '<p class="more"><button class="ghost" id="lb-more" type="button">Show more rows</button></p>'
    + '</section>';
  const body = el.querySelector('#lb-body');
  const note = el.querySelector('#lb-note');
  const more = el.querySelector('#lb-more');
  const paintWindow = () => {
    const next = Math.min(shown + WINDOW, entries.length);
    body.insertAdjacentHTML('beforeend', entries.slice(shown, next).map(rowHtml).join(''));
    shown = next;
    setDrawn(shown + ' of ' + num(entries.length) + ' rows drawn');
    note.textContent = 'Windowed list · ' + shown + ' of ' + num(entries.length)
      + ' rows in the DOM · rows are appended in place, never the whole table at once'
      + ' · this view\u2019s requests are counted in the strip above';
    more.style.display = shown < entries.length ? '' : 'none';
  };
  more.addEventListener('click', paintWindow);
  paintWindow();
  window.__shotReady = true;
}
