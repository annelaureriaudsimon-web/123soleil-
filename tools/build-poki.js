#!/usr/bin/env node
/* tools/build-poki.js — Fabrique la version Poki du jeu : dist/poki/ et dist/soleil-poki.zip.
   Lance : node tools/build-poki.js
   Sans aucune dépendance (Node seul). Le script :
   - prend les scripts de index.html DANS L'ORDRE, sauf le mode debug (js/platform/debug.js) ;
   - retire les lignes qui finissent par le commentaire « // @debug » et les blocs entre les lignes
     « // @debug-start » et « // @debug-end » ;
   - les réunit dans UN seul fichier dist/poki/game.js ;
   - copie css/style.css et écrit dist/poki/index.html (SDK Poki dans le <head>, balise normale) ;
   - n'emporte rien d'autre (ni tools/, ni docs/, ni README.md, CHANGELOG.md, .gitignore, .nojekyll) ;
   - fait le ZIP à envoyer à Poki, puis vérifie tout et affiche un rapport OK / ERREUR
     (code de sortie 1 s'il y a une erreur). */
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { execFileSync } = require('child_process');

// ---------- Réglages ----------
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const OUT = path.join(DIST, 'poki');
const ZIP = path.join(DIST, 'soleil-poki.zip');
const SDK = 'https://game-cdn.poki.com/scripts/v2/poki-sdk.js';
const DEV_ONLY = ['js/platform/debug.js'];                 // le mode debug n'existe pas dans le build
const MAX_SIZE = 8 * 1024 * 1024;                          // limite de Poki : 8 Mo
const NAMESPACES = ['http://www.w3.org/2000/svg'];         // des noms de format SVG, pas des adresses visitées

// ---------- 1. Les scripts de index.html, dans l'ordre ----------
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
const kept = scripts.filter(s => !DEV_ONLY.includes(s));
let debugLines = 0;
const MARK = /\/\/ *@debug(?![-\w])/, START = /^\s*\/\/ *@debug-start\s*$/, END = /^\s*\/\/ *@debug-end\s*$/;
function stripDebug(src) {                                 // enlève tout ce qui est marqué pour le debug
  const out = [];
  let skip = false;
  for (const line of src.split('\n')) {
    if (START.test(line)) { skip = true; debugLines++; continue; }
    if (END.test(line)) { skip = false; debugLines++; continue; }
    if (skip || MARK.test(line)) { debugLines++; continue; }
    out.push(line);
  }
  return out.join('\n');
}
const sources = kept.map(f => [f, fs.readFileSync(path.join(ROOT, f), 'utf8')]);
const stripped = sources.map(([f, src]) => [f, stripDebug(src)]);
const parts = stripped.map(([f, src]) => `/* ===== ${f} ===== */\n` + src.trim() + '\n');
const game = '/* 1, 2, 3… SOLEIL ! — version Poki (tools/build-poki.js). Les sources lisibles sont dans le projet. */\n'
  + 'window.Soleil = window.Soleil || {};\n' + parts.join(';\n');

// ---------- 2. index.html du build ----------
let page = html
  .replace(/<!--[\s\S]*?-->\n?/g, '')                                           // les notes pour les développeurs
  .replace(/<script async src="[^"]*poki-sdk\.js"[^>]*><\/script>/, `<script src="${SDK}"></script>`)
  .replace('href="css/style.css"', 'href="style.css"');
let first = true;
page = page.replace(/<script src="(?!https?:)[^"]+"><\/script>\n?/g, () => (first ? (first = false, '<script src="game.js"></script>\n') : ''));

// ---------- 3. On écrit dist/poki/ ----------
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const files = { 'index.html': page, 'game.js': game, 'style.css': fs.readFileSync(path.join(ROOT, 'css', 'style.css'), 'utf8') };
for (const [name, text] of Object.entries(files)) fs.writeFileSync(path.join(OUT, name), text);

// ---------- 4. Le ZIP (format ZIP classique, compression « deflate » de Node) ----------
const CRC = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = buf => { let c = 0xFFFFFFFF; for (const b of buf) c = CRC[(c ^ b) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
function makeZip(entries) {
  const now = new Date(), time = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
  const date = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
  const locals = [], centrals = [];
  let offset = 0;
  for (const [name, text] of entries) {
    const data = Buffer.from(text, 'utf8'), packed = zlib.deflateRawSync(data, { level: 9 }), nm = Buffer.from(name, 'utf8');
    const crc = crc32(data);
    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0x0800, 6); lh.writeUInt16LE(8, 8);
    lh.writeUInt16LE(time, 10); lh.writeUInt16LE(date, 12); lh.writeUInt32LE(crc, 14);
    lh.writeUInt32LE(packed.length, 18); lh.writeUInt32LE(data.length, 22); lh.writeUInt16LE(nm.length, 26); lh.writeUInt16LE(0, 28);
    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(0x0800, 8); ch.writeUInt16LE(8, 10);
    ch.writeUInt16LE(time, 12); ch.writeUInt16LE(date, 14); ch.writeUInt32LE(crc, 16);
    ch.writeUInt32LE(packed.length, 20); ch.writeUInt32LE(data.length, 24); ch.writeUInt16LE(nm.length, 28);
    ch.writeUInt32LE(offset, 42);
    locals.push(lh, nm, packed); centrals.push(ch, nm);
    offset += lh.length + nm.length + packed.length;
  }
  const cd = Buffer.concat(centrals), end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, cd, end]);
}
fs.writeFileSync(ZIP, makeZip(Object.entries(files)));

