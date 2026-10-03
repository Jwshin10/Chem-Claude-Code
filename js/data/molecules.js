/* Molecule library shared by the Lewis, VSEPR and bonding tools.
   Single-centre molecules: { c: central element, L: [[ligand, bondOrder], ...], lp: central lone pairs, q: charge }
   Terminal lone pairs follow the octet rule unless `tlp` overrides them.
   Multi-centre molecules: atoms [[el, x, y]], bonds [[i, j, order]], optional `res` (alternate bond sets). */
'use strict';
const MOLECULES = (() => {
  const single = [
    // steric number 2
    { id: 'h2', f: 'H2', name: 'Hydrogen', c: 'H', L: [['H', 1]], lp: 0 },
    { id: 'cl2', f: 'Cl2', name: 'Chlorine', c: 'Cl', L: [['Cl', 1]], lp: 3 },
    { id: 'hcl', f: 'HCl', name: 'Hydrogen chloride', c: 'Cl', L: [['H', 1]], lp: 3 },
    { id: 'hf', f: 'HF', name: 'Hydrogen fluoride', c: 'F', L: [['H', 1]], lp: 3 },
    { id: 'o2', f: 'O2', name: 'Oxygen', c: 'O', L: [['O', 2]], lp: 2 },
    { id: 'n2', f: 'N2', name: 'Nitrogen', c: 'N', L: [['N', 3]], lp: 1 },
    { id: 'co', f: 'CO', name: 'Carbon monoxide', c: 'C', L: [['O', 3]], lp: 1, tlp: [1], note: 'Formal charges of −1 on C and +1 on O are needed for both atoms to have an octet.' },
    { id: 'becl2', f: 'BeCl2', name: 'Beryllium chloride', c: 'Be', L: [['Cl', 1], ['Cl', 1]], lp: 0, note: 'Be is stable with only 4 valence electrons (an incomplete octet).' },
    { id: 'co2', f: 'CO2', name: 'Carbon dioxide', c: 'C', L: [['O', 2], ['O', 2]], lp: 0 },
    { id: 'hcn', f: 'HCN', name: 'Hydrogen cyanide', c: 'C', L: [['H', 1], ['N', 3]], lp: 0 },
    // steric number 3
    { id: 'bf3', f: 'BF3', name: 'Boron trifluoride', c: 'B', L: [['F', 1], ['F', 1], ['F', 1]], lp: 0, note: 'B has only 6 valence electrons (incomplete octet).' },
    { id: 'so3', f: 'SO3', name: 'Sulfur trioxide', c: 'S', L: [['O', 2], ['O', 2], ['O', 2]], lp: 0, note: 'Drawn with formal charges minimized (expanded octet on S). A structure with one S=O and two S–O bonds that obeys the octet rule is also accepted.' },
    { id: 'ch2o', f: 'CH2O', name: 'Formaldehyde', c: 'C', L: [['O', 2], ['H', 1], ['H', 1]], lp: 0 },
    { id: 'no3', f: 'NO3^-', name: 'Nitrate ion', c: 'N', L: [['O', 2], ['O', 1], ['O', 1]], lp: 0, q: -1 },
    { id: 'co3', f: 'CO3^2-', name: 'Carbonate ion', c: 'C', L: [['O', 2], ['O', 1], ['O', 1]], lp: 0, q: -2 },
    { id: 'so2', f: 'SO2', name: 'Sulfur dioxide', c: 'S', L: [['O', 2], ['O', 1]], lp: 1, ang: '≈119°', note: 'A structure with two S=O double bonds (formal charges all zero) is also accepted on the AP exam.' },
    { id: 'o3', f: 'O3', name: 'Ozone', c: 'O', L: [['O', 2], ['O', 1]], lp: 1, ang: '≈117°' },
    { id: 'no2m', f: 'NO2^-', name: 'Nitrite ion', c: 'N', L: [['O', 2], ['O', 1]], lp: 1, q: -1, ang: '≈115°' },
    // steric number 4
    { id: 'ch4', f: 'CH4', name: 'Methane', c: 'C', L: [['H', 1], ['H', 1], ['H', 1], ['H', 1]], lp: 0 },
    { id: 'ccl4', f: 'CCl4', name: 'Carbon tetrachloride', c: 'C', L: [['Cl', 1], ['Cl', 1], ['Cl', 1], ['Cl', 1]], lp: 0 },
    { id: 'chcl3', f: 'CHCl3', name: 'Chloroform', c: 'C', L: [['H', 1], ['Cl', 1], ['Cl', 1], ['Cl', 1]], lp: 0 },
    { id: 'ch2cl2', f: 'CH2Cl2', name: 'Dichloromethane', c: 'C', L: [['H', 1], ['Cl', 1], ['H', 1], ['Cl', 1]], lp: 0 },
    { id: 'nh4', f: 'NH4^+', name: 'Ammonium ion', c: 'N', L: [['H', 1], ['H', 1], ['H', 1], ['H', 1]], lp: 0, q: 1 },
    { id: 'so4', f: 'SO4^2-', name: 'Sulfate ion', c: 'S', L: [['O', 2], ['O', 1], ['O', 2], ['O', 1]], lp: 0, q: -2, note: 'Formal-charge-minimized structure shown. The all-single-bond structure (S = +2) that obeys the octet rule is also accepted.' },
    { id: 'po4', f: 'PO4^3-', name: 'Phosphate ion', c: 'P', L: [['O', 2], ['O', 1], ['O', 1], ['O', 1]], lp: 0, q: -3 },
    { id: 'clo4', f: 'ClO4^-', name: 'Perchlorate ion', c: 'Cl', L: [['O', 2], ['O', 2], ['O', 1], ['O', 2]], lp: 0, q: -1 },
    { id: 'nh3', f: 'NH3', name: 'Ammonia', c: 'N', L: [['H', 1], ['H', 1], ['H', 1]], lp: 1, ang: '≈107°' },
    { id: 'h3o', f: 'H3O^+', name: 'Hydronium ion', c: 'O', L: [['H', 1], ['H', 1], ['H', 1]], lp: 1, q: 1, ang: '≈107°' },
    { id: 'pcl3', f: 'PCl3', name: 'Phosphorus trichloride', c: 'P', L: [['Cl', 1], ['Cl', 1], ['Cl', 1]], lp: 1, ang: '≈100°' },
    { id: 'nf3', f: 'NF3', name: 'Nitrogen trifluoride', c: 'N', L: [['F', 1], ['F', 1], ['F', 1]], lp: 1, ang: '≈102°' },
    { id: 'clo3', f: 'ClO3^-', name: 'Chlorate ion', c: 'Cl', L: [['O', 2], ['O', 2], ['O', 1]], lp: 1, q: -1, ang: '≈107°' },
    { id: 'h2o', f: 'H2O', name: 'Water', c: 'O', L: [['H', 1], ['H', 1]], lp: 2, ang: '≈104.5°' },
    { id: 'h2s', f: 'H2S', name: 'Hydrogen sulfide', c: 'S', L: [['H', 1], ['H', 1]], lp: 2, ang: '≈92°' },
    { id: 'of2', f: 'OF2', name: 'Oxygen difluoride', c: 'O', L: [['F', 1], ['F', 1]], lp: 2, ang: '≈103°' },
    // steric number 5
    { id: 'pcl5', f: 'PCl5', name: 'Phosphorus pentachloride', c: 'P', L: [['Cl', 1], ['Cl', 1], ['Cl', 1], ['Cl', 1], ['Cl', 1]], lp: 0 },
    { id: 'sf4', f: 'SF4', name: 'Sulfur tetrafluoride', c: 'S', L: [['F', 1], ['F', 1], ['F', 1], ['F', 1]], lp: 1, ang: '≈102° (eq), ≈173° (ax)' },
    { id: 'clf3', f: 'ClF3', name: 'Chlorine trifluoride', c: 'Cl', L: [['F', 1], ['F', 1], ['F', 1]], lp: 2, ang: '≈87.5°' },
    { id: 'xef2', f: 'XeF2', name: 'Xenon difluoride', c: 'Xe', L: [['F', 1], ['F', 1]], lp: 3 },
    { id: 'i3', f: 'I3^-', name: 'Triiodide ion', c: 'I', L: [['I', 1], ['I', 1]], lp: 3, q: -1 },
    // steric number 6
    { id: 'sf6', f: 'SF6', name: 'Sulfur hexafluoride', c: 'S', L: Array(6).fill(['F', 1]), lp: 0 },
    { id: 'brf5', f: 'BrF5', name: 'Bromine pentafluoride', c: 'Br', L: Array(5).fill(['F', 1]), lp: 1, ang: '≈85°' },
    { id: 'xef4', f: 'XeF4', name: 'Xenon tetrafluoride', c: 'Xe', L: Array(4).fill(['F', 1]), lp: 2 },
  ];

  const multi = [
    { id: 'c2h6', f: 'C2H6', name: 'Ethane', atoms: [['C', 0, 0], ['C', 1, 0], ['H', 0, 1], ['H', 0, -1], ['H', -1, 0], ['H', 1, 1], ['H', 1, -1], ['H', 2, 0]], bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1], [1, 5, 1], [1, 6, 1], [1, 7, 1]] },
    { id: 'c2h4', f: 'C2H4', name: 'Ethene (ethylene)', atoms: [['C', 0, 0], ['C', 1.1, 0], ['H', -0.55, 0.85], ['H', -0.55, -0.85], ['H', 1.65, 0.85], ['H', 1.65, -0.85]], bonds: [[0, 1, 2], [0, 2, 1], [0, 3, 1], [1, 4, 1], [1, 5, 1]] },
    { id: 'c2h2', f: 'C2H2', name: 'Ethyne (acetylene)', atoms: [['H', -1, 0], ['C', 0, 0], ['C', 1.15, 0], ['H', 2.15, 0]], bonds: [[0, 1, 1], [1, 2, 3], [2, 3, 1]] },
    { id: 'ch3oh', f: 'CH3OH', name: 'Methanol', atoms: [['C', 0, 0], ['O', 1, 0], ['H', 0, 1], ['H', 0, -1], ['H', -1, 0], ['H', 2, 0]], bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1], [1, 5, 1]] },
    { id: 'c2h5oh', f: 'C2H5OH', name: 'Ethanol', atoms: [['C', 0, 0], ['C', 1, 0], ['O', 2, 0], ['H', 3, 0], ['H', 0, 1], ['H', 0, -1], ['H', -1, 0], ['H', 1, 1], ['H', 1, -1]], bonds: [[0, 1, 1], [1, 2, 1], [2, 3, 1], [0, 4, 1], [0, 5, 1], [0, 6, 1], [1, 7, 1], [1, 8, 1]] },
    { id: 'dme', f: 'CH3OCH3', name: 'Dimethyl ether', atoms: [['C', 0, 0], ['O', 1, 0], ['C', 2, 0], ['H', 0, 1], ['H', 0, -1], ['H', -1, 0], ['H', 2, 1], ['H', 2, -1], ['H', 3, 0]], bonds: [[0, 1, 1], [1, 2, 1], [0, 3, 1], [0, 4, 1], [0, 5, 1], [2, 6, 1], [2, 7, 1], [2, 8, 1]] },
    { id: 'acetone', f: 'CH3COCH3', name: 'Acetone (propanone)', atoms: [['C', 0, 0], ['C', 1, 0], ['C', 2, 0], ['O', 1, -1.05], ['H', -1, 0], ['H', 0, 1], ['H', -0.6, -0.8], ['H', 3, 0], ['H', 2, 1], ['H', 2.6, -0.8]], bonds: [[0, 1, 1], [1, 2, 1], [1, 3, 2], [0, 4, 1], [0, 5, 1], [0, 6, 1], [2, 7, 1], [2, 8, 1], [2, 9, 1]] },
    { id: 'ch3cooh', f: 'CH3COOH', name: 'Acetic acid', atoms: [['C', 0, 0], ['C', 1, 0], ['O', 1, -1.05], ['O', 2, 0], ['H', 3, 0], ['H', -1, 0], ['H', 0, 1], ['H', -0.6, -0.8]], bonds: [[0, 1, 1], [1, 2, 2], [1, 3, 1], [3, 4, 1], [0, 5, 1], [0, 6, 1], [0, 7, 1]] },
    { id: 'acetate', f: 'CH3COO^-', name: 'Acetate ion', q: -1, atoms: [['C', 0, 0], ['C', 1, 0], ['O', 1, -1.05], ['O', 2, 0], ['H', -1, 0], ['H', 0, 1], ['H', -0.6, -0.8]], bonds: [[0, 1, 1], [1, 2, 2], [1, 3, 1], [0, 4, 1], [0, 5, 1], [0, 6, 1]], res: [[[0, 1, 1], [1, 2, 1], [1, 3, 2], [0, 4, 1], [0, 5, 1], [0, 6, 1]]] },
    { id: 'h2o2', f: 'H2O2', name: 'Hydrogen peroxide', atoms: [['H', -1, 0], ['O', 0, 0], ['O', 1, 0], ['H', 2, 0]], bonds: [[0, 1, 1], [1, 2, 1], [2, 3, 1]] },
    { id: 'n2h4', f: 'N2H4', name: 'Hydrazine', atoms: [['N', 0, 0], ['N', 1, 0], ['H', 0, 1], ['H', -1, 0], ['H', 1, -1], ['H', 2, 0]], bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [1, 4, 1], [1, 5, 1]] },
    { id: 'ch3nh2', f: 'CH3NH2', name: 'Methylamine', atoms: [['C', 0, 0], ['N', 1, 0], ['H', 0, 1], ['H', 0, -1], ['H', -1, 0], ['H', 2, 0], ['H', 1, -1]], bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1], [1, 5, 1], [1, 6, 1]] },
    { id: 'hcooh', f: 'HCOOH', name: 'Formic acid', atoms: [['H', -1, 0], ['C', 0, 0], ['O', 0, 1.05], ['O', 1, 0], ['H', 2, 0]], bonds: [[0, 1, 1], [1, 2, 2], [1, 3, 1], [3, 4, 1]] },
    {
      id: 'c6h6', f: 'C6H6', name: 'Benzene',
      atoms: [0, 1, 2, 3, 4, 5].map(k => ['C', Math.cos(Math.PI / 2 + k * Math.PI / 3), Math.sin(Math.PI / 2 + k * Math.PI / 3)])
        .concat([0, 1, 2, 3, 4, 5].map(k => ['H', 1.95 * Math.cos(Math.PI / 2 + k * Math.PI / 3), 1.95 * Math.sin(Math.PI / 2 + k * Math.PI / 3)])),
      bonds: [[0, 1, 2], [1, 2, 1], [2, 3, 2], [3, 4, 1], [4, 5, 2], [5, 0, 1], [0, 6, 1], [1, 7, 1], [2, 8, 1], [3, 9, 1], [4, 10, 1], [5, 11, 1]],
      res: [[[0, 1, 1], [1, 2, 2], [2, 3, 1], [3, 4, 2], [4, 5, 1], [5, 0, 2], [0, 6, 1], [1, 7, 1], [2, 8, 1], [3, 9, 1], [4, 10, 1], [5, 11, 1]]],
      note: 'The real molecule is a resonance hybrid: all six C–C bonds are identical (bond order 1.5).',
    },
  ];

  const val = el => ELEMENTS.bySym[el].valence;

  /* 2-D placement of bonds/lone pairs around a central atom keyed by "bonds,lonePairs" (degrees, y up) */
  const LAYOUT = {
    '1,0': [[0], []], '1,1': [[0], [180]], '1,2': [[0], [120, 240]], '1,3': [[0], [90, 180, 270]],
    '2,0': [[180, 0], []], '2,1': [[210, 330], [90]], '2,2': [[180, 0], [90, 270]], '2,3': [[180, 0], [60, 120, 270]],
    '3,0': [[90, 210, 330], []], '3,1': [[180, 0, 270], [90]], '3,2': [[180, 0, 270], [60, 120]],
    '4,0': [[0, 90, 180, 270], []], '4,1': [[180, 0, 240, 300], [90]], '4,2': [[45, 135, 225, 315], [90, 270]],
    '5,0': [[90, 162, 234, 306, 18], []], '5,1': [[180, 0, 225, 270, 315], [90]],
    '6,0': [[0, 60, 120, 180, 240, 300], []],
  };

  /** build a drawable structure: {atoms:[{el,x,y,lp,fc,lpDirs}], bonds:[{a,b,order}], q} */
  function build(m, resIndex = 0) {
    let atoms, bonds;
    if (m.c) {
      const B = m.L.length;
      const lay = LAYOUT[B + ',' + m.lp];
      atoms = [{ el: m.c, x: 0, y: 0, lp: m.lp, fixedLp: lay[1] }];
      bonds = [];
      let orders = m.L.map(l => l[1]);
      if (resIndex > 0) orders = resonanceOrders(m)[resIndex] || orders;
      m.L.forEach((l, i) => {
        const a = lay[0][i] * Math.PI / 180;
        const tl = m.tlp ? m.tlp[i] : (l[0] === 'H' ? 0 : 4 - orders[i]);
        atoms.push({ el: l[0], x: Math.cos(a), y: Math.sin(a), lp: tl });
        bonds.push({ a: 0, b: i + 1, order: orders[i] });
      });
    } else {
      const bset = resIndex > 0 && m.res ? m.res[resIndex - 1] : m.bonds;
      atoms = m.atoms.map(([el, x, y]) => ({ el, x, y }));
      bonds = bset.map(([a, b, order]) => ({ a, b, order }));
      atoms.forEach((at, i) => {
        const s = bonds.filter(b => b.a === i || b.b === i).reduce((t, b) => t + b.order, 0);
        at.lp = at.el === 'H' ? 0 : Math.max(0, 4 - s);
      });
    }
    // formal charges & lone pair directions
    atoms.forEach((at, i) => {
      const my = bonds.filter(b => b.a === i || b.b === i);
      const bo = my.reduce((t, b) => t + b.order, 0);
      at.fc = val(at.el) - 2 * at.lp - bo;
      at.bondCount = my.length;
      at.bondOrderSum = bo;
      if (at.fixedLp) { at.lpDirs = at.fixedLp.map(d => d * Math.PI / 180); return; }
      const dirs = my.map(b => { const o = atoms[b.a === i ? b.b : b.a]; return Math.atan2(o.y - at.y, o.x - at.x); });
      at.lpDirs = lonePairDirs(dirs, at.lp);
    });
    return { atoms, bonds, q: m.q || 0 };
  }

  function lonePairDirs(dirs, n) {
    if (!n) return [];
    if (!dirs.length) return Array.from({ length: n }, (_, k) => k * 2 * Math.PI / n + Math.PI / 2);
    if (dirs.length === 1) {
      const t = dirs[0] + Math.PI;
      if (n === 1) return [t];
      if (n === 2) return [t - Math.PI / 3, t + Math.PI / 3];
      return [t - Math.PI / 2, t, t + Math.PI / 2].slice(0, n);
    }
    const out = [];
    const all = dirs.map(d => (d + 2 * Math.PI) % (2 * Math.PI));
    for (let k = 0; k < n; k++) {
      const s = all.concat(out).map(d => (d + 2 * Math.PI) % (2 * Math.PI)).sort((a, b) => a - b);
      let best = 0, bi = 0;
      for (let i = 0; i < s.length; i++) {
        const g = (i === s.length - 1 ? s[0] + 2 * Math.PI : s[i + 1]) - s[i];
        if (g > best + 1e-6) { best = g; bi = i; }
      }
      out.push(s[bi] + best / 2);
    }
    return out;
  }

  /** all distinct resonance arrangements for single-centre molecules (bond orders permuted among identical ligands) */
  function resonanceOrders(m) {
    if (!m.c) return [m.bonds].concat(m.res || []);
    const base = m.L.map(l => l[1]);
    const els = m.L.map(l => l[0]);
    const seen = new Set(), out = [];
    const perm = (arr, k) => {
      if (k === arr.length) {
        const key = arr.join(',');
        if (!seen.has(key)) { seen.add(key); out.push(arr.slice()); }
        return;
      }
      for (let i = k; i < arr.length; i++) {
        if (els[i] !== els[k]) continue;
        [arr[k], arr[i]] = [arr[i], arr[k]];
        perm(arr, k + 1);
        [arr[k], arr[i]] = [arr[i], arr[k]];
      }
    };
    perm(base.slice(), 0);
    // put the original first
    out.sort((a, b) => (a.join() === base.join() ? -1 : b.join() === base.join() ? 1 : 0));
    return out;
  }
  function resonanceCount(m) {
    if (!m.c) return 1 + (m.res ? m.res.length : 0);
    if (m.tlp) return 1;
    return Math.min(6, resonanceOrders(m).length);
  }

  function totalValence(m) {
    const els = m.c ? [m.c].concat(m.L.map(l => l[0])) : m.atoms.map(a => a[0]);
    return els.reduce((t, e) => t + val(e), 0) - (m.q || 0);
  }

  /* ---- VSEPR ---- */
  const GEOM = {
    '2,0': ['Linear', 'Linear', '180°', 'sp'],
    '3,0': ['Trigonal planar', 'Trigonal planar', '120°', 'sp²'],
    '3,1': ['Trigonal planar', 'Bent', '<120°', 'sp²'],
    '4,0': ['Tetrahedral', 'Tetrahedral', '109.5°', 'sp³'],
    '4,1': ['Tetrahedral', 'Trigonal pyramidal', '<109.5°', 'sp³'],
    '4,2': ['Tetrahedral', 'Bent', '<109.5°', 'sp³'],
    '5,0': ['Trigonal bipyramidal', 'Trigonal bipyramidal', '90°, 120°, 180°', 'sp³d'],
    '5,1': ['Trigonal bipyramidal', 'Seesaw', '<90°, <120°', 'sp³d'],
    '5,2': ['Trigonal bipyramidal', 'T-shaped', '<90°', 'sp³d'],
    '5,3': ['Trigonal bipyramidal', 'Linear', '180°', 'sp³d'],
    '6,0': ['Octahedral', 'Octahedral', '90°, 180°', 'sp³d²'],
    '6,1': ['Octahedral', 'Square pyramidal', '<90°', 'sp³d²'],
    '6,2': ['Octahedral', 'Square planar', '90°', 'sp³d²'],
    // diatomics / terminal-type centres
    '1,0': ['Linear', 'Linear', '—', '— (diatomic)'], '2,1': ['Linear', 'Linear', '—', '— (diatomic)'], '3,2': ['Linear', 'Linear', '—', '— (diatomic)'], '4,3': ['Linear', 'Linear', '—', '— (diatomic)'],
  };
  function vsepr(B, lp) {
    const steric = B + lp;
    const g = GEOM[steric + ',' + lp] || ['—', '—', '—', '—'];
    return { steric, edg: g[0], shape: g[1], angle: g[2], hyb: g[3] };
  }
  const SYMMETRIC = new Set(['2,0', '3,0', '4,0', '5,0', '6,0', '5,3', '6,2']);
  function polarity(m) {
    if (m.q) return 'ion';
    const B = m.L.length;
    if (B === 1) return m.L[0][0] === m.c ? 'nonpolar' : 'polar';
    const same = m.L.every(l => l[0] === m.L[0][0]);
    if (!same) return 'polar';
    const key = (B + m.lp) + ',' + m.lp;
    if (!SYMMETRIC.has(key)) return 'polar';
    // equivalent ligands with unequal drawn bond orders are equal in the resonance hybrid
    return 'nonpolar';
  }
  function bondCounts(m) {
    const bonds = m.c ? m.L.map(l => l[1]) : m.bonds.map(b => b[2]);
    return { sigma: bonds.length, pi: bonds.reduce((t, o) => t + o - 1, 0) };
  }

  /* 3-D domain directions; returns {ligands:[{el,order,v}], lps:[v]} */
  const r3 = Math.sqrt, A = r3(2 / 3), Bv = r3(1 / 3);
  function domains3d(m) {
    const B = m.L.length, lp = m.lp, n = B + lp;
    let slots, lpSlots;
    if (B === 1) {
      const sets = {
        1: [[1, 0, 0]], 2: [[1, 0, 0], [-1, 0, 0]],
        3: [[1, 0, 0], [-0.5, 0.866, 0], [-0.5, -0.866, 0]],
        4: [[1, 0, 0], [-1 / 3, 0.9428, 0], [-1 / 3, -0.4714, 0.8165], [-1 / 3, -0.4714, -0.8165]],
      };
      slots = sets[n]; lpSlots = slots.slice(1).map((_, i) => i + 1);
    } else if (n === 2) { slots = [[1, 0, 0], [-1, 0, 0]]; lpSlots = []; }
    else if (n === 3) { slots = [[0, 1, 0], [-0.866, -0.5, 0], [0.866, -0.5, 0]]; lpSlots = [0]; }
    else if (n === 4) {
      if (lp >= 2) { slots = [[0, Bv, A], [0, Bv, -A], [-A, -Bv, 0], [A, -Bv, 0]]; lpSlots = [0, 1]; }
      else { slots = [[0, 1, 0], [0.9428, -1 / 3, 0], [-0.4714, -1 / 3, 0.8165], [-0.4714, -1 / 3, -0.8165]]; lpSlots = [0]; }
    } else if (n === 5) { slots = [[0, 1, 0], [0, -1, 0], [1, 0, 0], [-0.5, 0, 0.866], [-0.5, 0, -0.866]]; lpSlots = [2, 3, 4]; }
    else { slots = [[0, 1, 0], [0, -1, 0], [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]]; lpSlots = [0, 1]; }
    const lpUse = lpSlots.slice(0, lp);
    const bondSlots = slots.map((_, i) => i).filter(i => !lpUse.includes(i));
    return {
      ligands: m.L.map((l, i) => ({ el: l[0], order: l[1], v: slots[bondSlots[i]] })),
      lps: lpUse.map(i => slots[i]),
    };
  }

  /* development check: electron bookkeeping must match valence count */
  function validate() {
    for (const m of single.concat(multi)) {
      const s = build(m);
      const used = s.bonds.reduce((t, b) => t + 2 * b.order, 0) + s.atoms.reduce((t, a) => t + 2 * a.lp, 0);
      if (used !== totalValence(m)) console.warn('Electron count mismatch for', m.f, used, totalValence(m));
      if (m.res) m.res.forEach((_, k) => {
        const r = build(m, k + 1);
        const u = r.bonds.reduce((t, b) => t + 2 * b.order, 0) + r.atoms.reduce((t, a) => t + 2 * a.lp, 0);
        if (u !== totalValence(m)) console.warn('Resonance electron mismatch for', m.f, k + 1);
      });
    }
  }

  const all = single.concat(multi);
  const byId = Object.fromEntries(all.map(m => [m.id, m]));
  return { single, multi, all, byId, build, resonanceCount, totalValence, vsepr, polarity, bondCounts, domains3d, validate, val };
})();
