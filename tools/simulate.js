#!/usr/bin/env node
/* tools/simulate.js — Simulation de jouabilité des niveaux, sans affichage.
   Lance : node tools/simulate.js              (300 essais par profil et par niveau, tous les mondes)
           node tools/simulate.js --n 1000     (plus d'essais)
           node tools/simulate.js --world 2    (un seul monde)      --level w2-8   (un seul niveau)
           node tools/simulate.js --md docs/LEVELS.md               (réécrit le tableau des résultats)
   Elle charge les MÊMES fichiers que le navigateur (moteur de niveau, chant, physique, cerveaux des rivaux,
   données des niveaux) dans un bac à sable : rien n'est recopié. Le joueur simulé est piloté par un « cerveau »
   (game/rivals.js : profils expert, moyen, debutant, patient, avec leur sang-froid face aux tentations), comme les rivaux.
   v2.5.1 : le moyen est un vrai joueur au téléphone (il lit le mot en 0,36 s, il repart au « ding » en 0,29 s). */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// ---------- Réglages ----------
const DT = 1 / 60;                 // pas de temps (comme un écran à 60 images/s)
const TIME_MAX = 150;              // un essai qui dure plus longtemps est arrêté (ne devrait jamais arriver)
const PROFILES = ['expert', 'moyen', 'debutant', 'patient'];
// « patient » = le robot prudent (v2.5) : il s'arrête à CHAQUE « 3 » et ne repart qu'au vrai retour (game/rivals.js).
// Il ne perd jamais tant que rien ne presse : la nuit, les transats et la glace doivent le faire échouer.
const NAMES = { expert: 'Expert', moyen: 'Moyen', debutant: 'Débutant', patient: 'Prudent' };
const WHY = { running: 'courait encore', late: 'lâché trop tard', early: 'reparti trop tôt', hop: 'faux dos (HOP !)', timeout: 'trop long',
  night: 'la nuit est tombée', chairs: 'plus de transat (ou de luge)' };
const TEMPT_NAMES = { star: 'étoile', fakeRet: 'faux retour', sneeze: 'éternuement', taunt: 'moquerie', fly: 'mouche', crack: 'rival qui craque',
  recount: 'recomptage', planeGo: 'avion « ALLEZ-Y ! »', alarm: 'fausse alerte', herd: 'troupeau' };   // v2.5
// Objectifs de chaque monde : durée du joueur moyen (s), boss, et taux du moyen au boss
const TARGETS = {
  1: { dur: [25, 35], bossDur: 45, boss: [0.15, 0.35] },
  2: { dur: [30, 42], bossDur: 50, boss: [0.10, 0.30] },  // v2.5 : sans « SO », on attend un peu plus (lire, puis repartir)
  3: { dur: [30, 42], bossDur: 50, boss: [0.10, 0.20] },   // v2.5 : la plage
  4: { dur: [30, 42], bossDur: 50, boss: [0.10, 0.20] }    // v2.6 : la montagne, le dernier boss (10 à 20 % pour le moyen)
};
// Résultats du monde 1 (300 essais) : ils ne doivent pas bouger (à 3 points près) tant qu'on ne règle pas le monde 1.
// v2.5.1 : le moyen lit le mot en 0,36 s (vrai joueur au téléphone), le débutant en 0,45 s ; demi-tours et nuits
// réglés à nouveau pour eux (la nuit tombait beaucoup trop vite dès le niveau 7).
const REF_W1 = { expert: [100, 100, 100, 98, 100, 100, 98, 100], moyen: [100, 100, 90, 79, 72, 63, 52, 32],
                 debutant: [100, 87, 17, 18, 4, 3, 4, 2], patient: [100, 100, 0, 1, 22, 14, 0, 0] };
// Fichiers du jeu chargés, dans l'ordre de index.html (seulement ceux qui ne touchent pas à l'écran)
const FILES = ['js/core/config.js', 'js/core/rng.js', 'js/game/content.js', 'js/game/physics.js', 'js/game/chant.js',
  'js/game/rivals.js', 'js/game/match.js', 'levels/worlds.js', 'levels/world1.js', 'levels/world2.js', 'levels/world3.js',
  'levels/world4.js'];

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const N = +opt('n', 300);
const ONLY = opt('level', null);
const WORLD = opt('world', null);
const MD = opt('md', null);

