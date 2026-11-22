/* js/render/effects.js — Particules, rayon qui grille, vignette */
(function (S) {
'use strict';
const { INK, TAU, clamp, css, lerp, pal, Lt, safe } = S;   // déjà chargés

/* ---------- 19. Particules ---------- */
function addP(p) {                            // qualité basse (téléphone lent) : moins de particules (js/render/quality.js)
  const Q = S.Q;
  if (S.particles.length < Q.pmax && (Q.particles >= 1 || Math.random() < Q.particles)) S.particles.push(p);
}
function dust(n, spread) {
  for (let i = 0; i < n; i++) {
    const sd = Math.random() < 0.5 ? -1 : 1;
    addP({ type: 'dust', x: Lt.cx + sd * Lt.s * (0.08 + Math.random() * 0.15), y: Lt.yFeet - Lt.s * 0.02,
           vx: sd * Lt.s * (0.3 + Math.random() * spread), vy: Lt.s * (0.4 + Math.random() * 0.8), g: 0, drag: 3,
           size: Lt.s * (0.05 + Math.random() * 0.07), grow: Lt.s * 0.25, life: 0.45, max: 0.45, col: pal.path2 });
  }
}
function splash(n) {
  for (let i = 0; i < n; i++) {
    const sd = Math.random() < 0.5 ? -1 : 1;
    addP({ type: 'spark', x: Lt.cx + sd * Lt.s * 0.12, y: Lt.yFeet - Lt.s * 0.05, vx: sd * Lt.s * (0.4 + Math.random() * 1.2),
           vy: -Lt.s * (0.8 + Math.random() * 1.4), g: Lt.s * 7, drag: 1, size: Lt.s * (0.03 + Math.random() * 0.04), life: 0.5, max: 0.5, col: '#6B4423' });
  }
}
function iceSpark() {
  addP({ type: 'spark', x: Lt.cx + (Math.random() - 0.5) * Lt.s * 0.4, y: Lt.yFeet - Lt.s * 0.03, vx: (Math.random() - 0.5) * Lt.s * 1.5,
         vy: Lt.s * (0.2 + Math.random() * 0.5), g: 0, drag: 2, size: Lt.s * (0.02 + Math.random() * 0.03), life: 0.4, max: 0.4, col: '#FFFFFF' });
}
function speedLine() {                        // traits de vitesse quand on va très vite
  const sd = Math.random() < 0.5 ? -1 : 1;
  const x = Lt.cx + sd * S.W * (0.25 + Math.random() * 0.3), y = Lt.hy + (S.H - Lt.hy) * (0.15 + Math.random() * 0.7);
  const dx = x - Lt.cx, dy = y - Lt.hy, d = Math.hypot(dx, dy) || 1, sp = Lt.s * S.runner.v * 1.2;
  addP({ type: 'streak', x, y, vx: dx / d * sp, vy: dy / d * sp, g: 0, size: 1, life: 0.25, max: 0.25 });
}
function sweat() {
  const sd = Math.random() < 0.5 ? -1 : 1;
  addP({ type: 'sweat', x: Lt.cx + sd * Lt.s * 0.2, y: Lt.yFeet - Lt.s * 1.32, vx: sd * Lt.s * (0.5 + Math.random() * 0.4),
         vy: -Lt.s * (0.6 + Math.random() * 0.5), g: Lt.s * 6, size: Lt.s * 0.05, life: 0.6, max: 0.6 });
}
function smoke(n, big) { smokeAt(Lt.cx, Lt.yFeet - Lt.s * 0.9, Lt.s, n, big); }
function smokeAt(x, y, s, n, big) {
  for (let i = 0; i < n; i++) {
    addP({ type: 'smoke', x: x + (Math.random() - 0.5) * s * 0.6, y: y + (Math.random() - 0.5) * s * 0.6,
           vx: (Math.random() - 0.5) * s * 0.6, vy: -s * (0.5 + Math.random() * (big ? 1.4 : 0.6)), g: 0, drag: 1.2,
           size: s * (0.12 + Math.random() * 0.1), grow: s * 0.35, life: 1.3, max: 1.3 });
  }
}
function sparks(n, x, y, col) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * TAU, sp = Lt.s * (1 + Math.random() * 2);
    addP({ type: 'spark', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: Lt.s * 2, drag: 2.5,
           size: Lt.s * (0.04 + Math.random() * 0.04), life: 0.5, max: 0.5, col });
  }
}
function confetti(n) {
  const cols = ['#FFD166', '#EF476F', '#06D6A0', '#118AB2', '#FFFFFF'];
  for (let i = 0; i < n; i++) {
    addP({ type: 'conf', x: Math.random() * S.W, y: -10 - Math.random() * S.H * 0.3, vx: (Math.random() - 0.5) * 80,
           vy: 80 + Math.random() * 160, g: 120, drag: 0.8, size: 5 + Math.random() * 6, rot: Math.random() * TAU,
           vr: (Math.random() - 0.5) * 12, life: 2.6, max: 2.6, col: cols[i % cols.length] });
  }
}
function starPop(n) { popup(`+${n}`, S.W - 104 * S.uiZoom - safe.r - S.pillR, safe.t + 84 * S.uiZoom, '#FFD166', Math.min(Lt.U * 0.05, 24), 0.85); }
function popup(text, x, y, col, size, life = 1.1) {
  addP({ type: 'text', text, x, y, vx: 0, vy: -Lt.s * 0.5, g: 0, size, life, max: life, col });
}
function updateParticles(dt) {
  for (let i = S.particles.length - 1; i >= 0; i--) {
    const p = S.particles[i];
    p.life -= dt;
    if (p.life <= 0) { S.particles.splice(i, 1); continue; }
    p.vy += (p.g || 0) * dt;
    if (p.drag) { const d = Math.exp(-p.drag * dt); p.vx *= d; p.vy *= d; }
    p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.grow) p.size += p.grow * dt;
    if (p.vr) p.rot += p.vr * dt;
  }
}

