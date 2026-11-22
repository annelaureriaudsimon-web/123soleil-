/* js/render/quality.js — Qualité d'image automatique (téléphones lents).
   Le jeu mesure sa fluidité (moyenne glissante du temps entre deux images) et baisse la qualité s'il ralentit,
   puis la remonte si tout va bien, avec une marge et un délai pour ne pas faire de va-et-vient.
   Le changement attend un moment CALME (jamais pendant que le soleil se retourne ou regarde).
   Ce qui baisse, du plus efficace au moins efficace : la résolution du canvas (devicePixelRatio limité), le nombre
   de particules et de confettis, la distance du décor (arbres, bancs, fleurs au loin).
   Ce qui ne baisse JAMAIS : tout ce qui sert à jouer (le soleil et son visage, le texte du chant, le coureur,
   les rivaux, les tentations, l'œil du faux dos) : ils ne dépendent pas de ce fichier.
   Réglage du joueur (menu pause) : Auto (par défaut) / Haute / Basse, mémorisé (soleil.quality).
   La logique du jeu ne dépend pas de la qualité ni de la fluidité : pas fixe de 1/120 s (js/main.js). */
(function (S) {
'use strict';
const { store } = S;   // déjà chargés

// ---------- Réglages ----------
const LEVELS = [                                  // 0 = haute, 1 = moyenne, 2 = basse
  { name: 'high',   dpr: 2,   particles: 1,    pmax: 320, decor: 1 },
  { name: 'medium', dpr: 1.5, particles: 0.65, pmax: 200, decor: 0.78 },
  { name: 'low',    dpr: 1,   particles: 0.4,  pmax: 110, decor: 0.58 }
];
const SLOW_MS = 23;            // plus de 23 ms par image en moyenne (moins de ~43 images/s) : on baisse
const FAST_MS = 15;            // moins de 15 ms (plus de ~66 images/s) : on peut remonter
const SLOW_FOR = 1.5;          // s : lent pendant 1,5 s d'affilée avant de baisser
const FAST_FOR = 8;            // s : rapide pendant 8 s d'affilée avant de remonter (prudent)
const COOLDOWN = 4;            // s : après un changement, on attend avant d'en refaire un
const EMA = 0.08;              // poids d'une image dans la moyenne glissante

const MODES = ['auto', 'high', 'low'];
const Q = {
  mode: MODES.includes(store.get('quality', 'auto')) ? store.get('quality', 'auto') : 'auto',
  level: 0, avg: 16.7, slowT: 0, fastT: 0, cool: 0, pending: null, changes: 0,
  get cur() { return LEVELS[this.level]; },
  get particles() { return LEVELS[this.level].particles; },
  get pmax() { return LEVELS[this.level].pmax; },
  get decor() { return LEVELS[this.level].decor; },
  get fps() { return 1000 / this.avg; }
};
if (Q.mode === 'low') Q.level = 2;
S.Q = Q;

// La résolution du canvas : devicePixelRatio de l'appareil, plafonné par la qualité
const dprFor = () => Math.max(1, Math.min(window.devicePixelRatio || 1, LEVELS[Q.level].dpr));

// Un moment calme : le soleil ne se retourne pas, ne regarde pas, personne n'est grillé
function calm() {
  if (S.paused || S.state === 'title' || S.state === 'map' || S.state === 'over') return true;
  const w = S.watcher;
  if (!w) return true;
  if (S.state === 'caught' || S.lvCaught) return false;
  return !(w.state === 'turn' || w.state === 'look' || w.state === 'peek' || w.state === 'hop' || w.state === 'return');
}
function apply(level) {
  if (level === Q.level) return;
  Q.level = level; Q.changes++;
  Q.cool = COOLDOWN; Q.slowT = 0; Q.fastT = 0; Q.pending = null;
  if (S.particles && S.particles.length > Q.pmax) S.particles.length = Q.pmax;
  if (S.resize) S.resize();                        // nouvelle résolution du canvas
}
// Appelée à chaque image avec le VRAI temps écoulé (ms), avant tout plafonnement
function tick(ms) {
  if (!(ms > 0) || ms > 250) return;               // onglet en arrière-plan, pause du navigateur : on ignore
  Q.avg += (ms - Q.avg) * EMA;
  const dt = ms / 1000;
  if (Q.cool > 0) { Q.cool -= dt; return; }
  if (Q.mode !== 'auto') return;
  if (Q.avg > SLOW_MS && Q.level < LEVELS.length - 1) { Q.slowT += dt; Q.fastT = 0; if (Q.slowT >= SLOW_FOR) Q.pending = Q.level + 1; }
  else if (Q.avg < FAST_MS && Q.level > 0) { Q.fastT += dt; Q.slowT = 0; if (Q.fastT >= FAST_FOR) Q.pending = Q.level - 1; }
  else { Q.slowT = Math.max(0, Q.slowT - dt); Q.fastT = Math.max(0, Q.fastT - dt); }
  if (Q.pending != null && calm()) apply(Q.pending);
}
// Le réglage du joueur : Auto → Haute → Basse → Auto…
function cycleMode() {
  Q.mode = MODES[(MODES.indexOf(Q.mode) + 1) % MODES.length];
  store.set('quality', Q.mode);
  Q.pending = null; Q.slowT = 0; Q.fastT = 0; Q.cool = COOLDOWN;
  apply(Q.mode === 'low' ? 2 : 0);
  return Q.mode;
}

Object.assign(S, { dprFor, qualityTick: tick, cycleQuality: cycleMode, applyQuality: apply });
})(window.Soleil);
