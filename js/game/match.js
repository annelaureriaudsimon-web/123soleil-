/* js/game/match.js — Le moteur d'un niveau, sans aucun affichage : soleil, joueur, rivaux, ligne d'arrivée.
   Le navigateur (modes/levels.js) et la simulation (tools/simulate.js) font tourner exactement ce code.
   Chaque essai a sa graine : la disposition du niveau ne change pas, mais le rythme du chant varie un peu.
   Le moteur ne dessine rien et ne joue aucun son : il range des événements dans m.out (mots, OUF, rival grillé…). */
(function (S) {
'use strict';
const { V_EPS, CLOSE, RET_DUR, HOP_DUR, PEEK_P, MUD_SPEED, VMAX0, DEC, SUN_TRAPS, PROFILES,
  mulberry32, mixSeed, kinStep, stopTime, buildChant, newBrain, brainSee, brainTick, brainReset } = S;

// ---------- Réglages ----------
const FIRST_PAUSE = 1.2;       // secondes avant le tout premier chant (le temps de démarrer)
const LAUGH = [0.5, 0.75];     // il rigole après un mot piège, puis reprend à « 3 » (s)
const TRAP_WIN = 0.6;          // s'être arrêté (depuis le « 3 ») jusqu'à 0,6 s après un mot piège = « tombé dans le piège »
const RIVAL_RESPAWN = 1.5;     // rival grillé : durée de son animation avant le retour au départ (s)
const LANES = [-1.0, 1.0, -1.7, 1.7, -2.4, 2.4];          // couloirs des rivaux à gauche / à droite du joueur (m)
const QUICK = 0.35;            // « départ éclair » : repartir moins de 0,35 s après le vrai « ding »
const FAKE_RET = { turn: 0.22, hold: 0.25, snap: 0.08, to: 0.45 };   // faux retour : il tourne à moitié… « HA ! »
// Tentations (monde 2) : quand elles arrivent dans le regard (s), et la durée minimale du regard qui les contient.
// group : deux tentations du même groupe ne vont jamais ensemble (elles se liraient au même endroit de l'écran).
const TEMPT = {
  star:    { at: 0.1, need: 1.6, group: 'runner' },   // étoile dorée devant toi
  fakeRet: { at: 0.5, jit: 0.3, need: 1.25, group: 'face' },   // faux retour (need = après le « HA ! »)
  sneeze:  { at: 0.2, need: 2.2, group: ['face', 'voice'], shut: [1.1, 1.6] },   // « Aaah… AAAH… ATCHOUM ! » (il parle)
  taunt:   { at: 0.25, need: 1.7, group: 'voice' },  // moquerie dans une bulle
  fly:     { at: 0.1, need: 2.0, group: 'runner' },  // la mouche
  crack:   { at: 0.5, jit: 0.3, need: 1.5, group: 'rival' },  // un rival craque (BOUM)
  // v2.5 — les faux signaux (« il parle en te regardant, donc il ment » ; « seul le soleil compte »)
  recount: { at: 0.35, jit: 0.35, need: 2.0, group: ['voice', 'chant'] },   // il recompte « 1… 2… » EN TE REGARDANT
  planeGo: { at: 0.25, jit: 0.45, need: 1.7, group: 'sky' },                // un avion passe : banderole « ALLEZ-Y ! »
  alarm:   { at: 0.3, jit: 0.4, need: 1.7, group: ['rival', 'voice'] },     // un rival crie « IL REGARDE PAS ! VAS-Y ! » (c'est faux)
  herd:    { at: 0.45, jit: 0.35, need: 1.6, group: 'rival' }              // trois rivaux repartent ensemble… et sont grillés
};
const TEMPT_ORDER = ['star', 'fakeRet', 'sneeze', 'taunt', 'fly', 'crack'];   // ordre fixe des dés (ne pas changer)
// v2.5 : les nouveautés ont leur PROPRE flux de dés (mixSeed(graine, 7000 + cycle)) : les niveaux d'avant ne bougent pas.
// Ordre fixe (ne pas changer) : f[0..3] = présence, f[4..7] = moment ; alarm et herd arrivent avec les rivaux (partie D).
const TEMPT_V25 = ['recount', 'planeGo', 'alarm', 'herd'];
const RECOUNT = { gap: 0.55, laugh: 1.15 };   // le recomptage : « 1… », « 2… » 0,55 s plus tard, puis il se marre (s)
// La fausse alerte et le troupeau : des rivaux que tu VOIS (de 3,5 m derrière toi, encore à l'écran, jusqu'à 30 ou 45 m devant)
const ALARM_RANGE = [-3.5, 30];               // le rival qui crie « IL REGARDE PAS ! VAS-Y ! » (personne à portée : pas d'alerte)
const HERD_N = 3, HERD_RANGE = [-3.5, 45];    // le troupeau : 3 rivaux (sinon pas de troupeau dans ce regard)
const PLANE_STOP = [0.2, 0.45];               // l'avion « SOLEIL ! » du chant passe entre 0,2 s après « 1 » et 0,45 s avant le vrai mot
const CRACK_RANGE = [-1, 30];  // rival qui craque : entre 1 m derrière toi et 30 m devant
// Niveau « en douceur » (champ « soft » d'un niveau, le niveau 1) : vu en train de bouger, tu n'es pas grillé,
// tu recules de soft.back mètres (« OUPS ! ») en KNOCK s, puis il faut lâcher avant de repartir.
const KNOCK = 0.5;
// v2.5 — la pression (la prudence coûte cher) :
//   night  : le coucher du soleil. Au bout de « night » s, le soleil touche l'horizon : « LA NUIT TOMBE ! », perdu.
//   chairs : les transats. Il y en a un de moins que d'enfants : quand le dernier est pris par un rival, perdu.
//   scoops : la glace. On part avec « scoops » boules, une fond toutes les « melt » s ; ce qui reste à l'arrivée = étoiles.
// 2e chance (pub) dans un niveau avec la nuit : le soleil remonte et ne se couche plus pendant cet essai (m.sunUp).
// v2.5.1 : « +10 s de jour » ne suffisait pas : le soleil continuait de descendre et la nuit retombait aussitôt.
const NIGHT_WARN = 5;          // les 5 dernières secondes : la barre clignote, « Vite, la nuit tombe ! »

// Réglages du soleil par défaut (chaque niveau peut les changer dans levels/*.js, champ « sun »)
const SUN_BASE = {
  word: [0.55, 0.65],          // durée d'un chiffre « 1… 2… 3… » (s), tirée à chaque cycle entre ces deux valeurs
  jitter: 0.08,                // petite variation de chaque mot (±8 %)
  soK: 0.6,                    // l'ancien « SO » (v2.4) : son dé est encore tiré, rien ne s'affiche
  turn: [0.70, 0.76],          // demi-tour après « SOLEIL ! » : TOUT le temps qu'on a pour lire, réagir et freiner (s) — v2.5 : +0,08 (plus de « SO »)
  look: [1.2, 1.9],            // durée de son regard (s)
  pause: [0.5, 1.0],           // pause avant de rechanter (s)
  traps: 0, double: 0,         // probabilité d'un mot piège dans un chant, puis d'un deuxième
  hesitate: 0,                 // probabilité d'une hésitation : le « 3… » qui dure avant le mot
  hesLen: [0.9, 1.5],          // durée de l'hésitation : le « 3… » qui dure (s)
  hesOnTrap: 0.4,              // probabilité que l'hésitation tombe sur un mot piège (et pas sur SOLEIL)
  stutter: 0,                  // probabilité d'un bégaiement « 2… 2… 3… »
  stutterRush: 0.65,           // après le bégaiement, il accélère (× durée des mots)
  express: 0,                  // probabilité d'un chant express
  expressK: 0.5,               // chant express : tout va deux fois plus vite (× durée)…
  expressTurn: 0.9,            // …et il se retourne un peu plus vite (× demi-tour)
  words: null,                 // mots pièges du niveau : numéros dans L.chant.traps (null = toute la liste)
  // Monde 2
  tempt: null,                 // tentations : { star: 0.5, fakeRet: 0.3, …, max: 2 } (probabilité par regard)
                               // v2.5 : aussi recount (il recompte en te regardant) et planeGo (l'avion « ALLEZ-Y ! »)
  fakeBack: 0,                 // probabilité d'un faux dos à la fin du regard
  peek: [0.5, 1.1],            // faux dos : durée de l'œil qui dépasse (s)
  look2: [0.6, 1.0],           // faux dos : durée du second regard après « HOP ! » (s)
  // v2.5 (probabilités par chant)
  planeStop: 0,                // un avion passe PENDANT LE CHANT avec une banderole « SOLEIL ! » (faux arrêt : on perd du temps)
  cloud: 0                     // un nuage cache le soleil ; son reflet dans l'eau montre s'il regarde
};

// Un niveau des fichiers levels/*.js, complété avec les valeurs par défaut
function normalize(def) {
  const L = Object.assign({ speed: 1, rivals: [], script: {}, hints: [], mechanics: [], mud: [], firstPause: FIRST_PAUSE, boss: false,
    night: 0, chairs: 0, scoops: 0, melt: 0 }, def);
  L.sun = Object.assign({}, SUN_BASE, def.sun || {});
  return L;
}

function newBody(id, lane, vmax) {
  return { id, z: 0, v: 0, dec: DEC, press: false, stopT: -9, phase: 0, lane, vmax, state: 'race', finishT: 0 };
}

// Crée un essai. attempt : numéro de l'essai (change le rythme). opts.newSun : fabrique l'objet soleil (navigateur) ;
// opts.playerBrain : un profil (« expert »…) pour que le joueur soit piloté par un cerveau (simulation) ;
// opts.brainSeen : les tentations que ce joueur connaît déjà (vues dans les niveaux précédents du monde).
function create(def, attempt, opts = {}) {
  const L = normalize(def);
  const seed = mixSeed(L.seed, attempt);
  const sun = Object.assign(opts.newSun ? opts.newSun() : {}, {
    state: 'pause', t: 0, pauseDur: L.firstPause, turnP: 0, text: '', textKind: '', textAt: 0, chant: null, evI: 0,
    turnDur: 0.65, lookDur: 1.5, boss: 0, type: 'sun', second: false, faux: false, retTo: 0, cloud: false,
    trapsThisChant: 0, revealed: true, R: []
  });
  const m = {
    level: L, attempt, seed, t: 0, cycle: 0, cc: null, out: [], result: null, started: false, soSeen: false, trapTrack: null,
    sun, player: newBody('you', 0, VMAX0 * L.speed),
    rivals: L.rivals.map((rd, i) => {
      const brain = newBrain(rd.kind, mulberry32(mixSeed(seed, 100 + i)), rd.brain);
      const lane = rd.lane != null ? rd.lane : LANES[i % LANES.length];
      return Object.assign(newBody(rd.id || 'r' + i, lane, VMAX0 * L.speed * brain.p.speed),
        { idx: i, def: rd, kind: rd.kind, name: rd.name, brain, resp: 0, burnT: 9, grills: 0, anim: '', forced: false },
        rd.z0 ? { z: rd.z0 } : {});      // v2.5 : z0 = il part devant (m) ; grillé, il repart quand même du début
    }),
    finishers: [],
    stats: { oufs: 0, combo: 0, comboMax: 0, trapsFell: 0, trapsAvoided: 0, looks: 0, cycles: 0, resisted: 0, quick: 0, oops: 0 },
    look: null, quickT: -1,         // tentations du regard en cours ; instant du dernier vrai « ding »
    night: L.night || 0, warned: false, scoops: L.scoops || 0   // v2.5 : la nuit (s), la glace (boules qui restent)
  };
  if (opts.playerBrain) m.player.brain = newBrain(opts.playerBrain, mulberry32(mixSeed(seed, 999)), opts.brainOver, opts.brainSeen);
  m.cc = cycleConfig(m, 1);
  sun.pauseDur = m.cc.pause;
  return m;
}

// Les réglages d'un cycle, tirés avec la graine de l'essai (16 dés, toujours dans le même ordre),
// puis remplacés par les événements prévus du niveau (script : « mot piège forcé au cycle 2 »…)
function cycleConfig(m, n) {
  const L = m.level, P = L.sun, sc = L.script[n] || {};
  const rnd = mulberry32(mixSeed(m.seed, 1000 + n));
  const d = Array.from({ length: 16 }, () => rnd());
  const pick = (a, x) => a[0] + (a[1] - a[0]) * x;
  const c = {
    n, rnd, word: pick(P.word, d[0]), jitter: P.jitter, soK: P.soK, turn: pick(P.turn, d[1]), look: pick(P.look, d[2]),
    pause: pick(P.pause, d[3]), traps: d[4] < P.traps ? (d[5] < P.double ? 2 : 1) : 0,
    hes: d[6] < P.hesitate, hesLen: pick(P.hesLen, d[7]),
    stutter: d[8] < P.stutter, stutterAt: d[9] < 0.5 ? 0 : 1, stutterRush: P.stutterRush,
    express: d[10] < P.express, expressK: P.expressK, laugh: pick(LAUGH, d[11]), words: [], move: sc.move || null
  };
  if (sc.traps != null) c.traps = sc.traps;
  if (sc.hes != null) { c.hes = !!sc.hes; if (typeof sc.hes === 'number') c.hesLen = sc.hes; }
  if (sc.stutter != null) c.stutter = !!sc.stutter;
  if (sc.express != null) c.express = !!sc.express;
  ['turn', 'look', 'pause', 'word'].forEach(k => { if (sc[k] != null) c[k] = sc[k]; });
  if (n === 1 && sc.pause == null) c.pause = L.firstPause;
  if (c.express && sc.turn == null) c.turn *= P.expressTurn;
  c.hesAt = !c.hes ? -1 : c.traps && d[12] < P.hesOnTrap ? Math.min(c.traps - 1, Math.floor(d[13] * c.traps)) : c.traps;
  if (c.hes && sc.hesAt != null) c.hesAt = Math.min(sc.hesAt, c.traps);
  const list = P.words ? P.words.map(i => SUN_TRAPS[i]) : SUN_TRAPS;   // words : des numéros dans la liste de la langue
  const i1 = Math.floor(d[14] * list.length);
  let i2 = Math.floor(d[15] * list.length); if (i2 === i1) i2 = (i2 + 1) % list.length;
  c.words = [list[i1], list[i2]];
  const r3 = mulberry32(mixSeed(m.seed, 7000 + n)), f = Array.from({ length: 16 }, () => r3());   // v2.5 : 3e flux de dés
  liesConfig(m, c, sc, f);
  lookConfig(m, c, sc, f);
  return c;
}

// Monde 2 : tentations et faux dos du cycle, avec un SECOND flux de dés (le monde 1 ne change donc pas du tout).
// v2.5 : les nouvelles tentations (recount, planeGo…) tirent leurs dés dans le 3e flux (f), après les anciennes.
function lookConfig(m, c, sc, f) {
  const P = m.level.sun, r = mulberry32(mixSeed(m.seed, 5000 + c.n));
  const e = Array.from({ length: 24 }, () => r());
  const pick = (a, x) => a[0] + (a[1] - a[0]) * x;
  c.fakeBack = sc.fakeBack != null ? !!sc.fakeBack : e[0] < P.fakeBack;
  c.peek = pick(P.peek, e[1]); c.look2 = pick(P.look2, e[2]);
  let list = [];
  if (sc.tempt) list = sc.tempt.slice();
  else if (P.tempt) {
    TEMPT_ORDER.forEach((k, i) => { if (e[3 + i] < (P.tempt[k] || 0)) list.push(k); });
    TEMPT_V25.forEach((k, i) => { if (TEMPT[k] && f[i] < (P.tempt[k] || 0)) list.push(k); });
  }
  if (c.planeStop || c.cloud) list = list.filter(k => k !== 'planeGo');   // un seul avion par cycle, jamais derrière le nuage
  const max = sc.tempt ? 3 : (P.tempt && P.tempt.max) || 1, groups = new Set();
  let count = 0;
  list = list.filter(k => {                        // lisible : au plus « max », jamais deux au même endroit de l'écran
    const gs = [].concat(TEMPT[k].group);
    if (count >= max || gs.some(g => groups.has(g))) return false;
    gs.forEach(g => groups.add(g)); count++; return true;
  });
  c.tempt = list.map((k, i) => {
    const v = TEMPT_V25.indexOf(k);                // anciennes tentations : mêmes dés qu'avant ; nouvelles : 3e flux
    return { type: k, at: TEMPT[k].at + (TEMPT[k].jit || 0) * (v < 0 ? e[9 + i] : f[4 + v]) };
  });
}

// v2.5 : ce qui se passe pendant le chant (l'avion « SOLEIL ! ») et le nuage du cycle (3e flux de dés, f[8..10])
function liesConfig(m, c, sc, f) {
  const P = m.level.sun;
  c.cloud = sc.cloud != null ? !!sc.cloud : f[10] < P.cloud;
  c.planeStop = !c.cloud && (sc.planeStop != null ? !!sc.planeStop : f[8] < P.planeStop);
  c.planeU = f[9];                                 // où, dans le chant, passe l'avion (0 = tôt, 1 = juste avant le mot)
}

function emit(m, type, data) { if (m.out) m.out.push(Object.assign({ type, t: m.t }, data)); }
function feed(m, type, data) {                    // tous les cerveaux voient le même mot au même instant
  if (m.player.brain) brainSee(m.player.brain, type, m.t, data);
  for (const r of m.rivals) if (r.state === 'race') brainSee(r.brain, type, m.t, data);
}
const soLong = m => m.sun.state === 'chant' && m.sun.textKind === 'num' && m.sun.text === '3';   // le « 3… » est encore affiché
const safeToRun = m => m.sun.state === 'pause' || m.sun.state === 'return' || (m.sun.state === 'chant' && !m.soSeen);

const mudAt = (L, z) => { for (const p of L.mud) if (z >= p[0] && z < p[1]) return true; return false; };
function move(m, r, press, dt) {
  const mud = m.level.mud.length > 0 && mudAt(m.level, r.z);     // flaques posées à la main (monde 2)
  const pv = r.v, k = kinStep(r.v, press, dt, mud ? 'mud' : '', mud ? r.vmax * MUD_SPEED : r.vmax);
  r.mud = mud;
  r.v = k.v; r.dec = k.dec; r.z += k.dz; r.phase += r.v * dt * 1.6; r.press = press;
  if (pv > 0 && r.v === 0) r.stopT = m.t;
}

// Un pas de jeu. input : le joueur maintient-il ? (ignoré si un cerveau pilote le joueur)
function step(m, dt, input) {
  if (m.result) return;
  if (!m.started) { m.started = true; feed(m, 'start'); }
  m.t += dt;
  const pl = m.player;
  const press = pl.brain ? brainTick(pl.brain, m.t, soLong(m)) : !!input;
  if (pl.knock) knockStep(pl, dt);                 // niveau en douceur : il recule après un « OUPS ! »
  else move(m, pl, unlocked(pl, press), dt);
  if (pl.z >= m.level.length) { win(m); return; }   // ligne franchie : gagné, même s'il finit de se retourner
  if (m.night && !m.sunUp) {                       // le coucher du soleil (plus après une 2e chance)
    if (m.t >= m.night) { lose(m, 'night', 0); return; }
    if (!m.warned && m.night - m.t <= NIGHT_WARN) { m.warned = true; emit(m, 'nightWarn'); }
  }
  if (m.level.scoops && m.level.melt) {            // la glace fond : une boule toutes les « melt » secondes
    const left = Math.max(0, m.level.scoops - Math.floor(m.t / m.level.melt));
    if (left < m.scoops) { m.scoops = left; emit(m, 'melt', { left }); }
  }
  if (m.quickT >= 0 && pl.press) {                 // départ éclair : reparti juste après le vrai « ding »
    if (m.t - m.quickT <= QUICK) { m.stats.quick++; emit(m, 'quick', { n: m.stats.quick }); }
    m.quickT = -1;
  }
  trackTrap(m);
  for (const r of m.rivals) stepRival(m, r, dt);
  stepSun(m, dt);
}

// Niveau en douceur : après un « OUPS ! », il faut d'abord lâcher pour repartir
function unlocked(pl, press) {
  if (pl.lock) { if (!press) pl.lock = false; return false; }
  return press;
}
function knockStep(pl, dt) {                       // le recul : rapide au début, puis il s'arrête (immobile pour le soleil)
  const k = pl.knock;
  k.t += dt;
  const u = Math.min(1, k.t / KNOCK);
  pl.z = k.from + (k.to - k.from) * (1 - (1 - u) * (1 - u));
  pl.v = 0; pl.phase -= dt * 9;
  if (u >= 1) pl.knock = null;
}
// Le soleil te voit bouger : grillé… sauf dans un niveau en douceur (« OUPS ! », tu recules et tu continues)
function seen(m, why, val) {
  if (!m.level.soft) { lose(m, why, val); return; }
  const pl = m.player, back = m.level.soft.back || 6;
  m.stats.oops++; m.stats.combo = 0;
  pl.knock = { from: pl.z, to: Math.max(0, pl.z - back), t: 0 };
  pl.v = 0; pl.press = false; pl.stopT = m.t; pl.lock = true;
  if (pl.brain) brainReset(pl.brain, m.t, safeToRun(m));   // simulation : le cerveau repart quand c'est sûr
  emit(m, 'oops', { why, val, back: pl.knock.from - pl.knock.to });
}

function stepRival(m, r, dt) {
  if (r.state === 'done') { r.v = Math.max(0, r.v - DEC * 0.35 * dt); r.z += r.v * dt; r.phase += r.v * dt * 1.6; return; }
  if (r.state === 'grilled') {
    r.burnT += dt; r.v = 0;
    if ((r.resp -= dt) <= 0) {                     // pouf ! retour au départ du niveau
      Object.assign(r, { state: 'race', z: 0, v: 0, phase: 0, stopT: m.t, press: false });
      brainReset(r.brain, m.t, safeToRun(m));
      emit(m, 'rivalBack', { r });
    }
    return;
  }
  move(m, r, r.forced || brainTick(r.brain, m.t, soLong(m)), dt);
  if (r.z >= m.level.length) {
    r.state = 'done'; r.finishT = m.t; m.finishers.push(r);
    emit(m, 'rivalFinish', { r, place: m.finishers.length });
    if (m.level.chairs && !m.result && m.finishers.length >= m.level.chairs) lose(m, 'chairs', 0);   // plus de transat libre
  }
}

function stepSun(m, dt) {
  const w = m.sun;
  w.t += dt;
  switch (w.state) {
    case 'pause':
      if (w.t >= w.pauseDur) startChant(m);
      break;
    case 'chant': {
      const ev = w.chant.events;
      while (w.evI < ev.length && ev[w.evI].t <= w.t) chantWord(m, ev[w.evI++]);
      if (w.textKind === 'trap' && !w.revealed && m.t - w.textAt > 0.2) { w.revealed = true; emit(m, 'reveal'); }   // il se marre
      if (w.plane && !w.plane.fired && w.t >= w.plane.at) {   // v2.5 : l'avion « SOLEIL ! » (ce n'est pas lui qui parle)
        w.plane.fired = true; emit(m, 'plane', { kind: 'stop' }); feed(m, 'planeStop');
      }
      if (w.t >= w.chant.trig) { w.state = 'turn'; w.t = 0; w.turnP = 0; emit(m, 'turn', { dur: w.turnDur }); }
      break;
    }
    case 'turn':
      w.turnP = Math.min(1, w.t / w.turnDur);
      if (w.t >= w.turnDur) { w.turnP = 1; w.state = 'look'; w.t = 0; lookStart(m); }
      break;
    case 'look':
      if (m.look && !w.second) lookTimeline(m);
      if (m.player.v > V_EPS) { seen(m, w.second ? 'hop' : 'early', w.lookDur - w.t); return; }   // reparti trop tôt
      for (const r of m.rivals) if (r.state === 'race' && r.v > V_EPS) grillRival(m, r, 'early');
      if (w.t >= w.lookDur) {
        w.turnP = 1; w.shut = 0;
        if (m.cc.fakeBack && !w.second) {          // faux dos : il se met presque de dos… sans le « ding »
          w.state = 'return'; w.t = 0; w.retTo = PEEK_P; emit(m, 'fakeBack'); feed(m, 'fakeBack');
        } else trueReturn(m);
      }
      break;
    case 'peek':                                   // un œil dépasse… si quelqu'un bouge, il le voit tout de suite
      if (!w.spotted && (m.player.v > V_EPS || m.rivals.some(r => r.state === 'race' && r.v > V_EPS))) { w.spotted = true; w.peekDur = Math.min(w.peekDur, w.t + 0.1); }
      if (w.t >= w.peekDur) { w.state = 'hop'; w.t = 0; emit(m, 'hop'); }
      break;
    case 'hop':                                    // « HOP ! » il se retourne d'un coup
      w.turnP = PEEK_P + (1 - PEEK_P) * Math.min(1, w.t / HOP_DUR);
      if (w.t >= HOP_DUR) {
        w.turnP = 1; w.state = 'look'; w.t = 0; w.second = true; w.lookDur = m.cc.look2;
        for (const r of m.rivals) if (r.state === 'race' && r.v > V_EPS) grillRival(m, r, 'hop');
        if (m.player.v > V_EPS) { seen(m, 'hop', w.lookDur); return; }
        emit(m, 'look2');
      }
      break;
    case 'return':
      w.turnP = (w.retTo || 0) + (1 - (w.retTo || 0)) * Math.max(0, 1 - w.t / RET_DUR);
      if (w.t >= RET_DUR && w.retTo > 0) { w.turnP = w.retTo; w.state = 'peek'; w.t = 0; w.peekDur = m.cc.peek; w.spotted = false; emit(m, 'peek'); break; }
      if (w.t >= RET_DUR) {
        w.turnP = 0; w.state = 'pause'; w.t = 0; w.text = ''; w.textKind = ''; w.second = false; w.retTo = 0;
        m.cc = cycleConfig(m, m.cycle + 1);
        w.pauseDur = m.cc.pause;
      }
      break;
  }
}

// Le vrai retour : le « ding » (son, visage parti, rayons qui tournent, anneau vert). Les tentations comptent comme résistées.
function trueReturn(m) {
  const w = m.sun;
  w.state = 'return'; w.t = 0; w.retTo = 0;
  const res = m.look ? m.look.items.filter(it => it.fired && !it.skip).map(it => it.type) : [];
  m.stats.resisted += res.length;
  m.look = null; m.quickT = m.t;
  emit(m, 'return'); emit(m, 'clear', { resisted: res });
  feed(m, 'return');
}

// Les tentations du regard, au bon moment (m.look préparé par lookStart)
function lookTimeline(m) {
  const w = m.sun, lk = m.look;
  for (const it of lk.items) {
    if (!it.fired && w.t >= it.at) {
      it.fired = true;
      if (it.type === 'crack') {                   // le rival le plus proche craque
        const near = nearest(m, CRACK_RANGE)[0];
        if (!near) { it.skip = true; continue; }
        near.forced = true; near.cracked = true; it.r = near;
      }
      if (it.type === 'alarm') {                   // v2.5 : le rival le plus proche crie (il ne bouge pas : c'est une blague)
        const near = nearest(m, ALARM_RANGE)[0];
        if (!near) { it.skip = true; continue; }
        it.r = near;
      }
      if (it.type === 'herd') {                    // v2.5 : trois rivaux repartent ensemble (il faut 3 rivaux en course)
        const herd = nearest(m, HERD_RANGE).slice(0, HERD_N);
        if (herd.length < HERD_N) { it.skip = true; continue; }
        herd.forEach(r => { r.forced = true; r.herded = true; }); it.rs = herd;
      }
      lk.last = it.type;
      emit(m, 'tempt', { kind: it.type, item: it });
      feed(m, it.type === 'fakeRet' ? 'fakeRet' : 'tempt', { type: it.type, from: it.type === 'alarm' ? it.r : null });
    }
    if (it.type === 'fakeRet' && it.fired) {       // il tourne à moitié… puis revient d'un coup : « HA ! »
      const k = w.t - it.at, F = FAKE_RET;
      if (k < F.turn) w.turnP = 1 - (1 - F.to) * (k / F.turn);
      else if (k < F.turn + F.hold) w.turnP = F.to;
      else if (k < F.turn + F.hold + F.snap) w.turnP = F.to + (1 - F.to) * ((k - F.turn - F.hold) / F.snap);
      else { w.turnP = 1; if (!it.snapped) { it.snapped = true; emit(m, 'fakeSnap'); } }
    }
    if (it.type === 'sneeze' && it.fired) w.shut = w.t >= it.at - 0.2 + TEMPT.sneeze.shut[0] && w.t < it.at - 0.2 + TEMPT.sneeze.shut[1] ? 1 : 0;
    if (it.type === 'recount' && it.fired) {       // v2.5 : « 1… 2… » en te regardant (il ment), puis il se marre
      const k = w.t - it.at, n = k < RECOUNT.gap ? 0 : k < RECOUNT.laugh ? 1 : 2;
      if (n !== it.n) {
        it.n = n;
        if (n < 2) { w.text = String(n + 1); w.textKind = 'recount'; w.textAt = m.t; emit(m, 'recount', { n }); }
        else { w.text = ''; w.textKind = ''; emit(m, 'recountEnd'); }
      }
    }
  }
}

function startChant(m) {
  const w = m.sun, c = m.cc;
  m.cycle = c.n; m.stats.cycles = c.n; m.soSeen = false;
  w.chant = buildChant(c);
  w.state = 'chant'; w.t = 0; w.evI = 0; w.trapsThisChant = 0; w.revealed = true;
  w.turnDur = c.turn; w.lookDur = c.look;
  w.cloud = c.cloud;                               // v2.5 : le nuage reste jusqu'au vrai retour (le « ding »)
  const ev0 = w.chant.events[0].t + PLANE_STOP[0];
  w.plane = c.planeStop ? { at: ev0 + Math.max(0, w.chant.trig - PLANE_STOP[1] - ev0) * c.planeU, fired: false } : null;
  emit(m, 'cycle', { n: c.n, move: c.move, cfg: c });
  if (c.cloud) { emit(m, 'cloud'); feed(m, 'cloud'); }
}

function chantWord(m, ev) {
  const w = m.sun;
  w.text = ev.text; w.textKind = ev.kind; w.textAt = m.t;
  if (ev.kind === 'num' && ev.n === 2) {          // le « 3 » : le mot arrive
    if (m.trapTrack && m.trapTrack.trapT >= 0) judgeTrap(m);   // v2.5 : il reprend à « 3 » juste après un piège (rire court) : on juge d'abord
    m.soSeen = true; m.trapTrack = { moving: m.player.v > 2, stopped: false, trapT: -1 };
  }
  if (ev.kind === 'trap') { w.trapsThisChant++; w.revealed = false; if (m.trapTrack) m.trapTrack.trapT = m.t; }
  if (ev.kind === 'trigger') m.trapTrack = null;
  emit(m, 'word', { ev });
  feed(m, ev.kind, ev);
}

// As-tu freiné pour un mot piège ? (depuis le « 3 » jusqu'à TRAP_WIN s après le mot, ou jusqu'au « 3 » suivant s'il arrive avant)
function trackTrap(m) {
  const k = m.trapTrack;
  if (!k) return;
  if (m.player.v < 0.5) k.stopped = true;
  if (k.trapT >= 0 && m.t - k.trapT >= TRAP_WIN) judgeTrap(m);
}
function judgeTrap(m) {
  const k = m.trapTrack;
  if (k.moving && k.stopped) { m.stats.trapsFell++; emit(m, 'trapFell'); }
  else if (k.moving) { m.stats.trapsAvoided++; emit(m, 'trapAvoided'); }
  m.trapTrack = null;
}

// Les rivaux en course entre range[0] et range[1] mètres de toi, du plus proche au plus loin
function nearest(m, range) {
  const pz = m.player.z;
  return m.rivals.filter(r => r.state === 'race' && r.z - pz >= range[0] && r.z - pz <= range[1])
    .sort((a, b) => Math.abs(a.z - pz) - Math.abs(b.z - pz));
}

// Le soleil vient de finir de se retourner : qui bouge encore ?
function lookStart(m) {
  const pl = m.player, w = m.sun;
  m.stats.looks++;
  const items = (m.cc.tempt || []).map(t => ({ type: t.type, at: t.at, fired: false }));
  if (items.length) {                              // le regard dure assez longtemps pour que chaque tentation se joue
    m.look = { items, last: '' };
    for (const it of items) w.lookDur = Math.max(w.lookDur, it.at + TEMPT[it.type].need);
  } else m.look = null;
  for (const r of m.rivals) if (r.state === 'race' && r.v > V_EPS) grillRival(m, r, r.press ? 'running' : 'late');
  if (pl.v > V_EPS) {
    if (pl.press) seen(m, 'running', w.turnDur);   // tu courais encore « turnDur » s après SOLEIL
    else seen(m, 'late', pl.v / pl.dec);           // temps qu'il te restait pour t'arrêter
    return;
  }
  const since = pl.v > 0 ? 0 : m.t - pl.stopT;
  if (since < CLOSE) {                             // « OUF ! » : arrêté au tout dernier moment
    m.stats.oufs++; m.stats.combo++; m.stats.comboMax = Math.max(m.stats.comboMax, m.stats.combo);
    emit(m, 'ouf', { combo: m.stats.combo });
  } else { m.stats.combo = 0; emit(m, 'safe'); }
}

function grillRival(m, r, why) {
  r.state = 'grilled'; r.resp = RIVAL_RESPAWN; r.burnT = 0; r.v = 0; r.press = false; r.grills++; r.forced = false;
  r.anim = r.brain.rnd() < 0.5 ? 'fall' : 'stomp';  // il tombe, ou il trépigne
  r.brain.queue = []; r.brain.press = false;
  emit(m, 'rivalGrilled', { r, why, herd: !!r.herded });   // v2.5 : herd = il suivait le troupeau
  r.herded = false;
}

const place = m => 1 + m.finishers.length + m.rivals.filter(r => r.state === 'race' && r.z > m.player.z).length;
function ranking(m) {                             // classement : arrivés, puis toi, puis les autres par distance
  const list = m.finishers.map(r => ({ id: r.id, name: r.name, kind: r.kind, r, time: r.finishT }));
  if (m.result && m.result.win) list.push({ id: 'you', you: true, time: m.result.time });
  const rest = m.rivals.filter(r => r.state !== 'done').sort((a, b) => (b.state === 'race' ? b.z : 0) - (a.state === 'race' ? a.z : 0));
  rest.forEach(r => list.push({ id: r.id, name: r.name, kind: r.kind, r, time: null, z: r.state === 'race' ? r.z : 0 }));
  return list;
}

function win(m) {
  const pl = m.player;
  pl.state = 'done'; pl.finishT = m.t;
  m.result = { win: true, time: m.t, place: m.finishers.length + 1, total: m.rivals.length + 1, stats: m.stats,
               beaten: m.rivals.filter(r => r.state !== 'done').map(r => r.id), revived: !!m.revived,
               scoops: m.level.scoops ? m.scoops : null };   // v2.5 : les boules de glace qui restent
  emit(m, 'finish', { place: m.result.place });
}
function lose(m, why, val) {
  const pl = m.player;
  m.result = { win: false, why, val, time: m.t, z: pl.z, remaining: Math.max(0, m.level.length - pl.z),
               place: place(m), total: m.rivals.length + 1, stats: m.stats, cycle: m.cycle, afterTrap: m.sun.trapsThisChant > 0,
               tempt: m.look && m.sun.state === 'look' && !m.sun.second ? m.look.last : '', mud: !!m.player.mud,
               cloud: !!m.sun.cloud && /^(turn|look|peek|hop)$/.test(m.sun.state) };   // v2.5 : grillé pendant que le nuage le cachait
  emit(m, 'grilled', { why, val });
}

// ---------- 2e chance (pub récompensée, js/ui/reward.js) ----------
// On reprend EXACTEMENT là où on a été grillé : le joueur est à l'arrêt (et doit d'abord lâcher s'il maintenait),
// le soleil se remet de dos, et un nouveau cycle commence après une petite pause. Les rivaux continuent leur
// course là où ils étaient. Une seule 2e chance par essai ; ensuite, le défi (★★★) n'est plus possible.
// La simulation ne l'utilise jamais : ses résultats ne bougent pas.
const REVIVE_PAUSE = 1.2;                          // s : la pause du soleil avant le prochain chant
function revive(m) {
  if (!m.result || m.result.win || m.revived || m.level.soft || m.result.why === 'chairs') return false;   // transats : on est à l'arrivée
  const pl = m.player, w = m.sun;
  if (m.night) { m.sunUp = true; m.warned = false; }   // le soleil remonte et ne se couche plus (après la nuit ou grillé)
  m.revived = true; m.result = null; m.look = null; m.trapTrack = null; m.quickT = -1;
  pl.v = 0; pl.press = false; pl.stopT = m.t; pl.lock = true; pl.knock = null;
  m.stats.combo = 0;
  Object.assign(w, { state: 'pause', t: 0, turnP: 0, text: '', textKind: '', second: false, retTo: 0, shut: 0, spotted: false });
  m.cc = cycleConfig(m, m.cycle + 1);
  w.pauseDur = Math.max(m.cc.pause, REVIVE_PAUSE);
  feed(m, 'return');                               // les rivaux savent qu'ils peuvent repartir
  emit(m, 'revive');
  return true;
}

// Les étoiles d'un essai gagné : [finir, objectif, défi] — après une 2e chance, pas de défi
function goalMet(g, res) {
  if (!g || !res.win) return false;
  switch (g.type) {
    case 'top': return res.place <= g.n;
    case 'first': return res.place === 1;
    case 'oufs': return res.stats.oufs >= g.n;
    case 'combo': return res.stats.comboMax >= g.n;
    case 'noTrap': return res.stats.trapsFell === 0;
    case 'avoid': return res.stats.trapsAvoided >= g.n;
    case 'time': return res.time <= g.s;
    case 'beat': return res.beaten.includes(g.who);
    case 'quick': return res.stats.quick >= g.n;
    case 'resist': return res.stats.resisted >= g.n;
    case 'scoops': return (res.scoops || 0) >= g.n;      // v2.5 : arrive avec au moins n boules de glace
    default: return false;
  }
}
const starsOf = (L, res) => [!!res.win, goalMet(L.goal, res), !res.revived && goalMet(L.challenge, res)];

S.Match = { create, step, revive, normalize, cycleConfig, place, ranking, starsOf, goalMet, mudAt, SUN_BASE, FIRST_PAUSE, RIVAL_RESPAWN, LANES, TEMPT, QUICK, FAKE_RET, KNOCK,
  NIGHT_WARN, TEMPT_V25, RECOUNT, PLANE_STOP, ALARM_RANGE, HERD_N, HERD_RANGE };
})(window.Soleil);
