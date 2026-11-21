# Tests de l'intégration Poki (étape 1, v2.2 ; étape 2, v2.3 : corrections et pubs récompensées), dans un vrai navigateur (Playwright).
# Un faux SDK (tools/tests/fake_poki_sdk.js) remplace celui de Poki : il note chaque appel et peut montrer une « pub ».
# Lance : python3 tools/tests/test_poki.py            (tous les tests)
#         python3 tools/tests/test_poki.py t_ads      (un seul test)
# Variable CHROME=/chemin/vers/chrome pour utiliser un autre navigateur.
import asyncio, os, sys, json, tempfile, subprocess
from playwright.async_api import async_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
URL = 'file://' + ROOT + '/index.html'
FAKE = open(os.path.join(HERE, 'fake_poki_sdk.js')).read()
RES, LOGS, ERRS = [], [], []
def check(name, ok, info=''):
    RES.append(bool(ok)); print(('  ✅ ' if ok else '  ❌ ') + name + (f'  [{info}]' if info != '' else ''))

# Robot du mode Niveaux (image par image) : « good » lâche dès « SO » et attend le vrai retour, « greedy » court tout le temps
BOT = """
window.LVBOT = (mode, frames, stopAt) => {
  const S = Soleil;
  for (let i = 0; i < frames; i++) {
    const L = S.Levels, m = L.m;
    if (m && L.phase === 'play') {
      const w = m.sun;
      if (mode === 'good') S.pressing = !((w.state === 'chant' && (w.textKind === 'so' || w.textKind === 'trigger')) || w.state === 'turn' || w.state === 'look'
        || w.state === 'peek' || w.state === 'hop' || (w.state === 'return' && w.retTo > 0));
      else S.pressing = mode === 'greedy';
    } else S.pressing = false;
    S.update(1 / 60);
    if (stopAt && stopAt()) return i;
  }
  return frames;
};
"""

async def new_page(b, sdk='fake', onboard=3, ad=0, w=390, h=844, touch=False, debug=False, url=None, wait=True, init_js=''):
    ctx = await b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=1, locale='fr-FR', has_touch=touch, is_mobile=touch)
    if sdk == 'fake':
        await ctx.route('**/poki-sdk.js', lambda r: r.fulfill(status=200, content_type='application/javascript', body=FAKE))
    elif sdk == 'adblock':
        await ctx.route('**/poki-sdk.js', lambda r: r.fulfill(status=200, content_type='application/javascript', body='window.__initFail = true;\n' + FAKE))
    elif sdk == 'none':
        await ctx.route('**/poki-sdk.js', lambda r: r.abort())
    elif sdk == 'hang':
        async def never(route): await asyncio.sleep(30)
        await ctx.route('**/poki-sdk.js', never)
    init = f"window.__adMs = {ad};"
    if onboard is not None: init += f"localStorage.setItem('soleil.onboard', '{onboard}');"
    await ctx.add_init_script(init + init_js)
    page = await ctx.new_page(); page.errs = []
    page.on('pageerror', lambda e: page.errs.append(str(e)))
    await page.goto(url or (URL + ('?debug=1' if debug else '')), wait_until='domcontentloaded')
    if wait: await page.wait_for_function("window.Soleil && Soleil.Poki && Soleil.Poki.loaded", timeout=8000)
    await page.evaluate(BOT)
    return ctx, page

async def calls(page):
    return await page.evaluate("(window.__calls || []).slice()")
async def done(page, ctx):
    LOGS.append(await calls(page)); ERRS.extend(page.errs); await ctx.close()
async def frames(page, n=3):                     # laisse passer quelques vraies images (la boucle du jeu envoie les événements)
    await page.evaluate(f"new Promise(r => {{ let k = {n}; const f = () => (--k <= 0 ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }})")
def tail(log, mark): return ' '.join(log[mark:])

async def t_new_player(b):
    print('\n1) 1re visite : directement le niveau 1, gameplayStart au 1er appui seulement')
    t0 = asyncio.get_event_loop().time()
    ctx, page = await new_page(b, onboard=None)
    st = await page.evaluate("({ s: Soleil.state, ph: Soleil.Levels.phase, id: Soleil.Levels.def.id, hand: Soleil.Levels.hand && Soleil.Levels.hand.kind, t: Soleil.Levels.m.t, ready: performance.now(), home: !document.getElementById('home').classList.contains('hide'), intro: !!document.querySelector('#lvIntro.show') })")
    check('pas de titre, d’accueil ni de carte : le niveau 1 « prêt », sans carte d’intro', st['s'] == 'level' and st['ph'] == 'ready' and st['id'] == 'w1-1' and not st['home'] and not st['intro'])
    check('une main (ou la touche Espace) montre « maintiens »', st['hand'] == 'hold')
    check('prêt à jouer en moins de 3 s après le chargement', st['ready'] < 3000, f"{st['ready']:.0f} ms")
    check('chargement : init puis gameLoadingFinished, rien d’autre', await calls(page) == ['init', 'gameLoadingFinished'], ' '.join(await calls(page)))
    await page.wait_for_timeout(1200)
    st = await page.evaluate("[Soleil.Levels.m.t, Soleil.Levels.phase]")
    check('sans appui, rien ne bouge et aucun gameplayStart', st[0] == 0 and st[1] == 'ready' and 'gameplayStart' not in await calls(page))
    await page.keyboard.down('Space'); await page.wait_for_timeout(250)
    log = await calls(page)
    st = await page.evaluate("[Soleil.Levels.phase, Soleil.Levels.m.player.v > 0]")
    check('un appui lance la partie : gameplayStart (une fois) et on court', log.count('gameplayStart') == 1 and log[-1] == 'gameplayStart' and st == ['play', True], ' '.join(log))
    await page.keyboard.up('Space')
    await done(page, ctx)

async def t_soft_level1(b):
    print('\n2) Niveau 1 en douceur : « OUPS ! » au lieu de « GRILLÉ ! », puis le niveau 2 tout de suite')
    ctx, page = await new_page(b, onboard=None)
    await page.keyboard.press('Space'); await frames(page)
    r = await page.evaluate("(() => { const ph = []; LVBOT('greedy', 60 * 25, () => { const p = Soleil.Levels.phase; if (!ph.includes(p)) ph.push(p); return false; }); return { ph, oops: Soleil.Levels.m.stats.oops, z: Soleil.Levels.m.player.z, lock: !!Soleil.Levels.m.player.lock }; })()")
    check('le soleil te voit courir : pas de défaite, des « OUPS ! »', r['oops'] >= 1 and 'fail' not in r['ph'] and 'caught' not in r['ph'], f"OUPS ×{r['oops']}, phases {r['ph']}")
    check('après un « OUPS ! », il faut lâcher pour repartir', r['lock'] is True)
    mark = len(await calls(page))
    r = await page.evaluate("(() => { LVBOT('good', 60 * 90, () => Soleil.Levels.phase !== 'play'); const w = LVBOT('good', 60 * 4, () => Soleil.Levels.def.id === 'w1-2'); return { id: Soleil.Levels.def.id, ph: Soleil.Levels.phase, mini: !!document.querySelector('#lvIntro.show.mini'), end: !!document.querySelector('#lvEnd.show'), ob: Soleil.store.get('onboard'), saved: Soleil.store.get('levels', {})['w1-1'] }; })()")
    await frames(page)
    log = await calls(page)
    check('fin du niveau 1 : pas d’écran de résultats, la petite carte d’intro du niveau 2', r['id'] == 'w1-2' and r['ph'] == 'intro' and r['mini'] and not r['end'], json.dumps({k: r[k] for k in ('id', 'ph', 'mini', 'end')}))
    check('progression et premiers pas enregistrés', r['ob'] == 1 and r['saved'] and r['saved']['done'])
    check('victoire : gameplayStop, et pas de pub dans la 1re minute', tail(log, mark) == 'gameplayStop', tail(log, mark))
    await page.wait_for_timeout(250); await page.keyboard.press('Space'); await frames(page)
    check('la carte d’intro du niveau 2 se lance d’un appui : gameplayStart', (await calls(page))[-1] == 'gameplayStart')
    r = await page.evaluate("(() => { LVBOT('good', 60 * 120, () => Soleil.Levels.phase === 'results'); return Soleil.Levels.phase; })()")
    await page.wait_for_timeout(800)
    mark = len(await calls(page))
    await page.click('#lvEnd button[data-act="next"]'); await page.wait_for_timeout(300)
    st = await page.evaluate("[Soleil.state, Soleil.store.get('onboard')]")
    check('niveau 2 fini, Suivant : la carte se présente (sans pub)', r == 'results' and st == ['map', 3] and 'commercialBreak' not in (await calls(page))[mark:], str(st))
    await done(page, ctx)

