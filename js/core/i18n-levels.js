/* js/core/i18n-levels.js — Textes du mode Niveaux (carte, intro, HUD, résultats, rivaux), en français et en anglais.
   Ils s'ajoutent aux textes du jeu (core/i18n.js) : L.xxx marche pareil. */
(function (S) {
'use strict';
const { TXT } = S;

const ordFr = n => (n === 1 ? '1er' : `${n}e`);
const ordEn = n => `${n}${n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th'}`;

Object.assign(TXT.fr, {
  ord: ordFr,
  worldN: n => `Monde ${n}`, soon: 'Bientôt', soonToast: 'Ce monde arrive bientôt ! 🔒', lockedToast: 'Finis le niveau d’avant pour le débloquer 🔒',
  levelN: n => `Niveau ${n}`, bossTag: 'BOSS',
  goalDone: 'Finis le niveau',
  goal: (g, who) => g.type === 'top' ? `Arrive dans le top ${g.n}` : g.type === 'first' ? 'Arrive 1er'
    : g.type === 'oufs' ? `Fais ${g.n} OUF` : g.type === 'combo' ? `Fais un combo OUF ×${g.n}`
    : g.type === 'noTrap' ? 'Ne tombe dans aucun piège' : g.type === 'avoid' ? `Évite ${g.n} pièges sans t’arrêter`
    : g.type === 'time' ? `Finis en moins de ${g.s} s` : g.type === 'beat' ? `Bats ${who}`
    : g.type === 'quick' ? `Fais ${g.n} départs éclair` : g.type === 'resist' ? `Résiste à ${g.n} tentations`
    : g.type === 'scoops' ? `Arrive avec ${g.n} boules de glace` : '',
  tapStart: 'Touche pour commencer',
  posOf: (n, t) => `${ordFr(n)}/${t}`, toGo: m => `${m} m`,
  failWhyRunning: 'Tu courais encore ! Lâche dès que tu lis « SOLEIL ! »',
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
  worldN: n => `World ${n}`, soon: 'Soon', soonToast: 'This world is coming soon! 🔒', lockedToast: 'Finish the previous level to unlock it 🔒',
  levelN: n => `Level ${n}`, bossTag: 'BOSS',
  goalDone: 'Finish the level',
  goal: (g, who) => g.type === 'top' ? `Finish in the top ${g.n}` : g.type === 'first' ? 'Finish 1st'
    : g.type === 'oufs' ? `Get ${g.n} PHEWs` : g.type === 'combo' ? `Get a ×${g.n} PHEW combo`
    : g.type === 'noTrap' ? 'Don’t fall for any trap' : g.type === 'avoid' ? `Run through ${g.n} traps without stopping`
    : g.type === 'time' ? `Finish in under ${g.s} s` : g.type === 'beat' ? `Beat ${who}`
    : g.type === 'quick' ? `Get ${g.n} lightning starts` : g.type === 'resist' ? `Resist ${g.n} temptations`
    : g.type === 'scoops' ? `Finish with ${g.n} scoops` : '',
  tapStart: 'Tap to start',
  posOf: (n, t) => `${ordEn(n)}/${t}`, toGo: m => `${m} m`,
  failWhyRunning: 'You were still running! Let go as soon as you read “RED LIGHT!”',
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
// Pubs récompensées (v2.3, js/ui/reward.js)
Object.assign(TXT.fr, {
  tryAgain: 'Réessayer', reviveBtn: '2e chance', reviveCap: 'Regarde une courte vidéo pour continuer d’ici',
  continueBtn: 'Continuer', continueCap: 'Regarde une courte vidéo pour continuer ta course d’ici',
  doubleBtn: '×2 ⭐', doubleCap: n => `Regarde une courte vidéo pour gagner ${n} ⭐ de plus`, doubledPop: n => `+${n} ⭐ ×2 !`, doubledTag: ' ×2',
  tryBtn: 'Essayer', tryCap: 'Regarde une courte vidéo pour la porter pendant ta prochaine partie',
  buyBtn: p => `Acheter · ${p} ⭐`, close: 'Fermer',
  trialOn: n => `${n} : tu la portes pour ta prochaine partie !`, trialEnd: (n, p) => `Tu l’as aimée ? ${n} coûte ${p} ⭐`,
  trialTag: n => `Essai : ${n}`, trialBadge: 'Essai',
  noVideo: 'Vidéo indisponible', rewardDone: 'Fait', revived: '2E CHANCE !', noChallengeRevive: 'impossible après une 2e chance'
});
Object.assign(TXT.en, {
  tryAgain: 'Try again', reviveBtn: 'Second chance', reviveCap: 'Watch a short video to continue from here',
  continueBtn: 'Continue', continueCap: 'Watch a short video to continue your run from here',
  doubleBtn: '×2 ⭐', doubleCap: n => `Watch a short video to get ${n} more ⭐`, doubledPop: n => `+${n} ⭐ ×2!`, doubledTag: ' ×2',
  tryBtn: 'Try it', tryCap: 'Watch a short video to wear it in your next game',
  buyBtn: p => `Buy · ${p} ⭐`, close: 'Close',
  trialOn: n => `${n}: you’ll wear it in your next game!`, trialEnd: (n, p) => `Liked it? ${n} costs ${p} ⭐`,
  trialTag: n => `Trial: ${n}`, trialBadge: 'Trial',
  noVideo: 'Video unavailable', rewardDone: 'Done', revived: 'SECOND CHANCE!', noChallengeRevive: 'not possible after a second chance'
});
// Qualité d'image (v2.4, js/render/quality.js)
Object.assign(TXT.fr, { qualityLbl: m => `Qualité : ${{ auto: 'Auto', high: 'Haute', low: 'Basse' }[m] || m}` });
Object.assign(TXT.en, { qualityLbl: m => `Quality: ${{ auto: 'Auto', high: 'High', low: 'Low' }[m] || m}` });
// v2.5 — la pression : la nuit, les transats, la glace (game/match.js, render/pressure.js)
Object.assign(TXT.fr, {
  nightFall: 'LA NUIT TOMBE !',
  nightWhy: 'Le soleil s’est couché avant ton arrivée !',
  nightTip: 'Ne t’arrête pas pour rien : cours à travers les mots pièges !',
  nightWarn: 'Vite, la nuit tombe !',
  nightBonus: '+10 s DE JOUR !',
  reviveNightBtn: '+10 s de jour',
  reviveNightCap: 'Regarde une courte vidéo : le soleil remonte un peu',
  chairsWhy: 'Plus de transat !',
  chairsTip: 'Arrive avant que tous les transats soient pris !',
  chairTaken: (n, f) => `🏖️ ${n} s’assoit${f ? ` · encore ${f}` : ' · plus aucun !'}`,
  ploc: 'PLOC !',
  mountain: n => `MONTAGNE DE GLACE ! ×${n}`
});
Object.assign(TXT.en, {
  nightFall: 'NIGHT FALLS!',
  nightWhy: 'The sun set before you got there!',
  nightTip: 'Don’t stop for nothing: run through the trap words!',
  nightWarn: 'Hurry, night is falling!',
  nightBonus: '+10 s OF DAYLIGHT!',
  reviveNightBtn: '+10 s of daylight',
  reviveNightCap: 'Watch a short video: the sun rises a little',
  chairsWhy: 'No deckchair left!',
  chairsTip: 'Get there before all the deckchairs are taken!',
  chairTaken: (n, f) => `🏖️ ${n} sits down${f ? ` · ${f} left` : ' · none left!'}`,
  ploc: 'PLOP!',
  mountain: n => `ICE CREAM MOUNTAIN! ×${n}`
});
// v2.5 — les faux signaux : le recomptage, l'avion menteur, le nuage et son reflet (game/match.js, render/lies.js).
// La banderole « ALLEZ-Y ! » (planeGo) n'est JAMAIS le mot de départ du jeu (L.go, « GO ! ») : seul le soleil compte.
Object.assign(TXT.fr.temptHint, {
  recount: 'Il compte en te regardant : il ment ! Attends le « ding » 🔔',
  planeGo: 'Ce n’est pas le soleil qui parle ! Il te regarde encore',
  planeStop: 'Un avion ? Seul le soleil compte ☀️',
  cloud: 'Le nuage le cache : regarde son reflet dans l’eau !'
});
Object.assign(TXT.fr.temptFail, {
  recount: 'Il comptait en te regardant : il mentait ! 😏',
  planeGo: 'L’avion mentait : seul le soleil compte ☀️'
});
Object.assign(TXT.fr, {
  planeGo: 'ALLEZ-Y !',
  refletTitle: 'REGARDE SON REFLET !', refletSub: 'Dans l’eau, tu vois s’il te regarde',
  refletTip: 'Derrière le nuage, regarde son reflet dans l’eau 💧'
});
Object.assign(TXT.fr.obst, { recount: 'recomptages', plane: 'avions menteurs', reflet: 'reflets dans l’eau' });
Object.assign(TXT.en.temptHint, {
  recount: 'He’s counting while looking at you: he’s lying! Wait for the “ding” 🔔',
  planeGo: 'The sun isn’t the one talking! He’s still watching you',
  planeStop: 'A plane? Only the sun counts ☀️',
  cloud: 'The cloud hides him: watch his reflection in the water!'
});
Object.assign(TXT.en.temptFail, {
  recount: 'He was counting while looking at you: he lied! 😏',
  planeGo: 'The plane lied: only the sun counts ☀️'
});
Object.assign(TXT.en, {
  planeGo: 'RUN NOW!',
  refletTitle: 'WATCH HIS REFLECTION!', refletSub: 'In the water, you can see if he’s looking',
  refletTip: 'Behind the cloud, watch his reflection in the water 💧'
});
Object.assign(TXT.en.obst, { recount: 'recounts', plane: 'lying planes', reflet: 'reflections' });
S.typoAll(TXT.fr);                                 // typographie française : espaces insécables (core/i18n.js)
})(window.Soleil);
