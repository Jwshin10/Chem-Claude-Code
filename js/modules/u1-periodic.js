'use strict';
App.register({
  id: 'periodic-table', unit: 1, sym: 'Pt', title: 'Periodic Table & Trends',
  desc: 'An interactive periodic table with heat maps for electronegativity, radius, ionization energy and electron affinity.',
  tags: ['periodic trends', 'electronegativity', 'atomic radius', 'ionization energy', 'electron affinity', 'groups', 'periods', 'shielding', 'effective nuclear charge'],
  keyIdeas: [
    'Across a period, nuclear charge increases while shielding stays about the same, so valence electrons are held more tightly: radius ↓, ionization energy ↑, electronegativity ↑.',
    'Down a group, electrons occupy higher shells farther from the nucleus with more shielding: radius ↑, ionization energy ↓, electronegativity ↓.',
    'Explain trends with Coulomb’s law: attraction ∝ (charge of nucleus × charge of electron) / distance².',
    'Exceptions in first ionization energy: group 13 < group 2 (p electron is higher in energy) and group 16 < group 15 (electron–electron repulsion in a paired p orbital).',
    'Cations are smaller than their parent atoms; anions are larger.',
  ],
  render(el, scope) {
    const h = U.h;
    const MODES = [
      { id: 'cat', label: 'Category' },
      { id: 'en', label: 'Electronegativity', key: 'en', unit: '', fmt: v => v.toFixed(2), trend: 'Electronegativity <b>increases</b> left → right across a period and <b>decreases</b> down a group. Fluorine (3.98) is the most electronegative element. Noble gases are usually not assigned values.', why: 'More protons with the same shielding pull shared electrons closer across a period; down a group the bonding electrons are farther from the nucleus and better shielded.' },
      { id: 'radius', label: 'Atomic radius', key: 'radius', unit: 'pm', fmt: v => v.toFixed(0), trend: 'Atomic radius <b>decreases</b> left → right across a period and <b>increases</b> down a group. (Covalent radii shown.)', why: 'Across a period, increasing nuclear charge pulls the same shell inward. Down a group, each period adds a new, larger electron shell.' },
      { id: 'ie', label: 'Ionization energy', key: 'ie', unit: 'kJ/mol', fmt: v => v.toFixed(0), trend: 'First ionization energy generally <b>increases</b> across a period and <b>decreases</b> down a group. Noble gases have the highest values.', why: 'Electrons that are closer to the nucleus and attracted by a larger effective nuclear charge need more energy to remove (Coulomb’s law). Look for the dips at group 13 and group 16.' },
      { id: 'ea', label: 'Electron affinity', key: 'ea', unit: 'kJ/mol', fmt: v => v.toFixed(0), trend: 'Energy released when an atom gains an electron. Generally <b>larger</b> toward the upper right (halogens are highest). Chlorine releases more than fluorine because fluorine’s small 2p shell has extra electron repulsion.', why: 'An added electron is attracted more strongly when it enters a shell close to a highly charged nucleus.' },
      { id: 'mass', label: 'Atomic mass', key: 'mass', unit: 'u', fmt: v => v.toFixed(2), trend: 'Atomic mass increases with atomic number, with a few reversals (Ar/K, Co/Ni, Te/I) caused by isotope abundances.', why: 'Mass depends on protons and neutrons; the periodic table is ordered by atomic number (protons), not mass.' },
    ];
    let mode = U.store.get('ptMode', 'en'), selZ = U.store.get('ptSel', 17);
    if (!MODES.find(m => m.id === mode)) mode = 'en';

    U.tabs(el, [
      { label: 'Periodic table', render: renderTable },
      { label: 'Trend graphs', render: renderGraph },
    ], scope, { key: 'ptable' });

    function valueRange(key) {
      const vals = ELEMENTS.list.map(e => e[key]).filter(v => v != null && (key !== 'ea' || v > 0));
      return [Math.min(...vals), Math.max(...vals)];
    }

    function renderTable(b) {
      const segM = U.seg({ options: MODES.map(m => ({ value: m.id, label: m.label })), value: mode, onChange: v => { mode = v; U.store.set('ptMode', v); paint(); } });
      const legend = h('div', { class: 'legend' });
      const grid = h('div', { class: 'ptable' });
      const cells = {};
      for (const e of ELEMENTS.list) {
        const row = e.fblock ? (e.period === 6 ? 9 : 10) : e.period;
        const col = e.fblock ? 3 + e.fcol : e.group;
        const c = h('button', { type: 'button', class: 'el', title: e.name, style: { gridRow: row, gridColumn: col } },
          h('span', { class: 'z' }, e.Z), h('span', { class: 's' }, e.sym), h('span', { class: 'm' }));
        c.addEventListener('click', () => { selZ = e.Z; U.store.set('ptSel', selZ); paint(); detail(); });
        cells[e.Z] = c; grid.appendChild(c);
      }
      grid.appendChild(h('div', { class: 'el ph', style: { gridRow: 6, gridColumn: 3 } }, '57–71'));
      grid.appendChild(h('div', { class: 'el ph', style: { gridRow: 7, gridColumn: 3 } }, '89–103'));
      grid.appendChild(h('div', { style: { gridRow: 8, gridColumn: '1 / span 18', height: '10px' } }));
      const info = h('div', { class: 'stack' });
      const trend = h('div');
      b.append(U.panel(null, h('div', { class: 'flex-between' }, segM.el), h('div', { class: 'ptable-wrap' }, grid), legend), h('div', { class: 'grid2' }, info, trend));

      function paint() {
        segM.set(mode);
        const M = MODES.find(m => m.id === mode);
        U.clear(legend);
        let lo, hi;
        if (M.key) [lo, hi] = valueRange(M.key);
        for (const e of ELEMENTS.list) {
          const c = cells[e.Z];
          let bg, txt = '';
          if (mode === 'cat') { bg = ELEMENTS.CAT_COLORS[e.cat]; txt = e.mass < 100 ? e.mass.toFixed(2) : e.mass.toFixed(1); }
          else {
            const v = e[M.key];
            if (v == null || (M.key === 'ea' && v <= 0)) { bg = null; txt = M.key === 'ea' && v === 0 ? '≤0' : '—'; }
            else { bg = U.ramp((v - lo) / (hi - lo)); txt = M.fmt(v); }
          }
          c.style.background = bg || '';
          const dark = bg && (bg.startsWith('#') ? U.lum(bg) : (() => { const m = bg.match(/\d+/g); return (0.299 * m[0] + 0.587 * m[1] + 0.114 * m[2]) / 255; })()) < 0.55;
          c.style.color = bg ? (dark ? '#fff' : '#172330') : '';
          c.querySelector('.m').textContent = txt;
          c.classList.toggle('sel', e.Z === selZ);
          c.classList.toggle('dim', !!M.key && !bg);
        }
        if (mode === 'cat') {
          U.append(legend, Object.keys(ELEMENTS.CAT_NAMES).map(k => h('span', null, h('i', { style: { background: ELEMENTS.CAT_COLORS[k] } }), ELEMENTS.CAT_NAMES[k])));
        } else {
          const grad = h('i', { style: { width: '160px', background: `linear-gradient(90deg, ${[0, .2, .4, .6, .8, 1].map(U.ramp).join(',')})` } });
          U.append(legend, [h('span', { class: 'mono' }, M.fmt(lo) + ' ' + M.unit), grad, h('span', { class: 'mono' }, M.fmt(hi) + ' ' + M.unit), h('span', null, '(grey = no data)')]);
        }
        U.clear(trend);
        if (M.key) trend.appendChild(U.panel('Trend: ' + M.label, h('p', { html: M.trend }), U.callout('<b>Why?</b> ' + M.why)));
        else trend.appendChild(U.panel('Reading the table', h('p', null, 'Metals sit on the left and center, nonmetals on the upper right, and metalloids along the staircase between them. Elements in the same group (column) have the same number of valence electrons, so they react similarly.'), U.callout('Choose a property above to turn the table into a heat map of that trend.')));
      }
      function detail() {
        U.clear(info);
        const e = ELEMENTS.byZ[selZ];
        const tile = h('div', { style: { width: '92px', height: '100px', borderRadius: '12px', background: ELEMENTS.CAT_COLORS[e.cat], color: '#172330', padding: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 'none' } },
          h('span', { class: 'mono', style: { fontSize: '13px' } }, e.Z), h('b', { style: { font: '700 36px/1 var(--font-display)', textAlign: 'center' } }, e.sym), h('span', { class: 'mono', style: { fontSize: '11px', textAlign: 'center' } }, e.mass));
        const nav = h('div', { class: 'row' },
          U.btn('Previous', () => { if (selZ > 1) { selZ--; paint(); detail(); } }, 'sm'),
          U.btn('Next', () => { if (selZ < 118) { selZ++; paint(); detail(); } }, 'sm'));
        const kv = h('dl', { class: 'kv' });
        const add = (k, v) => { kv.append(h('dt', null, k), h('dd', { html: v == null ? '—' : String(v) })); };
        add('Category', e.catName);
        add('Group / Period', (e.group || 'f-block') + ' / ' + e.period);
        add('Electron config.', ELEMENTS.configString(e.Z));
        add('Valence electrons', e.valence ?? (e.cat === 'transition' ? 'varies (ns + (n−1)d)' : '—'));
        add('Electronegativity', e.en);
        add('Covalent radius', e.radius ? e.radius + ' pm' : null);
        add('1st ionization energy', e.ie ? e.ie + ' kJ/mol' : null);
        add('Electron affinity', e.ea != null ? (e.ea > 0 ? e.ea + ' kJ/mol released' : 'not stable (≤ 0)') : null);
        add('State at 25 °C', e.state);
        info.appendChild(U.panel(null, h('div', { class: 'row', style: { alignItems: 'flex-start', gap: '14px' } }, tile, h('div', { class: 'stack', style: { gap: '4px' } }, h('h2', null, e.name), h('span', { class: 'muted small' }, e.catName), nav)), kv));
      }
      paint(); detail();
    }

    function renderGraph(b, s) {
      let key = mode === 'cat' ? 'ie' : mode, maxZ = 56;
      const opts = MODES.filter(m => m.key);
      const seg = U.seg({ options: opts.map(m => ({ value: m.id, label: m.label })), value: key, onChange: v => { key = v; cv.redraw(); } });
      const zSeg = U.seg({ options: [{ value: 20, label: 'Z 1–20' }, { value: 36, label: '1–36' }, { value: 56, label: '1–56' }, { value: 86, label: '1–86' }], value: maxZ, onChange: v => { maxZ = v; cv.redraw(); } });
      let hover = null;
      const cv = U.canvas(null, { aspect: 2, scope: s, draw });
      b.appendChild(U.panel(null, h('div', { class: 'row' }, seg.el, zSeg.el), cv.wrap, h('p', { class: 'small muted' }, 'Hover or tap points to identify elements. Notice the repeating (periodic) pattern: each period starts with a minimum or maximum at the alkali metals.')));
      let P = null;
      function pts() { const M = MODES.find(m => m.id === key); return ELEMENTS.list.filter(e => e.Z <= maxZ && e[M.key] != null && !(M.key === 'ea' && e[M.key] <= 0)).map(e => ({ e, v: e[M.key] })); }
      function draw(c, w, H) {
        const t = U.theme(), M = MODES.find(m => m.id === key), p = pts();
        const vmax = Math.max(...p.map(x => x.v));
        P = new U.Plot(c, w, H, { x: [0, maxZ + 1], y: [0, vmax * 1.1], xlabel: 'Atomic number (Z)', ylabel: M.label + (M.unit ? ' (' + M.unit + ')' : '') });
        P.axes();
        // period boundaries
        [2, 10, 18, 36, 54, 86].filter(z => z <= maxZ).forEach(z => P.vline(z + 0.5, U.alpha(t.ink3, 0.6), [2, 4]));
        P.line(p.map(x => [x.e.Z, x.v]), U.alpha(t.ink3, 0.7), 1.5);
        p.forEach(x => P.dot(x.e.Z, x.v, ELEMENTS.CAT_COLORS[x.e.cat], maxZ > 56 ? 3 : 4.5, true));
        if (hover) {
          P.dot(hover.e.Z, hover.v, t.ink, 6);
          const lbl = `${hover.e.sym} (Z=${hover.e.Z}): ${M.fmt(hover.v)} ${M.unit}`;
          const x = U.clamp(P.X(hover.e.Z), P.L + 60, P.R - 60);
          U.text(c, lbl, x, Math.max(P.T + 12, P.Y(hover.v) - 12), { align: 'center', weight: 600, size: 12 });
        }
      }
      const pick = pos => {
        if (!P) return;
        let best = null, bd = 1e9;
        for (const x of pts()) { const d = Math.hypot(P.X(x.e.Z) - pos.x, P.Y(x.v) - pos.y); if (d < bd) { bd = d; best = x; } }
        hover = bd < 30 ? best : null; cv.redraw();
      };
      s.on(cv.canvas, 'pointermove', e => pick(cv.pos(e)));
      s.on(cv.canvas, 'pointerdown', e => pick(cv.pos(e)));
      s.on(cv.canvas, 'pointerleave', () => { hover = null; cv.redraw(); });
    }
  },
});
