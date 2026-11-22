# Tests automatiques du mode Niveaux (monde 1 en phase 1, tests 1 à 10 ; monde 2 en phase 2, tests 11 à 18),
# dans un vrai navigateur (Playwright).
# Installation : pip install playwright && playwright install chromium
# Lance : python3 tools/tests/test_levels.py            (tous les tests)
#         python3 tools/tests/test_levels.py t_boss     (un seul test)
# Variable CHROME=/chemin/vers/chrome pour utiliser un autre navigateur.
import asyncio, sys, json, re, glob, os
from playwright.async_api import async_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')) + '/'
URL = 'file://' + ROOT + 'index.html'
RES = []
def check(name, ok, info=''):
    RES.append(ok); print(('  ✅ ' if ok else '  ❌ ') + name + (f'  [{info}]' if info != '' else ''))

# Un joueur « robot » rejoué image par image (avance rapide) : lâche dès « SO », repart seulement au vrai retour (le « ding »)
FAST = """
window.LVBOT = (mode, frames, stopAt) => {
  const S = Soleil;
  for (let i = 0; i < frames; i++) {
    const L = S.Levels, m = L.m;
    if (mode !== 'none' && (L.phase === 'intro' || L.phase === 'boss')) L.press();
    if (m && L.phase === 'play') {
      const w = m.sun;
      if (mode === 'good') S.pressing = !((w.state === 'chant' && (w.textKind === 'so' || w.textKind === 'trigger')) || w.state === 'turn' || w.state === 'look'
        || w.state === 'peek' || w.state === 'hop' || (w.state === 'return' && w.retTo > 0));   // il attend le vrai « ding »
      else if (mode === 'greedy') S.pressing = true;
    } else S.pressing = false;
    S.update(1 / 60);
    if (stopAt && stopAt()) return i;
  }
  return frames;
};
"""
async def new_page(b, locale='fr-FR', w=390, h=844):
    ctx = await b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=1, locale=locale, has_touch=True)
    await ctx.route('**/poki-sdk.js', lambda r: r.fulfill(status=200, content_type='application/javascript', body='window.PokiSDKfailed = true;'))   # pas de SDK : mode de secours (v2.2)
    await ctx.add_init_script("localStorage.setItem('soleil.onboard', '3')")   # joueur qui revient : pas de premiers pas (test_poki.py les teste)
    page = await ctx.new_page()
    page.errs = []
    page.on('pageerror', lambda e: page.errs.append(str(e)))
    page.on('console', lambda m: page.errs.append(m.text) if m.type == 'error' else None)
    await page.goto(URL); await page.wait_for_function("Soleil.Poki && Soleil.Poki.loaded"); await page.wait_for_timeout(100)
    await page.evaluate(FAST)
    return ctx, page
ERRS = []

async def t_flow(b):
    print('\n1) Parcours : accueil → carte → niveau 1 → résultats → niveau 2')
    ctx, page = await new_page(b)
    await page.click('#lvBtn'); await page.wait_for_timeout(200)
    check('le bouton Niveaux ouvre la carte', await page.evaluate("Soleil.state") == 'map')
    n = await page.evaluate("(() => { const n = Soleil.WorldMap.nodes[0]; return [n.x, n.y]; })()")
    await page.mouse.click(n[0], n[1]); await page.wait_for_timeout(150)
    intro = await page.evaluate("[Soleil.Levels.phase, document.getElementById('lvIntro').classList.contains('show'), document.getElementById('lvIntro').innerText]")
    check('carte d’intro : nom, objectif, défi', intro[0] == 'intro' and intro[1] and 'Premiers pas' in intro[2] and 'top 2' in intro[2] and 'piège' in intro[2], intro[2].replace('\n', ' / ')[:90])
    await page.wait_for_timeout(2100)
    ph = await page.evaluate("Soleil.Levels.phase")
    await page.keyboard.press('Space'); await page.wait_for_timeout(50)
    check('l’intro attend un appui (v2.2 : gameplayStart à l’appui), puis la partie démarre', ph == 'intro' and await page.evaluate("Soleil.Levels.phase") == 'play')
    f = await page.evaluate("LVBOT('good', 60 * 90, () => Soleil.Levels.phase === 'results')")
    r = await page.evaluate("({ ph: Soleil.Levels.phase, t: Soleil.Levels.m.result && Soleil.Levels.m.result.time, win: Soleil.Levels.m.result && Soleil.Levels.m.result.win, txt: document.getElementById('lvEnd').innerText, sv: Soleil.store.get('levels', {}) })")
    check('le robot prudent finit le niveau 1 et voit les résultats', r['ph'] == 'results' and r['win'], f"{r['t']:.1f} s" if r['t'] else r['ph'])
    check('résultats : titre, classement, étoiles, 3 boutons', 'BRAVO' in r['txt'] and 'Toi' in r['txt'] and 'Suivant' in r['txt'] and 'Rejouer' in r['txt'] and 'Carte' in r['txt'])
    await page.wait_for_timeout(1700)
    on = await page.evaluate("[...document.querySelectorAll('#lvEnd .stars span')].map(s => s.className)")
    check('les étoiles s’allument une par une', on[0] == 'on' and all(c in ('on', 'off') for c in on), str(on))
    check('progression enregistrée (soleil.levels)', r['sv'].get('w1-1', {}).get('done') is True)
    await page.click('#lvEnd button[data-act="next"]'); await page.wait_for_timeout(200)
    check('« Suivant » ouvre le niveau 2', await page.evaluate("[Soleil.Levels.def.id, Soleil.Levels.phase].join()") == 'w1-2,intro')
    ERRS.extend(page.errs); await ctx.close()

async def t_fail(b):
    print('\n2) Défaite : raison exacte, « presque », relance en moins d’une seconde (niveau 2 : le niveau 1 est en douceur depuis la v2.2)')
    ctx, page = await new_page(b)
    await page.evaluate("Soleil.WorldMap.open(); Soleil.Levels.open('w1-2', false)")
    await page.evaluate("LVBOT('greedy', 60 * 30, () => Soleil.Levels.phase === 'fail')")
    r = await page.evaluate("({ ph: Soleil.Levels.phase, txt: document.getElementById('lvFail').innerText, why: Soleil.Levels.m.result.why })")
    check('grillé en courant tout le temps → carte de défaite', r['ph'] == 'fail', r['why'])
    check('la carte dit pourquoi, avec le temps exact, et à combien de l’arrivée', ('trop tard' in r['txt'] or 'courais encore' in r['txt']) and ('arrivée' in r['txt'] or 'étais' in r['txt']), r['txt'].replace('\n', ' / ')[:110])
    await page.evaluate("LVBOT('none', 30)")
    t0 = await page.evaluate("performance.now()")
    await page.keyboard.press('Space')
    t1 = await page.evaluate("new Promise(res => { const f = () => Soleil.Levels.phase === 'play' ? res(performance.now()) : requestAnimationFrame(f); f(); })")
    att = await page.evaluate("Soleil.Levels.m.attempt")
    check('un tap relance le niveau en moins d’une seconde (sans carte d’intro)', t1 - t0 < 1000 and att == 2, f"{t1 - t0:.0f} ms, essai {att}")
    # message « trop tard » chiffré
    await page.evaluate("""(() => { const S = Soleil, m = S.Levels.m; S.pressing = true;
      for (let i = 0; i < 3000 && !(m.sun.state === 'turn' && m.sun.t >= m.sun.turnDur - 0.1); i++) S.update(1/60);
      S.pressing = false; for (let i = 0; i < 400 && S.Levels.phase !== 'fail'; i++) S.update(1/60); })()""")
    txt = await page.evaluate("document.getElementById('lvFail').innerText")
    check('lâché pendant le demi-tour : « Lâché 0,xx s trop tard ! »', bool(re.search(r'Lâché 0,\d\d\s+s trop tard', txt)), txt.split('\n')[0])
    ERRS.extend(page.errs); await ctx.close()

async def t_determinism(b):
    print('\n3) Graine : même essai = même chant ; essais différents = rythme différent, événements prévus identiques')
    ctx, page = await new_page(b)
    r = await page.evaluate("""(() => {
      const S = Soleil, log = (id, a) => { const m = S.Match.create(S.levelById(id), a, { playerBrain: 'moyen' }), out = [];
        while (!m.result && m.t < 90) { S.Match.step(m, 1/60); for (const e of m.out) out.push(e.type + (e.ev ? e.ev.text : '') + '@' + e.t.toFixed(3)); m.out.length = 0; }
        return out.join('|'); };
      const a = log('w1-7', 5), b = log('w1-7', 5), c = log('w1-7', 6);
      let traps = 0;
      for (let k = 1; k <= 40; k++) { const m = S.Match.create(S.levelById('w1-1'), k, {}); traps += S.Match.cycleConfig(m, 2).traps === 1 ? 1 : 0; }
      const words = k => { const m = S.Match.create(S.levelById('w1-3'), k, {}); return S.Match.cycleConfig(m, 1).word.toFixed(3); };
      return { same: a === b, diff: a !== c, n: a.split('|').length, traps, w1: words(1), w2: words(2) };
    })()""")
    check('même niveau, même essai : exactement les mêmes événements (rivaux compris)', r['same'], f"{r['n']} événements")
    check('essai suivant : le rythme change', r['diff'] and r['w1'] != r['w2'], f"mot {r['w1']} s / {r['w2']} s")
    check('niveau 1 : mot piège forcé au cycle 2, à chaque essai', r['traps'] == 40, f"{r['traps']}/40")
    src = ''.join(open(f).read() for f in [ROOT + 'js/game/match.js', ROOT + 'js/game/rivals.js', ROOT + 'js/game/physics.js', ROOT + 'levels/world1.js', ROOT + 'levels/world2.js', ROOT + 'levels/worlds.js'])
    chant = open(ROOT + 'js/game/chant.js').read()
    check('aucun Math.random() dans le moteur, les cerveaux, la physique et les niveaux', 'Math.random(' not in src and 'Math.random(' not in chant)
    ERRS.extend(page.errs); await ctx.close()

