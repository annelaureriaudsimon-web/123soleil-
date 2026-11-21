/* js/render/tuto.js — Les consignes dessinées : une main qui appuie ou qui lève le doigt (téléphone, tablette),
   ou la touche Espace qui s'enfonce ou remonte (clavier). On voit le geste, pas besoin de lire.
   Le geste se place sous les pieds du coureur (portrait) ou à sa droite (paysage). */
(function (S) {
'use strict';
const { INK, TAU, clamp, easeOut, L, Lt, safe, rrp, otext, fit } = S;

// ---------- Réglages ----------
const LOOP = 1.4;              // s : une boucle de l'animation
const SKIN = '#FFD8B5', SKIN_LO = '#F2B98E', SLEEVE = '#3B49F0', KEY = ['#FFFFFF', '#E3E8F5', '#B9C1DE'];

// Où dessiner le geste
function tutSpot() {
  const size = clamp(Lt.U * 0.17, 54, 92), room = S.H - safe.b - Lt.yFeet;
  if (room >= size * 0.95) return { x: Lt.cx, y: Lt.yFeet + room * 0.46, size };   // portrait : là où va le pouce
  const x = Math.min(S.W - safe.r - size * 1.15, Lt.cx + Math.max(Lt.s * 2.4, size * 1.7));
  return { x, y: Lt.yFeet - size * 0.5, size };                                     // paysage : à droite du coureur
}

// L'animation : où en est le doigt (0 = posé, 1 = levé) et l'onde de l'appui
function phaseOf(kind, t) {
  const u = (t % LOOP) / LOOP;
  if (kind === 'hold') {                           // il descend, appuie… et reste appuyé
    const lift = u < 0.18 ? 1 - easeOut(u / 0.18) : 0;
    return { lift, press: u >= 0.18 ? (u - 0.18) / 0.82 : 0 };
  }
  const lift = u < 0.3 ? 0 : easeOut(clamp((u - 0.3) / 0.3, 0, 1));   // release : appuyé, puis le doigt se lève
  return { lift, press: u < 0.3 ? u / 0.3 : 0 };
}

// La main, index pointé vers le bas, le bout du doigt en (x, y)
function drawHand(g, x, y, size, lift) {
  const fy = y - lift * size * 0.42, fw = size * 0.24, fh = size * 0.6;
  g.lineJoin = 'round'; g.strokeStyle = INK; g.lineWidth = Math.max(2.5, size * 0.045);
  // la manche
  g.fillStyle = SLEEVE; rrp(g, x - size * 0.06, fy - fh - size * 0.62, size * 0.62, size * 0.26, size * 0.06); g.fill(); g.stroke();
  // la paume et les doigts repliés
  g.fillStyle = SKIN;
  rrp(g, x - size * 0.13, fy - fh - size * 0.4, size * 0.62, size * 0.5, size * 0.18); g.fill(); g.stroke();
  for (let i = 0; i < 3; i++) {
    g.beginPath(); g.arc(x + size * (0.17 + i * 0.12), fy - fh + size * 0.08, size * 0.085, 0, TAU); g.fill(); g.stroke();
  }
  // le pouce
  rrp(g, x - size * 0.27, fy - fh - size * 0.22, size * 0.22, size * 0.14, size * 0.07); g.fill(); g.stroke();
  // l'index
  rrp(g, x - fw / 2, fy - fh, fw, fh, fw / 2); g.fill(); g.stroke();
  g.fillStyle = SKIN_LO; rrp(g, x - fw * 0.28, fy - fw * 0.75, fw * 0.56, fw * 0.4, fw * 0.2); g.fill();   // l'ongle
}

// L'endroit touché : un rond, et des ondes tant que le doigt appuie
function drawTouchPoint(g, x, y, size, ph) {
  const r = size * 0.16;
  if (ph.lift < 0.05) {
    for (let i = 0; i < 2; i++) {
      const k = (ph.press * 1.6 + i * 0.5) % 1;
      g.strokeStyle = `rgba(255,255,255,${(0.85 * (1 - k)).toFixed(3)})`; g.lineWidth = Math.max(2, size * 0.04);
      g.beginPath(); g.ellipse(x, y, r * (1 + k * 2.2), r * (0.45 + k), 0, 0, TAU); g.stroke();
    }
  }
  g.fillStyle = 'rgba(255,255,255,0.85)'; g.strokeStyle = INK; g.lineWidth = Math.max(2, size * 0.035);
  g.beginPath(); g.ellipse(x, y, r, r * 0.45, 0, 0, TAU); g.fill(); g.stroke();
}

// Le doigt qui se lève : petits traits de mouvement vers le haut
function drawLiftLines(g, x, y, size, lift) {
  if (lift < 0.2) return;
  g.strokeStyle = `rgba(255,255,255,${(0.9 * Math.min(1, lift * 1.5)).toFixed(3)})`; g.lineCap = 'round'; g.lineWidth = Math.max(2.5, size * 0.05);
  for (const dx of [-0.32, 0.32]) {
    const bx = x + dx * size, by = y - size * 0.1;
    g.beginPath(); g.moveTo(bx, by); g.lineTo(bx, by - size * 0.32 * lift); g.stroke();
    g.beginPath(); g.moveTo(bx - size * 0.08, by - size * 0.24 * lift); g.lineTo(bx, by - size * 0.33 * lift); g.lineTo(bx + size * 0.08, by - size * 0.24 * lift); g.stroke();
  }
}

// La touche Espace, enfoncée (press) ou relevée
function drawSpaceKey(g, x, y, size, ph) {
  const w = size * 1.9, h = size * 0.6, down = (1 - ph.lift) * h * 0.14, edge = h * 0.2;
  g.lineJoin = 'round'; g.strokeStyle = INK; g.lineWidth = Math.max(2.5, size * 0.045);
  g.fillStyle = KEY[2]; rrp(g, x - w / 2, y - h / 2 + edge, w, h, h * 0.26); g.fill(); g.stroke();   // la tranche
  const grd = g.createLinearGradient(0, y - h / 2 + down, 0, y + h / 2 + down);
  grd.addColorStop(0, ph.lift < 0.05 ? KEY[1] : KEY[0]); grd.addColorStop(1, KEY[1]);
  g.fillStyle = grd; rrp(g, x - w / 2, y - h / 2 + down, w, h, h * 0.26); g.fill(); g.stroke();
  g.fillStyle = INK; g.font = `900 ${Math.round(h * 0.36)}px ${S.FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(L.spaceKey, x, y + down + h * 0.02);
  if (ph.lift < 0.05) {                            // appuyée : un halo qui pulse
    const k = ph.press % 1;
    g.strokeStyle = `rgba(255,255,255,${(0.8 * (1 - k)).toFixed(3)})`; g.lineWidth = Math.max(2, size * 0.04);
    rrp(g, x - w / 2 - k * size * 0.2, y - h / 2 + down - k * size * 0.2, w + k * size * 0.4, h + k * size * 0.4, h * 0.3); g.stroke();
  }
}

// Le geste à faire : 'hold' (maintiens) ou 'release' (lâche). a : opacité. at : position imposée (optionnelle)
function drawTut(kind, a = 1, at = null) {
  const g = S.ctx, p = at || tutSpot(), ph = phaseOf(kind, S.gtime);
  g.save(); g.globalAlpha = clamp(a, 0, 1);
  if (S.touchUI) {
    drawTouchPoint(g, p.x, p.y, p.size, ph);
    if (kind === 'release') drawLiftLines(g, p.x, p.y, p.size, ph.lift);
    drawHand(g, p.x, p.y - p.size * 0.04, p.size, ph.lift);
  } else {
    drawSpaceKey(g, p.x, p.y - p.size * 0.12, p.size * 0.85, ph);
    if (kind === 'release') drawLiftLines(g, p.x, p.y - p.size * 0.42, p.size, ph.lift);
  }
  g.restore();
}

// Le mot qui va avec (au-dessus du coureur), en gros et qui respire
function drawTutWord(text, col = '#FFD166', a = 1) {
  const g = S.ctx, s = fit(text, Math.min(Lt.U * 0.085, 44), S.W * 0.86) * (1 + Math.sin(S.gtime * 6) * 0.04);
  g.save(); g.globalAlpha = clamp(a, 0, 1); g.textAlign = 'center'; g.textBaseline = 'middle';
  otext(text, Lt.cx, Lt.yFeet - Lt.s * 2.6, s, col);
  g.restore();
}

Object.assign(S, { tutSpot, drawTut, drawTutWord, drawHand, drawSpaceKey });
})(window.Soleil);
