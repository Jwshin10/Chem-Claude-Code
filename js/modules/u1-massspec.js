'use strict';
App.register({
  id: 'mass-spec', unit: 1, sym: 'Ms', title: 'Mass Spectrometry',
  desc: 'Watch ions separate by mass, read isotope peaks, and calculate average atomic mass.',
  tags: ['isotopes', 'mass spectrum', 'average atomic mass', 'abundance', 'm/z'],
  keyIdeas: [
    'A mass spectrum shows each isotope as a peak: position = mass (m/z), height = relative abundance.',
    'Average atomic mass = Σ (isotope mass × fractional abundance). It is closer to the most abundant isotope.',
    'Lighter ions are deflected more by the magnetic field, which is how the instrument separates isotopes.',
    'Diatomic elements such as Cl<sub>2</sub> show peaks for each isotope combination (for Cl<sub>2</sub>: 70, 72, 74 in a 9 : 6 : 1 ratio).',
  ],
  render(el, scope) {
    const h = U.h;
    const ISO = {
      Li: [[6.015, 7.59], [7.016, 92.41]], B: [[10.013, 19.9], [11.009, 80.1]], C: [[12.000, 98.93], [13.003, 1.07]],
      Ne: [[19.992, 90.48], [20.994, 0.27], [21.991, 9.25]], Mg: [[23.985, 78.99], [24.986, 10.00], [25.983, 11.01]],
      Si: [[27.977, 92.23], [28.976, 4.68], [29.974, 3.09]], Cl: [[34.969, 75.78], [36.966, 24.22]],
      Cu: [[62.930, 69.15], [64.928, 30.85]], Ga: [[68.926, 60.11], [70.925, 39.89]], Br: [[78.918, 50.69], [80.916, 49.31]],
      Zr: [[89.905, 51.45], [90.906, 11.22], [91.905, 17.15], [93.906, 17.38], [95.908, 2.80]], Ag: [[106.905, 51.84], [108.905, 48.16]],
    };
    let sym = 'Cl', diatomic = false, mystery = false, guessResult = null;
    const ISO_COLORS = () => { const t = U.theme(); return [t.blue, t.orange, t.green, t.purple, t.pink, t.teal]; };

    const peaks = () => {
      const iso = ISO[sym].map(([m, a]) => [m, a / 100]);
      if (!diatomic) return iso.map(([m, f], i) => ({ m, f, label: Math.round(m) + sym, ci: i }));
      const out = {};
      iso.forEach(([m1, f1], i) => iso.forEach(([m2, f2], j) => {
        if (j < i) return;
        const key = Math.round(m1 + m2);
        const f = f1 * f2 * (i === j ? 1 : 2);
        out[key] = out[key] || { m: m1 + m2, f: 0, label: key + '', ci: i + j };
        out[key].f += f;
      }));
      return Object.values(out).sort((a, b) => a.m - b.m);
    };

    const sel = U.select({ label: 'Element', options: Object.keys(ISO).map(s => ({ value: s, label: `${ELEMENTS.bySym[s].name} (${s})` })), value: sym, onChange: v => { sym = v; guessResult = null; update(); } });
    const dia = U.check({ label: 'Show as diatomic X₂ molecule', checked: false, onChange: v => { diatomic = v; update(); } });
    const mys = U.check({ label: 'Mystery mode (hide the element)', checked: false, onChange: v => { mystery = v; if (v) { sym = U.pick(Object.keys(ISO)); sel.set(sym); } guessResult = null; update(); } });
    const guessBox = h('div', { class: 'row' });
    const calcBox = h('div', { class: 'stack' });

    const left = h('div', { class: 'stack' });
    const right = h('div', { class: 'stack' });
    el.append(h('div', { class: 'grid-viz' }, left, right));

    // ---- instrument animation ----
    const ions = [];
    let spawn = 0;
    const inst = U.canvas(null, { aspect: 2.1, scope });
    left.appendChild(U.panel('Inside the mass spectrometer', inst.wrap, h('p', { class: 'small muted' }, 'Ions are accelerated, then bent by a magnetic field. The radius of the path grows with mass, so each isotope lands at a different spot on the detector.')));
    const specCv = U.canvas(null, { aspect: 1.9, scope, draw: drawSpectrum });
    left.appendChild(U.panel('Mass spectrum', specCv.wrap));
    right.append(U.panel('Sample', sel.el, dia.el, mys.el, guessBox), calcBox);

    function geom(w, hgt) {
      const ps = peaks();
      const ms = ps.map(p => p.m);
      const mMin = Math.min(...ms), mMax = Math.max(...ms);
      const sx = w * 0.18, sy = hgt * 0.82;
      const rFor = m => { const t = mMax === mMin ? 0.5 : (m - mMin) / (mMax - mMin); return hgt * (0.38 + 0.3 * t); };
      return { ps, sx, sy, rFor };
    }
    scope.loop(dt => {
      const c = inst.ctx, w = inst.w, H = inst.h, t = U.theme();
      c.clearRect(0, 0, w, H);
      const g = geom(w, H);
      // source & accelerator
      c.fillStyle = t.surface3; U.roundRect(c, 8, g.sy - 16, w * 0.1, 32, 6); c.fill();
      U.text(c, 'ion source', 10, g.sy + 30, { size: 11, color: t.ink3 });
      c.fillStyle = U.alpha(t.purple, 0.12); c.fillRect(g.sx, H * 0.04, w * 0.8, g.sy - H * 0.04 + 6);
      U.text(c, 'magnetic field region', w * 0.55, H * 0.12, { size: 11, color: t.purple, align: 'center', weight: 600 });
      // detector line at y = sy, to the right
      c.strokeStyle = t.ink2; c.lineWidth = 4;
      c.beginPath(); c.moveTo(g.sx + 2 * g.rFor(g.ps[0].m) - 30, g.sy + 2); c.lineTo(w - 10, g.sy + 2); c.stroke();
      U.text(c, 'detector', w - 12, g.sy + 20, { size: 11, color: t.ink3, align: 'right' });
      const cols = ISO_COLORS();
      // paths
      g.ps.forEach(p => {
        const r = g.rFor(p.m);
        c.strokeStyle = U.alpha(cols[p.ci % cols.length], 0.25); c.lineWidth = 1.5; c.setLineDash([4, 4]);
        c.beginPath(); c.arc(g.sx + r, g.sy, r, Math.PI, 2 * Math.PI); c.stroke(); c.setLineDash([]);
        const x = g.sx + 2 * r;
        c.fillStyle = cols[p.ci % cols.length];
        c.fillRect(x - 3, g.sy - 2 - p.f * 30, 6, p.f * 30 + 2);
        U.text(c, mystery ? Math.round(p.m) + '' : p.label, x, g.sy + 34, { size: 11, align: 'center', color: cols[p.ci % cols.length], weight: 600 });
      });
      // spawn ions weighted by abundance
      spawn += dt * 30;
      while (spawn > 1) {
        spawn--;
        let r = Math.random(), tot = g.ps.reduce((s, p) => s + p.f, 0), pick = g.ps[0];
        for (const p of g.ps) { r -= p.f / tot; if (r <= 0) { pick = p; break; } }
        ions.push({ p: pick, x: 20, phase: 0, a: Math.PI });
      }
      for (let i = ions.length - 1; i >= 0; i--) {
        const io = ions[i];
        const r = g.rFor(io.p.m);
        let x, y;
        if (io.phase === 0) { io.x += dt * w * 0.5; x = io.x; y = g.sy; if (io.x >= g.sx) io.phase = 1; }
        else { io.a += dt * (w * 0.5) / r; x = g.sx + r + r * Math.cos(io.a); y = g.sy + r * Math.sin(io.a); if (io.a >= 2 * Math.PI) { ions.splice(i, 1); continue; } }
        c.beginPath(); c.arc(x, y, 3.2, 0, 7); c.fillStyle = cols[io.p.ci % cols.length]; c.fill();
      }
      if (ions.length > 300) ions.splice(0, ions.length - 300);
    });

    function drawSpectrum(c, w, H) {
      const t = U.theme(), ps = peaks(), cols = ISO_COLORS();
      const ms = ps.map(p => p.m);
      const lo = Math.floor(Math.min(...ms)) - 2, hi = Math.ceil(Math.max(...ms)) + 2;
      const maxF = Math.max(...ps.map(p => p.f));
      const P = new U.Plot(c, w, H, { x: [lo, hi], y: [0, 105], xlabel: 'Mass-to-charge ratio (m/z)', ylabel: 'Relative abundance (%)', nx: Math.min(12, hi - lo + 1) });
      P.axes();
      ps.forEach(p => {
        const rel = p.f / maxF * 100;
        const x = P.X(p.m);
        c.fillStyle = cols[p.ci % cols.length];
        c.fillRect(x - 4, P.Y(rel), 8, P.B - P.Y(rel));
        U.text(c, (p.f * 100).toFixed(diatomic ? 1 : 2) + '%', x, P.Y(rel) - 6, { size: 11, align: 'center', color: t.ink2, mono: true });
      });
    }

    function update() {
      specCv.redraw();
      U.clear(guessBox); U.clear(calcBox);
      sel.el.hidden = mystery;
      const iso = ISO[sym];
      const avg = iso.reduce((s, [m, a]) => s + m * a / 100, 0);
      if (mystery && !guessResult) {
        const g = U.select({ label: 'Which element is it?', options: [{ value: '', label: 'Choose…' }].concat(Object.keys(ISO).map(s => ({ value: s, label: ELEMENTS.bySym[s].name }))), value: '', onChange: v => { guessResult = v === sym ? 'right' : 'wrong:' + v; update(); } });
        guessBox.append(g.el, U.btn('New mystery', () => { sym = U.pick(Object.keys(ISO)); guessResult = null; update(); }, 'sm'));
        calcBox.appendChild(U.callout('Use the peak positions and heights to estimate the average atomic mass, then match it to the periodic table.'));
        return;
      }
      if (mystery && guessResult) {
        guessBox.append(U.callout(guessResult === 'right' ? `Correct: ${ELEMENTS.bySym[sym].name}.` : `Not quite. It was ${ELEMENTS.bySym[sym].name} (average mass ${avg.toFixed(2)}).`, guessResult === 'right' ? 'good' : 'bad'),
          U.btn('Next mystery', () => { sym = U.pick(Object.keys(ISO)); guessResult = null; update(); }, 'sm primary'));
      }
      calcBox.appendChild(U.panel('Average atomic mass',
        U.table(['Isotope', 'Mass (u)', 'Abundance', 'Contribution'], iso.map(([m, a]) => [`<sup>${Math.round(m)}</sup>${sym}`, m.toFixed(3), a.toFixed(2) + '%', (m * a / 100).toFixed(3)]), { num: [1, 2, 3] }),
        h('div', { class: 'eq wrap', html: iso.map(([m, a]) => `(${m.toFixed(3)})(${(a / 100).toFixed(4)})`).join(' + ') + ` = <b>${avg.toFixed(3)} u</b>` }),
        h('p', { class: 'small muted', html: `Periodic table value: ${ELEMENTS.bySym[sym].mass} u. The average lies closest to <sup>${Math.round(iso.reduce((a, b) => (b[1] > a[1] ? b : a))[0])}</sup>${sym}, the most abundant isotope.` })));
      if (diatomic) calcBox.appendChild(U.callout(`Each ${sym}<sub>2</sub> molecule contains two atoms picked at random, so peak heights follow the products of the isotope fractions (e.g. f<sub>a</sub>² , 2f<sub>a</sub>f<sub>b</sub>, f<sub>b</sub>²).`));
    }
    update();
  },
});