async def t_returning(b):
    print('\n3) Joueur qui revient : accueil express, « Continuer – Niveau X » en un appui')
    ctx, page = await new_page(b, onboard=3, init_js="localStorage.setItem('soleil.levels', JSON.stringify({ 'w1-1': { s: [true, true, false], best: 30, tries: 2, done: true }, 'w1-2': { s: [true, false, false], best: 31, tries: 4, done: true } }));")
    t = await page.evaluate("document.getElementById('contBtn').innerText")
    small = await page.evaluate("['lvBtn', 'freeBtn', 'duoBtn'].map(id => document.getElementById(id).getBoundingClientRect().height)")
    big = await page.evaluate("document.getElementById('contBtn').getBoundingClientRect().height")
    check('gros bouton « CONTINUER – Niveau 3 »', 'CONTINUER' in t and 'Niveau 3' in t, t.replace('\n', ' / '))
    check('les autres modes sont plus petits', all(h < big for h in small), f'{big:.0f} px contre {[round(h) for h in small]}')
    await page.click('#contBtn'); await page.wait_for_timeout(200)
    st = await page.evaluate("[Soleil.state, Soleil.Levels.def.id, Soleil.Levels.phase]")
    check('un appui : la carte d’intro du niveau 3', st == ['level', 'w1-3', 'intro'], str(st))
    await page.wait_for_timeout(2300)
    check('la carte d’intro attend l’appui (pas de départ tout seul, pas de gameplayStart)', await page.evaluate("Soleil.Levels.phase") == 'intro' and 'gameplayStart' not in await calls(page))
    await page.keyboard.press('Space'); await frames(page)
    check('appui : gameplayStart', (await calls(page))[-1] == 'gameplayStart' and await page.evaluate("Soleil.Levels.phase") == 'play')
    await done(page, ctx)

async def t_pause_endless(b):
    print('\n4) Pause en course infinie : Échap / P, menu, grâce, Recommencer, Accueil')
    ctx, page = await new_page(b)
    await page.click('#freeBtn'); await frames(page)
    log = await calls(page)
    check('« Course infinie » : gameplayStart', log[-1] == 'gameplayStart', ' '.join(log))
    await page.keyboard.down('Space'); await page.wait_for_timeout(350)
    vis = await page.evaluate("[!document.getElementById('pauseBtn').classList.contains('hide'), document.getElementById('voice').classList.contains('hide')]")
    check('bouton ⏸ visible pendant la partie (à la place de 🗣️)', vis == [True, True])
    await page.keyboard.press('Escape'); await frames(page)
    st = await page.evaluate("({ p: Soleil.paused, z: Soleil.runner.z, press: Soleil.pressing, restart: document.getElementById('pRestart').innerText, exit: document.getElementById('pExit').innerText, hidden: document.getElementById('pRestart').classList.contains('hide') })")
    check('Échap : pause, gameplayStop, tout relâché', st['p'] and not st['press'] and (await calls(page))[-1] == 'gameplayStop')
    check('menu : Reprendre, Recommencer, Accueil, Son', 'Recommencer' in st['restart'] and 'Accueil' in st['exit'] and not st['hidden'], f"{st['restart']} / {st['exit']}")
    await page.keyboard.up('Space'); await page.wait_for_timeout(400)
    check('en pause, le monde est figé', await page.evaluate("Soleil.runner.z") == st['z'])
    mark = len(await calls(page))
    await page.keyboard.press('p'); await frames(page)
    st2 = await page.evaluate("({ p: Soleil.paused, g: Soleil.grace, v: Soleil.runner.v })")
    check('P : commercialBreak puis gameplayStart', tail(await calls(page), mark) == 'commercialBreak gameplayStart', tail(await calls(page), mark))
    check('reprise : immobile, 1 s de grâce', not st2['p'] and st2['g'] > 0.8 and st2['v'] == 0, str(st2))
    await page.keyboard.down('Space'); await page.wait_for_timeout(400)
    z1 = await page.evaluate("Soleil.runner.z")
    check('pendant la grâce, on ne bouge pas (on ne peut pas être grillé)', abs(z1 - st['z']) < 1e-9)
    await page.wait_for_timeout(900)
    check('après la grâce, maintenir fait courir', await page.evaluate("Soleil.runner.v") > 0)
    await page.keyboard.up('Space')
    await page.keyboard.press('Escape'); await page.wait_for_timeout(250)
    mark = len(await calls(page))
    await page.click('#pRestart'); await frames(page)
    check('Recommencer : commercialBreak, gameplayStart, nouvelle course', tail(await calls(page), mark) == 'commercialBreak gameplayStart' and await page.evaluate("Soleil.runT") < 0.5, tail(await calls(page), mark))
    await page.keyboard.press('Escape'); await page.wait_for_timeout(250)
    mark = len(await calls(page))
    await page.click('#pExit'); await page.wait_for_timeout(300)
    check('Accueil : retour à l’accueil, aucun événement de plus', await page.evaluate("Soleil.state") == 'title' and tail(await calls(page), mark) == '')
    await done(page, ctx)

async def t_pause_level_daily(b):
    print('\n5) Pause en niveau (Carte) et dans le défi du jour (pas de Recommencer)')
    ctx, page = await new_page(b)
    await page.evaluate("Soleil.WorldMap.open(); Soleil.Levels.open('w1-3', false)")
    await page.wait_for_timeout(300); await page.keyboard.press('Space'); await frames(page)
    await page.click('#pauseBtn'); await page.wait_for_timeout(250)
    t = await page.evaluate("[document.getElementById('pRestart').innerText, document.getElementById('pExit').innerText, document.getElementById('homeBtn').classList.contains('hide')]")
    check('niveau : « Recommencer le niveau » et « Carte »', 'Recommencer le niveau' in t[0] and 'Carte' in t[1], f'{t[0]} / {t[1]}')
    mark = len(await calls(page))
    await page.click('#pRestart'); await frames(page)
    st = await page.evaluate("[Soleil.Levels.phase, Soleil.Levels.m.attempt]")
    check('Recommencer le niveau : commercialBreak, gameplayStart, le niveau repart direct', tail(await calls(page), mark) == 'commercialBreak gameplayStart' and st[0] == 'play', f"{tail(await calls(page), mark)} {st}")
    await page.keyboard.press('Escape'); await page.wait_for_timeout(250)
    mark = len(await calls(page))
    await page.click('#pExit'); await page.wait_for_timeout(300)
    check('Carte : retour à la carte en plein niveau, rien de plus', await page.evaluate("Soleil.state") == 'map' and tail(await calls(page), mark) == '')
    await page.evaluate("Soleil.goHome()"); await page.wait_for_timeout(200)
    await page.evaluate("window.__adMs = 300")
    mark = len(await calls(page))
    await page.click('#dailyBtn'); await frames(page)
    check('Défi du jour : gameplayStart, sans pub avant', tail(await calls(page), mark) == 'gameplayStart', tail(await calls(page), mark))
    d0 = await page.evaluate("JSON.stringify(Soleil.store.get('daily'))")
    await page.keyboard.press('Escape'); await page.wait_for_timeout(250)
    t = await page.evaluate("[document.getElementById('pRestart').classList.contains('hide'), document.getElementById('pExit').innerText]")
    check('défi : pas de Recommencer (un seul essai), « Abandonner le défi »', t[0] and 'Abandonner' in t[1], t[1])
    mark = len(await calls(page))
    await page.click('#pResume'); await page.wait_for_timeout(800)
    d1 = await page.evaluate("JSON.stringify(Soleil.store.get('daily'))")
    check('Reprendre avec une pub : l’essai du défi ne change pas', tail(await calls(page), mark) == 'commercialBreak adStart adEnd gameplayStart' and d0 == d1, tail(await calls(page), mark))
    await page.wait_for_timeout(1100)
    await page.evaluate("Soleil.caught('running', 0.4)"); await page.wait_for_timeout(900)
    mark = len(await calls(page))
    await page.mouse.click(195, 420); await page.wait_for_timeout(300)
    st = await page.evaluate("[Soleil.state, !!document.getElementById('dailyBtn'), !!document.querySelector('#dailyBox .dcard')]")
    check('défi fini → accueil, sans événement ; le défi est marqué joué', st == ['title', False, True] and tail(await calls(page), mark) == '', str(st))
    await done(page, ctx)

