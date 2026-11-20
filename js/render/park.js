/* js/render/park.js — Le décor du monde 2 « Le parc » : allée de gravier, pelouses bien vertes, arbres variés
   (chênes, sapins, bouleaux, cerisiers en fleurs), bancs, réverbères, massifs de fleurs, fontaines, kiosques,
   pigeons qui s'envolent quand tu passes, et un cerf-volant dans le ciel.
   Tout est placé avec hash() : le même décor à chaque essai (seuls les battements d'ailes sont « au hasard »). */
(function (S) {
'use strict';
const { INK, TAU, PATH_W, clamp, lerp, css, mix, mixA, hash, pal, Lt, yAt, rrp, drawProp, Sound } = S;

// ---------- Réglages ----------
const SEG = 3.4;               // un emplacement de décor tous les 3,4 m, de chaque côté
const FOUNTAIN_EVERY = 64;     // une fontaine tous les 64 m (environ), d'un côté
const KIOSK_EVERY = 96;        // un kiosque à musique tous les 96 m (environ), de l'autre côté
const PIGEON_EVERY = 23;       // une petite bande de pigeons tous les 23 m
const GRAVEL = '#E6D8B6', GRAVEL2 = '#DCCCA6', BORDER = '#A8956A', LAWN = '#6FCF73', LAWN2 = '#62C267';

// Les couleurs du parc (la teinte du moment de la journée est gardée)
function tintPark() {
  pal.path1 = mixA(pal.path1, GRAVEL, 0.78); pal.path2 = mixA(pal.path2, GRAVEL2, 0.78); pal.edge = mixA(pal.edge, BORDER, 0.7);
  pal.grass1 = mixA(pal.grass1, LAWN, 0.6); pal.grass2 = mixA(pal.grass2, LAWN2, 0.6);
}

// Un objet du parc sur le côté du chemin (x, y : pied de l'objet ; sc : pixels par mètre ; fog : brume)
function drawParkProp(t, x, y, sc, fog, seed) {
  const g = S.ctx, f = c => mix(c, pal.haze, fog), ol = fog < 0.6 && sc > 4;
  g.lineWidth = Math.max(1, 0.05 * sc); g.strokeStyle = css(INK, 1 - fog); g.lineJoin = 'round'; g.lineCap = 'round';
  if (t < 0.2) { drawProp(0.1, x, y, sc, fog, seed); return; }            // chêne (l'arbre du jeu)
  if (t < 0.32) {                                                         // sapin
    g.fillStyle = f('#6B4226'); g.fillRect(x - 0.1 * sc, y - 0.6 * sc, 0.2 * sc, 0.6 * sc);
    g.fillStyle = f('#2E8B57');
    for (let i = 0; i < 3; i++) {
      const w = (1.1 - i * 0.28) * sc, yb = y - (0.45 + i * 0.75) * sc;
      g.beginPath(); g.moveTo(x - w, yb); g.lineTo(x, yb - 1.25 * sc); g.lineTo(x + w, yb); g.closePath(); g.fill(); if (ol) g.stroke();
    }
    return;
  }
  if (t < 0.42) {                                                         // bouleau (tronc blanc) ou cerisier en fleurs
    const blossom = hash(seed * 1.7) < 0.5;
    g.fillStyle = f(blossom ? '#7A4A2E' : '#F4F1EA'); rrp(g, x - 0.09 * sc, y - 2.0 * sc, 0.18 * sc, 2.0 * sc, 0.05 * sc); g.fill(); if (ol) g.stroke();
    if (!blossom) { g.fillStyle = f('#2B2D42'); for (let i = 0; i < 4; i++) g.fillRect(x - 0.09 * sc, y - (0.4 + i * 0.4) * sc, 0.1 * sc, 0.05 * sc); }
    g.fillStyle = f(blossom ? '#FFB3C7' : '#9ADB6A');
    for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; g.beginPath(); g.arc(x + Math.cos(a) * 0.45 * sc, y - 2.35 * sc + Math.sin(a) * 0.35 * sc, 0.5 * sc, 0, TAU); g.fill(); }
    if (blossom && fog < 0.5) { g.fillStyle = f('#FFFFFF'); for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(x + (hash(seed + i) - 0.5) * 1.4 * sc, y - (2 + hash(seed * 3 + i) * 0.9) * sc, 0.06 * sc, 0, TAU); g.fill(); } }
    return;
  }
  if (t < 0.56) {                                                         // banc du parc (lattes vertes, pieds en fer)
    const w = 1.6 * sc, h = 0.45 * sc;
    g.fillStyle = f('#2F8F4E');
    for (const dy of [0.12, 0.3, 0.55, 0.72]) { rrp(g, x - w / 2, y - h - dy * sc, w, 0.1 * sc, 0.03 * sc); g.fill(); if (ol) g.stroke(); }
    g.fillStyle = f('#2B2D42');
    for (const sd of [-1, 1]) { g.fillRect(x + sd * w * 0.4 - 0.05 * sc, y - h - 0.1 * sc, 0.1 * sc, h + 0.1 * sc); }
    return;
  }
  if (t < 0.66) {                                                         // réverbère
    g.fillStyle = f('#24533A'); rrp(g, x - 0.06 * sc, y - 2.6 * sc, 0.12 * sc, 2.6 * sc, 0.04 * sc); g.fill(); if (ol) g.stroke();
    g.fillStyle = f('#FFF3B0'); rrp(g, x - 0.2 * sc, y - 3.0 * sc, 0.4 * sc, 0.4 * sc, 0.08 * sc); g.fill(); if (ol) g.stroke();
    g.fillStyle = f('#24533A'); g.beginPath(); g.moveTo(x - 0.28 * sc, y - 3.0 * sc); g.lineTo(x, y - 3.25 * sc); g.lineTo(x + 0.28 * sc, y - 3.0 * sc); g.closePath(); g.fill();
    return;
  }
  if (t < 0.84) {                                                         // massif de fleurs
    g.fillStyle = f('#3E9B4F'); g.beginPath(); g.ellipse(x, y - 0.1 * sc, 0.8 * sc, 0.25 * sc, 0, 0, TAU); g.fill(); if (ol) g.stroke();
    const cols = ['#FF4D6D', '#FFD166', '#FFFFFF', '#9B5DE5', '#FF9F1C'];
    for (let i = 0; i < 9; i++) {
      g.fillStyle = f(cols[Math.floor(hash(seed * 5 + i) * cols.length)]);
      g.beginPath(); g.arc(x + (hash(seed + i * 3) - 0.5) * 1.3 * sc, y - (0.12 + hash(seed * 7 + i) * 0.22) * sc, 0.09 * sc, 0, TAU); g.fill();
    }
    return;
  }
  drawProp(0.3, x, y, sc, fog, seed);                                     // touffe d'herbe
}

