# La courbe de difficulté (v2.5)

Les 8 nouveautés de la v2.5 (plus de « SO », le coucher du soleil, les transats, la glace qui fond, l'avion menteur,
le reflet dans l'eau, la fausse alerte, le troupeau, le recomptage) sont réparties dans les 3 mondes et la course
infinie pour que la difficulté **monte petit à petit**. Ce fichier dit les objectifs, où chaque piège arrive, ce que
donne la simulation, et ce qui n'est **pas** encore vérifié. Les pièges eux-mêmes sont décrits dans
`docs/TRAPS_DESIGN.md`.

## Les objectifs (simulation, au moins 300 essais par niveau)

| Joueur simulé | Objectif |
|---|---|
| Expert | au moins 95 % de réussite **partout** (sinon le niveau est injuste) |
| Moyen | environ 85 % au début, 25–35 % au boss du monde 1 ; chaque monde commence un peu plus dur que le début du monde d'avant, mais plus facile que son boss ; 10–20 % au dernier boss |
| Robot prudent | il s'arrête à chaque « 3 » et attend toujours le « ding » : il échoue au moins une fois sur deux à la fin du monde 1, au moins 4 fois sur 5 dans les mondes 2 et 3, et n'a **jamais** ★★★ |
| Durées | 25 à 40 s par niveau (monde 1 : 25–35 s ; mondes 2 et 3 : 30–42 s) ; boss : 45 s au plus au monde 1, 50 s ensuite |

## Les joueurs simulés

Ils sont dans `js/game/rivals.js` (`PROFILES`) et pilotent le **vrai moteur** (`js/game/match.js`), sans affichage.

| Profil | Réaction | Comment il joue | Sang-froid |
|---|---|---|---|
| Expert | 0,20 s ± 0,03 | Lit le mot : s'arrête sur « SOLEIL ! », court à travers les mots pièges. Repart au « ding ». | Craque 1,5 % × la tentation, ×0,1 une fois connue |
| Moyen | 0,28 s ± 0,06 | S'arrête dès le « 3 » une fois sur trois ; s'arrête sur 35 % des mots pièges ; perd parfois patience pendant un long « 3… » | 15 %, ×0,4 une fois connue |
| Débutant | 0,35 s ± 0,10 | Attend toujours le mot, réagit lentement | 35 %, ×0,7 une fois connue |
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
| **Monde 1 — moyen** | 100 | 100 | 86 | 77 | 81 | 63 | 50 | **31** |
| Monde 1 — expert | 100 | 100 | 100 | 98 | 100 | 100 | 99 | 100 |
| Monde 1 — débutant | 100 | 91 | 75 | 19 | 17 | 6 | 6 | 3 |
| Monde 1 — prudent | 100 | 100 | 0 | 0 | 1 | 0 | 0 | 0 |
| **Monde 2 — moyen** | 66 | 62 | 55 | 51 | 46 | 50 | 38 | **27** |
| Monde 2 — expert | 99 | 98 | 99 | 99 | 98 | 97 | 97 | 97 |
| Monde 2 — prudent | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| **Monde 3 — moyen** | 59 | 57 | 49 | 44 | 41 | 45 | 34 | **17** |
| Monde 3 — expert | 100 | 99 | 99 | 99 | 97 | 99 | 98 | 97 |
| Monde 3 — prudent | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

Ce que ça veut dire :
- **Le monde 1** commence en douceur (100 % au 1-1 et au 1-2), le 1-3 est à 86 % (visé : environ 85 %), le boss à 31 %
  (visé : 25–35 %).
- **Chaque monde commence un peu plus dur** que le début du monde d'avant, mais plus facile que son boss : parc 66 %
  (cour : 100 %, Soleil Cool : 31 %), plage 59 % (parc : 66 et 62 %, Soleil Farceur : 27 %).
- **Le dernier boss** (Soleil Vacancier) : 17 % pour le moyen (visé : 10–20 %).
- Dans un monde, la difficulté monte sans saut de plus de 20 points ; deux niveaux peuvent être presque égaux (1-5 est à
  4 points au-dessus du 1-4 : la règle de la simulation tolère 5 points).
- **L'expert** réussit au moins 97 % partout.
- **Le robot prudent** finit le 1-1 et le 1-2 (aucune pression), mais échoue dès le 1-3 : la nuit tombe. Il n'a jamais
  ★★★, et ne finit plus aucun niveau des mondes 2 et 3. « S'arrêter tout le temps » ne marche plus.
- **Durées** (moyen, réussites) : 29 à 34 s dans la cour, 34 à 41 s au parc, 33 à 40 s à la plage ; boss 37, 47 et 44 s.

Le tableau complet (durée, position, défaite la plus fréquente, ★★, ★★★) est dans `docs/LEVELS.md`.

## Ce que j'ai réglé, et pourquoi

1. **Les demi-tours** (le temps pour lire, réagir et freiner après le mot) ont été rallongés quand le « SO » a disparu :
   sinon même l'expert n'avait plus le temps. Puis réglés niveau par niveau pour la courbe.
2. **La nuit** (`night`) est le grand réglage de la pression : assez large pour que l'expert finisse toujours, assez
   courte pour que le robot prudent n'arrive jamais. Par exemple 3-6 : 42 s laissait l'expert à 93 % dans le test du
   navigateur (100 essais) ; 42,8 s le remet à 98–99 %, et le moyen passe de 42 à 45 %.
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
node tools/simulate.js                       # les 3 mondes, 300 essais × 4 joueurs, ~70 s ; 126 vérifications
node tools/simulate.js --world 3             # un seul monde
node tools/simulate.js --level w3-6 --n 1000 # un seul niveau, plus précis
node tools/simulate.js --md docs/LEVELS.md   # réécrit le tableau de docs/LEVELS.md
```

La simulation compare aussi le monde 1 à sa référence `REF_W1` (`tools/simulate.js`, réglée en v2.5) : si un
changement fait bouger la cour de plus de 3 points, elle le dit.

Dans le navigateur, `test_levels.py` refait l'équité avec le vrai jeu (tests 4, 13 et 23 : l'expert, 100 ou 120
essais par niveau ; le robot prudent, 30 essais par niveau de la plage).

## Ce qui n'est PAS encore vérifié

- **Le ressenti sur un vrai téléphone.** La simulation dit si c'est juste et à quel point c'est dur pour des
  « cerveaux » réglés à la main ; elle ne dit pas si c'est amusant, ni si un vrai enfant lit le reflet ou la banderole
  à temps. À tester en vrai (`docs/TESTS.md`, section v2.5).
- **La fréquence des faux signaux en course infinie** : réglée pour qu'ils arrivent (le test 27 les voit), pas encore
  sur de vraies parties.
- **Le reflet sur un petit écran**, en plein soleil : il est plus marqué en qualité basse, mais à regarder sur un vrai
  téléphone.
- **Le son** (avion, cri, galop, calypso du boss) : écouté seulement par les tests (ils vérifient qu'il joue, pas qu'il
  est agréable).
