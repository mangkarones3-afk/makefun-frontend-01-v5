// app.js — Wispboard's boot module, the one file the shell's inline
// script imports. It builds the frame (chrome.js), wires the header's
// lookup form and the strip's Refresh button, and routes: every view
// arrives by a literal import() from the dispatch table below, so no
// view's code is fetched for a route that never opens it. A route
// change repaints only <main id="view">; the frame never rebuilds.

import { buildFrame } from './chrome.js';
import { beginView, forceNext } from './net.js';

buildFrame();

const view = document.getElementById('view');
let navSeq = 0;

function parseRoute() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  if (parts[0] === 'bounty' && parts[1] && parts[2] === 'leaderboard') return ['leaderboard', parts[1]];
  if (parts[0] === 'bounty' && parts[1]) return ['bounty', parts[1]];
  if (parts[0] === 'u' && parts[1]) return ['profile', parts[1]];
  if (parts[0] === 'board') return ['board', parts[1] || null];
  return ['board', null];
}

const loaders = {
  board: () => import('./board.js'),
  bounty: () => import('./bounty.js'),
  leaderboard: () => import('./leaderboard.js'),
  profile: () => import('./profile.js'),
};

async function go() {
  const mine = ++navSeq;
  window.__shotReady = false;
  const [name, arg] = parseRoute();
  try {
    beginView();
    const mod = await loaders[name]();
    if (mine !== navSeq) return;
    await mod.render(view, arg);
  } catch (err) {
    if (mine !== navSeq) return;
    view.innerHTML = '<div class="err">This view could not load. <a href="#/">Back to the board</a></div>';
    window.__shotReady = true;
  }
}

document.getElementById('lookup').addEventListener('submit', (e) => {
  e.preventDefault();
  const handle = document.getElementById('handle').value.trim().replace(/^@/, '');
  if (handle) location.hash = '#/u/' + encodeURIComponent(handle);
});
document.getElementById('refresh').addEventListener('click', () => { forceNext(); go(); });
addEventListener('hashchange', go);
go();