async def t_fair(b):
    print('\n4) Le jeu reste juste : lâcher au bon moment suffit toujours')
    ctx, page = await new_page(b)
    r = await page.evaluate("""(() => {
      const S = Soleil, res = {};
      for (const lv of S.WORLDS[0].levels) { let w = 0;
        for (let a = 1; a <= 120; a++) { const m = S.Match.create(lv, a, { playerBrain: 'expert' }); m.out = null;
          while (!m.result && m.t < 150) S.Match.step(m, 1/60); if (m.result && m.result.win) w++; }
        res[lv.num] = w; }
      return res; })()""")
    # v2.5 : le recomptage (niveau 4) et la fausse alerte (niveau 7) peuvent, rarement, piéger même l'expert
    check('expert : au moins 117/120 sur chacun des 8 niveaux', all(v >= 117 for v in r.values()), json.dumps(r))
    ERRS.extend(page.errs); await ctx.close()

async def t_rivals(b):
    print('\n5) Rivaux : grillé → tout noir, fumée, animation, retour au départ ; le soleil rigole')
    ctx, page = await new_page(b)
    await page.evaluate("Soleil.WorldMap.open(); Soleil.Levels.open('w1-7', false)")
    await page.evaluate("LVBOT('good', 60 * 6)")
    await page.evaluate("LVBOT('good', 60 * 20, () => Soleil.Levels.m.sun.state === 'look')")
    r = await page.evaluate("""(() => { const S = Soleil, m = S.Levels.m, rv = m.rivals[0];
      rv.state = 'race'; rv.brain.queue = []; rv.brain.press = true; rv.v = 6; rv.z = Math.max(rv.z, 10);
      LVBOT('good', 2); const a = { st: rv.state, laugh: m.sun.laugh };
      LVBOT('good', 30); a.toast = rv.toast; a.anim = rv.anim;
      LVBOT('good', Math.ceil(60 * S.Match.RIVAL_RESPAWN)); a.back = [rv.state, Math.round(rv.z)]; return a; })()""")
    check('rival qui bouge pendant le regard : grillé', r['st'] == 'grilled')
    check('le soleil rigole', r['laugh'] > 0.5, f"{r['laugh']:.2f}")
    check('il devient tout noir et fait son animation (tombe / trépigne)', r['toast'] > 0.5 and r['anim'] in ('fall', 'stomp'), r['anim'])
    check('puis il repart du début du niveau', r['back'][0] == 'race' and r['back'][1] <= 3, str(r['back']))
    s = await page.evaluate("""(() => { const S = Soleil, m = S.Levels.m; return m.rivals.map(r => r.lane).sort((a, b) => a - b).join(' '); })()""")
    check('5 rivaux, chacun dans son couloir (gauche / droite)', len(s.split(' ')) == 5, s)
    ERRS.extend(page.errs); await ctx.close()

async def t_map(b):
    print('\n6) Carte : cadenas, monde 3 verrouillé (étoiles du monde 2), mondes 4 et 5 « Bientôt », clavier, étoiles')
    ctx, page = await new_page(b)
    await page.click('#lvBtn'); await page.wait_for_timeout(150)
    n = await page.evaluate("Soleil.WorldMap.nodes.map(n => [n.x, n.y])")
    await page.mouse.click(n[1][0], n[1][1]); await page.wait_for_timeout(250)
    t = await page.evaluate("[Soleil.state, document.getElementById('toast').innerText]")
    check('niveau 2 verrouillé : on reste sur la carte, message clair', t[0] == 'map' and 'débloquer' in t[1], t[1])
    tab = await page.evaluate("(() => { Soleil.WorldMap.layout(); const S = Soleil; return 0; })()")
    await page.wait_for_timeout(1800)
    await page.mouse.click(14 + 62 * 2.5, 48 + 18); await page.wait_for_timeout(250)
    t3 = await page.evaluate("document.getElementById('toast').innerText")
    check('monde 3 (la plage) : verrouillé, il faut des étoiles du monde 2', 'monde 2' in t3 and 'débloquer' in t3, t3)
    await page.wait_for_timeout(800)                # un message à la fois : le suivant attend que le 1er ait été lu (0,9 s)
    await page.mouse.click(14 + 62 * 3.5, 48 + 18); await page.wait_for_timeout(250)
    check('monde 4 : « Bientôt »', 'bientôt' in (await page.evaluate("document.getElementById('toast').innerText")).lower())
    for k in ['ArrowRight', 'ArrowLeft', 'ArrowLeft', 'Enter']: await page.keyboard.press(k)
    await page.wait_for_timeout(150)
    check('clavier : flèches + Entrée lancent le niveau débloqué', await page.evaluate("Soleil.state + ':' + (Soleil.Levels.def && Soleil.Levels.def.id)") == 'level:w1-1')
    await page.keyboard.press('Escape'); await page.wait_for_timeout(100)
    check('Échap pendant un niveau → retour à la carte', await page.evaluate("Soleil.state") == 'map')
    await page.keyboard.press('Escape'); await page.wait_for_timeout(100)
    check('Échap sur la carte → accueil', await page.evaluate("Soleil.state") == 'title')
    ERRS.extend(page.errs); await ctx.close()

async def t_save(b):
    print('\n7) Sauvegarde : les anciennes données restent intactes')
    ctx, page = await new_page(b)
    # l'ancienne sauvegarde est écrite au tout début du chargement (adresse ?oldsave) : plus fiable qu'un reload juste après un localStorage.setItem
    await ctx.add_init_script("""if (location.search.includes('oldsave')) { const set = (k, v) => localStorage.setItem('soleil.' + k, JSON.stringify(v));
      set('best', 321); set('stars', 45); set('owned', ['classic', 'cap']); set('outfit', 'cap'); set('medals', ['midi']); set('plays', 12); set('ghost', [0, 10, 25, 40]); }""")
    await page.goto(URL + '?oldsave'); await page.wait_for_function("Soleil.Poki && Soleil.Poki.loaded"); await page.wait_for_timeout(300); await page.evaluate(FAST)
    a = await page.evaluate("({ best: Soleil.best, stars: Soleil.stars, owned: Soleil.owned, outfit: Soleil.outfit, plays: Soleil.plays, ghost: !!Soleil.ghost })")
    check('ancienne sauvegarde relue telle quelle', a['best'] == 321 and a['stars'] == 45 and a['owned'] == ['classic', 'cap'] and a['outfit'] == 'cap' and a['plays'] == 12 and a['ghost'], json.dumps(a))
    await page.evaluate("Soleil.WorldMap.open(); Soleil.Levels.open('w1-1', false)")
    await page.evaluate("LVBOT('good', 60 * 90, () => Soleil.Levels.phase === 'results')")
    c = await page.evaluate("({ best: Soleil.store.get('best'), stars: Soleil.store.get('stars'), owned: Soleil.store.get('owned'), lv: Soleil.store.get('levels') })")
    check('après un niveau : record et tenues inchangés, ⭐ gagnées en plus, niveaux ajoutés', c['best'] == 321 and c['stars'] > 45 and c['owned'] == ['classic', 'cap'] and c['lv']['w1-1']['done'], f"⭐ {c['stars']}")
    ERRS.extend(page.errs); await ctx.close()

async def t_boss(b):
    print('\n8) Boss : il se tourne, met ses lunettes, musique, coups spéciaux, victoire')
    ctx, page = await new_page(b)
    await page.evaluate("Soleil.WorldMap.open(); Soleil.Levels.open('w1-8', false)")
    await page.evaluate("Soleil.Sound.unlock()")
    r = await page.evaluate("""(() => { const S = Soleil, L = S.Levels; LVBOT('none', 15); L.press(); LVBOT('none', 2); const a = { ph: L.phase, face: L.m.sun.turnP };
      LVBOT('none', 60 * 2); a.glass = L.m.sun.boss; a.music = S.Music.on; LVBOT('none', 90); a.ph2 = L.phase; return a; })()""")
    check('intro du boss : il se tourne vers toi', r['ph'] == 'boss' and r['face'] == 1)
    check('il met ses lunettes, la musique 8-bit démarre', r['glass'] == 1 and r['music'], json.dumps(r))
    check('puis le niveau commence', r['ph2'] == 'play')
    mv = await page.evaluate("""(() => { const L = Soleil.Levels, t = new Set(); for (let i = 0; i < 60 * 14; i++) { LVBOT('good', 1); if (L.banner) t.add(L.banner.title); } return [...t].join(' / '); })()""")
    check('coups spéciaux annoncés (bannières)', 'HÉSITATION' in mv and 'DOUBLE PIÈGE' in mv, mv)
    await page.evaluate("Soleil.Levels.m.player.z = Soleil.Levels.m.level.length - 0.01; Soleil.Levels.m.player.v = 8")
    await page.evaluate("LVBOT('greedy', 60 * 5, () => Soleil.Levels.phase === 'results')")
    w = await page.evaluate("[Soleil.Levels.phase, Soleil.Music.on, document.getElementById('lvEnd').innerText.split('\\n')[0]]")
    check('victoire : musique coupée, « SOLEIL COOL BATTU ! »', w[0] == 'results' and not w[1] and 'BATTU' in w[2], w[2])
    ERRS.extend(page.errs); await ctx.close()

