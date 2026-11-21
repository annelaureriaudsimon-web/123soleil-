/* js/ui/locker.js — Casier : missions, médailles, tenues */
(function (S) {
'use strict';
const { L, tr, MEDALS, OUTFITS, RANKS, $, clamp, vibrate, store, DAY, streakAlive, todayMissions, Sound, panel,
  rankIndex, rankLabel, statValue, drawRunnerFig, toast, icon, setIcon, esc } = S;   // déjà chargés

// Infos d'accueil, bouton casier et pastille « nouveauté »
const canAfford = () => OUTFITS.some(o => !S.owned.includes(o.id) && o.price <= S.stars);

// Le casier : rang, missions du jour, médailles, tenues
function openPanel() {
  S.panelOpen = true; S.releaseAll();
  renderPanel();
  panel.classList.remove('hide');
  panel.querySelector('.sheet').scrollTop = 0;
}
function closePanel() { closeFiche(); S.panelOpen = false; panel.classList.add('hide'); S.refreshUI(); }
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
    drawStage(g, 160, 190);
    drawRunnerFig(g, 80, 178, 100, { sp: 0, ph: 0, st: 0, t: 0 }, o, false, String(DAY));
    b.appendChild(c);
    const n = document.createElement('span'); n.className = 'on'; n.textContent = tr(o); b.appendChild(n);
    const p = document.createElement('span'); p.className = 'op';
    const trying = !!S.trial && S.trial.id === o.id;   // tenue d'essai (pub récompensée) : badge « Essai »
    if (trying) { p.textContent = L.trialBadge; b.classList.add('trying'); }
    else if (eq || has) p.textContent = eq ? L.equipped : L.equip; else p.innerHTML = icon('star') + o.price;   // le prix : ⭐ dessinée + nombre
    b.setAttribute('aria-label', `${tr(o)} : ${eq ? L.equipped : has ? L.equip : L.price(o.price)}`);
    b.appendChild(p);
    b.addEventListener('click', () => pickOutfit(o, b));
    box.appendChild(b);
  });
}
// La petite scène derrière chaque tenue : ciel violet, ville au loin, sol
function drawStage(g, w, h) {
  const sky = g.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#9B7BFF'); sky.addColorStop(0.65, '#6A45F0'); sky.addColorStop(1, '#4B2BC8');
  g.fillStyle = sky; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(255,255,255,0.13)';                       // immeubles au loin
  [[8, 70, 26], [38, 52, 22], [64, 84, 30], [98, 60, 24], [126, 76, 30]].forEach(([x, y, bw]) => g.fillRect(x, y, bw, h - y));
  g.fillStyle = 'rgba(255,255,255,0.18)'; g.beginPath(); g.arc(w * 0.78, h * 0.2, 13, 0, Math.PI * 2); g.fill();   // la lune
  g.fillStyle = '#3A1E9E'; g.fillRect(0, h - 26, w, 26);           // le sol de la scène
  g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(0, h - 26, w, 3);
}
function pickOutfit(o, el) {
  Sound.unlock();
  if (S.owned.includes(o.id)) { S.outfit = o.id; store.set('outfit', S.outfit); Sound.star(); renderPanel(); return; }
  openFiche(o);                                    // pas encore à toi : la fiche (Acheter, et 🎬 Essayer si une vidéo est possible)
}
// ---------- La fiche d'une tenue verrouillée : Acheter (vert) + 🎬 Essayer (pub récompensée, js/ui/reward.js) ----------
const fiche = document.createElement('div');
fiche.id = 'ofiche'; fiche.className = 'hide'; fiche.setAttribute('role', 'dialog');
panel.appendChild(fiche);
let ficheOutfit = null;
function openFiche(o) {
  ficheOutfit = o;
  const can = S.Reward.canTrial(o.id), short = Math.max(0, o.price - S.stars);
  const buy = { act: 'buy', label: L.buyBtn(o.price), icon: 'star' };
  fiche.innerHTML = `<div class="ofiche"><button class="x" type="button" data-act="close" aria-label="${esc(L.close)}">${icon('close')}</button>`
    + `<canvas width="200" height="230"></canvas><div class="on">${esc(tr(o))}</div>`
    + (short ? `<div class="miss">${esc(L.missing(short))}</div>` : '')
    + (can ? S.Reward.pairHTML(buy, { kind: 'trial', token: 'trial:' + o.id, label: L.tryBtn, cap: L.tryCap })
           : `<div class="rpair"><button class="btn c-green rnorm" type="button" data-act="buy">${icon('star')}${esc(buy.label)}</button></div>`)
    + `</div>`;
  const g = fiche.querySelector('canvas').getContext('2d');
  drawStage(g, 200, 230);
  drawRunnerFig(g, 100, 216, 124, { sp: 0, ph: 0, st: 0, t: 0 }, o, false, String(DAY));
  fiche.classList.remove('hide');
  setTimeout(() => fiche.classList.add('armed'), 250);   // pas de clic par erreur sur la fiche qui s'ouvre
}
const ficheOpen = () => !fiche.classList.contains('hide');
function closeFiche() { fiche.classList.add('hide'); fiche.classList.remove('armed'); ficheOutfit = null; }
fiche.addEventListener('click', e => {
  e.stopPropagation();
  if (e.target === fiche) { closeFiche(); return; }
  const b = e.target.closest ? e.target.closest('button[data-act]') : null;
  if (!b || !fiche.classList.contains('armed')) return;
  if (b.dataset.act === 'close') closeFiche();
  else if (b.dataset.act === 'buy' && ficheOutfit) buyOutfit(ficheOutfit, b);
});
function buyOutfit(o, el) {
  Sound.unlock();
  if (S.owned.includes(o.id)) { closeFiche(); return; }
  if (S.stars < o.price) { Sound.nope(); toast(L.missing(o.price - S.stars), true); el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); return; }
  S.stars -= o.price; store.set('stars', S.stars);
  S.owned.push(o.id); store.set('owned', S.owned);
  S.outfit = o.id; store.set('outfit', S.outfit);
  if (S.trial && S.trial.id === o.id) { S.trial = null; S.syncTrialTag(); }   // achetée pendant l'essai : elle est à toi
  Sound.buy(); vibrate(30); toast(L.unlocked(tr(o)), true);
  closeFiche(); renderPanel(); S.refreshUI();
}
setIcon('locker', 'shirt'); setIcon('lock2', 'shirt');
$('pClose').innerHTML = icon('close');
$('pClose').addEventListener('click', closePanel);
panel.addEventListener('click', e => { if (e.target === panel) closePanel(); });
panel.addEventListener('pointerdown', e => e.stopPropagation());
['locker', 'lock2'].forEach(id => {
  $(id).addEventListener('click', e => { e.stopPropagation(); Sound.unlock(); openPanel(); $(id).blur(); });
  $(id).addEventListener('pointerdown', e => e.stopPropagation());
});

Object.assign(S, { canAfford, openPanel, closePanel, renderPanel, pickOutfit, openFiche, closeFiche, ficheOpen, buyOutfit });
})(window.Soleil);
