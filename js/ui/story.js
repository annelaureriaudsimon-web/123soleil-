/* js/ui/story.js — Image à partager (story 1080×1920) */
(function (S) {
'use strict';
const { CAM_BACK, CAM_H, FONT, INK, TAU, L, outfitById, DAY, computePalette, Sound, Lt, safe, viewZ, fit, otext,
  rrp, drawHills, drawSky, drawWatcher, drawDecor, drawGround, drawMarkers, drawPatches, drawRunnerFig, howLine,
  phaseLines, rankShareLine, toast } = S;   // déjà chargés

/* ---------- 26. Image à partager : une « story » 1080×1920 dessinée avec les outils du jeu ---------- */
function fitPlain(t, size, maxW, wt = 800) {       // taille de police pour que le texte tienne (sans contour)
  S.ctx.font = `${wt} ${size}px ${FONT}`;
  const w = S.ctx.measureText(t).width;
  return w > maxW ? size * maxW / w : size;
}
function plainText(t, x, y, size, maxW, col, wt = 800) {
  const s = fitPlain(t, size, maxW, wt);
  S.ctx.font = `${wt} ${s}px ${FONT}`; S.ctx.fillStyle = col; S.ctx.fillText(t, x, y);
}
function renderStory() {                           // la scène de ta défaite, en grand, façon affiche
  const R = S.lastRun;
  if (!R) return null;
  const c = document.createElement('canvas');
  c.width = 1080; c.height = 1920;
  const g = c.getContext('2d');
  if (!g) return null;
  const keep = { ctx: S.ctx, W: S.W, H: S.H, DPR: S.DPR, Lt: Object.assign({}, Lt), safe: Object.assign({}, safe) };
  try {
    S.ctx = g; S.W = 1080; S.H = 1920; S.DPR = 1;            // les fonctions de dessin du jeu dessinent sur la grande image
    safe.t = safe.r = safe.b = safe.l = 0;
    Object.assign(Lt, { U: 1080, land: false, cx: 540, hy: 800, yFeet: 1150, R: 165, sunY: 612, chantSize: 150, chantY: 330 });
    Lt.F = (Lt.yFeet - Lt.hy) * CAM_BACK / CAM_H; Lt.s = Lt.F / CAM_BACK;
    computePalette(R.dist);                          // le ciel de la phase où tu as perdu
    const camZ = R.dist - CAM_BACK;
    drawSky(); drawWatcher(); drawHills(); drawGround(camZ); drawPatches(camZ); drawMarkers(camZ); drawDecor(camZ);
    const ey = Lt.sunY - Lt.R * 0.14, ty = Lt.yFeet - Lt.s * 0.75, moon = S.watcher.type === 'moon';
    S.ctx.lineCap = 'round';
    for (const sd of [-1, 1]) {                      // le regard qui grille (adouci pour garder le visage lisible)
      const ex = Lt.cx + sd * Lt.R * 0.36;
      S.ctx.strokeStyle = moon ? 'rgba(150,180,255,0.3)' : 'rgba(255,120,60,0.28)'; S.ctx.lineWidth = Lt.s * 0.35;
      S.ctx.beginPath(); S.ctx.moveTo(ex, ey); S.ctx.lineTo(Lt.cx, ty); S.ctx.stroke();
      S.ctx.strokeStyle = 'rgba(255,240,170,0.5)'; S.ctx.lineWidth = Lt.s * 0.1;
      S.ctx.beginPath(); S.ctx.moveTo(ex, ey); S.ctx.lineTo(Lt.cx, ty); S.ctx.stroke();
    }
    drawRunnerFig(S.ctx, Lt.cx, Lt.yFeet, Lt.s, { sp: 0, ph: 0, st: 1, tz: 1, t: S.gtime }, outfitById(S.outfit), false,
                  R.mode === 'daily' ? String(DAY) : '');
    for (const [x, y, r, a] of [[0.06, -1.62, 0.13, 0.4], [-0.08, -1.84, 0.17, 0.33], [0.1, -2.08, 0.21, 0.26], [-0.04, -2.36, 0.25, 0.18]]) {
      S.ctx.fillStyle = `rgba(70,68,74,${a})`;         // petite colonne de fumée
      S.ctx.beginPath(); S.ctx.arc(Lt.cx + x * Lt.s, Lt.yFeet + y * Lt.s, r * Lt.s, 0, TAU); S.ctx.fill();
    }
    S.ctx.textAlign = 'center'; S.ctx.textBaseline = 'middle';
    const title = '1, 2, 3… ' + L.title2;
    S.ctx.save(); S.ctx.translate(540, 104); S.ctx.rotate(-0.03); otext(title, 0, 0, fit(title, 96, 1000), '#FFD166'); S.ctx.restore();
    const sub = R.mode === 'daily' ? L.storyDaily(DAY) : L.freeRun;
    otext(sub, 540, 196, fit(sub, 54, 900), '#FFFFFF');
    S.ctx.save(); S.ctx.translate(540, 352); S.ctx.rotate(-0.08); otext(L.caught, 0, 0, fit(L.caught, 162, 900), '#FF7A3D'); S.ctx.restore();
    const dist = `${R.dist} m`;
    otext(dist, 540, 1262, fit(dist, 220, 1000), '#FFFFFF');
    // panneau : grille par phases, comment tu t'es fait griller, rang
    const lines = phaseLines(R.events, 4), how = howLine(R), rank = rankShareLine(R);
    const link = /^https?:$/.test(location.protocol) ? (location.host + location.pathname).replace(/\/$/, '') : '';
    const lh = 74, panelH = 34 + lines.length * lh + 66 + 62 + 24;
    const totalH = panelH + (link ? 66 : 0), top = 1385 + Math.max(0, (1905 - 1385 - totalH) / 2);
    rrp(S.ctx, 60, top, 960, panelH, 46);
    S.ctx.fillStyle = 'rgba(43,45,66,0.88)'; S.ctx.fill(); S.ctx.lineWidth = 6; S.ctx.strokeStyle = INK; S.ctx.stroke();
    let y = top + 34 + lh / 2;
    for (const t of lines) { plainText(t, 540, y, 60, 900, '#FFFFFF', 400); y += lh; }
    y += 28; plainText(how, 540, y, 44, 900, '#FFD166', 800);
    y += 62; plainText(rank, 540, y, 46, 900, '#FFFFFF', 800);
    if (link) otext(link, 540, top + panelH + 44, fit(link, 38, 980), '#FFFFFF');
  } finally {                                        // on remet tout comme avant pour le jeu
    S.ctx = keep.ctx; S.W = keep.W; S.H = keep.H; S.DPR = keep.DPR;
    Object.assign(Lt, keep.Lt); Object.assign(safe, keep.safe);
    computePalette(viewZ());
  }
  return c;
}
function prepareStory() {                          // image préparée en avance : le partage part tout de suite au clic
  if (S.storyPromise) return S.storyPromise;
  const R = S.lastRun;
  S.storyPromise = new Promise(resolve => {
    let c = null;
    try { c = renderStory(); } catch (e) { c = null; }
    if (!c || !c.toBlob) { resolve(null); return; }
    c.toBlob(blob => {
      if (!blob) { resolve(null); return; }
      const name = `soleil-${R.mode === 'daily' ? 'defi-' + DAY + '-' : ''}${R.dist}m.png`;
      let f;
      try { f = new File([blob], name, { type: 'image/png' }); } catch (e) { f = blob; f.name = name; }
      if (S.lastRun === R) S.storyFile = f;
      resolve(f);
    }, 'image/png');
  });
  return S.storyPromise;
}
function downloadFile(file) {
  try {
    const url = URL.createObjectURL(file), a = document.createElement('a');
    a.href = url; a.download = file.name || 'soleil.png'; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    toast(L.imgSaved, true);
  } catch (e) { toast(L.imgFail, true); }
}
function shareImage() {                            // mobile : feuille de partage si possible, sinon téléchargement
  Sound.unlock();
  const send = file => {
    if (!file) { toast(L.imgFail, true); return; }
    let can = false;
    try { can = matchMedia('(pointer: coarse)').matches && !!navigator.canShare && navigator.canShare({ files: [file] }); } catch (e) { can = false; }
    if (can) navigator.share({ files: [file] }).catch(err => { if (!err || err.name !== 'AbortError') downloadFile(file); });
    else downloadFile(file);
  };
  if (S.storyFile) send(S.storyFile);
  else prepareStory().then(send);
}

Object.assign(S, { fitPlain, plainText, renderStory, prepareStory, downloadFile, shareImage });
})(window.Soleil);
