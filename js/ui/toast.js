/* js/ui/toast.js — Petits messages en bas de l’écran */
(function (S) {
'use strict';
const { $ } = S;   // déjà chargés

S.toastTimer = 0, S.toastQueue = [];
function toast(msg, now) {
  const el = $('toast');
  if (now) S.toastQueue = [];
  else if (el.classList.contains('show') && Date.now() - S.toastTimer < 900) { S.toastQueue.push(msg); return; }
  el.textContent = msg; el.classList.add('show'); S.toastTimer = Date.now();
  clearTimeout(toast.h);
  toast.h = setTimeout(() => { el.classList.remove('show'); if (S.toastQueue.length) setTimeout(() => toast(S.toastQueue.shift()), 220); }, 1900);
}

Object.assign(S, { toast });
})(window.Soleil);
