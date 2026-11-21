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
    check('expert (lâche dès « SO ») : 120/120 sur chacun des 8 niveaux', all(v == 120 for v in r.values()), json.dumps(r))
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
    print('\n6) Carte : cadenas, mondes 3 à 5 « Bientôt », clavier, étoiles')
    ctx, page = await new_page(b)
    await page.click('#lvBtn'); await page.wait_for_timeout(150)
    n = await page.evaluate("Soleil.WorldMap.nodes.map(n => [n.x, n.y])")
    await page.mouse.click(n[1][0], n[1][1]); await page.wait_for_timeout(250)
    t = await page.evaluate("[Soleil.state, document.getElementById('toast').innerText]")
    check('niveau 2 verrouillé : on reste sur la carte, message clair', t[0] == 'map' and 'débloquer' in t[1], t[1])
    tab = await page.evaluate("(() => { Soleil.WorldMap.layout(); const S = Soleil; return 0; })()")
    await page.wait_for_timeout(1800)
    await page.mouse.click(14 + 62 * 2.5, 48 + 18); await page.wait_for_timeout(250)
    check('monde 3 : « Bientôt »', 'bientôt' in (await page.evaluate("document.getElementById('toast').innerText")).lower())
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
    await page.evaluate("""(() => { const S = Soleil; S.store.set('best', 321); S.store.set('stars', 45); S.store.set('owned', ['classic', 'cap']);
      S.store.set('outfit', 'cap'); S.store.set('medals', ['midi']); S.store.set('plays', 12); S.store.set('ghost', [0, 10, 25, 40]); })()""")
    await page.reload(); await page.wait_for_timeout(300); await page.evaluate(FAST)
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
    check('les 6 tentations apparaissent dans le monde 2', r['types'] == 'crack fakeRet fly sneeze star taunt', r['types'])
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
    await page.evaluate("""(() => { const s = {}; for (let i = 1; i <= 6; i++) s['w1-' + i] = { s: [true, true, false], best: 30, tries: 1, done: true }; Soleil.store.set('levels', s); })()""")
    await page.reload(); await page.wait_for_timeout(300); await page.evaluate(FAST)
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

TESTS = [t_flow, t_fail, t_determinism, t_fair, t_rivals, t_map, t_save, t_boss, t_english, t_perf,
         t_w2_rule, t_w2_signal, t_w2_fair, t_w2_mud, t_w2_map, t_w2_reward, t_w2_boss, t_w2_english]
async def main():
    only = sys.argv[1:]
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=os.environ.get('CHROME') or None)
        for t in TESTS:
            if only and t.__name__ not in only: continue
            try: await t(b)
            except Exception as e: check(f'{t.__name__} s’est arrêté', False, repr(e)[:200])
        await b.close()
    print('\nErreurs JS / console :', ERRS if ERRS else 'aucune')
    print(f'\nBILAN : {sum(RES)}/{len(RES)} OK')
if __name__ == '__main__':
    asyncio.run(main())