async def t_ads(b):
    print('\n6) Pendant une pub : rien ne bouge, son coupé, entrées bloquées ; après : tout revient, sans appui fantôme')
    ctx, page = await new_page(b, ad=900)
    await page.click('#freeBtn'); await page.wait_for_timeout(300)
    await page.keyboard.press('Escape'); await page.wait_for_timeout(250)
    await page.click('#pResume'); await page.wait_for_timeout(250)
    st = await page.evaluate("({ ad: Soleil.Poki.inAd, h: Soleil.halted(), q: Soleil.Sound.quiet, pub: Soleil.Sound.hush.has('pub'), shield: !document.getElementById('adShield').classList.contains('hide'), g: Soleil.gtime })")
    check('pub en cours : jeu figé, son coupé, écran bloqué', st['ad'] and st['h'] and st['q'] and st['pub'] and st['shield'], json.dumps(st))
    await page.keyboard.down('Space'); await page.keyboard.press('p'); await page.wait_for_timeout(250)
    st2 = await page.evaluate("({ g: Soleil.gtime, k: Soleil.keyDown, p: Soleil.paused })")
    check('pendant la pub, le temps du jeu ne passe pas et le clavier ne fait rien', st2['g'] == st['g'] and not st2['k'], json.dumps(st2))
    await page.wait_for_timeout(700)
    log = await calls(page)
    st3 = await page.evaluate("({ q: Soleil.Sound.quiet, k: Soleil.keyDown, pr: Soleil.pressing, shield: document.getElementById('adShield').classList.contains('hide') })")
    check('après la pub : gameplayStart, son et écran rendus', log[-1] == 'gameplayStart' and not st3['q'] and st3['shield'], ' '.join(log[-4:]))
    check('aucun appui fantôme (la touche tenue pendant la pub ne compte pas)', not st3['k'] and not st3['pr'])
    await page.keyboard.up('Space')
    await page.keyboard.press('m'); await page.wait_for_timeout(1300)
    await page.keyboard.press('Escape'); await page.wait_for_timeout(250)
    await page.keyboard.press('Escape'); await page.wait_for_timeout(1400)
    check('son coupé par le joueur avant la pub : il reste coupé après', await page.evaluate("Soleil.Sound.muted && Soleil.Sound.quiet && !Soleil.Sound.hush.has('pub')"))
    await page.keyboard.press('m')
    await done(page, ctx)

async def t_fail_retry(b):
    print('\n7) Défaite et Rejouer : stop au « GRILLÉ ! », appui ignoré pendant le ralenti, double tap = une seule pub')
    ctx, page = await new_page(b)
    await page.evaluate("Soleil.WorldMap.open(); Soleil.Levels.open('w1-2', false)"); await page.wait_for_timeout(250)
    await page.keyboard.press('Space'); await frames(page)
    await page.evaluate("LVBOT('greedy', 60 * 30, () => Soleil.Levels.phase === 'caught')"); await frames(page, 2)
    st = await page.evaluate("Soleil.Levels.phase")
    check('GRILLÉ ! : gameplayStop dès le ralenti', st == 'caught' and (await calls(page))[-1] == 'gameplayStop')
    att = await page.evaluate("Soleil.Levels.m.attempt")
    await page.keyboard.press('Space'); await page.wait_for_timeout(120)
    check('un appui pendant le ralenti ne relance pas', await page.evaluate("Soleil.Levels.m.attempt") == att and 'commercialBreak' not in (await calls(page))[-2:])
    await page.wait_for_function("Soleil.Levels.phase === 'fail'"); await page.wait_for_timeout(350)
    mark = len(await calls(page))
    t = await page.evaluate("""new Promise(res => { const t0 = performance.now(); const f = () => Soleil.Levels.phase === 'play' ? res(performance.now() - t0) : requestAnimationFrame(f);
      for (let i = 0; i < 2; i++) { window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', key: ' ', bubbles: true })); window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space', key: ' ', bubbles: true })); }
      f(); })""")
    await frames(page)
    st = await page.evaluate("[Soleil.Levels.phase, Soleil.Levels.m.attempt]")
    check('double tap très rapide sur Rejouer : une seule pub, un seul nouvel essai', tail(await calls(page), mark) == 'commercialBreak gameplayStart' and st == ['play', att + 1], f"{tail(await calls(page), mark)} {st}")
    check('Rejouer reste ultra rapide sans pub', t < 60, f'{t:.0f} ms')
    await done(page, ctx)

async def t_hidden_blur(b):
    print('\n8) Onglet caché, fenêtre quittée : pause automatique, une seule fois')
    ctx, page = await new_page(b)
    hide = "v => { Object.defineProperty(document, 'hidden', { value: v, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); }"
    await page.evaluate(f"({hide})(true)"); await page.wait_for_timeout(100)
    check('onglet caché hors partie : pas de pause, aucun événement', not await page.evaluate("Soleil.paused") and await calls(page) == ['init', 'gameLoadingFinished'])
    await page.evaluate(f"({hide})(false)")
    await page.evaluate("Soleil.WorldMap.open(); Soleil.Levels.open('w1-3', false)"); await page.wait_for_timeout(250)
    await page.keyboard.press('Space'); await frames(page)
    mark = len(await calls(page))
    await page.evaluate(f"({hide})(true)"); await page.evaluate(f"({hide})(true)"); await page.evaluate("window.dispatchEvent(new Event('blur'))")
    log = await calls(page)
    st = await page.evaluate("[Soleil.paused, Soleil.Sound.hush.has('cachée')]")
    check('onglet caché en pleine partie : pause, un seul gameplayStop, son coupé', st == ['onglet', True] and tail(log, mark) == 'gameplayStop', f"{st} {tail(log, mark)}")
    await page.evaluate(f"({hide})(false)"); await page.wait_for_timeout(300)
    check('retour sur l’onglet : le menu pause attend', await page.evaluate("Soleil.paused === 'onglet' && !document.getElementById('pause').classList.contains('hide') && !Soleil.Sound.hush.has('cachée')"))
    await page.click('#pResume'); await frames(page)
    check('Reprendre : commercialBreak, gameplayStart', tail(await calls(page), mark) == 'gameplayStop commercialBreak gameplayStart')
    await page.wait_for_timeout(1100)
    await page.evaluate("window.dispatchEvent(new Event('blur'))"); await frames(page)
    check('fenêtre quittée : pause et gameplayStop', await page.evaluate("Soleil.paused") == 'fenêtre' and (await calls(page))[-1] == 'gameplayStop')
    await done(page, ctx)

async def t_casier_duo(b):
    print('\n9) Casier ouvert depuis l’écran de fin ; 2 joueurs (GO, manches, revanche)')
    ctx, page = await new_page(b)
    await page.click('#freeBtn'); await page.wait_for_timeout(300)
    await page.evaluate("Soleil.caught('running', 0.4)"); await page.wait_for_timeout(1100)
    mark = len(await calls(page))
    await page.click('#lock2'); await page.wait_for_timeout(200)
    await page.click('#pClose'); await page.wait_for_timeout(200)
    check('casier ouvert puis fermé depuis l’écran de fin : aucun événement', tail(await calls(page), mark) == '' and await page.evaluate("Soleil.state") == 'over')
    await page.mouse.click(195, 300); await frames(page)
    check('puis un appui (Rejouer) : commercialBreak, gameplayStart', tail(await calls(page), mark) == 'commercialBreak gameplayStart', tail(await calls(page), mark))
    await page.evaluate("Soleil.goHome()"); await page.wait_for_timeout(200)
    mark = len(await calls(page))
    await page.click('#duoBtn'); await page.wait_for_timeout(1500)
    check('2 joueurs : rien pendant l’annonce de la manche', tail(await calls(page), mark) == '' and await page.evaluate("Soleil.duo.phase") == 'intro')
    await page.wait_for_function("Soleil.duo.phase === 'play'"); await frames(page)
    check('« GO ! » : gameplayStart', tail(await calls(page), mark) == 'gameplayStart')
    await page.evaluate("Soleil.duo.racers[0].z = Soleil.DUO_FINISH + 1"); await frames(page)
    check('fin de manche : gameplayStop', await page.evaluate("Soleil.duo.phase") == 'roundEnd' and tail(await calls(page), mark) == 'gameplayStart gameplayStop')
    await page.wait_for_function("Soleil.duo.phase === 'play'", timeout=8000); await frames(page)
    check('manche suivante : gameplayStart à « GO ! »', tail(await calls(page), mark) == 'gameplayStart gameplayStop gameplayStart')
    await page.evaluate("Soleil.duo.wins[0] = Soleil.DUO_WIN - 1; Soleil.duo.racers[0].z = Soleil.DUO_FINISH + 1")
    await page.wait_for_function("document.getElementById('duoEnd').classList.contains('armed')", timeout=8000)
    m2 = len(await calls(page))
    await page.click('#rematch'); await page.wait_for_timeout(100); await page.click('#rematch', force=True)
    await page.wait_for_function("Soleil.duo && Soleil.duo.phase === 'play'", timeout=8000); await frames(page)
    check('Revanche : commercialBreak (une seule fois), puis gameplayStart à « GO ! »', tail(await calls(page), m2) == 'commercialBreak gameplayStart', tail(await calls(page), m2))
    await done(page, ctx)

