# Journal des versions

## v2.5.1 — la nuit et la 2e chance, la difficulté réglée sur un vrai joueur

Le retour du joueur après la v2.5 : « Quand on met la pub seconde chance, la nuit continue de descendre ; la nuit tombe
aussi beaucoup trop vite à partir du niveau 7. »

### Corrigé : la 2e chance quand la nuit tombe
- Avant : « +10 s de jour ». Le soleil remontait à peine, continuait de descendre, et la nuit retombait 10 s plus tard.
- Maintenant : après la vidéo, **le soleil remonte** (en 1,6 s, bien au-dessus de l'horizon) **et ne se couche plus**
  pendant cet essai. La barre de la nuit disparaît. Le bouton dit « 🎬 Le soleil remonte », et « LE SOLEIL RESTE
  LEVÉ ! » s'affiche (6 langues).
- Pareil après une 2e chance quand on a été grillé dans un niveau avec la nuit : sinon la nuit pouvait tomber juste
  après la pub.
- Quand la nuit tombe, le gros titre dit « LA NUIT TOMBE ! » (et plus de transat : « PLUS DE TRANSAT ! »), plus
  « GRILLÉ ! » : on n'a pas bougé devant le soleil.

### Changé : la difficulté, réglée sur un vrai joueur
- **Pourquoi la nuit tombait trop vite.** Le joueur « moyen » de la simulation lisait le mot en 0,28 s. Sur un vrai
  téléphone, lire « SOLEIL ! » (et pas « SOLDES ! », qui commence pareil) prend plutôt 0,36 s. Les demi-tours étaient
  donc trop courts pour lire à temps : on s'arrêtait à chaque « 3 » par prudence… et la nuit, réglée sur ce moyen trop
  rapide, tombait avant l'arrivée. Avec un joueur à 0,36 s, la nuit faisait perdre jusqu'à 3 essais réussis sur 4.
- **Le moyen est recalibré** : il lit le mot en 0,36 s et repart au « ding » en 0,29 s (le débutant lit en 0,45 s).
- **Les demi-tours sont plus longs** presque partout (+0,04 à +0,14 s ; le 1-1 et le 1-3 gardent à peu près les leurs) :
  le temps de lire le mot, puis de freiner.
- **Les nuits sont plus longues** : de +2 à +10 s (1-7 : 35,8 → 40,5 s ; boss du monde 1 : 39,6 → 49 s ; boss de la
  plage : 48 → 58 s). La nuit fait perdre au plus 5 % des essais du moyen (vérifié par la simulation) ; elle punit
  toujours celui qui s'arrête à chaque « 3 » et attend le « ding » même après un mot piège.
- Niveau 1-2 plus doux pour les débutants (demi-tour 0,77 s). Quelques niveaux un peu plus courts pour rester sous
  42 s, et 50 s pour le boss (2-5, 2-7, 2-8, 3-7). Défi du 2-6 : « Finis en moins de 42 s » (au lieu de « Arrive 1er », trop facile ici :
  les rivaux craquent). Objectif du 3-5 : 2 départs éclair (au lieu de 3).
- La courbe du moyen reste celle voulue : cour 100 → 32 % (boss), parc 73 → 28 %, plage 65 → 18 %. Expert ≥ 98 %.

### Tests
- `tools/simulate.js` : nouvelle vérification « la nuit ne fait presque jamais perdre le moyen (au plus 5 %) » ; le
  robot prudent n'a « presque jamais ★★★ (au plus 2 %) » (il gagne parfois une course quand tous les rivaux se sont
  fait griller) ; `REF_W1` réglée à nouveau ; **148 vérifications**.
- `test_poki.py`, test 31 : la nuit tombe, 🎬, le soleil remonte et ne se couche plus (25 s plus tard, toujours pas de
  nuit), et pareil après avoir été grillé. Vérifié avec l'ancien « +10 s » : le test le voit. **173 vérifications**.

