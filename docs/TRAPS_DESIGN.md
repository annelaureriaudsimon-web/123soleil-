# Les pièges du soleil (v2.5)

Ce fichier décrit **tous** les pièges du jeu : ceux d'avant (mondes 1 et 2) et les 8 nouveautés de la v2.5.
Pour chaque piège : ce qui se passe, **l'indice qu'on voit**, ce qu'il faut faire, où il apparaît, et comment il
est réglé. La répartition et la courbe de difficulté sont dans `docs/DIFFICULTY.md`, le monde 3 dans
`docs/WORLD3_DESIGN.md`.

## Pourquoi la v2.5

Le retour du joueur, sur les pièges d'avant : « Le faux dos, c'est le seul bon piège. Les autres ne sont pas
dangereux : on a juste à s'arrêter, même quand il dit des trucs faux. »

C'était vrai. Un joueur qui s'arrêtait à chaque « 3 » et ne repartait qu'au « ding » ne perdait presque jamais :
il était lent, mais rien ne le punissait. La v2.5 change ça de deux façons :

1. **La prudence coûte cher.** Le coucher du soleil, les transats et la glace qui fond : s'arrêter pour rien fait
   perdre le niveau.
2. **De faux signaux pour partir.** Le recomptage, l'avion menteur, la fausse alerte et le troupeau donnent envie de
   repartir pendant qu'il te regarde : là, bouger grille.