async def t_sdk_modes(b):
    print('\n10) Avec le SDK, sans SDK (hors ligne / fichier), avec bloqueur de pub, SDK qui ne répond pas')
    for sdk, label in [('none', 'sans SDK'), ('adblock', 'bloqueur de pub (init refusé)')]:
        ctx, page = await new_page(b, sdk=sdk)
        await page.evaluate("Soleil.WorldMap.open(); Soleil.Levels.open('w1-3', false)"); await page.wait_for_timeout(250)
        await page.keyboard.press('Space'); await page.keyboard.press('Escape'); await page.wait_for_timeout(250)
        await page.click('#pResume'); await page.wait_for_timeout(30)
        st = await page.evaluate("({ mode: Soleil.Poki.mode, ph: Soleil.Levels.phase, p: Soleil.paused, g: Soleil.grace, playing: Soleil.Poki.playing })")
        check(f'{label} : on joue, pause et reprise sans attente', st['ph'] == 'play' and not st['p'] and st['g'] > 0.8 and st['playing'], json.dumps(st))
        await done(page, ctx)
    ctx, page = await new_page(b, sdk='hang', wait=False)
    await page.wait_for_timeout(700)
    st = await page.evaluate("({ s: Soleil.state, boot: Soleil.booting, home: document.getElementById('home').classList.contains('hide') })")
    check('SDK qui ne répond pas : le titre s’affiche pendant l’attente (sans boutons)', st['s'] == 'title' and st['boot'] and st['home'], json.dumps(st))
    await page.wait_for_function("Soleil.Poki.loaded", timeout=5000)
    st = await page.evaluate("({ mode: Soleil.Poki.mode, boot: Soleil.booting, t: performance.now() })")
    check('… puis le jeu démarre en mode de secours (délai max 2,5 s)', st['mode'] == 'secours' and not st['boot'] and st['t'] < 3600, f"{st['t']:.0f} ms")
    await done(page, ctx)

async def t_scroll_debug(b):
    print('\n11) La page ne défile jamais ; mode debug (?debug=1)')
    ctx, page = await new_page(b, debug=True)
    r = await page.evaluate("""(() => { const k = c => { const e = new KeyboardEvent('keydown', { code: c, key: c === 'Space' ? ' ' : c, bubbles: true, cancelable: true }); document.body.dispatchEvent(e); return e.defaultPrevented; };
      const wl = el => { const e = new WheelEvent('wheel', { deltaY: 100, bubbles: true, cancelable: true }); el.dispatchEvent(e); return e.defaultPrevented; };
      Soleil.openPanel(); const sheet = wl(document.querySelector('#panel .sheet')); Soleil.closePanel();
      return { space: k('Space'), down: k('ArrowDown'), up: k('ArrowUp'), pgdn: k('PageDown'), wheel: wl(document.body), sheet }; })()""")
    check('Espace, flèches, Page suivante : preventDefault', r['space'] and r['down'] and r['up'] and r['pgdn'], json.dumps(r))
    check('molette : preventDefault (sauf dans le casier, qui défile à l’intérieur)', r['wheel'] and not r['sheet'])
    await page.evaluate("Soleil.WorldMap.open(); Soleil.Levels.open('w1-3', false)"); await page.wait_for_timeout(200)
    await page.keyboard.press('Space'); await page.keyboard.press('Escape'); await page.wait_for_timeout(250); await page.keyboard.press('Escape'); await page.wait_for_timeout(100)
    bad = await page.evaluate("Soleil.debugLog.filter(l => l.kind === 'bad').length")
    check('journal à l’écran : chaque événement avec son heure, aucun en rouge dans une partie normale', await page.evaluate("!!document.getElementById('pokiDebug') && Soleil.debugLog.length >= 5") and bad == 0)
    await page.evaluate("Soleil.Poki.gameplayStart()")
    r = await page.evaluate("Soleil.debugLog.filter(l => l.kind === 'bad').map(l => l.name + ' — ' + l.info)")
    check('un événement en double est ignoré et affiché en rouge', r == ['gameplayStart — déjà en jeu'], str(r))
    await done(page, ctx)

async def t_iframe_share(b):
    print('\n12) Dans une iframe (comme sur Poki) : pilule, bouton Image, partage sans adresse')
    wrap = os.path.join(tempfile.gettempdir(), 'soleil_iframe.html')
    open(wrap, 'w').write(f'<!DOCTYPE html><html><body style="margin:0"><iframe id="g" src="{URL}" style="border:0;width:100vw;height:100vh"></iframe></body></html>')
    for touch in (True, False):
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=1, locale='fr-FR', has_touch=touch, is_mobile=touch)
        await ctx.route('**/poki-sdk.js', lambda r: r.fulfill(status=200, content_type='application/javascript', body=FAKE))
        await ctx.add_init_script("try { localStorage.setItem('soleil.onboard', '3'); } catch (e) {}")
        page = await ctx.new_page(); errs = []
        page.on('pageerror', lambda e: errs.append(str(e)))
        await page.goto('file://' + wrap); await page.wait_for_timeout(1200)
        fr = page.frames[1]
        st = await fr.evaluate("({ emb: Soleil.embedded, touch: Soleil.touchUI, pill: Soleil.pillX, cls: document.body.classList.contains('pill-zone'), img: document.getElementById('imgBtn').classList.contains('hide'), meta: getComputedStyle(document.getElementById('meta')).left })")
        if touch:
            check('iframe + tactile : zone de la pilule protégée (décalage 56 px)', st['emb'] and st['touch'] and st['pill'] == 56 and st['cls'] and st['meta'] == '66px', json.dumps(st))
        else:
            check('iframe + souris : pas de pilule, pas de décalage', st['emb'] and not st['touch'] and st['pill'] == 0 and not st['cls'], json.dumps(st))
        check('dans une iframe, le bouton Image est caché proprement', st['img'])
        if touch:
            await fr.click('#freeBtn'); await page.wait_for_timeout(200)
            await fr.evaluate("Soleil.caught('running', 0.4)"); await page.wait_for_timeout(1300)
            t = await fr.evaluate("Soleil.shareText()")
            check('texte de partage sans adresse de page', t and 'http' not in t and 'file:' not in t and '.html' not in t, t.split('\n')[0])
            f = await fr.evaluate("Soleil.prepareStory().then(f => !!f && f.size > 10000)")
            check('l’image se dessine sans erreur (et sans adresse)', f)
            await fr.click('#share'); await page.wait_for_timeout(300)
        ERRS.extend(errs); await ctx.close()

async def t_build(b):
    print('\n13) Le build Poki (dist/poki) marche dans le navigateur, avec et sans SDK')
    r = subprocess.run(['node', os.path.join(ROOT, 'tools', 'build-poki.js')], capture_output=True, text=True)
    check('node tools/build-poki.js : rapport « TOUT EST OK »', r.returncode == 0 and 'TOUT EST OK' in r.stdout, r.stdout.strip().split('\n')[-1])
    url = 'file://' + ROOT + '/dist/poki/index.html'
    for sdk in ('fake', 'none'):
        ctx, page = await new_page(b, sdk=sdk, onboard=None, url=url)
        st = await page.evaluate("[Soleil.state, Soleil.Levels.phase, typeof Soleil.debugHook, typeof Soleil.fakePoki, document.scripts.length]")
        await page.keyboard.down('Space'); await page.wait_for_timeout(250); await page.keyboard.up('Space')
        await page.keyboard.press('Escape'); await page.wait_for_timeout(250)
        await page.click('#pResume'); await page.wait_for_timeout(200)
        log = await calls(page)
        ok = st[:4] == ['level', 'ready', 'undefined', 'undefined'] and st[4] == 2 and await page.evaluate("Soleil.Levels.phase === 'play' && Soleil.Poki.playing")
        if sdk == 'fake':
            ok = ok and log == ['init', 'gameLoadingFinished', 'gameplayStart', 'gameplayStop', 'commercialBreak', 'gameplayStart']
        check(f"build {'avec' if sdk == 'fake' else 'sans'} SDK : 1re visite, appui, pause, reprise ; aucun mode debug", ok, ' '.join(log) or json.dumps(st))
        await done(page, ctx)

