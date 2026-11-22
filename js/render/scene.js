/* js/render/scene.js — Composition d’une image (render) */
(function (S) {
'use strict';
const { CAM_BACK, L, Lt, drawBeam, drawParticles, drawVignette, drawCloud, drawHills, drawSky, drawWatcher,
  drawDecor, drawGround, drawMarkers, drawPatches, drawRecord, drawGhost, drawRunner, ghostPos, drawStarItem,
  drawBanner, drawChant, drawGrille, drawHUD, drawReplayHint, drawTitle } = S;   // déjà chargés

function render() {
  if (S.state === 'map') { S.WorldMap.draw(); return; }           // carte du monde (mode Niveaux)
  S.ctx.setTransform(S.DPR, 0, 0, S.DPR, 0, 0);
  S.ctx.globalAlpha = 1;
  if (S.shake > 0.4) S.ctx.translate((Math.random() - 0.5) * S.shake, (Math.random() - 0.5) * S.shake);
  const isDuo = S.mode === 'duo' && !!S.duo;
  const isLvl = S.state === 'level' && !!S.Levels.m;               // un niveau en cours
  const camZ = isDuo ? S.duoCam : S.runner.z - CAM_BACK;
  drawSky();
  drawWatcher();
  drawCloud();
  drawHills();
  drawGround(camZ);
  if (!isDuo && !isLvl) drawPatches(camZ);
  drawMarkers(camZ);
  if (!isDuo && !isLvl) drawRecord(camZ);
  drawDecor(camZ);
  if (!isDuo && !isLvl) drawStarItem(camZ);
  if (isDuo) { S.drawFinish(camZ); S.drawRacers(camZ); }
  else if (isLvl) {                                                // arrivée, rivaux devant, toi, rivaux tout près derrière
    S.drawLevelMud(camZ);                                            // flaques de boue du niveau (monde 2)
    S.drawFinish(camZ, S.Levels.m.level.length);
    S.drawRivals(false);
    S.drawTemptStar(camZ);                                           // l'étoile tentatrice, devant toi
    const jy = S.Levels.jump, sp = S.Levels.spin;
    if (sp) {                                                        // niveau en douceur : la toupie du « OUPS ! »
      const py = Lt.yFeet - Lt.s * 0.8 - jy;
      S.ctx.save(); S.ctx.translate(Lt.cx, py); S.ctx.rotate(sp); S.ctx.translate(-Lt.cx, -py - jy); drawRunner(); S.ctx.restore();
    } else if (jy) { S.ctx.save(); S.ctx.translate(0, -jy); drawRunner(); S.ctx.restore(); } else drawRunner();
    S.drawRivals(true);
    S.drawFly();                                                     // la mouche, par-dessus le coureur
  }
  else {
    const gp = ghostPos(camZ);
    if (gp && gp.dz >= CAM_BACK) drawGhost(gp);
    drawRunner();
    if (gp && gp.dz < CAM_BACK) drawGhost(gp);
  }
  drawParticles(false);
  if (isDuo) S.drawDuoBeams(); else { drawBeam(); if (isLvl) S.drawRivalBeams(); }
  drawVignette();
  if (S.state === 'title') { if (!S.showcaseNoLogo) drawTitle(); }   // vitrine sans logo (mode de développement, absent du build)
  else if (isDuo) { drawChant(); S.drawDuoHUD(); S.drawDuoOverlay(); }
  else if (isLvl) { drawChant(); drawGrille(); if (!S.showcase) S.drawLevelHUD(); }   // vitrine : le jeu, sans l'interface
  else {
    drawChant(); drawGrille();
    if (S.bossBanner) drawBanner(L.bossTitle, L.bossSub(S.bossBanner.moon), '', S.bossBanner.t, 1.8, '#FF4D6D');
    else if (S.trapBanner) drawBanner(L.trapTitle, L.trapSub(S.trapBanner.moon), '', S.trapBanner.t, 2.4, '#06D6A0');
    else if (S.cloudBanner) drawBanner(L.cloudTitle, L.cloudSub, '', S.cloudBanner.t, 2.4, '#FFFFFF');
    else if (S.phaseTitle) drawBanner(S.phaseTitle.title, S.phaseTitle.sub, S.phaseTitle.sub2, S.phaseTitle.t, 2.6, '#FFD166');
    drawHUD(); drawReplayHint();
  }
  drawParticles(true);
  if (S.grace > 0) S.drawGrace();                                    // reprise après une pause : 1 s de grâce
}

Object.assign(S, { render });
})(window.Soleil);
