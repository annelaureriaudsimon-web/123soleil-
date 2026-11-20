/* js/game/state.js — État partagé d’une partie (coureur, soleil, chronos…) */
(function (S) {
'use strict';
const { DEC, PHASE_LEN, TURN0, V_EPS, mulberry32, store, SEED, resize } = S;   // déjà chargés
     // encoches des téléphones

/* ---------- 10. État du jeu ---------- */
S.state = 'title';          // title → play → caught → over → play…
S.gtime = 0, S.runT = 0, S.caughtT = 0, S.overT = 0;
S.pressing = false, S.keyDown = false, S.panelOpen = false;
const pointers = new Set();
S.rng = mulberry32(SEED);
S.runner = newRunner(), S.watcher = newWatcher();
S.events = [], S.lastRun = null;            // journal de la partie (regards, pièges, boss…) pour le partage
S.recordAtStart = S.best, S.passedRecord = false;
S.phaseIdx = 0, S.phaseTitle = null, S.bossBanner = null, S.bossQueue = [];
S.particles = [];
S.shake = 0, S.flash = 0, S.timeScale = 1, S.lookAmt = 0;
S.tutorial = false, S.cycleN = 0;
S.RS = newRunStats(), S.combo = 0, S.runStars = 0, S.lastStar50 = 0, S.trapWatch = null;
S.ghostRec = [], S.ghostAlive = false, S.ghostLast = null;
S.mode = 'free';                           // 'daily' (défi du jour), 'free' (partie libre) ou 'duo' (2 joueurs)
S.runSeed = SEED, S.seedF = 0;               // graine de la partie : utilisée par le chant ET par les plaques de terrain
S.duo = null, S.duoCam = 0;                  // mode 2 joueurs
const duoPtr = new Map();                    // doigt (pointerId) → joueur 0 ou 1
S.duoKeys = [false, false];                // touches A et L
S.storyFile = null, S.storyPromise = null;   // image à partager (préparée en avance)
S.star = null;                             // étoile flottante à attraper (une à la fois)
S.cloudK = 0, S.tilt = 0, S.tiltPx = 0;        // nuage devant le soleil (0 → 1) ; horizon qui descend dans la descente
S.trapBanner = null, S.cloudBanner = null, S.trapTuto = false;
S.cloudSeen = !!store.get('cloudSeen', false);

function newRunner() {
  return { z: 0, v: 0, phase: 0, toast: 0, stopT: -9, jx: 0, statue: 0, step: 0, pressed: false, dec: DEC, ground: null,
           inPatch: null, sprintFrom: null, slide: 0, iceSnd: false };
}
function newRunStats() { return { oufs: 0, combo: 0, sprint: 0, mud: 0, ice: 0, traps: 0, bosses: 0, hops: 0, looks: 0, catches: 0, big: 0, slope: 0 }; }
function newWatcher() {
  return { type: 'sun', state: 'idle', t: 0, pauseDur: 0.75, turnP: 0, turnDur: TURN0, lookDur: 1.5, offY: 0, bump: 0, laugh: 0, rayA: 0,
           text: '', textKind: '', textT: 0, textFadeT: 0, revealed: false, eyeX: 0, eyeY: 0.15, lid: 0, angry: false,
           chant: null, evI: 0, swapTo: 'sun', beat: 0, R: null, faux: false, second: false, retTo: 0, peekDur: 0, spotted: false,
           boss: 0, trapsThisChant: 0, angryUntil: 0, peekPlan: 0, spotAt: 0,
           vI: 0, preSaid: false, hopSaid: false, starTried: false, cloud: false, cloudDir: 1, rest: 0 };
}
window.addEventListener('resize', resize);
const anyMoving = () => (S.mode === 'duo' && S.duo ? S.duo.racers.some(r => r.resp <= 0 && r.v > V_EPS) : S.runner.v > V_EPS);
function logEvent(sym) { S.events.push({ ph: Math.floor(S.runner.z / PHASE_LEN), s: sym }); }

Object.assign(S, { pointers, duoPtr, newRunner, newRunStats, newWatcher, anyMoving, logEvent });
})(window.Soleil);
