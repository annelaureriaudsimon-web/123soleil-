/* js/platform/debug.js — Mode debug de la couche Poki (version dev seulement, RETIRÉ du build Poki).
   index.html?debug=1           : journal à l'écran de chaque événement SDK avec son heure ; les enchaînements
                                  interdits (start en double, événement pendant une pub…) sont en rouge.
   index.html?debug=1&fakead=1  : en plus, un faux SDK qui montre une fausse pub de 2 s à chaque pause pub,
                                  pour tester le gel, le son coupé et la reprise sans être sur Poki. */
(function (S) {
'use strict';
const q = new URLSearchParams(location.search);
if (q.get('debug') !== '1') return;

const MAX_LINES = 14;
const COL = { sent: '#8CF5B5', info: '#C9CEE0', bad: '#FF6B6B' };
const lines = [];
S.debugLog = lines;                                // aussi lisible depuis la console (et par les tests)
const box = document.createElement('div');
box.id = 'pokiDebug';
box.style.cssText = 'position:fixed;left:6px;bottom:6px;z-index:80;max-width:min(96vw,430px);padding:6px 8px;border-radius:10px;'
  + 'background:rgba(10,12,40,.78);color:#fff;font:11px/1.35 ui-monospace,Menlo,Consolas,monospace;pointer-events:none;white-space:pre-wrap;';
const head = document.createElement('div');
const list = document.createElement('div');
box.append(head, list);
const mount = () => { if (!box.isConnected) document.body.appendChild(box); };
if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);

function draw() {
  head.textContent = `POKI · ${S.Poki.mode} · ${S.Poki.state}${S.paused ? ' · pause' : ''}`;
  list.innerHTML = lines.slice(-MAX_LINES).map(l =>
    `<div style="color:${COL[l.kind] || '#fff'}">${l.time.toFixed(3).padStart(8)} s  ${S.esc(l.name)}${l.info ? ' — ' + S.esc(l.info) : ''}</div>`).join('');
}
S.debugHook = (kind, name, info) => {
  lines.push({ kind, name, info, time: performance.now() / 1000 });
  draw();
};
setInterval(draw, 500);                            // l'état (en jeu, pub, pause) reste à jour

// ---------- Faux SDK avec une fausse pub de 2 s ----------
if (q.get('fakead') !== '1') return;
const AD_MS = 2000;
function fakeAd(onStart) {
  return new Promise(resolve => {
    setTimeout(() => {
      if (onStart) onStart();
      const ad = document.createElement('div');
      ad.style.cssText = 'position:fixed;inset:0;z-index:70;display:flex;align-items:center;justify-content:center;'
        + 'background:#111;color:#fff;font:900 28px system-ui,sans-serif;';
      ad.textContent = 'PUB (simulation) · 2 s';
      document.body.appendChild(ad);
      setTimeout(() => { ad.remove(); resolve(true); }, AD_MS);
    }, 150);
  });
}
S.fakePoki = {
  calls: [],
  init() { this.calls.push('init'); return Promise.resolve(); },
  gameLoadingFinished() { this.calls.push('gameLoadingFinished'); },
  gameplayStart() { this.calls.push('gameplayStart'); },
  gameplayStop() { this.calls.push('gameplayStop'); },
  commercialBreak(onStart) { this.calls.push('commercialBreak'); return fakeAd(onStart).then(() => undefined); },
  rewardedBreak(opts) { this.calls.push('rewardedBreak'); return fakeAd(opts && opts.onStart); },
  movePill(a, b) { this.calls.push(`movePill(${a}, ${b})`); }
};
})(window.Soleil);
