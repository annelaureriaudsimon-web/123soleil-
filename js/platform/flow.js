/* js/platform/flow.js — Le fil du jeu vu par Poki :
   - quand le joueur joue VRAIMENT (gameActive) : gameplayStart / gameplayStop partent tout seuls, une fois ;
   - les pauses pub entre deux parties (afterBreak : Rejouer, Suivant, Recommencer, Reprendre) ;
   - pendant une pub : le jeu figé, le son coupé, l'écran et le clavier bloqués, tout relâché ;
   - le démarrage : le titre pendant que le SDK s'initialise, puis le 1er niveau (1re visite) ou l'accueil ;
   - l'appareil (tactile ou clavier) et la zone protégée de la pilule Poki. */
(function (S) {
'use strict';
const { Poki, Sound, finePointer } = S;

// ---------- Réglages ----------
// Pilule Poki (mobile) : 46×62 px, par défaut movePill(0, 24). Poki ne dit pas de quel côté : on la suppose
// en haut à gauche. La zone x < 56 px, 16 < y < 96 px reste libre : les textes du haut à gauche se décalent
// de PILL.w px, et aucun bouton n'y est placé (ils sont tous à droite).
const PILL = { w: 56 };

// ---------- L'appareil ----------
S.touchUI = !finePointer();                        // tactile (téléphone, tablette) : main animée ; sinon touche Espace
S.pillX = 0;
function refreshPill() {
  S.pillX = S.embedded && S.touchUI ? PILL.w : 0;   // dans l'iframe de Poki, sur un appareil tactile
  document.body.classList.toggle('pill-zone', S.pillX > 0);
  document.body.classList.toggle('touch', S.touchUI);
}
window.addEventListener('pointerdown', e => {      // un vrai doigt sur l'écran : consignes tactiles
  if (e.pointerType === 'touch' && !S.touchUI) { S.touchUI = true; refreshPill(); S.refreshUI(); }
}, true);
const forDevice = (touch, keys) => (S.touchUI ? touch : keys);   // le bon texte : « Touche… » ou « Clic ou Espace… »

// ---------- En jeu ou pas ? ----------
function gameActive() {
  if (S.booting || S.paused || S.breakWait || Poki.busy || S.panelOpen) return false;
  if (S.state === 'play') return true;                                   // course infinie, défi du jour
  if (S.state === 'level') return S.Levels.phase === 'play';             // niveau, après l'appui (ou la cinématique)
  if (S.state === 'duo') return !!S.duo && S.duo.phase === 'play';      // 2 joueurs, après « GO ! »
  return false;
}
function syncGameplay() {                          // appelé à chaque image et après chaque transition
  if (!Poki.loaded || Poki.inAd) return;
  const on = gameActive();
  if (on && !Poki.playing) Poki.gameplayStart();
  else if (!on && Poki.playing) Poki.gameplayStop();
}

// ---------- Pause pub entre deux parties ----------
S.breakWait = false;
const shield = document.createElement('div');     // pendant une pub (ou sa demande) : rien n'est cliquable
shield.id = 'adShield'; shield.className = 'hide';
document.body.appendChild(shield);
function afterBreak(next) {                        // Poki décide s'il y a une pub ; puis la suite (Rejouer, Suivant…)
  if (S.breakWait || Poki.busy) return false;      // double tap : une seule demande
  S.breakWait = true; shield.classList.remove('hide');
  S.releaseAll();
  syncGameplay();                                  // arrêté avant de demander la pub
  Poki.commercialBreak().then(() => {
    S.breakWait = false; shield.classList.add('hide');
    S.releaseAll();                                // aucun appui fantôme : il faut un nouvel appui
    S.last = performance.now();
    try { next(); } finally { syncGameplay(); S.refreshUI(); }
  });
  return true;
}
Poki.onAdStart(() => {                             // la pub commence : tout se fige, le son se coupe
  S.releaseAll();
  Sound.silence('pub', true);
  shield.classList.remove('hide');
});
Poki.onAdEnd(() => {                               // la pub est finie : le son revient (sauf si le joueur l'avait coupé)
  Sound.silence('pub', false);
  S.releaseAll();
  S.dirty = true;
  try { window.focus(); } catch (e) { /* tant pis : un clic rendra le clavier au jeu */ }   // le clavier revient au jeu
});
const locked = () => S.booting || S.breakWait || Poki.inAd;
window.addEventListener('keydown', e => { if (locked()) { e.preventDefault(); e.stopPropagation(); } }, true);
window.addEventListener('pointerdown', e => { if (locked()) { e.preventDefault(); e.stopPropagation(); } }, true);
const halted = () => !!S.paused || S.breakWait || Poki.inAd;   // la boucle ne fait plus avancer le monde

// ---------- Démarrage ----------
function boot() {                                  // le titre tout de suite, pendant que le SDK s'initialise
  S.booting = true;
  refreshPill();
  S.refreshUI();
  Poki.init().then(() => {
    S.booting = false;
    Poki.loadingFinished();
    S.Onboard.start();                             // 1re visite : le niveau 1 ; sinon : l'accueil
    S.refreshUI();
    syncGameplay();
  });
}

Object.assign(S, { PILL, refreshPill, forDevice, gameActive, syncGameplay, afterBreak, halted, boot });
})(window.Soleil);