### Pas encore vérifié
- Le ressenti sur un vrai téléphone : 0,36 s est une estimation (lire un mot et lâcher, sur téléphone). Si la nuit tombe
  encore trop vite, ou si c'est devenu trop facile, il suffit de le dire : tout se règle dans `levels/world*.js`
  (`night`, `turn`).

## v2.5 — les nouveaux pièges, le monde 3 « La plage » et la courbe de difficulté

Le retour du joueur : « Le faux dos, c'est le seul bon piège. Les autres ne sont pas dangereux : on a juste à
s'arrêter. » La v2.5 rend la prudence coûteuse et ajoute de faux signaux pour partir. Seuls les pièges choisis par le
joueur ont été faits. Le détail de chaque piège est dans `docs/TRAPS_DESIGN.md`, la courbe dans `docs/DIFFICULTY.md`,
la plage dans `docs/WORLD3_DESIGN.md`.

### Changé
- **Plus de « SO »**, partout (niveaux, course infinie, défi du jour, 2 joueurs, tutoriel, 6 langues) : le chant est
  « 1… 2… 3… » puis le mot. C'est le mot qui prévient ; l'hésitation devient le « 3… » qui dure. Les demi-tours sont un
  peu plus longs pour lire, réagir et freiner (niveaux +0,05 à +0,10 s, course infinie 0,50 s, 2 joueurs 0,65 s). Le
  dé de l'ancien « SO » est encore tiré : la suite des dés ne bouge pas.
- **Le « ding » du vrai retour dès le monde 1** (`SIGNAL_WORLD = 1`), avec les « DÉPART ÉCLAIR ! ».
- **Le niveau 1-4 s'appelle « Le recomptage »** (Max le Fonceur est toujours à battre) ; le 1-3 « Avant la nuit ».
- Tous les niveaux ont été réglés à nouveau (demi-tours, nuits, longueurs) : voir le tableau de `docs/DIFFICULTY.md`.

### Nouveau : la prudence coûte cher
- 🌅 **Le coucher du soleil** (du 1-3 au boss de la plage) : le soleil descend, le ciel passe au soir, une barre
  « jusqu'à la nuit » ; « LA NUIT TOMBE ! » = perdu. 🎬 2e chance : +10 s de jour.
- 🏖️ **Les transats** (plage 1, 4, 7) : un transat de moins que d'enfants ; le dernier arrivé a perdu, sans 2e chance.
- 🍦 **La glace qui fond** (plage 2, 6, boss) : une boule fond toutes les 4 s, les boules qui restent donnent les
  étoiles ; à l'arrivée, **la montagne de boules**. Le cornet ne cache jamais le soleil (6 boules dessinées, « ×n »).

### Nouveau : les faux signaux
- 🔁 **Le recomptage** (dès le 1-4 ; course infinie dès 50 m) : il recompte « 1… 2… » **en te regardant** : il ment.
- ✈️ **L'avion menteur** (plage dès le 3-3 ; course infinie dès 90 m) : une banderole « SOLEIL ! » pendant le chant
  (faux arrêt, on perd du temps) ou « ALLEZ-Y ! » pendant le regard (faux départ, grillé). Ce n'est jamais le soleil
  qui parle, et le mot de la banderole n'est jamais le mot de départ.
- 💧 **Le reflet dans l'eau** (plage dès le 3-5 ; course infinie dès 150 m) : le nuage cache le soleil, son reflet dans
  l'eau (le sable mouillé à la plage) montre son visage, l'œil du faux dos et l'anneau vert du « ding ».

### Nouveau : les rivaux
- 📣 **La fausse alerte** (dès le 1-7) : un rival qu'on voit crie « IL REGARDE PAS ! VAS-Y ! ». C'est une blague.
- 🐑 **Le troupeau** (2-7 et 3-7, niveaux seulement) : trois rivaux repartent ensemble… « TOUS GRILLÉS ! ». Un obstacle,
  jamais un objectif d'étoile. Un rival peut maintenant partir devant (`z0`).

