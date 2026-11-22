# Monde 3 — « La plage » (v2.5)

Les deux grandes idées de la plage :
- **la pression** : s'arrêter pour rien coûte cher (les transats, la glace qui fond, et toujours le coucher du soleil) ;
- **les faux signaux** : ce n'est pas toujours le soleil qui parle (l'avion menteur) et on ne le voit pas toujours
  (le nuage : il faut regarder son reflet dans l'eau).

Chaque niveau n'apporte **qu'une** nouveauté ; les autres reprennent ce qu'on connaît déjà. Le détail de chaque piège
(indice visible, réglages, cerveaux) est dans `docs/TRAPS_DESIGN.md` ; la courbe dans `docs/DIFFICULTY.md`.

Mécaniques de ce monde, et rien d'autre :
- tout le monde 1 (maintenir / lâcher, mots pièges, le « 3… » qui dure, bégaiement, chant express, rivaux) ;
- une partie du monde 2 (étoile tentatrice, faux retour, éternuement, faux dos ; pas de boue sur le sable) ;
- le coucher du soleil, le recomptage et la fausse alerte (v2.5, mondes 1 et 2) ;
- **nouveau** : les transats, la glace qui fond, l'avion menteur, le reflet dans l'eau ; le troupeau revient au 3-7.

## Les règles (toujours vraies)

> **Tant que le soleil est tourné vers toi, NE BOUGE PAS. Seul le soleil compte : pour repartir, attends le « ding ».**

Ni une banderole d'avion, ni un rival qui crie, ni un troupeau qui part ne disent la vérité. Derrière un nuage, son
reflet dans l'eau montre tout : son visage, l'œil du faux dos, l'anneau vert du « ding ».

## Le déblocage et la carte

- La plage se débloque avec **12 étoiles du monde 2** (sur 24). À la première ouverture de la carte après les avoir
  gagnées : le cadenas du badge « 3 » saute, confettis, « MONDE 3 DÉBLOQUÉ ! » et « La plage t'attend 🏖️ ». La carte
  bascule sur la plage. Avant : « Gagne 12 ★ dans le monde 2 pour le débloquer 🔒 ».
- La page de la plage sur la carte : la mer en haut avec ses vagues, le sable, des parasols et des serviettes vus du
  ciel, un château de sable, et le chemin des 8 niveaux jusqu'au boss (son rond montre le chapeau et les lunettes en
  cœur).
- Les mondes 4 et 5 restent « Bientôt ».

## Le décor (`js/render/beach.js`, dessiné en code, rien de téléchargé)

Chemin de sable mouillé, sable sec, la mer à l'horizon (teintée par le ciel du moment), parasols, palmiers, châteaux de
sable, ballons, seaux et pelles, coquillages, une tour de maître-nageur, un marchand de glaces, des mouettes qui
s'envolent quand on passe. Le reflet du nuage se lit dans le sable mouillé. Tout est placé avec `hash()` : le même décor
à chaque essai. Les décors lointains suivent la qualité automatique (`S.Q`).

## Les 8 niveaux

Durées visées : 30 à 42 s, et 50 s au plus pour le boss. Les taux sont ceux du joueur « moyen » (300 essais). Le
niveau 1 doit être plus dur que le début du parc et plus facile que le Soleil Farceur.

### 1. Les transats 🏖️
- **Idée :** 3 transats pour 4 enfants à l'arrivée. Le dernier arrivé a perdu, sans 2e chance.
- **Apprend :** la course compte ; s'arrêter pour rien fait perdre.
- **Menace (moins de 10 s) :** 1er « SOLEIL ! » vers 6 s ; Jade et Sam partent devant (10 et 18 m).
- **Avec :** mots pièges, le « 3… » qui dure, faux dos, étoile, recomptage, faux retour ; nuit à 42 s (large : ce
  sont les transats qui pressent).