// ⛲ Fontaine : bassin rond et jets d'eau animés
function drawFountain(x, y, sc, fog) {
  const g = S.ctx, f = c => mix(c, pal.haze, fog);
  g.lineWidth = Math.max(1, 0.06 * sc); g.strokeStyle = css(INK, 1 - fog);
  g.fillStyle = f('#BFC6CF'); g.beginPath(); g.ellipse(x, y - 0.3 * sc, 1.9 * sc, 0.55 * sc, 0, 0, TAU); g.fill(); g.stroke();
  g.fillStyle = f('#5EC8F2'); g.beginPath(); g.ellipse(x, y - 0.42 * sc, 1.6 * sc, 0.4 * sc, 0, 0, TAU); g.fill();
  g.fillStyle = f('#BFC6CF'); rrp(g, x - 0.18 * sc, y - 1.5 * sc, 0.36 * sc, 1.1 * sc, 0.08 * sc); g.fill(); g.stroke();
  g.strokeStyle = css('#E8F8FF', 0.9 * (1 - fog)); g.lineWidth = Math.max(1, 0.07 * sc);
  for (const sd of [-1, 1]) {
    g.beginPath(); g.moveTo(x, y - 1.55 * sc);
    g.quadraticCurveTo(x + sd * 0.7 * sc, y - (2.6 + 0.15 * Math.sin(S.gtime * 6)) * sc, x + sd * 1.25 * sc, y - 0.5 * sc); g.stroke();
  }
  g.fillStyle = css('#E8F8FF', 0.85 * (1 - fog));
  for (let i = 0; i < 6; i++) { const k = (S.gtime * 1.6 + i / 6) % 1, sd = i % 2 ? 1 : -1; g.beginPath(); g.arc(x + sd * k * 1.25 * sc, y - (1.55 + Math.sin(k * Math.PI) * 1.0 - k * 0.9) * sc, 0.06 * sc, 0, TAU); g.fill(); }
}

