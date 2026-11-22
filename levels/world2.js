/* levels/world2.js — Monde 2 « Le parc » : 8 niveaux, dont un boss. La nouveauté : LES TENTATIONS.
   Le format est expliqué dans levels/README.md ; le design (règles des tentations, signal du « ding ») dans
   docs/WORLD2_DESIGN.md ; les réglages ont été ajustés avec tools/simulate.js (docs/LEVELS.md).
   Mécaniques de ce monde : tout le monde 1 + tentations + faux dos + boue ; v2.5 : le troupeau (niveau 7), et le recomptage
   et la fausse alerte du monde 1 reviennent ici et là. Rien d'autre. */
(function (S) {
'use strict';
const kid = (id, over) => Object.assign({}, S.KIDS[id], over || {});   // les enfants de la cour (levels/world1.js)
const T = (fr, en) => ({ fr, en });

S.addWorld(2, [
  // 1 ---------------------------------------------------------------------------------------------
  { id: 'w2-1', emoji: '⭐', name: T('L’étoile tentatrice', 'The tempting star'),
    tip: T('Tant qu’il te regarde, NE BOUGE PAS. Attends le « ding » !', 'While he looks at you, DON’T MOVE. Wait for the “ding”!'),
    length: 150, night: 37, seed: 2101, sky: 0.55,
    rivals: [kid('hugo'), kid('zoe')],
    sun: { word: [0.54, 0.64], turn: [0.6, 0.65], traps: 0.2, tempt: { star: 0.6, max: 1 } },
    script: { 1: { tempt: ['star'] } },
    hints: [{ on: 'start', text: T('Attends le « ding » pour repartir 🔔', 'Wait for the “ding” to run again 🔔'), pop: true }],
    goal: { type: 'quick', n: 2 }, challenge: { type: 'first' },
    mechanics: ['hold', 'traps', 'rivals', 'tempt:star'] },

  // 2 ---------------------------------------------------------------------------------------------
  { id: 'w2-2', emoji: '🙃', name: T('Le faux retour', 'The fake turn'),
    tip: T('Il fait semblant de se retourner… « HA ! » Attends le « ding » !', 'He pretends to turn away… “HA!” Wait for the “ding”!'),
    length: 150, night: 37.5, seed: 2202, sky: 0.7,
    rivals: [kid('max'), kid('jade')],
    sun: { word: [0.54, 0.64], turn: [0.6, 0.65], traps: 0.2, tempt: { fakeRet: 0.3, star: 0.2, max: 1 } },
    script: { 1: { tempt: ['fakeRet'] } },
    hints: [],
    goal: { type: 'quick', n: 3 }, challenge: { type: 'time', s: 36 },
    mechanics: ['hold', 'traps', 'rivals', 'tempt:fakeRet', 'tempt:star'] },

  // 3 ---------------------------------------------------------------------------------------------
  { id: 'w2-3', emoji: '🪰', name: T('La mouche et les moqueries', 'The fly and the teasing'),
    tip: T('Il te nargue, une mouche se pose sur toi… Garde ton calme !', 'He teases you, a fly lands on you… Stay calm!'),
    length: 150, night: 37, seed: 2303, sky: 0.9,
    rivals: [kid('nino'), kid('lila'), kid('sam')],
    sun: { word: [0.53, 0.63], turn: [0.57, 0.62], traps: 0.25, hesitate: 0.2, tempt: { fly: 0.5, taunt: 0.6, alarm: 0.2, max: 2 } },
    script: { 1: { tempt: ['fly'] }, 2: { tempt: ['taunt'] } },
    hints: [],
    goal: { type: 'top', n: 2 }, challenge: { type: 'oufs', n: 3 },
    mechanics: ['hold', 'traps', 'hesitate', 'rivals', 'tempt:fly', 'tempt:taunt', 'tempt:alarm'] },

  // 4 ---------------------------------------------------------------------------------------------
  { id: 'w2-4', emoji: '🟤', name: T('Les flaques de boue', 'Mud puddles'),
    tip: T('Dans la boue, on repart au ralenti : garde ton élan !', 'In the mud you restart slowly: keep your speed!'),
    length: 135, night: 41, seed: 2404, sky: 1.2,
    rivals: [kid('max'), kid('ines'), kid('tom')],
    mud: [[12, 21], [40, 48], [66, 76], [95, 103], [120, 130]],
    sun: { word: [0.53, 0.63], turn: [0.55, 0.6], traps: 0.25, tempt: { star: 0.5, max: 1 } },
    script: {},
    hints: [{ on: 'mud', banner: 'mud' }],
    goal: { type: 'top', n: 2 }, challenge: { type: 'first' },
    mechanics: ['hold', 'traps', 'rivals', 'mud', 'tempt:star'] },

  // 5 ---------------------------------------------------------------------------------------------
  { id: 'w2-5', emoji: '👀', name: T('Le faux dos', 'The fake back'),
    tip: T('Il se met de dos… mais un œil dépasse. L’œil n’est pas le « ding » !', 'He turns away… but an eye peeks. The eye is not the “ding”!'),
    length: 150, night: 44.5, seed: 2505, sky: 1.45,
    rivals: [kid('hugo'), kid('leo'), kid('jade')],
    sun: { word: [0.53, 0.63], turn: [0.57, 0.62], traps: 0.25, fakeBack: 0.5, tempt: { star: 0.2, recount: 0.15, max: 1 } },
    script: { 1: { fakeBack: true } },
    hints: [],
    goal: { type: 'quick', n: 3 }, challenge: { type: 'time', s: 38 },
    mechanics: ['hold', 'traps', 'rivals', 'fakeBack', 'tempt:star', 'tempt:recount'] },

  // 6 ---------------------------------------------------------------------------------------------
  { id: 'w2-6', emoji: '🎭', name: T('Le grand jeu du Farceur', 'The Prankster’s game'),
    tip: T('Faux dos, éternuements, rivaux qui craquent… Toi, tu ne bouges pas.', 'Fake backs, sneezes, rivals cracking… You don’t move.'),
    length: 152, night: 44.5, seed: 2606, sky: 1.7,
    rivals: [kid('sam'), kid('nino'), kid('zoe')],
    sun: { word: [0.52, 0.62], turn: [0.545, 0.595], traps: 0.25, fakeBack: 0.35,
           tempt: { star: 0.25, fakeRet: 0.15, sneeze: 0.15, crack: 0.2, recount: 0.1, alarm: 0.1, max: 2 } },
    script: { 1: { tempt: ['sneeze'] } },
    hints: [],
    goal: { type: 'oufs', n: 2 }, challenge: { type: 'first' },
    mechanics: ['hold', 'traps', 'rivals', 'fakeBack', 'tempt:star', 'tempt:fakeRet', 'tempt:sneeze', 'tempt:crack', 'tempt:recount', 'tempt:alarm'] },

  // 7 ---------------------------------------------------------------------------------------------
  // v2.5 : le troupeau (trois rivaux repartent ensemble… et sont grillés). Trois d'entre eux partent devant (z0).
  { id: 'w2-7', emoji: '🏃', name: T('La grande course du parc', 'The big park race'),
    tip: T('5 rivaux… s’ils repartent tous ensemble, ne les suis pas !', '5 rivals… if they all run off together, don’t follow them!'),
    length: 140, night: 45.5, seed: 2707, sky: 2.1,
    rivals: [kid('ines', { z0: 10 }), kid('max', { z0: 16 }), kid('jade', { z0: 22 }), kid('leo'), kid('lila')],
    mud: [[30, 38], [88, 97], [134, 142]],
    sun: { word: [0.5, 0.6], turn: [0.545, 0.595], traps: 0.35, double: 0.15, hesitate: 0.25, stutter: 0.25, express: 0.25,
           fakeBack: 0.3, tempt: { star: 0.3, fakeRet: 0.25, sneeze: 0.25, taunt: 0.3, fly: 0.25, crack: 0.25, herd: 0.3, max: 2 } },
    script: { 1: { traps: 1, tempt: ['taunt'] }, 2: { tempt: ['herd'] } },
    hints: [],
    goal: { type: 'top', n: 3 }, challenge: { type: 'first' },
    mechanics: ['hold', 'traps', 'hesitate', 'stutter', 'express', 'rivals', 'mud', 'fakeBack', 'tempt:star', 'tempt:fakeRet', 'tempt:sneeze',
                'tempt:taunt', 'tempt:fly', 'tempt:crack', 'tempt:herd'] },

  // 8 : BOSS --------------------------------------------------------------------------------------
  { id: 'w2-8', emoji: '🤡', boss: true, bossKind: 'farceur', name: T('Le Soleil Farceur', 'The Prankster Sun'),
    tip: T('Ses regards sont longs et pleins de farces. Attends toujours le « ding » !', 'His looks are long and full of pranks. Always wait for the “ding”!'),
    length: 160, night: 51, seed: 2808, sky: 2.3,
    rivals: [kid('ines'), kid('hugo'), kid('tom')],
    sun: { word: [0.5, 0.58], turn: [0.555, 0.605], look: [1.5, 2.2], pause: [0.45, 0.85], traps: 0.3, hesitate: 0.25, express: 0.25,
           fakeBack: 0.3, tempt: { star: 0.4, fakeRet: 0.35, sneeze: 0.3, taunt: 0.4, fly: 0.3, crack: 0.3, recount: 0.15, alarm: 0.1, max: 2 } },
    script: {                                                       // ses farces, dans l'ordre
      1: { tempt: ['sneeze'], move: T('L’ÉTERNUEMENT GÉANT', 'THE GIANT SNEEZE') },
      2: { tempt: ['fakeRet', 'star'], move: T('LE FAUX RETOUR ÉTOILÉ', 'THE STARRY FAKE TURN') },
      3: { fakeBack: true, tempt: ['fly'], move: T('LE FAUX DOS DE LA MOUCHE', 'THE FLY’S FAKE BACK') },
      4: { tempt: ['crack', 'taunt'], move: T('LA PANIQUE', 'PANIC TIME') },
      5: { express: true, tempt: ['fakeRet'], move: T('EXPRESS FARCEUR', 'PRANKSTER EXPRESS') },
      6: { fakeBack: true, tempt: ['sneeze', 'star'], move: T('TOUT EN MÊME TEMPS', 'EVERYTHING AT ONCE') }
    },
    hints: [],
    goal: { type: 'quick', n: 4 }, challenge: { type: 'first' },
    mechanics: ['hold', 'traps', 'hesitate', 'express', 'rivals', 'fakeBack', 'tempt:*', 'boss'] }
]);
})(window.Soleil);
