/* js/platform/showcase.js — Mode vitrine (développement seulement, absent du build Poki) : une scène qui tourne en
   boucle, sans boutons ni textes d'interface, pour les miniatures et la vidéo de Poki (tools/thumbnails.py).
   index.html?showcase=race            un niveau joué par un bon joueur robot, qui recommence à la fin (défaut : w2-3)
   index.html?showcase=race&lv=w1-8    un autre niveau (ici le boss Soleil Cool)
   index.html?showcase=title           l'accueil : le soleil, le coureur et le logo (&nologo : sans le logo)
   On peut ajouter &lang=en (ou es, pt, de, it). Le robot attend de LIRE le mot : il lâche au début commun
   (« SO », « RED »…), repart au « ding », et fait parfois un « OUF » de justesse pour que ça vive. */
(function (S) {
'use strict';
const q = location.search, m = q.match(/[?&]showcase=(\w+)/);
if (!m) return;
const scene = m[1] === '1' ? 'race' : m[1];
const LV = (q.match(/[?&]lv=([\w-]+)/) || [])[1] || 'w2-3';
S.showcase = scene; S.showcaseNoLogo = /[?&]nologo/.test(q);
const css = document.createElement('style');
css.textContent = 'body.showcase #meta, body.showcase #home, body.showcase .round, body.showcase #toast, body.showcase #trialTag,'
  + ' body.showcase #over, body.showcase .lvcard, body.showcase #duoEnd, body.showcase #pause, body.showcase #langCard,'
  + ' body.showcase #panel, body.showcase #adShield { display:none !important; } body.showcase { cursor:none; }';
document.head.appendChild(css);
document.body.classList.add('showcase');
try { localStorage.setItem('soleil.onboard', '3'); } catch (e) { /* rien */ }

function start() {
  if (scene !== 'race') return;
  const L = S.Levels;
  L.open(LV, false);
  let endT = 0, n = 0;
  const orig = L.update.bind(L);
  L.update = dt => {
    if (L.phase === 'intro' || L.phase === 'boss') { if (L.phase === 'intro') L.press(); }
    const lm = L.m;
    if (lm && L.phase === 'play') {
      const w = lm.sun;
      const stop = (w.state === 'chant' && (w.textKind === 'so' || w.textKind === 'trigger')) || w.state === 'turn' || w.state === 'look'
        || w.state === 'peek' || w.state === 'hop' || (w.state === 'return' && w.retTo > 0);
      const late = w.state === 'chant' && w.textKind === 'so' && (n++ % 3 === 0) && lm.t - w.textAt < 0.12;   // un « OUF » de temps en temps
      S.pressing = !stop || late;
    } else S.pressing = false;
    orig(dt);
    if (S.particles.length) S.particles = S.particles.filter(pt => pt.type !== 'text');   // pas de textes volants (« HA HA ! »…)
    if (L.phase === 'results' || L.phase === 'caught' || L.phase === 'fail') {
      endT += dt;
      if (endT > 1.4) { endT = 0; L.open(LV, false); }   // et on recommence
    }
  };
}
// après le chargement (les autres modules et le titre sont prêts)
if (document.readyState === 'complete') setTimeout(start, 50); else window.addEventListener('load', () => setTimeout(start, 50));
Object.assign(S, { showcaseStart: start });
})(window.Soleil);
