# Tests de l'intégration Poki (étape 1, v2.2), dans un vrai navigateur (Playwright).
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
            if e == 'commercialBreak' and last == 'gameplayStart': bad.append('commercialBreak en pleine partie')
            if e == 'adStart': inad = True
            if e == 'adEnd': inad = False
        if log.count('gameLoadingFinished') > 1: bad.append('gameLoadingFinished plusieurs fois')
    n = sum(len(l) for l in LOGS)
    check('aucun enchaînement interdit dans les journaux', not bad and n > 0, f'{n} événements, {len(LOGS)} journaux' + (' ; ' + ', '.join(bad[:5]) if bad else ''))
    check('aucune erreur JavaScript', not ERRS, '; '.join(ERRS[:3]))

TESTS = [t_new_player, t_soft_level1, t_returning, t_pause_endless, t_pause_level_daily, t_ads, t_fail_retry, t_hidden_blur,
         t_casier_duo, t_sdk_modes, t_scroll_debug, t_iframe_share, t_build, t_event_log]

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
