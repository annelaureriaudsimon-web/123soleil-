/* js/render/characters.js — Le coureur et ses tenues (vu de dos), le fantôme */
(function (S) {
'use strict';
const { FONT, INK, SKIN, TAU, VMAX0, outfitById, OUTFITS, clamp, lerp, mix, hash, DAY, Lt, ghostZ, rrp, yAt } = S;   // déjà chargés

/* ---------- 22. Dessin : le coureur et ses tenues (vu de dos) ---------- */
// g = contexte, (x, y) = pieds, s = pixels par mètre, P = pose, O = tenue, ghostMode = fantôme transparent
function drawRunnerFig(g, x, y, s, P, O, ghostMode, bibText) {
  const sp = P.sp, ph = P.ph, st = P.st, tz = P.tz || 0, t = P.t || 0;
  const bob = Math.abs(Math.sin(ph)) * 0.06 * sp;
  const C = c => (ghostMode ? '#FFFFFF' : tz > 0 ? mix(c, '#2A2524', Math.min(1, tz)) : c);
  const lw = 0.04;
  g.save();
  g.translate(x, y); g.scale(s, s * (1 + (P.breathe || 0)));
  if (ghostMode) g.globalAlpha *= 0.45;
  g.lineJoin = 'round'; g.lineCap = 'round';
  const ink = ghostMode ? 'rgba(43,45,66,0.55)' : INK;
  g.strokeStyle = ink; g.lineWidth = lw;
  if (!ghostMode) { g.fillStyle = 'rgba(0,0,0,0.2)'; g.beginPath(); g.ellipse(0, 0, 0.42, 0.1, 0, 0, TAU); g.fill(); }
  const hipY = -0.5 - bob, top = -1.02 - bob, hy = top - 0.17;
  for (const sd of [-1, 1]) {                        // jambes
    const lift = Math.max(0, Math.sin(ph + (sd > 0 ? 0 : Math.PI))) * 0.2 * sp;
    const lx = sd * (0.11 + st * 0.05 + (P.slide || 0) * 0.06), fy = -0.03 - lift;
    g.fillStyle = C(O.legs); rrp(g, lx - 0.075, hipY, 0.15, fy - hipY, 0.07); g.fill(); g.stroke();
    g.fillStyle = C(O.shoes); g.beginPath(); g.ellipse(lx, fy, 0.11, 0.065, 0, 0, TAU); g.fill(); g.stroke();
  }
  for (const sd of [-1, 1]) {                        // bras (en l'air quand il se fige)
    const swing = Math.sin(ph + (sd > 0 ? Math.PI : 0));
    const ang = lerp(0.2 + Math.max(0, swing) * 0.55 * sp, 2.35, st) + (P.slide || 0) * 1.1 * (1 - st);
    g.save(); g.translate(sd * 0.22, top + 0.12); g.rotate(-sd * ang);
    g.fillStyle = C(O.body); rrp(g, -0.065, -0.02, 0.13, 0.44, 0.065); g.fill(); g.stroke();
    if (O.wrist) { g.fillStyle = C(O.wrist); g.fillRect(-0.066, 0.3, 0.132, 0.07); }
    g.fillStyle = C(O.hood ? O.body : SKIN); g.beginPath(); g.arc(0, 0.45, 0.075, 0, TAU); g.fill(); g.stroke();
    g.restore();
  }
  const bodyPath = () => rrp(g, -0.26, top, 0.52, -0.46 - bob - top, 0.17);
  g.fillStyle = C(O.body); bodyPath(); g.fill();
  if (O.stripe || O.dots || O.stripes) {             // motifs du haut
    g.save(); bodyPath(); g.clip();
    if (O.stripe) { g.fillStyle = C(O.stripe); g.fillRect(-0.3, top + 0.09, 0.6, 0.05); g.fillRect(-0.3, top + 0.17, 0.6, 0.025); }
    if (O.stripes) { g.fillStyle = C(O.stripes); for (let i = -3; i <= 3; i++) g.fillRect(i * 0.09 - 0.017, top - 0.1, 0.034, 0.8); }
    if (O.dots) { g.fillStyle = C(O.dots); for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(-0.2 + (i % 3) * 0.2 + (i % 2) * 0.05, top + 0.08 + Math.floor(i / 3) * 0.17, 0.035, 0, TAU); g.fill(); } }
    g.restore();
  }
  bodyPath(); g.stroke();
  g.fillStyle = C(O.shorts); rrp(g, -0.25, -0.6 - bob, 0.5, 0.16, 0.06); g.fill(); g.stroke();
  if (O.stripes) { g.fillStyle = C(O.stripes); g.fillRect(-0.12, -0.6 - bob, 0.03, 0.16); g.fillRect(0.09, -0.6 - bob, 0.03, 0.16); }
  if (O.bib) {                                       // dossard = numéro du défi du jour
    g.fillStyle = C('#FFFFFF'); g.lineWidth = lw * 0.7; rrp(g, -0.15, top + 0.14, 0.3, 0.22, 0.04); g.fill(); g.stroke(); g.lineWidth = lw;
    if (bibText && s > 14) {
      g.save(); g.scale(1 / s, 1 / s);
      g.fillStyle = C(INK); g.font = `900 ${0.16 * s}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(bibText, 0, (top + 0.255) * s); g.restore();
    }
  }
  if (O.spikes) {                                    // épines du dino le long du dos
    g.fillStyle = C(O.spikes);
    for (let i = 0; i < 4; i++) { const yy = top + 0.06 + i * 0.12; g.beginPath(); g.moveTo(-0.065, yy + 0.1); g.lineTo(0, yy - 0.02); g.lineTo(0.065, yy + 0.1); g.closePath(); g.fill(); g.stroke(); }
  }
  if (O.cape) {                                      // cape qui flotte
    const fl = Math.sin(t * 9 + ph) * 0.05 * (0.3 + sp), spread = 0.05 + sp * 0.1;
    g.fillStyle = C(O.capeIn);
    g.beginPath(); g.moveTo(-0.22, top + 0.04); g.lineTo(0.22, top + 0.04); g.lineTo(0.33 + spread, -0.2 + fl); g.lineTo(-0.33 - spread, -0.2 - fl); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = C(O.cape);
    g.beginPath(); g.moveTo(-0.21, top + 0.03); g.lineTo(0.21, top + 0.03);
    g.quadraticCurveTo(0.27 + spread, -0.45, 0.28 + spread, -0.24 + fl);
    g.quadraticCurveTo(0.14, -0.16 - fl, 0, -0.24 + fl * 0.5);
    g.quadraticCurveTo(-0.14, -0.16 + fl, -0.28 - spread, -0.24 - fl);
    g.quadraticCurveTo(-0.27 - spread, -0.45, -0.21, top + 0.03);
    g.closePath(); g.fill(); g.stroke();
    if (O.ermine) {                                  // hermine du roi
      g.fillStyle = C('#FFFFFF'); rrp(g, -0.24, top + 0.0, 0.48, 0.09, 0.04); g.fill(); g.stroke();
      g.fillStyle = C(INK); for (let i = -2; i <= 2; i++) { g.beginPath(); g.arc(i * 0.09, top + 0.045, 0.012, 0, TAU); g.fill(); }
    }
  }
  if (O.tail) {                                      // queue du dino
    const sw = Math.sin(t * 6 + ph * 0.5) * 0.12 * (0.4 + sp);
    g.fillStyle = C(O.body);
    g.beginPath(); g.moveTo(-0.13, -0.55 - bob); g.quadraticCurveTo(-0.06 + sw, -0.26, sw * 1.6 - 0.035, -0.02);
    g.lineTo(sw * 1.6 + 0.05, -0.02); g.quadraticCurveTo(0.08 + sw, -0.26, 0.13, -0.55 - bob); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = C(O.spikes);
    for (let i = 0; i < 2; i++) { const u = 0.35 + i * 0.3, xx = lerp(0, sw * 1.6, u), yy = lerp(-0.55, -0.02, u); g.beginPath(); g.moveTo(xx - 0.04, yy); g.lineTo(xx, yy - 0.07); g.lineTo(xx + 0.04, yy); g.closePath(); g.fill(); g.stroke(); }
  }
  if (O.collar) {                                    // col de vampire
    g.fillStyle = C(O.capeIn);
    for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(sd * 0.1, top + 0.06); g.lineTo(sd * 0.36, top - 0.2); g.lineTo(sd * 0.25, top + 0.08); g.closePath(); g.fill(); g.stroke(); }
  }
  if (!O.hood) { g.fillStyle = C(SKIN); for (const sd of [-1, 1]) { g.beginPath(); g.ellipse(sd * 0.205, hy + 0.03, 0.05, 0.07, 0, 0, TAU); g.fill(); g.stroke(); } }
  g.fillStyle = C(O.hair);                           // cheveux (en pétard quand il est grillé)
  g.beginPath();
  if (tz > 0.35 && !O.hood) {
    for (let i = 0; i <= 18; i++) {
      const a = i / 18 * TAU, rad = (i & 1 ? 0.2 : 0.31) + (hash(i) - 0.5) * 0.05;
      if (i === 0) g.moveTo(Math.cos(a) * rad, hy + Math.sin(a) * rad); else g.lineTo(Math.cos(a) * rad, hy + Math.sin(a) * rad);
    }
    g.closePath();
  } else g.arc(0, hy, 0.215, 0, TAU);
  g.fill(); g.stroke();
  if (O.hood) {                                      // capuche de dino
    g.fillStyle = C(O.spikes);
    for (let i = 0; i < 3; i++) { const yy = hy - 0.24 + i * 0.13; g.beginPath(); g.moveTo(-0.055, yy + 0.08); g.lineTo(0, yy - 0.03); g.lineTo(0.055, yy + 0.08); g.closePath(); g.fill(); g.stroke(); }
  } else if (!O.hat && !O.crown && tz <= 0.35) { g.beginPath(); g.moveTo(-0.05, hy - 0.2); g.quadraticCurveTo(0.02, hy - 0.32, 0.1, hy - 0.24); g.stroke(); }
  if (O.hat === 'cap') {                             // casquette à l'envers
    g.fillStyle = C(O.hatC);
    g.beginPath(); g.arc(0, hy - 0.01, 0.228, Math.PI * 1.03, Math.PI * 1.97); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = C(O.hair); g.beginPath(); g.arc(0, hy - 0.035, 0.06, Math.PI, 0); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = C('#E8B84A'); g.beginPath(); g.ellipse(0, hy + 0.01, 0.2, 0.06, 0, 0, TAU); g.fill(); g.stroke();
  } else if (O.hat === 'band') {                     // bandeau de tennis
    g.save(); g.beginPath(); g.arc(0, hy, 0.215, 0, TAU); g.clip();
    g.fillStyle = C(O.hatC); g.fillRect(-0.25, hy - 0.08, 0.5, 0.075); g.restore();
    const fl = Math.sin(t * 10 + ph) * 0.03;
    g.fillStyle = C(O.hatC);
    g.beginPath(); g.moveTo(0.17, hy - 0.06); g.lineTo(0.34, hy - 0.02 + fl); g.lineTo(0.3, hy + 0.04 + fl); g.closePath(); g.fill(); g.stroke();
  } else if (O.hat === 'straw') {                    // chapeau de paille
    g.fillStyle = C(O.hatC);
    g.beginPath(); g.ellipse(0, hy - 0.05, 0.42, 0.1, 0, 0, TAU); g.fill(); g.stroke();
    g.beginPath(); g.ellipse(0, hy - 0.1, 0.2, 0.17, 0, Math.PI, 0); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = C(O.ribbon); g.fillRect(-0.2, hy - 0.13, 0.4, 0.045);
  } else if (O.hat === 'night') {                    // bonnet de nuit avec pompon
    g.fillStyle = C(O.hatC);
    g.beginPath(); g.moveTo(-0.225, hy - 0.02); g.quadraticCurveTo(-0.1, hy - 0.46, 0.22, hy - 0.4);
    g.quadraticCurveTo(0.4, hy - 0.36, 0.37, hy - 0.16); g.quadraticCurveTo(0.27, hy - 0.24, 0.225, hy - 0.02); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = C('#FFFFFF'); rrp(g, -0.235, hy - 0.07, 0.47, 0.08, 0.04); g.fill(); g.stroke();
    g.beginPath(); g.arc(0.37, hy - 0.14, 0.065, 0, TAU); g.fill(); g.stroke();
  }
  if (O.crown) {                                     // couronne du Roi du Soleil
    g.fillStyle = C('#FFD166');
    g.beginPath(); g.moveTo(-0.17, hy - 0.11); g.lineTo(-0.17, hy - 0.3); g.lineTo(-0.085, hy - 0.2); g.lineTo(0, hy - 0.34);
    g.lineTo(0.085, hy - 0.2); g.lineTo(0.17, hy - 0.3); g.lineTo(0.17, hy - 0.11); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = C('#E63946'); g.beginPath(); g.arc(0, hy - 0.16, 0.03, 0, TAU); g.fill();
  }
  g.restore();
}

function drawRunner() {
  const r = S.runner;
  drawRunnerFig(S.ctx, Lt.cx + r.jx * Lt.s, Lt.yFeet, Lt.s,
    { sp: clamp(r.v / VMAX0, 0, 1), ph: r.phase, st: r.statue, tz: r.toast, t: S.gtime, slide: r.slide,
      breathe: S.state === 'title' ? Math.sin(S.gtime * 3) * 0.015 : 0 },
    outfitById(S.outfit), false, S.state === 'title' || S.mode === 'daily' ? String(DAY) : '');
}

function ghostPos(camZ) {                            // où dessiner le fantôme (à droite du chemin)
  if (!(S.state === 'play' || S.state === 'caught') || !S.ghostAlive) return null;
  const gz = ghostZ(S.runT); if (gz === null) return null;
  const dz = gz - camZ; if (dz < 1.6 || dz > 100) return null;
  const sc = Lt.F / dz;
  return { gz, dz, x: Lt.cx + 0.62 * sc, y: yAt(dz), s: sc };
}
function drawGhost(gp) {
  const v = Math.max(0, (ghostZ(S.runT + 0.05) || gp.gz) - (ghostZ(Math.max(0, S.runT - 0.05)) || gp.gz)) / 0.1;
  S.ghostLast = gp;
  drawRunnerFig(S.ctx, gp.x, gp.y, gp.s, { sp: clamp(v / VMAX0, 0, 1), ph: gp.gz * 1.6, st: 0, t: S.gtime }, OUTFITS[0], true);
}

Object.assign(S, { drawRunnerFig, drawRunner, ghostPos, drawGhost });
})(window.Soleil);
