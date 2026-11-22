/* js/render/beach.js — v2.5 : le décor du monde 3 « La plage » : chemin de sable mouillé, sable sec, la mer à l'horizon
   (le reflet du soleil y brille ; derrière un nuage, c'est lui qu'on regarde : render/lies.js), parasols, palmiers,
   châteaux de sable, ballons, seaux et pelles, coquillages, une tour de maître-nageur, un marchand de glaces, des mouettes.
   Aussi : le déguisement du Soleil Vacancier (chapeau de paille, lunettes en cœur) et la page de la plage sur la carte.
   Tout est placé avec hash() : le même décor à chaque essai. */
(function (S) {
'use strict';
const { INK, TAU, PATH_W, clamp, lerp, easeIn, css, mix, mixA, hash, pal, Lt, safe, yAt, rrp, drawProp, Sound } = S;

// ---------- Réglages ----------
const SEG = 3.6;               // un emplacement de décor tous les 3,6 m, de chaque côté
const TOWER_EVERY = 70;        // une tour de maître-nageur tous les 70 m (environ), d'un côté
const KIOSK_EVERY = 104;       // un marchand de glaces tous les 104 m (environ), de l'autre côté
const GULL_EVERY = 27;         // des mouettes posées tous les 27 m : elles s'envolent quand tu passes
const SEA_H = 0.16;            // hauteur de la bande de mer sous l'horizon (× rayon du soleil)
const WET = '#E8CDA0', WET2 = '#DFC08E', EDGE = '#C29A62', SAND = '#F7E6BC', SAND2 = '#F1DCAA';

// Les couleurs de la plage (la teinte du moment de la journée est gardée)
function tintBeach() {
  pal.path1 = mixA(pal.path1, WET, 0.8); pal.path2 = mixA(pal.path2, WET2, 0.8); pal.edge = mixA(pal.edge, EDGE, 0.75);
  pal.grass1 = mixA(pal.grass1, SAND, 0.82); pal.grass2 = mixA(pal.grass2, SAND2, 0.82);
}

// 🌊 La mer, à l'horizon (dessinée sur le sol lointain, avant les objets du décor)
function drawSea() {
  const g = S.ctx, y0 = Lt.hy - 1, h = Math.max(6, Lt.R * SEA_H);
  const sg = g.createLinearGradient(0, y0, 0, y0 + h);     // la mer prend un peu la couleur du ciel (le soir, elle rosit)
  sg.addColorStop(0, mix('#2F80C9', pal.skyTop, 0.25)); sg.addColorStop(1, mix('#58B4E8', pal.skyBot, 0.3));
  g.fillStyle = sg; g.fillRect(0, y0, S.W, h);
  g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = Math.max(1.5, h * 0.12); g.lineCap = 'round';
  g.beginPath();                                    // l'écume qui va et vient
  for (let x = -10; x <= S.W + 10; x += 12) { const yy = y0 + h + Math.sin(x * 0.05 + S.gtime * 1.6) * h * 0.14; if (x < 0) g.moveTo(x, yy); else g.lineTo(x, yy); }
  g.stroke();
  g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = Math.max(1, h * 0.08);
  for (let i = 0; i < 7; i++) {                     // petites vagues
    const x = ((hash(i * 3.3) * S.W + S.gtime * (8 + i * 3)) % (S.W + 40)) - 20, yy = y0 + h * (0.3 + 0.12 * (i % 3));
    g.beginPath(); g.moveTo(x - h * 0.6, yy); g.quadraticCurveTo(x, yy - h * 0.2, x + h * 0.6, yy); g.stroke();
  }
}

// Un objet de la plage sur le côté du chemin (x, y : pied de l'objet ; sc : pixels par mètre ; fog : brume)
function drawBeachProp(t, x, y, sc, fog, seed) {
  const g = S.ctx, f = c => mix(c, pal.haze, fog), ol = fog < 0.6 && sc > 4;
  g.lineWidth = Math.max(1, 0.05 * sc); g.strokeStyle = css(INK, 1 - fog); g.lineJoin = 'round'; g.lineCap = 'round';
  if (t < 0.24) {                                   // ⛱️ parasol rayé (et sa serviette)
    const cols = [['#E63946', '#FFFFFF'], ['#118AB2', '#FFFFFF'], ['#FFD166', '#06D6A0'], ['#9B5DE5', '#FFD166']][Math.floor(hash(seed * 1.7) * 4)];
    g.fillStyle = f(cols[0]); rrp(g, x - 0.9 * sc, y - 0.16 * sc, 1.8 * sc, 0.32 * sc, 0.06 * sc); g.fill(); if (ol) g.stroke();
    g.fillStyle = f('#8D6E4E'); g.fillRect(x - 0.04 * sc, y - 2.1 * sc, 0.08 * sc, 2.1 * sc);
    const top = y - 2.5 * sc, w = 1.3 * sc;
    for (let i = 0; i < 6; i++) {
      g.fillStyle = f(cols[i % 2]);
      const x0 = x - w + i * w / 3, x1 = x0 + w / 3;
      g.beginPath(); g.moveTo(x, top); g.lineTo(x0, y - 2.0 * sc); g.quadraticCurveTo((x0 + x1) / 2, y - 1.85 * sc, x1, y - 2.0 * sc); g.closePath(); g.fill();
    }
    if (ol) { g.beginPath(); g.moveTo(x, top); g.lineTo(x - w, y - 2.0 * sc); g.lineTo(x + w, y - 2.0 * sc); g.closePath(); g.stroke(); }
    return;
  }
  if (t < 0.38) {                                   // 🌴 palmier
    g.strokeStyle = f('#8A5A35'); g.lineWidth = Math.max(1, 0.22 * sc);
    const lean = (hash(seed) - 0.5) * 0.9 * sc, tx = x + lean, ty = y - 3.4 * sc;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + lean * 0.2, y - 1.8 * sc, tx, ty); g.stroke();
    g.fillStyle = f('#2FA35A'); g.strokeStyle = css(INK, 1 - fog); g.lineWidth = Math.max(1, 0.05 * sc);
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + (i - 2.5) * 0.55, l = 1.5 * sc;
      g.beginPath(); g.moveTo(tx, ty);
      g.quadraticCurveTo(tx + Math.cos(a) * l * 0.7, ty + Math.sin(a) * l * 0.7 - 0.3 * sc, tx + Math.cos(a) * l, ty + Math.sin(a) * l + 0.45 * sc);
      g.quadraticCurveTo(tx + Math.cos(a) * l * 0.5, ty + Math.sin(a) * l * 0.3, tx, ty); g.fill(); if (ol) g.stroke();
    }
    g.fillStyle = f('#7A4B2A'); for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(tx + (i - 1) * 0.16 * sc, ty + 0.12 * sc, 0.12 * sc, 0, TAU); g.fill(); }
    return;
  }
  if (t < 0.5) {                                    // 🏰 château de sable et son drapeau
    g.fillStyle = f('#E9C98B');
    rrp(g, x - 0.7 * sc, y - 0.6 * sc, 1.4 * sc, 0.6 * sc, 0.05 * sc); g.fill(); if (ol) g.stroke();
    for (const dx of [-0.55, 0, 0.55]) {
      const h = dx ? 0.95 : 1.25;
      g.fillStyle = f('#E3BF7E'); g.fillRect(x + (dx - 0.18) * sc, y - h * sc, 0.36 * sc, (h - 0.5) * sc); if (ol) g.strokeRect(x + (dx - 0.18) * sc, y - h * sc, 0.36 * sc, (h - 0.5) * sc);
      for (let i = 0; i < 3; i++) { g.fillStyle = f('#E3BF7E'); g.fillRect(x + (dx - 0.18 + i * 0.13) * sc, y - (h + 0.1) * sc, 0.09 * sc, 0.1 * sc); }
    }
    g.strokeStyle = f('#6B4226'); g.lineWidth = Math.max(1, 0.03 * sc);
    g.beginPath(); g.moveTo(x, y - 1.35 * sc); g.lineTo(x, y - 1.85 * sc); g.stroke();
    g.fillStyle = f('#E63946'); g.beginPath(); g.moveTo(x, y - 1.85 * sc); g.lineTo(x + 0.3 * sc, y - 1.75 * sc + Math.sin(S.gtime * 6 + seed) * 0.04 * sc); g.lineTo(x, y - 1.65 * sc); g.closePath(); g.fill();
    return;
  }
  if (t < 0.62) {                                   // 🏐 ballon de plage sur une serviette
    g.fillStyle = f(['#06D6A0', '#FF8FA3', '#4CC9F0'][Math.floor(hash(seed * 2.9) * 3)]);
    rrp(g, x - 0.75 * sc, y - 0.14 * sc, 1.5 * sc, 0.28 * sc, 0.05 * sc); g.fill(); if (ol) g.stroke();
    const r = 0.34 * sc, bx = x + 0.3 * sc, by = y - r - 0.05 * sc, cols = ['#E63946', '#FFFFFF', '#FFD166', '#FFFFFF', '#118AB2', '#FFFFFF'];
    for (let i = 0; i < 6; i++) { g.fillStyle = f(cols[i]); g.beginPath(); g.moveTo(bx, by); g.arc(bx, by, r, i * TAU / 6 + 0.3, (i + 1) * TAU / 6 + 0.3); g.closePath(); g.fill(); }
    if (ol) { g.beginPath(); g.arc(bx, by, r, 0, TAU); g.stroke(); }
    return;
  }
  if (t < 0.72) {                                   // 🪣 seau et pelle
    g.fillStyle = f(['#FF9F1C', '#06D6A0', '#EF476F'][Math.floor(hash(seed * 4.3) * 3)]);
    g.beginPath(); g.moveTo(x - 0.28 * sc, y - 0.6 * sc); g.lineTo(x + 0.28 * sc, y - 0.6 * sc); g.lineTo(x + 0.21 * sc, y); g.lineTo(x - 0.21 * sc, y); g.closePath(); g.fill(); if (ol) g.stroke();
    g.strokeStyle = css(INK, 0.8 * (1 - fog)); g.beginPath(); g.arc(x, y - 0.6 * sc, 0.26 * sc, Math.PI, 0); g.stroke();
    g.strokeStyle = f('#118AB2'); g.lineWidth = Math.max(1, 0.06 * sc);
    g.beginPath(); g.moveTo(x + 0.45 * sc, y); g.lineTo(x + 0.75 * sc, y - 0.75 * sc); g.stroke();
    return;
  }
  if (t < 0.84) {                                   // 🐚 coquillages et galets
    for (let i = 0; i < 3; i++) {
      const sx = x + (hash(seed + i * 5) - 0.5) * 1.2 * sc, sy = y - hash(seed * 3 + i) * 0.1 * sc;
      g.fillStyle = f(i % 2 ? '#FFC2D1' : '#FFF4E0');
      g.beginPath(); g.moveTo(sx, sy); g.arc(sx, sy, 0.14 * sc, Math.PI, 0); g.closePath(); g.fill(); if (ol) g.stroke();
    }
    return;
  }
  drawProp(0.3, x, y, sc, fog, seed);              // touffe d'herbe des dunes
}

