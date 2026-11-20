# Tests

## Tests automatiques

| Quoi | Commande | Ce qui est vérifié |
|---|---|---|
| Simulation des 16 niveaux | `node tools/simulate.js` | Expert au moins 95 % partout, menace dans les 10 premières secondes, durées (25–35 s dans la cour, 30–40 s au parc, boss ≤ 45 s / ≤ 50 s), boss du moyen (15–35 % / 10–30 %), progression régulière, débutant 40–70 % au niveau 1, niveau 1 du parc un peu plus dur que le niveau 4 de la cour, et **monde 1 identique à la phase 1**. 55 vérifications, toutes vertes. |
| Mode Niveaux dans un vrai navigateur | `python3 tools/tests/test_levels.py` (Playwright) | 66 vérifications (40 pour le monde 1, 26 pour le monde 2), détaillées plus bas. **66/66**, aucune erreur JavaScript. |
| Comparaison avec la phase 1, image par image | `python3 tools/tests/compare_frames.py <dossier de la phase 1>` | La course infinie et le monde 1 se dessinent exactement pareil (même graine, même hasard visuel, même robot). **94/94 images identiques.** |
| Syntaxe | `for f in js/*.js js/*/*.js levels/*.js tools/*.js; do node --check $f; done` | Aucune erreur de syntaxe (57 fichiers). |

### Ce que vérifie la suite Playwright

Monde 1 (phase 1) :
- le parcours accueil → carte → niveau → résultats → niveau suivant ;
- la défaite chiffrée et la relance en moins d'une seconde ;
- la graine : même essai = mêmes événements ;
- le mot piège forcé, et l'absence de `Math.random()` dans le moteur, les cerveaux, la physique et les niveaux (monde 2 compris) ;
- l'équité : l'expert réussit 120 essais sur 120 sur chaque niveau ;
- les rivaux grillés, puis renvoyés au départ ;
- les cadenas, « Bientôt » (mondes 3 à 5) et le clavier sur la carte ;
- les anciennes sauvegardes intactes ;
- la mise en scène du boss ;
- l'anglais, le paysage et le petit écran ;
- le temps par image.

Monde 2 (phase 2) :
- **la règle** : bouger pendant l'éternuement (yeux fermés), le faux retour (à moitié tourné), l'œil du faux dos ou l'étoile = grillé, avec la bonne explication ;
- **le « ding »** n'arrive qu'aux vrais retours (710 vrais retours et 266 faux dos sur 125 essais) ; un faux dos passe toujours par l'œil avant le « HOP ! » ; les 6 tentations apparaissent ;
- **l'équité** : l'expert réussit au moins 95 essais sur 100 sur chacun des 8 niveaux du parc ;
- **la boue** : ×0,55 de la vitesse max, pour toi comme pour les rivaux ;
- **la carte** : monde 2 verrouillé avec le bon message, animation à 12 étoiles, niveau 1 ouvert et niveau 2 fermé, onglets ;
- **résister rapporte** : indication la 1re fois seulement, « SANG-FROID », ⭐ bonus versées, départs éclair comptés, progression du monde 2 sauvegardée ;
- **le Soleil Farceur** : intro, lunettes-nez-moustache, musique de cirque, farces annoncées, victoire ;
- **les textes** : tous les nouveaux textes existent en français et en anglais (aucun « undefined »).

### Le reste du jeu n'a pas bougé

| Quoi | Résultat |
|---|---|
| Anciennes suites de la course infinie, du défi du jour, des 2 joueurs, du casier et des tenues | V4 : 30/30. V3 : 54/54. Mode solo V2 et test rapide V4 : aucune erreur. |
| Course infinie, comparée image par image à la phase 1 (`compare_frames.py`) | 14 images sur 14 identiques au pixel près (portrait et paysage, de 0 à 900 m : boue, verglas, descente, décor). |
| Niveaux 1, 3, 5, 7 et 8 du monde 1, comparés image par image à la phase 1 (`compare_frames.py`) | 80 images sur 80 identiques au pixel près (portrait et paysage, boss compris). |
| Simulation du monde 1 | Mêmes chiffres qu'en phase 1, à 0 point près, sur les 24 lignes du tableau. |

## Les 10 tests manuels les plus importants de la phase 2 (sur ton téléphone)

1. **Le parc se débloque.** Avant 12 ★ dans la cour : touche l'onglet « 2 » de la carte, le message « Gagne 12 ★ dans le monde 1 pour le débloquer 🔒 » s'affiche. Gagne la 12e étoile, puis reviens sur la carte :
   - le cadenas saute, confettis, « MONDE 2 DÉBLOQUÉ ! », et la carte bascule sur le parc ;
   - ferme et rouvre la carte : l'animation ne revient pas ;
   - les onglets 1 et 2 passent d'un monde à l'autre.
2. **Le « ding » (niveau 2-1).** À chaque vrai retour : « ding-ding », anneau vert, rayons qui font un tour rapide, plus aucun visage.
   - Repars juste après : « DÉPART ÉCLAIR ! ».
   - Coupe le son 🔊 : l'anneau vert et le visage caché suffisent-ils pour savoir quand repartir ?
3. **L'étoile tentatrice (2-1).**
   - La 1re fois seulement : « Il veut que tu bouges… NE BOUGE PAS ! » au-dessus du coureur.
   - Ne bouge pas : « SANG-FROID ! +1 ⭐ », l'étoile s'envole (« Pfff… »).
   - Bouge : grillé, « L'étoile était un piège 😏 ».
   - L'étoile ne doit jamais être cachée par ton personnage.
