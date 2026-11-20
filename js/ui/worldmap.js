/* js/ui/worldmap.js — La carte du monde, dessinée en canvas : la cour de récré, un chemin à la craie avec les 8 niveaux
   (étoiles gagnées, cadenas, boss au bout), ton personnage sur le dernier niveau débloqué, et les mondes 2 à 5
   visibles mais verrouillés (« Bientôt »). On touche un niveau pour le jouer ; au clavier : flèches + Entrée. */
(function (S) {
'use strict';
const { INK, TAU, clamp, lerp, css, L, tr, Lt, safe, rrp, otext, fit, drawStarShape, drawRunnerFig, outfitById, WORLDS, Sound, toast, vibrate, store, drawBanner } = S;

// ---------- Réglages ----------
const PORTRAIT = [[0.28, 0.9], [0.7, 0.8], [0.34, 0.69], [0.68, 0.58], [0.3, 0.47], [0.66, 0.37], [0.36, 0.27], [0.62, 0.15]];
const LANDSCAPE = [[0.07, 0.78], [0.2, 0.5], [0.33, 0.76], [0.45, 0.46], [0.57, 0.74], [0.69, 0.44], [0.8, 0.7], [0.92, 0.42]];
const COL = { open: '#FFFFFF', done: '#FFD166', locked: '#9AA3B2', boss: '#FF4D6D' };

const UNLOCK_DUR = 2.6;        // animation de déblocage d'un monde (s)
const MAP = { world: 1, sel: 0, nodes: [], tabs: [], shakeI: -1, shakeT: 0, area: null, unlock: null };
const world = () => WORLDS.find(w => w.id === MAP.world);

function open() {
  if (S.Levels.m) S.Levels.cleanup();
  S.state = 'map'; S.mode = 'map';
  S.releaseAll();
  const last = S.levelById(store.get('lastLevel', ''));       // on revient sur le monde du dernier niveau joué
  MAP.world = last && S.Levels.worldOpen(WORLDS.find(w => w.id === last.world)) ? last.world : 1;
  const shown = store.get('worldsShown', []);                  // un monde vient de s'ouvrir ? petite animation
  const fresh = WORLDS.find(w => w.need && S.Levels.worldOpen(w) && !shown.includes(w.id));
  if (fresh) { MAP.unlock = { id: fresh.id, t0: S.gtime, step: 0 }; store.set('worldsShown', shown.concat(fresh.id)); }
  selectWorld(MAP.world);
  S.refreshUI();
}
function selectWorld(id) {
  MAP.world = id;
  const w = world();
  MAP.sel = w.levels.indexOf(S.Levels.lastUnlocked(w));
}

// Positions des niveaux et des onglets de monde, selon l'écran (portrait ou paysage)
function layout() {
  const land = S.W > S.H * 1.1;
  const head = safe.t + 108, school = S.H > 520 ? clamp(S.H * 0.085, 46, 84) : 0;   // bandeau, puis l'école (si la place)
  const top = head + school + 8, bot = S.H - safe.b - 18, left = safe.l + 16, right = S.W - safe.r - 16;
  MAP.area = { head, school, top, bot, left, right, land };
  const base = land ? LANDSCAPE : PORTRAIT, pts = MAP.world % 2 ? base : base.map(([x, y]) => [1 - x, y]);   // le parc : chemin en miroir
  const r = clamp(Math.min(S.W, S.H) * (land ? 0.062 : 0.058), 20, 40);
  MAP.nodes = world().levels.map((lv, i) => ({ lv, x: lerp(left + r, right - r, pts[i][0]), y: lerp(top + r * 1.2, bot - r * 1.6, pts[i][1]), r: lv.boss ? r * 1.32 : r }));
  const tw = Math.min(62, (S.W - safe.l - safe.r - 96) / WORLDS.length);
  MAP.tabs = WORLDS.map((w, i) => ({ w, x: safe.l + 14 + tw * (i + 0.5), y: safe.t + 48, r: tw * 0.36 }));
}

// ---------- Dessin ----------
function draw() {
  layout();
  const g = S.ctx, A = MAP.area;
  g.setTransform(S.DPR, 0, 0, S.DPR, 0, 0);
  // ciel, école au fond, cour en bitume, herbe sur les bords
  const sky = g.createLinearGradient(0, 0, 0, S.H * 0.35);
  sky.addColorStop(0, '#7CC8F8'); sky.addColorStop(1, '#D8F0FF');
  g.fillStyle = sky; g.fillRect(0, 0, S.W, S.H);
  if (MAP.world === 2) drawParkMap(g, A);
  else {
    drawSchool(g, A);
    g.fillStyle = '#C3CAD5'; rrp(g, -20, A.top - 10, S.W + 40, S.H - A.top + 30, 26); g.fill();
    g.fillStyle = '#B5BDCA';
    for (let i = 0; i < 14; i++) { const x = S.hash(i * 3.1) * S.W, y = A.top + S.hash(i * 7.7) * (S.H - A.top); g.beginPath(); g.ellipse(x, y, 40 + 50 * S.hash(i), 16 + 14 * S.hash(i * 2), 0, 0, TAU); g.fill(); }
    g.fillStyle = '#86CE88'; g.fillRect(0, A.top - 10, 12 + safe.l, S.H); g.fillRect(S.W - 12 - safe.r, A.top - 10, 12 + safe.r, S.H);
    drawDoodles(g, A);
    drawMapTrees(g, A);
  }
  // le chemin à la craie entre les niveaux
  const N = MAP.nodes;
  g.lineCap = 'round'; g.lineJoin = 'round';
  for (const pass of [0, 1]) {
    g.strokeStyle = pass ? 'rgba(255,255,255,0.95)' : 'rgba(43,45,66,0.18)';
    g.lineWidth = pass ? 5 : 9; g.setLineDash(pass ? [12, 12] : []);
    g.beginPath();
    N.forEach((n, i) => {
      if (!i) { g.moveTo(n.x, n.y); return; }
      const p = N[i - 1], mx = (p.x + n.x) / 2, my = (p.y + n.y) / 2, k = i % 2 ? 1 : -1;
      g.quadraticCurveTo(mx + k * (A.land ? 0 : 30), my + k * (A.land ? 30 : 0), n.x, n.y);
    });
    g.stroke();
  }
  g.setLineDash([]);
  // les niveaux
  const cur = S.Levels.lastUnlocked(world());
  N.forEach((n, i) => drawNode(g, n, i, n.lv === cur));
  // ton personnage, sur le dernier niveau débloqué
  const cn = N.find(n => n.lv === cur) || N[0];
  const s = n2s(cn.r), bob = Math.abs(Math.sin(S.gtime * 3.2)) * 4;
  drawRunnerFig(g, cn.x + cn.r * 1.6, cn.y + cn.r * 0.9 - bob, s, { sp: 0, ph: 0, st: 0, t: S.gtime, breathe: Math.sin(S.gtime * 3) * 0.02 }, outfitById(S.outfit), false, '');
  drawHeader(g);
  if (MAP.unlock) drawUnlock(g);
}

// Le parc, vu du ciel : pelouse, allées, étang, fontaine, massifs de fleurs, arbres (monde 2)
function drawParkMap(g, A) {
  const top = A.head + 6;
  g.fillStyle = '#7ACB6E'; rrp(g, -20, top, S.W + 40, S.H - top + 30, 26); g.fill();
  g.fillStyle = '#6DBE62';
  for (let i = 0; i < 16; i++) { const x = S.hash(i * 2.3 + 40) * S.W, y = top + S.hash(i * 5.9 + 40) * (S.H - top); g.beginPath(); g.ellipse(x, y, 34 + 40 * S.hash(i + 40), 14 + 12 * S.hash(i * 3 + 40), 0, 0, TAU); g.fill(); }
  g.strokeStyle = '#E6D8B6'; g.lineWidth = 22; g.lineCap = 'round';      // les allées de gravier
  g.beginPath(); g.moveTo(-10, top + (S.H - top) * 0.62); g.quadraticCurveTo(S.W * 0.5, top + (S.H - top) * 0.45, S.W + 10, top + (S.H - top) * 0.7); g.stroke();
  const px = S.W * (A.land ? 0.5 : 0.22), py = top + (S.H - top) * (A.land ? 0.18 : 0.42), pr = Math.min(S.W, S.H) * 0.11;
  g.fillStyle = '#5EC8F2'; g.strokeStyle = INK; g.lineWidth = 3;            // l'étang et ses canards
  g.beginPath(); g.ellipse(px, py, pr * 1.4, pr * 0.8, -0.2, 0, TAU); g.fill(); g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.45)'; g.beginPath(); g.ellipse(px - pr * 0.4, py - pr * 0.25, pr * 0.5, pr * 0.15, -0.2, 0, TAU); g.fill();
  for (let i = 0; i < 2; i++) {
    const dx = px + Math.cos(S.gtime * 0.4 + i * 3) * pr * 0.8, dy = py + Math.sin(S.gtime * 0.4 + i * 3) * pr * 0.35;
    g.fillStyle = '#FFFFFF'; g.beginPath(); g.ellipse(dx, dy, 9, 6, 0, 0, TAU); g.fill(); g.stroke();
    g.fillStyle = '#FFD166'; g.beginPath(); g.arc(dx + 8, dy - 5, 3, 0, TAU); g.fill();
  }
  const fx = S.W * (A.land ? 0.82 : 0.78), fy = top + (S.H - top) * 0.88, fr = Math.min(S.W, S.H) * 0.06;   // la fontaine
  g.fillStyle = '#BFC6CF'; g.beginPath(); g.arc(fx, fy, fr, 0, TAU); g.fill(); g.stroke();
  g.fillStyle = '#5EC8F2'; g.beginPath(); g.arc(fx, fy, fr * 0.75, 0, TAU); g.fill();
  g.fillStyle = '#E8F8FF'; for (let i = 0; i < 6; i++) { const a = S.gtime * 2 + i; g.beginPath(); g.arc(fx + Math.cos(a) * fr * 0.4, fy + Math.sin(a) * fr * 0.4, 3, 0, TAU); g.fill(); }
  const cols = ['#FF4D6D', '#FFD166', '#FFFFFF', '#9B5DE5'];                 // massifs de fleurs
  for (let i = 0; i < 5; i++) {
    const x = S.W * (0.1 + S.hash(i * 7.3 + 9) * 0.8), y = top + (S.H - top) * (0.1 + S.hash(i * 3.7 + 9) * 0.85);
    for (let j = 0; j < 7; j++) { g.fillStyle = cols[(i + j) % 4]; g.beginPath(); g.arc(x + Math.cos(j) * 12, y + Math.sin(j * 1.3) * 7, 4, 0, TAU); g.fill(); }
  }
  const r = clamp(Math.min(S.W, S.H) * 0.045, 14, 30);                         // arbres du parc (ronds et sapins)
  for (let i = 0; i < 9; i++) {
    const x = i % 2 ? A.right - r * 0.2 : A.left + r * 0.2, y = lerp(top + r * 2, S.H - safe.b - r, (i + 0.5) / 9);
    if (S.hash(i * 4.1 + 2) < 0.25) continue;
    if (S.hash(i * 6.3) < 0.4) { g.fillStyle = '#2E8B57'; g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.moveTo(x - r * 0.8, y + r * 0.3); g.lineTo(x, y - r * 1.4); g.lineTo(x + r * 0.8, y + r * 0.3); g.closePath(); g.fill(); g.stroke(); }
    else { g.fillStyle = S.hash(i) < 0.5 ? '#3FAE4A' : '#FFB3C7'; g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.arc(x, y - r * 0.4, r, 0, TAU); g.fill(); g.stroke(); }
  }
}

// Déblocage d'un monde : le badge tremble, le cadenas saute, confettis, bannière… puis la carte passe sur ce monde
function drawUnlock(g) {
  const u = MAP.unlock, t = S.gtime - u.t0, tab = MAP.tabs.find(x => x.w.id === u.id);
  if (!tab) { MAP.unlock = null; return; }
  if (u.step === 0) { u.step = 1; Sound.lock(); vibrate(20); }
  if (u.step === 1 && t > 0.75) { u.step = 2; Sound.levelWin(); vibrate([30, 30, 60]); }
  if (u.step === 2 && t > 1.0) { u.step = 3; selectWorld(u.id); }
  const cx = tab.x, cy = tab.y + 18;
  if (t < 0.75) {                                   // le badge tremble, le cadenas est encore là
    g.save(); g.translate(cx + Math.sin(t * 60) * 4 * (t / 0.75), cy); g.font = `${tab.r * 1.2}px ${S.FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('🔒', 0, 0); g.restore();
  } else {                                          // il saute : éclats et étoiles
    const k = clamp((t - 0.75) / 0.9, 0, 1);
    g.save(); g.globalAlpha = 1 - k;
    for (let i = 0; i < 12; i++) {
      const a = i * TAU / 12, d = tab.r * (1.2 + k * 4);
      drawStarShape(cx + Math.cos(a) * d, cy + Math.sin(a) * d, tab.r * 0.3 * (1 - k * 0.5), ['#FFD166', '#06D6A0', '#EF476F', '#4CC9F0'][i % 4], a);
    }
    g.font = `${tab.r * 1.2}px ${S.FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('🔓', cx, cy - k * 60);
    g.restore();
  }
  if (t > 0.75) drawBanner(L.worldUnlocked(u.id), L.worldUnlockedSub, '', t - 0.75, UNLOCK_DUR - 0.75, '#06D6A0');
  if (t > UNLOCK_DUR) MAP.unlock = null;
}
const n2s = r => r * 1.25;                         // taille du personnage selon la taille d'un rond

function drawSchool(g, A) {                        // l'école, au fond, avec son horloge
  const h = A.school * 0.72, w = Math.min(S.W * 0.62, 520), x = S.W / 2 - w / 2, y = A.top - 10 - h;
  if (h < 30) return;
  g.fillStyle = '#E76F51'; g.strokeStyle = INK; g.lineWidth = 3;
  rrp(g, x, y, w, h + 12, 8); g.fill(); g.stroke();
  g.fillStyle = '#9C3D2C'; g.beginPath(); g.moveTo(x - 12, y + 4); g.lineTo(S.W / 2, y - h * 0.45); g.lineTo(x + w + 12, y + 4); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#BEE3F8';
  const n = Math.max(3, Math.floor(w / 70));
  for (let i = 0; i < n; i++) { const wx = x + (i + 0.5) * w / n - 12; if (Math.abs(wx + 12 - S.W / 2) < 26) continue; rrp(g, wx, y + h * 0.3, 24, h * 0.42, 4); g.fill(); g.stroke(); }
  g.fillStyle = '#FFFFFF'; g.beginPath(); g.arc(S.W / 2, y + h * 0.05, h * 0.2, 0, TAU); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(S.W / 2, y + h * 0.05); g.lineTo(S.W / 2, y - h * 0.1); g.moveTo(S.W / 2, y + h * 0.05); g.lineTo(S.W / 2 + h * 0.1, y + h * 0.05); g.stroke();
}
function drawMapTrees(g, A) {                      // arbres et bancs le long de la cour
  const r = clamp(Math.min(S.W, S.H) * 0.045, 14, 30);
  for (let i = 0; i < 4; i++) for (const sd of [0, 1]) {
    const x = sd ? A.right - r * 0.3 : A.left + r * 0.3, y = lerp(A.top + r * 2, A.bot - r, (i + (sd ? 0.5 : 0)) / 4);
    if (S.hash(i * 5.3 + sd) < 0.35) continue;
    g.fillStyle = '#94603F'; g.fillRect(x - r * 0.12, y - r * 0.2, r * 0.24, r * 0.9);
    g.fillStyle = S.hash(i + sd * 9) < 0.5 ? '#3FAE4A' : '#33983F'; g.strokeStyle = INK; g.lineWidth = 3;
    g.beginPath(); g.arc(x, y - r * 0.55, r, 0, TAU); g.fill(); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.2)'; g.beginPath(); g.arc(x - r * 0.35, y - r * 0.9, r * 0.32, 0, TAU); g.fill();
  }
}
function drawDoodles(g, A) {                       // dessins à la craie sur le bitume
  g.strokeStyle = 'rgba(255,255,255,0.45)'; g.lineWidth = 3;
  const sx = A.right - 40, sy = A.bot - 40;
  g.beginPath(); g.arc(sx, sy, 16, 0, TAU); g.stroke();
  for (let i = 0; i < 8; i++) { const a = i * TAU / 8; g.beginPath(); g.moveTo(sx + Math.cos(a) * 22, sy + Math.sin(a) * 22); g.lineTo(sx + Math.cos(a) * 30, sy + Math.sin(a) * 30); g.stroke(); }
  const hx = A.left + 30, hy = (A.top + A.bot) / 2;
  for (let i = 0; i < 4; i++) g.strokeRect(hx, hy + i * 26, 26, 26);
}

function drawNode(g, n, i, current) {
  const lv = n.lv, open = S.Levels.unlocked(lv), stars = S.Levels.starsOf(lv.id), done = !!S.Levels.peek(lv.id).done;
  let x = n.x;
  if (MAP.shakeI === i && S.gtime - MAP.shakeT < 0.35) x += Math.sin((S.gtime - MAP.shakeT) * 60) * 5;
  const pulse = current ? 1 + Math.sin(S.gtime * 5) * 0.06 : 1, r = n.r * pulse;
  if (current) { g.fillStyle = 'rgba(255,209,102,0.35)'; g.beginPath(); g.arc(x, n.y, r * 1.45, 0, TAU); g.fill(); }
  if (MAP.sel === i && S.mapKeys) { g.strokeStyle = '#FFFFFF'; g.lineWidth = 4; g.beginPath(); g.arc(x, n.y, r * 1.28, 0, TAU); g.stroke(); }
  g.fillStyle = 'rgba(43,45,66,0.25)'; g.beginPath(); g.ellipse(x, n.y + r * 0.95, r * 0.95, r * 0.28, 0, 0, TAU); g.fill();
  g.fillStyle = !open ? COL.locked : lv.boss ? COL.boss : done ? COL.done : COL.open;
  g.strokeStyle = INK; g.lineWidth = Math.max(3, r * 0.12);
  g.beginPath(); g.arc(x, n.y, r, 0, TAU); g.fill(); g.stroke();
  g.textAlign = 'center'; g.textBaseline = 'middle';
  if (!open) { g.font = `${r * 0.9}px ${S.FONT}`; g.fillText('🔒', x, n.y + 2); }
  else if (lv.boss && lv.bossKind === 'farceur') { g.fillStyle = '#FFD23A'; g.beginPath(); g.arc(x, n.y, r * 0.62, 0, TAU); g.fill(); S.drawGroucho(x, n.y, r * 0.62, 1, 1); }
  else if (lv.boss) drawBossFace(g, x, n.y, r * 0.78);
  else { g.font = `900 ${r * 0.95}px ${S.FONT}`; g.fillStyle = INK; g.fillText(String(lv.num), x, n.y + r * 0.06); }
  for (let k = 0; k < 3; k++) {                    // 3 petites étoiles sous chaque rond
    const sx = x + (k - 1) * r * 0.62, sy = n.y + r * 1.22 + (k === 1 ? r * 0.12 : 0);
    drawStarShape(sx, sy, r * 0.28, k < stars ? '#FFD166' : 'rgba(255,255,255,0.55)', 0);
  }
  if (lv.boss) { g.font = `900 ${r * 0.36}px ${S.FONT}`; otext(L.bossTag, x, n.y - r * 1.28, r * 0.36, '#FF4D6D'); }
}
function drawBossFace(g, x, y, R) {                // un petit soleil à lunettes
  g.fillStyle = '#FFD23A'; g.beginPath(); g.arc(x, y, R * 0.8, 0, TAU); g.fill();
  g.fillStyle = '#16161F';
  for (const sd of [-1, 1]) { rrp(g, x + sd * R * 0.32 - R * 0.24, y - R * 0.25, R * 0.48, R * 0.3, R * 0.1); g.fill(); }
  g.fillRect(x - R * 0.1, y - R * 0.18, R * 0.2, R * 0.06);
  g.strokeStyle = '#7A1F2B'; g.lineWidth = Math.max(2, R * 0.1);
  g.beginPath(); g.arc(x, y + R * 0.15, R * 0.3, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke();
}
function drawHeader(g) {
  const w = world(), tot = S.Levels.worldStars(w), max = w.levels.length * 3;
  const x = safe.l + 14, y = safe.t + 22, fs = clamp(Lt.U * 0.052, 16, 24);
  g.fillStyle = 'rgba(43,45,66,0.72)'; rrp(g, safe.l + 6, safe.t + 4, S.W - safe.l - safe.r - 76, MAP.area.head - safe.t - 6, 18); g.fill();
  g.textAlign = 'left'; g.textBaseline = 'middle';
  g.font = `900 ${fs}px ${S.FONT}`;
  otext(`${L.worldN(w.id)} · ${tr(w.name)}`, x, y, fit(`${L.worldN(w.id)} · ${tr(w.name)}`, fs, S.W - 150 - safe.r - x), '#FFFFFF');
  g.textAlign = 'right';
  otext(`★ ${tot}/${max}`, S.W - safe.r - 84, y, fs * 0.9, '#FFD166');
  for (const t of MAP.tabs) {                       // les 5 mondes : 2 à 5 « Bientôt »
    const on = t.w.id === MAP.world, soon = t.w.soon || !S.Levels.worldOpen(t.w);
    if (MAP.unlock && MAP.unlock.id === t.w.id && S.gtime - MAP.unlock.t0 < 0.75) continue;   // l'animation le dessine
    g.fillStyle = soon ? '#8D99AE' : on ? t.w.color : '#FFFFFF'; g.strokeStyle = INK; g.lineWidth = 3;
    g.beginPath(); g.arc(t.x, t.y + 18, t.r, 0, TAU); g.fill(); g.stroke();
    g.textAlign = 'center'; g.font = `${t.r * 1.0}px ${S.FONT}`; g.fillText(soon ? '🔒' : t.w.emoji, t.x, t.y + 19);
    if (soon) { const lab = t.w.soon ? L.soon : `★ ${t.w.need.stars}`; g.font = `900 ${Math.max(9, t.r * 0.42)}px ${S.FONT}`; otext(lab, t.x, t.y + 18 + t.r + 9, Math.max(9, t.r * 0.42), t.w.soon ? '#FFFFFF' : '#FFD166'); }
    else { g.font = `900 ${t.r * 0.55}px ${S.FONT}`; otext(String(t.w.id), t.x + t.r * 0.75, t.y + 18 - t.r * 0.7, t.r * 0.55, '#FFFFFF'); }
  }
}

// ---------- Toucher et clavier ----------
function tap(px, py) {
  Sound.unlock();
  layout();
  for (const t of MAP.tabs) if (Math.hypot(px - t.x, py - (t.y + 18)) < t.r * 1.3) {
    if (t.w.soon) { Sound.lock(); toast(L.soonToast); vibrate(10); }
    else if (!S.Levels.worldOpen(t.w)) { Sound.lock(); toast(L.needStars(t.w.need.stars, t.w.need.world)); vibrate(10); }
    else if (t.w.id !== MAP.world) { Sound.tick(); selectWorld(t.w.id); }
    return;
  }
  MAP.nodes.forEach((n, i) => {
    if (Math.hypot(px - n.x, py - n.y) > n.r * 1.35) return;
    play(i);
  });
}
function play(i) {
  const n = MAP.nodes[i]; if (!n) return;
  MAP.sel = i;
  if (S.Levels.unlocked(n.lv)) { Sound.tick(); S.Levels.open(n.lv.id, false); }
  else { MAP.shakeI = i; MAP.shakeT = S.gtime; Sound.lock(); toast(L.lockedToast); vibrate(15); }
}
function key(e) {                                   // ← → (ou ↑ ↓) pour choisir, Entrée / Espace pour jouer, Échap : accueil
  S.mapKeys = true;
  const n = world().levels.length;
  if (e.code === 'ArrowRight' || e.code === 'ArrowUp') { MAP.sel = Math.min(n - 1, MAP.sel + 1); Sound.tick(); }
  else if (e.code === 'ArrowLeft' || e.code === 'ArrowDown') { MAP.sel = Math.max(0, MAP.sel - 1); Sound.tick(); }
  else if (e.code === 'Enter' || e.code === 'Space' || e.code === 'NumpadEnter') { layout(); play(MAP.sel); }
  else if (e.code === 'Escape') S.goHome();
  else return false;
  e.preventDefault();
  return true;
}

S.WorldMap = { open, draw, tap, key, layout, get sel() { return MAP.sel; }, get nodes() { return MAP.nodes; } };
})(window.Soleil);
