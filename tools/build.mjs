// Bundles index.html + css + js into single self-contained HTML files.
//   node tools/build.mjs
// Outputs:
//   dist/valence.html  - full standalone page (open it anywhere, works offline except web fonts)
//   dist/artifact.html            - same content without <html>/<head>/<body> wrappers (for hosts that add their own)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = p => readFileSync(join(root, p), 'utf8');
let html = read('index.html');

const css = read('css/style.css');
html = html.replace(/<!-- build:css -->[\s\S]*?<!-- \/build:css -->/, `<style>\n${css}\n</style>`);

const scripts = [...html.match(/<!-- build:js -->([\s\S]*?)<!-- \/build:js -->/)[1].matchAll(/src="([^"]+)"/g)].map(m => m[1]);
const js = scripts.map(src => `/* ---- ${src} ---- */\n` + read(src)).join('\n');
if (js.includes('</script')) throw new Error('A script contains "</script" and cannot be inlined');
html = html.replace(/<!-- build:js -->[\s\S]*?<!-- \/build:js -->/, () => `<script>\n${js}\n</script>`);

mkdirSync(join(root, 'dist'), { recursive: true });
writeFileSync(join(root, 'dist/valence.html'), html);

// fragment version: keep <title>, font links and styles first, then the body markup and script
const head = html.match(/<head>([\s\S]*?)<\/head>/)[1].replace(/<meta charset[^>]*>\s*/, '').replace(/<meta name="viewport"[^>]*>\s*/, '');
const body = html.match(/<body>([\s\S]*?)<\/body>/)[1];
writeFileSync(join(root, 'dist/artifact.html'), head.trim() + '\n' + body.trim() + '\n');
console.log(`Built ${scripts.length} scripts, ${(html.length / 1024).toFixed(0)} KB`);