// 🛟 Tour de maître-nageur (rouge et blanche, avec sa bouée)
function drawTower(x, y, sc, fog) {
  const g = S.ctx, f = c => mix(c, pal.haze, fog);
  g.lineWidth = Math.max(1, 0.06 * sc); g.strokeStyle = css(INK, 1 - fog);
  g.strokeStyle = f('#8D6E4E'); g.lineWidth = Math.max(1, 0.12 * sc);
  for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(x + sd * 0.9 * sc, y); g.lineTo(x + sd * 0.55 * sc, y - 2.2 * sc); g.stroke(); }
  g.strokeStyle = css(INK, 1 - fog); g.lineWidth = Math.max(1, 0.06 * sc);
  g.fillStyle = f('#E63946'); rrp(g, x - 0.85 * sc, y - 3.3 * sc, 1.7 * sc, 1.1 * sc, 0.1 * sc); g.fill(); g.stroke();
  g.fillStyle = f('#FFFFFF'); g.fillRect(x - 0.85 * sc, y - 2.95 * sc, 1.7 * sc, 0.3 * sc);
  g.fillStyle = f('#FFD166'); g.beginPath(); g.moveTo(x - 1.1 * sc, y - 3.3 * sc); g.lineTo(x, y - 3.9 * sc); g.lineTo(x + 1.1 * sc, y - 3.3 * sc); g.closePath(); g.fill(); g.stroke();
  g.strokeStyle = f('#FF6B3D'); g.lineWidth = Math.max(1, 0.12 * sc);
  g.beginPath(); g.arc(x + 1.05 * sc, y - 1.6 * sc, 0.28 * sc, 0, TAU); g.stroke();
}

