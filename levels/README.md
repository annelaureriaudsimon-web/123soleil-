# Le format d'un niveau

Un niveau est un simple objet JavaScript, rangé dans `levels/worldN.js`. Pas besoin de toucher au moteur : on ajoute un objet, on recharge `index.html`, et le niveau apparaît sur la carte.

## Exemple commenté

```js
{ id: 'w1-3', emoji: '🌅',                          // identifiant unique (sert à la sauvegarde) + emoji de la carte d'intro
  name: T('Avant la nuit', 'Before nightfall'),     // nom en français et en anglais
  tip:  T('Le soleil se couche : lis vite et cours à travers les pièges !', '…'),   // l'idée du niveau, en une phrase
  length: 150,                                      // distance jusqu'à l'arrivée (m) : environ 5 m par seconde de jeu
  night: 33.5,                                      // v2.5 : le coucher du soleil, en s (0 = jamais de nuit)
  seed: 1303,                                       // graine du niveau (chaque essai la mélange avec son numéro)
  sky: 0.6,                                         // moment de la journée : 0 matin, 1 midi, 2 soir (les décimales mélangent)
  speed: 1,                                         // vitesse max du joueur (× 8 m/s), 1 par défaut
  rivals: [kid('jade'), kid('tom'), kid('zoe')],    // 0 à 6 enfants de la cour (liste KIDS en haut de world1.js)
  sun: {                                            // réglages du soleil : [min, max] = tiré au hasard à chaque cycle
    word: [0.55, 0.65],                             // durée d'un chiffre « 1… 2… 3… » (s)
    turn: [0.655, 0.705],                           // LE réglage le plus important : temps pour lire le mot, réagir et s'arrêter
    look: [1.2, 1.9],                               // durée de son regard (s)
    traps: 0.8, double: 0.45,                       // probabilité d'un mot piège dans un chant, puis d'un deuxième
    words: [0, 1, 4]                                // mots pièges de ce niveau : numéros dans la liste de la langue (0 = SOLDES / RED HAT…)
  },
  script: { 1: { traps: 2 } },                      // événements prévus : ici, double piège au cycle 1, à chaque essai
  hints: [{ on: 'reveal', cycle: 1, banner: 'trap' }],   // indications à l'écran (voir plus bas)
  goal: { type: 'avoid', n: 3 },                    // ★★ l'objectif
  challenge: { type: 'noTrap' },                    // ★★★ le défi
  mechanics: ['hold', 'traps', 'rivals', 'night'] } // mécaniques actives (la simulation s'en sert : ce que le joueur connaît déjà)
```

## Exemple du monde 2 : tentations, faux dos, boue

```js
{ id: 'w2-6', emoji: '🎭', name: T('Le grand jeu du Farceur', 'The Prankster’s game'), tip: T(…, …),
  length: 160, seed: 2606, sky: 1.7,
  rivals: [kid('sam'), kid('nino'), kid('zoe')],
  mud: [[30, 38], [88, 97]],                        // flaques de boue posées à la main : [début, fin] en mètres
  sun: { word: [0.52, 0.62], turn: [0.53, 0.58], traps: 0.25,
         fakeBack: 0.35,                            // probabilité d'un faux dos à la fin d'un regard
         tempt: { star: 0.25, fakeRet: 0.15, sneeze: 0.15, crack: 0.2, max: 2 } },   // tentations : probabilité par regard, et au plus 2
  script: { 1: { tempt: ['sneeze'] }, 3: { fakeBack: true } },   // forcées à un cycle précis, à chaque essai
  goal: { type: 'oufs', n: 2 }, challenge: { type: 'first' },
  mechanics: ['hold', 'traps', 'rivals', 'fakeBack', 'tempt:star', 'tempt:fakeRet', 'tempt:sneeze', 'tempt:crack'] }
```

Sans ces champs, un niveau se joue exactement comme en phase 1.

## Exemple du monde 3 (v2.5) : transats, glace, avion, nuage, rivaux qui partent devant