// 🎪 Kiosque à musique : toit rayé, colonnes, estrade
function drawKiosk(x, y, sc, fog) {
  const g = S.ctx, f = c => mix(c, pal.haze, fog), w = 2.6 * sc;
  g.lineWidth = Math.max(1, 0.06 * sc); g.strokeStyle = css(INK, 1 - fog);
  g.fillStyle = f('#F4F1EA'); rrp(g, x - w * 0.6, y - 0.5 * sc, w * 1.2, 0.5 * sc, 0.1 * sc); g.fill(); g.stroke();
  g.fillStyle = f('#FFFFFF');
  for (let i = 0; i < 4; i++) { const px = x - w * 0.5 + i * w / 3; g.fillRect(px - 0.07 * sc, y - 2.4 * sc, 0.14 * sc, 1.9 * sc); }
  const top = y - 3.6 * sc;
  for (let i = 0; i < 6; i++) {                    // toit en parts rouges et blanches
    g.fillStyle = f(i % 2 ? '#FFFFFF' : '#E63946');
    const x0 = x - w * 0.7 + i * w * 1.4 / 6, x1 = x0 + w * 1.4 / 6;
    g.beginPath(); g.moveTo(x, top); g.lineTo(x0, y - 2.4 * sc); g.lineTo(x1, y - 2.4 * sc); g.closePath(); g.fill();
  }
  g.beginPath(); g.moveTo(x, top); g.lineTo(x - w * 0.7, y - 2.4 * sc); g.lineTo(x + w * 0.7, y - 2.4 * sc); g.closePath(); g.stroke();
  g.fillStyle = f('#FFD166'); g.beginPath(); g.arc(x, top - 0.12 * sc, 0.13 * sc, 0, TAU); g.fill(); g.stroke();
}

// 🐦 Une bande de pigeons au bord du chemin : ils s'envolent quand tu approches
function drawPigeons(k, z, camZ, side) {
  const dz = z - camZ; if (dz < 1.5 || dz > 70) return;
  const g = S.ctx, sc = Lt.F / dz, fog = Math.pow(clamp(dz / 70, 0, 1), 0.85);
  const run = S.runner.z, take = clamp((run - (z - 7)) / 2.5, 0, 1);    // ils décollent à 7 m de toi
  const fl = S.Levels.fx && S.Levels.fx.flushed;
  if (take > 0.02 && fl && !fl.has(k)) { fl.add(k); if (dz < 40) Sound.flap(); }
  for (let i = 0; i < 4; i++) {
    const lat = side * (PATH_W + 0.5 + hash(k * 3.1 + i) * 1.1), zz = z + (hash(k * 5.3 + i) - 0.5) * 1.5, d2 = zz - camZ;
    if (d2 < 1.4) continue;
    const s2 = Lt.F / d2, hh = take * (2.5 + hash(k + i * 7) * 2) + (take > 0 ? 0 : 0);
    const x = Lt.cx + (lat + side * take * (1.5 + i * 0.4)) * s2, y = yAt(d2) - hh * s2;
    const b = 0.13 * s2, flap = take > 0 ? Math.sin(S.gtime * 30 + i) : 0;
    g.fillStyle = mix('#8D99AE', pal.haze, fog); g.strokeStyle = css(INK, 1 - fog); g.lineWidth = Math.max(1, 0.03 * s2);
    g.beginPath(); g.ellipse(x, y - b, b * 1.3, b, 0, 0, TAU); g.fill(); if (sc > 6) g.stroke();
    g.fillStyle = mix('#6C7A91', pal.haze, fog); g.beginPath(); g.arc(x + side * b, y - b * 1.8, b * 0.55, 0, TAU); g.fill();
    if (take > 0) { g.fillStyle = mix('#B0BAC9', pal.haze, fog); for (const sd of [-1, 1]) { g.beginPath(); g.ellipse(x + sd * b, y - b * (1.3 + flap * 0.8), b * 1.1, b * 0.35, sd * (0.4 + flap * 0.5), 0, TAU); g.fill(); } }
  }
}

