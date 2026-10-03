'use strict';
/* Lightweight 3-D ball-and-stick renderer (no libraries). Mol3D.fromMolecule(m) -> model; Mol3D.draw(ctx,w,h,model,rot,opts) */
const Mol3D = {
  fromMolecule(m) {
    const d = MOLECULES.domains3d(m);
    const atoms = [{ el: m.c, p: [0, 0, 0], r: 0.36 }];
    const bonds = [];
    d.ligands.forEach((l, i) => {
      const len = l.el === 'H' ? 0.82 : 1.1;
      atoms.push({ el: l.el, p: l.v.map(x => x * len), r: l.el === 'H' ? 0.2 : 0.29 });
      bonds.push({ a: 0, b: i + 1, order: l.order });
    });
    return { atoms, bonds, lps: d.lps.map(v => ({ from: 0, v })), m };
  },
  rotate(p, rot) {
    const [x, y, z] = p, cy = Math.cos(rot.yaw), sy = Math.sin(rot.yaw), cx = Math.cos(rot.pitch), sx = Math.sin(rot.pitch);
    const x1 = x * cy + z * sy, z1 = -x * sy + z * cy;
    const y2 = y * cx - z1 * sx, z2 = y * sx + z1 * cx;
    return [x1, y2, z2];
  },
  draw(c, w, H, model, rot, o = {}) {
    const t = U.theme();
    const S = (o.scale || Math.min(w, H) * 0.3), cx = w / 2, cy = H / 2 + (o.dy || 0), f = 6;
    const proj = p => { const q = Mol3D.rotate(p, rot); const s = f / (f - q[2]); return { x: cx + q[0] * S * s, y: cy - q[1] * S * s, z: q[2], s }; };
    const items = [];
    const P = model.atoms.map(a => proj(a.p));
    model.bonds.forEach(b => {
      const A = P[b.a], B = P[b.b];
      items.push({ z: (A.z + B.z) / 2 - 0.01, draw() {
        const dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d;
        const offs = b.order === 1 ? [0] : b.order === 2 ? [-4.5, 4.5] : [-7, 0, 7];
        offs.forEach(k => {
          c.lineCap = 'round';
          c.strokeStyle = t.dark ? '#5f6b78' : '#8d97a3'; c.lineWidth = (b.order === 1 ? 9 : 5.5) * A.s;
          c.beginPath(); c.moveTo(A.x + nx * k, A.y + ny * k); c.lineTo(B.x + nx * k, B.y + ny * k); c.stroke();
          c.strokeStyle = t.dark ? '#93a0ad' : '#c3cad2'; c.lineWidth = (b.order === 1 ? 3 : 2) * A.s;
          c.beginPath(); c.moveTo(A.x + nx * k - 1, A.y + ny * k - 1); c.lineTo(B.x + nx * k - 1, B.y + ny * k - 1); c.stroke();
        });
      } });
    });
    if (o.lonePairs !== false) model.lps.forEach(lp => {
      const base = model.atoms[lp.from].p;
      const tip = base.map((x, i) => x + lp.v[i] * 0.95), mid = base.map((x, i) => x + lp.v[i] * 0.55);
      const A = proj(base), T = proj(tip), M = proj(mid);
      items.push({ z: M.z, draw() {
        const dx = T.x - A.x, dy = T.y - A.y, len = Math.hypot(dx, dy);
        const ang = Math.atan2(dy, dx);
        const lenW = Math.max(len, S * 0.25);
        c.save(); c.translate((A.x + T.x) / 2, (A.y + T.y) / 2); c.rotate(ang);
        const g = c.createRadialGradient(lenW * 0.15, 0, 2, 0, 0, lenW * 0.6);
        g.addColorStop(0, U.alpha(t.purple, 0.55)); g.addColorStop(1, U.alpha(t.purple, 0.12));
        c.beginPath(); c.ellipse(0, 0, lenW * 0.55, S * 0.2 * M.s, 0, 0, 7); c.fillStyle = g; c.fill();
        c.strokeStyle = U.alpha(t.purple, 0.6); c.lineWidth = 1; c.stroke();
        c.restore();
        const nx = -Math.sin(ang), ny = Math.cos(ang);
        [-1, 1].forEach(k => { c.beginPath(); c.arc(M.x + nx * 4 * k + (T.x - A.x) * 0.15, M.y + ny * 4 * k + (T.y - A.y) * 0.15, 2.6, 0, 7); c.fillStyle = t.dark ? '#e9dcff' : '#4b2a8a'; c.fill(); });
      } });
    });
    model.atoms.forEach((a, i) => items.push({ z: P[i].z, draw() { U.drawAtom(c, P[i].x, P[i].y, a.r * S * P[i].s, a.el, { label: o.labels === false ? false : a.el }); } }));
    items.sort((a, b) => a.z - b.z).forEach(it => it.draw());
    // bond angle arc between first two ligands
    if (o.angle && model.bonds.length >= 2) {
      const best = Mol3D.smallestPair(model);
      if (best) {
        const [u, v] = best.vecs, pts = [];
        for (let k = 0; k <= 20; k++) {
          const s = k / 20, th = best.ang;
          const a1 = Math.sin((1 - s) * th) / Math.sin(th), a2 = Math.sin(s * th) / Math.sin(th);
          pts.push(proj([0, 1, 2].map(i => (u[i] * a1 + v[i] * a2) * 0.5)));
        }
        c.strokeStyle = t.orange; c.lineWidth = 2; c.setLineDash([4, 3]);
        c.beginPath(); pts.forEach((p, k) => k ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)); c.stroke(); c.setLineDash([]);
        const mp = pts[10];
        U.text(c, o.angleText || (best.ang * 180 / Math.PI).toFixed(1) + '°', mp.x + (mp.x - cx) * 0.25, mp.y + (mp.y - cy) * 0.25, { align: 'center', weight: 700, size: 13, color: t.orange });
      }
    }
    if (o.dipole && o.dipoleVec) {
      const v = o.dipoleVec, A = proj(v.map(x => -x * 0.9)), B = proj(v.map(x => x * 0.9));
      U.arrow(c, A.x, A.y, B.x, B.y, t.red, 3, 12);
      const dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy) || 1;
      c.beginPath(); c.moveTo(A.x + dx / d * 10 - dy / d * 8, A.y + dy / d * 10 + dx / d * 8); c.lineTo(A.x + dx / d * 10 + dy / d * 8, A.y + dy / d * 10 - dx / d * 8); c.stroke();
    }
  },
  smallestPair(model) {
    const vs = model.bonds.map(b => { const p = model.atoms[b.b].p; const n = Math.hypot(...p); return p.map(x => x / n); });
    let best = null;
    for (let i = 0; i < vs.length; i++) for (let j = i + 1; j < vs.length; j++) {
      const ang = Math.acos(U.clamp(vs[i][0] * vs[j][0] + vs[i][1] * vs[j][1] + vs[i][2] * vs[j][2], -1, 1));
      if (ang > 0.1 && ang < Math.PI - 0.05 && (!best || ang < best.ang - 1e-6)) best = { ang, vecs: [vs[i], vs[j]] };
    }
    if (!best && vs.length >= 2) best = { ang: Math.PI - 0.0001, vecs: [vs[0], vs[1]], linear: true };
    return best && !best.linear ? best : null;
  },
  dipole(m) {
    if (MOLECULES.polarity(m) !== 'polar') return null;
    const d = MOLECULES.domains3d(m), ec = ELEMENTS.bySym[m.c].en || 2.5;
    const v = [0, 0, 0];
    d.ligands.forEach(l => { const k = (ELEMENTS.bySym[l.el].en || 2.5) - ec; for (let i = 0; i < 3; i++) v[i] += l.v[i] * k; });
    d.lps.forEach(l => { for (let i = 0; i < 3; i++) v[i] += l[i] * 0.6; });
    const n = Math.hypot(...v);
    return n < 1e-3 ? null : v.map(x => x / n);
  },
  /** home-page hero: rotating molecules */
  hero(container, scope) {
    const list = ['sf6', 'ch4', 'nh3', 'h2o', 'pcl5', 'xef4', 'sf4', 'brf5', 'bf3', 'clf3'].map(id => MOLECULES.byId[id]);
    let i = 0, tSwitch = 0, rot = { yaw: 0.6, pitch: 0.35 }, dragging = false, last = null, fade = 1;
    const cv = U.canvas(container, { aspect: 4 / 3, scope, drag: true });
    U.drag(cv, { down: p => { dragging = true; last = p; }, move: p => { rot.yaw += (p.x - last.x) * 0.01; rot.pitch += (p.y - last.y) * 0.01; last = p; }, up: () => { dragging = false; } }, scope);
    let model = Mol3D.fromMolecule(list[0]);
    scope.loop(dt => {
      tSwitch += dt;
      if (!dragging) rot.yaw += dt * 0.45;
      if (tSwitch > 5) { tSwitch = 0; i = (i + 1) % list.length; model = Mol3D.fromMolecule(list[i]); }
      fade = Math.min(1, tSwitch * 3, (5 - tSwitch) * 3);
      const c = cv.ctx, t = U.theme();
      c.clearRect(0, 0, cv.w, cv.h);
      c.globalAlpha = Math.max(0, fade);
      Mol3D.draw(c, cv.w, cv.h, model, rot, { scale: Math.min(cv.w, cv.h) * 0.3, dy: -10 });
      c.globalAlpha = 1;
      const m = list[i], V = MOLECULES.vsepr(m.L.length, m.lp);
      U.text(c, U.chemText(m.f), 16, cv.h - 36, { size: 20, weight: 700 });
      U.text(c, V.shape + ' · ' + V.hyb, 16, cv.h - 14, { size: 13, color: t.ink2 });
      U.text(c, 'drag to rotate', cv.w - 14, cv.h - 14, { size: 11, color: t.ink3, align: 'right' });
    });
  },
};