```js
{ id: 'w3-4', emoji: '🏐', name: T('Le volley de plage', 'Beach volleyball'), tip: T(…, …),
  length: 155, night: 37.5, seed: 3404, sky: 1.2,
  chairs: 4,                                        // les transats : 4 pour 5 enfants (le dernier arrivé a perdu)
  // scoops: 12, melt: 4,                           // (autre niveau) la glace : 12 boules, une fond toutes les 4 s
  rivals: [kid('ines'), kid('nino'), kid('sam', { z0: 8 }), kid('jade')],   // z0 : Sam part 8 m devant
  sun: { word: [0.52, 0.62], turn: [0.55, 0.6], traps: 0.35, stutter: 0.25,
         planeStop: 0.25,                           // un avion « SOLEIL ! » pendant le chant (probabilité par chant)
         // cloud: 0.5,                             // (autre niveau) un nuage cache le soleil ; son reflet dans l'eau
         tempt: { planeGo: 0.35, alarm: 0.3, star: 0.3, max: 1 } },   // avion « ALLEZ-Y ! », fausse alerte, étoile
  script: {},                                       // pour les forcer : { 1: { planeStop: true }, 2: { tempt: ['planeGo'] } } (le 3-3)
  goal: { type: 'top', n: 3 }, challenge: { type: 'top', n: 1 },
  mechanics: ['hold', 'traps', 'stutter', 'rivals', 'chairs', 'night', 'plane', 'tempt:planeGo', 'tempt:alarm', 'tempt:star'] }
```

## La pression (v2.5) : `night`, `chairs`, `scoops`, `melt`

| Champ | Rôle |
|---|---|
| `night` | le coucher du soleil : au bout de `night` s, « LA NUIT TOMBE ! », perdu. Barre « jusqu'à la nuit » ; les 5 dernières secondes, elle clignote. 2e chance (🎬) : le soleil remonte et ne se couche plus de l'essai (v2.5.1). `0` = pas de nuit. Réglage : juste au-dessus du joueur moyen de la simulation (`docs/DIFFICULTY.md`). |
| `chairs` | les transats à l'arrivée. Mettez-en **un de moins que d'enfants** (rivaux + toi). Quand le dernier est pris par un rival : perdu, sans 2e chance. |
| `scoops`, `melt` | la glace : on part avec `scoops` boules, une fond toutes les `melt` s. Ce qui reste compte pour l'objectif `scoops`. À l'arrivée : la montagne de boules. |

