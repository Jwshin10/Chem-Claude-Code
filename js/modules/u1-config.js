'use strict';
App.register({
  id: 'electron-config', unit: 1, sym: 'Ec', title: 'Electron Configurations',
  desc: 'Fill orbitals with the Aufbau principle, Hund’s rule and Pauli exclusion for any atom or ion.',
  tags: ['aufbau', 'hund', 'pauli', 'orbital diagram', 'noble gas notation', 'ions', 'paramagnetic', 'diamagnetic', 'subshell', 'valence electrons'],
  keyIdeas: [
    '<b>Aufbau principle:</b> electrons fill the lowest-energy subshell first (1s, 2s, 2p, 3s, 3p, 4s, 3d, 4p, …).',
    '<b>Pauli exclusion:</b> an orbital holds at most two electrons, with opposite spins.',
    '<b>Hund’s rule:</b> within a subshell, electrons occupy separate orbitals with parallel spins before pairing.',
    'Transition-metal cations lose their <b>4s electrons before 3d</b> electrons (Fe → Fe<sup>2+</sup>: [Ar] 3d<sup>6</sup>).',
    'Cr ([Ar] 4s<sup>1</sup> 3d<sup>5</sup>) and Cu ([Ar] 4s<sup>1</sup> 3d<sup>10</sup>) are common exceptions: half-filled and filled d subshells are extra stable.',
    'Atoms with unpaired electrons are <b>paramagnetic</b> (attracted to a magnet); all-paired atoms are <b>diamagnetic</b>.',
  ],
  render(el, scope) {
    const h = U.h;
    let Z = U.store.get('ecZ', 26), charge = 0, building = null;
    const elSel = U.select({ label: 'Element', options: ELEMENTS.list.map(e => ({ value: e.Z, label: `${e.Z}  ${e.name} (${e.sym})` })), value: Z, onChange: v => { Z = +v; charge = 0; chSeg.set(0); stop(); update(); } });
    const chSeg = U.seg({ options: [-3, -2, -1, 0, 1, 2, 3].map(q => ({ value: q, label: q === 0 ? 'neutral' : (q > 0 ? q + '+' : -q + '−') })), value: 0, onChange: v => { charge = v; stop(); update(); } });
    const buildBtn = U.btn('▶ Fill electrons one at a time', () => build(), 'primary');
    const nav = h('div', { class: 'row' }, U.btn('Previous element', () => { if (Z > 1) { Z--; elSel.set(Z); charge = 0; chSeg.set(0); stop(); update(); } }, 'sm'), U.btn('Next element', () => { if (Z < 118) { Z++; elSel.set(Z); charge = 0; chSeg.set(0); stop(); update(); } }, 'sm'));
    const head = h('div', { class: 'stack' });
    const statBox = U.stats([['e', 'Electrons'], ['val', 'Outer-shell e⁻'], ['unp', 'Unpaired e⁻'], ['mag', 'Magnetism']]);
    const notes = h('div', { class: 'stack' });
    let levels = 9;
    const cv = U.canvas(null, { height: () => 60 + levels * 40, scope, draw });
    el.append(h('div', { class: 'grid-viz' },
      U.panel('Orbital energy diagram', cv.wrap, h('p', { class: 'small muted' }, 'Each box is one orbital. Higher boxes are higher in energy. Arrows show electron spin.')),
      h('div', { class: 'stack' }, U.panel('Choose an atom or ion', elSel.el, nav, h('div', { class: 'field' }, h('span', { class: 'lbl' }, 'Charge'), chSeg.el), buildBtn), head, statBox.el, notes)));

    function configFor(n) { // pure Aufbau filling of n electrons (used for the animation)
      const out = []; let left = n;
      for (const s of ELEMENTS.ORDER) { if (!left) break; const c = Math.min(ELEMENTS.CAP[s[1]], left); out.push({ sub: s, n: +s[0], l: s[1], e: c }); left -= c; }
      return out;
    }
    function current() { return building ? configFor(building.k) : ELEMENTS.config(Z, charge); }
    function draw(c, w, H) {
      const t = U.theme(), conf = current();
      const occ = Object.fromEntries(conf.map(x => [x.sub, x.e]));
      const last = conf.length ? ELEMENTS.ORDER.indexOf(conf[conf.length - 1].sub) : 0;
      const shown = ELEMENTS.ORDER.slice(0, Math.min(ELEMENTS.ORDER.length, Math.max(last + 2, 3)));
      if (shown.length !== levels) { levels = shown.length; cv.resize(); return; }
      const box = Math.min(30, (w - 120) / 16);
      const colX = { s: 70, p: 70 + box * 2.2, d: 70 + box * 6.4, f: 70 + box * 12.6 };
      if (colX.f + 7 * box > w - 8) { colX.f = colX.d; }
      const y0 = H - 40, dy = (H - 70) / Math.max(1, shown.length - 1);
      c.strokeStyle = t.ink3; c.lineWidth = 1;
      U.arrow(c, 24, H - 20, 24, 14, t.ink3, 1.5, 8);
      c.save(); c.translate(14, H / 2); c.rotate(-Math.PI / 2); U.text(c, 'Energy', 0, 0, { align: 'center', color: t.ink3, size: 11, weight: 600 }); c.restore();
      shown.forEach((s, i) => {
        const y = y0 - i * dy;
        const nOrb = ELEMENTS.CAP[s[1]] / 2, e = occ[s] || 0;
        let x = colX[s[1]];
        if (s[1] === 'f' && colX.f === colX.d) x = colX.d + box * 0.5;
        U.text(c, s, x - 8, y + box * 0.5 + 4, { align: 'right', mono: true, size: 12, color: e ? t.ink : t.ink3, weight: 600 });
        for (let k = 0; k < nOrb; k++) {
          const bx = x + k * box;
          c.fillStyle = e ? t.surface : 'transparent'; c.fillRect(bx, y, box, box);
          c.strokeStyle = e ? t.ink2 : t.line; c.lineWidth = 1.3; c.strokeRect(bx + 0.5, y + 0.5, box - 1, box - 1);
          // Hund's rule: singles first
          const up = k < Math.min(e, nOrb), down = k < e - nOrb;
          const col = building && building.k && s === building.lastSub && ((k === (building.lastE - 1) % nOrb)) ? t.orange : t.accent;
          if (up) U.arrow(c, bx + box * 0.36, y + box * 0.85, bx + box * 0.36, y + box * 0.15, col, 1.8, 6);
          if (down) U.arrow(c, bx + box * 0.64, y + box * 0.15, bx + box * 0.64, y + box * 0.85, col, 1.8, 6);
        }
      });
    }
    function update() {
      U.store.set('ecZ', Z);
      const e = ELEMENTS.byZ[Z], conf = ELEMENTS.config(Z, charge);
      const nE = Z - charge;
      const sym = e.sym + (charge ? '<sup>' + (Math.abs(charge) > 1 ? Math.abs(charge) : '') + (charge > 0 ? '+' : '−') + '</sup>' : '');
      U.clear(head);
      head.appendChild(U.panel(null,
        h('div', { class: 'row', style: { alignItems: 'baseline' } }, h('h2', { html: sym }), h('span', { class: 'muted' }, e.name + (charge ? (charge > 0 ? ' cation' : ' anion') : ''))),
        h('div', { class: 'eq wrap' }, h('div', { class: 'tiny muted' }, 'Full configuration'), h('div', { html: ELEMENTS.configString(Z, charge, false) })),
        h('div', { class: 'eq wrap' }, h('div', { class: 'tiny muted' }, 'Noble-gas shorthand'), h('div', { html: ELEMENTS.configString(Z, charge, true) }))));
      const maxN = Math.max(...conf.map(x => x.n));
      const outer = conf.filter(x => x.n === maxN).reduce((t, x) => t + x.e, 0);
      const unp = conf.reduce((t, x) => { const o = ELEMENTS.CAP[x.l] / 2; return t + (x.e <= o ? x.e : 2 * o - x.e); }, 0);
      statBox.set('e', nE); statBox.set('val', outer + ` (n=${maxN})`); statBox.set('unp', unp); statBox.set('mag', unp ? 'paramagnetic' : 'diamagnetic');
      U.clear(notes);
      if ([24, 29, 41, 42, 44, 45, 46, 47, 78, 79].includes(Z) && charge === 0) notes.appendChild(U.callout(`<b>Exception!</b> Aufbau predicts ${configFor(Z).filter(x => x.n >= maxN - 1).slice(-2).map(x => x.sub + '<sup>' + x.e + '</sup>').join(' ')}, but one electron moves into the d subshell because a half-filled or completely filled d subshell is more stable.`, 'warn'));
      if (charge > 0 && e.cat === 'transition') notes.appendChild(U.callout('For transition-metal cations, electrons are removed from the highest <i>n</i> (the 4s/5s subshell) first, even though it filled before the d subshell.'));
      if (charge < 0 && e.cat !== 'halogen' && charge < -(8 - (e.valence || 8))) notes.appendChild(U.callout('This ion has more electrons than a stable noble-gas configuration. It is unlikely to form.', 'warn'));
      const iso = ELEMENTS.list.find(x => x.Z === nE);
      if (charge !== 0 && iso && iso.cat === 'noble') notes.appendChild(U.callout(`${sym} is <b>isoelectronic</b> with ${iso.name}: both have ${nE} electrons.`, 'good'));
      cv.redraw();
    }
    function stop() { if (building) { building.stopFn(); building = null; buildBtn.innerHTML = '▶ Fill electrons one at a time'; } }
    function build() {
      if (building) { stop(); update(); return; }
      const target = Z - charge;
      buildBtn.innerHTML = '■ Stop';
      building = { k: 0, lastSub: null, lastE: 0 };
      const id = setInterval(() => {
        if (!building) return;
        building.k++;
        const conf = configFor(building.k);
        const last = conf[conf.length - 1];
        building.lastSub = last.sub; building.lastE = last.e;
        cv.redraw();
        if (building.k >= target) { const b = building; setTimeout(() => { if (building === b) { stop(); update(); } }, 900); }
      }, Math.max(70, 900 / Math.max(1, target)));
      building.stopFn = () => clearInterval(id);
      scope.add(() => clearInterval(id));
    }
    update();
  },
});
