/* js/game/chant.js — Le chant du soleil : « 1… 2… 3… SOLEIL ! », pièges, hésitations, boss.
   v2.5 : plus de « SO » nulle part. Le mot (vrai ou piège) arrive juste après le « 3… » : c'est lui qui prévient. */
(function (S) {
'use strict';
const { BOSS_LEAD, CLOUD_P, DIFF_SCALE, DUO_D, DUO_FAUX, DUO_TRAPS, DUO_TURN, FIRST_TRAP_CYCLE, OVER_LEN,
  OVER_START, PHASE_LEN, PRESSURE, TURN_MIN, TURN0, UNLOCK, LIE_P, VMAX_CAP, VMAX_STEP, VMAX0, L, MOON_TRAPS, SUN_TRAPS,
  lerp, smooth, vibrate, mulberry32, mixSeed, Sound, SAY, Voice, Lt } = S;   // déjà chargés
// v2.5 — les faux signaux de la course infinie (même réglage que les niveaux : game/match.js)
const LIE_NEED = { recount: 2.0, planeGo: 1.7 };   // après le début du mensonge, il regarde encore au moins ce temps (s)
const PLANE_STOP = [0.2, 0.45];                    // l'avion « SOLEIL ! » : entre 0,2 s après « 1 » et 0,45 s avant le vrai mot

/* ---------- 13. Le chant du soleil : mots pièges, hésitations, boss ---------- */
const effort = () => S.runner.z + PRESSURE * S.runT;
const difficulty = () => 1 - Math.exp(-effort() / DIFF_SCALE);
const overdrive = () => Math.max(0, effort() - OVER_START) / OVER_LEN;
const vmaxAt = z => Math.min(VMAX_CAP, VMAX0 + VMAX_STEP * Math.floor(z / PHASE_LEN));

function makeChant(D, O, moon, z, R, boss, pTrapOver, forceTrap) {
  let ri = 0;
  const r = () => R[ri++ % 16];
  let w = Math.max(0.17, lerp(0.62, 0.32, D) - 0.06 * O) * (moon ? 1.15 : 1);   // durée moyenne d'un mot
  const jit = lerp(0.05, 0.3, D);
  const J = () => 1 + (r() * 2 - 1) * jit;
  // Les dés sont toujours tirés dans le même ordre : le défi du jour reste le même pour tous.
  const dRush = r(), dStut = r(), dStutK = r(), dHes = r(), dHesLen = r(), dT1 = r(), dT2 = r(), dW1 = r(), dW2 = r();
  let rush = z >= UNLOCK.rush && dRush < 0.25 * smooth(0.28, 0.75, D);
  let stutter = z >= UNLOCK.stutter && dStut < 0.3 * smooth(0.18, 0.6, D);
  let hes = dHes < 0.4 * smooth(0.08, 0.5, D);
  const pTrap = pTrapOver != null ? pTrapOver : z >= UNLOCK.traps ? lerp(0.3, 0.45, smooth(0.2, 0.7, D)) : 0;
  let traps = dT1 < pTrap ? (dT2 < 0.35 ? 2 : 1) : 0;
  if (boss) {                                                 // les boss ont leurs propres coups
    const k = (boss - 1) % 4;
    if (k === 0) { traps = 2; hes = true; }                   // Midi : double piège + longue hésitation
    else if (k === 1) { rush = true; }                        // Soir : chant express (+ faux dos forcé)
    else if (k === 2) { traps = 2; }                          // Nuit : la Lune enchaîne les pièges
    else { traps = 1; stutter = true; rush = true; }          // Aube : tout à la fois (+ faux dos forcé)
  }
  if (forceTrap && !boss) traps = 1;                          // 3e cycle : exactement un mot piège, même avant UNLOCK.traps
  if (rush) w *= 0.5;
  const list = moon ? MOON_TRAPS : SUN_TRAPS;
  const i1 = Math.floor(dW1 * list.length);
  let i2 = Math.floor(dW2 * list.length); if (i2 === i1) i2 = (i2 + 1) % list.length;
  const words = [list[i1], list[i2]];
  const ev = [];
  let t = 0;
  const seq = [0, 1, 2];
  if (stutter) { const k = dStutK < 0.5 ? 0 : 1; seq.splice(k + 1, 0, k); }      // « 2… 2… 3… »
  seq.forEach(n => { ev.push({ t, text: String(n + 1), kind: 'num', n }); t += w * J(); });
  for (let i = 0; ; i++) {
    const last = i >= traps;
    // L'ancien « SO » avait son dé : il est toujours tiré, pour que le reste du chant (rires, « 3 ») ne bouge pas.
    if (!moon && !(hes && last)) J();
    if (hes && last) { ev[ev.length - 1].hes = true; t += lerp(0.55, 1.45, dHesLen); }   // l'hésitation : le « 3… » qui dure
    if (last) { ev.push({ t, text: moon ? S.chantW().moon : S.chantW().sun, kind: 'trigger' }); break; }
    ev.push({ t, text: words[i], kind: 'trap' });             // « SOLDES ! » : il ne se retourne pas…
    t += lerp(0.5, 0.75, r());                                // …il rigole…
    ev.push({ t, text: '3', kind: 'num', n: 2 });             // …et reprend à « 3 »
    t += w * J();
  }
  return { events: ev, trig: t };                             // il se retourne pile sur la dernière syllabe
}

function startChant() {
  const w = S.watcher, isDuo = S.mode === 'duo';
  const D = isDuo ? DUO_D : difficulty(), O = isDuo ? 0 : overdrive(), moon = w.type === 'moon', z = isDuo ? Infinity : S.runner.z;
  S.cycleN++;
  w.R = Array.from({ length: 24 }, () => S.rng());               // 24 dés par cycle, toujours
  w.boss = !isDuo && S.bossQueue.length ? S.bossQueue.shift() : 0;
  w.chant = makeChant(D, O, moon, z, w.R, w.boss, isDuo ? DUO_TRAPS : null, S.cycleN === FIRST_TRAP_CYCLE);
  if (w.boss) {                                               // le boss parle d'abord, puis chante (même délai pour tous)
    for (const e of w.chant.events) e.t += BOSS_LEAD;
    w.chant.trig += BOSS_LEAD;
  }
  w.evI = 0; w.state = 'chant'; w.t = 0; w.angry = false; w.second = false; w.spotted = false; w.trapsThisChant = 0;
  w.vI = w.preSaid ? 1 : 0; w.preSaid = false; w.hopSaid = false; w.starTried = false;   // « Un… » déjà dit en avance ?
  w.cloud = !isDuo && !w.boss && z >= UNLOCK.cloud && w.R[23] < CLOUD_P;   // dé du cycle : même nuage pour tout le monde
  w.cloudDir = S.cycleN % 2 ? 1 : -1;
  w.turnDur = isDuo ? DUO_TURN : Math.max(0.14, lerp(TURN0, TURN_MIN, D) - 0.05 * O) * (moon ? 1.3 : 1);
  w.lookDur = lerp(1.0, 0.7, D) + w.R[16] * lerp(0.9, 2.2, D);
  const pFaux = isDuo ? DUO_FAUX : z >= UNLOCK.fauxDos ? lerp(0.2, 0.35, smooth(0.35, 0.8, D)) : 0;
  w.faux = w.R[17] < pFaux || (w.boss && (w.boss - 1) % 4 % 2 === 1);   // boss du Soir et de l'Aube : faux dos garanti
  w.peekDur = 0.55 + w.R[18] * 0.6; w.peekPlan = w.peekDur; w.spotAt = 0;
  if (S.tutorial && S.cycleN === 1) w.turnDur = 1.0;              // toute première partie : on laisse le temps de comprendre
  // v2.5 — le recomptage et l'avion menteur, avec leur PROPRE flux de dés (les 24 dés d'avant ne changent pas :
  // le même défi du jour pour tout le monde). Jamais à deux, pendant un boss ou derrière un nuage.
  const N = mulberry32(mixSeed(S.runSeed || 1, 7000 + S.cycleN)), nd = [N(), N(), N(), N(), N()];
  w.lie = null; w.planeAt = -1;
  if (!isDuo && !w.boss && !w.cloud) {
    const pR = z >= UNLOCK.recount ? lerp(LIE_P.recount[0], LIE_P.recount[1], smooth(0.1, 0.7, D)) : 0;
    const pP = z >= UNLOCK.plane ? lerp(LIE_P.plane[0], LIE_P.plane[1], smooth(0.2, 0.8, D)) : 0;
    if (nd[0] < pR) w.lie = { type: 'recount', at: 0.3 + 0.4 * nd[1], n: -1, fired: false };
    else if (nd[2] < pP && nd[3] < 0.5) w.lie = { type: 'planeGo', at: 0.25 + 0.45 * nd[4], fired: false };
    else if (nd[2] < pP) {                                         // « SOLEIL ! » sur la banderole, pendant le chant
      const e0 = w.chant.events[0].t + PLANE_STOP[0];
      w.planeAt = e0 + Math.max(0, w.chant.trig - PLANE_STOP[1] - e0) * nd[4];
    }
    if (w.lie) w.lookDur = Math.max(w.lookDur, w.lie.at + LIE_NEED[w.lie.type]);
  }
  if (w.boss) {
    S.bossBanner = { t: 0, moon }; S.phaseTitle = null;
    Sound.boss(); vibrate(30);
    Voice.quip(moon ? SAY.bossMoon : SAY.bossSun, moon);   // « Tu vas fondre… »
  }
}

function chantEvent(ev) {
  const w = S.watcher;
  w.text = ev.text; w.textKind = ev.kind; w.textT = S.gtime; w.bump = 1; w.revealed = false;
  Sound.chant(ev, w.type === 'moon');
  if (ev.kind === 'trap') { w.trapsThisChant++; if (S.mode !== 'duo') S.trapWatch = { t: S.runT, moving: S.runner.v > 2, stopped: false }; }
  if (S.tutorial && S.cycleN === 1 && ev.kind === 'trigger') S.popup(L.letGo, Lt.cx, Lt.yFeet - Lt.s * 1.9, '#FFD166', Math.min(Lt.U * 0.08, 42), 1.3);
  if (ev.kind === 'num' && w.trapsThisChant > 0 && S.star && !S.star.taken && !S.star.gone) S.poofStar();   // c'était un piège : trop tard
  if (ev.kind === 'num' && ev.n === 2 && !w.starTried) { w.starTried = true; S.tryStar(); }   // au « 3 » : une étoile ?
}

/* ---------- 13 bis. Le chant d'un niveau (mode Niveaux) ----------
   Mêmes événements que makeChant (num, trap, trigger), mais réglés par les données du niveau.
   c = réglages du cycle déjà tirés par le moteur (game/match.js, cycleConfig) :
     word (durée d'un mot, s), jitter (variation ±), soK (durée de l'ancien « SO » : son dé est encore tiré), traps (0, 1 ou 2),
     hesAt (devant quel mot le « 3… » hésite, -1 = aucun), hesLen (durée de ce « 3… » qui dure, s),
     stutter (bégaiement « 2… 2… 3… »), stutterAt (0 ou 1), stutterRush (après le bégaiement, il accélère : × durée),
     express (tout deux fois plus vite), expressK (× durée), words (mots pièges), laugh (s), rnd (générateur du cycle). */
function buildChant(c) {
  const w = c.word * (c.express ? c.expressK : 1);
  const J = () => 1 + (c.rnd() * 2 - 1) * c.jitter;
  const ev = [];
  let t = 0, rush = 1;
  const seq = [0, 1, 2];
  if (c.stutter) seq.splice(c.stutterAt + 1, 0, c.stutterAt);       // « 1… 2… 2… 3… »
  seq.forEach((n, i) => {
    if (c.stutter && i === c.stutterAt + 1) rush = c.stutterRush;     // le mot répété, puis tout le reste, va plus vite
    ev.push({ t, text: String(n + 1), kind: 'num', n });
    t += w * J() * rush;
  });
  for (let i = 0; ; i++) {
    const last = i >= c.traps;
    const hes = i === c.hesAt;                                       // le « 3… » qui dure (l'ancien « SOOOO… »)
    if (hes) { ev[ev.length - 1].hes = true; t += c.hesLen; } else J();   // le dé de l'ancien « SO » est toujours tiré
    if (last) { ev.push({ t, text: S.chantW().sun, kind: 'trigger' }); break; }
    ev.push({ t, text: c.words[i], kind: 'trap' });                  // « SOUPE ! » : il ne se retourne pas…
    t += c.laugh;                                                    // …il rigole…
    ev.push({ t, text: '3', kind: 'num', n: 2 });                    // …et reprend à « 3 »
    t += w * J() * rush;
  }
  return { events: ev, trig: t };                                    // il se retourne pile sur la dernière syllabe
}

Object.assign(S, { effort, difficulty, overdrive, vmaxAt, makeChant, startChant, chantEvent, buildChant });
})(window.Soleil);
