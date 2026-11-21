/* js/core/utils.js — Petits outils (maths, couleurs, DOM) */
(function (S) {
'use strict';

/* ---------- 4. Petits outils ---------- */
const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const easeIn = t => t * t;
const easeOut = t => 1 - (1 - t) * (1 - t);
const fmt = s => { const v = Math.max(0.01, s).toFixed(2); return S.L.decimal === ',' ? v.replace('.', ',') : v; };   // virgule sauf en anglais
const $ = id => document.getElementById(id);
const RGB = new Map();
function rgb(c) {
  if (typeof c !== 'string') return c;
  let v = RGB.get(c);
  if (!v) { const n = parseInt(c.slice(1), 16); v = [n >> 16 & 255, n >> 8 & 255, n & 255]; RGB.set(c, v); }
  return v;
}
function mixA(a, b, t) { a = rgb(a); b = rgb(b); return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
function css(c, al = 1) {
  c = rgb(c);
  if (al >= 1) return `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
  return `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${Math.max(0, al).toFixed(3)})`;
}
const mix = (a, b, t) => css(mixA(a, b, t));
function vibrate(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) { /* pas grave */ } }
const finePointer = () => matchMedia('(hover: hover) and (pointer: fine)').matches;
const pad2 = n => String(n).padStart(2, '0');
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

Object.assign(S, { clamp, lerp, smooth, easeIn, easeOut, fmt, $, RGB, rgb, mixA, css, mix, vibrate, finePointer,
  pad2, esc });
})(window.Soleil);
