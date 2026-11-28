/* js/render/mountain.js — v2.6 : le décor du monde 4 « La montagne » : un sentier de neige tassée (le verglas bleu et
   les descentes à chevrons s'y voient de loin), la neige des deux côtés, des sommets enneigés à l'horizon (teintés
   par le ciel du moment, jamais devant le soleil), des sapins, des bonshommes de neige, des rochers, des piquets de
   slalom, des barrières, des skis plantés, un chalet et un pylône de télésiège, et quelques flocons qui tombent.
   Aussi : le déguisement du Soleil des Neiges (bonnet à pompon, masque de ski) et la page de la montagne sur la carte.
   Le lac gelé (son reflet derrière un nuage) est dans render/lies.js ; les luges à l'arrivée, dans render/pressure.js.
   Tout est placé avec hash() : le même décor à chaque essai. Rien ne décide ici : on ne fait que dessiner. */
(function (S) {
'use strict';
const { INK, TAU, PATH_W, clamp, lerp, easeIn, css, mix, mixA, hash, pal, Lt, safe, yAt, rrp, drawProp } = S;

// ---------- Réglages ----------
const SEG = 3.4;               // un emplacement de décor tous les 3,4 m, de chaque côté
const CHALET_EVERY = 92;       // un chalet tous les 92 m (environ), d'un côté
const PYLON_EVERY = 61;        // un pylône de télésiège tous les 61 m (environ), de l'autre côté
const FLAKES = 46;             // flocons à l'écran (× la qualité des particules)
const PEAK_MAX = 1.2;          // les sommets ne montent jamais plus haut que 1,2 × le rayon du soleil (l'avion menteur passe au-dessus)
const SNOW = '#F4F8FD', SNOW2 = '#E5EDF7', TRAIL = '#B7A48C', TRAIL2 = '#AC977D', EDGE = '#8A7761';

// Les couleurs de la montagne (la teinte du moment de la journée est gardée ; la nuit, la neige bleuit)
function tintMountain() {
  const k = 1 - 0.55 * (pal.night || 0);
  pal.path1 = mixA(pal.path1, TRAIL, 0.8 * k); pal.path2 = mixA(pal.path2, TRAIL2, 0.8 * k); pal.edge = mixA(pal.edge, EDGE, 0.75 * k);
  pal.grass1 = mixA(pal.grass1, SNOW, 0.86 * k); pal.grass2 = mixA(pal.grass2, SNOW2, 0.86 * k);
  pal.haze = mixA(pal.haze, '#E2EBF5', 0.35 * k);
  pal.hillFar = mixA(pal.hillFar, '#9CB1CB', 0.75); pal.hillNear = mixA(pal.hillNear, '#7A91B0', 0.75);
}

// ---------- ⛰️ Les sommets à l'horizon (à la place des collines : render/sky.js) ----------
// [écart au centre de l'écran, hauteur], en rayons du soleil. Au milieu, la crête reste toute basse : le soleil
// (qui descend un peu le soir) et son visage ne sont jamais cachés.
const PEAKS_FAR = [[-10, 0.7], [-8.6, 1.2], [-7.3, 0.8], [-6.1, 1.15], [-4.8, 0.55], [-3.7, 1.05], [-2.7, 0.5], [-1.95, 0.72], [-1.4, 0.12],
  [-0.6, 0.06], [0.5, 0.07], [1.35, 0.13], [1.9, 0.78], [2.8, 0.42], [3.8, 1.1], [4.9, 0.6], [6.1, 1.2], [7.3, 0.72], [8.5, 1.15], [10, 0.7]];
const PEAKS_NEAR = [[-10, 0.35], [-8.9, 0.75], [-7.7, 0.38], [-6.6, 0.68], [-5.3, 0.3], [-4.2, 0.62], [-3.2, 0.26], [-2.35, 0.48], [-1.65, 0.1],
  [-0.8, 0.04], [0.75, 0.05], [1.55, 0.09], [2.2, 0.44], [3.1, 0.24], [4.1, 0.58], [5.2, 0.3], [6.4, 0.72], [7.5, 0.36], [8.7, 0.66], [10, 0.4]];
function ridge(g, pts, R, hy) {
  g.beginPath(); g.moveTo(Lt.cx + pts[0][0] * R, hy + 1);
  for (const [dx, h] of pts) g.lineTo(Lt.cx + dx * R, hy - Math.min(PEAK_MAX, h) * R);
  g.lineTo(Lt.cx + pts[pts.length - 1][0] * R, hy + 1); g.closePath();
}
function snowCaps(g, pts, R, hy, col) {            // une calotte de neige sur chaque sommet, au bord en dents de scie
  g.fillStyle = col;
  for (let i = 1; i < pts.length - 1; i++) {
    const [x0, h0] = pts[i - 1], [x1, h1] = pts[i], [x2, h2] = pts[i + 1];
    if (h1 < 0.3 || h1 <= h0 || h1 <= h2) continue;
    const H1 = Math.min(PEAK_MAX, h1), f = 0.36;
    const px = Lt.cx + x1 * R, py = hy - H1 * R;
    const lx = lerp(px, Lt.cx + x0 * R, f), ly = lerp(py, hy - Math.min(PEAK_MAX, h0) * R, f);
    const rx = lerp(px, Lt.cx + x2 * R, f), ry = lerp(py, hy - Math.min(PEAK_MAX, h2) * R, f);
    g.beginPath(); g.moveTo(px, py); g.lineTo(rx, ry);
    for (let k = 1; k <= 3; k++) {                 // le bas de la calotte : 3 dents
      const u = k / 4, bx = lerp(rx, lx, u), by = lerp(ry, ly, u) + (k % 2 ? R * 0.07 : -R * 0.02);
      g.lineTo(bx, by);
    }
    g.lineTo(lx, ly); g.closePath(); g.fill();
  }
}
function drawPeaks() {
  const g = S.ctx, R = Lt.R, hy = Lt.hy;
  g.fillStyle = mix(pal.hillFar, pal.skyBot, 0.35); ridge(g, PEAKS_FAR, R, hy); g.fill();
  snowCaps(g, PEAKS_FAR, R, hy, mix('#FFFFFF', pal.skyBot, 0.32));
  g.fillStyle = css(pal.hillNear); ridge(g, PEAKS_NEAR, R, hy); g.fill();
  g.fillStyle = 'rgba(30,40,80,0.12)';            // le flanc à l'ombre (à droite de chaque sommet)
  for (let i = 1; i < PEAKS_NEAR.length - 1; i++) {
    const [x1, h1] = PEAKS_NEAR[i], [x2, h2] = PEAKS_NEAR[i + 1];
    if (h1 < 0.3 || h1 <= h2) continue;
    g.beginPath(); g.moveTo(Lt.cx + x1 * R, hy - h1 * R); g.lineTo(Lt.cx + x2 * R, hy - h2 * R); g.lineTo(Lt.cx + x2 * R, hy + 1); g.lineTo(Lt.cx + x1 * R, hy + 1); g.closePath(); g.fill();
  }
  snowCaps(g, PEAKS_NEAR, R, hy, mix('#FFFFFF', pal.skyBot, 0.15));
}

// ---------- Les objets de la montagne, sur les côtés du sentier ----------
// (x, y : pied de l'objet ; sc : pixels par mètre ; fog : brume)
function pine(g, x, y, sc, fog, h, ol) {           // 🌲 un sapin enneigé : 3 étages, de la neige sur chacun
  const f = c => mix(c, pal.haze, fog);
  g.fillStyle = f('#6B4A2E'); g.fillRect(x - 0.1 * sc, y - 0.45 * sc, 0.2 * sc, 0.45 * sc);
  for (let i = 0; i < 3; i++) {
    const yb = y - (0.35 + i * 0.27 * h) * sc, yt = yb - 0.62 * h * sc, w = (0.95 - i * 0.24) * h * sc * 0.62;
    g.fillStyle = f(i % 2 ? '#2B6E50' : '#2F7A57');
    g.beginPath(); g.moveTo(x - w, yb); g.lineTo(x, yt); g.lineTo(x + w, yb); g.closePath(); g.fill(); if (ol) g.stroke();
    g.fillStyle = f('#FFFFFF');                    // la neige posée sur l'étage
    g.beginPath(); g.moveTo(x - w * 0.55, lerp(yt, yb, 0.55)); g.lineTo(x, yt); g.lineTo(x + w * 0.55, lerp(yt, yb, 0.55));
    g.quadraticCurveTo(x + w * 0.2, lerp(yt, yb, 0.45), x, lerp(yt, yb, 0.6)); g.quadraticCurveTo(x - w * 0.2, lerp(yt, yb, 0.45), x - w * 0.55, lerp(yt, yb, 0.55));
    g.closePath(); g.fill();
  }
}
function drawMountainProp(t, x, y, sc, fog, seed) {
  const g = S.ctx, f = c => mix(c, pal.haze, fog), ol = fog < 0.6 && sc > 4;
  g.lineWidth = Math.max(1, 0.05 * sc); g.strokeStyle = css(INK, 1 - fog); g.lineJoin = 'round'; g.lineCap = 'round';
  if (t < 0.32) { pine(g, x, y, sc, fog, 2.6 + hash(seed * 1.3) * 1.4, ol); return; }
  if (t < 0.42) {                                   // ⛄ bonhomme de neige : nez carotte, écharpe, chapeau
    const c0 = y - 0.46 * sc, c1 = y - 1.12 * sc, c2 = y - 1.64 * sc;
    for (const [cy, r] of [[c0, 0.46], [c1, 0.34], [c2, 0.25]]) { g.fillStyle = f('#FFFFFF'); g.beginPath(); g.arc(x, cy, r * sc, 0, TAU); g.fill(); if (ol) g.stroke(); }
    g.fillStyle = f('#2B2D42'); for (const sd of [-1, 1]) { g.beginPath(); g.arc(x + sd * 0.09 * sc, c2 - 0.05 * sc, 0.035 * sc, 0, TAU); g.fill(); }
    g.fillStyle = f('#FF8C1A'); g.beginPath(); g.moveTo(x, c2 + 0.01 * sc); g.lineTo(x + 0.26 * sc, c2 + 0.05 * sc); g.lineTo(x, c2 + 0.08 * sc); g.closePath(); g.fill();
    g.fillStyle = f(['#E63946', '#4895EF', '#06D6A0'][Math.floor(hash(seed * 2.1) * 3)]);   // l'écharpe
    rrp(g, x - 0.28 * sc, c2 + 0.18 * sc, 0.56 * sc, 0.1 * sc, 0.04 * sc); g.fill(); g.fillRect(x + 0.1 * sc, c2 + 0.22 * sc, 0.09 * sc, 0.3 * sc);
    g.fillStyle = f('#2B2D42'); g.fillRect(x - 0.2 * sc, c2 - 0.28 * sc, 0.4 * sc, 0.06 * sc); g.fillRect(x - 0.13 * sc, c2 - 0.54 * sc, 0.26 * sc, 0.27 * sc);
    g.strokeStyle = f('#6B4A2E'); g.lineWidth = Math.max(1, 0.04 * sc);   // les bras en bâton
    g.beginPath(); g.moveTo(x - 0.3 * sc, c1); g.lineTo(x - 0.72 * sc, c1 - 0.3 * sc); g.moveTo(x + 0.3 * sc, c1); g.lineTo(x + 0.72 * sc, c1 - 0.25 * sc); g.stroke();
    return;
  }
  if (t < 0.54) {                                   // 🪨 rocher coiffé de neige
    const w = (0.7 + hash(seed * 3.7) * 0.6) * sc, h = w * 0.62;
    g.fillStyle = f('#8D96A8');
    g.beginPath(); g.moveTo(x - w, y); g.lineTo(x - w * 0.75, y - h * 0.8); g.lineTo(x - w * 0.15, y - h); g.lineTo(x + w * 0.6, y - h * 0.85); g.lineTo(x + w, y); g.closePath(); g.fill(); if (ol) g.stroke();
    g.fillStyle = f('#FFFFFF');
    g.beginPath(); g.moveTo(x - w * 0.8, y - h * 0.72); g.lineTo(x - w * 0.15, y - h); g.lineTo(x + w * 0.62, y - h * 0.82);
    g.quadraticCurveTo(x + w * 0.2, y - h * 0.62, x - w * 0.1, y - h * 0.75); g.quadraticCurveTo(x - w * 0.45, y - h * 0.58, x - w * 0.8, y - h * 0.72); g.closePath(); g.fill();
    return;
  }
  if (t < 0.63) {                                   // 🚩 piquets de slalom : drapeau triangle rouge, drapeau carré bleu (formes différentes)
    const blue = hash(seed * 5.1) < 0.5;
    g.strokeStyle = f('#2B2D42'); g.lineWidth = Math.max(1, 0.05 * sc);
    for (const dx of [-0.35, 0.35]) { g.beginPath(); g.moveTo(x + dx * sc, y); g.lineTo(x + dx * sc, y - 1.6 * sc); g.stroke(); }
    g.fillStyle = f(blue ? '#1D6FD1' : '#E63946');
    const wv = Math.sin(S.gtime * 5 + seed) * 0.04 * sc;
    if (blue) { g.beginPath(); g.moveTo(x - 0.35 * sc, y - 1.55 * sc); g.lineTo(x + 0.35 * sc, y - 1.55 * sc + wv); g.lineTo(x + 0.35 * sc, y - 1.1 * sc + wv); g.lineTo(x - 0.35 * sc, y - 1.1 * sc); g.closePath(); g.fill(); if (ol) g.stroke(); }
    else { g.beginPath(); g.moveTo(x - 0.35 * sc, y - 1.6 * sc); g.lineTo(x + 0.3 * sc, y - 1.35 * sc + wv); g.lineTo(x - 0.35 * sc, y - 1.1 * sc); g.closePath(); g.fill(); if (ol) g.stroke(); }
    return;
  }
  if (t < 0.73) {                                   // barrière en bois, avec la neige dessus
    const w = 1.6 * sc;
    g.fillStyle = f('#9C6B43');
    for (let i = 0; i < 3; i++) g.fillRect(x - w / 2 + i * w / 2 - 0.05 * sc, y - 0.9 * sc, 0.1 * sc, 0.9 * sc);
    g.fillRect(x - w / 2, y - 0.75 * sc, w, 0.1 * sc); g.fillRect(x - w / 2, y - 0.42 * sc, w, 0.1 * sc);
    g.fillStyle = f('#FFFFFF'); rrp(g, x - w / 2 - 0.04 * sc, y - 0.82 * sc, w + 0.08 * sc, 0.07 * sc, 0.03 * sc); g.fill();
    for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(x - w / 2 + i * w / 2, y - 0.93 * sc, 0.08 * sc, 0, TAU); g.fill(); }
    return;
  }
  if (t < 0.81) {                                   // une paire de skis plantés dans la neige, et les bâtons
    const c = ['#FF4D6D', '#FFD166', '#4CC9F0', '#9B5DE5'][Math.floor(hash(seed * 6.7) * 4)];
    g.strokeStyle = f(c); g.lineWidth = Math.max(1.5, 0.12 * sc);
    g.beginPath(); g.moveTo(x - 0.15 * sc, y); g.lineTo(x - 0.05 * sc, y - 1.7 * sc); g.moveTo(x + 0.15 * sc, y); g.lineTo(x + 0.05 * sc, y - 1.7 * sc); g.stroke();
    g.strokeStyle = f('#2B2D42'); g.lineWidth = Math.max(1, 0.04 * sc);
    g.beginPath(); g.moveTo(x + 0.55 * sc, y); g.lineTo(x + 0.35 * sc, y - 1.2 * sc); g.moveTo(x + 0.75 * sc, y); g.lineTo(x + 0.85 * sc, y - 1.2 * sc); g.stroke();
    g.fillStyle = f('#FFFFFF'); g.beginPath(); g.ellipse(x + 0.2 * sc, y, 0.75 * sc, 0.12 * sc, 0, 0, TAU); g.fill();
    return;
  }
  if (t < 0.9) {                                    // un petit tas de boules de neige
    g.fillStyle = f('#FFFFFF'); g.strokeStyle = css(INK, 0.5 * (1 - fog));
    for (const [dx, dy, r] of [[-0.25, 0, 0.2], [0.18, 0, 0.22], [-0.03, 0.3, 0.19]]) { g.beginPath(); g.arc(x + dx * sc, y - (dy + r) * sc, r * sc, 0, TAU); g.fill(); if (ol) g.stroke(); }
    return;
  }
  pine(g, x, y, sc, fog, 1.4 + hash(seed * 2.9) * 0.6, ol);   // un petit sapin
}

// 🏠 Le chalet : murs en bois, grand toit de neige, une fenêtre allumée, la cheminée qui fume
function drawChalet(x, y, sc, fog) {
  const g = S.ctx, f = c => mix(c, pal.haze, fog), w = 3.2 * sc, h = 1.9 * sc;
  g.lineWidth = Math.max(1, 0.06 * sc); g.strokeStyle = css(INK, 1 - fog); g.lineJoin = 'round';
  g.fillStyle = f('#A0643C'); g.fillRect(x - w / 2, y - h, w, h); g.strokeRect(x - w / 2, y - h, w, h);
  g.strokeStyle = css('#6E4223', 0.6 * (1 - fog)); g.lineWidth = Math.max(1, 0.03 * sc);   // les planches
  for (let i = 1; i < 5; i++) { g.beginPath(); g.moveTo(x - w / 2, y - h * i / 5); g.lineTo(x + w / 2, y - h * i / 5); g.stroke(); }
  g.strokeStyle = css(INK, 1 - fog); g.lineWidth = Math.max(1, 0.06 * sc);
  g.fillStyle = f('#6E4223'); g.fillRect(x - w * 0.36, y - h * 0.62, w * 0.2, h * 0.62); g.strokeRect(x - w * 0.36, y - h * 0.62, w * 0.2, h * 0.62);   // la porte
  g.fillStyle = f('#FFD166'); g.fillRect(x + w * 0.08, y - h * 0.72, w * 0.26, h * 0.34); g.strokeRect(x + w * 0.08, y - h * 0.72, w * 0.26, h * 0.34);   // la fenêtre allumée
  g.beginPath(); g.moveTo(x + w * 0.21, y - h * 0.72); g.lineTo(x + w * 0.21, y - h * 0.38); g.stroke();
  g.fillStyle = f('#7A4A2A'); g.fillRect(x + w * 0.22, y - h - 1.25 * sc, 0.38 * sc, 0.9 * sc);   // la cheminée
  g.fillStyle = f('#FFFFFF');                       // le toit de neige
  g.beginPath(); g.moveTo(x - w * 0.62, y - h + 0.05 * sc); g.lineTo(x, y - h - 1.35 * sc); g.lineTo(x + w * 0.62, y - h + 0.05 * sc);
  g.quadraticCurveTo(x + w * 0.4, y - h + 0.28 * sc, x + w * 0.2, y - h + 0.1 * sc); g.quadraticCurveTo(x, y - h + 0.3 * sc, x - w * 0.25, y - h + 0.12 * sc);
  g.quadraticCurveTo(x - w * 0.45, y - h + 0.3 * sc, x - w * 0.62, y - h + 0.05 * sc); g.closePath(); g.fill(); g.stroke();
  if (fog < 0.85) {                                 // la fumée (des ronds qui montent et s'effacent)
    for (let i = 0; i < 4; i++) {
      const u = ((S.gtime * 0.35 + i / 4) % 1), r = (0.18 + u * 0.3) * sc;
      g.fillStyle = `rgba(235,240,248,${((1 - u) * 0.7 * (1 - fog)).toFixed(3)})`;
      g.beginPath(); g.arc(x + w * 0.22 + 0.19 * sc + Math.sin(u * 5 + i) * 0.2 * sc, y - h - 1.4 * sc - u * 1.8 * sc, r, 0, TAU); g.fill();
    }
  }
}

// 🚡 Un pylône de télésiège, avec un siège qui se balance
function drawPylon(x, y, sc, fog) {
  const g = S.ctx, f = c => mix(c, pal.haze, fog), top = y - 5.2 * sc;
  g.strokeStyle = f('#7D8597'); g.lineWidth = Math.max(1.5, 0.16 * sc); g.lineCap = 'round';
  g.beginPath(); g.moveTo(x - 0.55 * sc, y); g.lineTo(x - 0.12 * sc, top); g.moveTo(x + 0.55 * sc, y); g.lineTo(x + 0.12 * sc, top); g.stroke();
  g.lineWidth = Math.max(1, 0.06 * sc);
  for (let i = 1; i < 5; i++) {                     // les croisillons
    const u0 = (i - 1) / 5, u1 = i / 5, xa = lerp(0.55, 0.12, u0) * sc, xb = lerp(0.55, 0.12, u1) * sc;
    g.beginPath(); g.moveTo(x - xa, y - 5.2 * sc * u0); g.lineTo(x + xb, y - 5.2 * sc * u1); g.moveTo(x + xa, y - 5.2 * sc * u0); g.lineTo(x - xb, y - 5.2 * sc * u1); g.stroke();
  }
  g.strokeStyle = f('#3D4454'); g.lineWidth = Math.max(1.5, 0.12 * sc);
  g.beginPath(); g.moveTo(x - 1.3 * sc, top); g.lineTo(x + 1.3 * sc, top); g.stroke();
  const sw = Math.sin(S.gtime * 1.6) * 0.18 * sc, sx = x + 1.0 * sc;   // le siège qui pend au câble
  g.lineWidth = Math.max(1, 0.05 * sc);
  g.beginPath(); g.moveTo(sx, top); g.lineTo(sx + sw, top + 1.1 * sc); g.stroke();
  g.fillStyle = f('#E63946'); rrp(g, sx + sw - 0.4 * sc, top + 1.05 * sc, 0.8 * sc, 0.22 * sc, 0.06 * sc); g.fill();
  g.fillRect(sx + sw - 0.4 * sc, top + 0.7 * sc, 0.12 * sc, 0.45 * sc);
}

// ❄️ Quelques flocons qui tombent doucement (moins en qualité basse) ; ils sont petits : le visage du soleil se lit toujours
function drawSnowfall() {
  const n = Math.round(FLAKES * S.Q.particles); if (n <= 0) return;
  const g = S.ctx, s = clamp(Lt.U * 0.0055, 1.4, 3.6);
  g.fillStyle = 'rgba(255,255,255,0.78)';
  for (let i = 0; i < n; i++) {
    const sp = 16 + hash(i * 3.1 + 7) * 26, H = S.H + 40, W = S.W + 40;
    const y = ((hash(i * 7.7 + 3) * H + S.gtime * sp) % H) - 20;
    const x = ((hash(i * 1.9 + 5) * W + Math.sin(S.gtime * (0.6 + hash(i) * 0.8) + i) * 16 + S.gtime * 7) % W) - 20;
    g.beginPath(); g.arc(x, y, s * (0.6 + hash(i * 5.3) * 0.8), 0, TAU); g.fill();
  }
}

// Remplace le décor de la course infinie quand on joue un niveau du monde 4
function drawMountainDecor(camZ) {
  const k0 = Math.ceil((camZ + 1.5) / SEG), k1 = Math.floor((camZ + 115 * S.Q.decor) / SEG);   // qualité basse : décor moins loin
  for (let k = k1; k >= k0; k--) {
    for (let side = -1; side <= 1; side += 2) {
      const z = k * SEG + hash(k * 2.53 + side * 5.3) * SEG, dz = z - camZ;
      if (dz < 1.5 || z < 6) continue;
      const fog = Math.pow(clamp(dz / 115, 0, 1), 0.85), sc = Lt.F / dz;
      const cz = Math.round(z / CHALET_EVERY), pz = Math.round(z / PYLON_EVERY);
      if (side > 0 && Math.abs(z - cz * CHALET_EVERY) < SEG / 2 && cz > 0) { drawChalet(Lt.cx + (PATH_W + 5) * sc, yAt(dz), sc, fog); continue; }
      if (side < 0 && Math.abs(z - pz * PYLON_EVERY) < SEG / 2 && pz > 0) { drawPylon(Lt.cx - (PATH_W + 4.2) * sc, yAt(dz), sc, fog); continue; }
      if (hash(k * 1.77 + side * 29.1) < 0.3) continue;
      const lat = side * (PATH_W + 1.8 + Math.pow(hash(k * 3.61 + side * 4.1), 1.5) * 9.5);
      const x = Lt.cx + lat * sc;
      if (x < -3 * sc || x > S.W + 3 * sc) continue;
      drawMountainProp(hash(k * 4.97 + side * 2.9), x, yAt(dz), sc, fog, k * 23 + side);
    }
  }
  drawSnowfall();
}

// ---------- 🧶 Le Soleil des Neiges : bonnet à pompon et masque de ski ----------
// Le bonnet se voit de face comme de dos. Le masque est sur ses yeux quand il te regarde : il suit le demi-tour
// (comme les lunettes des autres boss). Fâché ou pendant un faux dos, il le remonte sur son bonnet : on voit ses vrais yeux.
function goggles(g, cx, cy, R, phi, lat, k0) {
  const P = (lon, la) => ({ x: cx + R * Math.sin(phi + lon) * Math.cos(la), y: cy + R * Math.sin(la), k: Math.cos(phi + lon) });
  const lonL = -0.62, lonR = Math.min(0.62, 1.52 - phi);   // seulement la partie tournée vers toi (comme les yeux)
  if (lonR - lonL < 0.15 || phi + lonL >= 1.52) return;
  const a = P(lonL, lat), b = P(lonR, lat), m = P((lonL + lonR) / 2, lat);
  const h = R * 0.36 * k0, lw = Math.max(2, R * 0.05);
  g.strokeStyle = INK; g.lineWidth = lw;
  g.fillStyle = '#F1FAEE';                         // le cadre
  g.beginPath(); g.moveTo(a.x, a.y - h * 0.55); g.quadraticCurveTo(m.x, m.y - h * 0.8, b.x, b.y - h * 0.55);
  g.quadraticCurveTo(b.x + (b.x - m.x) * 0.12, b.y, b.x, b.y + h * 0.55); g.quadraticCurveTo(m.x, m.y + h * 0.25, a.x, a.y + h * 0.55);
  g.quadraticCurveTo(a.x - (m.x - a.x) * 0.12, a.y, a.x, a.y - h * 0.55); g.closePath(); g.fill(); g.stroke();
  const lg = g.createLinearGradient(0, m.y - h * 0.5, 0, m.y + h * 0.5);   // le verre miroir (orange, puis bleu)
  lg.addColorStop(0, '#FFB703'); lg.addColorStop(0.5, '#FB5607'); lg.addColorStop(1, '#3A86FF');
  g.fillStyle = lg;
  const s = 0.8;
  g.beginPath(); g.moveTo(lerp(m.x, a.x, s), lerp(m.y, a.y, s) - h * 0.4); g.quadraticCurveTo(m.x, m.y - h * 0.62, lerp(m.x, b.x, s), lerp(m.y, b.y, s) - h * 0.4);
  g.lineTo(lerp(m.x, b.x, s), lerp(m.y, b.y, s) + h * 0.38); g.quadraticCurveTo(m.x, m.y + h * 0.12, lerp(m.x, a.x, s), lerp(m.y, a.y, s) + h * 0.38); g.closePath(); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.6)';           // un reflet sur le verre
  g.beginPath(); g.ellipse(lerp(m.x, a.x, 0.45), m.y - h * 0.2, R * 0.12 * Math.max(0.2, m.k), R * 0.04, -0.3, 0, TAU); g.fill();
}
function drawNeiges(cx, cy, R, turnP, alpha, up) {   // up : le masque est remonté sur le bonnet (on voit ses yeux)
  if (alpha <= 0) return;
  const g = S.ctx, phi = Math.PI * (1 - turnP);
  g.save(); g.globalAlpha *= alpha; g.lineJoin = 'round'; g.lineCap = 'round';
  const lw = Math.max(2, R * 0.05), strap = y => {   // la sangle du masque, tout autour de la tête (de dos, on ne voit qu'elle)
    g.strokeStyle = '#1D3557'; g.lineWidth = R * 0.11;
    const hw = R * Math.sqrt(Math.max(0, 1 - Math.pow((y - cy) / R, 2))) * 0.99;
    g.beginPath(); g.moveTo(cx - hw, y); g.quadraticCurveTo(cx, y + R * 0.08, cx + hw, y); g.stroke();
  };
  if (!up) { strap(cy - R * 0.14); if (turnP >= 0.3) goggles(g, cx, cy, R, phi, -0.12, 1); }
  // le bonnet (rayé rouge et blanc, avec un revers côtelé) et son pompon qui rebondit
  const by = cy - R * 0.5;
  g.save();
  g.beginPath(); g.moveTo(cx - R * 0.93, by); g.bezierCurveTo(cx - R * 1.0, cy - R * 1.42, cx + R * 1.0, cy - R * 1.42, cx + R * 0.93, by); g.closePath();
  g.fillStyle = '#E63946'; g.fill(); g.save(); g.clip();
  g.fillStyle = '#FFFFFF';
  for (let i = 0; i < 3; i++) g.fillRect(cx - R * 1.1, cy - R * (0.78 + i * 0.22), R * 2.2, R * 0.09);
  g.restore();
  g.strokeStyle = INK; g.lineWidth = lw; g.stroke();
  g.restore();
  g.fillStyle = '#C1121F'; g.strokeStyle = INK; g.lineWidth = lw;   // le revers
  rrp(g, cx - R * 0.98, by - R * 0.06, R * 1.96, R * 0.24, R * 0.1); g.fill(); g.stroke();
  g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = Math.max(1, R * 0.025);
  for (let i = -6; i <= 6; i++) { g.beginPath(); g.moveTo(cx + i * R * 0.14, by - R * 0.02); g.lineTo(cx + i * R * 0.14, by + R * 0.14); g.stroke(); }
  if (up) { strap(cy - R * 0.8); if (turnP >= 0.3) goggles(g, cx, cy, R * 0.98, phi, -0.8, 0.8); }   // remonté sur le bonnet
  const bob = Math.abs(Math.sin(S.gtime * 3.2)) * R * 0.06, px = cx, py = cy - R * 1.28 - bob;
  g.fillStyle = '#FFFFFF'; g.strokeStyle = INK; g.lineWidth = lw;
  g.beginPath(); g.arc(px, py, R * 0.2, 0, TAU); g.fill(); g.stroke();
  g.fillStyle = '#FFFFFF';
  for (let i = 0; i < 8; i++) { const an = i * TAU / 8 + 0.2; g.beginPath(); g.arc(px + Math.cos(an) * R * 0.19, py + Math.sin(an) * R * 0.19, R * 0.055, 0, TAU); g.fill(); }
  g.restore();
}
function drawNeigesFace(cx, cy, R) {               // sur le soleil pendant tout le niveau du boss (appelé par render/sun.js)
  const w = S.watcher;
  if (w.bossFace !== 'neiges') return;
  const angry = w.angry || S.gtime < w.angryUntil, peek = w.state === 'peek' || (w.state === 'return' && w.retTo > 0);
  drawNeiges(cx, cy, R, w.turnP, 1, angry || peek);   // fâché ou faux dos : le masque remonte, on voit ses vrais yeux
}
function drawNeigesDrop(k) {                       // l'intro du boss : le bonnet et le masque tombent du ciel
  const x = Lt.cx, y0 = Lt.sunY + S.watcher.offY + S.sunSink, y = lerp(-Lt.R * 1.6, y0, easeIn(clamp(k, 0, 1)));
  drawNeiges(x, y, Lt.R, 1, 1);
}

