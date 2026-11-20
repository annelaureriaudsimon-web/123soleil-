/* js/render/draw.js — Outils de dessin : textes « sticker », étoiles, projection au sol */
(function (S) {
'use strict';
const { CAM_BACK, CAM_H, FONT, INK, TAU, Lt } = S;   // déjà chargés

/* ---------- 20. Dessin : outils ---------- */
function rrp(g, x, y, w, h, r) {                   // rectangle arrondi
  if (w < 0) { x += w; w = -w; }
  if (h < 0) { y += h; h = -h; }
  r = Math.min(r, w / 2, h / 2);
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}
function otext(t, x, y, size, fill, shadow = true) {   // texte façon sticker
  S.ctx.font = `900 ${size}px ${FONT}`;
  S.ctx.lineJoin = 'round'; S.ctx.miterLimit = 2;
  S.ctx.strokeStyle = INK; S.ctx.lineWidth = Math.max(2.5, size * 0.2);
  if (shadow) S.ctx.strokeText(t, x, y + size * 0.07);
  S.ctx.strokeText(t, x, y);
  S.ctx.fillStyle = fill; S.ctx.fillText(t, x, y);
}
const spriteCache = new Map();
function textSprite(t, size, fill) {             // texte sticker pré-dessiné, pour des fondus sans « bavure »
  const key = `${t}|${Math.round(size * 2)}|${fill}|${S.DPR}`;
  let c = spriteCache.get(key);
  if (c) return c;
  if (spriteCache.size > 80) spriteCache.clear();
  c = document.createElement('canvas');
  const g = c.getContext('2d');
  g.font = `900 ${size}px ${FONT}`;
  const lw = Math.max(2.5, size * 0.2);
  const w = Math.ceil(g.measureText(t).width + lw * 2 + 6), h = Math.ceil(size * 1.5 + lw * 2);
  c.width = Math.ceil(w * S.DPR); c.height = Math.ceil(h * S.DPR);
  g.scale(S.DPR, S.DPR);
  g.font = `900 ${size}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineJoin = 'round'; g.miterLimit = 2; g.strokeStyle = INK; g.lineWidth = lw;
  const cy = h / 2 - size * 0.035;
  g.strokeText(t, w / 2, cy + size * 0.07); g.strokeText(t, w / 2, cy);
  g.fillStyle = fill; g.fillText(t, w / 2, cy);
  c.w = w; c.h = h; c.cy = cy;
  spriteCache.set(key, c);
  return c;
}
function otextC(t, size, fill, alpha = 1) {      // texte centré sur (0, 0)
  if (alpha <= 0.01) return;
  if (alpha >= 0.995) { S.ctx.textAlign = 'center'; S.ctx.textBaseline = 'middle'; otext(t, 0, 0, size, fill); return; }
  const c = textSprite(t, size, fill), ga = S.ctx.globalAlpha;
  S.ctx.globalAlpha = ga * alpha;
  S.ctx.drawImage(c, -c.w / 2, -c.cy, c.w, c.h);
  S.ctx.globalAlpha = ga;
}
function fit(text, size, maxW) {
  S.ctx.font = `900 ${size}px ${FONT}`;
  const w = S.ctx.measureText(text).width * 1.1 + size * 0.2;
  return w > maxW ? size * maxW / w : size;
}
function drawStar(x, y, r) {
  S.ctx.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * 0.46 : r; S.ctx.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); }
  S.ctx.closePath();
  S.ctx.fillStyle = '#FFD166'; S.ctx.strokeStyle = INK; S.ctx.lineWidth = Math.max(2, r * 0.3); S.ctx.lineJoin = 'round';
  S.ctx.stroke(); S.ctx.fill();
}
function drawGhostIcon(x, y, r) {
  S.ctx.beginPath();
  S.ctx.moveTo(x - r, y + r);
  S.ctx.lineTo(x - r, y); S.ctx.arc(x, y, r, Math.PI, 0); S.ctx.lineTo(x + r, y + r);
  for (let i = 0; i < 3; i++) S.ctx.quadraticCurveTo(x + r - (i + 0.5) * r * 2 / 3, y + r * 0.6, x + r - (i + 1) * r * 2 / 3, y + r);
  S.ctx.closePath();
  S.ctx.fillStyle = '#FFFFFF'; S.ctx.strokeStyle = INK; S.ctx.lineWidth = Math.max(2, r * 0.3);
  S.ctx.stroke(); S.ctx.fill();
  S.ctx.fillStyle = INK;
  S.ctx.beginPath(); S.ctx.arc(x - r * 0.35, y, r * 0.18, 0, TAU); S.ctx.arc(x + r * 0.35, y, r * 0.18, 0, TAU); S.ctx.fill();
}
const yAt = dz => Lt.hy + CAM_H * Lt.F / dz + S.tiltPx * (1 - CAM_BACK / dz);

Object.assign(S, { rrp, otext, spriteCache, textSprite, otextC, fit, drawStar, drawGhostIcon, yAt });
})(window.Soleil);