async def t_english(b):
    print('\n9) Anglais, paysage, petit écran')
    ctx, page = await new_page(b, 'en-US', 844, 390)
    t = await page.evaluate("document.getElementById('contBtn').innerText + ' / ' + document.getElementById('lvBtn').innerText")
    check('accueil en anglais : PLAY, Levels', 'PLAY' in t and 'Levels' in t and 'Level 1' in t, t.replace('\n', ' / '))
    await page.click('#lvBtn'); await page.wait_for_timeout(150)
    await page.evaluate("Soleil.Levels.open('w1-4', false)")
    t = await page.evaluate("document.getElementById('lvIntro').innerText")
    check('carte d’intro en anglais, sans « undefined »', 'Beat Max' in t and 'undefined' not in t, t.replace('\n', ' / ')[:100])
    await page.evaluate("LVBOT('greedy', 60 * 30, () => Soleil.Levels.phase === 'fail')")
    t = await page.evaluate("document.getElementById('lvFail').innerText")
    check('carte de défaite en anglais', ('Tap to try again' in t or 'Click or Space to try again' in t) and 'undefined' not in t, t.replace('\n', ' / ')[:100])
    ctx2, page2 = await new_page(b, 'fr-FR', 320, 568)
    await page2.click('#lvBtn'); await page2.wait_for_timeout(150)
    ok = await page2.evaluate("Soleil.WorldMap.nodes.every(n => n.x - n.r >= 0 && n.x + n.r <= innerWidth && n.y + n.r * 1.5 <= innerHeight && n.y - n.r > 100)")
    check('petit écran (320×568) : les 8 niveaux tiennent dans la carte', ok)
    ERRS.extend(page.errs + page2.errs); await ctx.close(); await ctx2.close()

async def t_perf(b):
    print('\n10) Fluidité : temps de dessin d’une image (niveau 7, 5 rivaux)')
    ctx, page = await new_page(b, 'fr-FR', 390, 844)
    await page.evaluate("Soleil.WorldMap.open(); Soleil.Levels.open('w1-7', false); LVBOT('good', 60 * 8)")
    ms = await page.evaluate("(() => { const t0 = performance.now(); for (let i = 0; i < 120; i++) { LVBOT('good', 1); Soleil.render(); } return (performance.now() - t0) / 120; })()")
    check('moins de 8 ms par image (logique + dessin, ordinateur de test)', ms < 8, f"{ms:.2f} ms")
    mp = await page.evaluate("(() => { Soleil.Levels.toMap(); const t0 = performance.now(); for (let i = 0; i < 120; i++) Soleil.render(); return (performance.now() - t0) / 120; })()")
    check('carte du monde : moins de 8 ms par image', mp < 8, f"{mp:.2f} ms")
    ERRS.extend(page.errs); await ctx.close()

async def t_w2_rule(b):
    print('\n11) Monde 2 : la règle ne se contredit jamais (bouger pendant une tentation = grillé, et on dit pourquoi)')
    ctx, page = await new_page(b)
    cases = [
      ('éternuement (yeux fermés)', 'w2-6', "Soleil.Levels.m.sun.shut === 1", 'tourné vers toi'),
      ('faux retour (à moitié tourné)', 'w2-2', "(() => { const m = Soleil.Levels.m; return m.look && m.look.items.some(i => i.type === 'fakeRet' && i.fired) && m.sun.turnP < 0.7; })()", 'Faux retour'),
      ('faux dos (l’œil dépasse)', 'w2-5', "Soleil.Levels.m.sun.state === 'peek'", 'faisait semblant'),
      ('étoile tentatrice', 'w2-1', "!!Soleil.Levels.fx.star", 'étoile'),
    ]
    for name, lv, cond, txt in cases:
        await page.evaluate(f"Soleil.WorldMap.open(); Soleil.Levels.open('{lv}', false)")
        ok = await page.evaluate(f"LVBOT('good', 60 * 90, () => {cond}) < 60 * 90")
        await page.evaluate("(() => { const S = Soleil; S.pressing = true; for (let i = 0; i < 200 && S.Levels.phase === 'play'; i++) S.update(1/60); for (let i = 0; i < 80; i++) S.update(1/60); })()")
        r = await page.evaluate("[Soleil.Levels.phase, document.getElementById('lvFail') ? document.getElementById('lvFail').innerText : '']")
        check(f'{name} : bouger = grillé, avec l’explication', ok and r[0] == 'fail' and txt in r[1], r[1].split(chr(10))[0] if ok else 'situation pas atteinte')
    ERRS.extend(page.errs); await ctx.close()

async def t_w2_signal(b):
    print('\n12) Le « ding » n’arrive qu’au vrai retour (jamais pendant un faux retour ou un faux dos)')
    ctx, page = await new_page(b)
    r = await page.evaluate("""(() => {
      const S = Soleil; let bad = 0, clears = 0, fakes = 0, peeks = 0, types = new Set();
      for (const id of ['w2-2', 'w2-5', 'w2-6', 'w2-7', 'w2-8']) for (let a = 1; a <= 25; a++) {
        const m = S.Match.create(S.levelById(id), a, { playerBrain: 'expert' }); let inFake = false;
        while (!m.result && m.t < 120) { S.Match.step(m, 1/60);
          for (const e of m.out) {
            if (e.type === 'tempt') types.add(e.kind);
            if (e.type === 'fakeBack') { inFake = true; fakes++; }
            if (e.type === 'peek') peeks++;
            if (e.type === 'clear') { clears++; if (m.sun.state !== 'return' || m.sun.retTo !== 0) bad++; inFake = false; }
            if (e.type === 'tempt' && e.kind === 'fakeRet' && m.sun.state !== 'look') bad++;
          }
          m.out.length = 0; }
      }
      return { bad, clears, fakes, peeks, types: [...types].sort().join(' ') }; })()""")
    check('le « ding » vient seulement quand il se remet vraiment de dos', r['bad'] == 0 and r['clears'] > 100, f"{r['clears']} vrais retours, {r['fakes']} faux dos")
    check('faux dos : il passe toujours par l’œil (HMM…) avant le HOP', r['peeks'] == r['fakes'] and r['fakes'] > 10, f"{r['peeks']}/{r['fakes']}")
    # v2.5 : le recomptage et la fausse alerte (monde 1) reviennent dans le parc, et le troupeau arrive au niveau 7
    check('les 6 tentations du parc apparaissent dans le monde 2 (et le recomptage, la fausse alerte, le troupeau)',
          r['types'] == 'alarm crack fakeRet fly herd recount sneeze star taunt', r['types'])
    ERRS.extend(page.errs); await ctx.close()

async def t_w2_fair(b):
    print('\n13) Monde 2 juste : l’expert (sang-froid, lâche dès « SO », attend le « ding ») réussit chaque niveau')
    ctx, page = await new_page(b)
    r = await page.evaluate("""(() => {
      const S = Soleil, res = {};
      for (const lv of S.WORLDS[1].levels) { let w = 0;
        for (let a = 1; a <= 100; a++) { const m = S.Match.create(lv, a, { playerBrain: 'expert', brainSeen: ['star', 'fakeRet', 'sneeze', 'taunt', 'fly', 'crack', 'fakeBack'] }); m.out = null;
          while (!m.result && m.t < 150) S.Match.step(m, 1/60); if (m.result && m.result.win) w++; }
        res[lv.num] = w; }
      return res; })()""")
    check('expert : au moins 95/100 sur chacun des 8 niveaux du parc', all(v >= 95 for v in r.values()), json.dumps(r))
    ERRS.extend(page.errs); await ctx.close()

async def t_w2_mud(b):
    print('\n14) Boue : tout le monde ralentit dans les flaques placées à la main')
    ctx, page = await new_page(b)
    r = await page.evaluate("""(() => {
      const S = Soleil, m = S.Match.create(S.levelById('w2-4'), 3, { playerBrain: 'expert' }); m.out = null;
      let vin = 0, vout = 0, rin = 0, n = 0; const tin = new Map();
      for (let i = 0; i < 60 * 80 && !m.result; i++) { S.Match.step(m, 1/60);
        for (const b of [m.player, ...m.rivals]) {
          tin.set(b, b.mud ? (tin.get(b) || 0) + 1/60 : 0);
          const k = b.v / b.vmax;
          if (b.mud && tin.get(b) > 0.5) { n++; if (b === m.player) vin = Math.max(vin, k); else rin = Math.max(rin, k); }
          else if (!b.mud && b === m.player) vout = Math.max(vout, k);
        } }
      return { vin, vout, rin, n, win: !!(m.result && m.result.win) }; })()""")
    check('dans la boue, ta vitesse est limitée (×0,55 de ta vitesse max)', r['n'] > 60 and 0.3 < r['vin'] <= 0.551 and r['vout'] > 0.95, f"{r['vin']:.2f} × vmax dans la boue, {r['vout']:.2f} × dehors")
    check('les rivaux sont ralentis aussi', 0.3 < r['rin'] <= 0.551, f"{r['rin']:.2f} × leur vitesse max")
    ERRS.extend(page.errs); await ctx.close()

