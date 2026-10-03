'use strict';
App.register({
  id: 'rate-laws', unit: 5, sym: 'Rl', title: 'Rate Laws & Half-Life',
  desc: 'Compare zero-, first- and second-order kinetics with linear plots and half-lives, and practice the method of initial rates.',
  tags: ['rate law', 'integrated rate law', 'order of reaction', 'zero order', 'first order', 'second order', 'half-life', 'rate constant', 'initial rates', 'ln[a]', '1/[a]', 'radioactive decay'],
  keyIdeas: [
    'Rate law: rate = k[A]<sup>m</sup>[B]<sup>n</sup>. Orders come from experiment, not from the balanced equation (unless the step is elementary).',
    'Zero order: [A] vs t is linear (slope −k). First order: ln[A] vs t is linear (slope −k). Second order: 1/[A] vs t is linear (slope +k).',
    'First-order half-life t<sub>½</sub> = 0.693/k is constant, independent of concentration (radioactive decay is first order).',
    'Units of k depend on the overall order: M/s (0), s<sup>−1</sup> (1), M<sup>−1</sup>s<sup>−1</sup> (2).',
    'Method of initial rates: compare two experiments where only one concentration changes. If doubling [A] doubles the rate, the order in A is 1; if it quadruples, the order is 2.',
  ],
  render(el, scope) {
    const h = U.h;
    U.tabs(el, [{ label: 'Integrated rate laws', render: integrated }, { label: 'Method of initial rates', render: initial }], scope, { key: 'ratelaws' });

    function integrated(b, s) {
      let order = 1, k = 0.1, A0 = 1.0;
      const seg = U.seg({ options: [{ value: 0, label: 'Zero order' }, { value: 1, label: 'First order' }, { value: 2, label: 'Second order' }], value: order, onChange: v => { order = v; upd(); } });
      const sk = U.slider({ label: 'Rate constant k', min: 0.01, max: 0.5, step: 0.01, value: k, onInput: v => { k = v; upd(); } });
      const sa = U.slider({ label: 'Initial [A]₀', min: 0.2, max: 2, step: 0.1, value: A0, unit: 'M', fmt: v => v.toFixed(1), onInput: v => { A0 = v; upd(); } });
      const stats = U.stats([['law', 'Rate law'], ['int', 'Integrated form'], ['half', 'Half-life'], ['u', 'Units of k']]);
      const plots = [0, 1, 2].map(i => U.canvas(null, { aspect: 1.15, scope: s, draw: (c, w, H) => drawPlot(c, w, H, i) }));
      b.append(U.panel(null, h('div', { class: 'controls' }, h('div', { class: 'field' }, h('span', { class: 'lbl' }, 'Order in A'), seg.el), sk.el, sa.el)),
        h('div', { class: 'grid3' }, ...plots.map((p, i) => U.panel(['[A] vs t', 'ln[A] vs t', '1/[A] vs t'][i], p.wrap))), stats.el,
        U.callout('The plot that gives a straight line identifies the order. Highlighted: the linear plot for the order you chose. Dots mark successive half-lives.'));
      const conc = t => order === 0 ? Math.max(0, A0 - k * t) : order === 1 ? A0 * Math.exp(-k * t) : 1 / (1 / A0 + k * t);
      const tEnd = () => order === 0 ? A0 / k * 1.2 : order === 1 ? 5 * 0.693 / k : 7 / (k * A0);
      function drawPlot(c, w, H, i) {
        const t = U.theme(), te = tEnd();
        const f = [x => conc(x), x => { const v = conc(x); return v > 1e-6 ? Math.log(v) : NaN; }, x => { const v = conc(x); return v > 1e-6 ? 1 / v : NaN; }][i];
        const vals = []; for (let j = 0; j <= 100; j++) { const v = f(te * j / 100); if (isFinite(v)) vals.push(v); }
        let lo = Math.min(...vals), hi = Math.max(...vals);
        if (i === 2 && order === 0) hi = Math.min(hi, 40 / A0);
        if (hi - lo < 1e-6) hi = lo + 1;
        const P = new U.Plot(c, w, H, { x: [0, te], y: [i === 0 ? 0 : lo - (hi - lo) * 0.05, hi + (hi - lo) * 0.08], xlabel: 'time (s)', pad: { l: 46 } });
        P.axes();
        const lin = i === order;
        P.fn(f, lin ? t.good : t.ink3, lin ? 3 : 2);
        if (lin) U.text(c, i === 0 ? 'slope = −k' : i === 1 ? 'slope = −k' : 'slope = +k', P.R - 6, P.T + 14, { align: 'right', color: t.good, weight: 700, size: 12 });
        else U.text(c, 'curved → not this order', P.R - 6, P.T + 14, { align: 'right', color: t.ink3, size: 11 });
        // half-lives
        let tt = 0, cur = A0;
        for (let n = 0; n < 4; n++) {
          const th = order === 0 ? cur / (2 * k) : order === 1 ? 0.693 / k : 1 / (k * cur);
          tt += th; cur /= 2;
          if (tt > te) break;
          const v = f(tt); if (isFinite(v)) P.dot(tt, v, t.orange, 4);
        }
      }
      function upd() {
        seg.set(order);
        plots.forEach(p => p.redraw());
        stats.set('law', ['rate = k', 'rate = k[A]', 'rate = k[A]²'][order]);
        stats.set('int', ['[A] = [A]₀ − kt', 'ln[A] = ln[A]₀ − kt', '1/[A] = 1/[A]₀ + kt'][order]);
        stats.set('half', [`[A]₀/2k = ${(A0 / (2 * k)).toFixed(2)} s (shrinks)`, `0.693/k = ${(0.693 / k).toFixed(2)} s (constant)`, `1/(k[A]₀) = ${(1 / (k * A0)).toFixed(2)} s (grows)`][order]);
        stats.set('u', ['M s⁻¹', 's⁻¹', 'M⁻¹ s⁻¹'][order]);
      }
      upd();
    }

    function initial(b, s) {
      let prob, shown = false;
      const out = h('div', { class: 'stack' });
      b.append(U.panel('Find the rate law for 2A + B → products', h('p', { class: 'small muted' }, 'Use the experiments below. Pick the order with respect to each reactant, then check.'), out));
      function make() {
        const m = U.randInt(0, 2), n = U.randInt(0, 2), k = +(U.rand(0.1, 9)).toPrecision(2);
        const base = [+(U.pick([0.1, 0.15, 0.2, 0.25])), +(U.pick([0.1, 0.2, 0.3]))];
        const exps = [[base[0], base[1]], [base[0] * 2, base[1]], [base[0], base[1] * U.pick([2, 3])], [base[0] * 3, base[1] * 2]];
        prob = { m, n, k, exps: exps.map(([a, c]) => [+a.toFixed(3), +c.toFixed(3), k * Math.pow(a, m) * Math.pow(c, n)]) };
        shown = false; render();
      }
      function render() {
        U.clear(out);
        const p = prob;
        out.appendChild(U.table(['Experiment', '[A]₀ (M)', '[B]₀ (M)', 'Initial rate (M/s)'], p.exps.map((e, i) => [i + 1, e[0], e[1], U.sig(e[2], 3)]), { num: [1, 2, 3] }));
        const sm = U.seg({ options: [0, 1, 2].map(v => ({ value: v, label: 'order ' + v })), value: -1 });
        const sn = U.seg({ options: [0, 1, 2].map(v => ({ value: v, label: 'order ' + v })), value: -1 });
        const res = h('div');
        out.append(h('div', { class: 'grid2' }, h('div', { class: 'field' }, h('span', { class: 'lbl' }, 'Order in A'), sm.el), h('div', { class: 'field' }, h('span', { class: 'lbl' }, 'Order in B'), sn.el)),
          h('div', { class: 'row' }, U.btn('Check', () => {
            U.clear(res);
            const ok = sm.value === p.m && sn.value === p.n;
            res.appendChild(U.callout(ok ? `Correct! rate = k[A]${sup(p.m)}[B]${sup(p.n)}` : 'Not quite. Compare experiments 1 and 2 (only [A] changes), then 1 and 3 (only [B] changes).', ok ? 'good' : 'bad'));
          }, 'primary'), U.btn('Show solution', () => { shown = true; render(); }), U.btn('New problem', make)), res);
        if (shown) {
          const e = p.exps, rA = e[1][2] / e[0][2], fA = e[1][0] / e[0][0], rB = e[2][2] / e[0][2], fB = e[2][1] / e[0][1];
          out.appendChild(U.panel('Solution',
            h('p', { html: `Exp 1 → 2: [A] × ${fA.toFixed(0)}, rate × ${rA.toFixed(2)}. Since ${fA.toFixed(0)}<sup>m</sup> = ${rA.toFixed(2)}, <b>m = ${p.m}</b>.` }),
            h('p', { html: `Exp 1 → 3: [B] × ${fB.toFixed(0)}, rate × ${rB.toFixed(2)}. Since ${fB.toFixed(0)}<sup>n</sup> = ${rB.toFixed(2)}, <b>n = ${p.n}</b>.` }),
            h('div', { class: 'eq', html: `rate = k[A]${sup(p.m)}[B]${sup(p.n)}; k = rate₁ / ([A]₁${sup(p.m)}[B]₁${sup(p.n)}) = ${U.sig(p.k, 2)} (overall order ${p.m + p.n})` })));
        }
      }
      const sup = x => x === 1 ? '' : x === 0 ? '⁰' : '²';
      make();
    }
  },
});
