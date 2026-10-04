'use strict';
App.register({
  id: 'coulomb', unit: 1, sym: 'Cl', title: 'Atomic Structure & Coulomb’s Law',
  desc: 'Shell models, core vs. valence electrons, effective nuclear charge, and Coulombic attraction.',
  tags: ['coulomb', 'shielding', 'effective nuclear charge', 'zeff', 'shell', 'core electrons', 'valence electrons', 'bohr model', 'attraction'],
  keyIdeas: [
    'Coulomb’s law: F ∝ q₁q₂ / r² and potential energy E ∝ q₁q₂ / r. Opposite charges attract (negative energy).',
    'Core electrons shield valence electrons from the full nuclear charge. A simple estimate: Z<sub>eff</sub> ≈ protons − core electrons.',
    'Across a period Z<sub>eff</sub> rises and the valence shell stays the same, so valence electrons are pulled closer and held more tightly.',
    'Down a group the valence shell is farther away, so attraction weakens even though Z<sub>eff</sub> is about the same.',
  ],
  render(el, scope) {
    const h = U.h;
    U.tabs(el, [
      {
        label: 'Shell model', render(b, s) {
          let A = 11, B = 17;
          const opts = ELEMENTS.list.slice(0, 56).map(e => ({ value: e.Z, label: `${e.Z}  ${e.name}` }));
          const panels = [];
          const make = (getZ, setZ) => {
            const sel = U.select({ label: 'Atom', options: opts, value: getZ(), onChange: v => { setZ(+v); refresh(); } });
            const cv = U.canvas(null, { aspect: 1, scope: s });
            const stats = U.stats([['z', 'Protons'], ['core', 'Core e⁻'], ['val', 'Valence e⁻'], ['zeff', 'Z<sub>eff</sub> ≈'], ['r', 'Radius'], ['att', 'Relative pull']]);
            panels.push({ getZ, cv, stats });
            return U.panel(null, sel.el, cv.wrap, stats.el);
          };
          b.append(h('div', { class: 'grid2' }, make(() => A, v => A = v), make(() => B, v => B = v)));
          const verdict = h('div');
          b.append(verdict);
          const shells = Z => { const c = ELEMENTS.config(Z); const n = {}; c.forEach(x => n[x.n] = (n[x.n] || 0) + x.e); return Object.keys(n).sort().map(k => n[k]); };
          const data = Z => {
            const sh = shells(Z), e = ELEMENTS.byZ[Z];
            const conf = ELEMENTS.config(Z), nmax = Math.max(...conf.map(x => x.n));
            const val = conf.filter(x => x.n === nmax).reduce((t, x) => t + x.e, 0);
            const core = Z - val, zeff = Z - core;
            const r = e.radius || 100;
            return { sh, val, core, zeff, r, pull: zeff / (r * r) * 1e4 };
          };
          s.loop((dt, time) => {
            for (const p of panels) {
              const Z = p.getZ(), d = data(Z), c = p.cv.ctx, w = p.cv.w, H = p.cv.h, t = U.theme();
              c.clearRect(0, 0, w, H);
              const cx = w / 2, cy = H / 2;
              const maxR = Math.min(w, H) * 0.46;
              const n = d.sh.length;
              const Rout = maxR * (0.3 + 0.7 * Math.min(1, d.r / 250));
              d.sh.forEach((cnt, k) => {
                const R = Rout * (0.3 + 0.7 * (k + 1) / n), valence = k === n - 1;
                c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2);
                c.strokeStyle = valence ? U.alpha(t.orange, 0.7) : U.alpha(t.ink3, 0.45); c.lineWidth = valence ? 2 : 1.2; c.stroke();
                for (let i = 0; i < cnt; i++) {
                  const a = i / cnt * Math.PI * 2 + time / 1000 * (0.5 / (k + 1)) * (k % 2 ? -1 : 1);
                  c.beginPath(); c.arc(cx + R * Math.cos(a), cy + R * Math.sin(a), valence ? 4.5 : 3.2, 0, 7);
                  c.fillStyle = valence ? t.orange : t.blue; c.fill();
                }
              });
              const nr = Math.max(10, 6 + Math.sqrt(Z) * 1.5);
              const g = c.createRadialGradient(cx - nr / 3, cy - nr / 3, 1, cx, cy, nr);
              g.addColorStop(0, U.shade(t.red, 0.4)); g.addColorStop(1, t.red);
              c.beginPath(); c.arc(cx, cy, nr, 0, 7); c.fillStyle = g; c.fill();
              U.text(c, '+' + Z, cx, cy + 4, { align: 'center', color: '#fff', weight: 700, size: 12 });
              U.text(c, ELEMENTS.byZ[Z].sym, 12, 22, { size: 20, weight: 700 });
              U.text(c, '● core', 12, H - 26, { size: 11, color: t.blue });
              U.text(c, '● valence', 12, H - 10, { size: 11, color: t.orange });
            }
          });
          function refresh() {
            const dA = data(A), dB = data(B);
            panels.forEach(p => {
              const d = data(p.getZ());
              p.stats.set('z', p.getZ()); p.stats.set('core', d.core); p.stats.set('val', d.val);
              p.stats.set('zeff', '+' + d.zeff); p.stats.set('r', d.r + ' pm');
              p.stats.set('att', (d.pull / Math.max(dA.pull, dB.pull) * 100).toFixed(0) + '%');
            });
            const eA = ELEMENTS.byZ[A], eB = ELEMENTS.byZ[B];
            U.clear(verdict);
            if (A === B) return;
            const strong = dA.pull > dB.pull ? eA : eB, weak = strong === eA ? eB : eA;
            const ds = strong === eA ? dA : dB, dw = strong === eA ? dB : dA;
            let why;
            if (ds.sh.length === dw.sh.length) why = `Both atoms have valence electrons in shell n = ${ds.sh.length}, but ${strong.name} has a larger effective nuclear charge (+${ds.zeff} vs +${dw.zeff}), so it pulls its valence electrons closer.`;
            else if (ds.sh.length < dw.sh.length) why = `${strong.name}’s valence electrons are in a lower shell (n = ${ds.sh.length} vs n = ${dw.sh.length}), closer to the nucleus, so Coulombic attraction is stronger.`;
            else why = `${strong.name} has a much larger effective nuclear charge (+${ds.zeff} vs +${dw.zeff}), which outweighs its larger valence shell.`;
            verdict.appendChild(U.callout(`<b>${strong.name} holds its valence electrons more tightly than ${weak.name}.</b> ${why} Expect ${strong.name} to have the smaller radius and higher ionization energy (${strong.ie} vs ${weak.ie} kJ/mol).`));
          }
          refresh();
        },
      },
      {
        label: 'Coulomb’s law', render(b, s) {
          let q1 = 1, q2 = -1, r = 3;
          const sq1 = U.slider({ label: 'Charge q₁', min: -3, max: 3, step: 1, value: q1, fmt: v => (v > 0 ? '+' : '') + v, onInput: v => { q1 = v || 1; if (!v) sq1.set(1); cv.redraw(); g.redraw(); out(); } });
          const sq2 = U.slider({ label: 'Charge q₂', min: -3, max: 3, step: 1, value: q2, fmt: v => (v > 0 ? '+' : '') + v, onInput: v => { q2 = v || -1; if (!v) sq2.set(-1); cv.redraw(); g.redraw(); out(); } });
          const sr = U.slider({ label: 'Distance r', min: 1, max: 6, step: 0.1, value: r, fmt: v => v.toFixed(1), unit: 'units', onInput: v => { r = v; cv.redraw(); g.redraw(); out(); } });
          const stats = U.stats([['f', 'Force ∝ q₁q₂/r²'], ['e', 'Energy ∝ q₁q₂/r'], ['t', 'Interaction']]);
          const cv = U.canvas(null, { aspect: 2.6, scope: s, draw: (c, w, H) => {
            const t = U.theme(), cy = H / 2, scale = (w - 120) / 6;
            const x1 = w / 2 - r * scale / 2, x2 = w / 2 + r * scale / 2;
            const ball = (x, q) => {
              const col = q > 0 ? t.red : t.blue, R = 14 + Math.abs(q) * 5;
              const gr = c.createRadialGradient(x - R / 3, cy - R / 3, 2, x, cy, R);
              gr.addColorStop(0, U.shade(col, 0.5)); gr.addColorStop(1, col);
              c.beginPath(); c.arc(x, cy, R, 0, 7); c.fillStyle = gr; c.fill();
              U.text(c, (q > 0 ? '+' : '−') + (Math.abs(q) > 1 ? Math.abs(q) : ''), x, cy + 5, { align: 'center', color: '#fff', weight: 700, size: 15 });
            };
            const F = q1 * q2 / (r * r);
            const len = U.clamp(Math.abs(F) * 40, 8, 90), col = F < 0 ? t.good : t.bad;
            if (F < 0) { U.arrow(c, x1 + 30, cy - 40, x1 + 30 + len, cy - 40, col, 3); U.arrow(c, x2 - 30, cy - 40, x2 - 30 - len, cy - 40, col, 3); }
            else { U.arrow(c, x1, cy - 40, x1 - len, cy - 40, col, 3); U.arrow(c, x2, cy - 40, x2 + len, cy - 40, col, 3); }
            c.strokeStyle = t.ink3; c.setLineDash([4, 4]); c.beginPath(); c.moveTo(x1, cy + 40); c.lineTo(x2, cy + 40); c.stroke(); c.setLineDash([]);
            U.text(c, 'r = ' + r.toFixed(1), w / 2, cy + 56, { align: 'center', mono: true, color: t.ink2 });
            ball(x1, q1); ball(x2, q2);
          } });
          const g = U.canvas(null, { aspect: 2.2, scope: s, draw: (c, w, H) => {
            const t = U.theme(), k = q1 * q2;
            const lim = Math.max(1.2, Math.abs(k)) * 1.1;
            const P = new U.Plot(c, w, H, { x: [0.5, 6], y: [-lim, lim], xlabel: 'Distance r', ylabel: 'Potential energy ∝ q₁q₂/r' });
            P.axes(); P.hline(0, t.ink3, [2, 3]);
            P.fn(x => k / x, k < 0 ? t.good : t.bad, 2.5);
            P.dot(r, k / r, t.ink, 6);
            P.label(k < 0 ? 'attraction: energy is lowered as r shrinks' : 'repulsion: energy rises as r shrinks', 0.7, k < 0 ? -lim * 0.9 : lim * 0.85, t.ink2, { dy: 0 });
          } });
          b.append(h('div', { class: 'grid-viz' }, h('div', { class: 'stack' }, U.panel('Two point charges', cv.wrap), U.panel('Energy vs. distance', g.wrap)),
            h('div', { class: 'stack' }, U.panel('Adjust', sq1.el, sq2.el, sr.el), stats.el,
              U.callout('Doubling the distance cuts the force to ¼. Doubling one charge doubles the force. This is why Mg<sup>2+</sup>O<sup>2−</sup> has a much larger lattice energy than Na<sup>+</sup>Cl<sup>−</sup>.'))));
          function out() {
            const F = q1 * q2 / (r * r), E = q1 * q2 / r;
            stats.set('f', U.signed(F, 3)); stats.set('e', U.signed(E, 3));
            stats.set('t', F < 0 ? '<span style="color:var(--good)">attractive</span>' : '<span style="color:var(--bad)">repulsive</span>');
          }
          out();
        },
      },
    ], scope, { key: 'coulomb' });
  },
});
