/* js/main.js — Boucle de jeu (update) et démarrage */
(function (S) {
'use strict';
const { SLOPE_TILT, STAR_R, store, computePalette, audioOK, Sound, Voice, resize, viewZ, anyMoving, patchAt,
  updateWatcher, updateRunner, catchStar, updateCaught, updateProgress, updateTrapWatch, updateParticles, render,
  refreshMute, tickHome, updateDuo } = S;   // déjà chargés

/* ---------- 18. Boucle de mise à jour ---------- */
function update(dt) {
  S.gtime += dt;
  S.timeScale += (1 - S.timeScale) * Math.min(1, dt * 2.5);
  const sdt = dt * S.timeScale;
  if (S.state === 'play') {
    S.runT += sdt;
    updateRunner(sdt);
    if (S.star && !S.star.taken && !S.star.gone && S.runner.z >= S.star.z - STAR_R) catchStar();   // en passant dessus
    updateWatcher(sdt);
    if (S.state === 'play') { updateTrapWatch(); updateProgress(); }
  } else if (S.state === 'caught' || S.state === 'over') {
    updateCaught(dt);
  } else if (S.state === 'duo' && S.duo) {
    updateDuo(dt);
  } else if (S.state === 'level') {
    S.Levels.update(dt);                                       // mode Niveaux (modes/levels.js)
  }
  animWatcher(dt);
  computePalette(viewZ());
  if (S.state === 'level') S.tintLevel();                      // couleurs du monde du niveau (cour, parc…)
  updateParticles(dt);
  S.shake *= Math.exp(-dt * 9);
  S.flash *= Math.exp(-dt * 5);
  const w = S.watcher;
  const target = w.state === 'caught' ? 1 : (w.state === 'turn' || w.state === 'look' || w.state === 'return' || w.state === 'hop') ? w.turnP
               : w.state === 'peek' ? 0.55 : 0;
  S.lookAmt += (target - S.lookAmt) * Math.min(1, dt * 14);
  if (S.phaseTitle && (S.phaseTitle.t += dt) > 2.6) S.phaseTitle = null;
  if (S.bossBanner && (S.bossBanner.t += dt) > 1.8) S.bossBanner = null;
  if (S.trapBanner && (S.trapBanner.t += dt) > 2.4) S.trapBanner = null;
  if (S.cloudBanner && (S.cloudBanner.t += dt) > 2.4) S.cloudBanner = null;
  if (S.star && S.star.gone && (S.star.gone += dt) > 0.35) S.star = null;
  // Nuage : seulement si le joueur entend le jeu (sinon il ne vient pas, ou s'efface et laisse voir le texte)
  const runCloud = w.cloud && audioOK() && (S.state === 'play') && (w.state === 'chant' || w.state === 'turn' || (w.state === 'look' && !w.second));
  // v2.5 — niveaux : le nuage reste jusqu'au vrai retour (le « ding »), faux dos compris ; le texte du chant reste
  // affiché (pas de voix dans les niveaux) et le reflet dans l'eau montre le soleil (render/lies.js)
  const lvCloud = w.cloud && S.state === 'level' && S.Levels.phase === 'play' && (w.state === 'chant' || w.state === 'turn'
    || w.state === 'look' || w.state === 'peek' || w.state === 'hop' || (w.state === 'return' && w.retTo > 0));
  const cloudOn = runCloud || lvCloud;
  S.cloudK += ((cloudOn ? 1 : 0) - S.cloudK) * Math.min(1, dt * (cloudOn ? 3.2 : 5));
  if (runCloud && !w.cloudSnd) { w.cloudSnd = true; Sound.cloud(); }
  if (runCloud && !S.cloudSeen && S.cloudK > 0.3) { S.cloudSeen = true; store.set('cloudSeen', true); S.cloudBanner = { t: 0 }; }
  S.updatePlane(dt);                                           // v2.5 : l'avion menteur traverse le ciel
  // Descente : l'horizon descend un peu
  const onSlope = S.mode !== 'duo' && S.mode !== 'level' && (patchAt(S.runner.z) === 'slope' || patchAt(S.runner.z + 4) === 'slope');
  S.tilt += ((onSlope ? 1 : 0) - S.tilt) * Math.min(1, dt * 3);
  S.tiltPx = S.tilt * S.H * SLOPE_TILT;
  if (S.state !== 'play') Sound.wind(0);
  tickHome();
}

function animWatcher(dt) {
  const w = S.watcher;
  w.rayA += dt * (w.state === 'chant' ? (w.boss ? 1.4 : 0.55) : (w.state === 'look' || w.state === 'caught') ? 0.05 : 0.18);
  w.bump *= Math.exp(-dt * 9);
  w.laugh *= Math.exp(-dt * 3);
  const moving = anyMoving() || w.angry || S.gtime < w.angryUntil;
  let tx = 0, ty = 0.15, tl = 0;
  if (w.state === 'peek') { tx = -0.9; ty = 0.5; tl = 0.3; }                // il te guette du coin de l'œil
  else if (w.state === 'look' || w.state === 'caught' || w.state === 'hop' || (w.state === 'turn' && w.turnP > 0.5)) {
    if (moving) { ty = 0.9; }                                              // il te fixe
    else { tx = Math.sin(S.gtime * 1.7) * 0.85; ty = 0.45; tl = 0.38; }      // il scrute, l'œil plissé
  }
  const k = Math.min(1, dt * (moving ? 22 : 7));
  w.eyeX += (tx - w.eyeX) * k; w.eyeY += (ty - w.eyeY) * k;
  if (w.shut) tl = 1;                                                       // monde 2 : il éternue, les yeux fermés… mais il te regarde
  w.lid += (tl - w.lid) * Math.min(1, dt * (w.shut ? 18 : 10));
}


/* ---------- 29. C'est parti ---------- */
// PAS FIXE : le jeu avance toujours par pas de 1/120 s, quelle que soit la fluidité de l'écran (30, 60, 120 images/s).
// Un téléphone lent fait plusieurs pas par image ; un écran à 120 Hz en fait un. Les mêmes appuis donnent donc
// exactement la même partie partout : on n'est jamais grillé à cause des saccades. (Testé : test_poki.py, test 26.)
const STEP = 1 / 120;
const MAX_STEPS = 12;                               // au plus 0,1 s rattrapée d'un coup (après un gros ralentissement)
S.last = performance.now(); S.acc = 0;
function frame(now) {
  const raw = now - S.last;
  S.last = now;
  S.qualityTick(raw);                               // qualité d'image automatique (js/render/quality.js)
  let dt = raw / 1000;
  if (!(dt > 0)) dt = 0;
  if (dt > MAX_STEPS * STEP) dt = MAX_STEPS * STEP;  // évite les sauts après un ralentissement
  if (S.halted()) {                                 // pause ou pub : le monde est figé (on redessine seulement si l'écran a changé)
    S.acc = 0;
    if (S.dirty) { S.dirty = false; render(); }
  } else if (S.grace > 0) {                         // reprise : 1 s de grâce, le monde reste figé, l'anneau se remplit
    S.acc = 0;
    S.grace = Math.max(0, S.grace - dt);
    render();
  } else {
    S.acc += dt;
    while (S.acc >= STEP - 1e-9) { update(STEP); S.acc -= STEP; }
    render();
  }
  S.syncGameplay();                                 // gameplayStart / gameplayStop si « en jeu » a changé
  S.syncButtons();
  requestAnimationFrame(frame);
}
resize();
computePalette(0);
Voice.init();
refreshMute();
S.boot();                                           // le titre tout de suite, pendant que le SDK Poki s'initialise
requestAnimationFrame(frame);


Object.assign(S, { update, animWatcher, frame });
})(window.Soleil);
