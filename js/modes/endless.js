/* js/modes/endless.js — Course infinie : départ, progression, GRILLÉ ! */
(function (S) {
'use strict';
const { PHASE_LEN, STAR_EVERY, L, $, vibrate, mulberry32, store, dailyState, DAY, saveMissions, SEED, Sound, SAY,
  Voice, Lt, over, newRunner, newRunStats, newWatcher, addStars, checkMissions, phaseSubText,
  rankIndex, touchStreak, randomSeed, setRunSeed, vmaxAt, ghostZ } = S;   // déjà chargés

function updateTrapWatch() {           // as-tu freiné pour un mot piège ?
  if (!S.trapWatch) return;
  if (S.runner.v === 0) S.trapWatch.stopped = true;
  if (S.runT - S.trapWatch.t < 0.6) return;
  if (S.trapWatch.moving) {
    if (S.trapWatch.stopped) S.popup(L.trapped, Lt.cx, Lt.yFeet - Lt.s * 1.9, '#FF8FA3', Math.min(Lt.U * 0.06, 32), 0.9);
    else {
      S.RS.traps++; addStars(1);
      S.popup(L.notTrapped, Lt.cx, Lt.yFeet - Lt.s * 1.9, '#8CF5B5', Math.min(Lt.U * 0.06, 32), 0.9);
      checkMissions();
    }
  }
  S.trapWatch = null;
}

function updateProgress() {
  const z = S.runner.z, pi = Math.floor(z / PHASE_LEN);
  if (pi > S.phaseIdx) {
    S.phaseIdx = pi;
    const k = pi % 4;
    S.phaseTitle = k === 0 ? { title: L.dayN(Math.floor(pi / 4) + 1), sub: L.daySub, t: 0 }
                         : { title: L.phases[k], sub: phaseSubText(pi), t: 0 };
    if (vmaxAt(z) > vmaxAt(z - PHASE_LEN)) S.phaseTitle.sub2 = L.speedUp;
    S.bossQueue.push(pi);                                       // un boss à chaque nouvelle phase
    Sound.phase();
  }
  const s25 = Math.floor(z / STAR_EVERY);
  if (s25 > S.lastStar50) {                                     // une étoile tous les STAR_EVERY m
    S.lastStar50 = s25; addStars(1); Sound.star();
    S.starPop(1);
  }
  if (!S.passedRecord && S.recordAtStart >= 5 && z > S.recordAtStart) {
    S.passedRecord = true; S.confetti(70); Sound.record(); vibrate(40);
    S.popup(L.newRecord, Lt.cx, Lt.hy + (Lt.yFeet - Lt.hy) * 0.3, '#FFD166', S.fit(L.newRecord, Math.min(Lt.U * 0.09, 50), S.W * 0.9), 1.6);
  }
  while (S.runT >= S.ghostRec.length * 0.1) S.ghostRec.push(Math.round(z * 10));   // pour le futur fantôme
  if (S.ghostAlive && ghostZ(S.runT) === null) {                  // ton fantôme se fait griller à ton ancien record
    S.ghostAlive = false;
    if (S.ghostLast) S.smokeAt(S.ghostLast.x, S.ghostLast.y, S.ghostLast.s, 10);
  }
  checkMissions();
}

/* ---------- 17. GRILLÉ ! ---------- */
function caught(reason, val) {
  S.state = 'caught'; S.caughtT = 0;
  const w = S.watcher, r = S.runner;
  w.state = 'caught'; w.angry = true; w.turnP = 1; w.textFadeT = S.gtime;
 
  S.timeScale = 0.18;                                          // petit ralenti dramatique
  Sound.busted(); Sound.wind(0);
  Voice.quip(SAY.grilled, w.type === 'moon');                // « Bien cuit ! »
  // Après une 2e chance (pub récompensée), la 1re défaite a déjà été comptée (partie, distance, bonus) : on ne
  // compte que ce qui est nouveau, et le record se compare à celui d'AVANT la partie.
  const R0 = S.reviveFrom;
  const dist = Math.floor(r.z), prev = R0 ? R0.prevBest : Math.floor(S.best);
  const rankBefore = rankIndex(prev), rankAfter = rankIndex(Math.max(prev, dist));
  if (dist > Math.floor(S.best)) {
    S.best = dist; store.set('best', S.best);
    S.ghostRec.push(Math.round(r.z * 10));
    if (S.ghostRec.length > 1) { S.ghost = S.ghostRec.slice(0, 6000); store.set('ghost', S.ghost); }
  }
  if (dist > prev && prev > 0 && !(R0 && R0.recBonus)) addStars(3);          // bonus record (une fois par partie)
  if (rankAfter > (R0 ? R0.rankAfter : rankBefore) && prev > 0) addStars(5); // bonus nouveau rang (seulement les nouveaux)
  if (!R0) { S.plays++; store.set('plays', S.plays); S.mstate.runs++; S.mstate.total += dist; }
  else S.mstate.total += Math.max(0, dist - R0.dist);
  const bs = S.mstate.bestStat;
  ['oufs', 'combo', 'sprint', 'mud', 'ice', 'traps', 'bosses', 'hops', 'looks', 'catches', 'big', 'slope'].forEach(k => { bs[k] = Math.max(bs[k] || 0, Math.floor(S.RS[k])); });
  bs.dist = Math.max(bs.dist || 0, dist);
  S.lastRun = { dist, mode: S.mode, reason, val, isRec: dist > prev && prev > 0, prevBest: prev,
              phase: Math.floor(r.z / PHASE_LEN) % 4, day: Math.floor(r.z / (PHASE_LEN * 4)) + 1, moon: w.type === 'moon',
              ice: r.ground === 'ice', slope: r.ground === 'slope', afterTrap: w.trapsThisChant > 0 && reason !== 'hop' && reason !== 'early',
              rankBefore, rankAfter, stars: 0, bosses: S.RS.bosses, combo: S.RS.combo, catches: S.RS.catches };
  checkMissions();
  saveMissions();
  S.lastRun.stars = S.runStars;
  if (S.mode === 'daily')                                     // résultat du défi gardé pour l'accueil
    store.set('daily', { day: DAY, used: true, done: true, dist });
}

function updateCaught(dt) {
  S.caughtT += dt;
  const r = S.runner, sdt = dt * S.timeScale;
  r.v = Math.max(0, r.v - r.dec * sdt); r.z += r.v * sdt; r.phase += r.v * sdt * 1.6;
  r.statue += (1 - r.statue) * Math.min(1, dt * 10);
  if (S.caughtT >= 0.3 && r.toast === 0) {                      // le rayon touche : tout noir !
    r.toast = 0.01; r.v = 0; S.shake = Lt.U * 0.035; S.flash = 1;
    vibrate([70, 40, 140]); Sound.sizzle(); S.smoke(14, true);
  }
  if (r.toast > 0) { r.toast = Math.min(1, r.toast + dt * 6); if (Math.random() < dt * 7) S.smoke(1, false); }
  r.jx = r.toast > 0 && S.caughtT < 0.8 ? (Math.random() - 0.5) * 0.05 : 0;
  if (S.state === 'caught' && S.caughtT >= 0.55) { S.state = 'over'; S.overT = S.gtime; S.showOver(); }
}

function startRun(m = 'free') {
  if (m === 'daily') {
    if (dailyState()) return;                                   // un seul essai par jour
    store.set('daily', { day: DAY, used: true, done: false });  // compté dès le départ : recharger ne redonne pas d'essai
  }
  S.trialEnd();                                                 // une tenue d'essai ne dure qu'une partie (js/ui/reward.js)
  S.mode = m; S.duo = null;
  S.runNo = (S.runNo || 0) + 1; S.revivedRun = false; S.reviveFrom = null;   // 2e chance : une par partie
  setRunSeed(m === 'daily' ? SEED : randomSeed());              // défi : même graine pour tous ; libre : graine au hasard
  S.state = 'play';
  S.rng = mulberry32(S.runSeed);
  S.runner = newRunner();
  const rayA = S.watcher.rayA;
  S.watcher = newWatcher();
  S.watcher.rayA = rayA; S.watcher.state = 'pause'; S.watcher.pauseDur = 0.75;
  S.runT = 0; S.cycleN = 0;
  S.star = null; S.cloudK = 0; S.trapBanner = null; S.cloudBanner = null; S.trapTuto = false;
  S.recordAtStart = S.best; S.passedRecord = false;
  S.phaseIdx = 0; S.phaseTitle = null; S.bossBanner = null; S.bossQueue = [];
  S.particles = []; S.shake = 0; S.flash = 0; S.timeScale = 1;
  S.RS = newRunStats(); S.combo = 0; S.runStars = 0; S.lastStar50 = 0; S.trapWatch = null;
  S.ghostRec = []; S.ghostAlive = !!S.ghost; S.ghostLast = null;
  S.tutorial = S.plays === 0;
  over.classList.remove('show', 'armed');
  $('duoEnd').classList.remove('show', 'armed');
  if (S.mstate.day !== DAY) S.mstate = { day: DAY, done: {}, runs: 0, total: 0, bestStat: {} };
  const bonus = touchStreak();
  if (bonus) { addStars(bonus); S.toast(L.streakToast(S.streak.n, bonus)); }
  S.trialBegin();
  S.refreshUI();
  Sound.start();
}

// 2e chance (pub récompensée vue jusqu'au bout, js/ui/reward.js) : la course continue là où on a été grillé.
// Une seule par partie, jamais dans le défi du jour. Le coureur est à l'arrêt, le soleil se remet de dos,
// puis 1 s de protection. Distance, record, fantôme, missions : tout continue.
const REVIVE_PAUSE = 1.2;                                      // s : la pause du soleil avant le prochain chant
function reviveRun() {
  if (S.state !== 'over' || S.mode !== 'free' || S.revivedRun || !S.lastRun) return false;
  const R = S.lastRun;
  S.reviveFrom = { prevBest: R.prevBest, dist: R.dist, recBonus: R.isRec, rankAfter: R.rankAfter };
  S.revivedRun = true;
  over.classList.remove('show', 'armed');
  S.state = 'play'; S.caughtT = 0; S.timeScale = 1; S.shake = 0; S.flash = 0;
  Object.assign(S.runner, { v: 0, toast: 0, statue: 0, jx: 0, pressed: false, stopT: S.runT, sprintFrom: null, slide: 0 });
  Object.assign(S.watcher, { state: 'pause', t: 0, turnP: 0, text: '', textKind: '', angry: false, laugh: 0, angryUntil: 0,
    second: false, retTo: 0, spotted: false, faux: false, rest: 0, pauseDur: REVIVE_PAUSE, textFadeT: 0 });
  S.trapWatch = null; S.combo = 0;
  S.releaseAll();
  S.grace = S.GRACE;                                           // l'anneau qui se remplit : le monde reste figé 1 s
  S.popup(L.revived, Lt.cx, Lt.chantY, '#C77DFF', S.fit(L.revived, Lt.chantSize, S.W * 0.85), 1.2);
  S.sparks(24, Lt.cx, Lt.yFeet - Lt.s * 1.2, '#E0AAFF'); Sound.start(); vibrate([20, 30, 40]);
  S.syncTrialTag(); S.refreshUI();
  return true;
}

Object.assign(S, { updateTrapWatch, updateProgress, caught, updateCaught, startRun, reviveRun });
})(window.Soleil);
