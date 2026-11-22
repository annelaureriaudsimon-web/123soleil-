# Monde 2 — « Le parc »

La grande nouveauté : **les tentations**. Pendant que le soleil te regarde, il essaie de te faire bouger. Le temps mort du regard devient un test de sang-froid.

Mécaniques de ce monde, et rien d'autre :
- tout le monde 1 (maintenir / lâcher, mots pièges, hésitations, bégaiement, chant express, rivaux) ;
- les tentations ;
- le faux dos ;
- la boue ;
- v2.5 : le coucher du soleil (tous les niveaux), le recomptage et la fausse alerte du monde 1 (ici et là), et
  **le troupeau** (niveau 7). Ils sont décrits dans `docs/TRAPS_DESIGN.md`. Le chant n'a plus de « SO ».

## La règle (toujours vraie)

> **Tant que le soleil est tourné vers toi, NE BOUGE PAS, quoi qu'il arrive.**

Aucune tentation ne la contredit. Pendant tout le regard, le moteur vérifie le joueur et les rivaux à chaque image : bouger = grillé, même si le soleil a les yeux fermés, même s'il s'est à moitié retourné, même si un rival bouge. Rien ne rend le mouvement sûr avant le vrai retour.

## Le signal de la VRAIE fin du regard : « le ding »

Quand le soleil se remet **vraiment** de dos, quatre choses arrivent ensemble, **toujours les mêmes** :
1. **Le son « ding-ding »** : deux notes qui montent. On ne l'entend **que** pour un vrai retour.
2. **Le visage disparaît complètement** : on voit l'arrière de sa tête, avec son épi.
3. **Les rayons font un tour rapide**, puis continuent de tourner doucement.
4. **Un anneau vert** s'élargit autour de lui.

Les fausses fins n'imitent jamais ce signal en entier :

| Fausse fin | Ce qu'elle fait | Ce qu'elle ne fait jamais |
|---|---|---|
| **Faux retour** | Il tourne à moitié, avec un grincement. | Pas de « ding », pas d'anneau, les rayons restent immobiles. Le visage reste à moitié visible. |
| **Faux dos** | Il tourne presque entièrement et dit « HMM… ». | Un gros œil dépasse toujours sur le côté. Pas de « ding », pas d'anneau, les rayons restent immobiles. |

Phrase apprise au joueur : **« Attends le ding ! »**. Elle s'affiche au départ du niveau 1 du parc.

v2.5 : le « ding », l'anneau vert et les « DÉPART ÉCLAIR ! » commencent **dès la cour** (`SIGNAL_WORLD = 1`, `js/modes/levels.js`), parce que le recomptage et la fausse alerte y arrivent. Avant, ils commençaient au parc.

## Les tentations : règles exactes

Les temps sont comptés depuis le début du regard (t = 0 quand le soleil a fini de se retourner). Quand le regard contient une tentation, il est rallongé pour qu'elle ait le temps de se jouer. Au plus `max` tentations par regard (1 ou 2), et jamais deux tentations qui se lisent au même endroit de l'écran.

| Tentation | Déroulé | Regard minimal | Message si on bouge |
|---|---|---|---|
| ⭐ **Étoile tentatrice** | t = 0,1 s : une grosse étoile dorée apparaît 1,6 m devant toi, scintille et tinte. Au vrai retour, elle s'envole : « Pfff… ». | 1,6 s | « L'étoile était un piège ! » |
| 🙃 **Faux retour** | t ≈ 0,5 à 0,8 s : il tourne à moitié (0,22 s, grincement), attend 0,25 s, puis revient d'un coup : « HA ! ». | snap + 0,7 s | « Faux retour ! Attends le ding » |
| 🤧 **Éternuement** | « Aaah… » (0,2 s), « AAAH… » (0,75 s), « ATCHOUM ! » (1,2 s). Il a les yeux fermés de 1,1 à 1,6 s, mais il te fait face. | 2,2 s | « Il était encore tourné vers toi ! » |
| 😜 **Moquerie** | t = 0,25 s : une bulle de texte (« Allez… bouge un peu ! »), un petit son et un dandinement. 12 phrases en FR et EN, tirées sans répétition. Un regard long en a deux. | 1,7 s | « Il voulait juste te faire bouger 😜 » |
| 🪰 **Mouche** | Elle bourdonne autour du coureur, se pose sur sa tête vers 0,9 s. Il tremble de plus en plus, l'écran vibre un peu. Elle s'envole au vrai retour. | 2,0 s | « Une mouche ne t'excuse pas ! » |
| 💥 **Rival qui craque** | t ≈ 0,5 à 0,8 s : le rival en course le plus proche bouge et se fait griller bruyamment (flash, « BOUM », grosse fumée). S'il n'y a aucun rival assez proche, elle n'a pas lieu. | 1,5 s | « Ne sursaute pas ! » |
| 👀 **Faux dos** | À la fin du regard, il tourne presque de dos (sans « ding ») et un gros œil dépasse : « HMM… ». 0,5 à 1,1 s plus tard : « HOP ! », il se retourne en 0,16 s et regarde encore 0,6 à 1,0 s. Si quelqu'un bouge pendant l'œil, il le voit et fait « HOP ! » tout de suite. | — | « Il faisait semblant ! Attends le ding » |

