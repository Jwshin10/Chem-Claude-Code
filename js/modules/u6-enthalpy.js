'use strict';
App.register({
  id: 'enthalpy', unit: 6, sym: 'Hs', title: 'Bond Enthalpy, ΔH°f & Hess’s Law',
  desc: 'Calculate reaction enthalpy three ways: bonds broken vs. formed, enthalpies of formation, and Hess’s law puzzles.',
  tags: ['enthalpy', 'bond enthalpy', 'bond energy', 'enthalpy of formation', 'heat of formation', 'hess law', 'standard enthalpy', 'endothermic', 'exothermic', 'δh'],
  keyIdeas: [
    'Breaking bonds requires energy (endothermic); forming bonds releases energy (exothermic).',
    'ΔH ≈ Σ(bonds broken) − Σ(bonds formed) using average bond enthalpies.',
    'ΔH°<sub>rxn</sub> = ΣnΔH°<sub>f</sub>(products) − ΣnΔH°<sub>f</sub>(reactants). ΔH°<sub>f</sub> of an element in its standard state is 0.',
    'Hess’s law: if a reaction is the sum of steps, ΔH is the sum of their ΔH values. Reversing a reaction flips the sign of ΔH; multiplying the reaction multiplies ΔH.',
  ],
  render(el, scope) {
    const h = U.h;
    U.tabs(el, [{ label: 'Bond enthalpies', render: bonds }, { label: 'Enthalpy of formation', render: formation }, { label: 'Hess’s law puzzle', render: hess }], scope, { key: 'enthalpy' });

    const BE = { 'H–H': 436, 'C–H': 413, 'C–C': 348, 'C=C': 614, 'C≡C': 839, 'O=O': 495, 'C=O (CO₂)': 799, 'C–O': 358, 'O–H': 463, 'N≡N': 941, 'N–H': 391, 'H–Cl': 431, 'Cl–Cl': 242, 'C–Cl': 328, 'H–F': 567, 'F–F': 159 };
    function bonds(b, s) {
      const RX = [
        { eq: 'CH4 + 2O2 -> CO2 + 2H2O', broken: [['C–H', 4], ['O=O', 2]], formed: [['C=O (CO₂)', 2], ['O–H', 4]] },
        { eq: 'H2 + Cl2 -> 2HCl', broken: [['H–H', 1], ['Cl–Cl', 1]], formed: [['H–Cl', 2]] },
        { eq: 'N2 + 3H2 -> 2NH3', broken: [['N≡N', 1], ['H–H', 3]], formed: [['N–H', 6]] },
        { eq: 'C2H4 + H2 -> C2H6', broken: [['C=C', 1], ['H–H', 1]], formed: [['C–C', 1], ['C–H', 2]] },
        { eq: '2H2 + O2 -> 2H2O', broken: [['H–H', 2], ['O=O', 1]], formed: [['O–H', 4]] },
        { eq: 'CH4 + Cl2 -> CH3Cl + HCl', broken: [['C–H', 1], ['Cl–Cl', 1]], formed: [['C–Cl', 1], ['H–Cl', 1]] },
        { eq: 'H2 + F2 -> 2HF', broken: [['H–H', 1], ['F–F', 1]], formed: [['H–F', 2]] },
      ];
      let ri = 0;
      const sel = U.select({ label: 'Reaction', options: RX.map((r, i) => ({ value: i, label: U.chemText(r.eq) })), value: ri, onChange: v => { ri = +v; upd(); } });
      const out = h('div', { class: 'stack' });
      const cv = U.canvas(null, { aspect: 1.25, scope: s, draw });
      b.append(h('div', { class: 'grid-viz' }, U.panel('Energy ladder', cv.wrap), h('div', { class: 'stack' }, U.panel('Choose', sel.el), out, U.panel('Average bond enthalpies (kJ/mol)', U.table(['Bond', 'Energy'], Object.keys(BE).map(k => [k, BE[k]]), { num: [1] })))));
      const sum = list => list.reduce((t, [k, n]) => t + BE[k] * n, 0);
      function draw(c, w, H) {
        const t = U.theme(), r = RX[ri], Bk = sum(r.broken), Fm = sum(r.formed), dH = Bk - Fm;
        const top = Math.max(Bk, 0) + 80, bot = Math.min(dH, 0) - 80;
        const P = new U.Plot(c, w, H, { x: [0, 3], y: [bot, top], ylabel: 'Energy relative to reactants (kJ)', xticks: [] });
        P.axes();
        const lvl = (x0, x1, y, col, label) => { P.line([[x0, y], [x1, y]], col, 4); P.label(label, (x0 + x1) / 2, y, col, { dy: -8, align: 'center' }); };
        lvl(0.2, 0.9, 0, t.ink, 'reactants');
        lvl(1.1, 1.9, Bk, t.red, 'separated atoms');
        lvl(2.1, 2.8, dH, t.ink, 'products');
        U.arrow(c, P.X(0.95), P.Y(0), P.X(1.05), P.Y(Bk), t.red, 2.5);
        P.label('+' + Bk + ' (break)', 0.65, Bk / 2, t.red, { align: 'center' });
        U.arrow(c, P.X(1.95), P.Y(Bk), P.X(2.05), P.Y(dH), t.blue, 2.5);
        P.label('−' + Fm + ' (form)', 2.35, (Bk + dH) / 2, t.blue, { align: 'center' });
        P.label('ΔH = ' + (dH > 0 ? '+' : '') + dH + ' kJ', 2.45, dH, dH < 0 ? t.good : t.bad, { dy: 18, align: 'center', size: 13 });
      }
      function upd() {
        const r = RX[ri], Bk = sum(r.broken), Fm = sum(r.formed), dH = Bk - Fm;
        U.clear(out);
        out.append(U.panel('Bonds broken (energy in)', U.table(['Bond', '×', 'kJ'], r.broken.map(([k, n]) => [k, n, n * BE[k]]).concat([['<b>Total</b>', '', '<b>' + Bk + '</b>']]), { num: [1, 2] })),
          U.panel('Bonds formed (energy out)', U.table(['Bond', '×', 'kJ'], r.formed.map(([k, n]) => [k, n, n * BE[k]]).concat([['<b>Total</b>', '', '<b>' + Fm + '</b>']]), { num: [1, 2] })),
          h('div', { class: 'eq', html: `ΔH = ${Bk} − ${Fm} = <b>${dH > 0 ? '+' : ''}${dH} kJ</b> (${dH < 0 ? 'exothermic: stronger bonds formed' : 'endothermic: stronger bonds broken'})` }));
        cv.redraw();
      }
      upd();
    }

    function formation(b, s) {
      const HF = { 'CH4(g)': -74.8, 'O2(g)': 0, 'CO2(g)': -393.5, 'H2O(l)': -285.8, 'H2O(g)': -241.8, 'C3H8(g)': -103.8, 'C6H12O6(s)': -1273.3, 'NH3(g)': -46.1, 'NO(g)': 90.3, 'NO2(g)': 33.2, 'C2H5OH(l)': -277.7, 'CaCO3(s)': -1206.9, 'CaO(s)': -635.1, 'Fe2O3(s)': -824.2, 'Al2O3(s)': -1675.7, 'SO2(g)': -296.8, 'SO3(g)': -395.7, 'HCl(g)': -92.3, 'N2(g)': 0, 'H2(g)': 0, 'Fe(s)': 0, 'Al(s)': 0, 'C2H2(g)': 226.7, 'CO(g)': -110.5 };
      const RX = [
        { R: [['CH4(g)', 1], ['O2(g)', 2]], P: [['CO2(g)', 1], ['H2O(l)', 2]] },
        { R: [['C3H8(g)', 1], ['O2(g)', 5]], P: [['CO2(g)', 3], ['H2O(g)', 4]] },
        { R: [['C6H12O6(s)', 1], ['O2(g)', 6]], P: [['CO2(g)', 6], ['H2O(l)', 6]] },
        { R: [['CaCO3(s)', 1]], P: [['CaO(s)', 1], ['CO2(g)', 1]] },
        { R: [['Fe2O3(s)', 1], ['Al(s)', 2]], P: [['Al2O3(s)', 1], ['Fe(s)', 2]] },
        { R: [['NH3(g)', 4], ['O2(g)', 5]], P: [['NO(g)', 4], ['H2O(g)', 6]] },
        { R: [['C2H5OH(l)', 1], ['O2(g)', 3]], P: [['CO2(g)', 2], ['H2O(l)', 3]] },
        { R: [['SO2(g)', 2], ['O2(g)', 1]], P: [['SO3(g)', 2]] },
        { R: [['C2H2(g)', 2], ['O2(g)', 5]], P: [['CO2(g)', 4], ['H2O(l)', 2]] },
      ];
      const lab = r => r.R.map(([f, n]) => (n > 1 ? n : '') + f).join(' + ') + ' → ' + r.P.map(([f, n]) => (n > 1 ? n : '') + f).join(' + ');
      let ri = 0;
      const sel = U.select({ label: 'Reaction', options: RX.map((r, i) => ({ value: i, label: U.chemText(lab(r)) })), value: ri, onChange: v => { ri = +v; upd(); } });
      const out = h('div', { class: 'stack' });
      b.append(U.panel('Choose a reaction', sel.el), out, U.panel('Standard enthalpies of formation (kJ/mol)', U.table(['Substance', 'ΔH°f'], Object.keys(HF).map(k => [U.chem(k), HF[k]]), { num: [1] })));
      function upd() {
        const r = RX[ri];
        const side = L => L.reduce((t, [f, n]) => t + n * HF[f], 0);
        const sp = side(r.P), sr = side(r.R), dH = sp - sr;
        U.clear(out);
        out.append(U.panel('Calculation', h('div', { class: 'eq', html: U.chem(lab(r)) }),
          h('div', { class: 'eq wrap', html: `ΣnΔH°f(products) = ${r.P.map(([f, n]) => `${n}(${HF[f]})`).join(' + ')} = ${sp.toFixed(1)} kJ<br>ΣnΔH°f(reactants) = ${r.R.map(([f, n]) => `${n}(${HF[f]})`).join(' + ')} = ${sr.toFixed(1)} kJ<br>ΔH°rxn = ${sp.toFixed(1)} − (${sr.toFixed(1)}) = <b>${dH.toFixed(1)} kJ</b>` }),
          U.callout(dH < 0 ? 'Negative ΔH: exothermic. The products are lower in enthalpy than the reactants.' : 'Positive ΔH: endothermic. Energy must be supplied (e.g. heating limestone to make lime).', dH < 0 ? 'good' : 'warn'),
          h('p', { class: 'small muted' }, 'Elements in their standard states (O₂, N₂, H₂, Fe, Al) have ΔH°f = 0. Watch the state: H₂O(l) and H₂O(g) differ by the enthalpy of vaporization.')));
      }
      upd();
    }

    function hess(b, s) {
      const PZ = [
        { target: { C: 1, H2: 2 }, targetP: { CH4: 1 }, tlabel: 'C(s) + 2H₂(g) → CH₄(g)', steps: [
          { R: { C: 1, O2: 1 }, P: { CO2: 1 }, dH: -393.5 }, { R: { H2: 1, O2: 0.5 }, P: { H2O: 1 }, dH: -285.8 }, { R: { CH4: 1, O2: 2 }, P: { CO2: 1, H2O: 2 }, dH: -890.3 }] },
        { target: { C: 2, H2: 1 }, targetP: { C2H2: 1 }, tlabel: '2C(s) + H₂(g) → C₂H₂(g)', steps: [
          { R: { C2H2: 1, O2: 2.5 }, P: { CO2: 2, H2O: 1 }, dH: -1299.6 }, { R: { C: 1, O2: 1 }, P: { CO2: 1 }, dH: -393.5 }, { R: { H2: 1, O2: 0.5 }, P: { H2O: 1 }, dH: -285.8 }] },
        { target: { N2: 1, O2: 2 }, targetP: { NO2: 2 }, tlabel: 'N₂(g) + 2O₂(g) → 2NO₂(g)', steps: [
          { R: { N2: 1, O2: 1 }, P: { NO: 2 }, dH: 180.6 }, { R: { NO: 2, O2: 1 }, P: { NO2: 2 }, dH: -114.2 }] },
        { target: { C: 1, O2: 0.5 }, targetP: { CO: 1 }, tlabel: 'C(s) + ½O₂(g) → CO(g)', steps: [
          { R: { C: 1, O2: 1 }, P: { CO2: 1 }, dH: -393.5 }, { R: { CO: 1, O2: 0.5 }, P: { CO2: 1 }, dH: -283.0 }] },
      ];
      let pi = 0, cfg;
      const sel = U.select({ label: 'Puzzle', options: PZ.map((p, i) => ({ value: i, label: 'Target: ' + p.tlabel })), value: pi, onChange: v => { pi = +v; start(); } });
      const body = h('div', { class: 'stack' });
      b.append(U.panel('Combine the given reactions to make the target', sel.el, h('p', { class: 'small muted' }, 'Reverse a step or multiply it, then check whether the sum matches the target.')), body);
      const frac = x => { const m = { 0.5: '½', 1.5: '3/2', 2.5: '5/2', 0.25: '¼' }; return m[x] || String(+x.toFixed(2)); };
      const sideTxt = o => Object.keys(o).filter(k => Math.abs(o[k]) > 1e-9).map(k => (Math.abs(o[k] - 1) > 1e-9 ? frac(o[k]) : '') + U.chem(k)).join(' + ');
      function start() { cfg = PZ[pi].steps.map(() => ({ rev: false, k: 1 })); render(); }
      function render() {
        U.clear(body);
        const p = PZ[pi];
        const net = {}; let dH = 0;
        p.steps.forEach((st, i) => {
          const { rev, k } = cfg[i];
          const L = rev ? st.P : st.R, R = rev ? st.R : st.P;
          Object.keys(L).forEach(sp => net[sp] = (net[sp] || 0) - L[sp] * k);
          Object.keys(R).forEach(sp => net[sp] = (net[sp] || 0) + R[sp] * k);
          dH += (rev ? -st.dH : st.dH) * k;
          const kSeg = U.seg({ options: [0.5, 1, 2, 3].map(x => ({ value: x, label: '×' + frac(x) })), value: k, onChange: v => { cfg[i].k = v; render(); } });
          body.appendChild(U.panel(null, h('div', { class: 'flex-between' }, h('b', null, 'Step ' + (i + 1)), h('div', { class: 'row' }, U.btn(rev ? '↺ Reversed' : 'Reverse', () => { cfg[i].rev = !cfg[i].rev; render(); }, 'sm' + (rev ? ' primary' : '')), kSeg.el)),
            h('div', { class: 'eq', html: `${k !== 1 ? frac(k) + ' × [ ' : ''}${sideTxt(L)} → ${sideTxt(R)}${k !== 1 ? ' ]' : ''} &nbsp; ΔH = ${k !== 1 ? frac(k) + ' × ' : ''}${(rev ? -st.dH : st.dH).toFixed(1)} kJ` })));
        });
        const left = {}, right = {};
        Object.keys(net).forEach(k => { if (net[k] < -1e-9) left[k] = -net[k]; else if (net[k] > 1e-9) right[k] = net[k]; });
        const eq = (a, z) => { const ka = Object.keys(a).filter(k => Math.abs(a[k]) > 1e-9), kz = Object.keys(z).filter(k => Math.abs(z[k]) > 1e-9); return ka.length === kz.length && ka.every(k => Math.abs(a[k] - (z[k] || 0)) < 1e-9); };
        const ok = eq(left, p.target) && eq(right, p.targetP);
        body.appendChild(U.panel('Sum (after canceling species on both sides)', h('div', { class: 'eq', style: { fontSize: '1.05rem' }, html: `${sideTxt(left) || '∅'} → ${sideTxt(right) || '∅'} &nbsp; ΔH = <b>${dH.toFixed(1)} kJ</b>` }),
          U.callout(ok ? `Solved! The steps add up to the target, so ΔH = ${dH.toFixed(1)} kJ.` : 'Not the target yet. Target: ' + p.tlabel + '. Tip: species you want as reactants must end up on the left; anything not in the target must cancel.', ok ? 'good' : '')));
      }
      start();
    }
  },
});
