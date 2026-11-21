// tools/tests/fake_poki_sdk.js — Faux SDK Poki pour les tests (test_poki.py) : il note chaque appel dans window.__calls,
// et peut montrer une « pub » de window.__adMs millisecondes ; window.__initFail = true imite un bloqueur de pub.
window.__calls = []; window.__adMs = window.__adMs || 0;
window.PokiSDK = {
  init() { __calls.push('init'); return window.__initFail ? Promise.reject(new Error('adblock')) : Promise.resolve(); },
  gameLoadingFinished() { __calls.push('gameLoadingFinished'); },
  gameplayStart() { __calls.push('gameplayStart'); },
  gameplayStop() { __calls.push('gameplayStop'); },
  commercialBreak(onStart) {
    __calls.push('commercialBreak');
    return new Promise(res => {
      if (!(window.__adMs > 0)) { res(); return; }
      setTimeout(() => { __calls.push('adStart'); if (onStart) onStart(); setTimeout(() => { __calls.push('adEnd'); res(); }, window.__adMs); }, 20);
    });
  },
  rewardedBreak(o) { __calls.push('rewardedBreak'); return Promise.resolve(false); },
  movePill(a, b) { __calls.push('movePill'); }
};
