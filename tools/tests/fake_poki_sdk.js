// tools/tests/fake_poki_sdk.js — Faux SDK Poki pour les tests (test_poki.py) : il note chaque appel dans window.__calls,
// et peut montrer une « pub ». Réglages (à poser avant le chargement, ou à changer en cours de test) :
//   window.__adMs        durée d'une pub (ms) ; 0 = pas de pub (commercialBreak répond tout de suite)
//   window.__adDelay     délai avant le DÉBUT de la pub (ms) ; plus de 5000 = pub « en retard » (v2.3)
//   window.__initFail    true imite un bloqueur de pub (init échoue)
//   window.__rewardOk    réponse de rewardedBreak quand la vidéo est vue (défaut : true)
//   window.__rewardNone  true : aucune vidéo disponible (rewardedBreak répond false tout de suite)
window.__calls = []; window.__adMs = window.__adMs || 0;
function __fakeAd(onStart, answer) {
  const ms = window.__adMs > 0 ? window.__adMs : 300, delay = window.__adDelay || 20;
  return new Promise(res => {
    setTimeout(() => {
      __calls.push('adStart'); if (onStart) onStart();
      setTimeout(() => { __calls.push('adEnd'); res(answer()); }, ms);
    }, delay);
  });
}
window.PokiSDK = {
  init() { __calls.push('init'); return window.__initFail ? Promise.reject(new Error('adblock')) : Promise.resolve(); },
  gameLoadingFinished() { __calls.push('gameLoadingFinished'); },
  gameplayStart() { __calls.push('gameplayStart'); },
  gameplayStop() { __calls.push('gameplayStop'); },
  commercialBreak(onStart) {
    __calls.push('commercialBreak');
    if (!(window.__adMs > 0)) return Promise.resolve();
    return __fakeAd(onStart, () => undefined);
  },
  rewardedBreak(o) {
    __calls.push('rewardedBreak:' + ((o && o.size) || '?'));
    if (window.__rewardNone || window.__initFail) return Promise.resolve(false);   // bloqueur de pub : jamais de vidéo
    return __fakeAd(o && o.onStart, () => window.__rewardOk !== false);
  },
  movePill(a, b) { __calls.push('movePill'); }
};
