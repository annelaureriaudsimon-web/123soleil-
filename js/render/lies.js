/* js/render/lies.js — v2.5 : les faux signaux, à l'écran.
   ✈️ L'avion menteur : il traverse le ciel juste au-dessus des yeux du soleil, avec une banderole
      (« SOLEIL ! » pendant le chant, « ALLEZ-Y ! » pendant son regard). Ce n'est jamais le soleil qui parle.
   💧 Le reflet dans l'eau : quand un nuage cache le soleil, son reflet (à l'envers, comme dans l'eau) montre tout :
      son visage ou son dos, le demi-tour, l'œil du faux dos et l'anneau vert du « ding ».
   Rien ne décide ici : le moteur (game/match.js) dit quand ; modes/levels.js lance l'avion (S.startPlane). */
(function (S) {
'use strict';
const { INK, TAU, UNLOCK, clamp, lerp, Lt, drawWatcher } = S;

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
// S.waterAt : un décor qui a sa propre eau à l'horizon (la mer, monde 3) n'a pas besoin de la flaque.
function drawReflection() {
  const a = clamp(S.cloudK * 1.4, 0, 1);
  if (a <= 0.01 || !reflectOn()) return;
  const g = S.ctx, R = Lt.R, cx = Lt.cx, cy = Lt.hy + R * REF.dy, rx = R * REF.rx, ry = R * REF.ry;
  const w = S.watcher, sx = Lt.cx, sy = Lt.sunY + w.offY + S.sunSink;
  g.save(); g.globalAlpha *= a;
  g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, TAU);
  if (!S.waterAt) {                               // la flaque (la mer du monde 3 est déjà là)
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

Object.assign(S, { PLANE_DUR, startPlane, updatePlane, drawPlane, drawReflection, reflectOn });
})(window.Soleil);
