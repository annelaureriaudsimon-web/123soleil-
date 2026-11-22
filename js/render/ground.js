/* js/render/ground.js — Sol, chemin, plaques, repères, décor */
(function (S) {
'use strict';
const { CAM_H, FAR, FONT, INK, PATH_W, TAU, L, clamp, css, lerp, mix, mixA, hash, pal, Lt, blockPatch, rrp, yAt } = S;   // déjà chargés

function drawGround(camZ) {
  const hy = Lt.hy, F = Lt.F, cx = Lt.cx;
  const nearDz = CAM_H * F / (S.H + 40 - hy);
  S.ctx.fillStyle = css(pal.haze); S.ctx.fillRect(-40, hy, S.W + 80, S.H - hy + 40);
  const ST = 2;
  const kN = Math.floor((camZ + nearDz) / ST), kF = Math.floor((camZ + FAR) / ST);
  for (let k = kF; k >= kN; k--) {                   // bandes d'herbe et de chemin, du loin vers le près
    const dzA = Math.max(k * ST - camZ, nearDz), dzB = (k + 1) * ST - camZ;
    if (dzB <= dzA) continue;
    const yA = yAt(dzA), yB = yAt(dzB);
    const fog = Math.pow(clamp(dzB / FAR, 0, 1), 0.7), odd = (k & 1) === 1;
    S.ctx.fillStyle = mix(odd ? pal.grass1 : pal.grass2, pal.haze, fog);
    S.ctx.fillRect(-40, yB, S.W + 80, yA - yB + 0.6);
    const a = PATH_W * F / dzA, b = PATH_W * F / dzB;
    S.ctx.fillStyle = mix(odd ? pal.path1 : pal.path2, pal.haze, fog);
    S.ctx.beginPath(); S.ctx.moveTo(cx - b, yB); S.ctx.lineTo(cx + b, yB); S.ctx.lineTo(cx + a, yA + 0.6); S.ctx.lineTo(cx - a, yA + 0.6); S.ctx.closePath(); S.ctx.fill();
  }
  const hwN = PATH_W * F / nearDz, yN = yAt(nearDz);  // bords du chemin
  S.ctx.fillStyle = css(pal.edge);
  for (const sd of [-1, 1]) {
    S.ctx.beginPath(); S.ctx.moveTo(cx, hy); S.ctx.lineTo(cx + sd * hwN, yN); S.ctx.lineTo(cx + sd * hwN * 1.08, yN); S.ctx.closePath(); S.ctx.fill();
  }
}

function drawPatches(camZ) {                         // flaques de boue et plaques de verglas sur le chemin
  const nearDz = CAM_H * Lt.F / (S.H + 40 - Lt.hy);
  const b0 = Math.floor((camZ + nearDz) / 50) - 1, b1 = Math.floor((camZ + 120) / 50);
  for (let b = b1; b >= b0; b--) {
    const p = blockPatch(b); if (!p) continue;
    const dzN = Math.max(p.z0 - camZ, nearDz), dzF = p.z1 - camZ;
    if (dzF <= nearDz + 0.2 || dzN > 120) continue;
    const yN = yAt(dzN), yF = yAt(dzF);
    if (p.type === 'slope') { drawSlope(p, camZ, dzN, dzF, yN, yF); continue; }
    drawPuddle(p, b, dzN, dzF, yN, yF);
  }
}

// Une flaque de boue (ou une plaque de verglas) posée sur le chemin, entre dzN et dzF devant la caméra.
// Course infinie : drawPatches ; niveaux : drawLevelMud (render/tempt.js). b : graine des taches de boue.
function drawPuddle(p, b, dzN, dzF, yN, yF) {
  const cx = Lt.cx;
  const wN = PATH_W * 0.9 * Lt.F / dzN, wF = PATH_W * 0.9 * Lt.F / dzF;
  const fog = Math.pow(clamp(dzF / 120, 0, 1), 0.8) * 0.65, ice = p.type === 'ice', hgt = yN - yF;
  S.ctx.beginPath();
  S.ctx.moveTo(cx - wF, yF);
  S.ctx.quadraticCurveTo(cx, yF - hgt * 0.1, cx + wF, yF);
  S.ctx.quadraticCurveTo(cx + (wF + wN) * 0.62, yF + hgt / 2, cx + wN, yN);
  S.ctx.quadraticCurveTo(cx, yN + hgt * 0.06, cx - wN, yN);
  S.ctx.quadraticCurveTo(cx - (wF + wN) * 0.62, yF + hgt / 2, cx - wF, yF);
  S.ctx.closePath();
  S.ctx.fillStyle = mix(ice ? '#CDEFFF' : '#7A5230', pal.haze, fog); S.ctx.fill();
  S.ctx.strokeStyle = css(ice ? '#7FC8F0' : '#5A3A1E', 1 - fog); S.ctx.lineWidth = Math.max(1, 0.05 * Lt.F / dzN); S.ctx.stroke();
  S.ctx.save(); S.ctx.clip();
  if (ice) {                                       // reflets du verglas
    S.ctx.strokeStyle = `rgba(255,255,255,${(0.85 - fog).toFixed(3)})`; S.ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      const u = 0.15 + i * 0.22, y1 = yF + hgt * (u + 0.12), y2 = yF + hgt * u;
      const wy = lerp(wF, wN, u);
      S.ctx.lineWidth = Math.max(1, wy * 0.06);
      S.ctx.beginPath(); S.ctx.moveTo(cx - wy * 0.6 + i * wy * 0.25, y1); S.ctx.lineTo(cx - wy * 0.2 + i * wy * 0.25, y2); S.ctx.stroke();
    }
  } else {                                         // taches et bulles de boue
    S.ctx.fillStyle = mix('#5E3D22', pal.haze, fog);
    for (let i = 0; i < 4; i++) {
      const u = 0.2 + hash(b * 3 + i) * 0.6, wy = lerp(wF, wN, u), x = cx + (hash(b * 7 + i) - 0.5) * wy * 1.2;
      S.ctx.beginPath(); S.ctx.ellipse(x, yF + hgt * u, wy * 0.18, Math.max(1, hgt * 0.07), 0, 0, TAU); S.ctx.fill();
    }
  }
  S.ctx.restore();
}

function drawMarkers(camZ) {                         // un trait tous les 10 m, un nombre tous les 50 m
  const nearDz = CAM_H * Lt.F / (S.H - Lt.hy);
  const m0 = Math.max(1, Math.ceil((camZ + nearDz) / 10)), m1 = Math.floor((camZ + 95) / 10);
  S.ctx.textAlign = 'center'; S.ctx.textBaseline = 'middle';
  for (let m = m1; m >= m0; m--) {
    const dz = m * 10 - camZ; if (dz < nearDz) continue;
    const y = yAt(dz), sc = Lt.F / dz, al = 1 - clamp(dz / 95, 0, 1);
    const hw = PATH_W * sc, th = Math.max(1, 0.16 * CAM_H * Lt.F / (dz * dz));
    S.ctx.fillStyle = `rgba(255,255,255,${(0.8 * al).toFixed(3)})`;
    S.ctx.fillRect(Lt.cx - hw, y - th / 2, hw * 2, th);
    if (m % 5 === 0) {
      const label = String(m * 10), dz2 = dz + 1.3, y2 = yAt(dz2), sc2 = Lt.F / dz2;
      const fs = Math.min(1.1, 2.2 / label.length) * sc2, sy = clamp(1.9 * CAM_H / dz2, 0.1, 1);
      S.ctx.save(); S.ctx.translate(Lt.cx, y2); S.ctx.scale(1, sy);
      S.ctx.font = `900 ${fs}px ${FONT}`; S.ctx.fillStyle = `rgba(255,255,255,${(0.85 * al).toFixed(3)})`;
      S.ctx.fillText(label, 0, 0); S.ctx.restore();
    }
  }
}

function drawRecord(camZ) {                          // ligne dorée + drapeau RECORD
  const rz = S.state === 'title' ? S.best : S.recordAtStart;
  if (rz < 5) return;
  const dz = rz - camZ;
  if (dz < 1.5 || dz > 110) return;
  const y = yAt(dz), sc = Lt.F / dz, al = 1 - clamp(dz / 110, 0, 1) * 0.8;
  const th = Math.max(2, 0.25 * CAM_H * Lt.F / (dz * dz));
  const dash = 0.7 * sc, gap = 0.45 * sc;
  S.ctx.fillStyle = css('#FFD166', al);
  for (let x = Lt.cx - dash / 2; x < S.W + dash; x += dash + gap) S.ctx.fillRect(x, y - th / 2, dash, th);
  for (let x = Lt.cx - dash / 2 - dash - gap; x > -dash * 2; x -= dash + gap) S.ctx.fillRect(x, y - th / 2, dash, th);
  const px = Lt.cx + (PATH_W + 0.5) * sc, top = y - 2.3 * sc;
  if (px > S.W + 10) return;
  S.ctx.globalAlpha = al;
  S.ctx.strokeStyle = INK; S.ctx.lineWidth = Math.max(1.5, 0.07 * sc); S.ctx.lineCap = 'round';
  S.ctx.beginPath(); S.ctx.moveTo(px, y); S.ctx.lineTo(px, top); S.ctx.stroke();
  const bw = 1.7 * sc, bh = 0.65 * sc, wv = Math.sin(S.gtime * 6) * 0.08 * sc;
  S.ctx.fillStyle = '#FFD166'; S.ctx.lineWidth = Math.max(1.2, 0.05 * sc); S.ctx.lineJoin = 'round';
  S.ctx.beginPath(); S.ctx.moveTo(px, top); S.ctx.quadraticCurveTo(px + bw / 2, top - wv, px + bw, top);
  S.ctx.lineTo(px + bw, top + bh); S.ctx.quadraticCurveTo(px + bw / 2, top + bh - wv, px, top + bh); S.ctx.closePath();
  S.ctx.fill(); S.ctx.stroke();
  S.ctx.fillStyle = INK; S.ctx.font = `900 ${0.4 * sc}px ${FONT}`; S.ctx.textAlign = 'center'; S.ctx.textBaseline = 'middle';
  S.ctx.fillText(L.flag, px + bw / 2, top + bh / 2 + 0.02 * sc);
  S.ctx.globalAlpha = 1;
}

function drawDecor(camZ) {                           // arbres, fleurs, touffes, cailloux sur les côtés
  if (S.state === 'level') { S.drawLevelDecor(camZ); return; }   // décor du monde du niveau (render/playground.js, render/park.js)
  const SEG = 3;
  const k0 = Math.ceil((camZ + 1.5) / SEG), k1 = Math.floor((camZ + 115 * S.Q.decor) / SEG);   // qualité basse : décor moins loin
  for (let k = k1; k >= k0; k--) {
    for (let side = -1; side <= 1; side += 2) {
      if (hash(k * 1.731 + side * 91.7) < 0.3) continue;
      const z = k * SEG + hash(k * 2.17 + side * 13.1) * SEG, dz = z - camZ;
      if (dz < 1.5 || z < 14) continue;               // départ dégagé
      const lat = side * (PATH_W + 0.7 + Math.pow(hash(k * 3.91 + side * 7.3), 1.6) * 10);
      const sc = Lt.F / dz, x = Lt.cx + lat * sc;
      if (x < -2.5 * sc || x > S.W + 2.5 * sc) continue;
      drawProp(hash(k * 5.37 + side * 3.3), x, yAt(dz), sc, Math.pow(clamp(dz / 115, 0, 1), 0.85), k * 7 + side);
    }
  }
}
function drawProp(t, x, y, sc, fog, seed) {
  const f = c => mix(c, pal.haze, fog);
  const ol = fog < 0.6 && sc > 4;
  S.ctx.lineWidth = Math.max(1, 0.05 * sc); S.ctx.strokeStyle = css(INK, 1 - fog); S.ctx.lineJoin = 'round';
  if (t < 0.17) {                                    // arbre
    const h = (1.6 + hash(seed) * 1.2) * sc, cr = (0.75 + hash(seed + 1) * 0.35) * sc;
    S.ctx.fillStyle = f(pal.trunk); rrp(S.ctx, x - 0.13 * sc, y - h, 0.26 * sc, h, 0.08 * sc); S.ctx.fill(); if (ol) S.ctx.stroke();
    S.ctx.fillStyle = f(hash(seed + 2) < 0.5 ? pal.tree : pal.tree2);
    S.ctx.beginPath(); S.ctx.arc(x, y - h - cr * 0.6, cr, 0, TAU); S.ctx.fill(); if (ol) S.ctx.stroke();
    S.ctx.fillStyle = css([255, 255, 255], 0.18 * (1 - fog));
    S.ctx.beginPath(); S.ctx.arc(x - cr * 0.35, y - h - cr * 0.95, cr * 0.32, 0, TAU); S.ctx.fill();
  } else if (t < 0.5) {                              // touffe d'herbe
    S.ctx.fillStyle = f(pal.tuft);
    S.ctx.beginPath();
    for (let i = -1; i <= 1; i++) {
      const bx = x + i * 0.12 * sc, hh = (0.32 + (i === 0 ? 0.14 : 0)) * sc;
      S.ctx.moveTo(bx - 0.08 * sc, y); S.ctx.lineTo(bx + i * 0.06 * sc, y - hh); S.ctx.lineTo(bx + 0.08 * sc, y);
    }
    S.ctx.fill();
  } else if (t < 0.82) {                             // fleurs
    for (let i = 0; i < 3; i++) {
      const fx = x + (i - 1) * 0.22 * sc + hash(seed + i) * 0.1 * sc, fh = (0.22 + hash(seed + i + 5) * 0.2) * sc;
      S.ctx.strokeStyle = f(pal.tuft); S.ctx.lineWidth = Math.max(1, 0.04 * sc);
      S.ctx.beginPath(); S.ctx.moveTo(fx, y); S.ctx.lineTo(fx, y - fh); S.ctx.stroke();
      S.ctx.fillStyle = f(i === 1 ? pal.flowerB : pal.flowerA);
      S.ctx.beginPath(); S.ctx.arc(fx, y - fh, Math.max(1, 0.075 * sc), 0, TAU); S.ctx.fill();
    }
  } else {                                           // caillou
    S.ctx.fillStyle = f(pal.rock);
    S.ctx.beginPath(); S.ctx.ellipse(x, y - 0.12 * sc, 0.34 * sc, 0.2 * sc, 0, 0, TAU); S.ctx.fill(); if (ol) S.ctx.stroke();
  }
}

function drawSlope(p, camZ, dzN, dzF, yN, yF) {    // descente : chemin plus foncé, chevrons ▼ peints au sol
  const cx = Lt.cx, wN = PATH_W * Lt.F / dzN, wF = PATH_W * Lt.F / dzF;
  const fog = Math.pow(clamp(dzF / 120, 0, 1), 0.8) * 0.65;
  S.ctx.beginPath(); S.ctx.moveTo(cx - wF, yF); S.ctx.lineTo(cx + wF, yF); S.ctx.lineTo(cx + wN, yN); S.ctx.lineTo(cx - wN, yN); S.ctx.closePath();
  S.ctx.fillStyle = mix(mixA(pal.path2, '#2B1D14', 0.3), pal.haze, fog); S.ctx.fill();   // mixA : couleur en tableau, re-mélangeable
  S.ctx.save(); S.ctx.clip();
  const nearDz = CAM_H * Lt.F / (S.H + 40 - Lt.hy);
  S.ctx.strokeStyle = `rgba(255,248,230,${(0.8 * (1 - fog)).toFixed(3)})`; S.ctx.lineCap = 'round'; S.ctx.lineJoin = 'round';
  for (let z = p.z0 + 1.2; z < p.z1 - 0.4; z += 1.8) {   // ▼ : la pointe vers toi
    const dz = z - camZ;
    if (dz < nearDz + 0.6) continue;
    const yb = yAt(dz), yt = yAt(dz - 0.55), wc = PATH_W * 0.55 * Lt.F / dz;
    S.ctx.lineWidth = Math.max(1.5, 0.12 * Lt.F / dz);
    S.ctx.beginPath(); S.ctx.moveTo(cx - wc, yb); S.ctx.lineTo(cx, yt); S.ctx.lineTo(cx + wc, yb); S.ctx.stroke();
  }
  S.ctx.restore();
  S.ctx.strokeStyle = css('#3B2E22', 0.7 * (1 - fog)); S.ctx.lineWidth = Math.max(1, 0.05 * Lt.F / dzN);   // bords du haut et du bas
  S.ctx.beginPath(); S.ctx.moveTo(cx - wF, yF); S.ctx.lineTo(cx + wF, yF); S.ctx.moveTo(cx - wN, yN); S.ctx.lineTo(cx + wN, yN); S.ctx.stroke();
}

Object.assign(S, { drawGround, drawPatches, drawPuddle, drawMarkers, drawRecord, drawDecor, drawProp, drawSlope });
})(window.Soleil);
