/* js/core/i18n-apply.js — Branche la langue : remplit L (textes), les mots du chant, le titre de la page.
   Chargé après toutes les langues (js/core/i18n.js, i18n-levels.js, lang/*.js) et après game/content.js.
   S.setLang(code) : le joueur change de langue depuis l'accueil, sans recharger la page (pas de nouvel init Poki). */
(function (S) {
'use strict';
const { TXT, L, LANGS, SUN_TRAPS, MOON_TRAPS } = S;   // déjà chargés

function refill(arr, src) { arr.length = 0; src.forEach(x => arr.push(x)); }
function applyLang(code) {
  if (!LANGS.some(l => l.code === code)) code = 'en';
  S.LANG = code;
  for (const k of Object.keys(L)) delete L[k];
  // le français et l'anglais sont complets ; les autres langues retombent sur l'anglais pour une clé oubliée
  Object.assign(L, code === 'fr' ? TXT.fr : Object.assign({}, TXT.en, TXT[code]));
  refill(SUN_TRAPS, L.chant.traps); refill(MOON_TRAPS, L.chant.moonTraps);
  document.documentElement.lang = code === 'pt' ? 'pt-BR' : code;
  document.title = `${L.title1} ${L.title2}`;
  const c = document.getElementById('c');
  if (c) c.setAttribute('aria-label', `${L.title1} ${L.title2} ${L.rules}`);
}
function setLang(code) {                            // depuis l'accueil (js/ui/home.js) : tout se réécrit dans la nouvelle langue
  if (code === S.LANG) return;
  applyLang(code);
  S.store.set('lang', code);
  ['refreshMute', 'refreshUI', 'qualLabel'].forEach(f => { if (typeof S[f] === 'function') S[f](); });
  if (S.Voice && S.Voice.repick) S.Voice.repick();
}
applyLang(S.LANG);

Object.assign(S, { applyLang, setLang });
})(window.Soleil);
