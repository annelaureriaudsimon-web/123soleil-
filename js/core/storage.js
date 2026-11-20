/* js/core/storage.js — Sauvegarde locale (localStorage) : record, étoiles, tenues, médailles, fantôme */
(function (S) {
'use strict';

/* ---------- 5. Sauvegarde locale ---------- */
const store = {
  get(k, d) { try { const v = localStorage.getItem('soleil.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('soleil.' + k, JSON.stringify(v)); } catch (e) { /* navigation privée */ } }
};
S.best = +store.get('best', 0) || 0;
S.plays = +store.get('plays', 0) || 0;
S.stars = +store.get('stars', 0) || 0;
S.owned = store.get('owned', ['classic']); if (!Array.isArray(S.owned)) S.owned = ['classic'];
S.outfit = store.get('outfit', 'classic'); if (!S.owned.includes(S.outfit)) S.outfit = 'classic';
S.medals = store.get('medals', []); if (!Array.isArray(S.medals)) S.medals = [];
S.streak = store.get('streak', { n: 0, last: 0 }); if (!S.streak || typeof S.streak.n !== 'number') S.streak = { n: 0, last: 0 };
S.ghost = store.get('ghost', null); if (!Array.isArray(S.ghost) || S.ghost.length < 2) S.ghost = null;

Object.assign(S, { store });
})(window.Soleil);