// ---------- La page de la montagne, sur la carte des niveaux ----------
function drawMountainMap(g, A) {
  const top = A.head + 6, H = S.H - top;
  const sg = g.createLinearGradient(0, top, 0, S.H); sg.addColorStop(0, '#EAF3FC'); sg.addColorStop(1, '#F8FBFF');
  g.fillStyle = sg; rrp(g, -20, top, S.W + 40, H + 30, 26); g.fill();                   // la neige
  const mh = H * (A.land ? 0.2 : 0.13);                                                  // les sommets, en haut
  g.fillStyle = '#8FA6C4'; g.beginPath(); g.moveTo(-20, top + mh);
  for (let i = 0; i <= 12; i++) { const x = -20 + (S.W + 40) * i / 12, h = i % 2 ? mh * (0.55 + 0.4 * S.hash(i * 3.3 + 80)) : mh * 0.08; g.lineTo(x, top + mh - h); }
  g.lineTo(S.W + 20, top + mh); g.closePath(); g.fill();
  g.fillStyle = '#FFFFFF';
  for (let i = 1; i <= 11; i += 2) {
    const x = -20 + (S.W + 40) * i / 12, h = mh * (0.55 + 0.4 * S.hash(i * 3.3 + 80)), dx = (S.W + 40) / 12;
    g.beginPath(); g.moveTo(x, top + mh - h); g.lineTo(x + dx * 0.3, top + mh - h * 0.62); g.lineTo(x + dx * 0.1, top + mh - h * 0.68); g.lineTo(x - dx * 0.05, top + mh - h * 0.58);
    g.lineTo(x - dx * 0.3, top + mh - h * 0.64); g.closePath(); g.fill();
  }
  g.strokeStyle = 'rgba(120,150,190,0.35)'; g.lineWidth = 3; g.setLineDash([10, 8]);    // des traces de ski
  for (let i = 0; i < 3; i++) { g.beginPath(); const x0 = S.W * (0.15 + i * 0.3); g.moveTo(x0, top + mh + 10); g.bezierCurveTo(x0 + 60, top + H * 0.35, x0 - 60, top + H * 0.6, x0 + 30, S.H); g.stroke(); }
  g.setLineDash([]);
  const lx = S.W * (A.land ? 0.5 : 0.24), ly = top + H * (A.land ? 0.36 : 0.44), lr = Math.min(S.W, S.H) * 0.1;   // le lac gelé
  g.fillStyle = '#CFEAFB'; g.strokeStyle = INK; g.lineWidth = 3;
  g.beginPath(); g.ellipse(lx, ly, lr * 1.4, lr * 0.75, -0.15, 0, TAU); g.fill(); g.stroke();
  g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 2.5;
  for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(lx - lr * 0.3 + i * lr * 0.35, ly + lr * 0.05, lr * (0.3 + i * 0.08), Math.PI * 1.1, Math.PI * 1.6); g.stroke(); }
  const r = clamp(Math.min(S.W, S.H) * 0.045, 14, 30);                                   // des sapins enneigés, sur les bords
  const y0 = top + mh + r * 2.4, y1 = S.H - safe.b - r, n = 2 * clamp(Math.floor((y1 - y0) / (r * 2.8)), 2, 5);   // assez d'espace entre eux
  for (let i = 0; i < n; i++) {
    const x = i % 2 ? A.right - r * 0.2 : A.left + r * 0.2, y = lerp(y0, y1, (i + 0.5) / n);
    if (S.hash(i * 5.3 + 7) < 0.2) continue;
    g.strokeStyle = INK; g.lineWidth = 3; g.lineJoin = 'round';
    g.fillStyle = '#6B4A2E'; g.fillRect(x - r * 0.12, y + r * 0.55, r * 0.24, r * 0.4);
    for (let k = 0; k < 2; k++) {                                                       // deux étages, de la neige sur chacun
      const yb = y + r * (0.6 - k * 0.7), yt = yb - r * 1.15, w = r * (0.95 - k * 0.25);
      g.fillStyle = '#2F7A57'; g.beginPath(); g.moveTo(x - w, yb); g.lineTo(x, yt); g.lineTo(x + w, yb); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = '#FFFFFF'; g.beginPath(); g.moveTo(x - w * 0.42, yt + r * 0.5); g.lineTo(x, yt + r * 0.04); g.lineTo(x + w * 0.42, yt + r * 0.5);
      g.quadraticCurveTo(x, yt + r * 0.36, x - w * 0.42, yt + r * 0.5); g.closePath(); g.fill();
    }
  }
  const cw = Math.min(S.W, S.H) * 0.075, cx = A.land ? S.W * 0.84 : A.right - cw * 1.6, cy = top + H * (A.land ? 0.8 : 0.9);   // un chalet
  g.strokeStyle = INK; g.lineWidth = 3; g.lineJoin = 'round';
  g.fillStyle = '#A0643C'; g.fillRect(cx - cw, cy - cw * 0.9, cw * 2, cw * 0.9); g.strokeRect(cx - cw, cy - cw * 0.9, cw * 2, cw * 0.9);
  g.fillStyle = '#FFD166'; g.fillRect(cx + cw * 0.2, cy - cw * 0.65, cw * 0.5, cw * 0.38); g.strokeRect(cx + cw * 0.2, cy - cw * 0.65, cw * 0.5, cw * 0.38);
  g.fillStyle = '#6E4223'; g.fillRect(cx - cw * 0.7, cy - cw * 0.62, cw * 0.42, cw * 0.62);
  g.fillStyle = '#FFFFFF'; g.beginPath(); g.moveTo(cx - cw * 1.25, cy - cw * 0.85); g.lineTo(cx, cy - cw * 1.75); g.lineTo(cx + cw * 1.25, cy - cw * 0.85); g.closePath(); g.fill(); g.stroke();
}

Object.assign(S, { tintMountain, drawPeaks, drawMountainDecor, drawNeiges, drawNeigesFace, drawNeigesDrop, drawMountainMap });
})(window.Soleil);