- **★★ :** Arrive dans le top 2. **★★★ :** Finis en moins de 34 s.
- **Rivaux :** Inès 🎯, Jade 🎯, Sam 🎯.
- **Simulation :** moyen 59 % (parc : 66 %, Soleil Farceur : 27 %), expert 100 %, robot prudent 0 %.

### 2. La glace qui fond 🍦
- **Idée :** on part avec 12 boules ; une fond toutes les 4 s. Chaque boule qui reste à l'arrivée compte.
- **Apprend :** aller vite… sans se faire griller. À l'arrivée : la montagne de boules.
- **Menace :** 1er « SOLEIL ! » vers 7 s ; une boule tombe dès 4 s (« PLOC ! »).
- **Avec :** double piège, fausse alerte, étoile, faux retour ; nuit à 35,5 s.
- **★★ :** Arrive avec 4 boules de glace. **★★★ :** Arrive avec 5 boules.
- **Rivaux :** Jade 🎯, Tom 🐢, Nino ⚡.
- **Simulation :** moyen 57 %, expert 99 %.

### 3. L'avion menteur ✈️
- **Idée :** un avion passe avec une banderole. « SOLEIL ! » pendant le chant (faux arrêt), « ALLEZ-Y ! » pendant le
  regard (faux départ). Ce n'est jamais le soleil qui parle.
- **Apprend :** seul le soleil compte.
- **Menace :** l'avion « SOLEIL ! » au 1er chant, l'avion « ALLEZ-Y ! » au 2e regard (forcés, à chaque essai).
- **Avec :** recomptage ; nuit à 35,5 s.
- **★★ :** Arrive dans le top 2. **★★★ :** Finis en moins de 36 s.
- **Rivaux :** Max ⚡ (il se fait avoir), Lila 🐢, Sam 🎯.
- **Simulation :** moyen 49 %, expert 99 %.

### 4. Le volley de plage 🏐
- **Idée :** 4 rivaux, 4 transats… et des avions menteurs.
- **Apprend :** combiner la course (transats) et les faux signaux.
- **Menace :** 1er « SOLEIL ! » vers 4,5 s ; Sam part devant (8 m).
- **Avec :** bégaiement, avions, fausse alerte, étoile ; nuit à 37,5 s.
- **★★ :** Arrive dans le top 3. **★★★ :** Arrive 1er.
- **Rivaux :** Inès 🎯, Nino ⚡, Sam 🎯, Jade 🎯.
- **Simulation :** moyen 44 %, expert 99 %.

