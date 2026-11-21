/* js/modes/duo.js — Mode 2 joueurs : même soleil, deux couloirs */
(function (S) {
'use strict';
const { ACC, CAM_BACK, DEC, DUO_FINISH, DUO_INTRO, DUO_LANE, DUO_RESPAWN, DUO_WIN, FAR, FONT, INK, PATH_W,
  RET_DUR, V_EPS, VMAX0, L, OUTFITS, $, clamp, css, esc, finePointer, lerp, mix, vibrate, mulberry32, pal, Sound,
  SAY, Voice, Lt, over, safe, duoPtr, newRunner, newWatcher, randomSeed, setRunSeed, updateWatcher, confetti,
  popup, smokeAt, fit, otext, otextC, rrp, yAt, drawRunnerFig, drawBanner, toast, refreshUI } = S;   // déjà chargés

$('rematch').addEventListener('click', e => { e.stopPropagation(); Sound.unlock(); $('rematch').blur(); startDuo(); });
$('rematch').addEventListener('pointerdown', e => e.stopPropagation());

/* ---------- 27. Mode 2 joueurs : même soleil, même chant, deux couloirs ---------- */
const DUO_COL = ['#EF476F', '#118AB2'];            // J1 rouge (Classique), J2 bleu (Casquette)
const DUO_TXT = ['#FF8FA3', '#7FD3FF'];            // couleurs des étiquettes
const DUO_KEY = ['A', 'L'];
S.deTimer = 0;
function newRacer(i) {
  return { i, z: 0, v: 0, phase: 0, step: 0, statue: 0, jx: 0, toast: 0, resp: 0, burnT: 9, sizzled: true,
           needRelease: false, pressed: false };
}
function racerHeld(i) {                            // ce joueur maintient-il son côté de l'écran (ou sa touche) ?
  if (S.duoKeys[i]) return true;
  for (const p of duoPtr.values()) if (p === i) return true;
  return false;
}
function racerScreen(r) {                          // position de ses pieds à l'écran
  const dz = Math.max(0.6, r.z - S.duoCam), sc = Lt.F / dz;
  return { dz, sc, x: Lt.cx + ((r.i ? 1 : -1) * DUO_LANE + r.jx) * sc, y: yAt(dz) };
}
const duoScore = () => `${L.pName[0]} ${S.duo.wins[0]} – ${S.duo.wins[1]} ${L.pName[1]}`;
const endLen = () => (S.duo.wins[S.duo.winner] >= DUO_WIN ? 1.6 : 2.6);   // durée de l'écran de fin de manche
function startDuo() {                              // nouveau match (ou revanche)
  Sound.unlock();
  S.mode = 'duo'; S.state = 'duo';
  S.duo = { round: 0, wins: [0, 0], phase: 'intro', t: 0, racers: [newRacer(0), newRacer(1)], winner: -1, tips: [] };
  clearTimeout(S.armTimer); clearTimeout(S.deTimer);
  over.classList.remove('show', 'armed'); $('duoEnd').classList.remove('show', 'armed');
  S.runner = newRunner();
  S.particles = []; S.shake = 0; S.flash = 0; S.timeScale = 1;
  S.phaseTitle = null; S.bossBanner = null; S.bossQueue = []; S.trapWatch = null; S.combo = 0;
  startDuoRound();
  refreshUI();
}
function startDuoRound() {
  const d = S.duo;
  d.round++; d.phase = 'intro'; d.t = 0; d.winner = -1;
  d.racers = [newRacer(0), newRacer(1)];
  S.duoCam = -CAM_BACK;
  setRunSeed(randomSeed());                        // un chant différent à chaque manche
  S.rng = mulberry32(S.runSeed);
  const rayA = S.watcher.rayA;
  S.watcher = newWatcher(); S.watcher.rayA = rayA;     // le soleil attend, de dos
  S.runT = 0; S.cycleN = 0; S.tutorial = false;
}
function updateDuo(dt) {
  const d = S.duo;
  d.t += dt;
  if (d.phase === 'intro' && d.t >= DUO_INTRO) {   // GO !
    d.phase = 'play'; d.t = 0;
    const w = S.watcher; w.state = 'pause'; w.t = 0; w.pauseDur = 1.0;
    popup(L.go, Lt.cx, Lt.chantY, '#06D6A0', fit(L.go, Lt.chantSize * 1.1, S.W * 0.8), 0.9);
    Sound.start(); vibrate(25);
  }
  for (const r of d.racers) updateRacer(r, dt);
  if (d.phase === 'play') {
    S.runT += dt;
    updateWatcher(dt);                             // même soleil pour les deux : chaque joueur est vérifié à part
    let win = -1;
    for (const r of d.racers) if (r.resp <= 0 && r.z >= DUO_FINISH && (win < 0 || r.z > d.racers[win].z)) win = r.i;
    if (win >= 0) roundWon(win);
  } else if (d.phase === 'roundEnd' || d.phase === 'over') calmWatcher(dt);
  if (d.phase === 'roundEnd' && d.t >= endLen()) {
    if (d.wins[d.winner] >= DUO_WIN) showDuoEnd(); else startDuoRound();
  }
  const target = Math.min(d.racers[0].z, d.racers[1].z) - CAM_BACK;   // la caméra suit le joueur de derrière
  S.duoCam = target > S.duoCam ? target : S.duoCam + (target - S.duoCam) * Math.min(1, dt * 5);
}
function updateRacer(r, dt) {
  const held = racerHeld(r.i);
  if (!held) r.needRelease = false;                // après un retour au départ, il faut d'abord relâcher
  r.burnT += dt;
  if (r.resp > 0) {                                // grillé : rayon, tout noir, fumée… puis retour au départ
    r.v = 0;
    const p = racerScreen(r);
    if (!r.sizzled && r.burnT >= 0.3) {
      r.sizzled = true; r.toast = 0.01; S.shake = Lt.U * 0.02;
      Sound.sizzle(); vibrate([70, 40, 140]); smokeAt(p.x, p.y - p.sc * 0.9, p.sc, 12, true);
    }
    if (r.toast > 0) { r.toast = Math.min(1, r.toast + dt * 6); if (Math.random() < dt * 7) smokeAt(p.x, p.y - p.sc * 0.9, p.sc, 1, false); }
    r.statue += (1 - r.statue) * Math.min(1, dt * 10);
    r.jx = r.toast > 0 && r.burnT < 0.8 ? (Math.random() - 0.5) * 0.05 : 0;
    r.resp -= dt;
    if (r.resp <= 0) {                             // pouf ! retour à 0 m
      smokeAt(p.x, p.y - p.sc * 0.7, p.sc, 8, false);
      Object.assign(r, { resp: 0, z: 0, v: 0, toast: 0, statue: 0, jx: 0, phase: 0, needRelease: held });
      const t = L.back(L.pName[r.i]);
      popup(t, S.W * (r.i ? 0.75 : 0.25), Lt.hy + (Lt.yFeet - Lt.hy) * 0.3, DUO_TXT[r.i], fit(t, Math.min(Lt.U * 0.045, 22), S.W * 0.46), 1.4);
    }
    return;
  }
  const go = S.duo.phase === 'play' && held && !r.needRelease, pv = r.v;
  r.v = go ? Math.min(VMAX0, r.v + ACC * dt) : Math.max(0, r.v - DEC * dt);   // pas de boue ni de verglas
  r.z += (pv + r.v) * 0.5 * dt;
  r.phase += r.v * dt * 1.6;
  const step = Math.floor(r.phase / Math.PI);
  if (step !== r.step) { r.step = step; if (r.v > 1.5) Sound.step(); }
  if (!go && r.pressed && pv > 3) Sound.skid();
  r.pressed = go;
  const w = S.watcher;
  const eyes = w.state === 'look' || w.state === 'peek' || w.state === 'hop' || (w.state === 'turn' && w.turnP > 0.55);
  r.statue += ((eyes && r.v === 0 ? 1 : 0) - r.statue) * Math.min(1, dt * 12);
  r.jx = r.statue > 0.5 ? (Math.random() - 0.5) * 0.022 : 0;
}
function duoLookCheck(first) {                     // le soleil regarde : chaque joueur qui bouge est grillé
  if (!S.duo || S.duo.phase !== 'play') return;
  const why = S.watcher.second ? 'hop' : first ? 'running' : 'early';
  for (const r of S.duo.racers) if (r.resp <= 0 && r.v > V_EPS) duoCaught(r, why);
}
function duoCaught(r, why) {                       // pas éliminé : l'autre continue pendant ce temps
  if (r.resp > 0) return;
  const tip = why === 'hop' ? L.tipHop : why === 'running' ? L.tipSo : L.tipLook;
  if (!S.duo.tips.includes(tip)) { S.duo.tips.push(tip); toast(`${L.pName[r.i]} · ${tip}`); }   // une astuce par erreur et par match
  r.resp = DUO_RESPAWN; r.burnT = 0; r.sizzled = false; r.v = 0; r.pressed = false;
  S.watcher.angryUntil = S.gtime + 1.1;
  Sound.busted(); vibrate(50);
  Voice.quip(SAY.grilled, S.watcher.type === 'moon');
  const p = racerScreen(r), t = L.burnt(L.pName[r.i]);
  const x = r.i ? clamp(p.x, S.W * 0.62, S.W * 0.84) : clamp(p.x, S.W * 0.16, S.W * 0.38);
  popup(t, x, clamp(p.y - p.sc * 2.2, Lt.hy + 30, S.H * 0.75), '#FF7A3D', fit(t, Math.min(Lt.U * 0.07, 36), S.W * 0.46), 1.3);
}
function roundWon(i) {
  const d = S.duo;
  d.phase = 'roundEnd'; d.t = 0; d.winner = i; d.wins[i]++;
  confetti(60); Sound.record(); vibrate([40, 30, 40]);
}
function showDuoEnd() {                            // « J2 GAGNE ! 🏆 », score, revanche
  const d = S.duo, i = d.winner, el = $('duoEnd');
  d.phase = 'over'; d.t = 0;
  $('deTitle').textContent = L.matchWin(L.pName[i]);
  $('deTitle').style.color = DUO_TXT[i];
  $('deScore').innerHTML = `<span style="color:${DUO_TXT[0]}">${esc(L.pName[0])}</span> ${d.wins[0]} – ${d.wins[1]} <span style="color:${DUO_TXT[1]}">${esc(L.pName[1])}</span>`;
  $('rematch').innerHTML = S.icon('restart') + S.esc(L.rematch); $('deHome').innerHTML = S.icon('home') + S.esc(L.duoHomeBtn);
  el.classList.remove('armed'); el.classList.add('show');
  confetti(110); Sound.mission(); vibrate([60, 40, 60, 40, 120]);
  clearTimeout(S.deTimer);
  S.deTimer = setTimeout(() => { if (S.state === 'duo' && S.duo && S.duo.phase === 'over') el.classList.add('armed'); }, 600);
}
function calmWatcher(dt) {                         // fin de manche : le soleil se remet de dos et attend
  const w = S.watcher;
  if (w.state === 'turn' || w.state === 'look' || w.state === 'peek' || w.state === 'hop') {
    w.calmFrom = w.turnP; w.state = 'return'; w.t = 0; w.retTo = 0; w.text = ''; Sound.unwhoosh();
  } else if (w.state === 'chant' || w.state === 'pause' || w.state === 'swap') { w.state = 'idle'; w.text = ''; }
  if (w.state === 'return') {
    w.t += dt;
    w.turnP = lerp(w.calmFrom == null ? 1 : w.calmFrom, 0, clamp(w.t / RET_DUR, 0, 1));
    if (w.t >= RET_DUR) { w.turnP = 0; w.state = 'idle'; w.calmFrom = null; w.text = ''; }
  }
}

// Dessin du mode 2 joueurs
function drawFinish(camZ, at = DUO_FINISH) {       // ligne d'arrivée à damier + banderole « ARRIVÉE » (2 joueurs, niveaux)
  const dz = at - camZ;
  if (dz < 1.5 || dz > FAR) return;
  const sc = Lt.F / dz, y = yAt(dz), fog = Math.pow(clamp(dz / FAR, 0, 1), 0.7);
  const n = 10, cw = PATH_W * 2 / n;
  for (let row = 0; row < 2; row++) {              // 2 rangées de 10 cases
    const z1 = dz + row * cw, z2 = z1 + cw, y1 = yAt(z1), y2 = yAt(z2), s1 = Lt.F / z1, s2 = Lt.F / z2;
    for (let k = 0; k < n; k++) {
      const xa = -PATH_W + k * cw, xb = xa + cw;
      S.ctx.fillStyle = mix((k + row) % 2 ? INK : '#FFFFFF', pal.haze, fog);
      S.ctx.beginPath(); S.ctx.moveTo(Lt.cx + xa * s1, y1 + 0.5); S.ctx.lineTo(Lt.cx + xb * s1, y1 + 0.5);
      S.ctx.lineTo(Lt.cx + xb * s2, y2); S.ctx.lineTo(Lt.cx + xa * s2, y2); S.ctx.closePath(); S.ctx.fill();
    }
  }
  const px = (PATH_W + 0.35) * sc, top = y - 2.7 * sc, bh = 0.6 * sc, wv = Math.sin(S.gtime * 5) * 0.06 * sc;
  S.ctx.strokeStyle = css(INK, 1 - fog); S.ctx.lineWidth = Math.max(1.5, 0.08 * sc); S.ctx.lineCap = 'round'; S.ctx.lineJoin = 'round';
  S.ctx.beginPath(); S.ctx.moveTo(Lt.cx - px, y); S.ctx.lineTo(Lt.cx - px, top); S.ctx.moveTo(Lt.cx + px, y); S.ctx.lineTo(Lt.cx + px, top); S.ctx.stroke();
  S.ctx.fillStyle = mix('#FFD166', pal.haze, fog); S.ctx.lineWidth = Math.max(1.2, 0.05 * sc);
  S.ctx.beginPath(); S.ctx.moveTo(Lt.cx - px, top); S.ctx.quadraticCurveTo(Lt.cx, top + wv, Lt.cx + px, top);
  S.ctx.lineTo(Lt.cx + px, top + bh); S.ctx.quadraticCurveTo(Lt.cx, top + bh + wv, Lt.cx - px, top + bh); S.ctx.closePath();
  S.ctx.fill(); S.ctx.stroke();
  if (sc > 3) {
    S.ctx.font = `900 ${0.4 * sc}px ${FONT}`;
    const fs = Math.min(0.4 * sc, 0.4 * sc * px * 1.7 / Math.max(1, S.ctx.measureText(L.finish).width));
    S.ctx.font = `900 ${fs}px ${FONT}`; S.ctx.textAlign = 'center'; S.ctx.textBaseline = 'middle';
    S.ctx.fillStyle = css(INK, 1 - fog); S.ctx.fillText(L.finish, Lt.cx, top + bh / 2 + wv * 0.5);
  }
}
function drawRacers(camZ) {                        // J1 (rouge) à gauche, J2 (bleu) à droite, étiquettes au-dessus
  const zMin = Math.min(S.duo.racers[0].z, S.duo.racers[1].z);
  const list = S.duo.racers.slice().sort((a, b) => b.z - a.z);   // du plus loin au plus près
  for (const r of list) {
    const dz = r.z - camZ;
    if (dz < 1.2) continue;
    const sc = Lt.F / dz, side = r.i ? 1 : -1, x = Lt.cx + (side * DUO_LANE + r.jx) * sc, y = yAt(dz);
    drawRunnerFig(S.ctx, x, y, sc, { sp: clamp(r.v / VMAX0, 0, 1), ph: r.phase, st: r.statue, tz: r.toast, t: S.gtime },
                  OUTFITS[r.i], false, String(r.i + 1));
    const gap = Math.round(r.z - zMin), name = L.pName[r.i];
    if (S.duo.phase === 'over') continue;            // la carte « J2 GAGNE ! » est par-dessus
    S.ctx.textBaseline = 'middle';
    if (gap >= 25) {                               // trop loin devant pour bien le voir : « J1 ▲ +45 m »
      const t = L.ahead(name, gap), fs = fit(t, Math.min(Lt.U * 0.05, 24), S.W * 0.44);
      S.ctx.font = `900 ${fs}px ${FONT}`;
      const tw = S.ctx.measureText(t).width;
      S.ctx.textAlign = 'center';
      otext(t, clamp(Lt.cx + side * (tw / 2 + fs * 0.5), tw / 2 + 8, S.W - tw / 2 - 8), y + fs * 0.95, fs, DUO_TXT[r.i]);
    } else {
      const fs = clamp(sc * 0.28, 13, 32);
      S.ctx.textAlign = 'center';
      otext(name, x, y - 1.72 * sc - fs * 0.35, fs, DUO_TXT[r.i]);
    }
  }
}
function drawDuoBeams() {                          // le regard qui grille, vers chaque joueur pris
  const R = Lt.R, cy = Lt.sunY + S.watcher.offY, moon = S.watcher.type === 'moon';
  S.ctx.lineCap = 'round';
  for (const r of S.duo.racers) {
    if (r.burnT > 0.9) continue;
    const grow = clamp(r.burnT / 0.3, 0, 1), fade = 1 - clamp((r.burnT - 0.45) / 0.45, 0, 1);
    const p = racerScreen(r), tx = p.x, ty = p.y - p.sc * 0.75, lw = Math.min(p.sc, Lt.s);
    for (const sd of [-1, 1]) {
      const ex = Lt.cx + sd * R * 0.36, ey = cy - R * 0.14, ix = lerp(ex, tx, grow), iy = lerp(ey, ty, grow);
      S.ctx.strokeStyle = moon ? `rgba(150,180,255,${0.5 * fade})` : `rgba(255,120,60,${0.45 * fade})`; S.ctx.lineWidth = lw * 0.35;
      S.ctx.beginPath(); S.ctx.moveTo(ex, ey); S.ctx.lineTo(ix, iy); S.ctx.stroke();
      S.ctx.strokeStyle = `rgba(255,240,170,${0.9 * fade})`; S.ctx.lineWidth = lw * 0.12;
      S.ctx.beginPath(); S.ctx.moveTo(ex, ey); S.ctx.lineTo(ix, iy); S.ctx.stroke();
    }
  }
}
function drawDuoHUD() {                            // distances, barres jusqu'à l'arrivée, score
  const fs = Math.min(Lt.U * 0.052, 26), left = 14 + safe.l, right = S.W - 122 - safe.r;
  const bw = Math.max(70, Math.min(190, (right - left) / 2 - 14));
  const rowY = safe.t + 12 + (Lt.land ? 0 : fs * 1.35);
  for (const r of S.duo.racers) {
    const x0 = r.i ? right - bw : left, name = L.pName[r.i] + ' ';
    S.ctx.textAlign = 'left'; S.ctx.textBaseline = 'top';
    S.ctx.font = `900 ${fs}px ${FONT}`;
    const nw = S.ctx.measureText(name).width;
    otext(name, x0, rowY, fs, DUO_TXT[r.i]);
    otext(`${Math.floor(Math.min(r.z, DUO_FINISH))} m`, x0 + nw + fs * 0.2, rowY, fs, r.resp > 0 ? '#FF7A3D' : '#FFFFFF');
    const by = rowY + fs * 1.22, bh = Math.max(8, fs * 0.36), k = clamp(r.z / DUO_FINISH, 0, 1);
    rrp(S.ctx, x0, by, bw, bh, bh / 2); S.ctx.fillStyle = 'rgba(255,255,255,0.9)'; S.ctx.fill();
    if (k > 0) { rrp(S.ctx, x0, by, Math.max(bh, bw * k), bh, bh / 2); S.ctx.fillStyle = DUO_COL[r.i]; S.ctx.fill(); }
    rrp(S.ctx, x0, by, bw, bh, bh / 2); S.ctx.strokeStyle = INK; S.ctx.lineWidth = 2.5; S.ctx.stroke();
  }
  // score « J1 1 – 0 J2 » : en morceaux, pour que le gros contour ne colle pas les caractères
  const parts = [[L.pName[0], DUO_TXT[0], 0.6], [String(S.duo.wins[0]), '#FFD166', 0.35], ['–', '#FFD166', 0.35],
                 [String(S.duo.wins[1]), '#FFD166', 0.6], [L.pName[1], DUO_TXT[1], 0]];
  const ss = fs * 1.05;
  S.ctx.font = `900 ${ss}px ${FONT}`;
  const ws = parts.map(p => S.ctx.measureText(p[0]).width);
  const total = ws.reduce((a, w, k) => a + w + parts[k][2] * ss, 0);
  let x = (left + right) / 2 - total / 2;
  const sy = Lt.land ? S.H - safe.b - ss * 0.95 : safe.t + 12 + ss * 0.55;
  S.ctx.textAlign = 'left'; S.ctx.textBaseline = 'middle';
  parts.forEach((p, k) => { otext(p[0], x, sy, ss, p[1]); x += ws[k] + p[2] * ss; });
}
function drawDuoOverlay() {                        // zones « maintiens ici », séparateur, fin de manche
  const d = S.duo, intro = d.phase === 'intro';
  const a = intro ? clamp(d.t / 0.2, 0, 1) * clamp((DUO_INTRO - d.t) / 0.35, 0, 1) : 0;
  if (a > 0) {
    S.ctx.fillStyle = `rgba(239,71,111,${(0.2 * a).toFixed(3)})`; S.ctx.fillRect(0, 0, S.W / 2, S.H);
    S.ctx.fillStyle = `rgba(17,138,178,${(0.2 * a).toFixed(3)})`; S.ctx.fillRect(S.W / 2, 0, S.W - S.W / 2, S.H);
  }
  const sy = intro ? 0 : Lt.hy;                    // fin séparateur au milieu
  S.ctx.fillStyle = `rgba(255,255,255,${(0.3 + 0.55 * a).toFixed(3)})`;
  S.ctx.fillRect(S.W / 2 - 1, sy, 2, S.H - sy);
  if (a > 0) {
    const rt = L.round(d.round), k = 1 + 0.3 * Math.exp(-d.t * 8);
    S.ctx.save(); S.ctx.translate(Lt.cx, Lt.chantY); S.ctx.scale(k, k);
    otextC(rt, fit(rt, Lt.chantSize, S.W * 0.8), '#FFD166', a); S.ctx.restore();
    const base = Math.min(Lt.U * 0.065, 32), maxW = S.W * 0.44, zy = Lt.hy + (Lt.yFeet - Lt.s * 1.6 - Lt.hy) * 0.5;
    for (const i of [0, 1]) {
      const zx = S.W * (i ? 0.75 : 0.25), name = L.pName[i];
      S.ctx.save(); S.ctx.translate(zx, zy);
      if (racerHeld(i)) otextC(L.ready, fit(L.ready, base * 1.1, maxW), '#8CF5B5', a);   // ce doigt est bien détecté
      else {
        const one = L.zone(name), s1 = fit(one, base, maxW);
        if (s1 >= 20) otextC(one, s1, DUO_TXT[i], a);
        else {                                     // petit écran : sur deux lignes
          S.ctx.translate(0, -base * 0.55); otextC(name, base * 1.15, DUO_TXT[i], a);
          S.ctx.translate(0, base * 1.15); otextC(L.zoneSub, fit(L.zoneSub, base * 0.85, maxW), '#FFFFFF', a);
        }
      }
      S.ctx.restore();
      if (finePointer()) {                         // au clavier : A et L
        const kt = L.keyHint(DUO_KEY[i]);
        S.ctx.save(); S.ctx.translate(zx, zy + base * 1.75); otextC(kt, fit(kt, base * 0.7, maxW), '#FFFFFF', a); S.ctx.restore();
      }
    }
  }
  if (d.phase === 'roundEnd' && d.winner >= 0) drawBanner(L.roundWin(L.pName[d.winner]), duoScore(), '', d.t, endLen(), DUO_TXT[d.winner]);
}

Object.assign(S, { DUO_COL, DUO_TXT, DUO_KEY, newRacer, racerHeld, racerScreen, duoScore, endLen, startDuo,
  startDuoRound, updateDuo, updateRacer, duoLookCheck, duoCaught, roundWon, showDuoEnd, calmWatcher, drawFinish,
  drawRacers, drawDuoBeams, drawDuoHUD, drawDuoOverlay });
})(window.Soleil);
