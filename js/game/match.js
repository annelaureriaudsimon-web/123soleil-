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
const TRAP_WIN = 0.6;          // s'être arrêté (depuis « SO ») jusqu'à 0,6 s après un mot piège = « tombé dans le piège »
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
  crack:   { at: 0.5, jit: 0.3, need: 1.5, group: 'rival' }   // un rival craque (BOUM)
};
const TEMPT_ORDER = ['star', 'fakeRet', 'sneeze', 'taunt', 'fly', 'crack'];   // ordre fixe des dés (ne pas changer)
const CRACK_RANGE = [-1, 30];  // rival qui craque : entre 1 m derrière toi et 30 m devant
// Niveau « en douceur » (champ « soft » d'un niveau, le niveau 1) : vu en train de bouger, tu n'es pas grillé,
// tu recules de soft.back mètres (« OUPS ! ») en KNOCK s, puis il faut lâcher avant de repartir.
const KNOCK = 0.5;

// Réglages du soleil par défaut (chaque niveau peut les changer dans levels/*.js, champ « sun »)
const SUN_BASE = {
  word: [0.55, 0.65],          // durée d'un chiffre « 1… 2… 3… » (s), tirée à chaque cycle entre ces deux valeurs
  jitter: 0.08,                // petite variation de chaque mot (±8 %)
  soK: 0.6,                    // durée du « SO » (× un chiffre)
  turn: [0.62, 0.68],          // demi-tour après « SOLEIL ! » : le temps qu'il te laisse pour t'arrêter (s)
  look: [1.2, 1.9],            // durée de son regard (s)
  pause: [0.5, 1.0],           // pause avant de rechanter (s)
  traps: 0, double: 0,         // probabilité d'un mot piège dans un chant, puis d'un deuxième
  hesitate: 0,                 // probabilité d'une hésitation « SOOOO… »
  hesLen: [0.9, 1.5],          // durée de l'hésitation (s)
  hesOnTrap: 0.4,              // probabilité que l'hésitation tombe sur un mot piège (et pas sur SOLEIL)
  stutter: 0,                  // probabilité d'un bégaiement « 2… 2… 3… »
  stutterRush: 0.65,           // après le bégaiement, il accélère (× durée des mots)
  express: 0,                  // probabilité d'un chant express
  expressK: 0.5,               // chant express : tout va deux fois plus vite (× durée)…
  expressTurn: 0.9,            // …et il se retourne un peu plus vite (× demi-tour)
  words: null,                 // mots pièges du niveau (null = la liste du jeu)
  // Monde 2
  tempt: null,                 // tentations : { star: 0.5, fakeRet: 0.3, …, max: 2 } (probabilité par regard)
  fakeBack: 0,                 // probabilité d'un faux dos à la fin du regard
  peek: [0.5, 1.1],            // faux dos : durée de l'œil qui dépasse (s)
  look2: [0.6, 1.0]            // faux dos : durée du second regard après « HOP ! » (s)
};

// Un niveau des fichiers levels/*.js, complété avec les valeurs par défaut
function normalize(def) {
  const L = Object.assign({ speed: 1, rivals: [], script: {}, hints: [], mechanics: [], mud: [], firstPause: FIRST_PAUSE, boss: false }, def);
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
        { idx: i, def: rd, kind: rd.kind, name: rd.name, brain, resp: 0, burnT: 9, grills: 0, anim: '', forced: false });
    }),
    finishers: [],
    stats: { oufs: 0, combo: 0, comboMax: 0, trapsFell: 0, trapsAvoided: 0, looks: 0, cycles: 0, resisted: 0, quick: 0, oops: 0 },
    look: null, quickT: -1          // tentations du regard en cours ; instant du dernier vrai « ding »
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
  const list = P.words || SUN_TRAPS;
  const i1 = Math.floor(d[14] * list.length);
  let i2 = Math.floor(d[15] * list.length); if (i2 === i1) i2 = (i2 + 1) % list.length;
  c.words = [list[i1], list[i2]];
  lookConfig(m, c, sc);
  return c;
}

// Monde 2 : tentations et faux dos du cycle, avec un SECOND flux de dés (le monde 1 ne change donc pas du tout)
function lookConfig(m, c, sc) {
  const P = m.level.sun, r = mulberry32(mixSeed(m.seed, 5000 + c.n));
  const e = Array.from({ length: 24 }, () => r());
  const pick = (a, x) => a[0] + (a[1] - a[0]) * x;
  c.fakeBack = sc.fakeBack != null ? !!sc.fakeBack : e[0] < P.fakeBack;
  c.peek = pick(P.peek, e[1]); c.look2 = pick(P.look2, e[2]);
  let list = [];
  if (sc.tempt) list = sc.tempt.slice();
  else if (P.tempt) TEMPT_ORDER.forEach((k, i) => { if (e[3 + i] < (P.tempt[k] || 0)) list.push(k); });
  const max = sc.tempt ? 3 : (P.tempt && P.tempt.max) || 1, groups = new Set();
  let count = 0;
  list = list.filter(k => {                        // lisible : au plus « max », jamais deux au même endroit de l'écran
    const gs = [].concat(TEMPT[k].group);
    if (count >= max || gs.some(g => groups.has(g))) return false;
    gs.forEach(g => groups.add(g)); count++; return true;
  });
  c.tempt = list.map((k, i) => ({ type: k, at: TEMPT[k].at + (TEMPT[k].jit || 0) * e[9 + i] }));
}

