/* levels/world4.js — Monde 4 « La montagne » (v2.6) : 8 niveaux, dont un boss. Les nouveautés : LE SOL QUI GLISSE
   (la descente et le verglas, déjà connus de la course infinie, arrivent dans les niveaux), LES LUGES à l'arrivée
   (une de moins que d'enfants, comme les transats de la plage) et LE LAC GELÉ (derrière un nuage, on lit le soleil
   dans son reflet sur la glace du lac). Le reste : les pièges qu'on connaît déjà (mondes 1 à 3).
   Chaque niveau n'apporte qu'UNE nouveauté. Pas de chant express ni de bégaiement là où il y a du verglas : on n'aurait
   pas le temps de s'arrêter, même en lâchant dès le « 3 » (docs/WORLD4_DESIGN.md).
   slope / ice : [début, fin] en mètres, posés à la main (le sol glissant se voit de loin : chevrons, plaques bleues).
   Le format est expliqué dans levels/README.md ; les réglages ont été ajustés avec tools/simulate.js (docs/LEVELS.md). */
(function (S) {
'use strict';
const kid = (id, over) => Object.assign({}, S.KIDS[id], over || {});   // les enfants de la cour (levels/world1.js)
const T = (fr, en) => ({ fr, en });

S.addWorld(4, [
  // 1 ---------------------------------------------------------------------------------------------
  { id: 'w4-1', emoji: '⛷️', name: T('La descente', 'Downhill'),
    tip: T('Dans la descente, tu vas plus vite… mais tu freines mal : lâche dès le « 3 » !', 'Downhill you go faster… but you brake badly: let go at “3”!'),
    length: 150, night: 44, seed: 4101, sky: 0.5,
    slope: [[22, 34], [70, 82], [114, 126]],
    rivals: [kid('tom'), kid('ines'), kid('nino')],
    sun: { word: [0.53, 0.63], turn: [0.62, 0.67], traps: 0.45, double: 0.2, hesitate: 0.3, fakeBack: 0.2,
           tempt: { star: 0.3, fakeRet: 0.25, recount: 0.2, max: 1 } },
    script: {},
    hints: [{ on: 'slope', banner: 'slope' }],
    goal: { type: 'top', n: 2 }, challenge: { type: 'time', s: 36 },
    mechanics: ['hold', 'traps', 'hesitate', 'rivals', 'night', 'slope', 'fakeBack', 'tempt:star', 'tempt:fakeRet', 'tempt:recount'] },

  // 2 ---------------------------------------------------------------------------------------------
  { id: 'w4-2', emoji: '🧊', name: T('Le verglas', 'Ice patches'),
    tip: T('Sur le verglas, tu glisses longtemps : lâche dès le « 3 » !', 'On ice you slide a long way: let go at “3”!'),
    length: 150, night: 44, seed: 4202, sky: 0.7,
    ice: [[26, 33], [62, 69], [98, 105], [128, 135]],
    rivals: [kid('jade'), kid('max'), kid('leo')],
    sun: { word: [0.53, 0.63], turn: [0.61, 0.66], traps: 0.45, double: 0.25, hesitate: 0.25,
           tempt: { fakeRet: 0.3, alarm: 0.3, star: 0.25, max: 1 } },
    script: {},
    hints: [{ on: 'ice', banner: 'ice' }],
    goal: { type: 'top', n: 2 }, challenge: { type: 'time', s: 36 },
    mechanics: ['hold', 'traps', 'hesitate', 'rivals', 'night', 'ice', 'tempt:fakeRet', 'tempt:alarm', 'tempt:star'] },

  // 3 ---------------------------------------------------------------------------------------------
  { id: 'w4-3', emoji: '🛷', name: T('Les luges', 'The sleds'),
    tip: T('Il y a une luge de moins que d’enfants : le dernier arrivé a perdu !', 'One sled fewer than kids: the last one in loses!'),
    length: 150, chairs: 3, night: 46, seed: 4303, sky: 0.9,
    slope: [[30, 41], [100, 111]], ice: [[66, 73]],
    rivals: [kid('jade'), kid('sam', { z0: 10 }), kid('ines', { z0: 16 })],   // trois « réguliers » qui ne glissent pas, deux partis devant
    sun: { word: [0.52, 0.62], turn: [0.605, 0.655], traps: 0.45, double: 0.2, hesitate: 0.3, fakeBack: 0.2,
           tempt: { star: 0.3, recount: 0.3, fakeRet: 0.2, max: 1 } },
    script: {},
    hints: [{ on: 'start', text: T('Attrape une luge ! 🛷', 'Grab a sled! 🛷'), pop: true }],
    goal: { type: 'top', n: 2 }, challenge: { type: 'time', s: 36 },
    mechanics: ['hold', 'traps', 'hesitate', 'rivals', 'chairs', 'night', 'slope', 'ice', 'fakeBack', 'tempt:star', 'tempt:recount', 'tempt:fakeRet'] },

  // 4 ---------------------------------------------------------------------------------------------
  { id: 'w4-4', emoji: '❄️', name: T('Le lac gelé', 'The frozen lake'),
    tip: T('Un nuage cache le soleil : regarde son reflet sur le lac gelé !', 'A cloud hides the sun: watch his reflection on the frozen lake!'),
    length: 145, night: 46.5, seed: 4404, sky: 1.2,
    ice: [[40, 47], [90, 97], [124, 130]],
    rivals: [kid('leo'), kid('nino'), kid('lila')],
    sun: { word: [0.52, 0.62], turn: [0.645, 0.695], traps: 0.4, double: 0.2, cloud: 0.5, fakeBack: 0.35, tempt: { star: 0.25, fakeRet: 0.2, max: 1 } },
    script: { 1: { cloud: true }, 2: { cloud: true, fakeBack: true } },
    hints: [{ on: 'cloud', banner: 'cloud' }],
    goal: { type: 'quick', n: 2 }, challenge: { type: 'time', s: 38 },
    mechanics: ['hold', 'traps', 'rivals', 'night', 'ice', 'cloud', 'fakeBack', 'tempt:star', 'tempt:fakeRet'] },

  // 5 ---------------------------------------------------------------------------------------------
  { id: 'w4-5', emoji: '🚩', name: T('Le slalom', 'The slalom'),
    tip: T('Descentes et verglas, l’un après l’autre… et une luge de moins que d’enfants !', 'Slopes and ice, one after the other… and one sled fewer than kids!'),
    length: 145, chairs: 4, night: 47.5, seed: 4505, sky: 1.4,
    slope: [[16, 27], [84, 95]], ice: [[48, 54], [116, 122]],
    rivals: [kid('jade'), kid('sam', { z0: 8 }), kid('ines', { z0: 14 }), kid('tom', { z0: 22 })],
    sun: { word: [0.51, 0.61], turn: [0.62, 0.67], traps: 0.5, double: 0.3, hesitate: 0.25, planeStop: 0.2, fakeBack: 0.25,
           tempt: { alarm: 0.35, recount: 0.35, planeGo: 0.2, star: 0.25, fakeRet: 0.25, max: 2 } },
    script: {},
    hints: [],
    goal: { type: 'top', n: 3 }, challenge: { type: 'time', s: 39 },
    mechanics: ['hold', 'traps', 'hesitate', 'rivals', 'chairs', 'night', 'slope', 'ice', 'plane', 'fakeBack', 'tempt:alarm', 'tempt:recount', 'tempt:planeGo', 'tempt:star', 'tempt:fakeRet'] },

  // 6 ---------------------------------------------------------------------------------------------
  { id: 'w4-6', emoji: '🏠', name: T('Le chalet', 'The chalet'),
    tip: T('Nuages, verglas, faux dos : garde ton sang-froid jusqu’au chalet !', 'Clouds, ice, fake backs: keep your cool all the way to the chalet!'),
    length: 145, night: 47.5, seed: 4606, sky: 1.65,
    slope: [[20, 31], [84, 95]], ice: [[50, 57], [112, 118]],
    rivals: [kid('zoe'), kid('hugo'), kid('ines')],
    sun: { word: [0.51, 0.61], turn: [0.6, 0.65], traps: 0.45, double: 0.3, hesitate: 0.25, cloud: 0.3, fakeBack: 0.3,
           tempt: { recount: 0.35, sneeze: 0.25, fakeRet: 0.25, star: 0.2, max: 2 } },
    script: {},
    hints: [],
    goal: { type: 'top', n: 2 }, challenge: { type: 'time', s: 39 },
    mechanics: ['hold', 'traps', 'hesitate', 'rivals', 'night', 'slope', 'ice', 'cloud', 'fakeBack', 'tempt:recount', 'tempt:sneeze', 'tempt:fakeRet', 'tempt:star'] },

  // 7 ---------------------------------------------------------------------------------------------
  { id: 'w4-7', emoji: '🏂', name: T('La grande course de la montagne', 'The big mountain race'),
    tip: T('5 rivaux, 5 luges, des pentes et du verglas. Ne suis personne !', '5 rivals, 5 sleds, slopes and ice. Follow nobody!'),
    length: 145, chairs: 5, night: 49, seed: 4707, sky: 2.0,
    slope: [[18, 29], [78, 89]], ice: [[48, 55], [110, 117]],
    rivals: [kid('ines', { z0: 8 }), kid('sam', { z0: 14 }), kid('jade', { z0: 20 }), kid('leo', { z0: 24 }), kid('max')],
    sun: { word: [0.5, 0.6], turn: [0.595, 0.645], traps: 0.45, double: 0.3, hesitate: 0.25, cloud: 0.25, planeStop: 0.15, fakeBack: 0.25,
           tempt: { herd: 0.35, alarm: 0.3, recount: 0.3, planeGo: 0.15, star: 0.2, fakeRet: 0.2, max: 2 } },
    script: { 2: { tempt: ['herd'] } },
    hints: [],
    goal: { type: 'top', n: 3 }, challenge: { type: 'time', s: 40 },
    mechanics: ['hold', 'traps', 'hesitate', 'rivals', 'chairs', 'night', 'slope', 'ice', 'cloud', 'plane', 'fakeBack',
                'tempt:herd', 'tempt:alarm', 'tempt:recount', 'tempt:planeGo', 'tempt:star', 'tempt:fakeRet'] },

  // 8 : BOSS --------------------------------------------------------------------------------------
  { id: 'w4-8', emoji: '❄️', boss: true, bossKind: 'neiges', name: T('Le Soleil des Neiges', 'The Snow Sun'),
    tip: T('Bonnet à pompon et masque de ski : il fait glisser tout le monde !', 'Bobble hat and ski goggles: he makes everyone slip!'),
    length: 150, night: 57, seed: 4808, sky: 2.3,
    slope: [[16, 28], [56, 68], [96, 108]], ice: [[36, 44], [76, 84], [116, 124], [134, 142]],
    rivals: [kid('ines'), kid('hugo'), kid('nino')],
    sun: { word: [0.49, 0.58], turn: [0.58, 0.63], look: [1.3, 2.0], pause: [0.45, 0.85], traps: 0.45, double: 0.3, hesitate: 0.3,
           cloud: 0.3, planeStop: 0.15, fakeBack: 0.35, tempt: { recount: 0.35, alarm: 0.3, herd: 0.3, star: 0.3, fakeRet: 0.3, sneeze: 0.2, max: 2 } },
    script: {                                                       // ses coups spéciaux, dans l'ordre
      1: { cloud: true, tempt: ['fakeRet'], move: T('LE NUAGE DE NEIGE', 'THE SNOW CLOUD') },
      2: { traps: 2, hes: true, tempt: ['star'], move: T('L’AVALANCHE DE PIÈGES', 'TRAP AVALANCHE') },
      3: { tempt: ['recount', 'fakeRet'], move: T('LE RECOMPTAGE GLACÉ', 'THE ICY RECOUNT') },
      4: { tempt: ['herd', 'star'], move: T('LE TROUPEAU DE SKIEURS', 'THE SKIER HERD') },
      5: { express: true, turn: 0.8, tempt: ['sneeze', 'star'], move: T('LA DESCENTE EXPRESS', 'THE EXPRESS RUN') },   // express, mais un demi-tour long : sur la glace, on a le temps de freiner si on lâche dès le « 3 »
      6: { cloud: true, fakeBack: true, tempt: ['alarm', 'star', 'fakeRet'], move: T('CACHE-CACHE', 'HIDE AND SEEK') }
    },
    hints: [],
    goal: { type: 'top', n: 2 }, challenge: { type: 'time', s: 48 },
    mechanics: ['hold', 'traps', 'hesitate', 'express', 'rivals', 'night', 'slope', 'ice', 'cloud', 'plane', 'fakeBack', 'tempt:*', 'boss'] }
]);
})(window.Soleil);
