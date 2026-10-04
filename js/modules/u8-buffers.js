'use strict';
App.register({
  id: 'buffers', unit: 8, sym: 'Bf', title: 'Buffers & Speciation',
  desc: 'Build a buffer, hit it with strong acid or base, and see how pH relates to pKa through Henderson–Hasselbalch and speciation plots.',
  tags: ['buffer', 'henderson-hasselbalch', 'buffer capacity', 'conjugate acid-base pair', 'pka', 'speciation', 'fraction', 'protonated', 'deprotonated', 'ph and pka'],
  keyIdeas: [
    'A buffer contains a weak acid and its conjugate base (or weak base and conjugate acid) in similar amounts. It resists pH change.',
    'Added H<sup>+</sup> reacts with A<sup>−</sup>; added OH<sup>−</sup> reacts with HA. The pH changes only slightly.',
    'Henderson–Hasselbalch: <b>pH = pK<sub>a</sub> + log([A<sup>−</sup>]/[HA])</b>.',
    'Buffer capacity is larger when the concentrations are higher and when [HA] ≈ [A<sup>−</sup>]. Choose an acid with pK<sub>a</sub> close to the target pH.',
    'If pH &lt; pK<sub>a</sub>, the protonated form (HA) dominates; if pH &gt; pK<sub>a</sub>, the deprotonated form (A<sup>−</sup>) dominates.',
  ],
  render(el, scope) {
    const h = U.h;
    const PAIRS = [
      { name: 'Acetic acid / acetate', HA: 'CH₃COOH', A: 'CH₃COO⁻', pKa: 4.74 },
      { name: 'Ammonium / ammonia', HA: 'NH₄⁺', A: 'NH₃', pKa: 9.25 },
      { name: 'Dihydrogen phosphate / hydrogen phosphate', HA: 'H₂PO₄⁻', A: 'HPO₄²⁻', pKa: 7.21 },
      { name: 'Carbonic acid / bicarbonate (blood)', HA: 'H₂CO₃', A: 'HCO₃⁻', pKa: 6.37 },
      { name: 'Hydrofluoric acid / fluoride', HA: 'HF', A: 'F⁻', pKa: 3.17 },
    ];
    U.tabs(el, [{ label: 'Buffer lab', render: lab }, { label: 'Speciation (pH vs. pKa)', render: spec }, { label: 'Design a buffer', render: design }], scope, { key: 'buffers' });

    function lab(b, s) {
      let pi = 0, nHA = 0.10, nA = 0.10, add = 0, V = 1.0;
      const sel = U.select({ label: 'Buffer system', options: PAIRS.map((p, i) => ({ value: i, label: `${p.name} (pKa ${p.pKa})` })), value: pi, onChange: v => { pi = +v; upd(); } });
      const s1 = U.slider({ label: 'Moles of weak acid HA', min: 0.01, max: 0.5, step: 0.01, value: nHA, unit: 'mol', fmt: v => v.toFixed(2), onInput: v => { nHA = v; upd(); } });
      const s2 = U.slider({ label: 'Moles of conjugate base A⁻', min: 0.01, max: 0.5, step: 0.01, value: nA, unit: 'mol', fmt: v => v.toFixed(2), onInput: v => { nA = v; upd(); } });
      const s3 = U.slider({ label: 'Add strong acid (−) or strong base (+)', min: -0.3, max: 0.3, step: 0.005, value: add, unit: 'mol', fmt: v => (v > 0 ? '+' : '') + v.toFixed(3) + (v < 0 ? ' HCl' : v > 0 ? ' NaOH' : ''), onInput: v => { add = v; upd(); } });
      const stats = U.stats([['b', 'Buffer pH'], ['w', 'Unbuffered water pH'], ['r', '[A⁻]/[HA]']]);
      const out = h('div', { class: 'stack' });
      const cv = U.canvas(null, { aspect: 1.6, scope: s, draw });
      const bars = U.canvas(null, { aspect: 1.9, scope: s, draw: drawBars });
      b.append(h('div', { class: 'grid-viz' }, h('div', { class: 'stack' }, U.panel('pH as strong acid or base is added (1.00 L)', cv.wrap), out), h('div', { class: 'stack' }, U.panel('Make the buffer', sel.el, s1.el, s2.el, s3.el), stats.el, U.panel('Moles after reaction', bars.wrap))));
      const Ka = () => Math.pow(10, -PAIRS[pi].pKa);
      const bufferPH = x => { // exact: weak acid C_HA, base C_A, plus strong base x (negative = strong acid)
        const Cha = nHA / V, Ca = nA / V, K = Ka();
        const Ctot = Cha + Ca, Cb = Ca + Math.max(0, x) / V, Cs = Math.max(0, -x) / V;
        const H = AB.solveH(hh => hh + Cb - AB.Kw / hh - Ctot * K / (K + hh) - Cs);
        return -Math.log10(H);
      };
      const waterPH = x => AB.pHstrong(Math.max(0, -x) / V, Math.max(0, x) / V);
      function draw(c, w, H) {
        const t = U.theme();
        const P = new U.Plot(c, w, H, { x: [-0.3, 0.3], y: [0, 14], xlabel: '← mol HCl added | mol NaOH added →', ylabel: 'pH', yticks: [0, 2, 4, 6, 8, 10, 12, 14] });
        P.axes();
        P.fn(waterPH, t.ink3, 2, [5, 4], 300);
        P.fn(bufferPH, t.accent, 3, null, 300);
        P.vline(0, U.alpha(t.ink3, 0.5), [2, 3]);
        P.dot(add, bufferPH(add), t.red, 6); P.dot(add, waterPH(add), t.ink3, 5);
        P.label('buffer', 0.28, bufferPH(0.28), t.accent, { align: 'right', dy: -8 });
        P.label('pure water', -0.28, waterPH(-0.28), t.ink3, { dy: -8 });
        c.fillStyle = U.alpha(t.good, 0.08); c.fillRect(P.X(-nA), P.T, P.X(nHA) - P.X(-nA), P.B - P.T);
        P.label('buffer capacity range', 0, 13.3, t.good, { align: 'center' });
      }
      function drawBars(c, w, H) {
        const t = U.theme(), p = PAIRS[pi];
        let ha = nHA, a = nA, xs = 0, xsLabel = '';
        if (add > 0) { const r = Math.min(add, ha); ha -= r; a += r; xs = add - r; xsLabel = 'excess OH⁻'; }
        if (add < 0) { const r = Math.min(-add, a); a -= r; ha += r; xs = -add - r; xsLabel = 'excess H⁺'; }
        const items = [[p.HA, ha, t.red], [p.A, a, t.blue]].concat(xs > 1e-9 ? [[xsLabel, xs, t.orange]] : []);
        const mx = Math.max(0.5, ...items.map(i => i[1]));
        items.forEach(([n, v, col], i) => {
          const y = 18 + i * 40, L = 110, Wd = w - L - 60;
          U.text(c, n, L - 8, y + 16, { align: 'right', weight: 600, size: 13 });
          c.fillStyle = col; U.roundRect(c, L, y, Math.max(2, Wd * v / mx), 24, 5); c.fill();
          U.text(c, v.toFixed(3), L + Wd * v / mx + 6, y + 16, { mono: true, size: 11 });
        });
      }
      function upd() {
        const p = PAIRS[pi], pH = bufferPH(add), pw = waterPH(add);
        let ha = nHA, a = nA;
        if (add > 0) { const r = Math.min(add, ha); ha -= r; a += r; } else if (add < 0) { const r = Math.min(-add, a); a -= r; ha += r; }
        stats.set('b', pH.toFixed(2)); stats.set('w', pw.toFixed(2)); stats.set('r', ha > 1e-9 ? (a / ha).toFixed(3) : '∞');
        cv.redraw(); bars.redraw();
        U.clear(out);
        out.appendChild(h('div', { class: 'eq wrap', html: `pH = pK<sub>a</sub> + log(n<sub>A⁻</sub>/n<sub>HA</sub>) = ${p.pKa} + log(${a.toFixed(3)}/${ha.toFixed(3)}) = <b>${ha > 1e-9 && a > 1e-9 ? (p.pKa + Math.log10(a / ha)).toFixed(2) : '—'}</b>` }));
        if (add > 0) out.appendChild(U.callout(`The added OH⁻ reacts with the weak acid: ${p.HA} + OH⁻ → ${p.A} + H₂O. ${add > nHA ? '<b>The buffer is exhausted</b>: all HA is used up, so excess OH⁻ makes the pH climb.' : 'HA absorbs it, so the pH barely changes.'}`, add > nHA ? 'bad' : 'good'));
        else if (add < 0) out.appendChild(U.callout(`The added H⁺ reacts with the conjugate base: ${p.A} + H⁺ → ${p.HA}. ${-add > nA ? '<b>The buffer is exhausted</b>: all A⁻ is used up, so excess H⁺ makes the pH drop.' : 'A⁻ absorbs it, so the pH barely changes.'}`, -add > nA ? 'bad' : 'good'));
        else out.appendChild(U.callout(`Compare the flat blue buffer curve with the dashed line for pure water. Adding just 0.01 mol HCl to 1 L of water drops the pH to 2, but barely moves the buffer.`));
      }
      upd();
    }

    function spec(b, s) {
      const ACIDS = [['Acetic acid', [1.8e-5], ['HA', 'A⁻']], ['Ammonium', [5.6e-10], ['NH₄⁺', 'NH₃']], ['Carbonic acid', [4.3e-7, 4.8e-11], ['H₂CO₃', 'HCO₃⁻', 'CO₃²⁻']], ['Phosphoric acid', [7.5e-3, 6.2e-8, 4.8e-13], ['H₃PO₄', 'H₂PO₄⁻', 'HPO₄²⁻', 'PO₄³⁻']], ['Amino acid (glycine)', [4.5e-3, 1.7e-10], ['⁺H₃N–CH₂–COOH', '⁺H₃N–CH₂–COO⁻', 'H₂N–CH₂–COO⁻']]];
      let ai = 0, pH = 4.74;
      const sel = U.select({ label: 'Acid', options: ACIDS.map((a, i) => ({ value: i, label: a[0] })), value: ai, onChange: v => { ai = +v; cv.redraw(); upd(); } });
      const sl = U.slider({ label: 'pH', min: 0, max: 14, step: 0.05, value: pH, fmt: v => v.toFixed(2), onInput: v => { pH = v; cv.redraw(); upd(); } });
      const out = h('div');
      let P = null;
      const cv = U.canvas(null, { aspect: 1.8, scope: s, drag: true, draw });
      U.drag(cv, { down: p => P && P.inside(p.x, p.y), move: p => { pH = U.clamp(P.invX(p.x), 0, 14); sl.set(pH); cv.redraw(); upd(); } }, s);
      b.append(h('div', { class: 'grid-viz' }, U.panel('Fraction of each form vs. pH', cv.wrap, sl.el), h('div', { class: 'stack' }, U.panel('Choose', sel.el), out)));
      const cols = () => { const t = U.theme(); return [t.red, t.orange, t.green, t.blue]; };
      function draw(c, w, H) {
        const t = U.theme(), [name, Ka, names] = ACIDS[ai];
        P = new U.Plot(c, w, H, { x: [0, 14], y: [0, 1.05], xlabel: 'pH', ylabel: 'Fraction', xticks: [0, 2, 4, 6, 8, 10, 12, 14] });
        P.axes();
        names.forEach((n, i) => { P.fn(x => AB.alphas(Math.pow(10, -x), Ka)[i], cols()[i], 2.8); });
        Ka.forEach((k, i) => { const pk = -Math.log10(k); P.vline(pk, U.alpha(t.ink3, 0.6), [3, 4], 'pKa' + (Ka.length > 1 ? i + 1 : '') + ' = ' + pk.toFixed(2)); });
        P.vline(pH, t.ink, [1, 0]);
        const a = AB.alphas(Math.pow(10, -pH), Ka);
        a.forEach((f, i) => P.dot(pH, f, cols()[i], 5));
      }
      function upd() {
        const [name, Ka, names] = ACIDS[ai], a = AB.alphas(Math.pow(10, -pH), Ka);
        const dom = a.indexOf(Math.max(...a));
        U.clear(out);
        out.append(U.panel('At pH ' + pH.toFixed(2), ...names.map((n, i) => h('div', { class: 'row', style: { flexWrap: 'nowrap' } }, h('span', { class: 'swatch', style: { background: cols()[i] } }), h('span', { class: 'grow', style: { fontWeight: i === dom ? 700 : 400 } }, n), h('span', { class: 'mono' }, (a[i] * 100).toFixed(1) + '%')))),
          U.callout(`Dominant form: <b>${names[dom]}</b>. ${Ka.map((k, i) => { const pk = -Math.log10(k); return pH < pk - 0.05 ? `pH &lt; pK<sub>a${Ka.length > 1 ? i + 1 : ''}</sub> (${pk.toFixed(2)}): the more protonated form wins.` : pH > pk + 0.05 ? `pH &gt; pK<sub>a${Ka.length > 1 ? i + 1 : ''}</sub> (${pk.toFixed(2)}): the less protonated form wins.` : `pH ≈ pK<sub>a${Ka.length > 1 ? i + 1 : ''}</sub>: the two forms are equal (50/50).`; }).join(' ')}`));
      }
      upd();
    }

    function design(b) {
      let target = 7.4, conc = 0.2;
      const st = U.slider({ label: 'Target pH', min: 2, max: 12, step: 0.05, value: target, fmt: v => v.toFixed(2), onInput: v => { target = v; upd(); } });
      const sc = U.slider({ label: 'Total buffer concentration', min: 0.05, max: 1, step: 0.05, value: conc, unit: 'M', fmt: v => v.toFixed(2), onInput: v => { conc = v; upd(); } });
      const out = h('div', { class: 'stack' });
      b.append(h('div', { class: 'grid2' }, U.panel('Goal', st.el, sc.el), out));
      function upd() {
        const best = PAIRS.slice().sort((x, y) => Math.abs(x.pKa - target) - Math.abs(y.pKa - target))[0];
        const ratio = Math.pow(10, target - best.pKa), fa = ratio / (1 + ratio);
        U.clear(out);
        out.append(U.panel('Recommended buffer', h('p', { html: `Use <b>${best.name}</b> (pK<sub>a</sub> = ${best.pKa}), the closest pK<sub>a</sub> to pH ${target.toFixed(2)}.` }),
          h('div', { class: 'eq wrap', html: `[A⁻]/[HA] = 10<sup>(pH − pKa)</sup> = 10<sup>${(target - best.pKa).toFixed(2)}</sup> = <b>${ratio.toFixed(3)}</b>` }),
          U.table(['Component', 'Concentration (M)'], [[best.HA, ((1 - fa) * conc).toFixed(3)], [best.A, (fa * conc).toFixed(3)]], { num: [1] }),
          U.callout(Math.abs(target - best.pKa) <= 1 ? 'The target is within ±1 of pK<sub>a</sub>, so this buffer will have good capacity against both acid and base.' : 'The target is more than 1 unit from any pK<sub>a</sub> listed, so the buffer will have poor capacity in one direction.', Math.abs(target - best.pKa) <= 1 ? 'good' : 'warn')));
      }
      upd();
    }
  },
});
