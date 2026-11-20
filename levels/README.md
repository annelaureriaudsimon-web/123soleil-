# Le format d'un niveau

Un niveau est un simple objet JavaScript, rangé dans `levels/worldN.js`. Pas besoin de toucher au moteur : on ajoute un objet, on recharge `index.html`, et le niveau apparaît sur la carte.

## Exemple commenté

```js
{ id: 'w1-3', emoji: '🥫',                          // identifiant unique (sert à la sauvegarde) + emoji de la carte d'intro
  name: T('La pluie de pièges', 'Raining traps'),   // nom en français et en anglais
  tip:  T('Lis le mot avant de lâcher !', 'Read the word before letting go!'),   // l'idée du niveau, en une phrase
  length: 150,                                      // distance jusqu'à l'arrivée (m) : environ 5 m par seconde de jeu
  seed: 1303,                                       // graine du niveau (chaque essai la mélange avec son numéro)
  sky: 0.6,                                         // moment de la journée : 0 matin, 1 midi, 2 soir (les décimales mélangent)
  speed: 1,                                         // vitesse max du joueur (× 8 m/s), 1 par défaut
  rivals: [kid('jade'), kid('tom'), kid('zoe')],    // 0 à 6 enfants de la cour (liste KIDS en haut de world1.js)
  sun: {                                            // réglages du soleil : [min, max] = tiré au hasard à chaque cycle
    word: [0.55, 0.65],                             // durée d'un chiffre « 1… 2… 3… » (s)
    turn: [0.555, 0.605],                           // LE réglage le plus important : temps pour s'arrêter après « SOLEIL ! »
    look: [1.2, 1.9],                               // durée de son regard (s)
    traps: 0.8, double: 0.45,                       // probabilité d'un mot piège dans un chant, puis d'un deuxième
    words: ['SOLDES !', 'SOUPE !', 'SOFA !']        // mots pièges de ce niveau (sinon ceux du jeu)
  },
  script: { 1: { traps: 2 } },                      // événements prévus : ici, double piège au cycle 1, à chaque essai
  hints: [{ on: 'reveal', cycle: 1, banner: 'trap' }],   // indications à l'écran (voir plus bas)
  goal: { type: 'avoid', n: 3 },                    // ★★ l'objectif
  challenge: { type: 'noTrap' },                    // ★★★ le défi
  mechanics: ['hold', 'traps', 'rivals'] }          // mécaniques actives (pour la suite : 'cloud', 'slope', 'voice'…)
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

Le monde 1 n'utilise aucun de ces champs : sans eux, un niveau se joue exactement comme en phase 1.

## Tous les réglages du soleil (`sun`)

Les valeurs par défaut sont dans `js/game/match.js` (`SUN_BASE`).

| Réglage | Rôle |
|---|---|
| `word` | durée d'un chiffre (s) |
| `jitter` | petite variation de chaque mot (0,08 = ±8 %) |
| `soK` | durée du « SO » (× un chiffre) |
| `turn` | demi-tour après « SOLEIL ! » (s). Sous 0,5 s, c'est très dur. |
| `look` | durée du regard (s) |
| `pause` | pause avant de rechanter (s) |
| `traps`, `double` | probabilité d'un mot piège, puis d'un deuxième |
| `hesitate`, `hesLen` | probabilité et durée (s) d'une hésitation « SOOOO… » |
| `hesOnTrap` | probabilité que l'hésitation finisse sur un mot piège |
| `stutter`, `stutterRush` | bégaiement « 2… 2… 3… », puis accélération (× durée) |
| `express`, `expressK`, `expressTurn` | chant express : × durée des mots, × durée du demi-tour |
| `words` | liste de mots pièges du niveau |
| `tempt` | tentations pendant le regard (monde 2) : `{ star, fakeRet, sneeze, taunt, fly, crack, max }`. Chaque nombre est la probabilité qu'elle arrive dans un regard ; `max` (1 à 3) limite leur nombre. Deux tentations qui se liraient au même endroit de l'écran ne vont jamais ensemble. |
| `fakeBack` | probabilité d'un faux dos à la fin d'un regard (monde 2) |
| `peek` | durée de l'œil qui dépasse pendant le faux dos (s), `[0.5, 1.1]` par défaut |
| `look2` | durée du 2e regard après le « HOP ! » (s), `[0.6, 1.0]` par défaut |

Les tentations possibles :

| Nom | Tentation | Le regard dure au moins |
|---|---|---|
| `star` | étoile tentatrice ⭐ | 1,6 s |
| `fakeRet` | faux retour 🙃 (« HA ! ») | 1,25 s après son début |
| `sneeze` | éternuement 🤧 (yeux fermés) | 2,2 s |
| `taunt` | moquerie 😜 | 1,7 s |
| `fly` | mouche 🪰 | 2,0 s |
| `crack` | un rival craque 💥 (seulement s'il y a un rival en course assez proche) | 1,5 s |

Le regard est rallongé tout seul quand une tentation en a besoin.

## Événements prévus (`script`)

La clé est le numéro du cycle (1 = le premier chant). Valeurs possibles :
- `traps: 0 | 1 | 2` : nombre de mots pièges ;
- `hes: true` ou une durée en s ;
- `hesAt` : quel « SO » hésite (0 = le premier) ;
- `stutter: true` ;
- `express: true` ;
- `turn`, `look`, `pause`, `word` : valeurs exactes en s ;
- `move: T('DOUBLE PIÈGE', 'DOUBLE TRAP')` : coup spécial annoncé par une bannière (boss) ;
- `tempt: ['sneeze', 'star']` : tentations forcées dans le regard de ce cycle (3 au plus) ; `tempt: []` : aucune ;
- `fakeBack: true | false` : faux dos forcé (ou interdit) à la fin du regard de ce cycle.

## Boue (`mud`)

`mud: [[12, 21], [40, 48]]` : chaque paire est une flaque, du mètre 12 au mètre 21. Dans une flaque, la vitesse max est ×0,55 et on repart au ralenti (9 m/s² au lieu de 30). Le freinage ne change pas : la boue fait perdre du temps, elle ne grille personne. Elle ralentit aussi les rivaux. Pour annoncer la première flaque : `hints: [{ on: 'mud', banner: 'mud' }]`.

## Boss (`boss`, `bossKind`)

`boss: true` lance la cinématique du boss. `bossKind: 'farceur'` choisit le Soleil Farceur (lunettes-nez-moustache, musique de cirque) ; sans ce champ, c'est le Soleil Cool du monde 1.

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

## Indications (`hints`)

Chaque indication s'affiche une fois par essai :
- `{ on: 'start', text: T(…), until: 'press' }` : le texte reste tant que le joueur n'a pas maintenu ;
- `{ on: 'so', cycle: 1, text: T('LÂCHE !', 'LET GO!'), pop: true }` : petit texte au moment du « SO » du cycle 1.
  - Les autres moments possibles sont `trigger`, `reveal` (mot piège démasqué), `return` (il se remet de dos) et `near` (à 15 m de l'arrivée).
- `{ on: 'reveal', cycle: 2, banner: 'trap' }` : bannière.
  - Bannières disponibles : `trap`, `hes`, `stutter`, `express`, `mud`.
  - `{ on: 'hes' | 'stutter' | 'express' | 'mud', banner: … }` affiche la bannière la première fois que la mécanique apparaît.
- Les tentations et le faux dos ont leur propre indication, affichée une seule fois dans tout le jeu (la toute première rencontre) : rien à écrire dans `hints`.

## Les rivaux

`kid('max', { brain: { speed: 1.18, greed: [0.12, 0.1] } })` reprend Max et change sa personnalité dans ce niveau seulement. Depuis la phase 2, chaque personnalité a aussi un sang-froid (`crack` : probabilité de craquer devant une tentation, `learn` : ce qu'il en reste une fois la tentation connue). Tous les réglages possibles sont dans `js/game/rivals.js` (`PROFILES`). Un nouvel enfant s'ajoute dans la liste `KIDS`, avec :
- un `id` ;
- un prénom ;
- une personnalité : `prudent`, `fonceur` ou `regulier` ;
- une tenue du jeu (`look.outfit`) et ses couleurs.

## Vérifier un niveau

```
node tools/simulate.js --level w2-3
```

Le résultat donne le taux de réussite des trois joueurs simulés, la durée et les étoiles. **Règle d'or : l'expert doit réussir au moins 95 %.**
