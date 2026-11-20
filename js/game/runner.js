/* js/game/runner.js — Le coureur : physique (partagée) et effets */
(function (S) {
'use strict';
const { ACC, DEC, ICE_DEC, MUD_ACC, MUD_SPEED, SLOPE_DEC, SLOPE_SPEED, VMAX0, clamp, Sound, checkMissions,
  blockPatch, patchAt, vmaxAt } = S;   // déjà chargés

/* ---------- 15. Le coureur : vitesse, boue, verglas, descente ---------- */
// Physique pure (sans effet) : la même sert au coureur ET à placer les étoiles, pour que ce soit toujours juste.
function runnerKin(z, v, press, dt) {           // le pas de physique lui-même est dans game/physics.js
  const ground = patchAt(z);
  const vmax = vmaxAt(z) * (ground === 'mud' ? MUD_SPEED : ground === 'slope' ? SLOPE_SPEED : 1);
  const k = S.kinStep(v, press, dt, ground, vmax);
  return { z: z + k.dz, v: k.v, ground, dec: k.dec };
}
function updateRunner(dt) {
  const r = S.runner, pv = r.v;
  const k = runnerKin(r.z, r.v, S.pressing, dt), ground = k.ground;
  r.ground = ground; r.dec = k.dec; r.v = k.v;
  if (pv > 0 && r.v === 0) { r.stopT = S.runT; r.sprintFrom = null; }
  if (pv === 0 && r.v > 0) r.sprintFrom = r.z;
  r.z = k.z;
  if (r.sprintFrom !== null) S.RS.sprint = Math.max(S.RS.sprint, r.z - r.sprintFrom);
  r.phase += r.v * dt * 1.6;
  // plaques traversées (pour les missions)
  const b = Math.floor(r.z / 50);
  if (ground) r.inPatch = b;
  else if (r.inPatch !== null) {
    const p = blockPatch(r.inPatch);
    if (p && r.z > p.z1) { S.RS[p.type]++; checkMissions(); }
    r.inPatch = null;
  }
  const step = Math.floor(r.phase / Math.PI);
  if (step !== r.step) {
    r.step = step;
    if (r.v > 1.5) {
      if (ground === 'mud') { Sound.mud(); S.splash(5); } else { Sound.step(); S.dust(2, 0.8); }
    }
  }
  const sliding = ground === 'ice' && !S.pressing && r.v > 0.6;
  r.slide += ((sliding ? 1 : 0) - r.slide) * Math.min(1, dt * 10);
  if (sliding) { if (!r.iceSnd) { Sound.ice(); r.iceSnd = true; } if (Math.random() < dt * 30) S.iceSpark(); } else r.iceSnd = false;
  if (!S.pressing && r.pressed && pv > 3 && ground !== 'ice') { S.dust(9, 1.8); Sound.skid(); }
  r.pressed = S.pressing;
  if (r.v > VMAX0 + 0.3 && Math.random() < dt * (r.v - VMAX0) * 9) S.speedLine();
  const vm = vmaxAt(r.z), fast = ground === 'slope' ? clamp((r.v - vm) / (vm * (SLOPE_SPEED - 1)), 0, 1) : 0;
  Sound.wind(fast);                                                     // le vent siffle quand on va trop vite
  if (fast > 0.15 && Math.random() < dt * 30 * fast) S.speedLine();
  const w = S.watcher;
  const eyes = w.state === 'look' || w.state === 'peek' || w.state === 'hop' || (w.state === 'turn' && w.turnP > 0.55);
  r.statue += ((eyes && r.v === 0 ? 1 : 0) - r.statue) * Math.min(1, dt * 12);
  r.jx = r.statue > 0.5 ? (Math.random() - 0.5) * 0.022 : 0;            // il tremble…
  if (eyes && r.v === 0 && Math.random() < dt * 3.5) S.sweat();           // …et il transpire
}

Object.assign(S, { runnerKin, updateRunner });
})(window.Soleil);
