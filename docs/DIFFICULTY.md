# La courbe de difficulté (v2.5.1)

Les 8 nouveautés de la v2.5 (plus de « SO », le coucher du soleil, les transats, la glace qui fond, l'avion menteur,
le reflet dans l'eau, la fausse alerte, le troupeau, le recomptage) sont réparties dans les 3 mondes et la course
infinie pour que la difficulté **monte petit à petit**. Ce fichier dit les objectifs, où chaque piège arrive, ce que
donne la simulation, et ce qui n'est **pas** encore vérifié. Les pièges eux-mêmes sont décrits dans
`docs/TRAPS_DESIGN.md`.

**v2.5.1 — réglée sur un vrai joueur.** Après la v2.5, le joueur a trouvé que la nuit tombait beaucoup trop vite à
partir du niveau 7. Il avait raison : le joueur « moyen » de la simulation lisait le mot en 0,28 s, plus vite qu'un vrai
joueur sur téléphone. Avec un joueur qui lit en 0,36 s, les demi-tours étaient trop courts pour lire à temps (on
s'arrêtait alors à chaque « 3 », par prudence) et la nuit, réglée sur le moyen trop rapide, faisait perdre jusqu'à 3
essais réussis sur 4 (2e chance comprise : elle ne donnait que 10 s). Le moyen est donc recalibré, et tous les niveaux
sont réglés à nouveau pour lui (voir « Ce que j'ai réglé » plus bas).

## Les objectifs (simulation, au moins 300 essais par niveau)

| Joueur simulé | Objectif |
|---|---|
| Expert | au moins 95 % de réussite **partout** (sinon le niveau est injuste) |
| Moyen | environ 85 % au début, 25–35 % au boss du monde 1 ; chaque monde commence un peu plus dur que le début du monde d'avant, mais plus facile que son boss ; 10–20 % au dernier boss |
| Robot prudent | il s'arrête à chaque « 3 » et attend toujours le « ding » : il échoue au moins une fois sur deux à la fin du monde 1, au moins 4 fois sur 5 dans les mondes 2 et 3, et n'a **presque jamais** ★★★ (au plus 2 % : il gagne parfois une course quand tous les rivaux se sont fait griller) |
| La nuit (v2.5.1) | elle fait perdre **au plus 5 %** des essais du moyen : elle punit celui qui s'arrête pour rien, pas le joueur normal |
| Durées | 25 à 40 s par niveau (monde 1 : 25–35 s ; mondes 2 et 3 : 30–42 s) ; boss : 45 s au plus au monde 1, 50 s ensuite |

## Les joueurs simulés

Ils sont dans `js/game/rivals.js` (`PROFILES`) et pilotent le **vrai moteur** (`js/game/match.js`), sans affichage.

| Profil | Réaction | Comment il joue | Sang-froid |
|---|---|---|---|
| Expert | 0,20 s ± 0,03 | Lit le mot : s'arrête sur « SOLEIL ! », court à travers les mots pièges. Repart au « ding ». C'est le joueur parfait : s'il n'y arrive pas, le niveau est injuste. | Craque 1,5 % × la tentation, ×0,1 une fois connue |
| Moyen (v2.5.1 : un vrai joueur au téléphone) | **0,36 s** ± 0,07 pour lire le mot ; 0,29 s pour repartir au « ding » (on l'attend) | S'arrête dès le « 3 » une fois sur trois ; s'arrête sur 30 % des mots pièges ; perd parfois patience pendant un long « 3… » | 15 %, ×0,4 une fois connue |
| Débutant | **0,45 s** ± 0,10 | Attend toujours le mot, réagit lentement | 35 %, ×0,7 une fois connue |
| **Prudent (v2.5)** | 0,22 s ± 0,03 | S'arrête à **chaque** « 3 », ne repart **qu'au** « ding », même après un mot piège | comme l'expert |

Le robot prudent, c'est la stratégie « on a juste à s'arrêter ». Il ne se fait presque jamais griller… mais il est
lent : la nuit tombe, les transats sont pris, la glace fond.

## Où arrive chaque piège

| Monde | Niveau | Nouveauté (une seule par niveau) | Les autres pièges v2.5 du niveau |
|---|---|---|---|
| 1 | 1-1, 1-2 | — (le chant sans « SO », le « ding » dès le monde 1) | — |
| 1 | 1-3 « Avant la nuit » | **le coucher du soleil** | — |
| 1 | 1-4 « Le recomptage » | **le recomptage** (forcé au 2e regard) | nuit |
| 1 | 1-5, 1-6 | — | nuit |
| 1 | 1-7 « La grande course » | **la fausse alerte** (forcée au 2e regard) | nuit |
| 1 | 1-8 boss Soleil Cool | 7e coup : « LE RECOMPTAGE » | nuit, recomptage, fausse alerte |
| 2 | 2-1, 2-2, 2-4 | — | nuit |
| 2 | 2-3 | — | nuit, fausse alerte |
| 2 | 2-5, 2-6 | — | nuit, recomptage (2-6 : et fausse alerte) |
| 2 | 2-7 « La grande course du parc » | **le troupeau** (forcé au 2e regard) | nuit |
| 2 | 2-8 boss Soleil Farceur | — | nuit, recomptage, fausse alerte |
| 3 | 3-1 « Les transats » | **les transats** | nuit, recomptage |
| 3 | 3-2 « La glace qui fond » | **la glace** | nuit, fausse alerte |
| 3 | 3-3 « L'avion menteur » | **l'avion** (« SOLEIL ! » au 1er chant, « ALLEZ-Y ! » au 2e regard) | nuit, recomptage |
| 3 | 3-4 « Le volley de plage » | — | transats, avion, fausse alerte, nuit |
| 3 | 3-5 « Le reflet dans l'eau » | **le reflet** (forcé aux 2 premiers chants) | nuit |
| 3 | 3-6 « Le château de sable » | — | glace, reflet, avion, recomptage, nuit |
| 3 | 3-7 « La grande course de la plage » | — | transats, troupeau, reflet, avion, recomptage, fausse alerte, nuit |
| 3 | 3-8 boss Soleil Vacancier | 6 coups spéciaux | glace, tout le reste |

**Course infinie** : le recomptage dès 50 m, l'avion menteur dès 90 m, le reflet dès 150 m (le nuage, lui, existe dès
80 m). Probabilité par chant : 20 → 30 % pour le recomptage, 22 → 32 % pour l'avion, selon la difficulté. Jamais
pendant un boss : à grande vitesse, environ un cycle sur deux est un boss, d'où des probabilités assez hautes. Le
troupeau, les transats, la glace et la nuit restent dans les niveaux.

## Le résultat (`node tools/simulate.js`, 300 essais par profil et par niveau)

Réussite, en % :

| Niveau | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 (boss) |
|---|---|---|---|---|---|---|---|---|
| **Monde 1 — moyen** | 100 | 100 | 90 | 79 | 72 | 63 | 52 | **32** |
| Monde 1 — expert | 100 | 100 | 100 | 98 | 100 | 100 | 98 | 100 |
| Monde 1 — débutant | 100 | 87 | 17 | 18 | 4 | 3 | 4 | 2 |
| Monde 1 — prudent | 100 | 100 | 0 | 1 | 22 | 14 | 0 | 0 |
| **Monde 2 — moyen** | 73 | 66 | 61 | 58 | 48 | 41 | 35 | **28** |
| Monde 2 — expert | 99 | 98 | 99 | 99 | 99 | 98 | 99 | 98 |
| Monde 2 — prudent | 2 | 2 | 1 | 0 | 16 | 12 | 1 | 0 |
| **Monde 3 — moyen** | 65 | 57 | 51 | 51 | 43 | 35 | 32 | **18** |
| Monde 3 — expert | 100 | 99 | 100 | 99 | 100 | 100 | 100 | 100 |
| Monde 3 — prudent | 0 | 0 | 1 | 5 | 8 | 2 | 3 | 0 |

Ce que ça veut dire :
- **Le monde 1** commence en douceur (100 % au 1-1 et au 1-2), le 1-3 est à 90 % (visé : environ 85 %), le boss à 32 %
  (visé : 25–35 %).
- **Chaque monde commence un peu plus dur** que le début du monde d'avant, mais plus facile que son boss : parc 73 %
  (cour : 100 %, Soleil Cool : 32 %), plage 65 % (parc : 73 et 66 %, Soleil Farceur : 28 %).
- **Le dernier boss** (Soleil Vacancier) : 18 % pour le moyen (visé : 10–20 %).
- Dans un monde, la difficulté monte sans saut de plus de 20 points.
- **L'expert** réussit au moins 98 % partout.
- **La nuit** fait perdre au plus 1 % des essais du moyen (5 % au plus, vérifié dans chaque niveau) : quand le moyen
  perd, c'est qu'il a été grillé.
- **Le robot prudent** finit le 1-1 et le 1-2 (aucune pression), mais échoue dès le 1-3 : la nuit tombe. Dans les
  niveaux avec peu de mots pièges (1-5 le bégaiement, 1-6 le chant express, 2-5, 2-6), attendre coûte moins cher : il
  arrive parfois (12 à 22 %), lentement et sans ★★★. Ailleurs, il échoue presque toujours. « S'arrêter tout le temps »
  ne marche pas.
- **Durées** (moyen, réussites) : 29 à 34 s dans la cour, 35 à 41 s au parc, 34 à 41 s à la plage ; boss 39, 47 et 46 s.

Le tableau complet (durée, position, défaite la plus fréquente, ★★, ★★★) est dans `docs/LEVELS.md`.

## Ce que j'ai réglé, et pourquoi

### v2.5.1 : sur un vrai joueur

1. **Le moyen est recalibré** (`js/game/rivals.js`) : 0,36 s pour lire le mot (au lieu de 0,28 s), 0,29 s pour repartir au
   « ding » (un signal qu'on attend, donc plus rapide), et le débutant à 0,45 s.
2. **Les demi-tours** ont été rallongés niveau par niveau (outil de réglage automatique, mêmes 300 essais à chaque
   fois) jusqu'à retrouver la courbe voulue pour ce moyen : +0,04 à +0,14 s presque partout ; le 1-2 passe à 0,77 s pour
   que le débutant le finisse (87 %).
3. **La nuit** de chaque niveau est mise juste au-dessus du moyen : le temps sous lequel il finit 95 fois sur 100, plus
   environ 2 s. Elle est ensuite raccourcie d'une demi-seconde à la fois, sans jamais descendre sous ce temps + 1,2 s,
   tant que le robot prudent arrive trop souvent (plus de 18 à 25 % des essais, ou des ★★★). Résultat : +2 à +10 s.
4. **Des niveaux un peu plus courts** pour rester sous 42 s (50 s pour le boss) avec un moyen plus lent : 2-5 (150 → 145
   m), 2-7 (140 → 136), 2-8 (160 → 155), 3-7 (160 → 155).
5. **Deux étoiles revues** : le défi du 2-6 devient « Finis en moins de 42 s » (« Arrive 1er » était trop facile : les
   rivaux y craquent tous, même le robot prudent finissait 1er) ; l'objectif du 3-5 passe à 2 départs éclair (sous le
   nuage, on repart un peu plus tard).

| Niveau | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|
| Monde 1 — demi-tour (s) | 0,70–0,76 | 0,77–0,82 | 0,635–0,685 | 0,695–0,745 | 0,61–0,66 | 0,66–0,71 | 0,625–0,675 | 0,62–0,67 |
| Monde 1 — nuit (s) | — | — | 37,5 (33,5) | 41 (38) | 37,5 (33,5) | 38 (34) | 40,5 (35,8) | 49 (39,6) |
| Monde 2 — demi-tour (s) | 0,645–0,695 | 0,65–0,70 | 0,62–0,67 | 0,595–0,645 | 0,62–0,67 | 0,605–0,655 | 0,60–0,65 | 0,63–0,68 |
| Monde 2 — nuit (s) | 41,5 (37) | 41,5 (37,5) | 44 (37) | 47 (41) | 48,5 (44,5) | 49 (44,5) | 49,5 (45,5) | 56,5 (51) |
| Monde 3 — demi-tour (s) | 0,695–0,745 | 0,615–0,665 | 0,595–0,645 | 0,615–0,665 | 0,60–0,65 | 0,59–0,64 | 0,605–0,655 | 0,61–0,66 |
| Monde 3 — nuit (s) | 44 (42) | 41 (35,5) | 43,5 (35,5) | 43,5 (37,5) | 48,5 (42,5) | 51 (42,8) | 50 (44,5) | 58 (48) |

Entre parenthèses : la nuit en v2.5.

**La 2e chance quand la nuit tombe** (🎬) : le soleil remonte et ne se couche plus pendant cet essai (avant : +10 s, et
la nuit retombait aussitôt). Pareil après une 2e chance quand on a été grillé dans un niveau avec la nuit.

### v2.5 : la première répartition

1. **Les demi-tours** (le temps pour lire, réagir et freiner après le mot) ont été rallongés quand le « SO » a disparu :
   sinon même l'expert n'avait plus le temps. Puis réglés niveau par niveau pour la courbe.
2. **La nuit** (`night`) est le grand réglage de la pression. En v2.5, elle était réglée pour que l'expert finisse
   toujours et que le robot prudent n'arrive jamais : trop serré pour un vrai joueur (corrigé en v2.5.1).
3. **Combien chaque faux signal fait craquer** (`TEMPT_K`, `js/game/rivals.js`) : le recomptage était à 1,3 au premier
   réglage, trop dur pour le moyen dès le 1-4 ; il est à 1,0. Fausse alerte 1,0, troupeau 1,2.
4. **L'avion « SOLEIL ! »** faisait à peine ralentir le moyen : `PLANE_STOP_K` est passé de 0,8 à 1,2.
5. **Le troupeau n'arrivait jamais** : les rivaux étaient trop loin derrière. Trois rivaux partent maintenant devant
   (`z0`, en mètres) au 2-7 et au 3-7.
6. **Le monde 2** a été réglé à nouveau (2-6, 2-7, 2-8 : demi-tours, longueur du 2-6) pour garder l'expert au-dessus de
   95 % avec les nouveaux pièges.
7. **La glace** : une boule fond toutes les 4 s ; les objectifs (4 ou 5 boules, défi 5 ou 6) ont été réglés sur ce que
   gardent l'expert et le moyen.

## Vérifier, régler à nouveau

```
node tools/simulate.js                       # les 3 mondes, 300 essais × 4 joueurs, ~70 s ; 148 vérifications
node tools/simulate.js --world 3             # un seul monde
node tools/simulate.js --level w3-6 --n 1000 # un seul niveau, plus précis
node tools/simulate.js --md docs/LEVELS.md   # réécrit le tableau de docs/LEVELS.md
```

La simulation compare aussi le monde 1 à sa référence `REF_W1` (`tools/simulate.js`, réglée en v2.5.1) : si un
changement fait bouger la cour de plus de 3 points, elle le dit.

Dans le navigateur, `test_levels.py` refait l'équité avec le vrai jeu (tests 4, 13 et 23 : l'expert, 100 ou 120
essais par niveau ; le robot prudent, 30 essais par niveau de la plage).

## Ce qui n'est PAS encore vérifié

- **Le ressenti sur un vrai téléphone.** La simulation dit si c'est juste et à quel point c'est dur pour des
  « cerveaux » réglés à la main ; elle ne dit pas si c'est amusant, ni si un vrai enfant lit le reflet ou la banderole
  à temps. À tester en vrai (`docs/TESTS.md`, section v2.5).
- **Le 0,36 s du moyen** est une estimation (lire un mot qui commence comme le vrai, puis lâcher, sur un téléphone).
  Si la nuit tombe encore trop vite pour un vrai joueur, ou si c'est devenu trop facile, c'est le premier chiffre à
  revoir ; tout se règle ensuite niveau par niveau (`night` et `turn` dans `levels/world*.js`).
- **La fréquence des faux signaux en course infinie** : réglée pour qu'ils arrivent (le test 27 les voit), pas encore
  sur de vraies parties.
- **Le reflet sur un petit écran**, en plein soleil : il est plus marqué en qualité basse, mais à regarder sur un vrai
  téléphone.
- **Le son** (avion, cri, galop, calypso du boss) : écouté seulement par les tests (ils vérifient qu'il joue, pas qu'il
  est agréable).
