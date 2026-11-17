// net.js — Wispboard's network layer, and the voice of the status
// strip. Every read goes to make.fun's public API under three
// disciplines: a memory cache with a short freshness window, ETag
// revalidation past it (a 304 costs no body), and in-flight dedupe, so
// two views asking for the same answer at once share one request. The
// counters are painted into the strip as the evidence of all three.

import { clockUtc } from './fmt.js';

const BASE = 'https://make.fun/api';
const FRESH_MS = 20000;

export const stats = { requests: 0, unchanged: 0, cached: 0, at: null };
const store = new Map();    // url -> { etag, body, at }
const pending = new Map();  // url -> Promise, for dedupe
let viewBase = { requests: 0, unchanged: 0, cached: 0 };
let drawnNote = '';
let forceNextRead = false;

export function paint() {
  const el = document.getElementById('strip');
  if (!el) return;
  const r = stats.requests - viewBase.requests;
  const u = stats.unchanged - viewBase.unchanged;
  const c = stats.cached - viewBase.cached;
  el.innerHTML = 'this view: <b>' + r + ' API request' + (r === 1 ? '' : 's') + '</b>'
    + ' · ' + u + ' unchanged (ETag)'
    + ' · ' + c + ' from cache'
    + (drawnNote ? ' · ' + drawnNote : '')
    + ' · updated ' + (stats.at ? clockUtc(stats.at) : '—') + ' UTC';
}

// Called by the router on every route change: the strip counts per view.
export function beginView() {
  viewBase = { requests: stats.requests, unchanged: stats.unchanged, cached: stats.cached };
  drawnNote = '';
  paint();
}

// Views report how many rows they actually put in the DOM.
export function setDrawn(text) { drawnNote = text; paint(); }

// The frame's Refresh button: the next read revalidates instead of
// trusting the freshness window.
export function forceNext() { forceNextRead = true; }

export async function get(path, opts) {
  const url = BASE + path;
  const hit = store.get(url);
  const skipFresh = forceNextRead || (opts && opts.force);
  if (hit && !skipFresh && Date.now() - hit.at < FRESH_MS) {
    stats.cached += 1;
    paint();
    return hit.body;
  }
  if (pending.has(url)) return pending.get(url);
  const job = (async () => {
    stats.requests += 1;
    const res = await fetch(url, { headers: hit && hit.etag ? { 'If-None-Match': hit.etag } : {} });
    stats.at = new Date();
    if (res.status === 304 && hit) {
      hit.at = Date.now();
      stats.unchanged += 1;
      paint();
      return hit.body;
    }
    if (!res.ok) throw new Error('make.fun answered ' + res.status + ' on ' + path);
    const body = await res.json();
    store.set(url, { etag: res.headers.get('etag'), body, at: Date.now() });
    paint();
    return body;
  })();
  pending.set(url, job);
  try { return await job; } finally { pending.delete(url); forceNextRead = false; }
}

// The API's named answers, one wrapper per surface.
const enc = encodeURIComponent;
export const competition = (slug, o) => get('/competitions/' + enc(slug), o);
export const leaderboard = (slug, o) => get('/competitions/' + enc(slug) + '/leaderboard', o);
export const submissions = (slug, o) => get('/competitions/' + enc(slug) + '/submissions', o);
export const profile = (handle, o) => get('/profiles/' + enc(handle), o);

// The board's list, walked by cursor; a repeated cursor ends the walk.
export async function boardList(opts) {
  const items = [];
  const seenCursors = new Set();
  let cursor = null;
  for (let page = 0; page < 5; page += 1) {
    const q = cursor ? '&cursor=' + enc(cursor) : '';
    const body = await get('/competitions?status=open&activity=times' + q, opts);
    if (Array.isArray(body && body.items)) items.push(...body.items);
    if (!body || !body.next_cursor || seenCursors.has(body.next_cursor)) break;
    seenCursors.add(body.next_cursor);
    cursor = body.next_cursor;
  }
  return items;
}
