'use strict';
/* error function complement (Abramowitz–Stegun 7.1.26) */
U.erfc = x => { const t = 1 / (1 + 0.3275911 * Math.abs(x)); const y = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429)))) * Math.exp(-x * x); return x >= 0 ? y : 2 - y; };

App.register({
  id: 'maxwell', unit: 3, sym: 'Mb', title: 'Maxwell–Boltzmann Distributions',
  desc: 'How temperature and molar mass shape the distribution of molecular speeds, and what fraction of collisions beat Eₐ.',
  tags: ['maxwell-boltzmann', 'distribution', 'molecular speed', 'rms speed', 'kinetic energy', 'activation energy', 'temperature', 'effusion', 'graham'],
  keyIdeas: [
    'At higher temperature the curve flattens and shifts right: the average speed increases and more particles are fast.',
    'At the same temperature, lighter gases move faster (u<sub>rms</sub> = √(3RT/M)), but all gases have the same average kinetic energy.',
    'The area under the curve is the total number of particles, so it stays constant.',
    'Only collisions with energy ≥ E<sub>a</sub> can react. Raising T greatly increases the fraction above E<sub>a</sub>, which is why rate rises with temperature.',
  ],
  render(el, scope) {
    const h = U.h;
    U.tabs(el, [{ label: 'Speed distribution', render: speeds }, { label: 'Energy & activation energy', render: energy }], scope, { key: 'maxwell' });

    function speeds(b, s) {
      const GASES = { H2: 2.016, He: 4.003, H2O: 18.02, N2: 28.01, O2: 32.00, Ar: 39.95, CO2: 44.01, Xe: 131.3 };
      const curves = [{ g: 'N2', T: 300 }, { g: 'N2', T: 600 }, { g: 'He', T: 300 }];
      const f = (v, M, T) => { const m = M / 1000, a = m / (2 * K.R * T); return 4 * Math.PI * Math.pow(a / Math.PI, 1.5) * v * v * Math.exp(-a * v * v); };
      const rows = h('div', { class: 'stack' });
      const cv = U.canvas(null, { aspect: 1.7, scope: s, draw });
      const tbl = h('div');
      b.append(h('div', { class: 'grid-viz' }, U.panel(null, cv.wrap, tbl), h('div', { class: 'stack' }, U.panel('Curves', rows))));
      function controls() {
        U.clear(rows);
        const cols = ccols();
        curves.forEach((cu, i) => {
          const g = U.select({ options: Object.keys(GASES).map(k => ({ value: k, label: U.chemText(k) + ` (${GASES[k]} g/mol)` })), value: cu.g, onChange: v => { cu.g = v; upd(); } });
          const t = U.slider({ label: 'Temperature', min: 100, max: 1500, step: 10, value: cu.T, unit: 'K', onInput: v => { cu.T = v; upd(); } });
          rows.appendChild(h('div', { class: 'stack', style: { borderLeft: '4px solid ' + cols[i], paddingLeft: '10px', gap: '6px' } }, g.el, t.el));
        });
        rows.appendChild(h('div', { class: 'row' }, U.btn('Same gas, 3 temperatures', () => { curves.splice(0, 3, { g: 'N2', T: 200 }, { g: 'N2', T: 500 }, { g: 'N2', T: 1000 }); controls(); upd(); }, 'sm'), U.btn('3 gases, same T', () => { curves.splice(0, 3, { g: 'He', T: 300 }, { g: 'N2', T: 300 }, { g: 'CO2', T: 300 }); controls(); upd(); }, 'sm')));
      }
      const ccols = () => { const t = U.theme(); return [t.blue, t.red, t.green]; };
      function draw(c, w, H) {
        const cols = ccols();
        let vmax = 0, fmax = 0;
        curves.forEach(cu => { const M = GASES[cu.g] / 1000; vmax = Math.max(vmax, Math.sqrt(2 * K.R * cu.T / M) * 2.6); fmax = Math.max(fmax, f(Math.sqrt(2 * K.R * cu.T / M), GASES[cu.g], cu.T)); });
        vmax = Math.min(vmax, 6000);
        const P = new U.Plot(c, w, H, { x: [0, vmax], y: [0, fmax * 1.15], xlabel: 'Molecular speed (m/s)', ylabel: 'Fraction of molecules', yfmt: () => '' });
        P.axes();
        curves.forEach((cu, i) => {
          const pts = P.fn(v => f(v, GASES[cu.g], cu.T), cols[i], 2.6);
          P.area(pts, U.alpha(cols[i], 0.08));
          const vp = Math.sqrt(2 * K.R * cu.T / (GASES[cu.g] / 1000));
          P.dot(vp, f(vp, GASES[cu.g], cu.T), cols[i], 4.5);
          P.label(`${U.chemText(cu.g)}, ${cu.T} K`, vp, f(vp, GASES[cu.g], cu.T), cols[i], { dy: -10, align: 'center' });
        });
      }
      function upd() {
        cv.redraw();
        U.clear(tbl);
        tbl.appendChild(U.table(['Curve', 'Most probable', 'Average', 'RMS √(3RT/M)', 'Avg KE (kJ/mol)'], curves.map(cu => {
          const M = GASES[cu.g] / 1000;
          return [`${U.chem(cu.g)} at ${cu.T} K`, Math.sqrt(2 * K.R * cu.T / M).toFixed(0) + ' m/s', Math.sqrt(8 * K.R * cu.T / (Math.PI * M)).toFixed(0) + ' m/s', Math.sqrt(3 * K.R * cu.T / M).toFixed(0) + ' m/s', (1.5 * K.R * cu.T / 1000).toFixed(2)];
        }), { num: [1, 2, 3, 4] }));
      }
      controls(); upd();
    }

    function energy(b, s) {
      let T1 = 300, T2 = 400, Ea = 20, cat = false;
      const fE = (E, T) => { const kT = K.R * T / 1000; return 2 * Math.sqrt(E / Math.PI) * Math.pow(1 / kT, 1.5) * Math.exp(-E / kT); };
      const frac = (E, T) => { const x = E / (K.R * T / 1000); return 2 * Math.sqrt(x / Math.PI) * Math.exp(-x) + U.erfc(Math.sqrt(x)); };
      const s1 = U.slider({ label: 'T₁', min: 150, max: 800, step: 10, value: T1, unit: 'K', onInput: v => { T1 = v; upd(); } });
      const s2 = U.slider({ label: 'T₂', min: 150, max: 800, step: 10, value: T2, unit: 'K', onInput: v => { T2 = v; upd(); } });
      const sE = U.slider({ label: 'Activation energy Eₐ', min: 4, max: 40, step: 0.5, value: Ea, unit: 'kJ/mol', onInput: v => { Ea = v; upd(); } });
      const cc = U.check({ label: 'Add a catalyst (lowers Eₐ by 40%)', onChange: v => { cat = v; upd(); } });
      const stats = U.stats([['f1', 'Fraction ≥ Eₐ at T₁'], ['f2', 'Fraction ≥ Eₐ at T₂'], ['r', 'Ratio T₂ : T₁']]);
      const cv = U.canvas(null, { aspect: 1.7, scope: s, draw: (c, w, H) => {
        const t = U.theme(), E = cat ? Ea * 0.6 : Ea;
        const P = new U.Plot(c, w, H, { x: [0, 45], y: [0, fE(K.R * Math.min(T1, T2) / 2000, Math.min(T1, T2)) * 1.2], xlabel: 'Kinetic energy (kJ/mol)', ylabel: 'Fraction of collisions', yfmt: () => '' });
        P.axes();
        [[T1, t.blue], [T2, t.red]].forEach(([T, col]) => {
          const tail = []; for (let x = E; x <= 45; x += 0.2) tail.push([x, fE(x, T)]);
          P.area(tail, U.alpha(col, 0.25));
          P.fn(x => fE(Math.max(x, 1e-6), T), col, 2.6);
        });
        P.vline(E, t.ink, [6, 4], 'Eₐ' + (cat ? ' (catalyzed)' : ''));
        if (cat) P.vline(Ea, U.alpha(t.ink3, 0.8), [2, 4], 'uncatalyzed');
        P.label(`T₁ = ${T1} K`, 2.5, fE(2.5, T1), t.blue, { dx: 8, dy: -4 });
        P.label(`T₂ = ${T2} K`, 6, fE(6, T2), t.red, { dx: 8, dy: 8 });
      } });
      b.append(h('div', { class: 'grid-viz' }, U.panel('Energy distribution', cv.wrap), h('div', { class: 'stack' }, U.panel('Settings', s1.el, s2.el, sE.el, cc.el), stats.el,
        U.callout('Shaded areas are the collisions with enough energy to react. A modest temperature increase can double or triple that area, which explains why reaction rates are so sensitive to temperature. A catalyst does not change the curve; it moves the E<sub>a</sub> line left.'))));
      function upd() {
        const E = cat ? Ea * 0.6 : Ea, a = frac(E, T1), c2 = frac(E, T2);
        stats.set('f1', U.sig(a, 3)); stats.set('f2', U.sig(c2, 3)); stats.set('r', (c2 / a).toFixed(2) + '×');
        cv.redraw();
      }
      upd();
    }
  },
});
