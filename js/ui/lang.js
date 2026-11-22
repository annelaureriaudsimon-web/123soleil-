/* js/ui/lang.js — Choisir la langue depuis l'accueil (bouton rond « FR », « EN »…) */
(function (S) {
'use strict';
const { L, LANGS, $, esc, Sound } = S;   // déjà chargés

const btn = $('langBtn'), card = $('langCard');
function syncLangBtn() {                           // seulement sur l'accueil (en jeu, on ne change pas de langue)
  btn.classList.toggle('hide', S.state !== 'title' || !!S.booting);
  btn.textContent = S.LANG.toUpperCase();
  btn.setAttribute('aria-label', L.langLbl); btn.title = L.langLbl;
}
function openLang() {
  $('lTitle').textContent = L.langLbl;
  $('lList').innerHTML = LANGS.map(l => `<button class="btn ${l.code === S.LANG ? 'c-green' : 'c-white'}" type="button" data-lang="${l.code}" lang="${l.code}">${esc(l.name)}</button>`).join('');
  card.classList.remove('hide');
  const cur = card.querySelector(`[data-lang="${S.LANG}"]`); if (cur) cur.focus();
}
const closeLang = () => card.classList.add('hide');
const langOpen = () => !card.classList.contains('hide');
btn.addEventListener('click', e => { e.stopPropagation(); Sound.unlock(); btn.blur(); openLang(); });
btn.addEventListener('pointerdown', e => e.stopPropagation());
card.addEventListener('pointerdown', e => e.stopPropagation());
card.addEventListener('click', e => {
  e.stopPropagation();
  const b = e.target.closest ? e.target.closest('[data-lang]') : null;
  if (b) S.setLang(b.dataset.lang);
  else if (e.target.closest && e.target.closest('.lcard')) return;   // un clic dans la carte, à côté des boutons
  closeLang(); syncLangBtn();
});
document.addEventListener('keydown', e => { if (langOpen() && e.code === 'Escape') { e.stopPropagation(); e.preventDefault(); closeLang(); } }, true);

Object.assign(S, { syncLangBtn, openLang, closeLang, langOpen });
})(window.Soleil);
