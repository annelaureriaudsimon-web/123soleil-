# Tests

## Tests automatiques

Astuce : si les tests de sauvegarde échouent avec le Chromium de Playwright, lance-les avec ton Chrome : `CHROME=/chemin/vers/chrome python3 tools/tests/test_levels.py`.

| Quoi | Commande | Ce qui est vérifié |
|---|---|---|
| Simulation des 16 niveaux | `node tools/simulate.js` | Expert au moins 95 % partout, menace dans les 10 premières secondes, durées (25–35 s dans la cour, 30–40 s au parc, boss ≤ 45 s / ≤ 50 s), boss du moyen (15–35 % / 10–30 %), progression régulière, **niveau 1 en douceur : le débutant le finit au moins 90 % du temps, en moins de 45 s** (v2.2), niveau 1 du parc un peu plus dur que le niveau 4 de la cour, et **monde 1 identique à sa référence** (niveau 1 mis à jour en v2.2). 56 vérifications, toutes vertes. |
| Intégration Poki dans un vrai navigateur | `python3 tools/tests/test_poki.py` (Playwright, faux SDK `tools/tests/fake_poki_sdk.js`) | 162 vérifications (v2.4), détaillées plus bas. **162/162**, aucune erreur JavaScript. |
| Build Poki | `node tools/build-poki.js` | Fabrique `dist/poki/` et `dist/soleil-poki.zip`, puis vérifie : aucune adresse externe sauf le SDK, aucun lien sortant, `localStorage` toujours dans un try/catch, aucun `console.log` ni code de debug, moins de 8 Mo, `node --check` sur chaque JS, et chaque fichier entier après le retrait du debug. **TOUT EST OK.** |
| Mode Niveaux dans un vrai navigateur | `python3 tools/tests/test_levels.py` (Playwright) | 66 vérifications (40 pour le monde 1, 26 pour le monde 2), détaillées plus bas. **66/66**, aucune erreur JavaScript. |
| Comparaison avec la version d'avant, image par image | `python3 tools/tests/compare_frames.py <dossier de la v2.1>` | La course infinie et le monde 1 se dessinent exactement pareil (même graine, même hasard visuel, même robot ; SDK coupé, joueur qui revient). **94/94 images identiques** contre la v2.1 ; contre la v2.2 : 88/94, les 6 autres étant les images avec le vrai signal ou un mot piège à l'écran (étoile « POW » / mot rayé, v2.4). |
| Syntaxe | `for f in js/*.js js/*/*.js levels/*.js tools/*.js; do node --check $f; done` | Aucune erreur de syntaxe (63 fichiers du jeu + les outils). |

### Ce que vérifie `test_poki.py` (v2.2, v2.3 : tests 15 à 24 pour les corrections et les pubs récompensées, v2.4 : tests 25 à 29)

- **v2.4** — 25 grands écrans (1920×1080, 2560×1440, 2560×1080, 1680×1050, 1024×768 : interface agrandie, rien ne dépasse ; pause si la fenêtre change beaucoup) ; 26 même partie, même temps et même place à 30, 60 et 120 images/s ; 27 qualité qui baisse sur un processeur ralenti ×4 et ×6, seulement à un moment calme, et le réglage du menu pause ; 28 daltoniens (étoile « POW » mesurée en pixels derrière le vrai signal et le piège au début, plus d'étoile et un trait blanc sur le piège démasqué) ; 29 langues (les 6 langues ont tous les textes de l'anglais, les phrases des niveaux, missions et tenues, 12 mots pièges qui commencent comme le vrai signal ; même niveau joué par le même robot = même résultat au 1/10 000 de seconde dans les 6 langues ; même défi du jour ; bouton « FR » → carte des 6 langues → Deutsch sans recharger ; langue mémorisée ; pas de bouton de langue en partie).

