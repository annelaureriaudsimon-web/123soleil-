/* js/platform/poki.js — La couche plateforme : TOUT ce qui parle au SDK Poki passe par ici.
   Elle retient l'état (chargement → arrêté ⇄ en jeu, et « pub » pendant une pub), ignore les événements
   en double, avant la fin du chargement ou pendant une pub, et marche sans SDK (fichier ouvert en
   double-clic, bloqueur de pub, hors ligne, SDK qui ne répond pas) : c'est le mode de secours, qui fait
   comme si tout allait bien, sans erreur ni attente.
   Le jeu n'appelle pas gameplayStart / gameplayStop à la main : js/platform/flow.js s'en charge.
   Les lignes du mode debug (journal à l'écran, fausse pub) portent une marque que tools/build-poki.js
   reconnaît : elles sont retirées du build Poki. */
(function (S) {
'use strict';

// ---------- Réglages ----------
const INIT_MAX = 2500;        // ms : au chargement, on n'attend jamais le SDK plus longtemps (puis mode de secours)
const BREAK_START = 5000;     // ms : une pub demandée qui n'a toujours pas commencé : on reprend le jeu
const AD_MAX = 60000;         // ms : une pub ne bloque jamais le jeu plus longtemps

let api = () => window.PokiSDK;
api = () => S.fakePoki || window.PokiSDK;                    // @debug (?debug=1&fakead=1 : une fausse pub sans SDK)

const P = { mode: 'secours', state: 'chargement', pending: null, inited: null };
let embedded = false;                                        // le jeu tourne-t-il dans une iframe (comme sur Poki) ?
try { embedded = window.self !== window.top; } catch (e) { embedded = true; }
S.embedded = embedded;
const hooks = { adStart: [], adEnd: [] };                    // le jeu s'abonne : figer, couper le son, bloquer les entrées

// @debug-start
function note(kind, name, info) { if (S.debugHook) S.debugHook(kind, name, info || '', P.state); }
// @debug-end

// Un appel au SDK, protégé : une erreur du SDK ne casse jamais le jeu
function call(name, ...args) {
  const sdk = P.mode === 'sdk' ? api() : null;
  if (!sdk || typeof sdk[name] !== 'function') return undefined;
  try { return sdk[name](...args); } catch (e) { return undefined; }
}
// Version dev : la balise du SDK est « async ». Est-elle encore en train de charger ?
function sdkTagLoading() {
  const tag = document.querySelector('script[src*="poki-sdk"]');
  return !!tag && tag.async && !window.PokiSDKfailed;
}

// ---------- Chargement ----------
function init() {                                  // n'échoue jamais : réussite, erreur ou délai max → on joue
  if (P.inited) return P.inited;
  P.inited = new Promise(resolve => {
    let over = false;
    const finish = mode => {
      if (over) return;
      over = true; clearTimeout(cap);
      P.mode = mode;
      note('info', 'init', mode === 'sdk' ? 'SDK prêt' : 'mode de secours');   // @debug
      resolve(mode);
    };
    const cap = setTimeout(() => finish(api() ? 'sdk' : 'secours'), INIT_MAX);
    const go = () => {
      if (over) return;
      const sdk = api();
      if (!sdk || typeof sdk.init !== 'function') {
        if (sdkTagLoading()) setTimeout(go, 40);   // dev : le SDK arrive en différé
        else finish('secours');                    // pas de SDK (hors ligne, bloqueur de pub…) : tout de suite
        return;
      }
      let p;
      try { p = sdk.init(); } catch (e) { finish('sdk'); return; }
      Promise.resolve(p).then(() => finish('sdk'), () => finish('sdk'));   // réussite OU erreur (bloqueur de pub) : on joue
    };
    go();
  });
  return P.inited;
}
function loadingFinished() {
  if (P.state !== 'chargement') {
    note('bad', 'gameLoadingFinished', 'déjà envoyé');   // @debug
    return;
  }
  P.state = 'arrêté';
  call('gameLoadingFinished');
  note('sent', 'gameLoadingFinished');   // @debug
}

// ---------- En jeu / arrêté (jamais deux fois de suite, jamais pendant une pub) ----------
function gameplayStart() {
  if (P.state !== 'arrêté') {
    note('bad', 'gameplayStart', P.state === 'en jeu' ? 'déjà en jeu' : P.state);   // @debug
    return false;
  }
  P.state = 'en jeu';
  call('gameplayStart');
  note('sent', 'gameplayStart');   // @debug
  return true;
}
function gameplayStop() {
  if (P.state !== 'en jeu') {
    note('bad', 'gameplayStop', P.state === 'arrêté' ? 'déjà arrêté' : P.state);   // @debug
    return false;
  }
  P.state = 'arrêté';
  call('gameplayStop');
  note('sent', 'gameplayStop');   // @debug
  return true;
}

// ---------- Les pubs : Poki décide s'il y en a une ----------
// run(onStart) lance la pub côté SDK et rend sa promesse ; fallback : la réponse sans SDK.
function adBreak(name, run, fallback) {
  if (P.pending || P.state === 'chargement' || P.state === 'pub') {
    note('bad', name, P.pending ? 'déjà demandée' : P.state);   // @debug
    return Promise.resolve(fallback);
  }
  if (P.state === 'en jeu') {                      // une pub ne se demande jamais en pleine partie
    note('bad', name, 'en jeu : gameplayStop d’abord');   // @debug
    gameplayStop();
  }
  note('sent', name);   // @debug
  let answer = null, started = false, over = false, t1 = 0, t2 = 0;
  const pending = new Promise(r => { answer = r; });
  P.pending = pending;
  const end = value => {
    if (over) return;
    over = true; clearTimeout(t1); clearTimeout(t2);
    const hadAd = P.state === 'pub';
    P.state = 'arrêté'; P.pending = null;
    if (hadAd) hooks.adEnd.forEach(f => f());
    note('info', name, hadAd ? 'fin de la pub' : 'pas de pub');   // @debug
    answer(value);
  };
  const onStart = () => {
    if (over || started) return;
    started = true; clearTimeout(t1);
    P.state = 'pub';
    note('info', name, 'début de la pub');   // @debug
    hooks.adStart.forEach(f => f());
    t2 = setTimeout(() => end(fallback), AD_MAX);
  };
  const sdk = P.mode === 'sdk' ? api() : null;
  if (!sdk) { end(fallback); return pending; }     // mode de secours : tout de suite
  t1 = setTimeout(() => end(fallback), BREAK_START);
  let p;
  try { p = run(sdk, onStart); } catch (e) { end(fallback); return pending; }
  Promise.resolve(p).then(v => end(v === undefined ? fallback : v), () => end(fallback));
  return pending;
}
// Pause pub entre deux parties (Rejouer, Suivant, Recommencer, Reprendre)
function commercialBreak() {
  return adBreak('commercialBreak', (sdk, onStart) => sdk.commercialBreak(onStart), undefined)
    .then(() => undefined);
}
// Pub récompensée : prête pour une prochaine étape, PAS utilisée dans le jeu pour l'instant (SDK v2 : rewardedBreak({ size, onStart }) ).
// Répond true seulement si la pub a été vue jusqu'au bout (sans SDK : false, pas de récompense).
function rewardedBreak(size = 'small') {
  return adBreak('rewardedBreak', (sdk, onStart) => sdk.rewardedBreak({ size, onStart }), false)
    .then(ok => ok === true);
}
// Pilule Poki sur mobile : position verticale (0 à 50 % de la hauteur, + des pixels). Par défaut (0, 24).
function movePill(topPercent, topPx) {
  call('movePill', topPercent, topPx);
  note('sent', 'movePill', `${topPercent} %, ${topPx} px`);   // @debug
}

S.Poki = {
  init, loadingFinished, gameplayStart, gameplayStop, commercialBreak, rewardedBreak, movePill,
  onAdStart(f) { hooks.adStart.push(f); }, onAdEnd(f) { hooks.adEnd.push(f); },
  get mode() { return P.mode; }, get state() { return P.state; },
  get loaded() { return P.state !== 'chargement'; }, get playing() { return P.state === 'en jeu'; },
  get inAd() { return P.state === 'pub'; }, get busy() { return !!P.pending; }
};
})(window.Soleil);
