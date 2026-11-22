/* js/render/sky.js — Ciel, collines et nuage devant le soleil */
(function (S) {
'use strict';
const { INK, TAU, clamp, css, easeOut, hash, pal, Lt } = S;   // déjà chargés
   // projection d'un point du sol (+ pente)

/* ---------- 21. Dessin : ciel, soleil, collines, sol ---------- */
function drawSky() {
  const g = S.ctx.createLinearGradient(0, 0, 0, Lt.hy);
  g.addColorStop(0, css(pal.skyTop)); g.addColorStop(1, css(pal.skyBot));
  S.ctx.fillStyle = g; S.ctx.fillRect(-40, -40, S.W + 80, Lt.hy + 42);
  if (pal.night > 0.04) {                            // étoiles
    for (let i = 0; i < 70; i++) {
      const x = hash(i * 3.17) * S.W, y = hash(i * 7.71 + 2) * Lt.hy * 0.92;
      const tw = 0.55 + 0.45 * Math.sin(S.gtime * (1.5 + hash(i) * 2) + i);
      S.ctx.fillStyle = `rgba(255,252,235,${(pal.night * tw).toFixed(3)})`;
      S.ctx.beginPath(); S.ctx.arc(x, y, 0.7 + hash(i * 1.37) * 1.5, 0, TAU); S.ctx.fill();
    }
  }
  S.ctx.fillStyle = css(pal.cloud, 0.9 * (1 - pal.night * 0.55));   // nuages
  for (let i = 0; i < 5; i++) {
    const span = S.W + 360, sp = 5 + hash(i + 40) * 9;
    const x = ((hash(i + 10) * span + S.gtime * sp) % span) - 180;
    const y = Lt.hy * (0.1 + hash(i + 20) * 0.55), s = Lt.U * (0.045 + hash(i + 30) * 0.045);
    S.ctx.beginPath();
    S.ctx.moveTo(x + s * 1.7, y); S.ctx.ellipse(x, y, s * 1.7, s * 0.5, 0, 0, TAU);
    S.ctx.moveTo(x + s * 0.2, y - s * 0.3); S.ctx.ellipse(x - s * 0.55, y - s * 0.3, s * 0.75, s * 0.55, 0, 0, TAU);
    S.ctx.moveTo(x + s * 1.3, y - s * 0.45); S.ctx.ellipse(x + s * 0.45, y - s * 0.45, s * 0.85, s * 0.65, 0, 0, TAU);
    S.ctx.fill();
  }
}

function drawHills() {
  for (let layer = 0; layer < 2; layer++) {
    S.ctx.fillStyle = css(layer ? pal.hillNear : pal.hillFar);
    const amp = Lt.U * (layer ? 0.035 : 0.06);
    S.ctx.beginPath(); S.ctx.moveTo(-40, Lt.hy + 1);
    for (let x = -40; x <= S.W + 50; x += 10) {
      const u = x / S.W, edge = Math.min(1, Math.abs(u - 0.5) * 2);
      const h = (0.55 + 0.45 * Math.sin(u * (layer ? 9 : 5.5) + layer * 2 + 1.3)) * amp * (0.35 + 0.65 * edge);
      S.ctx.lineTo(x, Lt.hy - h);
    }
    S.ctx.lineTo(S.W + 50, Lt.hy + 1); S.ctx.closePath(); S.ctx.fill();
  }
}

// Nuage : en unités du nuage (u × demi-largeur, v × demi-hauteur, rayon × la plus petite des deux)
const CLOUD_PUFFS = [[0, 0.18, 0.8], [-0.72, 0.35, 0.42], [-0.32, 0.42, 0.55], [0.12, 0.45, 0.55], [0.55, 0.38, 0.5], [0.86, 0.3, 0.32],
                     [-0.62, -0.05, 0.48], [-0.2, -0.22, 0.62], [0.28, -0.22, 0.6], [0.68, 0.0, 0.46],
                     [-0.02, -0.55, 0.5], [0.45, -0.55, 0.36], [-0.45, -0.52, 0.38], [-0.86, 0.22, 0.3]];
function drawCloud() {                             // gros nuage devant le soleil : on ne voit qu'une lueur
  if (S.cloudK < 0.01) return;
  const R = Lt.R, top = Lt.chantY - Lt.chantSize * 0.8, bot = Lt.sunY + R * 1.08;
  const hh = (bot - top) / 2, cy = (top + bot) / 2, hw = Math.min(Math.max(R * 2.3, hh * 1.4), S.W * 0.5);
  const x = Lt.cx + (1 - easeOut(clamp(S.cloudK, 0, 1))) * (S.W * 0.5 + hw * 1.2) * S.watcher.cloudDir;
  const unit = Math.min(hw, hh);
  const path = () => {
    S.ctx.beginPath();
    for (const [u, v, r] of CLOUD_PUFFS) { const px = x + u * hw, py = cy + v * hh, pr = r * unit; S.ctx.moveTo(px + pr, py); S.ctx.arc(px, py, pr, 0, TAU); }
  };
  S.ctx.save();
  path(); S.ctx.strokeStyle = INK; S.ctx.lineWidth = Math.max(5, unit * 0.09); S.ctx.lineJoin = 'round'; S.ctx.stroke();   // contour sticker
  const g = S.ctx.createLinearGradient(0, top, 0, bot);
  g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, '#D6DCEA');
  path(); S.ctx.fillStyle = g; S.ctx.fill();
  const sx = Lt.cx, sy = Lt.sunY + S.watcher.offY + S.sunSink;   // la lueur du soleil (ou de la Lune) à travers le nuage
  // (v2.5 — niveaux : la lueur ne dit rien de son regard ; c'est le reflet dans l'eau qui le montre, render/lies.js)
  const col = S.watcher.type === 'moon' ? '185,205,255' : S.lookAmt > 0.3 && S.state !== 'level' ? '255,120,90' : '255,214,110';
  const gl = S.ctx.createRadialGradient(sx, sy, R * 0.15, sx, sy, R * 1.3);
  gl.addColorStop(0, `rgba(${col},${(0.6 * S.cloudK).toFixed(3)})`); gl.addColorStop(1, `rgba(${col},0)`);
  path(); S.ctx.clip(); S.ctx.fillStyle = gl; S.ctx.fillRect(sx - R * 1.35, sy - R * 1.35, R * 2.7, R * 2.7);
  S.ctx.restore();
}

Object.assign(S, { drawSky, drawHills, CLOUD_PUFFS, drawCloud });
})(window.Soleil);
