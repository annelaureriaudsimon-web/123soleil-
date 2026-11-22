/* js/game/watcher.js — Le soleil : regard, faux dos, HOP (course infinie et 2 joueurs) */
(function (S) {
'use strict';
const { BOSS_REST, CLOSE, HOP_DUR, PEEK_P, PHASE_LEN, RET_DUR, V_EPS, L, tr, MEDALS, clamp, easeIn, easeOut,
  lerp, vibrate, store, PHASE_WATCHER, Sound, SAY, sayEvent, Voice, Lt, anyMoving, addStars,
  checkMissions, chantEvent, overdrive, startChant } = S;   // déjà chargés

/* ---------- 14. Le soleil : regard, faux dos, HOP ---------- */
function updateWatcher(dt) {
  const w = S.watcher;
  w.t += dt;
  switch (w.state) {
    case 'pause': {
      const want = S.mode === 'duo' ? 'sun' : PHASE_WATCHER[Math.floor(S.runner.z / PHASE_LEN) % 4];
      if (!w.preSaid && want === w.type && !S.bossQueue.length && Voice.active() && w.t >= w.pauseDur - Voice.lead) {
        w.preSaid = true; Voice.say(SAY.num[0], w.type === 'moon');   // « Un… » part en avance du délai de la voix
      }
      if (w.t >= w.pauseDur) {
        if (want !== w.type) { w.state = 'swap'; w.t = 0; w.swapTo = want; Sound.swap(); w.preSaid = false; }
        else startChant();
      }
      break;
    }
    case 'swap': {                                          // le soleil se couche, la Lune se lève (ou l'inverse)
      const k = w.t / 1.1;
      if (k < 0.5) w.offY = easeIn(k / 0.5) * Lt.R * 2.8;
      else { w.type = w.swapTo; w.offY = (1 - easeOut(Math.min(1, (k - 0.5) / 0.5))) * Lt.R * 2.8; }
      if (w.t >= 1.1) { w.offY = 0; w.state = 'pause'; w.t = 0; w.pauseDur = 0.4; }
      break;
    }
    case 'chant': {
      const ev = w.chant.events;
      while (w.evI < ev.length && ev[w.evI].t <= w.t) chantEvent(ev[w.evI++]);
      while (w.vI < ev.length && ev[w.vI].t - Voice.lead <= w.t) sayEvent(ev[w.vI++]);   // la voix, un peu en avance
      if (w.textKind === 'trap' && !w.revealed && S.gtime - w.textT > 0.2) {   // c'était un piège : il se marre
        w.revealed = true; w.laugh = 1; Sound.laugh();
        S.popup(L.heh, Lt.cx + Lt.R * 1.15, Lt.sunY - Lt.R * 0.2, '#06D6A0', Math.min(Lt.U * 0.05, 24), 0.9);
        Voice.quip(SAY.heh, w.type === 'moon');                // « Hé hé ! » (coupé par le mot suivant du chant)
        if (S.tutorial && !S.trapTuto && S.mode !== 'duo') { S.trapTuto = true; S.trapBanner = { t: 0, moon: w.type === 'moon' }; }
      }
      if (w.planeAt >= 0 && w.t >= w.planeAt) { w.planeAt = -1; lieFirst('planeStop'); S.startPlane('stop', S.chantW().sun); }   // v2.5
      if (w.t >= w.chant.trig) { w.state = 'turn'; w.t = 0; w.turnP = 0; Sound.whoosh(w.turnDur); }
      break;
    }
    case 'turn':
      w.turnP = clamp(w.t / w.turnDur, 0, 1);
      if (w.t >= w.turnDur) { w.turnP = 1; w.state = 'look'; w.t = 0; w.textFadeT = S.gtime; w.beat = 0.05; lookStart(); }
      break;
    case 'look':
      if (S.mode === 'duo') S.duoLookCheck(false);                     // 2 joueurs : chacun est vérifié séparément
      else if (S.runner.v > V_EPS) { S.caught(w.second ? 'hop' : 'early', w.lookDur - w.t); return; }
      if (w.t >= w.beat) { Sound.heart(); w.beat += 0.75; }
      if (w.lie && !w.second) lieStep(w);                              // v2.5 : il recompte en te regardant, ou l'avion « ALLEZ-Y ! »
      if (w.t >= w.lookDur) {
        const fake = w.faux && !w.second;
        w.state = 'return'; w.t = 0; w.retTo = fake ? PEEK_P : 0; Sound.unwhoosh();
        if (S.star && !S.star.taken && !S.star.gone) S.poofStar();   // le soleil a fini de regarder : l'étoile s'en va
        if (!fake && w.boss) bossBeaten();
        if (w.second && S.mode !== 'duo') { S.RS.hops++; checkMissions(); }
      }
      break;
    case 'return':
      w.turnP = lerp(1, w.retTo, clamp(w.t / RET_DUR, 0, 1));
      if (w.t >= RET_DUR) {
        if (w.retTo > 0) {                                  // faux dos : un œil dépasse encore…
          w.state = 'peek'; w.t = 0; w.text = L.hmm; w.textKind = 'hmm'; w.textT = S.gtime; Sound.hmm();
          Voice.quip(SAY.hmm, w.type === 'moon');
        } else {
          w.turnP = 0; w.state = 'pause'; w.t = 0; w.text = '';
          w.pauseDur = (0.25 + w.R[20] * 0.45) * Math.max(0.3, 1 - 0.3 * overdrive()) + w.rest;   // + le temps de râler
          w.rest = 0;
        }
      }
      break;
    case 'peek':
      if (anyMoving() && !w.spotted) { w.spotted = true; w.spotAt = w.t; w.peekDur = Math.min(w.peekDur, w.t + 0.1); }   // il t'a vu bouger
      if (!w.hopSaid && w.t >= w.peekDur - Voice.lead) { w.hopSaid = true; if (Voice.active()) Voice.say(SAY.hop, w.type === 'moon'); }
      if (w.t >= w.peekDur) {
        w.state = 'hop'; w.t = 0; w.text = S.chantW().hop; w.textKind = 'trigger'; w.textT = S.gtime; w.bump = 1; Sound.hop();
      }
      break;
    case 'hop':
      w.turnP = lerp(PEEK_P, 1, clamp(w.t / HOP_DUR, 0, 1));
      if (w.t >= HOP_DUR) {
        w.turnP = 1; w.state = 'look'; w.t = 0; w.second = true; w.textFadeT = S.gtime; w.beat = 0.05;
        w.lookDur = 0.55 + w.R[19] * 0.5;
        lookStart();
      }
      break;
  }
}

// v2.5 — les faux signaux pendant son regard (course infinie) : le recomptage « 1… 2… » (en te regardant : il ment),
// puis il se marre ; ou l'avion avec sa banderole « ALLEZ-Y ! ». Seul le soleil compte : attends le vrai retour.
const RECOUNT = { gap: 0.55, laugh: 1.15 };
function lieStep(w) {
  const lie = w.lie, moon = w.type === 'moon';
  if (!lie.fired) {
    if (w.t < lie.at) return;
    lie.fired = true; lieFirst(lie.type);
    if (lie.type === 'planeGo') { S.startPlane('go', L.planeGo); return; }
  }
  if (lie.type !== 'recount') return;
  const k = w.t - lie.at, n = k < RECOUNT.gap ? 0 : k < RECOUNT.laugh ? 1 : 2;
  if (n === lie.n) return;
  lie.n = n;
  if (n < 2) {
    w.text = String(n + 1); w.textKind = 'recount'; w.textT = S.gtime; w.bump = 1;
    Sound.chant({ kind: 'num', n }, moon); if (Voice.active()) Voice.say(SAY.num[n], moon);
  } else {
    w.text = ''; w.textKind = ''; w.laugh = 1; Sound.laugh();
    S.popup(L.heh, Lt.cx + Lt.R * 1.15, Lt.sunY - Lt.R * 0.2, '#06D6A0', Math.min(Lt.U * 0.05, 24), 0.9);
    Voice.quip(SAY.heh, moon);
  }
}
// La toute première fois qu'on voit un faux signal : une bannière qui l'explique (une seule fois, mémorisée)
function lieFirst(kind) {
  const k = kind === 'planeStop' ? 'planeGo' : kind;     // les deux avions : une seule bannière
  const seen = store.get('lieSeen', []);
  if (seen.includes(k) || S.mode === 'duo') return;
  store.set('lieSeen', seen.concat(k)); S.lieBanner = { kind: k, t: 0 };
}

// Le soleil vient de finir de se retourner : est-ce que tu bouges encore ?
function lookStart() {
  if (S.mode === 'duo') { S.duoLookCheck(true); return; }
  const r = S.runner, w = S.watcher;
  if (r.v > V_EPS) {
    if (w.second) S.caught('hop', (w.spotted ? Math.max(0, w.peekPlan - w.spotAt) + HOP_DUR : 0) + w.lookDur);   // il fallait attendre tout ça
    else if (S.pressing) S.caught('running', w.turnDur);       // tu courais encore « turnDur » s après SOLEIL
    else S.caught('late', r.v / r.dec);                      // temps qu'il te restait pour t'arrêter
    return;
  }
  S.RS.looks++;
  if (w.second) { checkMissions(); return; }   // second regard du faux dos : pas de combo
  const since = r.v > 0 ? 0 : S.runT - r.stopT;
  if (since < CLOSE) {                                     // « OUF ! » : arrêté au tout dernier moment
    S.combo++; S.RS.oufs++; S.RS.combo = Math.max(S.RS.combo, S.combo);
    addStars(S.combo);
    Sound.ouf(S.combo); vibrate(18);
    S.popup(S.combo > 1 ? `${L.ouf} ×${S.combo}` : L.ouf, Lt.cx, Lt.yFeet - Lt.s * 1.8, S.combo > 2 ? '#FFD166' : '#FFFFFF', Math.min(Lt.U * (0.07 + 0.006 * S.combo), 46), 1.0);
    let extra = 0;
    if (S.star && S.star.taken && S.star.cycle === S.cycleN && !S.star.doubled) {   // étoile + OUF sur le même regard : bonus doublé
      S.star.doubled = true; extra = S.star.pts; addStars(extra); Sound.doubled(); vibrate([20, 40, 20]);
      S.popup(L.starDouble, Lt.cx, Lt.hy + (Lt.yFeet - Lt.hy) * 0.32, '#FFD166', S.fit(L.starDouble, Math.min(Lt.U * 0.09, 48), S.W * 0.9), 1.4);
      S.sparks(24, Lt.cx, Lt.hy + (Lt.yFeet - Lt.hy) * 0.32, '#FFD166');
    }
    S.starPop(S.combo + extra);
    S.sparks(10 + S.combo * 3, Lt.cx, Lt.yFeet - Lt.s * 1.2, '#FFF3B0');
  } else { S.combo = 0; }
  checkMissions();
}

function bossBeaten() {
  const w = S.watcher, k = w.boss;
  w.boss = 0; w.rest = BOSS_REST;                         // petite pause : le boss râle
  S.RS.bosses++;
  Voice.quip(SAY.bossBeaten, w.type === 'moon');
  addStars(5);
  S.popup(L.bossWin, Lt.cx, Lt.hy + (Lt.yFeet - Lt.hy) * 0.3, '#FFD166', S.fit(L.bossWin, Math.min(Lt.U * 0.1, 54), S.W * 0.9), 1.6);
  S.starPop(5);
  S.confetti(45); Sound.record(); vibrate(40);
  const m = MEDALS[(k - 1) % 4];
  if (k <= 4 && !S.medals.includes(m.id)) { S.medals.push(m.id); store.set('medals', S.medals); S.toast(L.medalToast(m.e, tr(m))); }
  checkMissions();
}

Object.assign(S, { updateWatcher, lookStart, bossBeaten });
})(window.Soleil);
