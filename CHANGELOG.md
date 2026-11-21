# Journal des versions

## v2.1 — nouveau look « jeu mobile »

### Changé
- **Boutons** : couleurs vives, gros contours, relief en bas et icônes blanches dessinées en SVG (aucune image téléchargée). Les boutons ronds (son, voix, casier, accueil) sont bleus.
- **Accueil** : logo « 1, 2, 3… SOLEIL ! » en relief (contour bleu, ombre bleu nuit), gros bouton bleu « NIVEAUX » avec un rond ▶, « Défi du jour » orange, « Course infinie » violet, « 2 joueurs » rose. Les infos du haut deviennent des pastilles (rang, record, missions, étoiles, série).
- **Casier** : panneau turquoise, rang dans un bandeau bleu, missions et médailles sur des cartes blanches, tenues sur une petite scène violette avec leur prix (⭐).
- **Carte des niveaux** : tuiles orange en relief avec leur numéro et 3 étoiles au-dessus, tuiles marron avec un cadenas doré pour les niveaux fermés, chemin de pavés blancs, bandeau bleu et onglets ronds pour les mondes.
- **Cartes** (intro, défaite, victoire, fin de partie, 2 joueurs) : panneau bleu en relief (rose pour les boss). Gros bouton vert « Suivant », « Rejouer » orange, « Carte » blanc ; « Partager » vert et « Image » orange en fin de partie.
- Petits téléphones et paysage : les boutons de l'accueil se compactent pour laisser de la place au logo et ne pas passer sous les boutons ronds.

