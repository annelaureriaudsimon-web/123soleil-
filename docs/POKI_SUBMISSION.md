# Envoyer le jeu à Poki : tout ce qu'il faut (v2.4)

Ce dossier contient ce que Poki demande au moment de proposer le jeu : le titre, les descriptions, les commandes,
les catégories, les images, la vidéo et la liste des règles à respecter. Les textes en anglais sont prêts à copier
(Poki est un site international : la fiche principale est en anglais).

**À faire par toi** (personne ne peut le faire à ta place) : voir la section 8 tout en bas.

---

## 1. Le titre

Le nom du jeu change selon la langue, comme le jeu change de chant (voir section 6). Pour la fiche Poki, il faut
**un seul titre international**. Il se règle à **un seul endroit** : `GAME_TITLE` dans `js/core/config.js`
(le build Poki l'affiche et l'écrit en tête de `game.js`).

5 propositions, de la plus conseillée à la moins conseillée :

| Titre | Pourquoi |
|---|---|
| **Red Light Sun** ⭐ conseillé | Court, se lit sur une petite vignette, contient « red light » (ce que les joueurs tapent dans la recherche) et dit qui est le personnage. |
| **Red Light, Sun Light!** | Joue avec « Red light, green light » ; plus long, un peu moins lisible en petit. |
| **Freeze, Sun!** | Très court, dit le geste du jeu (se figer). Moins trouvable par la recherche. |
| **Don't Move, Sunny!** | Dit la règle en 3 mots, ton drôle. |
| **1, 2, 3… Sun!** | Le plus proche du titre français, mais « 1, 2, 3 » ne dit rien aux joueurs anglophones. |

Le titre français reste **« 1, 2, 3… SOLEIL ! »** (c'est ce qui s'affiche dans le jeu en français).

---

## 2. Descriptions (à copier)

### Courte (anglais, 1 phrase)
> Hold to run toward the sun, freeze the moment it turns around — and don't fall for its trap words!

### Courte (français)
> Maintiens pour courir vers le soleil, fige-toi dès qu'il se retourne… et ne tombe pas dans ses mots pièges !

### Longue (anglais)
> **Red Light Sun** is the playground classic, with a cheeky sun that cheats.
>
> Hold to run. The sun counts “1, 2, 3… RED…” — let go before it shouts “RED LIGHT!” and turns around. If it sees you move, you're TOASTED!
>
> But the sun loves to trick you: “RED… RED HAT!” — that's a trap word, keep running! It hesitates, stutters, speeds up, pretends to turn away, sneezes, teases you and even sends a fly on your nose. Wait for the “ding” before you run again.
>
> - 16 short levels in 2 worlds (the playground and the park), each with 3 stars to earn
> - Race against kids with their own personalities: the Careful, the Speedster, the Steady
> - 2 bosses: the Cool Sun 😎 and the Prankster Sun 🤡
> - Endless run, daily challenge (one try per day, the same for everyone), 2-player mode on the same screen
> - Outfits to unlock, daily missions, ranks and medals
> - Plays in English, French, Spanish, Portuguese, German and Italian — with each country's own chant!

### Longue (français)
> **1, 2, 3… SOLEIL !** : le jeu de la cour de récré, avec un soleil qui triche.
>
> Maintiens pour courir. Le soleil compte « 1, 2, 3… SO… » : lâche avant qu'il crie « SOLEIL ! » et se retourne. S'il te voit bouger, tu es GRILLÉ !
>
> Mais le soleil adore piéger : « SO… SOLDES ! », c'est un mot piège, continue ! Il hésite, bégaie, accélère, fait semblant de se retourner, éternue, se moque de toi et t'envoie même une mouche sur le nez. Attends le « ding » avant de repartir.
>
> - 16 niveaux courts dans 2 mondes (la cour de récré et le parc), 3 étoiles à gagner dans chacun
> - Des enfants qui courent contre toi, chacun avec son caractère : le Prudent, le Fonceur, le Régulier
> - 2 boss : le Soleil Cool 😎 et le Soleil Farceur 🤡
> - Course infinie, défi du jour (un seul essai par jour, le même pour tout le monde), mode 2 joueurs sur le même écran
> - Des tenues à débloquer, des missions du jour, des rangs et des médailles
> - En français, anglais, espagnol, portugais, allemand et italien, avec le chant de chaque pays !

---

## 3. Commandes (champ « Controls »)

| | Anglais (à copier) |
|---|---|
| Ordinateur | **Hold Space** (or ↑, W, Enter, or the mouse button) to run · **release** to stop · **Esc / P**: pause · **M**: sound · 2 players: **A** and **L** |
| Téléphone / tablette | **Hold your finger** on the screen to run · **lift it** to stop · 2 players: each player holds their half of the screen |

---

## 4. Catégories et mots-clés

Poki laisse proposer jusqu'à 4 catégories (il choisit ensuite lui-même) :
**Skill**, **Casual**, **2 Player**, **Kids** (ou **Reaction** si la catégorie existe).

