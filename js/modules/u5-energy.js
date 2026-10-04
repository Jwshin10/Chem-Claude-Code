'use strict';
App.register({
  id: 'energy-profile', unit: 5, sym: 'Ep', title: 'Energy Profiles, Mechanisms & Catalysis',
  desc: 'Build reaction energy diagrams, find the rate-determining step, and identify intermediates and catalysts in mechanisms.',
  tags: ['reaction energy profile', 'energy diagram', 'transition state', 'activated complex', 'mechanism', 'elementary step', 'rate-determining step', 'intermediate', 'catalyst', 'exothermic', 'endothermic', 'activation energy'],
  keyIdeas: [
    'The peak of an energy profile is the <b>transition state</b> (activated complex). E<sub>a</sub> is measured from reactants to that peak.',
    'ΔH = energy of products − energy of reactants. Exothermic: products lower. Endothermic: products higher.',
    'A mechanism is a series of elementary steps. The rate law of an elementary step follows its coefficients (molecularity).',
    'The <b>slowest step</b> (highest barrier) is rate-determining. The overall rate law matches the slow step, after replacing any intermediates.',
    '<b>Intermediates</b> are made in one step and used up in a later step. <b>Catalysts</b> are used up first and regenerated later.',
    'A catalyst lowers E<sub>a</sub> for both the forward and reverse reactions but does not change ΔH or the equilibrium constant.',
  ],
  render(el, scope) {
    const h = U.h;
    U.tabs(el, [{ label: 'Energy diagram builder', render: builder }, { label: 'Reaction mechanisms', render: mechs }], scope, { key: 'energy' });

    function profile(c, P, pts, col, width, dash) {
      // pts: list of [x, E] alternating minima and maxima; smooth with cosine interpolation
      const out = [];
      for (let i = 0; i < pts.length - 1; i++) {
        const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
        for (let k = 0; k <= 30; k++) { const u = k / 30, s2 = (1 - Math.cos(Math.PI * u)) / 2; out.push([x0 + (x1 - x0) * u, y0 + (y1 - y0) * s2]); }
      }
      P.line(out, col, width, dash);
    }
    function builder(b, s) {
      let steps = 1, Ea1 = 80, dH = -40, Ea2 = 40, Ei = 20, cat = false;
      const seg = U.seg({ options: [{ value: 1, label: 'One-step' }, { value: 2, label: 'Two-step mechanism' }], value: steps, onChange: v => { steps = v; vis(); upd(); } });
      const s1 = U.slider({ label: 'Activation energy (step 1)', min: 10, max: 150, step: 1, value: Ea1, unit: 'kJ/mol', onInput: v => { Ea1 = v; upd(); } });
      const sH = U.slider({ label: 'ΔH (overall)', min: -100, max: 100, step: 1, value: dH, unit: 'kJ/mol', onInput: v => { dH = v; upd(); } });
      const sI = U.slider({ label: 'Intermediate energy (relative to reactants)', min: -60, max: 80, step: 1, value: Ei, unit: 'kJ/mol', onInput: v => { Ei = v; upd(); } });
      const s2 = U.slider({ label: 'Activation energy (step 2, from intermediate)', min: 5, max: 150, step: 1, value: Ea2, unit: 'kJ/mol', onInput: v => { Ea2 = v; upd(); } });
      const cc = U.check({ label: 'Show catalyzed pathway', onChange: v => { cat = v; upd(); } });
      const stats = U.stats([['dh', 'ΔH'], ['ea', 'Eₐ (forward)'], ['er', 'Eₐ (reverse)'], ['rds', 'Rate-determining step']]);
      const cv = U.canvas(null, { aspect: 1.6, scope: s, draw });
      b.append(h('div', { class: 'grid-viz' }, U.panel(null, cv.wrap), h('div', { class: 'stack' }, U.panel('Build the profile', seg.el, s1.el, sH.el, sI.el, s2.el, cc.el), stats.el)));
      function vis() { sI.el.hidden = steps === 1; s2.el.hidden = steps === 1; }
      function geom() {
        if (steps === 1) return { pts: [[0, 0], [0.5, Ea1], [1, dH]], peaks: [Ea1] };
        const ts1 = Ea1, ts2 = Ei + Ea2;
        return { pts: [[0, 0], [0.3, ts1], [0.5, Ei], [0.7, ts2], [1, dH]], peaks: [ts1, ts2] };
      }
      function draw(c, w, H) {
        const t = U.theme(), g = geom();
        const ys = g.pts.map(p => p[1]).concat([0]);
        const lo = Math.min(...ys) - 25, hi = Math.max(...ys) + 25;
        const P = new U.Plot(c, w, H, { x: [-0.12, 1.12], y: [lo, hi], xlabel: 'Reaction progress →', ylabel: 'Potential energy (kJ/mol)', xticks: [] });
        P.axes();
        const pts = [[-0.1, 0]].concat(g.pts).concat([[1.1, dH]]);
        profile(c, P, pts, t.accent, 3);
        if (cat) {
          const cp = steps === 1 ? [[-0.1, 0], [0, 0], [0.5, Ea1 * 0.45], [1, dH], [1.1, dH]] : [[-0.1, 0], [0, 0], [0.3, Ea1 * 0.5], [0.5, Ei * 0.8], [0.7, Ei * 0.8 + Ea2 * 0.5], [1, dH], [1.1, dH]];
          profile(c, P, cp, t.green, 2.5, [7, 5]);
          P.label('catalyzed', 0.5, (steps === 1 ? Ea1 * 0.45 : Ei * 0.8), t.green, { dy: -10, align: 'center' });
        }
        P.label('Reactants', 0, 0, t.ink, { dy: 18, align: 'center' });
        P.label('Products', 1, dH, t.ink, { dy: 18, align: 'center' });
        // Ea arrow
        const ax = steps === 1 ? 0.5 : 0.3;
        U.arrow(c, P.X(ax - 0.06), P.Y(0), P.X(ax - 0.06), P.Y(Ea1), t.red, 2, 8);
        P.label('Eₐ' + (steps === 2 ? '₁' : ''), ax - 0.06, Ea1 / 2, t.red, { dx: -6, align: 'right' });
        c.save(); c.setLineDash([3, 3]); c.strokeStyle = U.alpha(t.ink3, 0.8); c.beginPath(); c.moveTo(P.X(-0.1), P.Y(0)); c.lineTo(P.X(1.1), P.Y(0)); c.stroke(); c.restore();
        // ΔH arrow
        if (Math.abs(dH) > 3) { U.arrow(c, P.X(1.06), P.Y(0), P.X(1.06), P.Y(dH), t.purple, 2, 8); P.label('ΔH', 1.06, dH / 2, t.purple, { dx: -6, align: 'right' }); }
        g.peaks.forEach((pk, i) => P.label('‡', steps === 1 ? 0.5 : [0.3, 0.7][i], pk, t.ink2, { dy: -8, align: 'center', size: 14 }));
        if (steps === 2) {
          P.label('intermediate', 0.5, Ei, t.orange, { dy: 18, align: 'center' });
          U.arrow(c, P.X(0.76), P.Y(Ei), P.X(0.76), P.Y(Ei + Ea2), t.red, 2, 8); P.label('Eₐ₂', 0.76, Ei + Ea2 / 2, t.red, { dx: 6 });
        }
      }
      function upd() {
        if (steps === 2 && Ei + Ea2 < Ei) Ea2 = 5;
        const g = geom(), top = Math.max(...g.peaks);
        stats.set('dh', (dH > 0 ? '+' : '') + dH + ' kJ/mol ' + (dH < 0 ? '(exothermic)' : dH > 0 ? '(endothermic)' : ''));
        stats.set('ea', top + ' kJ/mol'); stats.set('er', (top - dH) + ' kJ/mol');
        stats.set('rds', steps === 1 ? 'the only step' : (Ea1 >= Ea2 ? 'step 1 (larger Eₐ)' : 'step 2 (larger Eₐ)'));
        cv.redraw();
      }
      vis(); upd();
    }

    function mechs(b, s) {
      const M = [
        { name: 'NO₂ + CO → NO + CO₂', steps: [['NO2 + NO2', 'NO3 + NO', 'slow'], ['NO3 + CO', 'NO2 + CO2', 'fast']], rate: 'rate = k[NO₂]²', note: 'CO does not appear in the rate law because it only enters after the slow step. This matches experiment.', E: [0, 110, 35, 60, -225] },
        { name: '2NO + O₂ → 2NO₂', steps: [['NO + NO', 'N2O2', 'fast, reversible'], ['N2O2 + O2', 'NO2 + NO2', 'slow']], rate: 'rate = k[NO]²[O₂]', note: 'The slow step gives rate = k₂[N₂O₂][O₂]. N₂O₂ is an intermediate, so use the fast equilibrium: [N₂O₂] = K[NO]², giving rate = k[NO]²[O₂].', E: [0, 30, -10, 70, -115] },
        { name: '2H₂O₂ → 2H₂O + O₂ (catalyzed by I⁻)', steps: [['H2O2 + I^-', 'H2O + IO^-', 'slow'], ['H2O2 + IO^-', 'H2O + O2 + I^-', 'fast']], rate: 'rate = k[H₂O₂][I⁻]', note: 'I⁻ is consumed in step 1 and regenerated in step 2, so it is a catalyst and it can appear in the rate law.', E: [0, 56, -30, -5, -196] },
        { name: '2NO₂ + F₂ → 2NO₂F', steps: [['NO2 + F2', 'NO2F + F', 'slow'], ['NO2 + F', 'NO2F', 'fast']], rate: 'rate = k[NO₂][F₂]', note: 'The slow first step is bimolecular, so the rate law is first order in each reactant.', E: [0, 70, 10, 25, -280] },
      ];
      let mi = 0;
      const sel = U.select({ label: 'Mechanism', options: M.map((m, i) => ({ value: i, label: m.name })), value: mi, onChange: v => { mi = +v; upd(); } });
      const out = h('div', { class: 'stack' });
      const cv = U.canvas(null, { aspect: 1.7, scope: s, draw });
      b.append(h('div', { class: 'grid-viz' }, U.panel('Energy profile', cv.wrap), h('div', { class: 'stack' }, U.panel('Choose', sel.el), out)));
      const parse = side => CHEM.parseEquation(side + ' -> ' + side).R;
      function analyze(m) {
        const net = {};
        const add = (sp, k) => { const key = sp.formula + '|' + sp.charge; net[key] = net[key] || { sp, made: 0, used: 0, first: null }; if (k > 0) net[key].made += sp.coef; else net[key].used += sp.coef; };
        const order = [];
        m.steps.forEach(([l, r], i) => {
          parse(l).forEach(sp => { add(sp, -1); order.push([sp.formula + '|' + sp.charge, 'used', i]); });
          parse(r).forEach(sp => { add(sp, 1); order.push([sp.formula + '|' + sp.charge, 'made', i]); });
        });
        const inter = [], cats = [];
        Object.keys(net).forEach(k => {
          const x = net[k];
          if (x.made === x.used && x.made > 0) {
            const firstEvt = order.find(o => o[0] === k);
            (firstEvt[1] === 'made' ? inter : cats).push(x.sp);
          }
        });
        return { inter, cats };
      }
      function draw(c, w, H) {
        const t = U.theme(), m = M[mi], E = m.E;
        const lo = Math.min(...E) - 30, hi = Math.max(...E) + 30;
        const P = new U.Plot(c, w, H, { x: [-0.1, 1.1], y: [lo, hi], xlabel: 'Reaction progress →', ylabel: 'Energy (kJ/mol, schematic)', xticks: [] });
        P.axes();
        profile(c, P, [[-0.1, E[0]], [0, E[0]], [0.25, E[1]], [0.5, E[2]], [0.75, E[3]], [1, E[4]], [1.1, E[4]]], t.accent, 3);
        const slow = m.steps.findIndex(st => st[2].startsWith('slow'));
        P.label('step 1' + (slow === 0 ? ' (slow)' : ''), 0.25, E[1], slow === 0 ? t.red : t.ink2, { dy: -10, align: 'center' });
        P.label('step 2' + (slow === 1 ? ' (slow)' : ''), 0.75, E[3], slow === 1 ? t.red : t.ink2, { dy: -10, align: 'center' });
        P.label('intermediate(s)', 0.5, E[2], t.orange, { dy: 18, align: 'center' });
      }
      function upd() {
        const m = M[mi], A = analyze(m);
        U.clear(out);
        const sp = x => CHEM.spHTML(x);
        out.append(U.panel('Elementary steps', ...m.steps.map(([l, r, sp2], i) => h('div', { class: 'eq', html: `<span class="muted">Step ${i + 1}:</span> ${U.chem(l)} → ${U.chem(r)} <span class="chip" style="margin-left:8px;${sp2.startsWith('slow') ? 'background:color-mix(in srgb,var(--bad) 20%,var(--surface))' : ''}">${sp2}</span>` }))),
          h('div', { class: 'grid2' },
            U.panel('Intermediates', h('p', { html: A.inter.length ? A.inter.map(sp).join(', ') : 'none' }), h('p', { class: 'small muted' }, 'made, then used up')),
            U.panel('Catalysts', h('p', { html: A.cats.length ? A.cats.map(sp).join(', ') : 'none' }), h('p', { class: 'small muted' }, 'used, then regenerated'))),
          U.panel('Rate law', h('div', { class: 'eq', style: { fontSize: '1.1rem' } }, m.rate), h('p', { class: 'small' }, m.note)));
        cv.redraw();
      }
      upd();
    }
  },
});
