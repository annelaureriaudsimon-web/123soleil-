/* levels/worlds.js — La liste des mondes et la fonction qui enregistre les niveaux d'un monde.
   Monde 1 (la cour), monde 2 (le parc, 12 ★ du monde 1), monde 3 (la plage, 12 ★ du monde 2, v2.5) et monde 4
   (la montagne, 12 ★ du monde 3, v2.6) sont jouables. Le monde 5 est visible sur la carte, verrouillé (« Bientôt ») :
   pour l'ouvrir, ajouter levels/world5.js (même format) et passer « soon » à false, avec un « need » si besoin. */
(function (S) {
'use strict';

// Un monde : numéro, nom, couleur du badge sur la carte, emoji, ses niveaux (ajoutés par levels/worldN.js),
// et ce qu'il faut pour le débloquer (need : un nombre d'étoiles gagnées dans un autre monde)
const WORLDS = [
  { id: 1, emoji: '🏫', color: '#FFD166', name: { fr: 'La cour de récré', en: 'The playground' }, levels: [], soon: false },
  { id: 2, emoji: '🌳', color: '#06D6A0', name: { fr: 'Le parc', en: 'The park' }, levels: [], soon: false,
    need: { world: 1, stars: 12 } },                 // se débloque avec 12 étoiles du monde 1
  { id: 3, emoji: '🏖️', color: '#4CC9F0', name: { fr: 'La plage', en: 'The beach' }, levels: [], soon: false,
    need: { world: 2, stars: 12 } },                 // v2.5 : se débloque avec 12 étoiles du monde 2
  { id: 4, emoji: '⛰️', color: '#F4A261', name: { fr: 'La montagne', en: 'The mountain' }, levels: [], soon: false,
    need: { world: 3, stars: 12 } },                 // v2.6 : se débloque avec 12 étoiles du monde 3
  { id: 5, emoji: '🌙', color: '#9B5DE5', name: { fr: 'La nuit', en: 'The night' }, levels: [], soon: true }
];

// Enregistre les niveaux d'un monde (appelé par levels/worldN.js)
function addWorld(id, levels) {
  const w = WORLDS.find(x => x.id === id);
  levels.forEach((lv, i) => { lv.world = id; lv.num = i + 1; });
  w.levels = levels;
}
const levelById = id => { for (const w of WORLDS) for (const lv of w.levels) if (lv.id === id) return lv; return null; };

Object.assign(S, { WORLDS, addWorld, levelById });
})(window.Soleil);
