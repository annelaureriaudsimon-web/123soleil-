/* js/ui/over.js — Fin de partie de la course infinie : carte, phrase « presque », 🎬 Continuer */
(function (S) {
'use strict';
const { PHASE_LEN, L, RANKS, $, clamp, fmt, missionsDone, streakAlive, Lt, over, safe, rankIndex, rankLabel } = S;   // déjà chargés

/* ---------- 23. Fin de partie ---------- */
function subMsg(R) {                                 // la phrase « presque » la plus parlante
  if (R.isRec) return '🏆 ' + L.newRecord;
  if (R.rankAfter > R.rankBefore && R.prevBest > 0) return L.newRank(rankLabel(R.rankAfter));
  const diff = R.prevBest - R.dist;
  if (R.prevBest > 0 && diff >= 0 && diff <= Math.max(12, R.prevBest * 0.15)) return diff === 0 ? L.tieRecord : L.toRecord(diff);
  const ri = rankIndex(S.best);
  if (ri < RANKS.length - 1 && RANKS[ri + 1].min - R.dist <= PHASE_LEN / 4 && RANKS[ri + 1].min > R.dist) return L.toRank(Math.ceil(RANKS[ri + 1].min - R.dist), rankLabel(ri + 1));
  const next = (Math.floor(R.dist / PHASE_LEN) + 1) * PHASE_LEN;
  if (next - R.dist <= PHASE_LEN * 0.15) return L.toPhase(next - R.dist, L.see[(next / PHASE_LEN) % 4]);
  if (R.reason === 'hop') return L.tipHop;
  if (R.reason === 'late' && R.ice) return L.tipIce;
  if (R.reason === 'late' && R.slope) return L.tipSlope;
  if (R.reason === 'running') return R.afterTrap ? L.realOne : R.moon ? L.tipMoon : L.tipSo;
  if (R.reason === 'early') return R.lie ? L.temptFail[R.lie] : L.tipLook;   // v2.5 : « Il comptait en te regardant… »
  return '';
}
function placeOver() {
  const k = S.uiZoom || 1;                         // grand écran : le panneau est zoomé (CSS zoom), ses positions aussi
  const h = (over.offsetHeight || 230) * k, w = (over.offsetWidth || 260) * k;
  let top;
  if (Lt.land && S.W > S.H * 1.2) {                // paysage : à droite du soleil, sans jamais dépasser du bord (640×360 sur Poki)
    over.style.left = Math.round(Math.min(S.W * 0.76, S.W - safe.r - S.pillR - w / 2 - 8) / k) + 'px'; top = (S.H - h) / 2;
  } else { over.style.left = '50%'; top = Lt.sunY + Lt.R * 0.78; }
  over.style.top = Math.round(clamp(top, safe.t + 64 * k, S.H - h - 70 * k - safe.b) / k) + 'px';
}
S.armTimer = 0;
function showOver() {
  const R = S.lastRun;
  $('ovRank').textContent = rankLabel(rankIndex(S.best));
  $('ovDist').innerHTML = `${R.dist}<small> m</small>`;
  $('ovMsg').textContent = R.reason === 'late' ? (R.ice ? L.lateIce(fmt(R.val)) : R.slope ? L.lateSlope(fmt(R.val)) : L.late(fmt(R.val)))
                         : R.reason === 'early' ? L.early(fmt(R.val)) : R.reason === 'hop' ? L.hopCaught : L.running;
  $('ovSub').textContent = subMsg(R);
  $('ovRew').textContent = `+${R.stars} ⭐ · 🎯 ${missionsDone()}/3${R.catches ? ` · ✨ ${R.catches}` : ''}`;
  $('ovPair').innerHTML = S.Reward.canRevive()      // 🎬 Continuer (pub récompensée), avec son bouton normal « Rejouer »
    ? S.Reward.pairHTML({ act: 'replay', label: L.retryBtn, icon: 'restart' }, { kind: 'revive', token: S.Reward.reviveToken(), label: L.continueBtn, cap: L.continueCap })
    : '';
  $('homeBtn2').setAttribute('aria-label', L.home); $('homeBtn2').title = L.home;
  over.classList.remove('armed');
  S.refreshUI();
  placeOver();
  over.classList.add('show');
  clearTimeout(S.armTimer);
  S.armTimer = setTimeout(() => { if (S.state === 'over') over.classList.add('armed'); }, 700);
}

// « Rejouer » (le bouton vert à côté de 🎬 Continuer) : comme toucher l'écran
$('ovPair').addEventListener('click', e => {
  const b = e.target.closest ? e.target.closest('button[data-act="replay"]') : null;
  if (!b || !over.classList.contains('armed') || S.state !== 'over') return;
  e.stopPropagation(); S.Sound.unlock(); b.blur();
  S.afterBreak(() => S.startRun('free'));
});
$('ovPair').addEventListener('pointerdown', e => e.stopPropagation());

Object.assign(S, { subMsg, placeOver, showOver });
})(window.Soleil);
