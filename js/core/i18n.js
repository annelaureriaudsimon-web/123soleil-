/* js/core/i18n.js — Textes en français et en anglais (les autres langues : js/core/lang/*.js, branchées par js/core/i18n-apply.js) */
(function (S) {
'use strict';

/* ---------- 2. Textes : la langue de l'appareil (si le jeu la parle), sinon l'anglais ; ou celle choisie par le joueur ---------- */
// Les langues du jeu, avec leur nom écrit dans leur propre langue (pas de drapeaux : une langue n'est pas un pays).
const LANGS = [{ code: 'fr', name: 'Français' }, { code: 'en', name: 'English' }, { code: 'es', name: 'Español' },
  { code: 'pt', name: 'Português' }, { code: 'de', name: 'Deutsch' }, { code: 'it', name: 'Italiano' }];
const known = c => LANGS.some(l => l.code === c);
function pickLang() {
  const q = (location.search.match(/[?&]lang=([a-z]{2})/) || [])[1];               // ?lang=de : pour tester une langue
  if (known(q)) return q;
  let saved = null; try { saved = JSON.parse(localStorage.getItem('soleil.lang')); } catch (e) { saved = null; }
  if (known(saved)) return saved;                                                     // choisie à la main (accueil)
  const list = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'en'];
  for (const x of list) { const c = String(x || '').slice(0, 2).toLowerCase(); if (known(c)) return c; }
  return 'en';
}
S.LANG = pickLang();
const TXT = {
  fr: {
    best: m => `Record ${m} m`, bestLive: 'RECORD BATTU !',
    caught: 'GRILLÉ !',
    late: s => `Lâché ${s} s trop tard !`,
    lateIce: s => `Lâché ${s} s trop tard sur le verglas !`,
    lateSlope: s => `Lâché ${s} s trop tard dans la descente !`,
    running: 'Tu courais encore !',
    early: s => `Reparti ${s} s trop tôt !`,
    hopCaught: 'Il te surveillait du coin de l’œil !',
    realOne: 'Cette fois, c’était le vrai !',
    tipSo: 'Astuce : lâche dès que tu lis « SOLEIL ! »',
    tipMoon: 'La Lune se retourne dès « LUNE ! »',
    tipLook: 'Attends qu’il se remette de dos',
    tipHop: 'Tant qu’un œil dépasse, ne bouge pas !',
    tipIce: 'Sur le verglas, lâche beaucoup plus tôt',
    tipSlope: 'Dans la descente, lâche beaucoup plus tôt',
    toRecord: m => `À ${m} m de ton record…`, tieRecord: 'Pile ton record !',
    toPhase: (m, what) => `Encore ${m} m et tu voyais ${what}`,
    see: ['le jour se lever', 'midi', 'le soir', 'la nuit'],
    toRank: (m, r) => `Plus que ${m}\u00A0m pour devenir ${r}`,
    newRank: r => `Nouveau rang : ${r} !`,
    newRecord: 'NOUVEAU RECORD !',
    replayTouch: 'Touche l’écran pour rejouer', replayKey: 'Clic ou Espace pour rejouer',
    ouf: 'OUF !', letGo: 'LÂCHE !', flag: 'RECORD', hmm: 'HMM…', heh: 'HÉ HÉ !',
    trapped: 'PIÉGÉ !', notTrapped: 'PAS PIÉGÉ !',
    boss: 'BOSS', bossTitle: 'BOSS !', bossSub: moon => (moon ? 'La Lune' : 'Le soleil') + ' sort ses lunettes…',
    bossWin: 'BOSS BATTU !', mission: 'MISSION !',
    phases: ['MATIN', 'MIDI', 'SOIR', 'NUIT'],
    obst: { traps: 'mots pièges', stutter: 'hésitations', mud: 'boue', cloud: 'nuages', fauxDos: 'faux dos',
            rush: 'chants express', slope: 'descentes', ice: 'verglas' },
    moonCall: '« LUNE ! »', and: ' et ', bang: ' !',
    speedUp: 'Tu cours plus vite… et tu freines plus long',
    dayN: n => `JOUR ${n}`, daySub: 'Tout en même temps…',
    streakToast: (n, b) => `🔥 Série de ${n} jour${n > 1 ? 's' : ''} : +${b} ⭐`,
    missionToast: (label, r) => `🎯 ${label} : +${r} ⭐`,
    medalToast: (e, name) => `${e} Médaille gagnée : ${name} !`,
    secMissions: '🎯 Missions du jour', secMedals: '🏅 Médailles des boss', secOutfits: '👕 Tenues',
    misFoot: 'De nouvelles missions chaque jour',
    stats: (b, n, s) => `Record ${b} m · 🔥 ${n} · ⭐ ${s}`,
    equip: 'Mettre', equipped: 'Portée ✓', price: p => `${p} ⭐`, missing: n => `Il te manque ${n} ⭐ !`,
    unlocked: name => `Débloqué : ${name} !`,
    maxRank: 'Rang maximum atteint !',
    mute: 'Couper le son', unmute: 'Remettre le son', locker: 'Casier', close: 'Fermer',
    // V4 : mot piège, étoiles, nuage, voix
    trapTitle: 'PIÈGE !', trapSub: moon => (moon ? 'Elle n’a pas dit LUNE 😏' : 'Il n’a pas dit SOLEIL 😏'),
    cloudTitle: '☁️ NUAGE !', cloudSub: 'Écoute bien…',
    starDouble: '⭐ + OUF = ×2 !',
    voiceOnBtn: 'Activer la voix', voiceOffBtn: 'Couper la voix', voiceNoneLbl: 'Voix indisponible',
    voiceNone: 'Pas de voix française sur cet appareil 😕', voiceLag: 'La voix a trop de retard sur cet appareil : sons 8-bit à la place',
    // accueil et défi du jour
    dailyBtn: n => `Défi du jour #${n}`, dailyHint: 'Un seul essai par jour !',
    freeBtn: '🔁 Partie libre', freeHint: 'Parcours au hasard',
    duoBtn: '2 joueurs', duoHint: 'Sur le même écran',
    rules: 'Maintiens pour courir · fige-toi quand il se retourne',
    dailyDone: (n, d) => `☀️ Défi #${n} : ${d}\u00A0m`, dailyLost: n => `☀️ Défi #${n} : essai utilisé`,
    nextIn: t => `Prochain défi dans ${t}`,
    meta2: (r, b) => `${r} · Record ${b}\u00A0m`, meta3: (d, s, n) => `🎯 Missions ${d}/3 · ⭐ ${s}${n ? ' · 🔥 ' + n : ''}`,
    replayHome: 'Touche l’écran pour revenir à l’accueil', home: 'Accueil',
    // 2 joueurs
    pName: ['J1', 'J2'], zone: p => `${p} : maintiens ici`, zoneSub: 'maintiens ici', keyHint: k => `(touche ${k})`, ready: 'PRÊT !',
    round: n => `MANCHE ${n}`, go: 'GO !', burnt: p => `${p} GRILLÉ !`, back: p => `${p} : retour au départ`,
    roundWin: p => `${p} GAGNE LA MANCHE !`, matchWin: p => `${p} GAGNE ! 🏆`,
    rematch: 'Revanche', duoHomeBtn: 'Accueil', finish: 'ARRIVÉE', ahead: (p, m) => `${p} ▲ +${m}\u00A0m`,
    title2: 'SOLEIL !',
    // pause, consignes selon l'appareil, premiers pas, accueil (v2.2)
    pause: 'Pause', pauseTitle: 'PAUSE', resume: 'Reprendre', restart: 'Recommencer', restartLevel: 'Recommencer le niveau',
    giveUp: 'Abandonner le défi', soundOn: 'Son : oui', soundOff: 'Son : non',
    spaceKey: 'ESPACE', holdWord: 'MAINTIENS', oops: 'OUPS !', oopsSun: 'VU !',
    keyStart: 'Clic ou Espace pour commencer', keyRetry: 'Clic ou Espace pour réessayer', keyHome: 'Clic ou Espace pour revenir à l’accueil',
    contBtn: 'CONTINUER', playBtn: 'JOUER', contHint: (n, w) => `Niveau ${n} · ${w}`, levelsShort: 'Niveaux', endlessShort: 'Infini',
    mapIntro: 'TA CARTE !', mapIntroSub: 'Choisis ton prochain niveau', yourTurn: 'À toi !',
    // v2.4 : langues. Le chant change avec la langue (même rythme partout : seuls les mots changent).
    // pre = le début commun au vrai mot et aux pièges (JAMAIS affiché depuis la v2.5 : il sert au test 29), sun = le vrai signal, traps = 12 mots pièges
    // qui commencent pareil, moonTraps = 5 pièges de la Lune. Toujours 12 et 5 : le défi du jour reste le même.
    langLbl: 'Langue', title1: '1, 2, 3…', decimal: ',',
    chant: { pre: 'SO', sun: 'SOLEIL !', moon: 'LUNE !', hop: 'HOP !',
      traps: ['SOLDES !', 'SOUPE !', 'SODA !', 'SOMBRERO !', 'SOFA !', 'SOURIS !', 'SORBET !', 'SOLO !', 'SOUCOUPE !', 'SOLDAT !', 'SORCIÈRE !', 'SOMMET !'],
      moonTraps: ['LUGE !', 'LUTIN !', 'LUXE !', 'LUNETTES !', 'LUMIÈRE !'] },
    say: { num: ['Un…', 'Deux…', 'Trois…'], sun: 'Soleil !', moon: 'Lune !', hop: 'Hop !',
      heh: ['Hé hé !', 'Je t’ai eu !', 'Hi hi !'], hmm: ['Hmmm…', 'Hmm hmm…'], grilled: ['Grillé !', 'Trop lent !', 'Je t’ai vu !', 'Bien cuit !'],
      bossSun: ['Tu vas fondre…', 'Ça va chauffer…'], bossMoon: ['Chut… la nuit est à moi…', 'La nuit est à moi…'],
      bossBeaten: ['Pfff… la prochaine fois !', 'Pfff… coup de chance !'] }
  },
  en: {
    best: m => `Best ${m} m`, bestLive: 'NEW BEST!',
    caught: 'TOASTED!',
    late: s => `Released ${s} s too late!`,
    lateIce: s => `Released ${s} s too late on the ice!`,
    lateSlope: s => `Released ${s} s too late on the slope!`,
    running: 'You were still running!',
    early: s => `Moved ${s} s too early!`,
    hopCaught: 'It was watching from the corner of its eye!',
    realOne: 'This time it was the real one!',
    tipSo: 'Tip: let go as soon as you read “RED LIGHT!”',
    tipMoon: 'The Moon turns right after “MOON!”',
    tipLook: 'Wait until it turns its back',
    tipHop: 'While an eye still shows, don’t move!',
    tipIce: 'On ice, let go much earlier',
    tipSlope: 'On a slope, let go much earlier',
    toRecord: m => `${m} m from your best…`, tieRecord: 'Exactly your best!',
    toPhase: (m, what) => `${m} more meters and you’d have seen ${what}`,
    see: ['sunrise', 'noon', 'the evening', 'the night'],
    toRank: (m, r) => `${m}\u00A0m to become ${r}`,
    newRank: r => `New rank: ${r}!`,
    newRecord: 'NEW RECORD!',
    replayTouch: 'Tap to play again', replayKey: 'Click or Space to play again',
    ouf: 'PHEW!', letGo: 'LET GO!', flag: 'BEST', hmm: 'HMM…', heh: 'HEH HEH!',
    trapped: 'FOOLED!', notTrapped: 'NOT FOOLED!',
    boss: 'BOSS', bossTitle: 'BOSS!', bossSub: moon => (moon ? 'The Moon' : 'The sun') + ' puts its shades on…',
    bossWin: 'BOSS BEATEN!', mission: 'MISSION!',
    phases: ['MORNING', 'NOON', 'EVENING', 'NIGHT'],
    obst: { traps: 'trap words', stutter: 'stutters', mud: 'mud', cloud: 'clouds', fauxDos: 'fake turns',
            rush: 'express chants', slope: 'slopes', ice: 'ice' },
    moonCall: '“MOON!”', and: ' and ', bang: '!',
    speedUp: 'You run faster… and brake longer',
    dayN: n => `DAY ${n}`, daySub: 'Everything at once…',
    streakToast: (n, b) => `🔥 ${n}-day streak: +${b} ⭐`,
    missionToast: (label, r) => `🎯 ${label}: +${r} ⭐`,
    medalToast: (e, name) => `${e} Medal earned: ${name}!`,
    secMissions: '🎯 Daily missions', secMedals: '🏅 Boss medals', secOutfits: '👕 Outfits',
    misFoot: 'New missions every day',
    stats: (b, n, s) => `Best ${b} m · 🔥 ${n} · ⭐ ${s}`,
    equip: 'Wear', equipped: 'Worn ✓', price: p => `${p} ⭐`, missing: n => `You need ${n} more ⭐!`,
    unlocked: name => `Unlocked: ${name}!`,
    maxRank: 'Top rank reached!',
    mute: 'Mute', unmute: 'Unmute', locker: 'Locker', close: 'Close',
    // V4: trap word, stars, cloud, voice
    trapTitle: 'TRAP!', trapSub: moon => (moon ? 'It didn’t say MOON 😏' : 'It didn’t say RED LIGHT 😏'),
    cloudTitle: '☁️ CLOUD!', cloudSub: 'Listen carefully…',
    starDouble: '⭐ + PHEW = ×2!',
    voiceOnBtn: 'Turn voice on', voiceOffBtn: 'Turn voice off', voiceNoneLbl: 'Voice unavailable',
    voiceNone: 'No English voice on this device 😕', voiceLag: 'The voice lags too much on this device: 8-bit sounds instead',
    // home and daily challenge
    dailyBtn: n => `Daily challenge #${n}`, dailyHint: 'Only one try per day!',
    freeBtn: '🔁 Free run', freeHint: 'Random course',
    duoBtn: '2 players', duoHint: 'Same screen',
    rules: 'Hold to run · freeze when it turns around',
    dailyDone: (n, d) => `☀️ Daily #${n}: ${d}\u00A0m`, dailyLost: n => `☀️ Daily #${n}: try used`,
    nextIn: t => `Next challenge in ${t}`,
    meta2: (r, b) => `${r} · Best ${b}\u00A0m`, meta3: (d, s, n) => `🎯 Missions ${d}/3 · ⭐ ${s}${n ? ' · 🔥 ' + n : ''}`,
    replayHome: 'Tap to go back home', home: 'Home',
    // 2 players
    pName: ['P1', 'P2'], zone: p => `${p}: hold here`, zoneSub: 'hold here', keyHint: k => `(key ${k})`, ready: 'READY!',
    round: n => `ROUND ${n}`, go: 'GO!', burnt: p => `${p} TOASTED!`, back: p => `${p}: back to the start`,
    roundWin: p => `${p} WINS THE ROUND!`, matchWin: p => `${p} WINS! 🏆`,
    rematch: 'Rematch', duoHomeBtn: 'Home', finish: 'FINISH', ahead: (p, m) => `${p} ▲ +${m}\u00A0m`,
    title2: 'RED LIGHT!',
    // pause, device-specific hints, first steps, home (v2.2)
    pause: 'Pause', pauseTitle: 'PAUSED', resume: 'Resume', restart: 'Restart', restartLevel: 'Restart level',
    giveUp: 'Give up the challenge', soundOn: 'Sound: on', soundOff: 'Sound: off',
    spaceKey: 'SPACE', holdWord: 'HOLD', oops: 'OOPS!', oopsSun: 'SEEN!',
    keyStart: 'Click or Space to start', keyRetry: 'Click or Space to try again', keyHome: 'Click or Space to go back home',
    contBtn: 'CONTINUE', playBtn: 'PLAY', contHint: (n, w) => `Level ${n} · ${w}`, levelsShort: 'Levels', endlessShort: 'Endless',
    mapIntro: 'YOUR MAP!', mapIntroSub: 'Pick your next level', yourTurn: 'Your turn!',
    langLbl: 'Language', title1: '1, 2, 3…', decimal: '.',
    chant: { pre: 'RED', sun: 'RED LIGHT!', moon: 'MOON!', hop: 'HOP!',
      traps: ['RED HAT!', 'RED BUS!', 'RED FOX!', 'RED SOCKS!', 'RED BALL!', 'RED KITE!', 'RED NOSE!', 'RED NIGHT!', 'RED LINE!', 'RED BIKE!', 'RED BOOTS!', 'RED LEAF!'],
      moonTraps: ['MOOSE!', 'MOOD!', 'MOO!', 'MONKEY!', 'MOP!'] },
    say: { num: ['One…', 'Two…', 'Three…'], sun: 'Red light!', moon: 'Moon!', hop: 'Hop!',
      heh: ['Heh heh!', 'Got you!', 'Hee hee!'], hmm: ['Hmmm…', 'Hmm hmm…'], grilled: ['Toasted!', 'Too slow!', 'I saw you!', 'Burnt toast!'],
      bossSun: ['You’re gonna melt…', 'It’s getting hot…'], bossMoon: ['Shh… the night is mine…', 'The night is mine…'],
      bossBeaten: ['Pfff… next time!', 'Pfff… lucky shot!'] }
  }
};
// L : les textes de la langue choisie. Un seul objet, rempli par js/core/i18n-apply.js (après le chargement
// de toutes les langues) et re-rempli si le joueur change de langue : les modules qui ont gardé « L » le voient.
const L = {};

// ---------- Typographie française : une espace INSÉCABLE avant « ! ? ; : », à l'intérieur des « », et entre
// un nombre et son unité (« 0,08 s », « 12 m »). Sans elle, un « ! » peut se retrouver seul en début de ligne.
// Appliquée à TOUS les textes français d'un coup (typoAll, à la fin de core/i18n-levels.js) et aux textes
// des niveaux (tr). On écrit donc les textes normalement, avec des espaces ordinaires.
const NB = '\u00A0';
function typoFr(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/[ \u202F]+([!?;:»])/g, NB + '$1')
            .replace(/«[ \u202F]+/g, '«' + NB)
            .replace(/(\d) (s|m|ms|px|%|⭐|★)(?=$|[\s.,!?;:)…·])/gu, '$1' + NB + '$2');
}
function typoAll(o, seen = new Set()) {           // chaque texte, liste et fonction (dont le résultat est un texte)
  if (!o || typeof o !== 'object' || seen.has(o)) return o;
  seen.add(o);
  for (const k of Object.keys(o)) {
    const v = o[k];
    if (typeof v === 'string') o[k] = typoFr(v);
    else if (typeof v === 'function' && !v.typo) { const f = (...a) => typoFr(v(...a)); f.typo = true; o[k] = f; }
    else if (v && typeof v === 'object') typoAll(v, seen);
  }
  return o;
}
// Un texte écrit dans les données ({ fr, en }, niveaux, missions, tenues…) : français, anglais, sinon la traduction
// de la phrase anglaise dans TXT.xx.phrases (js/core/lang/xx.js), sinon l'anglais.
const tr = o => {
  if (o == null) return '';
  if (typeof o === 'string') return o;
  const c = S.LANG;
  if (c === 'fr') return typoFr(o.fr);
  if (o[c] != null) return o[c];
  const ph = TXT[c] && TXT[c].phrases, key = o.en != null ? String(o.en).replace(/\u00A0/g, ' ') : null;   // clés écrites avec des espaces simples
  const t = ph && key != null && ph[key] != null ? ph[key] : o.en != null ? o.en : o.fr;
  return String(t).replace(/(\d) (m|s)(?=$|[\s.,!?;:)…·])/g, '$1\u00A0$2');   // « 30 m » : jamais coupé en fin de ligne
};

Object.assign(S, { LANGS, TXT, L, tr, typoFr, typoAll });
})(window.Soleil);
