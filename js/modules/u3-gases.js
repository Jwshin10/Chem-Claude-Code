'use strict';
App.register({
  id: 'gas-laws', unit: 3, sym: 'Gs', title: 'Gas Laws & Kinetic Molecular Theory',
  desc: 'A piston simulator for PV = nRT, partial pressures, and why real gases deviate from ideal behavior.',
  tags: ['ideal gas law', 'pv=nrt', 'boyle', 'charles', 'gay-lussac', 'avogadro', 'dalton', 'partial pressure', 'kmt', 'kinetic molecular theory', 'real gas', 'van der waals', 'pressure'],
  keyIdeas: [
    'Ideal gas law: <b>PV = nRT</b> (R = 0.08206 L·atm/mol·K). Temperature must be in kelvin.',
    'KMT: gas pressure comes from collisions with the walls. Average kinetic energy is proportional to absolute temperature.',
    'Boyle: P ∝ 1/V. Charles: V ∝ T. Gay-Lussac: P ∝ T. Avogadro: V ∝ n.',
    'Dalton’s law: P<sub>total</sub> = ΣP<sub>i</sub> and P<sub>A</sub> = X<sub>A</sub> · P<sub>total</sub>.',
    'Real gases deviate most at <b>high pressure</b> (particle volume matters) and <b>low temperature</b> (attractions matter). Polar, large molecules deviate more.',
  ],
  render(el, scope) {
    const h = U.h;
    U.tabs(el, [{ label: 'Piston simulator', render: piston }, { label: 'Partial pressures', render: dalton }, { label: 'Real vs. ideal', render: real }], scope, { key: 'gases' });

    function piston(b, s) {
      let n = 1.0, T = 300, V = 22.4, hold = 'none', hits = 0, hitRate = 0;
      const P = () => n * K.Rl * T / V;
      const sn = U.slider({ label: 'Amount n', min: 0.2, max: 3, step: 0.1, value: n, unit: 'mol', fmt: v => v.toFixed(1), onInput: v => { const p0 = P(); n = v; keep(p0); sync(); } });
      const sT = U.slider({ label: 'Temperature T', min: 100, max: 800, step: 5, value: T, unit: 'K', onInput: v => { const p0 = P(); T = v; keep(p0); sync(); } });
      const sV = U.slider({ label: 'Volume V', min: 5, max: 50, step: 0.5, value: V, unit: 'L', fmt: v => v.toFixed(1), onInput: v => { V = v; sync(); } });
      const holdSeg = U.seg({ options: [{ value: 'none', label: 'Volume fixed' }, { value: 'P', label: 'Pressure fixed (piston free)' }], value: hold, onChange: v => { hold = v; } });
      function keep(p0) { if (hold === 'P') { V = U.clamp(n * K.Rl * T / p0, 5, 50); sV.set(V); } }
      const stats = U.stats([['p', 'Pressure P = nRT/V'], ['ke', 'Avg. kinetic energy'], ['v', 'Collisions / s']]);
      const law = h('div');
      const box = U.canvas(null, { aspect: 1.5, scope: s });
      const gr = U.canvas(null, { aspect: 1.6, scope: s, draw: graph });
      b.append(h('div', { class: 'grid-viz' }, h('div', { class: 'stack' }, U.panel(null, box.wrap), U.panel('P vs. V at this n and T (Boyle’s law)', gr.wrap)),
        h('div', { class: 'stack' }, U.panel('Adjust', sn.el, sT.el, sV.el, h('div', { class: 'field' }, h('span', { class: 'lbl' }, 'When n or T changes'), holdSeg.el)), stats.el, law)));
      const parts = [];
      const ensure = () => { const want = Math.round(n * 30); while (parts.length < want) parts.push({ x: Math.random(), y: Math.random(), a: U.rand(0, 6.283) }); parts.length = want; };
      s.loop((dt) => {
        ensure();
        const c = box.ctx, w = box.w, H = box.h, t = U.theme();
        c.clearRect(0, 0, w, H);
        const maxW = w - 70, bw = maxW * V / 50, x0 = 20, y0 = 16, bh = H - 32;
        c.fillStyle = t.surface; c.fillRect(x0, y0, bw, bh);
        c.strokeStyle = t.ink2; c.lineWidth = 3; c.beginPath(); c.moveTo(x0 + bw, y0); c.lineTo(x0, y0); c.lineTo(x0, y0 + bh); c.lineTo(x0 + bw, y0 + bh); c.stroke();
        // piston
        c.fillStyle = t.ink3; c.fillRect(x0 + bw, y0 - 6, 10, bh + 12); c.fillRect(x0 + bw + 10, y0 + bh / 2 - 4, w - x0 - bw - 14, 8);
        const speed = Math.sqrt(T / 300) * 0.55;
        parts.forEach(p => {
          p.x += Math.cos(p.a) * speed * dt * 50 / bw * 6; p.y += Math.sin(p.a) * speed * dt * 50 / bh * 6;
          if (p.x < 0) { p.x = -p.x; p.a = Math.PI - p.a; hits++; } if (p.x > 1) { p.x = 2 - p.x; p.a = Math.PI - p.a; hits++; }
          if (p.y < 0) { p.y = -p.y; p.a = -p.a; hits++; } if (p.y > 1) { p.y = 2 - p.y; p.a = -p.a; hits++; }
          p.x = U.clamp(p.x, 0, 1); p.y = U.clamp(p.y, 0, 1);
          const col = U.mix('#3b82f6', '#ef4444', U.clamp((T - 100) / 700, 0, 1));
          c.beginPath(); c.arc(x0 + 6 + p.x * (bw - 12), y0 + 6 + p.y * (bh - 12), 4.5, 0, 7); c.fillStyle = col; c.fill();
        });
        hitRate = hitRate * 0.97 + hits / Math.max(dt, 1e-3) * 0.03; hits = 0;
        // gauge
        const gx = w - 26, gy = 34, gr2 = 20, frac = U.clamp(P() / 10, 0, 1);
        c.beginPath(); c.arc(gx, gy, gr2, Math.PI * 0.75, Math.PI * 2.25); c.strokeStyle = t.line; c.lineWidth = 5; c.stroke();
        c.beginPath(); c.arc(gx, gy, gr2, Math.PI * 0.75, Math.PI * (0.75 + 1.5 * frac)); c.strokeStyle = t.red; c.stroke();
        U.text(c, U.sig(P(), 3), gx, gy + 4, { align: 'center', mono: true, size: 10, weight: 600 });
        U.text(c, 'atm', gx, gy + 34, { align: 'center', size: 10, color: t.ink3 });
        stats.set('v', Math.round(hitRate));
      });
      function graph(c, w, H) {
        const t = U.theme();
        const Pl = new U.Plot(c, w, H, { x: [0, 50], y: [0, 10], xlabel: 'Volume (L)', ylabel: 'Pressure (atm)' });
        Pl.axes();
        Pl.fn(v => n * K.Rl * T / v, t.accent, 2.5, null, 300, 1, 50);
        Pl.dot(V, P(), t.red, 6);
        Pl.label(`n = ${n.toFixed(1)} mol, T = ${T} K`, 30, 9, t.ink2, {});
      }
      function sync() {
        stats.set('p', U.sig(P(), 3) + ' atm');
        stats.set('ke', (1.5 * K.R * T / 1000).toFixed(2) + ' kJ/mol');
        gr.redraw();
        U.clear(law);
        law.append(U.callout(`<div class="mono">P = nRT / V = (${n.toFixed(1)})(0.08206)(${T}) / ${V.toFixed(1)} = <b>${U.sig(P(), 3)} atm</b></div>` +
          `<div style="margin-top:6px">${hold === 'P' ? 'With the piston free to move, heating the gas or adding particles pushes the piston out, so V grows in proportion (Charles’s / Avogadro’s laws).' : 'With volume fixed, faster or more particles hit the walls more often and harder, so pressure rises (Gay-Lussac’s law). Drag the volume slider to see Boyle’s law.'}</div>`));
      }
      sync();
    }

    function dalton(b, s) {
      let n1 = 1, n2 = 2, n3 = 0.5, T = 298, V = 10;
      const G = [['N₂', () => n1, v => n1 = v, 'N'], ['O₂', () => n2, v => n2 = v, 'O'], ['He', () => n3, v => n3 = v, 'He']];
      const sliders = G.map(([nm, g, st]) => U.slider({ label: 'n(' + nm + ')', min: 0, max: 3, step: 0.1, value: g(), unit: 'mol', fmt: v => v.toFixed(1), onInput: v => { st(v); upd(); } }));
      const out = h('div');
      const cv = U.canvas(null, { aspect: 1.5, scope: s });
      b.append(h('div', { class: 'grid-viz' }, U.panel('Gas mixture in a 10.0 L flask at 298 K', cv.wrap), h('div', { class: 'stack' }, U.panel('Moles of each gas', ...sliders.map(x => x.el)), out)));
      const parts = Array.from({ length: 200 }, () => ({ x: Math.random(), y: Math.random(), vx: U.rand(-1, 1), vy: U.rand(-1, 1) }));
      s.loop(dt => {
        const c = cv.ctx, w = cv.w, H = cv.h;
        c.clearRect(0, 0, w, H);
        let k = 0;
        G.forEach(([nm, g, st, el], gi) => {
          const cnt = Math.round(g() * 20);
          for (let i = 0; i < cnt && k < parts.length; i++, k++) {
            const p = parts[k], sp = el === 'He' ? 0.5 : 0.22;
            p.x += p.vx * dt * sp; p.y += p.vy * dt * sp;
            if (p.x < 0 || p.x > 1) p.vx *= -1; if (p.y < 0 || p.y > 1) p.vy *= -1;
            p.x = U.clamp(p.x, 0, 1); p.y = U.clamp(p.y, 0, 1);
            U.drawAtom(c, 8 + p.x * (w - 16), 8 + p.y * (H - 16), el === 'He' ? 4.5 : 6.5, el, { label: false });
          }
        });
      });
      function upd() {
        const nt = n1 + n2 + n3, Pt = nt * K.Rl * T / V;
        U.clear(out);
        out.append(U.table(['Gas', 'n (mol)', 'Mole fraction X', 'Partial P (atm)'], G.map(([nm, g]) => [nm, g().toFixed(1), nt ? (g() / nt).toFixed(3) : '—', (g() * K.Rl * T / V).toFixed(2)]).concat([['<b>Total</b>', nt.toFixed(1), '1.000', '<b>' + Pt.toFixed(2) + '</b>']]), { num: [1, 2, 3] }),
          U.callout('Each gas exerts pressure as if it were alone: P<sub>i</sub> = n<sub>i</sub>RT/V. Partial pressures add up to the total, and P<sub>i</sub> = X<sub>i</sub>·P<sub>total</sub>. The speedy He particles are lighter, not more energetic: all gases at the same T have the same average kinetic energy.'));
      }
      upd();
    }

    function real(b, s) {
      const GAS = { He: [0.0346, 0.0238], H2: [0.2476, 0.02661], N2: [1.370, 0.0387], CH4: [2.283, 0.04278], CO2: [3.640, 0.04267], NH3: [4.225, 0.0371], H2O: [5.536, 0.03049] };
      let T = 300, on = { He: true, N2: true, CO2: true, NH3: true };
      const sT = U.slider({ label: 'Temperature', min: 250, max: 1000, step: 10, value: T, unit: 'K', onInput: v => { T = v; cv.redraw(); } });
      const checks = h('div', { class: 'row' }, Object.keys(GAS).map(g => U.check({ label: U.chemText(g), checked: !!on[g], onChange: v => { on[g] = v; cv.redraw(); } }).el));
      const Vof = (g, P) => { // van der Waals molar volume (gas root) via Newton
        const [a, bb] = GAS[g]; let V = K.Rl * T / P + bb;
        for (let i = 0; i < 60; i++) { const f = K.Rl * T / (V - bb) - a / (V * V) - P; const d = -K.Rl * T / ((V - bb) ** 2) + 2 * a / (V ** 3); const nv = V - f / d; V = nv > bb * 1.01 ? nv : (V + bb) / 2; }
        return V;
      };
      const cols = () => { const t = U.theme(); return { He: t.teal, H2: t.gray, N2: t.blue, CH4: t.green, CO2: t.orange, NH3: t.purple, H2O: t.red }; };
      const cv = U.canvas(null, { aspect: 1.7, scope: s, draw: (c, w, H) => {
        const t = U.theme(), cl = cols();
        const P = new U.Plot(c, w, H, { x: [0, 400], y: [0.3, 1.6], xlabel: 'Pressure (atm)', ylabel: 'PV / nRT' });
        P.axes(); P.hline(1, t.ink, [6, 4], 'ideal gas', true);
        Object.keys(GAS).filter(g => on[g]).forEach(g => { const pts = P.fn(p => p * Vof(g, Math.max(p, 0.01)) / (K.Rl * T), cl[g], 2.4, null, 120, 0.5, 400); const last = pts[Math.round(pts.length * 0.8)]; P.label(U.chemText(g), last[0], last[1], cl[g], { dy: -6 }); });
      } });
      b.append(h('div', { class: 'grid-viz' }, U.panel('Compressibility factor (van der Waals model)', cv.wrap),
        h('div', { class: 'stack' }, U.panel('Settings', sT.el, checks),
          U.callout('<b>Below the line (PV/nRT &lt; 1):</b> attractions pull particles together, so they hit the walls less hard. This matters most for polar or large gases (NH₃, CO₂) at low temperature.'),
          U.callout('<b>Above the line:</b> at very high pressure the particles’ own volume is no longer negligible, so the real volume is larger than the ideal prediction.', 'warn'),
          h('p', { class: 'small muted' }, 'Gases behave most ideally at high temperature and low pressure. Helium, small and nonpolar, stays closest to ideal.'))));
    }
  },
});
