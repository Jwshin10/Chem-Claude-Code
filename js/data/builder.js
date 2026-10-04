/* BUILDER: turns a typed formula into a molecule spec the Lewis, VSEPR and IMF tools can use.
   Understands
     - one-central-atom formulas: PF5, XeO3, SO3^2-, NH4+, HNO3, H2SO4 (H goes on O in oxyacids)
     - condensed structural formulas: CH3CH2OH, CH3COOH, (CH3)2CHOH, CH3(CH2)2CH3, HCOOH
     - straight-chain hydrocarbons from a molecular formula: C3H8, C3H6, C2H2
     - single atoms and monatomic ions (Lewis dot symbols): N, Cl-, Mg2+
   Electrons are placed with the textbook procedure (octets on outer atoms, leftovers on the
   central atom, lone pairs turned into multiple bonds when an atom lacks an octet), then formal
   charges are minimized on period-3+ atoms (expanded octets). */
'use strict';
const BUILDER = (() => {
  const VAL = { H: 1, B: 3, C: 4, N: 3, O: 2, F: 1, Si: 4, P: 3, S: 2, Cl: 1, Se: 2, Br: 1, I: 1, Be: 2, Al: 3, Ge: 4, As: 3, Te: 2, Sn: 4, Pb: 4, Ga: 3 };
  const MONO = new Set(['H', 'F', 'Cl', 'Br', 'I']);
  const INCOMPLETE = new Set(['B', 'Be', 'Al', 'Ga', 'Sn', 'Pb']);
  const SUPC = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁺': '+', '⁻': '-' };
  const EX = ['PF5', 'XeO3', 'SO3^2-', 'ICl4^-', 'HNO3', 'H2SO4', 'COCl2', 'CH3CH2OH', 'CH3COOH', 'CH3CHO', '(CH3)2CHOH', 'C3H6', 'N2H4', 'Cl-'];
  const E = s => ELEMENTS.bySym[s];
  const en = s => E(s).en || 2.5;
  const fmtQ = q => q ? '^' + (Math.abs(q) > 1 ? Math.abs(q) : '') + (q > 0 ? '+' : '-') : '';

  /* ---------- reading the text ---------- */
  function candidates(text) {
    let s = String(text || '').trim();
    s = s.replace(/[₀-₉]/g, c => String(c.charCodeAt(0) - 8320));
    s = s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]+$/, m => '^' + m.split('').map(c => SUPC[c]).join(''));
    s = s.replace(/[−–]/g, '-').replace(/≡/g, '#').trim();
    if (!s) return [];
    let m;
    const sg = c => (c === '+' ? 1 : -1);
    if ((m = s.match(/^(.*?)\s*\^\s*(\d*)\s*([+-])$/))) return [{ body: m[1], q: (m[2] ? +m[2] : 1) * sg(m[3]) }];
    if ((m = s.match(/^(.*?)\s*\^\s*([+-])(\d+)$/))) return [{ body: m[1], q: +m[3] * sg(m[2]) }];
    if ((m = s.match(/^(.*\S)\s+(\d*)([+-])$/))) return [{ body: m[1], q: (m[2] ? +m[2] : 1) * sg(m[3]) }];
    if ((m = s.match(/^(.*?)(\d)([+-])$/))) {
      const asCharge = { body: m[1], q: +m[2] * sg(m[3]) }, asSub = { body: m[1] + m[2], q: sg(m[3]) };
      return /\d$/.test(m[1]) || /^[A-Z][a-z]?$/.test(m[1]) ? [asCharge, asSub] : [asSub, asCharge];
    }
    if ((m = s.match(/^(.*?)([+-])$/))) return [{ body: m[1], q: sg(m[2]) }];
    return [{ body: s, q: 0 }];
  }
  const symbolsIn = body => (body.match(/[A-Z][a-z]?/g) || []);
  const isCondensed = body => /[()=#]/.test(body) || symbolsIn(body).length !== new Set(symbolsIn(body)).size;
  function countsOf(m) {
    const c = {}, add = e => { c[e] = (c[e] || 0) + 1; };
    if (m.atom) add(m.struct.atoms[0].el);
    else if (m.c) { add(m.c); m.L.forEach(l => { add(l[0]); for (let k = 0; k < (l[2] || 0); k++) add('H'); }); }
    else m.atoms.forEach(a => add(a[0]));
    return c;
  }
  const keyOf = (counts, q) => Object.keys(counts).sort().map(k => k + counts[k]).join('') + '|' + q;

  /** main entry: returns { spec, library, note } or { error } */
  function fromText(text) {
    const cands = candidates(text);
    if (!cands.length) return { error: 'Type a formula first.' };
    let err = null;
    for (const c of cands) {
      const body = c.body.replace(/\s+/g, '');
      if (!body) continue;
      const exact = MOLECULES.all.find(m => m.f.split('^')[0] === body && (m.q || 0) === c.q);
      if (exact) return { spec: exact, library: true };
      if (isCondensed(body)) continue;
      let counts;
      try { counts = U.parseFormula(body); } catch (e) { err = err || e.message + '.'; continue; }
      const hits = MOLECULES.all.filter(m => keyOf(countsOf(m), m.q || 0) === keyOf(counts, c.q));
      if (hits.length) return { spec: hits[0], library: true, note: hits.length > 1 ? `More than one molecule has this formula (${hits.map(h => h.name).join(', ')}). Showing ${hits[0].name}; type a condensed formula such as ${hits.map(h => h.f).join(' or ')} to choose.` : null };
    }
    for (const c of cands) {
      const body = c.body.replace(/\s+/g, '');
      if (!body) continue;
      let r;
      try { r = build(body, c.q); } catch (e) { r = { error: e.message }; }
      if (!r.error) return r;
      err = err || r.error;
    }
    return { error: err || 'That formula could not be read.' };
  }

  /* ---------- skeletons ---------- */
  function build(body, q) {
    const clean = body.replace(/[=#]/g, '');
    let counts;
    try { counts = U.parseFormula(clean); } catch (e) { return { error: e.message + '. Use element symbols with correct capitals, like CH3OH or SO4^2-.' }; }
    for (const el in counts) {
      const x = E(el);
      if (x.valence == null || ['alkali', 'transition', 'lanthanide', 'actinide'].includes(x.cat) || (x.cat === 'alkaline' && el !== 'Be'))
        return { error: `${x.name} forms ionic compounds (or uses d orbitals), so it isn’t drawn as a Lewis structure here. Try a molecule or polyatomic ion made of nonmetals.` };
    }
    const nAtoms = Object.values(counts).reduce((t, x) => t + x, 0);
    if (nAtoms > 30) return { error: 'That molecule is too large to draw here (30 atoms maximum).' };
    const f = clean + fmtQ(q);
    if (nAtoms === 1) return atomSpec(Object.keys(counts)[0], q, f);
    let g;
    if (isCondensed(body)) g = condensed(clean);
    else if ((counts.C || 0) >= 2 && Object.keys(counts).every(e => e === 'C' || e === 'H')) g = hydrocarbon(counts);
    else if ((counts.C || 0) >= 2) return { error: `${U.chem(f)} can be drawn in more than one way. Type a condensed structural formula instead, such as CH3CH2OH, CH3OCH3 or CH3COOH.` };
    else g = central(counts);
    if (g.error) return g;
    // X–Y–H chains (HOCl, HOBr…) read better as a chain with two centres
    if (g.kind === 'single' && g.ligs.length === 1 && g.hOn[0] > 0) { g.kind = 'multi'; g.chain = [0, 1]; }
    const over = g.els.findIndex((el, i) => E(el).period === 2 && g.edges.filter(e => e[0] === i || e[1] === i).length > 4);
    if (over >= 0) return { error: `That structure would give ${g.els[over]} more than four bonds. Check the formula.` };
    const r = assign(g.els, g.edges, q);
    if (r.error) return r;
    const spec = g.kind === 'single' ? singleSpec(g, r, q, f) : multiSpec(g, r, q, f);
    if (spec.error) return spec;
    return { spec, library: false, note: r.notes.length ? r.notes.join(' ') : null };
  }

  function atomSpec(el, q, f) {
    const v = E(el).valence;
    if (v == null) return { error: `${E(el).name} is not a main-group element.` };
    const e = v - q;
    if (e < 0 || e > 8 || (E(el).period === 1 && e > 2)) return { error: `${U.chem(f)} would have ${e} valence electrons, which is not a stable ion.` };
    const pos = [90, 0, 270, 180];
    const per = E(el).period === 1 ? 1 : 4;
    const pairs = per === 1 ? Math.floor(e / 2) : Math.max(0, e - 4), singles = per === 1 ? e % 2 : e - 2 * pairs;
    const R = d => d * Math.PI / 180;
    const atom = { el, x: 0, y: 0, lp: pairs, lpDirs: pos.slice(0, pairs).map(R), singleDirs: pos.slice(pairs, pairs + singles).map(R), fc: 0, bondCount: 0 };
    return { spec: { id: 'custom', custom: true, atom: true, f, name: q ? 'Your ion' : 'Your atom', q, struct: { atoms: [atom], bonds: [], q } }, library: false, note: null };
  }

  /* one central atom; ligands; H atoms on the central atom or on O/N ligands */
  function central(counts) {
    const heavy = [];
    Object.keys(counts).forEach(e => { if (e !== 'H') for (let k = 0; k < counts[e]; k++) heavy.push(e); });
    let nH = counts.H || 0;
    if (!heavy.length) return nH === 2 ? { kind: 'single', els: ['H', 'H'], edges: [[0, 1]], ligs: ['H'], hOn: [0], hC: 0 } : { error: 'That hydrogen-only formula is not a stable molecule.' };
    const uniq = [...new Set(heavy)];
    const ones = uniq.filter(e => counts[e] === 1);
    const c = (ones.length ? ones : uniq).sort((a, b) => en(a) - en(b))[0];
    const ligs = heavy.slice(); ligs.splice(ligs.indexOf(c), 1);
    ligs.sort((a, b) => en(b) - en(a) || a.localeCompare(b));
    const hOn = ligs.map(() => 0);
    let hC = 0;
    const nO = ligs.filter(e => e === 'O').length;
    const oxy = nO >= 2 || !['C', 'N', 'O', 'B', 'Si'].includes(c);
    if (oxy) ligs.forEach((e, i) => { if (nH && e === 'O') { hOn[i]++; nH--; } });
    else { const k = Math.min(nH, Math.max(0, (VAL[c] ?? 0) - ligs.length)); hC = k; nH -= k; }
    ligs.forEach((e, i) => { if (!['O', 'N', 'S', 'P', 'C'].includes(e)) return; const k = Math.min(nH, Math.max(0, (VAL[e] ?? 1) - 1 - hOn[i])); hOn[i] += k; nH -= k; });
    hC += nH;
    const els = [c].concat(ligs), edges = ligs.map((_, i) => [0, i + 1]);
    ligs.forEach((e, i) => { for (let k = 0; k < hOn[i]; k++) { els.push('H'); edges.push([i + 1, els.length - 1]); } });
    for (let k = 0; k < hC; k++) { els.push('H'); edges.push([0, els.length - 1]); }
    return { kind: 'single', els, edges, ligs, hOn, hC };
  }

  /* straight chain for CnHm */
  function hydrocarbon(counts) {
    const n = counts.C, m = counts.H || 0, u = (2 * n + 2 - m) / 2;
    if (!Number.isInteger(u) || u < 0) return { error: 'That hydrocarbon formula is not possible. Check the number of H atoms.' };
    if (u > 2) return { error: 'That formula needs rings or several multiple bonds. Type a condensed formula such as CH2=CHCH=CH2.' };
    const hc = Array.from({ length: n }, (_, i) => (i === 0 || i === n - 1) ? 3 : 2);
    hc[0] -= u; hc[1] -= u;
    if (hc.some(x => x < 0)) return { error: 'That formula would need a ring.' };
    const els = [], edges = [], chain = [];
    for (let i = 0; i < n; i++) { els.push('C'); chain.push(els.length - 1); if (i) edges.push([chain[i - 1], chain[i]]); }
    chain.forEach((c, i) => { for (let k = 0; k < hc[i]; k++) { els.push('H'); edges.push([c, els.length - 1]); } });
    return { kind: 'multi', els, edges, chain };
  }

  /* condensed structural formulas */
  function condensed(str) {
    const els = [], edges = [], chain = [], deg = [];
    const add = (el, parent) => { els.push(el); deg.push(0); const k = els.length - 1; if (parent != null) { edges.push([parent, k]); deg[parent]++; deg[k]++; } return k; };
    const cap = k => (VAL[els[k]] ?? 4) - deg[k];
    function seq(s, attach, main) {
      let i = 0, prev = attach, pendH = 0, pend = [];
      const readNum = () => { let n = ''; while (i < s.length && /\d/.test(s[i])) n += s[i++]; return n ? +n : 1; };
      while (i < s.length) {
        if (s[i] === '(') {
          i++; const start = i; let d = 1;
          while (i < s.length && d) { if (s[i] === '(') d++; else if (s[i] === ')') d--; i++; }
          if (d) throw new Error('Unbalanced parentheses.');
          const sub = s.slice(start, i - 1), n = readNum();
          if (!sub) throw new Error('Empty parentheses.');
          if (prev == null) { pend.push([sub, n]); continue; }
          const more = i < s.length;
          if (n > 1 && cap(prev) < n + (more ? 1 : 0)) { for (let k = 0; k < n; k++) prev = seq(sub, prev, main); }
          else for (let k = 0; k < n; k++) seq(sub, prev, false);
          continue;
        }
        if (s[i] === ')') throw new Error('Unbalanced parentheses.');
        if (!/[A-Z]/.test(s[i])) throw new Error(`Unexpected “${s[i]}”.`);
        let el = s[i++];
        while (i < s.length && /[a-z]/.test(s[i])) el += s[i++];
        if (!E(el)) throw new Error(`Unknown element “${el}”.`);
        const n = readNum();
        if (MONO.has(el)) {
          if (prev == null) { if (el === 'H') pendH += n; else pend.push([el, n]); }
          else for (let k = 0; k < n; k++) add(el, prev);
          continue;
        }
        if (n !== 1) throw new Error(`“${el}${n}” can’t be placed without guessing (rings aren’t supported). Write each atom of the chain separately, e.g. CH3CH2CH3.`);
        let branch = false;
        if (prev != null && (el === 'O' || el === 'S') && els[prev] === 'C' && deg[prev] <= 1) {
          const nextIsH = s[i] === 'H' && !/[a-z]/.test(s[i + 1] || '');
          if (i < s.length && !nextIsH) branch = true;   // C(=O) followed by more of the chain
        }
        const k = add(el, prev);
        pend.forEach(([sub, m]) => { for (let r = 0; r < m; r++) { if (MONO.has(sub)) add(sub, k); else seq(sub, k, false); } });
        pend = [];
        for (let r = 0; r < pendH; r++) add('H', k);
        pendH = 0;
        if (!branch) { prev = k; if (main) chain.push(k); }
      }
      if (pendH || pend.length) throw new Error('The formula ends before the atoms it describes are attached.');
      return prev;
    }
    seq(str, null, true);
    if (!els.length) return { error: 'No atoms found.' };
    return { kind: 'multi', els, edges, chain };
  }

  /* ---------- electrons ---------- */
  function assign(els, edges, q) {
    const n = els.length, idx = els.map((_, i) => i), notes = [];
    const V = els.reduce((t, e) => t + E(e).valence, 0) - q;
    if (V % 2) return { error: `This species has an odd number of valence electrons (${V}), so it is a radical. AP Lewis structures use even electron counts.` };
    const order = edges.map(() => 1), lp = els.map(() => 0);
    const deg = idx.map(i => edges.filter(e => e[0] === i || e[1] === i).length);
    let R = V - 2 * edges.length;
    if (R < 0) return { error: 'There are not enough valence electrons to connect these atoms. Check the formula and charge.' };
    const bsum = i => edges.reduce((t, e, k) => t + (e[0] === i || e[1] === i ? order[k] : 0), 0);
    const elec = i => 2 * bsum(i) + 2 * lp[i];
    const term = idx.filter(i => els[i] !== 'H' && deg[i] === 1).sort((a, b) => en(els[b]) - en(els[a]));
    const inner = idx.filter(i => els[i] !== 'H' && deg[i] !== 1).sort((a, b) => en(els[b]) - en(els[a]));
    for (const i of term.concat(inner)) { const need = Math.max(0, (8 - elec(i)) / 2); const give = Math.min(need, R / 2); lp[i] += give; R -= 2 * give; }
    if (R > 0) {
      const exp = inner.concat(term).filter(i => E(els[i]).period >= 3).sort((a, b) => deg[b] - deg[a]);
      if (!exp.length) return { error: 'There are more electrons than period-2 atoms can hold. Check the formula and charge.' };
      lp[exp[0]] += R / 2; R = 0;
      notes.push(`${els[exp[0]]} has an expanded octet (period ${E(els[exp[0]]).period} atoms can hold more than 8 electrons).`);
    }
    for (let it = 0; it < 40; it++) {
      const def = idx.filter(i => els[i] !== 'H' && !INCOMPLETE.has(els[i]) && elec(i) < 8).sort((a, b) => elec(a) - elec(b));
      if (!def.length) break;
      let done = false;
      for (const i of def) {
        const c = edges.map((e, k) => ({ k, j: e[0] === i ? e[1] : e[1] === i ? e[0] : -1 }))
          .filter(o => o.j >= 0 && lp[o.j] > 0 && !MONO.has(els[o.j]) && order[o.k] < 3)
          .sort((x, y) => lp[y.j] - lp[x.j]);
        if (!c.length) continue;
        lp[c[0].j]--; order[c[0].k]++; done = true; break;
      }
      if (!done) break;
    }
    idx.forEach(i => { if (els[i] !== 'H' && elec(i) < 8) notes.push(INCOMPLETE.has(els[i]) ? `${els[i]} is stable with an incomplete octet (${elec(i)} electrons).` : `${els[i]} ends up with only ${elec(i)} electrons; this species is unusual.`); });
    const fc = i => E(els[i]).valence - 2 * lp[i] - bsum(i);
    // minimize formal charge on period-3+ atoms by expanding their octets
    for (let it = 0; it < 12; it++) {
      let changed = false;
      for (const i of idx) {
        if (E(els[i]).period < 3 || fc(i) <= 0) continue;
        const c = edges.map((e, k) => ({ k, j: e[0] === i ? e[1] : e[1] === i ? e[0] : -1 }))
          .filter(o => o.j >= 0 && fc(o.j) < 0 && lp[o.j] > 0 && ['O', 'N', 'S'].includes(els[o.j]) && order[o.k] < 3);
        if (!c.length) continue;
        lp[c[0].j]--; order[c[0].k]++; changed = true;
        if (!notes.some(t => t.includes('formal charge'))) notes.push(`Double bonds to ${els[i]} were added to bring its formal charge toward zero (expanded octet). A structure that keeps every octet is also accepted on the AP exam.`);
      }
      if (!changed) break;
    }
    return { order, lp, notes };
  }

  /* ---------- specs ---------- */
  function singleSpec(g, r, q, f) {
    const ordOf = j => r.order[g.edges.findIndex(e => e[0] === 0 && e[1] === j)];
    const L = g.ligs.map((e, i) => [e, ordOf(i + 1), g.hOn[i]]);
    for (let k = 0; k < g.hC; k++) L.push(['H', 1, 0]);
    const lp = r.lp[0];
    if (L.length + lp > 6) return { error: 'This species would need more than six electron domains, which goes beyond AP Chemistry.' };
    const tlp = L.map((l, i) => i < g.ligs.length ? r.lp[i + 1] : 0);
    const oct = L.map(l => l[0] === 'H' ? 0 : 4 - l[1] - (l[2] || 0));
    const spec = { id: 'custom', custom: true, f, name: q ? 'Your ion' : 'Your molecule', c: g.els[0], L, lp, q };
    if (tlp.some((v, i) => v !== oct[i])) spec.tlp = tlp;
    return spec;
  }
  function multiSpec(g, r, q, f) {
    const pos = layout(g);
    const n = g.els.length;
    const bsum = i => g.edges.reduce((t, e, k) => t + (e[0] === i || e[1] === i ? r.order[k] : 0), 0);
    const atoms = g.els.map((el, i) => { const def = el === 'H' ? 0 : Math.max(0, 4 - bsum(i)); return r.lp[i] !== def ? [el, pos[i][0], pos[i][1], r.lp[i]] : [el, pos[i][0], pos[i][1]]; });
    const bonds = g.edges.map((e, k) => [e[0], e[1], r.order[k]]);
    const spec = { id: 'custom', custom: true, f, name: q ? 'Your ion' : 'Your molecule', atoms, bonds, q };
    if (!atoms.some(a => a.length > 3)) {
      const res = resonance(g, r);
      if (res.length) spec.res = res;
    }
    return spec;
  }
  /* move a double bond between equivalent terminal atoms (e.g. the two O atoms of a carboxylate) */
  function resonance(g, r) {
    const out = [], deg = g.els.map((_, i) => g.edges.filter(e => e[0] === i || e[1] === i).length);
    g.els.forEach((_, a) => {
      const nb = g.edges.map((e, k) => ({ k, j: e[0] === a ? e[1] : e[1] === a ? e[0] : -1 })).filter(o => o.j >= 0 && deg[o.j] === 1 && ['O', 'S', 'N'].includes(g.els[o.j]));
      const dbl = nb.filter(o => r.order[o.k] === 2), sgl = nb.filter(o => r.order[o.k] === 1);
      dbl.forEach(d => sgl.forEach(s => {
        if (g.els[d.j] !== g.els[s.j] || out.length >= 5) return;
        const ord = r.order.slice(); ord[d.k] = 1; ord[s.k] = 2;
        out.push(g.edges.map((e, k) => [e[0], e[1], ord[k]]));
      }));
    });
    return out;
  }
  function layout(g) {
    const n = g.els.length, pos = g.els.map(() => null), adj = g.els.map(() => []);
    g.edges.forEach(([a, b]) => { adj[a].push(b); adj[b].push(a); });
    const chain = g.chain && g.chain.length ? g.chain : [g.els.findIndex(e => e !== 'H')];
    chain.forEach((k, j) => { pos[k] = [j, 0]; });
    const inChain = new Set(chain), D = Math.PI / 180;
    const place = (k, parent, ang) => {
      pos[k] = [pos[parent][0] + Math.cos(ang), pos[parent][1] + Math.sin(ang)];
      const kids = adj[k].filter(x => x !== parent && !pos[x]).sort((a, b) => (g.els[a] === 'H') - (g.els[b] === 'H'));
      const offs = { 1: [0], 2: [-60, 60], 3: [-90, 0, 90], 4: [-90, -30, 30, 90] }[kids.length] || kids.map((_, i) => -90 + 180 * i / Math.max(1, kids.length - 1));
      kids.forEach((c, i) => place(c, k, ang + offs[i] * D));
    };
    chain.forEach((k, j) => {
      const last = chain.length - 1;
      const order = chain.length === 1 ? [0, 180, 90, 270, 45, 135, 225, 315] : j === 0 ? [180, 90, 270, 135, 225] : j === last ? [0, 90, 270, 45, 315] : [90, 270, 45, 135, 225, 315];
      adj[k].filter(x => !inChain.has(x) && !pos[x]).sort((a, b) => (g.els[a] === 'H') - (g.els[b] === 'H')).forEach((x, i) => place(x, k, (order[i] ?? 30 * i) * D));
    });
    return pos.map(p => p || [0, 0]);
  }

  /* ---------- 3-D embedding for molecules with several central atoms (tree-shaped) ---------- */
  const SLOTS = {
    1: [[0, 1, 0]], 2: [[0, 1, 0], [0, -1, 0]], 3: [[0, 1, 0], [0.866, -0.5, 0], [-0.866, -0.5, 0]],
    4: [[0, 1, 0], [0.9428, -1 / 3, 0], [-0.4714, -1 / 3, 0.8165], [-0.4714, -1 / 3, -0.8165]],
    5: [[0, 1, 0], [0, -1, 0], [1, 0, 0], [-0.5, 0, 0.866], [-0.5, 0, -0.866]],
    6: [[0, 1, 0], [0, -1, 0], [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]],
  };
  const rot = (v, k, th) => { const c = Math.cos(th), s = Math.sin(th), d = k[0] * v[0] + k[1] * v[1] + k[2] * v[2]; const x = [k[1] * v[2] - k[2] * v[1], k[2] * v[0] - k[0] * v[2], k[0] * v[1] - k[1] * v[0]]; return [0, 1, 2].map(i => v[i] * c + x[i] * s + k[i] * d * (1 - c)); };
  const norm = v => { const l = Math.hypot(...v) || 1; return v.map(x => x / l); };
  function embed(spec) {
    const s = MOLECULES.build(spec);
    const n = s.atoms.length, adj = s.atoms.map(() => []);
    s.bonds.forEach(b => { adj[b.a].push(b.b); adj[b.b].push(b.a); });
    if (s.bonds.length >= n) return { ring: true };
    const root = s.atoms.map((a, i) => i).filter(i => s.atoms[i].el !== 'H').sort((a, b) => adj[b].length - adj[a].length)[0] ?? 0;
    const pos = Array(n).fill(null), lps = [];
    pos[root] = [0, 0, 0];
    const queue = [[root, -1, 0]];
    while (queue.length) {
      const [a, p, depth] = queue.shift();
      const kids = adj[a].filter(x => x !== p).sort((x, y) => (s.atoms[x].el === 'H') - (s.atoms[y].el === 'H'));
      const dom = adj[a].length + s.atoms[a].lp;
      const slots = SLOTS[Math.min(6, Math.max(1, dom))];
      let tf = v => v;
      if (p >= 0) {
        const t = norm(pos[p].map((x, i) => x - pos[a][i]));
        let k = [t[2], 0, -t[0]], th = Math.acos(U.clamp(t[1], -1, 1));
        if (Math.hypot(...k) < 1e-6) k = [1, 0, 0]; else k = norm(k);
        const twist = dom === 4 ? (depth % 2) * Math.PI / 3 : 0;
        tf = v => rot(rot(v, k, th), t, twist);
      }
      const free = p >= 0 ? slots.slice(1) : slots.slice();
      kids.forEach((c, i) => {
        const d = norm(tf(free[i] || [1, 0, 0]));
        const len = s.atoms[c].el === 'H' || s.atoms[a].el === 'H' ? 0.82 : 1.1;
        pos[c] = pos[a].map((x, j) => x + d[j] * len);
        queue.push([c, a, depth + 1]);
      });
      for (let k = kids.length; k < free.length && k - kids.length < s.atoms[a].lp; k++) lps.push({ from: a, v: norm(tf(free[k])) });
    }
    const heavy = pos.filter((p, i) => s.atoms[i].el !== 'H');
    const cen = [0, 1, 2].map(j => heavy.reduce((t, p) => t + p[j], 0) / heavy.length);
    const P = pos.map(p => p.map((x, j) => x - cen[j]));
    const atoms = s.atoms.map((a, i) => ({ el: a.el, p: P[i], r: a.el === 'H' ? 0.2 : 0.3 }));
    // dipole: bond dipoles (toward the more electronegative atom) + lone pairs
    const mu = [0, 0, 0];
    s.bonds.forEach(b => { const d = norm(P[b.b].map((x, j) => x - P[b.a][j])), k = en(s.atoms[b.b].el) - en(s.atoms[b.a].el); for (let j = 0; j < 3; j++) mu[j] += d[j] * k; });
    lps.forEach(l => { for (let j = 0; j < 3; j++) mu[j] += l.v[j] * 0.6; });
    const hydrocarbon = s.atoms.every(a => a.el === 'C' || a.el === 'H');
    const mag = hydrocarbon ? 0 : Math.hypot(...mu);
    const radius = Math.max(...atoms.map(a => Math.hypot(...a.p) + a.r));
    return { atoms, bonds: s.bonds.map(b => ({ a: b.a, b: b.b, order: b.order })), lps, dipole: mag > 0.35 ? norm(mu) : null, polar: mag > 0.35, radius, multi: true };
  }

  /* ---------- properties for the IMF tools ---------- */
  function properties(spec) {
    const s = MOLECULES.build(spec);
    let e = 0, M = 0;
    s.atoms.forEach(a => { e += E(a.el).Z; M += E(a.el).mass; });
    e -= spec.q || 0;
    let polar = false;
    if (spec.c) polar = MOLECULES.polarity(spec) === 'polar';
    else if (!spec.atom) { const m = embed(spec); polar = m.ring ? !s.atoms.every(a => a.el === 'C' || a.el === 'H') : m.polar; }
    const don = { O: 0, N: 0, F: 0 };
    s.bonds.forEach(b => { const x = s.atoms[b.a].el, y = s.atoms[b.b].el; if (x === 'H' && don[y] != null) don[y]++; if (y === 'H' && don[x] != null) don[x]++; });
    const hb = don.O + don.N + don.F > 0;
    const bpK = 30 * Math.pow(e, 0.6) + (polar ? 50 : 0) + 110 * Math.min(2, don.O) + 55 * Math.min(2, don.N) + 130 * Math.min(1, don.F);
    const bp = Math.round((bpK - 273.15) / 5) * 5, mp = Math.round((0.62 * bpK - 273.15) / 5) * 5;
    return { e, M, polar, hb, donors: don, bp, mp };
  }

  /* ---------- UI helpers ---------- */
  /** small form: text box + button + example chips + feedback. onSubmit(text) -> {ok, msg} */
  function entry({ title, label, value, placeholder, examples, button = 'Build', onSubmit, hint }) {
    const h = U.h;
    const msg = h('div');
    const run = v => { let r; try { r = onSubmit(v.trim()); } catch (e) { console.error(e); r = { ok: false, msg: 'Something went wrong: ' + e.message }; } U.clear(msg); if (r && r.msg) msg.appendChild(U.callout(r.msg, r.ok ? (r.warn ? 'warn' : 'good') : 'bad')); };
    const inp = U.textInput({ label, value: value || '', placeholder, onEnter: v => run(v) });
    const chips = examples && examples.length ? h('div', { class: 'row' }, h('span', { class: 'tiny muted' }, 'Try:'), examples.map(x => U.btn(U.chem(x), () => { inp.set(x); run(x); }, 'sm'))) : null;
    const el = U.panel(title || null, h('div', { class: 'row end', style: { flexWrap: 'nowrap' } }, h('div', { class: 'grow', style: { minWidth: 0 } }, inp.el), U.btn(button, () => run(inp.value), 'primary')), hint ? h('p', { class: 'small muted', html: hint }) : null, chips, msg);
    return { el, input: inp, run };
  }
  /** register (or restore) the user's molecule; returns {spec, note} or {error} */
  function useText(text) {
    const r = fromText(text);
    if (r.error) return r;
    if (!r.library) MOLECULES.setCustom(r.spec);
    U.store.set('customMol', text);
    return r;
  }
  function restore() {
    const t = U.store.get('customMol', '');
    if (!t) return null;
    const r = fromText(t);
    if (!r.error && !r.library) MOLECULES.setCustom(r.spec);
    return r.error ? null : r;
  }
  /** the molecule panel shared by the Lewis and VSEPR tools */
  function moleculePanel(onUse) {
    return entry({
      title: 'Type your own molecule or ion', label: 'Formula', value: U.store.get('customMol', ''), placeholder: 'e.g. PF5, SO3^2-, CH3CH2OH',
      examples: EX.slice(0, 10), button: 'Build',
      hint: 'Use ^ or a trailing sign for charge (NH4+, SO4^2-). For organic molecules type a condensed formula such as CH3CH2OH or (CH3)2CO.',
      onSubmit: text => {
        if (!text) return { ok: false, msg: 'Type a formula first.' };
        const r = useText(text);
        if (r.error) return { ok: false, msg: r.error };
        onUse(r.spec);
        return { ok: true, warn: !!r.note, msg: r.library ? `Found <b>${r.spec.name}</b> (${U.chem(r.spec.f)}) in the built-in library.` + (r.note ? ' ' + r.note : '') : `Built ${U.chem(r.spec.f)}.` + (r.note ? ' ' + r.note : '') };
      },
    });
  }
  return { fromText, properties, embed, entry, useText, restore, moleculePanel, candidates, EX };
})();
