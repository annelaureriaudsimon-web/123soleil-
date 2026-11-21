/* js/ui/home.js — Écran d’accueil */
(function (S) {
'use strict';
const { L, $, esc, dailyState, DAY, missionsDone, streakAlive, todayNumber, untilMidnight, Sound, Lt, over,
  newRunner, newWatcher, rankIndex, rankLabel, startRun, shareTextNow, canAfford, releaseAll, icon, setIcon } = S;   // déjà chargés

// Le contenu d'un gros bouton de l'accueil : une pastille ronde avec l'icône, le titre, et une petite ligne dessous
const hb = (ic, title, hint) => `<span class="bi">${icon(ic)}</span><span class="bt"><b>${esc(title)}</b><small>${esc(hint)}</small></span>`;

function refreshUI() {
  const showMeta = S.state === 'title';
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
  $('homeBtn').classList.toggle('hide', !(S.state === 'duo' || S.state === 'map' || S.state === 'level'));
  $('locker').classList.toggle('hide', !(S.state === 'title' || S.state === 'over' || S.state === 'map'));
  $('voice').classList.toggle('hide', S.state === 'map' || S.state === 'level');
  document.body.classList.toggle('st-map', S.state === 'map');   // carte : le casier passe sous le bouton 🏠   // la voix est réservée à la course infinie (monde 1)
  const dot = canAfford();
  $('dot1').classList.toggle('hide', !dot); $('dot2').classList.toggle('hide', !dot);
}
function renderHome() {
  const d = dailyState(), box = $('dailyBox');
  $('home').classList.toggle('done', !!d);
  if (!d) {                                        // pas encore joué : le gros bouton du défi
    box.innerHTML = `<button id="dailyBtn" class="hbtn daily c-orange" type="button">${hb('sun', L.dailyBtn(DAY), L.dailyHint)}</button>`;
  } else {                                         // déjà joué : résultat, grille, compte à rebours, repartage
    const grid = d.done && Array.isArray(d.lines) && d.lines.length ? `<div class="g">${esc(d.lines.join('\n'))}</div>` : '';
    const again = d.done && d.share ? `<button id="reshare" type="button">${icon('share')}${esc(L.reshare)}</button>` : '';
    box.innerHTML = `<div class="dcard"><div class="t">${esc(d.done ? L.dailyDone(DAY, d.dist) : L.dailyLost(DAY))}</div>${grid}`
                  + `<div class="r"><span class="c" id="countdown">${esc(L.nextIn(untilMidnight()))}</span>${again}</div></div>`;
  }
  const lastWorld = S.WORLDS.filter(w => w.levels.length && S.Levels.worldOpen(w)).pop() || S.WORLDS[0];   // le monde ouvert le plus loin
  $('lvBtn').innerHTML = hb('play', L.levelsBtn, L.levelsHint(S.Levels.totalStars(), S.Levels.maxStars(), S.tr(lastWorld.name)));   // le mode principal
  $('freeBtn').innerHTML = hb('infinity', L.endlessBtn, L.freeHint);
  $('duoBtn').innerHTML = hb('duo', L.duoBtn, L.duoHint);
  $('rules').textContent = L.rules;
}
function layoutHome() {                            // boutons en bas (portrait) ou en bas à droite (paysage)
  const el = $('home');
  if (el.classList.contains('hide')) return;
  const side = Lt.land && S.W > S.H * 1.2;
  el.classList.toggle('side', side);
  Lt.homeTop = side ? 0 : el.getBoundingClientRect().top;   // le titre se cale au-dessus
}
function goHome() {
  if (S.state === 'level' && S.Levels.m) { S.Levels.toMap(); return; }   // 🏠 pendant un niveau : retour à la carte
  if (todayNumber() !== DAY) { location.reload(); return; }   // minuit est passé : nouveau défi
  S.Levels.cleanup(); S.mapKeys = false;                       // on quitte proprement le mode Niveaux
  S.state = 'title'; S.mode = 'free'; S.duo = null;
  clearTimeout(S.armTimer); clearTimeout(S.deTimer);
  over.classList.remove('show', 'armed'); $('duoEnd').classList.remove('show', 'armed');
  releaseAll();
  S.runner = newRunner();
  const rayA = S.watcher.rayA;
  S.watcher = newWatcher(); S.watcher.rayA = rayA;
  S.particles = []; S.shake = 0; S.flash = 0; S.timeScale = 1;
  S.phaseTitle = null; S.bossBanner = null; S.bossQueue = []; S.trapWatch = null; S.combo = 0;
  refreshUI();
}
$('home').addEventListener('click', e => {
  const b = e.target.closest ? e.target.closest('button') : null;
  if (!b) return;
  e.stopPropagation(); Sound.unlock(); b.blur();
  if (b.id === 'lvBtn') S.WorldMap.open();
  else if (b.id === 'dailyBtn') startRun('daily');
  else if (b.id === 'freeBtn') startRun('free');
  else if (b.id === 'duoBtn') S.startDuo();
  else if (b.id === 'reshare') { const d = dailyState(); if (d && d.share) shareTextNow(d.share); }
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
