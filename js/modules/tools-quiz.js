'use strict';
App.register({
  id: 'quiz', unit: 0, sym: 'Qz', title: 'Practice Quiz',
  desc: 'Multiple-choice practice for every unit, with instant feedback, explanations, and links back to the matching tool.',
  tags: ['quiz', 'practice', 'multiple choice', 'review', 'test', 'exam prep', 'questions'],
  keyIdeas: [],
  render(el, scope) {
    const h = U.h;
    // [unit, question, options (first is correct), explanation, related tool id]
    const Q = [
      [1, 'Which element has the largest first ionization energy?', ['Si', 'Mg', 'Al', 'Na'], 'Across period 3, nuclear charge increases while shielding stays nearly the same, so Si holds its valence electrons most tightly. (Al is below Mg because its 3p electron is higher in energy.)', 'periodic-table'],
      [1, 'A PES spectrum shows peaks with relative heights 2 : 2 : 6 : 2 : 1 (from highest to lowest binding energy). Which element is it?', ['Al', 'Mg', 'Si', 'Na'], '2 + 2 + 6 + 2 + 1 = 13 electrons: 1s² 2s² 2p⁶ 3s² 3p¹, which is aluminum.', 'pes'],
      [1, 'What is the ground-state electron configuration of Fe³⁺?', ['[Ar] 3d⁵', '[Ar] 4s² 3d³', '[Ar] 4s¹ 3d⁴', '[Ar] 3d⁶'], 'Fe is [Ar] 4s² 3d⁶. Transition metals lose 4s electrons first, then 3d: Fe³⁺ is [Ar] 3d⁵.', 'electron-config'],
      [1, 'An element has two isotopes: mass 10.0 (20%) and mass 11.0 (80%). Its average atomic mass is closest to', ['10.8', '10.5', '10.2', '11.0'], '(10.0)(0.20) + (11.0)(0.80) = 10.8, which matches boron.', 'mass-spec'],
      [1, 'Which atom has the smallest atomic radius?', ['Cl', 'S', 'Mg', 'Na'], 'Radius decreases across a period as effective nuclear charge increases.', 'periodic-table'],
      [1, 'What is the mass percent of oxygen in water (H₂O)?', ['88.8%', '11.2%', '50.0%', '66.7%'], '16.00 / 18.02 × 100% = 88.8%.', 'moles'],
      [1, 'Why is the first ionization energy of O lower than that of N?', ['Electron–electron repulsion in a doubly occupied 2p orbital', 'O has a smaller nuclear charge', 'O’s valence electrons are in a higher shell', 'N has more shielding'], 'O’s fourth 2p electron must pair with another, and the added repulsion makes it easier to remove.', 'periodic-table'],
      [2, 'Which molecule has a trigonal pyramidal molecular geometry?', ['NH₃', 'BF₃', 'CH₄', 'SO₃'], 'NH₃ has 4 electron domains (3 bonds + 1 lone pair): tetrahedral electron geometry, trigonal pyramidal shape.', 'vsepr'],
      [2, 'What is the hybridization of carbon in CO₂?', ['sp', 'sp²', 'sp³', 'sp³d'], 'C has 2 electron domains (two double bonds), so it is sp hybridized and linear.', 'vsepr'],
      [2, 'Which bond is the most polar?', ['H–F', 'H–Cl', 'H–Br', 'C–H'], 'F has the largest electronegativity, so ΔEN for H–F (1.78) is the largest.', 'bond-types'],
      [2, 'How many σ and π bonds are in ethene, C₂H₄?', ['5 σ, 1 π', '4 σ, 2 π', '6 σ, 0 π', '5 σ, 2 π'], 'Four C–H bonds + one C–C σ bond = 5 σ; the C=C double bond adds 1 π bond.', 'lewis'],
      [2, 'In a Lewis structure of NO₃⁻ with one N=O double bond, what is the formal charge on N?', ['+1', '0', '−1', '+2'], 'N: 5 valence − 0 nonbonding − ½(8 bonding) = +1.', 'lewis'],
      [2, 'Which molecule is nonpolar even though it contains polar bonds?', ['CCl₄', 'NH₃', 'H₂O', 'CH₂Cl₂'], 'In tetrahedral CCl₄ the four identical bond dipoles cancel.', 'vsepr'],
      [2, 'Which solid conducts electricity in the solid state?', ['Cu', 'NaCl', 'SiO₂', 'I₂'], 'Metals have delocalized electrons. Ionic solids conduct only when melted or dissolved.', 'solids'],
      [2, 'MgO has a much larger lattice energy than NaF mainly because', ['its ions have larger charges (2+, 2−)', 'its ions are much larger', 'it is a covalent network solid', 'Mg is more electronegative than Na'], 'Coulomb’s law: attraction ∝ q₁q₂/r. Doubling both charges quadruples the attraction.', 'solids'],
      [3, 'Which substance has the highest boiling point?', ['H₂O', 'H₂S', 'H₂Se', 'CH₄'], 'Water forms extensive hydrogen bonds, giving it a far higher boiling point than the heavier H₂S and H₂Se.', 'imf'],
      [3, 'n-Pentane (36 °C) boils higher than neopentane (9.5 °C) because n-pentane', ['has more surface contact, so stronger London dispersion forces', 'has hydrogen bonding', 'has more electrons', 'is more polar'], 'Same formula and electron count, but the straight chain allows more contact between molecules.', 'imf'],
      [3, 'Which intermolecular force is present between ALL molecules?', ['London dispersion forces', 'Dipole–dipole forces', 'Hydrogen bonding', 'Ion–dipole forces'], 'Every molecule has electrons that can form temporary dipoles.', 'imf'],
      [3, 'Why does I₂ (184 °C) boil higher than H₂O (100 °C)?', ['I₂ has many more electrons, so its LDFs are very strong', 'I₂ forms hydrogen bonds', 'I₂ is polar', 'Water has only LDFs'], 'I₂ has 106 electrons; its highly polarizable electron cloud gives LDFs stronger than water’s hydrogen bonds.', 'imf'],
      [3, 'At the same temperature, which gas has the highest average molecular speed?', ['He', 'N₂', 'O₂', 'CO₂'], 'All have the same average kinetic energy, so the lightest molecules move fastest (u ∝ 1/√M).', 'maxwell'],
      [3, 'Real gases deviate most from ideal behavior at', ['high pressure and low temperature', 'low pressure and high temperature', 'low pressure and low temperature', 'high temperature only'], 'At high P particle volume matters; at low T attractions matter.', 'gas-laws'],
      [3, 'If the concentration of a colored solution doubles, its absorbance', ['doubles', 'halves', 'stays the same', 'quadruples'], 'A = εbc: absorbance is directly proportional to concentration.', 'spectroscopy'],
      [3, 'Which type of radiation causes molecular vibrations?', ['Infrared', 'Microwave', 'Ultraviolet', 'X-ray'], 'IR matches the energies of bond vibrations; microwaves cause rotations; UV/visible cause electronic transitions.', 'spectroscopy'],
      [3, '50.0 mL of 2.0 M NaCl is diluted to 200.0 mL. The new concentration is', ['0.50 M', '1.0 M', '8.0 M', '0.25 M'], 'M₁V₁ = M₂V₂: (2.0)(50.0) = M₂(200.0) → 0.50 M.', 'solutions'],
      [3, 'What volume does 1.00 mol of an ideal gas occupy at 273 K and 1.00 atm?', ['22.4 L', '24.5 L', '1.00 L', '11.2 L'], 'V = nRT/P = (1.00)(0.08206)(273)/1.00 = 22.4 L.', 'gas-laws'],
      [4, 'What is the net ionic equation when AgNO₃(aq) and NaCl(aq) are mixed?', ['Ag⁺(aq) + Cl⁻(aq) → AgCl(s)', 'Na⁺(aq) + NO₃⁻(aq) → NaNO₃(s)', 'AgNO₃ + NaCl → AgCl + NaNO₃', 'No reaction'], 'AgCl is insoluble; Na⁺ and NO₃⁻ are spectator ions.', 'net-ionic'],
      [4, 'What is the oxidation number of Mn in KMnO₄?', ['+7', '+5', '+4', '+2'], 'K is +1 and each O is −2: +1 + x + 4(−2) = 0, so x = +7.', 'redox'],
      [4, 'In Zn(s) + Cu²⁺(aq) → Zn²⁺(aq) + Cu(s), the oxidizing agent is', ['Cu²⁺', 'Zn', 'Zn²⁺', 'Cu'], 'Cu²⁺ gains electrons (is reduced), so it oxidizes Zn.', 'redox'],
      [4, 'For 2H₂ + O₂ → 2H₂O, starting with 4 mol H₂ and 3 mol O₂, the limiting reactant is', ['H₂', 'O₂', 'H₂O', 'neither'], '4 mol H₂ needs only 2 mol O₂, so H₂ runs out first and 1 mol O₂ is left over.', 'stoichiometry'],
      [4, 'When C₃H₈ + O₂ → CO₂ + H₂O is balanced with smallest whole numbers, the coefficient of O₂ is', ['5', '3', '4', '7'], 'C₃H₈ + 5O₂ → 3CO₂ + 4H₂O.', 'balancer'],
      [4, 'Which of these is a chemical change?', ['Iron rusting', 'Ice melting', 'Sugar dissolving', 'Water boiling'], 'Rusting forms a new substance (iron oxide).', 'balancer'],
      [5, 'For a first-order reaction, which plot gives a straight line?', ['ln[A] vs. time', '[A] vs. time', '1/[A] vs. time', 'rate vs. time'], 'Integrated first-order law: ln[A] = ln[A]₀ − kt.', 'rate-laws'],
      [5, 'A first-order reaction has k = 0.0693 s⁻¹. Its half-life is', ['10.0 s', '0.0693 s', '6.93 s', '14.4 s'], 't½ = 0.693/k = 0.693/0.0693 = 10.0 s.', 'rate-laws'],
      [5, 'A catalyst increases the rate of a reaction by', ['providing a pathway with a lower activation energy', 'increasing ΔH', 'increasing the temperature', 'shifting equilibrium toward products'], 'Catalysts lower Eₐ for both directions; they do not change ΔH or K.', 'energy-profile'],
      [5, 'Doubling [A] quadruples the rate. The reaction is ___ order in A.', ['second', 'first', 'zero', 'fourth'], '2ⁿ = 4, so n = 2.', 'rate-laws'],
      [5, 'In a reaction mechanism, an intermediate is a species that', ['is produced in one step and consumed in a later step', 'is consumed and then regenerated', 'appears in the overall equation', 'speeds up the reaction'], 'A species consumed first and regenerated later is a catalyst; an intermediate is made first.', 'energy-profile'],
      [5, 'What are the units of k for a second-order reaction?', ['M⁻¹ s⁻¹', 's⁻¹', 'M s⁻¹', 'M⁻² s⁻¹'], 'rate (M/s) = k[A]² (M²), so k has units M⁻¹ s⁻¹.', 'rate-laws'],
      [5, 'Raising the temperature increases reaction rate mainly because', ['a larger fraction of collisions have energy ≥ Eₐ', 'Eₐ decreases', 'the reaction becomes more exothermic', 'particles get larger'], 'The Maxwell–Boltzmann distribution shifts so many more collisions exceed Eₐ.', 'collision'],
      [6, 'How much heat is needed to warm 10.0 g of water by 5.0 °C? (c = 4.18 J/g·°C)', ['209 J', '41.8 J', '20.9 J', '418 J'], 'q = mcΔT = (10.0)(4.18)(5.0) = 209 J.', 'calorimetry'],
      [6, 'Breaking chemical bonds is', ['always endothermic', 'always exothermic', 'endothermic only for ionic bonds', 'neither'], 'Energy must be added to separate bonded atoms.', 'enthalpy'],
      [6, 'While water boils at constant temperature, the added energy', ['overcomes intermolecular forces', 'raises the average kinetic energy', 'breaks O–H covalent bonds', 'is lost to the surroundings'], 'During a phase change temperature stays constant; energy increases potential energy by separating molecules.', 'heating-curve'],
      [6, 'If A → B has ΔH = −92 kJ, then 2B → 2A has ΔH =', ['+184 kJ', '−184 kJ', '+92 kJ', '−46 kJ'], 'Reversing flips the sign; doubling doubles ΔH.', 'enthalpy'],
      [6, 'What is ΔH°f of O₂(g)?', ['0 kJ/mol', '−393.5 kJ/mol', '+249 kJ/mol', '−285.8 kJ/mol'], 'Elements in their standard states have ΔH°f = 0.', 'enthalpy'],
      [6, 'A metal at 95 °C is dropped into water at 20 °C. At thermal equilibrium', ['both are at the same temperature', 'the metal is still hotter', 'the water is hotter than the metal', 'the metal gained heat'], 'Heat flows until temperatures are equal; q lost by metal = q gained by water.', 'calorimetry'],
      [7, 'If Q > K, the reaction will', ['shift left toward reactants', 'shift right toward products', 'stay at equilibrium', 'stop'], 'There are too many products relative to equilibrium, so the reverse reaction dominates.', 'equilibrium'],
      [7, 'For N₂ + 3H₂ ⇌ 2NH₃ (ΔH < 0), raising the temperature will', ['shift left and decrease K', 'shift right and increase K', 'shift left but not change K', 'have no effect'], 'For an exothermic reaction, heat acts as a product. Only temperature changes K.', 'le-chatelier'],
      [7, 'Decreasing the volume of 2NO₂(g) ⇌ N₂O₄(g) shifts the equilibrium', ['right, toward fewer moles of gas', 'left, toward more moles of gas', 'nowhere', 'right because K increases'], 'Higher pressure favors the side with fewer gas molecules (1 vs. 2).', 'le-chatelier'],
      [7, 'Adding a catalyst to a system at equilibrium', ['does not shift the equilibrium', 'shifts it toward products', 'increases K', 'shifts it toward reactants'], 'Forward and reverse rates increase equally.', 'le-chatelier'],
      [7, 'The Ksp of a salt AB is 1.6 × 10⁻⁹. Its molar solubility is', ['4.0 × 10⁻⁵ M', '1.6 × 10⁻⁹ M', '8.0 × 10⁻¹⁰ M', '1.3 × 10⁻³ M'], 'Ksp = s², so s = √(1.6 × 10⁻⁹) = 4.0 × 10⁻⁵ M.', 'ksp'],
      [7, 'Adding NaCl to a saturated AgCl solution makes the solubility of AgCl', ['decrease', 'increase', 'stay the same', 'become zero'], 'Cl⁻ is a common ion; the equilibrium shifts left.', 'ksp'],
      [8, 'What is the pH of 0.010 M HCl?', ['2.00', '1.00', '12.00', '0.010'], 'Strong acid: [H⁺] = 0.010 M, pH = −log(0.010) = 2.00.', 'ph'],
      [8, 'At the half-equivalence point of a weak acid–strong base titration,', ['pH = pKa', 'pH = 7', 'pH = 14 − pKa', '[HA] = 0'], 'Half the HA has become A⁻, so [HA] = [A⁻] and log(1) = 0.', 'titration'],
      [8, 'The equivalence point of CH₃COOH titrated with NaOH is', ['above pH 7', 'exactly pH 7', 'below pH 7', 'at pH = pKa'], 'Only CH₃COO⁻ remains, and it is a weak base.', 'titration'],
      [8, 'Which is the strongest acid?', ['HClO₄', 'HClO₃', 'HClO₂', 'HClO'], 'More O atoms withdraw electron density and stabilize the conjugate base.', 'ph'],
      [8, 'A buffer contains equal moles of CH₃COOH and CH₃COO⁻ (pKa 4.74). Its pH is', ['4.74', '7.00', '9.26', '2.37'], 'pH = pKa + log(1) = pKa.', 'buffers'],
      [8, 'A solution has [OH⁻] = 1.0 × 10⁻³ M at 25 °C. Its pH is', ['11.00', '3.00', '7.00', '10.00'], 'pOH = 3.00, pH = 14.00 − 3.00 = 11.00.', 'ph'],
      [9, 'A process with ΔH > 0 and ΔS > 0 is thermodynamically favored', ['only at high temperature', 'at all temperatures', 'only at low temperature', 'never'], 'ΔG = ΔH − TΔS becomes negative once TΔS exceeds ΔH.', 'gibbs'],
      [9, 'If ΔG° < 0 for a reaction, then', ['K > 1', 'K < 1', 'K = 1', 'K = 0'], 'ΔG° = −RT ln K: a negative ΔG° means ln K > 0.', 'gibbs'],
      [9, 'In a galvanic cell, oxidation occurs at the', ['anode', 'cathode', 'salt bridge', 'voltmeter'], '“An Ox, Red Cat”: oxidation at the anode, reduction at the cathode.', 'galvanic'],
      [9, 'Using E°(Cu²⁺/Cu) = +0.34 V and E°(Zn²⁺/Zn) = −0.76 V, E°cell for a Zn–Cu cell is', ['+1.10 V', '−1.10 V', '+0.42 V', '+0.76 V'], 'E°cell = E°cathode − E°anode = 0.34 − (−0.76) = +1.10 V.', 'galvanic'],
      [9, 'Which process has ΔS < 0?', ['N₂(g) + 3H₂(g) → 2NH₃(g)', 'H₂O(l) → H₂O(g)', 'CaCO₃(s) → CaO(s) + CO₂(g)', 'NaCl(s) → Na⁺(aq) + Cl⁻(aq)'], '4 mol of gas become 2 mol of gas.', 'gibbs'],
      [9, 'Passing 9,650 C of charge through Ag⁺(aq) deposits how much silver?', ['0.100 mol', '1.00 mol', '0.0500 mol', '0.200 mol'], '9,650 C ÷ 96,485 C/mol = 0.100 mol e⁻; Ag⁺ + e⁻ → Ag, so 0.100 mol Ag.', 'galvanic'],
    ];
    let unit = 'all', order = [], idx = 0, score = 0, answered = 0, picked = null;
    const best = U.store.get('quizBest', {});
    const segU = U.seg({ options: [{ value: 'all', label: 'All units' }].concat([1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => ({ value: n, label: 'Unit ' + n }))), value: unit, onChange: v => { unit = v; start(); } });
    const card = h('div');
    el.append(U.panel(null, h('div', { class: 'flex-between' }, segU.el, h('span', { class: 'small muted', id: 'qzBest' }))), card);
    function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
    function start() {
      order = shuffle(Q.map((q, i) => i).filter(i => unit === 'all' || Q[i][0] === unit));
      idx = 0; score = 0; answered = 0; picked = null;
      document.getElementById('qzBest').textContent = best[unit] != null ? `Best score: ${best[unit]}%` : '';
      show();
    }
    let opts = [];
    function show() {
      U.clear(card);
      if (idx >= order.length) {
        const pct = Math.round(score / order.length * 100);
        if (best[unit] == null || pct > best[unit]) { best[unit] = pct; U.store.set('quizBest', best); }
        card.appendChild(h('div', { class: 'q-card' }, h('h2', null, `You scored ${score} / ${order.length} (${pct}%)`),
          h('p', { class: 'muted' }, pct >= 80 ? 'Excellent work. You are ready for this material.' : pct >= 60 ? 'Solid. Review the explanations for the ones you missed.' : 'Keep practicing. Open the linked tools to see each idea visually.'),
          h('div', { class: 'row' }, U.btn('Try again', start, 'primary'))));
        return;
      }
      const q = Q[order[idx]];
      if (picked === null) opts = shuffle(q[2].map((t, i) => ({ t, right: i === 0 })));
      const prog = h('div', { class: 'progress' }, h('i', { style: { width: (idx / order.length * 100) + '%' } }));
      const m = App.byId[q[4]];
      const box = h('div', { class: 'q-card' }, h('div', { class: 'flex-between' }, h('span', { class: 'eyebrow', style: { color: `var(--u${q[0]})` } }, `Unit ${q[0]} · Question ${idx + 1} of ${order.length}`), h('span', { class: 'small mono' }, `Score ${score}/${answered}`)), prog,
        h('h3', { style: { fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '1.08rem' } }, q[1]),
        h('div', { class: 'q-opts' }, opts.map((o, i) => {
          const b = h('button', { type: 'button', class: 'q-opt' + (picked !== null ? (o.right ? ' right' : picked === i ? ' wrong' : '') : ''), disabled: picked !== null }, h('span', { class: 'letter' }, 'ABCD'[i]), h('span', null, o.t));
          b.addEventListener('click', () => { picked = i; answered++; if (o.right) score++; show(); });
          return b;
        })));
      if (picked !== null) {
        box.append(U.callout((opts[picked].right ? '<b>Correct.</b> ' : '<b>Not quite.</b> ') + q[3], opts[picked].right ? 'good' : 'bad'),
          h('div', { class: 'row' }, U.btn(idx + 1 < order.length ? 'Next question →' : 'See results', () => { idx++; picked = null; show(); }, 'primary'), m ? h('a', { class: 'btn', href: '#' + m.id }, 'Open “' + m.title + '”') : null));
      }
      card.appendChild(box);
    }
    start();
  },
});
