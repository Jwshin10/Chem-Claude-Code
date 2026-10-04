'use strict';
/* Shared substance data for IMF tools: formula, name, normal boiling point & melting point (°C), polar?, H-bonding?, note */
const SUBSTANCES = (() => {
  const raw = [
    ['He', 'Helium', -269, -272, 0, 0], ['Ne', 'Neon', -246, -249, 0, 0], ['Ar', 'Argon', -186, -189, 0, 0], ['Kr', 'Krypton', -153, -157, 0, 0], ['Xe', 'Xenon', -108, -112, 0, 0],
    ['H2', 'Hydrogen', -253, -259, 0, 0], ['N2', 'Nitrogen', -196, -210, 0, 0], ['O2', 'Oxygen', -183, -218, 0, 0], ['F2', 'Fluorine', -188, -220, 0, 0],
    ['Cl2', 'Chlorine', -34, -101, 0, 0], ['Br2', 'Bromine', 59, -7, 0, 0], ['I2', 'Iodine', 184, 114, 0, 0],
    ['CH4', 'Methane', -162, -182, 0, 0], ['C2H6', 'Ethane', -89, -183, 0, 0], ['C3H8', 'Propane', -42, -188, 0, 0], ['C4H10', 'Butane', -1, -138, 0, 0],
    ['C5H12', 'Pentane (straight chain)', 36, -130, 0, 0, 'n'], ['C(CH3)4', 'Neopentane (branched C5H12)', 9.5, -16.6, 0, 0, 'b'], ['C6H14', 'Hexane', 69, -95, 0, 0], ['C8H18', 'Octane', 126, -57, 0, 0],
    ['CO2', 'Carbon dioxide', -78, -78, 0, 0], ['CCl4', 'Carbon tetrachloride', 77, -23, 0, 0], ['C6H6', 'Benzene', 80, 5.5, 0, 0],
    ['HF', 'Hydrogen fluoride', 20, -83, 1, 1], ['HCl', 'Hydrogen chloride', -85, -114, 1, 0], ['HBr', 'Hydrogen bromide', -67, -87, 1, 0], ['HI', 'Hydrogen iodide', -35, -51, 1, 0],
    ['H2O', 'Water', 100, 0, 1, 1], ['H2S', 'Hydrogen sulfide', -60, -86, 1, 0], ['NH3', 'Ammonia', -33, -78, 1, 1], ['PH3', 'Phosphine', -88, -133, 1, 0],
    ['CH3OH', 'Methanol', 65, -98, 1, 1], ['C2H5OH', 'Ethanol', 78, -114, 1, 1], ['CH3OCH3', 'Dimethyl ether', -24, -141, 1, 0], ['CH3COCH3', 'Acetone', 56, -95, 1, 0],
    ['CH3CHO', 'Acetaldehyde', 20, -123, 1, 0], ['CH3COOH', 'Acetic acid', 118, 17, 1, 1], ['CH3Cl', 'Chloromethane', -24, -98, 1, 0], ['CH2Cl2', 'Dichloromethane', 40, -97, 1, 0],
    ['CHCl3', 'Chloroform', 61, -64, 1, 0], ['H2O2', 'Hydrogen peroxide', 150, -0.4, 1, 1], ['N2H4', 'Hydrazine', 114, 2, 1, 1], ['CH3NH2', 'Methylamine', -6, -93, 1, 1],
    ['SO2', 'Sulfur dioxide', -10, -72, 1, 0], ['CO', 'Carbon monoxide', -191, -205, 1, 0],
  ];
  const list = raw.map(([f, name, bp, mp, polar, hb, shape]) => {
    const counts = U.parseFormula(f);
    const e = Object.keys(counts).reduce((t, s) => t + ELEMENTS.bySym[s].Z * counts[s], 0);
    return { f, name, bp, mp, polar: !!polar, hb: !!hb, shape, M: U.molarMass(f), e, id: f + (shape || '') };
  });
  const byId = Object.fromEntries(list.map(s => [s.id, s]));
  const imfs = s => ['LDF'].concat(s.polar ? ['Dipole–dipole'] : []).concat(s.hb ? ['Hydrogen bonding'] : []);
  const ckey = c => Object.keys(c).sort().map(k => k + c[k]).join('');
  /** turn typed text into a substance (measured data if we have it, otherwise estimated) */
  function fromText(text) {
    const r = BUILDER.fromText(text);
    if (r.error) return { error: r.error };
    const spec = r.spec;
    if (spec.q) return { error: 'Enter a neutral molecule. Ions in solution are held by ion–dipole forces, which this comparison does not model.' };
    if (spec.atom && !['He', 'Ne', 'Ar', 'Kr', 'Xe', 'Rn'].includes(spec.struct.atoms[0].el)) return { error: 'A lone atom of that element is not a stable substance. Try a molecule such as Cl2 or CH3OH.' };
    const P = BUILDER.properties(spec);
    const counts = {};
    MOLECULES.build(spec).atoms.forEach(a => { counts[a.el] = (counts[a.el] || 0) + 1; });
    const body = text.replace(/\s+/g, '').replace(/[=#≡]/g, '');
    const id = 'my:' + body;
    if (byId[id]) return { sub: byId[id], known: false, P };
    const known = list.find(x => !x.est && x.f === body) || list.find(x => !x.est && ckey(U.parseFormula(x.f)) === ckey(counts) && x.polar === P.polar && x.hb === P.hb);
    if (known) return { sub: known, known: true, P };
    const sub = { f: spec.f.replace(/\^.*/, ''), name: spec.custom ? body : spec.name, bp: P.bp, mp: Math.min(P.mp, P.bp - 10), polar: P.polar, hb: P.hb, M: P.M, e: P.e, id, est: true };
    if (!byId[id]) list.push(sub);
    byId[id] = sub;
    return { sub, known: false, P };
  }
  const describe = (r) => `${r.known ? `Using measured data for <b>${r.sub.name}</b>.` : `Added <b>${U.chem(r.sub.f)}</b>: ${r.sub.e} electrons, ${r.sub.polar ? 'polar' : 'nonpolar'}${r.sub.hb ? ', hydrogen bonding' : ''}. Boiling point estimated at about ${r.sub.bp} °C (±40 °C) from its electron count, polarity and hydrogen bonding.`}`;
  return { list, byId, imfs, fromText, describe };
})();

App.register({
  id: 'imf', unit: 3, sym: 'If', title: 'Intermolecular Forces',
  desc: 'See London dispersion, dipole–dipole, hydrogen bonding and ion–dipole forces in action, explain boiling points, and test your own molecules.',
  tags: ['imf', 'london dispersion', 'ldf', 'dipole-dipole', 'hydrogen bonding', 'h-bond', 'ion-dipole', 'boiling point', 'polarizability', 'vapor pressure', 'intermolecular'],
  keyIdeas: [
    '<b>London dispersion forces (LDF)</b> exist between all molecules. They grow with the number of electrons (polarizability) and with surface contact (straight chains &gt; branched).',
    '<b>Dipole–dipole forces</b> act between polar molecules: the δ+ end of one attracts the δ− end of another.',
    '<b>Hydrogen bonds</b> are especially strong dipole–dipole attractions between an H bonded to N, O or F and a lone pair on N, O or F of another molecule.',
    '<b>Ion–dipole forces</b> hold water molecules around dissolved ions (O end toward cations, H end toward anions).',
    'Stronger IMFs → higher boiling point, higher melting point, higher viscosity and surface tension, and lower vapor pressure.',
    'IMFs are much weaker than covalent or ionic bonds. Boiling water separates molecules; it does not break O–H bonds.',
    'A large molecule with only LDFs can out-boil a small polar or H-bonding one (I<sub>2</sub> boils at 184 °C, water at 100 °C).',
  ],
  render(el, scope) {
    const h = U.h;
    const W = { r: 0.55, half: 0.912 };
    U.tabs(el, [
      { label: 'The four forces', render: forces },
      { label: 'Particle simulation', render: simulation },
      { label: 'Compare substances', render: compare },
      { label: 'Boiling-point trends', render: trends },
    ], scope, { key: 'imf' });

    /* ---------- drawing helpers ---------- */
    function drawWater(c, x, y, th, s, alpha = 1) {
      const hs = [th + W.half, th - W.half].map(a => [x + Math.cos(a) * W.r * s, y + Math.sin(a) * W.r * s]);
      c.strokeStyle = U.alpha('#8d97a3', alpha); c.lineWidth = s * 0.12;
      hs.forEach(([hx, hy]) => { c.beginPath(); c.moveTo(x, y); c.lineTo(hx, hy); c.stroke(); });
      hs.forEach(([hx, hy]) => U.drawAtom(c, hx, hy, s * 0.2, 'H', { label: false, alpha }));
      U.drawAtom(c, x, y, s * 0.32, 'O', { label: false, alpha });
      return hs;
    }
    function dashed(c, x1, y1, x2, y2, col, w = 2, d = [4, 4]) { c.save(); c.strokeStyle = col; c.lineWidth = w; c.setLineDash(d); c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); c.restore(); }

    /* ---------- tab 1: the four forces ---------- */
    function forces(b, s) {
      const cards = [
        { key: 'ldf', title: 'London dispersion', who: 'All molecules and atoms', str: 'weak → moderate (grows with electron count)', bar: 0.25,
          text: 'Electrons are always moving. For an instant, more of them may sit on one side of an atom, creating a temporary dipole. That dipole pushes on the electrons of a neighbour and induces a dipole there. The two instantaneous dipoles attract.' },
        { key: 'dd', title: 'Dipole–dipole', who: 'Polar molecules (e.g. HCl, acetone)', str: 'moderate', bar: 0.4,
          text: 'Polar molecules have permanent δ+ and δ− ends. Molecules tend to line up so the δ+ end of one faces the δ− end of a neighbour.' },
        { key: 'hb', title: 'Hydrogen bonding', who: 'H bonded to N, O, or F → lone pair on N, O, F', str: 'strong for an IMF', bar: 0.6,
          text: 'The H on an N–H, O–H or F–H bond carries a large δ+. It is attracted to a lone pair on a small, very electronegative N, O or F atom of another molecule.' },
        { key: 'id', title: 'Ion–dipole', who: 'Ions dissolved in polar solvents', str: 'strongest IMF', bar: 0.85,
          text: 'Water molecules surround dissolved ions: the δ− oxygen faces cations and the δ+ hydrogens face anions. These forces are what let ionic compounds dissolve.' },
      ];
      const grid = h('div', { class: 'grid2' });
      b.appendChild(grid);
      let anion = false;
      const canv = {};
      cards.forEach(cd => {
        const cv = U.canvas(null, { aspect: 1.9, scope: s });
        canv[cd.key] = cv;
        const bar = h('div', { class: 'progress', title: 'typical relative strength' }, h('i', { style: { width: cd.bar * 100 + '%', background: 'var(--uc)' } }));
        const extra = cd.key === 'id' ? U.seg({ options: [{ value: 0, label: 'Na⁺ (cation)' }, { value: 1, label: 'Cl⁻ (anion)' }], value: 0, onChange: v => anion = !!v }).el : null;
        grid.appendChild(U.panel(cd.title, cv.wrap, extra, h('p', { class: 'small' }, cd.text),
          h('div', { class: 'small muted' }, h('b', null, 'Found in: '), cd.who), h('div', { class: 'small muted' }, h('b', null, 'Strength: '), cd.str), bar));
      });
      s.loop((dt, time) => {
        const t = U.theme(), T = time / 1000;
        // LDF
        { const cv = canv.ldf, c = cv.ctx, w = cv.w, H = cv.h; c.clearRect(0, 0, w, H);
          const R = Math.min(H * 0.3, w * 0.16), x1 = w / 2 - R * 1.25, x2 = w / 2 + R * 1.25, y = H / 2;
          const ph = Math.sin(T * 1.6), ph2 = Math.sin(T * 1.6 - 0.5);
          [[x1, ph], [x2, ph2]].forEach(([x, p]) => {
            const dx = p * R * 0.35;
            const g = c.createRadialGradient(x + dx, y, 2, x + dx, y, R);
            g.addColorStop(0, U.alpha(t.blue, 0.5)); g.addColorStop(1, U.alpha(t.blue, 0.05));
            c.beginPath(); c.arc(x + dx * 0.4, y, R, 0, 7); c.fillStyle = g; c.fill();
            c.beginPath(); c.arc(x, y, 6, 0, 7); c.fillStyle = t.red; c.fill();
            if (Math.abs(p) > 0.35) {
              U.text(c, 'δ−', x + Math.sign(p) * R * 0.7, y - R * 0.75, { align: 'center', color: t.blue, weight: 700, size: 14 });
              U.text(c, 'δ+', x - Math.sign(p) * R * 0.7, y - R * 0.75, { align: 'center', color: t.red, weight: 700, size: 14 });
            }
          });
          if (ph > 0.35 && ph2 > 0.2) dashed(c, x1 + R * 0.75, y, x2 - R * 0.75, y, t.good, 2.5);
          U.text(c, ph > 0.35 ? 'temporary dipole induces a dipole in the neighbour' : 'electron clouds fluctuate…', w / 2, H - 8, { align: 'center', size: 11, color: t.ink2 });
        }
        // dipole-dipole
        { const cv = canv.dd, c = cv.ctx, w = cv.w, H = cv.h; c.clearRect(0, 0, w, H);
          const S = Math.min(w / 7, H / 3.2);
          const pos = [];
          for (let j = 0; j < 2; j++) for (let i = 0; i < 3; i++) pos.push([w / 2 + (i - 1) * S * 2.1 + (j ? S * 0.5 : -S * 0.5), H / 2 + (j - 0.5) * S * 1.4, (j ? Math.PI : 0) + Math.sin(T * 2 + i * 2 + j) * 0.25]);
          const ends = pos.map(([x, y, a]) => ({ H: [x - Math.cos(a) * S * 0.42, y - Math.sin(a) * S * 0.42], Cl: [x + Math.cos(a) * S * 0.32, y + Math.sin(a) * S * 0.32] }));
          for (let k = 0; k < ends.length; k++) for (let m = 0; m < ends.length; m++) {
            if (k === m) continue;
            const d = Math.hypot(ends[k].Cl[0] - ends[m].H[0], ends[k].Cl[1] - ends[m].H[1]);
            if (d < S * 1.55) dashed(c, ends[k].Cl[0], ends[k].Cl[1], ends[m].H[0], ends[m].H[1], U.alpha(t.good, 0.9), 2, [3, 4]);
          }
          ends.forEach(e => { c.strokeStyle = '#8d97a3'; c.lineWidth = 4; c.beginPath(); c.moveTo(...e.H); c.lineTo(...e.Cl); c.stroke(); U.drawAtom(c, ...e.Cl, S * 0.3, 'Cl', { label: 'δ−' }); U.drawAtom(c, ...e.H, S * 0.2, 'H', { label: 'δ+' }); });
        }
        // hydrogen bonding
        { const cv = canv.hb, c = cv.ctx, w = cv.w, H = cv.h; c.clearRect(0, 0, w, H);
          const S = Math.min(w / 6.4, H / 5), cx = w / 2, cy = H / 2 + S * 0.15, th = -Math.PI / 2 + Math.sin(T) * 0.1;
          const jig = k => Math.sin(T * 2.2 + k) * S * 0.05;
          const centralHs = [th + W.half, th - W.half].map(a => [cx + Math.cos(a) * W.r * S, cy + Math.sin(a) * W.r * S]);
          const mols = [];
          centralHs.forEach(([hx, hy], k) => { const a = Math.atan2(hy - cy, hx - cx); mols.push({ x: cx + Math.cos(a) * 1.75 * S + jig(k), y: cy + Math.sin(a) * 1.75 * S + jig(k + 3), th: a, hb: [hx, hy], acc: true }); });
          [th + Math.PI + 0.95, th + Math.PI - 0.95].forEach((a, k) => { const x = cx + Math.cos(a) * 1.9 * S + jig(k + 5), y = cy + Math.sin(a) * 1.9 * S + jig(k + 7); const back = Math.atan2(cy - y, cx - x); mols.push({ x, y, th: back - W.half, acc: false }); });
          mols.forEach(m => {
            const hs = [m.th + W.half, m.th - W.half].map(a => [m.x + Math.cos(a) * W.r * S, m.y + Math.sin(a) * W.r * S]);
            if (m.acc) dashed(c, m.hb[0], m.hb[1], m.x, m.y, t.blue, 2.5, [5, 4]);
            else dashed(c, hs[0][0], hs[0][1], cx, cy, t.blue, 2.5, [5, 4]);
          });
          mols.forEach(m => drawWater(c, m.x, m.y, m.th, S, 0.85));
          drawWater(c, cx, cy, th, S);
          U.text(c, '- - -  hydrogen bond', 10, H - 8, { size: 11, color: t.blue, weight: 600 });
        }
        // ion-dipole
        { const cv = canv.id, c = cv.ctx, w = cv.w, H = cv.h; c.clearRect(0, 0, w, H);
          const S = Math.min(w / 6.6, H / 5), cx = w / 2, cy = H / 2;
          for (let k = 0; k < 6; k++) {
            const a = k / 6 * Math.PI * 2 + T * 0.15, r = 1.75 * S + Math.sin(T * 2 + k) * S * 0.05;
            const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
            const th = anion ? a + Math.PI - W.half : a;
            const hs = drawWater(c, x, y, th, S);
            if (anion) dashed(c, hs[0][0], hs[0][1], cx + Math.cos(a) * S * 0.55, cy + Math.sin(a) * S * 0.55, t.good, 2, [3, 3]);
            else dashed(c, x - Math.cos(a) * S * 0.3, y - Math.sin(a) * S * 0.3, cx + Math.cos(a) * S * 0.4, cy + Math.sin(a) * S * 0.4, t.good, 2, [3, 3]);
          }
          U.drawAtom(c, cx, cy, anion ? S * 0.55 : S * 0.38, anion ? 'Cl' : 'Na', { label: anion ? 'Cl⁻' : 'Na⁺' });
        }
      });
    }

    /* ---------- tab 2: particle simulation ---------- */
    function simulation(b, s) {
      let sub = SUBSTANCES.byId[U.store.get('imfSim', 'H2O')] || SUBSTANCES.byId.H2O, Tc = 25;
      const opts = SUBSTANCES.list.map(x => ({ value: x.id, label: `${U.chemText(x.f)}, ${x.name} (bp ${x.bp} °C)` }));
      const sel = U.select({ label: 'Substance', options: opts, value: sub.id, onChange: v => { sub = SUBSTANCES.byId[v]; U.store.set('imfSim', v); reset(); info(); } });
      const tS = U.slider({ label: 'Temperature', min: -273, max: 400, step: 1, value: Tc, unit: '°C', onInput: v => { Tc = Math.max(-272, v); info(); } });
      const quick = h('div', { class: 'row' }, U.btn('Set to 25 °C', () => { Tc = 25; tS.set(25); info(); }, 'sm'), U.btn('Just below bp', () => { Tc = sub.bp - 15; tS.set(Tc); info(); }, 'sm'), U.btn('Just above bp', () => { Tc = sub.bp + 25; tS.set(Tc); info(); }, 'sm'));
      const box = h('div', { class: 'stack' });
      const cv = U.canvas(null, { aspect: 1.55, scope: s });
      const own = BUILDER.entry({ title: 'Simulate your own molecule', label: 'Formula', placeholder: 'e.g. CH3CH2CH2OH', examples: ['CH3CH2CH2OH', 'CH3OCH3', 'CCl4', 'C8H18', 'HCN', 'CH3CN'], button: 'Simulate', hint: 'Type a molecular or condensed formula. Measured data are used when we have them; otherwise the boiling point is estimated.', onSubmit: text => {
        const r = SUBSTANCES.fromText(text);
        if (r.error) return { ok: false, msg: r.error };
        if (!sel.input.querySelector(`option[value="${CSS.escape(r.sub.id)}"]`)) sel.input.appendChild(h('option', { value: r.sub.id }, `${U.chemText(r.sub.f)} — yours (bp ≈ ${r.sub.bp} °C)`));
        sub = r.sub; sel.set(sub.id); U.store.set('imfSim', sub.id); reset(); info();
        return { ok: true, msg: SUBSTANCES.describe(r) };
      } });
      b.append(h('div', { class: 'grid-viz' }, U.panel(null, cv.wrap, U.legend([[U.theme().blue, 'hydrogen bond'], [U.theme().good, 'dipole–dipole'], [U.theme().ink3, 'London dispersion']])),
        h('div', { class: 'stack' }, U.panel('Settings', sel.el, tS.el, quick), own.el, box)));
      // 2-D Lennard-Jones particles in reduced units (sigma = 1)
      const N = 42, BW = 22, BH = 14;
      let P = [];
      function reset() {
        P = [];
        for (let i = 0; i < N; i++) P.push({ x: 1 + (i % 7) * 1.25 + U.rand(-0.1, 0.1), y: BH - 1 - Math.floor(i / 7) * 1.25, vx: U.rand(-0.5, 0.5), vy: U.rand(-0.5, 0.5), a: U.rand(0, 6.28), w: U.rand(-1, 1) });
      }
      reset();
      const Tstar = () => 0.45 * (Tc + 273.15) / (sub.bp + 273.15);
      s.loop((dt) => {
        const T = Tstar(), sub8 = 10, h = 0.006;
        for (let st = 0; st < sub8; st++) {
          const F = P.map(() => [0, -0.08]);
          for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
            const dx = P[j].x - P[i].x, dy = P[j].y - P[i].y, r2 = dx * dx + dy * dy;
            if (r2 > 6.25) continue;
            const ir2 = 1 / Math.max(r2, 0.64), ir6 = ir2 * ir2 * ir2;
            const f = 24 * ir2 * ir6 * (2 * ir6 - 1);
            F[i][0] -= f * dx; F[i][1] -= f * dy; F[j][0] += f * dx; F[j][1] += f * dy;
          }
          let ke = 0;
          P.forEach((p, i) => {
            p.vx += F[i][0] * h; p.vy += F[i][1] * h;
            p.x += p.vx * h; p.y += p.vy * h;
            if (p.x < 0.5) { p.x = 0.5; p.vx = Math.abs(p.vx); } if (p.x > BW - 0.5) { p.x = BW - 0.5; p.vx = -Math.abs(p.vx); }
            if (p.y < 0.5) { p.y = 0.5; p.vy = Math.abs(p.vy); } if (p.y > BH - 0.5) { p.y = BH - 0.5; p.vy = -Math.abs(p.vy); }
            ke += 0.5 * (p.vx * p.vx + p.vy * p.vy);
          });
          const Tcur = ke / N;
          const lam = Math.sqrt(1 + 0.08 * (T / Math.max(Tcur, 1e-4) - 1));
          P.forEach(p => { p.vx *= lam; p.vy *= lam; const sp = Math.hypot(p.vx, p.vy); if (sp > 12) { p.vx *= 12 / sp; p.vy *= 12 / sp; } });
        }
        P.forEach(p => { p.a += p.w * dt * (0.5 + T * 3); });
        draw();
      });
      function draw() {
        const c = cv.ctx, w = cv.w, H = cv.h, t = U.theme();
        c.clearRect(0, 0, w, H);
        const sc = Math.min(w / BW, H / BH), ox = (w - BW * sc) / 2, oy = (H - BH * sc) / 2;
        const X = x => ox + x * sc, Y = y => oy + (BH - y) * sc;
        c.strokeStyle = t.line; c.lineWidth = 1; c.strokeRect(ox, oy, BW * sc, BH * sc);
        const col = sub.hb ? t.blue : sub.polar ? t.good : t.ink3;
        for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
          const d = Math.hypot(P[i].x - P[j].x, P[i].y - P[j].y);
          if (d < 1.45) dashed(c, X(P[i].x), Y(P[i].y), X(P[j].x), Y(P[j].y), U.alpha(col, sub.hb ? 0.9 : sub.polar ? 0.7 : 0.35), sub.hb ? 2 : 1.4, sub.hb ? [4, 3] : [2, 3]);
        }
        const R = sc * 0.42;
        P.forEach(p => {
          const x = X(p.x), y = Y(p.y);
          if (sub.f === 'H2O') { drawWater(c, x, y, p.a, sc * 0.95); return; }
          if (sub.hb || sub.polar) {
            const dx = Math.cos(p.a) * R * 0.45, dy = Math.sin(p.a) * R * 0.45;
            U.drawAtom(c, x + dx, y + dy, R * 0.62, 'H', { label: 'δ+' });
            U.drawAtom(c, x - dx, y - dy, R * 0.8, sub.hb ? (sub.f.includes('N') ? 'N' : sub.f.includes('F') ? 'F' : 'O') : 'Cl', { label: 'δ−' });
          } else {
            const g = c.createRadialGradient(x - R / 3, y - R / 3, 1, x, y, R);
            g.addColorStop(0, U.shade(t.purple, 0.55)); g.addColorStop(1, U.alpha(t.purple, 0.85));
            c.beginPath(); c.arc(x, y, R * U.clamp(0.7 + sub.e / 150, 0.7, 1.15), 0, 7); c.fillStyle = g; c.fill();
          }
        });
      }
      function info() {
        U.clear(box);
        const state = Tc < sub.mp ? 'solid' : Tc < sub.bp ? 'liquid' : 'gas';
        const stats = U.stats([['bp', 'Boiling point'], ['mp', 'Melting point'], ['st', 'State at this T'], ['e', 'Electrons']]);
        stats.set('bp', (sub.est ? '≈' : '') + sub.bp + ' °C'); stats.set('mp', (sub.est ? '≈' : '') + sub.mp + ' °C'); stats.set('st', state); stats.set('e', sub.e);
        box.append(stats.el,
          U.panel('Forces present', h('div', { class: 'row' }, ['LDF', 'Dipole–dipole', 'Hydrogen bonding'].map(n => h('span', { class: 'chip' + (SUBSTANCES.imfs(sub).includes(n) ? '' : ' off') }, n)))),
          U.callout(state === 'gas' ? `Above ${sub.bp} °C the molecules have enough kinetic energy to overcome their intermolecular attractions, so they spread out as a gas.` : `Below its boiling point the attractions win: molecules stay close together and the dashed lines show the IMFs holding them.`));
        box.append(h('p', { class: 'small muted' }, 'Model: 42 particles that attract each other with a strength scaled to the real boiling point. Motion speeds up with temperature.'));
      }
      info();
    }

    /* ---------- tab 3: compare ---------- */
    function compare(b, s) {
      let A = U.store.get('imfA', 'H2O'), B = U.store.get('imfB', 'H2S');
      if (!SUBSTANCES.byId[A]) A = 'H2O'; if (!SUBSTANCES.byId[B]) B = 'H2S';
      const opts = SUBSTANCES.list.map(x => ({ value: x.id, label: `${U.chemText(x.f)}, ${x.name}` }));
      const sA = U.select({ label: 'Substance A', options: opts, value: A, onChange: v => { A = v; U.store.set('imfA', v); upd(); } });
      const sB = U.select({ label: 'Substance B', options: opts, value: B, onChange: v => { B = v; U.store.set('imfB', v); upd(); } });
      const pairs = [['H2O', 'H2S'], ['HF', 'HCl'], ['HCl', 'HI'], ['C5H12n', 'C(CH3)4b'], ['C2H5OH', 'CH3OCH3'], ['F2', 'I2'], ['CH4', 'C8H18'], ['I2', 'H2O'], ['CH3COCH3', 'C4H10'], ['NH3', 'PH3']];
      const pick = h('div', { class: 'row' }, pairs.map(([a, c]) => U.btn(U.chem(SUBSTANCES.byId[a].f) + ' vs ' + U.chem(SUBSTANCES.byId[c].f), () => { A = a; B = c; sA.set(a); sB.set(c); U.store.set('imfA', a); U.store.set('imfB', c); upd(); }, 'sm')));
      const cards = h('div', { class: 'grid2' });
      const verdict = h('div');
      const cv = U.canvas(null, { height: 150, scope: s, draw });
      const own = BUILDER.entry({ title: 'Compare your own molecule', label: 'Formula (goes into Substance B)', placeholder: 'e.g. CH3CH2CH2OH', examples: ['CH3CH2CH2OH', 'CH3CH2OCH3', 'C6H14', 'CH3COCH3', 'CHF3'], button: 'Compare', onSubmit: text => {
        const r = SUBSTANCES.fromText(text);
        if (r.error) return { ok: false, msg: r.error };
        [sA, sB].forEach(x => { if (!x.input.querySelector(`option[value="${CSS.escape(r.sub.id)}"]`)) x.input.appendChild(h('option', { value: r.sub.id }, `${U.chemText(r.sub.f)} — yours`)); });
        B = r.sub.id; sB.set(B); U.store.set('imfB', B); upd();
        return { ok: true, msg: SUBSTANCES.describe(r) };
      } });
      b.append(U.panel('Pick two substances', h('div', { class: 'controls' }, sA.el, sB.el), h('div', { class: 'small muted' }, 'Classic AP comparisons:'), pick), own.el, cards, U.panel('Boiling points', cv.wrap), verdict);
      function card(x) {
        return U.panel(null, h('div', { class: 'flex-between' }, h('h2', { html: U.chem(x.f) }), h('span', { class: 'muted small' }, x.name)),
          h('dl', { class: 'kv' }, ...[['Molar mass', x.M.toFixed(1) + ' g/mol'], ['Electrons', x.e], ['Polarity', x.polar ? 'polar' : 'nonpolar'], ['Boiling point', (x.est ? '≈' : '') + x.bp + ' °C' + (x.est ? ' (estimated)' : '')]].flatMap(([k, v]) => [h('dt', null, k), h('dd', null, String(v))])),
          h('div', { class: 'row' }, ['LDF', 'Dipole–dipole', 'Hydrogen bonding'].map(n => h('span', { class: 'chip' + (SUBSTANCES.imfs(x).includes(n) ? '' : ' off') }, n))));
      }
      function draw(c, w, H) {
        const t = U.theme(), a = SUBSTANCES.byId[A], bb = SUBSTANCES.byId[B];
        const lo = Math.min(-280, a.bp, bb.bp), hi = Math.max(200, a.bp, bb.bp) + 20;
        const L = 110, R = w - 20, X = v => L + (v - lo) / (hi - lo) * (R - L);
        [[a, 38, t.blue], [bb, 92, t.orange]].forEach(([x, y, col]) => {
          c.fillStyle = U.alpha(col, 0.2); U.roundRect(c, L, y - 14, X(x.bp) - L, 28, 6); c.fill();
          c.fillStyle = col; c.beginPath(); c.arc(X(x.bp), y, 8, 0, 7); c.fill();
          U.text(c, U.chemText(x.f), L - 10, y + 5, { align: 'right', weight: 700, size: 14 });
          U.text(c, x.bp + ' °C', X(x.bp) + (X(x.bp) > R - 60 ? -14 : 14), y + 4, { align: X(x.bp) > R - 60 ? 'right' : 'left', mono: true, size: 12 });
        });
        [0, 100].forEach(v => { const x = X(v); c.strokeStyle = t.line; c.setLineDash([3, 3]); c.beginPath(); c.moveTo(x, 14); c.lineTo(x, H - 20); c.stroke(); c.setLineDash([]); U.text(c, v + ' °C', x, H - 6, { align: 'center', size: 10, color: t.ink3 }); });
      }
      function explain(a, bb) {
        if (a.bp === bb.bp) return 'These two have the same boiling point.';
        const hi = a.bp > bb.bp ? a : bb, lo = hi === a ? bb : a;
        const F = x => U.chem(x.f);
        const sameFormula = JSON.stringify(U.parseFormula(hi.f)) === JSON.stringify(U.parseFormula(lo.f));
        let why;
        if (hi.hb && !lo.hb) why = `${F(hi)} can form <b>hydrogen bonds</b> (it has H bonded directly to ${hi.f.includes('F') ? 'F' : hi.f.includes('N') && !hi.f.includes('O') ? 'N' : 'O'}), while ${F(lo)} cannot.` + (lo.e > hi.e ? ` This outweighs the stronger London dispersion forces of ${F(lo)}, which has more electrons (${lo.e} vs ${hi.e}).` : ' Hydrogen bonds are the strongest of these IMFs, so more energy is needed to separate the molecules.');
        else if (sameFormula) why = `Both have the same formula and ${hi.e} electrons, but ${F(hi)} ${hi.shape === 'n' ? 'is a straight chain' : 'has a shape'} that allows more surface contact between molecules, so its London dispersion forces are stronger.` + (lo.shape === 'b' ? ` Branched ${lo.name.split(' ')[0].toLowerCase()} is compact and nearly spherical, with less contact area.` : '');
        else if (!hi.hb && lo.hb) why = `Even though ${F(lo)} can hydrogen bond, ${F(hi)} has far more electrons (${hi.e} vs ${lo.e}). Its large, polarizable electron cloud gives London dispersion forces strong enough to outweigh ${F(lo)}’s hydrogen bonds.`;
        else if (hi.polar && !lo.polar && Math.abs(hi.e - lo.e) <= 10) why = `The two have similar numbers of electrons (${hi.e} vs ${lo.e}), so their London dispersion forces are comparable. ${F(hi)} is <b>polar</b>, so it also has dipole–dipole attractions.`;
        else if (!hi.polar && lo.polar) why = `${F(lo)} is polar, but ${F(hi)} has many more electrons (${hi.e} vs ${lo.e}). Its stronger London dispersion forces outweigh ${F(lo)}’s dipole–dipole forces.`;
        else if (hi.e > lo.e) why = `${hi.hb && lo.hb ? 'Both can hydrogen bond, but ' : hi.polar && lo.polar ? 'Both are polar, but ' : ''}${F(hi)} has more electrons (${hi.e} vs ${lo.e}), making its electron cloud larger and more polarizable. That gives stronger London dispersion forces.`;
        else if (hi.f === 'H2O') why = `Both can hydrogen bond, but each water molecule has two H atoms and two lone pairs, so it can form up to four hydrogen bonds. ${F(lo)} forms fewer per molecule.`;
        else why = `${F(hi)} has stronger intermolecular forces overall${hi.polar ? ' (its dipole is larger)' : ''}, even with ${hi.e < lo.e ? 'fewer' : 'similar numbers of'} electrons.`;
        return `<b>${hi.name} (${hi.bp} °C) boils higher than ${lo.name} (${lo.bp} °C).</b> ${why} Stronger IMFs mean more energy is needed to separate the molecules, so the boiling point is higher and the vapor pressure is lower.`;
      }
      function upd() {
        const a = SUBSTANCES.byId[A], bb = SUBSTANCES.byId[B];
        U.clear(cards); cards.append(card(a), card(bb));
        cv.redraw();
        U.clear(verdict); verdict.appendChild(U.callout(explain(a, bb), 'good'));
      }
      upd();
    }

    /* ---------- tab 4: trends ---------- */
    function trends(b, s) {
      const SETS = {
        hydrides: { label: 'Hydrides (groups 14–17)', series: [
          ['Group 14', [['CH4', -162], ['SiH4', -112], ['GeH4', -89], ['SnH4', -52]]],
          ['Group 15', [['NH3', -33], ['PH3', -88], ['AsH3', -62], ['SbH3', -17]]],
          ['Group 16', [['H2O', 100], ['H2S', -60], ['H2Se', -41], ['H2Te', -2]]],
          ['Group 17', [['HF', 20], ['HCl', -85], ['HBr', -67], ['HI', -35]]]], x: ['Period 2', 'Period 3', 'Period 4', 'Period 5'],
          note: 'Within each group, boiling point rises with period because heavier molecules have more electrons (stronger LDFs). H₂O, HF and NH₃ break the pattern: hydrogen bonding makes their boiling points far higher than predicted. CH₄ follows the trend because C–H bonds cannot hydrogen bond.' },
        nonpolar: { label: 'Nonpolar series', series: [
          ['Noble gases', [['He', -269], ['Ne', -246], ['Ar', -186], ['Kr', -153], ['Xe', -108]]],
          ['Halogens', [['F2', -188], ['Cl2', -34], ['Br2', 59], ['I2', 184]]],
          ['Alkanes', [['CH4', -162], ['C2H6', -89], ['C3H8', -42], ['C4H10', -1], ['C5H12', 36]]]], x: ['1st', '2nd', '3rd', '4th', '5th'],
          note: 'With only London dispersion forces, boiling point climbs steadily with the number of electrons (polarizability). This is why the halogens change from gases (F₂, Cl₂) to a liquid (Br₂) to a solid (I₂) at room temperature.' },
        alcohols: { label: 'Alcohols vs alkanes', series: [
          ['Alcohols (–OH)', [['CH3OH', 65], ['C2H5OH', 78], ['C3H7OH', 97], ['C4H9OH', 118]]],
          ['Alkanes (similar mass)', [['C2H6', -89], ['C3H8', -42], ['C4H10', -1], ['C5H12', 36]]]], x: ['1 C', '2 C', '3 C', '4 C'],
          note: 'Alcohols boil far above alkanes of similar molar mass because the O–H group hydrogen bonds. As the carbon chain grows, LDFs add up in both series.' },
      };
      let key = 'hydrides';
      const seg = U.seg({ options: Object.keys(SETS).map(k => ({ value: k, label: SETS[k].label })), value: key, onChange: v => { key = v; cv.redraw(); note(); } });
      const nb = h('div');
      const cv = U.canvas(null, { aspect: 1.9, scope: s, draw });
      b.append(U.panel(null, seg.el, cv.wrap), nb);
      function draw(c, w, H) {
        const t = U.theme(), S = SETS[key], cols = [t.blue, t.green, t.red, t.purple];
        const all = S.series.flatMap(x => x[1].map(p => p[1]));
        const P = new U.Plot(c, w, H, { x: [-0.3, S.x.length - 0.7], y: [Math.floor(Math.min(...all) / 50) * 50 - 20, Math.ceil(Math.max(...all) / 50) * 50 + 20], xticks: S.x.map((_, i) => i), xfmt: v => S.x[Math.round(v)] || '', ylabel: 'Boiling point (°C)' });
        P.axes();
        S.series.forEach(([name, pts], i) => {
          P.line(pts.map((p, k) => [k, p[1]]), cols[i], 2.4);
          pts.forEach((p, k) => { P.dot(k, p[1], cols[i], 5); P.label(U.chemText(p[0]), k, p[1], cols[i], { dx: 8, dy: -6 }); });
        });
        S.series.forEach(([name], i) => { c.fillStyle = cols[i]; c.fillRect(P.L + 12, P.T + 8 + i * 18, 12, 12); U.text(c, name, P.L + 30, P.T + 18 + i * 18, { size: 12, weight: 600 }); });
      }
      function note() { U.clear(nb); nb.appendChild(U.callout(SETS[key].note)); }
      note();
    }
  },
});