- **1re visite** : directement le niveau 1 « prêt » (pas de titre, d'accueil ni de carte), main ou touche Espace, prêt en moins de 3 s ; rien ne bouge et aucun `gameplayStart` sans appui ; un appui → `gameplayStart`, une fois.
- **Niveau 1 en douceur** : « OUPS ! » au lieu de la défaite, il faut lâcher pour repartir ; à la fin, pas d'écran de résultats ni de pub, la petite carte d'intro du niveau 2 ; après le niveau 2, Suivant → la carte se présente, sans pub.
- **Joueur qui revient** : gros « CONTINUER – Niveau 3 », autres modes plus petits ; la carte d'intro attend l'appui.
- **Pause** dans chaque mode : Échap, P, bouton ⏸ ; menu (Recommencer le niveau / Carte, Recommencer / Accueil, pas de Recommencer dans le défi) ; monde figé ; reprise = `commercialBreak` + `gameplayStart` + 1 s de grâce immobile ; Recommencer ; Carte et Accueil sans événement de plus.
- **Pub** : jeu figé (le temps du jeu ne passe pas), son coupé, écran bloqué, clavier ignoré ; après : `gameplayStart`, son rendu, aucun appui fantôme ; le son coupé par le joueur le reste ; une pub ne change pas l'essai du défi.
- **Cas limites** : appui pendant le ralenti de la défaite, double tap très rapide sur Rejouer (une seule pub, un seul essai, relance en quelques ms), onglet caché et fenêtre quittée (une seule pause, un seul `gameplayStop`), casier ouvert depuis l'écran de fin, défi déjà joué, retour à la carte en plein niveau, 2 joueurs (GO, fin de manche, Revanche).
- **Sans SDK, bloqueur de pub, SDK qui ne répond pas** : le jeu marche pareil ; dans le dernier cas, le titre s'affiche pendant l'attente (2,5 s au plus).
- **La page ne défile jamais** (Espace, flèches, Page suivante, molette ; le casier défile à l'intérieur) ; **mode debug** (journal à l'écran, doublon affiché en rouge).
- **Dans une iframe** (comme sur Poki) : zone de la pilule protégée sur tactile, pas de décalage à la souris ; **aucune trace du partage** (v2.4 : ni bouton, ni lien, ni presse-papiers).
- **Le build Poki** (`dist/poki`) dans le navigateur, avec et sans SDK : 1re visite, appui, pause, reprise, et aucun mode debug dedans.
- **Le journal de tous les tests** : jamais deux fois le même événement de suite, rien pendant une pub, rien avant `gameLoadingFinished`.

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
| Anciennes suites de la course infinie, du défi du jour, des 2 joueurs, du casier et des tenues | v2.2 : V4 30/30, V3 55/55, mode solo V2 et test rapide V4 sans erreur. En 2 joueurs, deux vérifications suivent le changement voulu de la v2.2 : pendant le match, ⏸ remplace 🏠 et Échap ouvre la pause (qui a « Accueil »). |
| Course infinie, comparée image par image à la version d'avant (`compare_frames.py`) | 14 images sur 14 identiques au pixel près (portrait et paysage, de 0 à 900 m : boue, verglas, descente, décor). |
| Niveaux 1, 3, 5, 7 et 8 du monde 1, comparés image par image à la version d'avant (`compare_frames.py`) | 80 images sur 80 identiques au pixel près (portrait et paysage, boss compris). |
| Simulation | v2.2 : seul le niveau 1 change (débutant 66 % → 100 %, niveau en douceur). Les 7 autres niveaux du monde 1 et tout le monde 2 : mêmes chiffres qu'en v2.1, à 0 point près. |

## L'étape Poki 3 (v2.4) : 8 vérifications rapides sur ton téléphone et ton PC

1. **Plus de partage** : fin de course, résultats, défi du jour joué : aucun bouton Partager ni Image.
2. **Grand écran** : sur PC, mets le jeu en plein écran (ou une grande fenêtre) : les boutons et les panneaux grandissent, rien n'est coupé. Pendant une partie, passer en plein écran met le jeu en pause.
3. **Qualité** : menu pause → « Qualité : Auto » ; appuie pour passer à Haute, puis Basse (image un peu moins nette, moins de confettis), puis Auto.
4. **Daltoniens** : en course, « SOLEIL ! » a une étoile jaune pâle « POW » derrière lui ; un mot piège démasqué est rayé d'un trait blanc.
5. **Langue** : accueil → bouton rond « FR » → « English » : tout passe en anglais tout de suite, le chant devient « 1, 2, 3… RED… RED LIGHT! ». Recharge la page : toujours en anglais. Remets « Français ».
6. **Une autre langue** : `index.html?lang=de` (ou es, pt, it) : un niveau en entier, la défaite, les résultats, le casier, la pause : aucun texte qui dépasse, aucun texte français oublié.
7. **Voix** : en espagnol, active la voix 🗣️ en course infinie : elle compte en espagnol (si ton appareil a une voix espagnole ; sinon, message « No hay voz en español… » et les sons 8-bit).
8. **Miniatures** : `python3 tools/thumbnails/make.py --video` puis ouvre `dist/thumbnails/en/` : 9 images et une vidéo de 5 s.

## L'étape Poki 2 (v2.3) : 8 vérifications rapides sur ton téléphone et ton PC

Les pubs récompensées n'apparaissent qu'avec un SDK : teste-les sur la version dev avec `index.html?debug=1&fakead=1` (fausse vidéo de 2 s), ou dans le Poki Inspector.

1. **Fin de course, message** : fais une course libre le premier jour (« Série de 1 jour ») et fais-toi griller vite : le message est au-dessus du panneau, « Touche l'écran pour rejouer » reste lisible en bas.
2. **🎬 2e chance** (niveau 3) : fais-toi griller, appuie sur « 🎬 2e chance » : la fausse vidéo, puis tu repars exactement au même endroit, à l'arrêt, avec l'anneau. Refais-toi griller : plus de 🎬.
3. **Gagner après une 2e chance** : l'écran de résultats dit « ★★★ … (impossible après une 2e chance) ».
4. **🎬 Continuer** (course libre) : la course continue, la distance et le fantôme aussi ; à la 2e défaite, une seule partie est comptée.
5. **🎬 ×2 ⭐** : gagne un nouveau niveau : le nombre de ⭐ double, le bouton devient « ✓ Fait ».
6. **🎬 Essayer une tenue** : casier → une tenue verrouillée → « 🎬 Essayer » : badge « Essai », tu la portes à la course suivante, puis « Tu l'as aimée ? ».
7. **Sans SDK** (double-clic sur `index.html`, sans `?debug`) : aucun bouton 🎬 nulle part.
8. **Accueil sur petit écran** (PC à 640×360, petit téléphone) : « Niveaux », « Infini », « 2 joueurs » tiennent dans leur bouton.

## L'étape Poki 1 (v2.2) : 8 vérifications rapides sur ton téléphone et ton PC

1. **1re visite** : ouvre le jeu dans une fenêtre de navigation privée. Tu arrives directement dans le niveau 1 ; une main appuie sur l'écran (sur PC : une touche Espace s'enfonce). Un appui et ça part.
2. **« OUPS ! »** : dans le niveau 1, cours pendant que le soleil regarde. Tu recules en faisant la toupie, le soleil dit « VU ! » et rigole, la main lève le doigt : « LÂCHE ! ». Lâche, attends qu'il se retourne, repars.
3. **Enchaînement** : fin du niveau 1 → étoiles, puis la petite carte du niveau 2. Fin du niveau 2 → résultats → Suivant → la carte apparaît (« TA CARTE ! », puis une main sur le niveau 3).
4. **Pause** : pendant une partie, ⏸ (à côté du son), Échap ou P. Le menu : Reprendre, Recommencer, Carte/Accueil, Son. Reprendre : un anneau vert d'une seconde, tu repars à l'arrêt.
5. **Changer d'application** en pleine partie, puis revenir : le jeu t'attend en pause.
6. **Accueil** (quand tu reviens) : gros bouton vert « CONTINUER – Niveau X ».
7. **PC** : Espace, flèches et molette ne font jamais bouger la page ; les cartes disent « Clic ou Espace pour commencer ».
8. **Mode debug** : `index.html?debug=1` montre chaque événement Poki en bas à gauche (rien en rouge) ; `&fakead=1` montre une fausse pub de 2 s : tout s'arrête, plus de son, puis ça repart.

La liste complète à faire dans le Poki Inspector est dans `docs/POKI_INTEGRATION.md` (section 10).

## Le nouveau look (v2.1) : 5 vérifications rapides sur ton téléphone

1. **Accueil** : le logo en relief, les 4 gros boutons colorés et les pastilles du haut se lisent bien, en portrait et en paysage. Rien ne passe sous les boutons ronds (son, voix, casier).
2. **Appui** : chaque bouton s'enfonce quand on appuie (le relief disparaît), puis fait son travail.
3. **Casier** : les tenues sur la scène violette, les prix avec ⭐, « Portée ✓ » en vert ; une tenue trop chère tremble.
4. **Carte** : les tuiles orange avec leur numéro et leurs étoiles, les cadenas dorés, le chemin de pavés, les onglets des mondes ; toucher une tuile fermée la fait trembler.
5. **Fin de niveau** : gros bouton vert « Suivant », « Rejouer » orange, « Carte » blanc ; fin de partie : « Partager » vert, « Image » orange.

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
