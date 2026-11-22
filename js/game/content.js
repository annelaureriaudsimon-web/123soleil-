/* js/game/content.js — Contenus : mots pièges, rangs, médailles, missions, tenues */
(function (S) {
'use strict';
const { PHASE_LEN, SKIN } = S;   // déjà chargés

/* ---------- 3. Contenus : mots pièges, rangs, médailles, missions, tenues ---------- */
// Les mots du chant dépendent de la langue (TXT.xx.chant, js/core/i18n.js et js/core/lang/*.js) : ces listes sont
// re-remplies sur place par js/core/i18n-apply.js. Ici, le français : c'est ce qu'utilise tools/simulate.js (pas de textes).
const SUN_TRAPS = ['SOLDES !', 'SOUPE !', 'SODA !', 'SOMBRERO !', 'SOFA !', 'SOURIS !', 'SORBET !', 'SOLO !', 'SOUCOUPE !', 'SOLDAT !', 'SORCIÈRE !', 'SOMMET !'];
const MOON_TRAPS = ['LUGE !', 'LUTIN !', 'LUXE !', 'LUNETTES !', 'LUMIÈRE !'];
const CHANT_FR = { pre: 'SO', sun: 'SOLEIL !', moon: 'LUNE !', hop: 'HOP !' };
const chantW = () => (S.L && S.L.chant) || CHANT_FR;   // « SO », « SOLEIL ! », « LUNE ! », « HOP ! » dans la langue du joueur
const RANKS = [              // seuils en fractions de phase (avec PHASE_LEN = 60 : 0, 18, 48, 90, 150, 240 m)
  { min: 0, e: '🐌', fr: 'Escargot', en: 'Snail' },
  { min: PHASE_LEN * 0.3, e: '🐢', fr: 'Tortue', en: 'Turtle' },
  { min: PHASE_LEN * 0.8, e: '🐇', fr: 'Lapin', en: 'Rabbit' },
  { min: PHASE_LEN * 1.5, e: '🗿', fr: 'Statue', en: 'Statue' },
  { min: PHASE_LEN * 2.5, e: '🥷', fr: 'Ninja', en: 'Ninja' },
  { min: PHASE_LEN * 4, e: '😎', fr: 'Maître du Soleil', en: 'Sun Master' }
];
const MEDALS = [             // un boss au début de chaque phase
  { id: 'midi', e: '🥉', at: PHASE_LEN, fr: 'Boss de Midi', en: 'Noon Boss' },
  { id: 'soir', e: '🥈', at: 2 * PHASE_LEN, fr: 'Boss du Soir', en: 'Evening Boss' },
  { id: 'nuit', e: '🥇', at: 3 * PHASE_LEN, fr: 'Boss de la Nuit', en: 'Night Boss' },
  { id: 'aube', e: '🏆', at: 4 * PHASE_LEN, fr: 'Boss de l’Aube', en: 'Dawn Boss' }
];
const M_HALF = PHASE_LEN / 2, M_TOTAL = 5 * PHASE_LEN;   // distances des missions, calculées depuis PHASE_LEN
const MISSIONS = [   // tier 0 = facile, 1 = moyen, 2 = dur ; une de chaque par jour
  { id: 'dist50', tier: 0, stat: 'dist', goal: M_HALF, reward: 5, fr: `Atteins ${M_HALF} m`, en: `Reach ${M_HALF} m` },
  { id: 'looks5', tier: 0, stat: 'looks', goal: 5, reward: 5, fr: 'Survis à 5 regards dans une partie', en: 'Survive 5 looks in one run' },
  { id: 'sprint', tier: 0, stat: 'sprint', goal: 30, reward: 5, fr: 'Cours 30 m sans t’arrêter', en: 'Run 30 m without stopping' },
  { id: 'runs', tier: 0, stat: 'runs', goal: 5, reward: 5, daily: true, fr: 'Joue 5 parties', en: 'Play 5 runs' },
  { id: 'ouf1', tier: 0, stat: 'oufs', goal: 1, reward: 6, fr: 'Fais un OUF (arrête-toi au dernier moment)', en: 'Get a PHEW (stop at the last moment)' },
  { id: 'midi', tier: 1, stat: 'dist', goal: PHASE_LEN, reward: 8, fr: `Atteins midi (${PHASE_LEN} m)`, en: `Reach noon (${PHASE_LEN} m)` },
  { id: 'ouf3', tier: 1, stat: 'oufs', goal: 3, reward: 8, fr: 'Fais 3 OUF dans une partie', en: 'Get 3 PHEWs in one run' },
  { id: 'mud2', tier: 1, stat: 'mud', goal: 2, reward: 8, fr: 'Traverse 2 flaques de boue', en: 'Cross 2 mud puddles' },
  { id: 'trap2', tier: 1, stat: 'traps', goal: 2, reward: 8, fr: 'Ne tombe pas dans 2 mots pièges', en: 'Don’t fall for 2 trap words' },
  { id: 'boss1', tier: 1, stat: 'bosses', goal: 1, reward: 8, fr: 'Bats un boss', en: 'Beat a boss' },
  { id: 'total', tier: 1, stat: 'total', goal: M_TOTAL, reward: 6, daily: true, fr: `Cours ${M_TOTAL} m au total aujourd’hui`, en: `Run ${M_TOTAL} m in total today` },
  { id: 'star3', tier: 1, stat: 'catches', goal: 3, reward: 10, fr: 'Attrape 3 étoiles dans une partie', en: 'Catch 3 stars in one run' },
  { id: 'soir', tier: 2, stat: 'dist', goal: 2 * PHASE_LEN, reward: 12, fr: `Atteins le soir (${2 * PHASE_LEN} m)`, en: `Reach the evening (${2 * PHASE_LEN} m)` },
  { id: 'lune', tier: 2, stat: 'dist', goal: 3 * PHASE_LEN, reward: 15, fr: `Vois la Lune (${3 * PHASE_LEN} m)`, en: `See the Moon (${3 * PHASE_LEN} m)` },
  { id: 'hop', tier: 2, stat: 'hops', goal: 1, reward: 12, fr: 'Résiste à un faux dos', en: 'Survive a fake turn' },
  { id: 'combo3', tier: 2, stat: 'combo', goal: 3, reward: 15, fr: 'Fais un combo ×3', en: 'Get a ×3 combo' },
  { id: 'ice2', tier: 2, stat: 'ice', goal: 2, reward: 15, fr: 'Traverse 2 plaques de verglas', en: 'Cross 2 ice patches' },
  { id: 'boss2', tier: 2, stat: 'bosses', goal: 2, reward: 15, fr: 'Bats 2 boss dans une partie', en: 'Beat 2 bosses in one run' },
  { id: 'bigstar', tier: 2, stat: 'big', goal: 1, reward: 12, fr: 'Attrape une grosse étoile', en: 'Catch a big star' },
  { id: 'slope2', tier: 2, stat: 'slope', goal: 2, reward: 12, fr: 'Traverse 2 descentes', en: 'Cross 2 slopes' }
];
const OUTFITS = [    // toutes les tenues se voient de dos (et donc sur les captures)
  { id: 'classic', price: 0, fr: 'Classique', en: 'Classic', body: '#EF476F', shorts: '#3A3F66', legs: '#2B2D42', shoes: '#FFFFFF', hair: '#5B3A29', bib: true },
  { id: 'cap', price: 10, fr: 'Casquette', en: 'Cap', body: '#118AB2', shorts: '#2B2D42', legs: '#2B2D42', shoes: '#FFD166', hair: '#2B1B12', bib: true, hat: 'cap', hatC: '#FFD166' },
  { id: 'tennis', price: 20, fr: 'Tennis', en: 'Tennis', body: '#FFFFFF', stripe: '#EF476F', shorts: '#FFFFFF', legs: SKIN, shoes: '#FFFFFF', hair: '#E0B04A', bib: true, hat: 'band', hatC: '#EF476F', wrist: '#EF476F' },
  { id: 'straw', price: 35, fr: 'Touriste', en: 'Tourist', body: '#F4A261', dots: '#FFFFFF', shorts: '#2A9D8F', legs: SKIN, shoes: '#E76F51', hair: '#5B3A29', hat: 'straw', hatC: '#E9C46A', ribbon: '#E63946' },
  { id: 'pyjama', price: 50, fr: 'Pyjama', en: 'Pyjamas', body: '#8EB8E5', stripes: '#FFFFFF', shorts: '#8EB8E5', legs: '#8EB8E5', shoes: '#F28482', hair: '#5B3A29', hat: 'night', hatC: '#8EB8E5' },
  { id: 'vampire', price: 80, fr: 'Vampire', en: 'Vampire', body: '#22223B', shorts: '#22223B', legs: '#1B1B2F', shoes: '#111111', hair: '#111111', cape: '#16161F', capeIn: '#C1121F', collar: true },
  { id: 'dino', price: 120, fr: 'Dino', en: 'Dino', body: '#5DBB63', shorts: '#5DBB63', legs: '#4CA64F', shoes: '#3E8E41', hair: '#5DBB63', hood: true, spikes: '#F4A261', tail: true },
  { id: 'king', price: 200, fr: 'Roi du Soleil', en: 'Sun King', body: '#FFD166', shorts: '#7B2CBF', legs: '#2B2D42', shoes: '#7B2CBF', hair: '#5B3A29', cape: '#7B2CBF', capeIn: '#FFFFFF', ermine: true, crown: true }
];
const outfitById = id => OUTFITS.find(o => o.id === id) || OUTFITS[0];

Object.assign(S, { SUN_TRAPS, MOON_TRAPS, chantW, RANKS, MEDALS, M_HALF, M_TOTAL, MISSIONS, OUTFITS, outfitById });
})(window.Soleil);
