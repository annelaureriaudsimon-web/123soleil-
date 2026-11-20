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
  const x0 = 14 + safe.l, x1 = Lt.land ? Math.min(x0 + S.W * 0.3, Lt.cx - Lt.R * 1.6) : S.W - RIGHT_FREE - safe.r;   // paysage : le chant reste lisible
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
  g.fillStyle = css(S.outfitById(S.outfit).body); g.strokeStyle = '#FFFFFF'; g.lineWidth = 3;
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
  // rivaux derrière toi
  S.drawBehind();
  // « MAINTIENS pour courir » : reste tant qu'on n'a pas maintenu
  if (LV.hold && LV.phase === 'play') {
    const t = LV.hold.text, s = fit(t, Math.min(Lt.U * 0.085, 44), S.W * 0.86) * (1 + Math.sin(S.gtime * 6) * 0.04);
    g.textAlign = 'center';
    otext(t, Lt.cx, Lt.yFeet - Lt.s * 2.6, s, '#FFD166');
  }
  // 1re rencontre d'une tentation : une phrase courte au-dessus du coureur (ne cache ni le soleil ni la bannière)
  const tp = LV.tip;
  if (tp && S.gtime - tp.t0 < tp.life) {
    const k = S.gtime - tp.t0, a = Math.min(1, k / 0.15) * Math.min(1, (tp.life - k) / 0.3);
    const s = fit(tp.text, Math.min(Lt.U * 0.062, 32), S.W * 0.92) * (1 + Math.sin(S.gtime * 7) * 0.03);
    g.save(); g.globalAlpha = a; g.textAlign = 'center';
    otext(tp.text, Lt.cx, Lt.yFeet - Lt.s * 2.45, s, '#FFD166');
    g.restore();
  }
  // monde 2 : signaux du soleil et tentations (render/tempt.js)
  S.drawSneezeEyes(); S.drawFarceurFace(); S.drawPeekEye(); S.drawTrueEnd(); S.drawTaunt();
  // bannières (piège, hésitation, coups spéciaux du boss…)
  const b = LV.banner;
  if (b) drawBanner(b.title, b.sub, '', b.t, b.life, b.col);
  // le boss met ses lunettes
  if (LV.glass >= 0) { if (def.bossKind === 'farceur') S.drawGrouchoDrop(LV.glass); else drawGlassesDrop(LV.glass); }
}

// Les lunettes noires descendent du ciel jusque sur les yeux du soleil
function drawGlassesDrop(k) {
  const g = S.ctx, R = Lt.R, ty = Lt.sunY + S.watcher.offY - R * 0.16;
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
