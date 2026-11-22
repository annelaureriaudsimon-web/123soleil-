/* js/ui/onboard.js — Les premiers pas d'un nouveau joueur, et l'accueil express de celui qui revient.
   1re visite : ni titre, ni accueil, ni carte : directement le niveau 1 « prêt » (une main montre le geste).
   Niveau 1 fini → petite célébration, puis la petite carte d'intro du niveau 2.
   Niveau 2 fini → écran de résultats, puis Suivant : la carte du monde se présente (petite animation).
   Joueur qui revient : l'accueil, avec un gros « Continuer – Niveau X ».
   Sauvegarde : soleil.onboard = 0 (jamais joué), 1 (niveau 1 fini), 2 (niveau 2 fini), 3 (carte présentée). */
(function (S) {
'use strict';
const { store, WORLDS, levelById } = S;

const FIRST = 'w1-1', SECOND = 'w1-2';
let step = (() => {
  const v = store.get('onboard', null);
  if (v === 0 || v === 1 || v === 2 || v === 3) return v;
  const lv = store.get('levels', null);
  const old = S.best > 0 || S.plays > 0 || (!!lv && typeof lv === 'object' && Object.keys(lv).length > 0);   // ancienne sauvegarde
  const st = old ? 3 : 0;
  store.set('onboard', st);
  return st;
})();
function set(n) { if (n > step) { step = n; store.set('onboard', n); } }

// Après le chargement : 1re visite → niveau 1 « prêt » ; niveau 1 fini mais pas le 2 → carte d'intro du niveau 2
function start() {
  if (step === 0) S.Levels.open(FIRST, false, { ready: true });
  else if (step === 1) S.Levels.open(SECOND, false, { mini: true });
}
// Le niveau 1 des premiers pas : à sa fin, pas d'écran de résultats, on enchaîne
const chain = def => def.id === FIRST && step < 1;
function afterWin(def) {                           // fin de la célébration d'un niveau : true = on s'occupe de la suite
  if (chain(def)) { set(1); S.Levels.open(SECOND, false, { mini: true }); return true; }
  if (def.id === SECOND) set(2);
  return false;
}
function mapNext(def) {                            // Suivant après le niveau 2 : la carte se présente (pas de pub : on ne va pas jouer)
  if (def.id !== SECOND || step !== 2) return false;
  S.Levels.toMap();
  return true;
}
const wantsMapIntro = () => step < 3;              // la 1re fois que la carte s'ouvre
function mapShown() { set(3); }

// L'accueil : le niveau à continuer (le 1er pas encore fini du monde ouvert le plus loin)
function contLevel() {
  const open = WORLDS.filter(w => w.levels.length && S.Levels.worldOpen(w));
  for (let i = open.length - 1; i >= 0; i--) {
    const lv = open[i].levels.find(l => S.Levels.unlocked(l) && !S.Levels.peek(l.id).done);
    if (lv) return lv;
  }
  return levelById(store.get('lastLevel', '')) || WORLDS[0].levels[0];
}
const started = () => WORLDS.some(w => w.levels.some(l => S.Levels.peek(l.id).tries > 0));

S.Onboard = { start, chain, afterWin, mapNext, wantsMapIntro, mapShown, contLevel, started, get step() { return step; } };
})(window.Soleil);