// 🍦 Le marchand de glaces : une petite carriole et son grand cornet
function drawIceKiosk(x, y, sc, fog) {
  const g = S.ctx, f = c => mix(c, pal.haze, fog);
  g.lineWidth = Math.max(1, 0.06 * sc); g.strokeStyle = css(INK, 1 - fog);
  g.fillStyle = f('#4CC9F0'); rrp(g, x - 1.1 * sc, y - 1.5 * sc, 2.2 * sc, 1.1 * sc, 0.12 * sc); g.fill(); g.stroke();
  g.fillStyle = f('#FFFFFF'); for (let i = 0; i < 2; i++) { g.beginPath(); g.arc(x + (i ? 0.7 : -0.7) * sc, y - 0.3 * sc, 0.3 * sc, 0, TAU); g.fill(); g.stroke(); }
  for (let i = 0; i < 5; i++) { g.fillStyle = f(i % 2 ? '#FFFFFF' : '#FF8FA3'); g.fillRect(x - 1.2 * sc + i * 0.48 * sc, y - 2.05 * sc, 0.48 * sc, 0.45 * sc); }
  g.strokeRect(x - 1.2 * sc, y - 2.05 * sc, 2.4 * sc, 0.45 * sc);
  g.fillStyle = f('#E9B872'); g.beginPath(); g.moveTo(x - 0.25 * sc, y - 2.4 * sc); g.lineTo(x + 0.25 * sc, y - 2.4 * sc); g.lineTo(x, y - 1.95 * sc); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = f('#FF8FA3'); g.beginPath(); g.arc(x, y - 2.55 * sc, 0.28 * sc, 0, TAU); g.fill(); g.stroke();
}