### Nouveau : le monde 3 « La plage » (12 ★ du monde 2 pour l'ouvrir)
- 8 niveaux : Les transats, La glace qui fond, L'avion menteur, Le volley de plage, Le reflet dans l'eau, Le château
  de sable, La grande course de la plage, et le boss **le Soleil Vacancier 🏖️** (chapeau de paille, lunettes en cœur,
  musique calypso, 6 coups spéciaux, « Mon chapeau !! »).
- Décor dessiné en code (`js/render/beach.js`) : la mer, le sable mouillé, parasols, palmiers, châteaux de sable,
  ballons, seaux, coquillages, tour de maître-nageur, marchand de glaces, mouettes ; la page de la plage sur la carte.
- Les mondes 4 et 5 restent « Bientôt ».

### Règles respectées
- Chaque piège a un indice **qu'on voit** (jamais la couleur seule, jamais le son seul) ; aucun n'imite le « ding ».
- Les nouveautés tirent dans une 3e suite de dés (`mixSeed(graine, 7000 + cycle)`) : les niveaux et le défi du jour
  restent les mêmes pour tout le monde ; jamais `Math.random()` dans la logique.
- Tous les textes en 6 langues, sans jeu de mots français ; les mots du chant viennent de `L.chant`.
- Rien de téléchargé, les effets coûteux suivent la qualité automatique, rien dans la zone de la pilule Poki.

### Corrigé en route
- Un « 3 » juste après un mot piège effaçait le jugement de ce piège (le robot prudent avait ★★★ au 1-1).
- `S.Levels` n'exposait pas les boules qui tombent ni la montagne de glace (getters `plocs`, `cone`, `mountain`).
- Un 2e message sur la carte attendait la fin du 1er (0,9 s) : le test de la carte en tient compte.

### Tests
- `tools/simulate.js` : le monde 3, le robot prudent (profil `patient`), la référence `REF_W1` réglée en v2.5 ;
  **126 vérifications**, toutes vertes.
- `test_levels.py` : tests 19 à 27 (faux signaux, rivaux, la plage, son boss, la course infinie, le défi du jour
  identique pour deux joueurs) ; **112 vérifications**.
- `test_poki.py` : test 30 (plus de « SO », ni écrit ni dit, dans les 6 langues et tous les modes ; vérifié en
  remettant exprès un « SO… » : le test le voit) ; **168 vérifications**.
- Le test du conseil de fin (course infinie) tombait parfois : un encouragement « presque » (record, rang, moment de
  la journée à quelques mètres) passe avant le conseil du faux signal, c'est voulu. Il refait maintenant une partie
  jusqu'à voir le conseil, et vérifie qu'on n'a jamais le conseil générique à la place.
