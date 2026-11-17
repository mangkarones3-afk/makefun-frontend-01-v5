// profile.js — an account's public profile (route #/u/<handle>):
// its record as stat tiles and every entry it has made, each row
// linking back to that entry's bounty. Avatar images are make.fun's
// own and load with crossorigin="anonymous", as their CORP header
// requires.

import { profile } from './net.js';
import { dateUtc, esc, imgUrl, money, num, shortWallet, winRate } from './fmt.js';

function scoreText(solution) {
  if (!solution || !solution.score) return '—';
  const { column, value } = solution.score;
  return column && column.key === 'judge' ? winRate(value) : esc(solution.score.display ?? value);
}

function statTile(key, value, sub) {
  return '<div class="fact"><div class="k">' + key + '</div><div class="v">' + value
    + '</div><div class="s">' + sub + '</div></div>';
}

export async function render(el, handle) {
  window.__shotReady = false;
  el.innerHTML = '<p class="note">Loading the profile…</p>';
  const p = await profile(handle);
  const record = p.record || {};
  const avatar = imgUrl((p.avatar && p.avatar.url) || p.image);
  const tiles = [
    statTile('Entered', num(record.competitions_entered || 0), 'bounties'),
    statTile('Placed', num(record.competitions_placed || 0), 'in paid places'),
    statTile('Won', num(record.competitions_won || 0), 'first places'),
    statTile('Podiums', num(record.podium_finishes || 0), 'top-three finishes'),
    statTile('Best place', record.best_placement ? '#' + record.best_placement : '—', 'so far'),
    statTile('Prizes', money(record.prize_usd || 0), 'won on make.fun'),
  ];
  const rows = (p.solutions || []).map((s) =>
    '<tr><td><a href="#/bounty/' + esc(s.competition.slug) + '">' + esc(s.competition.title) + '</a>'
    + '<div class="note">' + esc(s.title || '') + '</div></td>'
    + '<td class="n">' + scoreText(s) + '</td>'
    + '<td class="n">' + (s.placement ? '#' + s.placement : '—') + '</td>'
    + '<td class="n">' + (s.prize_usd ? money(s.prize_usd) : '—') + '</td>'
    + '<td>' + dateUtc(s.entered_at) + '</td></tr>').join('');
  el.innerHTML = '<p class="sub"><a href="#/">← Board</a> · Profile</p>'
    + '<section class="pane">'
    + '<div class="prof-head">'
    + (avatar ? '<img crossorigin="anonymous" src="' + esc(avatar) + '" alt="" width="56" height="56">' : '')
    + '<div><h1>@' + esc(p.handle) + (p.display_name ? ' · ' + esc(p.display_name) : '') + '</h1>'
    + '<p class="sub">' + esc(p.bio || '') + '</p>'
    + '<p class="note">Joined ' + dateUtc(p.joined_at) + ' · wallet '
    + esc(shortWallet(p.wallet && p.wallet.address))
    + (p.github_login ? ' · GitHub @' + esc(p.github_login) : '') + '</p></div></div>'
    + '<div class="facts">' + tiles.join('') + '</div>'
    + '<h2>Entries (' + (p.solutions || []).length + ')</h2>'
    + (rows
      ? '<table><tr><th>Bounty · entry</th><th class="n">Score</th><th class="n">Place</th>'
        + '<th class="n">Prize</th><th>Entered</th></tr>' + rows + '</table>'
      : '<p class="note">No entries yet.</p>')
    + '</section>';
  window.__shotReady = true;
}