// 🕊️ Des mouettes posées au bord du chemin : elles s'envolent quand tu approches
function drawGulls(k, z, camZ, side) {
  const dz = z - camZ; if (dz < 1.5 || dz > 70) return;
  const g = S.ctx, sc = Lt.F / dz, fog = Math.pow(clamp(dz / 70, 0, 1), 0.85);
  const take = clamp((S.runner.z - (z - 7)) / 2.5, 0, 1);
  const fl = S.Levels.fx && S.Levels.fx.flushed, key = 'g' + k;
  if (take > 0.02 && fl && !fl.has(key)) { fl.add(key); if (dz < 40) Sound.flap(); }
  for (let i = 0; i < 3; i++) {
    const lat = side * (PATH_W + 0.6 + hash(k * 3.7 + i) * 1.2), zz = z + (hash(k * 5.1 + i) - 0.5) * 1.5, d2 = zz - camZ;
    if (d2 < 1.4) continue;
    const s2 = Lt.F / d2, hh = take * (2.5 + hash(k + i * 7) * 2);
    const x = Lt.cx + (lat + side * take * (1.5 + i * 0.4)) * s2, y = yAt(d2) - hh * s2, b = 0.13 * s2;
    g.fillStyle = mix('#FFFFFF', pal.haze, fog); g.strokeStyle = css(INK, 1 - fog); g.lineWidth = Math.max(1, 0.03 * s2);
    g.beginPath(); g.ellipse(x, y - b, b * 1.3, b, 0, 0, TAU); g.fill(); if (sc > 6) g.stroke();
    g.fillStyle = mix('#FF9F1C', pal.haze, fog); g.beginPath(); g.moveTo(x + side * b * 1.6, y - b * 1.7); g.lineTo(x + side * b * 2.2, y - b * 1.5); g.lineTo(x + side * b * 1.6, y - b * 1.4); g.fill();
    g.fillStyle = mix('#FFFFFF', pal.haze, fog); g.beginPath(); g.arc(x + side * b, y - b * 1.7, b * 0.55, 0, TAU); g.fill();
    if (take > 0) {
      const flap = Math.sin(S.gtime * 26 + i);
      g.strokeStyle = mix('#8D99AE', pal.haze, fog); g.lineWidth = Math.max(1, b * 0.35);
      for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(x, y - b * 1.2); g.quadraticCurveTo(x + sd * b * 1.2, y - b * (2.4 + flap), x + sd * b * 2.4, y - b * (1.6 + flap * 1.2)); g.stroke(); }
    }
  }
}

