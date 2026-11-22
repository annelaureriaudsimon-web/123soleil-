/* js/render/levelhud.js — HUD du mode Niveaux : barre de progression jusqu'à l'arrivée (avec les rivaux),
   ta position (« 2e/4 »), la distance restante, les indications du tutoriel et les bannières.
   Pour le boss, la barre devient sa barre de vie : plus tu approches, plus il faiblit. */
(function (S) {
'use strict';
const { INK, TAU, clamp, lerp, easeIn, css, L, Lt, safe, rrp, otext, fit, drawBanner, rivalOutfit, KIND_COL } = S;

// ---------- Réglages ----------
const BAR_H = 14;              // hauteur de la barre (px)
const RIGHT_FREE = 122;        // place laissée à droite pour les boutons ronds (px)

function drawLevelHUD() {
  const LV = S.Levels, m = LV.m;
  if (!m) return;
  const g = S.ctx, def = m.level, boss = !!def.boss;
  const x0 = 14 + safe.l + S.pillX, x1 = Lt.land ? Math.min(x0 + S.W * 0.3, Lt.cx - Lt.R * 1.6) : S.W - RIGHT_FREE * S.uiZoom - safe.r - S.pillR;   // paysage : le chant reste lisible ; pillX : la pilule Poki
  const y = safe.t + 16, w = Math.max(60, x1 - x0);
  const k = clamp(m.player.z / def.length, 0, 1);
  // la barre
  g.fillStyle = 'rgba(43,45,66,0.55)'; rrp(g, x0 - 3, y - 3, w + 6, BAR_H + 6, (BAR_H + 6) / 2); g.fill();
  g.fillStyle = boss ? '#7A1F2B' : 'rgba(255,255,255,0.35)'; rrp(g, x0, y, w, BAR_H, BAR_H / 2); g.fill();
  if (boss) {                                       // barre de vie du boss : ce qui reste à parcourir
    g.fillStyle = '#FF4D6D'; rrp(g, x0 + w * k, y, Math.max(BAR_H, w * (1 - k)), BAR_H, BAR_H / 2); g.fill();
  } else { g.fillStyle = '#FFD166'; rrp(g, x0, y, Math.max(BAR_H, w * k), BAR_H, BAR_H / 2); g.fill(); }
  // les rivaux (petits points) puis toi (gros point), sur la barre
  for (const rv of m.rivals) {
    const rk = rv.state === 'done' ? 1 : clamp(rv.z / def.length, 0, 1);
    g.fillStyle = css(rv.state === 'grilled' ? '#2A2524' : rivalOutfit(rv).body); g.strokeStyle = INK; g.lineWidth = 2;
    g.beginPath(); g.arc(x0 + w * rk, y + BAR_H / 2, BAR_H * 0.42, 0, TAU); g.fill(); g.stroke();
  }
  g.fillStyle = css(S.outfitById(S.wornOutfit()).body); g.strokeStyle = '#FFFFFF'; g.lineWidth = 3;
  g.beginPath(); g.arc(x0 + w * k, y + BAR_H / 2, BAR_H * 0.62, 0, TAU); g.fill(); g.stroke();
  // l'arrivée : un petit soleil
  g.font = `${BAR_H * 1.5}px ${S.FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  const farceur = def.bossKind === 'farceur';
  g.fillText(boss ? (farceur ? '🤡' : '😎') : '☀️', x1 + BAR_H * 0.2, y + BAR_H / 2 + 1);
  // position et distance restante
  const fs = clamp(Lt.U * 0.075, 22, 38), ty = y + BAR_H + 10 + fs * 0.55;
  const total = m.rivals.length + 1;
  g.textAlign = 'left';
  if (total > 1) {
    const place = m.result && m.result.win ? m.result.place : S.Match.place(m);
    otext(L.posOf(place, total), x0, ty, fs, place === 1 ? '#FFD166' : '#FFFFFF');
  }
  const rem = Math.max(0, Math.ceil(def.length - m.player.z));
  g.font = `900 ${fs * 0.62}px ${S.FONT}`;
  const lab = boss ? `${farceur ? L.bossBar2 : L.bossBar} · ${L.toGo(rem)}` : L.toGo(rem);
  otext(lab, x0 + (total > 1 ? fs * 2.9 : 0), ty + fs * 0.05, fs * 0.62, boss ? '#FF8FA3' : '#FFFFFF');
  S.drawPressureHUD(x0, x1, ty + fs * 0.62, fs);   // v2.5 : jusqu'à la nuit, transats libres, boules de glace
  S.drawMountain();                                 // v2.5 : la montagne de glace, à l'arrivée
  // rivaux derrière toi
  S.drawBehind();
  // consigne dessinée (main qui appuie ou lève le doigt, ou touche Espace) et son mot : « MAINTIENS », « LÂCHE ! »…
  const hd = LV.hand;
  if (hd && (LV.phase === 'play' || LV.phase === 'ready')) {
    const age = S.gtime - hd.t0, a = Math.min(1, age / 0.2) * (hd.done ? Math.max(0, 1 - (S.gtime - hd.done) / 0.5) : 1);
    S.drawTut(hd.kind, a);
    const wa = hd.wordAt ? Math.max(0, Math.min(1, (S.gtime - hd.wordAt) / 0.2)) : 1;   // après un « OUPS ! », le mot attend son tour
    if (hd.text && wa > 0) S.drawTutWord(hd.text, hd.kind === 'release' ? '#FF8FA3' : '#FFD166', a * wa);
  }
  // niveau en douceur : des étoiles tournent autour de la tête après un « OUPS ! »
  if (LV.oops) drawDizzy(LV.oops.t);
  // « MAINTIENS pour courir » : reste tant qu'on n'a pas maintenu
  if (LV.hold && LV.phase === 'play') {
    const t = LV.hold.text, s = fit(t, Math.min(Lt.U * 0.085, 44), S.W * 0.86) * (1 + Math.sin(S.gtime * 6) * 0.04);
    g.textAlign = 'center';
    otext(t, Lt.cx, Lt.yFeet - Lt.s * 2.6, s, '#FFD166');
  }
  // v2.5 : la fausse alerte d'un rival (bulle de cri) ; l'indication de 1re rencontre se met dessous
  const alarmBot = S.drawAlarm();
  // 1re rencontre d'une tentation : une phrase courte au-dessus du coureur (ne cache ni le soleil ni la bannière)
  const tp = LV.tip;
  if (tp && S.gtime - tp.t0 < tp.life) {
    const k = S.gtime - tp.t0, a = Math.min(1, k / 0.15) * Math.min(1, (tp.life - k) / 0.3);
    const s = fit(tp.text, Math.min(Lt.U * 0.062, 32), S.W * 0.92) * (1 + Math.sin(S.gtime * 7) * 0.03);
    g.save(); g.globalAlpha = a; g.textAlign = 'center';
    otext(tp.text, Lt.cx, Math.max(Lt.yFeet - Lt.s * 2.45, alarmBot ? alarmBot + s * 0.9 : 0), s, '#FFD166');
    g.restore();
  }
  // monde 2 : signaux du soleil et tentations (render/tempt.js). v2.5 : derrière le nuage, ils ne se voient que dans le reflet
  const hide = clamp(S.cloudK * 1.5, 0, 1);
  if (hide < 0.99) { g.save(); g.globalAlpha *= 1 - hide; S.drawSunMarks(); g.restore(); }
  S.drawTaunt();
  // bannières (piège, hésitation, coups spéciaux du boss…)
  const b = LV.banner;
  if (b) drawBanner(b.title, b.sub, '', b.t, b.life, b.col);
  // le boss met ses lunettes
  if (LV.glass >= 0) { if (def.bossKind === 'farceur') S.drawGrouchoDrop(LV.glass); else drawGlassesDrop(LV.glass); }
}

// « OUPS ! » : trois petites étoiles qui tournent au-dessus de la tête, puis s'en vont
function drawDizzy(t) {
  const g = S.ctx, a = Math.min(1, t / 0.15) * Math.max(0, Math.min(1, (1.4 - t) / 0.4));
  if (a <= 0) return;
  const cx = Lt.cx, cy = Lt.yFeet - Lt.s * 1.85 - S.Levels.jump, rx = Lt.s * 0.42, ry = Lt.s * 0.13;
  g.save(); g.globalAlpha = a;
  for (let i = 0; i < 3; i++) {
    const ang = t * 7 + i * TAU / 3;
    S.drawStarShape(cx + Math.cos(ang) * rx, cy + Math.sin(ang) * ry, Lt.s * (0.09 + 0.03 * Math.sin(ang)), '#FFD23A', ang);
  }
  g.restore();
}

// Les lunettes noires descendent du ciel jusque sur les yeux du soleil
function drawGlassesDrop(k) {
  const g = S.ctx, R = Lt.R, ty = Lt.sunY + S.watcher.offY + S.sunSink - R * 0.16;
  const yy = lerp(-R * 1.2, ty, easeIn(clamp(k, 0, 1)));
  g.save(); g.translate(Lt.cx, yy); g.rotate((1 - k) * 0.5 * Math.sin(S.gtime * 5));
  g.fillStyle = '#16161F'; g.strokeStyle = INK; g.lineWidth = Math.max(2, R * 0.05);
  for (const sd of [-1, 1]) { rrp(g, sd * R * 0.36 - R * 0.27, -R * 0.15, R * 0.54, R * 0.32, R * 0.12); g.fill(); g.stroke(); }
  g.fillRect(-R * 0.1, -R * 0.07, R * 0.2, R * 0.06);
  g.fillStyle = 'rgba(255,255,255,0.35)';
  for (const sd of [-1, 1]) { g.beginPath(); g.ellipse(sd * R * 0.36 - R * 0.1, -R * 0.05, R * 0.08, R * 0.04, -0.5, 0, TAU); g.fill(); }
  g.restore();
}

S.drawLevelHUD = drawLevelHUD;
})(window.Soleil);
