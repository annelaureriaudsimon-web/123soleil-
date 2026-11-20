/* js/modes/daily.js — Défi du jour : même graine, mêmes missions pour tout le monde aujourd’hui */
(function (S) {
'use strict';
const { MISSIONS, pad2, hash, store } = S;   // déjà chargés

/* ---------- 6. Défi du jour : mêmes dés, même terrain, mêmes missions pour tout le monde aujourd'hui ---------- */
const NOW = new Date();
const DAY = Math.max(1, Math.round((Date.UTC(NOW.getFullYear(), NOW.getMonth(), NOW.getDate()) - Date.UTC(2026, 10, 18)) / 864e5) + 1);
const SEED = Math.imul(DAY, 2654435761) >>> 0;
const todayMissions = [0, 1, 2].map(t => { const list = MISSIONS.filter(m => m.tier === t); return list[Math.floor(hash(DAY * 9.17 + t * 3.3) * list.length)]; });
S.mstate = store.get('mstate', null);
if (!S.mstate || S.mstate.day !== DAY) S.mstate = { day: DAY, done: {}, runs: 0, total: 0, bestStat: {} };
const saveMissions = () => store.set('mstate', S.mstate);
const missionsDone = () => todayMissions.filter(m => S.mstate.done[m.id]).length;
const streakAlive = () => (S.streak.last >= DAY - 1 ? S.streak.n : 0);

/* ---------- 25. Accueil : défi du jour (un seul essai), partie libre, 2 joueurs ---------- */
function todayNumber() {                           // numéro du défi d'aujourd'hui (change à minuit, heure locale)
  const n = new Date();
  return Math.max(1, Math.round((Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()) - Date.UTC(2026, 10, 18)) / 864e5) + 1);
}
function dailyState() {                            // null tant que le défi du jour n'a pas été tenté
  const d = store.get('daily', null);
  return d && d.day === DAY && d.used ? d : null;
}
function untilMidnight() {                         // « 05:12:33 » avant le prochain défi
  const n = new Date(), m = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1);
  const s = Math.max(0, Math.ceil((m - n) / 1000));
  return `${pad2(Math.floor(s / 3600))}:${pad2(Math.floor(s / 60) % 60)}:${pad2(s % 60)}`;
}

Object.assign(S, { NOW, DAY, SEED, todayMissions, saveMissions, missionsDone, streakAlive, todayNumber,
  dailyState, untilMidnight });
})(window.Soleil);