Le moteur (`js/game/match.js`) gère tout : la simulation en tient compte toute seule. Le robot « prudent » de la
simulation (il s'arrête à chaque « 3 ») sert à vérifier que la pression le fait échouer.

## Tous les réglages du soleil (`sun`)

Les valeurs par défaut sont dans `js/game/match.js` (`SUN_BASE`).

| Réglage | Rôle |
|---|---|
| `word` | durée d'un chiffre (s) |
| `jitter` | petite variation de chaque mot (0,08 = ±8 %) |
| `soK` | l'ancien « SO » (v2.4) : son dé est encore tiré pour garder les mêmes chants, mais rien ne s'affiche |
| `turn` | demi-tour après « SOLEIL ! » (s) : tout le temps pour lire le mot, réagir et freiner. Sous 0,55 s, c'est très dur. |
| `look` | durée du regard (s) |
| `pause` | pause avant de rechanter (s) |
| `traps`, `double` | probabilité d'un mot piège, puis d'un deuxième |
| `hesitate`, `hesLen` | probabilité et durée (s) d'une hésitation : le « 3… » qui dure avant le mot |
| `hesOnTrap` | probabilité que l'hésitation finisse sur un mot piège |
| `stutter`, `stutterRush` | bégaiement « 2… 2… 3… », puis accélération (× durée) |
| `express`, `expressK`, `expressTurn` | chant express : × durée des mots, × durée du demi-tour |
| `words` | mots pièges du niveau : numéros (0 à 11) dans la liste de la langue (`chant.traps` de js/core/i18n.js et js/core/lang/*.js) ; ainsi chaque langue a ses mots, au même rythme |
| `tempt` | tentations pendant le regard : `{ star, fakeRet, sneeze, taunt, fly, crack, recount, planeGo, alarm, herd, max }`. Chaque nombre est la probabilité qu'elle arrive dans un regard ; `max` (1 à 3) limite leur nombre. Deux tentations qui se liraient au même endroit de l'écran ne vont jamais ensemble. |
| `fakeBack` | probabilité d'un faux dos à la fin d'un regard (monde 2) |
| `peek` | durée de l'œil qui dépasse pendant le faux dos (s), `[0.5, 1.1]` par défaut |
| `look2` | durée du 2e regard après le « HOP ! » (s), `[0.6, 1.0]` par défaut |
| `planeStop` | v2.5 : probabilité, par chant, d'un avion « SOLEIL ! » pendant le chant (faux arrêt : on perd du temps, on n'est pas grillé). Jamais avec un nuage. |
| `cloud` | v2.5 : probabilité, par chant, d'un nuage qui cache le soleil jusqu'au vrai retour ; son reflet dans l'eau (au monde 3 : le sable mouillé) montre son visage, l'œil du faux dos et l'anneau vert du « ding ». |

Les tentations possibles :

| Nom | Tentation | Le regard dure au moins |
|---|---|---|
| `star` | étoile tentatrice ⭐ | 1,6 s |
| `fakeRet` | faux retour 🙃 (« HA ! ») | 1,25 s après son début |
| `sneeze` | éternuement 🤧 (yeux fermés) | 2,2 s |
| `taunt` | moquerie 😜 | 1,7 s |
| `fly` | mouche 🪰 | 2,0 s |
| `crack` | un rival craque 💥 (seulement s'il y a un rival en course assez proche) | 1,5 s |
| `recount` | v2.5 : le recomptage 🔁 : il recompte « 1… 2… » en te regardant, puis se marre | 2,0 s |
| `planeGo` | v2.5 : l'avion « ALLEZ-Y ! » ✈️ (une banderole, ce n'est pas le soleil qui parle) | 1,7 s |
| `alarm` | v2.5 : la fausse alerte 📣 : un rival qu'on voit crie « IL REGARDE PAS ! VAS-Y ! » (personne entre 3,5 m derrière et 30 m devant : pas d'alerte) | 1,7 s |
| `herd` | v2.5 : le troupeau 🐑 : trois rivaux qu'on voit repartent ensemble… et sont grillés (il faut 3 rivaux entre 3,5 m derrière et 45 m devant ; mettez-en devant avec `z0`). Un obstacle, jamais un objectif d'étoile. | 1,6 s |

Le regard est rallongé tout seul quand une tentation en a besoin.

## Événements prévus (`script`)

La clé est le numéro du cycle (1 = le premier chant). Valeurs possibles :
- `traps: 0 | 1 | 2` : nombre de mots pièges ;
- `hes: true` ou une durée en s ;
- `hesAt` : devant quel mot le « 3… » dure (0 = le premier mot du chant) ;
- `stutter: true` ;
- `express: true` ;
- `turn`, `look`, `pause`, `word` : valeurs exactes en s ;
- `move: T('DOUBLE PIÈGE', 'DOUBLE TRAP')` : coup spécial annoncé par une bannière (boss) ;
- `tempt: ['sneeze', 'star']` : tentations forcées dans le regard de ce cycle (3 au plus) ; `tempt: []` : aucune ;
- `fakeBack: true | false` : faux dos forcé (ou interdit) à la fin du regard de ce cycle ;
- `cloud: true | false` (v2.5) : nuage forcé (ou interdit) pour ce cycle ;
- `planeStop: true | false` (v2.5) : avion « SOLEIL ! » forcé (ou interdit) pendant ce chant.

## Boue (`mud`)

`mud: [[12, 21], [40, 48]]` : chaque paire est une flaque, du mètre 12 au mètre 21. Dans une flaque, la vitesse max est ×0,55 et on repart au ralenti (9 m/s² au lieu de 30). Le freinage ne change pas : la boue fait perdre du temps, elle ne grille personne. Elle ralentit aussi les rivaux. Pour annoncer la première flaque : `hints: [{ on: 'mud', banner: 'mud' }]`.

## Boss (`boss`, `bossKind`)

`boss: true` lance la cinématique du boss. `bossKind: 'farceur'` choisit le Soleil Farceur (lunettes-nez-moustache, musique de cirque) ; `bossKind: 'vacancier'` (v2.5) le Soleil Vacancier (chapeau de paille, lunettes en cœur, calypso) ; sans ce champ, c'est le Soleil Cool du monde 1. Un nouveau boss s'ajoute dans la table `BOSS` de `js/modes/levels.js` (son déguisement, son son, sa musique, ses textes).

## Objectifs et défis (`goal`, `challenge`)

| Type | Exemple | Texte affiché |
|---|---|---|
| `top` | `{ type: 'top', n: 2 }` | Arrive dans le top 2 |
| `first` | `{ type: 'first' }` | Arrive 1er |
| `oufs` | `{ type: 'oufs', n: 2 }` | Fais 2 OUF |
| `combo` | `{ type: 'combo', n: 2 }` | Fais un combo OUF ×2 |
| `noTrap` | `{ type: 'noTrap' }` | Ne tombe dans aucun piège |
| `avoid` | `{ type: 'avoid', n: 3 }` | Évite 3 pièges sans t'arrêter |
| `time` | `{ type: 'time', s: 30 }` | Finis en moins de 30 s |
| `beat` | `{ type: 'beat', who: 'max' }` | Bats Max |
| `quick` | `{ type: 'quick', n: 3 }` | Fais 3 départs éclair (repartir moins de 0,35 s après le « ding ») |
| `resist` | `{ type: 'resist', n: 4 }` | Résiste à 4 tentations |
| `scoops` | `{ type: 'scoops', n: 5 }` | Arrive avec 5 boules de glace (v2.5, niveaux avec `scoops`) |

## Indications (`hints`)

Chaque indication s'affiche une fois par essai :
- `{ on: 'start', text: T(…), until: 'press' }` : le texte reste tant que le joueur n'a pas maintenu ;
- `{ on: 'trigger', cycle: 1, text: T('LÂCHE !', 'LET GO!'), hand: 'release' }` : consigne **dessinée** (v2.2) : une main qui
  lève le doigt (téléphone, tablette) ou la touche Espace qui remonte (clavier), avec un mot au-dessus du coureur.
  `hand: 'hold'` montre le doigt qui appuie. Elle disparaît quand le geste est fait (`until: 'press'` : dès qu'on
  appuie ; par défaut, dès qu'on a fait le geste montré), ou au bout de 2,4 s ;
- `{ on: 'trigger', cycle: 1, text: T('LÂCHE !', 'LET GO!'), pop: true }` : petit texte au moment du vrai mot du cycle 1
  (v2.5 : il n'y a plus de « SO » ; l'ancien moment `so` n'existe plus).
  - Les autres moments possibles sont `start`, `reveal` (mot piège démasqué), `return` (il se remet de dos), `near` (à 15 m de l'arrivée), `hes`, `stutter`, `express`, `mud` et `cloud`.
- `{ on: 'reveal', cycle: 2, banner: 'trap' }` : bannière.
  - Bannières disponibles : `trap`, `hes`, `stutter`, `express`, `mud`, `cloud` (v2.5 : « REGARDE SON REFLET ! »).
  - `{ on: 'hes' | 'stutter' | 'express' | 'mud' | 'cloud', banner: … }` affiche la bannière la première fois que la mécanique apparaît.
- Les tentations et le faux dos ont leur propre indication, affichée une seule fois dans tout le jeu (la toute première rencontre) : rien à écrire dans `hints`.

## Niveau en douceur (`soft`)

`soft: { back: 6 }` (le niveau 1) : si le soleil te voit bouger, tu n'es pas grillé. « OUPS ! » : tu recules de
`back` mètres en faisant la toupie, le soleil rigole, et la main montre « LÂCHE ! ». Il faut lâcher pour repartir.
Le moteur (`game/match.js`) le gère : la simulation en tient donc compte toute seule.

## Les rivaux

`kid('max', { brain: { speed: 1.18, greed: [0.12, 0.1] } })` reprend Max et change sa personnalité dans ce niveau seulement. `kid('jade', { z0: 10 })` (v2.5) le fait partir 10 m devant ; grillé, il repart quand même du début. Depuis la phase 2, chaque personnalité a aussi un sang-froid (`crack` : probabilité de craquer devant une tentation, `learn` : ce qu'il en reste une fois la tentation connue). Tous les réglages possibles sont dans `js/game/rivals.js` (`PROFILES`). Un nouvel enfant s'ajoute dans la liste `KIDS`, avec :
- un `id` ;
- un prénom ;
- une personnalité : `prudent`, `fonceur` ou `regulier` ;
- une tenue du jeu (`look.outfit`) et ses couleurs.

## Vérifier un niveau

```
node tools/simulate.js --level w2-3
```

Le résultat donne le taux de réussite des quatre joueurs simulés (expert, moyen, débutant et, depuis la v2.5, le robot prudent), la durée et les étoiles. **Règle d'or : l'expert doit réussir au moins 95 %.** Avec la pression (nuit, transats, glace), vérifiez aussi que le robot prudent échoue : s'arrêter tout le temps ne doit pas suffire (`docs/DIFFICULTY.md`).
