'use strict';
App.register({
  id: 'solids', unit: 2, sym: 'So', title: 'Ionic, Metallic & Network Solids',
  desc: 'Compare the particle structure and properties of ionic, metallic, covalent-network and molecular solids, alloys, and lattice energy.',
  tags: ['ionic solid', 'lattice', 'lattice energy', 'metallic', 'alloy', 'substitutional', 'interstitial', 'covalent network', 'molecular solid', 'brittle', 'malleable', 'conductivity'],
  keyIdeas: [
    '<b>Ionic solids</b>: lattice of cations and anions. High melting points, brittle, conduct only when melted or dissolved.',
    '<b>Metallic solids</b>: cations in a sea of delocalized electrons. Conductive, malleable and ductile.',
    '<b>Alloys</b>: substitutional (atoms of similar size replace each other, e.g. brass) or interstitial (small atoms fill holes, e.g. steel), which makes the metal less malleable.',
    '<b>Covalent network solids</b> (diamond, SiO<sub>2</sub>): every atom covalently bonded. Very hard with very high melting points.',
    '<b>Molecular solids</b>: molecules held by intermolecular forces. Low melting points, soft, non-conducting.',
    'Lattice energy grows with ion charge and shrinks with ion size (Coulomb’s law): MgO ≫ NaCl.',
  ],
  render(el, scope) {
    const h = U.h;
    U.tabs(el, [
      { label: 'Types of solids', render: types },
      { label: 'Lattice energy', render: lattice },
    ], scope, { key: 'solids' });

    function types(b, s) {
      let kind = 'ionic', stress = 0, stressTarget = 0, alloy = 'none', melted = false;
      const DATA = {
        ionic: { name: 'Ionic solid', ex: 'NaCl, MgO, CaF₂', particles: 'Cations and anions', forces: 'Ionic bonds (Coulombic attraction)', mp: 'High (NaCl 801 °C)', cond: 'No as a solid; yes when molten or dissolved', mech: 'Hard but brittle', stressNote: 'Shifting a layer lines up ions of the same charge. They repel and the crystal shatters, so ionic solids are brittle.' },
        metallic: { name: 'Metallic solid', ex: 'Cu, Fe, Na, brass, steel', particles: 'Metal cations in a sea of electrons', forces: 'Metallic bonding', mp: 'Variable (Hg −39 °C, W 3422 °C)', cond: 'Yes, as a solid and a liquid', mech: 'Malleable and ductile', stressNote: 'Layers of cations slide past each other while the electron sea keeps holding them together, so metals bend instead of breaking.' },
        network: { name: 'Covalent network solid', ex: 'Diamond, graphite, SiO₂ (quartz), SiC', particles: 'Atoms', forces: 'Covalent bonds throughout', mp: 'Very high (diamond > 3500 °C)', cond: 'Usually no (graphite is an exception)', mech: 'Very hard', stressNote: 'Every atom is held by strong covalent bonds, so deforming the solid means breaking bonds.' },
        molecular: { name: 'Molecular solid', ex: 'Ice, dry ice (CO₂), I₂, sugar', particles: 'Molecules', forces: 'Intermolecular forces (LDF, dipole–dipole, H-bonds)', mp: 'Low (I₂ 114 °C, ice 0 °C)', cond: 'No', mech: 'Soft', stressNote: 'Only weak intermolecular forces hold the molecules in place, so these solids are soft and melt easily.' },
      };
      const segK = U.seg({ options: [{ value: 'ionic', label: 'Ionic' }, { value: 'metallic', label: 'Metallic' }, { value: 'network', label: 'Covalent network' }, { value: 'molecular', label: 'Molecular' }], value: kind, onChange: v => { kind = v; stress = stressTarget = 0; melted = false; update(); } });
      const ctl = h('div', { class: 'row' });
      const props = h('div');
      const cv = U.canvas(null, { aspect: 1.6, scope: s });
      b.append(segK.el, h('div', { class: 'grid-viz' }, U.panel(null, cv.wrap, ctl), props));
      s.loop((dt, time) => {
        stress += (stressTarget - stress) * Math.min(1, dt * 4);
        const c = cv.ctx, w = cv.w, H = cv.h, t = U.theme();
        c.clearRect(0, 0, w, H);
        const cols = 8, rows = 5, gx = w / (cols + 1), gy = H / (rows + 1.2);
        const R = Math.min(gx, gy) * 0.38;
        const jitter = k => melted ? Math.sin(time / 300 + k * 1.7) * gx * 0.5 : Math.sin(time / 200 + k) * 1.2;
        if (kind === 'metallic') { c.fillStyle = U.alpha(t.blue, 0.1); c.fillRect(0, 0, w, H); }
        for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
          const k = j * cols + i;
          const shiftRow = j >= 2 ? stress * gx : 0;
          let x = gx * (i + 1) + shiftRow + jitter(k), y = gy * (j + 1) + jitter(k + 9);
          if (kind === 'ionic' && stress > 0.85) { const dir = j >= 2 ? 1 : -1; y += dir * (stress - 0.85) * 300; }
          if (kind === 'ionic') {
            const pos = (i + j) % 2 === 0;
            U.drawAtom(c, x, y, pos ? R * 0.75 : R, pos ? 'Na' : 'Cl', { label: pos ? '+' : '−' });
          } else if (kind === 'metallic') {
            let el = 'Cu', r = R * 0.85;
            if (alloy === 'sub' && (k * 7) % 5 === 0) el = 'Zn';
            U.drawAtom(c, x, y, r, el, { label: el + '⁺' });
            if (alloy === 'int' && i < cols - 1 && j < rows - 1 && (k * 3) % 4 === 0) U.drawAtom(c, x + gx / 2, y + gy / 2, R * 0.38, 'C', { label: false });
          } else if (kind === 'network') {
            // bonds to right and down neighbours
            c.strokeStyle = t.ink3; c.lineWidth = 3;
            if (i < cols - 1) { c.beginPath(); c.moveTo(x, y); c.lineTo(x + gx, y); c.stroke(); }
            if (j < rows - 1) { c.beginPath(); c.moveTo(x, y); c.lineTo(x + ((j + 1) >= 2 && j < 2 ? stress * gx : 0), y + gy); c.stroke(); }
            U.drawAtom(c, x, y, R * 0.55, (i + j) % 2 ? 'O' : 'Si', { label: (i + j) % 2 ? 'O' : 'Si' });
          } else {
            const ang = (k * 0.9) % Math.PI;
            const dx = Math.cos(ang) * R * 0.55, dy = Math.sin(ang) * R * 0.55;
            U.drawAtom(c, x - dx, y - dy, R * 0.6, 'I', { label: false });
            U.drawAtom(c, x + dx, y + dy, R * 0.6, 'I', { label: false });
          }
        }
        if (kind === 'metallic') for (let e = 0; e < 70; e++) {
          const x = (e * 61.7 + time * 0.04 * (1 + e % 4)) % w, y = (e * 37.3 + Math.sin(time / 500 + e) * 15 + H) % H;
          c.beginPath(); c.arc(x, y, 2.2, 0, 7); c.fillStyle = t.blue; c.fill();
        }
        if (kind === 'ionic' && stress > 0.4 && stress < 0.95 && stressTarget > 0) {
          for (let i = 0; i < cols; i++) {
            const x = gx * (i + 1) + stress * gx;
            c.strokeStyle = t.bad; c.lineWidth = 2; c.setLineDash([3, 3]);
            c.beginPath(); c.moveTo(x, gy * 2 + 6); c.lineTo(x, gy * 3 - 6); c.stroke(); c.setLineDash([]);
          }
          U.text(c, 'like charges line up → repulsion!', w / 2, gy * 2.5 + 4, { align: 'center', color: t.bad, weight: 700, size: 13 });
        }
        if (melted) U.text(c, kind === 'ionic' ? 'molten / dissolved: ions can move → conducts electricity' : 'melted', w / 2, H - 8, { align: 'center', color: t.good, weight: 600, size: 12 });
      });
      function update() {
        const d = DATA[kind];
        U.clear(ctl);
        ctl.append(U.btn(kind === 'ionic' ? 'Strike it (shift a layer)' : 'Apply force (shift a layer)', () => { stressTarget = stressTarget ? 0 : 1; }, 'primary sm'));
        if (kind === 'ionic') ctl.append(U.btn('Melt / dissolve', () => { melted = !melted; }, 'sm'));
        if (kind === 'metallic') ctl.append(U.seg({ options: [{ value: 'none', label: 'Pure Cu' }, { value: 'sub', label: 'Substitutional alloy (brass)' }, { value: 'int', label: 'Interstitial alloy (steel-like)' }], value: alloy, onChange: v => { alloy = v; update(); } }).el);
        U.clear(props);
        props.append(U.panel(d.name, h('dl', { class: 'kv' },
          ...[['Examples', d.ex], ['Particles', d.particles], ['Held by', d.forces], ['Melting point', d.mp], ['Conducts?', d.cond], ['Mechanical', d.mech]].flatMap(([k, v]) => [h('dt', null, k), h('dd', { style: { fontFamily: 'var(--font-body)' } }, v)]))),
        U.callout(d.stressNote));
        if (kind === 'metallic' && alloy !== 'none') props.append(U.callout(alloy === 'sub' ? 'In a substitutional alloy, Zn atoms (similar radius to Cu) replace some Cu atoms. Brass keeps most of copper’s properties but is harder.' : 'In an interstitial alloy, small C atoms fill the holes between Fe atoms. This makes it harder for layers to slide, so steel is stronger and less malleable than pure iron.', 'good'));
      }
      update();
    }

    function lattice(b, s) {
      const CAT = { 'Li⁺': [1, 76], 'Na⁺': [1, 102], 'K⁺': [1, 138], 'Rb⁺': [1, 152], 'Cs⁺': [1, 167], 'Mg²⁺': [2, 72], 'Ca²⁺': [2, 100], 'Sr²⁺': [2, 118], 'Ba²⁺': [2, 135], 'Al³⁺': [3, 54] };
      const AN = { 'F⁻': [-1, 133], 'Cl⁻': [-1, 181], 'Br⁻': [-1, 196], 'I⁻': [-1, 220], 'O²⁻': [-2, 140], 'S²⁻': [-2, 184], 'N³⁻': [-3, 146] };
      const KNOWN = { 'Li⁺F⁻': 1037, 'Li⁺Cl⁻': 853, 'Na⁺F⁻': 923, 'Na⁺Cl⁻': 787, 'Na⁺Br⁻': 747, 'Na⁺I⁻': 704, 'K⁺F⁻': 821, 'K⁺Cl⁻': 715, 'K⁺Br⁻': 682, 'K⁺I⁻': 649, 'Cs⁺Cl⁻': 657, 'Mg²⁺O²⁻': 3791, 'Ca²⁺O²⁻': 3401, 'Sr²⁺O²⁻': 3223, 'Ba²⁺O²⁻': 3054, 'Mg²⁺Cl⁻': 2526, 'Ca²⁺F⁻': 2630, 'Ca²⁺Cl⁻': 2255, 'Mg²⁺S²⁻': 3406, 'Al³⁺O²⁻': 15916, 'Li⁺O²⁻': 2799, 'Na⁺O²⁻': 2481 };
      const list = [['Na⁺', 'Cl⁻'], ['Mg²⁺', 'O²⁻']];
      const sc = U.select({ label: 'Cation', options: Object.keys(CAT), value: 'K⁺' });
      const sa = U.select({ label: 'Anion', options: Object.keys(AN), value: 'Br⁻' });
      const rel = (c, a) => Math.abs(CAT[c][0] * AN[a][0]) / (CAT[c][1] + AN[a][1]);
      const cv = U.canvas(null, { aspect: 1.5, scope: s, draw });
      const tbl = h('div');
      b.append(h('div', { class: 'grid-viz' }, U.panel('Relative lattice energy ∝ |q₊ × q₋| / (r₊ + r₋)', cv.wrap),
        h('div', { class: 'stack' }, U.panel('Add a compound', sc.el, sa.el, h('div', { class: 'row' }, U.btn('Add to chart', () => { if (!list.some(p => p[0] === sc.value && p[1] === sa.value)) list.push([sc.value, sa.value]); if (list.length > 8) list.shift(); refresh(); }, 'primary'), U.btn('Clear', () => { list.length = 0; refresh(); }))), tbl,
          U.callout('Charge matters more than size: doubling both charges multiplies the attraction by 4, while ion radii change only by a few tens of percent.'))));
      const name = (c, a) => {
        const qc = CAT[c][0], qa = -AN[a][0], g = U.gcd(qc, qa);
        const nc = qa / g, na = qc / g;
        const sym = x => x.replace(/[⁺⁻²³]/g, '');
        return sym(c) + (nc > 1 ? U.subText(nc) : '') + sym(a) + (na > 1 ? U.subText(na) : '');
      };
      function draw(c, w, H) {
        const t = U.theme();
        if (!list.length) { U.text(c, 'Add compounds to compare.', w / 2, H / 2, { align: 'center', color: t.ink3 }); return; }
        const vals = list.map(([a, b2]) => rel(a, b2));
        const max = Math.max(...vals);
        const P = new U.Plot(c, w, H, { x: [0, list.length], y: [0, max * 1.15], ylabel: 'Relative lattice energy', xticks: [], pad: { b: 46 } });
        P.axes();
        list.forEach((p, i) => {
          const x0 = P.X(i + 0.18), x1 = P.X(i + 0.82), y = P.Y(vals[i]);
          c.fillStyle = U.ramp(vals[i] / max * 0.9); U.roundRect(c, x0, y, x1 - x0, P.B - y, 4); c.fill();
          U.text(c, name(...p), (x0 + x1) / 2, P.B + 18, { align: 'center', weight: 700, size: 12 });
          U.text(c, (vals[i] * 100).toFixed(2), (x0 + x1) / 2, y - 6, { align: 'center', mono: true, size: 10.5, color: t.ink2 });
        });
      }
      function refresh() {
        cv.redraw();
        U.clear(tbl);
        tbl.appendChild(U.panel('Measured lattice energies', U.table(['Compound', 'Charges', 'r₊ + r₋ (pm)', 'Lattice energy (kJ/mol)'],
          list.map(([a, c2]) => [name(a, c2), `${CAT[a][0]}+ / ${-AN[c2][0]}−`, CAT[a][1] + AN[c2][1], KNOWN[a + c2] ? KNOWN[a + c2].toLocaleString() : '—']), { num: [2, 3] })));
      }
      refresh();
    }
  },
});
