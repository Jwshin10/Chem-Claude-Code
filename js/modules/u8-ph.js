'use strict';
/* Shared acid-base math */
const AB = {
  Kw: 1e-14,
  /** solve charge balance f(H) = 0 for H in [1e-15, 10] using bisection in log space; f increases with H */
  solveH(f) { const lh = U.bisect(l => f(Math.pow(10, l)), -15.5, 1.5, 120); return Math.pow(10, lh); },
  /** fractions alpha_i (i protons removed) for polyprotic acid with Ka list at [H+] */
  alphas(H, Ka) {
    const terms = [1]; let p = 1;
    for (let i = 0; i < Ka.length; i++) { p *= Ka[i]; terms.push(p / Math.pow(H, i + 1)); }
    const s = terms.reduce((a, b) => a + b, 0);
    return terms.map(t => t / s);
  },
  /** pH of weak acid C with Ka list (+ optional strong base Cb, strong acid Ca) */
  pHacid(C, Ka, Cb = 0, Ca = 0) {
    const H = this.solveH(h => { const a = this.alphas(h, Ka); const neg = a.reduce((t, x, i) => t + i * x, 0) * C; return h + Cb - this.Kw / h - neg - Ca; });
    return -Math.log10(H);
  },
  /** pH of weak base B (Kb) at C with strong acid Ca added */
  pHbase(C, Kb, Ca = 0, Cb = 0) {
    const Ka = this.Kw / Kb;
    const H = this.solveH(h => { const fBH = h / (h + Ka); return h + C * fBH + Cb - this.Kw / h - Ca; });
    return -Math.log10(H);
  },
  pHstrong(Cacid, Cbase) { const H = this.solveH(h => h + Cbase - this.Kw / h - Cacid); return -Math.log10(H); },
};