function emit(m, type, data) { if (m.out) m.out.push(Object.assign({ type, t: m.t }, data)); }
function feed(m, type, data) {                    // tous les cerveaux voient le même mot au même instant
  if (m.player.brain) brainSee(m.player.brain, type, m.t, data);
  for (const r of m.rivals) if (r.state === 'race') brainSee(r.brain, type, m.t, data);
}
const soLong = m => m.sun.state === 'chant' && m.sun.textKind === 'so';   // le « SO… » est encore affiché
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
        const pz = m.player.z;
        const near = m.rivals.filter(r => r.state === 'race' && r.z - pz >= CRACK_RANGE[0] && r.z - pz <= CRACK_RANGE[1])
          .sort((a, b) => Math.abs(a.z - pz) - Math.abs(b.z - pz))[0];
        if (!near) { it.skip = true; continue; }
        near.forced = true; near.cracked = true; it.r = near;
      }
      lk.last = it.type;
      emit(m, 'tempt', { kind: it.type, item: it });
      feed(m, it.type === 'fakeRet' ? 'fakeRet' : 'tempt', { type: it.type });
    }
    if (it.type === 'fakeRet' && it.fired) {       // il tourne à moitié… puis revient d'un coup : « HA ! »
      const k = w.t - it.at, F = FAKE_RET;
      if (k < F.turn) w.turnP = 1 - (1 - F.to) * (k / F.turn);
      else if (k < F.turn + F.hold) w.turnP = F.to;
      else if (k < F.turn + F.hold + F.snap) w.turnP = F.to + (1 - F.to) * ((k - F.turn - F.hold) / F.snap);
      else { w.turnP = 1; if (!it.snapped) { it.snapped = true; emit(m, 'fakeSnap'); } }
    }
    if (it.type === 'sneeze' && it.fired) w.shut = w.t >= it.at - 0.2 + TEMPT.sneeze.shut[0] && w.t < it.at - 0.2 + TEMPT.sneeze.shut[1] ? 1 : 0;
  }
}

function startChant(m) {
  const w = m.sun, c = m.cc;
  m.cycle = c.n; m.stats.cycles = c.n; m.soSeen = false;
  w.chant = buildChant(c);
  w.state = 'chant'; w.t = 0; w.evI = 0; w.trapsThisChant = 0; w.revealed = true;
  w.turnDur = c.turn; w.lookDur = c.look;
  emit(m, 'cycle', { n: c.n, move: c.move, cfg: c });
}

function chantWord(m, ev) {
  const w = m.sun;
  w.text = ev.text; w.textKind = ev.kind; w.textAt = m.t;
  if (ev.kind === 'so') { m.soSeen = true; m.trapTrack = { moving: m.player.v > 2, stopped: false, trapT: -1 }; }
  if (ev.kind === 'trap') { w.trapsThisChant++; w.revealed = false; if (m.trapTrack) m.trapTrack.trapT = m.t; }
  if (ev.kind === 'trigger') m.trapTrack = null;
  emit(m, 'word', { ev });
  feed(m, ev.kind, ev);
}

// As-tu freiné pour un mot piège ? (depuis le « SO » jusqu'à TRAP_WIN s après le mot)
function trackTrap(m) {
  const k = m.trapTrack;
  if (!k) return;
  if (m.player.v < 0.5) k.stopped = true;
  if (k.trapT >= 0 && m.t - k.trapT >= TRAP_WIN) {
    if (k.moving && k.stopped) { m.stats.trapsFell++; emit(m, 'trapFell'); }
    else if (k.moving) { m.stats.trapsAvoided++; emit(m, 'trapAvoided'); }
    m.trapTrack = null;
  }
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
  emit(m, 'rivalGrilled', { r, why });
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
               beaten: m.rivals.filter(r => r.state !== 'done').map(r => r.id) };
  emit(m, 'finish', { place: m.result.place });
}
function lose(m, why, val) {
  const pl = m.player;
  m.result = { win: false, why, val, time: m.t, z: pl.z, remaining: Math.max(0, m.level.length - pl.z),
               place: place(m), total: m.rivals.length + 1, stats: m.stats, cycle: m.cycle, afterTrap: m.sun.trapsThisChant > 0,
               tempt: m.look && m.sun.state === 'look' && !m.sun.second ? m.look.last : '', mud: !!m.player.mud };
  emit(m, 'grilled', { why, val });
}

// Les étoiles d'un essai gagné : [finir, objectif, défi]
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
    default: return false;
  }
}
const starsOf = (L, res) => [!!res.win, goalMet(L.goal, res), goalMet(L.challenge, res)];

S.Match = { create, step, normalize, cycleConfig, place, ranking, starsOf, goalMet, mudAt, SUN_BASE, FIRST_PAUSE, RIVAL_RESPAWN, LANES, TEMPT, QUICK, FAKE_RET, KNOCK };
})(window.Soleil);
