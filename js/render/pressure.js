/* js/render/pressure.js — v2.5 : ce qui rend la prudence chère, à l'écran.
   - le coucher du soleil : la barre « jusqu'à la nuit » (☀️ → 🌙, avec les secondes), le soleil qui descend ;
   - les transats à l'arrivée (un de moins que d'enfants), avec le prénom de qui s'y est assis (v2.6 : des luges à la montagne) ;
   - la glace : une montagne de boules qui tangue au-dessus du coureur, qui fond (« PLOC ! »), et qui finit,
     à l'arrivée, en une montagne de glace qui grandit boule par boule.
   Rien ici ne change le jeu : tout vient du moteur (game/match.js : night, chairs, scoops). */
(function (S) {
'use strict';
const { FAR, FONT, INK, PATH_W, L, Lt, clamp, css, mix, pal, safe, otext, otextC, rrp, yAt, fit } = S;   // déjà chargés

S.sunSink = 0;                                     // de combien de pixels le soleil est descendu (coucher du soleil)
const TAU = Math.PI * 2;
const CONE_MAX = 6;           // au plus 6 boules dessinées sur le cornet (au-delà : « ×n » à côté) — la pile ne monte jamais jusqu'au soleil
// Les parfums : une couleur ET un motif (daltoniens : on les reconnaît sans la couleur)
const FLAVORS = [
  { c: '#FFF3D6', ink: '#E8C98A', pat: 'dots' },     // vanille, grains
  { c: '#FF8FB1', ink: '#C2185B', pat: 'seeds' },    // fraise, graines
  { c: '#8B5A3C', ink: '#4A2C1A', pat: 'chips' },    // chocolat, pépites
  { c: '#8FE3C0', ink: '#2E8B66', pat: 'stripes' },  // menthe, rayures
  { c: '#B79CFF', ink: '#5B3FB8', pat: 'swirl' },    // myrtille, tourbillon
  { c: '#FFD166', ink: '#C98A00', pat: 'dots' }      // mangue, grains
];
const flavor = i => FLAVORS[i % FLAVORS.length];

// Une boule de glace (x, y : centre ; r : rayon), avec son motif
function drawScoop(g, x, y, r, i, a = 1, drip = 0) {
  const f = flavor(i);
  g.save(); g.globalAlpha *= a;
  g.fillStyle = f.c; g.strokeStyle = INK; g.lineWidth = Math.max(1.5, r * 0.12);
  g.beginPath();
  g.arc(x, y, r, Math.PI * 1.0, Math.PI * 2.0);   // le dessus, bien rond
  // le bas, en vagues (la boule déborde), plus une goutte qui coule si elle fond
  const n = 5;
  for (let k = 0; k <= n; k++) {
    const px = x + r - (2 * r * k) / n, wob = (k % 2 ? 0.16 : 0.02) * r;
    g.lineTo(px, y + r * 0.35 + wob + (k === 2 ? drip * r * 0.9 : 0));
  }
  g.closePath(); g.fill(); g.stroke();
  // le motif
  g.fillStyle = f.ink; g.strokeStyle = f.ink; g.lineWidth = Math.max(1, r * 0.09);
  if (f.pat === 'dots' || f.pat === 'seeds' || f.pat === 'chips') {
    const pts = [[-0.45, -0.35], [0.1, -0.6], [0.5, -0.2], [-0.1, -0.05], [0.35, 0.15], [-0.5, 0.1]];
    for (const [u, v] of pts) {
      g.beginPath();
      if (f.pat === 'seeds') g.ellipse(x + u * r, y + v * r, r * 0.06, r * 0.11, u, 0, TAU);
      else if (f.pat === 'chips') g.rect(x + u * r - r * 0.07, y + v * r - r * 0.07, r * 0.15, r * 0.13);
      else g.arc(x + u * r, y + v * r, r * 0.06, 0, TAU);
      g.fill();
    }
  } else if (f.pat === 'stripes') {
    for (let k = -1; k <= 1; k++) { g.beginPath(); g.moveTo(x - r * 0.7, y + k * r * 0.32 - r * 0.15); g.quadraticCurveTo(x, y + k * r * 0.32 - r * 0.35, x + r * 0.7, y + k * r * 0.32 - r * 0.15); g.stroke(); }
  } else if (f.pat === 'swirl') {
    g.beginPath(); for (let t = 0; t < 4.5 * Math.PI; t += 0.3) { const rr = r * 0.08 * t / Math.PI; g.lineTo(x + Math.cos(t) * rr, y - r * 0.2 + Math.sin(t) * rr); } g.stroke();
  }
  // un reflet
  g.fillStyle = 'rgba(255,255,255,0.55)'; g.beginPath(); g.ellipse(x - r * 0.38, y - r * 0.5, r * 0.18, r * 0.11, -0.6, 0, TAU); g.fill();
  g.restore();
}
function drawConeBase(g, x, y, r) {               // le cornet gaufré
  g.save(); g.fillStyle = '#E9A23B'; g.strokeStyle = INK; g.lineWidth = Math.max(1.5, r * 0.12);
  g.beginPath(); g.moveTo(x - r * 0.95, y); g.lineTo(x + r * 0.95, y); g.lineTo(x, y + r * 2.3); g.closePath(); g.fill(); g.stroke();
  g.strokeStyle = 'rgba(122,72,12,0.65)'; g.lineWidth = Math.max(1, r * 0.07);
  for (let k = 1; k < 4; k++) {
    g.beginPath(); g.moveTo(x - r * 0.95 + k * r * 0.48, y); g.lineTo(x + r * 0.2 * (k - 2), y + r * 2.1); g.stroke();
    g.beginPath(); g.moveTo(x + r * 0.95 - k * r * 0.48, y); g.lineTo(x - r * 0.2 * (k - 2), y + r * 2.1); g.stroke();
  }
  g.restore();
}

// ---------- La glace portée par le coureur : une montagne de boules qui tangue ----------
function drawCone() {
  const LV = S.Levels, m = LV.m;
  if (!m || !m.level.scoops) return;
  if (LV.mountain) return;                         // à l'arrivée, les boules partent sur la montagne
  const g = S.ctx, s = Lt.s, r = s * 0.2;
  const bx = Lt.cx + s * 0.62, by = Lt.yFeet - s * 1.12 - (LV.jump || 0);
  const sway = LV.cone ? LV.cone.a : 0;
  drawConeBase(g, bx, by, r);
  const n = Math.min(m.scoops, CONE_MAX), melt = m.level.melt, k = melt ? (m.t % melt) / melt : 0;   // la boule du haut fond peu à peu
  let x = bx, y = by - r * 0.3;
  for (let i = 0; i < n; i++) {
    const h = (i + 1) / Math.max(4, n), ang = sway * Math.pow(h, 1.25);
    x += Math.sin(ang) * r * 1.3; y -= Math.cos(ang) * r * 1.25;
    const top = i === n - 1, drip = top ? Math.max(0, (k - 0.55) / 0.45) : 0;
    drawScoop(g, x, y, r * (top ? 1 - drip * 0.15 : 1), i, 1, drip);
  }
  if (m.scoops > CONE_MAX) {                       // encore plus de boules : le compte, à côté du haut de la pile
    const fs = Math.max(13, r * 1.1);
    g.save(); g.textAlign = 'left'; g.textBaseline = 'middle';
    otext(`×${m.scoops}`, x + r * 1.2, y, fs, '#FFFFFF');
    g.restore();
  }
  // les boules qui tombent (« PLOC ! »)
  for (const p of LV.plocs) {
    const t = S.gtime - p.t0;
    if (t > 1.2) continue;
    const fy = p.y + 0.5 * 2600 * t * t * (Lt.s / 60), fx = p.x + p.vx * t;
    if (fy < Lt.yFeet) drawScoop(g, fx, fy, r, p.i, 1 - t / 1.2, 0.6);
    else { g.fillStyle = css(flavor(p.i).c, Math.max(0, 0.9 - t)); g.beginPath(); g.ellipse(fx, Lt.yFeet + r * 0.2, r * 1.3, r * 0.35, 0, 0, TAU); g.fill(); }
  }
}
// Le moteur a dit « une boule est tombée » : on la fait tomber du haut de la pile
function dropScoop(left) {
  const LV = S.Levels, s = Lt.s, r = s * 0.2;
  const bx = Lt.cx + s * 0.62, by = Lt.yFeet - s * 1.12;
  LV.plocs.push({ t0: S.gtime, x: bx + (LV.cone ? LV.cone.a : 0) * r * left, y: by - r * 0.3 - (left + 1) * r * 1.25, vx: s * 1.4, i: left });
  if (LV.plocs.length > 8) LV.plocs.shift();
}

// ---------- À l'arrivée : la montagne de glace ----------
// Les boules sautent une par une sur une montagne qui grandit (son de plus en plus aigu), puis « ×7 ! » et des confettis.
const STEP = 0.16, FLY = 0.38;
function mountainDur(n) { return n ? 0.4 + n * STEP + FLY + 0.9 : 0; }
function slot(i, n, base, r) {                     // la place de la i-ème boule dans la montagne (pyramide)
  let row = 0, left = i, w = Math.max(1, Math.ceil(Math.sqrt(n * 2)));
  while (left >= w - row && w - row > 1) { left -= w - row; row++; }
  const cols = Math.max(1, w - row);
  return { x: base.x + (left - (cols - 1) / 2) * r * 1.7, y: base.y - row * r * 1.45 };
}
function drawMountain() {
  const LV = S.Levels, mo = LV.mountain;
  if (!mo) return;
  const g = S.ctx, r = Math.min(Lt.s * 0.28, Lt.U * 0.05), t = S.gtime - mo.t0;
  const base = { x: Lt.cx, y: Lt.yFeet - Lt.s * 0.2 };
  const from = { x: Lt.cx + Lt.s * 0.62, y: Lt.yFeet - Lt.s * 1.6 };
  let landed = 0;
  for (let i = 0; i < mo.n; i++) {
    const ti = t - 0.4 - i * STEP;
    if (ti < 0) break;
    const p = slot(i, mo.n, base, r), k = clamp(ti / FLY, 0, 1);
    const x = from.x + (p.x - from.x) * k, y = from.y + (p.y - from.y) * k - Math.sin(k * Math.PI) * Lt.s * 1.1;
    const sq = k >= 1 ? 1 + 0.25 * Math.exp(-(ti - FLY) * 12) : 1;   // elle s'écrase un peu en arrivant
    g.save(); g.translate(x, y); g.scale(sq, 1 / sq); drawScoop(g, 0, 0, r, i); g.restore();
    if (k >= 1) landed++;
    if (k >= 1 && !mo.popped[i]) {                 // pop ! de plus en plus aigu
      mo.popped[i] = true;
      S.Sound.tone(420 + i * 70, 0.09, 'triangle', 0.22, 620 + i * 80);
      if (i === mo.n - 1) { S.shake = Lt.U * 0.012; S.confetti && S.confetti(60); S.Sound.tone(880, 0.25, 'square', 0.12, 1320, 0.05); }
    }
  }
  if (landed) {                                     // le compteur « ×7 ! »
    const big = landed === mo.n, k = big ? Math.min(1, (t - 0.4 - mo.n * STEP - FLY) * 4) : 0;
    const fs = Math.min(Lt.U * (0.1 + 0.05 * k), 64), tx = base.x + r * 3.4, ty = base.y - r * 2.6;
    g.save(); g.textAlign = 'center';
    otext(`×${landed}${big ? ' !' : ''}`, tx, ty, fs, '#FFD166');
    if (big && k > 0.5) {
      const t2 = L.mountain(mo.n), f2 = fit(t2, Math.min(Lt.U * 0.07, 36), S.W * 0.9);
      otext(t2, Lt.cx, Lt.hy + (Lt.yFeet - Lt.hy) * 0.12, f2, '#FFFFFF');
    }
    g.restore();
  }
}

// ---------- Les transats à l'arrivée ----------
function drawChairs(camZ) {
  const LV = S.Levels, m = LV.m;
  if (!m || !m.level.chairs) return;
  const n = m.level.chairs, dz = m.level.length + 3 - camZ;
  if (dz < 1.5 || dz > FAR) return;
  const sc = Lt.F / dz, y = yAt(dz), fog = Math.pow(clamp(dz / FAR, 0, 1), 0.7), g = S.ctx;
  const span = PATH_W * 2.6;
  const sled = LV.sleds;                             // v2.6 : à la montagne, des luges
  for (let i = 0; i < n; i++) {
    const x = Lt.cx + (-span / 2 + (span * (i + 0.5)) / n) * sc, w = 0.55 * sc, h = 0.5 * sc;
    const who = m.finishers[i];
    g.save(); g.lineJoin = 'round';
    g.strokeStyle = css(INK, 1 - fog); g.lineWidth = Math.max(1.2, 0.05 * sc);
    if (sled) {
      drawSled(g, x, y, sc, fog, i);
      if (who && sc > 2) { g.textAlign = 'center'; otext(who.name || '', x, y - 0.95 * sc, Math.max(10, 0.28 * sc), '#FFFFFF'); }
      g.restore(); continue;
    }
    // le cadre en bois
    g.strokeStyle = mix('#8B5A2B', pal.haze, fog);
    g.beginPath(); g.moveTo(x - w / 2, y); g.lineTo(x + w / 2, y - h); g.moveTo(x + w / 2, y); g.lineTo(x - w / 2, y - h * 0.6); g.stroke();
    // la toile rayée (rayures : on la voit sans la couleur)
    g.fillStyle = mix(i % 2 ? '#4CC9F0' : '#FF4D6D', pal.haze, fog);
    g.beginPath(); g.moveTo(x - w / 2, y - h * 0.55); g.lineTo(x + w / 2, y - h * 1.05); g.lineTo(x + w / 2, y - h * 0.75); g.lineTo(x - w / 2, y - h * 0.25); g.closePath(); g.fill();
    g.strokeStyle = css(INK, 1 - fog); g.stroke();
    g.strokeStyle = mix('#FFFFFF', pal.haze, fog); g.lineWidth = Math.max(1, 0.06 * sc);
    for (let k = 1; k < 4; k++) { const u = k / 4; g.beginPath(); g.moveTo(x - w / 2 + w * u, y - h * (0.55 + 0.5 * u)); g.lineTo(x - w / 2 + w * u, y - h * (0.25 + 0.5 * u)); g.stroke(); }
    if (who && sc > 2) {                             // pris : le prénom au-dessus
      g.textAlign = 'center'; otext(who.name || '', x, y - h * 1.35, Math.max(10, 0.28 * sc), '#FFFFFF');
    }
    g.restore();
  }
}

// 🛷 Une luge en bois (v2.6, monde 4) : deux patins recourbés devant, un siège à rayures (on la reconnaît sans la couleur)
function drawSled(g, x, y, sc, fog, i) {
  const f = c => mix(c, pal.haze, fog), w = 0.62 * sc, lw = Math.max(1.2, 0.05 * sc), dir = i % 2 ? 1 : -1;
  g.lineCap = 'round';
  g.strokeStyle = f('#5B3A22'); g.lineWidth = Math.max(1.5, 0.07 * sc);   // les patins, recourbés à l'avant
  for (const dy of [0, -0.05]) {
    g.beginPath(); g.moveTo(x - dir * w, y + dy * sc); g.lineTo(x + dir * w * 0.75, y + dy * sc);
    g.quadraticCurveTo(x + dir * w * 1.05, y + dy * sc, x + dir * w * 1.0, y - 0.32 * sc + dy * sc); g.stroke();
  }
  g.lineWidth = Math.max(1, 0.05 * sc);           // les montants
  for (const u of [-0.6, 0, 0.55]) { g.beginPath(); g.moveTo(x + dir * w * u, y); g.lineTo(x + dir * w * u, y - 0.28 * sc); g.stroke(); }
  g.fillStyle = f(i % 2 ? '#E63946' : '#4895EF');  // le siège, et ses rayures blanches
  rrp(g, x - w * 0.85, y - 0.4 * sc, w * 1.6, 0.14 * sc, 0.04 * sc); g.fill();
  g.strokeStyle = css(INK, 1 - fog); g.lineWidth = lw; g.stroke();
  g.strokeStyle = f('#FFFFFF'); g.lineWidth = Math.max(1, 0.05 * sc);
  for (let k = 1; k < 4; k++) { const sx = x - w * 0.85 + w * 1.6 * k / 4; g.beginPath(); g.moveTo(sx, y - 0.39 * sc); g.lineTo(sx, y - 0.27 * sc); g.stroke(); }
  g.strokeStyle = f('#C9A227'); g.lineWidth = Math.max(1, 0.03 * sc);   // la corde
  g.beginPath(); g.moveTo(x + dir * w * 1.0, y - 0.3 * sc); g.quadraticCurveTo(x + dir * w * 1.35, y - 0.05 * sc, x + dir * w * 1.15, y + 0.05 * sc); g.stroke();
}

// ---------- La ligne du HUD : jusqu'à la nuit, transats (ou luges) libres, boules de glace ----------
function drawPressureHUD(x0, x1, y, fs) {
  const LV = S.Levels, m = LV.m;
  if (!m) return;
  const g = S.ctx, def = m.level;
  let x = x0;
  const h = Math.max(8, fs * 0.36);
  if (m.night && !m.sunUp) {                       // ☀️ ▬▬▬▬▬▭▭ 🌙  12 s (plus de barre après une 2e chance : il reste levé)
    const left = Math.max(0, m.night - m.t), k = clamp(left / m.night, 0, 1);
    const w = Math.max(70, Math.min(x1 - x0 - fs * 3.2, S.W * 0.42));
    const warn = m.warned && left > 0, blink = warn && Math.floor(S.gtime * 4) % 2 === 0;
    g.font = `${fs * 0.62}px ${FONT}`; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.fillText('☀️', x, y + h / 2);
    const bx = x + fs * 0.78;
    g.fillStyle = 'rgba(43,45,66,0.55)'; rrp(g, bx - 2, y - 2, w + 4, h + 4, (h + 4) / 2); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.3)'; rrp(g, bx, y, w, h, h / 2); g.fill();
    g.fillStyle = blink ? '#FFFFFF' : warn ? '#FF8A3D' : '#FFB703'; rrp(g, bx, y, Math.max(h, w * k), h, h / 2); g.fill();
    g.fillText('🌙', bx + w + fs * 0.12, y + h / 2);
    otext(`${Math.ceil(left)} s`, bx + w + fs * 0.9, y + h / 2 + 1, fs * 0.55, warn ? '#FFB3B3' : '#FFFFFF');
    x = bx + w + fs * 2.5;
  }
  if (def.chairs) {                                // 🏖️ ×2 : les transats encore libres (🛷 : les luges, à la montagne)
    const free = Math.max(0, def.chairs - m.finishers.length);
    g.textAlign = 'left'; g.font = `${fs * 0.62}px ${FONT}`; g.textBaseline = 'middle';
    g.fillText(LV.sleds ? '🛷' : '🏖️', x, y + h / 2);
    otext(`×${free}`, x + fs * 0.78, y + h / 2 + 1, fs * 0.6, free <= 1 ? '#FF8FA3' : '#FFFFFF');
    x += fs * 2.2;
  }
  if (def.scoops) {                                // 🍦 ×7
    g.textAlign = 'left'; g.font = `${fs * 0.62}px ${FONT}`; g.textBaseline = 'middle';
    g.fillText('🍦', x, y + h / 2);
    otext(`×${m.scoops}`, x + fs * 0.78, y + h / 2 + 1, fs * 0.6, '#FFFFFF');
  }
}

Object.assign(S, { drawCone, dropScoop, drawMountain, mountainDur, drawChairs, drawPressureHUD, drawScoop });
})(window.Soleil);