Un robot « prudent » (il s'arrête à chaque « 3 », attend toujours le « ding ») est maintenant dans la simulation.
Il échoue presque toujours dès la fin du monde 1, et jamais il n'a ★★★ (voir `docs/DIFFICULTY.md`).

## Les deux règles (toujours vraies)

> **1. Tant que le soleil est tourné vers toi, NE BOUGE PAS, quoi qu'il arrive.**
>
> **2. Seul le soleil compte. Pour repartir, attends le « ding ».**

Le « ding » du vrai retour arrive maintenant **dès le monde 1** (`SIGNAL_WORLD = 1`, `js/modes/levels.js`) : le
recomptage et la fausse alerte y arrivent, il fallait le vrai signal pour les déjouer. Il est toujours fait de quatre
choses ensemble, et **aucun piège ne l'imite** :
1. le son « ding-ding » (deux notes qui montent), **jamais** ailleurs ;
2. le visage disparaît complètement (on voit l'arrière de sa tête) ;
3. les rayons font un tour rapide ;
4. un anneau vert s'élargit autour de lui.

Il naît à un seul endroit : `trueReturn()` dans `js/game/match.js`. Le test « Le ding n'arrive qu'au vrai retour »
(`test_levels.py`, test 12) le vérifie.

## Une règle de dessin : chaque piège a un indice qu'on VOIT

Jamais par la couleur seule, jamais par le son seul. Avec le son coupé, en daltonien, chaque piège se lit :

| Piège | L'indice qu'on voit | Le son (en plus) |
|---|---|---|
| Mot piège | le mot entier (« SOLDES ! ») ; démasqué : il tremble, passe au vert et se fait **rayer** ; le vrai mot a une étoile « POW » | il rigole |
| Recomptage | **il te fait face** pendant qu'il compte (un vrai chant se fait toujours de dos), et pas de « ding » | « 1… 2… », puis il se marre |
| Avion « ALLEZ-Y ! » | les mots sont **sur une banderole tirée par un avion**, pas dans la bulle du chant ; le soleil te regarde toujours | bruit d'avion |
| Avion « SOLEIL ! » | pareil, pendant le chant : le soleil est **toujours de dos**, le chant continue | bruit d'avion |
| Nuage (reflet) | le nuage cache le soleil ; **son reflet à l'envers** dans une flaque (au monde 3 : le sable mouillé) montre son visage, l'œil du faux dos et l'anneau vert du « ding » | — |
| Fausse alerte | une **bulle de cri avec le prénom du rival**, jamais sur le soleil ; le soleil te regarde toujours | un cri |
| Troupeau | trois rivaux repartent ensemble… et sont grillés d'un coup : « TOUS GRILLÉS ! » | galop |
| Coucher du soleil | le soleil **descend** vers l'horizon, le ciel passe au soir, une barre « jusqu'à la nuit » ; les 5 dernières secondes, elle clignote : « Vite, la nuit tombe ! » | — |
| Transats | les transats sont **dessinés à l'arrivée** ; quand un rival s'assoit : « 🏖️ Inès s'assoit · encore 1 » | — |
| Glace qui fond | le cornet et ses boules en haut de l'écran ; une boule qui fond **tombe** (« PLOC ! ») ; au-delà de 6 boules : « ×n » | ploc |

## Ce qui a changé dans le chant : plus de « SO »

Avant, le soleil disait « 1, 2, 3… SO… » puis « SOLEIL ! » (ou un mot piège, « SOLDES ! »). Lâcher dès « SO »
suffisait : on n'avait même pas besoin de lire le mot.

Maintenant, **partout** (niveaux, course infinie, défi du jour, 2 joueurs, tutoriel, 6 langues) :

> « 1… 2… 3… » **puis le mot**.

- C'est le mot qui prévient : « SOLEIL ! » (stop) ou un mot piège (« SOLDES ! », continue).
- L'hésitation devient **le « 3… » qui dure** (au lieu du « SOOOO… »).
- Pour qu'on ait le temps de lire, réagir et freiner, les demi-tours sont un peu plus longs
  (niveaux +0,05 à +0,10 s, course infinie 0,50 s, 2 joueurs 0,65 s).
- Le dé de l'ancien « SO » est **encore tiré** (`soK`), mais rien ne s'affiche : la suite des dés ne bouge pas.
- `chant.pre` (« SO », « RED », « PO »…) existe toujours dans les textes : il sert seulement à vérifier que les
  mots pièges commencent comme le vrai mot. Il n'est jamais affiché, ni dit.
- Le test 30 de `test_poki.py` vérifie, dans les 6 langues et dans tous les modes, que le chant n'affiche que « 1 »,
  « 2 », « 3 », des mots entiers et le vrai mot, et que la voix ne dit jamais « So… » (« Red… », « Po… »…).

## A. La prudence coûte cher

### 🌅 Le coucher du soleil (champ `night` d'un niveau)
- **Ce qui se passe.** Au bout de `night` secondes, le soleil touche l'horizon : « LA NUIT TOMBE ! », perdu.
- **On le voit.** Le soleil descend pendant tout le niveau, le ciel passe au soir, la barre « jusqu'à la nuit »
  se vide ; les 5 dernières secondes, elle clignote.
- **Ce qu'il faut faire.** Ne pas s'arrêter pour rien : courir à travers les mots pièges.
- **2e chance** (🎬) : « +10 s de jour », une seule fois (`NIGHT_BONUS`).
- **Où.** Du niveau 1-3 (« Avant la nuit ») jusqu'au boss de la plage. Pas au 1-1 (en douceur) ni au 1-2.

### 🏖️ Les transats (champ `chairs`)
- **Ce qui se passe.** À l'arrivée, il y a **un transat de moins que d'enfants**. Quand le dernier est pris par un
  rival : « Plus de transat ! », perdu.
- **Pas de 2e chance** : les transats sont déjà pris, revenir en arrière n'y changerait rien.
- **Ce qu'il faut faire.** Ne pas être le dernier : la course compte vraiment.
- **Où.** Monde 3 : 1 (3 transats pour 4 enfants), 4 (4 pour 5), 7 (5 pour 6).

### 🍦 La glace qui fond (champs `scoops` et `melt`)
- **Ce qui se passe.** On part avec `scoops` boules ; une fond toutes les `melt` secondes (4 s). Les boules qui
  restent à l'arrivée donnent les étoiles (objectif `{ type: 'scoops', n }`).
- **À l'arrivée : la montagne de boules.** Autant de boules que dans la glace s'empilent en une montagne,
  « MONTAGNE DE GLACE ! ×n ».
- **Le cornet ne cache jamais le soleil** : il dessine 6 boules au plus, et écrit « ×n » au-delà (`CONE_MAX`,
  `js/render/pressure.js`).
- **Où.** Monde 3 : 2, 6 et le boss.

## B. Les faux signaux

### 🔁 Le recomptage (tentation `recount`)
- **Ce qui se passe.** Pendant son regard, il recompte « 1… » puis « 2… » (0,55 s plus tard) **en te regardant**,
  puis il se marre (« HÉ HÉ »). C'est le début d'un vrai chant… mais il est tourné vers toi : il ment.
- **On le voit.** Son visage. Un vrai chant se fait toujours de dos. Et pas de « ding ».
- **Ce qu'il faut faire.** Rester immobile, attendre le « ding ».
- **Si on bouge.** « Il comptait en te regardant : il mentait ! 😏 ».
- **C'est le plus dangereux** des faux signaux : il imite le vrai début d'un chant. Regard d'au moins 2,0 s.
- **Où.** 1-4 (« Le recomptage », 1re rencontre forcée au 2e regard), le boss 1-8 (7e coup : « LE RECOMPTAGE »),
  2-5, 2-6, 2-8, 3-1, 3-3, 3-6, 3-7, le boss 3-8 ; course infinie dès 50 m.

### ✈️ L'avion menteur (`planeStop` pendant le chant, tentation `planeGo` pendant le regard)
Un avion traverse le ciel avec une banderole. **Ce n'est jamais le soleil qui parle.**
- **« SOLEIL ! » pendant le chant (`planeStop`).** La banderole porte le vrai mot… mais le soleil est toujours de dos
  et continue de compter. S'arrêter fait perdre du temps (pas grillé : c'est un faux arrêt). Il passe entre 0,2 s
  après « 1 » et 0,45 s avant le vrai mot.
- **« ALLEZ-Y ! » pendant le regard (`planeGo`).** La banderole dit de partir… mais le soleil te regarde. Bouger
  grille : « L'avion mentait : seul le soleil compte ☀️ ». Regard d'au moins 1,7 s.
- **Le mot de la banderole n'est jamais le mot de départ du jeu** (vérifié dans les 6 langues) : « ALLEZ-Y ! »,
  « RUN NOW! », « ¡ADELANTE! », « PODE CORRER! », « LAUF JETZT! », « AVANTI! ».
- **Où.** Monde 3 : 3 (« L'avion menteur » : un de chaque, forcés), 4, 6, 7, le boss ; course infinie dès 90 m
  (la moitié des avions disent « ALLEZ-Y ! », l'autre moitié « SOLEIL ! »).

### 💧 Le reflet dans l'eau (champ `cloud`)
- **Ce qui se passe.** Un nuage cache le soleil, du chant jusqu'au vrai retour.
- **On le voit.** Son **reflet à l'envers** dans une flaque montre tout : son visage, l'œil du faux dos, l'anneau
  vert du « ding ». Au monde 3, la flaque est le sable mouillé (plus visible en qualité basse). Dans les niveaux,
  le texte du chant reste affiché.
- **Ce qu'il faut faire.** Regarder le reflet.
- **Où.** Monde 3 : 5 (« Le reflet dans l'eau », forcé aux 2 premiers cycles, le 2e avec un faux dos), 6, 7, le
  boss. Course infinie : le nuage existait déjà ; son reflet apparaît dès 150 m, avec une bannière la 1re fois.

## C. Les rivaux

### 📣 La fausse alerte (tentation `alarm`)
- **Ce qui se passe.** Pendant son regard, un rival qu'on voit (de 3,5 m derrière toi à 30 m devant) crie
  « IL REGARDE PAS ! VAS-Y ! ». Lui ne bouge pas : c'est une blague.
- **On le voit.** C'est une bulle de cri avec son prénom, jamais sur le soleil. Le soleil te regarde toujours.
- **Si on bouge.** « Le rival mentait : le soleil te regardait encore ! 😜 ».
- Personne à portée : pas d'alerte. Celui qui crie sait que c'est faux (il ne craque jamais sur sa propre blague).
- **Où.** 1-7 (« La grande course », forcée au 2e regard), le boss 1-8, 2-3, 2-6, 2-8, 3-2, 3-4, 3-7, le boss 3-8.

### 🐑 Le troupeau (tentation `herd`, niveaux seulement)
- **Ce qui se passe.** Trois rivaux qu'on voit (de 3,5 m derrière à 45 m devant) repartent **ensemble** pendant
  son regard… et sont grillés d'un coup : « TOUS GRILLÉS ! ». Ils repartent du début.
- **Ce qu'il faut faire.** Ne pas suivre : seul le soleil compte.
- **Si on suit.** « Tu as suivi le troupeau 🐑 : seul le soleil compte ! ».
- Jamais avec moins de 3 rivaux à portée. Pour qu'ils soient à portée, trois rivaux partent devant (`z0`).
- **C'est un obstacle, pas un objectif d'étoile** (le choix du joueur : « que pour réussir un niveau »).
- **Où.** 2-7 (« La grande course du parc », forcé au 2e regard) et 3-7. Jamais en course infinie.

## Tous les pièges, d'un coup d'œil

| Piège | Depuis | Monde 1 | Monde 2 | Monde 3 | Course infinie |
|---|---|---|---|---|---|
| Mot piège, double piège | phase 1 | ✔ | ✔ | ✔ | ✔ |
| Le « 3… » qui dure (hésitation) | phase 1 (v2.5 : sans « SO ») | ✔ | ✔ | ✔ | ✔ |
| Bégaiement, chant express | phase 1 | ✔ | ✔ | ✔ | ✔ |
| Étoile, faux retour, éternuement, moquerie, mouche, rival qui craque | phase 2 | — | ✔ | ✔ (étoile, faux retour, éternuement) | — |
| Faux dos (« HMM… HOP ! ») | phase 2 | — | ✔ | ✔ | dès 100 m |
| Boue | phase 2 | — | ✔ | — | dès 60 m |
| Nuage | phase 1 (course infinie) | — | — | ✔ (avec son reflet) | dès 80 m |
| **Coucher du soleil** | v2.5 | dès 1-3 | ✔ | ✔ | — |
| **Recomptage** | v2.5 | 1-4, 1-8 | ✔ | ✔ | dès 50 m |
| **Fausse alerte** | v2.5 | 1-7, 1-8 | ✔ | ✔ | — |
| **Troupeau** | v2.5 | — | 2-7 | 3-7 | — |
| **Transats** | v2.5 | — | — | 1, 4, 7 | — |
| **Glace qui fond** | v2.5 | — | — | 2, 6, 8 | — |
| **Avion menteur** | v2.5 | — | — | 3, 4, 6, 7, 8 | dès 90 m |
| **Reflet dans l'eau** | v2.5 | — | — | 5, 6, 7, 8 | dès 150 m |

## Comment c'est fait

### Le moteur (`js/game/match.js`)
- Les 4 nouvelles tentations sont dans la table `TEMPT` (`at`, `jit`, `need`, `group`) :

  | Tentation | Arrive (s après le début du regard) | Regard minimal | Groupe |
  |---|---|---|---|
  | `recount` | 0,35 + 0 à 0,35 | 2,0 s | voix, chant |
  | `planeGo` | 0,25 + 0 à 0,45 | 1,7 s | ciel |
  | `alarm` | 0,30 + 0 à 0,40 | 1,7 s | rival, voix |
  | `herd` | 0,45 + 0 à 0,35 | 1,6 s | rival |

  Deux tentations du même groupe ne vont jamais ensemble (elles se liraient au même endroit de l'écran).
- `planeStop` et `cloud` sont des probabilités par chant dans `sun` (`SUN_BASE`), forçables par `script`
  (`{ 2: { cloud: true } }`). Jamais d'avion « SOLEIL ! » pendant un nuage.
- `night`, `chairs`, `scoops`, `melt` sont des champs du niveau ; le moteur émet `nightWarn`, `melt`, `chairTaken`…
- **Les dés.** Les nouveautés tirent dans une **3e suite de dés**, `mulberry32(mixSeed(graine, 7000 + cycle))`. Les
  deux suites d'avant (le chant, et `5000 + cycle` pour le regard) ne bouge pas : un niveau qui n'utilise pas les
  nouveautés tire exactement les mêmes dés qu'en v2.4 (vérifié). Jamais `Math.random()` dans la logique.
- Un « 3 » qui arrive juste après un piège n'efface plus le jugement de ce piège (`judgeTrap`).

### La course infinie (`js/game/chant.js`, `js/game/watcher.js`)
- Une suite de dés à part, `mulberry32(mixSeed(S.runSeed, 7000 + S.cycleN))` : le défi du jour donne les mêmes faux
  signaux, au même cycle, à tout le monde (vérifié avec deux joueurs).
- Distances (`UNLOCK`, `js/core/config.js`) : recomptage 50 m, avion 90 m, reflet 150 m.
- Probabilité par chant (`LIE_P`) : recomptage 20 → 30 %, avion 22 → 32 %, selon la difficulté. Au plus un faux
  signal par chant ; jamais pendant un boss, ni à 2 joueurs, ni sous un nuage.
- La 1re fois : une bannière (« IL RECOMPTE ! », « L'AVION MENT ! », le reflet), mémorisée dans `soleil.lieSeen`.
- Grillé par un faux signal : le conseil de fin le dit (« Il comptait en te regardant… », « L'avion mentait… »).

### Les cerveaux (`js/game/rivals.js`) : rivaux et joueurs simulés
- `TEMPT_K` (combien chaque tentation fait craquer) : recomptage 1,0 · avion « ALLEZ-Y ! » 1,0 · fausse alerte 1,0
  · troupeau 1,2 (on a envie de suivre).
- `CRACK_AT` (quand on craque) : recomptage 0,05 s · avion 0,2 s · fausse alerte 0,15 s · troupeau 0,05 s.
- Avion « SOLEIL ! » : s'arrêter pour rien avec la probabilité `fooled × 1,2` (plus qu'un mot piège : la banderole
  porte le vrai mot).
- Nuage : pendant ce cycle, chaque tentation fait plus craquer (× 1,4) et on repart 0,12 s plus tard (le temps de
  voir le « ding » dans l'eau).
- Le robot `patient` : il s'arrête à **chaque** « 3 » et ne repart **qu'au** « ding », même après un mot piège.

### Le dessin
- `js/render/lies.js` : l'avion et sa banderole, le reflet (flaque cerclée d'encre ; sable mouillé au monde 3), la
  bulle de la fausse alerte.
- `js/render/pressure.js` : la barre de la nuit, les transats, le cornet et la montagne de boules.
- `js/render/beach.js` : la plage et le Soleil Vacancier.
- Les effets coûteux respectent `S.Q` (qualité automatique) ; rien n'est dans la zone de la pilule Poki ; tout suit
  `S.uiZoom`.

## Les textes

Tout est écrit dans les 6 langues (`js/core/i18n-levels.js`, `js/core/lang/*.js`), sans jeu de mots qui ne marche
qu'en français. Les mots du chant viennent toujours de `L.chant` / `S.chantW()`, jamais écrits en dur.