async def t_event_log(b):
    print('\n14) Le journal de tous les tests : jamais deux fois le même événement, rien pendant une pub')
    bad = []
    for log in LOGS:
        last, inad = None, False
        for i, e in enumerate(log):
            if e in ('gameplayStart', 'gameplayStop'):
                if e == last: bad.append(f'{e} deux fois de suite')
                if inad: bad.append(f'{e} pendant une pub')
                if 'gameLoadingFinished' not in log[:i]: bad.append(f'{e} avant gameLoadingFinished')
                last = e
            if (e == 'commercialBreak' or e.startswith('rewardedBreak')) and last == 'gameplayStart': bad.append(f'{e} en pleine partie')
            if e == 'adStart': inad = True
            if e == 'adEnd': inad = False
        if log.count('gameLoadingFinished') > 1: bad.append('gameLoadingFinished plusieurs fois')
    n = sum(len(l) for l in LOGS)
    check('aucun enchaînement interdit dans les journaux', not bad and n > 0, f'{n} événements, {len(LOGS)} journaux' + (' ; ' + ', '.join(bad[:5]) if bad else ''))
    check('aucune erreur JavaScript', not ERRS, '; '.join(ERRS[:3]))

# ====================================================================================================================
# v2.3 — étape Poki 2 : les 4 corrections, puis les pubs récompensées
# ====================================================================================================================
PAIR_JS = """(sel) => {                       // les règles de Poki, mesurées dans le navigateur
  const box = document.querySelector(sel);
  if (!box) return null;
  const n = box.querySelector('.rnorm'), r = box.querySelector('[data-reward]'), cap = box.parentNode.querySelector('.rcap');
  if (!n || !r) return { missing: true };
  const a = n.getBoundingClientRect(), c = r.getBoundingClientRect();
  const vis = el => { const s = getComputedStyle(el), q = el.getBoundingClientRect(); return s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity > 0.5 && q.width > 0; };
  return { normGreen: n.classList.contains('c-green'), rewGreen: r.classList.contains('c-green'),
           wide: a.width >= c.width - 0.5, tall: a.height >= c.height - 0.5,
           place: a.right <= c.left + 1 || a.bottom <= c.top + 1, both: vis(n) && vis(r),
           cam: !!r.querySelector('svg.ico'), cap: !!cap && cap.innerText.length > 10, capTxt: cap ? cap.innerText : '' };
}"""
def pair_ok(p): return p and not p.get('missing') and p['normGreen'] and not p['rewGreen'] and p['wide'] and p['tall'] and p['place'] and p['both'] and p['cam'] and p['cap']
async def pair(page, sel): return await page.evaluate(f"({PAIR_JS})('{sel}')")

async def to_fail(page, lv='w1-3'):                # un niveau, perdu exprès (le robot fonce)
    await page.evaluate(f"Soleil.WorldMap.open(); Soleil.Levels.open('{lv}', false)"); await page.wait_for_timeout(200)
    await page.keyboard.press('Space'); await frames(page)
    await page.evaluate("LVBOT('greedy', 60 * 40, () => Soleil.Levels.phase === 'caught')")
    await page.wait_for_function("Soleil.Levels.phase === 'fail' && document.getElementById('lvFail').classList.contains('armed')", timeout=5000)
    await page.wait_for_timeout(150)

async def t_fix_toast(b):
    print('\n15) Correction 1 : un message ne cache jamais « Touche l’écran pour rejouer » ni un bouton')
    for w, h, touch in [(390, 844, True), (640, 360, False), (844, 390, True)]:
        ctx, page = await new_page(b, w=w, h=h, touch=touch)
        await page.click('#freeBtn'); await page.wait_for_timeout(200)
        await page.evaluate("Soleil.caught('running', 0.4)"); await page.wait_for_timeout(1300)
        await page.evaluate("Soleil.toast('Série de 2 jours : +2 ⭐ (un message assez long pour le test)', true)"); await page.wait_for_timeout(350)
        r = await page.evaluate("""(() => { const t = document.getElementById('toast').getBoundingClientRect(), H = innerHeight;
          const hit = el => { const q = el.getBoundingClientRect(); return q.width > 0 && !(q.right <= t.left || q.left >= t.right || q.bottom <= t.top || q.top >= t.bottom); };
          const btns = [...document.querySelectorAll('button')].filter(el => !el.closest('.hide') && getComputedStyle(el).display !== 'none' && hit(el)).map(el => el.id || el.className);
          return { top: Math.round(t.top), bottom: Math.round(t.bottom), H, hint: H - 70, btns, inView: t.top >= 0 && t.bottom <= H }; })()""")
        check(f'{w}×{h} fin de course : message hors de la consigne du bas et d’aucun bouton', r['bottom'] < r['hint'] and not r['btns'] and r['inView'], json.dumps(r))
        await to_fail(page)
        await page.evaluate("Soleil.toast('Mission : +6 ⭐ (un message assez long pour le test)', true)"); await page.wait_for_timeout(350)
        r = await page.evaluate("""(() => { const t = document.getElementById('toast').getBoundingClientRect(), c = document.getElementById('lvFail').getBoundingClientRect();
          return { over: !(t.bottom <= c.top || t.top >= c.bottom || t.right <= c.left || t.left >= c.right), inView: t.top >= 0 && t.bottom <= innerHeight }; })()""")
        check(f'{w}×{h} défaite d’un niveau : message hors de la carte (ses boutons et « Touche pour réessayer »)', not r['over'] and r['inView'], json.dumps(r))
        await done(page, ctx)

async def t_fix_pill(b):
    print('\n16) Correction 2 : la pilule Poki, à gauche OU à droite (un seul réglage), et sa zone en mode debug')
    for side in ('left', 'right'):
        wrap = os.path.join(tempfile.gettempdir(), f'soleil_pill_{side}.html')
        open(wrap, 'w').write(f'<!DOCTYPE html><html><body style="margin:0"><iframe id="g" src="{URL}?debug=1&pill=1&pillside={side}" style="border:0;width:100vw;height:100vh"></iframe></body></html>')
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=1, locale='fr-FR', has_touch=True, is_mobile=True)
        await ctx.route('**/poki-sdk.js', lambda r: r.fulfill(status=200, content_type='application/javascript', body=FAKE))
        await ctx.add_init_script("try { localStorage.setItem('soleil.onboard', '3'); localStorage.setItem('soleil.plays', '3'); } catch (e) {}")
        page = await ctx.new_page(); errs = []
        page.on('pageerror', lambda e: errs.append(str(e)))
        await page.goto('file://' + wrap); await page.wait_for_timeout(1300)
        fr = page.frames[1]
        for where in ('home', 'level', 'map'):
            if where == 'level': await fr.evaluate("Soleil.WorldMap.open(); Soleil.Levels.open('w1-3', false); Soleil.Levels.press()"); await page.wait_for_timeout(300)
            if where == 'map': await fr.evaluate("Soleil.Levels.toMap()"); await page.wait_for_timeout(300)
            r = await fr.evaluate("""(() => { const W = innerWidth, P = Soleil.PILL, z = Soleil.PILL.side === 'right' ? { l: W - P.w, r: W } : { l: 0, r: P.w };
              const zone = { l: z.l, r: z.r, t: P.top, b: P.top + P.h };
              const bad = [...document.querySelectorAll('button')].filter(el => el.offsetParent !== null).filter(el => { const q = el.getBoundingClientRect();
                return q.width > 0 && !(q.right <= zone.l || q.left >= zone.r || q.bottom <= zone.t || q.top >= zone.b); }).map(el => el.id || el.className);
              const pz = document.getElementById('pillZone'), pr = pz && pz.getBoundingClientRect();
              return { side: P.side, pillX: Soleil.pillX, pillR: Soleil.pillR, bad, zone: !!pz && Math.round(pr.left) === zone.l && Math.round(pr.width) === P.w }; })()""")
            ok = r['side'] == side and not r['bad'] and r['zone'] and (r['pillX'] == 56 if side == 'left' else r['pillR'] == 56)
            check(f'pilule à {"gauche" if side == "left" else "droite"} ({where}) : aucun bouton dans sa zone, zone rouge en mode debug', ok, json.dumps(r))
        ERRS.extend(errs); await ctx.close()
    check('dans le build Poki, le réglage de test « pillside » et la zone rouge sont retirés',
          all(x not in open(os.path.join(ROOT, 'dist', 'poki', 'game.js')).read() for x in ('match(/[?&]pillside', 'pillZone')) if os.path.exists(os.path.join(ROOT, 'dist', 'poki', 'game.js')) else True)

