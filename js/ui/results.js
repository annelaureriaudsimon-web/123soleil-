/* js/ui/results.js — Fin d'un niveau : carte de défaite (pourquoi, à combien de l'arrivée, on relance d'un tap)
   et écran de résultats (classement, étoiles qui s'allument une par une, Suivant / Rejouer / Carte). */
(function (S) {
'use strict';
const { L, tr, esc, fmt, Sound, PROFILES, lvCard, goalText, confetti, vibrate, icon } = S;

// ---------- Réglages ----------
const STAR_DELAY = 0.45;       // une étoile s'allume toutes les 0,45 s
const ARM_DELAY = 0.6;         // les boutons répondent après 0,6 s (pas de clic par erreur)
const RANK_MAX = 5;            // lignes du classement affichées

let timers = [];
const later = (f, s) => timers.push(setTimeout(f, s * 1000));
function closeLevelCards() {
  timers.forEach(clearTimeout); timers = [];
  ['lvIntro', 'lvFail', 'lvEnd'].forEach(id => { const el = document.getElementById(id); if (el) el.classList.remove('show', 'armed'); });
}

// ---------- Défaite : « GRILLÉ ! Lâché 0,08 s trop tard ! À 6 m de l'arrivée ! » ----------
function showLevelFail(info) {
  closeLevelCards();
  const el = lvCard('lvFail');
  el.className = 'lvcard fail';
  const revive = S.Reward.canRevive();            // 🎬 2e chance (pub récompensée) : avec son bouton normal « Réessayer »
  const night = info.res && info.res.why === 'night';   // v2.5 : après « LA NUIT TOMBE ! », la 2e chance = +10 s de jour
  el.innerHTML = `<div class="why">${esc(info.why)}</div><div class="almost">${esc(info.almost)}</div>`
    + (info.tip ? `<div class="tipx">${esc(info.tip)}</div>` : '')
    + (revive ? S.Reward.pairHTML({ act: 'retry', label: L.tryAgain, icon: 'restart' },
                                  { kind: 'revive', token: S.Reward.reviveToken(), label: night ? L.reviveNightBtn : L.reviveBtn, cap: night ? L.reviveNightCap : L.reviveCap })
              : `<div class="tap">${S.touchUI ? '👆 ' : ''}${esc(S.forDevice(L.failTap, L.keyRetry))}</div>`)
    + `<div class="btns"><button class="btn sm c-white" type="button" data-act="map">${icon('grid')}${esc(L.mapBtn)}</button></div>`;
  el.classList.add('show');
  later(() => el.classList.add('armed'), 0.25);
}

// ---------- Victoire : classement + étoiles une par une ----------
function showLevelResults(info) {
  closeLevelCards();
  const el = lvCard('lvEnd'), lv = info.def, res = info.res;
  const lines = [[L.goalDone, info.stars[0]], [goalText(lv, lv.goal), info.stars[1]],
                 [goalText(lv, lv.challenge) + (res.revived ? ` (${L.noChallengeRevive})` : ''), info.stars[2]]];   // après une 2e chance : pas de défi
  let rank = info.ranking.map((e, i) => ({ e, i }));
  const me = rank.find(x => x.e.you);
  if (rank.length > RANK_MAX) rank = rank.slice(0, RANK_MAX - 1).concat(me && me.i >= RANK_MAX - 1 ? [me] : [rank[RANK_MAX - 1]]);
  const medal = i => ['🥇', '🥈', '🥉'][i] || `${i + 1}.`;
  const rows = rank.map(({ e, i }) => {
    const who = e.you ? `<b>${esc(L.you)}</b>` : `${(PROFILES[e.kind] || {}).emoji || ''} ${esc(e.name)}`;
    const t = e.time != null ? `${fmt(e.time).replace(/[.,]\d$/, '')} s` : esc(L.notIn);
    return `<div class="rk${e.you ? ' me' : ''}"><span>${medal(i)}</span><span>${who}</span><span>${t}</span></div>`;
  }).join('');
  const extra = [info.newBest && res.time ? L.bestTime(fmt(res.time).replace(/[.,]\d$/, '')) : '', info.coins ? L.coins(info.coins) : ''].filter(Boolean).join(' · ')
    + (info.bonus ? ` (${L.bonusStars(info.bonus)})` : '');
  el.className = 'lvcard end' + (lv.boss ? ' boss' : '');
  el.innerHTML = `<div class="ttl">${esc(lv.boss ? L[S.bossOf(lv).win] : L.winTitle)}</div>`
    + `<div class="lvl">${esc(L.levelN(lv.num))} · ${lv.emoji} ${esc(tr(lv.name))}</div>`
    + `<div class="stars">${[0, 1, 2].map(i => `<span data-i="${i}">★</span>`).join('')}</div>`
    + `<div class="goals">${lines.map(([t, ok], i) => `<div data-g="${i}"><b>${'★'.repeat(i + 1)}</b> ${esc(t)} <i></i></div>`).join('')}</div>`
    + (info.ranking.length > 1 ? `<div class="rank">${rows}</div>` : '')
    + (extra ? `<div class="extra">${esc(extra)}</div>` : '')
    + (lv.boss && info.firstWin ? `<div class="extra">${esc(L[lv.world === 3 ? 'worldDone3' : lv.world === 2 ? 'worldDone2' : 'worldDone'])}</div>` : '')
    + (S.Reward.canDouble()                       // 🎬 ×2 ⭐ : à côté du bouton normal vert (Suivant, ou Carte au dernier niveau)
        ? S.Reward.pairHTML(info.next ? { act: 'next', label: L.nextBtn, icon: 'play' } : { act: 'map', label: L.mapBtn, icon: 'grid' },
                            { kind: 'double', token: S.Reward.doubleToken(), label: L.doubleBtn, cap: L.doubleCap(info.coins) })
          + `<div class="btns"><button class="btn c-orange" type="button" data-act="retry">${icon('restart')}${esc(L.retryBtn)}</button>`
          + (info.next ? `<button class="btn c-white" type="button" data-act="map">${icon('grid')}${esc(L.mapBtn)}</button>` : '') + `</div>`
        : `<div class="btns">${info.next ? `<button class="btn c-green" type="button" data-act="next">${esc(L.nextBtn)}${icon('play')}</button>` : ''}`
          + `<button class="btn c-orange" type="button" data-act="retry">${icon('restart')}${esc(L.retryBtn)}</button>`
          + `<button class="btn c-white" type="button" data-act="map">${icon('grid')}${esc(L.mapBtn)}</button></div>`);
  el.classList.add('show');
  info.stars.forEach((ok, i) => later(() => {           // les étoiles s'allument une par une
    const st = el.querySelector(`.stars span[data-i="${i}"]`), g = el.querySelector(`.goals div[data-g="${i}"]`);
    if (ok) { st.classList.add('on'); Sound.starOn(i); confetti(18 + i * 10); vibrate(15); }
    else { st.classList.add('off'); Sound.starOff(); }
    if (g) { g.classList.add(ok ? 'ok' : 'no'); g.querySelector('i').textContent = ok ? '✓' : '✗'; }
  }, 0.4 + i * STAR_DELAY));
  later(() => el.classList.add('armed'), ARM_DELAY);
}

// Boutons des cartes (Suivant, Rejouer, Carte)
document.addEventListener('click', e => {
  const b = e.target.closest ? e.target.closest('.lvcard button') : null;
  if (!b) return;
  e.stopPropagation(); Sound.unlock(); b.blur();
  const a = b.dataset.act;
  if (a === 'next') S.Levels.next();
  else if (a === 'retry') S.Levels.retry();
  else if (a === 'map') S.Levels.toMap();
});

Object.assign(S, { closeLevelCards, showLevelFail, showLevelResults });
})(window.Soleil);
