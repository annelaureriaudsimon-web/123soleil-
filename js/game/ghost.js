/* js/game/ghost.js — Le fantôme de ton record */
(function (S) {
'use strict';

/* ---------- 16. Le fantôme de ton record ---------- */
function ghostZ(t) {
  if (!S.ghost) return null;
  const i = t / 0.1, i0 = Math.floor(i);
  if (i0 >= S.ghost.length - 1) return null;
  return (S.ghost[i0] + (S.ghost[i0 + 1] - S.ghost[i0]) * (i - i0)) / 10;
}

Object.assign(S, { ghostZ });
})(window.Soleil);