// ---------- Chargement du jeu dans un bac à sable ----------
const root = path.join(__dirname, '..');
const box = { console, Math, Date, JSON, Object, Array, Number, String, Set, Map };
box.window = box;
vm.createContext(box);
for (const f of FILES) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), box, { filename: f });
const S = box.Soleil;
const { Match } = S;

// ---------- Un essai ----------
// Les tentations que le joueur a déjà rencontrées dans les niveaux précédents du même monde (champ « mechanics »)
const ALL_TEMPT = ['star', 'fakeRet', 'sneeze', 'taunt', 'fly', 'crack', 'fakeBack', 'recount', 'planeGo', 'alarm', 'herd'];
function familiar(def) {                          // v2.5 : les mondes d'avant comptent aussi (le recomptage vient du monde 1)
  const known = new Set();
  for (const lv of S.WORLDS.filter(x => x.id <= def.world).flatMap(x => x.levels)) {
    if (lv === def) break;
    for (const mk of lv.mechanics || []) {
      if (mk === 'tempt:*') ALL_TEMPT.forEach(k => known.add(k));
      else if (mk.startsWith('tempt:')) known.add(mk.slice(6));
      else if (mk === 'fakeBack') known.add('fakeBack');
    }
  }
  return [...known];
}
function play(def, attempt, profile) {
  const m = Match.create(def, attempt, { playerBrain: profile, brainSeen: familiar(def) });
  m.out = null;                                    // pas d'affichage : on ne garde pas les événements
  while (!m.result && m.t < TIME_MAX) Match.step(m, DT);
  const res = m.result || { win: false, why: 'timeout', time: m.t, place: 0, stats: m.stats, remaining: 0 };
  res.stars = Match.starsOf(Match.normalize(def), res);
  res.firstTurn = firstTurn(def, attempt);
  return res;
}
// Instant du premier « SOLEIL ! » (la menace des 10 premières secondes)
function firstTurn(def, attempt) {
  const m = Match.create(def, attempt, {});
  m.out = [];
  while (m.t < 30) { Match.step(m, DT, false); if (m.out.some(e => e.type === 'turn')) return m.t; m.out.length = 0; }
  return Infinity;
}

// ---------- Statistiques ----------
const mean = a => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
function run(def, profile) {
  const res = [];
  for (let i = 1; i <= N; i++) res.push(play(def, i, profile));
  const wins = res.filter(r => r.win), fails = res.filter(r => !r.win);
  const why = {};
  fails.forEach(r => { const k = r.tempt ? 'tempt:' + r.tempt : r.why; why[k] = (why[k] || 0) + 1; });
  const top = Object.entries(why).sort((a, b) => b[1] - a[1])[0];
  const label = k => (k.startsWith('tempt:') ? 'craqué : ' + TEMPT_NAMES[k.slice(6)] : WHY[k] || k);
  return {
    win: wins.length / N, time: mean(wins.map(r => r.time)), place: mean(wins.map(r => r.place)),
    why: top ? `${label(top[0])} (${Math.round(top[1] / fails.length * 100)} %)` : '—',
    s2: wins.filter(r => r.stars[1]).length / N, s3: wins.filter(r => r.stars[2]).length / N,
    turn: Math.max(...res.map(r => r.firstTurn)), quick: mean(wins.map(r => r.stats.quick)), resisted: mean(wins.map(r => r.stats.resisted)),
    oops: mean(res.map(r => r.stats.oops || 0)),  // niveau en douceur : « OUPS ! » par essai
    night: fails.filter(r => r.why === 'night').length / N   // v2.5.1 : essais perdus parce que la nuit est tombée
  };
}

