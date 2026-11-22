/* js/render/lies.js — v2.5 : les faux signaux, à l'écran.
   ✈️ L'avion menteur : il traverse le ciel juste au-dessus des yeux du soleil, avec une banderole
      (« SOLEIL ! » pendant le chant, « ALLEZ-Y ! » pendant son regard). Ce n'est jamais le soleil qui parle.
   💧 Le reflet dans l'eau : quand un nuage cache le soleil, son reflet (à l'envers, comme dans l'eau) montre tout :
      son visage ou son dos, le demi-tour, l'œil du faux dos et l'anneau vert du « ding » (une flaque ; à la plage,
      le sable mouillé au bord de la mer, où il brille tout le temps).
   📣 La fausse alerte : un rival crie « IL REGARDE PAS ! VAS-Y ! » (bulle de cri, jamais sur le soleil).
   Rien ne décide ici : le moteur (game/match.js) dit quand ; modes/levels.js lance l'avion (S.startPlane). */
(function (S) {
'use strict';
const { INK, TAU, UNLOCK, L, clamp, lerp, Lt, drawWatcher } = S;

// ---------- Réglages ----------
const PLANE_DUR = 2.8;         // durée de la traversée de l'écran (s) : plus lente au milieu, le temps de lire
const PLANE_Y = 0.8;           // hauteur de vol : au-dessus du centre du soleil (× son rayon) — ne cache jamais ses yeux
// Le reflet : flaque centrée sous l'horizon (dy), demi-largeur et demi-hauteur (rx, ry), le tout × le rayon du soleil ;
// le soleil y est un peu plus petit (k) et écrasé par l'eau (sq). Il apparaît avec le nuage.
const REF = { dy: 0.62, rx: 1.3, ry: 0.56, k: 0.9, sq: 0.55 };

// ---------- ✈️ L'avion menteur ----------
let planeN = 0;
function startPlane(kind, word) {               // kind : 'stop' (« SOLEIL ! » pendant le chant) ou 'go' (« ALLEZ-Y ! »)
  planeN++;
  S.plane = { kind, word, t: 0, dur: PLANE_DUR, dir: planeN % 2 ? -1 : 1 };   // une fois de droite à gauche, une fois l'inverse
  S.Sound.plane();
}
function updatePlane(dt) { if (S.plane && (S.plane.t += dt) > S.plane.dur) S.plane = null; }

function drawPlane() {
  const p = S.plane; if (!p) return;
  const g = S.ctx, R = Lt.R, u = clamp(p.t / p.dur, 0, 1);
  const k = u + 0.35 * Math.sin(TAU * u) / TAU;  // il ralentit au milieu de l'écran
  const fs = clamp(Lt.U * 0.05, 15, 30);         // taille du mot sur la banderole
  g.font = `900 ${fs}px ${S.FONT}`;
  const tw = g.measureText(p.word).width, bw = tw + fs * 1.5, bh = fs * 1.65;
  const pl = fs * 2.8, rope = fs * 1.1, total = pl + rope + bw;
  const y = Lt.sunY + S.watcher.offY + S.sunSink - R * PLANE_Y + Math.sin(S.gtime * 2.3) * fs * 0.12;
  const d = p.dir;                                // -1 : vole vers la gauche
  const nose = d < 0 ? lerp(S.W + 10, -total - 10, k) : lerp(-10, S.W + total + 10, k);
  const tail = nose - d * pl;                     // l'avion, puis la corde, puis la banderole derrière lui
  // la corde
  g.strokeStyle = INK; g.lineWidth = Math.max(1.5, fs * 0.07);
  const bx0 = tail - d * rope;                    // bord avant de la banderole
  g.beginPath(); g.moveTo(tail, y); g.lineTo(bx0, y - bh * 0.32); g.moveTo(tail, y); g.lineTo(bx0, y + bh * 0.32); g.stroke();
  // la banderole : un tissu qui ondule (bords en vagues)
  const x0 = Math.min(bx0, bx0 - d * bw), x1 = Math.max(bx0, bx0 - d * bw);
  const wave = (x, s) => Math.sin(x * 0.045 + S.gtime * 9 * s) * bh * 0.07 * clamp(Math.abs(x - bx0) / (bw * 0.3), 0, 1);
  g.beginPath();
  for (let x = x0; x <= x1; x += 6) g.lineTo(x, y - bh / 2 + wave(x, 1));
  g.lineTo(x1, y - bh / 2 + wave(x1, 1));
  for (let x = x1; x >= x0; x -= 6) g.lineTo(x, y + bh / 2 + wave(x, 1));
  g.lineTo(x0, y + bh / 2 + wave(x0, 1));
  g.closePath();
  g.fillStyle = '#FFF8E7'; g.fill(); g.lineWidth = Math.max(2, fs * 0.11); g.lineJoin = 'round'; g.stroke();
  g.fillStyle = INK; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(p.word, (x0 + x1) / 2, y + wave((x0 + x1) / 2, 1) + fs * 0.05);
  drawAirplane(nose, y, pl, d, fs);
}
function drawAirplane(nose, y, pl, d, fs) {     // un petit avion à hélice, de profil
  const g = S.ctx, h = pl * 0.36, lw = Math.max(2, fs * 0.1);
  g.save(); g.translate(nose, y); g.scale(d, 1);  // dessiné vers la droite, retourné s'il va à gauche
  g.lineJoin = 'round'; g.strokeStyle = INK; g.lineWidth = lw;
  g.fillStyle = '#E63946';                       // dérive (queue)
  g.beginPath(); g.moveTo(-pl * 0.82, -h * 0.1); g.lineTo(-pl, -h * 1.05); g.lineTo(-pl * 0.86, -h * 1.05); g.lineTo(-pl * 0.62, -h * 0.2); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#FFFFFF';                       // fuselage
  g.beginPath(); g.ellipse(-pl * 0.48, 0, pl * 0.5, h * 0.5, 0, 0, TAU); g.fill(); g.stroke();
  g.fillStyle = '#E63946';                       // bande et nez
  g.beginPath(); g.ellipse(-pl * 0.08, 0, pl * 0.12, h * 0.44, 0, 0, TAU); g.fill();
  g.fillStyle = '#9BD7FF';                       // hublot
  g.beginPath(); g.ellipse(-pl * 0.36, -h * 0.12, pl * 0.1, h * 0.2, 0, 0, TAU); g.fill(); g.stroke();
  g.fillStyle = '#E63946';                       // aile
  g.beginPath(); g.ellipse(-pl * 0.5, h * 0.18, pl * 0.24, h * 0.16, -0.1, 0, TAU); g.fill(); g.stroke();
  const sp = Math.abs(Math.sin(S.gtime * 40));  // hélice qui tourne
  g.fillStyle = 'rgba(43,45,66,0.55)';
  g.beginPath(); g.ellipse(pl * 0.04, 0, pl * 0.035, h * (0.25 + 0.6 * sp), 0, 0, TAU); g.fill();
  g.restore();
}

// ---------- 💧 Le reflet dans l'eau ----------
// Niveaux : à chaque nuage. Course infinie : à partir de UNLOCK.reflet (avant, le nuage ne laisse que la voix).
const reflectOn = () => S.state === 'level' || (UNLOCK.reflet != null && S.mode !== 'duo' && S.runner.z >= UNLOCK.reflet);
// À la plage (monde 3), le sable mouillé au bord de la mer reflète le soleil tout le temps (un peu) : on apprend
// où regarder avant que le nuage n'arrive (pas en qualité basse : on ne le dessine qu'avec le nuage).
const beach = () => S.state === 'level' && S.Levels.def && S.Levels.def.world === 3;
function drawReflection() {
  const sea = beach(), a = Math.max(clamp(S.cloudK * 1.4, 0, 1), sea && S.Q.level < 2 ? 0.32 : 0);
  if (a <= 0.01 || !reflectOn()) return;
  const g = S.ctx, R = Lt.R, cx = Lt.cx, cy = Lt.hy + R * REF.dy, rx = R * REF.rx, ry = R * REF.ry;
  const w = S.watcher, sx = Lt.cx, sy = Lt.sunY + w.offY + S.sunSink;
  g.save(); g.globalAlpha *= a;
  g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, TAU);
  if (sea) {                                      // le sable mouillé qui brille (sans contour : c'est la plage)
    const wg = g.createRadialGradient(cx, cy, ry * 0.3, cx, cy, rx);
    wg.addColorStop(0, 'rgba(120,185,230,0.85)'); wg.addColorStop(1, 'rgba(120,185,230,0.15)');
    g.fillStyle = wg; g.fill();
  } else {                                        // ailleurs : une flaque
    const wg = g.createLinearGradient(0, cy - ry, 0, cy + ry);
    wg.addColorStop(0, '#5BA8E0'); wg.addColorStop(1, '#2E6CB0');
    g.fillStyle = wg; g.fill();
    g.lineWidth = Math.max(2.5, R * 0.06); g.strokeStyle = INK; g.stroke();
  }
  g.clip();
  g.save();                                       // le soleil, à l'envers et un peu écrasé, comme dans l'eau
  const wob = 1 + (S.Q.level < 2 ? 0.025 * Math.sin(S.gtime * 3.1) : 0);   // l'eau bouge un peu (qualité haute et moyenne)
  g.translate(cx, cy - ry * 0.08); g.scale(REF.k * wob, -REF.k * REF.sq); g.translate(-sx, -sy);
  drawWatcher();
  if (S.state === 'level') S.drawSunMarks();      // l'œil du faux dos, l'anneau du « ding »…
  g.restore();
  g.fillStyle = 'rgba(46,108,176,0.18)'; g.fillRect(cx - rx, cy - ry, rx * 2, ry * 2);   // un voile d'eau
  g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineCap = 'round'; g.lineWidth = Math.max(1.5, R * 0.035);
  const n = S.Q.level === 0 ? 6 : 3;              // vaguelettes qui glissent
  for (let i = 0; i < n; i++) {
    const yy = cy - ry * 0.7 + (i + 0.5) * ry * 1.4 / n, xx = cx + Math.sin(S.gtime * 1.7 + i * 2.1) * rx * 0.45, l = rx * (0.18 + 0.1 * ((i * 7) % 3));
    g.beginPath(); g.moveTo(xx - l, yy); g.quadraticCurveTo(xx, yy - ry * 0.06, xx + l, yy); g.stroke();
  }
  g.restore();
}

// ---------- 📣 La fausse alerte ----------
// Une bulle de cri en pointes, accrochée au rival qui crie, avec son prénom. Elle reste SOUS l'horizon :
// le soleil (le seul qui compte) n'est jamais caché.
function drawAlarm() {                             // rend le bas de la bulle (pour placer une indication dessous), ou 0
  const al = S.Levels.fx && S.Levels.fx.alarm; if (!al) return 0;
  const a = clamp(al.t / 0.08, 0, 1) * clamp((al.life - al.t) / 0.25, 0, 1); if (a <= 0) return 0;
  const g = S.ctx, rv = al.r, p = S.rivalScreen(rv), fs = clamp(Lt.U * 0.046, 14, 26), text = L.alarmShout;
  g.font = `900 ${fs}px ${S.FONT}`;
  const words = text.split(' '), lines = [], maxW = Math.min(S.W * 0.62, 340);   // une ou deux lignes
  let cur = '';
  for (const wd of words) { const t = cur ? cur + ' ' + wd : wd; if (g.measureText(t).width > maxW && cur) { lines.push(cur); cur = wd; } else cur = t; }
  lines.push(cur);
  const tw = Math.max(...lines.map(l => g.measureText(l).width)), w = tw + fs * 2.2, h = lines.length * fs * 1.15 + fs * 1.6;
  const ax = p.vis ? p.x : Lt.cx, ay = p.vis ? p.y - 1.9 * p.sc : S.H * 0.8;   // la tête du rival
  const top = Lt.hy + fs * 0.6;                                                   // jamais au-dessus de l'horizon
  let cy = ay - h / 2 - fs * 0.9;
  if (cy - h / 2 < top) cy = top + h / 2;
  const cx = clamp(ax + (ax < Lt.cx ? -1 : 1) * w * 0.15, w / 2 + 8, S.W - w / 2 - 8);
  const jit = (1 - clamp(al.t / 0.3, 0, 1)) * fs * 0.12 * Math.sin(S.gtime * 70);   // il crie : la bulle tremble au début
  const sc = 0.8 + 0.2 * clamp(al.t / 0.12, 0, 1);
  g.save(); g.globalAlpha *= a; g.translate(cx + jit, cy); g.scale(sc, sc);
  g.lineJoin = 'round'; g.strokeStyle = INK; g.lineWidth = Math.max(2.5, fs * 0.14);
  const tx = (ax - cx) / sc, ty = (ay - cy) / sc, ang = Math.atan2(ty, tx);   // la pointe vers le rival
  g.beginPath();
  const N = 18, rx = w / 2, ry = h / 2;
  for (let i = 0; i <= N * 2; i++) {
    const an = (i / (N * 2)) * TAU, k = i % 2 ? 1 : 1.13 + 0.05 * Math.sin(i * 7.3);
    let x = Math.cos(an) * rx * k, y = Math.sin(an) * ry * k;
    const d = Math.abs(Math.atan2(Math.sin(an - ang), Math.cos(an - ang)));
    if (d < 0.18 && Math.hypot(tx, ty) > ry * 1.2) { x = Math.cos(ang) * Math.min(Math.hypot(tx, ty) * 0.9, rx + fs * 1.6); y = Math.sin(ang) * Math.min(Math.hypot(tx, ty) * 0.9, ry + fs * 1.6); }
    if (i) g.lineTo(x, y); else g.moveTo(x, y);
  }
  g.closePath(); g.fillStyle = '#FFFFFF'; g.fill(); g.stroke();
  g.fillStyle = INK; g.textAlign = 'center'; g.textBaseline = 'middle';
  lines.forEach((l, i) => g.fillText(l, 0, (i - (lines.length - 1) / 2) * fs * 1.15 + fs * 0.05));
  const nfs = fs * 0.62;                                            // son prénom, sur une étiquette
  g.font = `900 ${nfs}px ${S.FONT}`;
  const lw = g.measureText(rv.name).width + nfs * 1.2, lx = -rx * 0.92, ly = -ry - nfs * 0.2;
  g.fillStyle = S.KIND_COL[rv.kind] || '#FFD166'; g.lineWidth = 2;
  S.rrp(g, lx, ly - nfs * 0.7, lw, nfs * 1.4, nfs * 0.7); g.fill(); g.stroke();
  g.fillStyle = INK; g.textAlign = 'left'; g.fillText(rv.name, lx + nfs * 0.6, ly + 1);
  g.restore();
  return cy + (h / 2) * 1.18 * sc;
}

Object.assign(S, { PLANE_DUR, startPlane, updatePlane, drawPlane, drawReflection, reflectOn, drawAlarm });
})(window.Soleil);
