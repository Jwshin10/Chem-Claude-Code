// Headless interaction test for every topic/tab. Usage: node tools/check.mjs [width] [comma-separated ids]
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
const root = process.env.ROOT || join(dirname(fileURLToPath(import.meta.url)), '..', 'index.html');
(async () => {
  const width = +(process.argv[2] || 1280);
  const only = (process.argv[3] || '').split(',').filter(Boolean);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  let errs = [];
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') { const t = m.text(); if (!/CERT|fonts\.g|ERR_FILE|ERR_NAME|ERR_INTERNET/.test(t)) errs.push('[' + m.type() + '] ' + t.slice(0, 300)); } });
  page.on('pageerror', e => errs.push('[pageerror] ' + e.message + ' ' + (e.stack || '').split('\n')[1]));
  await page.goto('file://' + root + '#home');
  await page.waitForTimeout(300);
  const ids = only.length ? only : await page.evaluate(() => App.modules.map(m => m.id));
  for (const id of ids) {
    errs = [];
    await page.evaluate(i => { location.hash = i; }, id);
    await page.waitForTimeout(250);
    const ntabs = (await page.$$('.tabs button')).length || 1;
    for (let t = 0; t < ntabs; t++) {
      const tabs = await page.$$('.tabs button');
      if (tabs[t]) { await tabs[t].click(); await page.waitForTimeout(150); }
      // exercise controls inside the page body (not nav)
      const res = await page.evaluate(async () => {
        const sleep = ms => new Promise(r => setTimeout(r, ms));
        const root = document.querySelector('main .page');
        const fire = (el, ev) => el.dispatchEvent(new Event(ev, { bubbles: true }));
        let n = 0;
        for (const s of [...root.querySelectorAll('select')]) {
          const opts = [...s.options].map(o => o.value);
          for (const v of [opts[opts.length - 1], opts[Math.floor(opts.length / 2)], opts[0]]) { if (!s.isConnected) break; s.value = v; fire(s, 'change'); n++; await sleep(15); }
        }
        for (const r of [...root.querySelectorAll('input[type=range]')]) {
          for (const v of [r.max, r.min, (+r.max + +r.min) / 2]) { if (!r.isConnected) break; r.value = v; fire(r, 'input'); n++; await sleep(10); }
        }
        for (const c of [...root.querySelectorAll('input[type=checkbox]')]) { if (!c.isConnected) continue; c.click(); n++; await sleep(10); c.click(); }
        for (const i of [...root.querySelectorAll('input[type=number]')]) { if (!i.isConnected) continue; const old = i.value; i.value = '0'; fire(i, 'input'); i.value = '-1'; fire(i, 'input'); i.value = old; fire(i, 'input'); n++; }
        const btns = [...root.querySelectorAll('.tab-body button, .stack button, .panel button')].filter(b => !b.closest('.tabs'));
        for (const b of btns.slice(0, 60)) { if (!b.isConnected || b.disabled) continue; b.click(); n++; await sleep(20); }
        await sleep(300);
        const txt = root.innerText;
        const bad = [];
        for (const w of ['NaN', 'undefined', '[object']) { const i = txt.search(new RegExp(w === '[object' ? '\\[object' : '\\b' + w + '\\b')); if (i < 0) continue; bad.push(w + ': …' + txt.slice(Math.max(0, i - 60), i + 30).replace(/\n/g, ' ') + '…'); }
        const over = document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
        return { n, bad, over, sw: document.documentElement.scrollWidth };
      });
      if (res.bad.length) errs.push('[text] tab ' + t + ' ' + res.bad.join(' | '));
      if (res.over) errs.push('[overflow] tab ' + t + ' scrollWidth=' + res.sw);
    }
    if (process.env.V) console.log(id, 'ok');
    if (errs.length) console.log('--', id, '\n   ' + [...new Set(errs)].slice(0, 8).join('\n   '));
  }
  console.log('done');
  await browser.close();
})();