- `compare_frames.py` : contre la v2.4, les 14 images de la course infinie (sans chant à l'écran, de 0 à 900 m) sont
  identiques ; 76 des 80 images des niveaux changent, et c'est voulu (plus de « SO », coucher du soleil). Pour la suite,
  comparer avec la v2.5.

### Pas encore vérifié
- Le ressenti sur un vrai téléphone (lisibilité du reflet et des banderoles, sons, musique du boss), et la fréquence des
  faux signaux en course infinie sur de vraies parties. La liste des vérifications à faire est dans `docs/TESTS.md`.

## v2.4 — étape Poki 3 : sans partage, grands écrans, qualité automatique, daltoniens, 6 langues, dossier Poki

### Retiré
- **Tout le partage** (« personne ne va l'utiliser ») : bouton Partager, image à envoyer, grille d'emojis, story, journal des événements de la partie. `js/ui/share.js` et `js/ui/story.js` sont supprimés ; le défi du jour garde seulement le jour, l'essai et la distance. Plus aucun lien ni presse-papiers (test 12).

### Nouveau
- **Plein écran** : c'est le bouton de Poki, on n'en ajoute pas. **Grands écrans** : l'interface grandit avec la fenêtre (jusqu'à ×1,6, variable CSS `--uiz` = `S.uiZoom`), le canvas aussi ; si la fenêtre change beaucoup pendant une partie (plein écran, rotation), le jeu se met en pause (test 25).
- **Pas fixe de 1/120 s** (`js/main.js`) : le même joueur fait **exactement** la même partie à 30, 60 ou 120 images par seconde (test 26).
- **Qualité d'image automatique** (`js/render/quality.js`) : haute / moyenne / basse (résolution, particules, distance du décor), qui baisse si l'appareil rame et remonte s'il va bien, seulement pendant un moment calme (jamais pendant que le soleil se retourne). Réglage « Qualité : Auto / Haute / Basse » dans le menu pause (test 27).
- **Daltoniens** : le vrai signal (« SOLEIL ! ») a une étoile « POW » derrière lui, un mot piège démasqué perd l'étoile et se fait **rayer** (en plus de passer au vert et de trembler). Au début, piège et vrai signal se ressemblent toujours : il faut LIRE le mot, comme avant. Les étoiles vides de la carte sont plus petites et sombres. Vérifié en vision simulée (protanopie, deutéranopie, tritanopie) et par le test 28.
- **6 langues** : français, anglais, espagnol, portugais (Brésil), allemand, italien (`js/core/lang/*.js`, `js/core/i18n-apply.js`). La langue de l'appareil, sinon l'anglais ; bouton rond « FR » sur l'accueil pour changer, sans recharger, mémorisé. **Le chant change avec la langue** : SOLEIL ! / RED LIGHT! / ¡POLLITO! / BATATINHA! / SONNE! / STELLA!, 12 mots pièges qui commencent pareil dans chaque langue, même rythme partout (même partie, même défi du jour : test 29). La voix parle la langue choisie. Les mots pièges d'un niveau sont maintenant des numéros dans la liste de la langue (`levels/README.md`).
- **Dossier Poki** : `docs/POKI_SUBMISSION.md` (5 titres internationaux, titre réglable dans `GAME_TITLE` de `js/core/config.js`, descriptions EN/FR, commandes, catégories, règles de Poki, traductions à faire relire, ce qu'il te reste à faire).
- **Miniatures et vidéo** fabriquées à partir du vrai jeu : `python3 tools/thumbnails/make.py [--lang fr] [--video]` (carrés 1024 px, paysage 1920×1080, portrait 1080×1920, avec et sans titre, miniature animée 1080×1080 à 60 i/s). Mode vitrine `index.html?showcase=race|title` (dev seulement, retiré du build).

### Tests
- `test_poki.py` : tests 25 à 29 (grands écrans, même partie à toutes les vitesses, qualité, daltoniens, langues) ; 162 vérifications.
- `test_levels.py` : les tests de sauvegarde écrivent l'ancienne sauvegarde au chargement (plus fiable qu'un rechargement juste après un `localStorage.setItem`).
- `compare_frames.py` : 88/94 images identiques à la v2.2 ; les 6 autres sont les images où le vrai signal ou un mot piège est à l'écran (étoile « POW » / mot rayé) — sans ces deux dessins, les 94 sont identiques.
- En anglais, le chant est maintenant « RED LIGHT! » : les textes anglais qui parlaient de « SO » et « SOLEIL » ont suivi.

## v2.3 — étape Poki 2 : 4 corrections et les pubs récompensées

### Corrigé (vérification de la v2.2)
- **Un message ne cache plus « Touche l'écran pour rejouer »** (`js/ui/toast.js`). Sur un écran de fin (fin de course, défaite ou victoire d'un niveau, fin du mode 2 joueurs), les petits messages (« Série de 1 jour : +1 ⭐ », « Mission : +6 ⭐ »…) se placent juste au-dessus du panneau, jamais sur un bouton ni sur la consigne du bas. Le message ne se rétrécit plus non plus quand il est long (`width:max-content`).
- **La pilule Poki, à gauche OU à droite, avec un seul réglage** : `PILL.side` dans `js/platform/flow.js`. À droite, la colonne des boutons ronds se décale vers la gauche (variable CSS `--pr`), et le canvas laisse la place en haut à droite. `?debug=1&pill=1` dessine la zone en rouge pour la comparer à la vraie pilule dans le Poki Inspector ; `&pillside=right` essaie l'autre côté sans toucher au code. Explications : `docs/POKI_INTEGRATION.md`, section 6.
- **Une pub qui démarre en retard** (après les 5 s d'attente) ne passe plus par-dessus un jeu qui tourne : le jeu se fige, le son se coupe, les entrées sont bloquées, sans aucun événement pendant la pub ; à la fin, la partie est en pause (`gameplayStop` part alors). Aucune nouvelle pub n'est demandée tant que le SDK n'a pas répondu à la précédente.
- **Typographie française** : une espace insécable avant « ! ? : ; », à l'intérieur des « » et entre un nombre et son unité (« 0,08 s »), dans TOUS les textes français, avec une règle commune (`typoFr` / `typoAll`, `js/core/i18n.js`). Un « ! » ne peut plus se retrouver seul sur une ligne (carte d'intro du niveau 3 en paysage).
- **Accueil** : « Niveaux », « Infini » et « 2 joueurs » tiennent toujours dans leur bouton (`fitRow`, `js/ui/home.js`) : le texte rapetisse un peu, puis l'icône s'efface si ça ne suffit pas (640×360, 360×640…).

