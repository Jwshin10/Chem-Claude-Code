'use strict';
App.register({
  id: 'ice', unit: 7, sym: 'Ic', title: 'ICE Tables & Kp/Kc',
  desc: 'Solve any equilibrium problem with an ICE table, check the 5% approximation, and convert between Kp and Kc.',
  tags: ['ice table', 'equilibrium calculation', 'initial change equilibrium', 'small x approximation', '5% rule', 'kp', 'kc', 'kp=kc(rt)^Δn'],
  keyIdeas: [
    '<b>I</b>nitial, <b>C</b>hange, <b>E</b>quilibrium: changes follow the coefficients (−ax for reactants, +cx for products when shifting right).',
    'Substitute equilibrium expressions into K and solve for x.',
    'If K is small, x is often small compared with the initial concentration and can be neglected (check that x is &lt; 5% of the initial value).',
    'K<sub>p</sub> = K<sub>c</sub>(RT)<sup>Δn</sup>, where Δn = moles of gaseous products − moles of gaseous reactants and R = 0.08206.',
  ],
  render(el, scope) {
    const h = U.h;
    U.tabs(el, [{ label: 'ICE table solver', render: ice }, { label: 'Kp ⇄ Kc', render: kpkc }], scope, { key: 'ice' });

    function ice(b) {
      const PRE = [
        { name: 'H₂ + I₂ ⇌ 2HI', sp: [['H2', 1], ['I2', 1], ['HI', 2]], nR: 2, K: 50.5, c: [0.5, 0.5, 0] },
        { name: 'N₂O₄ ⇌ 2NO₂', sp: [['N2O4', 1], ['NO2', 2]], nR: 1, K: 4.63e-3, c: [0.1, 0] },
        { name: 'Weak acid: HA ⇌ H⁺ + A⁻', sp: [['HA', 1], ['H^+', 1], ['A^-', 1]], nR: 1, K: 1.8e-5, c: [0.1, 0, 0] },
        { name: 'PCl₅ ⇌ PCl₃ + Cl₂', sp: [['PCl5', 1], ['PCl3', 1], ['Cl2', 1]], nR: 1, K: 0.0415, c: [0.2, 0, 0] },
        { name: 'CO + H₂O ⇌ CO₂ + H₂ (start with some product)', sp: [['CO', 1], ['H2O', 1], ['CO2', 1], ['H2', 1]], nR: 2, K: 0.63, c: [0.1, 0.1, 0.1, 0.3] },
        { name: 'N₂ + 3H₂ ⇌ 2NH₃', sp: [['N2', 1], ['H2', 3], ['NH3', 2]], nR: 2, K: 0.5, c: [1, 1, 0] },
      ];
      let pi = 0, K = PRE[0].K, c = PRE[0].c.slice();
      const sel = U.select({ label: 'Reaction', options: PRE.map((p, i) => ({ value: i, label: p.name })), value: pi, onChange: v => { pi = +v; K = PRE[pi].K; c = PRE[pi].c.slice(); build(); } });
      const inputs = h('div', { class: 'controls' });
      const out = h('div', { class: 'stack' });
      b.append(U.panel('Set up', sel.el, inputs), out);
      function build() {
        U.clear(inputs);
        const p = PRE[pi];
        const kI = U.numInput({ label: 'K', value: K, onInput: v => { if (v > 0) { K = v; solve(); } } });
        inputs.appendChild(kI.el);
        p.sp.forEach(([f], i) => { const n = U.numInput({ label: `Initial [${U.chemText(f)}] (M)`, value: c[i], min: 0, onInput: v => { if (v >= 0) { c[i] = v; solve(); } } }); inputs.appendChild(n.el); });
        solve();
      }
      function solve() {
        const p = PRE[pi];
        U.clear(out);
        const sign = p.sp.map((_, i) => (i < p.nR ? -1 : 1) * p.sp[i][1]);
        const Q = x => p.sp.reduce((q, [f, n], i) => q * Math.pow(Math.max(c[i] + sign[i] * x, 0), (i < p.nR ? -1 : 1) * n), 1);
        const lo = -Math.min(...p.sp.map((s, i) => i >= p.nR ? c[i] / s[1] : Infinity)), hi = Math.min(...p.sp.map((s, i) => i < p.nR ? c[i] / s[1] : Infinity));
        if (!isFinite(lo) && !isFinite(hi)) { out.appendChild(U.callout('Enter some initial concentrations.', 'warn')); return; }
        if (hi - lo < 1e-15) { out.appendChild(U.callout('With these starting amounts the reaction cannot proceed in either direction (a needed reactant and a product are both zero).', 'warn')); return; }
        const q0 = Q(0);
        const lq = x => { const v = Q(x); return v === 0 ? -700 : !isFinite(v) ? 700 : Math.log(v); };
        const a = isFinite(lo) ? lo : -1e3, z = isFinite(hi) ? hi : 1e3;
        const x = U.bisect(xx => lq(xx) - Math.log(K), a + 1e-14, z - 1e-14, 200);
        const eqC = c.map((v, i) => v + sign[i] * x);
        const dir = Math.abs(x) < 1e-12 ? 'none' : x > 0 ? 'right' : 'left';
        const term = (i, sgn) => { const n = p.sp[i][1]; return `${sgn > 0 ? '+' : '−'}${n > 1 ? n : ''}x`; };
        const rows = [
          ['I', ...c.map(v => U.sig(v, 3))],
          ['C', ...p.sp.map((_, i) => term(i, sign[i]))],
          ['E', ...p.sp.map((_, i) => `${U.sig(c[i], 3)} ${term(i, sign[i]).replace('+', '+ ').replace('−', '− ')}`)],
          ['E (M)', ...eqC.map(v => '<b>' + U.sig(v, 3) + '</b>')],
        ];
        const exprTop = p.sp.slice(p.nR).map(([f, n]) => `[${U.chem(f)}]${n > 1 ? '<sup>' + n + '</sup>' : ''}`).join(''), exprBot = p.sp.slice(0, p.nR).map(([f, n]) => `[${U.chem(f)}]${n > 1 ? '<sup>' + n + '</sup>' : ''}`).join('');
        out.append(U.panel('ICE table', U.table(['', ...p.sp.map(([f]) => U.chem(f))], rows, {})),
          U.panel('Solution', h('div', { class: 'eq wrap', html: `Q<sub>initial</sub> = ${isFinite(q0) ? U.sig(q0, 3) : '∞'} ${q0 < K ? '&lt;' : q0 > K ? '&gt;' : '='} K = ${U.sig(K, 3)} → shifts <b>${dir}</b>${dir === 'left' ? ' (x is negative)' : ''}` }),
            h('div', { class: 'eq wrap', html: `K = ${exprTop} / ${exprBot} = ${U.sig(K, 3)} &nbsp;→&nbsp; x = <b>${U.sig(x, 4)} M</b>` })));
        if (dir === 'right') {
          const r0 = c.slice(0, p.nR).filter(v => v > 0);
          const minR = r0.length ? Math.min(...r0) : 0;
          if (minR > 0 && K < 1e-2) {
            const pct = x / minR * 100;
            out.appendChild(U.callout(`5% check: x is ${pct.toFixed(2)}% of the smallest initial reactant concentration. ${pct < 5 ? 'The “x is small” approximation would be valid here.' : 'Too large: solve the full equation (quadratic) instead of approximating.'}`, pct < 5 ? 'good' : 'warn'));
          }
        }
      }
      build();
    }

    function kpkc(b) {
      let Kc = 0.5, T = 500, dn = -2;
      const kI = U.numInput({ label: 'Kc', value: Kc, onInput: v => { Kc = v; upd(); } });
      const tI = U.numInput({ label: 'Temperature (K)', value: T, onInput: v => { T = v; upd(); } });
      const dS = U.seg({ options: [-3, -2, -1, 0, 1, 2, 3].map(v => ({ value: v, label: (v > 0 ? '+' : '') + v })), value: dn, onChange: v => { dn = v; upd(); } });
      const out = h('div');
      b.append(h('div', { class: 'grid2' }, U.panel('Inputs', kI.el, tI.el, h('div', { class: 'field' }, h('span', { class: 'lbl' }, 'Δn (gas moles: products − reactants)'), dS.el), h('p', { class: 'small muted' }, 'Example: N₂ + 3H₂ ⇌ 2NH₃ has Δn = 2 − 4 = −2.')), out));
      function upd() {
        const Kp = Kc * Math.pow(K.Rl * T, dn);
        U.clear(out);
        out.append(U.panel('Result', h('div', { class: 'eq wrap', html: `K<sub>p</sub> = K<sub>c</sub>(RT)<sup>Δn</sup> = ${U.sig(Kc, 3)} × (0.08206 × ${T})<sup>${dn}</sup> = <b>${U.sig(Kp, 3)}</b>` }),
          U.callout(dn === 0 ? 'When Δn = 0, K<sub>p</sub> = K<sub>c</sub>.' : 'K<sub>p</sub> uses partial pressures (atm); K<sub>c</sub> uses molar concentrations. They differ unless the moles of gas are equal on both sides.')));
      }
      upd();
    }
  },
});
