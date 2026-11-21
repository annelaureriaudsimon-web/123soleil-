/* js/core/input.js — Contrôles : un seul geste, maintenir / lâcher (tactile, souris, clavier) */
(function (S) {
'use strict';
const { $, Sound, Voice, cv, duoPtr, pointers, startRun, closePanel, toggleMute } = S;   // déjà chargés

/* ---------- 24. Contrôles : un seul geste, maintenir / lâcher ---------- */
function syncPress() { S.pressing = !S.panelOpen && !S.paused && (pointers.size > 0 || S.keyDown); }
function onPress() {
  Sound.unlock();
  if (S.panelOpen || S.paused || S.booting) return;
  if (S.state === 'title') startRun('free');          // maintenir sur le décor (ou Espace) : partie libre, comme avant
  else if (S.state === 'over' && S.gtime - S.overT > 0.3) {
    if (S.mode === 'daily') S.goHome();                 // après le défi : retour à l'accueil (pas de « Rejouer »)
    else S.afterBreak(() => startRun('free'));      // Rejouer : pause pub (si Poki le décide), puis on relance
  } else if (S.state === 'level') S.Levels.press();   // niveau : commencer, passer la cinématique, ou réessayer après « GRILLÉ ! »
  syncPress();
  S.syncGameplay();                                   // gameplayStart part à l'appui, pas à l'image d'après
}
cv.addEventListener('pointerdown', e => {
  if (e.button > 0) return;
  e.preventDefault();
  try { cv.setPointerCapture(e.pointerId); } catch (err) { /* rien */ }
  if (S.state === 'duo') {                            // 2 joueurs : moitié gauche = J1, moitié droite = J2 (multi-touch)
    Sound.unlock();
    duoPtr.set(e.pointerId, e.clientX < S.W / 2 ? 0 : 1);
    return;
  }
  if (S.state === 'map') { Sound.unlock(); if (!S.panelOpen) S.WorldMap.tap(e.clientX, e.clientY); return; }   // carte du monde
  pointers.add(e.pointerId);
  onPress();
});
const ptrUp = e => { pointers.delete(e.pointerId); duoPtr.delete(e.pointerId); syncPress(); Sound.unlock(); };
cv.addEventListener('pointerup', ptrUp);
cv.addEventListener('pointercancel', ptrUp);
cv.addEventListener('lostpointercapture', ptrUp);
const KEYS = new Set(['Space', 'ArrowUp', 'KeyW', 'Enter', 'NumpadEnter']);
window.addEventListener('keydown', e => {
  const k = (e.key || '').toLowerCase(), pauseKey = e.code === 'Escape' || k === 'p';
  if (S.paused) {                                     // menu pause : Échap / P / Entrée reprennent, M coupe le son
    if (e.repeat) return;
    if (pauseKey || ((e.code === 'Enter' || e.code === 'NumpadEnter') && !(e.target && e.target.tagName === 'BUTTON'))) { e.preventDefault(); S.resumeGame(); }
    else if (k === 'm' && !e.ctrlKey && !e.metaKey) { toggleMute(); S.soundLabel(); }
    return;
  }
  if (pauseKey && !e.repeat && S.pausable()) { e.preventDefault(); S.pauseGame('clavier'); return; }   // pendant la partie : pause
  if (e.code === 'Escape') {                          // hors partie : comme avant
    if (S.panelOpen) { closePanel(); return; }
    if (S.state === 'duo' || S.state === 'over') { S.goHome(); return; }
    if (S.state === 'level') { S.Levels.toMap(); return; }       // niveau → carte
  }
  if (k === 'm' && !e.repeat && !e.ctrlKey && !e.metaKey) { toggleMute(); return; }
  if (S.state === 'map') { if (!S.panelOpen && !e.repeat) S.WorldMap.key(e); return; }   // carte : flèches + Entrée
  if (S.state === 'level' && S.Levels.phase === 'results') {    // résultats : Entrée = Suivant, R = Rejouer
    const end = document.getElementById('lvEnd');
    if (e.repeat || !end || !end.classList.contains('armed') || (e.target && e.target.tagName === 'BUTTON')) return;
    if (KEYS.has(e.code)) { e.preventDefault(); S.Levels.next(); } else if (k === 'r') S.Levels.retry();
    return;
  }
  if (S.state === 'duo') {                            // J1 = A, J2 = L (e.key : marche en AZERTY comme en QWERTY)
    if (k === 'a' || k === 'l') { e.preventDefault(); S.duoKeys[k === 'a' ? 0 : 1] = true; Sound.unlock(); }
    else if (KEYS.has(e.code) && !e.repeat && !(e.target && e.target.tagName === 'BUTTON')
             && S.duo && S.duo.phase === 'over' && $('duoEnd').classList.contains('armed')) { e.preventDefault(); S.rematch(); }   // revanche
    return;
  }
  if (!KEYS.has(e.code) || S.panelOpen) return;
  if (e.target && e.target.tagName === 'BUTTON') return;
  e.preventDefault();
  if (e.repeat) return;
  S.keyDown = true; onPress();
});
window.addEventListener('keyup', e => {
  const k = (e.key || '').toLowerCase();
  if (k === 'a') S.duoKeys[0] = false;
  if (k === 'l') S.duoKeys[1] = false;
  if (KEYS.has(e.code)) { S.keyDown = false; syncPress(); }
});
function releaseAll() { pointers.clear(); duoPtr.clear(); S.duoKeys = [false, false]; S.keyDown = false; syncPress(); }
window.addEventListener('blur', releaseAll);
document.addEventListener('visibilitychange', () => { if (document.hidden) { releaseAll(); Voice.stop(); Sound.wind(0); } S.last = performance.now(); });
['contextmenu', 'selectstart', 'dblclick', 'gesturestart'].forEach(t => document.addEventListener(t, e => e.preventDefault()));
document.addEventListener('touchmove', e => { if (!(e.target.closest && e.target.closest('.sheet'))) e.preventDefault(); }, { passive: false });

Object.assign(S, { syncPress, onPress, ptrUp, KEYS, releaseAll });
})(window.Soleil);