// Des mouettes au loin, dans le ciel
function drawSkyGulls() {
  const g = S.ctx, s = clamp(Lt.U * 0.022, 6, 13);
  g.strokeStyle = 'rgba(43,45,66,0.55)'; g.lineWidth = Math.max(1.5, s * 0.22); g.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const x = ((S.gtime * (14 + i * 5) + i * S.W * 0.37) % (S.W + 80)) - 40, y = Lt.hy * (0.32 + 0.12 * i) + Math.sin(S.gtime * 0.8 + i) * 6, fl = Math.sin(S.gtime * 7 + i * 2) * s * 0.3;
    g.beginPath(); g.moveTo(x - s, y - fl); g.quadraticCurveTo(x - s * 0.4, y - s * 0.5, x, y); g.quadraticCurveTo(x + s * 0.4, y - s * 0.5, x + s, y - fl); g.stroke();
  }
}

// Remplace le décor de la course infinie quand on joue un niveau du monde 3
function drawBeach(camZ) {
  drawSea(); drawSkyGulls();
  const k0 = Math.ceil((camZ + 1.5) / SEG), k1 = Math.floor((camZ + 115 * S.Q.decor) / SEG);   // qualité basse : décor moins loin
  const gk0 = Math.ceil((camZ + 1.5) / GULL_EVERY), gk1 = Math.floor((camZ + 70) / GULL_EVERY);
  for (let k = k1; k >= k0; k--) {
    for (let side = -1; side <= 1; side += 2) {
      const z = k * SEG + hash(k * 2.17 + side * 6.1) * SEG, dz = z - camZ;
      if (dz < 1.5 || z < 6) continue;
      const fog = Math.pow(clamp(dz / 115, 0, 1), 0.85), sc = Lt.F / dz;
      const tz = Math.round(z / TOWER_EVERY), kz = Math.round(z / KIOSK_EVERY);
      if (side > 0 && Math.abs(z - tz * TOWER_EVERY) < SEG / 2 && tz > 0) { drawTower(Lt.cx + (PATH_W + 4.5) * sc, yAt(dz), sc, fog); continue; }
      if (side < 0 && Math.abs(z - kz * KIOSK_EVERY) < SEG / 2 && kz > 0) { drawIceKiosk(Lt.cx - (PATH_W + 4.2) * sc, yAt(dz), sc, fog); continue; }
      if (hash(k * 1.91 + side * 31.3) < 0.32) continue;
      const lat = side * (PATH_W + 2.6 + Math.pow(hash(k * 3.29 + side * 4.7), 1.5) * 9);
      const x = Lt.cx + lat * sc;
      if (x < -3 * sc || x > S.W + 3 * sc) continue;
      drawBeachProp(hash(k * 4.41 + side * 3.3), x, yAt(dz), sc, fog, k * 19 + side);
    }
    const gk = Math.round(k * SEG / GULL_EVERY);
    if (gk >= gk0 && gk <= gk1 && Math.abs(k * SEG - gk * GULL_EVERY) < SEG / 2 && gk > 0) drawGulls(gk, gk * GULL_EVERY, camZ, hash(gk * 8.3) < 0.5 ? -1 : 1);
  }
}

