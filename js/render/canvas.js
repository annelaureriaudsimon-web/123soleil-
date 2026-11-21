/* js/render/canvas.js — Canvas, mise en page (Lt) et redimensionnement */
(function (S) {
'use strict';
const { CAM_BACK, CAM_H, $ } = S;   // déjà chargés

/* ---------- 9. Canvas et mise en page ---------- */
const cv = $('c');
S.ctx = cv.getContext('2d');               // le contexte de dessin du jeu
const over = $('over'), panel = $('panel');
S.W = 1, S.H = 1, S.DPR = 1;
const Lt = {};                               // mesures de la scène
const safe = { t: 0, r: 0, b: 0, l: 0 };

const UI_ZOOM_MAX = 1.6;                    // grand écran : les boutons et panneaux grandissent au plus de 60 %
S.uiZoom = 1;
function resize() {
  S.DPR = S.dprFor();                                              // plafonné par la qualité d'image (js/render/quality.js)
  S.W = Math.max(1, window.innerWidth); S.H = Math.max(1, window.innerHeight);
  cv.width = Math.round(S.W * S.DPR); cv.height = Math.round(S.H * S.DPR);
  S.dirty = true;                                                 // jeu figé (pause, pub) : on le redessine à la nouvelle taille
  // Grand écran (plein écran Poki sur PC, 1920×1080 et plus) : les boutons et panneaux HTML grandissent un peu avec
  // l'écran (CSS zoom, variable --uiz), pour ne pas rester à la taille d'un téléphone. Téléphones, tablettes et
  // fenêtre Poki normale (jusqu'à 1031×580) : 1, rien ne change. Ce qui place des éléments HTML en JS en tient compte.
  S.uiZoom = Math.round(Math.max(1, Math.min(UI_ZOOM_MAX, S.W / 1300, S.H / 760)) * 20) / 20;
  document.documentElement.style.setProperty('--uiz', String(S.uiZoom));
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