async def t_w2_map(b):
    print('\n15) Carte : le parc se débloque avec 12 étoiles du monde 1, avec une animation')
    ctx, page = await new_page(b)
    await page.click('#lvBtn'); await page.wait_for_timeout(200)
    tab = await page.evaluate("(() => { const t = Soleil.WorldMap.layout() || null; return 0; })()")
    await page.evaluate("Soleil.WorldMap.tap(14 + 62 * 1.5, 48 + 18)"); await page.wait_for_timeout(200)
    t = await page.evaluate("document.getElementById('toast').innerText")
    check('monde 2 verrouillé : « Gagne 12 ★ dans le monde 1… »', '12' in t and 'monde 1' in t, t)
    await ctx.add_init_script("""if (location.search.includes('w1stars')) { const s = {}; for (let i = 1; i <= 6; i++) s['w1-' + i] = { s: [true, true, false], best: 30, tries: 1, done: true }; localStorage.setItem('soleil.levels', JSON.stringify(s)); }""")
    await page.goto(URL + '?w1stars'); await page.wait_for_function("Soleil.Poki && Soleil.Poki.loaded"); await page.wait_for_timeout(300); await page.evaluate(FAST)
    await page.click('#lvBtn'); await page.wait_for_timeout(1600)
    r = await page.evaluate("[Soleil.WorldMap.nodes[0].lv.id, Soleil.Levels.unlocked(Soleil.levelById('w2-1')), Soleil.Levels.unlocked(Soleil.levelById('w2-2')), JSON.stringify(Soleil.store.get('worldsShown', []))]")
    check('12 étoiles : animation, la carte passe sur le parc, niveau 1 ouvert, niveau 2 fermé', r[0] == 'w2-1' and r[1] and not r[2] and '2' in r[3], str(r))
    await page.evaluate("Soleil.WorldMap.tap(14 + 62 * 0.5, 48 + 18)"); await page.wait_for_timeout(100)
    check('les onglets passent d’un monde à l’autre', await page.evaluate("Soleil.WorldMap.nodes[0].lv.id") == 'w1-1')
    ERRS.extend(page.errs); await ctx.close()

async def t_w2_reward(b):
    print('\n16) Résister rapporte : SANG-FROID, ⭐ bonus, départs éclair, indication la 1re fois seulement')
    ctx, page = await new_page(b)
    await page.evaluate("Soleil.store.set('stars', 10)")
    await page.evaluate("Soleil.WorldMap.open(); Soleil.Levels.open('w2-1', false)")
    await page.evaluate("LVBOT('good', 60 * 30, () => !!Soleil.Levels.tip)")
    tip1 = await page.evaluate("Soleil.Levels.tip ? Soleil.Levels.tip.text : ''")
    await page.evaluate("LVBOT('good', 60 * 120, () => Soleil.Levels.phase === 'results' || Soleil.Levels.phase === 'fail')")
    r = await page.evaluate("({ ph: Soleil.Levels.phase, st: Soleil.Levels.m.stats, stars: Soleil.store.get('stars'), txt: document.getElementById('lvEnd') ? document.getElementById('lvEnd').innerText : '', seen: Soleil.store.get('temptSeen', []) })")
    check('1re rencontre de l’étoile : « Il veut que tu bouges… NE BOUGE PAS ! »', 'NE BOUGE PAS' in tip1, tip1)
    check('fin du niveau : tentations résistées comptées, ⭐ bonus versées', r['ph'] == 'results' and r['st']['resisted'] >= 1 and r['stars'] >= 10 + r['st']['resisted'] and 'sang-froid' in r['txt'], f"résistées {r['st']['resisted']}, ⭐ {r['stars']}")
    check('départs éclair comptés', r['st']['quick'] >= 1, str(r['st']['quick']))
    sv = await page.evaluate("JSON.stringify((Soleil.store.get('levels', {}) || {})['w2-1'] || null)")
    check('progression du monde 2 sauvegardée (même format que le monde 1)', sv != 'null' and '"done":true' in sv, sv)
    await page.evaluate("Soleil.Levels.retry()")
    await page.evaluate("LVBOT('good', 60 * 30, () => !!(Soleil.Levels.fx.star))")
    check('2e fois : plus d’indication pour l’étoile', await page.evaluate("!Soleil.Levels.tip") and 'star' in r['seen'])
    ERRS.extend(page.errs); await ctx.close()

async def t_w2_boss(b):
    print('\n17) Boss du parc : le Soleil Farceur (intro, lunettes-nez-moustache, musique de cirque, coups spéciaux, victoire)')
    ctx, page = await new_page(b)
    await page.evaluate("Soleil.WorldMap.open(); Soleil.Levels.open('w2-8', false)")
    await page.evaluate("Soleil.Sound.unlock()")
    r = await page.evaluate("""(() => { const S = Soleil, L = S.Levels; LVBOT('none', 15); L.press(); LVBOT('none', 2); const a = { ph: L.phase, face: L.m.sun.turnP };
      LVBOT('none', 60 * 2); a.glass = L.m.sun.bossFace; a.music = S.Music.on; a.bpm = S.Music.T && S.Music.T.bpm; LVBOT('none', 90); a.ph2 = L.phase; return a; })()""")
    check('intro : il se tourne vers toi', r['ph'] == 'boss' and r['face'] == 1)
    check('lunettes-nez-moustache + musique de cirque (152 bpm)', r['glass'] == 'farceur' and r['music'] and r['bpm'] == 152, json.dumps(r))
    check('puis le niveau commence', r['ph2'] == 'play')
    mv = await page.evaluate("""(() => { const L = Soleil.Levels, t = new Set(); for (let i = 0; i < 60 * 20; i++) { LVBOT('good', 1); if (L.banner) t.add(L.banner.title); if (L.phase !== 'play') break; } return [...t].join(' / '); })()""")
    check('coups spéciaux annoncés (bannières)', 'ÉTERNUEMENT GÉANT' in mv and 'FAUX RETOUR ÉTOILÉ' in mv, mv)
    await page.evaluate("Soleil.Levels.m.player.z = Soleil.Levels.m.level.length - 0.01; Soleil.Levels.m.player.v = 8")
    await page.evaluate("LVBOT('greedy', 60 * 5, () => Soleil.Levels.phase === 'results')")
    w = await page.evaluate("[Soleil.Levels.phase, Soleil.Music.on, document.getElementById('lvEnd').innerText]")
    check('victoire : musique coupée, « SOLEIL FARCEUR BATTU ! », monde 2 terminé', w[0] == 'results' and not w[1] and 'FARCEUR BATTU' in w[2] and 'Monde 2' in w[2], w[2].split('\n')[0])
    ERRS.extend(page.errs); await ctx.close()

async def t_w2_english(b):
    print('\n18) Monde 2 en anglais (paysage) : aucun texte manquant')
    ctx, page = await new_page(b, 'en-US', 844, 390)
    await page.evaluate("Soleil.WorldMap.open(); Soleil.Levels.open('w2-6', false)")
    t = await page.evaluate("document.getElementById('lvIntro').innerText")
    check('carte d’intro en anglais, sans « undefined »', 'undefined' not in t and 'NaN' not in t and 'fake' in t.lower(), t.replace('\n', ' / ')[:110])
    ok = await page.evaluate("LVBOT('good', 60 * 90, () => Soleil.Levels.m.sun.shut === 1) < 60 * 90")
    await page.evaluate("(() => { const S = Soleil; S.pressing = true; for (let i = 0; i < 200 && S.Levels.phase === 'play'; i++) S.update(1/60); for (let i = 0; i < 80; i++) S.update(1/60); })()")
    t = await page.evaluate("document.getElementById('lvFail').innerText")
    check('défaite pendant l’éternuement : « He was still facing you! »', ok and 'still facing you' in t and 'undefined' not in t, t.replace('\n', ' / ')[:110])
    keys = await page.evaluate("""(() => { const S = Soleil, bad = [];
      for (const lang of ['fr', 'en']) { const L = S.TXT[lang];
        for (const t of ['star', 'fakeRet', 'sneeze', 'taunt', 'fly', 'crack', 'fakeBack']) if (!L.temptHint[t]) bad.push(lang + '.temptHint.' + t);
        for (const t of ['star', 'fakeRet', 'sneeze', 'taunt', 'fly', 'crack', 'hop']) if (!L.temptFail[t]) bad.push(lang + '.temptFail.' + t);   // faux dos : grillé au « HOP ! »
        for (const k of ['sangFroid', 'quickStart', 'ha', 'atchoum', 'hintTitle', 'mudTitle', 'mudSub', 'bossTaunt2', 'bossDown2', 'bossWin2', 'bossBar2', 'worldDone2', 'worldUnlockedSub']) if (!L[k]) bad.push(lang + '.' + k);
        if (!(L.taunts && L.taunts.length >= 10)) bad.push(lang + '.taunts');
        for (const lv of S.WORLDS[1].levels) for (const g of [lv.goal, lv.challenge]) { const who = ((lv.rivals || []).find(r => r.id === g.who) || {}).name || '';
          const txt = L.goal(g, who); if (!txt || /undefined|NaN/.test(txt)) bad.push(lang + '.goal.' + lv.id + '.' + g.type);
          for (const k of ['name', 'tip']) if (!lv[k][lang]) bad.push(lang + '.' + lv.id + '.' + k); }
        for (const lv of S.WORLDS[1].levels) for (const [n, sc] of Object.entries(lv.script || {})) if (sc.move && !sc.move[lang]) bad.push(lang + '.' + lv.id + '.move' + n); }
      return bad; })()""")
    check('tous les nouveaux textes existent en français et en anglais', not keys, ', '.join(keys))
    ERRS.extend(page.errs); await ctx.close()

