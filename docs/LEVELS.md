# Résultats de la simulation — Mondes 1 et 2

Commande : `node tools/simulate.js --md docs/LEVELS.md`. Elle est rapide : environ 20 s pour 14 400 essais (2 mondes × 8 niveaux × 3 profils × 300 essais).
Options : `--world 2` (un seul monde), `--level w2-8` (un seul niveau), `--n 1000` (plus d'essais).

La simulation charge **les mêmes fichiers que le navigateur**, sans les recopier :
- `game/match.js` : le moteur d'un niveau ;
- `game/chant.js` : le chant ;
- `game/physics.js` : la physique ;
- `game/rivals.js` : les cerveaux ;
- `levels/*.js` : les données des niveaux.

Le joueur simulé est piloté par un « cerveau », comme les rivaux.

## Les trois profils

Ils sont définis dans `js/game/rivals.js` (`PROFILES`).

| Profil | Réaction | Comportement | Sang-froid (monde 2) |
|---|---|---|---|
| Expert | 0,20 s ± 0,03 | Lâche dès qu'il voit « SO ». Repart dès que le soleil se remet de dos, ou dès qu'il lit un mot piège. | Craque 1,5 % × la tentation (1,8 % sur une fausse fin), ×0,1 une fois la tentation connue. |
| Moyen | 0,28 s ± 0,06 | Lâche à « SO » une fois sur deux, sinon il attend le mot. Après un piège, il se méfie : il attend plus souvent le mot. Il s'arrête sur 35 % des mots pièges et, une fois sur trois, perd patience pendant un long « SOOOO… » et repart. | Craque 15 % × la tentation, ×0,4 une fois connue. |
| Débutant | 0,35 s ± 0,10 | Lâche seulement quand il lit « SOLEIL ! ». S'arrête parfois sur un mot piège (20 %). | Craque 35 % × la tentation, ×0,7 une fois connue. |

Le sang-froid ne sert que dans le monde 2 (le monde 1 n'a pas de tentations). Les multiplicateurs par tentation, le moment où l'on craque et la raison de ces choix sont dans `docs/WORLD2_DESIGN.md` (« Le sang-froid »). Dans le monde 2, les trois profils attendent le vrai retour (le « ding ») pour repartir : le faux retour et le faux dos ne les font repartir que s'ils craquent.

Ce qui grille un joueur : être encore en mouvement quand le soleil a fini de se retourner. À 8 m/s, il faut 0,2 s pour s'arrêter. Celui qui attend « SOLEIL ! » doit donc réagir en moins de « demi-tour − 0,2 s ».

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
| 1. Premiers pas | Expert | 100 % | 29,3 s | 1,00 / 3 | — | 100 % | 0 % |
| 1. Premiers pas | Moyen | 100 % | 27,3 s | 1,00 / 3 | — | 100 % | 33 % |
| 1. Premiers pas | Débutant | 100 % | 27,0 s | 1,00 / 3 | — | 100 % | 86 % |
| 2. Les hésitations | Expert | 100 % | 35,1 s | 1,81 / 3 | — | 100 % | 0 % |
| 2. Les hésitations | Moyen | 99 % | 28,5 s | 1,73 / 3 | lâché trop tard (100 %) | 99 % | 71 % |
| 2. Les hésitations | Débutant | 59 % | 25,6 s | 1,68 / 3 | lâché trop tard (98 %) | 59 % | 59 % |
| 3. La pluie de pièges | Expert | 100 % | 30,6 s | 1,40 / 4 | — | 0 % | 0 % |
| 3. La pluie de pièges | Moyen | 92 % | 28,5 s | 1,06 / 4 | lâché trop tard (100 %) | 26 % | 1 % |
| 3. La pluie de pièges | Débutant | 35 % | 27,2 s | 1,00 / 4 | lâché trop tard (96 %) | 32 % | 16 % |
| 4. Le Fonceur | Expert | 100 % | 32,9 s | 1,28 / 3 | — | 72 % | 27 % |
| 4. Le Fonceur | Moyen | 88 % | 30,4 s | 1,28 / 3 | lâché trop tard (100 %) | 64 % | 74 % |
| 4. Le Fonceur | Débutant | 12 % | 29,1 s | 1,27 / 3 | lâché trop tard (96 %) | 9 % | 12 % |
| 5. Le bégaiement | Expert | 100 % | 31,5 s | 1,39 / 4 | — | 96 % | 0 % |
| 5. Le bégaiement | Moyen | 76 % | 30,6 s | 1,27 / 4 | lâché trop tard (100 %) | 74 % | 50 % |
| 5. Le bégaiement | Débutant | 6 % | 30,4 s | 1,24 / 4 | lâché trop tard (94 %) | 6 % | 6 % |
| 6. Le chant express | Expert | 100 % | 31,4 s | 1,33 / 4 | — | 0 % | 70 % |
| 6. Le chant express | Moyen | 63 % | 30,4 s | 1,27 / 4 | lâché trop tard (100 %) | 60 % | 48 % |
| 6. Le chant express | Débutant | 3 % | 29,8 s | 1,10 / 4 | lâché trop tard (93 %) | 3 % | 3 % |
| 7. La grande course | Expert | 100 % | 34,0 s | 1,79 / 6 | — | 99 % | 39 % |
| 7. La grande course | Moyen | 50 % | 31,1 s | 1,29 / 6 | lâché trop tard (100 %) | 50 % | 37 % |
| 7. La grande course | Débutant | 3 % | 28,9 s | 1,20 / 6 | lâché trop tard (91 %) | 3 % | 3 % |
| 8. Le Soleil Cool | Expert | 100 % | 44,6 s | 1,52 / 4 | — | 0 % | 52 % |
| 8. Le Soleil Cool | Moyen | 32 % | 38,0 s | 1,13 / 4 | lâché trop tard (100 %) | 32 % | 28 % |
| 8. Le Soleil Cool | Débutant | 1 % | 34,9 s | 1,00 / 4 | lâché trop tard (92 %) | 1 % | 1 % |

### Monde 2 — Le parc

| Niveau | Profil | Réussite | Durée moyenne (réussites) | Position moyenne | Défaite la plus fréquente | ★★ | ★★★ |
|---|---|---|---|---|---|---|---|
| 1. L’étoile tentatrice | Expert | 98 % | 34,3 s | 1,19 / 3 | craqué : étoile (100 %) | 98 % | 79 % |
| 1. L’étoile tentatrice | Moyen | 76 % | 32,6 s | 1,18 / 3 | craqué : étoile (79 %) | 76 % | 62 % |
| 1. L’étoile tentatrice | Débutant | 6 % | 31,9 s | 1,22 / 3 | lâché trop tard (65 %) | 2 % | 5 % |
| 2. Le faux retour | Expert | 97 % | 34,6 s | 1,42 / 3 | craqué : faux retour (100 %) | 97 % | 90 % |
| 2. Le faux retour | Moyen | 73 % | 32,7 s | 1,20 / 3 | craqué : faux retour (78 %) | 72 % | 72 % |
| 2. Le faux retour | Débutant | 8 % | 31,9 s | 1,13 / 3 | lâché trop tard (63 %) | 2 % | 8 % |
| 3. La mouche et les moqueries | Expert | 98 % | 36,8 s | 1,59 / 4 | craqué : moquerie (60 %) | 91 % | 0 % |
| 3. La mouche et les moqueries | Moyen | 71 % | 34,0 s | 1,25 / 4 | lâché trop tard (52 %) | 70 % | 37 % |
| 3. La mouche et les moqueries | Débutant | 4 % | 31,7 s | 1,17 / 4 | lâché trop tard (84 %) | 4 % | 4 % |
| 4. Les flaques de boue | Expert | 100 % | 39,5 s | 1,46 / 4 | — | 95 % | 58 % |
| 4. Les flaques de boue | Moyen | 69 % | 37,5 s | 1,23 / 4 | lâché trop tard (63 %) | 68 % | 55 % |
| 4. Les flaques de boue | Débutant | 5 % | 35,7 s | 1,27 / 4 | lâché trop tard (76 %) | 5 % | 4 % |
| 5. Le faux dos | Expert | 97 % | 39,3 s | 1,36 / 4 | faux dos (HOP !) (78 %) | 97 % | 28 % |
| 5. Le faux dos | Moyen | 58 % | 37,3 s | 1,09 / 4 | faux dos (HOP !) (54 %) | 57 % | 35 % |
| 5. Le faux dos | Débutant | 2 % | 35,2 s | 1,00 / 4 | lâché trop tard (65 %) | 1 % | 2 % |
| 6. Le grand jeu du Farceur | Expert | 96 % | 41,7 s | 1,11 / 4 | craqué : éternuement (85 %) | 0 % | 85 % |
| 6. Le grand jeu du Farceur | Moyen | 50 % | 39,2 s | 1,04 / 4 | craqué : éternuement (36 %) | 46 % | 48 % |
| 6. Le grand jeu du Farceur | Débutant | 1 % | 43,0 s | 1,50 / 4 | lâché trop tard (64 %) | 1 % | 0 % |
| 7. La grande course du parc | Expert | 99 % | 43,1 s | 1,31 / 6 | faux dos (HOP !) (50 %) | 99 % | 72 % |
| 7. La grande course du parc | Moyen | 41 % | 39,4 s | 1,06 / 6 | lâché trop tard (65 %) | 41 % | 39 % |
| 7. La grande course du parc | Débutant | 1 % | 35,3 s | 1,00 / 6 | lâché trop tard (67 %) | 1 % | 1 % |
| 8. Le Soleil Farceur | Expert | 97 % | 50,4 s | 1,03 / 4 | craqué : faux retour (33 %) | 97 % | 94 % |
| 8. Le Soleil Farceur | Moyen | 24 % | 46,0 s | 1,00 / 4 | lâché trop tard (57 %) | 23 % | 24 % |
| 8. Le Soleil Farceur | Débutant | 0 % | — | — | lâché trop tard (72 %) | 0 % | 0 % |

Objectifs vérifiés :

- ✅ niveau 1-1 : l'expert réussit au moins 95 % (100 %)
- ✅ niveau 1-2 : l'expert réussit au moins 95 % (100 %)
- ✅ niveau 1-3 : l'expert réussit au moins 95 % (100 %)
- ✅ niveau 1-4 : l'expert réussit au moins 95 % (100 %)
- ✅ niveau 1-5 : l'expert réussit au moins 95 % (100 %)
- ✅ niveau 1-6 : l'expert réussit au moins 95 % (100 %)
- ✅ niveau 1-7 : l'expert réussit au moins 95 % (100 %)
- ✅ niveau 1-8 : l'expert réussit au moins 95 % (100 %)
- ✅ niveau 2-1 : l'expert réussit au moins 95 % (98 %)
- ✅ niveau 2-2 : l'expert réussit au moins 95 % (97 %)
- ✅ niveau 2-3 : l'expert réussit au moins 95 % (98 %)
- ✅ niveau 2-4 : l'expert réussit au moins 95 % (100 %)
- ✅ niveau 2-5 : l'expert réussit au moins 95 % (97 %)
- ✅ niveau 2-6 : l'expert réussit au moins 95 % (96 %)
- ✅ niveau 2-7 : l'expert réussit au moins 95 % (99 %)
- ✅ niveau 2-8 : l'expert réussit au moins 95 % (97 %)
- ✅ niveau 1-1 : menace dans les 10 premières secondes (1er SOLEIL ≤ 3.9 s)
- ✅ niveau 1-2 : menace dans les 10 premières secondes (1er SOLEIL ≤ 6.6 s)
- ✅ niveau 1-3 : menace dans les 10 premières secondes (1er SOLEIL ≤ 7.1 s)
- ✅ niveau 1-4 : menace dans les 10 premières secondes (1er SOLEIL ≤ 6.2 s)
- ✅ niveau 1-5 : menace dans les 10 premières secondes (1er SOLEIL ≤ 4.8 s)
- ✅ niveau 1-6 : menace dans les 10 premières secondes (1er SOLEIL ≤ 3.5 s)
- ✅ niveau 1-7 : menace dans les 10 premières secondes (1er SOLEIL ≤ 7.8 s)
- ✅ niveau 1-8 : menace dans les 10 premières secondes (1er SOLEIL ≤ 5.1 s)
- ✅ niveau 2-1 : menace dans les 10 premières secondes (1er SOLEIL ≤ 5.3 s)
- ✅ niveau 2-2 : menace dans les 10 premières secondes (1er SOLEIL ≤ 5.3 s)
- ✅ niveau 2-3 : menace dans les 10 premières secondes (1er SOLEIL ≤ 6.2 s)
- ✅ niveau 2-4 : menace dans les 10 premières secondes (1er SOLEIL ≤ 5.3 s)
- ✅ niveau 2-5 : menace dans les 10 premières secondes (1er SOLEIL ≤ 5.2 s)
- ✅ niveau 2-6 : menace dans les 10 premières secondes (1er SOLEIL ≤ 5.2 s)
- ✅ niveau 2-7 : menace dans les 10 premières secondes (1er SOLEIL ≤ 6.1 s)
- ✅ niveau 2-8 : menace dans les 10 premières secondes (1er SOLEIL ≤ 5.8 s)
- ✅ niveau 1-1 : durée (moyen) entre 25 et 35 s (27,3 s)
- ✅ niveau 1-2 : durée (moyen) entre 25 et 35 s (28,5 s)
- ✅ niveau 1-3 : durée (moyen) entre 25 et 35 s (28,5 s)
- ✅ niveau 1-4 : durée (moyen) entre 25 et 35 s (30,4 s)
- ✅ niveau 1-5 : durée (moyen) entre 25 et 35 s (30,6 s)
- ✅ niveau 1-6 : durée (moyen) entre 25 et 35 s (30,4 s)
- ✅ niveau 1-7 : durée (moyen) entre 25 et 35 s (31,1 s)
- ✅ niveau 1-8 : durée (moyen) ≤ 45 s (38,0 s)
- ✅ niveau 2-1 : durée (moyen) entre 30 et 40 s (32,6 s)
- ✅ niveau 2-2 : durée (moyen) entre 30 et 40 s (32,7 s)
- ✅ niveau 2-3 : durée (moyen) entre 30 et 40 s (34,0 s)
- ✅ niveau 2-4 : durée (moyen) entre 30 et 40 s (37,5 s)
- ✅ niveau 2-5 : durée (moyen) entre 30 et 40 s (37,3 s)
- ✅ niveau 2-6 : durée (moyen) entre 30 et 40 s (39,2 s)
- ✅ niveau 2-7 : durée (moyen) entre 30 et 40 s (39,4 s)
- ✅ niveau 2-8 : durée (moyen) ≤ 50 s (46,0 s)
- ✅ monde 1 : le moyen réussit le boss 15 à 35 % (32 %)
- ✅ monde 1 : la difficulté monte régulièrement (moyen : jamais plus de 20 points d’écart, jamais plus facile) (plus gros saut 18 points)
- ✅ monde 2 : le moyen réussit le boss 10 à 30 % (24 %)
- ✅ monde 2 : la difficulté monte régulièrement (moyen : jamais plus de 20 points d’écart, jamais plus facile) (plus gros saut 18 points)
- ✅ monde 1, niveau 1 (en douceur) : le débutant le finit presque à chaque fois (≥ 90 %) (100 %)
- ✅ monde 1, niveau 1 (en douceur) : le débutant le finit en moins de 45 s (27,0 s)
- ✅ monde 1 : mêmes résultats que la référence REF_W1 (phase 1 ; niveau 1 en douceur depuis la v2.2), à 3 points près (plus gros écart 0 points)
- ✅ monde 2, niveau 1 : un peu plus dur que le niveau 4 du monde 1 (moyen : 2 à 15 points de moins) (76 % contre 88 %)
<!-- tableau:fin -->