### Nouveau : les pubs récompensées (🎬) — `js/ui/reward.js`
- **2e chance** (niveaux et course infinie) : après « GRILLÉ ! », un bouton « 🎬 2e chance » (« 🎬 Continuer » en course infinie) à côté de « Réessayer » / « Rejouer ». Vidéo vue jusqu'au bout : on reprend EXACTEMENT là où on a été grillé, à l'arrêt, le soleil de dos, avec 1 s de protection (l'anneau). Une seule par essai / par partie. Jamais dans le défi du jour, en 2 joueurs, ni dans le niveau 1 en douceur. Ensuite, la ★★★ (défi) n'est plus possible (c'est écrit sur l'écran de résultats) et le meilleur temps n'est pas enregistré. En course infinie, rien n'est compté deux fois (partie, distance du jour, bonus de record et de rang) et le record se compare à celui d'avant la partie. Logique du niveau : `Match.revive` (`js/game/match.js`), la simulation ne l'utilise pas.
- **×2 ⭐** : sur l'écran de résultats, quand le niveau vient de rapporter des ⭐ pour le casier, « 🎬 ×2 ⭐ » à côté de « Suivant ». Une fois par résultat.
- **Essayer une tenue** : dans le casier, toucher une tenue pas encore achetée ouvre une fiche (« Acheter », et « 🎬 Essayer »). La tenue est portée tout de suite pour la PROCHAINE partie (niveau ou course libre), avec un badge « Essai », puis « Tu l'as aimée ? ». Jamais enregistrée comme achetée, oubliée au rechargement.
- **Les règles de Poki** sont respectées partout et mesurées par les tests : bouton normal vert, à gauche, plus large et aussi haut ; bouton 🎬 violet (jamais vert) avec l'icône caméra et une phrase « Regarde une courte vidéo pour… » ; récompense seulement si la vidéo a été vue jusqu'au bout ; jamais deux fois (jetons, double clic) ; pas de message sur les bloqueurs de pub ; jeu figé et muet pendant la vidéo ; **aucun bouton 🎬 en mode de secours** (sans SDK).
- Correction trouvée en route : après une pub récompensée, l'écran invisible qui bloque les clics pendant les pubs restait en place. Il disparaît maintenant à la fin de toute pub.

### Tests
- `tools/tests/test_poki.py` : 10 nouveaux tests (15 à 24) pour les 4 corrections et les 3 récompenses, dont les règles de Poki mesurées sur les boutons (couleur, taille, position, icône, phrase) ; le faux SDK sait maintenant montrer une vidéo récompensée, la refuser, n'en avoir aucune, et démarrer une pub en retard.
- `tools/tests/test_levels.py` : le test « Lâché 0,xx s trop tard » accepte l'espace insécable.

## v2.2 — étape Poki 1 : les fondations

Retours de la phase 2 : rien à signaler (la section était vide), donc rien à corriger avant de commencer.

### Nouveau
- **SDK Poki** branché proprement : `js/platform/poki.js` est le seul fichier qui lui parle (`init`, `loadingFinished`, `gameplayStart`, `gameplayStop`, `commercialBreak`, `rewardedBreak` prête mais pas utilisée, `movePill`). Il retient l'état (chargement, arrêté, en jeu, pub), ignore les événements en double ou pendant une pub, et a un **mode de secours** : sans SDK (double-clic hors ligne, bloqueur de pub, SDK qui ne répond pas), tout se passe comme si tout allait bien, sans erreur ni attente (2,5 s au plus au chargement).
- **Les événements partent tout seuls, au bon moment, dans tous les modes** (`js/platform/flow.js`) : `gameplayStart` au premier appui (jamais au chargement, jamais à l'affichage de la carte d'intro), `gameplayStop` à chaque arrêt (grillé, victoire, pause, fin de manche, onglet caché), `commercialBreak` avant Rejouer, Suivant, Recommencer, Reprendre et la Revanche du mode 2 joueurs. Une pub ne peut ni coûter ni donner un essai du défi du jour. Le tableau complet est dans `docs/POKI_INTEGRATION.md`.
- **Pendant une pub** : le jeu est figé, tout le son est coupé (effets, musique du boss, voix), l'écran et le clavier sont bloqués et tout est relâché. Après : le son revient (s'il était coupé par le joueur, il le reste), les entrées aussi, sans appui fantôme.
- **Vraie pause** : bouton ⏸ à côté du bouton son pendant la partie, **Échap** ou **P**. Menu dans le style du jeu : Reprendre, Recommencer (le niveau), Carte (ou Accueil), Son. Défi du jour : pas de Recommencer, « Abandonner le défi ». Pause automatique si l'onglet est caché ou si la fenêtre perd le focus. À la reprise : 1 seconde de grâce (le monde reste figé, un anneau se remplit, le joueur repart à l'arrêt et ne peut pas être grillé).
- **La page ne défile jamais** : Espace, flèches, Page suivante et la molette sont bloqués (sauf dans le casier, qui défile à l'intérieur).
- **Première expérience** :
  - 1re visite : ni titre, ni accueil, ni carte. Le niveau 1 s'affiche « prêt » et attend : une **main animée** montre le geste sur téléphone et tablette, une **touche Espace dessinée** sur PC. Un appui et on joue (moins de 3 secondes après l'ouverture).
  - **Niveau 1 en douceur** : si le soleil te voit bouger, pas de défaite : « OUPS ! », tu recules de 6 m en faisant la toupie, le soleil rigole (« VU ! »), puis la main lève le doigt : « LÂCHE ! ». Tutoriel visuel presque sans texte (« MAINTIENS », « LÂCHE ! », « REPARS ! »).
  - Après le niveau 1 : petite célébration avec les étoiles gagnées, puis directement la petite carte d'intro du niveau 2.
  - Après le niveau 2 : écran de résultats, puis Suivant → **la carte se présente** (les niveaux apparaissent un par un, « TA CARTE ! », une main montre ton niveau : « À toi ! »).
  - **Joueur qui revient** : accueil express avec un gros « CONTINUER – Niveau X » (un appui), et les autres modes plus petits (Niveaux, Infini, 2 joueurs).
