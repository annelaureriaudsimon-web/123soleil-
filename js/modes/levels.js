/* js/modes/levels.js — Mode Niveaux : lance un niveau, fait tourner le moteur (game/match.js) et l'habille
   (sons, popups, rivaux grillés, tutoriel, boss, victoire, défaite), puis enregistre la progression.
   Toute la logique de jeu est dans game/match.js : ce fichier ne décide rien, il met en scène. */
(function (S) {
'use strict';
const { CAM_BACK, PHASE_LEN, INK, L, tr, store, clamp, lerp, vibrate, fmt, Sound, Music, Lt, safe, Match, WORLDS, levelById,
  newWatcher, popup, sparks, confetti, smokeAt, dust, sweat } = S;

// ---------- Réglages ----------
// La carte d'intro attend un appui (le jeu ne démarre jamais tout seul : gameplayStart part à cet appui).
const BOSS_INTRO = 3.0;          // le soleil met ses lunettes (s), passable d'un tap
const CAUGHT_DUR = 0.65;         // ralenti « GRILLÉ ! » avant la carte de défaite (s)
const RETRY_ARM = 0.22;          // la carte de défaite accepte un tap après ce délai : on relance en moins d'une seconde
const WIN_DUR = 1.5, BOSS_WIN_DUR = 3.2;   // célébration avant l'écran de résultats (s)
const NEAR = 15;                 // « Touche le soleil ! » à 15 m de l'arrivée
const COINS = [3, 4, 6];         // ⭐ du casier gagnées la 1re fois qu'on obtient chaque étoile d'un niveau
const PLACE_STABLE = 0.45;       // une place gagnée / perdue est annoncée si elle tient 0,45 s
const HALO_LIFE = 0.7;           // anneau vert du vrai retour (s)
const TWINKLE = 0.35;            // l'étoile tentatrice tinte toutes les 0,35 s
const SIGNAL_WORLD = 2;          // le « ding » du vrai retour et les « DÉPART ÉCLAIR ! » : à partir de ce monde
                                 // (le monde 1 reste exactement comme avant ; mettre 1 pour les avoir aussi dans la cour)
const HAND_LIFE = 2.4;           // une consigne dessinée (main / touche Espace) reste au plus 2,4 s
const OOPS_SPIN = 0.6;           // niveau en douceur : la toupie du « OUPS ! » (s)
const OOPS_WORD = 0.7;           // « OUPS ! » reste 0,7 s, puis le mot « LÂCHE ! » prend sa place

// ---------- Sauvegarde : soleil.levels = { 'w1-3': { s: [true, true, false], best: 27.4, tries: 6, done: true } } ----------
let save = (() => { const v = store.get('levels', {}); return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; })();
const EMPTY = { s: [false, false, false], best: 0, tries: 0, done: false };
const peek = id => (save[id] && Array.isArray(save[id].s) ? save[id] : EMPTY);   // lecture seule
function rec(id) {
  let r = save[id];
  if (!r || !Array.isArray(r.s)) r = save[id] = { s: [false, false, false], best: 0, tries: 0, done: false };
  return r;
}
const persist = () => store.set('levels', save);
const starsOf = id => (save[id] && Array.isArray(save[id].s) ? save[id].s.filter(Boolean).length : 0);
const worldStars = w => w.levels.reduce((n, lv) => n + starsOf(lv.id), 0);
const totalStars = () => WORLDS.reduce((n, w) => n + worldStars(w), 0);
const maxStars = () => WORLDS.reduce((n, w) => n + w.levels.length * 3, 0);
function unlocked(lv) {                           // le niveau 1 d'un monde ouvert, puis chaque niveau fini débloque le suivant
  const w = WORLDS.find(x => x.id === lv.world);
  if (!w || w.soon || !worldOpen(w)) return false;
  if (lv.num === 1) return true;
  const prev = w.levels[lv.num - 2];
  return !!peek(prev.id).done;
}
// Un monde s'ouvre avec assez d'étoiles gagnées dans un autre (levels/worlds.js, champ « need »)
function worldOpen(w) {
  if (!w || w.soon) return false;
  if (!w.need) return true;
  const from = WORLDS.find(x => x.id === w.need.world);
  return !!from && worldStars(from) >= w.need.stars;
}
function lastUnlocked(w) { let last = w.levels[0]; for (const lv of w.levels) if (unlocked(lv)) last = lv; return last; }

// ---------- Le niveau en cours ----------
const LV = { def: null, m: null, phase: 'off', t: 0, attempt: 0, hints: new Set(), hold: null, banner: null,
             lastNum: -9, placeShown: 0, placeCand: 0, placeT: 0, heartT: 0, glass: -1, info: null, jump: 0, fx: newFx(),
             hand: null, oops: null };
// Ce que les tentations affichent (render/tempt.js) : étoile, mouche, bulle, éternuement, anneau du vrai retour…
function newFx() { return { star: null, fly: null, taunt: null, sneeze: null, halo: 0, spin: 0, twT: 0, flushed: new Set(), mud: false }; }
const seenTempt = new Set(store.get('temptSeen', []));   // tentations déjà rencontrées (indication la 1re fois seulement)
let tauntDeck = [];                                       // moqueries tirées sans répétition (choix visuel)
function nextTaunt() {
  if (!tauntDeck.length) { tauntDeck = L.taunts.map((t, i) => [Math.random(), t]).sort((a, b) => a[0] - b[0]).map(x => x[1]); }
  return tauntDeck.pop();
}

// opts.ready : le niveau s'affiche sans carte d'intro, le soleil attend le 1er appui (1re visite) ;
// opts.mini : petite carte d'intro (nom et idée seulement : les premiers pas)
function open(id, retry, opts = {}) {
  const def = levelById(id);
  if (!def) return;
  if (S.closeLevelCards) S.closeLevelCards();
  const r = rec(def.id);
  r.tries++; persist();
  LV.def = def; LV.attempt = r.tries;
  LV.m = Match.create(def, LV.attempt, { newSun: newWatcher });
  const m = LV.m;
  Object.assign(m.player, { jx: 0, statue: 0, toast: 0, slide: 0, step: 0, pressed: false });
  m.rivals.forEach(rv => Object.assign(rv, { jx: 0, statue: 0, toast: 0, sizzled: true, step: 0 }));
  S.mode = 'level'; S.state = 'level';
  S.runner = m.player; S.watcher = m.sun;
  S.lvSkyZ = def.sky * PHASE_LEN;
  S.lvCaught = false; S.caughtT = 0; S.timeScale = 1; S.particles = []; S.shake = 0; S.flash = 0;
  S.bossBanner = null; S.trapBanner = null; S.phaseTitle = null; S.cloudK = 0;
  m.sun.state = 'pause'; m.sun.rayA = Math.random() * 6;
  LV.hints = new Set(); LV.hold = null; LV.banner = null; LV.lastNum = -9; LV.heartT = 0; LV.jump = 0; LV.info = null;
  LV.fx = newFx(); LV.tip = null; LV.hand = null; LV.oops = null; Sound.buzz(false); m.sun.shut = 0; m.sun.bossFace = null;
  LV.placeShown = LV.placeCand = Match.place(m); LV.placeT = 0;
  LV.glass = def.boss ? 0 : -1;                   // boss : il n'a pas encore ses lunettes
  if (def.boss && retry) { LV.glass = -1; dressBoss(); if (!Music.on) Music.start(def.bossKind || 'cool'); }
  if (!def.boss) Music.stop(0.2);
  if (!retry) S.releaseAll();                    // réessai : si tu gardes le doigt posé, tu cours tout de suite
  S.refreshUI();
  if (retry) { setPhase('play'); popup(L.go, Lt.cx, Lt.chantY, '#06D6A0', S.fit(L.go, Lt.chantSize, S.W * 0.8), 0.7); Sound.start(); }
  else if (opts.ready) { setPhase('ready'); LV.hand = { kind: 'hold', text: L.holdWord, t0: S.gtime, until: 'press', life: Infinity }; }
  else { setPhase('intro'); S.showLevelIntro(def, opts.mini); }
}
function setPhase(p) { LV.phase = p; LV.t = 0; }
function beginPlay() {                            // fin de la carte d'intro (ou du « prêt ») : on joue
  S.hideLevelIntro(); LV.hand = null;
  if (LV.def.boss && LV.glass >= 0) {
    setPhase('boss'); LV.m.sun.state = 'look'; LV.m.sun.turnP = 1;   // il se tourne vers toi pour mettre ses lunettes
    const taunt = LV.def.bossKind === 'farceur' ? L.bossTaunt2 : L.bossTaunt;
    popup(taunt, Lt.cx, Lt.sunY - Lt.R * 1.5, '#FFFFFF', S.fit(taunt, Math.min(Lt.U * 0.06, 30), S.W * 0.9), 1.6); Sound.hmm();
  }
  else { setPhase('play'); Sound.start(); vibrate(20); }
}
function endBossIntro() {                         // il se remet de dos : le chant commence
  const w = LV.m.sun; w.state = 'pause'; w.t = 0; w.turnP = 0;
  setPhase('play'); Sound.unwhoosh();
}
function dressBoss() {                             // ses lunettes : noires (Soleil Cool) ou lunettes-nez-moustache (Farceur)
  if (LV.def.bossKind === 'farceur') LV.m.sun.bossFace = 'farceur'; else LV.m.sun.boss = 1;
}
function putGlasses() {                           // le boss met ses lunettes : flash, musique, bannière
  const farceur = LV.def.bossKind === 'farceur';
  LV.glass = -1; dressBoss();
  S.shake = Lt.U * 0.03; S.flash = 0.8;
  if (farceur) Sound.boing(); else Sound.glasses();
  Sound.boss(); vibrate(40);
  Music.start(LV.def.bossKind || 'cool');
  LV.banner = { title: L.bossTitle, sub: tr(LV.def.name), t: 0, life: 2.0, col: farceur ? '#9B5DE5' : '#FF4D6D' };
}

// Un tap (ou Espace) pendant le mode Niveaux
function press() {
  if ((LV.phase === 'intro' && LV.t > 0.15) || LV.phase === 'ready') beginPlay();
  else if (LV.phase === 'boss' && LV.t > 0.3) { if (LV.glass >= 0) putGlasses(); endBossIntro(); }
  else if (LV.phase === 'fail' && LV.t > RETRY_ARM) retry();          // Rejouer : pause pub (si Poki le décide), puis on relance
}

function update(dt) {
  const m = LV.m;
  if (!m) return;
  LV.t += dt;
  if (LV.banner && (LV.banner.t += dt) > LV.banner.life) LV.banner = null;
  if (Music.on) { Music.tick(); Music.setDuck(m.sun.state === 'chant'); }
  switch (LV.phase) {
    case 'ready':                                 // 1re visite : le soleil attend, la main montre le geste
      presentRivals(dt);
      break;
    case 'boss': {                                // les lunettes descendent du ciel…
      const k = (LV.t - 0.9) / 0.9;
      if (LV.glass >= 0) { LV.glass = clamp(k, 0, 1); if (k >= 1) putGlasses(); }
      if (LV.t >= BOSS_INTRO) endBossIntro();
      break;
    }
    case 'play': {
      if (!LV.hints.has('start')) hintsFor('start');
      Match.step(m, dt, S.pressing);
      events();
      updateFx(dt);
      presentRunner(dt);
      presentRivals(dt);
      watchPlace(dt);
      watchPasses();
      if (LV.hold && S.pressing) LV.hold = null;  // « MAINTIENS » disparaît dès qu'on maintient
      watchHand();
      if (LV.oops && (LV.oops.t += dt) > 1.4) LV.oops = null;
      if (!LV.hints.has('near') && m.level.length - m.player.z < NEAR) hintsFor('near');
      if (m.sun.state === 'look' && (LV.heartT -= dt) <= 0) { Sound.heart(); LV.heartT = 0.75; }
      if (m.sun.state !== 'look') LV.heartT = 0.05;
      break;
    }
    case 'caught': {                              // ralenti, rayon, tout noir… (comme la course infinie)
      S.caughtT += dt;
      const r = m.player, sdt = dt * S.timeScale;
      r.v = Math.max(0, r.v - r.dec * sdt); r.z += r.v * sdt; r.phase += r.v * sdt * 1.6;
      r.statue += (1 - r.statue) * Math.min(1, dt * 10);
      if (S.caughtT >= 0.3 && r.toast === 0) {
        r.toast = 0.01; r.v = 0; S.shake = Lt.U * 0.035; S.flash = 1;
        vibrate([70, 40, 140]); Sound.sizzle(); smokeAt(Lt.cx, Lt.yFeet - Lt.s * 0.9, Lt.s, 14, true);
      }
      if (r.toast > 0) { r.toast = Math.min(1, r.toast + dt * 6); if (Math.random() < dt * 7) smokeAt(Lt.cx, Lt.yFeet - Lt.s * 0.9, Lt.s, 1, false); }
      r.jx = r.toast > 0 && S.caughtT < 0.8 ? (Math.random() - 0.5) * 0.05 : 0;
      presentRivals(dt);
      if (LV.t >= CAUGHT_DUR) { setPhase('fail'); S.showLevelFail(LV.info); }
      break;
    }
    case 'fail':
      S.caughtT += dt;
      break;
    case 'win': {                                 // il touche le soleil : saut, confettis, feu d'artifice (boss)
      const r = m.player, boss = LV.def.boss;
      r.v = Math.max(0, r.v - 9 * dt); r.z += r.v * dt; r.phase += r.v * dt * 1.6;
      LV.jump = Math.max(0, Math.sin(Math.min(1, LV.t / 0.55) * Math.PI)) * Lt.s * 0.55;
      m.sun.rayA += dt * (boss ? 6 : 3);
      presentRivals(dt);
      for (const rv of m.rivals) if (rv.state === 'race') { rv.v = Math.max(0, rv.v - 20 * dt); rv.z += rv.v * dt; rv.phase += rv.v * dt * 1.6; }
      if (boss && Math.floor((LV.t - dt) / 0.32) !== Math.floor(LV.t / 0.32) && LV.t < 2.6) {
        const x = S.W * (0.15 + Math.random() * 0.7), y = S.H * (0.1 + Math.random() * 0.3);
        sparks(26, x, y, ['#FFD166', '#EF476F', '#06D6A0', '#4CC9F0', '#FFFFFF'][Math.floor(Math.random() * 5)]); Sound.firework();
      }
      if (LV.t >= (boss ? BOSS_WIN_DUR : WIN_DUR)) {
        if (S.Onboard.afterWin(LV.def)) break;      // premiers pas : après le niveau 1, le niveau 2 tout de suite
        setPhase('results'); S.showLevelResults(LV.info);
      }
      break;
    }
  }
}

// ---------- Les événements du moteur → sons, popups, bannières ----------
function events() {
  const m = LV.m, w = m.sun;
  for (const e of m.out) {
    switch (e.type) {
      case 'cycle':
        if (e.move) { LV.banner = { title: tr(e.move), sub: L.moveSub, t: 0, life: 1.6, col: '#FF4D6D' }; Sound.boss(); }
        if (e.cfg.express && !LV.hints.has('express')) hintsFor('express');
        LV.lastNum = -9;
        break;
      case 'word':
        w.textT = S.gtime; w.bump = 1; w.textFadeT = 0;
        Sound.chant(e.ev, false);
        if (e.ev.kind === 'num') {
          if (e.ev.n === LV.lastNum && !LV.hints.has('stutter')) hintsFor('stutter');
          LV.lastNum = e.ev.n;
        }
        if (e.ev.kind === 'so') { hintsFor('so', m.cycle); if (e.ev.hes) LV.hesAt = m.t + 0.55; }
        if (e.ev.kind === 'trigger') hintsFor('trigger', m.cycle);
        break;
      case 'reveal':                              // c'était un piège : il se marre
        w.laugh = 1; Sound.laugh();
        popup(L.heh, Lt.cx + Lt.R * 1.15, Lt.sunY - Lt.R * 0.2, '#06D6A0', Math.min(Lt.U * 0.05, 24), 0.9);
        hintsFor('reveal', m.cycle);
        break;
      case 'turn': Sound.whoosh(e.dur); break;
      case 'ouf': {
        const c = e.combo;
        Sound.ouf(c); vibrate(18);
        popup(c > 1 ? `${L.ouf} ×${c}` : L.ouf, Lt.cx, Lt.yFeet - Lt.s * 1.8, c > 2 ? '#FFD166' : '#FFFFFF', Math.min(Lt.U * (0.07 + 0.006 * c), 46), 1.0);
        sparks(10 + c * 3, Lt.cx, Lt.yFeet - Lt.s * 1.2, '#FFF3B0');
        break;
      }
      case 'trapFell': if (LV.banner) break; popup(L.trapped, Lt.cx, Lt.yFeet - Lt.s * 1.9, '#FF8FA3', Math.min(Lt.U * 0.06, 32), 0.9); break;
      case 'trapAvoided': popup(L.notTrapped, Lt.cx, Lt.yFeet - Lt.s * 1.9, '#8CF5B5', Math.min(Lt.U * 0.06, 32), 0.9); Sound.star(); break;
      case 'return': Sound.unwhoosh(); hintsFor('return', m.cycle); break;
      case 'rivalGrilled': {
        const rv = e.r, p = S.rivalScreen(rv);
        rv.sizzled = false; rv.statue = 1;
        if (rv.cracked) {                         // le rival qui craque : un gros BOUM pour te faire sursauter
          rv.cracked = false; S.flash = 1; S.shake = Lt.U * 0.035; Sound.boom(); vibrate([40, 30, 60]);
          popup(L.boom, p.vis ? clamp(p.x, S.W * 0.2, S.W * 0.8) : Lt.cx, p.vis ? clamp(p.y - p.sc * 2.6, Lt.hy + 40, S.H * 0.7) : S.H * 0.5, '#FF7A3D', Math.min(Lt.U * 0.1, 54), 0.9);
          if (p.vis) smokeAt(p.x, p.y - p.sc, p.sc * 1.6, 22, true);
        }
        w.laugh = 1; w.angryUntil = S.gtime + 0.8;
        Sound.busted(); setTimeout(() => Sound.laugh(), 320); vibrate(12);
        popup(L.haha, Lt.cx - Lt.R * 1.2, Lt.sunY - Lt.R * 0.3, '#FFD166', Math.min(Lt.U * 0.055, 26), 1.0);
        say(rv, L.sayGrilled);
        if (p.vis) { const t = L.rivalBurnt(rv.name); popup(t, clamp(p.x, S.W * 0.2, S.W * 0.8), clamp(p.y - p.sc * 2.2, Lt.hy + 30, S.H * 0.7), '#FF7A3D', S.fit(t, Math.min(Lt.U * 0.055, 28), S.W * 0.5), 1.2); }
        break;
      }
      case 'rivalBack': {
        const rv = e.r; rv.toast = 0; rv.statue = 0; rv.sizzled = true;
        const t = L.rivalBack(rv.name);
        popup(t, Lt.cx, S.H * 0.93 - safe.b, '#FFFFFF', S.fit(t, Math.min(Lt.U * 0.04, 18), S.W * 0.7), 1.3);
        break;
      }
      case 'rivalFinish': {
        say(e.r, e.place === 1 ? L.sayFirst : L.sayDone);
        const t = L.rivalDone(e.r.name, e.place);
        popup(t, Lt.cx, Lt.hy + (Lt.yFeet - Lt.hy) * 0.18, '#FFD166', S.fit(t, Math.min(Lt.U * 0.05, 24), S.W * 0.7), 1.4);
        break;
      }
      case 'tempt': onTempt(e.kind); break;
      case 'fakeSnap':                            // faux retour : il revient d'un coup
        popup(L.ha, Lt.cx, Lt.sunY - Lt.R * 1.35, '#FF4D6D', S.fit(L.ha, Math.min(Lt.U * 0.1, 52), S.W * 0.5), 0.8);
        Sound.ha(); w.bump = 1; S.shake = Math.max(S.shake, Lt.U * 0.012); vibrate(15);
        break;
      case 'fakeBack': Sound.unwhoosh(); break;   // faux dos : il tourne… mais pas de « ding »
      case 'peek':
        w.text = L.hmm; w.textKind = 'hmm'; w.textT = S.gtime; w.textFadeT = 0; Sound.hmm();
        firstTime('fakeBack');
        break;
      case 'hop': w.text = 'HOP !'; w.textKind = 'trigger'; w.textT = S.gtime; w.bump = 1; Sound.hop(); vibrate(20); break;
      case 'clear': if (LV.def.world >= SIGNAL_WORLD) onTrueEnd(e.resisted); break;
      case 'quick': {
        if (LV.def.world < SIGNAL_WORLD) break;
        popup(L.quickStart, Lt.cx, Lt.yFeet - Lt.s * 1.55, '#4CC9F0', S.fit(L.quickStart, Math.min(Lt.U * 0.055, 28), S.W * 0.8), 0.8);
        Sound.zip();
        break;
      }
      case 'oops': onOops(e); break;                // niveau en douceur : pas grillé, on recule
      case 'grilled': onCaught(); break;
      case 'finish': onWin(); break;
    }
  }
  m.out.length = 0;
  if (LV.hesAt && m.t >= LV.hesAt) { LV.hesAt = 0; if (w.state === 'chant' && w.textKind === 'so') hintsFor('hes'); }
}

// Indications du niveau (levels/*.js, champ « hints ») : texte qui reste, petit popup, ou bannière
function hintsFor(on, cycle) {
  for (const h of LV.def.hints || []) {
    if (h.on !== on || (h.cycle && h.cycle !== cycle)) continue;
    const key = on + ':' + (h.cycle || 0);
    if (LV.hints.has(key)) continue;
    LV.hints.add(key);
    if (h.banner) showBanner(h.banner);
    else if (h.hand) { if (!(h.until === 'press' && S.pressing)) LV.hand = { kind: h.hand, text: tr(h.text), t0: S.gtime, until: h.until || h.hand, life: HAND_LIFE }; }
    else if (h.until === 'press') { if (!S.pressing) LV.hold = { text: tr(h.text), t0: S.gtime }; }
    else { const t = tr(h.text); popup(t, Lt.cx, Lt.yFeet - Lt.s * 2.2, '#FFD166', S.fit(t, Math.min(Lt.U * 0.075, 40), S.W * 0.9), 1.3); }
  }
  LV.hints.add(on);
}
// La consigne dessinée disparaît quand le geste est fait (appuyé / lâché), ou au bout de HAND_LIFE s
function watchHand() {
  const h = LV.hand;
  if (!h) return;
  const age = S.gtime - h.t0;
  if (h.until === 'press' && S.pressing && age > 0.25) LV.hand = null;
  else if (h.until === 'release' && !S.pressing && !h.done && age > 0.5 && (!h.wordAt || S.gtime > h.wordAt + 0.5)) h.done = S.gtime;   // lâché : on la laisse voir encore un peu
  if (LV.hand && ((h.done && S.gtime - h.done > 0.5) || age > h.life)) LV.hand = null;
}
function showBanner(kind) {
  const B = { trap: [L.trapTitle, L.trapSub(false), '#06D6A0'], hes: [L.hesTitle, L.hesSub, '#FFD166'], mud: [L.mudTitle, L.mudSub, '#C68B59'],
              stutter: [L.stutterTitle, L.stutterSub, '#4CC9F0'], express: [L.expressTitle, L.expressSub, '#FF8FA3'] }[kind];
  if (B) LV.banner = { title: B[0], sub: B[1], t: 0, life: 2.2, col: B[2] };
}

// ---------- Monde 2 : les tentations, le vrai retour (« ding »), les effets ----------
function firstTime(kind) {                        // la toute première rencontre : une indication très courte, au-dessus de toi
  if (seenTempt.has(kind)) return;
  seenTempt.add(kind); store.set('temptSeen', [...seenTempt]);
  LV.tip = { text: L.temptHint[kind], t0: S.gtime, life: 2.4 };
}
function onTempt(kind) {
  const m = LV.m, w = m.sun, fx = LV.fx;
  firstTime(kind);
  switch (kind) {
    case 'star': fx.star = { z: m.player.z + 1.6, t: 0, away: 0 }; Sound.twinkle(); fx.twT = TWINKLE; break;
    case 'fakeRet': Sound.creak(); break;
    case 'sneeze': fx.sneeze = { t: 0, step: 0 }; break;
    case 'taunt': fx.taunt = { text: nextTaunt(), t: 0, life: 1.45, again: w.lookDur - w.t > 2.4 }; Sound.nyah(); w.laugh = 0.6; break;
    case 'fly': fx.fly = { t: 0, away: 0, landed: false }; Sound.buzz(true); break;
    case 'crack': break;                          // le BOUM arrive avec « rivalGrilled »
  }
}
function onTrueEnd(resisted) {                    // le VRAI retour : « ding », anneau vert, rayons qui tournent
  const fx = LV.fx;
  Sound.ding(); fx.halo = 0.001; fx.spin = 1;
  if (fx.star) { fx.star.away = 0.001; popup(L.pfff, Lt.cx + Lt.s * 0.8, Lt.yFeet - Lt.s * 2.6, '#FFD166', Math.min(Lt.U * 0.05, 26), 0.9); Sound.pfff(); }
  if (fx.fly) { fx.fly.away = 0.001; Sound.buzz(false); }
  fx.taunt = null; fx.sneeze = null;
  if (resisted && resisted.length) {              // SANG-FROID ! (+1 ⭐ par tentation, versées si tu finis)
    const t = `${L.sangFroid} +${resisted.length} ⭐`;
    popup(t, Lt.cx, Lt.yFeet - Lt.s * 2.9, '#8CF5B5', S.fit(t, Math.min(Lt.U * 0.07, 36), S.W * 0.9), 1.1);
    Sound.sangFroid(); sparks(14, Lt.cx, Lt.yFeet - Lt.s * 1.4, '#8CF5B5');
  }
}
function updateFx(dt) {
  const m = LV.m, w = m.sun, fx = LV.fx;
  if (fx.halo) { fx.halo += dt; if (fx.halo > HALO_LIFE) fx.halo = 0; }
  if (fx.spin > 0.01) { w.rayA += dt * 9 * fx.spin; fx.spin *= Math.exp(-dt * 3); }
  if (fx.star) {
    fx.star.t += dt;
    if (fx.star.away) { fx.star.away += dt; if (fx.star.away > 0.8) fx.star = null; }
    else if ((fx.twT -= dt) <= 0) { fx.twT = TWINKLE; Sound.twinkle(); }
  }
  if (fx.fly) {
    const f = fx.fly; f.t += dt;
    if (f.away) { f.away += dt; if (f.away > 0.6) fx.fly = null; }
    else {
      Sound.buzzPitch(clamp(f.t / 0.8, 0, 1));
      if (!f.landed && f.t >= 0.8) { f.landed = true; Sound.buzz(false); }
      if (f.landed) S.shake = Math.max(S.shake, Lt.U * 0.003 * Math.min(1, (f.t - 0.8) / 1.2));   // l'écran vibre un peu
    }
  }
  if (fx.taunt) {
    fx.taunt.t += dt;
    if (fx.taunt.t > fx.taunt.life) {
      if (fx.taunt.again && w.state === 'look') { fx.taunt = { text: nextTaunt(), t: 0, life: 1.3, again: false }; Sound.nyah(); w.laugh = 0.6; }
      else fx.taunt = null;
    }
  }
  if (fx.sneeze) {                                 // « Aaah… AAAH… ATCHOUM ! »
    const sn = fx.sneeze; sn.t += dt;
    const say = (txt, big) => popup(txt, Lt.cx, Lt.sunY - Lt.R * 1.4, '#FFFFFF', S.fit(txt, Math.min(Lt.U * (big ? 0.085 : 0.06), big ? 46 : 32), S.W * 0.7), big ? 0.8 : 0.42);
    if (sn.step === 0) { sn.step = 1; say(L.aah1); Sound.aah(1); w.offY = -Lt.R * 0.05; }
    else if (sn.step === 1 && sn.t >= 0.55) { sn.step = 2; say(L.aah2); Sound.aah(2); w.offY = -Lt.R * 0.1; }
    else if (sn.step === 2 && sn.t >= 1.0) {
      sn.step = 3; say(L.atchoum, true); Sound.atchoum(); w.offY = Lt.R * 0.06; w.bump = 1;
      S.shake = Math.max(S.shake, Lt.U * 0.02); vibrate(25);
      for (let i = 0; i < 3; i++) sparks(10, Lt.cx + (i - 1) * Lt.R * 0.3, Lt.sunY + Lt.R * 0.4, '#D6F0FF');
    } else if (sn.step === 3 && sn.t >= 1.5) { sn.step = 4; w.offY = 0; }
  }
}

// ---------- Le joueur : pas, glissade, statue qui tremble ----------
function presentRunner(dt) {
  const r = LV.m.player, w = LV.m.sun;
  const st = Math.floor(r.phase / Math.PI);
  if (st !== r.step) { r.step = st; if (r.v > 1.5) { if (r.mud) { Sound.mud(); S.splash(5); } else { Sound.step(); dust(2, 0.8); } } }
  if (r.mud && !LV.fx.mud && r.v > 2) { Sound.splotch(); S.splash(14); hintsFor('mud'); }   // SPLOTCH : on entre dans la boue
  LV.fx.mud = !!r.mud;
  if (!r.press && r.pressed && r.v > 3) { dust(9, 1.8); Sound.skid(); }
  r.pressed = r.press;
  const eyes = w.state === 'look' || (w.state === 'turn' && w.turnP > 0.55);
  r.statue += ((eyes && r.v === 0 ? 1 : 0) - r.statue) * Math.min(1, dt * 12);
  const fly = LV.fx.fly && LV.fx.fly.landed ? Math.min(1, (LV.fx.fly.t - 0.8) / 1.2) : 0;   // la mouche : il tremble de plus en plus
  r.jx = r.statue > 0.5 ? (Math.random() - 0.5) * (0.022 + 0.05 * fly) : 0;
  if (eyes && r.v === 0 && Math.random() < dt * (3.5 + 6 * fly)) sweat();
}

// ---------- Les rivaux : statue, puis grillé (tout noir, fumée), puis retour au départ ----------
function presentRivals(dt) {
  const w = LV.m.sun;
  const eyes = w.state === 'look' || (w.state === 'turn' && w.turnP > 0.55);
  for (const rv of LV.m.rivals) {
    if (rv.state === 'grilled') {
      const p = S.rivalScreen(rv);
      if (!rv.sizzled && rv.burnT >= 0.3) {
        rv.sizzled = true; rv.toast = 0.01;
        if (p.vis) { Sound.sizzle(); smokeAt(p.x, p.y - p.sc * 0.9, p.sc, 12, true); S.shake = Math.max(S.shake, Lt.U * 0.012); }
      }
      if (rv.toast > 0) { rv.toast = Math.min(1, rv.toast + dt * 6); if (p.vis && Math.random() < dt * 8) smokeAt(p.x, p.y - p.sc * 1.1, p.sc, 1, false); }
      rv.jx = rv.toast > 0 && rv.burnT < 0.8 ? (Math.random() - 0.5) * 0.05 : 0;
      continue;
    }
    rv.statue += ((eyes && rv.v === 0 && rv.state === 'race' ? 1 : 0) - rv.statue) * Math.min(1, dt * 12);
    rv.jx = rv.statue > 0.5 ? (Math.random() - 0.5) * 0.022 : 0;
  }
}

// Les rivaux parlent : petite bulle au-dessus de la tête (choix au hasard : c'est seulement visuel)
function say(rv, lines, force) {
  if (!force && S.gtime < (rv.sayNext || 0)) return;
  rv.say = lines[Math.floor(Math.random() * lines.length)]; rv.sayUntil = S.gtime + 1.3; rv.sayNext = S.gtime + 3;
}
function watchPasses() {                          // quand un rival te double (ou que tu le doubles), il le dit
  const pl = LV.m.player;
  for (const rv of LV.m.rivals) {
    const ahead = rv.z > pl.z;
    if (rv.state === 'race' && rv.wasAhead !== undefined && ahead !== rv.wasAhead && Math.abs(rv.z - pl.z) < 8 && LV.m.t > 3)
      say(rv, ahead ? L.sayPass : L.sayPassed);
    rv.wasAhead = ahead;
  }
}
// Place gagnée / perdue (annoncée seulement si elle tient un moment)
function watchPlace(dt) {
  const p = Match.place(LV.m);
  if (LV.m.t < 2.5) { LV.placeShown = LV.placeCand = p; return; }   // pas d'annonce pendant le départ
  if (p !== LV.placeCand) { LV.placeCand = p; LV.placeT = 0; }
  else if (p !== LV.placeShown && (LV.placeT += dt) >= PLACE_STABLE) {
    const better = p < LV.placeShown;
    LV.placeShown = p;
    const t = better ? L.passed(p) : L.passedBy(p);
    popup(t, Lt.cx + Lt.s * 1.2, Lt.yFeet - Lt.s * 2.4, better ? '#8CF5B5' : '#FF8FA3', Math.min(Lt.U * 0.05, 24), 0.8);
    if (better) Sound.passed(); else Sound.passedBy();
  }
}

// ---------- Niveau en douceur : « OUPS ! », tu recules en faisant la toupie, le soleil rigole ----------
function onOops(e) {
  const w = LV.m.sun;
  LV.oops = { t: 0, back: e.back };
  w.laugh = 1; w.angryUntil = S.gtime + 0.6;
  Sound.boing(); setTimeout(() => Sound.laugh(), 280); vibrate([30, 30, 50]);
  popup(L.oops, Lt.cx, Lt.yFeet - Lt.s * 2.5, '#FF8FA3', S.fit(L.oops, Math.min(Lt.U * 0.1, 54), S.W * 0.8), OOPS_WORD);   // puis « LÂCHE ! » à la même place
  popup(L.oopsSun, Lt.cx + Lt.R * 1.15, Lt.sunY - Lt.R * 0.3, '#FFFFFF', Math.min(Lt.U * 0.055, 28), 0.9);
  dust(10, 1.6);
  LV.hand = { kind: 'release', text: L.letGo, t0: S.gtime, until: 'release', life: HAND_LIFE + OOPS_WORD, wordAt: S.gtime + OOPS_WORD };   // le doigt qui se lève : LÂCHE !
}
// L'angle de la toupie (dessin du coureur)
function spin() {
  const o = LV.oops;
  if (!o || o.t >= OOPS_SPIN) return 0;
  return Math.sin(Math.min(1, o.t / OOPS_SPIN) * Math.PI) * 0.5 + (o.t / OOPS_SPIN) * Math.PI * 2;
}

// ---------- Fin d'un essai ----------
function onCaught() {
  const m = LV.m, res = m.result, w = m.sun;
  setPhase('caught');
  S.lvCaught = true; S.caughtT = 0; S.timeScale = 0.18;
  w.state = 'caught'; w.angry = true; w.turnP = 1; w.textFadeT = S.gtime;
  Sound.busted(); vibrate(30);
  if (LV.def.boss) Music.setDuck(true);
  Sound.buzz(false);
  if (res.tempt === 'fakeRet') { popup(L.ha, Lt.cx, Lt.sunY - Lt.R * 1.35, '#FF4D6D', S.fit(L.ha, Math.min(Lt.U * 0.1, 52), S.W * 0.5), 0.8); Sound.ha(); }
  const exact = res.why === 'late' ? L.late(fmt(res.val)) : res.why === 'early' || res.why === 'hop' ? L.early(fmt(res.val)) : L.failWhyRunning;
  const why = res.why === 'hop' ? L.temptFail.hop : res.tempt ? L.temptFail[res.tempt] : exact;   // une tentation ? on dit laquelle
  const rem = Math.ceil(res.remaining);
  const almost = rem <= 40 ? L.failAlmost(rem) : res.place <= 2 && m.rivals.length ? L.failPlace(res.place) : L.failAlmost(rem);
  LV.info = { def: LV.def, res, why, almost, tip: why !== exact ? exact : res.afterTrap && res.why !== 'early' ? L.failTipTrap : '' };
}
function onWin() {
  const m = LV.m, res = m.result, def = LV.def, r = rec(def.id);
  setPhase('win');
  const stars = Match.starsOf(m.level, res);
  const fresh = stars.map((s, i) => s && !r.s[i]);
  const bonus = m.stats.resisted;                 // +1 ⭐ par tentation résistée
  const coins = fresh.reduce((n, f, i) => n + (f ? COINS[i] : 0), 0) + bonus;
  Sound.buzz(false);
  const firstWin = !r.done;
  r.s = r.s.map((s, i) => s || stars[i]); r.done = true;
  const newBest = !r.best || res.time < r.best;
  if (newBest) r.best = +res.time.toFixed(2);
  persist();
  if (coins) S.addStars(coins);
  Sound.levelWin(); vibrate([30, 40, 60]); confetti(def.boss ? 120 : 70);
  const farceur = def.bossKind === 'farceur';
  if (def.boss) {                                 // les lunettes (ou le nez !) s'envolent !
    m.sun.boss = 0; m.sun.bossFace = null; Music.stop(0.6); setTimeout(() => Sound.fanfare(), 250);
    if (farceur) Sound.boing();
    popup(farceur ? '🥸' : '😎', Lt.cx, Lt.sunY, '#FFFFFF', Lt.R * 0.9, 1.8);
    const down = farceur ? L.bossDown2 : L.bossDown;
    popup(down, Lt.cx, Lt.sunY + Lt.R * 1.3, '#FFFFFF', S.fit(down, Math.min(Lt.U * 0.06, 30), S.W * 0.8), 1.6);
  }
  const t = def.boss ? (farceur ? L.bossWin2 : L.bossWinTitle) : L.winTitle;
  popup(t, Lt.cx, Lt.hy + (Lt.yFeet - Lt.hy) * 0.3, '#FFD166', S.fit(t, Math.min(Lt.U * 0.11, 58), S.W * 0.9), 1.4);
  if (S.Onboard.chain(def)) {                     // premiers pas : pas d'écran de résultats, les étoiles gagnées ici
    const st = stars.map(x => (x ? '★' : '☆')).join(' ');
    popup(st, Lt.cx, Lt.hy + (Lt.yFeet - Lt.hy) * 0.55, '#FFD23A', Math.min(Lt.U * 0.12, 64), 1.5);
  }
  m.sun.state = 'pause'; m.sun.turnP = 0; m.sun.text = ''; m.sun.laugh = 0;
  const next = (WORLDS.find(w => w.id === def.world) || WORLDS[0]).levels[def.num];
  LV.info = { def, res, stars, fresh, coins, bonus, firstWin, newBest, best: r.best, ranking: Match.ranking(m), next: next || null };
  store.set('lastLevel', def.id);
}

// ---------- Quitter / naviguer ----------
function cleanup() {                              // on quitte le mode Niveaux (carte, accueil)
  if (S.closeLevelCards) S.closeLevelCards();
  Music.stop(0.3); Sound.buzz(false);
  LV.m = null; LV.phase = 'off';
  S.lvCaught = false; S.lvSkyZ = null; S.timeScale = 1;
}
function toMap() { cleanup(); S.WorldMap.open(); }
function next() {                                 // Suivant : pause pub, puis la carte d'intro du niveau d'après
  const n = LV.info && LV.info.next;
  if (S.Onboard.mapNext(LV.def)) return;         // premiers pas : après le niveau 2, la carte se présente
  if (!n || !unlocked(n)) { toMap(); return; }   // vers la carte : pas de pub
  S.afterBreak(() => open(n.id, false));
}
function restart() { if (LV.def) open(LV.def.id, true); }   // le niveau repart tout de suite (sans pub : déjà demandée)
function retry() { if (LV.def) S.afterBreak(restart); }      // Rejouer : pause pub (si Poki le décide), puis on relance

S.Levels = {
  open, press, update, toMap, next, retry, restart, cleanup, totalStars, maxStars, worldStars, starsOf, unlocked, lastUnlocked, rec, peek, worldOpen,
  get fx() { return LV.fx; },
  get m() { return LV.m; }, get phase() { return LV.phase; }, get def() { return LV.def; },
  get hold() { return LV.hold; }, get banner() { return LV.banner; }, get tip() { return LV.tip; }, get glass() { return LV.glass; }, get jump() { return LV.jump; },
  get hand() { return LV.hand; }, get oops() { return LV.oops; }, get spin() { return spin(); }, get info() { return LV.info; },
  isBossLevel: () => !!(LV.def && LV.def.boss)
};
})(window.Soleil);
