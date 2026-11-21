/* js/ui/pause.js — La pause : bouton ⏸, Échap / P, menu (Reprendre, Recommencer, Carte ou Accueil, Son),
   pause automatique (onglet caché, fenêtre quittée), seconde de grâce à la reprise, boutons ronds qui
   changent pendant la partie, et la page qui ne défile jamais (Espace, flèches, molette). */
(function (S) {
'use strict';
const { L, $, Sound, Poki, Lt, TAU, icon, esc, otext, fit } = S;

// ---------- Réglages ----------
const GRACE = 1.0;             // s : à la reprise, le monde reste figé 1 s et le joueur immobile (il ne peut pas être grillé)
const ARM = 0.15;              // s : les boutons du menu répondent après ce délai (pas de clic par erreur)
const SCROLL_KEYS = new Set(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End']);

S.paused = false; S.grace = 0;
const menu = $('pause'), btn = $('pauseBtn');
let armT = 0;

// Peut-on mettre en pause ? Seulement pendant une partie (2 joueurs : tout le match)
function pausable() {
  if (S.booting || S.paused || S.panelOpen || S.breakWait || Poki.busy) return false;
  if (S.state === 'play') return true;
  if (S.state === 'level') return S.Levels.phase === 'play';
  if (S.state === 'duo') return !!S.duo && S.duo.phase !== 'over';
  return false;
}
function pauseGame(why) {
  if (!pausable()) return false;
  S.paused = why || 'bouton'; S.grace = 0;
  S.releaseAll();
  Sound.silence('pause', true);
  fillMenu();
  menu.classList.remove('hide', 'armed');
  clearTimeout(armT); armT = setTimeout(() => menu.classList.add('armed'), ARM * 1000);
  S.syncGameplay();                                // gameplayStop
  syncButtons();
  return true;
}
function fillMenu() {
  const lvl = S.state === 'level', daily = S.state === 'play' && S.mode === 'daily';
  $('pTitle').textContent = L.pauseTitle;
  $('pResume').innerHTML = icon('play') + esc(L.resume);
  $('pRestart').classList.toggle('hide', daily);   // le défi du jour : un seul essai
  $('pRestart').innerHTML = icon('restart') + esc(lvl ? L.restartLevel : L.restart);
  $('pExit').innerHTML = icon(lvl ? 'grid' : 'home') + esc(lvl ? L.mapBtn : daily ? L.giveUp : L.home);
  soundLabel();
}
function soundLabel() { $('pSound').innerHTML = icon(Sound.muted ? 'soundOff' : 'soundOn') + esc(Sound.muted ? L.soundOff : L.soundOn); qualLabel(); }
function qualLabel() { $('pQual').textContent = L.qualityLbl(S.Q.mode); }   // qualité d'image : Auto / Haute / Basse (js/render/quality.js)
function closeMenu() { clearTimeout(armT); menu.classList.add('hide'); menu.classList.remove('armed'); }
function unpause() { S.paused = false; Sound.silence('pause', false); }

function stopPlayers() {                           // à la reprise, tout le monde repart à l'arrêt
  if (S.state === 'level' && S.Levels.m) { const m = S.Levels.m, p = m.player; p.v = 0; p.press = false; p.stopT = m.t; }
  else if (S.state === 'duo' && S.duo) S.duo.racers.forEach(r => { r.v = 0; r.pressed = false; });
  else if (S.state === 'play') { const r = S.runner; r.v = 0; r.pressed = false; r.stopT = S.runT; r.sprintFrom = null; }
}
function resumeGame() {                            // Reprendre : pause pub (si Poki le décide), puis 1 s de grâce
  if (!S.paused || S.breakWait) return;
  closeMenu();
  S.afterBreak(() => { unpause(); stopPlayers(); S.grace = GRACE; });
}
function restartGame() {                           // Recommencer : pause pub, puis la partie repart de zéro
  if (!S.paused || S.breakWait) return;
  closeMenu();
  S.afterBreak(() => {
    unpause();
    if (S.state === 'level') S.Levels.restart();
    else if (S.state === 'duo') S.startDuo();
    else S.startRun('free');
  });
}
function exitGame() {                              // Carte (niveaux) ou Accueil : pas de pub, on ne va pas jouer
  if (!S.paused || S.breakWait) return;
  closeMenu(); unpause();
  if (S.state === 'level') S.Levels.toMap(); else S.goHome();
  S.syncGameplay(); S.refreshUI();
}
function toggleSound() { S.toggleMute(); soundLabel(); }

// La seconde de grâce : un anneau qui se remplit au-dessus du coureur
function drawGrace() {
  if (!(S.grace > 0)) return;
  const g = S.ctx, k = 1 - S.grace / GRACE, r = Math.min(Lt.U * 0.085, 44), x = Lt.cx, y = Lt.yFeet - Lt.s * 2.5;
  g.save();
  g.fillStyle = `rgba(15,15,40,${(0.28 * (1 - k)).toFixed(3)})`; g.fillRect(0, 0, S.W, S.H);
  g.lineCap = 'round';
  g.strokeStyle = 'rgba(20,26,110,0.55)'; g.lineWidth = r * 0.34; g.beginPath(); g.arc(x, y, r, 0, TAU); g.stroke();
  g.strokeStyle = '#22C55E'; g.lineWidth = r * 0.22; g.beginPath(); g.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + TAU * k); g.stroke();
  g.fillStyle = '#FFFFFF'; g.strokeStyle = '#141A6E'; g.lineWidth = Math.max(2, r * 0.08); g.lineJoin = 'round';
  g.beginPath(); g.moveTo(x - r * 0.28, y - r * 0.38); g.lineTo(x + r * 0.42, y); g.lineTo(x - r * 0.28, y + r * 0.38); g.closePath(); g.fill(); g.stroke();
  const t = L.holdWord; g.textAlign = 'center'; g.textBaseline = 'middle';
  if (S.pressing || k > 0.55) otext(t, x, y + r * 1.75, fit(t, Math.min(Lt.U * 0.06, 30), S.W * 0.8), '#FFD166');
  g.restore();
}

// ---------- Les boutons ronds qui changent pendant la partie ----------
// Pendant une partie : ⏸ à côté du bouton son (à la place de 🗣️), et 🏠 disparaît (le menu pause a Carte / Accueil).
const shown = { pause: null, home: null, voice: null };
function syncButtons(force) {
  const p = !S.booting && pausable();
  const home = !S.booting && !p && !S.paused && (S.state === 'duo' || S.state === 'map' || (S.state === 'level' && S.Levels.phase !== 'ready'));
  const voice = !S.booting && !p && !S.paused && S.state !== 'map' && S.state !== 'level';
  if (force || p !== shown.pause) { btn.classList.toggle('hide', !p); shown.pause = p; }
  if (force || home !== shown.home) { $('homeBtn').classList.toggle('hide', !home); shown.home = home; }
  if (force || voice !== shown.voice) { $('voice').classList.toggle('hide', !voice); shown.voice = voice; }
}

// ---------- Boutons et pause automatique ----------
btn.innerHTML = icon('pause');
btn.setAttribute('aria-label', L.pause); btn.title = L.pause;
btn.addEventListener('click', e => { e.stopPropagation(); Sound.unlock(); btn.blur(); pauseGame('bouton'); });
btn.addEventListener('pointerdown', e => e.stopPropagation());
menu.addEventListener('pointerdown', e => e.stopPropagation());
menu.addEventListener('click', e => {
  const b = e.target.closest ? e.target.closest('button') : null;
  if (!b || !menu.classList.contains('armed')) return;
  e.stopPropagation(); Sound.unlock(); b.blur();
  if (b.id === 'pResume') resumeGame();
  else if (b.id === 'pRestart') restartGame();
  else if (b.id === 'pExit') exitGame();
  else if (b.id === 'pSound') toggleSound();
  else if (b.id === 'pQual') { S.cycleQuality(); qualLabel(); S.dirty = true; }
});
document.addEventListener('visibilitychange', () => {   // onglet caché : son coupé, et pause si on jouait
  Sound.silence('cachée', document.hidden);
  if (document.hidden) pauseGame('onglet');
});
window.addEventListener('blur', () => { pauseGame('fenêtre'); });   // pendant une pub, pausable() refuse : Poki prend le focus

// ---------- La page ne défile jamais ----------
window.addEventListener('keydown', e => {
  if (!SCROLL_KEYS.has(e.code)) return;
  const t = e.target, tag = t && t.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || (t && t.isContentEditable)) return;
  if (e.code === 'Space' && tag === 'BUTTON') return;   // Espace sur un bouton : un clic, pas un défilement
  e.preventDefault();
}, true);
window.addEventListener('wheel', e => { if (!(e.target.closest && e.target.closest('.sheet'))) e.preventDefault(); }, { passive: false });

// La fenêtre change beaucoup de taille en pleine partie (plein écran Poki, téléphone tourné) : pause, pour que le
// joueur ne soit jamais grillé pendant que l'image se remet en place. Les petits changements (barre d'adresse du
// téléphone qui apparaît) ne mettent pas en pause.
const RESIZE_PAUSE = 0.15;                         // changement de largeur ou de hauteur de plus de 15 %
let lastSize = [window.innerWidth, window.innerHeight];
window.addEventListener('resize', () => {
  const w = window.innerWidth, h = window.innerHeight, [w0, h0] = lastSize;
  const big = Math.abs(w - w0) > w0 * RESIZE_PAUSE || Math.abs(h - h0) > h0 * RESIZE_PAUSE;
  lastSize = [w, h];
  if (big && !S.paused && pausable()) pauseGame('taille');
});

Object.assign(S, { GRACE, pausable, pauseGame, resumeGame, restartGame, exitGame, drawGrace, syncButtons, soundLabel });
})(window.Soleil);
