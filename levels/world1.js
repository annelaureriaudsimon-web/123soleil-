/* levels/world1.js — Monde 1 « La cour de récré » : 8 niveaux courts, dont un boss.
   Le format d'un niveau est expliqué dans levels/README.md. Les réglages ont été ajustés avec tools/simulate.js
   (résultats dans docs/LEVELS.md). Mécaniques de ce monde : maintenir/lâcher, mots pièges, hésitations,
   bégaiement, chant express et rivaux. Rien d'autre (la suite arrive dans les mondes 2 à 5). */
(function (S) {
'use strict';

// ---------- Les enfants de la cour (rivaux) ----------
// kind : prudent 🐢 · fonceur ⚡ · regulier 🎯 (game/rivals.js). look : une tenue du jeu + d'autres couleurs.
const KIDS = {
  leo:  { id: 'leo', name: 'Léo', kind: 'prudent', look: { outfit: 'cap', body: '#06D6A0', hatC: '#FFFFFF', shoes: '#FFFFFF' } },
  zoe:  { id: 'zoe', name: 'Zoé', kind: 'prudent', look: { outfit: 'tennis', stripe: '#7B2CBF', hatC: '#7B2CBF', wrist: '#7B2CBF', hair: '#2B1B12' } },
  hugo: { id: 'hugo', name: 'Hugo', kind: 'fonceur', look: { outfit: 'classic', body: '#FF9F1C', shorts: '#2B2D42', hair: '#2B1B12' } },
  ines: { id: 'ines', name: 'Inès', kind: 'regulier', look: { outfit: 'straw', body: '#9B5DE5', dots: '#FFFFFF', shorts: '#3A3F66', hatC: '#FFD166' } },
  max:  { id: 'max', name: 'Max', kind: 'fonceur', look: { outfit: 'cap', body: '#E63946', hatC: '#2B2D42', shoes: '#FFD166', hair: '#E0B04A' } },
  jade: { id: 'jade', name: 'Jade', kind: 'regulier', look: { outfit: 'classic', body: '#00BBF9', shorts: '#FFFFFF', hair: '#E0B04A' } },
  tom:  { id: 'tom', name: 'Tom', kind: 'prudent', look: { outfit: 'pyjama', body: '#F4A261', shorts: '#F4A261', legs: '#F4A261', hatC: '#F4A261' } },
  lila: { id: 'lila', name: 'Lila', kind: 'prudent', look: { outfit: 'vampire', cape: '#3A0CA3', capeIn: '#F72585', body: '#3A0CA3' } },
  sam:  { id: 'sam', name: 'Sam', kind: 'regulier', look: { outfit: 'dino', body: '#4CC9F0', shorts: '#4CC9F0', legs: '#3AA8CC', shoes: '#277DA1', hair: '#4CC9F0', spikes: '#FFD166' } },
  nino: { id: 'nino', name: 'Nino', kind: 'fonceur', look: { outfit: 'tennis', body: '#FFFFFF', stripe: '#06D6A0', hatC: '#06D6A0', wrist: '#06D6A0', hair: '#5B3A29' } }
};
const kid = (id, over) => Object.assign({}, KIDS[id], over || {});
const T = (fr, en) => ({ fr, en });

S.addWorld(1, [
  // 1 ---------------------------------------------------------------------------------------------
  { id: 'w1-1', emoji: '👟', name: T('Premiers pas', 'First steps'),
    tip: T('Maintiens pour courir. Lâche avant « SOLEIL ! »', 'Hold to run. Let go before “SOLEIL!”'),
    length: 135, seed: 1101, sky: 0.3,
    rivals: [kid('leo'), kid('zoe')],
    sun: { word: [0.62, 0.72], turn: [0.6, 0.66], look: [1.2, 1.7], pause: [0.6, 1.0] },
    script: { 1: { turn: 1.0, look: 1.4 }, 2: { traps: 1 } },          // 1er regard très lent ; mot piège forcé au cycle 2
    hints: [
      { on: 'start', text: T('MAINTIENS pour courir 👆', 'HOLD to run 👆'), until: 'press' },
      { on: 'so', cycle: 1, text: T('LÂCHE !', 'LET GO!'), pop: true },
      { on: 'return', cycle: 1, text: T('Il se remet de dos : REPARS !', 'He turned back: RUN!'), pop: true },
      { on: 'reveal', cycle: 2, banner: 'trap' },
      { on: 'near', text: T('Touche le soleil ! ☀️', 'Touch the sun! ☀️'), pop: true }
    ],
    goal: { type: 'top', n: 2 }, challenge: { type: 'noTrap' },
    mechanics: ['hold', 'traps', 'rivals'] },

  // 2 ---------------------------------------------------------------------------------------------
  { id: 'w1-2', emoji: '😶', name: T('Les hésitations', 'The hesitations'),
    tip: T('Il fait durer le « SOOOO… » : ne repars pas !', 'He stretches the “SOOOO…”: don’t restart!'),
    length: 140, seed: 1202, sky: 0.45,
    rivals: [kid('hugo'), kid('lila')],
    sun: { word: [0.58, 0.68], turn: [0.6, 0.65], hesitate: 0.6, hesLen: [1.0, 1.8], hesOnTrap: 0.35, traps: 0.2 },
    script: { 1: { hes: 1.4 }, 3: { traps: 1, hes: 1.9, hesAt: 0 } },
    hints: [{ on: 'hes', banner: 'hes' }],
    goal: { type: 'top', n: 2 }, challenge: { type: 'time', s: 30 },
    mechanics: ['hold', 'hesitate', 'traps', 'rivals'] },

  // 3 ---------------------------------------------------------------------------------------------
  { id: 'w1-3', emoji: '🥫', name: T('La pluie de pièges', 'Raining traps'),
    tip: T('SOLDES, SOUPE, SOFA… Lis le mot avant de lâcher !', 'SOLDES, SOUPE, SOFA… Read the word before letting go!'),
    length: 150, seed: 1303, sky: 0.6,
    rivals: [kid('jade'), kid('tom'), kid('zoe')],
    sun: { word: [0.55, 0.65], turn: [0.555, 0.605], traps: 0.8, double: 0.45,
           words: ['SOLDES !', 'SOUPE !', 'SOFA !', 'SODA !', 'SOURIS !', 'SORBET !', 'SOLO !', 'SOUCOUPE !', 'SOMBRERO !'] },
    script: { 1: { traps: 2 } },
    hints: [{ on: 'reveal', cycle: 1, banner: 'trap' }],
    goal: { type: 'avoid', n: 3 }, challenge: { type: 'noTrap' },
    mechanics: ['hold', 'traps', 'rivals'] },

  // 4 ---------------------------------------------------------------------------------------------
  { id: 'w1-4', emoji: '⚡', name: T('Le Fonceur', 'The Speedster'),
    tip: T('Max court très vite… mais il se fait griller !', 'Max runs really fast… but he gets toasted!'),
    length: 145, seed: 1404, sky: 1.3,
    rivals: [kid('max', { brain: { speed: 1.18, greed: [0.12, 0.1] } }), kid('leo')],
    sun: { word: [0.54, 0.64], turn: [0.535, 0.585], traps: 0.3, hesitate: 0.2 },
    script: {},
    hints: [{ on: 'start', text: T('Bats Max ! ⚡', 'Beat Max! ⚡'), pop: true }],
    goal: { type: 'beat', who: 'max' }, challenge: { type: 'time', s: 32 },
    mechanics: ['hold', 'traps', 'hesitate', 'rivals'] },

  // 5 ---------------------------------------------------------------------------------------------
  { id: 'w1-5', emoji: '🥴', name: T('Le bégaiement', 'The stutter'),
    tip: T('« 2… 2… 3… » : ne compte pas, écoute !', '“2… 2… 3…”: don’t count, listen!'),
    length: 145, seed: 1505, sky: 1.45,
    rivals: [kid('ines'), kid('tom'), kid('nino')],
    sun: { word: [0.54, 0.64], turn: [0.51, 0.56], stutter: 0.7, stutterRush: 0.6, traps: 0.25 },
    script: { 1: { stutter: true } },
    hints: [{ on: 'stutter', banner: 'stutter' }],
    goal: { type: 'top', n: 2 }, challenge: { type: 'combo', n: 2 },
    mechanics: ['hold', 'stutter', 'traps', 'rivals'] },

  // 6 ---------------------------------------------------------------------------------------------
  { id: 'w1-6', emoji: '🚀', name: T('Le chant express', 'Express chant'),
    tip: T('Tout va deux fois plus vite. Sois prêt !', 'Everything goes twice as fast. Be ready!'),
    length: 130, seed: 1606, sky: 1.6,
    rivals: [kid('sam'), kid('hugo'), kid('lila')],
    sun: { word: [0.52, 0.62], turn: [0.54, 0.59], express: 0.65, traps: 0.25 },
    script: { 1: { express: true } },
    hints: [{ on: 'express', banner: 'express' }],
    goal: { type: 'oufs', n: 2 }, challenge: { type: 'top', n: 1 },
    mechanics: ['hold', 'express', 'traps', 'rivals'] },

  // 7 ---------------------------------------------------------------------------------------------
  { id: 'w1-7', emoji: '🏃', name: T('La grande course', 'The big race'),
    tip: T('5 rivaux, et le soleil mélange tout !', '5 rivals, and the sun mixes everything!'),
    length: 145, seed: 1707, sky: 2.15,
    rivals: [kid('ines'), kid('max'), kid('jade'), kid('leo'), kid('zoe')],
    sun: { word: [0.5, 0.6], turn: [0.5, 0.55], traps: 0.4, double: 0.2, hesitate: 0.3, stutter: 0.3, express: 0.3 },
    script: {},
    hints: [],
    goal: { type: 'top', n: 3 }, challenge: { type: 'first' },
    mechanics: ['hold', 'traps', 'hesitate', 'stutter', 'express', 'rivals'] },

  // 8 : BOSS --------------------------------------------------------------------------------------
  { id: 'w1-8', emoji: '😎', boss: true, name: T('Le Soleil Cool', 'The Cool Sun'),
    tip: T('Il met ses lunettes et sort tous ses coups spéciaux !', 'He puts on his shades and pulls every trick!'),
    length: 180, seed: 1808, sky: 2.35,
    rivals: [kid('ines'), kid('max'), kid('leo')],
    sun: { word: [0.48, 0.56], turn: [0.51, 0.56], look: [1.1, 1.8], pause: [0.45, 0.85],
           traps: 0.5, double: 0.35, hesitate: 0.4, hesLen: [1.0, 2.0], stutter: 0.35, express: 0.45 },
    script: {                                                       // ses coups spéciaux, dans l'ordre
      1: { hes: 2.0, traps: 0, move: T('LA GRANDE HÉSITATION', 'THE BIG HESITATION') },
      2: { traps: 2, hes: false, express: false, move: T('DOUBLE PIÈGE', 'DOUBLE TRAP') },
      3: { express: true, traps: 0, stutter: false, move: T('SUPER EXPRESS', 'SUPER EXPRESS') },
      4: { stutter: true, traps: 1, express: false, move: T('BÉGAIEMENT PIÉGÉ', 'TRAPPED STUTTER') },
      5: { express: true, hes: 1.4, traps: 1, hesAt: 1, move: T('EXPRESS HÉSITANT', 'HESITANT EXPRESS') },
      6: { express: true, traps: 2, move: T('TOUT EN MÊME TEMPS', 'EVERYTHING AT ONCE') }
    },
    hints: [],
    goal: { type: 'oufs', n: 3 }, challenge: { type: 'first' },
    mechanics: ['hold', 'traps', 'hesitate', 'stutter', 'express', 'rivals', 'boss'] }
]);

S.KIDS = KIDS;
})(window.Soleil);
