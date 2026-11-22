/* js/ui/reward.js — Les pubs récompensées (bouton 🎬), en respectant TOUTES les règles de Poki :
   - la vidéo passe uniquement par le SDK (S.Poki.rewardedBreak, js/platform/poki.js) ;
   - le bouton 🎬 annonce la vidéo AVANT (icône caméra + phrase « Regarde une courte vidéo pour… ») ;
   - un bouton NORMAL est toujours affiché EN MÊME TEMPS, à côté (à gauche) ou au-dessus du bouton 🎬,
     de taille supérieure ou égale ; il est VERT, et le bouton 🎬 ne l'est jamais (violet) ;
   - la récompense n'est donnée QUE si la vidéo a été vue jusqu'au bout (true), une seule fois par occasion
     (jeton : double tap, retour en arrière ou rechargement ne la redonnent jamais) ;
   - une seule vidéo par récompense ; pas de message sur les bloqueurs de pub (au plus « Vidéo indisponible ») ;
   - pendant la vidéo : jeu figé, tout le son coupé, entrées bloquées (js/platform/flow.js, hooks de la pub) ;
   - pas de minuteur de pubs maison ;
   - mode de secours (aucun SDK : fichier ouvert en double-clic, hors ligne) : AUCUN bouton 🎬 (aucune vidéo possible).
   Les 3 récompenses : 2e chance (niveaux, course infinie), ×2 ⭐ (résultats d'un niveau), essayer une tenue (casier). */
