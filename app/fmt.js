// fmt.js — the formatters every view shares: HTML escaping, grouped
// numbers, money, deadline arithmetic, UTC dates, win rates, image
// URLs and short wallet addresses. Pure functions; no DOM, no network.

const ESC_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ESC_MAP[ch]);

const groupThousands = (digits) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

export const num = (value) => groupThousands(String(Math.trunc(Number(value) || 0)));

// Amounts arrive as numbers or decimal strings; whole dollars stay whole.
export function money(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '$0';
  if (Number.isInteger(n)) return '$' + groupThousands(String(n));
  const parts = n.toFixed(2).split('.');
  return '$' + groupThousands(parts[0]) + '.' + parts[1];
}

export const feeLabel = (usd) => (Number(usd) > 0 ? money(usd) + ' entry' : 'Free entry');

// Liveness is read off the deadline itself, never a status flag: an
// API row can call itself open past the moment it stops taking entries.
export function timeLeft(iso, now = Date.now()) {
  const ms = new Date(iso).getTime() - now;
  if (!(ms > 0)) return { text: 'Ended', live: false };
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return { text: minutes + 'm left', live: true };
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return { text: hours + 'h ' + (minutes % 60) + 'm left', live: true };
  return { text: Math.floor(hours / 24) + 'd ' + (hours % 24) + 'h left', live: true };
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad2 = (n) => String(n).padStart(2, '0');

export function dateUtc(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return MONTH_NAMES[d.getUTCMonth()] + ' ' + d.getUTCDate() + ', '
    + pad2(d.getUTCHours()) + ':' + pad2(d.getUTCMinutes()) + ' UTC';
}

export function clockUtc(when) {
  const d = when ? new Date(when) : new Date();
  return pad2(d.getUTCHours()) + ':' + pad2(d.getUTCMinutes()) + ':' + pad2(d.getUTCSeconds());
}

// Win rates travel as micro-percents: 956066 means 95.6066%.
export const winRate = (micro) => (Number(micro) / 10000).toFixed(1) + '%';

// Only make.fun's own images may load: a relative API path is made
// absolute on make.fun, an absolute make.fun URL passes, the rest drop.
export function imgUrl(path) {
  if (!path) return '';
  if (path.startsWith('/')) return 'https://make.fun' + path;
  return path.startsWith('https://make.fun/') ? path : '';
}

export const shortWallet = (addr) => (addr ? addr.slice(0, 4) + '…' + addr.slice(-4) : '—');