async def t_fix_late_ad(b):
    print('\n17) Correction 3 : une pub qui démarre APRÈS le délai de 5 s')
    ctx, page = await new_page(b, ad=900, init_js="window.__adDelay = 6000;")
    await page.click('#freeBtn'); await page.wait_for_timeout(250)
    await page.evaluate("Soleil.caught('running', 0.4)"); await page.wait_for_timeout(1200)
    mark = len(await calls(page))
    await page.mouse.click(195, 300)                   # Rejouer : commercialBreak… la pub ne démarre pas
    await page.wait_for_timeout(5300)
    st = await page.evaluate("({ s: Soleil.state, wait: Soleil.breakWait, inAd: Soleil.Poki.inAd, busy: Soleil.Poki.busy })")
    check('au bout de 5 s sans pub : la partie reprend (le joueur n’attend pas plus)', st['s'] == 'play' and not st['wait'] and not st['inAd'], json.dumps(st))
    await page.keyboard.down('Space'); await page.wait_for_timeout(500)
    await page.wait_for_function("Soleil.Poki.inAd", timeout=3000)
    st = await page.evaluate("({ h: Soleil.halted(), q: Soleil.Sound.quiet, k: Soleil.keyDown, pr: Soleil.pressing, shield: !document.getElementById('adShield').classList.contains('hide'), playing: Soleil.Poki.playing, g: Soleil.gtime })")
    log = tail(await calls(page), mark)
    check('la pub démarre en retard : le jeu se fige, le son se coupe, les entrées sont bloquées', st['h'] and st['q'] and not st['k'] and not st['pr'] and st['shield'], json.dumps(st))
    check('… et aucun événement n’est envoyé pendant la pub', log.endswith('gameplayStart adStart'), log)
    await page.keyboard.up('Space')
    r = await page.evaluate("Soleil.Poki.commercialBreak().then(() => __calls.slice(-1)[0])")
    check('pendant ce temps, aucune nouvelle pub n’est demandée', r != 'commercialBreak', r)
    await page.wait_for_timeout(1300)
    st = await page.evaluate("({ inAd: Soleil.Poki.inAd, p: Soleil.paused, q: Soleil.Sound.hush.has('pub'), shield: document.getElementById('adShield').classList.contains('hide'), busy: Soleil.Poki.busy })")
    log = tail(await calls(page), mark)
    check('à la fin de la pub en retard : le son revient, la partie est en PAUSE (menu), rien ne bloque', not st['inAd'] and st['p'] == 'pub' and not st['q'] and st['shield'], json.dumps(st))
    check('… et gameplayStop part APRÈS la pub, avec la pause', log.endswith('adStart adEnd gameplayStop'), log)
    await done(page, ctx)

async def t_fix_typo(b):
    print('\n18) Correction 4 : typographie française et boutons de l’accueil')
    ctx, page = await new_page(b)
    r = await page.evaluate("""(() => { const S = Soleil, bad = [];
      const look = (k, v) => { if (typeof v === 'string' && /[ \\u202F][!?;:»]|«[ \\u202F]/.test(v)) bad.push(k + ' = ' + v); };
      for (const [k, v] of Object.entries(S.L)) {
        if (typeof v === 'string') look(k, v);
        else if (Array.isArray(v)) v.forEach((x, i) => look(k + '[' + i + ']', x));
        else if (typeof v === 'function') { try { look(k + '()', v(3, 'Zoé', 2)); } catch (e) { /* signature différente */ } }
      }
      for (const w of S.WORLDS) for (const lv of w.levels) { look(lv.id + '.name', S.tr(lv.name)); if (lv.tip) look(lv.id + '.tip', S.tr(lv.tip)); }
      return { bad: bad.slice(0, 5), n: bad.length, late: S.L.late('0,08'), sample: S.tr({ fr: 'Lis le mot avant de lâcher !', en: 'x' }) }; })()""")
    check('aucun « ! ? : ; » français précédé d’une espace ordinaire (insécable partout)', r['n'] == 0 and '\u00a0!' in r['late'] and '0,08\u00a0s' in r['late'], json.dumps(r, ensure_ascii=False))
    await page.evaluate("Soleil.WorldMap.open(); Soleil.Levels.open('w1-3', false)"); await page.wait_for_timeout(300)
    t = await page.evaluate("document.getElementById('lvIntro').innerText")
    check('carte d’intro du niveau 3 : « lâcher\u00a0! » (le « ! » ne peut plus être seul sur une ligne)', 'lâcher\u00a0!' in t, t.split('\n')[2] if len(t.split('\n')) > 2 else t)
    await done(page, ctx)
    for w, h, touch in [(640, 360, False), (836, 470, False), (1031, 580, False), (390, 844, True), (844, 390, True), (320, 568, True)]:
        ctx, page = await new_page(b, w=w, h=h, touch=touch)
        r = await page.evaluate("""[...document.querySelectorAll('#home .row .hbtn')].map(bt => { const t = bt.querySelector('.bt'), q = bt.getBoundingClientRect();
          return { id: bt.id, fit: t.scrollWidth <= t.clientWidth + 0.5 && bt.scrollWidth <= bt.clientWidth + 0.5 && q.right <= innerWidth && q.left >= 0,
                   fs: parseFloat(getComputedStyle(bt.querySelector('b')).fontSize) }; })""")
        check(f'accueil {w}×{h} : « Niveaux », « Infini », « 2 joueurs » tiennent dans leur bouton', all(x['fit'] for x in r) and all(x['fs'] >= 12 for x in r), json.dumps(r))
        await done(page, ctx)

async def t_reward_revive_level(b):
    print('\n19) 🎬 2e chance dans un niveau : règles de Poki, vidéo vue, on repart au même endroit')
    ctx, page = await new_page(b, ad=500)
    await to_fail(page)
    p = await pair(page, '#lvFail .rpair')
    check('carte de défaite : « Réessayer » vert + « 🎬 2e chance » (pas vert, plus petit ou égal, à droite, phrase « vidéo »)', pair_ok(p), json.dumps(p, ensure_ascii=False))
    z = await page.evaluate("Soleil.Levels.m.result.z")
    mark = len(await calls(page))
    await page.click('#lvFail [data-reward]'); await page.wait_for_timeout(5)
    await page.evaluate("document.querySelector('#lvFail [data-reward]') && document.querySelector('#lvFail [data-reward]').click()")
    await page.wait_for_function("Soleil.Poki.inAd", timeout=3000)
    st = await page.evaluate("({ q: Soleil.Sound.quiet, h: Soleil.halted(), shield: !document.getElementById('adShield').classList.contains('hide') })")
    check('pendant la vidéo : jeu figé, son coupé, écran bloqué', st['q'] and st['h'] and st['shield'], json.dumps(st))
    await page.wait_for_function("Soleil.Levels.phase === 'play'", timeout=4000); await frames(page)
    st = await page.evaluate("({ z: Soleil.Levels.m.player.z, v: Soleil.Levels.m.player.v, toast: Soleil.Levels.m.player.toast, rev: Soleil.Levels.m.revived, g: Soleil.grace, sun: Soleil.Levels.m.sun.state, att: Soleil.Levels.attempt, shield: document.getElementById('adShield').classList.contains('hide') })")
    log = tail(await calls(page), mark)
    check('vidéo vue : on reprend au même endroit, à l’arrêt, plus grillé, soleil de dos, 1 s de protection', abs(st['z'] - z) < 1.5 and st['v'] == 0 and st['toast'] == 0 and st['rev'] and st['g'] > 0.5 and st['sun'] == 'pause' and st['shield'], json.dumps(st))
    check('une seule vidéo (double clic), puis gameplayStart quand le jeu reprend', log == 'rewardedBreak:medium adStart adEnd gameplayStart', log)
    await page.keyboard.down('Space'); await page.wait_for_timeout(400)
    check('pendant la seconde de protection, on ne bouge pas', abs(await page.evaluate("Soleil.Levels.m.player.z") - st['z']) < 1e-6)
    await page.keyboard.up('Space'); await page.wait_for_timeout(800)
    await page.evaluate("LVBOT('greedy', 60 * 40, () => Soleil.Levels.phase === 'caught')")
    await page.wait_for_function("Soleil.Levels.phase === 'fail'", timeout=5000); await page.wait_for_timeout(300)
    check('grillé une 2e fois dans le même essai : plus de bouton 🎬 (une seule 2e chance par essai)', await page.evaluate("!document.querySelector('#lvFail [data-reward]') && !!document.querySelector('#lvFail .tap')"))
    await page.evaluate("Soleil.Levels.restart()"); await page.wait_for_timeout(200)
    await page.evaluate("LVBOT('greedy', 60 * 40, () => Soleil.Levels.phase === 'caught')")
    await page.wait_for_function("Soleil.Levels.phase === 'fail'", timeout=5000); await page.wait_for_timeout(300)
    check('nouvel essai : la 2e chance est de nouveau proposée', await page.evaluate("!!document.querySelector('#lvFail [data-reward]')"))
    best0 = await page.evaluate("(Soleil.Levels.peek('w1-3').best) || 0")
    await page.click('#lvFail [data-reward]')
    await page.wait_for_function("Soleil.Levels.phase === 'play'", timeout=4000); await page.wait_for_timeout(1100)
    await page.evaluate("LVBOT('good', 60 * 120, () => Soleil.Levels.phase === 'results' || Soleil.Levels.phase === 'fail')")
    await page.wait_for_function("Soleil.Levels.phase === 'results' || Soleil.Levels.phase === 'fail'", timeout=8000)
    st = await page.evaluate("({ ph: Soleil.Levels.phase, stars: Soleil.Levels.info && Soleil.Levels.info.stars, best: Soleil.Levels.peek('w1-3').best, nb: Soleil.Levels.info && Soleil.Levels.info.newBest })")
    await page.wait_for_timeout(2200)
    txt = await page.evaluate("document.getElementById('lvEnd') ? document.getElementById('lvEnd').innerText : ''")
    check('gagné après une 2e chance : ★★★ impossible (et c’est écrit), meilleur temps pas enregistré', st['ph'] == 'results' and st['stars'][2] is False and not st['nb'] and st['best'] == best0 and '2e chance' in txt, json.dumps(st))
    await done(page, ctx)

