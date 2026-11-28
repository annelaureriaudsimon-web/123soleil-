# Monde 4 — « La montagne » (v2.6)

Les pièges de la montagne, choisis par le joueur (« Pièges du jeu ») :
- **la descente et le verglas**, déjà connus de la course infinie, arrivent dans les niveaux. Dans une descente, on
  court plus vite et on freine moins bien ; sur le verglas, on glisse longtemps ;
- **les luges à l'arrivée**, comme les transats de la plage : une luge de moins que d'enfants ;
- **le reflet sur le lac gelé** : derrière un nuage, on lit le soleil dans son reflet sur la glace du lac ;
- **et les pièges qu'on connaît déjà** (mondes 1 à 3).

Rien d'autre n'a été ajouté. Chaque niveau n'apporte **qu'une** nouveauté ; les autres reprennent ce qu'on connaît
déjà. Le détail de chaque piège est dans `docs/TRAPS_DESIGN.md`, la courbe dans `docs/DIFFICULTY.md`.

## Les règles (toujours vraies)

> **Tant que le soleil est tourné vers toi, NE BOUGE PAS. Seul le soleil compte : pour repartir, attends le « ding ».**
>
> **Et à la montagne : près du verglas ou dans une descente, lâche dès le « 3 ».**

C'est juste, et c'est vérifié : un joueur qui lâche dès le « 3 » quand il est sur (ou juste avant) un sol glissant,
qui lâche au mot ailleurs et qui attend le « ding » pour repartir **gagne tous les niveaux de la montagne, à chaque
essai** (`test_levels.py`, test 28 : 40 essais sur 40, sur les 8 niveaux, jamais grillé en glissant).

Pourquoi « dès le 3 » : il faut 0,2 s pour s'arrêter sur le sol (à 8 m/s), 0,4 s dans une descente (on y court à
10,4 m/s) et 0,6 s sur le verglas. Lâcher au mot, comme d'habitude, laisse donc trop peu de
temps sur la glace : il faut anticiper. Le « 3 » vient toujours juste avant le mot (ou avant un mot piège, qui laisse le
temps de repartir).

Pour la même raison, **pas de chant express ni de bégaiement** dans les niveaux où il y a du verglas : même en lâchant
dès le « 3 », on n'aurait pas le temps de s'arrêter. Seule exception, un coup spécial du boss (« LA DESCENTE EXPRESS ») :
le chant va deux fois plus vite, mais son demi-tour est long (0,8 s) ; en lâchant dès le « 3 », on s'arrête à temps, même
sur la glace.

## Ce qu'on voit (chaque piège a un indice visible, jamais par la couleur seule)

- **La descente** : le sentier est plus sombre, avec des **chevrons ▼** qui pointent vers toi ; quand tu y es, l'horizon
  **penche** et le vent souffle. La 1re fois : « DESCENTE ! Tu vas plus vite… et tu freines mal : lâche dès le « 3 » ! ».
- **Le verglas** : des **plaques bleu pâle qui brillent** sur le sentier, visibles de loin ; quand tu glisses, des
  étincelles de glace. La 1re fois : « VERGLAS ! Ça glisse longtemps : lâche dès le « 3 » ! ».
- **Grillé en glissant**, la carte de fin le dit : « Lâché 0,13 s trop tard sur le verglas ! » (ou « dans la
  descente ») et le conseil « Sur le verglas, lâche beaucoup plus tôt ».
- **Les luges** : dessinées à l'arrivée (patins recourbés, siège rayé) ; le HUD compte les luges libres (🛷 ×3) ; quand
  un rival arrive : « 🛷 Inès s'assoit · encore 2 ». Plus de luge : « PLUS DE LUGE ! ».
- **Le lac gelé** : toujours un peu visible sous le soleil, au bout du sentier (glace bleu pâle, bord de neige, traces
  de patins). Quand un nuage cache le soleil, le reflet devient net : son visage, l'œil du faux dos, l'anneau vert du
  « ding ». Sur la glace, le reflet ne bouge pas (pas de vaguelettes). Bannière : « REGARDE SON REFLET ! Sur le lac
  gelé, tu vois s'il te regarde ».

