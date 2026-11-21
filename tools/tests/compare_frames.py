# Compare, image par image, le dessin du jeu entre une ancienne version et celle-ci (Playwright).
# But : prouver qu'une phase n'a rien changé à ce qui devait rester pareil (course infinie, monde 1).
# Lance : python3 tools/tests/compare_frames.py /chemin/vers/l/ancienne/version
#         (le dossier qui contient l'ancien index.html, par exemple le zip de la phase précédente décompressé)
# Variable CHROME=/chemin/vers/chrome pour utiliser un autre navigateur.
# Les deux versions reçoivent la même graine, le même hasard visuel et une horloge figée. Seul le canvas est
# comparé (pas les messages HTML, qui ont des animations CSS). Le son est désactivé : son horloge est réelle.
import asyncio, hashlib, os, sys
from playwright.async_api import async_playwright

NEW = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
INIT = """
(() => { let s = 12345; Math.random = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
  const T0 = 1763600000000; Date.now = () => T0; performance.now = () => 1000; window.requestAnimationFrame = () => 0;
  let c = 777; crypto.getRandomValues = a => { for (let i = 0; i < a.length; i++) a[i] = (c = (c * 69069 + 1) >>> 0); return a; };
  window.AudioContext = undefined; window.webkitAudioContext = undefined;   // pas de son : son horloge est réelle (la musique du boss tirerait du hasard visuel)
  window.BOT = () => { const S = Soleil, L = S.Levels, m = L.m;          // robot « bon joueur » du monde 1
    if (L.phase === 'intro' || L.phase === 'boss') L.press();
    if (m && L.phase === 'play') { const w = m.sun;
      S.pressing = !((w.state === 'chant' && (w.textKind === 'so' || w.textKind === 'trigger')) || w.state === 'turn' || w.state === 'look'); }
    else S.pressing = false;
    S.update(1 / 60); }; })();
"""
CANVAS = "document.querySelector('canvas').toDataURL('image/png')"
SIZES = [(390, 844), (844, 390)]                   # portrait et paysage
ENDLESS_Z = [0, 140, 260, 410, 560, 720, 900]      # course infinie : boue, verglas, descente selon la distance
LEVELS = ['w1-1', 'w1-3', 'w1-5', 'w1-7', 'w1-8']  # monde 1, boss compris
FRAMES = [20, 150, 320, 520, 760, 1000, 1300, 1600]

async def frames(b, root, w, h):
    ctx = await b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=1, locale='fr-FR')
    await ctx.add_init_script(INIT); page = await ctx.new_page()
    await page.goto('file://' + root + '/index.html'); await page.wait_for_timeout(300)
    out = []
    for z in ENDLESS_Z:
        await page.evaluate(f"""(() => {{ const S = Soleil; S.seedF = 0.37; if (S.state !== 'play') document.getElementById('freeBtn').click();
          S.runner.z = {z}; S.runner.v = 0; S.render(); }})()""")
        out.append((f'course infinie {z} m', hashlib.md5((await page.evaluate(CANVAS)).encode()).hexdigest()))
    for lv in LEVELS:
        await page.evaluate(f"Soleil.WorldMap.open(); Soleil.Levels.open('{lv}', false)")
        done = 0
        for f in FRAMES:
            await page.evaluate(f"(() => {{ for (let i = 0; i < {f - done}; i++) BOT(); Soleil.render(); }})()"); done = f
            out.append((f'{lv} image {f}', hashlib.md5((await page.evaluate(CANVAS)).encode()).hexdigest()))
    await ctx.close()
    return out

async def main():
    if len(sys.argv) < 2 or not os.path.isfile(os.path.join(sys.argv[1], 'index.html')):
        print(__doc__ or 'Usage : python3 tools/tests/compare_frames.py /chemin/vers/l/ancienne/version'); sys.exit(2)
    old = os.path.abspath(sys.argv[1])
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=os.environ.get('CHROME') or None, args=['--disable-gpu'])
        same = tot = 0
        for (w, h) in SIZES:
            a, c = await frames(b, old, w, h), await frames(b, NEW, w, h)
            for (name, h1), (_, h2) in zip(a, c):
                tot += 1; same += h1 == h2
                if h1 != h2: print(f'  ❌ {w}×{h} {name} : différent')
        print(f'BILAN : {same}/{tot} images identiques')
        await b.close()
        sys.exit(0 if same == tot else 1)

asyncio.run(main())