# v2.5 — un niveau du monde 1 modifié à la volée (dans le moteur seulement) : ses réglages du soleil + ceux du test
# (sans la nuit : on mesure le piège lui-même, pas le temps qu'il fait perdre)
MK = """(sun => { const S = Soleil, base = S.levelById('w1-4'); return Object.assign({}, base, { night: 0, sun: Object.assign({}, base.sun, sun) }); })"""
RUN = """((def, prof, a, onEv) => { const S = Soleil, m = S.Match.create(def, a, { playerBrain: prof });
  while (!m.result && m.t < 150) { S.Match.step(m, 1/60); for (const e of m.out) if (onEv) onEv(e, m); m.out.length = 0; } return m.result; })"""

async def t_v25_lies(b):
    print('\n19) v2.5 — les faux signaux : le recomptage, l’avion menteur, le nuage et son reflet (moteur)')
    ctx, page = await new_page(b)
    r = await page.evaluate(f"""(() => {{
      const S = Soleil, mk = {MK}, run = {RUN}, out = {{}};
      const rate = (def, prof, n) => {{ let w = 0, t = 0, why = {{}}; for (let a = 1; a <= n; a++) {{ const res = run(def, prof, a);
        if (res && res.win) {{ w++; t += res.time; }} else if (res) {{ const k = res.tempt || res.why; why[k] = (why[k] || 0) + 1; }} }}
        return {{ w, t: w ? t / w : 0, why }}; }};
      // le recomptage : « 1 », « 2 » pendant son regard, visage vers toi, puis il se marre ; jamais de « ding » au milieu
      let rc = 0, bad = 0, open = false, ends = 0; const texts = new Set();
      const R = mk({{ tempt: {{ recount: 1, max: 1 }} }});
      for (let a = 1; a <= 20; a++) run(R, 'expert', a, (e, m) => {{
        if (e.type === 'recount') {{ rc++; open = true; texts.add(m.sun.text + '/' + m.sun.textKind); if (m.sun.state !== 'look' || m.sun.turnP !== 1 || m.sun.second) bad++; }}
        if (e.type === 'recountEnd') {{ ends++; open = false; if (m.sun.text) bad++; }}
        if (e.type === 'clear' && open) bad++; }});
      out.recount = {{ rc, bad, ends, texts: [...texts].sort().join(' '), E: rate(R, 'expert', 100), M: rate(R, 'moyen', 100) }};
      // l'avion « ALLEZ-Y ! » : pendant son regard seulement
      const G = mk({{ tempt: {{ planeGo: 1, max: 1 }} }}); let go = 0, goBad = 0;
      for (let a = 1; a <= 20; a++) run(G, 'expert', a, (e, m) => {{ if (e.type === 'tempt' && e.kind === 'planeGo') {{ go++; if (m.sun.state !== 'look' || m.sun.turnP !== 1) goBad++; }} }});
      out.planeGo = {{ go, goBad, E: rate(G, 'expert', 100), M: rate(G, 'moyen', 100) }};
      // l'avion « SOLEIL ! » : pendant le chant, au moins 0,45 s avant le vrai mot ; il ne grille personne, il fait perdre du temps
      const P = mk({{ planeStop: 1 }}), P0 = mk({{}}); let st = 0, stBad = 0;
      for (let a = 1; a <= 20; a++) run(P, 'expert', a, (e, m) => {{ if (e.type === 'plane') {{ st++; if (m.sun.state !== 'chant' || m.sun.t > m.sun.chant.trig - 0.45 + 1/60 + 1e-6) stBad++; }} }});
      out.planeStop = {{ st, stBad, E: rate(P, 'expert', 100), M: rate(P, 'moyen', 200), M0: rate(P0, 'moyen', 200) }};
      // le nuage : il cache le soleil du chant jusqu'au vrai retour ; l'expert passe, les tentations font plus craquer le moyen
      const C = mk({{ cloud: 1 }}), CT = mk({{ cloud: 1, fakeBack: 0.4, tempt: {{ star: 0.4, max: 1 }} }}), CT0 = mk({{ fakeBack: 0.4, tempt: {{ star: 0.4, max: 1 }} }});
      let cl = 0, clBad = 0;
      for (let a = 1; a <= 20; a++) run(C, 'expert', a, (e, m) => {{ if (e.type === 'cloud') cl++; if (e.type === 'clear' && !m.sun.cloud) clBad++; }});
      out.cloud = {{ cl, clBad, E: rate(C, 'expert', 100), M: rate(CT, 'moyen', 200), M0: rate(CT0, 'moyen', 200) }};
      // rien ne change pour un niveau qui n'utilise pas ces nouveautés (3e flux de dés)
      const cfg = (def, a, n) => {{ const m = S.Match.create(def, a, {{}}), c = S.Match.cycleConfig(m, n); return [c.word, c.turn, c.look, c.traps, c.words.join(), (c.tempt || []).map(t => t.type + t.at).join()].join('|'); }};
      let same = true; for (const id of ['w1-4', 'w2-3', 'w2-8']) for (let a = 1; a <= 5; a++) for (let n = 1; n <= 6; n++) {{
        const d = S.levelById(id); if (cfg(d, a, n) !== cfg(Object.assign({{}}, d, {{ sun: Object.assign({{}}, d.sun, {{ planeStop: 0, cloud: 0 }}) }}), a, n)) same = false; }}
      out.same = same;
      const a1 = [], a2 = []; run(R, 'moyen', 7, e => a1.push(e.type + '@' + e.t.toFixed(3))); run(R, 'moyen', 7, e => a2.push(e.type + '@' + e.t.toFixed(3)));
      out.det = a1.join() === a2.join();
      return out; }})()""")
    rc, pg, ps, cl = r['recount'], r['planeGo'], r['planeStop'], r['cloud']
    check('recomptage : « 1 » puis « 2 » pendant son regard, visage tourné vers toi, puis il se marre (jamais de « ding » au milieu)',
          rc['rc'] >= 30 and rc['bad'] == 0 and rc['ends'] * 2 == rc['rc'] and rc['texts'] == '1/recount 2/recount', json.dumps(rc)[:160])
    check('recomptage : l’expert l’évite (≥ 95 %), le moyen s’y fait griller', rc['E']['w'] >= 95 and rc['M']['why'].get('recount', 0) >= 5, f"expert {rc['E']['w']} %, moyen grillé {rc['M']['why'].get('recount', 0)} fois")
    check('avion « ALLEZ-Y ! » : seulement pendant son regard ; l’expert l’évite, le moyen s’y fait griller',
          pg['go'] >= 20 and pg['goBad'] == 0 and pg['E']['w'] >= 95 and pg['M']['why'].get('planeGo', 0) >= 3, f"{pg['go']} avions, expert {pg['E']['w']} %, moyen grillé {pg['M']['why'].get('planeGo', 0)} fois")
    check('avion « SOLEIL ! » : pendant le chant, ≥ 0,45 s avant le vrai mot ; il ne grille personne mais fait perdre du temps',
          ps['st'] >= 20 and ps['stBad'] == 0 and ps['E']['w'] >= 95 and ps['M']['t'] > ps['M0']['t'] + 0.3, f"{ps['st']} avions, expert {ps['E']['w']} %, moyen {ps['M']['t']:.1f} s contre {ps['M0']['t']:.1f} s sans")
    check('nuage : il reste jusqu’au vrai retour ; l’expert passe (≥ 95 %), les tentations font plus craquer le moyen',
          cl['cl'] >= 20 and cl['clBad'] == 0 and cl['E']['w'] >= 95 and cl['M']['w'] < cl['M0']['w'], f"expert {cl['E']['w']} %, moyen {cl['M']['w']}/200 contre {cl['M0']['w']}/200 sans nuage")
    check('les niveaux sans ces nouveautés tirent exactement les mêmes dés (3e flux séparé)', r['same'])
    check('même essai : mêmes faux signaux au même moment', r['det'])
    ERRS.extend(page.errs); await ctx.close()

