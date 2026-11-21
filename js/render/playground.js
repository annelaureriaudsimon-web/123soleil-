/* js/render/playground.js — Le décor du monde 1 « La cour de récré » : sol en bitume, marelles à la craie,
   bancs, paniers de basket, plots, ballons et arbres. Tout est placé avec hash() : le même décor à chaque essai. */
(function (S) {
'use strict';
const { INK, TAU, PATH_W, FAR, clamp, css, mix, mixA, hash, pal, Lt, yAt, rrp, drawProp } = S;

// ---------- Réglages ----------
const SEG = 3.2;               // un emplacement de décor tous les 3,2 m, de chaque côté
const HOP_EVERY = 38;          // une marelle à la craie tous les 38 m (environ)
const TRACK = '#E07A5F', TRACK2 = '#D66D53', LINE = '#F6F1E7', ASPHALT = '#B3BCC9', ASPHALT2 = '#AAB3C1', CHALK = '#FFFFFF';

// La cour : le chemin devient une piste rouge, l'herbe devient du bitume (la teinte du moment de la journée est gardée)
function tintPlayground() {
  pal.path1 = mixA(pal.path1, TRACK, 0.8); pal.path2 = mixA(pal.path2, TRACK2, 0.8); pal.edge = mixA(pal.edge, LINE, 0.85);
  pal.grass1 = mixA(pal.grass1, ASPHALT, 0.78); pal.grass2 = mixA(pal.grass2, ASPHALT2, 0.78);
}

// Un quadrilatère posé au sol (x en m de chaque côté du centre, z en m devant la caméra)
function groundQuad(g, xa, xb, za, zb) {
  const sa = Lt.F / za, sb = Lt.F / zb, ya = yAt(za), yb = yAt(zb);
  g.beginPath(); g.moveTo(Lt.cx + xa * sa, ya); g.lineTo(Lt.cx + xb * sa, ya); g.lineTo(Lt.cx + xb * sb, yb); g.lineTo(Lt.cx + xa * sb, yb); g.closePath();
}

// Marelle à la craie, dessinée à plat sur le chemin (1-2-3 / 4-5 / 6 / 7-8 / CIEL)
function drawHopscotch(g, z0, camZ) {
  const dz0 = z0 - camZ;
  if (dz0 < 1.5 || dz0 > 70) return;
  const fog = clamp(dz0 / 70, 0, 1), a = 0.75 * (1 - fog);
  g.strokeStyle = css(CHALK, a); g.lineWidth = Math.max(1, 0.05 * Lt.F / dz0); g.lineJoin = 'round';
  const rows = [[1], [2], [3], [4, 5], [6], [7, 8]], cw = 0.5;
  rows.forEach((row, i) => {
    const za = dz0 + i * cw, zb = za + cw;
    if (za < 1.2) return;
    const n = row.length, x0 = -cw * n / 2;
    for (let k = 0; k < n; k++) { groundQuad(g, x0 + k * cw, x0 + (k + 1) * cw, za, zb); g.stroke(); }
  });
  const zc = dz0 + rows.length * cw;                 // le « CIEL » en demi-cercle
  if (zc > 1.2) {
    g.beginPath();
    for (let i = 0; i <= 12; i++) {
      const an = Math.PI * i / 12, x = Math.cos(an) * cw, z = zc + Math.sin(an) * cw * 0.9, sc = Lt.F / z;
      if (i === 0) g.moveTo(Lt.cx + x * sc, yAt(z)); else g.lineTo(Lt.cx + x * sc, yAt(z));
    }
    g.stroke();
  }
}

// Un objet de la cour sur le côté du chemin
function drawYardProp(t, x, y, sc, fog, seed) {
  const g = S.ctx, f = c => mix(c, pal.haze, fog), ol = fog < 0.6 && sc > 4;
  g.lineWidth = Math.max(1, 0.05 * sc); g.strokeStyle = css(INK, 1 - fog); g.lineJoin = 'round'; g.lineCap = 'round';
  if (t < 0.25 || t >= 0.78) { drawProp(0.1, x, y, sc, fog, seed); return; }   // arbre
  if (t < 0.4) {                                                          // banc
    const w = 1.5 * sc, h = 0.45 * sc;
    g.fillStyle = f('#2A9D8F');
    rrp(g, x - w / 2, y - h - 0.12 * sc, w, 0.14 * sc, 0.05 * sc); g.fill(); if (ol) g.stroke();
    rrp(g, x - w / 2, y - h - 0.5 * sc, w, 0.14 * sc, 0.05 * sc); g.fill(); if (ol) g.stroke();
    g.fillStyle = f('#5C4033');
    for (const sd of [-1, 1]) { rrp(g, x + sd * w * 0.38 - 0.05 * sc, y - h, 0.1 * sc, h, 0.03 * sc); g.fill(); if (ol) g.stroke(); }
    return;
  }
  if (t < 0.52) {                                                         // panier de basket
    const h = 2.9 * sc;
    g.fillStyle = f('#8D99AE'); rrp(g, x - 0.06 * sc, y - h, 0.12 * sc, h, 0.04 * sc); g.fill(); if (ol) g.stroke();
    g.fillStyle = f('#FFFFFF'); rrp(g, x - 0.55 * sc, y - h - 0.35 * sc, 1.1 * sc, 0.7 * sc, 0.06 * sc); g.fill(); if (ol) g.stroke();
    g.strokeStyle = f('#EF476F'); g.lineWidth = Math.max(1, 0.05 * sc);
    g.strokeRect(x - 0.22 * sc, y - h - 0.12 * sc, 0.44 * sc, 0.3 * sc);
    g.strokeStyle = f('#FF7A00'); g.lineWidth = Math.max(1.2, 0.07 * sc);
    g.beginPath(); g.ellipse(x, y - h + 0.28 * sc, 0.26 * sc, 0.07 * sc, 0, 0, TAU); g.stroke();
    return;
  }
  if (t < 0.66) {                                                         // plot orange
    g.fillStyle = f('#FF7A00');
    g.beginPath(); g.moveTo(x - 0.22 * sc, y); g.lineTo(x, y - 0.55 * sc); g.lineTo(x + 0.22 * sc, y); g.closePath(); g.fill(); if (ol) g.stroke();
    g.fillStyle = f('#FFFFFF'); g.fillRect(x - 0.12 * sc, y - 0.3 * sc, 0.24 * sc, 0.08 * sc);
    return;
  }
  {                                                                       // ballon
    const r = 0.22 * sc, by = y - r;
    g.fillStyle = f(hash(seed) < 0.5 ? '#EF476F' : '#FFD166');
    g.beginPath(); g.arc(x, by, r, 0, TAU); g.fill(); if (ol) g.stroke();
    g.fillStyle = css('#FFFFFF', 0.5 * (1 - fog)); g.beginPath(); g.arc(x - r * 0.35, by - r * 0.35, r * 0.3, 0, TAU); g.fill();
    return;
  }
}

// Remplace le décor de la course infinie quand on joue un niveau du monde 1
function drawPlayground(camZ) {
  const g = S.ctx;
  // marelles sur le chemin
  const h0 = Math.ceil((camZ + 1.5) / HOP_EVERY), h1 = Math.floor((camZ + 70) / HOP_EVERY);
  for (let k = h1; k >= h0; k--) if (k > 0) drawHopscotch(g, k * HOP_EVERY + hash(k * 9.1) * 6, camZ);
  // objets sur les côtés, du loin vers le près
  const k0 = Math.ceil((camZ + 1.5) / SEG), k1 = Math.floor((camZ + 115 * S.Q.decor) / SEG);   // qualité basse : décor moins loin
  for (let k = k1; k >= k0; k--) {
    for (let side = -1; side <= 1; side += 2) {
      if (hash(k * 1.913 + side * 51.7) < 0.32) continue;
      const z = k * SEG + hash(k * 2.71 + side * 17.3) * SEG, dz = z - camZ;
      if (dz < 1.5 || z < 6) continue;
      const lat = side * (PATH_W + 2.75 + Math.pow(hash(k * 3.17 + side * 5.9), 1.5) * 9);  // assez loin des rivaux
      const sc = Lt.F / dz, x = Lt.cx + lat * sc;
      if (x < -3 * sc || x > S.W + 3 * sc) continue;
      drawYardProp(hash(k * 4.79 + side * 2.3), x, yAt(dz), sc, Math.pow(clamp(dz / 115, 0, 1), 0.85), k * 13 + side);
    }
  }
}

Object.assign(S, { tintPlayground, drawPlayground });
})(window.Soleil);
