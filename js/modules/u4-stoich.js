'use strict';
App.register({
  id: 'stoichiometry', unit: 4, sym: 'St', title: 'Stoichiometry & Limiting Reactant',
  desc: 'React particles to find the limiting reactant, then scale up to grams, theoretical yield and percent yield.',
  tags: ['stoichiometry', 'limiting reactant', 'limiting reagent', 'excess reactant', 'theoretical yield', 'percent yield', 'mole ratio', 'particle diagram'],
  keyIdeas: [
    'Coefficients in a balanced equation give the mole ratio between any two substances.',
    'The <b>limiting reactant</b> runs out first and determines how much product forms; the other reactant is in excess.',
    'Find it by converting each reactant to moles of product (or comparing mole ratios), not by comparing grams directly.',
    'Percent yield = (actual yield ÷ theoretical yield) × 100%.',
  ],
  render(el, scope) {
    const h = U.h;
    const RX = [
      { eq: '2H2 + O2 -> 2H2O', R: [['H2', 2], ['O2', 1]], P: [['H2O', 2]] },
      { eq: 'N2 + 3H2 -> 2NH3', R: [['N2', 1], ['H2', 3]], P: [['NH3', 2]] },
      { eq: 'CH4 + 2O2 -> CO2 + 2H2O', R: [['CH4', 1], ['O2', 2]], P: [['CO2', 1], ['H2O', 2]] },
      { eq: '2CO + O2 -> 2CO2', R: [['CO', 2], ['O2', 1]], P: [['CO2', 2]] },
      { eq: 'H2 + Cl2 -> 2HCl', R: [['H2', 1], ['Cl2', 1]], P: [['HCl', 2]] },
    ];
    let ri = 0, nA = 6, nB = 4, reacted = 0, animating = false;
    const sel = U.select({ label: 'Reaction', options: RX.map((r, i) => ({ value: i, label: U.chemText(r.eq) })), value: ri, onChange: v => { ri = +v; reacted = 0; refresh(); } });
    const sA = U.slider({ label: 'Molecules of A', min: 0, max: 12, step: 1, value: nA, onInput: v => { nA = v; reacted = 0; refresh(); } });
    const sB = U.slider({ label: 'Molecules of B', min: 0, max: 12, step: 1, value: nB, onInput: v => { nB = v; reacted = 0; refresh(); } });
    const go = U.btn('▶ React', () => { reacted = 0; animating = true; }, 'primary');
    const pOut = h('div', { class: 'stack' });
    const gOut = h('div', { class: 'stack' });
    const cv = U.canvas(null, { aspect: 2.1, scope });
    el.append(h('div', { class: 'grid-viz' }, U.panel('Particle view', cv.wrap, h('div', { class: 'row' }, go)), h('div', { class: 'stack' }, U.panel('Set up', sel.el, sA.el, sB.el), pOut)), gOut);
    const sp = f => CHEM.parseSpecies(f);
    function calc() {
      const r = RX[ri], [a, b] = r.R;
      const ext = Math.min(nA / a[1], nB / b[1]);
      const k = Math.floor(ext + 1e-9);
      return { r, k, limA: nA / a[1] < nB / b[1], tie: nA / a[1] === nB / b[1], leftA: nA - k * a[1], leftB: nB - k * b[1] };
    }
    scope.loop(dt => {
      if (animating) { reacted = Math.min(1, reacted + dt * 0.7); if (reacted >= 1) { animating = false; } }
      const c = cv.ctx, w = cv.w, H = cv.h, t = U.theme(), C = calc();
      c.clearRect(0, 0, w, H);
      const half = w / 2 - 20;
      [[10, 'Before'], [w / 2 + 10, 'After']].forEach(([x, l]) => { c.strokeStyle = t.line; c.lineWidth = 1.5; U.roundRect(c, x, 22, half, H - 32, 10); c.stroke(); U.text(c, l, x + 10, 16, { weight: 700, size: 12, color: t.ink2 }); });
      U.arrow(c, w / 2 - 8, H / 2, w / 2 + 8, H / 2, t.ink3, 2);
      const R = Math.min(9, half / 28);
      const place = (list, x0) => {
        const cols = Math.max(4, Math.ceil(Math.sqrt(list.length * 1.8)));
        list.forEach((f, i) => { const col = i % cols, row = Math.floor(i / cols); CHEM.glyph(c, x0 + 26 + col * (half - 40) / (cols - 1 || 1), 50 + row * R * 3.6, sp(f), R); });
      };
      const before = [];
      for (let i = 0; i < nA; i++) before.push(C.r.R[0][0]);
      for (let i = 0; i < nB; i++) before.push(C.r.R[1][0]);
      place(before, 10);
      if (reacted > 0) {
        c.globalAlpha = Math.min(1, reacted * 1.5);
        const after = [];
        C.r.P.forEach(([f, n]) => { for (let i = 0; i < n * C.k; i++) after.push(f); });
        for (let i = 0; i < C.leftA; i++) after.push(C.r.R[0][0]);
        for (let i = 0; i < C.leftB; i++) after.push(C.r.R[1][0]);
        place(after, w / 2 + 10);
        c.globalAlpha = 1;
      } else U.text(c, 'press React', w * 0.75, H / 2, { align: 'center', color: t.ink3 });
    });
    function refresh() {
      const C = calc(), [a, b] = C.r.R;
      sA.el.querySelector('.lbl span').innerHTML = 'Molecules of ' + U.chem(a[0]) + ' (A)';
      sB.el.querySelector('.lbl span').innerHTML = 'Molecules of ' + U.chem(b[0]) + ' (B)';
      U.clear(pOut);
      const lim = C.tie ? 'Neither: exact stoichiometric amounts' : (C.limA ? U.chem(a[0]) : U.chem(b[0]));
      const st = U.stats([['l', 'Limiting reactant'], ['p', 'Product formed'], ['x', 'Left over']]);
      st.set('l', lim);
      st.set('p', C.r.P.map(([f, n]) => n * C.k + ' ' + U.chem(f)).join(', '));
      st.set('x', (C.leftA ? C.leftA + ' ' + U.chem(a[0]) : '') + (C.leftB ? (C.leftA ? ', ' : '') + C.leftB + ' ' + U.chem(b[0]) : '') || 'nothing');
      pOut.append(st.el, U.callout(`Ratio needed: ${a[1]} ${U.chem(a[0])} : ${b[1]} ${U.chem(b[0])}. You have ${nA} : ${nB}. ${C.tie ? 'Both run out together.' : `${C.limA ? U.chem(a[0]) : U.chem(b[0])} runs out first after ${C.k} reaction event${C.k === 1 ? '' : 's'}.`}`));
      grams();
    }
    let gA = 10, gB = 64, actual = 0;
    function grams() {
      U.clear(gOut);
      const C = calc(), r = C.r, [a, b] = r.R;
      const MA = U.molarMass(a[0]), MB = U.molarMass(b[0]);
      const inA = U.numInput({ label: `Mass of ${U.chemText(a[0])} (g)`, value: gA, onInput: v => { gA = v; grams(); } });
      const inB = U.numInput({ label: `Mass of ${U.chemText(b[0])} (g)`, value: gB, onInput: v => { gB = v; grams(); } });
      const molA = gA / MA, molB = gB / MB;
      const ext = Math.min(molA / a[1], molB / b[1]);
      const limA = molA / a[1] <= molB / b[1];
      const [pf, pn] = r.P[0], MP = U.molarMass(pf), theo = ext * pn * MP;
      const inY = U.numInput({ label: `Actual yield of ${U.chemText(pf)} (g)`, value: actual || +(theo * 0.85).toFixed(2), onInput: v => { actual = v; grams(); } });
      const act = actual || +(theo * 0.85).toFixed(2);
      const rows = [
        [U.chem(a[0]), gA, MA.toFixed(2), molA.toFixed(4), (molA / a[1] * pn).toFixed(4)],
        [U.chem(b[0]), gB, MB.toFixed(2), molB.toFixed(4), (molB / b[1] * pn).toFixed(4)],
      ];
      gOut.appendChild(U.panel('Scale up to grams', h('div', { class: 'controls' }, inA.el, inB.el, inY.el),
        U.table(['Reactant', 'Mass (g)', 'M (g/mol)', 'Moles', `→ mol ${U.chem(pf)} possible`], rows, { num: [1, 2, 3, 4], hl: i => (i === 0) === limA }),
        h('div', { class: 'eq wrap', html: `Limiting reactant: <b>${U.chem(limA ? a[0] : b[0])}</b> (it makes less product). Theoretical yield = ${(ext * pn).toFixed(4)} mol × ${MP.toFixed(2)} g/mol = <b>${theo.toFixed(2)} g ${U.chem(pf)}</b>` }),
        h('div', { class: 'eq', html: `Percent yield = ${act} g ÷ ${theo.toFixed(2)} g × 100% = <b>${(act / theo * 100).toFixed(1)}%</b>` }),
        h('div', { class: 'small muted', html: `Excess ${U.chem(limA ? b[0] : a[0])} left: ${(limA ? (molB - ext * b[1]) * MB : (molA - ext * a[1]) * MA).toFixed(2)} g` })));
    }
    refresh();
  },
});
