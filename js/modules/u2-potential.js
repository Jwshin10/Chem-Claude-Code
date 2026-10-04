'use strict';
App.register({
  id: 'potential-energy', unit: 2, sym: 'Pe', title: 'Potential Energy & Bond Length',
  desc: 'Drag two atoms together and watch the potential-energy curve reveal bond length and bond energy.',
  tags: ['potential energy curve', 'bond length', 'bond energy', 'internuclear distance', 'bond order', 'morse', 'attraction', 'repulsion'],
  keyIdeas: [
    'As two atoms approach, attraction between each nucleus and the other atom’s electrons lowers the potential energy.',
    'Too close, nucleus–nucleus repulsion makes the energy rise steeply.',
    'The <b>minimum</b> of the curve is the bond length (equilibrium internuclear distance); its <b>depth</b> is the bond energy.',
    'Higher bond order → shorter and stronger bonds (C≡C &lt; C=C &lt; C–C in length).',
    'Larger atoms form longer, usually weaker bonds (H–F &lt; H–Cl &lt; H–Br in length).',
  ],
  render(el, scope) {
    const h = U.h;
    const BONDS = {
      'H–H': { a: 'H', b: 'H', re: 74, De: 436 }, 'H–F': { a: 'H', b: 'F', re: 92, De: 568 }, 'H–Cl': { a: 'H', b: 'Cl', re: 127, De: 431 },
      'H–Br': { a: 'H', b: 'Br', re: 141, De: 366 }, 'H–I': { a: 'H', b: 'I', re: 161, De: 298 }, 'F–F': { a: 'F', b: 'F', re: 142, De: 159 },
      'Cl–Cl': { a: 'Cl', b: 'Cl', re: 199, De: 242 }, 'Br–Br': { a: 'Br', b: 'Br', re: 228, De: 193 }, 'I–I': { a: 'I', b: 'I', re: 267, De: 151 },
      'O=O': { a: 'O', b: 'O', re: 121, De: 498, order: 2 }, 'N≡N': { a: 'N', b: 'N', re: 110, De: 945, order: 3 },
      'C–C': { a: 'C', b: 'C', re: 154, De: 347 }, 'C=C': { a: 'C', b: 'C', re: 134, De: 614, order: 2 }, 'C≡C': { a: 'C', b: 'C', re: 120, De: 839, order: 3 },
    };
    let key = 'H–H', cmp = 'none', r = 74 * 2.2;
    const V = (b, x) => { const a = 1.5 / b.re * 1.25; const e = 1 - Math.exp(-a * (x - b.re)); return b.De * e * e - b.De; };
    const names = Object.keys(BONDS);
    const sel = U.select({ label: 'Bond', options: names, value: key, onChange: v => { key = v; r = BONDS[key].re * 2.2; slider.set(r); redraw(); } });
    const sel2 = U.select({ label: 'Compare with', options: [{ value: 'none', label: 'None' }].concat(names.map(n => ({ value: n, label: n }))), value: cmp, onChange: v => { cmp = v; redraw(); } });
    const slider = U.slider({ label: 'Internuclear distance', min: 40, max: 420, step: 1, value: r, unit: 'pm', onInput: v => { r = v; redraw(); } });
    const stats = U.stats([['r', 'Distance'], ['e', 'Potential energy'], ['z', 'Region']]);
    const atoms = U.canvas(null, { height: 130, scope, drag: true, hint: 'drag the right atom', draw: drawAtoms });
    const cv = U.canvas(null, { aspect: 1.7, scope, drag: true, draw: drawCurve });
    let P = null;
    el.append(h('div', { class: 'grid-viz' },
      h('div', { class: 'stack' }, U.panel('Two atoms', atoms.wrap), U.panel('Potential energy curve', cv.wrap)),
      h('div', { class: 'stack' }, U.panel('Settings', sel.el, sel2.el, slider.el, h('div', { class: 'row' }, U.btn('Jump to bond length', () => { r = BONDS[key].re; slider.set(r); redraw(); }, 'sm primary'))), stats.el,
        U.panel('Data', U.table(['Bond', 'Length (pm)', 'Energy (kJ/mol)'], names.map(n => [n, BONDS[n].re, BONDS[n].De]), { num: [1, 2] })))));

    function drawAtoms(c, w, H) {
      const t = U.theme(), b = BONDS[key];
      const scale = (w - 80) / 440;
      const x1 = 40, x2 = 40 + r * scale, cy = H / 2;
      const ra = (ELEMENTS.bySym[b.a].radius) * scale * 0.9, rb = (ELEMENTS.bySym[b.b].radius) * scale * 0.9;
      // electron clouds
      [[x1, ra], [x2, rb]].forEach(([x, R]) => {
        const g = c.createRadialGradient(x, cy, 1, x, cy, R * 2.2);
        g.addColorStop(0, U.alpha(t.blue, 0.35)); g.addColorStop(1, U.alpha(t.blue, 0));
        c.fillStyle = g; c.beginPath(); c.arc(x, cy, R * 2.2, 0, 7); c.fill();
      });
      U.drawAtom(c, x1, cy, Math.max(12, ra), b.a);
      U.drawAtom(c, x2, cy, Math.max(12, rb), b.b);
      c.strokeStyle = t.ink3; c.setLineDash([3, 3]); c.beginPath(); c.moveTo(x1, cy + 36); c.lineTo(x2, cy + 36); c.stroke(); c.setLineDash([]);
      U.text(c, Math.round(r) + ' pm', (x1 + x2) / 2, cy + 52, { align: 'center', mono: true, size: 11, color: t.ink2 });
    }
    U.drag(atoms, { down: () => true, move: p => { const scale = (atoms.w - 80) / 440; r = U.clamp((p.x - 40) / scale, 40, 420); slider.set(Math.round(r)); redraw(); } }, scope);
    U.drag(cv, { down: p => P && P.inside(p.x, p.y), move: p => { r = U.clamp(P.invX(p.x), 40, 420); slider.set(Math.round(r)); redraw(); } }, scope);

    function drawCurve(c, w, H) {
      const t = U.theme(), b = BONDS[key], b2 = cmp !== 'none' ? BONDS[cmp] : null;
      const depth = Math.max(b.De, b2 ? b2.De : 0);
      P = new U.Plot(c, w, H, { x: [40, 420], y: [-depth * 1.15, depth * 0.9], xlabel: 'Internuclear distance (pm)', ylabel: 'Potential energy (kJ/mol)' });
      P.axes();
      P.hline(0, t.ink3, [2, 3]);
      if (b2) { P.fn(x => V(b2, x), t.orange, 2.2, [6, 4]); P.dot(b2.re, -b2.De, t.orange, 4); P.label(cmp, b2.re, -b2.De, t.orange, { dy: 18, align: 'center' }); }
      P.fn(x => V(b, x), t.accent, 2.8);
      // annotations
      P.vline(b.re, U.alpha(t.good, 0.9), [4, 4]);
      P.label('bond length ' + b.re + ' pm', b.re, -depth * 1.1, t.good, { dx: 6, dy: 4 });
      const c0 = P.Y(0), cmin = P.Y(-b.De), xx = P.X(Math.min(410, b.re * 2.6));
      c.strokeStyle = t.purple; c.lineWidth = 1.5; c.beginPath(); c.moveTo(xx, c0); c.lineTo(xx, cmin); c.stroke();
      U.text(c, 'bond energy', xx + 6, (c0 + cmin) / 2 - 6, { color: t.purple, size: 11, weight: 600 });
      U.text(c, b.De + ' kJ/mol', xx + 6, (c0 + cmin) / 2 + 8, { color: t.purple, size: 11, mono: true });
      c.strokeStyle = U.alpha(t.purple, 0.4); c.setLineDash([2, 3]); c.beginPath(); c.moveTo(P.X(b.re), cmin); c.lineTo(xx, cmin); c.stroke(); c.setLineDash([]);
      P.dot(r, V(b, r), t.red, 6.5);
    }
    function redraw() {
      atoms.redraw(); cv.redraw();
      const b = BONDS[key], E = V(b, r);
      stats.set('r', Math.round(r) + ' pm'); stats.set('e', E.toFixed(0) + ' kJ/mol');
      const reg = r < b.re * 0.97 ? '<span style="color:var(--bad)">repulsion dominates</span>' : r > b.re * 1.03 ? (E > -b.De * 0.05 ? 'almost no interaction' : '<span style="color:var(--good)">net attraction</span>') : '<b>at bond length</b>';
      stats.set('z', reg);
    }
    redraw();
  },
});