async def t_reward_refused(b):
    print('\n20) 🎬 vidéo refusée, indisponible, bloqueur de pub : AUCUNE récompense')
    for label, js in [('vidéo pas vue jusqu’au bout', 'window.__rewardOk = false;'), ('aucune vidéo disponible', 'window.__rewardNone = true;')]:
        ctx, page = await new_page(b, ad=300, init_js=js)
        await to_fail(page)
        await page.click('#lvFail [data-reward]'); await page.wait_for_timeout(900)
        st = await page.evaluate("({ ph: Soleil.Levels.phase, rev: Soleil.Levels.m.revived, toast: document.getElementById('toast').innerText, btn: !!document.querySelector('#lvFail [data-reward]:not([disabled])'), shield: document.getElementById('adShield').classList.contains('hide'), w: Soleil.rewardWait })")
        check(f'{label} : pas de 2e chance, le bouton revient, petit message neutre, rien ne bloque', st['ph'] == 'fail' and not st['rev'] and st['btn'] and 'indisponible' in st['toast'] and 'bloqu' not in st['toast'] and st['shield'] and not st['w'], json.dumps(st, ensure_ascii=False))
        await page.keyboard.press('Space'); await page.wait_for_timeout(1000)
        check('… et « Réessayer » (Espace) marche toujours', await page.evaluate("Soleil.Levels.phase") == 'play')
        await done(page, ctx)
    ctx, page = await new_page(b, sdk='adblock')
    await to_fail(page)
    check('bloqueur de pub (init refusé) : bouton 🎬 présent, mais la vidéo ne donne rien', await page.evaluate("Soleil.Poki.rewardedBreak('small')") is False)
    await done(page, ctx)

async def t_reward_hidden(b):
    print('\n21) 🎬 jamais proposé : sans SDK, défi du jour, 2 joueurs, niveau en douceur')
    ctx, page = await new_page(b, sdk='none')
    await to_fail(page)
    a = await page.evaluate("!document.querySelector('#lvFail [data-reward]') && !!document.querySelector('#lvFail .tap')")
    await page.evaluate("Soleil.Levels.toMap(); Soleil.goHome()"); await page.wait_for_timeout(200)
    await page.click('#freeBtn'); await page.wait_for_timeout(200)
    await page.evaluate("Soleil.caught('running', 0.4)"); await page.wait_for_timeout(1300)
    c = await page.evaluate("document.getElementById('ovPair').innerHTML === ''")
    await page.evaluate("Soleil.goHome(); Soleil.openPanel(); Soleil.openFiche(Soleil.OUTFITS.find(o => o.id === 'vampire'))"); await page.wait_for_timeout(300)
    d = await page.evaluate("!document.querySelector('#ofiche [data-reward]') && !!document.querySelector('#ofiche .rnorm')")
    check('mode de secours (aucun SDK) : aucun bouton 🎬 (défaite, fin de course, casier)', a and c and d, f'{a} {c} {d}')
    await done(page, ctx)
    ctx, page = await new_page(b)
    await page.click('#dailyBtn'); await page.wait_for_timeout(200)
    await page.evaluate("Soleil.caught('running', 0.4)"); await page.wait_for_timeout(1300)
    check('défi du jour : pas de 2e chance (un seul essai, le même pour tous)', await page.evaluate("document.getElementById('ovPair').innerHTML === '' && !Soleil.Reward.canRevive()"))
    await page.evaluate("Soleil.goHome()"); await page.wait_for_timeout(200)
    await page.click('#duoBtn'); await page.wait_for_timeout(300)
    check('2 joueurs : aucune 2e chance', await page.evaluate("!Soleil.Reward.canRevive() && !document.querySelector('[data-reward]')"))
    await done(page, ctx)
    ctx, page = await new_page(b, onboard=0)
    await page.keyboard.down('Space'); await page.wait_for_timeout(3000); await page.keyboard.up('Space')
    st = await page.evaluate("({ id: Soleil.Levels.def.id, ph: Soleil.Levels.phase, soft: !!Soleil.Levels.m.level.soft, can: Soleil.Reward.canRevive(), rev: Soleil.Match.revive(Soleil.Levels.m) })")
    check('niveau 1 en douceur : on ne peut pas y perdre, donc pas de 2e chance', st['soft'] and not st['can'] and st['rev'] is False and st['ph'] != 'fail', json.dumps(st))
    await done(page, ctx)

async def t_reward_endless(b):
    print('\n22) 🎬 Continuer en course infinie : une fois par partie, rien n’est compté deux fois')
    ctx, page = await new_page(b, ad=400, init_js="localStorage.setItem('soleil.best', '40'); localStorage.setItem('soleil.plays', '5');")
    await page.click('#freeBtn'); await page.wait_for_timeout(200)
    await page.evaluate("Soleil.runner.z = 52.4; Soleil.caught('running', 0.4)"); await page.wait_for_timeout(1300)
    p = await pair(page, '#ovPair .rpair')
    check('fin de course : « Rejouer » vert + « 🎬 Continuer » (règles de Poki)', pair_ok(p), json.dumps(p, ensure_ascii=False))
    st0 = await page.evaluate("({ plays: Soleil.plays, stars: Soleil.stars, best: Soleil.best, runs: Soleil.mstate.runs, total: Soleil.mstate.total })")
    await page.click('#ovPair [data-reward]')
    await page.wait_for_function("Soleil.state === 'play'", timeout=4000); await frames(page)
    st = await page.evaluate("({ z: Soleil.runner.z, v: Soleil.runner.v, toast: Soleil.runner.toast, sun: Soleil.watcher.state, g: Soleil.grace, rev: Soleil.revivedRun, ev: Soleil.events.map(e => e.s).join('') })")
    check('vidéo vue : la course continue au même endroit, à l’arrêt, soleil de dos, 1 s de protection', abs(st['z'] - 52.4) < 1 and st['v'] == 0 and st['toast'] == 0 and st['sun'] == 'pause' and st['g'] > 0.5 and st['rev'] and '🎬' in st['ev'], json.dumps(st, ensure_ascii=False))
    await page.wait_for_timeout(1200)
    await page.evaluate("Soleil.runner.z = 61.2; Soleil.caught('running', 0.4)"); await page.wait_for_timeout(1300)
    st1 = await page.evaluate("({ plays: Soleil.plays, stars: Soleil.stars, best: Soleil.best, runs: Soleil.mstate.runs, total: Soleil.mstate.total, pair: document.getElementById('ovPair').innerHTML, isRec: Soleil.lastRun.isRec, prev: Soleil.lastRun.prevBest })")
    check('grillé à nouveau : une seule partie comptée, la distance n’est pas comptée deux fois, record par rapport à AVANT la partie',
          st1['plays'] == st0['plays'] and st1['runs'] == st0['runs'] and st1['total'] == st0['total'] + 9 and st1['best'] == 61 and st1['isRec'] and st1['prev'] == 40, json.dumps({k: st1[k] for k in st1 if k != 'pair'}))
    check('… et plus de bouton 🎬 (une seule 2e chance par partie)', st1['pair'] == '')
    mark = len(await calls(page))
    await page.mouse.click(195, 300)
    await page.wait_for_function("Soleil.state === 'play' && Soleil.Poki.playing", timeout=4000)
    check('nouvelle partie : 2e chance de nouveau possible plus tard, Rejouer = commercialBreak', tail(await calls(page), mark) == 'commercialBreak adStart adEnd gameplayStart' and await page.evaluate("!Soleil.revivedRun"), tail(await calls(page), mark))
    await done(page, ctx)

