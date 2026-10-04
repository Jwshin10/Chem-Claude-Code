'use strict';
App.register({
  id: 'le-chatelier', unit: 7, sym: 'Lc', title: 'Le Châtelier’s Principle',
  desc: 'Stress an equilibrium (add, remove, compress, heat, catalyze) and watch the concentrations shift to a new equilibrium.',
  tags: ['le chatelier', 'le châtelier', 'equilibrium shift', 'stress', 'temperature', 'pressure', 'volume', 'concentration', 'catalyst', 'haber process', 'no2 n2o4', 'cobalt chloride'],
  keyIdeas: [
    'When a system at equilibrium is disturbed, it shifts in the direction that partially counteracts the change.',
    'Adding a reactant (or removing a product) makes Q &lt; K, so the system shifts right. The reverse is also true.',
    'Decreasing volume (increasing pressure) shifts a gas equilibrium toward the side with <b>fewer moles of gas</b>.',
    'Only temperature changes the value of K. For an exothermic reaction, heating shifts left and decreases K; for an endothermic reaction, heating shifts right and increases K.',
    'Catalysts and inert gases added at constant volume do not shift the equilibrium.',
  ],
  render(el, scope) {
    const h = U.h;
    const SYS = [
      { id: 'haber', eq: 'N2(g) + 3H2(g) <=> 2NH3(g)', sp: [['N2', -1, '#3d6ae0'], ['H2', -3, '#a9b4c2'], ['NH3', 2, '#9b59d0']], gas: true, dH: -92, K0: 6.0, T0: 500, c0: [1.0, 1.0, 0], Tr: [300, 800] },
      { id: 'no2', eq: '2NO2(g) <=> N2O4(g)', sp: [['NO2', -2, '#b5501d'], ['N2O4', 1, '#d8c7a8']], gas: true, dH: -57, K0: 170, T0: 298, c0: [0.08, 0], Tr: [250, 400], color: c => U.alpha('#9a3412', U.clamp(c[0] / 0.06, 0.05, 0.9)), colorNote: 'NO₂ is brown; N₂O₄ is colorless.' },
      { id: 'cobalt', eq: 'Co(H2O)6^2+(aq) + 4Cl^-(aq) <=> CoCl4^2-(aq) + 6H2O(l)', sp: [['Co(H2O)6^2+', -1, '#e58ab5'], ['Cl^-', -4, '#33b34f'], ['CoCl4^2-', 1, '#2f5fd0']], gas: false, dH: 50, K0: 0.05, T0: 298, c0: [0.05, 2.5, 0], Tr: [275, 370], color: c => { const f = c[2] / (c[0] + c[2] + 1e-12); return U.mix('#e58ab5', '#2f5fd0', f); }, colorNote: 'Co(H₂O)₆²⁺ is pink; CoCl₄²⁻ is blue. The forward reaction is endothermic.' },
      { id: 'fescn', eq: 'Fe^3+(aq) + SCN^-(aq) <=> FeSCN^2+(aq)', sp: [['Fe^3+', -1, '#e0a030'], ['SCN^-', -1, '#9aa3ad'], ['FeSCN^2+', 1, '#b3121e']], gas: false, dH: -5, K0: 890, T0: 298, c0: [0.002, 0.002, 0], Tr: [275, 370], color: c => U.alpha('#b3121e', U.clamp(c[2] / 0.0015, 0.04, 0.95)), colorNote: 'FeSCN²⁺ is blood red.' },
    ];
    let si = 0, S, conc, T, hist, time, anim, msg;
    const sel = U.select({ label: 'Equilibrium system', options: SYS.map((x, i) => ({ value: i, label: U.chemText(x.eq) })), value: si, onChange: v => { si = +v; init(); } });
    const btns = h('div', { class: 'stack' });
    const msgBox = h('div');
    const stats = h('div');
    const vis = U.canvas(null, { aspect: 1.3, scope });
    const gr = U.canvas(null, { aspect: 2.1, scope });
    el.append(h('div', { class: 'grid-viz' }, h('div', { class: 'stack' }, U.panel('Concentration vs. time', gr.wrap), msgBox), h('div', { class: 'stack' }, U.panel('System', sel.el, vis.wrap), U.panel('Apply a stress', btns), stats)));
    const K = () => S.K0 * Math.exp(-S.dH * 1000 / 8.314 * (1 / T - 1 / S.T0));
    const Qof = c => S.sp.reduce((q, [f, n], i) => q * Math.pow(Math.max(c[i], 1e-15), n), 1);
    function solve(c) { // find extent x so that Q = K
      const lo = Math.max(...S.sp.map(([f, n], i) => n > 0 ? -c[i] / n : -Infinity)), hi = Math.min(...S.sp.map(([f, n], i) => n < 0 ? c[i] / -n : Infinity));
      const f = x => Math.log(Qof(c.map((v, i) => v + S.sp[i][1] * x))) - Math.log(K());
      const a = lo + 1e-12 * Math.max(1, Math.abs(lo)), z = hi - 1e-12 * Math.max(1, Math.abs(hi));
      const x = U.bisect(f, isFinite(a) ? a : -10, isFinite(z) ? z : 10, 120);
      return c.map((v, i) => Math.max(0, v + S.sp[i][1] * x));
    }
    function init() {
      S = SYS[si]; T = S.T0; time = 0; hist = []; msg = null;
      conc = solve(S.c0.slice());
      for (let k = 0; k < 10; k++) hist.push({ t: time + k * 0.2, c: conc.slice() });
      time = 2; anim = null;
      buttons(); paint();
    }
    function stress(desc, fn, opts = {}) {
      const before = conc.slice(), Kold = K();
      fn();
      const jumped = conc.slice();
      const q = Qof(jumped), Kn = K();
      const target = solve(jumped);
      hist.push({ t: time, c: before }); hist.push({ t: time + 0.001, c: jumped });
      anim = { from: jumped, to: target, t0: time, dur: 2.5 };
      const dir = Math.abs(Math.log(q / Kn)) < 1e-3 ? 0 : q < Kn ? 1 : -1;
      msg = { desc, q, K: Kn, Kold, dir, note: opts.note };
      paint();
    }
    function buttons() {
      U.clear(btns);
      const row1 = h('div', { class: 'row' }), row2 = h('div', { class: 'row' }), row3 = h('div', { class: 'row' });
      S.sp.forEach(([f, n], i) => {
        if (f === 'H2O') return;
        row1.appendChild(U.btn('Add ' + U.chem(f), () => stress(`Added ${U.chem(f)}`, () => { conc[i] += Math.max(0.3 * Math.max(...S.c0), conc[i] * 0.6); }), 'sm'));
        row2.appendChild(U.btn('Remove ' + U.chem(f), () => stress(`Removed some ${U.chem(f)}`, () => { conc[i] *= 0.4; }), 'sm'));
      });
      row3.append(U.btn('Heat (+25 K)', () => { if (T + 25 > S.Tr[1]) return; stress('Raised the temperature', () => { T += 25; }); }, 'sm'), U.btn('Cool (−25 K)', () => { if (T - 25 < S.Tr[0]) return; stress('Lowered the temperature', () => { T -= 25; }); }, 'sm'));
      if (S.gas) row3.append(U.btn('Halve the volume', () => stress('Halved the volume (pressure doubled)', () => { conc = conc.map(v => v * 2); }), 'sm'), U.btn('Double the volume', () => stress('Doubled the volume', () => { conc = conc.map(v => v / 2); }), 'sm'), U.btn('Add argon (fixed V)', () => stress('Added an inert gas at constant volume', () => { }, { note: 'Partial pressures and concentrations of the reacting gases do not change, so Q still equals K.' }), 'sm'));
      row3.append(U.btn('Add catalyst', () => stress('Added a catalyst', () => { }, { note: 'A catalyst speeds up the forward and reverse reactions equally. Equilibrium is reached faster but its position does not change.' }), 'sm'), U.btn('Reset', init, 'sm primary'));
      btns.append(row1, row2, row3);
    }
    scope.loop(dt => {
      time += dt;
      if (anim) {
        const k = Math.min(1, (time - anim.t0) / anim.dur), e = 1 - Math.pow(1 - k, 3);
        conc = anim.from.map((v, i) => v + (anim.to[i] - v) * e);
        if (k >= 1) anim = null;
      }
      if (time - hist[hist.length - 1].t > 0.1) hist.push({ t: time, c: conc.slice() });
      while (hist.length > 2 && hist[hist.length - 1].t - hist[0].t > 30) hist.shift();
      drawGraph(); drawVis();
    });
    function drawGraph() {
      const c = gr.ctx, w = gr.w, H = gr.h, t = U.theme();
      c.clearRect(0, 0, w, H);
      const t0 = hist[0].t, t1 = Math.max(t0 + 30, time);
      const max = Math.max(...hist.flatMap(q => q.c.filter((_, i) => S.sp[i][0] !== 'Cl^-' || true))) * 1.15 || 1;
      const P = new U.Plot(c, w, H, { x: [t0, t1], y: [0, max], xlabel: 'time (s)', ylabel: 'Concentration (M)', pad: { l: 60 } });
      P.axes();
      S.sp.forEach(([f, n, col], i) => { P.line(hist.map(q => [q.t, q.c[i]]).concat([[time, conc[i]]]), col, 2.6); P.label(U.chemText(f), time, conc[i], col, { dx: -4, dy: -6, align: 'right' }); });
    }
    function drawVis() {
      const c = vis.ctx, w = vis.w, H = vis.h, t = U.theme();
      c.clearRect(0, 0, w, H);
      const fx = w * 0.2, fw = w * 0.6, fy = H * 0.12, fh = H * 0.78;
      if (S.color) {
        c.fillStyle = S.color(conc); U.roundRect(c, fx, fy + fh * 0.25, fw, fh * 0.75, 18); c.fill();
      } else {
        const maxC = Math.max(...S.c0, ...conc);
        let k = 0;
        S.sp.forEach(([f, n, col], i) => { const cnt = Math.round(conc[i] / maxC * 24); for (let j = 0; j < cnt; j++, k++) { const x = fx + 14 + U.hx(k) * (fw - 28), y = fy + 14 + U.hy(k) * (fh - 28); U.drawAtom(c, x, y, 6, 'X', { color: col, label: false }); } });
      }
      c.strokeStyle = t.ink2; c.lineWidth = 2.5; U.roundRect(c, fx, fy, fw, fh, 18); c.stroke();
      U.text(c, 'T = ' + T + ' K', w / 2, H - 4, { align: 'center', mono: true, size: 11, color: t.ink2 });
    }
    function paint() {
      U.clear(stats); U.clear(msgBox);
      const st = U.stats(S.sp.filter(x => x[0] !== 'H2O').map(([f], i) => ['s' + i, '[' + U.chem(f) + ']']).concat([['k', 'K at ' + T + ' K'], ['dh', 'ΔH°']]));
      S.sp.forEach(([f], i) => st.set('s' + i, U.sig(anim ? anim.to[i] : conc[i], 3)));
      st.set('k', U.sig(K(), 3)); st.set('dh', (S.dH > 0 ? '+' : '') + S.dH + ' kJ/mol');
      stats.appendChild(st.el);
      msgBox.appendChild(h('div', { class: 'eq', html: U.chem(S.eq) }));
      if (S.colorNote) msgBox.appendChild(h('p', { class: 'small muted' }, S.colorNote));
      if (!msg) { msgBox.appendChild(U.callout('The system starts at equilibrium. Apply a stress and watch the curves.')); return; }
      let txt = `<b>${msg.desc}.</b> `;
      if (Math.abs(msg.K / msg.Kold - 1) > 1e-3) txt += `Temperature changed K from ${U.sig(msg.Kold, 3)} to ${U.sig(msg.K, 3)} (the reaction is ${S.dH < 0 ? 'exothermic, so heating lowers K' : 'endothermic, so heating raises K'}). `;
      txt += `Right after the change Q = ${U.sig(msg.q, 3)} and K = ${U.sig(msg.K, 3)}. `;
      txt += msg.dir === 0 ? 'Q = K, so there is <b>no shift</b>.' : msg.dir > 0 ? 'Q &lt; K, so the system <b>shifts right</b> (toward products).' : 'Q &gt; K, so the system <b>shifts left</b> (toward reactants).';
      if (msg.note) txt += ' ' + msg.note;
      msgBox.appendChild(U.callout(txt, msg.dir === 0 ? '' : 'good'));
    }
    init();
  },
});
