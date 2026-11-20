/* js/core/rng.js — Hasard avec graine : mulberry32 et hash (toutes les décisions de jeu passent par ici) */
(function (S) {
'use strict';

const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// Mélange deux nombres en une graine 32 bits (niveau × essai × cycle × rival…)
function mixSeed(a, b) {
  let h = Math.imul((a | 0) ^ 0x9E3779B9, 0x85EBCA6B) ^ Math.imul((b | 0) + 0x632BE5AB, 0xC2B2AE35);
  h ^= h >>> 15; h = Math.imul(h, 0x2C1B3C6D); h ^= h >>> 12; h = Math.imul(h, 0x297A2D39); h ^= h >>> 15;
  return h >>> 0;
}
// Tirage « en cloche » (loi normale) à partir d'un générateur avec graine : moyenne m, écart e
function gauss(rnd, m, e) {
  const u = Math.max(1e-9, rnd()), v = rnd();
  return m + e * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

Object.assign(S, { hash, mulberry32, mixSeed, gauss });
})(window.Soleil);
