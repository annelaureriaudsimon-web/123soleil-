/* levels/world3.js — Monde 3 « La plage » (v2.5) : 8 niveaux, dont un boss. Les nouveautés : LA PRESSION
   (les transats, la glace qui fond) et LES FAUX SIGNAUX (l'avion menteur, le reflet dans l'eau).
   Chaque niveau n'apporte qu'UNE nouveauté ; les autres reprennent ce qu'on connaît déjà (mondes 1 et 2).
   Le format est expliqué dans levels/README.md ; le design dans docs/WORLD3_DESIGN.md ; les réglages ont été
   ajustés avec tools/simulate.js (docs/LEVELS.md). */
(function (S) {
'use strict';
const kid = (id, over) => Object.assign({}, S.KIDS[id], over || {});   // les enfants de la cour (levels/world1.js)
const T = (fr, en) => ({ fr, en });

S.addWorld(3, [
  // 1 ---------------------------------------------------------------------------------------------
  { id: 'w3-1', emoji: '🏖️', name: T('Les transats', 'The deckchairs'),
    tip: T('Il y a un transat de moins que d’enfants : le dernier arrivé a perdu !', 'One deckchair fewer than kids: the last one in loses!'),
    length: 150, chairs: 3, night: 42, seed: 3101, sky: 0.5,   // la nuit est large : ce sont les transats qui pressent
    rivals: [kid('ines'), kid('jade', { z0: 10 }), kid('sam', { z0: 18 })],   // trois « réguliers », deux partis devant
    sun: { word: [0.53, 0.63], turn: [0.56, 0.61], traps: 0.4, hesitate: 0.3, fakeBack: 0.2,
           tempt: { star: 0.4, recount: 0.35, fakeRet: 0.25, max: 1 } },
    script: {},
    hints: [{ on: 'start', text: T('Prends un transat ! 🏖️', 'Grab a deckchair! 🏖️'), pop: true }],
    goal: { type: 'top', n: 2 }, challenge: { type: 'time', s: 34 },
    mechanics: ['hold', 'traps', 'hesitate', 'rivals', 'chairs', 'night', 'fakeBack', 'tempt:star', 'tempt:recount', 'tempt:fakeRet'] },

  // 2 ---------------------------------------------------------------------------------------------
  { id: 'w3-2', emoji: '🍦', name: T('La glace qui fond', 'The melting ice cream'),
    tip: T('Ta glace fond : chaque boule qui reste à l’arrivée vaut une étoile !', 'Your ice cream is melting: every scoop left at the finish is a star!'),
    length: 150, night: 35.5, scoops: 12, melt: 4, seed: 3202, sky: 0.7,
    rivals: [kid('jade'), kid('tom'), kid('nino')],
    sun: { word: [0.53, 0.63], turn: [0.56, 0.61], traps: 0.4, double: 0.25, hesitate: 0.2, tempt: { fakeRet: 0.35, alarm: 0.3, star: 0.3, max: 1 } },
    script: {},
    hints: [{ on: 'start', text: T('Vite, avant qu’elle fonde ! 🍦', 'Hurry, before it melts! 🍦'), pop: true }],
    goal: { type: 'scoops', n: 4 }, challenge: { type: 'scoops', n: 5 },
    mechanics: ['hold', 'traps', 'hesitate', 'rivals', 'night', 'scoops', 'tempt:fakeRet', 'tempt:alarm', 'tempt:star'] },

  // 3 ---------------------------------------------------------------------------------------------
  { id: 'w3-3', emoji: '✈️', name: T('L’avion menteur', 'The lying plane'),
    tip: T('Un avion passe avec une banderole… Seul le soleil compte !', 'A plane flies by with a banner… Only the sun counts!'),
    length: 150, night: 35.5, seed: 3303, sky: 0.9,
    rivals: [kid('max'), kid('lila'), kid('sam')],
    sun: { word: [0.52, 0.62], turn: [0.55, 0.6], traps: 0.4, hesitate: 0.25, planeStop: 0.5, tempt: { planeGo: 0.55, recount: 0.15, max: 1 } },
    script: { 1: { planeStop: true }, 2: { tempt: ['planeGo'] } },
    hints: [],
    goal: { type: 'top', n: 2 }, challenge: { type: 'time', s: 36 },
    mechanics: ['hold', 'traps', 'hesitate', 'rivals', 'night', 'plane', 'tempt:planeGo', 'tempt:recount'] },

  // 4 ---------------------------------------------------------------------------------------------
  { id: 'w3-4', emoji: '🏐', name: T('Le volley de plage', 'Beach volleyball'),
    tip: T('4 rivaux, 4 transats… et des avions menteurs. Ne sois pas le dernier !', '4 rivals, 4 deckchairs… and lying planes. Don’t be last!'),
    length: 155, chairs: 4, night: 37.5, seed: 3404, sky: 1.2,
    rivals: [kid('ines'), kid('nino'), kid('sam', { z0: 8 }), kid('jade')],
    sun: { word: [0.52, 0.62], turn: [0.55, 0.6], traps: 0.35, stutter: 0.25, planeStop: 0.25,
           tempt: { planeGo: 0.35, alarm: 0.3, star: 0.3, max: 1 } },
    script: {},
    hints: [],
    goal: { type: 'top', n: 3 }, challenge: { type: 'top', n: 1 },
    mechanics: ['hold', 'traps', 'stutter', 'rivals', 'chairs', 'night', 'plane', 'tempt:planeGo', 'tempt:alarm', 'tempt:star'] },

  // 5 ---------------------------------------------------------------------------------------------
  { id: 'w3-5', emoji: '💧', name: T('Le reflet dans l’eau', 'The reflection'),
    tip: T('Un nuage cache le soleil : regarde son reflet dans l’eau !', 'A cloud hides the sun: watch his reflection in the water!'),
    length: 150, night: 42.5, seed: 3505, sky: 1.4,
    rivals: [kid('nino'), kid('leo'), kid('lila')],
    sun: { word: [0.52, 0.62], turn: [0.55, 0.6], traps: 0.3, cloud: 0.5, fakeBack: 0.4, tempt: { star: 0.25, fakeRet: 0.2, max: 1 } },
    script: { 1: { cloud: true }, 2: { cloud: true, fakeBack: true } },
    hints: [{ on: 'cloud', banner: 'cloud' }],
    goal: { type: 'quick', n: 3 }, challenge: { type: 'time', s: 37 },
    mechanics: ['hold', 'traps', 'rivals', 'night', 'cloud', 'fakeBack', 'tempt:star', 'tempt:fakeRet'] },

  // 6 ---------------------------------------------------------------------------------------------
  { id: 'w3-6', emoji: '🏰', name: T('Le château de sable', 'The sandcastle'),
    tip: T('Nuages, avions, recomptages… et ta glace qui fond !', 'Clouds, planes, recounts… and your ice cream melting!'),
    length: 160, night: 42.8, scoops: 14, melt: 4, seed: 3606, sky: 1.65,
    rivals: [kid('sam'), kid('max'), kid('tom')],
    sun: { word: [0.51, 0.61], turn: [0.55, 0.6], traps: 0.35, double: 0.2, hesitate: 0.25, cloud: 0.3, planeStop: 0.2, fakeBack: 0.25,
           tempt: { recount: 0.35, planeGo: 0.2, sneeze: 0.15, max: 1 } },
    script: {},
    hints: [],
    goal: { type: 'scoops', n: 5 }, challenge: { type: 'scoops', n: 6 },
    mechanics: ['hold', 'traps', 'hesitate', 'rivals', 'night', 'scoops', 'cloud', 'plane', 'fakeBack', 'tempt:recount', 'tempt:planeGo', 'tempt:sneeze'] },

  // 7 ---------------------------------------------------------------------------------------------
  { id: 'w3-7', emoji: '🏃', name: T('La grande course de la plage', 'The big beach race'),
    tip: T('5 rivaux, 5 transats, des faux signaux partout. Ne suis personne !', '5 rivals, 5 deckchairs, fake signals everywhere. Follow nobody!'),
    length: 160, chairs: 5, night: 44.5, seed: 3707, sky: 2.0,
    rivals: [kid('ines', { z0: 8 }), kid('max', { z0: 14 }), kid('jade', { z0: 20 }), kid('leo'), kid('zoe')],
    sun: { word: [0.5, 0.6], turn: [0.53, 0.58], traps: 0.35, double: 0.15, hesitate: 0.25, stutter: 0.2, express: 0.2,
           cloud: 0.25, planeStop: 0.2, fakeBack: 0.25, tempt: { herd: 0.35, alarm: 0.3, recount: 0.25, planeGo: 0.2, star: 0.2, max: 1 } },
    script: { 2: { tempt: ['herd'] } },
    hints: [],
    goal: { type: 'top', n: 3 }, challenge: { type: 'first' },
    mechanics: ['hold', 'traps', 'hesitate', 'stutter', 'express', 'rivals', 'chairs', 'night', 'cloud', 'plane', 'fakeBack',
                'tempt:herd', 'tempt:alarm', 'tempt:recount', 'tempt:planeGo', 'tempt:star'] },

  // 8 : BOSS --------------------------------------------------------------------------------------
  { id: 'w3-8', emoji: '🏖️', boss: true, bossKind: 'vacancier', name: T('Le Soleil Vacancier', 'The Holiday Sun'),
    tip: T('Chapeau de paille et lunettes en cœur : il veut garder la plage pour lui !', 'Straw hat and heart shades: he wants the beach all to himself!'),
    length: 165, night: 48, scoops: 16, melt: 4, seed: 3808, sky: 2.3,
    rivals: [kid('ines'), kid('hugo'), kid('nino')],
    sun: { word: [0.49, 0.58], turn: [0.54, 0.59], look: [1.3, 2.0], pause: [0.45, 0.85], traps: 0.35, double: 0.2, hesitate: 0.25, express: 0.2,
           cloud: 0.25, planeStop: 0.2, fakeBack: 0.25, tempt: { recount: 0.25, planeGo: 0.2, alarm: 0.2, star: 0.2, fakeRet: 0.2, max: 2 } },
    script: {                                                       // ses coups spéciaux, dans l'ordre
      1: { tempt: ['planeGo'], move: T('L’AVION PUBLICITAIRE', 'THE BANNER PLANE') },
      2: { cloud: true, fakeBack: true, move: T('LA SIESTE AU SOLEIL', 'THE SUNNY NAP') },
      3: { tempt: ['recount'], traps: 1, move: T('LE RECOMPTAGE', 'THE RECOUNT') },
      4: { planeStop: true, tempt: ['alarm'], move: T('LA FAUSSE ALERTE', 'THE FALSE ALARM') },
      5: { express: true, tempt: ['star', 'fakeRet'], move: T('EXPRESS DES VACANCES', 'HOLIDAY EXPRESS') },
      6: { cloud: true, tempt: ['recount'], move: T('TOUT EN MÊME TEMPS', 'EVERYTHING AT ONCE') }
    },
    hints: [],
    goal: { type: 'scoops', n: 5 }, challenge: { type: 'first' },
    mechanics: ['hold', 'traps', 'hesitate', 'express', 'rivals', 'night', 'scoops', 'cloud', 'plane', 'fakeBack', 'tempt:*', 'boss'] }
]);
})(window.Soleil);