4. **Le faux retour (2-2).** Il tourne à moitié en grinçant… « HA ! ».
   - On ne doit pas pouvoir le confondre avec le vrai retour : pas de « ding », pas d'anneau, le visage reste à moitié visible.
   - Bouge pendant : « Faux retour ! Attends le « ding » 🔔 ».
5. **L'éternuement (2-6, ou la 1re farce du boss).** « Aaah… AAAH… ATCHOUM ! », avec les yeux fermés (« > < »).
   - Bouge pendant que ses yeux sont fermés : « Il était encore tourné vers toi ! ».
6. **La mouche et les moqueries (2-3).**
   - La mouche bourdonne, se pose sur la tête du coureur et il tremble. Elle doit rester visible sur un petit écran.
   - Les bulles de moquerie se lisent en portrait (sous le soleil) et ne cachent pas le chant.
   - La même phrase ne revient pas deux fois de suite.
7. **Le faux dos (2-5).** Le soleil tourne presque de dos, « HMM… », un gros œil dépasse avec un cercle rouge.
   - L'œil doit être bien visible sur téléphone, même en plein soleil.
   - Repars sur l'œil : « HOP ! », grillé, « Il faisait semblant ! Attends le « ding » 🔔 ».
   - Hugo ⚡ se fait parfois avoir.
8. **La boue (2-4).**
   - 1re flaque : gros « SPLOTCH » et bannière « BOUE ! ».
   - Dans la flaque, on repart au ralenti, avec des éclaboussures marron et des bruits mouillés.
   - Les rivaux ralentissent aussi dans les flaques.
9. **La grande course du parc (2-7), en paysage.**
   - 5 rivaux, de la boue et des tentations mélangées : deux tentations ne doivent jamais se superposer au même endroit.
   - Quand un rival craque : flash, « BOUM », grosse fumée, et le soleil rigole.
   - Rien ne doit saccader sur un téléphone moyen, même avec les pigeons et la fumée.
10. **Le Soleil Farceur (2-8), puis la cour.**
    - Intro « Tu vas rire… ou pleurer ! », lunettes-nez-moustache (« BOING »), musique de cirque qui baisse quand il chante, 6 farces annoncées.
    - Victoire : « Mon nez !! », feu d'artifice, « SOLEIL FARCEUR BATTU ! 🤡 », « Monde 2 terminé ! ».
    - Les ⭐ de sang-froid s'ajoutent bien au total du casier.
    - Rejoue ensuite un niveau de la cour : il doit être exactement comme avant (pas de « ding »).

## À vérifier aussi, si tu as le temps

- **Appareil en anglais** : tentations, indications, cartes de défaite et boss du parc sont traduits (« NERVES OF STEEL! », « He was still facing you! »).
- **PC** : Espace ou ↑ pour courir ; sur la carte, ← → puis Entrée ; Échap = retour.
- **Ancienne sauvegarde** : ton record, tes tenues, tes ⭐ et ta progression du monde 1 sont toujours là.
- **Les tests manuels de la phase 1** (tutoriel du niveau 1, défaite et relance, rivaux, boss du monde 1, anciens modes) restent valables : rejoue-les de temps en temps.

## Les 10 tests manuels de la phase 1 (toujours valables)

1. **Ouvrir sans connexion.** Coupe le Wi-Fi et les données, ouvre `index.html` (ou ton lien en ligne), touche **▶ NIVEAUX**. La carte s'affiche : la cour, l'école, les 8 ronds, le parc (verrouillé tant que tu n'as pas 12 ★) et les mondes 3 à 5 « Bientôt ».
2. **Le tutoriel du niveau 1, sans lire de règles.** « MAINTIENS pour courir 👆 » disparaît dès que tu maintiens ; « LÂCHE ! » s'affiche au premier « SO » ; au 2e chant, le mot piège et la bannière « PIÈGE ! Il n'a pas dit SOLEIL 😏 ».
3. **Défaite claire et relance immédiate.** Cours sans t'arrêter : « GRILLÉ ! », la carte dit pourquoi et à combien de l'arrivée ; un tap relance tout de suite, sans carte d'intro.
4. **Victoire.** Confettis, étoiles qui s'allument une par une avec un son, classement, boutons Suivant / Rejouer / Carte, étoiles visibles ensuite sur la carte.
5. **Les rivaux.** Au niveau 2, Hugo ⚡ repart souvent pendant les longs « SOOOO… » ; grillé, il devient noir, fume, dit « Nooon ! » et repart du début ; le soleil rigole.
6. **Le boss du monde 1.** Lunettes qui tombent du ciel, musique qui baisse pendant le chant, coups spéciaux annoncés, victoire avec lunettes envolées, feu d'artifice et fanfare.
7. **Fluidité.** Au niveau 7 (5 rivaux), rien ne doit saccader, même quand un rival fume.
8. **Portrait et paysage.** Sur la carte, puis pendant un niveau : barre de progression à gauche en paysage, chant lisible, cartes qui tiennent à l'écran.
9. **Les anciens modes, exactement comme avant.** Course infinie, défi du jour (un seul essai), 2 joueurs, casier ; ton record et tes tenues sont toujours là.
10. **Son coupé et retour en arrière.** 🔊 coupe aussi la musique du boss ; 🏠 ramène à la carte puis à l'accueil ; quitter l'appli puis revenir ne bloque pas le jeu.