// ---------- 👒 Le Soleil Vacancier : chapeau de paille et lunettes en cœur ----------
function heart(g, x, y, s, k) {                    // un cœur centré en (x, y), de taille s (k : écrasé quand il tourne)
  g.beginPath(); g.moveTo(x, y + s * 0.62);
  g.bezierCurveTo(x - s * 1.05 * k, y + s * 0.05, x - s * 0.62 * k, y - s * 0.78, x, y - s * 0.28);
  g.bezierCurveTo(x + s * 0.62 * k, y - s * 0.78, x + s * 1.05 * k, y + s * 0.05, x, y + s * 0.62);
  g.closePath();
}
function drawVacancier(cx, cy, R, turnP, alpha, noGlasses) {
  if (alpha <= 0) return;
  const g = S.ctx, phi = Math.PI * (1 - turnP);
  const P = (lon, lat) => ({ x: cx + R * Math.sin(phi + lon) * Math.cos(lat), y: cy + R * Math.sin(lat), k: Math.cos(phi + lon) });
  g.save(); g.globalAlpha *= alpha; g.lineJoin = 'round'; g.lineCap = 'round';
  if (turnP >= 0.3 && !noGlasses) for (const sd of [-1, 1]) {   // lunettes en cœur (sur le visage, elles suivent le demi-tour)
    const p = P(sd * 0.38, -0.12); if (p.k <= 0.05) continue;
    g.fillStyle = '#FF5DA2'; g.strokeStyle = INK; g.lineWidth = Math.max(2, R * 0.05);
    heart(g, p.x, p.y, R * 0.26, p.k); g.fill(); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.65)'; g.beginPath(); g.ellipse(p.x - R * 0.08 * p.k, p.y - R * 0.08, R * 0.05 * p.k, R * 0.035, -0.5, 0, TAU); g.fill();
  }
  const a = P(-0.16, -0.14), b = P(0.16, -0.14);
  if (turnP >= 0.3 && !noGlasses && a.k > 0.05 && b.k > 0.05) { g.strokeStyle = INK; g.lineWidth = R * 0.05; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); }
  // le chapeau de paille (posé dessus : on le voit de face comme de dos), avec son ruban et sa fleur
  const by = cy - R * 0.8, lw = Math.max(2, R * 0.05);
  g.fillStyle = '#F2D27A'; g.strokeStyle = INK; g.lineWidth = lw;
  g.beginPath(); g.ellipse(cx, by, R * 0.98, R * 0.17, 0, 0, TAU); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(cx - R * 0.52, by); g.lineTo(cx - R * 0.46, by - R * 0.4); g.quadraticCurveTo(cx, by - R * 0.5, cx + R * 0.46, by - R * 0.4); g.lineTo(cx + R * 0.52, by);
  g.quadraticCurveTo(cx, by + R * 0.08, cx - R * 0.52, by); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#E63946'; g.beginPath(); g.moveTo(cx - R * 0.5, by - R * 0.05); g.lineTo(cx - R * 0.49, by - R * 0.16); g.quadraticCurveTo(cx, by - R * 0.1, cx + R * 0.49, by - R * 0.16);
  g.lineTo(cx + R * 0.5, by - R * 0.05); g.quadraticCurveTo(cx, by + R * 0.04, cx - R * 0.5, by - R * 0.05); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(160,120,40,0.55)'; g.lineWidth = Math.max(1, R * 0.02);   // la paille tressée
  for (let i = -2; i <= 2; i++) { g.beginPath(); g.ellipse(cx, by, R * (0.62 + Math.abs(i) * 0.07), R * 0.1, 0, Math.PI * 0.05, Math.PI * 0.95); g.stroke(); }
  const fx = cx + R * 0.36 * Math.cos(phi), fy = by - R * 0.12;     // la fleur glisse sur le ruban quand il tourne
  g.fillStyle = '#FF8FA3'; g.strokeStyle = INK; g.lineWidth = Math.max(1, R * 0.025);
  for (let i = 0; i < 5; i++) { const an = i * TAU / 5; g.beginPath(); g.arc(fx + Math.cos(an) * R * 0.07, fy + Math.sin(an) * R * 0.07, R * 0.065, 0, TAU); g.fill(); g.stroke(); }
  g.fillStyle = '#FFD166'; g.beginPath(); g.arc(fx, fy, R * 0.045, 0, TAU); g.fill();
  g.restore();
}
function drawVacancierFace(cx, cy, R) {           // sur le soleil pendant tout le niveau du boss (appelé par render/sun.js)
  const w = S.watcher;
  if (w.bossFace !== 'vacancier') return;
  const angry = w.angry || S.gtime < w.angryUntil, peek = w.state === 'peek' || (w.state === 'return' && w.retTo > 0);
  drawVacancier(cx, cy, R, w.turnP, 1, angry || peek);   // fâché ou faux dos : on voit ses vrais yeux
}
function drawVacancierDrop(k) {                   // l'intro du boss : le chapeau et les lunettes tombent du ciel
  const x = Lt.cx, y0 = Lt.sunY + S.watcher.offY + S.sunSink, y = lerp(-Lt.R * 1.5, y0, easeIn(clamp(k, 0, 1)));
  drawVacancier(x, y, Lt.R, 1, 1);
}

