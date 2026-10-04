'use strict';
App.register({
  id: 'ksp', unit: 7, sym: 'Ks', title: 'Solubility Equilibria (Ksp)',
  desc: 'Find molar solubility from Ksp, see the common-ion and pH effects, and predict whether a precipitate forms.',
  tags: ['ksp', 'solubility product', 'molar solubility', 'common ion effect', 'precipitation', 'q vs ksp', 'saturated', 'ph and solubility', 'hydroxide'],
  keyIdeas: [
    'For M<sub>x</sub>A<sub>y</sub>(s) ⇌ xM<sup>n+</sup> + yA<sup>m−</sup>: K<sub>sp</sub> = [M]<sup>x</sup>[A]<sup>y</sup>, and with molar solubility s: K<sub>sp</sub> = (xs)<sup>x</sup>(ys)<sup>y</sup>.',
    'Compare K<sub>sp</sub> values directly only for salts with the same ion ratio; otherwise compare molar solubilities.',
    '<b>Common-ion effect:</b> adding an ion already in the equilibrium shifts it left, lowering solubility.',
    'Salts with basic anions (OH<sup>−</sup>, CO<sub>3</sub><sup>2−</sup>, F<sup>−</sup>) become more soluble in acid, because H<sup>+</sup> removes the anion.',
    'Precipitation: if Q &gt; K<sub>sp</sub> a solid forms; if Q &lt; K<sub>sp</sub> the solution is unsaturated.',
  ],
  render(el, scope) {
    const h = U.h;
    const SALTS = [
      ['AgCl', 'Ag^+', 1, 'Cl^-', 1, 1.8e-10], ['AgBr', 'Ag^+', 1, 'Br^-', 1, 5.0e-13], ['AgI', 'Ag^+', 1, 'I^-', 1, 8.3e-17], ['BaSO4', 'Ba^2+', 1, 'SO4^2-', 1, 1.1e-10],
      ['CaCO3', 'Ca^2+', 1, 'CO3^2-', 1, 3.4e-9], ['PbCl2', 'Pb^2+', 1, 'Cl^-', 2, 1.7e-5], ['PbI2', 'Pb^2+', 1, 'I^-', 2, 9.8e-9], ['CaF2', 'Ca^2+', 1, 'F^-', 2, 3.9e-11],
      ['Mg(OH)2', 'Mg^2+', 1, 'OH^-', 2, 5.6e-12], ['Ca(OH)2', 'Ca^2+', 1, 'OH^-', 2, 5.5e-6], ['Ag2CrO4', 'Ag^+', 2, 'CrO4^2-', 1, 1.1e-12], ['Fe(OH)3', 'Fe^3+', 1, 'OH^-', 3, 2.8e-39], ['Ca3(PO4)2', 'Ca^2+', 3, 'PO4^3-', 2, 2.1e-33],
    ];
    U.tabs(el, [{ label: 'Molar solubility', render: solub }, { label: 'Will it precipitate?', render: precip }], scope, { key: 'ksp' });

    function solub(b, s) {
      let si = 0, common = 0, which = 'anion', pH = 7;
      const sel = U.select({ label: 'Salt', options: SALTS.map((x, i) => ({ value: i, label: `${U.chemText(x[0])}  (Ksp = ${U.sig(x[5], 2)})` })), value: si, onChange: v => { si = +v; common = 0; cs.set(0); upd(); } });
      const ws = U.seg({ options: [{ value: 'anion', label: 'common anion' }, { value: 'cation', label: 'common cation' }], value: which, onChange: v => { which = v; upd(); } });
      const cs = U.slider({ label: 'Added common ion', min: 0, max: 0.5, step: 0.005, value: common, unit: 'M', fmt: v => v.toFixed(3), onInput: v => { common = v; upd(); } });
      const ps = U.slider({ label: 'pH (hydroxides only)', min: 2, max: 13, step: 0.1, value: pH, fmt: v => v.toFixed(1), onInput: v => { pH = v; upd(); } });
      const out = h('div', { class: 'stack' });
      const cv = U.canvas(null, { aspect: 1.25, scope: s });
      const gr = U.canvas(null, { aspect: 1.8, scope: s, draw: graph });
      const ionStr = (x, q) => x + '^' + (Math.abs(q) > 1 ? Math.abs(q) : '') + (q > 0 ? '+' : '-');
      const own = BUILDER.entry({ title: 'Add your own salt', label: 'Formula and Ksp', placeholder: 'e.g. PbSO4 1.6e-8', examples: ['PbSO4 1.6e-8', 'Ag2CO3 8.5e-12', 'Zn(OH)2 3e-17', 'BaF2 1.0e-6'], button: 'Add', hint: 'Type the formula, a space, then K<sub>sp</sub> (1.6e-8 or 1.6x10^-8).', onSubmit: text => {
        const parts = text.trim().split(/[\s,]+/);
        const f = parts[0] || '', kt = parts.slice(1).join('').replace(/[×x*]10\^?/i, 'e').replace(/−/g, '-');
        const io = CHEM.ionic(f);
        if (!io) return { ok: false, msg: `Could not split “${U.esc(f)}” into a metal (or NH₄⁺) cation and a known anion.` };
        const Ksp = parseFloat(kt);
        if (!(Ksp > 0 && Ksp < 1)) return { ok: false, msg: 'Add a Ksp value after the formula, e.g. PbSO4 1.6e-8.' };
        SALTS.push([f, ionStr(io.cat, io.qc), io.nc, ionStr(io.an, io.qa), io.na, Ksp]);
        si = SALTS.length - 1;
        sel.input.appendChild(h('option', { value: si }, `${U.chemText(f)}  (Ksp = ${U.sig(Ksp, 2)}) — yours`));
        sel.set(si); common = 0; cs.set(0); upd();
        return { ok: true, msg: `Added ${U.chem(f)}: K<sub>sp</sub> = [${U.chem(ionStr(io.cat, io.qc))}]${io.nc > 1 ? '<sup>' + io.nc + '</sup>' : ''}[${U.chem(ionStr(io.an, io.qa))}]${io.na > 1 ? '<sup>' + io.na + '</sup>' : ''}.` };
      } });
      b.append(h('div', { class: 'grid-viz' }, h('div', { class: 'stack' }, out, U.panel('Solubility vs. added common ion', gr.wrap)), h('div', { class: 'stack' }, U.panel('Choose', sel.el, ws.el, cs.el, ps.el), own.el, U.panel('Saturated solution', cv.wrap))));
      const solveS = (x, y, Ksp, cm, ca) => {
        const f = sv => Math.log(Math.pow(cm + x * sv, x) * Math.pow(ca + y * sv, y) + 1e-300) - Math.log(Ksp);
        return U.bisect(f, 0, 10, 200);
      };
      const current = () => {
        const S = SALTS[si], [, cat, x, an, y, Ksp] = S;
        if (an === 'OH^-' && Math.abs(pH - 7) > 0.05 && common === 0) { const OH = Math.pow(10, pH - 14); return { s: Math.min(Ksp / Math.pow(OH, y) / x, 50), mode: 'pH' }; }
        return { s: solveS(x, y, Ksp, which === 'cation' ? common : 0, which === 'anion' ? common : 0), mode: 'ci' };
      };
      function graph(c, w, H) {
        const t = U.theme(), S = SALTS[si], [, , x, , y, Ksp] = S;
        const s0 = solveS(x, y, Ksp, 0, 0);
        const P = new U.Plot(c, w, H, { x: [0, 0.5], y: [Math.log10(s0) - 6, Math.log10(s0) + 0.5], xlabel: 'Added common ion (M)', ylabel: 'log(molar solubility)' });
        P.axes();
        P.fn(cc => Math.log10(solveS(x, y, Ksp, which === 'cation' ? cc : 0, which === 'anion' ? cc : 0)), t.accent, 2.6, null, 80, 0.0001, 0.5);
        P.dot(common, Math.log10(solveS(x, y, Ksp, which === 'cation' ? common : 0, which === 'anion' ? common : 0)), t.red, 6);
      }
      s.loop((dt, time) => {
        const c = cv.ctx, w = cv.w, H = cv.h, t = U.theme(), S = SALTS[si];
        c.clearRect(0, 0, w, H);
        const cur = current(), s0 = solveS(S[2], S[4], S[5], 0, 0);
        const ratio = U.clamp(Math.log10(cur.s / s0) / 6 + 1, 0.05, 1.6);
        const bx = w * 0.15, bw = w * 0.7, by = H * 0.1, bh = H * 0.8;
        c.fillStyle = U.alpha(t.blue, 0.08); c.fillRect(bx, by + bh * 0.1, bw, bh * 0.9);
        c.strokeStyle = t.ink2; c.lineWidth = 2.5; c.beginPath(); c.moveTo(bx, by); c.lineTo(bx, by + bh); c.lineTo(bx + bw, by + bh); c.lineTo(bx + bw, by); c.stroke();
        const nIons = Math.round(10 * ratio);
        for (let i = 0; i < nIons * (S[2] + S[4]); i++) {
          const isCat = i % (S[2] + S[4]) < S[2];
          const x = bx + 12 + ((U.hx(i) + time / 20000 * (1 + i % 3)) % 1) * (bw - 24), y = by + bh * 0.15 + ((U.hy(i) + Math.sin(time / 1500 + i) * 0.02 + 1) % 1) * bh * 0.6;
          U.drawAtom(c, x, y, 6, 'X', { color: isCat ? t.purple : t.green, label: false });
        }
        const extra = Math.round(common * 40);
        for (let i = 0; i < extra; i++) { const x = bx + 12 + U.hx(i + 50) * (bw - 24), y = by + bh * 0.15 + U.hy(i + 50) * bh * 0.6; U.drawAtom(c, x, y, 5, 'X', { color: which === 'anion' ? t.green : t.purple, label: false, alpha: 0.6 }); }
        const pile = Math.round(26 - 10 * Math.min(1, ratio));
        for (let i = 0; i < pile; i++) U.drawAtom(c, bx + bw / 2 + (i % 9 - 4) * 11, by + bh - 7 - Math.floor(i / 9) * 9, 6, 'X', { color: t.gray, label: false });
        U.text(c, '● cation   ● anion   ▬ undissolved solid', w / 2, H - 2, { align: 'center', size: 10.5, color: t.ink3 });
      });
      function upd() {
        const S = SALTS[si], [f, cat, x, an, y, Ksp] = S;
        ps.el.hidden = an !== 'OH^-';
        const cur = current(), s0 = solveS(x, y, Ksp, 0, 0);
        U.clear(out);
        const ion = (sp, n) => (n > 1 ? n : '') + U.chem(sp);
        out.append(U.panel(U.chem(f) + ' in water', h('div', { class: 'eq', html: `${U.chem(f)}(s) ⇌ ${ion(cat, x)}(aq) + ${ion(an, y)}(aq)` }),
          h('div', { class: 'eq wrap', html: `K<sub>sp</sub> = [${U.chem(cat)}]${x > 1 ? '<sup>' + x + '</sup>' : ''}[${U.chem(an)}]${y > 1 ? '<sup>' + y + '</sup>' : ''} = (${x > 1 ? x : ''}s)${x > 1 ? '<sup>' + x + '</sup>' : ''}(${y > 1 ? y : ''}s)${y > 1 ? '<sup>' + y + '</sup>' : ''} = ${x ** x * y ** y > 1 ? x ** x * y ** y : ''}s<sup>${x + y}</sup> = ${U.sig(Ksp, 2)}` }),
          (() => { const st = U.stats([['s0', 'Solubility in pure water'], ['s', 'Solubility now'], ['g', 'Grams per liter now']]); st.set('s0', U.sig(s0, 3) + ' M'); st.set('s', U.sig(cur.s, 3) + ' M'); st.set('g', U.sig(cur.s * U.molarMass(f), 3) + ' g/L'); return st.el; })()));
        if (cur.mode === 'pH') out.appendChild(U.callout(`At pH ${pH.toFixed(1)}, [OH⁻] = ${U.sig(Math.pow(10, pH - 14), 2)} M. ${pH < 7 ? 'In acid, H⁺ removes OH⁻, so more solid dissolves.' : 'Extra OH⁻ is a common ion, so less solid dissolves.'}`));
        else if (common > 0) out.appendChild(U.callout(`Adding ${common.toFixed(3)} M of the common ${which} pushes the equilibrium left, so solubility drops by a factor of ${U.sig(s0 / cur.s, 3)}.`, 'warn'));
        gr.redraw();
      }
      upd();
    }

    function precip(b, s) {
      let si = 6, c1 = 0.01, v1 = 50, c2 = 0.01, v2 = 50;
      const sel = U.select({ label: 'Possible precipitate', options: SALTS.map((x, i) => ({ value: i, label: `${U.chemText(x[0])}  (Ksp = ${U.sig(x[5], 2)})` })), value: si, onChange: v => { si = +v; upd(); } });
      const a1 = U.logSlider({ label: 'Cation solution concentration', min: 1e-6, max: 1, value: c1, unit: 'M', fmt: v => U.sig(v, 2), onInput: v => { c1 = v; upd(); } });
      const b1 = U.slider({ label: 'Cation solution volume', min: 5, max: 200, step: 5, value: v1, unit: 'mL', onInput: v => { v1 = v; upd(); } });
      const a2 = U.logSlider({ label: 'Anion solution concentration', min: 1e-6, max: 1, value: c2, unit: 'M', fmt: v => U.sig(v, 2), onInput: v => { c2 = v; upd(); } });
      const b2 = U.slider({ label: 'Anion solution volume', min: 5, max: 200, step: 5, value: v2, unit: 'mL', onInput: v => { v2 = v; upd(); } });
      const out = h('div', { class: 'stack' });
      b.append(h('div', { class: 'grid2' }, U.panel('Mix two solutions', sel.el, a1.el, b1.el, a2.el, b2.el), out));
      function upd() {
        const [f, cat, x, an, y, Ksp] = SALTS[si];
        const V = v1 + v2, M = c1 * v1 / V, A = c2 * v2 / V, Q = Math.pow(M, x) * Math.pow(A, y);
        U.clear(out);
        out.append(U.panel('After mixing (total ' + V + ' mL)',
          h('div', { class: 'eq wrap', html: `[${U.chem(cat)}] = ${U.sig(c1, 2)} × ${v1}/${V} = ${U.sig(M, 3)} M<br>[${U.chem(an)}] = ${U.sig(c2, 2)} × ${v2}/${V} = ${U.sig(A, 3)} M` }),
          h('div', { class: 'eq wrap', html: `Q = (${U.sig(M, 3)})${x > 1 ? '<sup>' + x + '</sup>' : ''}(${U.sig(A, 3)})${y > 1 ? '<sup>' + y + '</sup>' : ''} = <b>${U.sig(Q, 3)}</b> &nbsp; vs &nbsp; K<sub>sp</sub> = ${U.sig(Ksp, 2)}` }),
          U.callout(Q > Ksp ? `<b>Q &gt; K<sub>sp</sub>: a precipitate of ${U.chem(f)} forms</b> until the ion concentrations drop to the K<sub>sp</sub> level.` : `<b>Q &lt; K<sub>sp</sub>: no precipitate.</b> The solution is unsaturated.`, Q > Ksp ? 'bad' : 'good')));
      }
      upd();
    }
  },
});
