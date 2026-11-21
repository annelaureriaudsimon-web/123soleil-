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
// Pilule Poki (mobile) : environ 46×62 px, par défaut movePill(0, 24), donc dans la bande 16 < y < 96 px.
// Poki ne dit pas de quel côté elle est : C'EST ICI QU'ON LE RÈGLE, après l'avoir vue dans le Poki Inspector.
//   side: 'left'  → les textes du haut à gauche se décalent de w px (S.pillX) ;
//   side: 'right' → les boutons ronds du haut à droite se décalent de w px vers la gauche (S.pillR).
// Pour voir la zone : index.html?debug=1&pill=1 (rectangle rouge). Pour essayer l'autre côté sans toucher au
// code : ?debug=1&pill=1&pillside=right (ou left). Voir docs/POKI_INTEGRATION.md, section « La pilule ».
const PILL = { side: 'left', w: 56, top: 16, h: 80 };
{ const m = location.search.match(/[?&]pillside=(left|right)/); if (m) PILL.side = m[1]; }   // @debug

// ---------- L'appareil ----------
S.touchUI = !finePointer();                        // tactile (téléphone, tablette) : main animée ; sinon touche Espace
S.pillX = 0; S.pillR = 0;
function refreshPill() {
  const on = S.embedded && S.touchUI;               // dans l'iframe de Poki, sur un appareil tactile
  S.pillX = on && PILL.side === 'left' ? PILL.w : 0;
  S.pillR = on && PILL.side === 'right' ? PILL.w : 0;
  document.body.classList.toggle('pill-zone', S.pillX > 0);
  document.body.classList.toggle('pill-right', S.pillR > 0);
  document.documentElement.style.setProperty('--pr', S.pillR + 'px');
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
Poki.onAdEnd(info => {                             // la pub est finie : le son revient (sauf si le joueur l'avait coupé)
  Sound.silence('pub', false);
  S.releaseAll();
  S.dirty = true;
  if (!S.breakWait) shield.classList.add('hide');  // pub récompensée ou pub en retard (afterBreak retire le sien lui-même)
  if (info && info.late && !S.paused && S.pausable()) S.pauseGame('pub');   // pub en retard, par-dessus le jeu : on repart en pause
  try { window.focus(); } catch (e) { /* tant pis : un clic rendra le clavier au jeu */ }   // le clavier revient au jeu
});
const locked = () => S.booting || S.breakWait || S.rewardWait || Poki.inAd;
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
