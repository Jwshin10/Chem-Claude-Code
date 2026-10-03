'use strict';
App.register({
  id: 'heating-curve', unit: 6, sym: 'Hc', title: 'Heating Curves & Phase Changes',
  desc: 'Add heat to ice and watch temperature, phase and particles change, with q calculations for every segment.',
  tags: ['heating curve', 'cooling curve', 'phase change', 'heat of fusion', 'heat of vaporization', 'specific heat', 'q=mcΔt', 'melting', 'boiling', 'latent heat'],
  keyIdeas: [
    'On sloped segments heat raises the temperature (average kinetic energy): <b>q = mcΔT</b>.',
    'On flat segments the temperature stays constant while the phase changes: <b>q = nΔH<sub>fus</sub></b> or <b>q = nΔH<sub>vap</sub></b>. The energy goes into overcoming intermolecular forces, raising potential energy.',
    'ΔH<sub>vap</sub> is much larger than ΔH<sub>fus</sub> because vaporization separates the molecules completely.',
    'Melting and boiling are endothermic; freezing and condensing release the same amounts of energy (exothermic).',
  ],
  render(el, scope) {
    const h = U.h;
    const SUBS = {
      water: { name: 'Water', mp: 0, bp: 100, cs: 2.09, cl: 4.18, cg: 2.01, Hf: 334, Hv: 2260, M: 18.02, T0: -40, T1: 140 },
      ethanol: { name: 'Ethanol', mp: -114, bp: 78, cs: 1.0, cl: 2.44, cg: 1.42, Hf: 108, Hv: 838, M: 46.07, T0: -140, T1: 110 },
    };
    let key = 'water', m = 50, q = 0;
    const segs = () => {
      const S = SUBS[key];
      const parts = [
        ['Warm the solid', 'solid', m * S.cs * (S.mp - S.T0) / 1000, S.T0, S.mp, `q = mc<sub>s</sub>ΔT = (${m} g)(${S.cs} J/g·°C)(${S.mp - S.T0} °C)`],
        ['Melt', 'solid + liquid', m * S.Hf / 1000, S.mp, S.mp, `q = mΔH<sub>fus</sub> = (${m} g)(${S.Hf} J/g)`],
        ['Warm the liquid', 'liquid', m * S.cl * (S.bp - S.mp) / 1000, S.mp, S.bp, `q = mc<sub>l</sub>ΔT = (${m} g)(${S.cl} J/g·°C)(${S.bp - S.mp} °C)`],
        ['Boil', 'liquid + gas', m * S.Hv / 1000, S.bp, S.bp, `q = mΔH<sub>vap</sub> = (${m} g)(${S.Hv} J/g)`],
        ['Warm the gas', 'gas', m * S.cg * (S.T1 - S.bp) / 1000, S.bp, S.T1, `q = mc<sub>g</sub>ΔT = (${m} g)(${S.cg} J/g·°C)(${S.T1 - S.bp} °C)`],
      ];
      let acc = 0;
      return parts.map(p => { const o = { name: p[0], phase: p[1], q: p[2], q0: acc, Ta: p[3], Tb: p[4], f: p[5] }; acc += p[2]; return o; });
    };
    const total = () => segs().reduce((t, s2) => t + s2.q, 0);
    const state = () => {
      const S = segs();
      for (const s2 of S) if (q <= s2.q0 + s2.q + 1e-9) { const f = s2.q ? (q - s2.q0) / s2.q : 0; return { seg: s2, f, T: s2.Ta + (s2.Tb - s2.Ta) * f }; }
      const l = S[S.length - 1]; return { seg: l, f: 1, T: l.Tb };
    };
    const sel = U.seg({ options: [{ value: 'water', label: 'Water' }, { value: 'ethanol', label: 'Ethanol' }], value: key, onChange: v => { key = v; q = 0; sq.input.max = total(); sq.set(0); upd(); } });
    const sm = U.slider({ label: 'Mass', min: 10, max: 200, step: 5, value: m, unit: 'g', onInput: v => { const fr = q / total(); m = v; sq.input.max = total(); q = fr * total(); sq.set(q); upd(); } });
    const sq = U.slider({ label: 'Heat added', min: 0, max: total(), step: 0.01, value: q, unit: 'kJ', fmt: v => v.toFixed(2), onInput: v => { q = v; playing = false; upd(); } });
    let playing = false;
    const play = U.btn('▶ Heat steadily', () => { if (q >= total() - 1e-6) q = 0; playing = !playing; }, 'primary');
    const stats = U.stats([['t', 'Temperature'], ['p', 'Phase'], ['q', 'Heat added']]);
    const tbl = h('div');
    const cv = U.canvas(null, { aspect: 1.7, scope, draw });
    const box = U.canvas(null, { aspect: 1.5, scope });
    el.append(h('div', { class: 'grid-viz' }, U.panel(null, cv.wrap), h('div', { class: 'stack' }, U.panel('Controls', sel.el, sm.el, sq.el, play), stats.el, U.panel('Particles', box.wrap))), tbl);
    function draw(c, w, H) {
      const t = U.theme(), S = SUBS[key], sg = segs(), st = state();
      const P = new U.Plot(c, w, H, { x: [0, total()], y: [S.T0 - 10, S.T1 + 10], xlabel: 'Heat added (kJ)', ylabel: 'Temperature (°C)' });
      P.axes();
      const cols = [t.blue, t.teal, t.green, t.orange, t.red];
      sg.forEach((s2, i) => {
        P.line([[s2.q0, s2.Ta], [s2.q0 + s2.q, s2.Tb]], cols[i], 3);
        const mid = s2.q0 + s2.q / 2;
        P.label(s2.phase, mid, (s2.Ta + s2.Tb) / 2, cols[i], { dy: s2.Ta === s2.Tb ? -8 : 14, dx: s2.Ta === s2.Tb ? 0 : 8, align: s2.Ta === s2.Tb ? 'center' : 'left' });
      });
      P.hline(S.mp, U.alpha(t.ink3, 0.6), [3, 4], 'mp ' + S.mp + ' °C');
      P.hline(S.bp, U.alpha(t.ink3, 0.6), [3, 4], 'bp ' + S.bp + ' °C');
      P.dot(q, st.T, t.ink, 7);
    }
    scope.loop((dt, time) => {
      if (playing) { q = Math.min(total(), q + total() * dt / 14); sq.set(q); upd(); if (q >= total()) playing = false; }
      const c = box.ctx, w = box.w, H = box.h, t = U.theme(), st = state(), S = SUBS[key];
      c.clearRect(0, 0, w, H);
      const N = 36, R = Math.min(w, H) / 24;
      const temp = (st.T - S.T0) / (S.T1 - S.T0);
      const liquidFrac = st.seg.phase === 'solid' ? 0 : st.seg.phase === 'solid + liquid' ? st.f : 1;
      const gasFrac = st.seg.phase === 'gas' ? 1 : st.seg.phase === 'liquid + gas' ? st.f : 0;
      for (let i = 0; i < N; i++) {
        const isGas = i < N * gasFrac, isLiq = !isGas && i < N * Math.max(liquidFrac, gasFrac);
        let x, y;
        const jig = 1 + temp * 3;
        if (isGas) { x = w * (0.5 + 0.45 * Math.sin(time / 700 * (1 + i % 5) + i * 2.1)); y = H * (0.35 + 0.3 * Math.sin(time / 600 * (1 + i % 3) + i * 1.3)); }
        else if (isLiq) { x = w * (0.1 + 0.8 * ((U.hx(i) + time / 9000 * (1 + i % 4)) % 1)); y = H - R * 1.4 - U.hy(i) * H * 0.22 + Math.sin(time / 300 + i) * jig; }
        else { const col = i % 9, row = Math.floor(i / 9); x = w * 0.2 + col * R * 2.4 + Math.sin(time / 90 + i) * jig * 0.6; y = H - R * 1.4 - row * R * 2.2 + Math.cos(time / 80 + i) * jig * 0.6; }
        U.drawAtom(c, x, y, R, key === 'water' ? 'O' : 'C', { label: false });
      }
      U.text(c, st.seg.phase, 10, 18, { weight: 700, size: 12 });
    });
    function upd() {
      const st = state(), S = segs();
      stats.set('t', st.T.toFixed(1) + ' °C'); stats.set('p', st.seg.phase); stats.set('q', q.toFixed(2) + ' kJ');
      cv.redraw();
      U.clear(tbl);
      tbl.appendChild(U.panel('Heat for each segment', U.table(['Segment', 'Calculation', 'q (kJ)'], S.map(s2 => [s2.name, s2.f, s2.q.toFixed(2)]).concat([['<b>Total</b>', '', '<b>' + total().toFixed(2) + '</b>']]), { num: [2], hl: i => S[i] === st.seg }),
        U.callout(st.seg.Ta === st.seg.Tb ? `<b>Flat segment:</b> the temperature holds at ${st.seg.Ta} °C until the phase change is complete. Added energy breaks intermolecular attractions instead of speeding particles up.` : '<b>Sloped segment:</b> added energy increases the average kinetic energy of the particles, so the temperature rises.')));
    }
    upd();
  },
});
