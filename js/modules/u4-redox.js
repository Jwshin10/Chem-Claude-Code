'use strict';
App.register({
  id: 'redox', unit: 4, sym: 'Rx', title: 'Oxidation Numbers & Redox',
  desc: 'Assign oxidation numbers, identify what is oxidized and reduced, and balance redox reactions with half-reactions.',
  tags: ['oxidation number', 'oxidation state', 'redox', 'oxidized', 'reduced', 'oxidizing agent', 'reducing agent', 'half reaction', 'electron transfer', 'balancing redox', 'acidic solution', 'basic solution'],
  keyIdeas: [
    'Rules: elements are 0; monatomic ions equal their charge; F is −1; O is usually −2; H is +1 with nonmetals; the sum equals the overall charge.',
    '<b>Oxidation</b> is loss of electrons (oxidation number increases). <b>Reduction</b> is gain of electrons (oxidation number decreases). “OIL RIG.”',
    'The species that is reduced is the oxidizing agent; the species that is oxidized is the reducing agent.',
    'Balance redox reactions with half-reactions: balance the atom, then O with H<sub>2</sub>O, H with H<sup>+</sup>, and charge with electrons. Equalize electrons, then add.',
  ],
  render(el, scope) {
    const h = U.h;
    U.tabs(el, [{ label: 'Oxidation numbers', render: oxTab }, { label: 'Redox reactions', render: rxTab }, { label: 'Half-reaction balancer', render: halfTab }], scope, { key: 'redox' });

    function oxTab(b, s) {
      let text = 'Cr2O7^2-';
      const inp = U.textInput({ label: 'Formula (use ^ for charge)', value: text, onInput: v => { text = v; run(); } });
      const picks = h('div', { class: 'row' }, ['KMnO4', 'Cr2O7^2-', 'H2SO4', 'NH4^+', 'H2O2', 'NaH', 'Fe3O4', 'ClO3^-', 'C6H12O6', 'OF2', 'S2O3^2-', 'O2'].map(f => U.btn(U.chem(f), () => { inp.set(f); text = f; run(); }, 'sm')));
      const out = h('div', { class: 'stack' });
      b.append(U.panel('Enter a substance', inp.el, picks), out);
      function run() {
        U.clear(out);
        let sp;
        try { sp = CHEM.parseSpecies(text); } catch (e) { out.appendChild(U.callout(e.message, 'bad')); return; }
        const r = CHEM.oxStates(sp.counts, sp.charge);
        const els = Object.keys(sp.counts);
        const big = h('div', { class: 'row', style: { gap: '18px', fontSize: '1.6rem', justifyContent: 'center', padding: '10px 0' } }, els.map(e => h('div', { style: { textAlign: 'center' } },
          h('div', { class: 'mono', style: { fontSize: '1rem', color: r.ox[e] > 0 ? 'var(--c-red)' : r.ox[e] < 0 ? 'var(--c-blue)' : 'var(--ink-2)', fontWeight: 600 } }, CHEM.fmtOx(r.ox[e])),
          h('div', { style: { fontWeight: 700 }, html: e + (sp.counts[e] > 1 ? '<sub>' + sp.counts[e] + '</sub>' : '') }))));
        out.append(U.panel('Oxidation numbers of ' + CHEM.spHTML(sp), big,
          U.table(['Element', 'Atoms', 'Oxidation number', 'Total', 'Reason'], els.map(e => [e, sp.counts[e], CHEM.fmtOx(r.ox[e]), CHEM.fmtOx(r.ox[e] * sp.counts[e]), r.rule[e]]), { num: [1, 2, 3] }),
          h('div', { class: 'eq', html: 'Check: ' + els.map(e => `${sp.counts[e]}(${CHEM.fmtOx(r.ox[e])})`).join(' + ') + ` = ${sp.charge}` })));
        if (r.average) out.appendChild(U.callout('The value shown is an <b>average</b>. Atoms of this element are in different environments (for example Fe<sub>3</sub>O<sub>4</sub> contains Fe<sup>2+</sup> and Fe<sup>3+</sup>, and the carbons in organic molecules differ).', 'warn'));
      }
      run();
    }

    function analyze(R, P, coefs) {
      const info = side => side.map(sp => ({ sp, ox: sp.electron ? {} : CHEM.oxStates(sp.counts, sp.charge).ox }));
      const a = info(R), z = info(P);
      const changes = [];
      const els = [...new Set(R.concat(P).flatMap(x => Object.keys(x.counts)))];
      els.forEach(e => {
        const before = a.filter(x => x.sp.counts[e]), after = z.filter(x => x.sp.counts[e]);
        before.forEach(bx => after.forEach(ax => {
          const d = ax.ox[e] - bx.ox[e];
          if (Math.abs(d) > 1e-6 && !changes.some(c => c.e === e && c.from === bx)) changes.push({ e, from: bx, to: ax, d });
        }));
      });
      return { a, z, changes };
    }

    function rxTab(b, s) {
      let text = 'Zn + Cu^2+ -> Zn^2+ + Cu';
      const inp = U.textInput({ label: 'Reaction', value: text, onInput: v => { text = v; run(); } });
      const ex = ['Zn + Cu^2+ -> Zn^2+ + Cu', 'Fe2O3 + CO -> Fe + CO2', '2Na + Cl2 -> 2NaCl', 'CH4 + 2O2 -> CO2 + 2H2O', 'Cu + 4HNO3 -> Cu(NO3)2 + 2NO2 + 2H2O', 'MnO4^- + 5Fe^2+ + 8H^+ -> Mn^2+ + 5Fe^3+ + 4H2O', 'HCl + NaOH -> NaCl + H2O'];
      const picks = h('div', { class: 'row' }, ex.map(e => U.btn(U.chem(e), () => { inp.set(e); text = e; run(); }, 'sm')));
      const out = h('div', { class: 'stack' });
      b.append(U.panel('Enter a reaction', inp.el, picks), out);
      function run() {
        U.clear(out);
        let R, P, coefs;
        try { ({ R, P } = CHEM.parseEquation(text)); coefs = CHEM.balance(R, P); } catch (e) { out.appendChild(U.callout(e.message, 'bad')); return; }
        const A = analyze(R, P, coefs);
        const label = x => Object.keys(x.sp.counts).map(e => `<span class="mono small" title="${e}">${e}: ${CHEM.fmtOx(x.ox[e])}</span>`).join('<br>');
        out.appendChild(U.panel('Balanced equation with oxidation numbers', h('div', { class: 'eq', html: CHEM.eqHTML(R, P, coefs) }),
          h('div', { class: 'grid2' },
            U.table(['Reactant', 'Oxidation numbers'], A.a.map(x => [CHEM.spHTML(x.sp), label(x)])),
            U.table(['Product', 'Oxidation numbers'], A.z.map(x => [CHEM.spHTML(x.sp), label(x)])))));
        if (!A.changes.length) { out.appendChild(U.callout('No oxidation numbers change, so this is <b>not</b> a redox reaction (it may be acid–base or precipitation).', 'warn')); return; }
        const ox = A.changes.filter(c => c.d > 0), red = A.changes.filter(c => c.d < 0);
        const desc = c => `${c.e} goes from ${CHEM.fmtOx(c.from.ox[c.e])} in ${CHEM.spHTML(c.from.sp)} to ${CHEM.fmtOx(c.to.ox[c.e])} in ${CHEM.spHTML(c.to.sp)}`;
        out.appendChild(h('div', { class: 'grid2' },
          U.panel('<span style="color:var(--c-red)">Oxidized</span> (loses e⁻)', ...ox.map(c => h('p', { html: desc(c) })), h('p', { class: 'small', html: '<b>Reducing agent:</b> ' + [...new Set(ox.map(c => CHEM.spHTML(c.from.sp)))].join(', ') })),
          U.panel('<span style="color:var(--c-blue)">Reduced</span> (gains e⁻)', ...red.map(c => h('p', { html: desc(c) })), h('p', { class: 'small', html: '<b>Oxidizing agent:</b> ' + [...new Set(red.map(c => CHEM.spHTML(c.from.sp)))].join(', ') }))));
      }
      run();
    }

    function halfTab(b, s) {
      let oxS = 'Fe^2+ -> Fe^3+', redS = 'MnO4^- -> Mn^2+', medium = 'acid';
      const i1 = U.textInput({ label: 'Oxidation half (species → species)', value: oxS, onInput: v => { oxS = v; run(); } });
      const i2 = U.textInput({ label: 'Reduction half (species → species)', value: redS, onInput: v => { redS = v; run(); } });
      const seg = U.seg({ options: [{ value: 'acid', label: 'Acidic solution' }, { value: 'base', label: 'Basic solution' }], value: medium, onChange: v => { medium = v; run(); } });
      const pre = [['Fe^2+ -> Fe^3+', 'MnO4^- -> Mn^2+'], ['I^- -> I2', 'Cr2O7^2- -> Cr^3+'], ['Cu -> Cu^2+', 'NO3^- -> NO'], ['C2O4^2- -> CO2', 'MnO4^- -> MnO2'], ['Zn -> Zn^2+', 'Ag^+ -> Ag']];
      const picks = h('div', { class: 'row' }, pre.map(([a, c]) => U.btn(U.chem(a) + ' / ' + U.chem(c), () => { oxS = a; redS = c; i1.set(a); i2.set(c); run(); }, 'sm')));
      const out = h('div', { class: 'stack' });
      b.append(U.panel('Two half-reactions', i1.el, i2.el, seg.el, picks), out);
      function half(str) {
        const { R, P } = CHEM.parseEquation(str);
        const extra = ['H2O', 'H^+', 'e^-'].map(CHEM.parseSpecies);
        const sp = [R[0], P[0]].concat(extra);
        const v = CHEM.balanceSigned(sp);
        if (!v) throw new Error('Could not balance “' + str + '”. Make sure the key element appears on both sides.');
        // positive coefficients are reactants, negative are products; R[0] positive by construction
        const L = [], Rt = [];
        sp.forEach((x, i) => { if (v[i] > 0) L.push([x, v[i]]); else if (v[i] < 0) Rt.push([x, -v[i]]); });
        const eIdx = 4;
        return { L, Rt, e: Math.abs(v[eIdx]), eSide: v[eIdx] > 0 ? 'L' : 'R' };
      }
      const side = arr => arr.map(([x, n]) => (n > 1 ? n : '') + CHEM.spHTML(x)).join(' + ');
      function toBasic(H) { // add OH- to both sides to neutralize H+
        const hp = H.L.concat(H.Rt).find(([x]) => x.formula === 'H' && x.charge === 1);
        if (!hp) return H;
        const n = hp[1];
        const OH = CHEM.parseSpecies('OH^-'), W = CHEM.parseSpecies('H2O');
        const conv = arr => arr.map(([x, k]) => (x.formula === 'H' && x.charge === 1) ? [W, k] : [x, k]);
        const L = conv(H.L), Rt = conv(H.Rt);
        (H.L.some(([x]) => x === hp[0]) ? Rt : L).push([OH, n]);
        // cancel water
        const wL = L.filter(([x]) => x.formula === 'H2O').reduce((t, [, k]) => t + k, 0), wR = Rt.filter(([x]) => x.formula === 'H2O').reduce((t, [, k]) => t + k, 0);
        const net = wL - wR;
        const L2 = L.filter(([x]) => x.formula !== 'H2O'), R2 = Rt.filter(([x]) => x.formula !== 'H2O');
        if (net > 0) L2.push([W, net]); else if (net < 0) R2.push([W, -net]);
        return Object.assign({}, H, { L: L2, Rt: R2 });
      }
      function combine(A, B) {
        const m = A.e * B.e / U.gcd(A.e, B.e), ka = m / A.e, kb = m / B.e;
        const tot = {};
        const addAll = (arr, k, sign) => arr.forEach(([x, n]) => { const key = x.electron ? 'e' : x.formula + '|' + x.charge; tot[key] = tot[key] || { x, n: 0 }; tot[key].n += sign * n * k; });
        addAll(A.L, ka, 1); addAll(B.L, kb, 1); addAll(A.Rt, ka, -1); addAll(B.Rt, kb, -1);
        const L = [], R = [];
        Object.values(tot).forEach(({ x, n }) => { if (n > 0) L.push([x, n]); else if (n < 0) R.push([x, -n]); });
        const g = L.concat(R).reduce((a, [, n]) => U.gcd(a, n), 0) || 1;
        return { L: L.map(([x, n]) => [x, n / g]), R: R.map(([x, n]) => [x, n / g]), ka, kb, m };
      }
      function run() {
        U.clear(out);
        let A, B;
        try { A = half(oxS); B = half(redS); } catch (e) { out.appendChild(U.callout(e.message, 'bad')); return; }
        if (A.eSide !== 'R') out.appendChild(U.callout('The first half-reaction gains electrons, so it is actually a reduction. Swap the two boxes.', 'warn'));
        if (B.eSide !== 'L') out.appendChild(U.callout('The second half-reaction loses electrons, so it is actually an oxidation.', 'warn'));
        if (medium === 'base') { A = toBasic(A); B = toBasic(B); }
        const C = combine(A, B);
        out.append(U.panel('Balanced half-reactions',
          h('div', { class: 'tiny muted' }, 'Oxidation (electrons are products)'), h('div', { class: 'eq', html: side(A.L) + ' → ' + side(A.Rt) }),
          h('div', { class: 'tiny muted' }, 'Reduction (electrons are reactants)'), h('div', { class: 'eq', html: side(B.L) + ' → ' + side(B.Rt) }),
          h('p', { class: 'small', html: `Electrons must cancel: multiply the oxidation by <b>${C.ka}</b> and the reduction by <b>${C.kb}</b> (${C.m} e⁻ transferred).` })),
          U.panel('Overall balanced reaction (' + (medium === 'acid' ? 'acidic' : 'basic') + ' solution)', h('div', { class: 'eq', style: { fontSize: '1.1rem' }, html: side(C.L) + ' → ' + side(C.R) })),
          U.callout('Steps used: (1) balance the element that changes oxidation number, (2) add H<sub>2</sub>O to balance O, (3) add H<sup>+</sup> to balance H, (4) add e<sup>−</sup> to balance charge' + (medium === 'base' ? ', (5) add OH<sup>−</sup> to both sides to turn H<sup>+</sup> into H<sub>2</sub>O.' : '.')));
      }
      run();
    }
  },
});