// 🪁 Le cerf-volant, dans le ciel
function drawKite() {
  const g = S.ctx, x = S.W * 0.18 + Math.sin(S.gtime * 0.45) * S.W * 0.05, y = Lt.hy * 0.4 + Math.cos(S.gtime * 0.7) * Lt.hy * 0.05;
  const s = clamp(Lt.U * 0.05, 14, 30), a = Math.sin(S.gtime * 0.9) * 0.15;
  g.strokeStyle = 'rgba(43,45,66,0.45)'; g.lineWidth = 1;
  g.beginPath(); g.moveTo(x, y + s); g.quadraticCurveTo(x + S.W * 0.1, Lt.hy * 0.85, x + S.W * 0.14, Lt.hy); g.stroke();
  g.save(); g.translate(x, y); g.rotate(a);
  const cols = ['#EF476F', '#FFD166', '#06D6A0', '#118AB2'];
  const pts = [[0, -s], [s * 0.7, 0], [0, s], [-s * 0.7, 0]];
  for (let i = 0; i < 4; i++) { g.fillStyle = cols[i]; g.beginPath(); g.moveTo(0, 0); g.lineTo(...pts[i]); g.lineTo(...pts[(i + 1) % 4]); g.closePath(); g.fill(); }
  g.strokeStyle = INK; g.lineWidth = 2; g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(...p) : g.moveTo(...p))); g.closePath(); g.stroke();
  g.beginPath(); g.moveTo(0, -s); g.lineTo(0, s); g.moveTo(-s * 0.7, 0); g.lineTo(s * 0.7, 0); g.stroke();
  for (let i = 1; i <= 4; i++) {                   // la queue et ses nœuds
    const tx = Math.sin(S.gtime * 3 + i) * s * 0.25, ty = s + i * s * 0.45;
    g.fillStyle = cols[i % 4]; g.beginPath(); g.moveTo(tx - s * 0.15, ty - s * 0.08); g.lineTo(tx + s * 0.15, ty + s * 0.08); g.lineTo(tx + s * 0.15, ty - s * 0.08); g.lineTo(tx - s * 0.15, ty + s * 0.08); g.closePath(); g.fill();
  }
  g.restore();
}

// Remplace le décor de la course infinie quand on joue un niveau du monde 2
function drawPark(camZ) {
  drawKite();
  const k0 = Math.ceil((camZ + 1.5) / SEG), k1 = Math.floor((camZ + 115) / SEG);
  const pk0 = Math.ceil((camZ + 1.5) / PIGEON_EVERY), pk1 = Math.floor((camZ + 70) / PIGEON_EVERY);
  for (let k = k1; k >= k0; k--) {
    for (let side = -1; side <= 1; side += 2) {
      const z = k * SEG + hash(k * 2.31 + side * 7.7) * SEG, dz = z - camZ;
      if (dz < 1.5 || z < 6) continue;
      const fog = Math.pow(clamp(dz / 115, 0, 1), 0.85), sc = Lt.F / dz;
      const fz = Math.round(z / FOUNTAIN_EVERY), kz = Math.round(z / KIOSK_EVERY);
      if (side < 0 && Math.abs(z - fz * FOUNTAIN_EVERY) < SEG / 2 && fz > 0) { drawFountain(Lt.cx - (PATH_W + 4.2) * sc, yAt(dz), sc, fog); continue; }
      if (side > 0 && Math.abs(z - kz * KIOSK_EVERY) < SEG / 2 && kz > 0) { drawKiosk(Lt.cx + (PATH_W + 6.5) * sc, yAt(dz), sc, fog); continue; }
      if (hash(k * 1.77 + side * 33.1) < 0.3) continue;
      const lat = side * (PATH_W + 2.75 + Math.pow(hash(k * 3.71 + side * 5.3), 1.5) * 9);
      const x = Lt.cx + lat * sc;
      if (x < -3 * sc || x > S.W + 3 * sc) continue;
      drawParkProp(hash(k * 4.13 + side * 2.9), x, yAt(dz), sc, fog, k * 17 + side);
    }
    const pk = Math.round(k * SEG / PIGEON_EVERY);   // les pigeons, entre deux rangées d'objets
    if (pk >= pk0 && pk <= pk1 && Math.abs(k * SEG - pk * PIGEON_EVERY) < SEG / 2 && pk > 0) drawPigeons(pk, pk * PIGEON_EVERY, camZ, hash(pk * 9.1) < 0.5 ? -1 : 1);
  }
}

Object.assign(S, { tintPark, drawPark });
})(window.Soleil);