Mots-clés : red light green light, statues, freeze, playground game, sun, reaction, timing, 2 player, kids, one button, daily challenge.

---

## 5. Les images et la vidéo — `python3 tools/thumbnails/make.py`

Fabriquées à partir du **vrai jeu** (mode vitrine `index.html?showcase=…`, qui n'existe pas dans le build Poki),
gratuitement (Python + Playwright, ffmpeg pour la vidéo) :

```
python3 tools/thumbnails/make.py             # dist/thumbnails/en/ (anglais)
python3 tools/thumbnails/make.py --lang fr   # dist/thumbnails/fr/
python3 tools/thumbnails/make.py --video     # + miniature animée .mp4
```

| Fichier | Taille | Pour quoi |
|---|---|---|
| `carre_regard.png` ⭐ | 1024×1024 | **La miniature conseillée** : le soleil te regarde, le coureur figé bras en l'air, sans texte (Poki : « évitez le texte »). |
| `carre_boss.png` | 1024×1024 | Autre choix : le Soleil Cool à lunettes au coucher du soleil (le mot « BOSS » est petit). |
| `carre_piege.png` | 1024×1024 | Le mot piège rayé : montre l'idée du jeu, mais il y a du texte. |
| `carre_titre.png` / `carre_sans_titre.png` | 1024×1024 | L'accueil avec / sans le logo. |
| `paysage_titre.png`, `paysage_course.png` | 1920×1080 | Si Poki demande un format large (bannière). |
| `portrait_titre.png`, `portrait_regard.png` | 1080×1920 | Si Poki demande un format vertical. |
| `miniature_animee_1080.mp4` | 1080×1080, 60 i/s, 5 s | La **miniature animée** (obligatoire avant la sortie mondiale) : le boss compte, un mot piège, il se retourne. |

Règles de Poki respectées : carré plein cadre d'au moins 628 px, pas de bord ni de coins arrondis (Poki les ajoute),
un personnage net au centre, fond simple, contraste fort, peu ou pas de texte, presque pas du turquoise de Poki
(`#83FFE7` : l'outil en mesure la part, 0 à 4 %) ; vidéo carrée 1080×1080, 50 i/s ou plus, 4 à 6 s, .mp4, sans curseur
ni interface. Conseil : une miniature dessinée à la main à partir de `carre_regard.png` (coureur plus grand, soleil plus
expressif) ferait encore mieux ; celles-ci sont propres et fidèles au jeu, donc utilisables tout de suite.

---

## 6. Les langues (v2.4)

Le jeu parle **français, anglais, espagnol, portugais (Brésil), allemand et italien**. Il prend la langue de l'appareil
(sinon l'anglais) ; le joueur peut la changer depuis l'accueil (bouton rond « FR », « EN »… à droite), sans recharger.
Les noms des langues sont écrits dans leur propre langue, sans drapeau. Le choix est mémorisé.
Pour tester : `index.html?lang=de`.

**Le chant change avec la langue** (seuls les mots changent : le rythme, les dés et le défi du jour sont les mêmes
partout, c'est testé) :

| Langue | Début commun (lâche dès qu'il apparaît) | Vrai signal | Exemples de mots pièges | Lune |
|---|---|---|---|---|
| Français | SO… | SOLEIL ! | SOLDES, SOUPE, SOFA… | LUNE ! |
| Anglais | RED… | RED LIGHT! | RED HAT, RED BUS, RED NIGHT… | MOON! |
| Espagnol | PO… | ¡POLLITO! | ¡POLLO!, ¡POMELO!, ¡POSTRE!… | ¡LUNA! |
| Portugais | BA… | BATATINHA! | BANANA, BALÃO, BARCO… | LUA! |
| Allemand | SO… | SONNE! | SOFA, SOCKE, SONNTAG… | MOND! |
| Italien | STE… | STELLA! | STECCO, STELO, STEREO… | LUNA! |

Chaque langue a **12 mots pièges** et 5 pour la Lune (le même nombre partout : un même dé donne le même « numéro »
de mot dans toutes les langues). La voix du soleil parle la langue choisie, si l'appareil a une voix de cette langue.

### Traductions dont je ne suis pas sûr (à faire relire par quelqu'un qui parle la langue)

- **Espagnol** : « ¡POLLITO! » vient de « un, dos, tres, pollito inglés » (Espagne). En Amérique latine, le jeu
  s'appelle souvent « un, dos, tres, calabaza » ou « luz roja, luz verde ». Le piège « ¡POLLO! » est très proche
  de « ¡POLLITO! » (exprès, mais peut-être trop dur). « Sol Guay » (le boss) sonne espagnol d'Espagne.
- **Portugais** : écrit pour le Brésil (« você », « tela », « fase »). « Sol Maneiro » est de l'argot brésilien.
- **Allemand** : le vrai jeu s'appelle « Ochs am Berg, 1, 2, 3! » ; « SONNE! » a été choisi pour garder le soleil et
  un début commun court (« SO… »). « SONNTAG! » commence comme « SONNE! » : piège exprès, à vérifier en jeu.
  Le soleil est féminin en allemand (« sie ») : les textes suivent ça, sauf quelques phrases sur les rivaux.
- **Italien** : « STEARINA », « STERPO », « STEVIA » sont des mots réels mais peu courants pour des enfants.
- **Toutes** : les noms des boss et des rangs (« Maître du Soleil », « Roi Soleil »), les moqueries du soleil et
  les petites phrases des rivaux sont des adaptations libres, pas des traductions mot à mot.

Ajouter une langue : copier `js/core/lang/it.js`, traduire, ajouter la langue dans `LANGS` (`js/core/i18n.js`) et
le `<script>` dans `index.html` ; le test 29 de `tools/tests/test_poki.py` dit s'il manque un texte.

---

## 7. Les règles de Poki : où on en est

D'après sdk.poki.com/requirements et les autres pages pour les développeurs (novembre 2026).

| Règle | État | Où / comment c'est vérifié |
|---|---|---|
| Jouable sur téléphone et tablette, plein écran en portrait et en paysage | ✅ | Tests à 390×844, 844×390, 640×360, 836×470, 1031×580 ; plein écran : c'est le bouton de Poki (on n'en ajoute pas) |
| Grands écrans (16:9, 1920×1080, 2560×1440…) | ✅ | Interface agrandie jusqu'à ×1,6 (test 25) |
| Aucune requête externe (polices, images, sons, librairies) | ✅ | Tout est dessiné en code ; le build vérifie qu'aucune adresse externe sauf le SDK n'existe |
| Aucun lien sortant | ✅ | Build (« aucun lien sortant ») ; le partage a été retiré |
| Aucune pub en dehors du SDK Poki | ✅ | Le build vérifie que le SDK n'est appelé que depuis `js/platform/poki.js` |
| Pas de logo ni d'écran de démarrage pendant les premiers pas | ✅ | 1re visite : directement le niveau 1, sans titre (test 1). Le logo n'apparaît qu'à l'accueil des joueurs qui reviennent |
| Jouable avec un bloqueur de pub, sans message sur le bloqueur | ✅ | Mode de secours (test 10) ; les boutons 🎬 ne donnent rien mais ne disent rien de spécial |
| Navigation privée : `localStorage` dans un try/catch | ✅ | Build (`localStorage` toujours via `S.store`) |
| SDK : `gameLoadingFinished`, `gameplayStart/Stop`, `commercialBreak`, `rewardedBreak` | ✅ | `docs/POKI_INTEGRATION.md` ; tests 1 à 24 ; Poki Inspector (section 10 de ce document-là) |
| Pubs récompensées : bouton normal vert à côté, 🎬 jamais vert, récompense seulement si vue en entier | ✅ | Tests 19 à 24 |
| Jeu figé et muet pendant une pub | ✅ | Test 6 |
| Poids : viser 8 à 10 Mo au plus | ✅ | Le build pèse bien moins de 1 Mo (vérifié à chaque build) |
| Chargement rapide | ✅ | Pas de fichier à télécharger à part le SDK ; jouable en moins de 3 s (test 1) |
| Miniature carrée ≥ 628 px, sans bord ni coins arrondis, peu de texte, pas trop de #83FFE7 | ✅ | `tools/thumbnails/make.py` (section 5) |
| Miniature animée 1080×1080, ≥ 50 i/s, 4–6 s, .mp4 | ✅ | `make.py --video` |
| Daltoniens : jamais une information donnée par la couleur seule | ✅ | Étoile « POW » derrière le vrai signal, mot piège rayé, étoiles vides plus petites (test 28) |
| Qualité d'image qui s'adapte aux appareils lents | ✅ | Automatique, + réglage dans le menu pause (test 27) ; même partie à 30, 60 ou 120 images/s (test 26) |

---

## 8. À faire par toi

1. **Créer ton compte** sur Poki for Developers (gratuit) et ton jeu dedans.
2. **Choisir le titre** (section 1) et le mettre dans `GAME_TITLE` (`js/core/config.js`) si ce n'est pas « Red Light Sun ».
3. Lancer `node tools/build-poki.js` → il doit dire « TOUT EST OK » ; envoyer `dist/soleil-poki.zip` sur Poki.
4. Faire la **liste du Poki Inspector** (`docs/POKI_INTEGRATION.md`, section 10) sur ton téléphone et ton PC.
5. Lancer `python3 tools/thumbnails/make.py --video`, choisir la miniature (conseil : `carre_regard.png`) et l'envoyer
   avec la vidéo.
6. Copier les descriptions, les commandes et les catégories (sections 2 à 4).
7. Si possible, faire relire les traductions incertaines (section 6) par quelqu'un qui parle la langue.
8. Pendant la « Web Fit Test » de Poki : regarder les chiffres (temps de jeu, joueurs qui reviennent) et me les
   envoyer, pour savoir quoi améliorer ensuite.