async def t_v25_lies_screen(b):
    print('\n20) v2.5 — les faux signaux à l’écran : ce qu’on voit, ce qui grille, ce qu’on lit (6 langues)')
    ctx, page = await new_page(b)
    async def setup(sun):
        await page.evaluate(f"(() => {{ const d = Soleil.levelById('w1-4'); d.sun = Object.assign({{}}, d.sun, {sun}); Soleil.WorldMap.open(); Soleil.Levels.open('w1-4', false); }})()")
    async def fail_txt():
        await page.evaluate("(() => { const S = Soleil; S.pressing = true; for (let i = 0; i < 200 && S.Levels.phase === 'play'; i++) S.update(1/60); for (let i = 0; i < 80; i++) S.update(1/60); })()")
        return await page.evaluate("[Soleil.Levels.phase, document.getElementById('lvFail').innerText]")
    await setup("{ tempt: { recount: 1, max: 1 } }")
    ok = await page.evaluate("LVBOT('good', 60 * 60, () => Soleil.Levels.m.sun.textKind === 'recount') < 60 * 60")
    st = await page.evaluate("(() => { const w = Soleil.Levels.m.sun; return [w.state, w.turnP, w.text, Soleil.Levels.tip && Soleil.Levels.tip.text]; })()")
    check('recomptage à l’écran : « 1 » affiché pendant qu’il te regarde, avec l’indication', ok and st[0] == 'look' and st[1] == 1 and st[2] == '1' and 'il ment' in (st[3] or ''), str(st))
    f = await fail_txt()
    check('repartir pendant le recomptage = grillé : « Il comptait en te regardant… »', f[0] == 'fail' and 'comptait en te regardant' in f[1], f[1].split(chr(10))[0])
    await setup("{ tempt: { planeGo: 1, max: 1 } }")
    ok = await page.evaluate("LVBOT('good', 60 * 60, () => !!Soleil.plane) < 60 * 60")
    st = await page.evaluate("(() => { const w = Soleil.Levels.m.sun; return [w.state, w.turnP, Soleil.plane.word, Soleil.plane.kind]; })()")
    check('avion « ALLEZ-Y ! » pendant son regard (il te regarde toujours)', ok and st[0] == 'look' and st[1] == 1 and st[2] == 'ALLEZ-Y\u00a0!' and st[3] == 'go', str(st))
    f = await fail_txt()
    check('courir sur « ALLEZ-Y ! » = grillé : « L’avion mentait… »', f[0] == 'fail' and 'avion mentait' in f[1], f[1].split(chr(10))[0])
    await setup("{ planeStop: 1 }")
    ok = await page.evaluate("LVBOT('good', 60 * 60, () => !!Soleil.plane) < 60 * 60")
    st = await page.evaluate("[Soleil.Levels.m.sun.state, Soleil.plane.word, Soleil.chantW().sun, Soleil.plane.kind]")
    check('avion « SOLEIL ! » pendant le chant (c’est la banderole qui le dit, pas le soleil)', ok and st[0] == 'chant' and st[1] == st[2] and st[3] == 'stop', str(st))
    r = await page.evaluate("LVBOT('good', 60 * 90, () => Soleil.Levels.phase === 'results') < 60 * 90")
    check('… et le robot qui ne lâche qu’au vrai mot finit le niveau', r)
    await setup("{ cloud: 1 }")
    ok = await page.evaluate("LVBOT('good', 60 * 60, () => Soleil.Levels.m.sun.state === 'look' && Soleil.cloudK > 0.97) < 60 * 60")
    px = await page.evaluate("""(() => { const S = Soleil, L = S.Lt;
      const dark = (x, y, w) => { const d = S.ctx.getImageData(Math.round((x - w) * S.DPR), Math.round(y * S.DPR), Math.round(2 * w * S.DPR), 1).data;
        let m = 255; for (let i = 0; i < d.length; i += 4) m = Math.min(m, (d[i] + d[i + 1] + d[i + 2]) / 3); return Math.round(m); };
      const look = () => { S.render();
        return { eye: dark(L.cx - L.R * 0.37, L.sunY + S.sunSink - L.R * 0.12, L.R * 0.22),   // le contour de son œil gauche
                 pond: dark(L.cx - L.R * 1.3, L.hy + L.R * 0.62, 3) }; };                      // le bord de la flaque
      const on = look(), k = S.cloudK; S.cloudK = 0; const off = look(); S.cloudK = k;
      return { on, off, tip: S.Levels.tip && S.Levels.tip.text }; })()""")
    check('nuage : il cache le soleil (plus d’yeux dans le ciel), la flaque et son reflet apparaissent ; l’indication dit de regarder le reflet',
          ok and px['on']['eye'] > 140 and px['off']['eye'] < 100 and px['on']['pond'] < 70 and px['off']['pond'] > px['on']['pond'] + 25 and 'reflet' in (px['tip'] or ''), json.dumps(px)[:170])
    f = await fail_txt()
    check('grillé derrière le nuage : le conseil dit de regarder le reflet', f[0] == 'fail' and 'reflet' in f[1], f[1].replace(chr(10), ' / ')[:110])
    keys = await page.evaluate("""(() => { const S = Soleil, bad = [];
      for (const lang of ['fr', 'en', 'es', 'pt', 'de', 'it']) { const T = S.TXT[lang];
        for (const k of ['recount', 'planeGo', 'planeStop', 'cloud']) if (!T.temptHint[k]) bad.push(lang + '.temptHint.' + k);
        for (const k of ['recount', 'planeGo']) if (!T.temptFail[k]) bad.push(lang + '.temptFail.' + k);
        for (const k of ['planeGo', 'refletTitle', 'refletSub', 'refletTip']) if (!T[k]) bad.push(lang + '.' + k);
        for (const k of ['recount', 'plane', 'reflet']) if (!T.obst[k]) bad.push(lang + '.obst.' + k);
        const norm = x => (x || '').replace(/[^\\p{L}]/gu, '').toUpperCase();
        if (norm(T.planeGo) === norm(T.go) || norm(T.planeGo).includes(norm(T.go)) || norm(T.planeGo) === norm(T.chant.sun)) bad.push(lang + '.planeGo = mot de départ');
      }
      return bad; })()""")
    check('6 langues : tous les textes des faux signaux existent ; « ALLEZ-Y ! » n’est jamais le vrai mot de départ', not keys, ', '.join(keys))
    ERRS.extend(page.errs); await ctx.close()

# v2.5 — le niveau 7 du monde 1 (5 rivaux), rivaux partis devant (z0) pour qu'ils restent autour de toi
MK7 = """(sun => { const S = Soleil, base = S.levelById('w1-7');
  return Object.assign({}, base, { night: 0, rivals: base.rivals.map((r, i) => Object.assign({}, r, { z0: 25 + i * 5 })), sun: Object.assign({}, base.sun, sun) }); })"""

async def t_v25_rivals(b):
    print('\n21) v2.5 — les rivaux : la fausse alerte et le troupeau (moteur)')
    ctx, page = await new_page(b)
    r = await page.evaluate(f"""(() => {{
      const S = Soleil, mk = {MK7}, run = {RUN}, out = {{}};
      const rate = (def, prof, n) => {{ let w = 0, why = {{}}; for (let a = 1; a <= n; a++) {{ const res = run(def, prof, a);
        if (res && res.win) w++; else if (res) {{ const k = res.tempt || res.why; why[k] = (why[k] || 0) + 1; }} }} return {{ w, why }}; }};
      // la fausse alerte : un rival qu'on voit (entre 3,5 m derrière et 30 m devant) crie ; lui ne bouge pas
      const A = mk({{ tempt: {{ alarm: 1, max: 1 }} }}); let al = 0, far = 0, self = 0;
      for (let a = 1; a <= 30; a++) run(A, 'expert', a, (e, m) => {{
        if (e.type === 'tempt' && e.kind === 'alarm') {{ al++; const d = e.item.r.z - m.player.z; if (d < -3.5 || d > 30 || m.sun.state !== 'look') far++; e.item.r._al = m.t; }}
        if (e.type === 'rivalGrilled' && e.r._al && m.t - e.r._al < 1.2) self++; }});
      out.alarm = {{ al, far, self, E: rate(A, 'expert', 100), M: rate(A, 'moyen', 100) }};
      // le troupeau : exactement 3 rivaux repartent ensemble et sont grillés ; jamais avec moins de 3 rivaux autour
      const H = mk({{ tempt: {{ herd: 1, max: 1 }} }}); let hd = 0, burnt = 0, bad = 0;
      for (let a = 1; a <= 30; a++) run(H, 'expert', a, (e, m) => {{
        if (e.type === 'tempt' && e.kind === 'herd') {{ hd++; if (e.item.rs.length !== 3 || m.sun.state !== 'look') bad++; }}
        if (e.type === 'rivalGrilled' && e.herd) burnt++; }});
      const H2 = Object.assign({{}}, H, {{ rivals: H.rivals.slice(0, 2) }}); let few = 0;
      for (let a = 1; a <= 20; a++) run(H2, 'expert', a, e => {{ if (e.type === 'tempt' && e.kind === 'herd') few++; }});
      out.herd = {{ hd, burnt, bad, few, E: rate(H, 'expert', 100), M: rate(H, 'moyen', 100) }};
      return out; }})()""")
    al, hd = r['alarm'], r['herd']
    check('fausse alerte : un rival qu’on voit crie pendant le regard ; lui ne bouge pas', al['al'] >= 60 and al['far'] == 0 and al['self'] == 0, json.dumps({k: al[k] for k in ('al', 'far', 'self')}))
    check('fausse alerte : l’expert l’ignore (≥ 95 %), le moyen s’y fait griller', al['E']['w'] >= 95 and al['M']['why'].get('alarm', 0) >= 5, f"expert {al['E']['w']} %, moyen grillé {al['M']['why'].get('alarm', 0)} fois")
    check('troupeau : 3 rivaux repartent ensemble et sont grillés tous les trois', hd['hd'] >= 20 and hd['bad'] == 0 and hd['burnt'] == 3 * hd['hd'], f"{hd['hd']} troupeaux, {hd['burnt']} grillés")
    check('troupeau : jamais avec moins de 3 rivaux', hd['few'] == 0)
    check('troupeau : l’expert ne suit pas (≥ 95 %), le moyen suit parfois', hd['E']['w'] >= 95 and hd['M']['why'].get('herd', 0) >= 5, f"expert {hd['E']['w']} %, moyen grillé {hd['M']['why'].get('herd', 0)} fois")
    ERRS.extend(page.errs); await ctx.close()

