/* js/render/rivals.js — Dessin des rivaux du mode Niveaux : en perspective, chacun dans son couloir,
   avec son prénom, et l'animation comique quand il est grillé (il tombe ou il trépigne).
   Ceux qui sont derrière toi (hors de l'écran) apparaissent dans un petit indicateur en bas à gauche. */
(function (S) {
'use strict';
const { CAM_BACK, FAR, VMAX0, INK, clamp, lerp, easeOut, css, outfitById, Lt, safe, yAt, otext, fit, drawRunnerFig, rrp, PROFILES } = S;

// ---------- Réglages ----------
const KIND_COL = { prudent: '#8CF5B5', fonceur: '#FFB25C', regulier: '#7FD3FF' };   // couleur de l'étiquette
const NEAR_MIN = 1.2;          // plus près de la caméra que ça (m) : on ne le dessine plus
const LABEL_SC = 7;            // en dessous de cette taille (px/m), pas d'étiquette
const BEHIND_MAX = 4;          // indicateur : au plus 4 rivaux

const looks = new Map();       // tenue complète de chaque rival (tenue du jeu + ses couleurs), calculée une fois
function rivalOutfit(rv) {
  const key = rv.def;
  if (!looks.has(key)) { const lk = rv.def.look || {}; looks.set(key, Object.assign({}, outfitById(lk.outfit), lk)); }
  return looks.get(key);
}

// Position à l'écran des pieds d'un rival (vis : est-il visible ?)
function rivalScreen(rv) {
  const camZ = S.runner.z - CAM_BACK, dz = rv.z - camZ, d = Math.max(0.6, dz), sc = Lt.F / d;
  return { vis: dz >= NEAR_MIN && dz < FAR, dz, sc, x: Lt.cx + (rv.lane + (rv.jx || 0)) * sc, y: yAt(d) };
}

// Dessine les rivaux plus loin que toi (near = false) ou plus près de la caméra que toi (near = true), du loin vers le près
function drawRivals(near) {
  const m = S.Levels.m; if (!m) return;
  const pz = S.runner.z;
  const list = m.rivals.filter(rv => (near ? rv.z < pz : rv.z >= pz)).sort((a, b) => b.z - a.z);
  for (const rv of list) {
    const p = rivalScreen(rv);
    if (!p.vis) continue;
    const g = S.ctx;
    g.save();
    let ph = rv.phase, sp = clamp(rv.v / VMAX0, 0, 1);
    if (rv.state === 'grilled' && rv.burnT > 0.35) {             // la petite animation comique
      const k = clamp((rv.burnT - 0.35) / 0.3, 0, 1);
      if (rv.anim === 'fall') {                                  // il tombe sur le côté… boum
        g.translate(p.x, p.y); g.rotate(easeOut(k) * 1.42 * (rv.lane < 0 ? -1 : 1)); g.translate(-p.x, -p.y);
      } else {                                                   // il trépigne de rage
        g.translate(0, -Math.abs(Math.sin(rv.burnT * 17)) * 0.16 * p.sc * k);
        ph = rv.burnT * 26; sp = 0.7 * k;
      }
    }
    if (rv.state === 'done') g.translate(0, -Math.abs(Math.sin(S.gtime * 9 + rv.idx)) * 0.2 * p.sc);   // il saute de joie
    drawRunnerFig(g, p.x, p.y, p.sc, { sp, ph, st: rv.statue, tz: rv.toast, t: S.gtime }, rivalOutfit(rv), false, '');
    g.restore();
    if (rv.state === 'grilled' && rv.anim === 'stomp' && rv.burnT > 0.4 && p.sc > LABEL_SC) {   // petite vapeur de colère
      const a = clamp(1 - (rv.burnT - 0.4) / 1.0, 0, 1);
      g.fillStyle = css('#FFFFFF', 0.7 * a);
      for (let i = 0; i < 2; i++) { g.beginPath(); g.arc(p.x + (i ? 0.3 : -0.3) * p.sc, p.y - (1.95 + ((S.gtime * 1.5 + i * 0.5) % 1) * 0.5) * p.sc, 0.09 * p.sc, 0, Math.PI * 2); g.fill(); }
    }
    if (S.showcase) { /* vitrine (dev) : pas de bulles ni de prénoms */ }
    else if (rv.say && S.gtime < rv.sayUntil && p.sc > LABEL_SC * 0.8) drawBubble(g, rv.say, p.x, p.y - 1.95 * p.sc, clamp(p.sc * 0.24, 11, 20));
    else if (p.sc > LABEL_SC && m.result === null) {             // prénom + personnalité au-dessus de la tête
      const fs = clamp(p.sc * 0.26, 11, 24), emo = (PROFILES[rv.kind] || {}).emoji || '';
      g.font = `900 ${fs}px ${S.FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      otext(`${emo} ${rv.name}`, p.x, p.y - 1.78 * p.sc - fs * 0.35, fs, rv.state === 'grilled' ? '#FF7A3D' : KIND_COL[rv.kind] || '#FFFFFF');
    }
  }
}

// Bulle de BD au-dessus d'un rival
function drawBubble(g, text, x, y, fs) {
  g.font = `900 ${fs}px ${S.FONT}`;
  const w = g.measureText(text).width + fs * 1.1, h = fs * 1.7, bx = clamp(x - w / 2, 4, S.W - w - 4), by = y - h;
  g.fillStyle = '#FFFFFF'; g.strokeStyle = INK; g.lineWidth = 2.5;
  rrp(g, bx, by, w, h, h / 2); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(x - fs * 0.3, by + h - 1); g.lineTo(x, by + h + fs * 0.55); g.lineTo(x + fs * 0.25, by + h - 1); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(x - fs * 0.3, by + h); g.lineTo(x, by + h + fs * 0.55); g.lineTo(x + fs * 0.25, by + h); g.stroke();
  g.fillStyle = INK; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, bx + w / 2, by + h / 2 + 1);
}

// Le regard qui grille, vers chaque rival pris
function drawRivalBeams() {
  const m = S.Levels.m; if (!m) return;
  const R = Lt.R, cy = Lt.sunY + S.watcher.offY, g = S.ctx;
  g.lineCap = 'round';
  for (const rv of m.rivals) {
    if (rv.state !== 'grilled' || rv.burnT > 0.9) continue;
    const p = rivalScreen(rv); if (!p.vis) continue;
    const grow = clamp(rv.burnT / 0.3, 0, 1), fade = 1 - clamp((rv.burnT - 0.45) / 0.45, 0, 1);
    const tx = p.x, ty = p.y - p.sc * 0.75, lw = Math.min(p.sc, Lt.s);
    for (const sd of [-1, 1]) {
      const ex = Lt.cx + sd * R * 0.36, ey = cy - R * 0.14, ix = lerp(ex, tx, grow), iy = lerp(ey, ty, grow);
      g.strokeStyle = `rgba(255,120,60,${0.45 * fade})`; g.lineWidth = lw * 0.3;
      g.beginPath(); g.moveTo(ex, ey); g.lineTo(ix, iy); g.stroke();
      g.strokeStyle = `rgba(255,240,170,${0.9 * fade})`; g.lineWidth = lw * 0.1;
      g.beginPath(); g.moveTo(ex, ey); g.lineTo(ix, iy); g.stroke();
    }
  }
}

// Les rivaux derrière toi, hors de l'écran : « ▼ Léo −12 m »
function drawBehind() {
  const m = S.Levels.m; if (!m || m.result) return;
  const camZ = S.runner.z - CAM_BACK;
  const list = m.rivals.filter(rv => rv.state !== 'done' && rv.z - camZ < NEAR_MIN).sort((a, b) => b.z - a.z).slice(0, BEHIND_MAX);
  if (!list.length) return;
  const g = S.ctx, fs = clamp(Lt.U * 0.034, 12, 16), rowH = fs * 1.55, pad = 8;
  const x = 10 + safe.l, h = rowH * list.length + pad;
  const y0 = S.H - safe.b - 12 - h;
  g.font = `900 ${fs}px ${S.FONT}`;
  const w = Math.max(...list.map(rv => g.measureText(`${rv.name} −${Math.round(S.runner.z - (rv.state === 'grilled' ? 0 : rv.z))} m`).width)) + fs * 2.6;
  g.fillStyle = 'rgba(43,45,66,0.55)'; rrp(g, x, y0, w, h, 12); g.fill();
  list.forEach((rv, i) => {
    const cy = y0 + pad / 2 + rowH * (i + 0.5), o = rivalOutfit(rv);
    g.fillStyle = css(rv.state === 'grilled' ? '#2A2524' : o.body); g.strokeStyle = INK; g.lineWidth = 2;
    g.beginPath(); g.arc(x + fs * 0.95, cy, fs * 0.5, 0, Math.PI * 2); g.fill(); g.stroke();
    g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = rv.state === 'grilled' ? '#FF9F7A' : '#FFFFFF';
    const back = Math.round(S.runner.z - (rv.state === 'grilled' ? 0 : rv.z));
    g.fillText(`${rv.name} −${back} m`, x + fs * 1.75, cy + 1);
  });
}

Object.assign(S, { rivalOutfit, rivalScreen, drawRivals, drawRivalBeams, drawBehind, KIND_COL });
})(window.Soleil);
