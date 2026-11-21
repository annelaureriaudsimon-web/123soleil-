/* js/core/i18n-levels.js — Textes du mode Niveaux (carte, intro, HUD, résultats, rivaux), en français et en anglais.
   Ils s'ajoutent aux textes du jeu (core/i18n.js) : L.xxx marche pareil. */
(function (S) {
'use strict';
const { TXT } = S;

const ordFr = n => (n === 1 ? '1er' : `${n}e`);
const ordEn = n => `${n}${n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th'}`;

Object.assign(TXT.fr, {
  ord: ordFr,
  levelsBtn: 'NIVEAUX', levelsHint: (n, t, w) => `★ ${n}/${t} · ${w}`,
  endlessBtn: 'Course infinie',
  worldN: n => `Monde ${n}`, soon: 'Bientôt', soonToast: 'Ce monde arrive bientôt ! 🔒', lockedToast: 'Finis le niveau d’avant pour le débloquer 🔒',
  mapHint: 'Touche un niveau pour jouer', levelN: n => `Niveau ${n}`, bossTag: 'BOSS',
  goalDone: 'Finis le niveau',
  goal: (g, who) => g.type === 'top' ? `Arrive dans le top ${g.n}` : g.type === 'first' ? 'Arrive 1er'
    : g.type === 'oufs' ? `Fais ${g.n} OUF` : g.type === 'combo' ? `Fais un combo OUF ×${g.n}`
    : g.type === 'noTrap' ? 'Ne tombe dans aucun piège' : g.type === 'avoid' ? `Évite ${g.n} pièges sans t’arrêter`
    : g.type === 'time' ? `Finis en moins de ${g.s} s` : g.type === 'beat' ? `Bats ${who}`
    : g.type === 'quick' ? `Fais ${g.n} départs éclair` : g.type === 'resist' ? `Résiste à ${g.n} tentations` : '',
  tapStart: 'Touche pour commencer',
  posOf: (n, t) => `${ordFr(n)}/${t}`, toGo: m => `${m} m`,
  failWhyRunning: 'Tu courais encore ! Lâche dès « SO »',
  failAlmost: m => `À ${m} m de l’arrivée !`, failPlace: p => `Tu étais ${ordFr(p)} !`, failTap: 'Touche pour réessayer',
  failTipTrap: 'Il t’a eu juste après un mot piège 😏',
  winTitle: 'BRAVO !', bossWinTitle: 'SOLEIL COOL BATTU ! 😎', you: 'Toi', notIn: 'pas arrivé',
  nextBtn: 'Suivant', retryBtn: 'Rejouer', mapBtn: 'Carte', bestTime: s => `Meilleur temps : ${s} s`,
  coins: n => `+${n} ⭐ pour le casier`, worldDone: 'Monde 1 terminé ! La suite arrive bientôt 🎉',
  rivalBurnt: p => `${p} GRILLÉ !`, rivalBack: p => `${p} repart du début`, rivalDone: (p, n) => `🏁 ${p} ${ordFr(n)}`,
  haha: 'HA HA !', passed: p => `▲ ${ordFr(p)}`, passedBy: p => `▼ ${ordFr(p)}`,
  hesTitle: 'HÉSITATION…', hesSub: 'Attends de lire le mot !', stutterTitle: 'BÉGAIEMENT !', stutterSub: '« 2… 2… 3… » : écoute, ne compte pas',
  expressTitle: 'CHANT EXPRESS ! 🚀', expressSub: 'Tout va deux fois plus vite', moveSub: 'Coup spécial !',
  bossTaunt: 'Tu crois pouvoir me toucher ?', bossBar: 'Soleil Cool', bossDown: 'Mes lunettes !!',
  kind: { prudent: 'le Prudent', fonceur: 'le Fonceur', regulier: 'le Régulier' },
  sayGrilled: ['Nooon !', 'C’est pas juste !', 'Aïe aïe aïe…', 'J’ai rien fait !', 'Ça brûle !'],
  sayPass: ['Trop lent !', 'Bye bye !', 'Hé hé !', 'Pousse-toi !'], sayPassed: ['Hé !', 'Attends-moi !', 'Pas si vite !', 'Oh non…'],
  sayFirst: ['Premier ! 🏆', 'Trop fort !'], sayDone: ['Arrivé !', 'Ouf !'],
  // ---- Monde 2 : tentations, faux dos, boue, carte
  temptHint: { star: 'Il veut que tu bouges… NE BOUGE PAS !', fakeRet: 'Il fait semblant ! Attends le « ding » 🔔',
    sneeze: 'Yeux fermés… mais il te regarde toujours !', taunt: 'Il te provoque… NE BOUGE PAS !',
    fly: 'Une mouche ? Même pas peur. NE BOUGE PAS !', crack: 'Il a craqué… pas toi !', fakeBack: 'Un œil dépasse ! Attends le « ding » 🔔' },
  temptFail: { star: 'L’étoile était un piège 😏', fakeRet: 'Faux retour ! Attends le « ding » 🔔', sneeze: 'Il était encore tourné vers toi !',
    taunt: 'Il voulait juste te faire bouger 😜', fly: 'Une mouche ne t’excuse pas !', crack: 'Ne sursaute pas !', hop: 'Il faisait semblant ! Attends le « ding » 🔔' },
  hintTitle: 'NE BOUGE PAS !', mudTitle: 'BOUE !', mudSub: 'Ça colle : tu repars au ralenti',
  sangFroid: 'SANG-FROID !', quickStart: 'DÉPART ÉCLAIR !', ha: 'HA !', aah1: 'Aaah…', aah2: 'AAAH…', atchoum: 'ATCHOUM !', pfff: 'Pfff…', boom: 'BOUM !',
  taunts: ['Allez… bouge un peu !', 'T’as une fourmi sur le pied !', 'Je vois rien, promis 😇', 'Psst… ton lacet est défait !',
    'Tu sens ça ? Une odeur de frites…', 'Tu as cligné des yeux, là ?', 'Juste un petit pas… personne ne saura !', 'Ton nez te gratte, non ?',
    'Regarde, une licorne ! 🦄', 'Je compte jusqu’à 3… 1… 2…', 'T’es une statue ou quoi ?', 'Bouh ! 👻'],
  bonusStars: n => `+${n} ⭐ de sang-froid`,
  worldUnlocked: n => `MONDE ${n} DÉBLOQUÉ !`, worldUnlockedSub: 'Le parc t’attend 🌳', needStars: (n, w) => `Gagne ${n} ★ dans le monde ${w} pour le débloquer 🔒`,
  bossTaunt2: 'Tu vas rire… ou pleurer !', bossDown2: 'Mon nez !!', bossWin2: 'SOLEIL FARCEUR BATTU ! 🤡', bossBar2: 'Soleil Farceur',
  worldDone2: 'Monde 2 terminé ! La suite arrive bientôt 🎉',
});

Object.assign(TXT.en, {
  ord: ordEn,
  levelsBtn: 'LEVELS', levelsHint: (n, t, w) => `★ ${n}/${t} · ${w}`,
  endlessBtn: 'Endless run',
  worldN: n => `World ${n}`, soon: 'Soon', soonToast: 'This world is coming soon! 🔒', lockedToast: 'Finish the previous level to unlock it 🔒',
  mapHint: 'Tap a level to play', levelN: n => `Level ${n}`, bossTag: 'BOSS',
  goalDone: 'Finish the level',
  goal: (g, who) => g.type === 'top' ? `Finish in the top ${g.n}` : g.type === 'first' ? 'Finish 1st'
    : g.type === 'oufs' ? `Get ${g.n} PHEWs` : g.type === 'combo' ? `Get a ×${g.n} PHEW combo`
    : g.type === 'noTrap' ? 'Don’t fall for any trap' : g.type === 'avoid' ? `Run through ${g.n} traps without stopping`
    : g.type === 'time' ? `Finish in under ${g.s} s` : g.type === 'beat' ? `Beat ${who}`
    : g.type === 'quick' ? `Get ${g.n} lightning starts` : g.type === 'resist' ? `Resist ${g.n} temptations` : '',
  tapStart: 'Tap to start',
  posOf: (n, t) => `${ordEn(n)}/${t}`, toGo: m => `${m} m`,
  failWhyRunning: 'You were still running! Let go on “SO”',
  failAlmost: m => `${m} m from the finish!`, failPlace: p => `You were ${ordEn(p)}!`, failTap: 'Tap to try again',
  failTipTrap: 'He got you right after a trap word 😏',
  winTitle: 'WELL DONE!', bossWinTitle: 'COOL SUN BEATEN! 😎', you: 'You', notIn: 'not in',
  nextBtn: 'Next', retryBtn: 'Replay', mapBtn: 'Map', bestTime: s => `Best time: ${s} s`,
  coins: n => `+${n} ⭐ for the locker`, worldDone: 'World 1 complete! More coming soon 🎉',
  rivalBurnt: p => `${p} TOASTED!`, rivalBack: p => `${p} starts over`, rivalDone: (p, n) => `🏁 ${p} ${ordEn(n)}`,
  haha: 'HA HA!', passed: p => `▲ ${ordEn(p)}`, passedBy: p => `▼ ${ordEn(p)}`,
  hesTitle: 'HESITATION…', hesSub: 'Wait to read the word!', stutterTitle: 'STUTTER!', stutterSub: '“2… 2… 3…”: listen, don’t count',
  expressTitle: 'EXPRESS CHANT! 🚀', expressSub: 'Everything goes twice as fast', moveSub: 'Special move!',
  bossTaunt: 'You think you can touch me?', bossBar: 'Cool Sun', bossDown: 'My shades!!',
  kind: { prudent: 'the Careful', fonceur: 'the Speedster', regulier: 'the Steady' },
  sayGrilled: ['Nooo!', 'Not fair!', 'Ouch ouch…', 'I didn’t move!', 'It burns!'],
  sayPass: ['Too slow!', 'Bye bye!', 'Heh heh!', 'Move over!'], sayPassed: ['Hey!', 'Wait for me!', 'Not so fast!', 'Oh no…'],
  sayFirst: ['First! 🏆', 'Too easy!'], sayDone: ['Made it!', 'Phew!'],
  // ---- World 2: temptations, fake back, mud, map
  temptHint: { star: 'He wants you to move… DON’T MOVE!', fakeRet: 'He’s faking! Wait for the “ding” 🔔',
    sneeze: 'Eyes shut… but he’s still facing you!', taunt: 'He’s teasing you… DON’T MOVE!',
    fly: 'A fly? Not scared. DON’T MOVE!', crack: 'He cracked… not you!', fakeBack: 'An eye is peeking! Wait for the “ding” 🔔' },
  temptFail: { star: 'The star was a trap 😏', fakeRet: 'Fake turn! Wait for the “ding” 🔔', sneeze: 'He was still facing you!',
    taunt: 'He just wanted you to move 😜', fly: 'A fly is no excuse!', crack: 'Don’t flinch!', hop: 'He was faking! Wait for the “ding” 🔔' },
  hintTitle: 'DON’T MOVE!', mudTitle: 'MUD!', mudSub: 'It’s sticky: slow restart',
  sangFroid: 'NERVES OF STEEL!', quickStart: 'LIGHTNING START!', ha: 'HA!', aah1: 'Aaah…', aah2: 'AAAH…', atchoum: 'ACHOO!', pfff: 'Pfff…', boom: 'BOOM!',
  taunts: ['Come on… move a little!', 'There’s an ant on your foot!', 'I can’t see a thing, promise 😇', 'Psst… your shoelace is untied!',
    'Smell that? French fries…', 'Did you just blink?', 'One tiny step… nobody will know!', 'Your nose itches, right?',
    'Look, a unicorn! 🦄', 'I’ll count to 3… 1… 2…', 'Are you a statue or what?', 'Boo! 👻'],
  bonusStars: n => `+${n} ⭐ for nerves of steel`,
  worldUnlocked: n => `WORLD ${n} UNLOCKED!`, worldUnlockedSub: 'The park awaits 🌳', needStars: (n, w) => `Earn ${n} ★ in world ${w} to unlock it 🔒`,
  bossTaunt2: 'You’ll laugh… or cry!', bossDown2: 'My nose!!', bossWin2: 'PRANKSTER SUN BEATEN! 🤡', bossBar2: 'Prankster Sun',
  worldDone2: 'World 2 complete! More coming soon 🎉',
});
})(window.Soleil);
