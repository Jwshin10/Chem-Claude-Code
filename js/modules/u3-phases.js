'use strict';
App.register({
  id: 'phases', unit: 3, sym: 'Ph', title: 'Phase Diagrams & Vapor Pressure',
  desc: 'Drag through the phase diagrams of water and CO₂, and see how vapor pressure sets the boiling point.',
  tags: ['phase diagram', 'triple point', 'critical point', 'supercritical', 'sublimation', 'vapor pressure', 'boiling point', 'states of matter', 'solid liquid gas'],
  keyIdeas: [
    'Solids: particles vibrate in fixed positions. Liquids: particles are close but move past each other. Gases: particles are far apart and move freely.',
    'Lines on a phase diagram are conditions where two phases coexist; the <b>triple point</b> is where all three coexist.',
    'Above the <b>critical point</b>, liquid and gas become a single supercritical fluid.',
    'Water’s solid–liquid line slopes left because ice is less dense than liquid water (hydrogen-bonded open lattice).',
    'A liquid boils when its vapor pressure equals the external pressure. Stronger IMFs → lower vapor pressure → higher boiling point.',
  ],
  render(el, scope) {
    const h = U.h;
    U.tabs(el, [{ label: 'Phase diagram', render: diagram }, { label: 'Vapor pressure', render: vapor }], scope, { key: 'phases' });

    function diagram(b, s) {
      const SYS = {
        H2O: { name: 'Water', tp: [0.01, 0.006], cp: [374, 218], nbp: 100, nmp: 0, slope: -0.0074, sub: 6140, Tr: [-60, 420] },
        CO2: { name: 'Carbon dioxide', tp: [-56.6, 5.11], cp: [31.0, 72.8], nbp: null, nmp: null, slope: 0.017, Tr: [-120, 80] },
      };
      let key = 'H2O', T = 25, Pa = 1;
      const seg = U.seg({ options: [{ value: 'H2O', label: 'Water (H₂O)' }, { value: 'CO2', label: 'Carbon dioxide (CO₂)' }], value: key, onChange: v => { key = v; if (v === 'CO2') { T = -78; Pa = 1; } else { T = 25; Pa = 1; } upd(); } });
      const stats = U.stats([['t', 'Temperature'], ['p', 'Pressure'], ['ph', 'Phase']]);
      const note = h('div');
      let Pl = null;
      const cv = U.canvas(null, { aspect: 1.35, scope: s, drag: true, hint: 'drag the point', draw });
      const box = U.canvas(null, { aspect: 1.4, scope: s });
      b.append(h('div', { class: 'grid-viz' }, U.panel(null, seg.el, cv.wrap), h('div', { class: 'stack' }, stats.el, U.panel('Particle view', box.wrap), note)));
      // curves (T in °C, P in atm)
      const K = c => c + 273.15;
      function vapP(S, Tc) { // ln P linear in 1/T through triple & critical points
        const [t1, p1] = S.tp, [t2, p2] = S.cp;
        const B = Math.log(p2 / p1) / (1 / K(t1) - 1 / K(t2));
        return p1 * Math.exp(B * (1 / K(t1) - 1 / K(Tc)));
      }
      function subP(S, Tc) {
        if (key === 'CO2') { const B = Math.log(5.11 / 1) / (1 / K(-78.5) - 1 / K(-56.6)); return 5.11 * Math.exp(B * (1 / K(-56.6) - 1 / K(Tc))); }
        return S.tp[1] * Math.exp(S.sub * (1 / K(S.tp[0]) - 1 / K(Tc)));
      }
      const meltT = (S, P) => S.tp[0] + S.slope * (P - S.tp[1]);
      function phase(S, Tc, P) {
        if (Tc >= S.cp[0] && P >= S.cp[1]) return 'supercritical fluid';
        if (Tc < S.tp[0] && P < subP(S, Tc) && Tc < meltT(S, P)) return 'gas';
        if (Tc >= S.tp[0] && Tc < S.cp[0] && P < vapP(S, Tc)) return 'gas';
        if (Tc >= S.cp[0]) return 'gas';
        return Tc < meltT(S, P) ? 'solid' : 'liquid';
      }
      function draw(c, w, H) {
        const t = U.theme(), S = SYS[key];
        Pl = new U.Plot(c, w, H, { x: S.Tr, y: [-3, 3], xlabel: 'Temperature (°C)', ylabel: 'Pressure (atm, log scale)', yticks: [-3, -2, -1, 0, 1, 2, 3], yfmt: v => ({ '-3': '0.001', '-2': '0.01', '-1': '0.1', '0': '1', '1': '10', '2': '100', '3': '1000' })[v] });
        Pl.axes();
        const L = v => Math.log10(v);
        // region tints
        const regions = [];
        for (let i = 0; i <= 60; i++) for (let j = 0; j <= 40; j++) {
          const Tc = S.Tr[0] + (S.Tr[1] - S.Tr[0]) * i / 60, P = Math.pow(10, -3 + 6 * j / 40);
          regions.push([Tc, P, phase(S, Tc, P)]);
        }
        const col = { solid: t.blue, liquid: t.teal, gas: t.orange, 'supercritical fluid': t.purple };
        Pl.clip(cc => regions.forEach(([Tc, P, ph]) => { cc.fillStyle = U.alpha(col[ph], 0.1); cc.fillRect(Pl.X(Tc) - 0.5, Pl.Y(L(P)) - (Pl.B - Pl.T) / 40 / 2 - 0.5, (Pl.R - Pl.L) / 60 + 1, (Pl.B - Pl.T) / 40 + 1); }));
        const pts = [];
        for (let Tc = S.tp[0]; Tc <= S.cp[0]; Tc += 1) pts.push([Tc, L(vapP(S, Tc))]);
        pts.push([S.cp[0], L(S.cp[1])]);
        Pl.line(pts, t.ink, 2.4);
        const sp = []; for (let Tc = S.Tr[0]; Tc <= S.tp[0]; Tc += 1) sp.push([Tc, L(subP(S, Tc))]); sp.push([S.tp[0], L(S.tp[1])]);
        Pl.line(sp, t.ink, 2.4);
        const mp = []; for (let lp = L(S.tp[1]); lp <= 3.01; lp += 0.05) mp.push([meltT(S, Math.pow(10, lp)), lp]);
        Pl.line(mp, t.ink, 2.4);
        Pl.dot(S.tp[0], L(S.tp[1]), t.ink, 5); Pl.label('triple point', S.tp[0], L(S.tp[1]), t.ink, { dx: 8, dy: 14 });
        Pl.dot(S.cp[0], L(S.cp[1]), t.purple, 5); Pl.label('critical point', S.cp[0], L(S.cp[1]), t.purple, { dx: -8, dy: -8, align: 'right' });
        Pl.hline(0, U.alpha(t.ink3, 0.8), [4, 4], '1 atm', true);
        const lab = (txt, Tc, lp, cl) => Pl.label(txt, Tc, lp, cl, { align: 'center', size: 14, weight: 700 });
        if (key === 'H2O') { lab('SOLID', -35, 1.8, t.blue); lab('LIQUID', 150, 2.2, t.teal); lab('GAS', 250, -1.8, t.orange); }
        else { lab('SOLID', -95, 2.2, t.blue); lab('LIQUID', 0, 2.4, t.teal); lab('GAS', 10, -1.5, t.orange); }
        if (S.nbp != null) { Pl.dot(S.nbp, 0, t.ink2, 3.5); Pl.label('normal bp', S.nbp, 0, t.ink2, { dx: 6, dy: 14 }); }
        Pl.dot(T, L(Pa), t.red, 8);
      }
      U.drag(cv, { down: p => Pl && Pl.inside(p.x, p.y), move: p => { if (!Pl) return; T = U.clamp(Pl.invX(p.x), SYS[key].Tr[0], SYS[key].Tr[1]); Pa = Math.pow(10, U.clamp(Pl.invY(p.y), -3, 3)); upd(); } }, s);
      const parts = Array.from({ length: 30 }, (_, i) => ({ x: Math.random(), y: Math.random(), vx: U.rand(-1, 1), vy: U.rand(-1, 1), i }));
      s.loop((dt, time) => {
        const c = box.ctx, w = box.w, H = box.h, t = U.theme(), ph = phase(SYS[key], T, Pa);
        c.clearRect(0, 0, w, H);
        const R = Math.min(w, H) / 22, speed = Math.sqrt(K(T) / 300);
        parts.forEach((p, i) => {
          let x, y;
          if (ph === 'solid') { const col = i % 6, row = Math.floor(i / 6); x = w * 0.2 + col * R * 2.3 + Math.sin(time / 90 + i) * 1.5 * speed; y = H - R * 1.4 - row * R * 2.1 + Math.cos(time / 80 + i) * 1.5 * speed; }
          else if (ph === 'liquid') {
            p.x += p.vx * dt * 0.08 * speed; p.y += p.vy * dt * 0.08 * speed;
            if (p.x < 0.05 || p.x > 0.95) p.vx *= -1; if (p.y < 0 || p.y > 1) p.vy *= -1;
            p.x = U.clamp(p.x, 0.05, 0.95); p.y = U.clamp(p.y, 0, 1);
            x = w * (0.08 + p.x * 0.84); y = H - R - p.y * H * 0.38;
          } else {
            const f = ph === 'gas' ? 0.5 : 0.3;
            p.x += p.vx * dt * f * speed; p.y += p.vy * dt * f * speed;
            if (p.x < 0.03 || p.x > 0.97) p.vx *= -1; if (p.y < 0.03 || p.y > 0.97) p.vy *= -1;
            p.x = U.clamp(p.x, 0.03, 0.97); p.y = U.clamp(p.y, 0.03, 0.97);
            x = w * p.x; y = H * p.y;
          }
          U.drawAtom(c, x, y, ph === 'supercritical fluid' ? R * 0.85 : R, key === 'H2O' ? 'O' : 'C', { label: false });
        });
        U.text(c, ph, 10, 20, { weight: 700, size: 13 });
      });
      function upd() {
        seg.set(key);
        const S = SYS[key], ph = phase(S, T, Pa);
        stats.set('t', T.toFixed(0) + ' °C'); stats.set('p', U.sig(Pa, 3) + ' atm'); stats.set('ph', ph);
        cv.redraw();
        U.clear(note);
        note.appendChild(U.callout(key === 'H2O'
          ? 'At 1 atm, water melts at 0 °C and boils at 100 °C. Raising the pressure on ice can melt it, because the solid–liquid line slopes backward.'
          : 'At 1 atm, CO₂ cannot be a liquid: it sublimes directly from solid (dry ice) to gas at −78 °C. Liquid CO₂ exists only above 5.1 atm.'));
      }
      upd();
    }

    function vapor(b, s) {
      const LIQ = [['Diethyl ether', 34.6, 26.5, 'LDF + weak dipole'], ['Acetone', 56.0, 31.3, 'dipole–dipole'], ['Ethanol', 78.4, 38.6, 'hydrogen bonding'], ['Water', 100, 40.7, 'extensive hydrogen bonding']];
      let Pext = 760;
      const sl = U.slider({ label: 'External pressure', min: 200, max: 1000, step: 5, value: Pext, unit: 'torr', onInput: v => { Pext = v; cv.redraw(); tbl(); } });
      const presets = h('div', { class: 'row' }, [['Sea level', 760], ['Denver (1.6 km)', 630], ['Mt. Everest', 253], ['Pressure cooker', 1000]].map(([n, v]) => U.btn(n, () => { Pext = v; sl.set(v); cv.redraw(); tbl(); }, 'sm')));
      const out = h('div');
      const vp = (L, Tc) => 760 * Math.exp(-L[2] * 1000 / 8.314 * (1 / (Tc + 273.15) - 1 / (L[1] + 273.15)));
      const bpAt = (L, P) => 1 / (1 / (L[1] + 273.15) - 8.314 * Math.log(P / 760) / (L[2] * 1000)) - 273.15;
      const cv = U.canvas(null, { aspect: 1.7, scope: s, draw: (c, w, H) => {
        const t = U.theme(), cols = [t.orange, t.purple, t.teal, t.blue];
        const P = new U.Plot(c, w, H, { x: [-10, 120], y: [0, 1100], xlabel: 'Temperature (°C)', ylabel: 'Vapor pressure (torr)' });
        P.axes();
        P.hline(Pext, t.red, [6, 4], 'external pressure = ' + Pext + ' torr', true);
        LIQ.forEach((L, i) => {
          P.fn(x => vp(L, x), cols[i], 2.5);
          const bp = bpAt(L, Pext);
          if (bp > -10 && bp < 120) { P.dot(bp, Pext, cols[i], 5); P.vline(bp, U.alpha(cols[i], 0.5), [2, 3]); }
          const xl = Math.min(115, bpAt(L, 1050));
          P.label(L[0], xl, vp(L, xl), cols[i], { dx: -4, dy: -6, align: 'right' });
        });
      } });
      b.append(h('div', { class: 'grid-viz' }, U.panel('Vapor pressure curves', cv.wrap), h('div', { class: 'stack' }, U.panel('Boiling point depends on pressure', sl.el, presets), out)));
      function tbl() {
        U.clear(out);
        out.append(U.table(['Liquid', 'Strongest IMF', 'bp at this P'], LIQ.map(L => [L[0], L[3], bpAt(L, Pext).toFixed(1) + ' °C']), {}),
          U.callout('Each liquid boils where its curve crosses the external pressure line. Water has the strongest IMFs, so it has the lowest vapor pressure at any temperature and the highest boiling point.'));
      }
      tbl();
    }
  },
});