const pct = x => `${Math.round(x * 100)} %`;
const sec = x => (isFinite(x) ? `${x.toFixed(1).replace('.', ',')} s` : '—');
const worlds = S.WORLDS.filter(w => w.levels.length && (!WORLD || w.id === +WORLD));
const rows = [];
const t0 = Date.now();
for (const w of worlds) {
  console.log(`\nMonde ${w.id} — ${w.name.fr}`);
  for (const lv of w.levels.filter(l => !ONLY || l.id === ONLY)) {
    const row = { w, lv, p: {} };
    for (const p of PROFILES) row.p[p] = run(lv, p);
    rows.push(row);
    const e = row.p.expert, mo = row.p.moyen, d = row.p.debutant, pa = row.p.patient;
    console.log(`${lv.num}. ${lv.name.fr.padEnd(26)} réussite E ${pct(e.win).padStart(5)} · M ${pct(mo.win).padStart(5)} · D ${pct(d.win).padStart(5)} · P ${pct(pa.win).padStart(5)}`
      + ` | durée E ${sec(e.time)} M ${sec(mo.time)} D ${sec(d.time)} P ${sec(pa.time)} | place M ${mo.place.toFixed(2)}`
      + ` | ★★ M ${pct(mo.s2)} ★★★ M ${pct(mo.s3)} E ${pct(e.s3)} P ${pct(pa.s3)} | 1er SOLEIL ≤ ${e.turn.toFixed(1)} s`
      + (w.id > 1 ? ` | résistées M ${mo.resisted.toFixed(1)} · éclairs M ${mo.quick.toFixed(1)}` : '')
      + (lv.soft ? ` | OUPS par essai M ${mo.oops.toFixed(1)} · D ${d.oops.toFixed(1)}` : '') + ` | défaite M : ${mo.why}`);
  }
}
console.log(`(${N} essais par profil et par niveau, ${((Date.now() - t0) / 1000).toFixed(1)} s)`);

// ---------- Vérification des objectifs ----------
const checks = [];
const tag = r => `${r.w.id}-${r.lv.num}`;
rows.forEach(r => checks.push([`niveau ${tag(r)} : l'expert réussit au moins 95 %`, r.p.expert.win >= 0.95, pct(r.p.expert.win)]));
rows.forEach(r => checks.push([`niveau ${tag(r)} : menace dans les 10 premières secondes`, r.p.expert.turn <= 10, `1er SOLEIL ≤ ${r.p.expert.turn.toFixed(1)} s`]));
rows.forEach(r => {
  const t = r.p.moyen.time, T = TARGETS[r.w.id] || TARGETS[1], boss = !!r.lv.boss;
  checks.push([`niveau ${tag(r)} : durée (moyen) ${boss ? '≤ ' + T.bossDur + ' s' : `entre ${T.dur[0]} et ${T.dur[1]} s`}`,
    boss ? t >= T.dur[0] && t <= T.bossDur : t >= T.dur[0] && t <= T.dur[1], sec(t)]);
});
const find = (w, n) => rows.find(r => r.w.id === w && r.lv.num === n);
for (const w of worlds) {
  const R = rows.filter(r => r.w.id === w.id), T = TARGETS[w.id] || TARGETS[1], boss = R.find(r => r.lv.boss);
  if (boss) checks.push([`monde ${w.id} : le moyen réussit le boss ${Math.round(T.boss[0] * 100)} à ${Math.round(T.boss[1] * 100)} %`, boss.p.moyen.win >= T.boss[0] && boss.p.moyen.win <= T.boss[1], pct(boss.p.moyen.win)]);
  if (R.length === w.levels.length && R.length > 1) {
    let ok = true, worst = 0;
    for (let i = 1; i < R.length; i++) {
      const d = R[i - 1].p.moyen.win - R[i].p.moyen.win;
      worst = Math.max(worst, d);
      if (d > 0.2 || d < -0.05) ok = false;
    }
    checks.push([`monde ${w.id} : la difficulté monte régulièrement (moyen : jamais plus de 20 points d’écart, jamais plus facile)`, ok, `plus gros saut ${Math.round(worst * 100)} points`]);
  }
}
// v2.5 — la prudence ne suffit plus : le robot « patient » (il s'arrête à chaque « 3 », ne repart qu'au « ding ») échoue
// au moins une fois sur deux à la fin du monde 1, 4 fois sur 5 dans le monde 2 et après, et n'a presque jamais ★★★
// (au plus 2 % : il gagne parfois une course quand tous les rivaux se sont fait griller) ;
// le joueur moyen réussit le début du monde 1 (niveau 3, le premier avec la nuit) environ 85 % du temps.
// v2.5.1 — la nuit punit la prudence, pas le joueur moyen : elle lui fait perdre au plus 5 % de ses essais.
rows.forEach(r => checks.push([`niveau ${tag(r)} : le robot prudent n'a presque jamais ★★★ (au plus 2 %)`, r.p.patient.s3 <= 0.02, pct(r.p.patient.s3)]));
rows.filter(r => r.lv.night).forEach(r => checks.push([`niveau ${tag(r)} : la nuit ne fait presque jamais perdre le moyen (au plus 5 % des essais)`, r.p.moyen.night <= 0.05, pct(r.p.moyen.night)]));
for (const [w, n, max] of [[1, 7, 0.5], [1, 8, 0.5]]) {
  const r = find(w, n); if (r) checks.push([`niveau ${w}-${n} : le robot prudent échoue au moins une fois sur deux`, r.p.patient.win <= max, pct(r.p.patient.win)]);
}
rows.filter(r => r.w.id >= 2).forEach(r => checks.push([`niveau ${tag(r)} : le robot prudent échoue au moins 4 fois sur 5`, r.p.patient.win <= 0.2, pct(r.p.patient.win)]));
const r13 = find(1, 3);
if (r13) checks.push(['monde 1, niveau 3 : le moyen réussit environ 85 % (entre 78 et 92 %)', r13.p.moyen.win >= 0.78 && r13.p.moyen.win <= 0.92, pct(r13.p.moyen.win)]);
const r11 = find(1, 1), w1 = rows.filter(r => r.w.id === 1);
if (r11) {                                         // v2.2 : le niveau 1 est un départ en douceur
  checks.push(['monde 1, niveau 1 (en douceur) : le débutant le finit presque à chaque fois (≥ 90 %)', r11.p.debutant.win >= 0.9, pct(r11.p.debutant.win)]);
  checks.push(['monde 1, niveau 1 (en douceur) : le débutant le finit en moins de 45 s', r11.p.debutant.time <= 45, sec(r11.p.debutant.time)]);
}
if (w1.length === 8 && N >= 300) {
  let worst = 0;
  w1.forEach((r, i) => PROFILES.forEach(p => { worst = Math.max(worst, Math.abs(r.p[p].win * 100 - REF_W1[p][i])); }));
  checks.push(['monde 1 : mêmes résultats que la référence REF_W1 (réglée en v2.5), à 3 points près', worst <= 3, `plus gros écart ${Math.round(worst)} points`]);
}
// Pas de mur entre deux mondes : le niveau 1 d'un monde est plus dur que le niveau 2 du monde d'avant, mais plus facile que son boss
for (const w of worlds) {
  const first = find(w.id, 1), prev2 = find(w.id - 1, 2), prevBoss = find(w.id - 1, 8);
  if (first && prev2 && prevBoss) checks.push([`monde ${w.id}, niveau 1 : plus dur que le niveau 2 du monde ${w.id - 1}, plus facile que son boss (moyen)`,
    first.p.moyen.win < prev2.p.moyen.win && first.p.moyen.win > prevBoss.p.moyen.win,
    `${pct(first.p.moyen.win)} (niveau 2 : ${pct(prev2.p.moyen.win)}, boss : ${pct(prevBoss.p.moyen.win)})`]);
}
console.log('\nObjectifs :');
checks.forEach(([t, ok, v]) => console.log(`  ${ok ? '✅' : '❌'} ${t}  [${v}]`));