### Architecture
- Nouveau fichier `js/ui/icons.js` : les icônes en SVG (`S.icon(nom)`, `S.setIcon(bouton, nom)`), chargé avant les écrans.
- `css/style.css` : couleurs de boutons en classes (`c-blue`, `c-green`, `c-orange`, `c-purple`, `c-pink`, `c-white`), chacune avec 4 teintes (reflet, face, bas, contour).
- `js/render/hud.js` : `drawLogo()` dessine le logo une fois par taille, puis le recopie (rapide).
- Les textes des boutons n'ont plus d'emoji devant (l'icône est dessinée à côté), en français et en anglais.

### Inchangé (vérifié)
- Le jeu lui-même se dessine exactement comme avant : 94 images sur 94 identiques (course infinie et monde 1, `tools/tests/compare_frames.py`). L'outil de comparaison coupe maintenant le son, pour que le boss donne toujours les mêmes images.
- Tests du mode Niveaux 66/66, anciennes suites vertes, aucune erreur JavaScript.

## v2 — phase 2 : le monde 2 « Le parc » et les tentations

### Nouveau
- **Les tentations** : pendant que le soleil te regarde, il essaie de te faire bouger. Elles sont décrites niveau par niveau dans les données (lesquelles, à quelle fréquence, lesquelles sont forcées à quel cycle), et se combinent sans se gêner (jamais deux au même endroit de l'écran).
  - ⭐ **étoile tentatrice** : une étoile dorée qui scintille et tinte devant toi ; au vrai retour, elle s'envole (« Pfff… ») ;
  - 🙃 **faux retour** : il tourne à moitié en grinçant… puis revient d'un coup : « HA ! » ;
  - 🤧 **éternuement** : « Aaah… AAAH… ATCHOUM ! », les yeux fermés (« > < »), mais toujours tourné vers toi ;
  - 😜 **moqueries** : 12 bulles en français et en anglais, tirées sans se répéter ;
  - 🪰 **mouche** : elle bourdonne, se pose sur ta tête, tu trembles ;
  - 💥 **rival qui craque** : le rival le plus proche bouge, flash, « BOUM », grosse fumée.
- **La règle, jamais contredite** : « Tant que le soleil est tourné vers toi, NE BOUGE PAS, quoi qu'il arrive. » La carte de défaite dit quelle tentation t'a eu (« Il était encore tourné vers toi ! », « Faux retour ! Attends le « ding » 🔔 »…).
- **Le « ding » du vrai retour**, toujours le même : son « ding-ding », visage complètement caché, rayons qui font un tour rapide, anneau vert. Les fausses fins ne l'imitent jamais en entier.
- **Résister rapporte** : popup « SANG-FROID ! », +1 ⭐ par tentation résistée (versées si tu finis), compteur dans les résultats.
- **Départ éclair** : repartir moins de 0,35 s après le « ding ». Nouveaux objectifs `quick` (« Fais 3 départs éclair ») et `resist`.
- **Première rencontre** : une indication très courte au-dessus du coureur, une seule fois par tentation (`soleil.temptSeen`).
- **Faux dos dans les niveaux** : activable, avec une fréquence, ou forcé à un cycle. Un gros œil dépasse (bien visible sur téléphone, cercle rouge qui pulse) : « HMM… », puis « HOP ! ». Les rivaux peuvent se faire avoir.
- **Boue placée à la main** dans les niveaux (`mud: [[début, fin]]`) : vitesse ×0,55, démarrage lent. Elle ralentit aussi les rivaux. Gros « SPLOTCH » à l'entrée, éclaboussures et bruits mouillés à chaque pas.
- **Monde 2 « Le parc »** : 8 niveaux (33 à 39 s pour le joueur moyen, 46 s pour le boss), dont le **BOSS « Le Soleil Farceur »** 🤡 (lunettes-nez-moustache, musique de cirque 8-bit, 6 farces annoncées, victoire « Mon nez !! » avec feu d'artifice).
- **Décor du parc** : pelouses, allée en gravier, bancs, réverbères, fontaine, kiosque, chênes, sapins, bouleaux, cerisiers en fleurs, massifs de fleurs, un cerf-volant, et des pigeons qui s'envolent quand tu arrives.
- **Carte** : le parc (étang avec canards, fontaine, chemin des 8 niveaux). Il se débloque avec **12 étoiles du monde 1** : animation (cadenas qui saute, confettis, « MONDE 2 DÉBLOQUÉ ! »), puis la carte bascule sur le parc. Onglets pour passer d'un monde à l'autre.
- **Sons** (tous synthétisés, rien à télécharger) : ding, grincement, « HA », éternuement, moquerie, scintillement, « Pfff », boum, splotch, pigeons, « boing », sang-froid, départ éclair, bourdonnement de la mouche.
- **Simulation** : trait « sang-froid » pour les 3 profils et les rivaux, tentations, faux dos et boue. Tableau des deux mondes dans `docs/LEVELS.md`.
- **Tests automatiques** du monde 2 (8 groupes, 26 vérifications) dans `tools/tests/test_levels.py`, et un outil qui compare le dessin du jeu image par image avec une ancienne version (`tools/tests/compare_frames.py`).

### Changé (architecture)
- **Deuxième suite de dés** (`lookConfig` dans `js/game/match.js`) : tout ce qui est nouveau dans le regard (tentations, faux dos) tire ses dés dans une suite à part, `mixSeed(graine, 5000 + n)`. Les 16 dés du chant ne bougent pas : le monde 1 donne exactement les mêmes parties qu'en phase 1.
- **Le soleil d'un niveau** a deux états de plus pour le faux dos (`peek`, `hop`) et un 2e regard (`sun.second`). Le vrai retour passe par une seule fonction, `trueReturn()`, qui émet `return` puis `clear`.
- **Les cerveaux** (`js/game/rivals.js`) ont deux réglages de plus par profil : `crack` (craquer) et `learn` (une tentation déjà vue fait moins craquer), plus les tables `TEMPT_K` et `CRACK_AT`. `Match.create` accepte `brainSeen` (tentations déjà connues).
- **Mondes** : un monde peut demander des étoiles d'un autre (`need` dans `levels/worlds.js`). `Levels.worldOpen()` le vérifie.
- **Décor par monde** : `drawLevelDecor` et `tintLevel` (`js/render/tempt.js`) choisissent le décor et la palette selon le monde. `render/ground.js` : la flaque est sortie de `drawPatches` dans `drawPuddle`, qui sert aussi aux flaques des niveaux.
- **Musique** : `Music.start(morceau)` choisit entre `cool` (le boss du monde 1, inchangé) et `farceur`.
- **Nouveaux fichiers** : `levels/world2.js`, `js/render/park.js` (décor du parc), `js/render/tempt.js` (dessins des tentations), `docs/WORLD2_DESIGN.md`.
- **Nouvelles clés de sauvegarde** : `soleil.temptSeen`, `soleil.worldsShown`, `soleil.lastLevel`. Les anciennes sont relues telles quelles, et la progression du monde 2 va dans `soleil.levels`, au même format.
- **Accueil** : le bouton « ▶ NIVEAUX » affiche le total d'étoiles des deux mondes et le nom du monde le plus avancé.
- **Carte** : le monde 2 n'est plus « Bientôt » ; les mondes 3 à 5 le restent.

### Inchangé (vérifié)
- **Monde 1** : la simulation donne exactement les mêmes chiffres (écart 0 point sur 24 lignes). Les niveaux se dessinent pixel pour pixel comme en phase 1 (80 images comparées sur 5 niveaux, portrait et paysage, avec le nouvel outil `tools/tests/compare_frames.py`). Le « ding » et les « DÉPART ÉCLAIR ! » ne commencent qu'au parc (`SIGNAL_WORLD`).
- **Course infinie** : pixel pour pixel identique (boue, verglas, descente, décor, 14 images comparées).
- Défi du jour, casier, tenues, rangs, mode 2 joueurs, partage : anciennes suites de tests vertes.

## v2 — phase 1 : les niveaux (monde 1 « La cour de récré »)

### Nouveau
- **Mode Niveaux**, devenu le bouton principal de l'accueil (« ▶ NIVEAUX », avec le total d'étoiles).
- **Carte du monde**, dessinée en canvas :
  - la cour de récré, l'école et un chemin à la craie ;
  - 8 niveaux, avec étoiles gagnées et cadenas, et le boss au bout ;
  - ton personnage, avec ta tenue, sur le dernier niveau débloqué ;
  - les mondes 2 à 5 visibles mais verrouillés (« Bientôt ») ;
  - au clavier : flèches et Entrée.
- **Moteur de niveaux** (`js/game/match.js`), sans affichage et partagé avec la simulation :
  - ligne d'arrivée ;
  - victoire ou défaite ;
  - 3 étoiles par niveau (finir, objectif, défi) ;
  - une graine par essai : la disposition reste fixe, mais le rythme du chant varie.
- **Écrans du mode Niveaux** :
  - carte d'intro de 1 à 2 s, passable d'un tap ;
  - HUD : barre de progression avec les rivaux, position « 2e/4 », distance restante ;
  - carte de défaite : « Lâché 0,08 s trop tard ! », « À 6 m de l'arrivée ! », relance en moins d'une seconde ;
  - résultats : classement, étoiles qui s'allument une par une avec son et confettis, boutons Suivant, Rejouer et Carte.
- **Rivaux** :
  - 10 enfants, 3 personnalités (Prudent 🐢, Fonceur ⚡, Régulier 🎯), décisions humaines et avec graine ;
  - quand ils sont grillés : tout noirs, fumée, chute ou colère, bulle « Nooon ! », retour au départ, et le soleil rigole ;
  - indicateur de ceux qui sont derrière toi.
- **8 niveaux** :
  1. Premiers pas (tutoriel intégré) ;
  2. Les hésitations ;
  3. La pluie de pièges ;
  4. Le Fonceur ;
  5. Le bégaiement ;
  6. Le chant express ;
  7. La grande course ;
  8. **BOSS « Le Soleil Cool »**.
- **Le boss** : il met ses lunettes, il y a une musique 8-bit (baissée pendant le chant), ses coups spéciaux sont annoncés, et sa barre de vie se vide. Victoire : lunettes envolées, feu d'artifice et fanfare.
- **Décor du monde 1** : piste rouge dans une cour en bitume, marelles à la craie, bancs, paniers de basket, plots, ballons.
- **Simulation** `tools/simulate.js` : 3 profils de joueurs, 300 essais par niveau. Les objectifs de difficulté sont vérifiés automatiquement (voir `docs/LEVELS.md`).
- **Progression sauvegardée** (`soleil.levels`). Les nouvelles étoiles rapportent des ⭐ pour le casier.

### Changé
- **Projet découpé** en dossiers et fichiers (`js/core`, `audio`, `game`, `render`, `modes`, `ui`), avec un seul objet global, `window.Soleil`. Il marche toujours en double-cliquant `index.html`.
- **Physique** : le pas de physique est sorti dans `js/game/physics.js` (`kinStep`). Elle est partagée par la course infinie, les niveaux, les rivaux et la simulation, avec les mêmes valeurs.
- **Accueil** : « Partie libre » s'appelle maintenant « ♾️ Course infinie ». Le défi du jour reste juste en dessous.
- **Ligne d'arrivée** : `drawFinish` accepte une distance, et sert au mode 2 joueurs et aux niveaux.

### Inchangé (vérifié par les anciennes suites de tests)
- Course infinie : rangs, missions, médailles, boss, fantôme, étoiles flottantes, nuage, descente, voix.
- Défi du jour (le même pour tout le monde), partage en texte et en image, mode 2 joueurs, casier et tenues.
- Les anciennes sauvegardes sont relues telles quelles.
