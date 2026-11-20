/* js/game/terrain.js — Terrain de la course infinie : boue, descentes, verglas */
(function (S) {
'use strict';
const { UNLOCK, hash, SEED } = S;   // déjà chargés

/* ---------- 12. Terrain : flaques de boue (dès midi), descentes (dès le soir) et verglas (dès la nuit) ---------- */
const patchCache = new Map();
function randomSeed() {
  try { return crypto.getRandomValues(new Uint32Array(1))[0] >>> 0; } catch (e) { return (Math.random() * 4294967296) >>> 0; }
}
function setRunSeed(sd) {                      // une seule graine pour le chant ET le terrain
  sd = sd >>> 0;
  if (sd !== S.runSeed) patchCache.clear();      // nouvelle graine : nouvelles plaques
  S.runSeed = sd; S.seedF = (sd % 99991) * 0.7311;
}
setRunSeed(SEED);
function blockPatch(b) {                       // au plus une plaque par tranche de 50 m, la même pour une même graine
  if (S.mode === 'duo') return null;             // pas de boue ni de verglas à 2 joueurs
  if (patchCache.has(b)) return patchCache.get(b);
  let p = null;
  const z0 = b * 50;
  if (z0 >= UNLOCK.mud) {
    const iceOK = z0 >= UNLOCK.ice, slopeOK = z0 >= UNLOCK.slope;
    if (hash(b * 13.7 + S.seedF * 3.1) < (iceOK ? 0.75 : slopeOK ? 0.65 : 0.55)) {
      const roll = hash(b * 7.9 + S.seedF * 1.3);   // même graine → même terrain pour tout le monde
      const type = iceOK && roll < 0.4 ? 'ice' : slopeOK && roll >= 0.65 ? 'slope' : 'mud';
      const k = hash(b * 3.3 + S.seedF * 5.7);
      const len = type === 'ice' ? 6 + k * 5 : type === 'slope' ? 10 + k * 6 : 4 + k * 3;
      const start = z0 + 8 + hash(b * 5.1 + S.seedF) * (50 - len - 16);
      p = { z0: start, z1: start + len, type };
    }
  }
  patchCache.set(b, p);
  return p;
}
function patchAt(z) { const p = blockPatch(Math.floor(z / 50)); return p && z >= p.z0 && z <= p.z1 ? p.type : null; }

Object.assign(S, { patchCache, randomSeed, setRunSeed, blockPatch, patchAt });
})(window.Soleil);
