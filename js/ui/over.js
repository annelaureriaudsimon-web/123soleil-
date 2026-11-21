/* js/ui/over.js — Fin de partie de la course infinie : carte, grille, phrase « presque » */
(function (S) {
'use strict';
const { PHASE_LEN, L, RANKS, $, clamp, fmt, missionsDone, streakAlive, Lt, over, safe, rankIndex, rankLabel } = S;   // déjà chargés

/* ---------- 23. Fin de partie, partage, casier ---------- */
// Une ligne par phase traversée, comme une grille Wordle :
// 🟩 regard survécu · 🟨 OUF · 🎭 mot piège évité sans s'arrêter · 👁️ faux dos survécu · 😎 boss battu · 🔥 grillé
const PH_EMO = ['🌅', '☀️', '🌇', '🌙'];
const SUP = ['', '', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'];
const phaseEmoji = ph => PH_EMO[ph % 4] + (ph >= 4 ? (SUP[Math.floor(ph / 4) + 1] || '+') : '');   // 🌅² = matin du jour 2
const SYMS = ['🟩', '🟨', '🎭', '👁️', '😎', '⭐'];   // ⭐ = étoile flottante attrapée
function summarize(list) {                         // « 🟩×14 🟨×3 😎 🔥 »
  const out = [];
  SYMS.forEach(sym => { const n = list.filter(x => x === sym).length; if (n) out.push(n > 1 ? `${sym}×${n}` : sym); });
  if (list.includes('🔥')) out.push('🔥');
  return out.join(' ');
}
function phaseLines(ev, maxLines) {                // 10 symboles max par ligne, sinon résumé ; maxLines lignes au total
  const groups = [];
  for (const e of ev) { let g = groups[groups.length - 1]; if (!g || g.ph !== e.ph) groups.push(g = { ph: e.ph, s: [] }); g.s.push(e.s); }
  const line = g => `${phaseEmoji(g.ph)} ${g.s.length <= 10 ? g.s.join('') : summarize(g.s)}`;
  if (groups.length <= maxLines) return groups.map(line);
  const k = groups.length - maxLines + 1, head = groups.slice(0, k);   // les premières phases sont résumées ensemble
  return [`${head.map(g => phaseEmoji(g.ph)).join('')} ${summarize([].concat(...head.map(g => g.s)))}`, ...groups.slice(k).map(line)];
}
const whereText = R => L.where[R.phase] + (R.day > 1 ? L.dayTag(R.day) : '');
function howLine(R) {                              // « Grillé le soir : lâché 0,08 s trop tard 😭 »
  const w = whereText(R), t = fmt(R.val);
  if (R.reason === 'late') return L.howLate(w, t, R.ice ? 'ice' : R.slope ? 'slope' : '');
  if (R.reason === 'running') return L.howRun(w, t, R.moon);
  if (R.reason === 'hop') return L.howHop(w, t);
  return L.howEarly(w, t);
}
function rankShareLine(R) {
  const parts = [rankLabel(rankIndex(S.best))];
  if (streakAlive() >= 2) parts.push(L.streak(streakAlive()));
  if (R.isRec) parts.push(L.recShort);
  return parts.join(' · ');
}
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
  if (R.reason === 'early') return L.tipLook;
  return '';
}
function placeOver() {
  const h = over.offsetHeight || 230, w = over.offsetWidth || 260;
  let top;
  if (Lt.land && S.W > S.H * 1.2) {                // paysage : à droite du soleil, sans jamais dépasser du bord (640×360 sur Poki)
    over.style.left = Math.round(Math.min(S.W * 0.76, S.W - safe.r - S.pillR - w / 2 - 8)) + 'px'; top = (S.H - h) / 2;
  } else { over.style.left = '50%'; top = Lt.sunY + Lt.R * 0.78; }
  over.style.top = Math.round(clamp(top, safe.t + 64, S.H - h - 70 - safe.b)) + 'px';
}
S.armTimer = 0;
function showOver() {
  const R = S.lastRun;
  $('ovRank').textContent = rankLabel(rankIndex(S.best));
  $('ovDist').innerHTML = `${R.dist}<small> m</small>`;
  $('ovMsg').textContent = R.reason === 'late' ? (R.ice ? L.lateIce(fmt(R.val)) : R.slope ? L.lateSlope(fmt(R.val)) : L.late(fmt(R.val)))
                         : R.reason === 'early' ? L.early(fmt(R.val)) : R.reason === 'hop' ? L.hopCaught : L.running;
  $('ovSub').textContent = subMsg(R);
  $('ovGrid').textContent = phaseLines(R.events, 4).join('\n');
  $('ovRew').textContent = `+${R.stars} ⭐ · 🎯 ${missionsDone()}/3${R.catches ? ` · ✨ ${R.catches}` : ''}`;
  $('ovPair').innerHTML = S.Reward.canRevive()      // 🎬 Continuer (pub récompensée), avec son bouton normal « Rejouer »
    ? S.Reward.pairHTML({ act: 'replay', label: L.retryBtn, icon: 'restart' }, { kind: 'revive', token: S.Reward.reviveToken(), label: L.continueBtn, cap: L.continueCap })
    : '';
  $('share').innerHTML = S.icon('share') + S.esc(L.share); $('imgBtn').innerHTML = S.icon('camera') + S.esc(L.image);
  $('homeBtn2').setAttribute('aria-label', L.home); $('homeBtn2').title = L.home;
  over.classList.remove('armed');
  S.refreshUI();
  placeOver();
  over.classList.add('show');
  clearTimeout(S.armTimer);
  S.armTimer = setTimeout(() => { if (S.state === 'over') over.classList.add('armed'); }, 700);
  S.storyFile = null; S.storyPromise = null;
  setTimeout(() => { if (S.state === 'over' && S.lastRun === R) S.prepareStory(); }, 450);   // l'image est prête avant le clic
}

// « Rejouer » (le bouton vert à côté de 🎬 Continuer) : comme toucher l'écran
$('ovPair').addEventListener('click', e => {
  const b = e.target.closest ? e.target.closest('button[data-act="replay"]') : null;
  if (!b || !over.classList.contains('armed') || S.state !== 'over') return;
  e.stopPropagation(); S.Sound.unlock(); b.blur();
  S.afterBreak(() => S.startRun('free'));
});
$('ovPair').addEventListener('pointerdown', e => e.stopPropagation());

Object.assign(S, { PH_EMO, SUP, phaseEmoji, SYMS, summarize, phaseLines, whereText, howLine, rankShareLine,
  subMsg, placeOver, showOver });
})(window.Soleil);
