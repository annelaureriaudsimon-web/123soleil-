# Miniatures et vidéo pour Poki, fabriquées à partir du VRAI jeu (mode vitrine : js/platform/showcase.js).
# Gratuit : Python + Playwright (comme les tests), et ffmpeg pour la vidéo.
#   python3 tools/thumbnails/make.py                 → dist/thumbnails/en/*.png (anglais : la langue de Poki)
#   python3 tools/thumbnails/make.py --lang fr       → dist/thumbnails/fr/*.png
#   python3 tools/thumbnails/make.py --video         → + la miniature animée (1080×1080, 60 i/s, 5 s, .mp4)
# Règles de Poki suivies (sdk.poki.com/game-thumbnail et /animated-thumbnails) : carré plein cadre d'au moins 628 px,
# pas de bord ni de coins arrondis (Poki les ajoute), un personnage clair, fond simple, contraste fort, peu de texte,
# pas trop de turquoise #83FFE7 (le fond de Poki) ; vidéo carrée 1080×1080, 50 i/s ou plus, 4 à 6 s, .mp4, sans curseur.
import asyncio, os, sys, shutil, subprocess, json
from playwright.async_api import async_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
URL = 'file://' + ROOT + '/index.html'
FAKE = open(os.path.join(ROOT, 'tools', 'tests', 'fake_poki_sdk.js')).read()
arg = lambda k, d: sys.argv[sys.argv.index(k) + 1] if k in sys.argv else d
LANG = arg('--lang', 'en')
OUT = os.path.join(ROOT, 'dist', 'thumbnails', LANG)

# (nom, largeur CSS, hauteur CSS, échelle, scène, niveau, moment voulu)
# moment : 'title' (accueil), 'look' (il te regarde : tout le monde figé), 'trap' (mot piège démasqué, rayé), 'run' (on court)
SHOTS = [
  ('carre_titre',      512, 512, 2, 'title', None,   'title'),
  ('carre_sans_titre', 512, 512, 2, 'title&nologo', None, 'title'),
  ('carre_regard',     512, 512, 2, 'race', 'w2-3',  'look'),
  ('carre_boss',       512, 512, 2, 'race', 'w1-8',  'look'),
  ('carre_piege',      512, 512, 2, 'race', 'w1-3',  'trap'),
  ('paysage_titre',    960, 540, 2, 'title', None,   'title'),
  ('paysage_course',   960, 540, 2, 'race', 'w2-6',  'run'),
  ('portrait_titre',   540, 960, 2, 'title', None,   'title'),
  ('portrait_regard',  540, 960, 2, 'race', 'w2-3',  'look'),
]
WAIT = {   # condition JS pour chaque moment (on avance image par image jusqu'à ce qu'elle soit vraie)
  'title': "true",
  'look': "S.Levels.m && S.Levels.m.sun.state === 'look' && S.Levels.m.t > 6 && S.Levels.m.sun.t > 0.25",
  'trap': "S.Levels.m && S.Levels.m.sun.textKind === 'trap' && S.Levels.m.t - S.Levels.m.sun.textAt > 0.45",
  'run': "S.Levels.m && S.Levels.m.t > 8 && S.Levels.m.player.v > 4 && S.Levels.m.sun.state === 'chant'",
}

async def page_for(b, w, h, k, scene, lv):
    ctx = await b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=k, locale=LANG)
    await ctx.route('**/poki-sdk.js', lambda r: r.fulfill(status=200, content_type='application/javascript', body=FAKE))
    await ctx.add_init_script("window.requestAnimationFrame = () => 0;")   # c'est nous qui avançons le temps : images nettes et reproductibles
    p = await ctx.new_page()
    url = f"{URL}?lang={LANG}&showcase={scene}" + (f"&lv={lv}" if lv else '')
    await p.goto(url); await p.wait_for_function("window.Soleil && Soleil.Poki && Soleil.Poki.loaded", polling=100)
    if scene == 'race': await p.wait_for_function("Soleil.state === 'level'", polling=100)   # la vitrine ouvre le niveau juste après le chargement
    await p.evaluate("""(() => { const S = Soleil; window.__t = 0; window.__step = n => { for (let i = 0; i < n; i++) { __t += 1000 / 60; S.frame(__t); } }; })()""")
    await p.evaluate("__step(30)")
    return ctx, p

def turquoise_share(path):
    from PIL import Image
    im = Image.open(path).convert('RGB').resize((128, 128)); px = list(im.get_flattened_data() if hasattr(im, 'get_flattened_data') else im.getdata())
    near = sum(1 for r, g, b_ in px if abs(r - 0x83) < 40 and abs(g - 0xFF) < 40 and abs(b_ - 0xE7) < 40)
    return near / len(px)

async def shots(b):
    os.makedirs(OUT, exist_ok=True)
    report = []
    for name, w, h, k, scene, lv, moment in SHOTS:
        ctx, p = await page_for(b, w, h, k, scene, lv)
        ok = await p.evaluate(f"(() => {{ const S = Soleil; for (let i = 0; i < 60 * 90; i++) {{ if ({WAIT[moment]}) return true; __step(1); }} return false; }})()")
        await p.evaluate("Soleil.render()")
        f = os.path.join(OUT, name + '.png'); await p.screenshot(path=f)
        tq = turquoise_share(f)
        report.append((name, f'{w * k}×{h * k}', 'ok' if ok else 'moment pas trouvé', f'{tq:.0%} de turquoise Poki'))
        await ctx.close()
    for r in report: print('  ' + ' · '.join(r))

async def video(b):
    if not shutil.which('ffmpeg'): print('  ffmpeg absent : pas de vidéo (gratuit : https://ffmpeg.org)'); return
    tmp = os.path.join(OUT, '_frames'); os.makedirs(tmp, exist_ok=True)
    ctx, p = await page_for(b, 540, 540, 2, 'race', 'w1-8')
    await p.evaluate(f"(() => {{ const S = Soleil; for (let i = 0; i < 60 * 60; i++) {{ if (S.Levels.m && S.Levels.m.t > 4 && S.Levels.m.sun.state === 'chant' && S.Levels.m.sun.textKind === 'num') return; __step(1); }} }})()")
    for i in range(300):                     # 5 s à 60 i/s
        await p.evaluate("__step(1); Soleil.render()")
        await p.screenshot(path=os.path.join(tmp, f'{i:04d}.png'))
    await ctx.close()
    mp4 = os.path.join(OUT, 'miniature_animee_1080.mp4')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', '60', '-i', os.path.join(tmp, '%04d.png'),
                    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', '-an', mp4], check=True)
    shutil.rmtree(tmp)
    print(f'  miniature_animee_1080.mp4 · 1080×1080 · 60 i/s · 5 s · {os.path.getsize(mp4) / 1e6:.1f} Mo')

async def main():
    async with async_playwright() as pw:
        b = await pw.chromium.launch(executable_path=os.environ.get('CHROME') or None, args=['--disable-gpu'])
        print(f'Miniatures Poki ({LANG}) → {os.path.relpath(OUT, ROOT)}')
        await shots(b)
        if '--video' in sys.argv: await video(b)
        await b.close()
asyncio.run(main())