// ---------- La page de la plage, sur la carte des niveaux ----------
function drawBeachMap(g, A) {
  const top = A.head + 6, H = S.H - top;
  g.fillStyle = '#F6E2B3'; rrp(g, -20, top, S.W + 40, H + 30, 26); g.fill();           // le sable
  const sea = top + H * (A.land ? 0.16 : 0.1);
  const sg = g.createLinearGradient(0, top, 0, sea); sg.addColorStop(0, '#2F80C9'); sg.addColorStop(1, '#5EC8F2');
  g.fillStyle = sg; g.beginPath(); g.moveTo(-20, top);                                  // la mer, en haut, et ses vagues
  g.lineTo(S.W + 20, top);
  for (let x = S.W + 20; x >= -20; x -= 14) g.lineTo(x, sea + Math.sin(x * 0.04 + S.gtime * 1.4) * 5);
  g.closePath(); g.fill();
  g.strokeStyle = '#FFFFFF'; g.lineWidth = 3; g.beginPath();
  for (let x = -20; x <= S.W + 20; x += 14) { const yy = sea + Math.sin(x * 0.04 + S.gtime * 1.4) * 5; if (x < -19) g.moveTo(x, yy); else g.lineTo(x, yy); }
  g.stroke();
  g.fillStyle = '#EBD49E';                                                              // vaguelettes de sable
  for (let i = 0; i < 14; i++) { const x = S.hash(i * 2.9 + 70) * S.W, y = sea + 20 + S.hash(i * 6.1 + 70) * (S.H - sea); g.beginPath(); g.ellipse(x, y, 30 + 40 * S.hash(i + 70), 9 + 8 * S.hash(i * 3 + 70), 0, 0, TAU); g.fill(); }
  const r = clamp(Math.min(S.W, S.H) * 0.045, 14, 30);                                  // parasols vus du ciel, serviettes
  const cols = [['#E63946', '#FFFFFF'], ['#118AB2', '#FFFFFF'], ['#FFD166', '#06D6A0'], ['#9B5DE5', '#FFD166']];
  for (let i = 0; i < 9; i++) {
    const x = i % 2 ? A.right - r * 0.2 : A.left + r * 0.2, y = lerp(sea + r * 2, S.H - safe.b - r, (i + 0.5) / 9);
    if (S.hash(i * 4.7 + 5) < 0.25) continue;
    const c = cols[i % 4];
    g.fillStyle = c[1]; g.strokeStyle = INK; g.lineWidth = 2.5; rrp(g, x - r * 0.5, y + r * 0.2, r * 1.0, r * 1.6, 4); g.fill(); g.stroke();
    for (let j = 0; j < 8; j++) { g.fillStyle = c[j % 2]; g.beginPath(); g.moveTo(x, y); g.arc(x, y, r, j * TAU / 8, (j + 1) * TAU / 8); g.closePath(); g.fill(); }
    g.beginPath(); g.arc(x, y, r, 0, TAU); g.stroke();
    g.fillStyle = INK; g.beginPath(); g.arc(x, y, r * 0.1, 0, TAU); g.fill();
  }
  const sx = S.W * (A.land ? 0.5 : 0.78), sy = top + H * (A.land ? 0.3 : 0.24), cr = Math.min(S.W, S.H) * 0.05;   // un château de sable
  g.fillStyle = '#E3BF7E'; g.strokeStyle = INK; g.lineWidth = 2.5;
  rrp(g, sx - cr, sy - cr * 0.4, cr * 2, cr * 0.9, 4); g.fill(); g.stroke();
  for (const dx of [-0.75, 0, 0.75]) { g.fillRect(sx + (dx - 0.22) * cr, sy - cr * (dx ? 0.9 : 1.2), cr * 0.44, cr * (dx ? 0.55 : 0.85)); g.strokeRect(sx + (dx - 0.22) * cr, sy - cr * (dx ? 0.9 : 1.2), cr * 0.44, cr * (dx ? 0.55 : 0.85)); }
  g.fillStyle = '#E63946'; g.beginPath(); g.moveTo(sx, sy - cr * 1.2); g.lineTo(sx + cr * 0.45, sy - cr * 1.4); g.lineTo(sx, sy - cr * 1.6); g.closePath(); g.fill();
}

Object.assign(S, { tintBeach, drawBeach, drawVacancier, drawVacancierFace, drawVacancierDrop, drawBeachMap, SEA_H });
})(window.Soleil);
