'use strict';
/* CHEM: shared reaction utilities — species parsing, exact (fraction) balancing, oxidation states, particle glyphs */
const CHEM = (() => {
  const gcd = U.gcd, lcm = (a, b) => a / gcd(a, b) * b;
  const fr = (n, d = 1) => { if (d < 0) { n = -n; d = -d; } const g = gcd(n, d) || 1; return [n / g, d / g]; };
  const add = (a, b) => fr(a[0] * b[1] + b[0] * a[1], a[1] * b[1]);
  const sub = (a, b) => fr(a[0] * b[1] - b[0] * a[1], a[1] * b[1]);
  const mul = (a, b) => fr(a[0] * b[0], a[1] * b[1]);
  const div = (a, b) => fr(a[0] * b[1], a[1] * b[0]);
  const zero = a => a[0] === 0;

  function parseSpecies(raw) {
    let s = raw.trim().replace(/\((aq|s|l|g)\)$/i, '').trim();
    let coef = 1;
    const m = s.match(/^(\d+)\s*(?=[A-Z(\[]|e\^?-|e$)/);
    if (m) { coef = +m[1]; s = s.slice(m[0].length).trim(); }
    let charge = 0;
    const cm = s.match(/\^(\d*)([+\-])$/) || s.match(/(?<=[A-Za-z)\]])([+\-])$/);
    if (cm) {
      if (cm.length === 3) charge = (cm[1] ? +cm[1] : 1) * (cm[2] === '+' ? 1 : -1);
      else charge = cm[1] === '+' ? 1 : -1;
      s = s.slice(0, s.length - cm[0].length);
    }
    if (s === 'e' || s === 'e-') return { raw, formula: 'e', counts: {}, charge: -1, coef, electron: true };
    const counts = U.parseFormula(s);
    return { raw, formula: s, counts, charge, coef };
  }
  function splitSide(str) {
    const enc = str.replace(/\^(\d*)([+\-])/g, (m, d, sg) => '^' + d + (sg === '+' ? 'P' : 'M'));
    return enc.split('+').map(x => x.trim()).filter(Boolean).map(x => x.replace(/\^(\d*)P/, '^$1+').replace(/\^(\d*)M/, '^$1-'));
  }
  function parseEquation(str) {
    const parts = str.split(/<=>|⇌|->|→|=>|=/);
    if (parts.length !== 2) throw new Error('Use an arrow (->) between reactants and products');
    const R = splitSide(parts[0]).map(parseSpecies), P = splitSide(parts[1]).map(parseSpecies);
    if (!R.length || !P.length) throw new Error('Both sides need at least one species');
    return { R, P };
  }
  function nullspace(M) {
    const rows = M.length, cols = M[0].length;
    M = M.map(r => r.map(x => fr(x)));
    const piv = [];
    let r = 0;
    for (let c = 0; c < cols && r < rows; c++) {
      let p = r; while (p < rows && zero(M[p][c])) p++;
      if (p === rows) continue;
      [M[r], M[p]] = [M[p], M[r]];
      const inv = div([1, 1], M[r][c]);
      M[r] = M[r].map(x => mul(x, inv));
      for (let i = 0; i < rows; i++) if (i !== r && !zero(M[i][c])) { const f = M[i][c]; M[i] = M[i].map((x, j) => sub(x, mul(f, M[r][j]))); }
      piv.push(c); r++;
    }
    const free = []; for (let c = 0; c < cols; c++) if (!piv.includes(c)) free.push(c);
    return free.map(f => {
      const v = Array(cols).fill(null).map(() => [0, 1]);
      v[f] = [1, 1];
      piv.forEach((pc, i) => { v[pc] = fr(-M[i][f][0], M[i][f][1]); });
      const L = v.reduce((a, x) => lcm(a, x[1]), 1);
      let ints = v.map(x => x[0] * (L / x[1]));
      const g = ints.reduce((a, x) => gcd(a, x), 0) || 1;
      return ints.map(x => x / g);
    });
  }
  function matrix(species, signs) {
    const els = [...new Set(species.flatMap(s => Object.keys(s.counts)))];
    const rows = els.map(e => species.map((s, j) => (s.counts[e] || 0) * signs[j]));
    if (species.some(s => s.charge)) rows.push(species.map((s, j) => s.charge * signs[j]));
    return { rows, els };
  }
  /** balance R -> P; returns positive integer coefficients [..R, ..P] or throws */
  function balance(R, P) {
    const sp = R.concat(P), signs = R.map(() => 1).concat(P.map(() => -1));
    const { rows } = matrix(sp, signs);
    const ns = nullspace(rows);
    if (!ns.length) throw new Error('This equation cannot be balanced. Check the formulas.');
    if (ns.length > 1) {
      // try a positive combination of the basis vectors
      const comb = ns.reduce((a, v) => a.map((x, i) => x + v[i]), Array(sp.length).fill(0));
      if (comb.every(x => x > 0)) { const g = comb.reduce((a, x) => gcd(a, x), 0); return comb.map(x => x / g); }
      throw new Error('This equation can be balanced in more than one way. Split it into separate reactions.');
    }
    let v = ns[0];
    if (v.every(x => x <= 0)) v = v.map(x => -x);
    if (!v.every(x => x > 0)) throw new Error('Cannot balance as written: a species seems to be on the wrong side, or is missing.');
    return v;
  }
  /** signed balance (used for half-reactions): coefficient of species[0] made positive */
  function balanceSigned(species) {
    const { rows } = matrix(species, species.map(() => 1));
    const ns = nullspace(rows);
    if (ns.length !== 1) return null;
    let v = ns[0];
    if (v[0] < 0) v = v.map(x => -x);
    return v;
  }

  const ALK = ['Li', 'Na', 'K', 'Rb', 'Cs'], ALKE = ['Be', 'Mg', 'Ca', 'Sr', 'Ba'];
  const isMetal = e => ['alkali', 'alkaline', 'transition', 'post', 'lanthanide', 'actinide'].includes(ELEMENTS.bySym[e].cat);
  /** oxidation states: returns {ox:{el:value}, rule:{el:text}, average:bool} */
  function oxStates(counts, q = 0) {
    const els = Object.keys(counts);
    const ox = {}, rule = {};
    if (els.length === 1) { ox[els[0]] = q / counts[els[0]]; rule[els[0]] = q ? 'monatomic ion / element: equals charge ÷ atoms' : 'free element: 0'; return { ox, rule, average: !Number.isInteger(ox[els[0]]) }; }
    const metalsOnly = els.filter(e => e !== 'H').every(isMetal);
    const fixed = e => {
      if (e === 'F') return [-1, 'F is always −1 in compounds'];
      if (ALK.includes(e)) return [1, 'group 1 metals are +1'];
      if (ALKE.includes(e)) return [2, 'group 2 metals are +2'];
      if (e === 'Al') return [3, 'Al is +3'];
      if (e === 'Zn') return [2, 'Zn is +2'];
      if (e === 'Ag') return [1, 'Ag is +1'];
      if (e === 'H') return metalsOnly ? [-1, 'H is −1 with metals (hydride)'] : [1, 'H is +1 with nonmetals'];
      if (e === 'O') return counts.F ? null : [-2, 'O is usually −2'];
      if (['Cl', 'Br', 'I'].includes(e)) { if (counts.O || counts.F || (e !== 'Cl' && counts.Cl) || (e === 'I' && counts.Br)) return null; return [-1, 'halogens are −1 unless bonded to O or a more electronegative halogen']; }
      return null;
    };
    let unknown = [];
    els.forEach(e => { const f = fixed(e); if (f) { ox[e] = f[0]; rule[e] = f[1]; } else unknown.push(e); });
    const sumFixed = () => els.filter(e => !unknown.includes(e)).reduce((t, e) => t + ox[e] * counts[e], 0);
    if (!unknown.length && Math.abs(sumFixed() - q) > 1e-9 && counts.O) { unknown = ['O']; delete ox.O; }
    // too many unknowns: give the most electronegative its common negative state
    while (unknown.length > 1) {
      unknown.sort((a, b) => (ELEMENTS.bySym[b].en || 0) - (ELEMENTS.bySym[a].en || 0));
      const e = unknown[0], v = ELEMENTS.bySym[e].valence;
      if (isMetal(e) || !v) break;
      ox[e] = v - 8; rule[e] = `most electronegative unknown: assumed ${v - 8}`;
      unknown.shift();
    }
    if (unknown.length) {
      const tot = unknown.reduce((t, e) => t + counts[e], 0);
      const x = (q - sumFixed()) / tot;
      unknown.forEach(e => { ox[e] = x; rule[e] = unknown.length > 1 ? 'shared average of the remaining charge' : `solved: sum of oxidation numbers = ${q}`; });
    }
    const average = els.some(e => !Number.isInteger(+ox[e].toFixed(6)));
    return { ox, rule, average };
  }
  const fmtOx = v => { if (Number.isInteger(+v.toFixed(6))) return (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(Math.round(v)); const f = fracStr(v); return (v > 0 ? '+' : '−') + f; };
  const fracStr = v => { for (let d = 2; d <= 12; d++) { const n = Math.abs(v) * d; if (Math.abs(n - Math.round(n)) < 1e-6) return Math.round(n) + '/' + d; } return Math.abs(v).toFixed(2); };

  const spHTML = s => s.electron ? 'e<sup>−</sup>' : U.chem(s.formula) + (s.charge ? '<sup>' + (Math.abs(s.charge) > 1 ? Math.abs(s.charge) : '') + (s.charge > 0 ? '+' : '−') + '</sup>' : '');
  const sideHTML = (S, c) => S.map((s, i) => (c[i] > 1 ? `<b>${c[i]}</b>` : '') + spHTML(s)).join(' + ');
  const eqHTML = (R, P, coefs, arrow = '→') => sideHTML(R, coefs.slice(0, R.length)) + ` ${arrow} ` + sideHTML(P, coefs.slice(R.length));

  /** draw a simple particle glyph for a species (atoms clustered) */
  function glyph(c, x, y, s, R) {
    const atoms = [];
    Object.keys(s.counts).forEach(e => { for (let i = 0; i < s.counts[e]; i++) atoms.push(e); });
    if (atoms.length === 1) { U.drawAtom(c, x, y, R, atoms[0], { label: R > 8 ? atoms[0] : false }); return; }
    const center = Object.keys(s.counts).find(e => s.counts[e] === 1 && e !== 'H') || atoms[0];
    const rest = atoms.slice(); rest.splice(rest.indexOf(center), 1);
    if (atoms.length === 2) { const r1 = atoms[0] === 'H' ? R * 0.7 : R, r2 = atoms[1] === 'H' ? R * 0.7 : R; U.drawAtom(c, x - r1 * 0.7, y, r1, atoms[0], { label: false }); U.drawAtom(c, x + r2 * 0.7, y, r2, atoms[1], { label: false }); return; }
    const n = rest.length, ring = R * (n > 6 ? 1.6 : 1.15);
    const start = n === 2 && s.formula !== 'CO2' && s.formula !== 'BeCl2' ? Math.PI / 2 + 0.9 : -Math.PI / 2;
    rest.forEach((e, i) => { const a = start + i * 2 * Math.PI / n * (n === 2 && s.formula !== 'CO2' ? 0.29 : 1); const r = e === 'H' ? R * 0.65 : R * 0.9; U.drawAtom(c, x + Math.cos(a) * ring, y + Math.sin(a) * ring, r, e, { label: false }); });
    U.drawAtom(c, x, y, R, center, { label: false });
  }
  return { parseSpecies, parseEquation, balance, balanceSigned, oxStates, fmtOx, spHTML, eqHTML, glyph, isMetal, nullspace };
})();

App.register({
  id: 'balancer', unit: 4, sym: 'Bl', title: 'Balancing & Reaction Types',
  desc: 'Balance any chemical equation, see the atoms conserved at the particle level, and classify the reaction.',
  tags: ['balancing equations', 'balance', 'conservation of mass', 'coefficients', 'reaction types', 'synthesis', 'decomposition', 'combustion', 'single replacement', 'double replacement', 'physical change', 'chemical change', 'particulate'],
  keyIdeas: [
    'Atoms are conserved: a balanced equation has the same number of each kind of atom (and the same total charge) on both sides.',
    'Only coefficients change when balancing, never subscripts.',
    'Coefficients give mole ratios (and molecule ratios) for stoichiometry.',
    'Chemical changes form new substances (bonds broken and formed); physical changes alter only form or state. Dissolving an ionic solid is often classed as both, since ionic bonds break.',
    'AP reaction types: acid–base (proton transfer), redox (electron transfer) and precipitation. Combustion, synthesis, decomposition and replacement are common patterns.',
  ],
  render(el, scope) {
    const h = U.h;
    U.tabs(el, [{ label: 'Equation balancer', render: balancer }, { label: 'Physical vs. chemical', render: sorter }], scope, { key: 'balancer' });

    function balancer(b, s) {
      let text = U.store.get('balEq', 'C3H8 + O2 -> CO2 + H2O');
      const inp = U.textInput({ label: 'Unbalanced equation', value: text, placeholder: 'e.g. Fe + O2 -> Fe2O3', onInput: v => { text = v; U.store.set('balEq', v); run(); } });
      const ex = ['C3H8 + O2 -> CO2 + H2O', 'Fe + O2 -> Fe2O3', 'Al + HCl -> AlCl3 + H2', 'KClO3 -> KCl + O2', 'Ca(OH)2 + H3PO4 -> Ca3(PO4)2 + H2O', 'Cu + AgNO3 -> Cu(NO3)2 + Ag', 'C6H12O6 + O2 -> CO2 + H2O', 'MnO4^- + Fe^2+ + H^+ -> Mn^2+ + Fe^3+ + H2O'];
      const picks = h('div', { class: 'row' }, ex.map(e => U.btn(U.chem(e.replace(/\^(\d*)([+-])/g, '^$1$2')), () => { inp.set(e); text = e; U.store.set('balEq', e); run(); }, 'sm')));
      const out = h('div', { class: 'stack' });
      let state = null;
      const cv = U.canvas(null, { aspect: 2.3, scope: s, draw });
      b.append(U.panel('Enter an equation', inp.el, h('p', { class: 'small muted' }, 'Use -> for the arrow and ^ for charges (e.g. Fe^3+, SO4^2-).'), picks), out);
      function draw(c, w, H) {
        const t = U.theme();
        if (!state) return;
        const { R, P, coefs } = state;
        const all = R.concat(P), total = coefs.reduce((a, x) => a + x, 0);
        if (total > 40) { U.text(c, 'Too many particles to draw for these coefficients.', w / 2, H / 2, { align: 'center', color: t.ink3 }); return; }
        const arrowX = w / 2;
        c.strokeStyle = t.ink2; U.arrow(c, arrowX - 18, H / 2, arrowX + 18, H / 2, t.ink2, 2.5);
        const drawSide = (S, cs, x0, x1) => {
          const groups = S.length, gw = (x1 - x0) / groups;
          S.forEach((sp, i) => {
            const n = cs[i], cols = Math.ceil(Math.sqrt(n * 1.6)), rows = Math.ceil(n / cols);
            const R = Math.min(13, gw / (cols * 3.3), (H - 40) / (rows * 3.3));
            for (let k = 0; k < n; k++) {
              const cx = x0 + gw * i + gw / 2 + ((k % cols) - (cols - 1) / 2) * R * 3.2;
              const cy = H / 2 - 8 + (Math.floor(k / cols) - (rows - 1) / 2) * R * 3.2;
              CHEM.glyph(c, cx, cy, sp, R);
            }
            U.text(c, (n > 1 ? n + ' ' : '') + U.chemText(sp.formula) + (sp.charge ? U.supText((Math.abs(sp.charge) > 1 ? Math.abs(sp.charge) : '') + (sp.charge > 0 ? '+' : '-')) : ''), x0 + gw * i + gw / 2, H - 8, { align: 'center', size: 12, weight: 600, color: t.ink2 });
          });
        };
        drawSide(R, coefs.slice(0, R.length), 8, arrowX - 26);
        drawSide(P, coefs.slice(R.length), arrowX + 26, w - 8);
      }
      function classify(R, P) {
        const types = [];
        const isEl = sp => Object.keys(sp.counts).length === 1 && !sp.charge;
        if (R.some(x => x.formula === 'O2') && P.some(x => x.formula === 'CO2') && P.some(x => x.formula === 'H2O')) types.push(['Combustion', 'A fuel reacts with O₂ to form CO₂ and H₂O.']);
        else if (R.length >= 2 && P.length === 1) types.push(['Synthesis', 'Two or more reactants combine into one product.']);
        else if (R.length === 1 && P.length >= 2) types.push(['Decomposition', 'One reactant breaks into simpler substances.']);
        else if (R.length === 2 && P.length === 2 && R.some(isEl) && P.some(isEl)) types.push(['Single replacement', 'An element replaces another element in a compound.']);
        else if (R.length === 2 && P.length === 2 && !R.some(isEl)) types.push(['Double replacement', 'Two compounds exchange partners.']);
        const acid = R.some(x => (x.formula[0] === 'H' && !['H2O', 'H2', 'H2O2'].includes(x.formula) && !x.charge && !CHEM.isMetal(Object.keys(x.counts).find(e => e !== 'H') || 'H')) || (x.formula === 'H' && x.charge === 1) || x.formula === 'H3O');
        const base = R.some(x => (x.formula.endsWith('OH') || x.formula.includes('(OH)') || x.formula === 'NH3') && (x.formula === 'NH3' || x.formula === 'OH' || CHEM.isMetal(Object.keys(x.counts)[0])));
        if (acid && base) types.push(['Acid–base (neutralization)', 'An acid transfers H⁺ to a base, often forming water and a salt.']);
        // redox: any element with different oxidation states on the two sides
        const states = side => { const m = {}; side.forEach(sp => { if (sp.electron) return; const o = CHEM.oxStates(sp.counts, sp.charge).ox; Object.keys(o).forEach(e => { (m[e] = m[e] || new Set()).add(+o[e].toFixed(3)); }); }); return m; };
        const a = states(R), z = states(P);
        const changed = Object.keys(a).filter(e => z[e] && [...a[e]].sort().join() !== [...z[e]].sort().join());
        if (changed.length) types.push(['Oxidation–reduction (redox)', `Oxidation numbers change for ${changed.join(', ')}. See the Redox tool for details.`]);
        return types;
      }
      function run() {
        U.clear(out); state = null;
        let R, P, coefs;
        try { ({ R, P } = CHEM.parseEquation(text)); coefs = CHEM.balance(R, P); }
        catch (e) { out.appendChild(U.callout(e.message, 'bad')); return; }
        state = { R, P, coefs };
        const els = [...new Set(R.concat(P).flatMap(x => Object.keys(x.counts)))];
        const cnt = (S, cs, e) => S.reduce((t, x, i) => t + (x.counts[e] || 0) * cs[i], 0);
        const rows = els.map(e => [e, cnt(R, coefs, e), cnt(P, coefs.slice(R.length), e), '✓']);
        if (R.concat(P).some(x => x.charge)) rows.push(['charge', R.reduce((t, x, i) => t + x.charge * coefs[i], 0), P.reduce((t, x, i) => t + x.charge * coefs[R.length + i], 0), '✓']);
        out.append(U.panel('Balanced equation', h('div', { class: 'eq', style: { fontSize: '1.15rem' }, html: CHEM.eqHTML(R, P, coefs) }), cv.wrap),
          h('div', { class: 'grid2' }, U.panel('Atom inventory', U.table(['Element', 'Reactant side', 'Product side', ''], rows, { num: [1, 2] })),
            U.panel('Reaction type', ...classify(R, P).map(([n, d]) => h('div', null, h('b', null, n), h('div', { class: 'small muted' }, d))))));
        cv.redraw();
      }
      run();
    }

    function sorter(b) {
      const ITEMS = [['Ice melting', 'p', 'Only the state changes; H₂O molecules stay intact.'], ['Iron rusting', 'c', 'Fe reacts with O₂ to form a new substance, iron oxide.'], ['Burning wood', 'c', 'Combustion makes CO₂, H₂O and ash.'],
        ['Dissolving sugar in water', 'p', 'Sucrose molecules separate but are unchanged (intermolecular forces broken, no covalent bonds).'], ['Baking soda + vinegar fizzing', 'c', 'A gas (CO₂) forms from an acid–base reaction.'],
        ['Boiling water', 'p', 'Intermolecular forces are overcome; no O–H bonds break.'], ['Cooking an egg', 'c', 'Proteins change structure irreversibly.'], ['Dissolving NaCl in water', 'b', 'Ionic bonds in the lattice break (chemical) but no new substance forms (physical); AP treats this as a borderline case.'],
        ['Silver tarnishing', 'c', 'Ag reacts with sulfur compounds to form black Ag₂S.'], ['Crushing a can', 'p', 'Shape changes; the aluminum is the same substance.'], ['Electrolysis of water', 'c', 'Water is decomposed into H₂ and O₂.'], ['Dry ice subliming', 'p', 'CO₂(s) → CO₂(g): a change of state only.']];
      const res = {};
      const grid = h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '10px' } });
      const score = h('div', { class: 'small muted' });
      b.append(U.panel('Sort each change', h('p', { class: 'small muted' }, 'Physical changes alter form or state. Chemical changes make new substances: evidence includes gas formation, color change, precipitate, light, or temperature change.'), score, grid));
      const draw = () => {
        U.clear(grid);
        let right = 0;
        ITEMS.forEach(([name, ans, why], i) => {
          const pick = res[i];
          if (pick && (pick === ans || ans === 'b')) right++;
          const card = h('div', { class: 'panel', style: { padding: '12px', gap: '8px' } }, h('b', null, name),
            h('div', { class: 'row' }, U.btn('Physical', () => { res[i] = 'p'; draw(); }, 'sm' + (pick === 'p' ? ' primary' : '')), U.btn('Chemical', () => { res[i] = 'c'; draw(); }, 'sm' + (pick === 'c' ? ' primary' : ''))),
            pick ? U.callout((pick === ans || ans === 'b' ? '✓ ' : '✗ ') + why, pick === ans || ans === 'b' ? 'good' : 'bad') : null);
          grid.appendChild(card);
        });
        score.textContent = `Score: ${right} / ${Object.keys(res).length} answered (${ITEMS.length} total)`;
      };
      draw();
    }
  },
});
