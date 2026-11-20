/* js/ui/locker.js — Casier : missions, médailles, tenues */
(function (S) {
'use strict';
const { L, tr, MEDALS, OUTFITS, RANKS, $, clamp, vibrate, store, DAY, streakAlive, todayMissions, Sound, panel,
  rankIndex, rankLabel, statValue, drawRunnerFig, toast } = S;   // déjà chargés

// Infos d'accueil, bouton casier et pastille « nouveauté »
const canAfford = () => OUTFITS.some(o => !S.owned.includes(o.id) && o.price <= S.stars);

// Le casier : rang, missions du jour, médailles, tenues
function openPanel() {
  S.panelOpen = true; S.releaseAll();
  renderPanel();
  panel.classList.remove('hide');
  panel.querySelector('.sheet').scrollTop = 0;
}
function closePanel() { S.panelOpen = false; panel.classList.add('hide'); S.refreshUI(); }
function renderPanel() {
  const ri = rankIndex(S.best);
  let next = `<div class="next">${L.maxRank}</div>`;
  if (ri < RANKS.length - 1) {
    const a = RANKS[ri].min, b = RANKS[ri + 1].min, pct = Math.round(100 * clamp((S.best - a) / (b - a), 0, 1));
    next = `<div class="bar"><i style="width:${pct}%"></i></div><div class="next">${L.toRank(Math.max(1, b - Math.floor(S.best)), rankLabel(ri + 1))}</div>`;
  }
  $('pHead').innerHTML = `<div class="rankBig">${RANKS[ri].e}</div><div class="rankName">${tr(RANKS[ri])}</div>`
    + `<div class="stats">${L.stats(Math.floor(S.best), streakAlive(), S.stars)}</div>${next}`;
  $('hMis').textContent = L.secMissions; $('hMed').textContent = L.secMedals; $('hOut').textContent = L.secOutfits;
  $('pMis').innerHTML = todayMissions.map(m => {
    const done = !!S.mstate.done[m.id];
    const val = done ? m.goal : Math.min(m.goal, m.daily ? statValue(m.stat) : (S.mstate.bestStat[m.stat] || 0));
    return `<div class="mis${done ? ' done' : ''}"><span class="ic">${done ? '✅' : '⬜'}</span><span class="lb">${tr(m)}</span>`
         + `<span class="pr">${val}/${m.goal}</span><span class="rw">+${m.reward} ⭐</span></div>`;
  }).join('');
  $('pMisFoot').textContent = L.misFoot;
  $('pMed').innerHTML = MEDALS.map(m => {
    const got = S.medals.includes(m.id);
    return `<div class="med${got ? '' : ' lock'}"><b>${got ? m.e : '🔒'}</b>${tr(m)}<br>${m.at}\u00A0m</div>`;
  }).join('');
  const box = $('pOut');
  box.innerHTML = '';
  OUTFITS.forEach(o => {
    const has = S.owned.includes(o.id), eq = S.outfit === o.id;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'oc' + (eq ? ' eq' : '') + (!has && o.price > S.stars ? ' no' : '');
    const c = document.createElement('canvas');
    c.width = 160; c.height = 190;
    const g = c.getContext('2d');
    g.fillStyle = '#FFE9C9'; g.fillRect(0, 0, 160, 190);
    drawRunnerFig(g, 80, 178, 100, { sp: 0, ph: 0, st: 0, t: 0 }, o, false, String(DAY));
    b.appendChild(c);
    const n = document.createElement('span'); n.className = 'on'; n.textContent = tr(o); b.appendChild(n);
    const p = document.createElement('span'); p.className = 'op'; p.textContent = eq ? L.equipped : has ? L.equip : L.price(o.price); b.appendChild(p);
    b.addEventListener('click', () => pickOutfit(o, b));
    box.appendChild(b);
  });
}
function pickOutfit(o, el) {
  Sound.unlock();
  if (S.owned.includes(o.id)) { S.outfit = o.id; store.set('outfit', S.outfit); Sound.star(); renderPanel(); return; }
  if (S.stars < o.price) { Sound.nope(); toast(L.missing(o.price - S.stars), true); el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); return; }
  S.stars -= o.price; store.set('stars', S.stars);
  S.owned.push(o.id); store.set('owned', S.owned);
  S.outfit = o.id; store.set('outfit', S.outfit);
  Sound.buy(); vibrate(30); toast(L.unlocked(tr(o)), true);
  renderPanel(); S.refreshUI();
}
$('pClose').addEventListener('click', closePanel);
panel.addEventListener('click', e => { if (e.target === panel) closePanel(); });
panel.addEventListener('pointerdown', e => e.stopPropagation());
['locker', 'lock2'].forEach(id => {
  $(id).addEventListener('click', e => { e.stopPropagation(); Sound.unlock(); openPanel(); $(id).blur(); });
  $(id).addEventListener('pointerdown', e => e.stopPropagation());
});

Object.assign(S, { canAfford, openPanel, closePanel, renderPanel, pickOutfit });
})(window.Soleil);