async def t_reward_double(b):
    print('\n23) 🎬 ×2 ⭐ sur l’écran de résultats')
    ctx, page = await new_page(b, ad=300)
    await page.evaluate("Soleil.WorldMap.open(); Soleil.Levels.open('w1-3', false)"); await page.wait_for_timeout(200)
    await page.keyboard.press('Space'); await frames(page)
    await page.evaluate("LVBOT('good', 60 * 120, () => Soleil.Levels.phase === 'results')")
    await page.wait_for_function("document.getElementById('lvEnd') && document.getElementById('lvEnd').classList.contains('armed')", timeout=6000)
    coins = await page.evaluate("Soleil.Levels.info.coins")
    p = await pair(page, '#lvEnd .rpair')
    check('résultats : « Suivant » vert + « 🎬 ×2 ⭐ » (règles de Poki)', coins > 0 and pair_ok(p), f'{coins} ⭐ ' + json.dumps(p, ensure_ascii=False))
    s0 = await page.evaluate("Soleil.stars")
    await page.click('#lvEnd [data-reward]'); await page.wait_for_timeout(80); await page.click('#lvEnd [data-reward]', force=True)
    await page.wait_for_timeout(900)
    st = await page.evaluate("({ s: Soleil.stars, d: Soleil.Levels.info.doubled, btn: document.querySelector('#lvEnd [data-reward]').disabled, ex: document.querySelector('#lvEnd .extra').innerText, n: __calls.filter(c => c.startsWith('rewardedBreak')).length })")
    check('vidéo vue : les ⭐ du niveau sont doublées UNE fois (double clic = une seule vidéo)', st['s'] == s0 + coins and st['d'] and st['btn'] and st['n'] == 1 and '×2' in st['ex'], json.dumps(st, ensure_ascii=False))
    await page.evaluate("Soleil.Reward.claim(document.querySelector('#lvEnd [data-reward]'))"); await page.wait_for_timeout(500)
    check('impossible de la redemander', await page.evaluate("Soleil.stars") == s0 + coins)
    await page.evaluate("Soleil.Levels.restart()"); await page.wait_for_timeout(200)
    await page.evaluate("LVBOT('good', 60 * 120, () => Soleil.Levels.phase === 'results')")
    await page.wait_for_timeout(2500)
    check('rejoué sans rien gagner de nouveau : pas de bouton ×2', await page.evaluate("Soleil.Levels.info.coins === 0 ? !document.querySelector('#lvEnd [data-reward]') : true"))
    await done(page, ctx)

async def t_reward_trial(b):
    print('\n24) 🎬 Essayer une tenue : portée UNE partie, jamais achetée, oubliée au rechargement')
    ctx, page = await new_page(b, ad=300, init_js="localStorage.setItem('soleil.stars', '5');")
    await page.click('#locker'); await page.wait_for_timeout(200)
    await page.evaluate("Soleil.openFiche(Soleil.OUTFITS.find(o => o.id === 'vampire'))"); await page.wait_for_timeout(400)
    p = await pair(page, '#ofiche .rpair')
    check('fiche d’une tenue : « Acheter » vert + « 🎬 Essayer » (règles de Poki)', pair_ok(p), json.dumps(p, ensure_ascii=False))
    await page.click('#ofiche [data-reward]'); await page.wait_for_timeout(900)
    st = await page.evaluate("({ t: Soleil.trial, worn: Soleil.wornOutfit(), outfit: Soleil.outfit, owned: Soleil.owned.slice(), saved: Soleil.store.get('owned'), fiche: document.getElementById('ofiche').classList.contains('hide'), badge: !!document.querySelector('.oc.trying') })")
    check('vidéo vue : portée tout de suite (badge « Essai »), jamais ajoutée aux tenues achetées', st['t'] == {'id': 'vampire', 'state': 'ready'} and st['worn'] == 'vampire' and st['outfit'] == 'classic' and 'vampire' not in st['owned'] and 'vampire' not in (st['saved'] or []) and st['badge'], json.dumps(st))
    await page.click('#pClose'); await page.wait_for_timeout(150)
    await page.click('#dailyBtn'); await page.wait_for_timeout(250)
    st = await page.evaluate("({ worn: Soleil.wornOutfit(), t: Soleil.trial && Soleil.trial.state })")
    check('défi du jour : pas d’essai (la tenue habituelle), l’essai reste en attente', st['worn'] == 'classic' and st['t'] == 'ready', json.dumps(st))
    await page.evaluate("Soleil.caught('running', 0.4)"); await page.wait_for_timeout(1200)
    await page.evaluate("Soleil.goHome()"); await page.wait_for_timeout(200)
    await page.click('#freeBtn'); await page.wait_for_timeout(250)
    st = await page.evaluate("({ worn: Soleil.wornOutfit(), t: Soleil.trial && Soleil.trial.state, tag: !document.getElementById('trialTag').classList.contains('hide') })")
    check('partie suivante (course libre) : la tenue d’essai est portée, badge à l’écran', st['worn'] == 'vampire' and st['t'] == 'on' and st['tag'], json.dumps(st))
    await page.evaluate("Soleil.caught('running', 0.4)"); await page.wait_for_timeout(1200)
    await page.mouse.click(195, 300)
    await page.wait_for_function("Soleil.state === 'play' && Soleil.Poki.playing", timeout=4000); await page.wait_for_timeout(150)
    st = await page.evaluate("({ worn: Soleil.wornOutfit(), t: Soleil.trial, tag: document.getElementById('trialTag').classList.contains('hide'), toast: document.getElementById('toast').innerText })")
    check('partie d’après : retour à la tenue habituelle, message « Tu l’as aimée ? »', st['worn'] == 'classic' and st['t'] is None and st['tag'] and 'aimée' in st['toast'], json.dumps(st, ensure_ascii=False))
    await page.evaluate("Soleil.goHome(); Soleil.openPanel(); Soleil.openFiche(Soleil.OUTFITS.find(o => o.id === 'cap'))"); await page.wait_for_timeout(400)
    await page.click('#ofiche [data-reward]'); await page.wait_for_timeout(900)
    await page.reload(); await page.wait_for_function("Soleil.Poki && Soleil.Poki.loaded"); await page.wait_for_timeout(200)
    check('rechargement de la page : l’essai est oublié', await page.evaluate("Soleil.trial === null && Soleil.wornOutfit() === Soleil.outfit"))
    await done(page, ctx)

TESTS = [t_new_player, t_soft_level1, t_returning, t_pause_endless, t_pause_level_daily, t_ads, t_fail_retry, t_hidden_blur,
         t_casier_duo, t_sdk_modes, t_scroll_debug, t_iframe_share, t_build,
         t_fix_toast, t_fix_pill, t_fix_late_ad, t_fix_typo,
         t_reward_revive_level, t_reward_refused, t_reward_hidden, t_reward_endless, t_reward_double, t_reward_trial, t_event_log]

async def main():
    only = sys.argv[1:]
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=os.environ.get('CHROME') or None, args=['--disable-gpu', '--autoplay-policy=no-user-gesture-required'])
        for t in TESTS:
            if only and t.__name__ not in only and t is not t_event_log: continue
            try: await t(b)
            except Exception as e: check(f'{t.__name__} : exception', False, str(e)[:300])
        await b.close()
    ok = sum(RES); print(f'\nBILAN : {ok}/{len(RES)} vérifications OK')
    sys.exit(0 if ok == len(RES) else 1)

asyncio.run(main())
