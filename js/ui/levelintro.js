/* js/ui/levelintro.js — Carte d'intro d'un niveau (1 à 2 s, passable d'un tap) : nom, idée, objectif et défi, rivaux.
   Les cartes du mode Niveaux sont créées ici en HTML (index.html n'a rien à prévoir). */
(function (S) {
'use strict';
const { L, tr, esc, PROFILES } = S;

// Crée (une fois) une carte du mode Niveaux, posée au-dessus du jeu
function lvCard(id) {
  let el = document.getElementById(id);
  if (!el) { el = document.createElement('div'); el.id = id; el.className = 'lvcard'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-live', 'polite'); document.body.appendChild(el); }
  return el;
}
const goalText = (lv, g) => (g ? L.goal(g, ((lv.rivals || []).find(r => r.id === g.who) || {}).name || '') : '');
const starRow = (got, n) => Array.from({ length: n }, (_, i) => `<span class="${got[i] ? 'on' : ''}">★</span>`).join('');

function showLevelIntro(lv) {
  const el = lvCard('lvIntro'), rec = S.Levels.peek(lv.id);
  const rivals = (lv.rivals || []).map(r => `<span class="kid"><b style="color:${S.KIND_COL[r.kind]}">${(PROFILES[r.kind] || {}).emoji || ''}</b> ${esc(r.name)}</span>`).join('');
  el.className = 'lvcard intro' + (lv.boss ? ' boss' : '');
  el.innerHTML =
    `<div class="lvl">${esc(lv.boss ? L.bossTag + ' · ' + L.levelN(lv.num) : L.levelN(lv.num))}</div>`
    + `<div class="ttl">${lv.emoji} ${esc(tr(lv.name))}</div>`
    + `<div class="tip">${esc(tr(lv.tip))}</div>`
    + `<div class="goals"><div class="${rec.s[1] ? 'got' : ''}"><b>★★</b> ${esc(goalText(lv, lv.goal))}</div>`
    + `<div class="${rec.s[2] ? 'got' : ''}"><b>★★★</b> ${esc(goalText(lv, lv.challenge))}</div></div>`
    + (rivals ? `<div class="kids">${rivals}</div>` : '')
    + `<div class="tap">${esc(L.tapStart)}</div>`;
  el.classList.add('show');
}
function hideLevelIntro() { const el = document.getElementById('lvIntro'); if (el) el.classList.remove('show'); }

Object.assign(S, { lvCard, goalText, starRow, showLevelIntro, hideLevelIntro });
})(window.Soleil);
