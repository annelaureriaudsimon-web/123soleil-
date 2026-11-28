# Monde 1 — « La cour de récré »

Huit niveaux courts. Chacun repose sur **une seule idée forte**, avec une vraie menace dans les dix premières secondes. Le boss arrive au bout.

Le décor : une piste rouge au milieu d'une cour en bitume, avec des marelles à la craie, des bancs, des paniers de basket, des plots, des ballons et des arbres. Les autres enfants de la classe courent avec toi.

Mécaniques utilisées, et rien d'autre :
- maintenir / lâcher ;
- mots pièges ;
- hésitations (le « 3… » qui dure) ;
- bégaiement ;
- chant express ;
- rivaux ;
- v2.5 : le « ding » du vrai retour, le coucher du soleil (dès le niveau 3), le recomptage (niveau 4 et boss) et la
  fausse alerte d'un rival (niveau 7 et boss).

**v2.5 : plus de « SO ».** Le chant est « 1… 2… 3… » puis le mot (« SOLEIL ! » ou un mot piège) : c'est le mot qui
prévient, il faut le lire. Les demi-tours ont été rallongés pour ça. Les pièges de la v2.5 sont décrits dans
`docs/TRAPS_DESIGN.md`, la courbe dans `docs/DIFFICULTY.md`.

## Les rivaux

Leurs réglages sont dans `js/game/rivals.js`. Les noms et les tenues sont dans `levels/world1.js`.

