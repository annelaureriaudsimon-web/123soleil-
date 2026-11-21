/* js/render/hud.js — Chant à l’écran, bannières, HUD de la course infinie, titre */
(function (S) {
'use strict';
const { FONT, INK, L, clamp, Lt, safe, ghostZ, drawGhostIcon, drawStar, fit, otext, otextC, rrp } = S;   // déjà chargés

function drawChant() {                               // « 1… 2… 3… SO… SOLEIL ! »
  const w = S.watcher;
  if (w.boss && (w.state === 'chant' || w.state === 'turn' || w.state === 'look' || w.state === 'peek' || w.state === 'hop')) {
    const bs = Math.min(Lt.U * 0.045, 22), by = Lt.chantY - Lt.chantSize * 0.95;
    S.ctx.save(); S.ctx.translate(Lt.cx, by); const k = 1 + 0.08 * Math.sin(S.gtime * 10); S.ctx.scale(k, k);
    S.ctx.fillStyle = '#E63946'; S.ctx.strokeStyle = INK; S.ctx.lineWidth = 3;
    rrp(S.ctx, -bs * 1.9, -bs * 0.75, bs * 3.8, bs * 1.5, bs * 0.75); S.ctx.fill(); S.ctx.stroke();
    S.ctx.textAlign = 'center'; S.ctx.textBaseline = 'middle'; S.ctx.fillStyle = '#FFFFFF'; S.ctx.font = `900 ${bs}px ${FONT}`;
    S.ctx.fillText(L.boss, 0, bs * 0.05); S.ctx.restore();
  }
  if (!w.text) return;
  let a = 1;
  if (w.state !== 'chant' && w.state !== 'turn' && w.state !== 'peek' && w.state !== 'hop') a = clamp(1 - (S.gtime - w.textFadeT) / 0.3, 0, 1);
  a *= clamp(1 - S.cloudK * 1.6, 0, 1);               // derrière le nuage : on n'entend que la voix
  if (a <= 0.01) return;
  const since = S.gtime - w.textT;
  const trapShown = w.textKind === 'trap' && since > 0.2;
  let size = Lt.chantSize * (w.textKind === 'trigger' || w.textKind === 'trap' ? 1.15 : w.textKind === 'hmm' ? 0.75 : 1);
  size = fit(w.text, size, S.W * 0.92);
  const sc = 1 + 0.5 * Math.exp(-since * 13);
  const col = trapShown ? '#06D6A0' : (w.textKind === 'trigger' || w.textKind === 'trap') ? '#FF4D6D' : w.textKind === 'so' ? '#FFD166' : '#FFFFFF';
  S.ctx.save(); S.ctx.translate(Lt.cx, Lt.chantY);
  if (trapShown) S.ctx.rotate(Math.sin(S.gtime * 22) * 0.06 * Math.max(0, 1 - (since - 0.2) * 1.5));
  S.ctx.scale(sc, sc);
  otextC(w.text, size, col, a);
  if ((w.textKind === 'num' || w.textKind === 'so') && w.state === 'chant' && since > 0.42 && S.cloudK < 0.05) {   // il fait durer le suspense…
    const n = 1 + (Math.floor((since - 0.42) / 0.22) % 3);
    S.ctx.font = `900 ${size}px ${FONT}`;
    const tw = S.ctx.measureText(w.text).width;
    S.ctx.textAlign = 'left';
    otext('.'.repeat(n), tw / 2 + size * 0.05, 0, size, col);
  }
  S.ctx.restore();
}

function drawGrille() {                              // gros « GRILLÉ ! »
  if (!(S.state === 'caught' || S.state === 'over' || S.lvCaught)) return;
  const t = S.caughtT - 0.3; if (t < 0) return;
  const size = fit(L.caught, Lt.chantSize * 1.2, S.W * 0.76);
  const sc = 1 + 1.5 * Math.exp(-t * 12);
  S.ctx.save(); S.ctx.translate(Lt.cx, Lt.chantY); S.ctx.rotate(-0.08); S.ctx.scale(sc, sc);
  otextC(L.caught, size, '#FF7A3D', clamp(t * 8, 0, 1));
  S.ctx.restore();
}

function drawBanner(title, sub, sub2, t, life, col) {
  const a = clamp(t / 0.25, 0, 1) * clamp((life - t) / 0.45, 0, 1);
  if (a <= 0) return;
  const y = Lt.hy + (Lt.yFeet - Lt.s * 1.45 - Lt.hy) * 0.4;
  const s1 = fit(title, Math.min(Lt.U * 0.12, 64), S.W * 0.9);
  const s2 = sub ? fit(sub, Math.min(Lt.U * 0.05, 24), S.W * 0.92) : 0;
  const s3 = sub2 ? fit(sub2, Math.min(Lt.U * 0.04, 19), S.W * 0.92) : 0;
  const sc = 1 + 0.3 * Math.exp(-t * 8);
  S.ctx.save(); S.ctx.translate(Lt.cx, y); S.ctx.scale(sc, sc);
  otextC(title, s1, col, a);
  if (s2) { S.ctx.translate(0, s1 * 0.85); otextC(sub, s2, '#FFFFFF', a); }
  if (s3) { S.ctx.translate(0, s2 * 1.3); otextC(sub2, s3, '#FFD166', a); }
  S.ctx.restore();
}

function drawHUD() {
  const x = 14 + safe.l + S.pillX, y = 12 + safe.t, fs = Math.min(Lt.U * 0.09, 52);   // pillX : la pilule Poki
  const shown = S.state === 'play' || !S.lastRun ? Math.floor(S.runner.z) : S.lastRun.dist;   // la glissade après « GRILLÉ » ne compte pas
  S.ctx.textAlign = 'left'; S.ctx.textBaseline = 'top';
  otext(`${shown} m`, x, y, fs, '#FFFFFF');
  const s2 = fs * 0.42;
  let yy = y + fs * 1.08;
  if (S.passedRecord) { otext(L.bestLive, x, yy, s2, Math.sin(S.gtime * 8) > 0 ? '#FFD166' : '#FFFFFF'); yy += s2 * 1.4; }
  else if (S.best > 0) { otext(L.best(Math.floor(S.best)), x, yy, s2, '#FFD166'); yy += s2 * 1.4; }
  if (S.state === 'play' && S.ghostAlive) {               // écart avec ton fantôme
    const gz = ghostZ(S.runT);
    if (gz !== null) {
      const d = Math.round(S.runner.z - gz);
      drawGhostIcon(x + s2 * 0.5, yy + s2 * 0.42, s2 * 0.45);
      S.ctx.textAlign = 'left'; S.ctx.textBaseline = 'top';
      otext(`${d >= 0 ? '+' : '−'}${Math.abs(d)} m`, x + s2 * 1.25, yy, s2, d >= 0 ? '#8CF5B5' : '#FF8FA3');
    }
  }
  if (S.state === 'play' || S.state === 'caught') {     // étoiles gagnées et combo, sous le bouton son
    const rx = S.W - 16 - safe.r, ry = safe.t + 66, ss = s2 * 1.25;
    S.ctx.textAlign = 'right'; S.ctx.textBaseline = 'top';
    otext(String(S.runStars), rx, ry, ss, '#FFD166');
    S.ctx.font = `900 ${ss}px ${FONT}`;
    drawStar(rx - S.ctx.measureText(String(S.runStars)).width - ss * 0.62, ry + ss * 0.5, ss * 0.48);
    let cy2 = ry + ss * 1.35;
    if (S.combo >= 2) {
      const k = 1 + 0.06 * Math.sin(S.gtime * 12);
      S.ctx.save(); S.ctx.translate(rx, cy2); S.ctx.scale(k, k); S.ctx.textAlign = 'right'; S.ctx.textBaseline = 'top';
      otext(`×${S.combo}`, 0, 0, ss * 1.15, '#FF7A3D'); S.ctx.restore();
      cy2 += ss * 1.45;
    }
    if (S.RS.catches > 0) {                            // étoiles flottantes attrapées dans la partie
      S.ctx.textAlign = 'right'; S.ctx.textBaseline = 'top';
      otext(`✨${S.RS.catches}`, rx, cy2, ss * 0.9, '#FFF3B0');
    }
  }
  if (S.tutorial && S.state === 'play' && S.cycleN <= 1) {   // 1re course : le geste dessiné (main ou touche Espace) et un mot
    const w = S.watcher;
    const stop = (w.state === 'chant' && (w.textKind === 'so' || w.textKind === 'trigger')) || w.state === 'turn' || w.state === 'look';   // « SO… » : on lâche
    S.drawTut(stop ? 'release' : 'hold');
    S.drawTutWord(stop ? L.letGo : L.holdWord, stop ? '#FF8FA3' : '#FFD166');
  }
}

// ---------- Le logo « 1, 2, 3… SOLEIL ! » : lettres bombées, gros contour bleu, relief bleu nuit ----------
const LOGO_BLUE = '#3B49F0', LOGO_NAVY = '#141A6E';
const logoCache = new Map();
function logoSprite(t, size, top, bot) {           // dessiné une seule fois par taille, puis recopié à chaque image
  const key = `${t}|${Math.round(size * 2)}|${top}|${S.DPR}`;
  let c = logoCache.get(key);
  if (c) return c;
  if (logoCache.size > 12) logoCache.clear();
  c = document.createElement('canvas');
  const g = c.getContext('2d'), font = `900 ${size}px ${FONT}`;
  g.font = font;
  const tw = g.measureText(t).width, rim = size * 0.17, depth = size * 0.13, pad = rim + 4;
  c.w = tw + pad * 2; c.h = size * 1.25 + depth + pad * 2;
  c.width = Math.ceil(c.w * S.DPR); c.height = Math.ceil(c.h * S.DPR);
  g.scale(S.DPR, S.DPR);
  g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.miterLimit = 2;
  const x = c.w / 2, y = pad + size * 0.62;
  g.strokeStyle = LOGO_NAVY; g.lineWidth = rim * 2;              // le relief : le bord bleu nuit, recopié vers le bas
  for (let d = depth; d >= 0; d -= Math.max(1, depth / 7)) g.strokeText(t, x, y + d);
  g.strokeText(t, x, y);
  g.strokeStyle = LOGO_BLUE; g.lineWidth = size * 0.2;            // le contour bleu vif
  g.strokeText(t, x, y);
  const grd = g.createLinearGradient(0, y - size * 0.45, 0, y + size * 0.45);   // les lettres : plus claires en haut
  grd.addColorStop(0, top); grd.addColorStop(1, bot);
  g.fillStyle = grd; g.fillText(t, x, y);
  c.cx = x; c.cy = y;
  logoCache.set(key, c);
  return c;
}
function drawLogo(t, size, top, bot) {             // centré sur (0, 0)
  const c = logoSprite(t, size, top, bot);
  S.ctx.drawImage(c, -c.cx, -c.cy, c.w, c.h);
}

function drawTitle() {                     // le titre se cale au-dessus des boutons de l'accueil
  const side = Lt.land && S.W > S.H * 1.2;
  let cx, midY, s2;
  if (side) {                                // paysage : titre sur l'herbe à gauche, boutons à droite
    cx = S.W * 0.25; midY = Lt.hy + (Lt.yFeet - Lt.hy) * 0.42;
    s2 = Math.min(fit(L.title2, Math.min(Lt.U * 0.14, 100), S.W * 0.4), (Lt.yFeet - Lt.hy) * 0.8 / 1.75);
  } else {                                   // portrait : entre l'horizon et le coureur (ou les boutons)
    const top = Lt.hy + 8, bottom = Math.min(Lt.homeTop || S.H, Lt.yFeet - Lt.s * 1.35) - 8;
    cx = Lt.cx; midY = (top + bottom) / 2;
    s2 = Math.min(fit(L.title2, Math.min(Lt.U * 0.18, 110), S.W * 0.86), Math.max(20, (bottom - top) / 1.75));
  }
  const s1 = s2 * 0.6, wob = Math.sin(S.gtime * 2.4);
  S.ctx.save(); S.ctx.translate(cx, midY - s2 * 0.62); S.ctx.rotate(-0.05 + wob * 0.012); drawLogo('1, 2, 3…', s1, '#FFFFFF', '#D6DDFF'); S.ctx.restore();
  S.ctx.save(); S.ctx.translate(cx, midY + s2 * 0.18); S.ctx.rotate(-0.035); const k = 1 + wob * 0.025; S.ctx.scale(k, k);
  drawLogo(L.title2, s2, '#FFF27A', '#FFAE1A'); S.ctx.restore();
}

function drawReplayHint() {
  if (S.state !== 'over' || S.gtime - S.overT < 0.3 || S.panelOpen) return;
  const txt = S.mode === 'daily' ? S.forDevice(L.replayHome, L.keyHome) : S.forDevice(L.replayTouch, L.replayKey);   // après le défi : retour à l'accueil
  const size = fit(txt, Math.min(Lt.U * 0.05, 22), S.W * 0.9), k = 1 + 0.05 * Math.sin(S.gtime * 6);
  S.ctx.save(); S.ctx.translate(Lt.cx, S.H - safe.b - size * 1.4); S.ctx.scale(k, k);
  S.ctx.textAlign = 'center'; S.ctx.textBaseline = 'middle';
  otext(txt, 0, 0, size, '#FFFFFF');
  S.ctx.restore();
}

Object.assign(S, { drawChant, drawGrille, drawBanner, drawHUD, drawTitle, drawLogo, drawReplayHint });
})(window.Soleil);
