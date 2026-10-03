'use strict';
App.register({
  id: 'gibbs', unit: 9, sym: 'Gb', title: 'Entropy & Gibbs Free Energy',
  desc: 'Predict entropy changes, explore ΔG = ΔH − TΔS across temperatures, and connect ΔG° to K and coupled reactions.',
  tags: ['entropy', 'gibbs free energy', 'δg', 'δs', 'thermodynamically favored', 'spontaneous', 'δg=δh-tδs', 'δg=-rtlnk', 'coupled reactions', 'kinetic control', 'crossover temperature'],
  keyIdeas: [
    'Entropy (S) measures how dispersed matter and energy are. S(gas) ≫ S(liquid) &gt; S(solid). More moles of gas → higher entropy.',
    '<b>ΔG° = ΔH° − TΔS°</b>. A process is thermodynamically favored when ΔG° &lt; 0.',
    'Signs: ΔH &lt; 0, ΔS &gt; 0 → always favored. ΔH &gt; 0, ΔS &lt; 0 → never. Otherwise favored only at low T (ΔH, ΔS both −) or high T (both +).',
    '<b>ΔG° = −RT ln K</b>: ΔG° &lt; 0 ↔ K &gt; 1. Also ΔG° = −nFE°.',
    'An unfavorable reaction can be driven by coupling it to a favorable one (e.g. ATP hydrolysis) so that the total ΔG &lt; 0.',
    'Thermodynamically favored does not mean fast: a large activation energy can keep a favored reaction from happening (kinetic control), e.g. diamond → graphite.',
  ],
  render(el, scope) {
    const h = U.h;
    U.tabs(el, [{ label: 'Predict ΔS', render: entropy }, { label: 'ΔG vs. temperature', render: gvt }, { label: 'ΔG° and K', render: gk }, { label: 'Coupling & kinetics', render: coupled }], scope, { key: 'gibbs' });

    function entropy(b, s) {
      const ITEMS = [['H₂O(l) → H₂O(g)', '+', 'Liquid → gas: particles become far more dispersed.'], ['2H₂(g) + O₂(g) → 2H₂O(l)', '−', '3 mol gas become liquid: much less dispersal.'], ['NaCl(s) → Na⁺(aq) + Cl⁻(aq)', '+', 'An ordered lattice breaks into mobile ions.'],
        ['N₂(g) + 3H₂(g) → 2NH₃(g)', '−', '4 mol of gas become 2 mol of gas.'], ['CaCO₃(s) → CaO(s) + CO₂(g)', '+', 'A gas is produced from a solid.'], ['CO₂(g) → CO₂(aq)', '−', 'Gas molecules are confined in solution.'],
        ['Ice melting at 0 °C', '+', 'Solid → liquid increases the number of accessible arrangements.'], ['Cooling a gas from 400 K to 300 K', '−', 'Lower temperature means energy is spread over fewer states.'], ['2NO₂(g) → N₂O₄(g)', '−', '2 mol gas → 1 mol gas.'], ['A gas expanding into a vacuum', '+', 'Larger volume, more positions available.']];
      const res = {};
      const box = U.canvas(null, { aspect: 2.6, scope: s });
      const grid = h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '10px' } });
      b.append(U.panel('Particles in solid, liquid and gas', box.wrap, h('p', { class: 'small muted' }, 'The more ways particles and energy can be arranged, the higher the entropy.')), U.panel('Is ΔS positive or negative?', grid));
      s.loop((dt, time) => {
        const c = box.ctx, w = box.w, H = box.h, t = U.theme();
        c.clearRect(0, 0, w, H);
        ['solid: low S', 'liquid: higher S', 'gas: highest S'].forEach((lab, k) => {
          const x0 = k * w / 3 + 10, bw = w / 3 - 20;
          c.strokeStyle = t.line; c.strokeRect(x0, 8, bw, H - 34);
          for (let i = 0; i < 16; i++) {
            let x, y;
            if (k === 0) { x = x0 + bw / 2 + ((i % 4) - 1.5) * 15 + Math.sin(time / 90 + i) * 1.2; y = H - 34 - ((Math.floor(i / 4)) * 15 + 10) + Math.cos(time / 80 + i); }
            else if (k === 1) { x = x0 + 10 + ((U.hx(i) + time / 15000 * (1 + i % 3)) % 1) * (bw - 20); y = H - 40 - U.hy(i) * (H - 34) * 0.4; }
            else { x = x0 + 8 + ((U.hx(i) + time / 3000 * (1 + i % 4)) % 1) * (bw - 16); y = 16 + ((U.hy(i) + time / 3700 * (1 + i % 3)) % 1) * (H - 50); }
            U.drawAtom(c, x, y, 6, 'X', { color: [t.blue, t.teal, t.orange][k], label: false });
          }
          U.text(c, lab, x0 + bw / 2, H - 8, { align: 'center', size: 12, weight: 600 });
        });
      });
      const draw = () => {
        U.clear(grid);
        ITEMS.forEach(([p, ans, why], i) => {
          const pick = res[i];
          grid.appendChild(h('div', { class: 'panel', style: { padding: '12px', gap: '8px' } }, h('b', { html: p }),
            h('div', { class: 'row' }, U.btn('ΔS &gt; 0', () => { res[i] = '+'; draw(); }, 'sm' + (pick === '+' ? ' primary' : '')), U.btn('ΔS &lt; 0', () => { res[i] = '−'; draw(); }, 'sm' + (pick === '−' ? ' primary' : ''))),
            pick ? U.callout((pick === ans ? '✓ ' : '✗ ') + why, pick === ans ? 'good' : 'bad') : null));
        });
      };
      draw();
    }

    function gvt(b, s) {
      const PRE = [['Ice melting', 6.01, 22.0], ['Haber process (N₂ + 3H₂ → 2NH₃)', -92.2, -198.7], ['CaCO₃ → CaO + CO₂', 178.3, 160.5], ['Combustion of CH₄', -890, -243], ['2NO₂ → N₂O₄', -57.2, -175.8], ['Never favored example', 50, -100]];
      let dH = -92.2, dS = -198.7, T = 298;
      const sH = U.slider({ label: 'ΔH°', min: -300, max: 300, step: 0.5, value: dH, unit: 'kJ/mol', onInput: v => { dH = v; upd(); } });
      const sS = U.slider({ label: 'ΔS°', min: -400, max: 400, step: 0.5, value: dS, unit: 'J/(mol·K)', onInput: v => { dS = v; upd(); } });
      const sT = U.slider({ label: 'Temperature', min: 0, max: 2000, step: 5, value: T, unit: 'K', onInput: v => { T = v; upd(); } });
      const picks = h('div', { class: 'row' }, PRE.map(([n, a, z]) => U.btn(n, () => { dH = a; dS = z; sH.set(a); sS.set(z); upd(); }, 'sm')));
      const stats = U.stats([['g', 'ΔG° at this T'], ['f', 'Favored?'], ['x', 'Crossover T = ΔH/ΔS']]);
      const quad = h('div');
      const cv = U.canvas(null, { aspect: 1.7, scope: s, draw });
      b.append(h('div', { class: 'grid-viz' }, U.panel('ΔG° = ΔH° − TΔS°', cv.wrap), h('div', { class: 'stack' }, U.panel('Settings', sH.el, sS.el, sT.el, picks), stats.el, quad)));
      const G = t => dH - t * dS / 1000;
      function draw(c, w, H) {
        const t = U.theme();
        const ys = [G(0), G(2000)], lim = Math.max(50, ...ys.map(Math.abs)) * 1.1;
        const P = new U.Plot(c, w, H, { x: [0, 2000], y: [-lim, lim], xlabel: 'Temperature (K)', ylabel: 'ΔG° (kJ/mol)' });
        P.axes();
        P.clip(cc => { cc.fillStyle = U.alpha(t.good, 0.08); cc.fillRect(P.L, P.Y(0), P.R - P.L, P.B - P.Y(0)); cc.fillStyle = U.alpha(t.bad, 0.06); cc.fillRect(P.L, P.T, P.R - P.L, P.Y(0) - P.T); });
        P.hline(0, t.ink2, [1, 0]);
        P.label('thermodynamically favored (ΔG < 0)', 1990, -lim * 0.92, t.good, { align: 'right' });
        P.label('not favored (ΔG > 0)', 1990, lim * 0.88, t.bad, { align: 'right' });
        P.fn(G, t.accent, 3);
        if (dS !== 0) { const Tx = dH * 1000 / dS; if (Tx > 0 && Tx < 2000) { P.vline(Tx, t.orange, [5, 4], 'T = ' + Tx.toFixed(0) + ' K'); } }
        P.dot(T, G(T), t.red, 6);
      }
      function upd() {
        const g = G(T);
        stats.set('g', g.toFixed(1) + ' kJ/mol');
        stats.set('f', g < 0 ? '<span style="color:var(--good)">yes</span>' : '<span style="color:var(--bad)">no</span>');
        const Tx = dS !== 0 ? dH * 1000 / dS : NaN;
        stats.set('x', Tx > 0 ? Tx.toFixed(0) + ' K' : 'none');
        cv.redraw();
        const cases = [['−', '+', 'Favored at all temperatures'], ['+', '−', 'Never favored'], ['−', '−', 'Favored at low T (below ΔH/ΔS)'], ['+', '+', 'Favored at high T (above ΔH/ΔS)']];
        const cur = cases.findIndex(([a, z]) => (dH < 0 ? '−' : '+') === a && (dS < 0 ? '−' : '+') === z);
        U.clear(quad);
        quad.appendChild(U.table(['ΔH', 'ΔS', 'Result'], cases, { hl: i => i === cur }));
      }
      upd();
    }

    function gk(b, s) {
      let dG = -10, T = 298, n = 2;
      const sG = U.slider({ label: 'ΔG°', min: -80, max: 80, step: 0.5, value: dG, unit: 'kJ/mol', onInput: v => { dG = v; upd(); } });
      const sT = U.slider({ label: 'Temperature', min: 200, max: 1000, step: 5, value: T, unit: 'K', onInput: v => { T = v; upd(); } });
      const sn = U.slider({ label: 'Electrons transferred n (for E°)', min: 1, max: 6, step: 1, value: n, onInput: v => { n = v; upd(); } });
      const stats = U.stats([['k', 'K = e^(−ΔG°/RT)'], ['e', 'E° = −ΔG°/nF'], ['m', 'Equilibrium mixture']]);
      const cv = U.canvas(null, { aspect: 1.8, scope: s, draw });
      b.append(h('div', { class: 'grid-viz' }, U.panel('log K vs. ΔG°', cv.wrap), h('div', { class: 'stack' }, U.panel('Settings', sG.el, sT.el, sn.el), stats.el,
        U.callout('ΔG° &lt; 0 ⟺ K &gt; 1 ⟺ E° &gt; 0: all three describe a reaction whose products are favored at equilibrium. Each 5.7 kJ/mol of ΔG° at 298 K changes K by a factor of 10.'))));
      const Kof = g => Math.exp(-g * 1000 / (K.R * T));
      function draw(c, w, H) {
        const t = U.theme();
        const P = new U.Plot(c, w, H, { x: [-80, 80], y: [-15, 15], xlabel: 'ΔG° (kJ/mol)', ylabel: 'log K' });
        P.axes(); P.hline(0, t.ink3, [3, 3]); P.vline(0, t.ink3, [3, 3]);
        P.fn(g => Math.log10(Kof(g)), t.accent, 3);
        P.dot(dG, Math.log10(Kof(dG)), t.red, 6);
        P.label('products favored (K > 1)', -78, 13, t.good, {}); P.label('reactants favored (K < 1)', 78, -13, t.bad, { align: 'right' });
      }
      function upd() {
        const k = Kof(dG), E = -dG * 1000 / (n * K.F);
        stats.set('k', U.sig(k, 3)); stats.set('e', E.toFixed(3) + ' V');
        stats.set('m', k > 1e3 ? 'mostly products' : k < 1e-3 ? 'mostly reactants' : 'significant amounts of both');
        cv.redraw();
      }
      upd();
    }

    function coupled(b) {
      const PRE = [
        { name: 'ATP drives glucose phosphorylation', a: ['glucose + phosphate → glucose-6-phosphate', 13.8], b: ['ATP + H₂O → ADP + phosphate', -30.5] },
        { name: 'Smelting copper ore', a: ['Cu₂S(s) → 2Cu(s) + S(s)', 86.2], b: ['S(s) + O₂(g) → SO₂(g)', -300.1] },
        { name: 'Extracting iron with carbon', a: ['Fe₂O₃(s) → 2Fe(s) + 3/2 O₂(g)', 742.2], b: ['3/2 C(s) + 3/2 O₂(g) → 3/2 CO₂(g)', -592.1] },
      ];
      let pi = 0;
      const sel = U.select({ label: 'Example', options: PRE.map((p, i) => ({ value: i, label: p.name })), value: pi, onChange: v => { pi = +v; upd(); } });
      const out = h('div', { class: 'stack' });
      b.append(h('div', { class: 'grid2' }, h('div', { class: 'stack' }, U.panel('Coupled reactions', sel.el), out),
        U.panel('Kinetic vs. thermodynamic control', h('p', null, 'Diamond → graphite has ΔG° = −2.9 kJ/mol, so it is thermodynamically favored. Yet diamonds last for billions of years because the activation energy to rearrange the carbon network is enormous.'),
          h('p', null, 'Similarly, a mixture of H₂ and O₂ is stable at room temperature until a spark supplies the activation energy.'),
          U.callout('If a favored process is not observed, the reason is kinetic: the rate is too slow because E<sub>a</sub> is too high. ΔG says nothing about how fast a reaction goes.'))));
      function upd() {
        const p = PRE[pi], tot = p.a[1] + p.b[1];
        U.clear(out);
        out.append(U.table(['Reaction', 'ΔG° (kJ)'], [[p.a[0], '+' + p.a[1]], [p.b[0], p.b[1]], ['<b>Sum (coupled)</b>', '<b>' + tot.toFixed(1) + '</b>']], { num: [1] }),
          U.callout(`On its own, the first reaction is not favored (ΔG° &gt; 0). Coupling it with the second reaction, which shares an intermediate, gives a total ΔG° of ${tot.toFixed(1)} kJ, so the combined process is thermodynamically favored.`, 'good'));
      }
      upd();
    }
  },
});
