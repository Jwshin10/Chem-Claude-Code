/* Periodic table side panel: opens from the top bar or the right-edge tab on every page,
   and stays open while you move between topics. */
'use strict';
(function () {
  const h = U.h, $ = s => document.querySelector(s);
  const body = document.body;
  let built = false, selZ = U.store.get('ptPanelSel', 6), query = '';
  const cells = {};

  const panel = h('aside', { class: 'pt-panel', id: 'ptPanel', 'aria-label': 'Periodic table', hidden: true });
  const tab = h('button', { type: 'button', class: 'pt-edge', 'aria-controls': 'ptPanel', 'aria-expanded': 'false', title: 'Periodic table (P)' }, h('span', { class: 'pt-edge-sym' }, 'H'), h('span', null, 'Periodic table'));
  const scrim = h('div', { class: 'pt-scrim' });
  body.append(panel, tab, scrim);
  const topBtn = $('#ptBtn');

  function open() {
    if (!built) build();
    panel.hidden = false;
    requestAnimationFrame(() => body.classList.add('pt-open'));
    [tab, topBtn].forEach(b => b && b.setAttribute('aria-expanded', 'true'));
    U.store.set('ptPanelOpen', true);
  }
  function close() {
    body.classList.remove('pt-open');
    [tab, topBtn].forEach(b => b && b.setAttribute('aria-expanded', 'false'));
    U.store.set('ptPanelOpen', false);
    setTimeout(() => { if (!body.classList.contains('pt-open')) panel.hidden = true; }, 220);
  }
  const toggle = () => (body.classList.contains('pt-open') ? close() : open());
  tab.addEventListener('click', open);
  if (topBtn) topBtn.addEventListener('click', toggle);
  scrim.addEventListener('click', close);
  document.addEventListener('keydown', e => {
    const tag = document.activeElement && document.activeElement.tagName;
    const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (document.activeElement && document.activeElement.isContentEditable);
    if (e.key === 'Escape' && body.classList.contains('pt-open') && (!typing || panel.contains(document.activeElement))) { close(); (topBtn || tab).focus(); }
    else if ((e.key === 'p' || e.key === 'P') && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); toggle(); }
  });

  function build() {
    built = true;
    const closeBtn = h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Close periodic table', html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>' });
    closeBtn.addEventListener('click', close);
    const find = h('input', { type: 'text', class: 'pt-find', placeholder: 'Find by name, symbol or number', autocomplete: 'off', spellcheck: 'false', 'aria-label': 'Find an element' });
    const grid = h('div', { class: 'pt-mini' });
    for (const e of ELEMENTS.list) {
      const row = e.fblock ? (e.period === 6 ? 9 : 10) : e.period;
      const col = e.fblock ? 3 + e.fcol : e.group;
      const c = h('button', { type: 'button', class: 'pt-cell', title: `${e.name}, ${e.mass}`, 'aria-label': `${e.Z} ${e.name}`, style: { gridRow: row, gridColumn: col, background: ELEMENTS.CAT_COLORS[e.cat] } },
        h('span', { class: 'z' }, e.Z), h('span', { class: 's' }, e.sym), h('span', { class: 'm' }, e.mass < 100 ? e.mass.toFixed(2) : e.mass.toFixed(1)));
      c.addEventListener('click', () => select(e.Z));
      cells[e.Z] = c; grid.appendChild(c);
    }
    grid.appendChild(h('div', { class: 'pt-cell ph', style: { gridRow: 6, gridColumn: 3 } }, '57–71'));
    grid.appendChild(h('div', { class: 'pt-cell ph', style: { gridRow: 7, gridColumn: 3 } }, '89–103'));
    grid.appendChild(h('div', { class: 'pt-gap', style: { gridRow: 8, gridColumn: '1 / span 18' } }));
    const legend = h('div', { class: 'legend pt-legend' }, Object.keys(ELEMENTS.CAT_NAMES).map(k => h('span', null, h('i', { style: { background: ELEMENTS.CAT_COLORS[k] } }), ELEMENTS.CAT_NAMES[k])));
    const info = h('div', { class: 'pt-info' });
    const full = h('a', { href: '#periodic-table', class: 'small' }, 'Open the full table with trend maps');
    full.addEventListener('click', () => { if (innerWidth < 1200) close(); });
    panel.append(
      h('div', { class: 'pt-head' }, h('h2', null, 'Periodic table'), closeBtn),
      h('div', { class: 'pt-body' }, find, grid, legend, info, full));

    find.addEventListener('input', () => { query = find.value.trim().toLowerCase(); filter(); });
    find.addEventListener('keydown', e => {
      if (e.key === 'Enter') { const m = matches(); if (m.length) select(m[0].Z); }
    });

    function matches() {
      if (!query) return [];
      return ELEMENTS.list.filter(e => String(e.Z) === query || e.sym.toLowerCase() === query || e.name.toLowerCase().startsWith(query))
        .concat(ELEMENTS.list.filter(e => e.name.toLowerCase().includes(query) && !e.name.toLowerCase().startsWith(query) && e.sym.toLowerCase() !== query))
        .sort((a, b) => (b.sym.toLowerCase() === query) - (a.sym.toLowerCase() === query));
    }
    function filter() {
      const m = new Set(matches().map(e => e.Z));
      for (const z in cells) cells[z].classList.toggle('dim', !!query && !m.has(+z));
      if (m.size === 1) select([...m][0]);
    }
    function select(Z) {
      selZ = Math.max(1, Math.min(118, Z));
      U.store.set('ptPanelSel', selZ);
      for (const z in cells) cells[z].classList.toggle('sel', +z === selZ);
      detail();
    }
    function detail() {
      U.clear(info);
      const e = ELEMENTS.byZ[selZ];
      const tile = h('div', { class: 'pt-big', style: { background: ELEMENTS.CAT_COLORS[e.cat] } },
        h('span', { class: 'z' }, e.Z), h('b', null, e.sym), h('span', { class: 'm' }, e.mass));
      const step = d => U.btn(d < 0 ? 'Previous' : 'Next', () => select(selZ + d), 'sm');
      const kv = h('dl', { class: 'kv' });
      const add = (k, v) => kv.append(h('dt', null, k), h('dd', { html: v == null || v === '' ? '—' : String(v) }));
      add('Molar mass', e.mass + ' g/mol');
      add('Group, period', (e.group ? 'Group ' + e.group : 'f-block') + ', period ' + e.period);
      add('Electron configuration', ELEMENTS.configString(e.Z));
      add('Valence electrons', e.valence ?? (e.cat === 'transition' ? 'varies' : null));
      add('Electronegativity', e.en);
      add('Atomic radius', e.radius ? e.radius + ' pm' : null);
      add('First ionization energy', e.ie ? e.ie + ' kJ/mol' : null);
      add('Electron affinity', e.ea != null ? (e.ea > 0 ? e.ea + ' kJ/mol released' : 'not stable (≤ 0)') : null);
      add('State at 25 °C', e.state);
      info.append(h('div', { class: 'pt-id' }, tile, h('div', { class: 'stack', style: { gap: '4px' } }, h('h3', null, e.name), h('span', { class: 'small muted' }, e.catName),
        h('div', { class: 'row' }, step(-1), step(1)))), kv);
    }
    select(selZ);
  }

  if (U.store.get('ptPanelOpen', false) && innerWidth >= 1200) open();
})();
