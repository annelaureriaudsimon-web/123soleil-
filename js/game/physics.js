/* js/game/physics.js — Physique du coureur, pure et partagée : course infinie, niveaux, rivaux et simulation */
(function (S) {
'use strict';
const { ACC, DEC, ICE_DEC, MUD_ACC, SLOPE_DEC, V_EPS } = S;   // réglages (core/config.js)

// Un pas de physique. press : on maintient ? ground : '' (sol normal), 'mud', 'ice' ou 'slope'. vmax : vitesse max (m/s).
// Renvoie la distance parcourue (dz), la nouvelle vitesse (v) et le freinage du sol (dec).
function kinStep(v, press, dt, ground, vmax) {
  const dec = ground === 'ice' ? ICE_DEC : ground === 'slope' ? SLOPE_DEC : DEC;
  const pv = v;
  if (press) {
    if (v < vmax) v = Math.min(vmax, v + (ground === 'mud' ? MUD_ACC : ACC) * dt);
    else v = Math.max(vmax, v - DEC * 0.6 * dt);          // la boue freine (et on ralentit en sortant d'une descente)
  } else v = Math.max(0, v - dec * dt);                   // arrêté = arrêté : la pente ne pousse jamais
  return { dz: (pv + v) * 0.5 * dt, v, dec };
}

// Temps qu'il faut pour que le soleil ne te voie plus bouger (vitesse sous V_EPS)
const stopTime = (v, dec) => Math.max(0, v - V_EPS) / dec;

Object.assign(S, { kinStep, stopTime });
})(window.Soleil);