## Le déblocage et la carte

- La montagne se débloque avec **12 étoiles du monde 3** (sur 24). À la première ouverture de la carte après les avoir
  gagnées : le cadenas saute, « MONDE 4 DÉBLOQUÉ ! » et « La montagne t'attend ⛰️ ». Avant : « Gagne 12 ★ dans le
  monde 3 pour le débloquer 🔒 ».
- La page de la montagne sur la carte : la neige, des sommets enneigés en haut, un lac gelé, des sapins vus du ciel,
  des traces de ski, un chalet, et le chemin des 8 niveaux jusqu'au boss (son rond montre le bonnet et le masque).
- Le monde 5 (« La nuit ») reste « Bientôt ».

## Le décor (`js/render/mountain.js`, dessiné en code, rien de téléchargé)

Un sentier de neige tassée (brun-gris : le verglas bleu et les descentes s'y voient bien), de la neige des deux côtés,
des **sommets enneigés** à l'horizon à la place des collines (teintés par le ciel du moment ; au milieu, la crête reste
toute basse : le visage du soleil, même quand il descend le soir, n'est jamais caché, et l'avion menteur passe
au-dessus), des sapins enneigés, des bonshommes de neige, des rochers coiffés de neige, des piquets de slalom (drapeau
triangle rouge, drapeau carré bleu : deux formes), des barrières, des skis plantés, des tas de boules de neige, un
**chalet** (sa cheminée fume) environ tous les 92 m, un **pylône de télésiège** (son siège se balance) environ tous les
61 m, et quelques **flocons** qui tombent (petits : ils ne cachent rien ; moins nombreux en qualité basse). Tout est
placé avec `hash()` : le même décor à chaque essai. Le décor lointain suit la qualité automatique (`S.Q`).

## Les 8 niveaux

Durées visées : 30 à 42 s, et 50 s au plus pour le boss. Les taux sont ceux du joueur « moyen » (300 essais). Le
niveau 1 doit être plus dur que le 2e niveau de la plage (57 %) et plus facile que le Soleil Vacancier (18 %).

### 1. La descente ⛷️
- **Idée :** trois descentes. On y va plus vite… mais on y freine mal.
- **Apprend :** lâcher dès le « 3 » dans une descente.
- **Menace (moins de 10 s) :** 1er « SOLEIL ! » vers 7 s ; la 1re descente dès 22 m (bannière « DESCENTE ! »).
- **Avec :** mots pièges (et double piège), le « 3… » qui dure, faux dos, étoile, faux retour, recomptage ; nuit à 44 s.
- **★★ :** Arrive dans le top 2. **★★★ :** Finis en moins de 36 s (les descentes font gagner du temps).
- **Rivaux :** Tom 🐢, Inès 🎯, Nino ⚡.
- **Simulation :** moyen 54 % (plage : 57 % au 2e niveau, Soleil Vacancier : 18 %), expert 99 %, robot prudent 2 %.

### 2. Le verglas 🧊
- **Idée :** quatre plaques de verglas. On y glisse trois fois plus longtemps.
- **Apprend :** voir la glace de loin, lâcher dès le « 3 » avant d'y arriver.
- **Menace :** 1er « SOLEIL ! » vers 7 s ; la 1re plaque à 26 m (bannière « VERGLAS ! »).
- **Avec :** double piège, le « 3… » qui dure, faux retour, fausse alerte, étoile ; nuit à 44 s.
- **★★ :** Arrive dans le top 2. **★★★ :** Finis en moins de 36 s.
- **Rivaux :** Jade 🎯, Max ⚡ (il glisse souvent), Léo 🐢.
- **Simulation :** moyen 53 %, expert 100 %.