// ---------- 5. Les vérifications ----------
const checks = [];
const check = (ok, label, detail) => checks.push({ ok, label, detail });
const kb = n => `${(n / 1024).toFixed(1).replace('.', ',')} Ko`;
const lineOf = (text, i) => text.slice(0, i).split('\n').length;

// Un petit lecteur de JavaScript : saute les commentaires, chaînes et expressions régulières,
// et suit les blocs { } en notant ceux qui sont des « try ».
function scanJs(src, onWord) {
  const stack = [];
  let i = 0, prev = '';
  const regexOk = () => !prev || '(,=:[!&|?{};+-*%<>~^'.includes(prev) || /\b(return|typeof|case|in|of|delete|void|throw|new)$/.test(src.slice(Math.max(0, i - 8), i).trimEnd());
  while (i < src.length) {
    const c = src[i], d = src[i + 1];
    if (c === '/' && d === '/') { i = src.indexOf('\n', i); if (i < 0) break; continue; }
    if (c === '/' && d === '*') { i = src.indexOf('*/', i + 2) + 2; if (i < 2) break; continue; }
    if (c === '"' || c === "'") { let j = i + 1; while (j < src.length && src[j] !== c) { if (src[j] === '\\') j++; j++; } i = j + 1; prev = 'a'; continue; }
    if (c === '`') {                                       // gabarit : ${ … } peut contenir des accolades
      let j = i + 1, depth = 0;
      while (j < src.length) {
        if (src[j] === '\\') { j += 2; continue; }
        if (depth === 0 && src[j] === '`') break;
        if (src[j] === '$' && src[j + 1] === '{') { depth++; j += 2; continue; }
        if (depth > 0 && src[j] === '{') depth++;
        else if (depth > 0 && src[j] === '}') depth--;
        j++;
      }
      i = j + 1; prev = 'a'; continue;
    }
    if (c === '/' && regexOk()) {                          // expression régulière
      let j = i + 1, cls = false;
      while (j < src.length && (cls || src[j] !== '/')) { if (src[j] === '\\') j++; else if (src[j] === '[') cls = true; else if (src[j] === ']') cls = false; j++; }
      j++; while (/[a-z]/i.test(src[j] || '')) j++;
      i = j; prev = 'a'; continue;
    }
    if (c === '{') { stack.push(/\btry\s*$/.test(src.slice(Math.max(0, i - 12), i)) ? 'try' : '{'); i++; prev = c; continue; }
    if (c === '}') { stack.pop(); i++; prev = c; continue; }
    if (/[A-Za-z_$]/.test(c)) {
      let j = i; while (j < src.length && /[\w$]/.test(src[j])) j++;
      onWord(src.slice(i, j), i, stack);
      i = j; prev = 'a'; continue;
    }
    if (!/\s/.test(c)) prev = c;
    i++;
  }
  return stack.length;
}

