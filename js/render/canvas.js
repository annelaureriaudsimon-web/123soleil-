/* js/render/canvas.js — Canvas, mise en page (Lt) et redimensionnement */
(function (S) {
'use strict';
const { CAM_BACK, CAM_H, $ } = S;   // déjà chargés

/* ---------- 9. Canvas et mise en page ---------- */
const cv = $('c');
S.ctx = cv.getContext('2d');               // « let » : redirigé le temps de dessiner l'image à partager
const over = $('over'), panel = $('panel');
S.W = 1, S.H = 1, S.DPR = 1;
const Lt = {};                               // mesures de la scène
const safe = { t: 0, r: 0, b: 0, l: 0 };

function resize() {
  S.DPR = Math.min(window.devicePixelRatio || 1, 2);
  S.W = Math.max(1, window.innerWidth); S.H = Math.max(1, window.innerHeight);
  cv.width = Math.round(S.W * S.DPR); cv.height = Math.round(S.H * S.DPR);
  const land = S.W > S.H * 1.05;
  Lt.U = Math.min(S.W, S.H); Lt.land = land; Lt.cx = S.W / 2;
  Lt.hy = Math.round(S.H * (land ? 0.47 : 0.43));                 // ligne d'horizon
  Lt.yFeet = S.H * (land ? 0.87 : 0.855);                         // pieds du coureur
  Lt.F = (Lt.yFeet - Lt.hy) * CAM_BACK / CAM_H;                 // focale de la fausse 3D
  Lt.s = Lt.F / CAM_BACK;                                       // pixels par mètre au niveau du coureur
  Lt.R = Math.min(S.W * 0.2, S.H * (land ? 0.13 : 0.105));          // rayon du soleil
  Lt.sunY = Lt.hy - Lt.R * 1.12;
  Lt.chantSize = Math.min(Lt.U * 0.16, Lt.R, S.H * 0.09);
  Lt.chantY = Lt.sunY - Lt.R * 1.5 - Lt.chantSize * 0.15;
  const cs = getComputedStyle($('safe'));
  safe.t = parseFloat(cs.top) || 0; safe.r = parseFloat(cs.right) || 0;
  safe.b = parseFloat(cs.bottom) || 0; safe.l = parseFloat(cs.left) || 0;
  if (S.state === 'over') S.placeOver();
  if (S.state === 'title') S.layoutHome();
}

const viewZ = () => (S.mode === 'level' && S.lvSkyZ != null ? S.lvSkyZ : S.mode === 'duo' && S.duo ? S.duoCam + CAM_BACK : S.runner.z);   // distance « vue » par la caméra (niveau : moment de la journée fixe)

Object.assign(S, { cv, over, panel, Lt, safe, resize, viewZ });
})(window.Soleil);
