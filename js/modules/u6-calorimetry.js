'use strict';
App.register({
  id: 'calorimetry', unit: 6, sym: 'Ca', title: 'Calorimetry & Heat Transfer',
  desc: 'Drop hot metal into water to reach thermal equilibrium, and use coffee-cup calorimetry to find ΔH of a reaction.',
  tags: ['calorimetry', 'specific heat', 'heat capacity', 'thermal equilibrium', 'q=mcΔt', 'coffee cup calorimeter', 'heat transfer', 'endothermic', 'exothermic', 'enthalpy of solution'],
  keyIdeas: [
    'Heat flows from hotter to colder objects until they reach the same temperature (thermal equilibrium).',
    'Energy is conserved: <b>q<sub>lost</sub> = −q<sub>gained</sub></b>, and q = mcΔT for each object.',
    'Water has a high specific heat (4.18 J/g·°C), so its temperature changes less than a metal’s for the same heat.',
    'In a coffee-cup calorimeter, q<sub>reaction</sub> = −q<sub>solution</sub>. If the solution warms up, the reaction is exothermic (ΔH &lt; 0).',
    'ΔH<sub>rxn</sub> = q<sub>rxn</sub> / moles of limiting reactant.',
  ],
  render(el, scope) {
    const h = U.h;
    U.tabs(el, [{ label: 'Metal in water', render: metal }, { label: 'Reaction calorimetry', render: reaction }], scope, { key: 'calor' });

    function metal(b, s) {
      const METALS = { Al: 0.897, Fe: 0.449, Cu: 0.385, Ag: 0.235, Pb: 0.129, Au: 0.129 };
      let mt = 'Cu', mm = 100, Tm = 95, mw = 150, Tw = 22, prog = 0, running = false;
      const sel = U.select({ label: 'Metal', options: Object.keys(METALS).map(k => ({ value: k, label: `${ELEMENTS.bySym[k].name} (c = ${METALS[k]} J/g·°C)` })), value: mt, onChange: v => { mt = v; reset(); } });
      const s1 = U.slider({ label: 'Metal mass', min: 10, max: 300, step: 5, value: mm, unit: 'g', onInput: v => { mm = v; reset(); } });
      const s2 = U.slider({ label: 'Metal temperature', min: 30, max: 200, step: 1, value: Tm, unit: '°C', onInput: v => { Tm = v; reset(); } });
      const s3 = U.slider({ label: 'Water mass', min: 20, max: 500, step: 5, value: mw, unit: 'g', onInput: v => { mw = v; reset(); } });
      const s4 = U.slider({ label: 'Water temperature', min: 0, max: 60, step: 1, value: Tw, unit: '°C', onInput: v => { Tw = v; reset(); } });
      const go = U.btn('▶ Drop the metal in', () => { prog = 0; running = true; }, 'primary');
      const out = h('div', { class: 'stack' });
      const cv = U.canvas(null, { aspect: 1.5, scope: s });
      const gr = U.canvas(null, { aspect: 2, scope: s });
      b.append(h('div', { class: 'grid-viz' }, h('div', { class: 'stack' }, U.panel(null, cv.wrap, go), U.panel('Temperature vs. time', gr.wrap)), h('div', { class: 'stack' }, U.panel('Set up', sel.el, s1.el, s2.el, s3.el, s4.el), out)));
      const Tf = () => (mm * METALS[mt] * Tm + mw * 4.18 * Tw) / (mm * METALS[mt] + mw * 4.18);
      function reset() { prog = 0; running = false; calc(); }
      s.loop(dt => {
        if (running) { prog = Math.min(1, prog + dt * 0.25); if (prog >= 1) running = false; }
        const c = cv.ctx, w = cv.w, H = cv.h, t = U.theme();
        c.clearRect(0, 0, w, H);
        const k = 1 - Math.exp(-prog * 5), tf = Tf();
        const curM = Tm + (tf - Tm) * k, curW = Tw + (tf - Tw) * k;
        const bx = w * 0.18, bw = w * 0.5, by = H * 0.25, bh = H * 0.65;
        c.fillStyle = U.alpha(U.mix('#3b82f6', '#ef4444', U.clamp(curW / 100, 0, 1)), 0.25); c.fillRect(bx, by + bh * 0.25, bw, bh * 0.75);
        c.strokeStyle = t.ink2; c.lineWidth = 3; c.beginPath(); c.moveTo(bx, by); c.lineTo(bx, by + bh); c.lineTo(bx + bw, by + bh); c.lineTo(bx + bw, by); c.stroke();
        const my = prog > 0 ? by + bh * 0.25 + Math.min(1, prog * 6) * bh * 0.45 : by - H * 0.18;
        const mcol = U.mix('#9aa3ad', '#ff5a1f', U.clamp((curM - 20) / 180, 0, 1));
        c.fillStyle = mcol; U.roundRect(c, bx + bw / 2 - 26, my, 52, 30, 6); c.fill();
        U.text(c, mt, bx + bw / 2, my + 20, { align: 'center', weight: 700, color: '#fff' });
        if (prog > 0 && k < 0.98) for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + prog * 10; U.arrow(c, bx + bw / 2 + Math.cos(a) * 34, my + 15 + Math.sin(a) * 26, bx + bw / 2 + Math.cos(a) * 52, my + 15 + Math.sin(a) * 40, t.orange, 2, 7); }
        // thermometers
        const therm = (x, T, label) => { const top = H * 0.08, bot = H * 0.85; c.fillStyle = t.surface3; U.roundRect(c, x - 6, top, 12, bot - top, 6); c.fill(); const f = U.clamp(T / 200, 0, 1); c.fillStyle = t.red; c.fillRect(x - 3, bot - (bot - top) * f, 6, (bot - top) * f); c.beginPath(); c.arc(x, bot + 6, 9, 0, 7); c.fill(); U.text(c, T.toFixed(1) + '°', x, bot + 30, { align: 'center', mono: true, size: 11 }); U.text(c, label, x, top - 6, { align: 'center', size: 10, color: t.ink3 }); };
        therm(w * 0.8, curM, 'metal'); therm(w * 0.92, curW, 'water');
        // graph
        const g = gr.ctx; g.clearRect(0, 0, gr.w, gr.h);
        const P = new U.Plot(g, gr.w, gr.h, { x: [0, 1], y: [Math.min(Tw, Tm) - 5, Math.max(Tw, Tm) + 5], xlabel: 'time', ylabel: 'T (°C)', xticks: [] });
        P.axes();
        P.fn(x => Tm + (tf - Tm) * (1 - Math.exp(-x * 5)), U.alpha(t.orange, 0.3), 2, [3, 3]); P.fn(x => Tw + (tf - Tw) * (1 - Math.exp(-x * 5)), U.alpha(t.blue, 0.3), 2, [3, 3]);
        if (prog > 0) { P.fn(x => Tm + (tf - Tm) * (1 - Math.exp(-x * 5)), t.orange, 2.6, null, 100, 0, prog); P.fn(x => Tw + (tf - Tw) * (1 - Math.exp(-x * 5)), t.blue, 2.6, null, 100, 0, prog); }
        P.hline(tf, t.good, [5, 4], 'T_final = ' + tf.toFixed(1) + ' °C', true);
      });
      function calc() {
        const tf = Tf(), cm = METALS[mt];
        const qm = mm * cm * (tf - Tm), qw = mw * 4.18 * (tf - Tw);
        U.clear(out);
        out.append(U.panel('Solve for the final temperature',
          h('div', { class: 'eq wrap', html: `−q<sub>metal</sub> = q<sub>water</sub><br>−(${mm})(${cm})(T<sub>f</sub> − ${Tm}) = (${mw})(4.18)(T<sub>f</sub> − ${Tw})<br>T<sub>f</sub> = <b>${tf.toFixed(1)} °C</b>` }),
          U.table(['', 'q (J)', 'ΔT (°C)'], [['Metal', qm.toFixed(0), (tf - Tm).toFixed(1)], ['Water', '+' + qw.toFixed(0), '+' + (tf - Tw).toFixed(1)]], { num: [1, 2] })),
          U.callout(`The metal loses ${Math.abs(qm).toFixed(0)} J and the water gains the same ${qw.toFixed(0)} J. The water’s temperature changes less because water has a much higher specific heat than ${ELEMENTS.bySym[mt].name.toLowerCase()}.`));
      }
      calc();
    }

    function reaction(b, s) {
      const RX = [
        { name: 'Dissolve NaOH(s)', eq: 'NaOH(s) → Na⁺(aq) + OH⁻(aq)', dH: -44.5, unit: 'g NaOH', M: 40.00 },
        { name: 'Dissolve NH₄NO₃(s) (cold pack)', eq: 'NH₄NO₃(s) → NH₄⁺(aq) + NO₃⁻(aq)', dH: 25.7, unit: 'g NH₄NO₃', M: 80.04 },
        { name: 'Dissolve CaCl₂(s) (hot pack)', eq: 'CaCl₂(s) → Ca²⁺(aq) + 2Cl⁻(aq)', dH: -81.3, unit: 'g CaCl₂', M: 110.98 },
        { name: 'Neutralize HCl with NaOH', eq: 'H⁺(aq) + OH⁻(aq) → H₂O(l)', dH: -57.1, unit: 'mmol H⁺', M: null },
      ];
      let ri = 0, amt = 4.0, water = 100, T0 = 22.0;
      const sel = U.select({ label: 'Process', options: RX.map((r, i) => ({ value: i, label: r.name })), value: ri, onChange: v => { ri = +v; amt = RX[ri].M ? 4 : 50; sa.set(amt); upd(); } });
      const sa = U.slider({ label: 'Amount', min: 1, max: 100, step: 0.5, value: amt, onInput: v => { amt = v; upd(); } });
      const sw = U.slider({ label: 'Mass of water / solution', min: 50, max: 300, step: 5, value: water, unit: 'g', onInput: v => { water = v; upd(); } });
      const out = h('div', { class: 'stack' });
      const cv = U.canvas(null, { aspect: 1.2, scope: s, draw });
      b.append(h('div', { class: 'grid-viz' }, h('div', { class: 'stack' }, U.panel('Measure', sel.el, sa.el, sw.el), out), U.panel('Coffee-cup calorimeter', cv.wrap)));
      const calc = () => { const r = RX[ri]; const n = r.M ? amt / r.M : amt / 1000; const qrxn = n * r.dH * 1000; const qsol = -qrxn; const mass = water + (r.M ? amt : 0); const dT = qsol / (mass * 4.18); return { r, n, qrxn, qsol, mass, dT }; };
      function draw(c, w, H) {
        const t = U.theme(), C = calc();
        const cx = w * 0.4, cw = w * 0.42, top = H * 0.2, bot = H * 0.9;
        c.fillStyle = t.surface3; c.beginPath(); c.moveTo(cx - cw / 2, top); c.lineTo(cx - cw * 0.4, bot); c.lineTo(cx + cw * 0.4, bot); c.lineTo(cx + cw / 2, top); c.closePath(); c.fill();
        c.fillStyle = U.alpha(C.dT > 0 ? '#ef4444' : '#3b82f6', U.clamp(Math.abs(C.dT) / 25, 0.1, 0.55)); c.beginPath(); c.moveTo(cx - cw * 0.47, top + (bot - top) * 0.2); c.lineTo(cx - cw * 0.4, bot - 4); c.lineTo(cx + cw * 0.4, bot - 4); c.lineTo(cx + cw * 0.47, top + (bot - top) * 0.2); c.closePath(); c.fill();
        c.fillStyle = t.ink3; c.fillRect(cx - cw / 2 - 6, top - 10, cw + 12, 10);
        const tx = w * 0.82, tt = H * 0.08, tb = H * 0.82, Tf = T0 + C.dT;
        c.fillStyle = t.surface3; U.roundRect(c, tx - 7, tt, 14, tb - tt, 7); c.fill();
        const f = U.clamp((Tf + 10) / 70, 0, 1);
        c.fillStyle = t.red; c.fillRect(tx - 3.5, tb - (tb - tt) * f, 7, (tb - tt) * f); c.beginPath(); c.arc(tx, tb + 7, 10, 0, 7); c.fill();
        U.text(c, Tf.toFixed(1) + ' °C', tx, tb + 34, { align: 'center', mono: true, weight: 600 });
        U.text(c, (C.dT >= 0 ? '+' : '') + C.dT.toFixed(2) + ' °C', cx, top - 18, { align: 'center', mono: true, weight: 700, color: C.dT > 0 ? t.red : t.blue, size: 15 });
      }
      function upd() {
        const C = calc();
        sa.el.querySelector('.lbl span').textContent = 'Amount (' + C.r.unit + ')';
        cv.redraw();
        U.clear(out);
        out.append(h('div', { class: 'eq', html: C.r.eq }),
          U.panel('Analysis', h('div', { class: 'eq wrap', html: `q<sub>solution</sub> = mcΔT = (${C.mass.toFixed(1)} g)(4.18 J/g·°C)(${C.dT.toFixed(2)} °C) = ${C.qsol.toFixed(0)} J<br>q<sub>rxn</sub> = −q<sub>solution</sub> = ${C.qrxn.toFixed(0)} J<br>n = ${U.sig(C.n, 3)} mol → ΔH = q<sub>rxn</sub>/n = <b>${C.r.dH} kJ/mol</b>` })),
          U.callout(C.r.dH < 0 ? 'The solution gets warmer, so the process released heat: <b>exothermic</b>, ΔH &lt; 0.' : 'The solution gets colder, so the process absorbed heat from the water: <b>endothermic</b>, ΔH &gt; 0.', C.r.dH < 0 ? 'warn' : ''));
      }
      upd();
    }
  },
});