function drawBeam() {                                // le regard qui grille
  if (!(S.state === 'caught' || S.state === 'over' || S.lvCaught) || S.caughtT > 0.9) return;
  const grow = clamp(S.caughtT / 0.3, 0, 1), fade = 1 - clamp((S.caughtT - 0.45) / 0.45, 0, 1);
  const R = Lt.R, cy = Lt.sunY + S.watcher.offY + S.sunSink, tx = Lt.cx, ty = Lt.yFeet - Lt.s * 0.75;
  const moon = S.watcher.type === 'moon';
  S.ctx.lineCap = 'round';
  for (const sd of [-1, 1]) {
    const ex = Lt.cx + sd * R * 0.36, ey = cy - R * 0.14, ix = lerp(ex, tx, grow), iy = lerp(ey, ty, grow);
    S.ctx.strokeStyle = moon ? `rgba(150,180,255,${0.5 * fade})` : `rgba(255,120,60,${0.45 * fade})`; S.ctx.lineWidth = Lt.s * 0.35;
    S.ctx.beginPath(); S.ctx.moveTo(ex, ey); S.ctx.lineTo(ix, iy); S.ctx.stroke();
    S.ctx.strokeStyle = `rgba(255,240,170,${0.9 * fade})`; S.ctx.lineWidth = Lt.s * 0.12;
    S.ctx.beginPath(); S.ctx.moveTo(ex, ey); S.ctx.lineTo(ix, iy); S.ctx.stroke();
  }
}

function drawParticles(textPass) {
  for (const p of S.particles) {
    if ((p.type === 'text') !== textPass) continue;
    const a = clamp(p.life / p.max, 0, 1);
    switch (p.type) {
      case 'dust': S.ctx.fillStyle = css(p.col, a * 0.7); S.ctx.beginPath(); S.ctx.arc(p.x, p.y, p.size, 0, TAU); S.ctx.fill(); break;
      case 'smoke': S.ctx.fillStyle = `rgba(60,58,64,${(a * 0.5).toFixed(3)})`; S.ctx.beginPath(); S.ctx.arc(p.x, p.y, p.size, 0, TAU); S.ctx.fill(); break;
      case 'streak':
        S.ctx.strokeStyle = `rgba(255,255,255,${(a * 0.5).toFixed(3)})`; S.ctx.lineWidth = 2; S.ctx.lineCap = 'round';
        S.ctx.beginPath(); S.ctx.moveTo(p.x, p.y); S.ctx.lineTo(p.x - p.vx * 0.06, p.y - p.vy * 0.06); S.ctx.stroke(); break;
      case 'sweat':
        S.ctx.fillStyle = `rgba(130,205,255,${a.toFixed(3)})`; S.ctx.strokeStyle = INK; S.ctx.lineWidth = 1.5;
        S.ctx.beginPath(); S.ctx.ellipse(p.x, p.y, p.size * 0.75, p.size, 0, 0, TAU); S.ctx.fill(); S.ctx.stroke(); break;
      case 'spark': S.ctx.fillStyle = css(p.col || '#FFF6B0', a); S.ctx.beginPath(); S.ctx.arc(p.x, p.y, p.size, 0, TAU); S.ctx.fill(); break;
      case 'conf':
        S.ctx.save(); S.ctx.translate(p.x, p.y); S.ctx.rotate(p.rot); S.ctx.globalAlpha = Math.min(1, a * 2);
        S.ctx.fillStyle = p.col; S.ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2); S.ctx.restore(); break;
      case 'text': {
        const age = p.max - p.life, sc = 1 + 0.6 * Math.exp(-age * 12);
        S.ctx.save(); S.ctx.translate(p.x, p.y); S.ctx.scale(sc, sc);
        S.otextC(p.text, p.size, p.col, Math.min(1, a * 2.5)); S.ctx.restore(); break;
      }
    }
  }
}

function drawVignette() {
  if (S.lookAmt > 0.01) {                              // bords rouges quand il regarde
    const pulse = 0.85 + 0.15 * Math.sin(S.gtime * 9);
    const g = S.ctx.createRadialGradient(S.W / 2, S.H * 0.55, Math.min(S.W, S.H) * 0.3, S.W / 2, S.H * 0.55, Math.hypot(S.W, S.H) * 0.6);
    g.addColorStop(0, 'rgba(255,40,90,0)');
    g.addColorStop(1, `rgba(255,40,90,${(0.34 * S.lookAmt * pulse).toFixed(3)})`);
    S.ctx.fillStyle = g; S.ctx.fillRect(-40, -40, S.W + 80, S.H + 80);
  }
  if (S.flash > 0.01) { S.ctx.fillStyle = `rgba(255,235,190,${(S.flash * 0.7).toFixed(3)})`; S.ctx.fillRect(-40, -40, S.W + 80, S.H + 80); }
}

Object.assign(S, { addP, dust, splash, iceSpark, speedLine, sweat, smoke, smokeAt, sparks, confetti, starPop,
  popup, updateParticles, drawBeam, drawParticles, drawVignette });
})(window.Soleil);