async def t_v25_rivals_screen(b):
    print('\n22) v2.5 — la fausse alerte et le troupeau à l’écran (6 langues)')
    ctx, page = await new_page(b)
    async def setup(sun):
        await page.evaluate(f"""(() => {{ const d = Soleil.levelById('w1-7'); d.sun = Object.assign({{}}, d.sun, {sun});
          d.rivals = d.rivals.map((r, i) => Object.assign({{}}, r, {{ z0: 25 + i * 5 }})); Soleil.WorldMap.open(); Soleil.Levels.open('w1-7', false); }})()""")
    async def fail_txt():
        await page.evaluate("(() => { const S = Soleil; S.pressing = true; for (let i = 0; i < 200 && S.Levels.phase === 'play'; i++) S.update(1/60); for (let i = 0; i < 80; i++) S.update(1/60); })()")
        return await page.evaluate("[Soleil.Levels.phase, document.getElementById('lvFail').innerText]")
    await setup("{ tempt: { alarm: 1, max: 1 } }")
    ok = await page.evaluate("LVBOT('good', 60 * 60, () => !!Soleil.Levels.fx.alarm) < 60 * 60")
    st = await page.evaluate("""(() => { const S = Soleil, al = S.Levels.fx.alarm, p = S.rivalScreen(al.r); S.render();
      return [S.Levels.m.sun.state, p.vis, al.r.name, S.L.alarmShout, S.Levels.tip && S.Levels.tip.text]; })()""")
    check('fausse alerte : la bulle « IL REGARDE PAS ! VAS-Y ! » d’un rival qu’on voit, pendant son regard', ok and st[0] == 'look' and st[1] and 'VAS-Y' in st[3] and 'blague' in (st[4] or ''), str(st))
    f = await fail_txt()
    check('courir sur la fausse alerte = grillé : « Le rival mentait… »', f[0] == 'fail' and 'rival mentait' in f[1], f[1].split(chr(10))[0])
    await setup("{ tempt: { herd: 1, max: 1 } }")
    ok = await page.evaluate("LVBOT('good', 60 * 60, () => !!Soleil.Levels.fx.herd && Soleil.Levels.fx.herd.n >= 3) < 60 * 60")
    st = await page.evaluate("[Soleil.Levels.m.sun.state, Soleil.Levels.m.rivals.filter(r => r.state === 'grilled').length, Soleil.Levels.phase]")
    check('troupeau : trois rivaux grillés d’un coup, une seule annonce « TOUS GRILLÉS ! »', ok and st[0] == 'look' and st[1] >= 3 and st[2] == 'play', str(st))
    f = await fail_txt()
    check('suivre le troupeau = grillé : « Tu as suivi le troupeau… »', f[0] == 'fail' and 'troupeau' in f[1], f[1].split(chr(10))[0])
    keys = await page.evaluate("""(() => { const S = Soleil, bad = [];
      for (const lang of ['fr', 'en', 'es', 'pt', 'de', 'it']) { const T = S.TXT[lang];
        for (const k of ['alarm', 'herd']) { if (!T.temptHint[k]) bad.push(lang + '.temptHint.' + k); if (!T.temptFail[k]) bad.push(lang + '.temptFail.' + k); }
        for (const k of ['alarmShout', 'herdBurnt']) if (!T[k]) bad.push(lang + '.' + k); }
      return bad; })()""")
    check('6 langues : tous les textes de la fausse alerte et du troupeau existent', not keys, ', '.join(keys))
    ERRS.extend(page.errs); await ctx.close()

# ---------- v2.5 : le monde 3 « La plage » ----------
SEEN_ALL = "['star', 'fakeRet', 'sneeze', 'taunt', 'fly', 'crack', 'fakeBack', 'recount', 'planeGo', 'alarm', 'herd']"

async def t_w3_fair(b):
    print('\n23) Monde 3 juste : l’expert réussit chaque niveau de la plage ; le robot prudent n’y arrive jamais')
    ctx, page = await new_page(b)
    r = await page.evaluate(f"""(() => {{
      const S = Soleil, res = {{}}, pat = {{}};
      for (const lv of S.WORLDS[2].levels) {{ let w = 0, p = 0;
        for (let a = 1; a <= 100; a++) {{ const m = S.Match.create(lv, a, {{ playerBrain: 'expert', brainSeen: {SEEN_ALL} }}); m.out = null;
          while (!m.result && m.t < 150) S.Match.step(m, 1/60); if (m.result && m.result.win) w++; }}
        for (let a = 1; a <= 30; a++) {{ const m = S.Match.create(lv, a, {{ playerBrain: 'patient', brainSeen: {SEEN_ALL} }}); m.out = null;
          while (!m.result && m.t < 150) S.Match.step(m, 1/60); if (m.result && m.result.win) p++; }}
        res[lv.num] = w; pat[lv.num] = p; }}
      return {{ res, pat }}; }})()""")
    check('expert : au moins 95/100 sur chacun des 8 niveaux de la plage', all(v >= 95 for v in r['res'].values()), json.dumps(r['res']))
    check('robot prudent (il s’arrête à chaque « 3 », attend le « ding ») : au plus 3/30 par niveau', all(v <= 3 for v in r['pat'].values()), json.dumps(r['pat']))
    ERRS.extend(page.errs); await ctx.close()

async def t_w3_map(b):
    print('\n24) Carte : la plage se débloque avec 12 étoiles du monde 2 ; son décor')
    ctx, page = await new_page(b)
    await page.click('#lvBtn'); await page.wait_for_timeout(200)
    await page.evaluate("Soleil.WorldMap.tap(14 + 62 * 2.5, 48 + 18)"); await page.wait_for_timeout(200)
    t = await page.evaluate("document.getElementById('toast').innerText")
    check('monde 3 verrouillé : « Gagne 12 ★ dans le monde 2… »', '12' in t and 'monde 2' in t, t)
    await ctx.add_init_script("""if (location.search.includes('w2stars')) { const s = {};
      for (let i = 1; i <= 8; i++) s['w1-' + i] = { s: [true, true, true], best: 30, tries: 1, done: true };
      for (let i = 1; i <= 6; i++) s['w2-' + i] = { s: [true, true, false], best: 30, tries: 1, done: true };
      localStorage.setItem('soleil.levels', JSON.stringify(s)); localStorage.setItem('soleil.worldsShown', JSON.stringify([2])); }""")
    await page.goto(URL + '?w2stars'); await page.wait_for_function("Soleil.Poki && Soleil.Poki.loaded"); await page.wait_for_timeout(300); await page.evaluate(FAST)
    await page.click('#lvBtn'); await page.wait_for_timeout(1600)
    r = await page.evaluate("[Soleil.WorldMap.nodes[0].lv.id, Soleil.Levels.unlocked(Soleil.levelById('w3-1')), Soleil.Levels.unlocked(Soleil.levelById('w3-2')), JSON.stringify(Soleil.store.get('worldsShown', []))]")
    check('12 étoiles : animation, la carte passe sur la plage, niveau 1 ouvert, niveau 2 fermé', r[0] == 'w3-1' and r[1] and not r[2] and '3' in r[3], str(r))
    px = await page.evaluate("""(() => { const S = Soleil; S.WorldMap.draw(); const d = S.ctx.getImageData(Math.round(S.W * 0.5 * S.DPR), Math.round(S.H * 0.85 * S.DPR), 1, 1).data; return [d[0], d[1], d[2]]; })()""")
    check('la page de la plage : du sable (jaune clair) en bas de la carte', px[0] > 200 and px[1] > 180 and px[2] < 200, str(px))
    await page.evaluate("Soleil.WorldMap.open(); Soleil.Levels.open('w3-1', false)")
    lv = await page.evaluate("(() => { const S = Soleil; S.render(); return [S.Levels.def.world, S.Levels.m.level.chairs, S.Levels.m.rivals.length]; })()")
    check('niveau 1 de la plage : 3 transats pour 4 enfants', lv == [3, 3, 3], str(lv))
    ERRS.extend(page.errs); await ctx.close()