### 3. Les luges 🛷
- **Idée :** 3 luges pour 4 enfants à l'arrivée ; le dernier arrivé a perdu, sans 2e chance.
- **Apprend :** la course compte toujours, même quand il faut anticiper.
- **Menace :** 1er « SOLEIL ! » vers 7 s ; Sam et Inès partent devant (10 et 16 m). « Attrape une luge ! 🛷 » au départ.
- **Avec :** 2 descentes et 1 plaque de verglas, mots pièges, faux dos, étoile, recomptage, faux retour ; nuit à 46 s.
- **★★ :** Arrive dans le top 2. **★★★ :** Finis en moins de 36 s.
- **Rivaux :** Jade 🎯, Sam 🎯, Inès 🎯 (des « réguliers » : ils lâchent toujours dès le « 3 » sur la glace).
- **Simulation :** moyen 49 %, expert 100 %.

### 4. Le lac gelé ❄️
- **Idée :** un nuage cache le soleil ; son reflet sur le lac gelé montre s'il regarde.
- **Apprend :** regarder le reflet, avec du verglas sur le chemin.
- **Menace :** nuage forcé aux deux premiers chants ; au 2e, un faux dos (l'œil se voit dans le reflet). Bannière
  « REGARDE SON REFLET ! » au premier nuage.
- **Avec :** 3 plaques de verglas, double piège, faux dos, étoile, faux retour ; nuit à 46,5 s.
- **★★ :** Fais 2 départs éclair. **★★★ :** Finis en moins de 38 s.
- **Rivaux :** Léo 🐢, Nino ⚡, Lila 🐢.
- **Simulation :** moyen 46 %, expert 99 %.

### 5. Le slalom 🚩
- **Idée :** descentes et verglas l'un après l'autre… et 4 luges pour 5 enfants.
- **Apprend :** passer de « lâche au mot » à « lâche dès le 3 » sans se tromper, et repartir vite.
- **Menace :** 1er « SOLEIL ! » vers 7 s ; Sam, Inès et Tom partent devant (8, 14 et 22 m).
- **Avec :** jusqu'à 2 tentations par regard (fausse alerte, recomptage, avion, étoile, faux retour), avions, faux dos,
  double piège ; nuit à 47,5 s.
- **★★ :** Arrive dans le top 3. **★★★ :** Finis en moins de 39 s.
- **Rivaux :** Jade 🎯, Sam 🎯, Inès 🎯, Tom 🐢.
- **Simulation :** moyen 41 %, expert 99 %.

### 6. Le chalet 🏠
- **Idée :** nuages, verglas, descentes, faux dos : tout ce qu'on a appris à la montagne, en même temps.
- **Apprend :** garder son sang-froid jusqu'au chalet.
- **Menace :** 1er « SOLEIL ! » vers 7 s.
- **Avec :** jusqu'à 2 tentations par regard (recomptage, éternuement, faux retour, étoile), nuage, faux dos, double
  piège ; nuit à 47,5 s.
- **★★ :** Arrive dans le top 2. **★★★ :** Finis en moins de 39 s.
- **Rivaux :** Zoé 🐢, Hugo ⚡, Inès 🎯.
- **Simulation :** moyen 35 %, expert 98 %.

### 7. La grande course de la montagne 🏂
- **Idée :** 5 rivaux, 5 luges, des pentes, du verglas, des faux signaux partout, et le troupeau.
- **Apprend :** ne suivre personne.
- **Menace :** le troupeau au 2e regard (forcé) : Inès, Sam et Jade partent devant (8, 14 et 20 m) pour qu'il ait lieu.
- **Avec :** nuage, avions, faux dos, fausse alerte, recomptage, étoile, faux retour (jusqu'à 2 par regard) ; nuit à
  49 s.
- **★★ :** Arrive dans le top 3. **★★★ :** Finis en moins de 40 s.
- **Rivaux :** Inès 🎯, Sam 🎯, Jade 🎯, Léo 🐢, Max ⚡.
- **Simulation :** moyen 31 %, expert 99 %.

### 8. BOSS — Le Soleil des Neiges ❄️
- **Idée :** bonnet à pompon et masque de ski : il fait glisser tout le monde (3 descentes, 4 plaques de verglas).
- **Mise en scène :**
  1. carte d'intro ;
  2. il se tourne vers toi : « Attention, ça glisse ! » ;
  3. un bonnet rayé à pompon et un masque de ski tombent sur lui (un « boing » de pompon, flash), **air de montagne**
     8-bit (« oum-pa » et clochettes, 132 battements par minute) ; il les garde tout le niveau. Le masque est dessiné sur
     sa sphère et suit son demi-tour ; de dos, on ne voit que la sangle. Quand il se fâche ou pendant l'œil du faux dos,
     il remonte son masque sur son bonnet : on voit ses vrais yeux ;
  4. ses 6 coups spéciaux, annoncés par une bannière :
     1. « LE NUAGE DE NEIGE » (nuage + faux retour : regarde le lac gelé) ;
     2. « L'AVALANCHE DE PIÈGES » (deux mots pièges, le « 3… » qui dure, étoile) ;
     3. « LE RECOMPTAGE GLACÉ » (recomptage + faux retour) ;
     4. « LE TROUPEAU DE SKIEURS » (troupeau + étoile) ;
     5. « LA DESCENTE EXPRESS » (chant express, demi-tour long de 0,8 s, éternuement + étoile) ;
     6. « CACHE-CACHE » (nuage + faux dos + fausse alerte, étoile, faux retour) ;
  5. victoire : une pelote de laine 🧶 s'envole (« Mon bonnet !! »), feu d'artifice, fanfare, « SOLEIL DES NEIGES BATTU ! ⛄ »,
     puis « Monde 4 terminé ! La suite arrive bientôt 🎉 ».
- **Menace :** le nuage de neige dès le cycle 1.
- **★★ :** Arrive dans le top 2. **★★★ :** Finis en moins de 48 s.
- **Rivaux :** Inès 🎯, Hugo ⚡, Nino ⚡.
- **Durée :** nuit à 57 s.
- **Simulation :** moyen 17 % (visé : 10 à 20 %, c'est le dernier boss), expert 97 %, durée moyenne 46,5 s.

## Les textes, les sons

- Tous les textes sont dans les 6 langues (`js/core/i18n-levels.js`, `js/core/lang/*.js`). Les noms du boss :
  Soleil des Neiges, Snow Sun, Sol de las Nieves, Sol das Neves, Schneesonne, Sole delle Nevi (à faire relire, voir
  `docs/POKI_SUBMISSION.md`). Les consignes disent « dès le 3 » avec le chiffre, le même dans toutes les langues.
- Sons (`js/audio/sounds.js`, tout en 8-bit) : le pompon du bonnet ; la descente (un souffle de vent qui monte avec la
  vitesse) et le verglas (le crissement de la glace) existaient déjà dans la course infinie ; l'air de montagne du boss
  est dans `js/audio/music.js`.

## Les cerveaux à la montagne (`js/game/rivals.js`)

Les rivaux et les joueurs simulés voient le sol : au « 3 », s'ils sont sur un sol glissant ou à moins de 9 m (ils
glisseraient dedans en freinant), ils lâchent tout de suite (`slick` : expert, prudents et réguliers toujours, moyen 3
fois sur 4, débutant une fois sur 2, Max le Fonceur une fois sur 3 : il glisse souvent et se fait griller). Pendant un
« 3… » qui dure, ils voient aussi la glace arriver. Après s'être arrêtés exprès, ils ne repartent pas par impatience
pendant ce « 3 ». Rien ne change dans les mondes 1 à 3 (même simulation au chiffre près).

## Pour aller plus loin

Le monde 5 (« La nuit ») est sur la carte, verrouillé (« Bientôt »). Pour l'ouvrir : le même chemin que la montagne
(`levels/worlds.js`, `levels/world5.js`, `index.html`, `tools/simulate.js`), voir `docs/NEXT_PHASES.md`.