(function (S) {
'use strict';
const { L, Sound, Poki, icon, esc, vibrate, confetti, tr, outfitById } = S;   // déjà chargés

// ---------- Réglages ----------
const SIZE = { revive: 'medium', double: 'small', trial: 'small' };   // taille de la pub selon la valeur de la récompense

const granted = new Set();          // jetons déjà récompensés
S.rewardWait = false;               // une vidéo est demandée ou en cours

// Une vidéo est-elle possible ici ? (SDK présent, rien d'autre en cours)
const available = () => Poki.mode === 'sdk';

// Le duo de boutons. normal = { act, label, icon } (vert, à gauche, plus large) ; reward = { kind, token, label, cap }.
// La phrase en dessous dit que c'est une vidéo, avant tout clic.
function pairHTML(normal, reward) {
  return `<div class="rpair">`
    + `<button class="btn c-green rnorm" type="button" data-act="${esc(normal.act)}">${normal.icon ? icon(normal.icon) : ''}${esc(normal.label)}</button>`
    + `<button class="btn c-purple rbtn" type="button" data-reward="${esc(reward.kind)}" data-token="${esc(reward.token)}"`
    + ` aria-label="${esc(reward.cap)}">${icon('video')}${esc(reward.label)}</button>`
    + `</div><div class="rcap">${icon('video', 'sm')}${esc(reward.cap)}</div>`;
}
const used = token => granted.has(token);

// ---------- Le clic sur un bouton 🎬 ----------
const handlers = {};                // kind → { can(token), give(token, el) }
function claim(btn) {
  const kind = btn.dataset.reward, token = btn.dataset.token || kind, h = handlers[kind];
  if (!h || S.rewardWait || Poki.busy || S.breakWait || btn.disabled) return;
  if (used(token) || !h.can(token)) { done(btn); return; }
  S.rewardWait = true;
  const box = btn.closest('.rpair, .ofiche') || btn.parentNode;
  box.classList.add('busy'); btn.classList.add('loading');
  S.releaseAll();
  S.syncGameplay();                                // arrêté avant la vidéo (on est déjà sur un écran de fin)
  Poki.rewardedBreak(SIZE[kind] || 'small').then(ok => {
    S.rewardWait = false;
    box.classList.remove('busy'); btn.classList.remove('loading');
    S.releaseAll();                                // aucun appui fantôme après la vidéo
    S.last = performance.now();
    if (ok === true && !used(token) && h.can(token)) {
      granted.add(token);
      done(btn);
      Sound.buy(); vibrate([20, 30, 40]); confetti(30);
      h.give(token, btn);
    } else if (!used(token)) S.toast(L.noVideo, true);   // pas de vidéo : rien n'est donné, le bouton reste là
    S.syncGameplay(); S.refreshUI();
  });
}
function done(btn) {                                // déjà donnée : le bouton devient « ✓ » et ne répond plus
  btn.disabled = true; btn.classList.add('got');
  btn.innerHTML = '✓ ' + esc(L.rewardDone);
}
document.addEventListener('click', e => {
  const b = e.target.closest ? e.target.closest('[data-reward]') : null;
  if (!b) return;
  e.preventDefault(); e.stopPropagation(); Sound.unlock(); b.blur();
  claim(b);
}, true);
document.addEventListener('pointerdown', e => { if (e.target.closest && e.target.closest('[data-reward], .rpair')) e.stopPropagation(); }, true);

// ---------- 1. La 2e chance : niveaux (carte de défaite) et course infinie (écran de fin) ----------
// Une seule par essai de niveau / par partie de course infinie. Jamais : défi du jour, 2 joueurs, niveau en douceur.
const reviveToken = () => (S.state === 'level' && S.Levels.m ? `revive:${S.Levels.def.id}:${S.Levels.attempt}` : `revive:run:${S.runSeed}:${S.runNo || 0}`);
function canRevive() {
  if (!available()) return false;
  if (S.state === 'level') { const m = S.Levels.m; return !!m && S.Levels.phase === 'fail' && !m.revived && !m.level.soft && !used(reviveToken()); }
  if (S.state === 'over') return S.mode === 'free' && !S.revivedRun && !used(reviveToken());
  return false;
}
handlers.revive = {
  can: token => canRevive() && token === reviveToken(),
  give: () => { if (S.state === 'level') S.Levels.revive(); else S.reviveRun(); }
};

// ---------- 2. ×2 ⭐ : écran de résultats d'un niveau qui vient de rapporter des ⭐ ----------
const doubleToken = () => (S.Levels.info ? `double:${S.Levels.def.id}:${S.Levels.attempt}` : '');
function canDouble() {
  const info = S.Levels.info;
  return available() && S.state === 'level' && S.Levels.phase === 'results' && !!info && info.coins > 0 && !info.doubled && !used(doubleToken());
}
handlers.double = {
  can: token => canDouble() && token === doubleToken(),
  give: (token, btn) => {
    const info = S.Levels.info, n = info.coins;
    info.doubled = true;
    S.addStars(n);
    const ex = btn.closest('.lvcard') && btn.closest('.lvcard').querySelector('.extra');
    if (ex) ex.textContent = ex.textContent.replace(L.coins(n), L.coins(n * 2) + L.doubledTag);
    S.popup(L.doubledPop(n), S.Lt.cx, S.Lt.hy + (S.Lt.yFeet - S.Lt.hy) * 0.2, '#FFD166', Math.min(S.Lt.U * 0.08, 44), 1.4);
    if (S.starPop) S.starPop(n);
  }
};

// ---------- 3. Essayer une tenue : portée pour la PROCHAINE partie seulement (un niveau ou une course) ----------
// S.trial = { id, state: 'ready' (en attente) | 'on' (pendant la partie) }. Jamais enregistré : un rechargement l'oublie.
S.trial = null;
function wornOutfit() {                            // la tenue dessinée : l'essai s'il y en a un (sauf défi du jour et 2 joueurs)
  const t = S.trial;
  if (!t) return S.outfit;
  if (t.state === 'on') return t.id;
  if (S.state === 'duo' || (S.mode === 'daily' && S.state !== 'title' && S.state !== 'map')) return S.outfit;
  return t.id;
}
const trialEligible = () => S.mode !== 'daily' && S.mode !== 'duo';
function trialBegin() {                            // une partie commence (niveau ou course libre)
  if (S.trial && S.trial.state === 'ready' && trialEligible()) S.trial.state = 'on';
  syncTrialTag();
}
function trialEnd() {                              // la partie avec la tenue d'essai est finie : on revient à la sienne
  const t = S.trial;
  if (!t || t.state !== 'on') return;
  S.trial = null;
  const o = outfitById(t.id);
  if (o && !S.owned.includes(o.id)) S.toast(L.trialEnd(tr(o), o.price));
  syncTrialTag();
}
const canTrial = id => available() && !S.owned.includes(id) && !(S.trial && S.trial.state === 'on');
handlers.trial = {
  can: token => canTrial(token.replace(/^trial:/, '')),
  give: token => {
    const id = token.replace(/^trial:/, ''), o = outfitById(id);
    S.trial = { id, state: 'ready' };
    granted.delete(token);                         // on pourra la réessayer plus tard (une vidéo = une partie)
    S.toast(L.trialOn(tr(o)), true);
    if (S.renderPanel) S.renderPanel();
    if (S.closeFiche) S.closeFiche();
    syncTrialTag(); S.refreshUI();
  }
};
// Le badge « Essai » à l'écran pendant la partie
const tag = document.createElement('div');
tag.id = 'trialTag'; tag.className = 'pill hide';
document.body.appendChild(tag);
function syncTrialTag() {
  const t = S.trial, inGame = S.state === 'play' || S.state === 'caught' || S.state === 'level';
  const show = !!t && t.state === 'on' && inGame;
  tag.classList.toggle('hide', !show);
  if (show) { const o = outfitById(t.id); tag.innerHTML = icon('shirt') + esc(L.trialTag(tr(o))); }
}

S.Reward = { available, pairHTML, used, canRevive, reviveToken, canDouble, doubleToken, canTrial, claim, granted };
Object.assign(S, { wornOutfit, trialBegin, trialEnd, syncTrialTag });
})(window.Soleil);
