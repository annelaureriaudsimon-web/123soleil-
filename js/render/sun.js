/* js/render/sun.js — Le soleil (et la Lune) : visage, regard, rayons */
(function (S) {
'use strict';
const { INK, PHASE_LEN, TAU, css, mix, mixA, smooth, MOONC, SUNC, Lt, viewZ, rrp } = S;   // déjà chargés

function watcherColors() {
  if (S.watcher.type === 'moon') return MOONC;
  const p = Math.max(0, viewZ()) / PHASE_LEN, i = Math.floor(p) % 4, f = p - Math.floor(p);
  const a = SUNC[Math.min(i, 2)];
  if (i >= 2) return a;
  const b = SUNC[i + 1], t = smooth(0.82, 1, f);
  if (t <= 0) return a;
  return { d1: mix(a.d1, b.d1, t), d2: mix(a.d2, b.d2, t), rays: mix(a.rays, b.rays, t), glow: mixA(a.glow, b.glow, t) };
}

function drawWatcher() {
  const w = S.watcher, C = watcherColors(), moon = w.type === 'moon';
  const R = Lt.R * (1 + w.bump * 0.05);
  const cx = Lt.cx + Math.sin(S.gtime * 38) * w.laugh * Lt.R * 0.05, cy = Lt.sunY + w.offY + S.sunSink - Math.abs(Math.sin(S.gtime * 19)) * w.laugh * Lt.R * 0.06;
  const danger = w.state === 'look' || w.state === 'caught' || w.state === 'peek';
  const gr = R * (moon ? 2.0 : 2.5);
  const g = S.ctx.createRadialGradient(cx, cy, R * 0.6, cx, cy, gr);
  g.addColorStop(0, css(w.boss ? '#FF6B6B' : C.glow, danger || w.boss ? 0.7 : 0.5)); g.addColorStop(1, css(C.glow, 0));
  S.ctx.fillStyle = g; S.ctx.beginPath(); S.ctx.arc(cx, cy, gr, 0, TAU); S.ctx.fill();
  if (!moon) {                                       // rayons
    S.ctx.strokeStyle = INK; S.ctx.lineWidth = Math.max(1.5, R * 0.035); S.ctx.lineJoin = 'round';
    for (let i = 0; i < 12; i++) {
      const a = w.rayA + i * TAU / 12;
      const len = R * (1.36 + (i & 1) * 0.16 + w.bump * 0.18 + (danger ? 0.07 * Math.sin(S.gtime * 24 + i * 2) : 0));
      S.ctx.fillStyle = w.boss && i % 2 ? '#FF6B3D' : C.rays;
      S.ctx.beginPath();
      S.ctx.moveTo(cx + Math.cos(a - 0.16) * R * 0.9, cy + Math.sin(a - 0.16) * R * 0.9);
      S.ctx.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len);
      S.ctx.lineTo(cx + Math.cos(a + 0.16) * R * 0.9, cy + Math.sin(a + 0.16) * R * 0.9);
      S.ctx.closePath(); S.ctx.fill(); S.ctx.stroke();
    }
  }
  const dg = S.ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R * 1.05);
  dg.addColorStop(0, C.d1); dg.addColorStop(1, C.d2);
  S.ctx.fillStyle = dg; S.ctx.beginPath(); S.ctx.arc(cx, cy, R, 0, TAU); S.ctx.fill();
  S.ctx.save(); S.ctx.beginPath(); S.ctx.arc(cx, cy, R, 0, TAU); S.ctx.clip();
  drawFace(cx, cy, R, moon, C);
  S.ctx.restore();
  S.ctx.strokeStyle = INK; S.ctx.lineWidth = Math.max(2, R * 0.06);
  S.ctx.beginPath(); S.ctx.arc(cx, cy, R, 0, TAU); S.ctx.stroke();
  if (w.bossFace === 'vacancier') S.drawVacancierFace(cx, cy, R);   // v2.5 : chapeau et lunettes en cœur (render/beach.js)
  if (w.bossFace === 'neiges') S.drawNeigesFace(cx, cy, R);          // v2.6 : bonnet à pompon et masque de ski (render/mountain.js)
}

