/* js/game/collectibles.js — Étoiles flottantes à attraper (risque / récompense) */
(function (S) {
'use strict';
const { BIG_MARGIN, BIG_P, BIG_PTS, CAM_BACK, CLOSE, FIRST_TRAP_CYCLE, STAR_MARGIN, STAR_P, STAR_PTS, STAR_R,
  V_EPS, lerp, vibrate, Sound, Lt, logEvent, addStars, checkMissions, difficulty, runnerKin } = S;   // déjà chargés

// Course à fond jusqu'à « tr », puis on lâche : où et quand s'arrête-t-on, et bouge-t-on encore au bout de T secondes ?
// Même physique que le coureur (runnerKin) : boue, verglas, descente, changement de vitesse de phase.
function simRelease(z0, v0, T, tr) {
  let z = z0, v = v0, t = 0, stop = v0 > 0 || tr > 0 ? null : 0;
  while (t < T - 1e-6) {
    const h = Math.min(1 / 240, T - t), press = t < tr;
    const k = runnerKin(z, v, press, h);
    if (v > 0 && k.v === 0) stop = t + h;              // instant où l'on est vraiment immobile (pour le « OUF »)
    if (k.v > 0) stop = null;
    z = k.z; v = k.v; t += h;
  }
  return { z, v, stop };
}
function latestRelease(z0, v0, T) {                // le dernier moment où l'on peut lâcher et être immobile à temps (null : impossible)
  if (simRelease(z0, v0, T, 0).v > V_EPS) return null;
  let lo = 0, hi = T;
  for (let i = 0; i < 16; i++) { const mid = (lo + hi) / 2; if (simRelease(z0, v0, T, mid).v <= V_EPS) lo = mid; else hi = mid; }
  return lo;
}
function tryStar() {                               // au « 3 » : une étoile tentante, juste devant toi
  const w = S.watcher;
  if (S.mode === 'duo' || S.state !== 'play' || S.star || S.cycleN < 2 || (S.tutorial && S.cycleN <= FIRST_TRAP_CYCLE)) return;
  if (w.R[21] >= STAR_P) return;                   // décidé par le dé du cycle : pareil pour tout le monde
  const ev = w.chant.events;                       // prochain appel (vrai ou piège) : on ne peut pas deviner le piège avec l'étoile
  let call = w.chant.trig;
  for (let i = w.evI; i < ev.length; i++) if (ev[i].kind === 'trap' || ev[i].kind === 'trigger') { call = ev[i].t; break; }
  const left = call - w.t + w.turnDur;             // si c'est le vrai, le soleil aura fini de se retourner dans « left » s
  const z0 = S.runner.z, v0 = S.runner.v, tMax = latestRelease(z0, v0, left);
  if (tMax === null || tMax < 0.3) return;         // il faut le temps de la voir et de décider (réaction humaine)
  const big = w.R[22] < BIG_P;                     // grosse étoile dorée : plus rare, plus près du bord
  const marginT = lerp(STAR_MARGIN[0], STAR_MARGIN[1], difficulty()) * (big ? BIG_MARGIN : 1);
  // au plus loin : il reste au moins « marginT » s pour lâcher entre l'étoile et le dernier moment (jamais impossible)
  const zHi = simRelease(z0, v0, left, Math.max(0, tMax - marginT)).z;
  // au plus près : pour l'attraper, il faut s'arrêter moins de CLOSE s avant son regard (un vrai « OUF »)
  let a = 0, b = tMax;
  for (let i = 0; i < 16; i++) { const mid = (a + b) / 2, st = simRelease(z0, v0, left, mid).stop; if (st === null || st >= left - CLOSE + 0.02) b = mid; else a = mid; }
  const zLo = simRelease(z0, v0, left, b).z + STAR_R;
  if (zLo > zHi && tMax - b < marginT) return;     // terrain trop traître (verglas au bout) : OUF + marge impossibles ensemble
  const z = Math.max(zHi, zLo);
  if (z - z0 < 3) return;                          // trop près : pas d'étoile ce coup-ci
  S.star = { z, big, pts: big ? BIG_PTS : STAR_PTS, cycle: S.cycleN, taken: false, gone: 0, doubled: false,
           left, z0: S.runner.z, v0: S.runner.v };     // (position et temps de départ : servent aussi aux tests)
}
function catchStar() {                             // attrapée en passant dessus (même en glissade)
  const s = S.star;
  s.taken = true; s.gone = 0.001;
  S.RS.catches++; if (s.big) S.RS.big++;
  addStars(s.pts); logEvent('⭐');
  Sound.catchStar(s.big); vibrate(s.big ? [20, 30, 20] : 15);
  S.sparks(s.big ? 26 : 16, Lt.cx, Lt.yFeet - Lt.s * 1.1, s.big ? '#FFD166' : '#FFF6C2');
  S.popup(`+${s.pts} ⭐`, Lt.cx, Lt.yFeet - Lt.s * 2.35, '#FFD166', Math.min(Lt.U * (s.big ? 0.075 : 0.06), 40), 1.0);
  checkMissions();
}
function poofStar() {                              // personne ne l'a prise : petit « pouf »
  const s = S.star, dz = s.z - (S.runner.z - CAM_BACK);
  if (dz > 1.2) {
    const sc = Lt.F / dz, y = S.yAt(dz) - 0.78 * sc;
    S.smokeAt(Lt.cx, y, sc * 0.9, 7, false); S.sparks(8, Lt.cx, y, '#FFF3B0');
  }
  s.gone = 0.001; Sound.poof();
}

Object.assign(S, { simRelease, latestRelease, tryStar, catchStar, poofStar });
})(window.Soleil);
