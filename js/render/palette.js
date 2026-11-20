/* js/render/palette.js — Couleurs des 4 phases (matin, midi, soir, nuit) */
(function (S) {
'use strict';
const { PHASE_LEN, lerp, mixA, smooth } = S;   // déjà chargés

/* ---------- 7. Couleurs des 4 phases (matin, midi, soir, nuit) ---------- */
const PH = [
  { skyTop: '#FF9F8F', skyBot: '#FFE2B8', haze: '#FFE6C4', grass1: '#A9E08B', grass2: '#9AD77C', path1: '#F7E0B5', path2: '#EED2A0', edge: '#DDB57C',
    hillFar: '#CDE7AE', hillNear: '#B2DA93', tree: '#5DB660', tree2: '#4CA552', trunk: '#94603F', tuft: '#7CC562', rock: '#CFC6B8',
    flowerA: '#FF7AA2', flowerB: '#FFF07A', cloud: '#FFF6EA', night: 0 },
  { skyTop: '#3EA6F2', skyBot: '#BEE8FF', haze: '#D6F1FF', grass1: '#7FD85A', grass2: '#70CB4B', path1: '#F3E4BC', path2: '#E9D6A3', edge: '#D4B97F',
    hillFar: '#A9DDB4', hillNear: '#86CE88', tree: '#3FAE4A', tree2: '#33983F', trunk: '#8A5A3B', tuft: '#5DBE45', rock: '#D5D0C5',
    flowerA: '#FF5D8F', flowerB: '#FFFFFF', cloud: '#FFFFFF', night: 0 },
  { skyTop: '#5A3D8F', skyBot: '#FF9466', haze: '#FFAE7E', grass1: '#D29A5C', grass2: '#C48C51', path1: '#EDBF8E', path2: '#E2B07D', edge: '#C48A5A',
    hillFar: '#C2708A', hillNear: '#9A5579', tree: '#8E4A6E', tree2: '#7A3D60', trunk: '#5E3346', tuft: '#B9814B', rock: '#C9927E',
    flowerA: '#FFD166', flowerB: '#FF6B6B', cloud: '#FFB4A2', night: 0.2 },
  { skyTop: '#0A0F31', skyBot: '#2B3778', haze: '#28336C', grass1: '#2D4B66', grass2: '#28445D', path1: '#4D5E86', path2: '#45557B', edge: '#38466C',
    hillFar: '#1F2B58', hillNear: '#18234B', tree: '#1D3B52', tree2: '#173246', trunk: '#2A2E4A', tuft: '#2F5672', rock: '#4A5578',
    flowerA: '#8EA8FF', flowerB: '#CFE0FF', cloud: '#3A4588', night: 1 }
];
const PAL_KEYS = Object.keys(PH[0]);
const PHASE_WATCHER = ['sun', 'sun', 'sun', 'moon'];
const SUNC = [
  { d1: '#FFF4A8', d2: '#FFBE3B', rays: '#FFCC4D', glow: '#FFE38A' },   // matin
  { d1: '#FFFDE6', d2: '#FFD23A', rays: '#FFE15A', glow: '#FFF2A8' },   // midi
  { d1: '#FFD58C', d2: '#FF6B3D', rays: '#FF8A4C', glow: '#FF9C70' }    // soir
];
const MOONC = { d1: '#FFFFF4', d2: '#DCD6B6', glow: '#B9CCFF', crater: '#CBC3A0' };
const pal = {};
function computePalette(z) {
  const p = Math.max(0, z) / PHASE_LEN, i = Math.floor(p), t = smooth(0.82, 1, p - i);
  const A = PH[i % 4], B = PH[(i + 1) % 4];
  for (const k of PAL_KEYS) pal[k] = typeof A[k] === 'number' ? lerp(A[k], B[k], t) : mixA(A[k], B[k], t);
}

Object.assign(S, { PH, PAL_KEYS, PHASE_WATCHER, SUNC, MOONC, pal, computePalette });
})(window.Soleil);
