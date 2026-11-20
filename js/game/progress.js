/* js/game/progress.js — Progression : étoiles, rangs, missions, série */
(function (S) {
'use strict';
const { PHASE_LEN, UNLOCK, L, tr, RANKS, store, DAY, saveMissions, todayMissions, PHASE_WATCHER, Sound, Lt } = S;   // déjà chargés
   // ph = phase (0 matin, 1 midi… 4 = jour 2)

/* ---------- 11. Progression : étoiles, rangs, missions, série, médailles ---------- */
function rankIndex(d) { let i = 0; RANKS.forEach((r, k) => { if (d >= r.min) i = k; }); return i; }
const rankLabel = i => `${RANKS[i].e} ${tr(RANKS[i])}`;

function addStars(n) {
  if (n <= 0) return;
  S.stars += n; S.runStars += n; store.set('stars', S.stars);
}

function statValue(stat) {
  if (stat === 'runs') return S.mstate.runs;
  if (stat === 'total') return S.mstate.total + (S.state === 'play' ? Math.floor(S.runner.z) : 0);
  if (stat === 'dist') return S.state === 'play' ? Math.floor(S.runner.z) : (S.lastRun ? S.lastRun.dist : 0);
  return S.RS[stat] || 0;
}
function checkMissions() {
  for (const m of todayMissions) {
    if (S.mstate.done[m.id] || statValue(m.stat) < m.goal) continue;
    S.mstate.done[m.id] = true; saveMissions();
    addStars(m.reward);
    Sound.mission();
    S.toast(L.missionToast(tr(m), m.reward));
    if (S.state === 'play') S.popup(L.mission, Lt.cx, Lt.hy + (Lt.yFeet - Lt.hy) * 0.22, '#06D6A0', Math.min(Lt.U * 0.075, 40), 1.4);
  }
}
function touchStreak() {                       // première partie du jour : la série continue (ou repart à 1)
  if (S.streak.last === DAY) return 0;
  S.streak = { n: S.streak.last === DAY - 1 ? S.streak.n + 1 : 1, last: DAY };
  store.set('streak', S.streak);
  return Math.min(S.streak.n, 7);
}


/* ---------- 28. Étoiles à attraper, nuage, descente ---------- */
function phaseSubText(pi) {                        // annonce des obstacles qui arrivent dans cette phase (calculée depuis UNLOCK)
  const items = Object.keys(UNLOCK).filter(key => UNLOCK[key] >= pi * PHASE_LEN && UNLOCK[key] < (pi + 1) * PHASE_LEN).map(key => L.obst[key]);
  if (PHASE_WATCHER[pi % 4] === 'moon' && pi < 4) items.unshift(L.moonCall);
  if (!items.length) return '';
  const txt = items.length === 1 ? items[0] : items.slice(0, -1).join(', ') + L.and + items[items.length - 1];
  return txt.charAt(0).toUpperCase() + txt.slice(1) + L.bang;
}

Object.assign(S, { rankIndex, rankLabel, addStars, statValue, checkMissions, touchStreak, phaseSubText });
})(window.Soleil);
