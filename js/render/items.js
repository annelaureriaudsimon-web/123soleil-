/* js/render/items.js — Objets sur le chemin : étoiles flottantes */
(function (S) {
'use strict';
const { INK, TAU, Lt, yAt } = S;   // déjà chargés

function drawStarShape(x, y, r, fill, rot) {       // étoile à 5 branches façon sticker
  S.ctx.save(); S.ctx.translate(x, y); S.ctx.rotate(rot);
  S.ctx.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * 0.48 : r; S.ctx.lineTo(Math.cos(a) * q, Math.sin(a) * q); }
  S.ctx.closePath();
  S.ctx.lineJoin = 'round'; S.ctx.strokeStyle = INK; S.ctx.lineWidth = Math.max(2, r * 0.22); S.ctx.stroke();
  S.ctx.fillStyle = fill; S.ctx.fill();
  S.ctx.fillStyle = 'rgba(255,255,255,0.75)';        // reflet
  S.ctx.beginPath(); S.ctx.ellipse(-r * 0.2, -r * 0.3, r * 0.17, r * 0.1, -0.6, 0, TAU); S.ctx.fill();
  S.ctx.restore();
}
function drawStarItem(camZ) {                      // l'étoile flottante et brillante sur le chemin
  if (!S.star) return;
  const dz = S.star.z - camZ;
  if (dz < 1.2 || dz > 125) return;
  const k = S.star.gone ? Math.max(0, 1 - S.star.gone / 0.35) : 1;
  if (k <= 0) return;
  const sc = Lt.F / dz, yG = yAt(dz), x = Lt.cx;
  const bob = Math.sin(S.gtime * 4.2 + S.star.z) * 0.07;
  const r = (S.star.big ? 0.36 : 0.25) * sc * (S.star.taken ? 1 + (1 - k) * 0.8 : 1);
  const y = yG - (0.78 + bob) * sc - (S.star.taken ? (1 - k) * 0.8 * sc : 0);
  S.ctx.save(); S.ctx.globalAlpha *= k;
  S.ctx.fillStyle = 'rgba(0,0,0,0.16)';              // ombre au sol
  S.ctx.beginPath(); S.ctx.ellipse(x, yG, r * 0.8, r * 0.22, 0, 0, TAU); S.ctx.fill();
  const pulse = 1 + 0.12 * Math.sin(S.gtime * 7);
  const g = S.ctx.createRadialGradient(x, y, r * 0.2, x, y, r * 2.8 * pulse);
  g.addColorStop(0, S.star.big ? 'rgba(255,214,90,0.75)' : 'rgba(255,248,200,0.65)'); g.addColorStop(1, 'rgba(255,240,170,0)');
  S.ctx.fillStyle = g; S.ctx.beginPath(); S.ctx.arc(x, y, r * 2.8 * pulse, 0, TAU); S.ctx.fill();
  drawStarShape(x, y, r, S.star.big ? '#FFD166' : '#FFF6C2', Math.sin(S.gtime * 2.2) * 0.3);
  if (S.star.big) for (let i = 0; i < 3; i++) {      // petites étincelles autour de la grosse
    const a = S.gtime * 2.5 + i * TAU / 3, d = r * 1.75;
    drawStarShape(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.6, r * 0.22, '#FFFFFF', a);
  }
  S.ctx.restore();
}

Object.assign(S, { drawStarShape, drawStarItem });
})(window.Soleil);