App.register({
  id: 'vsepr', unit: 2, sym: 'Vs', title: 'VSEPR & 3D Molecular Shapes',
  desc: 'Rotate molecules in 3D to see electron domains, lone pairs, bond angles, hybridization and polarity.',
  tags: ['vsepr', 'molecular geometry', 'electron domain', 'hybridization', 'sp3', 'sp2', 'bond angle', 'polarity', 'dipole', 'sigma', 'pi', 'tetrahedral', 'trigonal', 'octahedral', '3d'],
  keyIdeas: [
    'Electron domains (bonds of any order and lone pairs) spread out as far apart as possible to minimize repulsion.',
    'Electron-domain geometry counts all domains; <b>molecular geometry</b> describes only the atoms.',
    'Lone pairs repel more strongly than bonding pairs, squeezing bond angles (CH<sub>4</sub> 109.5° → NH<sub>3</sub> 107° → H<sub>2</sub>O 104.5°).',
    'Hybridization follows the number of domains: 2 → sp, 3 → sp², 4 → sp³, 5 → sp³d, 6 → sp³d².',
    'Every bond has one σ bond; a double bond adds one π bond and a triple bond adds two.',
    'A molecule is <b>polar</b> if its bond dipoles do not cancel, which happens with lone pairs on the central atom or different surrounding atoms.',
  ],
  render(el, scope) {
    const h = U.h;
    U.tabs(el, [
      { label: '3D viewer', render: viewer },
      { label: 'All shapes', render: gallery },
    ], scope, { key: 'vsepr' });

    function viewer(b, s) {
      let id = U.store.get('vseprId', 'nh3');
      if (!MOLECULES.byId[id] || !MOLECULES.byId[id].c) id = 'nh3';
      let rot = { yaw: 0.5, pitch: 0.3 }, auto = true, lp = true, angle = true, dip = true, dragging = false, last = null;
      const groups = {};
      MOLECULES.single.forEach(m => { const V = MOLECULES.vsepr(m.L.length, m.lp); const k = `${V.steric} domains`; (groups[k] = groups[k] || []).push({ value: m.id, label: `${U.chemText(m.f)} — ${V.shape}` }); });
      const sel = U.select({ label: 'Molecule', options: Object.keys(groups).map(g => ({ group: g, options: groups[g] })), value: id, onChange: v => { id = v; U.store.set('vseprId', id); update(); } });
      const toggles = h('div', { class: 'row' },
        U.check({ label: 'Spin', checked: true, onChange: v => auto = v }).el,
        U.check({ label: 'Lone pairs', checked: true, onChange: v => lp = v }).el,
        U.check({ label: 'Bond angle', checked: true, onChange: v => angle = v }).el,
        U.check({ label: 'Dipole', checked: true, onChange: v => dip = v }).el);
      const info = h('div', { class: 'stack' });
      const lewis = U.canvas(null, { aspect: 1.6, scope: s, draw: (c, w, H) => LEWIS.draw(c, w, H, MOLECULES.build(MOLECULES.byId[id]), { formal: true, maxBond: 52 }) });
      const cv = U.canvas(null, { aspect: 1.25, scope: s, drag: true, hint: 'drag to rotate' });
      U.drag(cv, { down: p => { dragging = true; last = p; }, move: p => { rot.yaw += (p.x - last.x) * 0.012; rot.pitch = U.clamp(rot.pitch + (p.y - last.y) * 0.012, -1.5, 1.5); last = p; }, up: () => { dragging = false; } }, s);
      b.append(h('div', { class: 'grid-viz' },
        U.panel(null, h('div', { class: 'flex-between' }, h('h3', { id: 'vsTitle' }), toggles), cv.wrap,
          U.legend([[U.theme().purple, 'lone pair (electron domain)'], [U.theme().orange, 'bond angle'], [U.theme().red, 'net dipole (→ δ−)']])),
        h('div', { class: 'stack' }, U.panel('Choose', sel.el), info, U.panel('Lewis structure', lewis.wrap))));
      let model, dipVec, m;
      s.loop(dt => {
        if (auto && !dragging) rot.yaw += dt * 0.6;
        const c = cv.ctx;
        c.clearRect(0, 0, cv.w, cv.h);
        Mol3D.draw(c, cv.w, cv.h, model, rot, { lonePairs: lp, angle, angleText: m.ang && m.lp ? m.ang : null, dipole: dip, dipoleVec: dipVec, scale: Math.min(cv.w, cv.h) * 0.3 });
      });
      function update() {
        m = MOLECULES.byId[id];
        model = Mol3D.fromMolecule(m);
        dipVec = Mol3D.dipole(m);
        lewis.redraw();
        const V = MOLECULES.vsepr(m.L.length, m.lp), pol = MOLECULES.polarity(m), bc = MOLECULES.bondCounts(m);
        document.getElementById('vsTitle').innerHTML = U.chem(m.f) + ' <span class="muted small" style="font-weight:500">' + m.name + '</span>';
        U.clear(info);
        const kv = h('dl', { class: 'kv' });
        const add = (k, v) => kv.append(h('dt', null, k), h('dd', { html: String(v) }));
        add('Notation', `AX<sub>${m.L.length}</sub>${m.lp ? 'E<sub>' + m.lp + '</sub>' : ''}`);
        add('Electron domains', `${V.steric} (${m.L.length} bonding, ${m.lp} lone pair${m.lp === 1 ? '' : 's'})`);
        add('Electron geometry', V.edg);
        add('Molecular shape', `<b>${V.shape}</b>`);
        add('Bond angle', m.ang || V.angle);
        add('Hybridization', V.hyb + ' (on ' + m.c + ')');
        add('σ / π bonds', `${bc.sigma} σ, ${bc.pi} π`);
        add('Polarity', pol === 'ion' ? 'ion (charged)' : pol);
        info.appendChild(U.panel('Geometry', kv));
        let why;
        if (pol === 'ion') why = 'Polarity describes neutral molecules; this is a charged ion.';
        else if (pol === 'nonpolar') why = m.L.length === 1 ? 'Both atoms are identical, so electrons are shared equally.' : 'The bond dipoles are equal and arranged symmetrically, so they cancel.';
        else if (m.L.length === 1) why = 'The two atoms have different electronegativities, so the bond (and molecule) is polar.';
        else if (m.lp && ![3, 2].includes(m.lp)) why = 'Lone pair(s) on the central atom make the shape asymmetric, so bond dipoles do not cancel.';
        else why = 'The surrounding atoms are not all the same, so the bond dipoles do not cancel.';
        info.appendChild(U.callout(why, pol === 'polar' ? 'warn' : ''));
      }
      update();
    }

    function gallery(b, s) {
      const SHAPES = [['co2', 'AX₂'], ['bf3', 'AX₃'], ['so2', 'AX₂E'], ['ch4', 'AX₄'], ['nh3', 'AX₃E'], ['h2o', 'AX₂E₂'], ['pcl5', 'AX₅'], ['sf4', 'AX₄E'], ['clf3', 'AX₃E₂'], ['xef2', 'AX₂E₃'], ['sf6', 'AX₆'], ['brf5', 'AX₅E'], ['xef4', 'AX₄E₂']];
      b.appendChild(h('p', { class: 'muted' }, 'All 13 VSEPR shapes tested in AP Chemistry. Click any card to open it in the 3D viewer.'));
      const grid = h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '12px' } });
      b.appendChild(grid);
      SHAPES.forEach(([id, ax]) => {
        const m = MOLECULES.byId[id], V = MOLECULES.vsepr(m.L.length, m.lp);
        const card = h('button', { type: 'button', class: 'panel', style: { cursor: 'pointer', textAlign: 'left', padding: '10px', gap: '6px' } });
        const cv = U.canvas(card, { aspect: 1.2, scope: s, draw: (c, w, H) => Mol3D.draw(c, w, H, Mol3D.fromMolecule(m), { yaw: 0.55, pitch: 0.32 }, { scale: Math.min(w, H) * 0.3, labels: false }) });
        cv.canvas.style.background = 'transparent';
        card.append(h('b', null, V.shape), h('span', { class: 'small muted' }, `${ax} · ${V.angle} · ${V.hyb}`), h('span', { class: 'small', html: 'e.g. ' + U.chem(m.f) }));
        card.addEventListener('click', () => { U.store.set('vseprId', id); U.store.set('tab:vsepr', 0); window.dispatchEvent(new HashChangeEvent('hashchange')); });
        grid.appendChild(card);
      });
    }
  },
});