**v2.5 : quatre tentations de plus**, avec les mêmes règles : le recomptage 🔁 (il recompte « 1… 2… » en te regardant), l'avion « ALLEZ-Y ! » ✈️ (plage), la fausse alerte 📣 (un rival crie « VAS-Y ! ») et le troupeau 🐑 (trois rivaux repartent ensemble et sont grillés). Leurs moments, leurs indices et leurs réglages sont dans `docs/TRAPS_DESIGN.md`.

**Résister.** À chaque vrai retour, chaque tentation du regard compte comme résistée :
- popup « SANG-FROID ! » ;
- compteur `resisted` (statistique de l'essai) ;
- **+1 ⭐ bonus** par tentation, versée au casier seulement si on finit le niveau (pas de récolte en mourant).

**Départ éclair.** Repartir moins de 0,35 s après le « ding ». C'est la récompense du joueur attentif, et la tension du monde : aller vite au vrai signal, sans craquer aux faux. Plusieurs objectifs l'utilisent.

**Première rencontre.** La toute première fois qu'on voit chaque tentation (mémorisé dans `soleil.temptSeen`), une indication très courte (2,4 s) s'affiche juste au-dessus du coureur, par exemple « Il veut que tu bouges… NE BOUGE PAS ! ». Elle ne cache ni le soleil ni le chant.

**Les rivaux réagissent.** Chaque rival tire (avec la graine) s'il craque, selon sa personnalité : le Fonceur souvent, le Régulier rarement, le Prudent presque jamais. Celui qui craque se fait griller, et le soleil rigole.

## La boue

Les flaques sont **placées à la main** dans les données du niveau (`mud: [[début, fin], …]` en mètres). Dans une flaque :
- vitesse max ×0,55 ;
- démarrage lent : 9 m/s² au lieu de 30.

Le freinage ne change pas : la boue fait perdre du temps, mais elle ne grille personne. Les rivaux sont ralentis aussi. On la voit : entrée avec un gros « SPLOTCH », éclaboussures marron à chaque pas, petits bruits mouillés.

## Le sang-froid (simulation et rivaux)

À chaque tentation, chaque cerveau (joueur simulé ou rival) tire avec la graine s'il craque :

> probabilité = base du profil × multiplicateur de la tentation × apprentissage (si ce type est déjà connu)

| Profil | Réaction | Base | Apprentissage | 1re fausse fin (×1,2) | Fausse fin déjà connue |
|---|---|---|---|---|---|
| Expert | 0,20 s ± 0,03 | 1,5 % | ×0,1 | 1,8 % | 0,2 % |
| Moyen | 0,28 s ± 0,06 | 15 % | ×0,4 | 18 % | 7 % |
| Débutant | 0,35 s ± 0,10 | 35 % | ×0,7 | 42 % | 29 % |
| Rival Prudent 🐢 | — | 2 % | ×0,5 | 2,4 % | 1,2 % |
| Rival Régulier 🎯 | — | 5 % | ×0,5 | 6 % | 3 % |
| Rival Fonceur ⚡ | — | 35 % | ×0,9 | 42 % | 38 % |

**Multiplicateurs par tentation** (`TEMPT_K`, `js/game/rivals.js`) :

| Tentation | × | Pourquoi |
|---|---|---|
| Faux retour, faux dos | 1,2 | Ce sont les plus trompeuses : elles imitent le début d'un vrai retour. |
| Éternuement | 1 | Les yeux fermés donnent une fausse « excuse ». |
| Rival qui craque | 0,9 | Un BOUM soudain, mais on voit bien que le rival se fait griller. |
| Étoile | 0,8 | Un appât : on a envie, mais rien ne dit que c'est fini. |
| Mouche | 0,3 | De la pression, sans aucun signal de fin. |
| Moquerie | 0,25 | Idem : il parle, il ne se retourne pas. |

**Quand ils craquent** (`CRACK_AT`, plus leur temps de réaction) : tout de suite pour l'étoile, le faux retour et le rival qui craque ; 0,05 s après l'apparition de l'œil du faux dos ; à « ATCHOUM ! » (0,9 s) ; quand la mouche se pose (0,8 s) ; 0,1 s après une moquerie.

**« Déjà connu ».** Un type est connu dès la 2e fois dans l'essai. Dans la simulation, il l'est aussi s'il apparaît dans un niveau précédent du monde (champ `mechanics`, fonction `familiar()` de `tools/simulate.js`) : un joueur qui arrive au niveau 6 a déjà vu l'étoile, le faux retour, la mouche… Dans le jeu, les rivaux redécouvrent les tentations à chaque niveau (c'est leur personnalité qui compte).

**Pourquoi ces choix.**
- **Expert.** La consigne est « environ 2 % ». Je garde 1,8 % à la première fausse fin, mais il apprend vite (×0,1). Avec 2 % à chaque tentation, il perdrait environ 1 essai sur 6 au boss (8 à 10 tentations par essai) : le niveau serait injuste selon notre propre règle (l'expert réussit au moins 95 %). Résultat : l'expert réussit 96 à 100 % des 8 niveaux.
- **Moyen.** 15 %, comme demandé. Il apprend à moitié (×0,4) : il progresse mais reste fragile. C'est lui qui fait la courbe de difficulté du monde 2.
- **Débutant.** 35 %, comme demandé. En pratique, il perd surtout parce qu'il lâche trop tard : 0,35 s de réaction, c'est trop lent pour les demi-tours courts du parc. Il réussit 0 à 8 % du monde 2, comme à la fin du monde 1. C'est attendu : pour entrer dans le parc, il faut déjà 12 étoiles.
- **Rivaux.** Le Fonceur craque souvent (c'est drôle et ça montre la règle), le Prudent presque jamais, le Régulier rarement.

## Les 8 niveaux

Les durées visées sont de 30 à 42 s (v2.5 ; avant : 30 à 40 s), et jusqu'à 50 s pour le boss. Les taux sont ceux du joueur « moyen » en v2.5 (300 essais). Le niveau 1 doit être plus dur que le début de la cour et plus facile que le Soleil Cool (v2.5 ; avant : un peu plus dur que le niveau 4 de la cour). Chaque niveau a maintenant sa nuit (de 37 s au niveau 1 à 51 s au boss).

### 1. L'étoile tentatrice ⭐
- **Idée :** une étoile dorée apparaît devant toi pendant le regard.
- **Apprend :** la règle (il te regarde, ne bouge pas) et le « ding ».
- **Menace (moins de 10 s) :** 1er regard vers 5 s, avec l'étoile, et une bannière pour la première rencontre.
- **★★ :** Fais 2 départs éclair.
- **★★★ :** Arrive 1er.
- **Rivaux :** Hugo ⚡ (il craque sur l'étoile) et Zoé 🐢.
- **Simulation :** moyen 66 %, expert 99 %, robot prudent 0 % (cour : 100 % au niveau 2, Soleil Cool : 31 %).

### 2. Le faux retour 🙃
- **Idée :** il fait semblant de se retourner… « HA ! ».
- **Apprend :** ne pas réagir au mouvement, mais au « ding ».
- **Menace :** faux retour forcé au 1er regard.
- **★★ :** Fais 3 départs éclair.
- **★★★ :** Finis en moins de 36 s.
- **Rivaux :** Max ⚡ et Jade 🎯.
- **Simulation :** moyen 62 %, expert 98 %.

### 3. La mouche et les moqueries 🪰
- **Idée :** pure pression : la mouche se pose sur toi, il te nargue.
- **Apprend :** que rien de tout ça ne compte. Garde ton calme.
- **Menace :** mouche au 1er regard, moquerie au 2e. v2.5 : parfois une fausse alerte.
- **★★ :** Arrive dans le top 2.
- **★★★ :** Fais 3 OUF.
- **Rivaux :** Nino ⚡, Lila 🐢 et Sam 🎯.
- **Simulation :** moyen 55 %, expert 99 %.

### 4. Les flaques de boue 🟤
- **Idée :** cinq flaques posées sur le chemin, et des étoiles tentatrices.
- **Apprend :** dans la boue, on repart lentement. Il faut garder de l'élan et ne pas lâcher trop tôt.
- **Menace :** une flaque dès 12 m, juste avant le 1er « SOLEIL ! ».
- **★★ :** Arrive dans le top 2.
- **★★★ :** Arrive 1er malgré la boue.
- **Rivaux :** Max ⚡, Inès 🎯 et Tom 🐢.
- **Simulation :** moyen 51 %, expert 99 %.

### 5. Le faux dos 👀
- **Idée :** il se met de dos… mais un œil dépasse. « HOP ! ».
- **Apprend :** l'œil n'est pas le « ding ».
- **Menace :** faux dos forcé à la fin du 1er regard. v2.5 : parfois un recomptage.
- **★★ :** Fais 3 départs éclair.
- **★★★ :** Finis en moins de 38 s.
- **Rivaux :** Hugo ⚡ (il se fait avoir), Léo 🐢 et Jade 🎯.
- **Simulation :** moyen 46 %, expert 98 %.

### 6. Le grand jeu du Farceur 🎭
- **Idée :** faux dos et tentations ensemble (étoile + faux retour, éternuement, rival qui craque ; v2.5 : recomptage, fausse alerte).
- **Apprend :** à combiner tout ce qu'on a appris.
- **Menace :** éternuement au 1er regard.
- **★★ :** Fais 2 OUF.
- **★★★ :** Arrive 1er.
- **Rivaux :** Sam 🎯, Nino ⚡ et Zoé 🐢.
- **Simulation :** moyen 50 %, expert 97 %.

### 7. La grande course du parc 🏃
- **Idée :** tout mélangé, avec 5 rivaux. v2.5 : **le troupeau** : trois rivaux repartent ensemble pendant le regard… et sont grillés d'un coup.
- **Apprend :** garder la tête froide dans la foule ; ne pas suivre les autres.
- **Menace :** mot piège et moquerie au 1er cycle, le troupeau forcé au 2e regard (Inès, Max et Jade partent devant, à 10, 16 et 22 m, pour qu'il ait lieu), de la boue dès 30 m.
- **★★ :** Arrive dans le top 3.
- **★★★ :** Arrive 1er.
- **Rivaux :** Inès 🎯, Max ⚡, Jade 🎯, Léo 🐢 et Lila 🐢.
- **Simulation :** moyen 38 %, expert 97 %.

### 8. BOSS — Le Soleil Farceur 🤡
- **Idée :** de longs regards remplis de tentations enchaînées, des faux dos et des faux retours.
- **Mise en scène :**
  1. carte d'intro ;
  2. il se tourne vers toi : « Tu vas rire… ou pleurer ! » ;
  3. des lunettes-nez-moustache tombent sur son visage : « BOING », flash, musique de cirque 8-bit.
  4. Ses coups spéciaux sont annoncés.
  5. Victoire : le nez-moustache s'envole (« Mon nez !! »), feu d'artifice, fanfare, « SOLEIL FARCEUR BATTU ! ».
- **Menace :** dès le cycle 1, « L'éternuement géant ».
- **★★ :** Fais 4 départs éclair.
- **★★★ :** Arrive 1er.
- **Rivaux :** Inès 🎯, Hugo ⚡ et Tom 🐢.
- **Durée :** jusqu'à 50 s.
- **Simulation :** moyen 27 % (visé : 10 à 30 %), expert 97 %, durée moyenne 47 s. v2.5 : recomptages et fausses alertes s'ajoutent à ses farces.

## La carte

- Le monde 2 se débloque avec **12 étoiles du monde 1** (sur 24).
- À la première ouverture de la carte après les avoir gagnées : le cadenas du badge « 2 » saute, avec des confettis, la bannière « MONDE 2 DÉBLOQUÉ ! » et un son. La carte bascule sur le parc.
- La carte du parc : pelouses, étang, fontaine, kiosque, arbres variés, et le chemin des 8 niveaux jusqu'au boss.
- v2.5 : la suite, c'est la plage (12 étoiles du monde 2), voir `docs/WORLD3_DESIGN.md`.
