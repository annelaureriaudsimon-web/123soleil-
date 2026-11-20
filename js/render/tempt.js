/* js/render/tempt.js — Dessin des tentations du monde 2 et des signaux du soleil :
   l'étoile tentatrice, la mouche, la bulle de moquerie, l'œil du faux dos (bien visible sur un petit écran),
   l'anneau vert du vrai retour (le « ding »), les lunettes-nez-moustache du Soleil Farceur, et les flaques des niveaux.
   Rien ne décide ici : l'état vient de game/match.js et la mise en scène de modes/levels.js (S.Levels.fx). */
(function (S) {
'use strict';
const { CAM_BACK, CAM_H, INK, TAU, clamp, lerp, easeIn, css, Lt, safe, yAt, rrp, fit, drawStarShape, drawPuddle, watcherColors } = S;

// ---------- Réglages ----------
const STAR_H = 1.35;           // l'étoile flotte à hauteur de tête (m)…
const STAR_LAT = 0.8;          // …un peu sur le côté, pour qu'on la voie bien (pas cachée par le coureur) (m)
const STAR_R = 0.3;            // rayon de l'étoile (m)
const HALO_LIFE = 0.7;         // durée de l'anneau vert du vrai retour (s)
const EYE_K = 0.27;            // taille de l'œil du faux dos (× rayon du soleil)

const fx = () => S.Levels.fx;
const sunC = () => ({ x: Lt.cx, y: Lt.sunY + S.watcher.offY, R: Lt.R });

// ⭐ L'étoile tentatrice : 1,6 m devant toi, elle brille et scintille. Au vrai retour, elle s'envole.
function drawTemptStar(camZ) {
  const st = fx() && fx().star; if (!st) return;
  const dz = st.z - camZ; if (dz < 1.3) return;
  const g = S.ctx, sc = Lt.F / dz, a = clamp(st.away / 0.8, 0, 1);
  const x = Lt.cx + STAR_LAT * sc + a * S.W * 0.3, y = yAt(dz) - STAR_H * sc - a * S.H * 0.45 + Math.sin(S.gtime * 4) * 0.05 * sc;
  const r = STAR_R * sc * (1 + Math.sin(S.gtime * 9) * 0.06) * (1 + a * 0.3);
  g.save(); g.globalAlpha = 1 - a;
  const gl = g.createRadialGradient(x, y, r * 0.2, x, y, r * 2.6);
  gl.addColorStop(0, 'rgba(255,240,150,0.85)'); gl.addColorStop(1, 'rgba(255,209,102,0)');
  g.fillStyle = gl; g.beginPath(); g.arc(x, y, r * 2.6, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = Math.max(1.5, r * 0.08); g.lineCap = 'round';
  for (let i = 0; i < 4; i++) {                    // rayons scintillants qui tournent
    const an = S.gtime * 2 + i * TAU / 4, l1 = r * 1.3, l2 = r * (1.9 + 0.3 * Math.sin(S.gtime * 11 + i));
    g.beginPath(); g.moveTo(x + Math.cos(an) * l1, y + Math.sin(an) * l1); g.lineTo(x + Math.cos(an) * l2, y + Math.sin(an) * l2); g.stroke();
  }
  drawStarShape(x, y, r, '#FFD23A', Math.sin(S.gtime * 3) * 0.2);
  g.fillStyle = 'rgba(255,255,255,0.8)'; g.beginPath(); g.arc(x - r * 0.25, y - r * 0.25, r * 0.16, 0, TAU); g.fill();
  g.restore();
}

// 🪰 La mouche : elle tourne autour du coureur, puis se pose sur sa tête (et s'envole au vrai retour)
function flyPos() {
  const f = fx().fly, s = Lt.s, hx = Lt.cx + 0.1 * s, hy = Lt.yFeet - 1.62 * s;   // posée sur ses cheveux
  if (f.away > 0) { const a = f.away / 0.6; return { x: hx + a * S.W * 0.4, y: hy - a * S.H * 0.35, a: 1 - clamp(a, 0, 1) }; }
  if (f.t < 0.8) {
    const k = f.t / 0.8, an = f.t * 10, rr = s * lerp(0.9, 0.25, k);
    const cx = lerp(Lt.cx, hx, k), cy = lerp(Lt.yFeet - 1.2 * s, hy, k);
    return { x: cx + Math.cos(an) * rr, y: cy + Math.sin(an) * rr * 0.55, a: 1 };
  }
  return { x: hx + Math.sin(S.gtime * 7) * s * 0.03, y: hy + Math.cos(S.gtime * 5) * s * 0.015, a: 1 };   // posée : elle se promène
}
function drawFly() {
  const f = fx() && fx().fly; if (!f) return;
  const g = S.ctx, p = flyPos(), b = Math.max(4, Lt.s * 0.09), flap = 0.35 + 0.65 * Math.abs(Math.sin(S.gtime * 70));
  if (p.a <= 0) return;
  g.save(); g.globalAlpha = p.a;
  g.fillStyle = 'rgba(220,240,255,0.75)'; g.strokeStyle = 'rgba(43,45,66,0.6)'; g.lineWidth = 1;
  for (const sd of [-1, 1]) { g.beginPath(); g.ellipse(p.x + sd * b * 0.7, p.y - b * 0.8, b * 0.9, b * 1.3 * flap, sd * 0.5, 0, TAU); g.fill(); g.stroke(); }
  g.fillStyle = '#1B1B24'; g.beginPath(); g.ellipse(p.x, p.y, b * 0.8, b * 1.15, 0, 0, TAU); g.fill();
  g.fillStyle = '#C0392B'; for (const sd of [-1, 1]) { g.beginPath(); g.arc(p.x + sd * b * 0.45, p.y - b * 0.9, b * 0.38, 0, TAU); g.fill(); }
  g.restore();
}

// 😜 Bulle de moquerie, accrochée au soleil (à droite, ou dessous si l'écran est étroit)
function drawTaunt() {
  const tb = fx() && fx().taunt; if (!tb) return;
  const g = S.ctx, c = sunC(), fs = clamp(Lt.U * 0.042, 13, 19), maxW = Math.min(S.W * 0.46, 250);
  const a = clamp(tb.t / 0.12, 0, 1) * clamp((tb.life - tb.t) / 0.2, 0, 1);
  if (a <= 0) return;
  g.font = `900 ${fs}px ${S.FONT}`;
  const words = tb.text.split(' '), lines = []; let cur = '';
  for (const wd of words) { const t = cur ? cur + ' ' + wd : wd; if (g.measureText(t).width > maxW && cur) { lines.push(cur); cur = wd; } else cur = t; }
  lines.push(cur);
  const w = Math.max(...lines.map(l => g.measureText(l).width)) + fs * 1.2, h = lines.length * fs * 1.25 + fs * 0.8;
  let bx = c.x + c.R * 1.3, by = c.y - c.R * 0.9 - h / 2, tail = 'left';
  if (bx + w > S.W - 8 - safe.r) { bx = clamp(c.x + c.R * 0.5 - w / 2, 8, S.W - w - 8); by = c.y + c.R * 1.08; tail = 'up'; }   // écran étroit : sous le soleil
  g.save(); g.globalAlpha = a; g.translate(bx + w / 2, by + h / 2); g.scale(0.85 + 0.15 * a, 0.85 + 0.15 * a); g.translate(-(bx + w / 2), -(by + h / 2));
  g.fillStyle = '#FFFFFF'; g.strokeStyle = INK; g.lineWidth = 3;
  rrp(g, bx, by, w, h, 14); g.fill(); g.stroke();
  g.beginPath();
  if (tail === 'left') { g.moveTo(bx + 2, by + h * 0.55); g.lineTo(bx - fs * 0.9, by + h * 0.75); g.lineTo(bx + 2, by + h * 0.8); }
  else { g.moveTo(c.x - fs * 0.4, by + 2); g.lineTo(c.x, by - fs * 0.8); g.lineTo(c.x + fs * 0.4, by + 2); }
  g.closePath(); g.fill(); g.stroke();
  g.fillRect(tail === 'left' ? bx : c.x - fs * 0.4 + 2, tail === 'left' ? by + h * 0.55 + 2 : by, tail === 'left' ? 4 : fs * 0.8 - 4, tail === 'left' ? h * 0.25 - 4 : 4);
  g.fillStyle = INK; g.textAlign = 'center'; g.textBaseline = 'middle';
  lines.forEach((l, i) => g.fillText(l, bx + w / 2, by + fs * 0.4 + fs * 1.25 * (i + 0.5) + 1));
  g.restore();
}

// 👀 Faux dos : un GROS œil dépasse sur le côté du soleil, avec un cercle rouge qui clignote (lisible sur téléphone)
function drawPeekEye() {
  const w = S.watcher;
  const on = w.state === 'peek' || (w.state === 'return' && w.retTo > 0 && w.t > 0.12);
  if (!on) return;
  const g = S.ctx, c = sunC(), er = c.R * EYE_K, x = c.x + c.R * 0.84, y = c.y - c.R * 0.12;
  const pulse = 0.5 + 0.5 * Math.sin(S.gtime * 9);
  g.strokeStyle = `rgba(255,77,109,${0.35 + 0.5 * pulse})`; g.lineWidth = Math.max(3, er * 0.22);
  g.beginPath(); g.arc(x, y, er * (1.45 + 0.12 * pulse), 0, TAU); g.stroke();
  g.fillStyle = '#FFFFFF'; g.strokeStyle = INK; g.lineWidth = Math.max(2.5, er * 0.16);
  g.beginPath(); g.arc(x, y, er, 0, TAU); g.fill(); g.stroke();
  g.fillStyle = INK; g.beginPath(); g.arc(x - er * 0.32, y + er * 0.28, er * 0.46, 0, TAU); g.fill();   // il regarde vers toi
  g.fillStyle = '#FFFFFF'; g.beginPath(); g.arc(x - er * 0.45, y + er * 0.12, er * 0.14, 0, TAU); g.fill();
  g.save(); g.beginPath(); g.arc(x, y, er, 0, TAU); g.clip();                         // paupière soupçonneuse
  g.fillStyle = watcherColors().d2; g.fillRect(x - er, y - er, er * 2, er * 0.75);
  g.restore();
  g.strokeStyle = INK; g.lineWidth = Math.max(2.5, er * 0.16);
  g.beginPath(); g.moveTo(x - er * 0.98, y - er * 0.25); g.lineTo(x + er * 0.98, y - er * 0.25); g.stroke();
}

// 🤧 Pendant l'« ATCHOUM ! », il plisse les yeux très fort : « > < » (mais il te fait toujours face)
function drawSneezeEyes() {
  const w = S.watcher; if (!w.shut || w.turnP < 0.9) return;
  const g = S.ctx, c = sunC(), R = c.R;
  g.strokeStyle = INK; g.lineWidth = Math.max(2.5, R * 0.07); g.lineCap = 'round'; g.lineJoin = 'round';
  for (const sd of [-1, 1]) {
    const x = c.x + sd * R * 0.36, y = c.y - R * 0.14, d = R * 0.12;
    g.beginPath(); g.moveTo(x - sd * d, y - d * 0.8); g.lineTo(x + sd * d * 0.6, y); g.lineTo(x - sd * d, y + d * 0.8); g.stroke();
  }
}

// 🔔 Le vrai retour : un anneau vert s'élargit autour du soleil (avec le « ding » et les rayons qui tournent)
function drawTrueEnd() {
  const h = fx() && fx().halo; if (!h) return;
  const k = clamp(h / HALO_LIFE, 0, 1), c = sunC(), g = S.ctx;
  g.strokeStyle = `rgba(6,214,160,${(1 - k).toFixed(3)})`; g.lineWidth = Math.max(2, c.R * 0.16 * (1 - k));
  g.beginPath(); g.arc(c.x, c.y, c.R * (1.2 + 1.3 * easeIn(k)), 0, TAU); g.stroke();
}

// 🥸 Lunettes-nez-moustache du Soleil Farceur, posées sur son visage (projection sur la sphère, comme drawFace)
function drawGroucho(cx, cy, R, turnP, alpha) {
  if (turnP < 0.3 || alpha <= 0) return;
  const g = S.ctx, phi = Math.PI * (1 - turnP);
  const P = (lon, lat) => ({ x: cx + R * Math.sin(phi + lon) * Math.cos(lat), y: cy + R * Math.sin(lat), k: Math.cos(phi + lon) });
  g.save(); g.globalAlpha = alpha; g.lineCap = 'round';
  for (const sd of [-1, 1]) {                      // sourcils broussailleux
    const p = P(sd * 0.38, -0.42); if (p.k <= 0.05) continue;
    g.strokeStyle = '#1B1B24'; g.lineWidth = R * 0.09;
    g.beginPath(); g.ellipse(p.x, p.y + R * 0.06, R * 0.17 * p.k, R * 0.07, 0, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
  }
  for (const sd of [-1, 1]) {                      // grosses lunettes rondes
    const p = P(sd * 0.38, -0.14); if (p.k <= 0.05) continue;
    g.fillStyle = 'rgba(200,230,255,0.25)'; g.strokeStyle = '#1B1B24'; g.lineWidth = R * 0.07;
    g.beginPath(); g.ellipse(p.x, p.y, R * 0.21 * p.k, R * 0.21, 0, 0, TAU); g.fill(); g.stroke();
  }
  const a = P(-0.17, -0.14), b = P(0.17, -0.14);
  if (a.k > 0.05 && b.k > 0.05) { g.strokeStyle = '#1B1B24'; g.lineWidth = R * 0.06; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); }
  const n = P(0, 0.06);                            // le gros nez rose
  if (n.k > 0.05) {
    g.fillStyle = '#FF8FA3'; g.strokeStyle = INK; g.lineWidth = Math.max(2, R * 0.04);
    g.beginPath(); g.ellipse(n.x, n.y, R * 0.15 * n.k, R * 0.18, 0, 0, TAU); g.fill(); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.6)'; g.beginPath(); g.ellipse(n.x - R * 0.04 * n.k, n.y - R * 0.07, R * 0.04 * n.k, R * 0.05, 0, 0, TAU); g.fill();
  }
  const mo = P(0, 0.27);                           // la moustache
  if (mo.k > 0.05) {
    g.fillStyle = '#1B1B24';
    for (const sd of [-1, 1]) { g.beginPath(); g.ellipse(mo.x + sd * R * 0.16 * mo.k, mo.y, R * 0.18 * mo.k, R * 0.075, sd * -0.25, 0, TAU); g.fill(); }
  }
  g.restore();
}
function drawFarceurFace() {                         // sur le soleil pendant tout le niveau du boss
  const w = S.watcher; if (w.bossFace !== 'farceur') return;
  const c = sunC();
  drawGroucho(c.x, c.y, c.R, w.turnP, 1);         // comme le visage (drawFace) : il suit le demi-tour
}
function drawGrouchoDrop(k) {                        // l'intro du boss : la farce tombe du ciel sur son visage
  const c = sunC(), y = lerp(-c.R * 1.5, c.y, easeIn(clamp(k, 0, 1)));
  drawGroucho(c.x, y, c.R, 1, 1);
}

// 🟤 Les flaques de boue d'un niveau (placées à la main dans les données : champ « mud »)
function drawLevelMud(camZ) {
  const lv = S.Levels.m && S.Levels.m.level; if (!lv || !lv.mud.length) return;
  const nearDz = CAM_H * Lt.F / (S.H + 40 - Lt.hy);
  for (let i = lv.mud.length - 1; i >= 0; i--) {
    const [z0, z1] = lv.mud[i], dzN = Math.max(z0 - camZ, nearDz), dzF = z1 - camZ;
    if (dzF <= nearDz + 0.2 || dzN > 120) continue;
    drawPuddle({ type: 'mud' }, 900 + i, dzN, dzF, yAt(dzN), yAt(dzF));
  }
}

// Décor et couleurs selon le monde du niveau
const worldOf = () => (S.Levels.def && S.Levels.def.world) || 1;
function drawLevelDecor(camZ) { if (worldOf() === 2) S.drawPark(camZ); else S.drawPlayground(camZ); }
function tintLevel() { if (worldOf() === 2) S.tintPark(); else S.tintPlayground(); }

Object.assign(S, { drawTemptStar, drawFly, drawTaunt, drawPeekEye, drawTrueEnd, drawSneezeEyes, drawGroucho, drawFarceurFace, drawGrouchoDrop,
  drawLevelMud, drawLevelDecor, tintLevel, flyPos });
})(window.Soleil);
