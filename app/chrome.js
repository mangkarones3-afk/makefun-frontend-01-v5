// chrome.js — everything the shell used to carry, delivered late:
// the page frame (header, status strip, strategy line, footer) and
// the app's whole stylesheet. The first load is a bare skeleton, so
// the frame is built here, by the first module the boot imports, and
// the stylesheet is injected as a <style> element the moment this
// module loads. It is this app's own CSS; no rule loads anything
// from anywhere, and no view needs a second style pass.

export const STRATEGY = 'First load is a 352-byte shell — the frame, the styles and every view '
  + 'arrive by import(). ETag-revalidated cache · in-flight dedupe · rows patched in place · windowed leaderboard';

const CSS = `
:root{--ink:#14102a;--mut:#5d5773;--line:#e2def0;--bg:#f6f5fa;--card:#fff;--acc:#4b38c3;--acc2:#ece8ff;--good:#067647;--bad:#b42318}
*{box-sizing:border-box}
body{margin:0;font:14px/1.45 -apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;color:var(--ink);background:var(--bg)}
a{color:var(--acc);text-decoration:none}
a:hover{text-decoration:underline}
.hd{display:flex;align-items:center;gap:14px;flex-wrap:wrap;padding:10px 16px;background:var(--card);border-bottom:1px solid var(--line)}
.brand{font-size:17px;font-weight:800;color:var(--ink);letter-spacing:-.02em}
.brand b{color:var(--acc)}
.hd nav{margin-left:auto;display:flex;gap:14px;align-items:center;flex-wrap:wrap}
.lookup{display:flex;gap:6px}
.lookup input{width:180px;max-width:52vw;padding:6px 9px;border:1px solid var(--line);border-radius:8px;font:inherit;font-size:13px}
button{font:inherit;font-size:13px;font-weight:600;border:1px solid var(--acc);background:var(--acc);color:#fff;border-radius:8px;padding:6px 12px;cursor:pointer}
button.ghost{background:#fff;color:var(--acc)}
.strip{display:flex;align-items:center;gap:10px;padding:6px 16px;background:#171233;color:#e9e5ff;font-size:12.5px}
.strip b{color:#fff}
.strip button{margin-left:auto;background:transparent;border-color:#8f83e0;color:#fff;padding:3px 10px}
.strategy,main,footer{max-width:1360px;margin:0 auto}
.strategy{padding:5px 16px 0;color:var(--mut);font-size:12px}
main{padding:14px 16px 8px}
.note{font-size:12.5px;color:var(--mut)}
.err{border:1px solid var(--bad);color:var(--bad);background:#fef3f2;border-radius:9px;padding:10px 12px}
footer{padding:4px 16px 18px;color:var(--mut);font-size:12.5px}
.stats{display:flex;gap:8px;flex-wrap:wrap;align-items:baseline;margin:2px 0 10px;color:var(--mut);font-size:13px}
.stats b{color:var(--ink);font-size:15px}
.tools{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px}
.tools input[type=search]{flex:1;min-width:150px;padding:7px 10px;border:1px solid var(--line);border-radius:8px;font:inherit;background:#fff}
.tools select{padding:7px 8px;border:1px solid var(--line);border-radius:8px;font:inherit;background:#fff}
.split{display:grid;grid-template-columns:minmax(320px,400px) 1fr;gap:14px;align-items:start}
.board{display:flex;flex-direction:column;gap:8px}
.brow{display:block;background:var(--card);border:1px solid var(--line);border-radius:10px;padding:9px 11px;color:var(--ink)}
.brow:hover{border-color:var(--acc);text-decoration:none}
.brow.sel{border-color:var(--acc);box-shadow:0 0 0 2px var(--acc2)}
.brow .t{font-weight:700;font-size:13.5px;line-height:1.3}
.brow .m{display:flex;gap:10px;flex-wrap:wrap;margin-top:5px;font-size:12.5px;color:var(--mut)}
.brow .m b{color:var(--ink)}
.pot{color:var(--acc);font-weight:800}
.live{color:var(--good);font-weight:700}
.ended{color:var(--bad);font-weight:700}
.pane{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:16px 18px;min-height:300px}
.pane h1{font-size:21px;margin:0 0 4px;letter-spacing:-.02em;line-height:1.25}
.pane h2{font-size:14.5px;margin:20px 0 8px}
.sub{color:var(--mut);margin:0 0 6px}
.facts{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:12px 0}
.fact{border:1px solid var(--line);border-radius:9px;padding:8px 10px}
.fact .k{font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--mut)}
.fact .v{font-size:16.5px;font-weight:800;margin-top:1px}
.fact .s{font-size:12px;color:var(--mut)}
.tl{margin:2px 0 4px}
.tl-track{height:6px;background:var(--acc2);border-radius:99px}
.tl-fill{height:100%;background:var(--acc);border-radius:99px}
.tl-labels{display:flex;justify-content:space-between;gap:8px;font-size:12px;color:var(--mut);margin-top:4px}
table{border-collapse:collapse;width:100%;font-size:13px}
th{text-align:left;color:var(--mut);font-size:11.5px;text-transform:uppercase;letter-spacing:.04em;padding:5px 8px;border-bottom:1px solid var(--line)}
td{padding:5px 8px;border-bottom:1px solid var(--line);vertical-align:top}
td.n,th.n{text-align:right;font-variant-numeric:tabular-nums}
.cols{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.md{font-size:13.5px;color:#2c2847}
.md h2{font-size:16px;margin:16px 0 6px}
.md h3{font-size:14px;margin:14px 0 4px}
.md p{margin:6px 0}
.md ul,.md ol{margin:6px 0;padding-left:20px}
.md code{background:var(--bg);padding:0 4px;border-radius:4px;font-size:12.5px}
.avatar{border-radius:50%;vertical-align:-7px;margin-right:7px}
.prof-head{display:flex;gap:14px;align-items:center;flex-wrap:wrap}
.prof-head img{border-radius:50%}
.more{margin:10px 0}
@media (max-width:900px){.split{grid-template-columns:1fr}.facts{grid-template-columns:repeat(2,1fr)}.cols{grid-template-columns:1fr}}
`;

let styled = false;

export function applyStyle() {
  if (styled) return;
  styled = true;
  const el = document.createElement('style');
  el.id = 'app-style';
  el.textContent = CSS;
  document.head.append(el);
}

// Builds the frame around the shell's lone <main id="view">: header
// with the profile lookup, the status strip the network layer paints
// into, the strategy line, and the footer. Runs once, from the boot.
export function buildFrame() {
  applyStyle();
  const view = document.getElementById('view');
  const header = document.createElement('header');
  header.className = 'hd';
  header.innerHTML = '<a class="brand" href="#/">make.fun <b>wispboard</b></a>'
    + '<nav><a href="#/">Board</a>'
    + '<form class="lookup" id="lookup"><input id="handle" type="text" '
    + 'placeholder="Profile handle, e.g. mangkarones" aria-label="Profile handle">'
    + '<button type="submit">Open profile</button></form></nav>';
  const strip = document.createElement('div');
  strip.className = 'strip';
  strip.innerHTML = '<span id="strip">this view: warming up…</span>'
    + '<button id="refresh" type="button">Refresh</button>';
  const strategy = document.createElement('p');
  strategy.className = 'strategy';
  strategy.textContent = STRATEGY;
  const footer = document.createElement('footer');
  footer.textContent = 'Read-only: every figure is read live from make.fun\u2019s public API. '
    + 'Nothing signs in, nothing writes.';
  view.before(header, strip, strategy);
  view.after(footer);
}
