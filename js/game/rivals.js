/* js/game/rivals.js — Les rivaux (et les joueurs simulés) : des « cerveaux » qui réagissent au chant comme des enfants.
   Le même cerveau pilote les rivaux du mode Niveaux ET les joueurs de tools/simulate.js.
   Toutes ses décisions passent par un générateur avec graine (jamais Math.random). */
(function (S) {
'use strict';
const { gauss } = S;   // core/rng.js

// ---------- Réglages des personnalités ----------
// react       : temps de réaction [moyenne, écart] (s)
// on3         : probabilité de lâcher dès le « 3 » (prudent : il perd du temps) ; sinon il lit le mot et réagit
//               (v2.5 : il n'y a plus de « SO » ; le mot vrai ou piège arrive juste après le « 3… »)
// waitDing    : ne repart qu'au vrai retour, même après un mot piège (le robot « patient » de la simulation)
// fooled      : probabilité de s'arrêter sur un mot piège alors qu'il attendait le mot
// greed       : retard volontaire après « SOLEIL ! » [moyenne, écart] (s) : il grappille des mètres… et se fait griller
// impatience  : pendant un long « 3… », il repart au bout de [moyenne, écart] s ([0, 0] = jamais)
// impatientP  : probabilité qu'il soit impatient pendant ce « 3… »
// restart     : délai en plus pour repartir quand le soleil se remet de dos [moyenne, écart] (s)
// trapRestart : délai en plus pour repartir après un mot piège (s)
// hesitate    : probabilité de marquer un petit arrêt sur un chiffre, sans raison (« il hésite »)
// waryK       : juste après un mot piège, il lâche moins souvent dès le « 3 » (× on3)
// speed       : vitesse max (× celle du joueur)
// crack       : sang-froid (monde 2) : probabilité de craquer face à une tentation, avant le multiplicateur TEMPT_K
// learn       : face à une tentation déjà connue, la probabilité de craquer est multipliée par learn (l'expert s'adapte vite)
// Monde 2 : certaines tentations font plus craquer que d'autres (les fausses fins imitent le début d'un vrai retour ;
// la mouche et les moqueries mettent la pression sans donner d'« excuse » pour bouger).
// Une tentation déjà rencontrée (dans l'essai, ou dans un niveau précédent pour le joueur) fait moins craquer : × learn.
// v2.5 : le recomptage imite le VRAI début d'un chant (c'est le plus dangereux) ; l'avion « ALLEZ-Y ! » dit de partir ;
// la fausse alerte (un rival crie « VAS-Y ! ») ; le troupeau (trois rivaux partent d'un coup : on a envie de suivre).
const TEMPT_K = { fakeRet: 1.2, fakeBack: 1.2, sneeze: 1, crack: 0.9, star: 0.8, fly: 0.3, taunt: 0.25, recount: 1.0, planeGo: 1.0,
                  alarm: 1.0, herd: 1.2 };
// Quand il craque, il appuie (« il bouge ») ce temps après le début de la tentation, plus son temps de réaction (s)
const CRACK_AT = { star: 0, fakeRet: 0, fakeBack: 0.05, sneeze: 0.9, crack: 0, fly: 0.8, taunt: 0.1, recount: 0.05, planeGo: 0.2,
                   alarm: 0.15, herd: 0.05 };
// v2.5 — l'avion « SOLEIL ! » pendant le chant : il s'arrête pour rien avec la probabilité fooled × PLANE_STOP_K
// (plus que pour un mot piège : la banderole porte LE vrai mot)
const PLANE_STOP_K = 1.2;
// v2.5 — le nuage (reflet dans l'eau) : il faut regarder le reflet, c'est plus dur. Pendant ce cycle, chaque tentation
// fait plus craquer (× CLOUD_K) et il repart un peu plus tard au vrai retour (+ CLOUD_RESTART s : le temps de voir le « ding » dans l'eau)
const CLOUD_K = 1.4, CLOUD_RESTART = 0.12;

const PROFILES = {
  // Les 3 personnalités des rivaux (le tricheur arrivera en phase 3)
  prudent:  { emoji: '🐢', react: [0.26, 0.05], on3: 0.75, fooled: 0.35, greed: [0, 0], impatience: [0, 0], impatientP: 0,
              restart: [0.35, 0.12], trapRestart: 0.3, hesitate: 0.15, speed: 0.93, crack: 0.02, learn: 0.5 },
  fonceur:  { emoji: '⚡', react: [0.2, 0.05], on3: 0, fooled: 0.08, greed: [0.1, 0.09], impatience: [0.6, 0.25], impatientP: 0.6,
              restart: [0, 0.04], trapRestart: 0, hesitate: 0, speed: 1.14, crack: 0.35, learn: 0.9 },
  regulier: { emoji: '🎯', react: [0.21, 0.03], on3: 0.35, fooled: 0.05, greed: [0, 0], impatience: [0, 0], impatientP: 0,
              restart: [0.06, 0.03], trapRestart: 0.05, hesitate: 0.03, speed: 1.0, crack: 0.05, learn: 0.5 },
  // Les 3 joueurs simulés (tools/simulate.js), décrits dans docs/LEVELS.md
  expert:   { react: [0.20, 0.03], on3: 0, fooled: 0, greed: [0, 0], impatience: [0, 0], impatientP: 0,
              restart: [0, 0], trapRestart: 0, hesitate: 0, speed: 1, crack: 0.015, learn: 0.1 },
  // v2.5.1 : le moyen est recalibré sur un vrai joueur au téléphone : lire « SOLEIL ! » (et pas « SOLDES ! ») prend
  // environ 0,36 s, pas 0,28. Avec l'ancien moyen, trop rapide, la nuit et les demi-tours étaient réglés trop serré.
  moyen:    { react: [0.36, 0.07], on3: 0.3, fooled: 0.3, greed: [0, 0], impatience: [1.0, 0.35], impatientP: 0.3, waryK: 0.4,
              restart: [0, 0.04], trapRestart: 0.12, hesitate: 0, speed: 1, crack: 0.15, learn: 0.4 },   // le « ding » s'attend : 0,29 s
  // Le robot « patient » (v2.5) : il s'arrête à CHAQUE « 3 » et ne repart qu'au vrai retour. Sans pression (nuit,
  // transats, glace), il ne perd jamais… mais il est très lent : la simulation vérifie qu'il échoue de plus en plus.
  patient:  { react: [0.22, 0.03], on3: 1, waitDing: true, fooled: 0, greed: [0, 0], impatience: [0, 0], impatientP: 0,
              restart: [0, 0], trapRestart: 0, hesitate: 0, speed: 1, crack: 0.015, learn: 0.1 },
  debutant: { react: [0.45, 0.10], on3: 0, fooled: 0.2, greed: [0, 0], impatience: [0, 0], impatientP: 0,   // v2.5.1 : 0,45 s (avant 0,35)
              restart: [0.15, 0.1], trapRestart: 0.15, hesitate: 0, speed: 1, crack: 0.35, learn: 0.7 }
};

// ---------- Le cerveau ----------
// Il « voit » les mots du chant (brainSee) et décide, avec un temps de réaction, quand lâcher et quand repartir.
// Ses décisions sont des actions datées (queue) appliquées par brainTick au bon moment.
function newBrain(kind, rnd, over, seen) {
  const p = Object.assign({}, PROFILES[kind] || PROFILES.regulier, over || {});
  if (p.waryK == null) p.waryK = 1;
  if (p.crack == null) p.crack = 0.05;
  if (p.learn == null) p.learn = 0.5;
  const known = {};
  (seen || []).forEach(k => { known[k] = true; });          // tentations déjà connues (niveaux précédents)
  return { kind, p, rnd, press: false, queue: [], why: '', soT: -1, imp: Infinity, impDone: true, wary: false, seen: known };
}
const reactT = b => Math.max(0.08, gauss(b.rnd, b.p.react[0], b.p.react[1]));
const sample = (b, a) => (a[1] ? gauss(b.rnd, a[0], a[1]) : a[0]);
const wantsRun = b => (b.queue.length ? b.queue[b.queue.length - 1].press : b.press);   // son intention, après ses actions prévues
function release(b, t, why) {                     // s'arrêter : les départs prévus sont annulés (la sécurité d'abord)
  b.queue = b.queue.filter(q => !q.press);
  b.queue.push({ t, press: false, why });
  b.queue.sort((x, y) => x.t - y.t);
}
function go(b, t) { b.queue.push({ t, press: true, why: '' }); b.queue.sort((x, y) => x.t - y.t); }

// Un événement du soleil vient d'arriver à l'instant « now » : num (n), trap, trigger, return, start, tentations
function brainSee(b, type, now, data) {
  const p = b.p, r = b.rnd;
  switch (type) {
    case 'start': go(b, now + reactT(b) + 0.15 * r()); break;
    case 'num':
      if (data && data.n === 2) {                     // le « 3 » : le mot arrive juste après (l'impatience compte d'ici)
        b.soT = now; b.impDone = false;
        b.imp = p.impatience[0] > 0 && r() < p.impatientP ? Math.max(0.3, sample(b, p.impatience)) : Infinity;
      }
      if (!wantsRun(b)) break;
      if (data && data.n === 2 && r() < p.on3 * (b.wary ? p.waryK : 1)) release(b, now + reactT(b), '3');   // prudent : stop dès « 3 »
      else if (r() < p.hesitate) { const t1 = now + reactT(b); release(b, t1, 'hes'); go(b, t1 + 0.2 + 0.3 * r()); }
      break;
    case 'trap':
      b.wary = true;
      if (!wantsRun(b)) { if (!p.waitDing) go(b, now + reactT(b) + p.trapRestart); }    // c'était un piège : on repart (sauf le patient)
      else if (r() < p.fooled) { const t1 = now + reactT(b); release(b, t1, 'fool'); go(b, t1 + reactT(b) + 0.2); }
      b.impDone = true;
      break;
    case 'trigger':
      b.impDone = true; b.wary = false;
      if (wantsRun(b)) release(b, now + reactT(b) + Math.max(0, sample(b, p.greed)), 'soleil');
      break;
    case 'return':
      if (!wantsRun(b)) go(b, now + reactT(b) * 0.8 + Math.max(0, sample(b, p.restart)) + (b.cloudy ? CLOUD_RESTART : 0));
      b.cloudy = false;
      break;
    case 'tempt': case 'fakeRet': case 'fakeBack': {  // monde 2 : va-t-il craquer ? (il bougera… et sera grillé)
      if (data && data.from && data.from.brain === b) break;   // v2.5 : celui qui crie « VAS-Y ! » sait que c'est faux
      const tt = type === 'tempt' ? data.type : type;
      let pc = p.crack * (TEMPT_K[tt] || 1) * (b.cloudy ? CLOUD_K : 1);
      if (b.seen[tt]) pc *= p.learn;
      b.seen[tt] = true;
      if (r() < pc && !wantsRun(b)) go(b, now + (CRACK_AT[tt] || 0) + reactT(b));
      break;
    }
    case 'planeStop': {                               // v2.5 : « SOLEIL ! » sur une banderole… ce n'est pas lui qui parle
      let pf = p.fooled * PLANE_STOP_K;
      if (b.seen.planeStop) pf *= p.learn;
      b.seen.planeStop = true;
      if (wantsRun(b) && r() < pf) { const t1 = now + reactT(b); release(b, t1, 'plane'); go(b, t1 + reactT(b) + 0.2); }
      break;
    }
    case 'cloud': b.cloudy = true; break;             // v2.5 : le nuage cache le soleil jusqu'au vrai retour
  }
}

// Applique les actions arrivées à échéance. soLong : pour l'impatience pendant un long « 3… »
function brainTick(b, now, soLong) {
  while (b.queue.length && b.queue[0].t <= now) {
    const q = b.queue.shift();
    b.press = q.press; if (!q.press) b.why = q.why;
  }
  if (!b.impDone && soLong && !b.press && !b.queue.length && now - b.soT > b.imp) {   // il en a marre d'attendre…
    b.impDone = true;
    go(b, now + 0.05);
  }
  return b.press;
}

// Après un retour au départ (rival grillé) : il repart dès que c'est sûr
function brainReset(b, now, safe) {
  b.queue = []; b.press = false; b.impDone = true; b.cloudy = false;
  if (safe) go(b, now + reactT(b) + 0.2);
}

Object.assign(S, { PROFILES, TEMPT_K, CRACK_AT, PLANE_STOP_K, CLOUD_K, CLOUD_RESTART, newBrain, brainSee, brainTick, brainReset });
})(window.Soleil);