### 5. Le reflet dans l'eau 💧
- **Idée :** un nuage cache le soleil ; son reflet dans le sable mouillé montre s'il regarde.
- **Apprend :** regarder le reflet (le visage, l'œil du faux dos, l'anneau vert du « ding »).
- **Menace :** nuage forcé aux deux premiers chants ; au 2e, un faux dos (l'œil se voit dans le reflet). Bannière
  « REGARDE SON REFLET ! » au premier nuage.
- **Avec :** faux dos, étoile, faux retour ; nuit à 42,5 s.
- **★★ :** Fais 3 départs éclair. **★★★ :** Finis en moins de 37 s.
- **Rivaux :** Nino ⚡, Léo 🐢, Lila 🐢.
- **Simulation :** moyen 41 %, expert 97 %.

### 6. Le château de sable 🏰
- **Idée :** la glace revient (14 boules), avec les nuages, les avions et les recomptages.
- **Apprend :** tout ce qu'on a appris sur la plage, en même temps.
- **Menace :** 1er « SOLEIL ! » vers 7 s.
- **Avec :** double piège, le « 3… » qui dure, nuage, avions, faux dos, recomptage, éternuement ; nuit à 42,8 s.
- **★★ :** Arrive avec 5 boules de glace. **★★★ :** Arrive avec 6 boules.
- **Rivaux :** Sam 🎯, Max ⚡, Tom 🐢.
- **Simulation :** moyen 45 %, expert 99 % (la nuit est passée de 42 à 42,8 s : à 42 s, l'expert tombait à 93 % dans
  le test du navigateur).

### 7. La grande course de la plage 🏃
- **Idée :** 5 rivaux, 5 transats, des faux signaux partout, et le troupeau.
- **Apprend :** ne suivre personne.
- **Menace :** le troupeau au 2e regard (forcé) : Inès, Max et Jade partent devant (8, 14 et 20 m) pour qu'il ait lieu.
- **Avec :** bégaiement, express, nuage, avions, faux dos, fausse alerte, recomptage, étoile ; nuit à 44,5 s.
- **★★ :** Arrive dans le top 3. **★★★ :** Arrive 1er.
- **Rivaux :** Inès 🎯, Max ⚡, Jade 🎯, Léo 🐢, Zoé 🐢.
- **Simulation :** moyen 34 %, expert 98 %.

### 8. BOSS — Le Soleil Vacancier 🏖️
- **Idée :** il veut garder la plage pour lui ; la glace fond (16 boules) pendant qu'il sort ses coups spéciaux.
- **Mise en scène :**
  1. carte d'intro ;
  2. il se tourne vers toi : « Cette plage est à moi ! » ;
  3. un chapeau de paille et des lunettes en cœur tombent sur lui (le son du chapeau, flash), musique **calypso** 8-bit
     (144 battements par minute) ; il les garde tout le niveau. Les lunettes sont dessinées sur sa sphère et la fleur du
     chapeau glisse quand il tourne ; quand il se fâche ou pendant l'œil du faux dos, on voit ses vrais yeux ;
  4. ses 6 coups spéciaux, annoncés par une bannière :
     1. « L'AVION PUBLICITAIRE » (avion « ALLEZ-Y ! ») ;
     2. « LA SIESTE AU SOLEIL » (nuage + faux dos) ;
     3. « LE RECOMPTAGE » (+ un mot piège) ;
     4. « LA FAUSSE ALERTE » (+ avion « SOLEIL ! » pendant le chant) ;
     5. « EXPRESS DES VACANCES » (chant express + étoile + faux retour) ;
     6. « TOUT EN MÊME TEMPS » (nuage + recomptage) ;
  5. victoire : le chapeau s'envole (« Mon chapeau !! »), feu d'artifice, fanfare, la montagne de boules,
     « SOLEIL VACANCIER BATTU ! 🏖️ », puis « Monde 3 terminé ! La suite arrive bientôt 🎉 ».
- **Menace :** l'avion publicitaire dès le cycle 1.
- **★★ :** Arrive avec 5 boules de glace. **★★★ :** Arrive 1er.
- **Rivaux :** Inès 🎯, Hugo ⚡, Nino ⚡.
- **Durée :** nuit à 48 s.
- **Simulation :** moyen 17 % (visé : 10 à 20 %), expert 97 %, durée moyenne 44 s.

## Les textes, les sons

- Tous les textes sont dans les 6 langues (`js/core/i18n-levels.js`, `js/core/lang/*.js`). Les noms du boss :
  Soleil Vacancier, Holiday Sun, Sol Veraneante, Sol de Férias, Urlaubssonne, Sole in Vacanza (adaptations à faire
  relire, voir `docs/POKI_SUBMISSION.md`).
- Sons (`js/audio/sounds.js`, tout en 8-bit) : le chapeau, l'avion, le cri de la fausse alerte, le galop du troupeau ;
  la calypso du boss est dans `js/audio/music.js`.

## Pour aller plus loin

Le monde 4 (« La montagne ») et le monde 5 (« La nuit ») sont sur la carte, verrouillés (« Bientôt »). Pour en ouvrir
un : le même chemin que la plage (`levels/worlds.js`, `levels/world4.js`, `index.html`, `tools/simulate.js`), voir
`docs/NEXT_PHASES.md`.