- **Consignes selon l'appareil** : « Touche pour commencer » sur téléphone, « Clic ou Espace pour commencer » sur PC (cartes d'intro, de défaite, fin du défi). La 1re course infinie montre aussi la main (ou la touche Espace).
- **Zone de la pilule Poki** : sur téléphone, dans l'iframe de Poki, le coin en haut à gauche reste libre (les textes du haut à gauche se décalent de 56 px). Les boutons sont tous à droite.
- **Build Poki** : `node tools/build-poki.js` fabrique `dist/poki/` (index.html, un seul `game.js`, style.css) et `dist/soleil-poki.zip`, sans le mode debug, et vérifie tout (adresses externes, liens sortants, `localStorage` dans un try/catch, `console.log`, taille, `node --check`, fichiers entiers après le retrait du debug).
- **Mode debug** (version dev seulement) : `index.html?debug=1` affiche à l'écran chaque événement SDK avec son heure, les enchaînements interdits en rouge ; `&fakead=1` simule une pub de 2 s.

### Changé
- **La carte d'intro d'un niveau attend un appui** (avant : elle partait toute seule après 1,9 s). C'est cet appui qui lance la partie et envoie `gameplayStart`.
- **Partage sans adresse** : le texte et l'image de partage ne contiennent plus l'adresse de la page. Dans une iframe (Poki), le bouton « Image » est caché (le téléchargement y est bloqué) et le partage copie le texte.
- **Accueil** : « CONTINUER » (vert) remplace le gros « NIVEAUX » ; « Niveaux », « Infini » et « 2 joueurs » sont de petits boutons sur une ligne.
- **Échap** : pendant une partie, il ouvre le menu pause (qui a « Carte »). Ailleurs, il fait comme avant (carte → accueil, casier → fermé, fin de partie → accueil, niveau hors partie → carte).
- Pendant une partie, ⏸ prend la place de 🗣️ (et de 🏠 en mode Niveaux : le menu pause a « Carte »).