| Personnalité | Emoji | Comportement | Enfants |
|---|---|---|---|
| Le Prudent | 🐢 | S'arrête dès le « 3 » trois fois sur quatre, repart en retard, s'arrête sur les mots pièges. Il perd du temps. | Léo, Zoé, Tom, Lila |
| Le Fonceur | ⚡ | Vitesse ×1,14 à ×1,18. Attend « SOLEIL ! » et lâche même un peu en retard. Il repart pendant les longs « 3… » et se fait souvent griller. | Hugo, Max, Nino |
| Le Régulier | 🎯 | Lit le mot (et s'arrête dès le « 3 » une fois sur trois), réagit vite (0,21 s) et se fait rarement avoir. C'est l'adversaire le plus dur à battre. | Inès, Jade, Sam |

Tous ont un temps de réaction variable. Ils marquent parfois un petit arrêt sans raison et peuvent tomber dans les mots pièges. Leurs décisions passent par la graine de l'essai.

Quand un rival est grillé :
- il devient tout noir, fume et dit « Nooon ! » ;
- il tombe ou trépigne ;
- il repart du début du niveau ;
- le soleil rigole (« HA HA ! »).

## Les niveaux

Les « taux visés » sont les objectifs fixés avant le réglage. Les taux obtenus sont dans `docs/LEVELS.md`.

### 1. Premiers pas 👟
- **Idée :** le tutoriel intégré, sans écran de règles.
- **Apprend :** maintenir pour courir, lâcher avant « SOLEIL ! », repartir quand il se remet de dos, et lire le mot avant de lâcher.
- **Menace (moins de 10 s) :**
  - 1er « SOLEIL ! » vers 3,5 s, avec un demi-tour exceptionnellement lent (1 s) ;
  - au 2e cycle (vers 9 s), un mot piège forcé, avec la bannière « PIÈGE ! Il n'a pas dit SOLEIL 😏 ».
- **Indications à l'écran** (v2.2 : dessinées, une main sur téléphone et tablette, la touche Espace sur PC) :
  - « MAINTIENS » et la main qui appuie, tant qu'on n'a pas maintenu (1re visite : le niveau attend ce premier appui) ;
  - « LÂCHE ! » et le doigt qui se lève, au premier « SOLEIL ! » (v2.5 : il n'y a plus de « SO ») ;
  - « REPARS ! » et la main qui appuie, quand il se remet de dos ;
  - « Touche le soleil ! » à 15 m de l'arrivée.
- **Départ en douceur (v2.2) :** vu en train de bouger, on n'est pas grillé : « OUPS ! », 6 m en arrière en faisant la toupie, le soleil rigole, et il faut lâcher pour repartir.
- **★★ :** Arrive dans le top 2.
- **★★★ :** Ne tombe dans aucun piège.
- **Rivaux :** Léo 🐢 et Zoé 🐢.
- **Taux visés :** débutant presque toujours (au moins 90 %, depuis la v2.2 ; avant : 40 à 70 %), moyen environ 100 %, expert 100 %.

### 2. Les hésitations 😶
- **Idée :** le soleil fait durer le « 3… » (avant la v2.5 : le « SOOOO… »).
- **Apprend :** ne pas repartir tant qu'on n'a pas lu le mot, et ne pas lâcher trop tôt pour rien.
- **Menace :**
  - cycle 1 : un « 3… » de 1,4 s ;
  - cycle 3 : un « 3… » de 1,9 s qui finit sur un mot piège.
- **Indication :** bannière « HÉSITATION… Attends de lire le mot ! ».
- **★★ :** Arrive dans le top 2.
- **★★★ :** Finis en moins de 30 s. Pour y arriver, il faut garder sa course pendant les hésitations.
- **Rivaux :** Hugo ⚡ (il craque pendant les hésitations et se fait griller : c'est la leçon en direct) et Lila 🐢.
- **Taux visés :** débutant environ 60 %, moyen environ 100 %.

### 3. Avant la nuit 🌅 (v2.5 ; avant : « La pluie de pièges »)
- **Idée :** SOLDES, SOUPE, SOFA, SODA, SOURIS… Il y a un mot piège dans 80 % des chants, et souvent deux. Et le soleil
  se couche : la nuit tombe à 37,5 s (v2.5.1 ; 33,5 s en v2.5).
- **Apprend :** lire le mot entier et courir à travers les pièges. S'arrêter pour rien fait tomber la nuit.
- **Menace :** dès le cycle 1, un double piège ; « Arrive avant la nuit ! 🌅 » au départ.
- **★★ :** Évite 3 pièges sans t'arrêter.
- **★★★ :** Ne tombe dans aucun piège.
- **Rivaux :** Jade 🎯, Tom 🐢 et Zoé 🐢.
- **Taux visés :** moyen environ 85 % (v2.5) ; le robot prudent échoue (la nuit tombe).

### 4. Le recomptage 🔁 (v2.5 ; avant : « Le Fonceur »)
- **Idée :** pendant son regard, il recompte « 1… 2… » **en te regardant** : il ment. Et Max court beaucoup plus vite
  que toi, mais il prend des risques (il tombe dans le panneau).
- **Apprend :** un vrai chant se fait toujours de dos ; pour repartir, attends le « ding ». La régularité bat la vitesse.
- **Menace :**
  - 1er « SOLEIL ! » vers 6 s ;
  - le recomptage forcé au 2e regard (avec son indication la 1re fois) ;
  - Max part devant dès le départ ; la nuit tombe à 41 s.
- **Indication :** « Bats Max ! ⚡ ».
- **★★ :** Bats Max.
- **★★★ :** Finis en moins de 34 s.
- **Rivaux :** Max ⚡ (vitesse ×1,18) et Léo 🐢.
- **Taux visés :** débutant environ 10 %, moyen environ 90 %. On veut battre Max une fois sur deux à deux sur trois.

### 5. Le bégaiement 🥴
- **Idée :** « 1… 2… 2… 3… ». Après avoir bégayé, le soleil accélère : le reste du chant va ×1,6 plus vite.
- **Apprend :** ne pas compter le rythme, mais réagir à ce qui est dit.
- **Menace :** bégaiement forcé au cycle 1. Le mot arrive alors plus tôt que prévu (vers 4,5 s). La nuit tombe à 37,5 s.
- **Indication :** bannière « BÉGAIEMENT ! ».
- **★★ :** Arrive dans le top 2.
- **★★★ :** Fais un combo OUF ×2.
- **Rivaux :** Inès 🎯, Tom 🐢 et Nino ⚡.
- **Taux visés :** débutant environ 5 %, moyen environ 75 %.

### 6. Le chant express 🚀
- **Idée :** tout va deux fois plus vite, et le demi-tour est un peu plus rapide.
- **Apprend :** être prêt et lire le mot tout de suite.
- **Menace :** chant express forcé au cycle 1 : le 1er « SOLEIL ! » tombe vers 3,2 s. La nuit tombe à 38 s.
- **Indication :** bannière « CHANT EXPRESS ! 🚀 ».
- **★★ :** Fais 2 OUF.
- **★★★ :** Arrive 1er.
- **Rivaux :** Sam 🎯, Hugo ⚡ et Lila 🐢.
- **Taux visés :** moyen environ 60 %.

### 7. La grande course 🏃
- **Idée :** 5 rivaux à la fois, et le soleil mélange tout : pièges, hésitations, bégaiements et express. v2.5 : un
  rival crie « IL REGARDE PAS ! VAS-Y ! » pendant le regard : c'est une blague (la fausse alerte).
- **Apprend :** garder la tête froide dans la foule ; seul le soleil compte. Les places changent sans arrêt.
- **Menace :** 1er « SOLEIL ! » vers 7 s, avec un demi-tour plus court (0,625 à 0,675 s) et souvent un piège ou un
  express dès le départ ; la fausse alerte forcée au 2e regard ; la nuit tombe à 40,5 s (v2.5.1 ; 35,8 s en v2.5 : elle
  tombait beaucoup trop vite).
- **★★ :** Arrive dans le top 3.
- **★★★ :** Arrive 1er.
- **Rivaux :** Inès 🎯, Max ⚡, Jade 🎯, Léo 🐢 et Zoé 🐢.
- **Taux visés :** moyen environ 50 %.

### 8. BOSS — Le Soleil Cool 😎
- **Idée :** le soleil met ses lunettes et enchaîne ses coups spéciaux.
- **Mise en scène :**
  1. carte d'intro ;
  2. il se tourne vers toi : « Tu crois pouvoir me toucher ? » ;
  3. ses lunettes noires tombent du ciel : flash, « BOSS ! », musique 8-bit.
  4. La barre de progression devient sa barre de vie.
  5. Victoire : ses lunettes s'envolent (« Mes lunettes !! »), feu d'artifice, fanfare, « SOLEIL COOL BATTU ! ».
- **Coups spéciaux, annoncés par une bannière :**
  1. la grande hésitation (le « 3… » de 2 s) ;
  2. double piège ;
  3. super express ;
  4. bégaiement piégé ;
  5. express hésitant ;
  6. tout en même temps ;
  7. v2.5 : le recomptage (+ un mot piège).
  - Ensuite, tout au hasard (recomptages et fausses alertes compris), avec des demi-tours de 0,62 à 0,67 s. La nuit
    tombe à 49 s (v2.5.1 ; 39,6 s en v2.5).
- **Menace :** la grande hésitation, dès le cycle 1 (vers 5 s).
- **★★ :** Fais 3 OUF.
- **★★★ :** Arrive 1er.
- **Rivaux :** Inès 🎯, Max ⚡ et Léo 🐢.
- **Durée :** jusqu'à 45 s.
- **Taux visés :** moyen 15 à 35 %, expert au moins 95 %.

## Règles communes

- **Juste :** on peut toujours survivre en lâchant au bon moment. Le joueur « expert » de la simulation (qui lit le mot et attend le « ding ») réussit chaque niveau à au moins 98 %.
- **v2.5.1 : réglé sur un vrai joueur.** Le joueur « moyen » lit le mot en 0,36 s (un vrai joueur au téléphone) : les demi-tours laissent le temps de lire, et la nuit tombe juste après lui (elle lui fait perdre au plus 1 % de ses essais). Moyen : 100, 100, 90, 79, 72, 63, 52 et 32 % (boss). Voir `docs/DIFFICULTY.md`.
- **v2.5 : s'arrêter tout le temps ne suffit pas.** Le robot prudent de la simulation (il s'arrête à chaque « 3 », attend toujours le « ding ») finit les niveaux 1 et 2, puis échoue dès le niveau 3 : la nuit tombe.
- **Fixe d'un essai à l'autre :**
  - la longueur ;
  - les rivaux ;
  - les événements prévus (« mot piège au cycle 2 », coups du boss).
- **Variable à chaque essai, dans les limites du niveau :**
  - la durée des mots ;
  - le demi-tour ;
  - le regard ;
  - les pauses ;
  - les pièges au hasard.
- **Le défaut des personnalités compte :** le Fonceur craque pendant les hésitations (et sur les recomptages), le Prudent tombe dans les pièges. Cela met les leçons en scène.
