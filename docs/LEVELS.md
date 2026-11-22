# Résultats de la simulation — Mondes 1 à 3

Commande : `node tools/simulate.js --md docs/LEVELS.md`. Elle est rapide : environ 70 s pour 28 800 essais (3 mondes × 8 niveaux × 4 profils × 300 essais).
Options : `--world 2` (un seul monde), `--level w2-8` (un seul niveau), `--n 1000` (plus d'essais).

La simulation charge **les mêmes fichiers que le navigateur**, sans les recopier :
- `game/match.js` : le moteur d'un niveau ;
- `game/chant.js` : le chant ;
- `game/physics.js` : la physique ;
- `game/rivals.js` : les cerveaux ;
- `levels/*.js` : les données des niveaux.

Le joueur simulé est piloté par un « cerveau », comme les rivaux.

## Les quatre profils

Ils sont définis dans `js/game/rivals.js` (`PROFILES`). Depuis la v2.5, il n'y a plus de « SO » : le chant est
« 1… 2… 3… » puis le mot, et chacun réagit au mot (ou s'arrête dès le « 3 »).

| Profil | Réaction | Comportement | Sang-froid |
|---|---|---|---|
| Expert | 0,20 s ± 0,03 | Lit le mot : s'arrête sur « SOLEIL ! », court à travers les mots pièges. Repart au « ding ». | Craque 1,5 % × la tentation (1,8 % sur une fausse fin), ×0,1 une fois la tentation connue. |
| Moyen | 0,28 s ± 0,06 | S'arrête dès le « 3 » une fois sur trois, sinon il attend le mot. Après un piège, il se méfie : il s'arrête plus souvent dès le « 3 ». Il s'arrête sur 35 % des mots pièges et, une fois sur trois, perd patience pendant un long « 3… » et repart. | Craque 15 % × la tentation, ×0,4 une fois connue. |
| Débutant | 0,35 s ± 0,10 | Attend toujours le mot. S'arrête parfois sur un mot piège (20 %). | Craque 35 % × la tentation, ×0,7 une fois connue. |
| Prudent (v2.5, `patient`) | 0,22 s ± 0,03 | S'arrête à **chaque** « 3 » et ne repart **qu'au** « ding », même après un mot piège. C'est la stratégie « on a juste à s'arrêter » : la nuit, les transats et la glace doivent la faire échouer. | Comme l'expert. |

Les tentations existent dès le monde 1 depuis la v2.5 (le recomptage au 1-4, la fausse alerte au 1-7). Les multiplicateurs par tentation, le moment où l'on craque et la raison de ces choix sont dans `docs/WORLD2_DESIGN.md` (« Le sang-froid ») et, pour les pièges de la v2.5, dans `docs/TRAPS_DESIGN.md`. Tous les profils attendent le vrai retour (le « ding ») pour repartir : le faux retour, le faux dos et les faux signaux ne les font repartir que s'ils craquent.

Ce qui grille un joueur : être encore en mouvement quand le soleil a fini de se retourner. À 8 m/s, il faut 0,2 s pour s'arrêter. Celui qui attend « SOLEIL ! » doit donc réagir en moins de « demi-tour − 0,2 s ».

## v2.5 : ce que j'ai ajusté

Les pièges de la v2.5 ont été répartis dans les 3 mondes ; les objectifs, la répartition et les raisons sont dans
`docs/DIFFICULTY.md`. Les réglages qui en sortent :

| Niveau | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|
| Monde 1 — demi-tour (s) | 0,70–0,76 | 0,70–0,75 | 0,655–0,705 | 0,605–0,655 | 0,57–0,62 | 0,59–0,64 | 0,55–0,60 | 0,56–0,61 |
| Monde 1 — nuit (s) | — | — | 33,5 | 38 | 33,5 | 34 | 35,8 | 39,6 |
| Monde 2 — demi-tour (s) | 0,60–0,65 | 0,60–0,65 | 0,57–0,62 | 0,55–0,60 | 0,57–0,62 | 0,545–0,595 | 0,545–0,595 | 0,555–0,605 |
| Monde 2 — nuit (s) | 37 | 37,5 | 37 | 41 | 44,5 | 44,5 | 45,5 | 51 |
| Monde 3 — demi-tour (s) | 0,56–0,61 | 0,56–0,61 | 0,55–0,60 | 0,55–0,60 | 0,55–0,60 | 0,55–0,60 | 0,53–0,58 | 0,54–0,59 |
| Monde 3 — nuit (s) | 42 | 35,5 | 35,5 | 37,5 | 42,5 | 42,8 | 44,5 | 48 |

Les demi-tours sont plus longs qu'avant : sans « SO », il faut lire le mot avant de freiner. La nuit est le grand
réglage de la pression : l'expert doit toujours arriver, le robot prudent jamais (sauf au 1-1 et au 1-2, sans nuit).

Les deux sections suivantes racontent les réglages des phases 1 et 2 (**avant la v2.5** : on lâchait encore dès
« SO »). Leurs chiffres sont gardés pour l'histoire ; les chiffres d'aujourd'hui sont dans le tableau final.

## Monde 1 : ce que j'ai ajusté (phase 1)

1. **Durées.** Au premier réglage, les niveaux duraient 15 à 22 s : trop courts. Je les ai allongés à 135–150 m, et le boss à 180 m. Le joueur moyen met maintenant 27 à 31 s, et 38 s pour le boss. L'expert y met 44 s, parce qu'il s'arrête à chaque « SO ».
2. **Débutant au niveau 1.** Il réussissait 97 %, puis 89 % avec les niveaux plus longs. J'ai raccourci le demi-tour de 0,68–0,74 s à 0,60–0,66 s, en gardant 1 s pour le tout premier regard. Il réussit maintenant environ 63 % : il peut rater. **v2.2 (étape Poki 1)** : le niveau 1 devient un départ en douceur. Vu en train de bouger, le joueur n'est plus grillé : « OUPS ! », il recule de 6 m et doit lâcher pour repartir. Le débutant le finit 100 % du temps (27 s en moyenne, 0,4 « OUPS ! » par essai). Les 15 autres niveaux n'ont pas bougé d'un chiffre.
3. **Boss.** Le moyen le réussissait à 81 %. J'ai durci les demi-tours (0,51–0,56 s), et le moyen est tombé à environ 30 %, dans l'objectif 15–35 %.
4. **Progression.** Elle était plate de 1 à 5, puis chutait de 48 points du niveau 7 au boss. J'ai réglé le demi-tour niveau par niveau. Pour le moyen, il n'y a plus de saut de plus de 20 points entre deux niveaux (le plus gros est d'environ 17 points).

   | Niveau | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
   |---|---|---|---|---|---|---|---|---|
   | Demi-tour (s) | 0,60–0,66 | 0,60–0,65 | 0,555–0,605 | 0,535–0,585 | 0,51–0,56 | 0,54–0,59 (×0,9 en express) | 0,50–0,55 | 0,51–0,56 |

5. **Max (niveau 4).** Il était trop régulier : le moyen ne le battait que 19 % du temps. Je l'ai rendu plus gourmand : il lâche 0,12 s après « SOLEIL ! » au lieu de 0,06 s. Il se fait griller plus souvent, et le moyen le bat maintenant à peu près une fois sur deux (environ 55 à 58 %).
6. **Rivaux.** Je les ai écartés (couloirs à ±1 m, ±1,7 m et ±2,4 m) pour qu'ils ne cachent jamais le joueur au départ.

## Monde 2 : ce que j'ai ajusté (phase 2)

1. **Le sang-froid.** Au premier réglage, chaque tentation faisait craquer l'expert 2 % du temps, sans apprentissage. Il ne réussissait que 86 à 91 % des niveaux 6 à 8, sous notre règle (au moins 95 %). J'ai ajouté l'apprentissage (une tentation déjà vue fait moins craquer) et la familiarité entre niveaux (un joueur qui arrive au niveau 6 a déjà vu l'étoile, le faux retour, la mouche…). L'expert réussit maintenant 96 à 100 % de chaque niveau. Le moyen et le débutant gardent exactement les taux demandés (15 % et 35 %).
2. **Durées.** Les tentations rallongent les regards (jusqu'à 2,2 s pour l'éternuement). Avec des niveaux aussi longs que dans le monde 1, le moyen dépassait 40 s. J'ai réglé les longueurs entre 135 et 160 m : le moyen met 32,6 à 39,4 s, et 46 s au boss (maximum 50 s).
3. **Niveau 1 du parc.** Il devait être un peu plus dur que le niveau 4 de la cour (88 % pour le moyen). Avec une étoile forcée au 1er regard et des demi-tours de 0,55–0,60 s, le moyen réussit 76 %.
4. **Progression.** J'ai réglé le demi-tour et la fréquence des tentations niveau par niveau. Pour le moyen : 76 → 73 → 71 → 69 → 58 → 50 → 41 → 24 %. Il n'y a jamais de niveau plus facile que le précédent, et le plus gros saut est d'environ 17 points (du niveau 7 au boss).

   | Niveau | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
   |---|---|---|---|---|---|---|---|---|
   | Longueur (m) | 150 | 150 | 150 | 135 | 150 | 160 | 140 | 160 |
   | Demi-tour (s) | 0,55–0,60 | 0,55–0,60 | 0,52–0,57 | 0,50–0,55 | 0,52–0,57 | 0,53–0,58 | 0,50–0,55 | 0,51–0,56 |
   | Nouveauté | étoile | faux retour | mouche, moqueries | boue | faux dos | tout ensemble | 5 rivaux | boss |

5. **Boss.** Regards plus longs (1,5 à 2,2 s) et 6 farces scénarisées. Le moyen le réussit 24 % (visé : 10 à 30 %).
6. **Le monde 1 ne bouge pas.** Les nouveaux tirages du soleil (tentations, faux dos) viennent d'une deuxième suite de dés, à part. Les cerveaux ne tirent de nouveaux dés que sur les nouveaux événements, qui n'existent pas dans la cour. Résultat : le monde 1 donne **exactement** les mêmes chiffres qu'à la fin de la phase 1 (vérifié par la simulation : écart maximal 0 point).

## Tableau final

« Durée » est la durée moyenne des essais réussis. « Position » est la place moyenne à l'arrivée (réussites). ★★ et ★★★ sont la part des essais qui gagnent l'objectif ou le défi.

<!-- tableau:debut -->
_Généré par `node tools/simulate.js --md docs/LEVELS.md` (300 essais par profil et par niveau)._

### Monde 1 — La cour de récré

| Niveau | Profil | Réussite | Durée moyenne (réussites) | Position moyenne | Défaite la plus fréquente | ★★ | ★★★ |
|---|---|---|---|---|---|---|---|
| 1. Premiers pas | Expert | 100 % | 27,3 s | 1,00 / 3 | — | 100 % | 100 % |
| 1. Premiers pas | Moyen | 100 % | 29,9 s | 1,00 / 3 | — | 100 % | 50 % |
| 1. Premiers pas | Débutant | 100 % | 29,1 s | 1,00 / 3 | — | 100 % | 87 % |
| 1. Premiers pas | Prudent | 100 % | 36,5 s | 1,01 / 3 | — | 100 % | 0 % |
| 2. Les hésitations | Expert | 100 % | 25,2 s | 1,94 / 3 | — | 100 % | 100 % |
| 2. Les hésitations | Moyen | 100 % | 28,8 s | 1,97 / 3 | — | 100 % | 68 % |
| 2. Les hésitations | Débutant | 91 % | 26,3 s | 1,95 / 3 | lâché trop tard (100 %) | 91 % | 91 % |
| 2. Les hésitations | Prudent | 100 % | 48,6 s | 2,35 / 3 | — | 64 % | 0 % |
| 3. Avant la nuit | Expert | 100 % | 27,3 s | 1,00 / 4 | — | 99 % | 100 % |
| 3. Avant la nuit | Moyen | 86 % | 30,7 s | 1,30 / 4 | la nuit est tombée (98 %) | 57 % | 3 % |
| 3. Avant la nuit | Débutant | 75 % | 29,2 s | 1,11 / 4 | lâché trop tard (99 %) | 70 % | 34 % |
| 3. Avant la nuit | Prudent | 0 % | — | — | la nuit est tombée (100 %) | 0 % | 0 % |
| 4. Le recomptage | Expert | 98 % | 30,8 s | 1,21 / 3 | craqué : recomptage (100 %) | 77 % | 95 % |
| 4. Le recomptage | Moyen | 77 % | 33,7 s | 1,29 / 3 | craqué : recomptage (81 %) | 55 % | 42 % |
| 4. Le recomptage | Débutant | 19 % | 32,3 s | 1,24 / 3 | lâché trop tard (52 %) | 15 % | 15 % |
| 4. Le recomptage | Prudent | 0 % | — | — | la nuit est tombée (93 %) | 0 % | 0 % |
| 5. Le bégaiement | Expert | 100 % | 30,1 s | 1,32 / 4 | — | 100 % | 7 % |
| 5. Le bégaiement | Moyen | 81 % | 32,0 s | 1,53 / 4 | la nuit est tombée (79 %) | 76 % | 66 % |
| 5. Le bégaiement | Débutant | 17 % | 32,0 s | 1,75 / 4 | lâché trop tard (91 %) | 14 % | 17 % |
| 5. Le bégaiement | Prudent | 1 % | 32,9 s | 3,00 / 4 | la nuit est tombée (100 %) | 0 % | 0 % |
| 6. Le chant express | Expert | 100 % | 29,9 s | 1,24 / 4 | la nuit est tombée (100 %) | 74 % | 76 % |
| 6. Le chant express | Moyen | 63 % | 32,0 s | 1,61 / 4 | lâché trop tard (58 %) | 61 % | 30 % |
| 6. Le chant express | Débutant | 6 % | 31,2 s | 1,68 / 4 | lâché trop tard (95 %) | 6 % | 3 % |
| 6. Le chant express | Prudent | 0 % | — | — | la nuit est tombée (100 %) | 0 % | 0 % |
| 7. La grande course | Expert | 99 % | 30,4 s | 1,13 / 6 | craqué : fausse alerte (100 %) | 99 % | 86 % |
| 7. La grande course | Moyen | 50 % | 32,9 s | 1,69 / 6 | lâché trop tard (41 %) | 49 % | 25 % |
| 7. La grande course | Débutant | 6 % | 31,0 s | 1,41 / 6 | lâché trop tard (77 %) | 6 % | 3 % |
| 7. La grande course | Prudent | 0 % | — | — | la nuit est tombée (92 %) | 0 % | 0 % |
| 8. Le Soleil Cool | Expert | 100 % | 34,8 s | 1,15 / 4 | la nuit est tombée (100 %) | 55 % | 85 % |
| 8. Le Soleil Cool | Moyen | 31 % | 37,1 s | 1,38 / 4 | lâché trop tard (46 %) | 31 % | 21 % |
| 8. Le Soleil Cool | Débutant | 3 % | 36,3 s | 1,80 / 4 | lâché trop tard (85 %) | 3 % | 1 % |
| 8. Le Soleil Cool | Prudent | 0 % | — | — | la nuit est tombée (87 %) | 0 % | 0 % |

### Monde 2 — Le parc

| Niveau | Profil | Réussite | Durée moyenne (réussites) | Position moyenne | Défaite la plus fréquente | ★★ | ★★★ |
|---|---|---|---|---|---|---|---|
| 1. L’étoile tentatrice | Expert | 99 % | 32,1 s | 1,24 / 3 | craqué : étoile (100 %) | 99 % | 75 % |
| 1. L’étoile tentatrice | Moyen | 66 % | 34,5 s | 1,32 / 3 | craqué : étoile (65 %) | 66 % | 45 % |
| 1. L’étoile tentatrice | Débutant | 13 % | 34,1 s | 1,21 / 3 | craqué : étoile (49 %) | 4 % | 10 % |
| 1. L’étoile tentatrice | Prudent | 0 % | — | — | la nuit est tombée (77 %) | 0 % | 0 % |
| 2. Le faux retour | Expert | 98 % | 32,3 s | 1,16 / 3 | craqué : faux retour (100 %) | 98 % | 98 % |
| 2. Le faux retour | Moyen | 62 % | 34,8 s | 1,46 / 3 | craqué : faux retour (57 %) | 62 % | 51 % |
| 2. Le faux retour | Débutant | 11 % | 33,5 s | 1,18 / 3 | lâché trop tard (49 %) | 1 % | 11 % |
| 2. Le faux retour | Prudent | 0 % | — | — | la nuit est tombée (80 %) | 0 % | 0 % |
| 3. La mouche et les moqueries | Expert | 99 % | 32,5 s | 1,25 / 4 | craqué : moquerie (75 %) | 99 % | 1 % |
| 3. La mouche et les moqueries | Moyen | 55 % | 34,5 s | 1,45 / 4 | la nuit est tombée (43 %) | 52 % | 47 % |
| 3. La mouche et les moqueries | Débutant | 11 % | 33,9 s | 1,47 / 4 | lâché trop tard (76 %) | 11 % | 11 % |
| 3. La mouche et les moqueries | Prudent | 0 % | — | — | la nuit est tombée (79 %) | 0 % | 0 % |
| 4. Les flaques de boue | Expert | 99 % | 36,6 s | 1,21 / 4 | craqué : étoile (100 %) | 99 % | 78 % |
| 4. Les flaques de boue | Moyen | 51 % | 39,3 s | 1,43 / 4 | craqué : étoile (44 %) | 48 % | 32 % |
| 4. Les flaques de boue | Débutant | 10 % | 38,2 s | 1,47 / 4 | lâché trop tard (64 %) | 10 % | 6 % |
| 4. Les flaques de boue | Prudent | 0 % | — | — | la nuit est tombée (82 %) | 0 % | 0 % |
| 5. Le faux dos | Expert | 98 % | 37,7 s | 1,07 / 4 | faux dos (HOP !) (40 %) | 98 % | 54 % |
| 5. Le faux dos | Moyen | 46 % | 40,6 s | 1,35 / 4 | faux dos (HOP !) (58 %) | 46 % | 5 % |
| 5. Le faux dos | Débutant | 3 % | 38,1 s | 1,10 / 4 | lâché trop tard (51 %) | 1 % | 1 % |
| 5. Le faux dos | Prudent | 0 % | 40,4 s | 2,00 / 4 | la nuit est tombée (89 %) | 0 % | 0 % |
| 6. Le grand jeu du Farceur | Expert | 97 % | 37,7 s | 1,02 / 4 | craqué : éternuement (33 %) | 68 % | 95 % |
| 6. Le grand jeu du Farceur | Moyen | 50 % | 40,3 s | 1,13 / 4 | craqué : éternuement (33 %) | 50 % | 43 % |
| 6. Le grand jeu du Farceur | Débutant | 0 % | 34,9 s | 1,00 / 4 | lâché trop tard (53 %) | 0 % | 0 % |
| 6. Le grand jeu du Farceur | Prudent | 0 % | — | — | la nuit est tombée (78 %) | 0 % | 0 % |
| 7. La grande course du parc | Expert | 97 % | 37,5 s | 1,26 / 6 | craqué : étoile (22 %) | 97 % | 74 % |
| 7. La grande course du parc | Moyen | 38 % | 40,4 s | 1,46 / 6 | lâché trop tard (30 %) | 38 % | 25 % |
| 7. La grande course du parc | Débutant | 3 % | 37,0 s | 1,30 / 6 | lâché trop tard (61 %) | 3 % | 2 % |
| 7. La grande course du parc | Prudent | 0 % | — | — | la nuit est tombée (74 %) | 0 % | 0 % |
| 8. Le Soleil Farceur | Expert | 97 % | 43,6 s | 1,00 / 4 | la nuit est tombée (40 %) | 97 % | 97 % |
| 8. Le Soleil Farceur | Moyen | 27 % | 46,8 s | 1,09 / 4 | lâché trop tard (35 %) | 26 % | 24 % |
| 8. Le Soleil Farceur | Débutant | 0 % | — | — | lâché trop tard (54 %) | 0 % | 0 % |
| 8. Le Soleil Farceur | Prudent | 0 % | — | — | la nuit est tombée (71 %) | 0 % | 0 % |

### Monde 3 — La plage

| Niveau | Profil | Réussite | Durée moyenne (réussites) | Position moyenne | Défaite la plus fréquente | ★★ | ★★★ |
|---|---|---|---|---|---|---|---|
| 1. Les transats | Expert | 100 % | 32,1 s | 1,51 / 4 | — | 95 % | 81 % |
| 1. Les transats | Moyen | 59 % | 35,3 s | 2,23 / 4 | plus de transat (21 %) | 34 % | 22 % |
| 1. Les transats | Débutant | 5 % | 33,0 s | 2,00 / 4 | lâché trop tard (62 %) | 4 % | 3 % |
| 1. Les transats | Prudent | 0 % | — | — | plus de transat (54 %) | 0 % | 0 % |
| 2. La glace qui fond | Expert | 99 % | 30,2 s | 1,14 / 4 | craqué : faux retour (67 %) | 99 % | 91 % |
| 2. La glace qui fond | Moyen | 57 % | 32,9 s | 1,38 / 4 | la nuit est tombée (32 %) | 57 % | 16 % |
| 2. La glace qui fond | Débutant | 11 % | 31,6 s | 1,29 / 4 | lâché trop tard (70 %) | 11 % | 6 % |
| 2. La glace qui fond | Prudent | 0 % | — | — | la nuit est tombée (80 %) | 0 % | 0 % |
| 3. L’avion menteur | Expert | 99 % | 30,8 s | 1,14 / 4 | la nuit est tombée (50 %) | 99 % | 99 % |
| 3. L’avion menteur | Moyen | 49 % | 33,1 s | 1,43 / 4 | la nuit est tombée (58 %) | 47 % | 49 % |
| 3. L’avion menteur | Débutant | 11 % | 32,6 s | 1,41 / 4 | lâché trop tard (82 %) | 11 % | 11 % |
| 3. L’avion menteur | Prudent | 0 % | — | — | la nuit est tombée (87 %) | 0 % | 0 % |
| 4. Le volley de plage | Expert | 99 % | 33,2 s | 1,14 / 5 | craqué : avion « ALLEZ-Y ! » (67 %) | 99 % | 85 % |
| 4. Le volley de plage | Moyen | 44 % | 35,6 s | 2,18 / 5 | la nuit est tombée (33 %) | 41 % | 9 % |
| 4. Le volley de plage | Débutant | 6 % | 34,8 s | 2,00 / 5 | lâché trop tard (74 %) | 6 % | 1 % |
| 4. Le volley de plage | Prudent | 0 % | — | — | la nuit est tombée (74 %) | 0 % | 0 % |
| 5. Le reflet dans l’eau | Expert | 97 % | 37,1 s | 1,01 / 4 | la nuit est tombée (78 %) | 97 % | 46 % |
| 5. Le reflet dans l’eau | Moyen | 41 % | 39,1 s | 1,02 / 4 | faux dos (HOP !) (38 %) | 23 % | 6 % |
| 5. Le reflet dans l’eau | Débutant | 1 % | 38,1 s | 1,00 / 4 | lâché trop tard (57 %) | 0 % | 1 % |
| 5. Le reflet dans l’eau | Prudent | 0 % | — | — | la nuit est tombée (90 %) | 0 % | 0 % |
| 6. Le château de sable | Expert | 99 % | 36,2 s | 1,09 / 4 | la nuit est tombée (100 %) | 88 % | 49 % |
| 6. Le château de sable | Moyen | 45 % | 38,8 s | 1,40 / 4 | craqué : recomptage (26 %) | 30 % | 6 % |
| 6. Le château de sable | Débutant | 4 % | 36,0 s | 1,36 / 4 | lâché trop tard (62 %) | 3 % | 2 % |
| 6. Le château de sable | Prudent | 0 % | — | — | la nuit est tombée (84 %) | 0 % | 0 % |
| 7. La grande course de la plage | Expert | 98 % | 37,6 s | 1,42 / 6 | la nuit est tombée (67 %) | 98 % | 60 % |
| 7. La grande course de la plage | Moyen | 34 % | 40,4 s | 1,89 / 6 | lâché trop tard (53 %) | 34 % | 12 % |
| 7. La grande course de la plage | Débutant | 0 % | 40,3 s | 2,00 / 6 | lâché trop tard (76 %) | 0 % | 0 % |
| 7. La grande course de la plage | Prudent | 0 % | — | — | la nuit est tombée (82 %) | 0 % | 0 % |
| 8. Le Soleil Vacancier | Expert | 97 % | 41,4 s | 1,01 / 4 | la nuit est tombée (89 %) | 97 % | 96 % |
| 8. Le Soleil Vacancier | Moyen | 17 % | 43,8 s | 1,19 / 4 | lâché trop tard (42 %) | 17 % | 14 % |
| 8. Le Soleil Vacancier | Débutant | 0 % | 38,9 s | 1,00 / 4 | lâché trop tard (61 %) | 0 % | 0 % |
| 8. Le Soleil Vacancier | Prudent | 0 % | — | — | la nuit est tombée (77 %) | 0 % | 0 % |

Objectifs vérifiés :

- ✅ niveau 1-1 : l'expert réussit au moins 95 % (100 %)
- ✅ niveau 1-2 : l'expert réussit au moins 95 % (100 %)
- ✅ niveau 1-3 : l'expert réussit au moins 95 % (100 %)
- ✅ niveau 1-4 : l'expert réussit au moins 95 % (98 %)
- ✅ niveau 1-5 : l'expert réussit au moins 95 % (100 %)
- ✅ niveau 1-6 : l'expert réussit au moins 95 % (100 %)
- ✅ niveau 1-7 : l'expert réussit au moins 95 % (99 %)
- ✅ niveau 1-8 : l'expert réussit au moins 95 % (100 %)
- ✅ niveau 2-1 : l'expert réussit au moins 95 % (99 %)
- ✅ niveau 2-2 : l'expert réussit au moins 95 % (98 %)
- ✅ niveau 2-3 : l'expert réussit au moins 95 % (99 %)
- ✅ niveau 2-4 : l'expert réussit au moins 95 % (99 %)
- ✅ niveau 2-5 : l'expert réussit au moins 95 % (98 %)
- ✅ niveau 2-6 : l'expert réussit au moins 95 % (97 %)
- ✅ niveau 2-7 : l'expert réussit au moins 95 % (97 %)
- ✅ niveau 2-8 : l'expert réussit au moins 95 % (97 %)
- ✅ niveau 3-1 : l'expert réussit au moins 95 % (100 %)
- ✅ niveau 3-2 : l'expert réussit au moins 95 % (99 %)
- ✅ niveau 3-3 : l'expert réussit au moins 95 % (99 %)
- ✅ niveau 3-4 : l'expert réussit au moins 95 % (99 %)
- ✅ niveau 3-5 : l'expert réussit au moins 95 % (97 %)
- ✅ niveau 3-6 : l'expert réussit au moins 95 % (99 %)
- ✅ niveau 3-7 : l'expert réussit au moins 95 % (98 %)
- ✅ niveau 3-8 : l'expert réussit au moins 95 % (97 %)
- ✅ niveau 1-1 : menace dans les 10 premières secondes (1er SOLEIL ≤ 3.5 s)
- ✅ niveau 1-2 : menace dans les 10 premières secondes (1er SOLEIL ≤ 6.2 s)
- ✅ niveau 1-3 : menace dans les 10 premières secondes (1er SOLEIL ≤ 5.9 s)
- ✅ niveau 1-4 : menace dans les 10 premières secondes (1er SOLEIL ≤ 5.8 s)
- ✅ niveau 1-5 : menace dans les 10 premières secondes (1er SOLEIL ≤ 4.4 s)
- ✅ niveau 1-6 : menace dans les 10 premières secondes (1er SOLEIL ≤ 3.2 s)
- ✅ niveau 1-7 : menace dans les 10 premières secondes (1er SOLEIL ≤ 7.1 s)
- ✅ niveau 1-8 : menace dans les 10 premières secondes (1er SOLEIL ≤ 5.1 s)
- ✅ niveau 2-1 : menace dans les 10 premières secondes (1er SOLEIL ≤ 4.5 s)
- ✅ niveau 2-2 : menace dans les 10 premières secondes (1er SOLEIL ≤ 4.5 s)
- ✅ niveau 2-3 : menace dans les 10 premières secondes (1er SOLEIL ≤ 5.8 s)
- ✅ niveau 2-4 : menace dans les 10 premières secondes (1er SOLEIL ≤ 4.5 s)
- ✅ niveau 2-5 : menace dans les 10 premières secondes (1er SOLEIL ≤ 4.5 s)
- ✅ niveau 2-6 : menace dans les 10 premières secondes (1er SOLEIL ≤ 4.4 s)
- ✅ niveau 2-7 : menace dans les 10 premières secondes (1er SOLEIL ≤ 5.7 s)
- ✅ niveau 2-8 : menace dans les 10 premières secondes (1er SOLEIL ≤ 5.4 s)
- ✅ niveau 3-1 : menace dans les 10 premières secondes (1er SOLEIL ≤ 5.8 s)
- ✅ niveau 3-2 : menace dans les 10 premières secondes (1er SOLEIL ≤ 6.8 s)
- ✅ niveau 3-3 : menace dans les 10 premières secondes (1er SOLEIL ≤ 5.7 s)
- ✅ niveau 3-4 : menace dans les 10 premières secondes (1er SOLEIL ≤ 4.5 s)
- ✅ niveau 3-5 : menace dans les 10 premières secondes (1er SOLEIL ≤ 4.4 s)
- ✅ niveau 3-6 : menace dans les 10 premières secondes (1er SOLEIL ≤ 7.1 s)
- ✅ niveau 3-7 : menace dans les 10 premières secondes (1er SOLEIL ≤ 6.6 s)
- ✅ niveau 3-8 : menace dans les 10 premières secondes (1er SOLEIL ≤ 6.4 s)
- ✅ niveau 1-1 : durée (moyen) entre 25 et 35 s (29,9 s)
- ✅ niveau 1-2 : durée (moyen) entre 25 et 35 s (28,8 s)
- ✅ niveau 1-3 : durée (moyen) entre 25 et 35 s (30,7 s)
- ✅ niveau 1-4 : durée (moyen) entre 25 et 35 s (33,7 s)
- ✅ niveau 1-5 : durée (moyen) entre 25 et 35 s (32,0 s)
- ✅ niveau 1-6 : durée (moyen) entre 25 et 35 s (32,0 s)
- ✅ niveau 1-7 : durée (moyen) entre 25 et 35 s (32,9 s)
- ✅ niveau 1-8 : durée (moyen) ≤ 45 s (37,1 s)
- ✅ niveau 2-1 : durée (moyen) entre 30 et 42 s (34,5 s)
- ✅ niveau 2-2 : durée (moyen) entre 30 et 42 s (34,8 s)
- ✅ niveau 2-3 : durée (moyen) entre 30 et 42 s (34,5 s)
- ✅ niveau 2-4 : durée (moyen) entre 30 et 42 s (39,3 s)
- ✅ niveau 2-5 : durée (moyen) entre 30 et 42 s (40,6 s)
- ✅ niveau 2-6 : durée (moyen) entre 30 et 42 s (40,3 s)
- ✅ niveau 2-7 : durée (moyen) entre 30 et 42 s (40,4 s)
- ✅ niveau 2-8 : durée (moyen) ≤ 50 s (46,8 s)
- ✅ niveau 3-1 : durée (moyen) entre 30 et 42 s (35,3 s)
- ✅ niveau 3-2 : durée (moyen) entre 30 et 42 s (32,9 s)
- ✅ niveau 3-3 : durée (moyen) entre 30 et 42 s (33,1 s)
- ✅ niveau 3-4 : durée (moyen) entre 30 et 42 s (35,6 s)
- ✅ niveau 3-5 : durée (moyen) entre 30 et 42 s (39,1 s)
- ✅ niveau 3-6 : durée (moyen) entre 30 et 42 s (38,8 s)
- ✅ niveau 3-7 : durée (moyen) entre 30 et 42 s (40,4 s)
- ✅ niveau 3-8 : durée (moyen) ≤ 50 s (43,8 s)
- ✅ monde 1 : le moyen réussit le boss 15 à 35 % (31 %)
- ✅ monde 1 : la difficulté monte régulièrement (moyen : jamais plus de 20 points d’écart, jamais plus facile) (plus gros saut 19 points)
- ✅ monde 2 : le moyen réussit le boss 10 à 30 % (27 %)
- ✅ monde 2 : la difficulté monte régulièrement (moyen : jamais plus de 20 points d’écart, jamais plus facile) (plus gros saut 12 points)
- ✅ monde 3 : le moyen réussit le boss 10 à 20 % (17 %)
- ✅ monde 3 : la difficulté monte régulièrement (moyen : jamais plus de 20 points d’écart, jamais plus facile) (plus gros saut 17 points)
- ✅ niveau 1-1 : le robot prudent n'a jamais ★★★ (0 %)
- ✅ niveau 1-2 : le robot prudent n'a jamais ★★★ (0 %)
- ✅ niveau 1-3 : le robot prudent n'a jamais ★★★ (0 %)
- ✅ niveau 1-4 : le robot prudent n'a jamais ★★★ (0 %)
- ✅ niveau 1-5 : le robot prudent n'a jamais ★★★ (0 %)
- ✅ niveau 1-6 : le robot prudent n'a jamais ★★★ (0 %)
- ✅ niveau 1-7 : le robot prudent n'a jamais ★★★ (0 %)
- ✅ niveau 1-8 : le robot prudent n'a jamais ★★★ (0 %)
- ✅ niveau 2-1 : le robot prudent n'a jamais ★★★ (0 %)
- ✅ niveau 2-2 : le robot prudent n'a jamais ★★★ (0 %)
- ✅ niveau 2-3 : le robot prudent n'a jamais ★★★ (0 %)
- ✅ niveau 2-4 : le robot prudent n'a jamais ★★★ (0 %)
- ✅ niveau 2-5 : le robot prudent n'a jamais ★★★ (0 %)
- ✅ niveau 2-6 : le robot prudent n'a jamais ★★★ (0 %)
- ✅ niveau 2-7 : le robot prudent n'a jamais ★★★ (0 %)
- ✅ niveau 2-8 : le robot prudent n'a jamais ★★★ (0 %)
- ✅ niveau 3-1 : le robot prudent n'a jamais ★★★ (0 %)
- ✅ niveau 3-2 : le robot prudent n'a jamais ★★★ (0 %)
- ✅ niveau 3-3 : le robot prudent n'a jamais ★★★ (0 %)
- ✅ niveau 3-4 : le robot prudent n'a jamais ★★★ (0 %)
- ✅ niveau 3-5 : le robot prudent n'a jamais ★★★ (0 %)
- ✅ niveau 3-6 : le robot prudent n'a jamais ★★★ (0 %)
- ✅ niveau 3-7 : le robot prudent n'a jamais ★★★ (0 %)
- ✅ niveau 3-8 : le robot prudent n'a jamais ★★★ (0 %)
- ✅ niveau 1-7 : le robot prudent échoue au moins une fois sur deux (0 %)
- ✅ niveau 1-8 : le robot prudent échoue au moins une fois sur deux (0 %)
- ✅ niveau 2-1 : le robot prudent échoue au moins 4 fois sur 5 (0 %)
- ✅ niveau 2-2 : le robot prudent échoue au moins 4 fois sur 5 (0 %)
- ✅ niveau 2-3 : le robot prudent échoue au moins 4 fois sur 5 (0 %)
- ✅ niveau 2-4 : le robot prudent échoue au moins 4 fois sur 5 (0 %)
- ✅ niveau 2-5 : le robot prudent échoue au moins 4 fois sur 5 (0 %)
- ✅ niveau 2-6 : le robot prudent échoue au moins 4 fois sur 5 (0 %)
- ✅ niveau 2-7 : le robot prudent échoue au moins 4 fois sur 5 (0 %)
- ✅ niveau 2-8 : le robot prudent échoue au moins 4 fois sur 5 (0 %)
- ✅ niveau 3-1 : le robot prudent échoue au moins 4 fois sur 5 (0 %)
- ✅ niveau 3-2 : le robot prudent échoue au moins 4 fois sur 5 (0 %)
- ✅ niveau 3-3 : le robot prudent échoue au moins 4 fois sur 5 (0 %)
- ✅ niveau 3-4 : le robot prudent échoue au moins 4 fois sur 5 (0 %)
- ✅ niveau 3-5 : le robot prudent échoue au moins 4 fois sur 5 (0 %)
- ✅ niveau 3-6 : le robot prudent échoue au moins 4 fois sur 5 (0 %)
- ✅ niveau 3-7 : le robot prudent échoue au moins 4 fois sur 5 (0 %)
- ✅ niveau 3-8 : le robot prudent échoue au moins 4 fois sur 5 (0 %)
- ✅ monde 1, niveau 3 : le moyen réussit environ 85 % (entre 78 et 92 %) (86 %)
- ✅ monde 1, niveau 1 (en douceur) : le débutant le finit presque à chaque fois (≥ 90 %) (100 %)
- ✅ monde 1, niveau 1 (en douceur) : le débutant le finit en moins de 45 s (29,1 s)
- ✅ monde 1 : mêmes résultats que la référence REF_W1 (réglée en v2.5), à 3 points près (plus gros écart 0 points)
- ✅ monde 2, niveau 1 : plus dur que le niveau 2 du monde 1, plus facile que son boss (moyen) (66 % (niveau 2 : 100 %, boss : 31 %))
- ✅ monde 3, niveau 1 : plus dur que le niveau 2 du monde 2, plus facile que son boss (moyen) (59 % (niveau 2 : 62 %, boss : 27 %))
<!-- tableau:fin -->
