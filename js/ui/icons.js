/* js/ui/icons.js — Les icônes des boutons (jouer, accueil, son, casier…), dessinées en SVG dans le code :
   rien à télécharger, elles restent nettes sur tous les écrans. Blanches par défaut (couleur du texte du bouton). */
(function (S) {
'use strict';

// Chaque icône tient dans un carré de 24 × 24. « s » = traits (contours ronds), le reste = formes pleines.
const s = (d, w = 2.4) => `<path d="${d}" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const ICONS = {
  play: '<path d="M8 5.3v13.4a1.1 1.1 0 0 0 1.7.93l10.4-6.7a1.1 1.1 0 0 0 0-1.86L9.7 4.37A1.1 1.1 0 0 0 8 5.3z"/>',
  home: '<path d="M12 3.1 2.6 11.2a1 1 0 0 0 .66 1.76H5.4V20a1 1 0 0 0 1 1h4.1v-5.6h3V21h4.1a1 1 0 0 0 1-1v-7.04h2.14a1 1 0 0 0 .66-1.76z"/>',
  grid: [3, 9.5, 16].map(y => [3, 9.5, 16].map(x => `<rect x="${x}" y="${y}" width="5" height="5" rx="1.3"/>`).join('')).join(''),
  restart: '<path d="M12 3.6a8.4 8.4 0 1 0 8.15 10.4h-2.75A5.8 5.8 0 1 1 12 6.2c1.6 0 3.05.66 4.1 1.72L13.2 10.8h7.4V3.4l-2.5 2.5A8.37 8.37 0 0 0 12 3.6z"/>',
  close: '<path d="M6.3 4.2 12 9.9l5.7-5.7a1.5 1.5 0 0 1 2.1 2.1L14.1 12l5.7 5.7a1.5 1.5 0 0 1-2.1 2.1L12 14.1l-5.7 5.7a1.5 1.5 0 0 1-2.1-2.1L9.9 12 4.2 6.3a1.5 1.5 0 0 1 2.1-2.1z"/>',
  soundOn: '<path d="M2.8 9.3h3.7L11.6 5v14l-5.1-4.3H2.8z"/>' + s('M14.8 8.7a4.8 4.8 0 0 1 0 6.6M17.6 6a8.6 8.6 0 0 1 0 12'),
  soundOff: '<path d="M2.8 9.3h3.7L11.6 5v14l-5.1-4.3H2.8z"/>' + s('M15.2 9.4l5 5.2M20.2 9.4l-5 5.2'),
  mic: '<rect x="8.8" y="2.8" width="6.4" height="11.4" rx="3.2"/>' + s('M5.8 11a6.2 6.2 0 0 0 12.4 0M12 17.4v3.2M8.6 20.8h6.8', 2.2),
  shirt: '<path d="M8.6 3.4 3.9 5.7 2.3 10.3l3.2 1.4v8.9h13V11.7l3.2-1.4-1.6-4.6-4.7-2.3C14.8 5 13.5 5.9 12 5.9S9.2 5 8.6 3.4z"/>',
  share: '<path d="M12 2.8 7.4 7.4h3.3v6.9h2.6V7.4h3.3z"/><path d="M4.8 11.2v8.1a1.6 1.6 0 0 0 1.6 1.6h11.2a1.6 1.6 0 0 0 1.6-1.6v-8.1h-2.6v7.1H7.4v-7.1z"/>',
  camera: '<path fill-rule="evenodd" d="M9.1 4.8 7.8 6.9H5a2 2 0 0 0-2 2v9.4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.9a2 2 0 0 0-2-2h-2.8l-1.3-2.1zM12 9.6a3.9 3.9 0 1 0 0 7.8 3.9 3.9 0 0 0 0-7.8z"/>',
  star: '<path d="M12 2.6l2.85 5.8 6.35.92-4.6 4.48 1.09 6.33L12 17.15l-5.69 2.98 1.09-6.33-4.6-4.48 6.35-.92z"/>',
  infinity: s('M7.2 8.4a3.6 3.6 0 1 0 0 7.2c3.6 0 6-7.2 9.6-7.2a3.6 3.6 0 1 1 0 7.2c-3.6 0-6-7.2-9.6-7.2z', 2.7),
  duo: '<circle cx="8.4" cy="7.8" r="3.3"/><circle cx="16.3" cy="8.6" r="2.8"/><path d="M2.2 20c0-3.8 2.8-6.4 6.2-6.4s6.2 2.6 6.2 6.4z"/><path d="M15.7 20c0-2.2-.6-4-1.8-5.4.75-.5 1.6-.75 2.5-.75 3.1 0 5.4 2.4 5.4 6.15z"/>',
  sun: '<circle cx="12" cy="12" r="4.7"/>' + s('M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.35 5.35l1.55 1.55M17.1 17.1l1.55 1.55M5.35 18.65l1.55-1.55M17.1 6.9l1.55-1.55', 2.3),
  trophy: '<path d="M7 3.2h10v1.4h3.1v2.2a4.6 4.6 0 0 1-4.1 4.57 5.1 5.1 0 0 1-2.8 2.43v2.4h2.6v2.6H8.2v-2.6h2.6v-2.4A5.1 5.1 0 0 1 8 11.37 4.6 4.6 0 0 1 3.9 6.8V4.6H7zM5.9 6.6v.2a2.6 2.6 0 0 0 1.4 2.3A5 5 0 0 1 7 7.6v-1zm12.2 0H17v1a5 5 0 0 1-.3 1.5 2.6 2.6 0 0 0 1.4-2.3z"/><rect x="6.6" y="18.4" width="10.8" height="2.6" rx="1"/>',
  target: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.4"/><circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="2.4"/><circle cx="12" cy="12" r="1.9"/>',
  video: '<rect x="2.4" y="6.1" width="13.6" height="11.8" rx="2.6"/><path d="M17.3 10.5 21.6 7.7v8.6l-4.3-2.8z"/>',   // 🎬 pub récompensée
  pause: '<rect x="5.6" y="4.4" width="4.6" height="15.2" rx="1.6"/><rect x="13.8" y="4.4" width="4.6" height="15.2" rx="1.6"/>',
};

// Le code SVG d'une icône, à glisser dans un bouton (cls : classe CSS en plus)
function icon(name, cls = '') {
  const body = ICONS[name];
  if (!body) return '';
  return `<svg class="ico${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">${body}</svg>`;
}
// Remplace l'icône (ou l'emoji) d'un bouton fixe de la page, en gardant le reste (pastille rouge…)
function setIcon(el, name) {
  if (typeof el === 'string') el = document.getElementById(el);
  if (!el) return;
  [...el.childNodes].forEach(n => { if (n.nodeType === 3 || (n.nodeType === 1 && n.tagName.toLowerCase() === 'svg')) n.remove(); });
  el.insertAdjacentHTML('afterbegin', icon(name));
}

Object.assign(S, { ICONS, icon, setIcon });
})(window.Soleil);
