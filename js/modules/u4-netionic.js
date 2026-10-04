'use strict';
App.register({
  id: 'net-ionic', unit: 4, sym: 'Ni', title: 'Precipitation & Net Ionic Equations',
  desc: 'Mix two solutions, apply solubility rules, and write molecular, complete ionic and net ionic equations with particle views.',
  tags: ['net ionic equation', 'precipitate', 'precipitation', 'solubility rules', 'spectator ions', 'complete ionic', 'aqueous', 'double replacement', 'particulate diagram'],
  keyIdeas: [
    'Soluble ionic compounds exist as separated ions in solution (aq). Insoluble products form a solid precipitate (s).',
    'AP solubility rules to know: all compounds of Na<sup>+</sup>, K<sup>+</sup>, NH<sub>4</sub><sup>+</sup> and NO<sub>3</sub><sup>−</sup> are soluble.',
    'Complete ionic equation: write every strong electrolyte as separate ions. Net ionic equation: remove the spectator ions that appear unchanged on both sides.',
    'Particle diagrams should show soluble salts as separate ions and precipitates as clustered solid.',
  ],
  render(el, scope) {
    const h = U.h;
    const CAT = { Ag: ['Ag', 1], Pb: ['Pb', 2], Ba: ['Ba', 2], Ca: ['Ca', 2], Cu: ['Cu', 2], Fe: ['Fe', 3], Na: ['Na', 1], K: ['K', 1], NH4: ['NH4', 1], Mg: ['Mg', 2], Zn: ['Zn', 2] };
    const AN = { NO3: ['NO3', -1], Cl: ['Cl', -1], I: ['I', -1], Br: ['Br', -1], SO4: ['SO4', -2], CO3: ['CO3', -2], OH: ['OH', -1], PO4: ['PO4', -3], CrO4: ['CrO4', -2], S: ['S', -2] };
    const SALTS = [['Ag', 'NO3'], ['Pb', 'NO3'], ['Ba', 'Cl'], ['Ca', 'Cl'], ['Cu', 'SO4'], ['Fe', 'Cl'], ['Mg', 'Cl'], ['Zn', 'NO3'], ['Na', 'Cl'], ['K', 'I'], ['Na', 'SO4'], ['Na', 'CO3'], ['Na', 'OH'], ['Na', 'PO4'], ['K', 'CrO4'], ['NH4', 'S'], ['K', 'Br']];
    const COLORS = { Ag: '#b8bcc6', Pb: '#5c6070', Ba: '#3faf7a', Ca: '#4caf6a', Cu: '#3d8be0', Fe: '#d0702e', Na: '#9a62f0', K: '#8c4fd0', NH4: '#3d6ae0', Mg: '#46c486', Zn: '#7f84b4', NO3: '#e5413b', Cl: '#33b34f', I: '#7b4ac8', Br: '#a8402e', SO4: '#ecc53a', CO3: '#50565f', OH: '#e88aa0', PO4: '#f08a24', CrO4: '#e6b800', S: '#d4a20a' };
    const PPT_COLOR = { AgCl: '#f2f2f2', AgI: '#f0e68c', AgBr: '#f5f0c8', PbI2: '#f5d000', PbCl2: '#f2f2f2', BaSO4: '#f7f7f7', Ag2CrO4: '#b5352b', PbCrO4: '#f2c200', 'Cu(OH)2': '#5aa7e0', 'Fe(OH)3': '#a0522d', CuS: '#222', PbS: '#222', Ag2S: '#222', ZnS: '#f2f2f2' };
    const soluble = (c, a) => {
      if (['Li', 'Na', 'K', 'Rb', 'Cs', 'NH4'].includes(c) || ['NO3', 'CH3COO', 'ClO4', 'ClO3'].includes(a)) return [true, 'compounds of group 1 metals, NH₄⁺, nitrate, acetate and perchlorate are always soluble'];
      if (['Cl', 'Br', 'I'].includes(a)) return ['Ag', 'Pb'].includes(c) ? [false, 'halides of Ag⁺ and Pb²⁺ are insoluble'] : [true, 'most chlorides, bromides and iodides are soluble'];
      if (a === 'SO4') return ['Ba', 'Pb', 'Ca', 'Ag'].includes(c) ? [false, 'sulfates of Ba²⁺, Pb²⁺, Ca²⁺ and Ag⁺ are insoluble'] : [true, 'most sulfates are soluble'];
      if (a === 'OH') return c === 'Ba' ? [true, 'Ba(OH)₂ is soluble'] : [false, 'most hydroxides are insoluble'];
      return [false, 'most carbonates, phosphates, chromates and sulfides are insoluble except with Na⁺, K⁺, NH₄⁺'];
    };
    const formula = (c, a) => {
      const qc = CAT[c][1], qa = -AN[a][1], g = U.gcd(qc, qa), nc = qa / g, na = qc / g;
      const poly = x => x.length > 2 || /\d/.test(x) || ['OH', 'CN', 'HS'].includes(x);
      const part = (x, n) => n > 1 ? (poly(x) ? `(${x})${n}` : x + n) : x;
      return { f: part(c, nc) + part(a, na), nc, na };
    };
    const ionHTML = (x, q) => U.chem(x) + '<sup>' + (Math.abs(q) > 1 ? Math.abs(q) : '') + (q > 0 ? '+' : '−') + '</sup>';
    let s1 = 1, s2 = 10, poured = 0, pouring = false;
    const label = ([c, a]) => U.chemText(formula(c, a).f);
    const optList = SALTS.map((p, i) => ({ value: i, label: label(p) + '(aq)' }));
    const selA = U.select({ label: 'Solution 1', options: optList, value: s1, onChange: v => { s1 = +v; reset(); } });
    const selB = U.select({ label: 'Solution 2', options: optList, value: s2, onChange: v => { s2 = +v; reset(); } });
    const pourBtn = U.btn('Pour together', () => { pouring = true; }, 'primary');
    const out = h('div', { class: 'stack' });
    const cv = U.canvas(null, { aspect: 1.8, scope });
    el.append(h('div', { class: 'grid-viz' }, U.panel(null, cv.wrap, h('div', { class: 'row' }, pourBtn, U.btn('Reset', () => reset(), ''))), h('div', { class: 'stack' }, U.panel('Choose two aqueous solutions', selA.el, selB.el, h('div', { class: 'row' }, ['AgNO3 + NaCl', 'Pb(NO3)2 + KI', 'BaCl2 + Na2SO4', 'CuSO4 + NaOH', 'NaCl + KBr'].map((t2, i) => U.btn(U.chem(t2), () => { const P = [[0, 8], [1, 9], [2, 10], [4, 12], [8, 16]][i]; s1 = P[0]; s2 = P[1]; selA.set(s1); selB.set(s2); reset(); }, 'sm')))))));
    const own = BUILDER.entry({ title: 'Add your own solution', label: 'Formula of a soluble ionic compound', placeholder: 'e.g. Ba(NO3)2', examples: ['Ba(NO3)2', 'Na3PO4', 'CuCl2', 'K2CO3', 'Sr(NO3)2', 'Li2SO4'], button: 'Add as Solution 2', onSubmit: text => {
      const f = text.replace(/\s+/g, '');
      const io = CHEM.ionic(f);
      if (!io) return { ok: false, msg: `Could not split “${U.esc(f)}” into a metal (or NH₄⁺) cation and a known anion.` };
      if (CAT[io.cat] && CAT[io.cat][1] !== io.qc) return { ok: false, msg: `This tool already uses ${io.cat} as ${io.cat}${U.supText((CAT[io.cat][1] > 1 ? CAT[io.cat][1] : '') + '+')}; one charge per metal is supported.` };
      if (AN[io.an] && AN[io.an][1] !== io.qa) return { ok: false, msg: 'That anion’s charge conflicts with one already in use.' };
      CAT[io.cat] = [io.cat, io.qc]; AN[io.an] = [io.an, io.qa];
      const pal = ['#d4a20a', '#13a3a0', '#d44690', '#6b7785', '#8650d6', '#e8781c'];
      [io.cat, io.an].forEach((x, i) => { if (!COLORS[x]) COLORS[x] = pal[(x.length * 7 + x.charCodeAt(0) + i) % pal.length]; });
      const sol = soluble(io.cat, io.an);
      if (!sol[0]) return { ok: false, msg: `${U.chem(f)} is not soluble in water (${sol[1]}), so it can’t be a starting solution. Try mixing solutions that would form it instead.` };
      let k = SALTS.findIndex(p => p[0] === io.cat && p[1] === io.an);
      if (k < 0) { SALTS.push([io.cat, io.an]); k = SALTS.length - 1; [selA, selB].forEach(sx => sx.input.appendChild(h('option', { value: k }, label([io.cat, io.an]) + '(aq)'))); }
      s2 = k; selB.set(k); reset();
      return { ok: true, msg: `Added ${U.chem(formula(io.cat, io.an).f)}(aq), which dissolves into ${ionHTML(io.cat, io.qc)} and ${ionHTML(io.an, io.qa)} ions. It is now Solution 2: press Pour together.` };
    } });
    el.append(own.el, out);

    let parts = [];
    function analyze() {
      const [c1, a1] = SALTS[s1], [c2, a2] = SALTS[s2];
      const products = [[c1, a2], [c2, a1]];
      return { c1, a1, c2, a2, products, sol: products.map(([c, a]) => soluble(c, a)) };
    }
    function reset() {
      poured = 0; pouring = false;
      const A = analyze();
      parts = [];
      const add = (c, a, side) => {
        const F = formula(c, a);
        for (let k = 0; k < 4; k++) {
          for (let i = 0; i < F.nc; i++) parts.push({ ion: c, q: CAT[c][1], side, x: Math.random(), y: Math.random() * 0.8 + 0.15, vx: U.rand(-1, 1), vy: U.rand(-1, 1), ppt: false });
          for (let i = 0; i < F.na; i++) parts.push({ ion: a, q: AN[a][1], side, x: Math.random(), y: Math.random() * 0.8 + 0.15, vx: U.rand(-1, 1), vy: U.rand(-1, 1), ppt: false });
        }
      };
      if (A.c1 === A.c2 && A.a1 === A.a2) { add(A.c1, A.a1, 0); add(A.c2, A.a2, 1); } else { add(A.c1, A.a1, 0); add(A.c2, A.a2, 1); }
      equations();
    }
    scope.loop((dt, time) => {
      if (pouring) { poured = Math.min(1, poured + dt * 0.6); if (poured >= 1) pouring = false; }
      const c = cv.ctx, w = cv.w, H = cv.h, t = U.theme();
      c.clearRect(0, 0, w, H);
      const A = analyze();
      const pptPair = A.sol.map((s2, i) => !s2[0] ? A.products[i] : null).filter(Boolean);
      // beakers: two small (top) merging into one large (bottom) as poured increases
      const big = { x: w * 0.2, y: H * 0.3, w: w * 0.6, h: H * 0.62 };
      const sm = [{ x: w * 0.04, y: H * 0.05, w: w * 0.34, h: H * 0.5 }, { x: w * 0.62, y: H * 0.05, w: w * 0.34, h: H * 0.5 }];
      const lerpB = (a, b2, k) => ({ x: U.lerp(a.x, b2.x, k), y: U.lerp(a.y, b2.y, k), w: U.lerp(a.w, b2.w, k), h: U.lerp(a.h, b2.h, k) });
      const boxes = poured > 0 ? [big] : sm;
      boxes.forEach(B => {
        c.fillStyle = U.alpha(t.blue, 0.08); c.fillRect(B.x, B.y + B.h * 0.1, B.w, B.h * 0.9);
        c.strokeStyle = t.ink2; c.lineWidth = 2.5; c.beginPath(); c.moveTo(B.x, B.y); c.lineTo(B.x, B.y + B.h); c.lineTo(B.x + B.w, B.y + B.h); c.lineTo(B.x + B.w, B.y); c.stroke();
      });
      // precipitate formation once mixed
      if (poured >= 1 && pptPair.length) {
        const [pc, pa] = pptPair[0];
        const F = formula(pc, pa);
        const freeC = parts.filter(p => p.ion === pc && !p.ppt), freeA = parts.filter(p => p.ion === pa && !p.ppt);
        if (freeC.length >= F.nc && freeA.length >= F.na && Math.random() < dt * 2.5) {
          const n = parts.filter(p => p.ppt).length;
          freeC.slice(0, F.nc).concat(freeA.slice(0, F.na)).forEach((p, k) => { p.ppt = true; p.slot = n + k; });
        }
      }
      parts.forEach(p => {
        let B = poured > 0 ? lerpB(sm[p.side], big, Math.min(1, poured * 1.2)) : sm[p.side];
        let x, y;
        if (p.ppt) {
          const per = Math.floor(big.w / 13);
          x = big.x + 10 + (p.slot % per) * 12; y = big.y + big.h - 8 - Math.floor(p.slot / per) * 11;
        } else {
          p.x += p.vx * dt * 0.15; p.y += p.vy * dt * 0.15;
          if (p.x < 0.03 || p.x > 0.97) p.vx *= -1; if (p.y < 0.15 || p.y > 0.95) p.vy *= -1;
          p.x = U.clamp(p.x, 0.03, 0.97); p.y = U.clamp(p.y, 0.15, 0.95);
          x = B.x + p.x * B.w; y = B.y + p.y * B.h;
        }
        const col = COLORS[p.ion], r = p.ppt ? 6 : 7;
        U.drawAtom(c, x, y, r, 'X', { color: col, label: false });
        if (!p.ppt) U.text(c, p.q > 0 ? '+' : '−', x, y + 3.5, { align: 'center', size: 9, weight: 700, color: U.lum(col) > 0.6 ? '#222' : '#fff' });
      });
      if (poured >= 1) {
        U.text(c, pptPair.length ? `precipitate: ${U.chemText(formula(...pptPair[0]).f)}(s)` : 'no precipitate: all ions stay dissolved', w / 2, H - 4, { align: 'center', weight: 700, color: pptPair.length ? t.bad : t.good });
      }
      // legend
      const ions = [...new Set(parts.map(p => p.ion))];
      ions.forEach((ion, i) => { const q = CAT[ion] ? CAT[ion][1] : AN[ion][1]; c.fillStyle = COLORS[ion]; c.beginPath(); c.arc(w - 70, H * 0.62 + i * 16, 5, 0, 7); c.fill(); U.text(c, U.chemText(ion) + U.supText((Math.abs(q) > 1 ? Math.abs(q) : '') + (q > 0 ? '+' : '-')), w - 60, H * 0.62 + i * 16 + 4, { size: 11 }); });
    });
    function equations() {
      U.clear(out);
      const A = analyze();
      if (s1 === s2) { out.appendChild(U.callout('Pick two different solutions.', 'warn')); return; }
      const reac = [[A.c1, A.a1], [A.c2, A.a2]], prod = A.products;
      const spec = pair => CHEM.parseSpecies(formula(...pair).f);
      let coefs;
      try { coefs = CHEM.balance(reac.map(spec), prod.map(spec)); } catch (e) { out.appendChild(U.callout(e.message, 'bad')); return; }
      const mol = reac.map((p, i) => (coefs[i] > 1 ? coefs[i] : '') + U.chem(formula(...p).f) + '(aq)').join(' + ') + ' → ' + prod.map((p, i) => (coefs[2 + i] > 1 ? coefs[2 + i] : '') + U.chem(formula(...p).f) + (A.sol[i][0] ? '(aq)' : '(s)')).join(' + ');
      const ionsOf = (pair, k) => { const F = formula(...pair); return [[pair[0], CAT[pair[0]][1], F.nc * k], [pair[1], AN[pair[1]][1], F.na * k]]; };
      const ionTxt = ([x, q, n]) => (n > 1 ? n : '') + ionHTML(x, q) + '(aq)';
      const left = reac.flatMap((p, i) => ionsOf(p, coefs[i]));
      const right = prod.flatMap((p, i) => A.sol[i][0] ? ionsOf(p, coefs[2 + i]) : [['__s', p, coefs[2 + i]]]);
      const comp = left.map(ionTxt).join(' + ') + ' → ' + right.map(r => r[0] === '__s' ? (r[2] > 1 ? r[2] : '') + U.chem(formula(...r[1]).f) + '(s)' : ionTxt(r)).join(' + ');
      const spect = left.filter(([x]) => right.some(r => r[0] === x)).map(([x, q]) => ionHTML(x, q));
      const anyPpt = A.sol.some(s2 => !s2[0]);
      out.append(U.panel('Solubility check', U.table(['Possible product', 'Soluble?', 'Rule'], prod.map((p, i) => [U.chem(formula(...p).f), A.sol[i][0] ? 'yes (aq)' : '<b>no → precipitate (s)</b>', A.sol[i][1]]))));
      out.append(U.panel('Equations',
        h('div', { class: 'tiny muted' }, 'Molecular'), h('div', { class: 'eq', html: mol }),
        h('div', { class: 'tiny muted' }, 'Complete ionic'), h('div', { class: 'eq', html: comp }),
        h('div', { class: 'tiny muted' }, 'Net ionic'), h('div', { class: 'eq', html: anyPpt ? (() => {
          const i = A.sol.findIndex(s2 => !s2[0]); const p = prod[i]; const F = formula(...p);
          return `${F.nc > 1 ? F.nc : ''}${ionHTML(p[0], CAT[p[0]][1])}(aq) + ${F.na > 1 ? F.na : ''}${ionHTML(p[1], AN[p[1]][1])}(aq) → ${U.chem(F.f)}(s)`;
        })() : 'No reaction: every ion is a spectator.' }),
        h('p', { class: 'small', html: '<b>Spectator ions:</b> ' + (spect.length ? [...new Set(spect)].join(', ') : 'none') })));
    }
    reset();
  },
});