// a) aucune adresse http(s) sauf le SDK
const urls = [];
for (const [name, text] of Object.entries(files)) {
  for (const m of text.matchAll(/https?:\/\/[^\s"'`)<>\\]+/g)) {
    const u = m[0];
    if (NAMESPACES.some(n => u.startsWith(n))) continue;
    if (u === SDK && name === 'index.html') continue;
    urls.push(`${name}:${lineOf(text, m.index)} ${u}`);
  }
}
const sdkTags = (page.match(/poki-sdk\.js/g) || []).length;
check(urls.length === 0 && sdkTags === 1, 'Aucune adresse http(s) externe, sauf le SDK Poki (une fois, dans le <head>)',
  urls.length ? urls.join(' ; ') : `SDK : ${sdkTags} balise${sdkTags > 1 ? 's' : ''}`);

// b) aucun lien sortant
const LINKS = [[/window\.open\s*\(/g, 'window.open'], [/\blocation\.(href|assign|replace)\b/g, 'location.href / assign / replace'],
  [/<a\s[^>]*href\s*=\s*["']https?:/gi, '<a href> externe'], [/\.href\s*=\s*['"`]https?:/g, 'lien externe'], [/target\s*=\s*["']_blank/gi, 'target="_blank"']];
const links = [];
for (const [name, text] of Object.entries(files)) for (const [re, label] of LINKS) for (const m of text.matchAll(re)) links.push(`${label} (${name}:${lineOf(text, m.index)})`);
check(links.length === 0, 'Aucun lien sortant (window.open, <a href> externe, location.href vers un autre site)', links.join(' ; ') || 'aucun');

// c) chaque localStorage est dans un try/catch
let ls = 0;
const lsBad = [];
const open = scanJs(game, (word, at, stack) => {
  if (word !== 'localStorage') return;
  ls++;
  if (!stack.includes('try')) lsBad.push(`game.js:${lineOf(game, at)}`);
});
check(lsBad.length === 0 && ls > 0 && open === 0, 'localStorage : chaque accès est dans un try/catch',
  lsBad.length ? 'hors try : ' + lsBad.join(', ') : `${ls} accès, tous protégés`);

// d) aucun console.log ni code de debug
const DEBUG = [[/\bconsole\.(log|debug|info|trace|dir|table)\s*\(/g, 'console.log'], [/\bdebugger\b/g, 'debugger'], [/@debug/g, 'marque @debug'],
  [/debugHook|fakePoki|debugLog|fakead/g, 'mode debug'], [/js\/platform\/debug\.js/g, 'debug.js']];
const dbg = [];
for (const [name, text] of Object.entries(files)) for (const [re, label] of DEBUG) for (const m of text.matchAll(re)) dbg.push(`${label} (${name}:${lineOf(text, m.index)})`);
check(dbg.length === 0, 'Aucun console.log ni code de debug', dbg.join(' ; ') || `${debugLines} lignes @debug retirées, debug.js absent`);

// e) taille totale
const sizes = Object.keys(files).map(n => [n, fs.statSync(path.join(OUT, n)).size]);
const total = sizes.reduce((a, [, s]) => a + s, 0), zipSize = fs.statSync(ZIP).size;
check(total < MAX_SIZE && zipSize < MAX_SIZE, 'Taille totale sous 8 Mo', `${kb(total)} (ZIP ${kb(zipSize)})`);

// f) chaque JS passe node --check (le fichier du build et chaque source)
const syntax = [];
for (const f of [path.join(OUT, 'game.js'), ...scripts.map(s => path.join(ROOT, s))]) {
  try { execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' }); }
  catch (e) { syntax.push(`${path.relative(ROOT, f)} : ${String(e.stderr || e.message).split('\n').find(l => l.trim()) || 'erreur'}`); }
}
check(syntax.length === 0, 'Chaque JS passe node --check', syntax.join(' ; ') || `game.js et les ${scripts.length} scripts sources`);

// h) chaque fichier est entier après le retrait du debug (un commentaire mal fermé avalerait du code sans erreur de syntaxe)
const broken = [];
sources.forEach(([f, src], i) => {
  const count = text => { let n = 0; const open = scanJs(text, w => { if (w === 'Soleil') n++; }); return [n, open]; };
  const [a] = count(src), [b, open] = count(stripped[i][1]);
  if (a !== b || open !== 0) broken.push(f);
});
check(broken.length === 0, 'Chaque fichier est entier après le retrait du debug', broken.join(', ') || `${kept.length} fichiers`);

// i) le SDK n'est appelé QUE par la couche plateforme (js/platform/poki.js) : pubs, pubs récompensées, événements
const direct = [];
for (const [f, src] of stripped) {
  if (f === 'js/platform/poki.js') continue;
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');   // les commentaires ne comptent pas
  if (/PokiSDK\s*[.[]/.test(code) || /\brewardedBreak\s*\(/.test(code.replace(/Poki\.rewardedBreak\s*\(/g, ''))) direct.push(f);
}
check(direct.length === 0, 'Le SDK (pubs et pubs récompensées comprises) passe toujours par js/platform/poki.js',
  direct.join(', ') || 'aucun appel direct');

// g) seulement les fichiers utiles, et index.html ne demande rien d'autre
const inDist = fs.readdirSync(OUT).sort().join(', ');
const refs = [...page.matchAll(/(?:src|href)="([^"]+)"/g)].map(m => m[1]).filter(u => !u.startsWith('data:') && u !== SDK);
const missing = refs.filter(u => !files[u]);
check(inDist === 'game.js, index.html, style.css' && missing.length === 0, 'Seulement les fichiers utiles, rien qui manque',
  missing.length ? 'manquants : ' + missing.join(', ') : inDist);

// ---------- 6. Le rapport ----------
const bad = checks.filter(c => !c.ok).length;
console.log('BUILD POKI — 1, 2, 3… SOLEIL !');
console.log(`  ${kept.length} scripts réunis dans game.js, dans l'ordre de index.html (retiré : ${DEV_ONLY.join(', ')})`);
console.log(`  dist/poki : ${sizes.map(([n, s]) => `${n} (${kb(s)})`).join(' · ')}`);
console.log(`  ZIP : ${path.relative(ROOT, ZIP)} (${kb(zipSize)})`);
console.log('\nVÉRIFICATIONS');
for (const c of checks) console.log(`  ${c.ok ? 'OK     ' : 'ERREUR '} ${c.label}${c.detail ? `  [${c.detail}]` : ''}`);
console.log(bad ? `\nRÉSULTAT : ${bad} ERREUR${bad > 1 ? 'S' : ''} ❌` : '\nRÉSULTAT : TOUT EST OK ✅');
process.exit(bad ? 1 : 0);
