/* js/ui/toast.js — Petits messages (« Mission : +6 ⭐ », « Série de 2 jours »…).
   En jeu : en bas de l'écran. Sur un écran de fin (fin de course, défaite ou victoire d'un niveau, fin du
   mode 2 joueurs), le bas est pris par la consigne « Touche l'écran pour rejouer » et par les boutons :
   le message se place alors JUSTE AU-DESSUS du panneau de fin, pour ne jamais cacher un bouton ni une consigne.
   S'il n'y a pas la place au-dessus (petit écran en paysage), il se pose en haut, à côté du panneau. */
(function (S) {
'use strict';
const { $ } = S;   // déjà chargés

// ---------- Réglages ----------
const SHOW_MS = 1900;          // durée d'un message
const GAP = 10;                // px entre le message et le panneau de fin
const END_PANELS = ['.lvcard.show:not(#lvIntro)', '#duoEnd.show', '#over.show'];   // les écrans de fin (le plus haut d'abord)

S.toastTimer = 0, S.toastQueue = [];

function endPanel() {
  for (const sel of END_PANELS) {
    const el = document.querySelector(sel);
    if (!el) continue;
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return r;
  }
  return null;
}
// Le message au bon endroit : en bas pendant le jeu ; sur un écran de fin, à la première place libre parmi :
// juste au-dessus du panneau, puis en haut à gauche ou à droite du panneau, puis en haut au centre.
// « Libre » : dans l'écran, hors du panneau, hors de tout bouton visible et de la zone de la pilule Poki.
function placeToast() {
  const el = $('toast'), r = endPanel();
  if (!r) { el.classList.remove('anchored'); el.style.left = el.style.top = ''; return; }
  el.classList.add('anchored');
  const k = S.uiZoom || 1;                         // grand écran : le message est zoomé (CSS zoom), ses positions aussi
  const h = (el.offsetHeight || 44) * k, w = (el.offsetWidth || 220) * k;
  const vw = window.innerWidth, vh = window.innerHeight, top0 = (S.safe ? S.safe.t : 0) + 8;
  const lo = (S.pillX || 0) + 8 + w / 2, hi = vw - (S.pillR || 0) - 8 - w / 2;   // jamais sous la pilule Poki
  const clampX = x => Math.min(Math.max(x, lo), Math.max(lo, hi));
  const shown = b => { const st = getComputedStyle(b); return st.display !== 'none' && st.visibility !== 'hidden'; };   // offsetParent est nul pour les boutons « fixed »
  const btns = [...document.querySelectorAll('button')].filter(b => !b.closest('#toast') && !b.closest('.hide') && shown(b))
    .map(b => b.getBoundingClientRect()).filter(q => q.width > 0 && q.height > 0);
  const hits = (a, q) => !(a.right <= q.left || a.left >= q.right || a.bottom <= q.top || a.top >= q.bottom);
  const free = (cx, top) => {
    const a = { left: cx - w / 2, right: cx + w / 2, top, bottom: top + h };
    return top >= top0 && a.bottom <= vh - 8 && !hits(a, r) && !btns.some(q => hits(a, q));
  };
  const above = Math.max(top0, r.top - h - GAP);
  const spots = [[r.left + r.width / 2, above], [r.left - GAP - w / 2, top0], [r.right + GAP + w / 2, top0],
                 [vw / 2, top0], [r.left + r.width / 2, Math.max(top0, r.top - h - 4)]].map(([x, t]) => [clampX(x), t]);
  const best = spots.find(([x, t]) => free(x, t)) || spots[spots.length - 1];   // aucune place libre : collé au-dessus
  el.style.left = Math.round(best[0] / k) + 'px';
  el.style.top = Math.round(best[1] / k) + 'px';
}
function toast(msg, now) {
  const el = $('toast');
  if (now) S.toastQueue = [];
  else if (el.classList.contains('show') && Date.now() - S.toastTimer < 900) { S.toastQueue.push(msg); return; }
  el.textContent = msg;
  placeToast();
  el.classList.add('show'); S.toastTimer = Date.now();
  clearTimeout(toast.h);
  toast.h = setTimeout(() => { el.classList.remove('show'); if (S.toastQueue.length) setTimeout(() => toast(S.toastQueue.shift()), 220); }, SHOW_MS);
}
// Un écran de fin qui apparaît (ou bouge) pendant qu'un message est affiché : le message suit
window.addEventListener('resize', () => { if ($('toast').classList.contains('show')) placeToast(); });
const watch = new MutationObserver(recs => {
  const el = $('toast');
  if (el.classList.contains('show') && recs.some(r => r.target !== el)) placeToast();   // ses propres changements ne comptent pas
});
watch.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'style'] });
S.placeToast = placeToast;

Object.assign(S, { toast });
})(window.Soleil);
