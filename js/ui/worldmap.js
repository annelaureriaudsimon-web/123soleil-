/* js/ui/worldmap.js — La carte du monde, dessinée en canvas : la cour de récré, un chemin à la craie avec les 8 niveaux
   (étoiles gagnées, cadenas, boss au bout), ton personnage sur le dernier niveau débloqué, et les mondes 2 à 5
   visibles mais verrouillés (« Bientôt »). On touche un niveau pour le jouer ; au clavier : flèches + Entrée. */
(function (S) {
'use strict';
const { INK, TAU, clamp, lerp, css, L, tr, Lt, safe, rrp, otext, fit, drawStarShape, drawRunnerFig, outfitById, WORLDS, Sound, toast, vibrate, store, drawBanner } = S;

// ---------- Réglages ----------
const PORTRAIT = [[0.28, 0.9], [0.7, 0.8], [0.34, 0.69], [0.68, 0.58], [0.3, 0.47], [0.66, 0.37], [0.36, 0.27], [0.62, 0.15]];
const LANDSCAPE = [[0.07, 0.78], [0.2, 0.5], [0.33, 0.76], [0.45, 0.46], [0.57, 0.74], [0.69, 0.44], [0.8, 0.7], [0.92, 0.42]];
// Les niveaux sont des tuiles en relief : [reflet, face, bas, contour]
const TILE = { open: ['#FFD27F', '#FFA62B', '#E57F00', '#7A3B00'], locked: ['#D3A77A', '#A8754A', '#86562F', '#4A2C14'],
               boss: ['#FF9BBE', '#FF4F8B', '#D42A66', '#7A0F37'] };
const NAVY = '#141A6E', BLUE = ['#7F8BFF', '#3B49F0', '#2733C4'];   // le bleu des boutons (reflet, face, bas)
const STONE = 26;              // un pavé blanc tous les 26 px sur le chemin entre deux niveaux

const UNLOCK_DUR = 2.6;        // animation de déblocage d'un monde (s)
const INTRO = { pop: 0.12, grow: 0.4, banner: 2.4, hand: 2.5, end: 7 };   // 1re carte : les niveaux apparaissent un par un, la bannière, puis une main montre le tien (s)
const MAP = { world: 1, sel: 0, nodes: [], tabs: [], shakeI: -1, shakeT: 0, area: null, unlock: null, intro: null };
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
  MAP.intro = null;
  if (S.Onboard.wantsMapIntro()) { MAP.intro = { t0: S.gtime }; S.Onboard.mapShown(); Sound.levelWin(); }   // la 1re fois : la carte se présente
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
  const tw = Math.min(62, (S.W - safe.l - safe.r - 96 * S.uiZoom - S.pillX - S.pillR) / WORLDS.length);   // pillX : la pilule Poki
  MAP.tabs = WORLDS.map((w, i) => ({ w, x: safe.l + S.pillX + 14 + tw * (i + 0.5), y: safe.t + 48, r: tw * 0.36 }));
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
  // le chemin entre les niveaux : des petits pavés blancs
  const N = MAP.nodes, it = MAP.intro ? S.gtime - MAP.intro.t0 : -1;
  if (it > INTRO.end) MAP.intro = null;
  if (it < 0 || it > 0.6) drawStones(g, N, A);
  else { g.save(); g.globalAlpha = it / 0.6; drawStones(g, N, A); g.restore(); }
  // les niveaux (1re carte : ils apparaissent un par un en rebondissant)
  const cur = S.Levels.lastUnlocked(world());
  N.forEach((n, i) => {
    const k = it < 0 ? 1 : popIn(it - 0.3 - i * INTRO.pop);
    if (k <= 0) return;
    if (k === 1) { drawNode(g, n, i, n.lv === cur); return; }
    g.save(); g.translate(n.x, n.y); g.scale(k, k); g.translate(-n.x, -n.y); drawNode(g, n, i, n.lv === cur); g.restore();
  });
  // ton personnage, sur le dernier niveau débloqué
  const cn = N.find(n => n.lv === cur) || N[0];
  const s = n2s(cn.r), bob = Math.abs(Math.sin(S.gtime * 3.2)) * 4;
  if (it < 0 || it > 0.3 + N.length * INTRO.pop) drawRunnerFig(g, cn.x + cn.r * 1.6, cn.y + cn.r * 0.9 - bob, s, { sp: 0, ph: 0, st: 0, t: S.gtime, breathe: Math.sin(S.gtime * 3) * 0.02 }, outfitById(S.wornOutfit()), false, '');
  drawHeader(g);
  if (MAP.unlock) drawUnlock(g);
  if (it >= 0) drawIntro(g, it, cn);
}
// Un rond qui apparaît en rebondissant (0 → 1, un peu plus grand au passage)
function popIn(t) {
  if (t <= 0) return 0;
  const u = Math.min(1, t / INTRO.grow) - 1;
  return t >= INTRO.grow ? 1 : 1 + 2.7 * u * u * u + 1.7 * u * u;
}
// 1re carte : bannière « TA CARTE ! », puis une main qui montre ton niveau : « À toi ! »
function drawIntro(g, t, cn) {
  if (t > 0.2 && t < 0.2 + INTRO.banner) drawBanner(L.mapIntro, L.mapIntroSub, '', t - 0.2, INTRO.banner, '#FFD166');
  if (t < INTRO.hand) return;
  const a = Math.min(1, (t - INTRO.hand) / 0.3) * Math.min(1, (INTRO.end - t) / 0.4), size = clamp(cn.r * 1.5, 40, 72);
  const bob = Math.abs(Math.sin(S.gtime * 4)) * size * 0.18, tip = cn.y - cn.r * 1.55 - bob;
  g.save(); g.globalAlpha = Math.max(0, a);
  S.drawHand(g, cn.x, tip, size, 0);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  otext(L.yourTurn, cn.x, tip - size * 1.5, fit(L.yourTurn, Math.min(Lt.U * 0.06, 30), S.W * 0.5), '#FFD166');
  g.restore();
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
    const sx = cx + Math.sin(t * 60) * 4 * (t / 0.75);
    drawRoundBtn(g, sx, cy, tab.r, ['#C9CEE0', '#9AA1BE', '#7A819F']); drawPadlock(g, sx, cy + 1, tab.r * 0.8);
  } else {                                          // il saute : éclats et étoiles
    const k = clamp((t - 0.75) / 0.9, 0, 1);
    g.save(); g.globalAlpha = 1 - k;
    for (let i = 0; i < 12; i++) {
      const a = i * TAU / 12, d = tab.r * (1.2 + k * 4);
      drawStarShape(cx + Math.cos(a) * d, cy + Math.sin(a) * d, tab.r * 0.3 * (1 - k * 0.5), ['#FFD166', '#06D6A0', '#EF476F', '#4CC9F0'][i % 4], a);
    }
    drawPadlock(g, cx + k * 14, cy - k * 70, tab.r * 0.9, true);   // le cadenas ouvert s'envole
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

// Les pavés du chemin : le long de la même courbe qu'avant, sans recouvrir les tuiles
function drawStones(g, N, A) {
  for (let i = 1; i < N.length; i++) {
    const p = N[i - 1], n = N[i], k = i % 2 ? 1 : -1;
    const qx = (p.x + n.x) / 2 + k * (A.land ? 0 : 30), qy = (p.y + n.y) / 2 + k * (A.land ? 30 : 0);
    const len = Math.hypot(qx - p.x, qy - p.y) + Math.hypot(n.x - qx, n.y - qy), steps = Math.max(2, Math.round(len / STONE));
    const st = clamp(Math.min(p.r, n.r) * 0.36, 7, 13);
    for (let j = 1; j < steps; j++) {
      const t = j / steps, u = 1 - t;
      const x = u * u * p.x + 2 * u * t * qx + t * t * n.x, y = u * u * p.y + 2 * u * t * qy + t * t * n.y;
      if (Math.hypot(x - p.x, y - p.y) < p.r * 1.35 || Math.hypot(x - n.x, y - n.y) < n.r * 1.35) continue;
      g.fillStyle = 'rgba(20,26,110,0.22)'; rrp(g, x - st, y - st + 3, st * 2, st * 2, st * 0.45); g.fill();
      g.fillStyle = '#FFFFFF'; rrp(g, x - st, y - st, st * 2, st * 2, st * 0.45); g.fill();
      g.fillStyle = '#E3E8F5'; rrp(g, x - st, y + st * 0.35, st * 2, st * 0.65, st * 0.3); g.fill();
    }
  }
}
// Une tuile en relief (carré arrondi) : tranche sombre dessous, face dégradée, reflet en haut
function drawTile(g, x, y, r, c) {
  const rad = r * 0.42, h = Math.max(4, r * 0.2);
  g.fillStyle = c[3]; rrp(g, x - r, y - r + h, r * 2, r * 2, rad); g.fill();
  const grd = g.createLinearGradient(0, y - r, 0, y + r);
  grd.addColorStop(0, c[0]); grd.addColorStop(0.5, c[1]); grd.addColorStop(1, c[2]);
  g.fillStyle = grd; g.strokeStyle = c[3]; g.lineWidth = Math.max(3, r * 0.11);
  rrp(g, x - r, y - r, r * 2, r * 2, rad); g.fill(); g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.38)'; rrp(g, x - r * 0.68, y - r * 0.8, r * 1.36, r * 0.3, r * 0.15); g.fill();
}
// Un cadenas doré (open : l'anse sort, il est ouvert)
function drawPadlock(g, x, y, sz, open = false) {
  const ink = '#4A2C14', lift = open ? sz * 0.32 : 0;
  g.lineCap = 'round'; g.strokeStyle = ink; g.lineWidth = sz * 0.3;
  g.beginPath();
  if (open) { g.moveTo(x + sz * 0.3, y); g.lineTo(x + sz * 0.3, y - sz * 0.22 - lift); g.arc(x, y - sz * 0.22 - lift, sz * 0.3, 0, Math.PI, true); g.lineTo(x - sz * 0.3, y - sz * 0.12 - lift); }
  else { g.moveTo(x - sz * 0.3, y); g.lineTo(x - sz * 0.3, y - sz * 0.22); g.arc(x, y - sz * 0.22, sz * 0.3, Math.PI, 0); g.lineTo(x + sz * 0.3, y); }
  g.stroke();
  g.strokeStyle = '#FFE7A8'; g.lineWidth = sz * 0.12; g.stroke();
  const grd = g.createLinearGradient(0, y - sz * 0.05, 0, y + sz * 0.7);
  grd.addColorStop(0, '#FFE07A'); grd.addColorStop(1, '#F0A300');
  g.fillStyle = grd; g.strokeStyle = ink; g.lineWidth = sz * 0.12;
  rrp(g, x - sz * 0.5, y - sz * 0.05, sz, sz * 0.75, sz * 0.16); g.fill(); g.stroke();
  g.fillStyle = ink; g.beginPath(); g.arc(x, y + sz * 0.27, sz * 0.1, 0, TAU); g.fill();
  g.fillRect(x - sz * 0.045, y + sz * 0.3, sz * 0.09, sz * 0.2);
}
// Un texte blanc à gros contour d'une couleur choisie (le numéro des niveaux)
function inkText(g, t, x, y, size, ink) {
  g.font = `900 ${size}px ${S.FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.strokeStyle = ink; g.lineWidth = Math.max(3, size * 0.24);
  g.strokeText(t, x, y + size * 0.06); g.strokeText(t, x, y);
  g.fillStyle = '#FFFFFF'; g.fillText(t, x, y);
}
// Un bouton rond bleu, comme ceux de l'interface (onglets des mondes)
function drawRoundBtn(g, x, y, r, face) {
  g.fillStyle = NAVY; g.beginPath(); g.arc(x, y + 4, r, 0, TAU); g.fill();
  const grd = g.createRadialGradient(x, y - r * 0.5, r * 0.1, x, y, r * 1.05);
  grd.addColorStop(0, face[0]); grd.addColorStop(0.55, face[1]); grd.addColorStop(1, face[2]);
  g.fillStyle = grd; g.strokeStyle = NAVY; g.lineWidth = 3;
  g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.stroke();
}

function drawNode(g, n, i, current) {
  const lv = n.lv, open = S.Levels.unlocked(lv), stars = S.Levels.starsOf(lv.id);
  let x = n.x;
  if (MAP.shakeI === i && S.gtime - MAP.shakeT < 0.35) x += Math.sin((S.gtime - MAP.shakeT) * 60) * 5;
  const pulse = current ? 1 + Math.sin(S.gtime * 5) * 0.05 : 1, r = n.r * 1.06 * pulse;
  if (current) {                                   // le niveau à jouer : un halo qui respire
    const glow = g.createRadialGradient(x, n.y, r * 0.6, x, n.y, r * 2);
    glow.addColorStop(0, 'rgba(255,240,150,0.85)'); glow.addColorStop(1, 'rgba(255,240,150,0)');
    g.fillStyle = glow; g.beginPath(); g.arc(x, n.y, r * 2, 0, TAU); g.fill();
  }
  if (MAP.sel === i && S.mapKeys) { g.strokeStyle = '#FFFFFF'; g.lineWidth = 4; rrp(g, x - r * 1.3, n.y - r * 1.3, r * 2.6, r * 2.6 + r * 0.2, r * 0.6); g.stroke(); }
  g.fillStyle = 'rgba(20,26,110,0.25)'; g.beginPath(); g.ellipse(x, n.y + r * 1.25, r * 1.05, r * 0.26, 0, 0, TAU); g.fill();
  drawTile(g, x, n.y, r, !open ? TILE.locked : lv.boss ? TILE.boss : TILE.open);
  if (!open) drawPadlock(g, x, n.y + r * 0.02, r * 0.85);
  else if (lv.boss && lv.bossKind === 'farceur') { g.fillStyle = '#FFD23A'; g.beginPath(); g.arc(x, n.y, r * 0.62, 0, TAU); g.fill(); S.drawGroucho(x, n.y, r * 0.62, 1, 1); }
  else if (lv.boss) drawBossFace(g, x, n.y, r * 0.78);
  else inkText(g, String(lv.num), x, n.y + r * 0.04, r * 1.05, TILE.open[3]);
  for (let k = 0; k < 3; k++) {                    // 3 étoiles au-dessus, en arc
    const sx = x + (k - 1) * r * 0.7, sy = n.y - r * 1.16 - (k === 1 ? r * 0.2 : 0);
    drawStarShape(sx, sy, r * 0.34, k < stars ? '#FFD23A' : 'rgba(255,255,255,0.8)', (k - 1) * 0.25);
  }
  if (lv.boss) inkText(g, L.bossTag, x, n.y + r * 1.42, r * 0.38, TILE.boss[3]);
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
  const x = safe.l + S.pillX + 16, y = safe.t + 22, fs = clamp(Lt.U * 0.05, 15, 23);
  const hx = safe.l + S.pillX + 6, hy = safe.t + 4, hw = S.W - safe.l - S.pillX - safe.r - S.pillR - 80 * S.uiZoom, hh = MAP.area.head - safe.t - 12;
  g.fillStyle = NAVY; rrp(g, hx, hy + 5, hw, hh, 20); g.fill();               // panneau bleu, tranche en bas
  const grd = g.createLinearGradient(0, hy, 0, hy + hh);
  grd.addColorStop(0, '#5965FF'); grd.addColorStop(1, '#2F3BD6');
  g.fillStyle = grd; g.strokeStyle = NAVY; g.lineWidth = 3; rrp(g, hx, hy, hw, hh, 20); g.fill(); g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.22)'; rrp(g, hx + 10, hy + 4, hw - 20, 5, 3); g.fill();
  g.textAlign = 'left'; g.textBaseline = 'middle';
  g.font = `900 ${fs}px ${S.FONT}`;
  const title = `${L.worldN(w.id)} · ${tr(w.name)}`;
  otext(title, x, y, fit(title, fs, S.W - 160 * S.uiZoom - safe.r - S.pillR - x), '#FFFFFF');
  g.textAlign = 'right';
  const sx = S.W - safe.r - S.pillR - 90 * S.uiZoom;                    // compteur d'étoiles du monde
  otext(`${tot}/${max}`, sx, y, fs * 0.9, '#FFE066');
  g.font = `900 ${fs * 0.9}px ${S.FONT}`;
  drawStarShape(sx - g.measureText(`${tot}/${max}`).width - fs * 0.62, y, fs * 0.5, '#FFD23A', 0);
  for (const t of MAP.tabs) {                       // les 5 mondes : ronds bleus (le monde affiché en jaune)
    const on = t.w.id === MAP.world, soon = t.w.soon || !S.Levels.worldOpen(t.w), cy = t.y + 18;
    if (MAP.unlock && MAP.unlock.id === t.w.id && S.gtime - MAP.unlock.t0 < 0.75) continue;   // l'animation le dessine
    drawRoundBtn(g, t.x, cy, t.r, soon ? ['#C9CEE0', '#9AA1BE', '#7A819F'] : on ? ['#FFF1A6', '#FFD23A', '#F2A900'] : BLUE);
    g.textAlign = 'center';
    if (soon) drawPadlock(g, t.x, cy + 1, t.r * 0.8);
    else { g.font = `${t.r * 0.95}px ${S.FONT}`; g.fillText(t.w.emoji, t.x, cy + 1); }
    if (soon) { const lab = t.w.soon ? L.soon : `★ ${t.w.need.stars}`; otext(lab, t.x, cy + t.r + 11, Math.max(9, t.r * 0.42), t.w.soon ? '#FFFFFF' : '#FFE066'); }
    else inkText(g, String(t.w.id), t.x + t.r * 0.78, cy - t.r * 0.72, t.r * 0.55, NAVY);
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
