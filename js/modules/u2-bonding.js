'use strict';
App.register({
  id: 'bond-types', unit: 2, sym: 'Bt', title: 'Bond Types & Electronegativity',
  desc: 'Pick any two elements to see how electronegativity difference decides nonpolar, polar covalent, ionic or metallic bonding.',
  tags: ['electronegativity', 'polar covalent', 'nonpolar', 'ionic bond', 'metallic bond', 'dipole', 'partial charge', 'bond polarity'],
  keyIdeas: [
    'Electronegativity is an atom’s ability to attract shared electrons in a bond.',
    'Equal sharing (ΔEN ≈ 0) gives a <b>nonpolar covalent</b> bond; unequal sharing gives a <b>polar covalent</b> bond with partial charges δ+ and δ−.',
    'A metal + nonmetal with a large ΔEN transfers electrons to form ions: an <b>ionic</b> bond.',
    'Bond type is a continuum. Metal + nonmetal is generally ionic; nonmetal + nonmetal is covalent; metal + metal is metallic.',
    'The dipole arrow points toward the more electronegative atom (the δ− end).',
  ],
  render(el, scope) {
    const h = U.h;
    const common = ['H', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'K', 'Ca', 'Fe', 'Cu', 'Zn', 'Br', 'Ag', 'I', 'Cs', 'Au'];
    let A = 'H', B = 'Cl';
    const opts = common.map(s => ({ value: s, label: `${s}, ${ELEMENTS.bySym[s].name} (EN ${ELEMENTS.bySym[s].en})` }));
    const sA = U.select({ label: 'Atom 1', options: opts, value: A, onChange: v => { A = v; update(); } });
    const sB = U.select({ label: 'Atom 2', options: opts, value: B, onChange: v => { B = v; update(); } });
    const picks = h('div', { class: 'row' }, [['H', 'H'], ['C', 'H'], ['H', 'Cl'], ['H', 'F'], ['O', 'H'], ['C', 'O'], ['Na', 'Cl'], ['Mg', 'O'], ['Cs', 'F'], ['Cu', 'Zn']].map(([a, b]) => U.btn(a + '–' + b, () => { A = a; B = b; sA.set(a); sB.set(b); update(); }, 'sm')));
    const out = h('div', { class: 'stack' });
    let t0 = 0;
    const cv = U.canvas(null, { aspect: 2, scope });
    const bar = U.canvas(null, { height: 92, scope, draw: drawBar });
    el.append(h('div', { class: 'grid-viz' },
      h('div', { class: 'stack' }, U.panel('Electron density', cv.wrap, h('p', { class: 'small muted' }, 'The shaded cloud shows where the bonding electrons spend their time.')), U.panel('Where does this bond fall?', bar.wrap)),
      h('div', { class: 'stack' }, U.panel('Choose two elements', sA.el, sB.el, picks), out)));

    const info = () => {
      const a = ELEMENTS.bySym[A], b = ELEMENTS.bySym[B];
      const d = Math.abs(a.en - b.en);
      const metal = e => ['alkali', 'alkaline', 'transition', 'post', 'lanthanide', 'actinide'].includes(e.cat);
      let type;
      if (metal(a) && metal(b)) type = 'metallic';
      else if ((metal(a) || metal(b)) && d >= 1.0) type = 'ionic';
      else if (d < 0.4) type = 'nonpolar';
      else if (d < 1.8) type = 'polar';
      else type = 'ionic';
      return { a, b, d, type, neg: a.en >= b.en ? a : b, pos: a.en >= b.en ? b : a };
    };
    const NAMES = { metallic: 'Metallic bonding', ionic: 'Ionic bond', nonpolar: 'Nonpolar covalent bond', polar: 'Polar covalent bond' };

    scope.loop((dt, time) => {
      const c = cv.ctx, w = cv.w, H = cv.h, t = U.theme(), I = info();
      c.clearRect(0, 0, w, H);
      const cy = H * 0.52, sep = Math.min(w * 0.32, 190);
      const x1 = w / 2 - sep / 2, x2 = w / 2 + sep / 2;
      const r1 = 18 + (I.a.radius || 100) / 9, r2 = 18 + (I.b.radius || 100) / 9;
      if (I.type === 'metallic') {
        // lattice of cations in a sea of electrons
        const cols = 6, rows = 3, gx = w / (cols + 1), gy = H / (rows + 1);
        c.fillStyle = U.alpha(t.blue, 0.1); c.fillRect(0, 0, w, H);
        for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
          const el = (i + j) % 2 ? A : B;
          U.drawAtom(c, gx * (i + 1), gy * (j + 1), 17, el, { label: el + '⁺' });
        }
        for (let k = 0; k < 40; k++) {
          const x = (k * 97.3 + time * 0.05 * (1 + (k % 5))) % w, y = (k * 53.7 + Math.sin(time / 600 + k) * 20 + H) % H;
          c.beginPath(); c.arc(x, y, 2.6, 0, 7); c.fillStyle = t.blue; c.fill();
        }
        U.text(c, 'cations in a “sea” of delocalized electrons', w / 2, H - 10, { align: 'center', size: 12, color: t.ink2 });
        return;
      }
      const shift = I.type === 'ionic' ? 1 : U.clamp(I.d / 1.8, 0, 1); // 0 equal, 1 complete
      const negIsB = I.neg === I.b && I.a.en !== I.b.en;
      const toward = negIsB ? 1 : -1;
      if (I.type === 'ionic') {
        // separate ions with transferred electron
        const pulse = (Math.sin(time / 500) + 1) / 2;
        const ex = U.lerp(negIsB ? x1 : x2, negIsB ? x2 : x1, Math.min(1, pulse * 1.4));
        const cat = negIsB ? I.a : I.b, an = negIsB ? I.b : I.a;
        const xc = negIsB ? x1 - 12 : x2 + 12, xa = negIsB ? x2 + 12 : x1 - 12;
        const ga = c.createRadialGradient(xa, cy, 4, xa, cy, r2 + 30);
        ga.addColorStop(0, U.alpha(t.blue, 0.55)); ga.addColorStop(1, U.alpha(t.blue, 0));
        c.fillStyle = ga; c.beginPath(); c.arc(xa, cy, r2 + 30, 0, 7); c.fill();
        U.drawAtom(c, xc, cy, (cat === I.a ? r1 : r2) * 0.8, cat.sym);
        U.drawAtom(c, xa, cy, (an === I.a ? r1 : r2) * 1.05, an.sym);
        U.text(c, 'cation (+)', xc, cy + r1 + 26, { align: 'center', color: t.red, weight: 600 });
        U.text(c, 'anion (−)', xa, cy + r2 + 32, { align: 'center', color: t.blue, weight: 600 });
        c.beginPath(); c.arc(ex, cy - 50, 4, 0, 7); c.fillStyle = t.orange; c.fill();
        U.text(c, 'e⁻ transferred', w / 2, cy - 62, { align: 'center', size: 11, color: t.orange, weight: 600 });
        return;
      }
      // covalent: one elongated cloud whose centre shifts toward the more EN atom
      const mid = (x1 + x2) / 2 + toward * shift * sep * 0.32;
      const steps = 26;
      for (let i = 0; i < steps; i++) {
        const u = i / (steps - 1);
        const x = U.lerp(x1 - r1, x2 + r2, u);
        const dist = Math.abs(x - mid) / (sep * 0.9);
        const a = Math.exp(-dist * dist * 2.2) * 0.12;
        const g = c.createRadialGradient(x, cy, 1, x, cy, 54);
        g.addColorStop(0, U.alpha(t.blue, a * 3)); g.addColorStop(1, U.alpha(t.blue, 0));
        c.fillStyle = g; c.beginPath(); c.arc(x, cy, 54, 0, 7); c.fill();
      }
      U.drawAtom(c, x1, cy, r1, I.a.sym);
      U.drawAtom(c, x2, cy, r2, I.b.sym);
      // shared electron pair
      const jig = Math.sin(time / 300) * 3;
      [-5, 5].forEach(dy => { c.beginPath(); c.arc(mid + jig, cy + dy, 3.3, 0, 7); c.fillStyle = t.orange; c.fill(); });
      if (I.type === 'polar') {
        U.text(c, 'δ+', negIsB ? x1 : x2, cy - Math.max(r1, r2) - 14, { align: 'center', color: t.red, weight: 700, size: 16 });
        U.text(c, 'δ−', negIsB ? x2 : x1, cy - Math.max(r1, r2) - 14, { align: 'center', color: t.blue, weight: 700, size: 16 });
        const ay = cy + Math.max(r1, r2) + 26;
        const xs = negIsB ? x1 : x2, xe = negIsB ? x2 : x1;
        U.arrow(c, xs, ay, xe, ay, t.ink, 2.5, 10);
        c.beginPath(); c.moveTo(xs + 10 * toward, ay - 7); c.lineTo(xs + 10 * toward, ay + 7); c.stroke();
        U.text(c, 'dipole', (x1 + x2) / 2, ay + 18, { align: 'center', size: 11, color: t.ink2 });
      } else U.text(c, 'electrons shared equally', w / 2, cy + Math.max(r1, r2) + 30, { align: 'center', size: 12, color: t.ink2 });
    });

    function drawBar(c, w, H) {
      const t = U.theme(), I = info(), L = 16, R = w - 16, y = 30, max = 3.3;
      const X = v => L + (R - L) * v / max;
      const zones = [[0, 0.4, t.green, 'nonpolar'], [0.4, 1.8, t.yellow, 'polar covalent'], [1.8, max, t.red, 'ionic']];
      zones.forEach(([a, b, col, lbl]) => {
        c.fillStyle = U.alpha(col, 0.28); c.fillRect(X(a), y, X(b) - X(a), 22);
        U.text(c, lbl, (X(a) + X(b)) / 2, y + 15, { align: 'center', size: 11, weight: 600, color: t.ink2 });
      });
      for (let v = 0; v <= 3; v += 0.5) U.text(c, v.toFixed(1), X(v), y + 40, { align: 'center', size: 10, mono: true, color: t.ink3 });
      U.text(c, 'ΔEN', L, 16, { size: 11, weight: 600, color: t.ink3 });
      const px = X(Math.min(max, I.d));
      c.fillStyle = t.ink; c.beginPath(); c.moveTo(px, y - 2); c.lineTo(px - 7, y - 12); c.lineTo(px + 7, y - 12); c.closePath(); c.fill();
      U.text(c, I.d.toFixed(2), px, y - 15, { align: 'center', size: 11, weight: 700, mono: true });
      U.text(c, 'Boundaries are approximate; bonding is a continuum.', L, H - 6, { size: 10.5, color: t.ink3 });
    }

    function update() {
      bar.redraw();
      const I = info();
      U.clear(out);
      const stats = U.stats([['a', `EN of ${I.a.sym}`], ['b', `EN of ${I.b.sym}`], ['d', 'ΔEN']]);
      stats.set('a', I.a.en); stats.set('b', I.b.en); stats.set('d', I.d.toFixed(2));
      const msg = {
        nonpolar: `${I.a.sym} and ${I.b.sym} attract the shared pair about equally, so there are no significant partial charges.`,
        polar: `${I.neg.name} is more electronegative, so the shared electrons are pulled toward it: ${I.neg.sym} gets a partial negative charge (δ−) and ${I.pos.sym} gets δ+.`,
        ionic: `${I.pos.name} (a metal with low electronegativity) gives up electron(s) to ${I.neg.name}. The resulting ions are held together by Coulombic attraction in a lattice.`,
        metallic: `Both are metals. Their valence electrons are delocalized across a lattice of cations, which makes metals conductive and malleable. A mixture of metals is an alloy.`,
      }[I.type];
      out.append(U.panel(NAMES[I.type], stats.el, h('p', null, msg)));
      if (I.type === 'polar' && I.d > 1.4) out.appendChild(U.callout('This bond is strongly polar. Bonds between two nonmetals stay covalent even when ΔEN is fairly large (H–F has ΔEN = 1.78).', 'warn'));
    }
    update();
  },
});