// ---------- Tableau Markdown ----------
if (MD) {
  const L = [];
  for (const w of worlds) {
    L.push(`### Monde ${w.id} — ${w.name.fr}`, '');
    L.push('| Niveau | Profil | Réussite | Durée moyenne (réussites) | Position moyenne | Défaite la plus fréquente | ★★ | ★★★ |');
    L.push('|---|---|---|---|---|---|---|---|');
    for (const r of rows.filter(x => x.w.id === w.id)) for (const p of PROFILES) {
      const x = r.p[p];
      L.push(`| ${r.lv.num}. ${r.lv.name.fr} | ${NAMES[p]} | ${pct(x.win)} | ${sec(x.time)} | ${isFinite(x.place) ? x.place.toFixed(2).replace('.', ',') + ' / ' + (r.lv.rivals.length + 1) : '—'} | ${x.why} | ${pct(x.s2)} | ${pct(x.s3)} |`);
    }
    L.push('');
  }
  L.push('Objectifs vérifiés :', '');
  checks.forEach(([t, ok, v]) => L.push(`- ${ok ? '✅' : '❌'} ${t} (${v})`));
  const file = path.resolve(MD);
  const old = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  const A = '<!-- tableau:debut -->', B = '<!-- tableau:fin -->';
  const block = `${A}\n_Généré par \`node tools/simulate.js --md docs/LEVELS.md\` (${N} essais par profil et par niveau)._\n\n${L.join('\n')}\n${B}`;
  fs.writeFileSync(file, old.includes(A) ? old.replace(new RegExp(A + '[\\s\\S]*' + B), block) : old + '\n' + block + '\n');
  console.log('\nTableau écrit dans', MD);
}
process.exitCode = checks.every(c => c[1]) ? 0 : 1;
