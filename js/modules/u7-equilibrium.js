'use strict';
App.register({
  id: 'equilibrium', unit: 7, sym: 'Eq', title: 'Dynamic Equilibrium & Q vs. K',
  desc: 'Watch forward and reverse rates become equal, compare Q with K to predict the direction of shift, and manipulate K.',
  tags: ['equilibrium', 'dynamic equilibrium', 'equilibrium constant', 'k', 'kc', 'kp', 'reaction quotient', 'q', 'q vs k', 'reversible', 'manipulating k'],
  keyIdeas: [
    'At equilibrium the forward and reverse rates are <b>equal</b>; concentrations stop changing, but reactions continue in both directions.',
    'K = [products]<sup>coefficients</sup> / [reactants]<sup>coefficients</sup>. Pure solids and liquids are left out.',
    'K ≫ 1: products favored at equilibrium. K ≪ 1: reactants favored.',
    'Q has the same form as K but uses current concentrations. Q &lt; K → shifts right (toward products). Q &gt; K → shifts left. Q = K → at equilibrium.',
    'Reverse a reaction → 1/K. Multiply coefficients by n → K<sup>n</sup>. Add reactions → multiply their K values.',
  ],
  render(el, scope) {
    const h = U.h;
    U.tabs(el, [{ label: 'Dynamic equilibrium', render: dynamic }, { label: 'Q vs. K', render: qk }, { label: 'Manipulating K', render: manip }], scope, { key: 'equil' });

    function dynamic(b, s) {
      let kf = 0.6, kr = 0.3, N = 80, P = [], hist = [], time = 0, fwd = [], rev = [];
      const sf = U.slider({ label: 'Forward rate constant k_f', min: 0.05, max: 1.5, step: 0.05, value: kf, fmt: v => v.toFixed(2), onInput: v => { kf = v; } });
      const sr = U.slider({ label: 'Reverse rate constant k_r', min: 0.05, max: 1.5, step: 0.05, value: kr, fmt: v => v.toFixed(2), onInput: v => { kr = v; } });
      const start = U.seg({ options: [{ value: 'A', label: 'Start with all A' }, { value: 'B', label: 'Start with all B' }, { value: 'mix', label: '50/50' }], value: 'A', onChange: v => reset(v) });
      const stats = U.stats([['a', '[A] (particles)'], ['b', '[B] (particles)'], ['q', 'Q = [B]/[A]'], ['k', 'K = k_f/k_r']]);
      const box = U.canvas(null, { aspect: 1.5, scope: s });
      const gr = U.canvas(null, { aspect: 2.2, scope: s });
      const rt = U.canvas(null, { aspect: 2.2, scope: s });
      b.append(h('div', { class: 'grid-viz' }, h('div', { class: 'stack' }, U.panel('A ⇌ B', box.wrap), U.panel('Concentrations', gr.wrap), U.panel('Forward vs. reverse rate (conversions per second)', rt.wrap)),
        h('div', { class: 'stack' }, U.panel('Settings', sf.el, sr.el, start.el), stats.el, U.callout('Even after the amounts level off, particles keep switching. Watch the flashes: forward (blue → red) and reverse (red → blue) events happen at the same rate at equilibrium.'))));
      function reset(mode = 'A') { P = Array.from({ length: N }, (_, i) => ({ t: mode === 'A' ? 'A' : mode === 'B' ? 'B' : (i % 2 ? 'A' : 'B'), x: Math.random(), y: Math.random(), vx: U.rand(-1, 1), vy: U.rand(-1, 1), fl: 0 })); hist = []; time = 0; fwd = []; rev = []; }
      reset();
      s.loop(dt => {
        time += dt;
        P.forEach(p => {
          p.x += p.vx * dt * 0.12; p.y += p.vy * dt * 0.12;
          if (p.x < 0.02 || p.x > 0.98) p.vx *= -1; if (p.y < 0.03 || p.y > 0.97) p.vy *= -1;
          p.x = U.clamp(p.x, 0.02, 0.98); p.y = U.clamp(p.y, 0.03, 0.97);
          const r = Math.random();
          if (p.t === 'A' && r < kf * dt * 0.5) { p.t = 'B'; p.fl = 0.5; fwd.push(time); }
          else if (p.t === 'B' && r < kr * dt * 0.5) { p.t = 'A'; p.fl = 0.5; rev.push(time); }
          p.fl = Math.max(0, p.fl - dt);
        });
        fwd = fwd.filter(x => time - x < 2); rev = rev.filter(x => time - x < 2);
        const nA = P.filter(p => p.t === 'A').length, nB = N - nA;
        if (!hist.length || time - hist[hist.length - 1].t > 0.15) hist.push({ t: time, A: nA, B: nB, f: fwd.length / 2, r: rev.length / 2 });
        if (hist.length > 400) hist.shift();
        const c = box.ctx, w = box.w, H = box.h, t = U.theme();
        c.clearRect(0, 0, w, H);
        P.forEach(p => {
          if (p.fl > 0) { c.beginPath(); c.arc(p.x * w, p.y * H, 13 * p.fl / 0.5 + 6, 0, 7); c.fillStyle = U.alpha(t.yellow, p.fl); c.fill(); }
          U.drawAtom(c, p.x * w, p.y * H, 7, 'X', { color: p.t === 'A' ? t.blue : t.red, label: false });
        });
        stats.set('a', nA); stats.set('b', nB); stats.set('q', nA ? (nB / nA).toFixed(2) : '∞'); stats.set('k', (kf / kr).toFixed(2));
        const t0 = hist[0].t, t1 = Math.max(t0 + 15, hist[hist.length - 1].t);
        const g = gr.ctx; g.clearRect(0, 0, gr.w, gr.h);
        const P1 = new U.Plot(g, gr.w, gr.h, { x: [t0, t1], y: [0, N], xlabel: 'time (s)', ylabel: 'particles', pad: { b: 36 } });
        P1.axes(); P1.line(hist.map(q => [q.t, q.A]), t.blue, 2.4); P1.line(hist.map(q => [q.t, q.B]), t.red, 2.4);
        P1.hline(N * kr / (kf + kr), U.alpha(t.blue, 0.5), [3, 4]); P1.hline(N * kf / (kf + kr), U.alpha(t.red, 0.5), [3, 4]);
        const g2 = rt.ctx; g2.clearRect(0, 0, rt.w, rt.h);
        const P2 = new U.Plot(g2, rt.w, rt.h, { x: [t0, t1], y: [0, Math.max(10, ...hist.map(q => Math.max(q.f, q.r))) * 1.1], xlabel: 'time (s)', ylabel: 'rate', pad: { b: 36 } });
        P2.axes(); P2.line(hist.map(q => [q.t, q.f]), t.blue, 2); P2.line(hist.map(q => [q.t, q.r]), t.red, 2);
        U.text(g2, 'forward', P2.R - 70, P2.T + 12, { color: t.blue, size: 11, weight: 600 }); U.text(g2, 'reverse', P2.R - 70, P2.T + 26, { color: t.red, size: 11, weight: 600 });
      });
    }

    function qk(b, s) {
      const RX = [
        { eq: 'N2(g) + 3H2(g) <=> 2NH3(g)', R: [['N2', 1], ['H2', 3]], P: [['NH3', 2]], K: 0.105, c: [0.5, 1.0, 0.2] },
        { eq: '2SO2(g) + O2(g) <=> 2SO3(g)', R: [['SO2', 2], ['O2', 1]], P: [['SO3', 2]], K: 280, c: [0.2, 0.1, 0.5] },
        { eq: 'H2(g) + I2(g) <=> 2HI(g)', R: [['H2', 1], ['I2', 1]], P: [['HI', 2]], K: 50.5, c: [0.1, 0.1, 0.5] },
        { eq: 'N2O4(g) <=> 2NO2(g)', R: [['N2O4', 1]], P: [['NO2', 2]], K: 0.0046, c: [0.1, 0.02] },
      ];
      let ri = 0, conc = RX[0].c.slice();
      const sel = U.select({ label: 'Reaction', options: RX.map((r, i) => ({ value: i, label: U.chemText(r.eq) })), value: ri, onChange: v => { ri = +v; conc = RX[ri].c.slice(); build(); } });
      const sliders = h('div', { class: 'stack' });
      const out = h('div', { class: 'stack' });
      const cv = U.canvas(null, { height: 130, scope: s, draw });
      b.append(h('div', { class: 'grid-viz' }, h('div', { class: 'stack' }, U.panel('Where is Q relative to K? (log scale)', cv.wrap), out), U.panel('Current concentrations', sel.el, sliders)));
      const species = () => RX[ri].R.concat(RX[ri].P);
      const Q = () => { const r = RX[ri]; let num = 1, den = 1; r.P.forEach(([f, n], i) => num *= Math.pow(conc[r.R.length + i], n)); r.R.forEach(([f, n], i) => den *= Math.pow(conc[i], n)); return num / den; };
      function build() {
        U.clear(sliders);
        species().forEach(([f], i) => { const sl = U.logSlider({ label: `[${U.chemText(f)}]`, min: 0.001, max: 5, value: conc[i], unit: 'M', fmt: v => U.sig(v, 2), onInput: v => { conc[i] = v; upd(); } }); sliders.appendChild(sl.el); });
        upd();
      }
      function draw(c, w, H) {
        const t = U.theme(), K = RX[ri].K, q = Q();
        const lo = Math.floor(Math.min(Math.log10(K), Math.log10(q)) - 2), hi = Math.ceil(Math.max(Math.log10(K), Math.log10(q)) + 2);
        const X = v => 20 + (Math.log10(v) - lo) / (hi - lo) * (w - 40);
        c.strokeStyle = t.line; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.moveTo(20, 70); c.lineTo(w - 20, 70); c.stroke();
        for (let e = lo; e <= hi; e++) U.text(c, '10' + U.supText(e), X(Math.pow(10, e)), 100, { align: 'center', size: 10, mono: true, color: t.ink3 });
        c.fillStyle = t.good; c.fillRect(X(K) - 2, 50, 4, 40); U.text(c, 'K', X(K), 44, { align: 'center', weight: 700, color: t.good });
        c.beginPath(); c.arc(X(q), 70, 9, 0, 7); c.fillStyle = t.accent; c.fill(); U.text(c, 'Q', X(q), 74, { align: 'center', weight: 700, size: 11, color: t.accent === '#6b9dff' ? '#0c1117' : '#fff' });
        if (Math.abs(Math.log10(q / K)) > 0.02) { U.arrow(c, X(q), 30, X(q) + (q < K ? 40 : -40), 30, t.orange, 2.5); U.text(c, q < K ? 'shifts right →' : '← shifts left', X(q) + (q < K ? 46 : -46), 34, { align: q < K ? 'left' : 'right', color: t.orange, size: 11, weight: 600 }); }
      }
      function upd() {
        const r = RX[ri], q = Q(), K = r.K;
        const expr = r.P.map(([f, n]) => `[${U.chem(f)}]${n > 1 ? '<sup>' + n + '</sup>' : ''}`).join('') + ' / ' + r.R.map(([f, n]) => `[${U.chem(f)}]${n > 1 ? '<sup>' + n + '</sup>' : ''}`).join('');
        U.clear(out);
        const ratio = q / K;
        out.append(h('div', { class: 'eq', html: U.chem(r.eq) }), h('div', { class: 'eq', html: `Q = ${expr} = <b>${U.sig(q, 3)}</b> &nbsp;&nbsp; K = ${U.sig(K, 3)}` }),
          U.callout(Math.abs(Math.log10(ratio)) < 0.02 ? '<b>Q = K:</b> the system is at equilibrium. No net shift.' : ratio < 1 ? '<b>Q &lt; K:</b> too few products compared with equilibrium. The forward reaction is faster until Q rises to K, so the reaction <b>shifts right</b>.' : '<b>Q &gt; K:</b> too many products. The reverse reaction is faster, so the reaction <b>shifts left</b>.', Math.abs(Math.log10(ratio)) < 0.02 ? 'good' : 'warn'));
        cv.redraw();
      }
      build();
    }

    function manip(b) {
      let K = 4.0e-3, rev = false, n = 1;
      const kIn = U.numInput({ label: 'K for N₂O₄(g) ⇌ 2NO₂(g)', value: K, onInput: v => { K = v; upd(); } });
      const rv = U.check({ label: 'Reverse the reaction', onChange: v => { rev = v; upd(); } });
      const ns = U.seg({ options: [0.5, 1, 2, 3].map(x => ({ value: x, label: '×' + (x === 0.5 ? '½' : x) })), value: 1, onChange: v => { n = v; upd(); } });
      const out = h('div', { class: 'stack' });
      b.append(h('div', { class: 'grid2' }, U.panel('Change the reaction', kIn.el, rv.el, h('div', { class: 'field' }, h('span', { class: 'lbl' }, 'Multiply coefficients by'), ns.el)), out));
      function upd() {
        const co = x => x === 0.5 ? '½' : x === 1 ? '' : x;
        const L = rev ? `${co(2 * n) || ''}NO<sub>2</sub>(g)` : `${co(n)}N<sub>2</sub>O<sub>4</sub>(g)`, R = rev ? `${co(n)}N<sub>2</sub>O<sub>4</sub>(g)` : `${co(2 * n)}NO<sub>2</sub>(g)`;
        const Kn = Math.pow(rev ? 1 / K : K, n);
        U.clear(out);
        out.append(U.panel('New equilibrium constant', h('div', { class: 'eq', html: `${L} ⇌ ${R}` }),
          h('div', { class: 'eq', html: `K′ = ${rev ? '(1/K)' : 'K'}${n !== 1 ? '<sup>' + (n === 0.5 ? '½' : n) + '</sup>' : ''} = <b>${U.sig(Kn, 3)}</b>` }),
          U.callout(Kn > 1 ? 'K′ > 1: products are favored at equilibrium.' : 'K′ < 1: reactants are favored at equilibrium.')));
      }
      upd();
    }
  },
});
