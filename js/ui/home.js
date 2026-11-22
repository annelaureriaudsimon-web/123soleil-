/* js/ui/home.js — Écran d’accueil */
(function (S) {
'use strict';
const { L, $, esc, dailyState, DAY, missionsDone, streakAlive, todayNumber, untilMidnight, Sound, Lt, over,
  newRunner, newWatcher, rankIndex, rankLabel, startRun, canAfford, releaseAll, icon, setIcon } = S;   // déjà chargés

// Le contenu d'un gros bouton de l'accueil : une pastille ronde avec l'icône, le titre, et une petite ligne dessous
const hb = (ic, title, hint) => `<span class="bi">${icon(ic)}</span><span class="bt"><b>${esc(title)}</b><small>${esc(hint)}</small></span>`;

function refreshUI() {
  const showMeta = S.state === 'title' && !S.booting;   // pendant le chargement : le titre seul
  const meta = $('meta');
  meta.classList.toggle('hide', !showMeta);
  if (showMeta) {
    const lines = [];
    if (S.best > 0) lines.push(`<div class="mrow"><span class="pill g">${esc(rankLabel(rankIndex(S.best)))}</span></div>`);   // des pastilles : rang,
    const row = [];                                // puis record, missions, étoiles et série du jour
    if (S.best > 0) row.push(`<span class="pill" title="${esc(L.meta2('', Math.floor(S.best)).replace(/^ · /, ''))}">${icon('trophy')}${Math.floor(S.best)}\u00A0m</span>`);
    if (S.plays > 0) {
      const n = streakAlive();
      row.push(`<span class="pill">${icon('target')}${missionsDone()}/3</span>`, `<span class="pill">${icon('star', 'gold')}${S.stars}</span>`);
      if (n) row.push(`<span class="pill">🔥\u00A0${n}</span>`);
    }
    if (row.length) lines.push(`<div class="mrow">${row.join('')}</div>`);
    meta.innerHTML = lines.join('');
  }
  $('home').classList.toggle('hide', !showMeta);
  if (showMeta) { renderHome(); layoutHome(); }
  $('locker').classList.toggle('hide', !(S.state === 'title' || S.state === 'over' || S.state === 'map') || !!S.booting);
  document.body.classList.toggle('st-map', S.state === 'map');   // carte : le casier passe sous le bouton 🏠
  if (S.syncButtons) S.syncButtons(true);
  if (S.syncLangBtn) S.syncLangBtn();              // bouton de langue « FR » (js/ui/lang.js), accueil seulement
  if (S.syncTrialTag) S.syncTrialTag();            // le badge « Essai » (pub récompensée, js/ui/reward.js)          // ⏸, 🏠 et 🗣️ (ils changent aussi pendant la partie : js/ui/pause.js)
  const dot = canAfford();
  $('dot1').classList.toggle('hide', !dot); $('dot2').classList.toggle('hide', !dot);
}
function renderHome() {
  const d = dailyState(), box = $('dailyBox');
  $('home').classList.toggle('done', !!d);
  if (!d) {                                        // pas encore joué : le gros bouton du défi
    box.innerHTML = `<button id="dailyBtn" class="hbtn daily c-orange" type="button">${hb('sun', L.dailyBtn(DAY), L.dailyHint)}</button>`;
  } else {                                         // déjà joué : résultat et compte à rebours
    box.innerHTML = `<div class="dcard"><div class="t">${esc(d.done ? L.dailyDone(DAY, d.dist) : L.dailyLost(DAY))}</div>`
                  + `<div class="r"><span class="c" id="countdown">${esc(L.nextIn(untilMidnight()))}</span></div></div>`;
  }
  const cont = S.Onboard.contLevel(), cw = S.WORLDS.find(w => w.id === cont.world) || S.WORLDS[0];   // un appui : on reprend là où on en était
  $('contBtn').innerHTML = hb('play', S.Onboard.started() ? L.contBtn : L.playBtn, L.contHint(cont.num, S.tr(cw.name)));
  $('lvBtn').innerHTML = hb('grid', L.levelsShort, `★ ${S.Levels.totalStars()}/${S.Levels.maxStars()}`);   // les autres modes, plus petits
  $('freeBtn').innerHTML = hb('infinity', L.endlessShort, L.freeHint);
  $('duoBtn').innerHTML = hb('duo', L.duoBtn, L.duoHint);
  $('rules').textContent = L.rules;
}
function layoutHome() {                            // boutons en bas (portrait) ou en bas à droite (paysage)
  const el = $('home');
  if (el.classList.contains('hide')) return;
  const side = Lt.land && S.W > S.H * 1.2;
  el.classList.toggle('side', side);
  fitRow();
  Lt.homeTop = side ? 0 : el.getBoundingClientRect().top;   // le titre se cale au-dessus
}
// Les 3 petits boutons (Niveaux, Infini, 2 joueurs) : le texte doit TOUJOURS tenir dans le bouton, à toutes les
// tailles et dans toutes les langues. On réduit d'abord la taille du texte ; si ça ne suffit pas, l'icône s'efface.
const FIT_MIN = 12;                                // px : taille de texte la plus petite acceptée
function fitRow() {
  const btns = [...document.querySelectorAll('#home .row .hbtn')];
  const over = bt => { const t = bt.querySelector('.bt'); return t && (t.scrollWidth > t.clientWidth + 0.5 || bt.scrollWidth > bt.clientWidth + 0.5); };
  btns.forEach(bt => { bt.classList.remove('noico'); const b = bt.querySelector('b'); if (b) b.style.fontSize = ''; });
  if (!btns.some(over)) return;
  const b0 = btns[0] && btns[0].querySelector('b');
  if (!b0) return;
  let fs = parseFloat(getComputedStyle(b0).fontSize);
  const setFs = v => btns.forEach(bt => { const b = bt.querySelector('b'); if (b) b.style.fontSize = v + 'px'; });   // même taille pour les 3
  while (fs > FIT_MIN && btns.some(over)) setFs(fs -= 0.5);
  if (btns.some(over)) {                           // toujours trop serré : sans l'icône, à la taille d'origine
    btns.forEach(bt => { bt.classList.add('noico'); const b = bt.querySelector('b'); if (b) b.style.fontSize = ''; });
    fs = parseFloat(getComputedStyle(b0).fontSize);
    while (fs > FIT_MIN && btns.some(over)) setFs(fs -= 0.5);
  }
}
window.addEventListener('resize', () => { if (!$('home').classList.contains('hide')) fitRow(); });
function goHome() {
  if (S.state === 'level' && S.Levels.m) { S.Levels.toMap(); return; }   // 🏠 pendant un niveau : retour à la carte
  if (todayNumber() !== DAY) { location.reload(); return; }   // minuit est passé : nouveau défi
  S.Levels.cleanup(); S.mapKeys = false;                       // on quitte proprement le mode Niveaux
  S.trialEnd();                                                // une tenue d'essai ne dure qu'une partie
  S.state = 'title'; S.mode = 'free'; S.duo = null;
  clearTimeout(S.armTimer); clearTimeout(S.deTimer);
  over.classList.remove('show', 'armed'); $('duoEnd').classList.remove('show', 'armed');
  releaseAll();
  S.runner = newRunner();
  const rayA = S.watcher.rayA;
  S.watcher = newWatcher(); S.watcher.rayA = rayA;
  S.particles = []; S.shake = 0; S.flash = 0; S.timeScale = 1;
  S.phaseTitle = null; S.bossBanner = null; S.bossQueue = []; S.trapWatch = null; S.combo = 0; S.plane = null;
  refreshUI();
}
$('home').addEventListener('click', e => {
  const b = e.target.closest ? e.target.closest('button') : null;
  if (!b) return;
  e.stopPropagation(); Sound.unlock(); b.blur();
  if (b.id === 'contBtn') S.Levels.open(S.Onboard.contLevel().id, false);   // la carte d'intro du niveau, tout de suite
  else if (b.id === 'lvBtn') S.WorldMap.open();
  else if (b.id === 'dailyBtn') startRun('daily');
  else if (b.id === 'freeBtn') startRun('free');
  else if (b.id === 'duoBtn') S.startDuo();
});
setIcon('homeBtn', 'home'); setIcon('homeBtn2', 'home');
['homeBtn', 'homeBtn2', 'deHome'].forEach(id => {
  $(id).addEventListener('click', e => { e.stopPropagation(); Sound.unlock(); $(id).blur(); goHome(); });
  $(id).addEventListener('pointerdown', e => e.stopPropagation());
});
S.homeTick = 0;
function tickHome() {                              // compte à rebours (et nouveau défi à minuit), appelé par la boucle de jeu
  if (S.state !== 'title' || S.gtime - S.homeTick < 0.25) return;
  S.homeTick = S.gtime;
  if (todayNumber() !== DAY) { location.reload(); return; }
  const el = $('countdown');
  if (el) { const t = L.nextIn(untilMidnight()); if (el.textContent !== t) el.textContent = t; }
}

Object.assign(S, { refreshUI, renderHome, layoutHome, goHome, tickHome });
})(window.Soleil);