### Architecture
- Nouveaux fichiers : `js/platform/poki.js` (couche SDK), `js/platform/debug.js` (dev seulement, retiré du build), `js/platform/flow.js` (quand on est « en jeu », pauses pub, démarrage, appareil, pilule), `js/ui/pause.js` (pause), `js/ui/onboard.js` (premiers pas, « Continuer »), `js/render/tuto.js` (main et touche Espace dessinées). 63 scripts dans `index.html` (62 dans le build).
- `js/game/match.js` : niveau « en douceur » (`soft: { back: 6 }` dans les données du niveau) : événement `oops` au lieu de la défaite, recul animé, il faut lâcher pour repartir. Les autres niveaux suivent exactement le même code qu'avant.
- `js/audio/sounds.js` : `Sound.silence(raison, oui/non)` coupe tout le son pour le jeu (pub, pause, onglet caché) sans toucher au choix 🔊 du joueur (`Sound.quiet`).
- `js/main.js` : la boucle ne fait plus avancer le monde pendant une pause ou une pub ; elle synchronise `gameplayStart` / `gameplayStop` à chaque image.
- Nouvelle sauvegarde `soleil.onboard` (0 → 3). Les anciennes sauvegardes (record, parties, niveaux) passent directement à 3 : aucun ancien joueur ne revoit les premiers pas.
- Nouveaux textes en français et en anglais dans `js/core/i18n.js`.

### Simulation : le niveau 1 change, rien d'autre
- `REF_W1`, niveau 1 : le débutant le finit maintenant **100 %** du temps (avant : 66 %), car il ne peut plus perdre. Il prend en moyenne 0,4 « OUPS ! » par essai et finit en 27 s. Le contrôle « le débutant réussit le niveau 1 à 40-70 % » devient « au moins 90 % » et « en moins de 45 s ».
- Les 7 autres niveaux du monde 1 et tout le monde 2 n'ont pas bougé d'un chiffre (même sortie de `node tools/simulate.js` qu'en v2.1, à part la ligne du niveau 1).

### Inchangé (vérifié)
- Le jeu se dessine exactement comme avant : **94 images sur 94 identiques** contre la v2.1 (course infinie et monde 1, boss compris, `tools/tests/compare_frames.py`). Le niveau 1 aussi pour un bon joueur ; seuls changent ses nouveautés (main, « OUPS ! »), qui n'apparaissent pas dans ces images.
- Tests du mode Niveaux 66/66, anciennes suites vertes (V4 30/30, V3 55/55, mode solo V2 et test rapide V4 sans erreur), aucune erreur JavaScript.
- Nouveau : `tools/tests/test_poki.py`, 76/76 (tous les moments du tableau, tous les cas limites, avec et sans SDK, et le build Poki lui-même).

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