// Le visage est dessiné sur une « sphère » : quand il se retourne, les yeux glissent depuis le bord.
function drawFace(cx, cy, R, moon, C) {
  const w = S.watcher, phi = Math.PI * (1 - w.turnP);
  const P = (lon, lat) => ({ x: cx + R * Math.sin(lon) * Math.cos(lat), y: cy + R * Math.sin(lat), k: Math.cos(lon) });
  const lw = Math.max(1.5, R * 0.045);
  if (moon) {
    S.ctx.fillStyle = C.crater;
    const CR = [[2.5, -0.38, 0.17], [3.4, 0.28, 0.13], [3.95, -0.1, 0.1], [1.25, 0.5, 0.1], [-1.3, -0.52, 0.09], [1.9, -0.05, 0.08], [-2.2, 0.3, 0.12]];
    for (const [lo, la, r] of CR) {
      const p = P(phi + lo, la); if (p.k <= 0.03) continue;
      S.ctx.beginPath(); S.ctx.ellipse(p.x, p.y, R * r * p.k, R * r * Math.cos(la), 0, 0, TAU); S.ctx.fill();
    }
  } else {                                           // épi de cheveux à l'arrière du crâne
    const p = P(phi + Math.PI, -0.5);
    if (p.k > 0.05) {
      S.ctx.save(); S.ctx.translate(p.x, p.y); S.ctx.scale(p.k, 1);
      S.ctx.strokeStyle = 'rgba(170,80,20,0.35)'; S.ctx.lineWidth = R * 0.05; S.ctx.lineCap = 'round';
      S.ctx.beginPath();
      for (let i = 0; i <= 24; i++) {
        const a = i / 24 * TAU * 1.6, q = R * 0.02 + i / 24 * R * 0.16;
        if (i === 0) S.ctx.moveTo(Math.cos(a) * q, Math.sin(a) * q * 0.8); else S.ctx.lineTo(Math.cos(a) * q, Math.sin(a) * q * 0.8);
      }
      S.ctx.stroke(); S.ctx.restore();
    }
  }
  const look = w.state === 'look' || w.state === 'caught' || w.state === 'peek' || ((w.state === 'turn' || w.state === 'return' || w.state === 'hop') && w.turnP > 0.5);
  const angry = w.angry || S.gtime < w.angryUntil, shades = w.boss && !angry && !(w.state === 'peek' || (w.state === 'return' && w.retTo > 0));
  for (const sd of [-1, 1]) {                        // joues
    const p = P(phi + sd * 0.64, 0.2); if (p.k <= 0) continue;
    S.ctx.fillStyle = moon ? 'rgba(150,165,255,0.35)' : 'rgba(255,95,120,0.42)';
    S.ctx.beginPath(); S.ctx.ellipse(p.x, p.y, R * 0.13 * p.k, R * 0.075, 0, 0, TAU); S.ctx.fill();
  }
  for (const sd of [-1, 1]) {                        // yeux (ou lunettes de boss)
    const p = P(phi + sd * 0.38, -0.14); if (p.k <= 0.02) continue;
    S.ctx.strokeStyle = INK; S.ctx.lineWidth = lw;
    if (shades) {
      S.ctx.fillStyle = '#1B1B2F';
      rrp(S.ctx, p.x - R * 0.2 * p.k, p.y - R * 0.13, R * 0.4 * p.k, R * 0.25, R * 0.08); S.ctx.fill(); S.ctx.stroke();
      S.ctx.strokeStyle = 'rgba(255,255,255,0.75)'; S.ctx.lineWidth = lw * 0.8;
      S.ctx.beginPath(); S.ctx.moveTo(p.x - R * 0.12 * p.k, p.y - R * 0.04); S.ctx.lineTo(p.x - R * 0.02 * p.k, p.y - R * 0.1); S.ctx.stroke();
      continue;
    }
    const ew = R * 0.165 * p.k, eh = R * (angry ? 0.235 : 0.21);
    S.ctx.fillStyle = '#FFFFFF';
    S.ctx.beginPath(); S.ctx.ellipse(p.x, p.y, ew, eh, 0, 0, TAU); S.ctx.fill();
    const px = p.x + w.eyeX * R * 0.065 * p.k, py = p.y + w.eyeY * R * 0.075;
    S.ctx.fillStyle = angry ? '#E5383B' : INK;
    S.ctx.beginPath(); S.ctx.ellipse(px, py, R * 0.085 * p.k, R * (angry ? 0.075 : 0.1), 0, 0, TAU); S.ctx.fill();
    S.ctx.fillStyle = '#FFFFFF'; S.ctx.beginPath(); S.ctx.arc(px - R * 0.03 * p.k, py - R * 0.035, R * 0.024, 0, TAU); S.ctx.fill();
    if (w.lid > 0.02) {                              // paupière soupçonneuse
      S.ctx.save(); S.ctx.beginPath(); S.ctx.ellipse(p.x, p.y, ew, eh, 0, 0, TAU); S.ctx.clip();
      S.ctx.fillStyle = C.d2; S.ctx.fillRect(p.x - ew - 2, p.y - eh - 2, ew * 2 + 4, eh * 2 * w.lid + 2);
      S.ctx.restore();
      const ly = p.y - eh + eh * 2 * w.lid, ry = (ly - p.y) / eh, hwl = ew * Math.sqrt(Math.max(0, 1 - ry * ry));
      S.ctx.beginPath(); S.ctx.moveTo(p.x - hwl, ly); S.ctx.lineTo(p.x + hwl, ly); S.ctx.stroke();
    }
    S.ctx.beginPath(); S.ctx.ellipse(p.x, p.y, ew, eh, 0, 0, TAU); S.ctx.stroke();
    if (angry) {                                     // sourcils furieux
      S.ctx.lineWidth = lw * 1.6; S.ctx.lineCap = 'round';
      S.ctx.beginPath(); S.ctx.moveTo(p.x + sd * ew * 1.2, p.y - eh * 1.45); S.ctx.lineTo(p.x - sd * ew * 0.9, p.y - eh * 1.0); S.ctx.stroke();
      S.ctx.lineWidth = lw;
    }
  }
  if (shades) {                                      // pont des lunettes
    const a = P(phi - 0.38, -0.14), b = P(phi + 0.38, -0.14);
    if (a.k > 0.02 && b.k > 0.02) { S.ctx.strokeStyle = INK; S.ctx.lineWidth = lw * 1.2; S.ctx.beginPath(); S.ctx.moveTo(a.x + R * 0.2 * a.k, a.y - R * 0.05); S.ctx.lineTo(b.x - R * 0.2 * b.k, b.y - R * 0.05); S.ctx.stroke(); }
  }
  const m = P(phi, 0.38);                            // bouche
  if (m.k > 0.05) {
    S.ctx.strokeStyle = INK; S.ctx.lineWidth = lw; S.ctx.lineCap = 'round';
    S.ctx.save(); S.ctx.translate(m.x, m.y); S.ctx.scale(m.k, 1);
    if (angry) { S.ctx.fillStyle = '#7A1F2B'; S.ctx.beginPath(); S.ctx.ellipse(0, 0, R * 0.13, R * 0.1, 0, 0, TAU); S.ctx.fill(); S.ctx.stroke(); }
    else if (shades || w.laugh > 0.2) { S.ctx.fillStyle = '#7A1F2B'; S.ctx.beginPath(); S.ctx.arc(0, -R * 0.04, R * 0.13, 0.1 * Math.PI, 0.9 * Math.PI); S.ctx.closePath(); S.ctx.fill(); S.ctx.stroke(); }
    else if (look) { S.ctx.beginPath(); S.ctx.moveTo(-R * 0.11, R * 0.01); S.ctx.quadraticCurveTo(0, -R * 0.04, R * 0.11, R * 0.015); S.ctx.stroke(); }
    else { S.ctx.beginPath(); S.ctx.arc(0, -R * 0.07, R * 0.12, 0.18 * Math.PI, 0.82 * Math.PI); S.ctx.stroke(); }
    S.ctx.restore();
  }
}

Object.assign(S, { watcherColors, drawWatcher, drawFace });
})(window.Soleil);
