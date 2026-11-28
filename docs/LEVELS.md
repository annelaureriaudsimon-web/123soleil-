# Résultats de la simulation — Mondes 1 à 4

Commande : `node tools/simulate.js --md docs/LEVELS.md`. Elle est rapide : environ 90 s pour 38 400 essais (4 mondes × 8 niveaux × 4 profils × 300 essais).
Options : `--world 4` (un seul monde), `--level w4-8` (un seul niveau), `--n 1000` (plus d'essais).

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
| Moyen (v2.5.1 : un vrai joueur au téléphone) | 0,36 s ± 0,07 pour lire le mot ; 0,29 s pour repartir au « ding » | S'arrête dès le « 3 » une fois sur trois, sinon il attend le mot. Après un piège, il veut lire le mot : il s'arrête moins souvent dès le « 3 ». Il s'arrête sur 30 % des mots pièges et, une fois sur trois, perd patience pendant un long « 3… » et repart. | Craque 15 % × la tentation, ×0,4 une fois connue. |
| Débutant | 0,45 s ± 0,10 (v2.5.1 ; avant 0,35 s) | Attend toujours le mot. S'arrête parfois sur un mot piège (20 %). | Craque 35 % × la tentation, ×0,7 une fois connue. |
| Prudent (v2.5, `patient`) | 0,22 s ± 0,03 | S'arrête à **chaque** « 3 » et ne repart **qu'au** « ding », même après un mot piège. C'est la stratégie « on a juste à s'arrêter » : la nuit, les transats et la glace doivent la faire échouer. | Comme l'expert. |

Les tentations existent dès le monde 1 depuis la v2.5 (le recomptage au 1-4, la fausse alerte au 1-7). Les multiplicateurs par tentation, le moment où l'on craque et la raison de ces choix sont dans `docs/WORLD2_DESIGN.md` (« Le sang-froid ») et, pour les pièges de la v2.5, dans `docs/TRAPS_DESIGN.md`. Tous les profils attendent le vrai retour (le « ding ») pour repartir : le faux retour, le faux dos et les faux signaux ne les font repartir que s'ils craquent.

Ce qui grille un joueur : être encore en mouvement quand le soleil a fini de se retourner. À 8 m/s, il faut 0,2 s pour s'arrêter. Celui qui attend « SOLEIL ! » doit donc réagir en moins de « demi-tour − 0,2 s ».

**v2.6 — la montagne : le sol qui glisse.** Dans une descente, on court à 10,4 m/s et il faut 0,4 s pour s'arrêter ;
sur le verglas, 0,6 s. Lâcher au mot ne suffit plus : il faut lâcher dès le « 3 ». Les cerveaux le font quand ils sont
sur un sol glissant ou à moins de 9 m (champ `slick` des profils) : l'expert, le robot prudent et les rivaux
« réguliers » et « prudents » toujours, le moyen 3 fois sur 4, le débutant une fois sur 2, Max le Fonceur une fois sur 3.
Pendant un long « 3… », ils voient aussi la glace arriver ; après s'être arrêtés exprès, ils ne repartent pas par
impatience pendant ce « 3 ». Dans les mondes 1 à 3, rien ne glisse : leurs résultats n'ont pas bougé d'un chiffre.
Conséquence : à la montagne, l'expert (qui anticipe toujours) est un peu plus lent que le moyen ; la nuit de chaque
niveau est donc réglée pour lui laisser le temps aussi (`docs/DIFFICULTY.md`).

## v2.5.1 : réglé sur un vrai joueur

Le moyen lisait le mot en 0,28 s : trop vite pour un vrai joueur sur téléphone. Avec 0,36 s, les demi-tours étaient trop
courts pour lire à temps et la nuit tombait beaucoup trop vite. Le moyen est recalibré, les demi-tours et les nuits de
tous les niveaux sont réglés à nouveau pour lui ; la nuit lui fait perdre au plus 5 % de ses essais (en pratique 0 à 1 %).
Le détail et les raisons sont dans `docs/DIFFICULTY.md`.

| Niveau | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|
| Monde 1 — demi-tour (s) | 0,70–0,76 | 0,77–0,82 | 0,635–0,685 | 0,695–0,745 | 0,61–0,66 | 0,66–0,71 | 0,625–0,675 | 0,62–0,67 |
| Monde 1 — nuit (s) | — | — | 37,5 | 41 | 37,5 | 38 | 40,5 | 49 |
| Monde 2 — demi-tour (s) | 0,645–0,695 | 0,65–0,70 | 0,62–0,67 | 0,595–0,645 | 0,62–0,67 | 0,605–0,655 | 0,60–0,65 | 0,63–0,68 |
| Monde 2 — nuit (s) | 41,5 | 41,5 | 44 | 47 | 48,5 | 49 | 49,5 | 56,5 |
| Monde 3 — demi-tour (s) | 0,695–0,745 | 0,615–0,665 | 0,595–0,645 | 0,615–0,665 | 0,60–0,65 | 0,59–0,64 | 0,605–0,655 | 0,61–0,66 |
| Monde 3 — nuit (s) | 44 | 41 | 43,5 | 43,5 | 48,5 | 51 | 50 | 58 |

## v2.6 : la montagne

| Niveau | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|
| Monde 4 — demi-tour (s) | 0,62–0,67 | 0,61–0,66 | 0,605–0,655 | 0,645–0,695 | 0,62–0,67 | 0,60–0,65 | 0,595–0,645 | 0,58–0,63 |
| Monde 4 — nuit (s) | 44 | 44 | 46 | 46,5 | 47,5 | 47,5 | 49 | 57 |
| Monde 4 — sol | 3 descentes | 4 verglas | 2 + 1 | 3 verglas | 2 + 2 | 2 + 2 | 2 + 2 | 3 + 4 |

(« 2 + 1 » : 2 descentes et 1 plaque de verglas.) Les objectifs, la répartition et les raisons sont dans
`docs/DIFFICULTY.md` et `docs/WORLD4_DESIGN.md`.

## v2.5 : ce que j'ai ajusté (avant la v2.5.1)

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

Les demi-tours sont plus longs qu'avant : sans « SO », il faut lire le mot avant de freiner. La nuit était réglée pour que
l'expert arrive toujours et que le robot prudent n'arrive jamais : trop serré pour un vrai joueur (corrigé en v2.5.1).

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
| 1. Premiers pas | Moyen | 100 % | 29,7 s | 1,00 / 3 | — | 100 % | 57 % |
| 1. Premiers pas | Débutant | 100 % | 29,6 s | 1,00 / 3 | — | 100 % | 95 % |
| 1. Premiers pas | Prudent | 100 % | 36,5 s | 1,01 / 3 | — | 100 % | 0 % |
| 2. Les hésitations | Expert | 100 % | 25,4 s | 2,00 / 3 | — | 100 % | 100 % |
| 2. Les hésitations | Moyen | 100 % | 28,8 s | 2,00 / 3 | lâché trop tard (100 %) | 99 % | 67 % |
| 2. Les hésitations | Débutant | 87 % | 26,6 s | 2,00 / 3 | lâché trop tard (100 %) | 87 % | 86 % |
| 2. Les hésitations | Prudent | 100 % | 49,1 s | 2,36 / 3 | — | 64 % | 0 % |
| 3. Avant la nuit | Expert | 100 % | 27,2 s | 1,00 / 4 | — | 99 % | 100 % |
| 3. Avant la nuit | Moyen | 90 % | 31,0 s | 1,38 / 4 | lâché trop tard (100 %) | 59 % | 4 % |
| 3. Avant la nuit | Débutant | 17 % | 29,3 s | 1,17 / 4 | lâché trop tard (95 %) | 17 % | 10 % |
| 3. Avant la nuit | Prudent | 0 % | — | — | la nuit est tombée (100 %) | 0 % | 0 % |
| 4. Le recomptage | Expert | 98 % | 31,2 s | 1,46 / 3 | craqué : recomptage (100 %) | 53 % | 93 % |
| 4. Le recomptage | Moyen | 79 % | 33,9 s | 1,51 / 3 | craqué : recomptage (88 %) | 38 % | 42 % |
| 4. Le recomptage | Débutant | 18 % | 32,5 s | 1,49 / 3 | lâché trop tard (53 %) | 9 % | 13 % |
| 4. Le recomptage | Prudent | 1 % | 40,1 s | 2,00 / 3 | la nuit est tombée (91 %) | 0 % | 0 % |
| 5. Le bégaiement | Expert | 100 % | 30,3 s | 1,57 / 4 | — | 100 % | 0 % |
| 5. Le bégaiement | Moyen | 72 % | 32,3 s | 1,86 / 4 | lâché trop tard (100 %) | 60 % | 62 % |
| 5. Le bégaiement | Débutant | 4 % | 32,6 s | 2,09 / 4 | lâché trop tard (92 %) | 2 % | 4 % |
| 5. Le bégaiement | Prudent | 22 % | 36,8 s | 2,58 / 4 | la nuit est tombée (100 %) | 9 % | 0 % |
| 6. Le chant express | Expert | 100 % | 30,3 s | 1,58 / 4 | — | 1 % | 42 % |
| 6. Le chant express | Moyen | 63 % | 32,5 s | 1,93 / 4 | lâché trop tard (100 %) | 61 % | 18 % |
| 6. Le chant express | Débutant | 3 % | 33,0 s | 2,50 / 4 | lâché trop tard (94 %) | 3 % | 0 % |
| 6. Le chant express | Prudent | 14 % | 37,2 s | 2,71 / 4 | la nuit est tombée (100 %) | 0 % | 0 % |
| 7. La grande course | Expert | 98 % | 30,8 s | 1,41 / 6 | craqué : fausse alerte (100 %) | 98 % | 58 % |
| 7. La grande course | Moyen | 52 % | 33,6 s | 2,02 / 6 | lâché trop tard (68 %) | 49 % | 16 % |
| 7. La grande course | Débutant | 4 % | 31,7 s | 1,67 / 6 | lâché trop tard (79 %) | 4 % | 2 % |
| 7. La grande course | Prudent | 0 % | 40,3 s | 3,00 / 6 | la nuit est tombée (93 %) | 0 % | 0 % |
| 8. Le Soleil Cool | Expert | 100 % | 35,1 s | 1,39 / 4 | — | 1 % | 61 % |
| 8. Le Soleil Cool | Moyen | 32 % | 39,3 s | 1,60 / 4 | lâché trop tard (89 %) | 31 % | 15 % |
| 8. Le Soleil Cool | Débutant | 2 % | 38,3 s | 2,00 / 4 | lâché trop tard (89 %) | 2 % | 1 % |
| 8. Le Soleil Cool | Prudent | 0 % | — | — | la nuit est tombée (91 %) | 0 % | 0 % |

### Monde 2 — Le parc

| Niveau | Profil | Réussite | Durée moyenne (réussites) | Position moyenne | Défaite la plus fréquente | ★★ | ★★★ |
|---|---|---|---|---|---|---|---|
| 1. L’étoile tentatrice | Expert | 99 % | 32,4 s | 1,31 / 3 | craqué : étoile (100 %) | 99 % | 69 % |
| 1. L’étoile tentatrice | Moyen | 73 % | 35,0 s | 1,39 / 3 | craqué : étoile (60 %) | 73 % | 45 % |
| 1. L’étoile tentatrice | Débutant | 3 % | 35,0 s | 1,56 / 3 | lâché trop tard (69 %) | 0 % | 1 % |
| 1. L’étoile tentatrice | Prudent | 2 % | 40,7 s | 1,83 / 3 | la nuit est tombée (77 %) | 2 % | 0 % |
| 2. Le faux retour | Expert | 98 % | 32,6 s | 1,23 / 3 | craqué : faux retour (100 %) | 98 % | 98 % |
| 2. Le faux retour | Moyen | 66 % | 35,4 s | 1,56 / 3 | craqué : faux retour (64 %) | 65 % | 46 % |
| 2. Le faux retour | Débutant | 3 % | 33,6 s | 1,56 / 3 | lâché trop tard (63 %) | 0 % | 3 % |
| 2. Le faux retour | Prudent | 2 % | 40,4 s | 1,71 / 3 | la nuit est tombée (88 %) | 2 % | 0 % |
| 3. La mouche et les moqueries | Expert | 99 % | 32,8 s | 1,42 / 4 | craqué : moquerie (75 %) | 99 % | 0 % |
| 3. La mouche et les moqueries | Moyen | 61 % | 35,8 s | 1,73 / 4 | lâché trop tard (63 %) | 54 % | 53 % |
| 3. La mouche et les moqueries | Débutant | 4 % | 33,4 s | 1,36 / 4 | lâché trop tard (82 %) | 4 % | 4 % |
| 3. La mouche et les moqueries | Prudent | 1 % | 42,8 s | 2,50 / 4 | la nuit est tombée (80 %) | 1 % | 0 % |
| 4. Les flaques de boue | Expert | 99 % | 36,9 s | 1,32 / 4 | craqué : étoile (100 %) | 99 % | 68 % |
| 4. Les flaques de boue | Moyen | 58 % | 40,1 s | 1,67 / 4 | lâché trop tard (68 %) | 49 % | 27 % |
| 4. Les flaques de boue | Débutant | 3 % | 38,1 s | 1,60 / 4 | lâché trop tard (75 %) | 3 % | 2 % |
| 4. Les flaques de boue | Prudent | 0 % | — | — | la nuit est tombée (80 %) | 0 % | 0 % |
| 5. Le faux dos | Expert | 99 % | 36,8 s | 1,12 / 4 | faux dos (HOP !) (67 %) | 99 % | 65 % |
| 5. Le faux dos | Moyen | 48 % | 40,1 s | 1,40 / 4 | faux dos (HOP !) (50 %) | 46 % | 11 % |
| 5. Le faux dos | Débutant | 1 % | 39,0 s | 1,00 / 4 | lâché trop tard (64 %) | 0 % | 0 % |
| 5. Le faux dos | Prudent | 16 % | 46,2 s | 2,13 / 4 | la nuit est tombée (88 %) | 16 % | 0 % |
| 6. Le grand jeu du Farceur | Expert | 98 % | 38,1 s | 1,04 / 4 | craqué : éternuement (43 %) | 0 % | 92 % |
| 6. Le grand jeu du Farceur | Moyen | 41 % | 40,8 s | 1,19 / 4 | lâché trop tard (51 %) | 41 % | 28 % |
| 6. Le grand jeu du Farceur | Débutant | 0 % | — | — | lâché trop tard (65 %) | 0 % | 0 % |
| 6. Le grand jeu du Farceur | Prudent | 12 % | 47,7 s | 1,50 / 4 | la nuit est tombée (78 %) | 0 % | 0 % |
| 7. La grande course du parc | Expert | 99 % | 36,2 s | 1,27 / 6 | craqué : étoile (25 %) | 99 % | 75 % |
| 7. La grande course du parc | Moyen | 35 % | 39,4 s | 1,40 / 6 | lâché trop tard (59 %) | 35 % | 25 % |
| 7. La grande course du parc | Débutant | 1 % | 36,5 s | 1,67 / 6 | lâché trop tard (69 %) | 1 % | 1 % |
| 7. La grande course du parc | Prudent | 1 % | 48,0 s | 2,00 / 6 | la nuit est tombée (77 %) | 1 % | 0 % |
| 8. Le Soleil Farceur | Expert | 98 % | 43,0 s | 1,00 / 4 | craqué : faux retour (60 %) | 98 % | 98 % |
| 8. Le Soleil Farceur | Moyen | 28 % | 46,5 s | 1,15 / 4 | lâché trop tard (50 %) | 25 % | 24 % |
| 8. Le Soleil Farceur | Débutant | 0 % | — | — | lâché trop tard (61 %) | 0 % | 0 % |
| 8. Le Soleil Farceur | Prudent | 0 % | — | — | la nuit est tombée (69 %) | 0 % | 0 % |

### Monde 3 — La plage

| Niveau | Profil | Réussite | Durée moyenne (réussites) | Position moyenne | Défaite la plus fréquente | ★★ | ★★★ |
|---|---|---|---|---|---|---|---|
| 1. Les transats | Expert | 100 % | 32,8 s | 1,51 / 4 | — | 95 % | 72 % |
| 1. Les transats | Moyen | 65 % | 35,6 s | 2,15 / 4 | craqué : étoile (26 %) | 42 % | 22 % |
| 1. Les transats | Débutant | 10 % | 33,7 s | 2,07 / 4 | lâché trop tard (45 %) | 7 % | 5 % |
| 1. Les transats | Prudent | 0 % | — | — | plus de transat (ou de luge) (58 %) | 0 % | 0 % |
| 2. La glace qui fond | Expert | 99 % | 30,4 s | 1,26 / 4 | craqué : faux retour (100 %) | 99 % | 87 % |
| 2. La glace qui fond | Moyen | 57 % | 33,7 s | 1,53 / 4 | lâché trop tard (64 %) | 46 % | 14 % |
| 2. La glace qui fond | Débutant | 2 % | 32,4 s | 1,57 / 4 | lâché trop tard (80 %) | 2 % | 1 % |
| 2. La glace qui fond | Prudent | 0 % | — | — | la nuit est tombée (84 %) | 0 % | 0 % |
| 3. L’avion menteur | Expert | 100 % | 31,0 s | 1,30 / 4 | craqué : avion « ALLEZ-Y ! » (100 %) | 100 % | 100 % |
| 3. L’avion menteur | Moyen | 51 % | 34,9 s | 1,64 / 4 | lâché trop tard (86 %) | 45 % | 33 % |
| 3. L’avion menteur | Débutant | 2 % | 32,5 s | 1,71 / 4 | lâché trop tard (85 %) | 2 % | 2 % |
| 3. L’avion menteur | Prudent | 1 % | 42,7 s | 2,25 / 4 | la nuit est tombée (88 %) | 1 % | 0 % |
| 4. Le volley de plage | Expert | 99 % | 33,6 s | 1,27 / 5 | craqué : avion « ALLEZ-Y ! » (100 %) | 99 % | 74 % |
| 4. Le volley de plage | Moyen | 51 % | 36,9 s | 2,43 / 5 | lâché trop tard (63 %) | 40 % | 12 % |
| 4. Le volley de plage | Débutant | 2 % | 35,8 s | 2,43 / 5 | lâché trop tard (82 %) | 2 % | 1 % |
| 4. Le volley de plage | Prudent | 5 % | 42,8 s | 3,86 / 5 | la nuit est tombée (63 %) | 1 % | 0 % |
| 5. Le reflet dans l’eau | Expert | 100 % | 37,5 s | 1,02 / 4 | faux dos (HOP !) (100 %) | 100 % | 41 % |
| 5. Le reflet dans l’eau | Moyen | 43 % | 40,6 s | 1,04 / 4 | lâché trop tard (51 %) | 29 % | 6 % |
| 5. Le reflet dans l’eau | Débutant | 0 % | — | — | lâché trop tard (68 %) | 0 % | 0 % |
| 5. Le reflet dans l’eau | Prudent | 8 % | 47,1 s | 1,20 / 4 | la nuit est tombée (85 %) | 8 % | 0 % |
| 6. Le château de sable | Expert | 100 % | 36,5 s | 1,13 / 4 | — | 86 % | 47 % |
| 6. Le château de sable | Moyen | 35 % | 40,3 s | 1,46 / 4 | lâché trop tard (68 %) | 16 % | 4 % |
| 6. Le château de sable | Débutant | 1 % | 34,0 s | 1,00 / 4 | lâché trop tard (76 %) | 1 % | 1 % |
| 6. Le château de sable | Prudent | 2 % | 49,6 s | 2,17 / 4 | la nuit est tombée (86 %) | 0 % | 0 % |
| 7. La grande course de la plage | Expert | 100 % | 37,0 s | 1,34 / 6 | craqué : avion « ALLEZ-Y ! » (100 %) | 100 % | 70 % |
| 7. La grande course de la plage | Moyen | 32 % | 40,6 s | 1,69 / 6 | lâché trop tard (68 %) | 31 % | 16 % |
| 7. La grande course de la plage | Débutant | 0 % | 33,7 s | 1,00 / 6 | lâché trop tard (74 %) | 0 % | 0 % |
| 7. La grande course de la plage | Prudent | 3 % | 49,1 s | 2,00 / 6 | la nuit est tombée (82 %) | 3 % | 1 % |
| 8. Le Soleil Vacancier | Expert | 100 % | 42,0 s | 1,02 / 4 | craqué : recomptage (100 %) | 97 % | 98 % |
| 8. Le Soleil Vacancier | Moyen | 18 % | 46,2 s | 1,25 / 4 | lâché trop tard (57 %) | 13 % | 14 % |
| 8. Le Soleil Vacancier | Débutant | 0 % | — | — | lâché trop tard (71 %) | 0 % | 0 % |
| 8. Le Soleil Vacancier | Prudent | 0 % | — | — | la nuit est tombée (77 %) | 0 % | 0 % |

### Monde 4 — La montagne

| Niveau | Profil | Réussite | Durée moyenne (réussites) | Position moyenne | Défaite la plus fréquente | ★★ | ★★★ |
|---|---|---|---|---|---|---|---|
| 1. La descente | Expert | 99 % | 35,9 s | 1,19 / 4 | la nuit est tombée (50 %) | 99 % | 54 % |
| 1. La descente | Moyen | 54 % | 36,8 s | 1,38 / 4 | lâché trop tard (55 %) | 52 % | 25 % |
| 1. La descente | Débutant | 5 % | 33,9 s | 1,21 / 4 | lâché trop tard (73 %) | 5 % | 3 % |
| 1. La descente | Prudent | 2 % | 42,6 s | 2,00 / 4 | la nuit est tombée (83 %) | 2 % | 0 % |
| 2. Le verglas | Expert | 100 % | 35,5 s | 1,19 / 4 | — | 100 % | 60 % |
| 2. Le verglas | Moyen | 53 % | 37,3 s | 1,43 / 4 | lâché trop tard (62 %) | 50 % | 20 % |
| 2. Le verglas | Débutant | 4 % | 35,2 s | 1,23 / 4 | lâché trop tard (76 %) | 4 % | 3 % |
| 2. Le verglas | Prudent | 1 % | 42,8 s | 1,00 / 4 | la nuit est tombée (89 %) | 1 % | 0 % |
| 3. Les luges | Expert | 100 % | 35,9 s | 1,53 / 4 | craqué : étoile (100 %) | 94 % | 55 % |
| 3. Les luges | Moyen | 49 % | 37,6 s | 1,99 / 4 | lâché trop tard (56 %) | 35 % | 17 % |
| 3. Les luges | Débutant | 2 % | 35,5 s | 1,71 / 4 | lâché trop tard (76 %) | 2 % | 1 % |
| 3. Les luges | Prudent | 1 % | 44,3 s | 2,75 / 4 | plus de transat (ou de luge) (57 %) | 0 % | 0 % |
| 4. Le lac gelé | Expert | 99 % | 38,0 s | 1,07 / 4 | faux dos (HOP !) (50 %) | 99 % | 50 % |
| 4. Le lac gelé | Moyen | 46 % | 40,1 s | 1,08 / 4 | lâché trop tard (44 %) | 25 % | 11 % |
| 4. Le lac gelé | Débutant | 0 % | 41,6 s | 1,00 / 4 | lâché trop tard (61 %) | 0 % | 0 % |
| 4. Le lac gelé | Prudent | 3 % | 45,6 s | 1,22 / 4 | la nuit est tombée (88 %) | 3 % | 0 % |
| 5. Le slalom | Expert | 99 % | 38,2 s | 1,73 / 5 | craqué : étoile (50 %) | 99 % | 60 % |
| 5. Le slalom | Moyen | 41 % | 39,2 s | 2,19 / 5 | lâché trop tard (48 %) | 39 % | 20 % |
| 5. Le slalom | Débutant | 2 % | 35,8 s | 1,20 / 5 | lâché trop tard (55 %) | 2 % | 1 % |
| 5. Le slalom | Prudent | 6 % | 45,5 s | 2,74 / 5 | la nuit est tombée (68 %) | 5 % | 0 % |
| 6. Le chalet | Expert | 98 % | 38,9 s | 1,09 / 4 | craqué : faux retour (33 %) | 98 % | 50 % |
| 6. Le chalet | Moyen | 35 % | 39,6 s | 1,28 / 4 | lâché trop tard (55 %) | 34 % | 15 % |
| 6. Le chalet | Débutant | 0 % | — | — | lâché trop tard (67 %) | 0 % | 0 % |
| 6. Le chalet | Prudent | 7 % | 46,1 s | 1,90 / 4 | la nuit est tombée (82 %) | 6 % | 0 % |
| 7. La grande course de la montagne | Expert | 99 % | 39,1 s | 1,71 / 6 | craqué : troupeau (33 %) | 99 % | 64 % |
| 7. La grande course de la montagne | Moyen | 31 % | 40,4 s | 1,73 / 6 | lâché trop tard (61 %) | 31 % | 15 % |
| 7. La grande course de la montagne | Débutant | 1 % | 35,9 s | 2,50 / 6 | lâché trop tard (66 %) | 1 % | 1 % |
| 7. La grande course de la montagne | Prudent | 11 % | 47,4 s | 2,06 / 6 | la nuit est tombée (79 %) | 11 % | 0 % |
| 8. Le Soleil des Neiges | Expert | 97 % | 49,0 s | 1,03 / 4 | faux dos (HOP !) (44 %) | 97 % | 36 % |
| 8. Le Soleil des Neiges | Moyen | 17 % | 46,5 s | 1,13 / 4 | lâché trop tard (43 %) | 17 % | 9 % |
| 8. Le Soleil des Neiges | Débutant | 0 % | 28,9 s | 1,00 / 4 | lâché trop tard (56 %) | 0 % | 0 % |
| 8. Le Soleil des Neiges | Prudent | 11 % | 55,5 s | 1,62 / 4 | la nuit est tombée (79 %) | 11 % | 0 % |

Objectifs vérifiés :

- ✅ niveau 1-1 : l'expert réussit au moins 95 % (100 %)
- ✅ niveau 1-2 : l'expert réussit au moins 95 % (100 %)
- ✅ niveau 1-3 : l'expert réussit au moins 95 % (100 %)
- ✅ niveau 1-4 : l'expert réussit au moins 95 % (98 %)
- ✅ niveau 1-5 : l'expert réussit au moins 95 % (100 %)
- ✅ niveau 1-6 : l'expert réussit au moins 95 % (100 %)
- ✅ niveau 1-7 : l'expert réussit au moins 95 % (98 %)
- ✅ niveau 1-8 : l'expert réussit au moins 95 % (100 %)
- ✅ niveau 2-1 : l'expert réussit au moins 95 % (99 %)
- ✅ niveau 2-2 : l'expert réussit au moins 95 % (98 %)
- ✅ niveau 2-3 : l'expert réussit au moins 95 % (99 %)
- ✅ niveau 2-4 : l'expert réussit au moins 95 % (99 %)
- ✅ niveau 2-5 : l'expert réussit au moins 95 % (99 %)
- ✅ niveau 2-6 : l'expert réussit au moins 95 % (98 %)
- ✅ niveau 2-7 : l'expert réussit au moins 95 % (99 %)
- ✅ niveau 2-8 : l'expert réussit au moins 95 % (98 %)
- ✅ niveau 3-1 : l'expert réussit au moins 95 % (100 %)
- ✅ niveau 3-2 : l'expert réussit au moins 95 % (99 %)
- ✅ niveau 3-3 : l'expert réussit au moins 95 % (100 %)
- ✅ niveau 3-4 : l'expert réussit au moins 95 % (99 %)
- ✅ niveau 3-5 : l'expert réussit au moins 95 % (100 %)
- ✅ niveau 3-6 : l'expert réussit au moins 95 % (100 %)
- ✅ niveau 3-7 : l'expert réussit au moins 95 % (100 %)
- ✅ niveau 3-8 : l'expert réussit au moins 95 % (100 %)
- ✅ niveau 4-1 : l'expert réussit au moins 95 % (99 %)
- ✅ niveau 4-2 : l'expert réussit au moins 95 % (100 %)
- ✅ niveau 4-3 : l'expert réussit au moins 95 % (100 %)
- ✅ niveau 4-4 : l'expert réussit au moins 95 % (99 %)
- ✅ niveau 4-5 : l'expert réussit au moins 95 % (99 %)
- ✅ niveau 4-6 : l'expert réussit au moins 95 % (98 %)
- ✅ niveau 4-7 : l'expert réussit au moins 95 % (99 %)
- ✅ niveau 4-8 : l'expert réussit au moins 95 % (97 %)
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
- ✅ niveau 4-1 : menace dans les 10 premières secondes (1er SOLEIL ≤ 6.8 s)
- ✅ niveau 4-2 : menace dans les 10 premières secondes (1er SOLEIL ≤ 7.1 s)
- ✅ niveau 4-3 : menace dans les 10 premières secondes (1er SOLEIL ≤ 7.0 s)
- ✅ niveau 4-4 : menace dans les 10 premières secondes (1er SOLEIL ≤ 5.5 s)
- ✅ niveau 4-5 : menace dans les 10 premières secondes (1er SOLEIL ≤ 7.1 s)
- ✅ niveau 4-6 : menace dans les 10 premières secondes (1er SOLEIL ≤ 6.8 s)
- ✅ niveau 4-7 : menace dans les 10 premières secondes (1er SOLEIL ≤ 6.8 s)
- ✅ niveau 4-8 : menace dans les 10 premières secondes (1er SOLEIL ≤ 6.5 s)
- ✅ niveau 1-1 : durée (moyen) entre 25 et 35 s (29,7 s)
- ✅ niveau 1-2 : durée (moyen) entre 25 et 35 s (28,8 s)
- ✅ niveau 1-3 : durée (moyen) entre 25 et 35 s (31,0 s)
- ✅ niveau 1-4 : durée (moyen) entre 25 et 35 s (33,9 s)
- ✅ niveau 1-5 : durée (moyen) entre 25 et 35 s (32,3 s)
- ✅ niveau 1-6 : durée (moyen) entre 25 et 35 s (32,5 s)
- ✅ niveau 1-7 : durée (moyen) entre 25 et 35 s (33,6 s)
- ✅ niveau 1-8 : durée (moyen) ≤ 45 s (39,3 s)
- ✅ niveau 2-1 : durée (moyen) entre 30 et 42 s (35,0 s)
- ✅ niveau 2-2 : durée (moyen) entre 30 et 42 s (35,4 s)
- ✅ niveau 2-3 : durée (moyen) entre 30 et 42 s (35,8 s)
- ✅ niveau 2-4 : durée (moyen) entre 30 et 42 s (40,1 s)
- ✅ niveau 2-5 : durée (moyen) entre 30 et 42 s (40,1 s)
- ✅ niveau 2-6 : durée (moyen) entre 30 et 42 s (40,8 s)
- ✅ niveau 2-7 : durée (moyen) entre 30 et 42 s (39,4 s)
- ✅ niveau 2-8 : durée (moyen) ≤ 50 s (46,5 s)
- ✅ niveau 3-1 : durée (moyen) entre 30 et 42 s (35,6 s)
- ✅ niveau 3-2 : durée (moyen) entre 30 et 42 s (33,7 s)
- ✅ niveau 3-3 : durée (moyen) entre 30 et 42 s (34,9 s)
- ✅ niveau 3-4 : durée (moyen) entre 30 et 42 s (36,9 s)
- ✅ niveau 3-5 : durée (moyen) entre 30 et 42 s (40,6 s)
- ✅ niveau 3-6 : durée (moyen) entre 30 et 42 s (40,3 s)
- ✅ niveau 3-7 : durée (moyen) entre 30 et 42 s (40,6 s)
- ✅ niveau 3-8 : durée (moyen) ≤ 50 s (46,2 s)
- ✅ niveau 4-1 : durée (moyen) entre 30 et 42 s (36,8 s)
- ✅ niveau 4-2 : durée (moyen) entre 30 et 42 s (37,3 s)
- ✅ niveau 4-3 : durée (moyen) entre 30 et 42 s (37,6 s)
- ✅ niveau 4-4 : durée (moyen) entre 30 et 42 s (40,1 s)
- ✅ niveau 4-5 : durée (moyen) entre 30 et 42 s (39,2 s)
- ✅ niveau 4-6 : durée (moyen) entre 30 et 42 s (39,6 s)
- ✅ niveau 4-7 : durée (moyen) entre 30 et 42 s (40,4 s)
- ✅ niveau 4-8 : durée (moyen) ≤ 50 s (46,5 s)
- ✅ monde 1 : le moyen réussit le boss 15 à 35 % (32 %)
- ✅ monde 1 : la difficulté monte régulièrement (moyen : jamais plus de 20 points d’écart, jamais plus facile) (plus gros saut 19 points)
- ✅ monde 2 : le moyen réussit le boss 10 à 30 % (28 %)
- ✅ monde 2 : la difficulté monte régulièrement (moyen : jamais plus de 20 points d’écart, jamais plus facile) (plus gros saut 10 points)
- ✅ monde 3 : le moyen réussit le boss 10 à 20 % (18 %)
- ✅ monde 3 : la difficulté monte régulièrement (moyen : jamais plus de 20 points d’écart, jamais plus facile) (plus gros saut 14 points)
- ✅ monde 4 : le moyen réussit le boss 10 à 20 % (17 %)
- ✅ monde 4 : la difficulté monte régulièrement (moyen : jamais plus de 20 points d’écart, jamais plus facile) (plus gros saut 13 points)
- ✅ niveau 1-1 : le robot prudent n'a presque jamais ★★★ (au plus 2 %) (0 %)
- ✅ niveau 1-2 : le robot prudent n'a presque jamais ★★★ (au plus 2 %) (0 %)
- ✅ niveau 1-3 : le robot prudent n'a presque jamais ★★★ (au plus 2 %) (0 %)
- ✅ niveau 1-4 : le robot prudent n'a presque jamais ★★★ (au plus 2 %) (0 %)
- ✅ niveau 1-5 : le robot prudent n'a presque jamais ★★★ (au plus 2 %) (0 %)
- ✅ niveau 1-6 : le robot prudent n'a presque jamais ★★★ (au plus 2 %) (0 %)
- ✅ niveau 1-7 : le robot prudent n'a presque jamais ★★★ (au plus 2 %) (0 %)
- ✅ niveau 1-8 : le robot prudent n'a presque jamais ★★★ (au plus 2 %) (0 %)
- ✅ niveau 2-1 : le robot prudent n'a presque jamais ★★★ (au plus 2 %) (0 %)
- ✅ niveau 2-2 : le robot prudent n'a presque jamais ★★★ (au plus 2 %) (0 %)
- ✅ niveau 2-3 : le robot prudent n'a presque jamais ★★★ (au plus 2 %) (0 %)
- ✅ niveau 2-4 : le robot prudent n'a presque jamais ★★★ (au plus 2 %) (0 %)
- ✅ niveau 2-5 : le robot prudent n'a presque jamais ★★★ (au plus 2 %) (0 %)
- ✅ niveau 2-6 : le robot prudent n'a presque jamais ★★★ (au plus 2 %) (0 %)
- ✅ niveau 2-7 : le robot prudent n'a presque jamais ★★★ (au plus 2 %) (0 %)
- ✅ niveau 2-8 : le robot prudent n'a presque jamais ★★★ (au plus 2 %) (0 %)
- ✅ niveau 3-1 : le robot prudent n'a presque jamais ★★★ (au plus 2 %) (0 %)
- ✅ niveau 3-2 : le robot prudent n'a presque jamais ★★★ (au plus 2 %) (0 %)
- ✅ niveau 3-3 : le robot prudent n'a presque jamais ★★★ (au plus 2 %) (0 %)
- ✅ niveau 3-4 : le robot prudent n'a presque jamais ★★★ (au plus 2 %) (0 %)
- ✅ niveau 3-5 : le robot prudent n'a presque jamais ★★★ (au plus 2 %) (0 %)
- ✅ niveau 3-6 : le robot prudent n'a presque jamais ★★★ (au plus 2 %) (0 %)
- ✅ niveau 3-7 : le robot prudent n'a presque jamais ★★★ (au plus 2 %) (1 %)
- ✅ niveau 3-8 : le robot prudent n'a presque jamais ★★★ (au plus 2 %) (0 %)
- ✅ niveau 4-1 : le robot prudent n'a presque jamais ★★★ (au plus 2 %) (0 %)
- ✅ niveau 4-2 : le robot prudent n'a presque jamais ★★★ (au plus 2 %) (0 %)
- ✅ niveau 4-3 : le robot prudent n'a presque jamais ★★★ (au plus 2 %) (0 %)
- ✅ niveau 4-4 : le robot prudent n'a presque jamais ★★★ (au plus 2 %) (0 %)
- ✅ niveau 4-5 : le robot prudent n'a presque jamais ★★★ (au plus 2 %) (0 %)
- ✅ niveau 4-6 : le robot prudent n'a presque jamais ★★★ (au plus 2 %) (0 %)
- ✅ niveau 4-7 : le robot prudent n'a presque jamais ★★★ (au plus 2 %) (0 %)
- ✅ niveau 4-8 : le robot prudent n'a presque jamais ★★★ (au plus 2 %) (0 %)
- ✅ niveau 1-3 : la nuit ne fait presque jamais perdre le moyen (au plus 5 % des essais) (0 %)
- ✅ niveau 1-4 : la nuit ne fait presque jamais perdre le moyen (au plus 5 % des essais) (1 %)
- ✅ niveau 1-5 : la nuit ne fait presque jamais perdre le moyen (au plus 5 % des essais) (0 %)
- ✅ niveau 1-6 : la nuit ne fait presque jamais perdre le moyen (au plus 5 % des essais) (0 %)
- ✅ niveau 1-7 : la nuit ne fait presque jamais perdre le moyen (au plus 5 % des essais) (0 %)
- ✅ niveau 1-8 : la nuit ne fait presque jamais perdre le moyen (au plus 5 % des essais) (0 %)
- ✅ niveau 2-1 : la nuit ne fait presque jamais perdre le moyen (au plus 5 % des essais) (0 %)
- ✅ niveau 2-2 : la nuit ne fait presque jamais perdre le moyen (au plus 5 % des essais) (0 %)
- ✅ niveau 2-3 : la nuit ne fait presque jamais perdre le moyen (au plus 5 % des essais) (0 %)
- ✅ niveau 2-4 : la nuit ne fait presque jamais perdre le moyen (au plus 5 % des essais) (0 %)
- ✅ niveau 2-5 : la nuit ne fait presque jamais perdre le moyen (au plus 5 % des essais) (0 %)
- ✅ niveau 2-6 : la nuit ne fait presque jamais perdre le moyen (au plus 5 % des essais) (0 %)
- ✅ niveau 2-7 : la nuit ne fait presque jamais perdre le moyen (au plus 5 % des essais) (0 %)
- ✅ niveau 2-8 : la nuit ne fait presque jamais perdre le moyen (au plus 5 % des essais) (0 %)
- ✅ niveau 3-1 : la nuit ne fait presque jamais perdre le moyen (au plus 5 % des essais) (0 %)
- ✅ niveau 3-2 : la nuit ne fait presque jamais perdre le moyen (au plus 5 % des essais) (0 %)
- ✅ niveau 3-3 : la nuit ne fait presque jamais perdre le moyen (au plus 5 % des essais) (0 %)
- ✅ niveau 3-4 : la nuit ne fait presque jamais perdre le moyen (au plus 5 % des essais) (0 %)
- ✅ niveau 3-5 : la nuit ne fait presque jamais perdre le moyen (au plus 5 % des essais) (0 %)
- ✅ niveau 3-6 : la nuit ne fait presque jamais perdre le moyen (au plus 5 % des essais) (0 %)
- ✅ niveau 3-7 : la nuit ne fait presque jamais perdre le moyen (au plus 5 % des essais) (0 %)
- ✅ niveau 3-8 : la nuit ne fait presque jamais perdre le moyen (au plus 5 % des essais) (0 %)
- ✅ niveau 4-1 : la nuit ne fait presque jamais perdre le moyen (au plus 5 % des essais) (0 %)
- ✅ niveau 4-2 : la nuit ne fait presque jamais perdre le moyen (au plus 5 % des essais) (0 %)
- ✅ niveau 4-3 : la nuit ne fait presque jamais perdre le moyen (au plus 5 % des essais) (1 %)
- ✅ niveau 4-4 : la nuit ne fait presque jamais perdre le moyen (au plus 5 % des essais) (0 %)
- ✅ niveau 4-5 : la nuit ne fait presque jamais perdre le moyen (au plus 5 % des essais) (1 %)
- ✅ niveau 4-6 : la nuit ne fait presque jamais perdre le moyen (au plus 5 % des essais) (1 %)
- ✅ niveau 4-7 : la nuit ne fait presque jamais perdre le moyen (au plus 5 % des essais) (1 %)
- ✅ niveau 4-8 : la nuit ne fait presque jamais perdre le moyen (au plus 5 % des essais) (0 %)
- ✅ niveau 1-7 : le robot prudent échoue au moins une fois sur deux (0 %)
- ✅ niveau 1-8 : le robot prudent échoue au moins une fois sur deux (0 %)
- ✅ niveau 2-1 : le robot prudent échoue au moins 4 fois sur 5 (2 %)
- ✅ niveau 2-2 : le robot prudent échoue au moins 4 fois sur 5 (2 %)
- ✅ niveau 2-3 : le robot prudent échoue au moins 4 fois sur 5 (1 %)
- ✅ niveau 2-4 : le robot prudent échoue au moins 4 fois sur 5 (0 %)
- ✅ niveau 2-5 : le robot prudent échoue au moins 4 fois sur 5 (16 %)
- ✅ niveau 2-6 : le robot prudent échoue au moins 4 fois sur 5 (12 %)
- ✅ niveau 2-7 : le robot prudent échoue au moins 4 fois sur 5 (1 %)
- ✅ niveau 2-8 : le robot prudent échoue au moins 4 fois sur 5 (0 %)
- ✅ niveau 3-1 : le robot prudent échoue au moins 4 fois sur 5 (0 %)
- ✅ niveau 3-2 : le robot prudent échoue au moins 4 fois sur 5 (0 %)
- ✅ niveau 3-3 : le robot prudent échoue au moins 4 fois sur 5 (1 %)
- ✅ niveau 3-4 : le robot prudent échoue au moins 4 fois sur 5 (5 %)
- ✅ niveau 3-5 : le robot prudent échoue au moins 4 fois sur 5 (8 %)
- ✅ niveau 3-6 : le robot prudent échoue au moins 4 fois sur 5 (2 %)
- ✅ niveau 3-7 : le robot prudent échoue au moins 4 fois sur 5 (3 %)
- ✅ niveau 3-8 : le robot prudent échoue au moins 4 fois sur 5 (0 %)
- ✅ niveau 4-1 : le robot prudent échoue au moins 4 fois sur 5 (2 %)
- ✅ niveau 4-2 : le robot prudent échoue au moins 4 fois sur 5 (1 %)
- ✅ niveau 4-3 : le robot prudent échoue au moins 4 fois sur 5 (1 %)
- ✅ niveau 4-4 : le robot prudent échoue au moins 4 fois sur 5 (3 %)
- ✅ niveau 4-5 : le robot prudent échoue au moins 4 fois sur 5 (6 %)
- ✅ niveau 4-6 : le robot prudent échoue au moins 4 fois sur 5 (7 %)
- ✅ niveau 4-7 : le robot prudent échoue au moins 4 fois sur 5 (11 %)
- ✅ niveau 4-8 : le robot prudent échoue au moins 4 fois sur 5 (11 %)
- ✅ monde 1, niveau 3 : le moyen réussit environ 85 % (entre 78 et 92 %) (90 %)
- ✅ monde 1, niveau 1 (en douceur) : le débutant le finit presque à chaque fois (≥ 90 %) (100 %)
- ✅ monde 1, niveau 1 (en douceur) : le débutant le finit en moins de 45 s (29,6 s)
- ✅ monde 1 : mêmes résultats que la référence REF_W1 (réglée en v2.5), à 3 points près (plus gros écart 0 points)
- ✅ monde 2, niveau 1 : plus dur que le niveau 2 du monde 1, plus facile que son boss (moyen) (73 % (niveau 2 : 100 %, boss : 32 %))
- ✅ monde 3, niveau 1 : plus dur que le niveau 2 du monde 2, plus facile que son boss (moyen) (65 % (niveau 2 : 66 %, boss : 28 %))
- ✅ monde 4, niveau 1 : plus dur que le niveau 2 du monde 3, plus facile que son boss (moyen) (54 % (niveau 2 : 57 %, boss : 18 %))
<!-- tableau:fin -->
