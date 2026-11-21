/* js/ui/share.js — Partage du texte de la partie */
(function (S) {
'use strict';
const { L, $, DAY, howLine, phaseLines, rankShareLine } = S;   // déjà chargés

function shareText() {                           // 7 lignes maximum, lisible sur WhatsApp, Discord, SMS (sans adresse de page)
  const R = S.lastRun;
  if (!R) return '';
  const head = `☀️ 1, 2, 3… SOLEIL ! ${R.mode === 'daily' ? '#' + DAY : L.freeRun} — ${R.dist}\u00A0m`;
  return [head, ...phaseLines(R.events, 4), howLine(R), rankShareLine(R)].join('\n');
}
function legacyCopy(t) {
  try {
    const ta = document.createElement('textarea');
    ta.value = t; ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;-webkit-user-select:text;user-select:text;';
    document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0, t.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch (e) { return false; }
}

function shareTextNow(text) {                     // copie le texte (+ feuille de partage sur mobile, hors iframe)
  const sheet = !!navigator.share && matchMedia('(pointer: coarse)').matches && !S.embedded;   // dans l'iframe de Poki, le partage est souvent interdit
  const done = ok => { if (!sheet) S.toast(ok ? L.copied : L.copyFail, true); };
  try {
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(() => done(true), () => done(legacyCopy(text)));
    else done(legacyCopy(text));
  } catch (err) { done(legacyCopy(text)); }
  if (sheet) navigator.share({ text }).catch(() => {});
}
const shareBtn = $('share');
shareBtn.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); shareTextNow(shareText()); shareBtn.blur(); });
shareBtn.addEventListener('pointerdown', e => e.stopPropagation());
$('imgBtn').addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); S.shareImage(); $('imgBtn').blur(); });
$('imgBtn').classList.toggle('hide', !!S.embedded);   // dans une iframe (Poki), télécharger une image est bloqué : pas de bouton Image

Object.assign(S, { shareText, legacyCopy, shareTextNow, shareBtn });
})(window.Soleil);
