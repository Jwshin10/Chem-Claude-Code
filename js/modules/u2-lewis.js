'use strict';
/* Lewis structure renderer (shared): LEWIS.draw(ctx, w, h, structure, opts) */
const LEWIS = {
  draw(c, w, H, s, o = {}) {
    const t = U.theme();
    const xs = s.atoms.map(a => a.x), ys = s.atoms.map(a => a.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const pad = 46 + (s.q ? 18 : 0);
    const L = Math.min(o.maxBond || 78, (w - 2 * pad) / Math.max(0.01, maxX - minX), (H - 2 * pad) / Math.max(0.01, maxY - minY));
    const cx = w / 2 - (minX + maxX) / 2 * L, cy = H / 2 + (minY + maxY) / 2 * L;
    const P = a => [cx + a.x * L, cy - a.y * L];
    const fs = Math.round(U.clamp(L * 0.3, 15, 24));
    const elCol = el => ({ O: t.red, N: t.blue, F: t.green, Cl: t.green, S: t.yellow, P: t.orange, Br: '#b0503b', I: t.purple, Xe: t.teal, B: t.pink, Be: t.teal })[el] || t.ink;
    const gap = fs * 0.62;
    c.lineCap = 'round';
    // bonds
    s.bonds.forEach(b => {
      const [x1, y1] = P(s.atoms[b.a]), [x2, y2] = P(s.atoms[b.b]);
      const d = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / d, uy = (y2 - y1) / d, nx = -uy, ny = ux;
      const offs = b.order === 1 ? [0] : b.order === 2 ? [-3.5, 3.5] : [-6, 0, 6];
      c.strokeStyle = o.highlightBond && o.highlightBond(b) ? t.orange : t.ink; c.lineWidth = 2;
      offs.forEach(k => {
        c.beginPath(); c.moveTo(x1 + ux * gap + nx * k, y1 + uy * gap + ny * k); c.lineTo(x2 - ux * gap + nx * k, y2 - uy * gap + ny * k); c.stroke();
      });
    });
    // atoms, lone pairs, formal charges
    s.atoms.forEach(a => {
      const [x, y] = P(a);
      U.text(c, a.el, x, y + fs * 0.36, { align: 'center', size: fs, weight: 700, color: elCol(a.el) });
      if (o.lonePairs !== false) (a.lpDirs || []).forEach(dir => {
        const r = fs * 0.85, px = x + Math.cos(dir) * r, py = y - Math.sin(dir) * r;
        const nx = -Math.sin(dir), ny = -Math.cos(dir);
        [-1, 1].forEach(k => { c.beginPath(); c.arc(px + nx * 3.6 * k, py + ny * 3.6 * k, 2.3, 0, 7); c.fillStyle = o.lpColor || t.ink2; c.fill(); });
      });
      (a.singleDirs || []).forEach(dir => { const r = fs * 0.85; c.beginPath(); c.arc(x + Math.cos(dir) * r, y - Math.sin(dir) * r, 2.4, 0, 7); c.fillStyle = o.lpColor || t.ink2; c.fill(); });
      if (o.formal && a.fc) {
        // put the badge in the widest empty direction around the atom
        const i = s.atoms.indexOf(a);
        const dirs = s.bonds.filter(b => b.a === i || b.b === i).map(b => { const q = s.atoms[b.a === i ? b.b : b.a]; return Math.atan2(q.y - a.y, q.x - a.x); }).concat(o.lonePairs === false ? [] : (a.lpDirs || []));
        let best = Math.PI / 4;
        if (dirs.length) {
          const srt = dirs.map(d => ((d % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)).sort((p, q) => p - q);
          let gap = -1;
          srt.forEach((d, k) => { const nx = k === srt.length - 1 ? srt[0] + 2 * Math.PI : srt[k + 1]; if (nx - d > gap + 1e-6) { gap = nx - d; best = d + gap / 2; } });
        }
        const fx = x + Math.cos(best) * fs * 1.05, fy = y - Math.sin(best) * fs * 1.05;
        c.beginPath(); c.arc(fx, fy, 8.5, 0, 7); c.fillStyle = a.fc > 0 ? t.red : t.blue; c.fill();
        U.text(c, (Math.abs(a.fc) > 1 ? Math.abs(a.fc) : '') + (a.fc > 0 ? '+' : '−'), fx, fy + 3.8, { align: 'center', size: 10.5, weight: 700, color: '#fff' });
      }
    });
    if (s.q && o.brackets !== false) {
      const x0 = cx + minX * L - fs * 1.6, x1 = cx + maxX * L + fs * 1.6, y0 = cy - maxY * L - fs * 1.4, y1 = cy - minY * L + fs * 1.4;
      c.strokeStyle = t.ink2; c.lineWidth = 2;
      c.beginPath(); c.moveTo(x0 + 8, y0); c.lineTo(x0, y0); c.lineTo(x0, y1); c.lineTo(x0 + 8, y1); c.stroke();
      c.beginPath(); c.moveTo(x1 - 8, y0); c.lineTo(x1, y0); c.lineTo(x1, y1); c.lineTo(x1 - 8, y1); c.stroke();
      U.text(c, (Math.abs(s.q) > 1 ? Math.abs(s.q) : '') + (s.q > 0 ? '+' : '−'), x1 + 4, y0 + 12, { size: 15, weight: 700 });
    }
  },
};

App.register({
  id: 'lewis', unit: 2, sym: 'Lw', title: 'Lewis Structures',
  desc: 'Step-by-step Lewis diagrams with formal charges and resonance. Pick from 58 molecules and ions or type your own formula.',
  tags: ['lewis structure', 'lewis diagram', 'dot structure', 'formal charge', 'resonance', 'octet rule', 'expanded octet', 'lone pairs', 'valence electrons', 'bond diagram'],
  keyIdeas: [
    'Count all valence electrons, add one for each negative charge and subtract one for each positive charge.',
    'Connect atoms with single bonds, complete the octets of terminal atoms, then place leftover electrons on the central atom.',
    'If the central atom lacks an octet, turn terminal lone pairs into double or triple bonds.',
    '<b>Formal charge</b> = valence e⁻ − (nonbonding e⁻ + ½ bonding e⁻). The best structure keeps formal charges small and puts negative charge on the most electronegative atom.',
    '<b>Resonance:</b> when more than one valid structure exists, the real molecule is an average (hybrid). Bond orders and lengths are averaged, e.g. each N–O bond in NO<sub>3</sub><sup>−</sup> has bond order 4/3.',
    'Exceptions: B and Be can have fewer than 8 electrons; atoms in period 3 and below (P, S, Cl, Xe…) can exceed 8 using an expanded octet.',
  ],
  render(el, scope) {
    const h = U.h;
    BUILDER.restore();
    let id = U.store.get('lewisId', 'no3'), res = 0, step = 5, formal = true;
    if (!MOLECULES.byId[id]) id = 'no3';
    const opts = [
      { group: 'One central atom', options: MOLECULES.single.map(m => ({ value: m.id, label: `${U.chemText(m.f)} — ${m.name}` })) },
      { group: 'Several central atoms', options: MOLECULES.multi.map(m => ({ value: m.id, label: `${U.chemText(m.f)} — ${m.name}` })) },
    ];
    const sel = U.select({ label: 'Molecule or ion', options: opts, value: id, onChange: v => { id = v; res = 0; step = 5; U.store.set('lewisId', id); update(); } });
    const fc = U.check({ label: 'Show formal charges', checked: true, onChange: v => { formal = v; cv.redraw(); } });
    const stepBox = h('div', { class: 'stack' });
    const resBox = h('div', { class: 'row' });
    const infoBox = h('div', { class: 'stack' });
    const cv = U.canvas(null, { aspect: 1.45, scope, draw });
    el.append(h('div', { class: 'grid-viz' },
      h('div', { class: 'stack' }, U.panel(null, h('div', { class: 'flex-between' }, h('h3', { id: 'lwTitle' }), resBox), cv.wrap), stepBox),
      h('div', { class: 'stack' }, U.panel('Choose', sel.el, fc.el), BUILDER.moleculePanel(spec => { id = spec.id; res = 0; step = 5; U.store.set('lewisId', id); syncCustom(); update(); }).el, infoBox)));
    function syncCustom() {
      const old = sel.input.querySelector('optgroup[data-custom]');
      if (old) old.remove();
      const m = MOLECULES.byId.custom;
      if (m) { const g = h('optgroup', { label: 'Your molecule', 'data-custom': '1' }, h('option', { value: 'custom' }, U.chemText(m.f) + ' — ' + m.name)); sel.input.insertBefore(g, sel.input.firstChild); }
      sel.set(id);
    }
    syncCustom();

    function structure() {
      const m = MOLECULES.byId[id];
      if (!m.c || step >= 5) return MOLECULES.build(m, res);
      // step-by-step for single-centre molecules
      const s = MOLECULES.build(m, 0);
      const total = MOLECULES.totalValence(m);
      const st = { atoms: s.atoms.map(a => Object.assign({}, a, { fc: 0, lpDirs: [] })), bonds: s.bonds.map(b => Object.assign({}, b, { order: 1 })), q: s.q };
      if (step === 1) { st.bonds = []; return st; }
      if (step === 2) return st;
      let left = total - 2 * st.bonds.length;
      const dirsOf = i => st.bonds.filter(b => b.a === i || b.b === i).map(b => { const o = st.atoms[b.a === i ? b.b : b.a], a = st.atoms[i]; return Math.atan2(o.y - a.y, o.x - a.x); });
      st.atoms.forEach((a, i) => {
        if (i === 0 || a.el === 'H') return;
        const give = Math.min(Math.max(0, 4 - dirsOf(i).length), Math.floor(left / 2));
        a.lpDirs = MOLECULES.lonePairDirs(dirsOf(i), give);
        left -= 2 * give;
      });
      if (step === 3) return st;
      st.atoms[0].lpDirs = centralDirs(m, Math.max(0, Math.floor(left / 2)));
      return st;
    }
    function centralDirs(m, n) {
      const base = MOLECULES.build(m, 0).atoms[0].lpDirs;
      if (n <= base.length) return base.slice(0, n);
      const dirs = base.slice();
      for (let i = dirs.length; i < n; i++) dirs.push(Math.PI / 2 + i * 1.1);
      return dirs;
    }
    function draw(c, w, H) {
      const s = structure();
      LEWIS.draw(c, w, H, s, { formal: formal && step >= 5, brackets: step >= 5 });
      if (MOLECULES.resonanceCount(MOLECULES.byId[id]) > 1 && step >= 5) U.text(c, 'resonance structure ' + (res + 1) + ' of ' + MOLECULES.resonanceCount(MOLECULES.byId[id]), w - 10, H - 10, { align: 'right', size: 11, color: U.theme().ink3 });
    }
    function update() {
      const m = MOLECULES.byId[id];
      document.getElementById('lwTitle').innerHTML = U.chem(m.f) + ' <span class="muted small" style="font-weight:500">' + m.name + '</span>';
      const n = MOLECULES.resonanceCount(m);
      U.clear(resBox);
      if (n > 1 && step >= 5) resBox.append(U.btn('◀', () => { res = (res + n - 1) % n; update(); }, 'sm'), h('span', { class: 'small mono' }, `${res + 1} / ${n}`), U.btn('▶', () => { res = (res + 1) % n; update(); }, 'sm'));
      // step-by-step builder
      U.clear(stepBox);
      if (m.c) {
        const total = MOLECULES.totalValence(m), B = m.L.length + m.L.reduce((t, l) => t + (l[2] || 0), 0);
        const segS = U.seg({ options: [1, 2, 3, 4, 5].map(k => ({ value: k, label: 'Step ' + k })), value: step, onChange: v => { step = v; update(); } });
        const outer = m.L.reduce((t, l) => t + (l[0] === 'H' ? 0 : 2 * (3 - (l[2] || 0))), 0);
        const after3 = total - 2 * B - outer;
        const texts = {
          1: `<b>Count valence electrons.</b> ${countText(m)} = <b>${total}</b> electrons to place.`,
          2: `<b>Connect with single bonds.</b> ${m.c} is the central atom (least electronegative, not H). ${B} bonds use ${2 * B} electrons → ${total - 2 * B} left.`,
          3: `<b>Complete octets on the outer atoms.</b> ${outer ? `Lone pairs go on the outer atoms until each has 8 electrons (${outer} e⁻ used). ` : 'Hydrogen only needs 2 electrons. '}${Math.max(0, after3)} electrons left.`,
          4: `<b>Put leftover electrons on the central atom.</b> ${after3 > 0 ? `${after3} electrons → ${after3 / 2} lone pair${after3 / 2 > 1 ? 's' : ''} on ${m.c}.` : 'No electrons left over.'}`,
          5: finalText(m),
        };
        stepBox.appendChild(U.panel('Build it step by step', segS.el, h('p', { html: texts[step] })));
      }
      // info
      U.clear(infoBox);
      const s = MOLECULES.build(m, res);
      const bonding = s.bonds.reduce((t, b) => t + 2 * b.order, 0), lone = s.atoms.reduce((t, a) => t + 2 * a.lp, 0);
      const stats = U.stats([['v', 'Valence e⁻'], ['b', 'Bonding e⁻'], ['l', 'Lone-pair e⁻']]);
      stats.set('v', MOLECULES.totalValence(m)); stats.set('b', bonding); stats.set('l', lone);
      const fcs = s.atoms.map((a, i) => ({ a, i })).filter(x => x.a.fc !== 0);
      const fcList = fcs.length ? fcs.map(x => `${x.a.el}: ${x.a.fc > 0 ? '+' : '−'}${Math.abs(x.a.fc)}`).join(', ') : 'all zero';
      infoBox.append(stats.el, U.panel('Formal charges', h('p', { class: 'small' }, 'FC = valence e⁻ − nonbonding e⁻ − ½ bonding e⁻'), h('div', { class: 'eq wrap', html: fcList }),
        h('p', { class: 'small muted' }, `Sum of formal charges = ${s.atoms.reduce((t, a) => t + a.fc, 0)} (equals the overall charge).`)));
      if (m.c) {
        const V = MOLECULES.vsepr(m.L.length, m.lp);
        infoBox.appendChild(U.panel('Shape (VSEPR)', h('dl', { class: 'kv' },
          h('dt', null, 'Electron domains'), h('dd', null, V.steric),
          h('dt', null, 'Molecular geometry'), h('dd', null, V.shape),
          h('dt', null, 'Hybridization'), h('dd', null, V.hyb)),
          h('a', { class: 'btn sm', href: '#vsepr', onclick: () => U.store.set('vseprId', m.id) }, 'View in 3D →')));
      } else if (m.atom) {
        infoBox.appendChild(U.callout(`This is a <b>Lewis dot symbol</b>: ${MOLECULES.totalValence(m)} valence electron${MOLECULES.totalValence(m) === 1 ? '' : 's'} drawn around the symbol. Single dots fill the four sides first, then pair up.`));
      } else {
        const centers = s.atoms.map((a, i) => ({ a, i })).filter(x => x.a.bondCount > 1);
        infoBox.appendChild(U.panel('Geometry at each central atom', U.table(['Atom', 'Domains', 'Shape', 'Hybrid.'], centers.map(x => {
          const V = MOLECULES.vsepr(x.a.bondCount, x.a.lp);
          return [x.a.el + (x.i + 1), V.steric, V.shape, V.hyb];
        }))));
      }
      if (n > 1) infoBox.appendChild(U.callout(`<b>${n} resonance structures.</b> The real ${m.name.toLowerCase()} is a hybrid of these, so equivalent bonds are identical in length and strength.`));
      if (m.note) infoBox.appendChild(U.callout(m.note, 'warn'));
      cv.redraw();
    }
    function countText(m) {
      const els = [m.c].concat(m.L.flatMap(l => [l[0]].concat(Array(l[2] || 0).fill('H'))));
      const cnt = {}; els.forEach(e => cnt[e] = (cnt[e] || 0) + 1);
      let s = Object.keys(cnt).map(e => `${cnt[e] > 1 ? cnt[e] + '×' : ''}${e} (${MOLECULES.val(e)})`).join(' + ');
      if (m.q) s += m.q < 0 ? ` + ${-m.q} (negative charge)` : ` − ${m.q} (positive charge)`;
      return s;
    }
    function finalText(m) {
      const multiple = m.L.some(l => l[1] > 1);
      const V = MOLECULES.vsepr(m.L.length, m.lp);
      const e = 2 * m.lp + 2 * m.L.reduce((t, l) => t + l[1], 0);
      let s = '<b>Check the central atom and formal charges.</b> ';
      if (multiple) s += `Lone pairs from terminal atoms were shared as multiple bonds so that ${m.c} has ${e} electrons and formal charges are minimized. `;
      else s += `${m.c} has ${e} electrons around it. `;
      if (e < 8) s += `${m.c} is stable with an incomplete octet. `;
      if (e > 8) s += `${m.c} is in period ${ELEMENTS.bySym[m.c].period}, so it can hold more than 8 electrons (expanded octet). `;
      return s + `Final shape: ${V.shape.toLowerCase()}.`;
    }
    update();
  },
});