async def t_w3_pressure(b):
    print('\n25) La plage : les transats et la glace qui fond')
    ctx, page = await new_page(b)
    r = await page.evaluate(f"""(() => {{
      const S = Soleil, def = S.levelById('w3-1'), out = {{ chairs: 0, other: 0, revive: 0 }};
      for (let a = 1; a <= 60; a++) {{ const m = S.Match.create(def, a, {{ playerBrain: 'patient', brainSeen: {SEEN_ALL} }});
        while (!m.result && m.t < 150) {{ S.Match.step(m, 1/60); m.out.length = 0; }}
        if (m.result.why === 'chairs') {{ out.chairs++; if (m.finishers.length >= m.level.chairs && S.Match.revive(m)) out.revive++; }}
        else if (!m.result.win) out.other++; }}
      return out; }})()""")
    check('transats : le trop prudent n’a jamais de transat (perdu, sans 2e chance) ; sinon c’est la nuit', r['chairs'] >= 30 and r['revive'] == 0 and r['chairs'] + r['other'] == 60, json.dumps(r))
    g = await page.evaluate("""(() => {
      const S = Soleil, def = S.levelById('w3-2'), m = S.Match.create(def, 3, { playerBrain: 'expert' }), drops = [];
      while (!m.result && m.t < 150) { S.Match.step(m, 1/60); for (const e of m.out) if (e.type === 'melt') drops.push([+m.t.toFixed(2), e.left]); m.out.length = 0; }
      const st = S.Match.starsOf(S.Match.normalize(def), m.result);
      return { drops, win: m.result.win, scoops: m.result.scoops, time: m.result.time, st, melt: def.melt, n0: def.scoops }; })()""")
    regular = all(abs(t - (i + 1) * g['melt']) < 0.05 and left == g['n0'] - i - 1 for i, (t, left) in enumerate(g['drops']))
    check('glace : une boule fond toutes les ' + str(g['melt']) + ' s ; à l’arrivée, il en reste ce que dit le temps', g['win'] and regular and g['scoops'] == g['n0'] - len(g['drops']), json.dumps(g)[:160])
    check('glace : les étoiles viennent des boules qui restent', g['st'][1] == (g['scoops'] >= 4) and g['st'][2] == (g['scoops'] >= 5), str(g['st']))
    await page.evaluate("Soleil.WorldMap.open(); Soleil.Levels.open('w3-2', false)")
    await page.evaluate("Soleil.Levels.m.player.z = Soleil.Levels.m.level.length - 0.01; Soleil.Levels.m.player.v = 8")
    m = await page.evaluate("(() => { LVBOT('greedy', 60 * 2, () => !!Soleil.Levels.mountain); const L = Soleil.Levels; return [L.phase, L.mountain && L.mountain.n, L.m.result && L.m.result.scoops]; })()")
    check('arrivée : la montagne de boules (autant de boules que dans la glace)', m[1] and m[1] == m[2], str(m))
    ERRS.extend(page.errs); await ctx.close()

async def t_w3_boss(b):
    print('\n26) Boss de la plage : le Soleil Vacancier (chapeau de paille, lunettes en cœur, calypso, coups spéciaux, victoire)')
    ctx, page = await new_page(b)
    await page.evaluate("Soleil.WorldMap.open(); Soleil.Levels.open('w3-8', false)")
    await page.evaluate("Soleil.Sound.unlock()")
    r = await page.evaluate("""(() => { const S = Soleil, L = S.Levels; LVBOT('none', 15); L.press(); LVBOT('none', 2); const a = { ph: L.phase, face: L.m.sun.turnP };
      LVBOT('none', 60 * 2); a.face2 = L.m.sun.bossFace; a.music = S.Music.on; a.bpm = S.Music.T && S.Music.T.bpm; LVBOT('none', 90); a.ph2 = L.phase; return a; })()""")
    check('intro : il se tourne vers toi', r['ph'] == 'boss' and r['face'] == 1)
    check('chapeau de paille et lunettes en cœur + calypso (144 bpm)', r['face2'] == 'vacancier' and r['music'] and r['bpm'] == 144, json.dumps(r))
    check('puis le niveau commence', r['ph2'] == 'play')
    mv = await page.evaluate("""(() => { const L = Soleil.Levels, t = new Set(); for (let i = 0; i < 60 * 25; i++) { LVBOT('good', 1); if (L.banner) t.add(L.banner.title); if (L.phase !== 'play') break; } return [...t].join(' / '); })()""")
    check('coups spéciaux annoncés (bannières)', 'L’AVION PUBLICITAIRE' in mv and 'LA SIESTE AU SOLEIL' in mv, mv)
    await page.evaluate("Soleil.Levels.m.player.z = Soleil.Levels.m.level.length - 0.01; Soleil.Levels.m.player.v = 8")
    await page.evaluate("LVBOT('greedy', 60 * 12, () => Soleil.Levels.phase === 'results')")   # la montagne de glace passe d'abord
    w = await page.evaluate("[Soleil.Levels.phase, Soleil.Music.on, (document.getElementById('lvEnd') || {}).innerText || '']")
    check('victoire : musique coupée, « SOLEIL VACANCIER BATTU ! », monde 3 terminé', w[0] == 'results' and not w[1] and 'VACANCIER BATTU' in w[2] and 'Monde 3' in w[2], w[2].split('\n')[0])
    ERRS.extend(page.errs); await ctx.close()

async def t_endless_lies(b):
    print('\n27) Course infinie : le recomptage (dès 50 m) et l’avion menteur (dès 90 m), même défi du jour pour tous')
    ctx, page = await new_page(b)
    r = await page.evaluate("""(() => { const S = Soleil, out = { before: 0, recount: [], plane: [], cycles: 0 };
      for (let run = 0; run < 8; run++) {
        S.startRun('free'); if (run % 2) S.runner.z = 92;   // une partie sur deux commence à 92 m (les avions)
        let last = null, lastP = null;
        for (let i = 0; i < 60 * 300 && S.state === 'play'; i++) {
          const w = S.watcher;
          S.pressing = (w.state === 'pause' || (w.state === 'chant' && w.textKind !== 'trigger') || (w.state === 'return' && !w.retTo));
          S.bossQueue.length = 0; S.update(1 / 60);   // pas de boss ici : les faux signaux ne viennent jamais pendant un boss
          if (w.lie && w.lie.fired && w.lie !== last) { last = w.lie; (w.lie.type === 'recount' ? out.recount : out.plane).push(Math.round(S.runner.z)); }
          if (S.plane && S.plane !== lastP) { lastP = S.plane; if (S.plane.kind === 'stop') out.plane.push(Math.round(S.runner.z)); }
          if (w.lie && w.lie.fired && S.runner.z < 50) out.before++;
        }
        out.cycles += S.cycleN;
      }
      return out; })()""")
    check('le recomptage arrive, jamais avant 50 m', len(r['recount']) >= 2 and min(r['recount']) >= 50 and r['before'] == 0, json.dumps(r)[:160])
    check('l’avion menteur arrive, jamais avant 90 m', len(r['plane']) >= 2 and min(r['plane']) >= 90, json.dumps(r['plane']))
    DAILY = """(() => { const S = Soleil; S.startRun('daily'); S.runner.z = 92; const lies = new Set();
        for (let i = 0; i < 60 * 200 && S.state === 'play'; i++) { const w = S.watcher;
          S.pressing = (w.state === 'pause' || (w.state === 'chant' && w.textKind !== 'trigger') || (w.state === 'return' && !w.retTo));
          S.bossQueue.length = 0; S.update(1 / 60); if (w.lie) lies.add(S.cycleN + ':' + w.lie.type); if (w.planeAt >= 0) lies.add(S.cycleN + ':stop'); }
        return [...lies].sort().join(); })()"""
    ctx2, page2 = await new_page(b)                 # un 2e joueur, sur un autre appareil : le même défi du jour
    d = [await page.evaluate(DAILY), await page2.evaluate(DAILY)]
    check('défi du jour : les mêmes faux signaux, au même cycle, pour tout le monde (2 joueurs)', d[0] == d[1] and d[0] != '', d[0][:120])
    ERRS.extend(page2.errs); await ctx2.close()
    await page.evaluate("""(() => { const S = Soleil;           // un joueur qui repart dès qu'un faux signal lui dit « c'est reparti »
      for (let k = 0; k < 8 && !(S.lastRun && S.lastRun.lie); k++) { S.startRun('free'); S.runner.z = 92;
        for (let i = 0; i < 60 * 120 && S.state === 'play'; i++) { const w = S.watcher;
          S.pressing = w.state === 'pause' || (w.state === 'chant' && w.textKind !== 'trigger') || (w.state === 'return' && !w.retTo)
            || (w.state === 'look' && !w.second && !!w.lie && w.lie.fired);
          S.bossQueue.length = 0; S.update(1 / 60); }
        for (let i = 0; i < 200; i++) S.update(1 / 60); } })()""")
    t = await page.evaluate("((Soleil.lastRun && Soleil.lastRun.lie) || '') + '|' + document.getElementById('over').innerText")
    lie, txt = t.split('|', 1)
    check('grillé par un faux signal : le conseil de fin le dit (« Il comptait en te regardant… » / « L’avion mentait… »)',
          lie in ('recount', 'planeGo') and ('comptait en te regardant' in txt or 'avion mentait' in txt), (lie + ' / ' + txt.replace(chr(10), ' '))[:140])
    ERRS.extend(page.errs); await ctx.close()

TESTS = [t_flow, t_fail, t_determinism, t_fair, t_rivals, t_map, t_save, t_boss, t_english, t_perf,
         t_w2_rule, t_w2_signal, t_w2_fair, t_w2_mud, t_w2_map, t_w2_reward, t_w2_boss, t_w2_english,
         t_v25_lies, t_v25_lies_screen, t_v25_rivals, t_v25_rivals_screen,
         t_w3_fair, t_w3_map, t_w3_pressure, t_w3_boss, t_endless_lies]
async def main():
    only = sys.argv[1:]
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=os.environ.get('CHROME') or None, args=['--disable-gpu'])
        for t in TESTS:
            if only and t.__name__ not in only: continue
            try: await t(b)
            except Exception as e: check(f'{t.__name__} s’est arrêté', False, repr(e)[:200])
        await b.close()
    print('\nErreurs JS / console :', ERRS if ERRS else 'aucune')
    print(f'\nBILAN : {sum(RES)}/{len(RES)} OK')
if __name__ == '__main__':
    asyncio.run(main())