App.register({
  id: 'ph', unit: 8, sym: 'pH', title: 'pH, Strong & Weak Acids',
  desc: 'Explore the pH scale, compare strong and weak acids and bases at the particle level, and connect acid strength to molecular structure.',
  tags: ['ph', 'poh', 'kw', 'hydronium', 'hydroxide', 'strong acid', 'weak acid', 'strong base', 'weak base', 'ka', 'kb', 'percent ionization', 'pka', 'acid strength', 'oxyacid', 'conjugate base', 'autoionization'],
  keyIdeas: [
    'pH = −log[H<sub>3</sub>O<sup>+</sup>], pOH = −log[OH<sup>−</sup>], and at 25 °C pH + pOH = 14 because K<sub>w</sub> = [H<sub>3</sub>O<sup>+</sup>][OH<sup>−</sup>] = 1.0 × 10<sup>−14</sup>.',
    'Strong acids (HCl, HBr, HI, HNO<sub>3</sub>, HClO<sub>4</sub>, H<sub>2</sub>SO<sub>4</sub>) ionize completely. Weak acids ionize only partly: K<sub>a</sub> = [H<sup>+</sup>][A<sup>−</sup>]/[HA].',
    'Diluting a weak acid increases its percent ionization even though pH rises.',
    'Larger K<sub>a</sub> (smaller pK<sub>a</sub>) means a stronger acid and a weaker conjugate base: K<sub>a</sub> × K<sub>b</sub> = K<sub>w</sub>.',
    'Acid strength rises when the H–A bond is weaker (down a group) or the conjugate base is more stabilized (more electronegative atoms or more O atoms pulling electron density).',
  ],
  render(el, scope) {
    const h = U.h;
    U.tabs(el, [{ label: 'pH scale', render: scale }, { label: 'Strong vs. weak', render: strength }, { label: 'Structure & acid strength', render: structure }], scope, { key: 'ph' });

    function indicatorColor(pH) { const stops = ['#d7191c', '#f46d43', '#fdae61', '#fee08b', '#d9ef8b', '#a6d96a', '#66bd63', '#1a9850', '#3288bd', '#5e4fa2', '#6a3d9a']; const t = U.clamp(pH / 14, 0, 1) * (stops.length - 1), i = Math.min(stops.length - 2, Math.floor(t)); return U.mix(stops[i], stops[i + 1], t - i); }

    function scale(b, s) {
      let pH = 7;
      const ITEMS = [[0.5, 'Battery acid'], [2.0, 'Lemon juice'], [2.9, 'Vinegar'], [3.5, 'Soda'], [5.0, 'Black coffee'], [5.6, 'Rain'], [7.0, 'Pure water (25 °C)'], [7.4, 'Blood'], [8.1, 'Seawater'], [8.3, 'Baking soda'], [10.5, 'Milk of magnesia'], [11.6, 'Household ammonia'], [12.5, 'Bleach'], [13.8, 'Drain cleaner']];
      const sl = U.slider({ label: 'pH', min: 0, max: 14, step: 0.05, value: pH, fmt: v => v.toFixed(2), onInput: v => { pH = v; upd(); } });
      const stats = U.stats([['h', '[H₃O⁺]'], ['oh', '[OH⁻]'], ['poh', 'pOH'], ['r', 'Character']]);
      let P = null;
      const cv = U.canvas(null, { height: 170, scope: s, drag: true, draw });
      U.drag(cv, { down: () => true, move: p => { pH = U.clamp((p.x - 20) / (cv.w - 40) * 14, 0, 14); sl.set(pH); upd(); } }, s);
      b.append(U.panel(null, cv.wrap, sl.el), stats.el, U.panel('Every step of 1 pH unit is a 10× change in [H₃O⁺]', U.table(['pH', '[H₃O⁺] (M)', '[OH⁻] (M)', 'Compared with pH 7'], [1, 3, 5, 7, 9, 11, 13].map(p => [p, '1×10' + U.supText(-p), '1×10' + U.supText(p - 14), p < 7 ? Math.pow(10, 7 - p).toLocaleString() + '× more acidic' : p > 7 ? Math.pow(10, p - 7).toLocaleString() + '× more basic' : 'neutral']), { num: [0], hl: i => Math.abs([1, 3, 5, 7, 9, 11, 13][i] - pH) < 1 })));
      function draw(c, w, H) {
        const t = U.theme(), L = 20, R = w - 20, y = 64;
        for (let x = L; x < R; x++) { c.fillStyle = indicatorColor((x - L) / (R - L) * 14); c.fillRect(x, y, 1.5, 34); }
        for (let p = 0; p <= 14; p++) { const x = L + p / 14 * (R - L); U.text(c, p, x, y + 50, { align: 'center', size: 11, mono: true, color: t.ink2 }); }
        ITEMS.forEach(([p, n], i) => { const x = L + p / 14 * (R - L), up = i % 2 === 0; c.strokeStyle = t.ink3; c.beginPath(); c.moveTo(x, up ? y : y + 34); c.lineTo(x, up ? y - 12 : y + 58); c.stroke(); U.text(c, n, x, up ? y - 16 - (i % 4 === 0 ? 14 : 0) : y + 70 + (i % 4 === 1 ? 14 : 0), { align: 'center', size: 10.5, color: t.ink2 }); });
        const x = L + pH / 14 * (R - L);
        c.fillStyle = t.ink; c.beginPath(); c.moveTo(x, y - 2); c.lineTo(x - 8, y - 14); c.lineTo(x + 8, y - 14); c.closePath(); c.fill();
        c.strokeStyle = t.ink; c.lineWidth = 3; c.strokeRect(x - 3, y - 2, 6, 38);
      }
      function upd() {
        const H = Math.pow(10, -pH), OH = Math.pow(10, pH - 14);
        stats.set('h', U.sig(H, 2) + ' M'); stats.set('oh', U.sig(OH, 2) + ' M'); stats.set('poh', (14 - pH).toFixed(2));
        stats.set('r', pH < 6.95 ? '<span style="color:var(--c-red)">acidic</span>' : pH > 7.05 ? '<span style="color:var(--c-blue)">basic</span>' : 'neutral');
        cv.redraw();
      }
      upd();
    }

    function strength(b, s) {
      const SP = [
        ['HCl', 'acid', Infinity], ['HNO3', 'acid', Infinity], ['HF', 'acid', 6.8e-4], ['HNO2', 'acid', 4.5e-4], ['CH3COOH', 'acid', 1.8e-5], ['HClO', 'acid', 3.0e-8], ['HCN', 'acid', 6.2e-10], ['NH4^+', 'acid', 5.6e-10],
        ['NaOH', 'base', Infinity], ['CH3NH2', 'base', 4.4e-4], ['NH3', 'base', 1.8e-5], ['C5H5N', 'base', 1.7e-9],
      ];
      let si = 4, C = 0.1;
      const sel = U.select({ label: 'Substance', options: [{ group: 'Acids', options: SP.map((x, i) => [x, i]).filter(([x]) => x[1] === 'acid').map(([x, i]) => ({ value: i, label: `${U.chemText(x[0])} ${x[2] === Infinity ? '(strong)' : '(Ka = ' + U.sig(x[2], 2) + ')'}` })) }, { group: 'Bases', options: SP.map((x, i) => [x, i]).filter(([x]) => x[1] === 'base').map(([x, i]) => ({ value: i, label: `${U.chemText(x[0])} ${x[2] === Infinity ? '(strong)' : '(Kb = ' + U.sig(x[2], 2) + ')'}` })) }], value: si, onChange: v => { si = +v; upd(); } });
      const cs = U.logSlider({ label: 'Concentration', min: 1e-4, max: 1, value: C, unit: 'M', fmt: v => U.sig(v, 2), onInput: v => { C = v; upd(); } });
      const stats = U.stats([['ph', 'pH'], ['pi', '% ionized'], ['eq', 'Ions made']]);
      const out = h('div');
      const cv = U.canvas(null, { aspect: 1.35, scope: s });
      const gr = U.canvas(null, { aspect: 1.9, scope: s, draw: graph });
      b.append(h('div', { class: 'grid-viz' }, h('div', { class: 'stack' }, U.panel('Particle view (water molecules not shown)', cv.wrap), U.panel('Percent ionization vs. concentration', gr.wrap)), h('div', { class: 'stack' }, U.panel('Choose', sel.el, cs.el), stats.el, out)));
      const calc = (conc = C) => {
        const [f, type, K] = SP[si];
        if (type === 'acid') {
          if (K === Infinity) { const pH = AB.pHstrong(conc, 0); return { pH, frac: 1 }; }
          const pH = AB.pHacid(conc, [K]); const H = Math.pow(10, -pH); return { pH, frac: K / (K + H) };
        }
        if (K === Infinity) { const pH = AB.pHstrong(0, conc); return { pH, frac: 1 }; }
        const pH = AB.pHbase(conc, K); const Ka = AB.Kw / K, H = Math.pow(10, -pH); return { pH, frac: H / (H + Ka) };
      };
      function graph(c, w, H) {
        const t = U.theme();
        const P = new U.Plot(c, w, H, { x: [1e-4, 1], y: [0, 105], xlog: true, xlabel: 'Concentration (M), log scale', ylabel: '% ionized' });
        P.axes();
        P.fn(x => calc(x).frac * 100, t.accent, 2.6, null, 120);
        P.dot(C, calc().frac * 100, t.red, 6);
      }
      s.loop((dt, time) => {
        const c = cv.ctx, w = cv.w, H = cv.h, t = U.theme(), [f, type] = SP[si], { frac } = calc();
        c.clearRect(0, 0, w, H);
        const N = 16, ion = Math.round(N * frac), R = Math.min(w, H) / 22;
        const pos = i => [w * (0.1 + 0.8 * ((U.hx(i) + time / 30000 * (1 + i % 3)) % 1)), H * (0.12 + 0.76 * ((U.hy(i) + Math.sin(time / 2000 + i) * 0.03 + 1) % 1))];
        for (let i = 0; i < N; i++) {
          const [x, y] = pos(i);
          if (i < ion) {
            const [x2, y2] = pos(i + 40);
            if (type === 'acid') { U.drawAtom(c, x, y, R, 'X', { color: t.red, label: 'H₃O⁺' }); U.drawAtom(c, x2, y2, R * 1.05, 'X', { color: t.green, label: 'A⁻' }); }
            else { U.drawAtom(c, x, y, R, 'X', { color: t.blue, label: 'OH⁻' }); U.drawAtom(c, x2, y2, R * 1.05, 'X', { color: t.purple, label: f === 'NaOH' ? 'Na⁺' : 'BH⁺' }); }
          } else {
            U.drawAtom(c, x + R * 0.5, y, R, 'X', { color: type === 'acid' ? t.green : t.purple, label: type === 'acid' ? 'A' : 'B' });
            if (type === 'acid') U.drawAtom(c, x - R * 0.6, y, R * 0.6, 'H', { label: false });
          }
        }
      });
      function upd() {
        const [f, type, K] = SP[si], r = calc();
        stats.set('ph', r.pH.toFixed(2)); stats.set('pi', (r.frac * 100).toFixed(r.frac > 0.999 ? 0 : 2) + '%'); stats.set('eq', Math.round(16 * r.frac) + ' of 16 shown');
        U.clear(out);
        const F = U.chem(f);
        if (type === 'acid') out.append(h('div', { class: 'eq', html: K === Infinity ? `${F} + H₂O → H₃O⁺ + ${U.chem(f === 'HCl' ? 'Cl^-' : 'NO3^-')} (100%)` : `${F} + H₂O ⇌ H₃O⁺ + ${(f === 'NH4^+' ? U.chem('NH3') : U.chem(f.replace(/^H/, '').replace('COOH', 'COO') + '^-'))}` }),
          U.callout(K === Infinity ? `A strong acid ionizes completely, so [H₃O⁺] = ${U.sig(C, 2)} M and pH = ${r.pH.toFixed(2)}.` : `Only ${(r.frac * 100).toFixed(2)}% of the ${F} molecules ionize. Most stay as intact molecules, so the pH (${r.pH.toFixed(2)}) is much higher than a strong acid at the same concentration (${(-Math.log10(C)).toFixed(2)}).`));
        else out.append(h('div', { class: 'eq', html: K === Infinity ? `NaOH → Na⁺ + OH⁻ (100%)` : `${F} + H₂O ⇌ ${F === 'NH<sub>3</sub>' ? 'NH₄⁺' : 'BH⁺'} + OH⁻` }),
          U.callout(K === Infinity ? `A strong base dissociates completely: [OH⁻] = ${U.sig(C, 2)} M, pOH = ${(14 - r.pH).toFixed(2)}, pH = ${r.pH.toFixed(2)}.` : `Only ${(r.frac * 100).toFixed(2)}% of the base molecules accept a proton from water. pH = ${r.pH.toFixed(2)}.`));
        gr.redraw();
      }
      upd();
    }

    function structure(b, s) {
      const SETS = {
        binary: { label: 'Binary acids (down a group)', items: [['HF', 6.8e-4], ['HCl', 1e7], ['HBr', 1e9], ['HI', 3e9]], note: 'Down group 17 the H–X bond gets longer and weaker, so the H⁺ is released more easily. Bond strength beats electronegativity here, which is why HF is a weak acid even though F is the most electronegative.' },
        oxy: { label: 'Oxyacids (number of O atoms)', items: [['HClO', 3.0e-8], ['HClO2', 1.1e-2], ['HClO3', 1e1], ['HClO4', 1e8]], note: 'Each extra O atom pulls electron density away from the O–H bond and spreads (delocalizes) the negative charge of the conjugate base over more atoms, stabilizing it. More O atoms → stronger acid.' },
        halo: { label: 'Oxyacids (central atom electronegativity)', items: [['HOI', 2.3e-11], ['HOBr', 2.0e-9], ['HOCl', 3.0e-8]], note: 'A more electronegative central atom pulls electron density from the O–H bond, making it more polar and the conjugate base more stable. Cl > Br > I in electronegativity.' },
        carbox: { label: 'Carboxylic acids (electron-withdrawing groups)', items: [['CH3COOH', 1.8e-5], ['ClCH2COOH', 1.4e-3], ['Cl2CHCOOH', 5.5e-2], ['Cl3CCOOH', 3.0e-1]], note: 'Electronegative Cl atoms withdraw electron density through the molecule, stabilizing the carboxylate anion. More Cl atoms → stronger acid. The carboxylate is also resonance stabilized, which is why carboxylic acids are acidic at all.' },
      };
      let key = 'oxy';
      const seg = U.seg({ options: Object.keys(SETS).map(k => ({ value: k, label: SETS[k].label })), value: key, onChange: v => { key = v; cv.redraw(); upd(); } });
      const out = h('div');
      const cv = U.canvas(null, { aspect: 2.2, scope: s, draw });
      b.append(U.panel(null, seg.el, cv.wrap), out);
      function draw(c, w, H) {
        const t = U.theme(), S = SETS[key];
        const lo = Math.floor(Math.min(...S.items.map(x => Math.log10(x[1])))) - 1, hi = Math.ceil(Math.max(...S.items.map(x => Math.log10(x[1])))) + 1;
        const P = new U.Plot(c, w, H, { x: [-0.6, S.items.length - 0.4], y: [lo, hi], xticks: S.items.map((_, i) => i), xfmt: v => U.chemText(S.items[Math.round(v)] ? S.items[Math.round(v)][0] : ''), ylabel: 'log Ka', yfmt: v => String(v) });
        P.axes();
        S.items.forEach(([f, Ka], i) => {
          const y = Math.log10(Ka);
          c.fillStyle = indicatorColor(U.clamp(7 - y / 2, 0, 7)); U.roundRect(c, P.X(i - 0.28), Math.min(P.Y(y), P.Y(lo)), P.X(i + 0.28) - P.X(i - 0.28), Math.abs(P.Y(lo) - P.Y(y)), 4); c.fill();
          P.label(Ka >= 1e3 ? 'strong' : 'Ka = ' + U.sig(Ka, 2), i, y, t.ink2, { dy: -8, align: 'center', mono: true, weight: 500 });
        });
        U.arrow(c, P.L + 20, P.T + 12, P.R - 20, P.T + 12, U.alpha(t.ink3, 0.6), 1.5);
        U.text(c, 'increasing acid strength →', (P.L + P.R) / 2, P.T + 26, { align: 'center', size: 11, color: t.ink3 });
      }
      function upd() { U.clear(out); out.appendChild(U.callout(SETS[key].note)); }
      upd();
    }
  },
});
