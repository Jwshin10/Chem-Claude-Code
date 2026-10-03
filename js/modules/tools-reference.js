'use strict';
App.register({
  id: 'reference', unit: 0, sym: 'Rf', title: 'Reference Sheet',
  desc: 'AP equations and constants, polyatomic ions, solubility rules, strong acids and bases, indicators and Ka/Kb values.',
  tags: ['formula sheet', 'equations', 'constants', 'polyatomic ions', 'solubility rules', 'strong acids', 'strong bases', 'indicators', 'ka', 'kb', 'reference', 'cheat sheet'],
  keyIdeas: [],
  render(el, scope) {
    const h = U.h;
    U.tabs(el, [
      { label: 'Equations & constants', render: eqs },
      { label: 'Polyatomic ions', render: poly },
      { label: 'Acids, bases & solubility', render: acids },
    ], scope, { key: 'reference' });

    function eqs(b) {
      const G = [
        ['Atomic structure & light', [['E = hν', 'energy of a photon'], ['c = λν', 'wave speed'], ['n = m / M', 'moles from mass']]],
        ['Gases, liquids & solutions', [['PV = nRT', 'ideal gas law'], ['P<sub>A</sub> = P<sub>total</sub> × X<sub>A</sub>', 'Dalton’s law (X = mole fraction)'], ['P<sub>total</sub> = P<sub>A</sub> + P<sub>B</sub> + …', 'sum of partial pressures'], ['KE = ½mv²', 'kinetic energy'], ['M = n<sub>solute</sub> / L<sub>solution</sub>', 'molarity'], ['A = εbc', 'Beer–Lambert law'], ['D = m / V', 'density']]],
        ['Kinetics', [['[A]<sub>t</sub> − [A]<sub>0</sub> = −kt', 'zero order'], ['ln[A]<sub>t</sub> − ln[A]<sub>0</sub> = −kt', 'first order'], ['1/[A]<sub>t</sub> − 1/[A]<sub>0</sub> = kt', 'second order'], ['t<sub>½</sub> = 0.693 / k', 'first-order half-life']]],
        ['Thermodynamics & electrochemistry', [['q = mcΔT', 'heat'], ['ΔS° = ΣS°<sub>products</sub> − ΣS°<sub>reactants</sub>', ''], ['ΔH° = ΣΔH°<sub>f</sub>(products) − ΣΔH°<sub>f</sub>(reactants)', ''], ['ΔG° = ΣΔG°<sub>f</sub>(products) − ΣΔG°<sub>f</sub>(reactants)', ''], ['ΔG° = ΔH° − TΔS°', ''], ['ΔG° = −RT ln K', ''], ['ΔG° = −nFE°', ''], ['I = q / t', 'current'], ['E<sub>cell</sub> = E°<sub>cell</sub> − (RT/nF) ln Q', 'Nernst equation']]],
        ['Equilibrium & acids/bases', [['K<sub>c</sub> = [C]<sup>c</sup>[D]<sup>d</sup> / [A]<sup>a</sup>[B]<sup>b</sup>', 'for aA + bB ⇌ cC + dD'], ['K<sub>p</sub> = (P<sub>C</sub>)<sup>c</sup>(P<sub>D</sub>)<sup>d</sup> / (P<sub>A</sub>)<sup>a</sup>(P<sub>B</sub>)<sup>b</sup>', ''], ['K<sub>a</sub> = [H⁺][A⁻] / [HA]', ''], ['K<sub>b</sub> = [OH⁻][HB⁺] / [B]', ''], ['K<sub>w</sub> = [H⁺][OH⁻] = 1.0 × 10⁻¹⁴ at 25 °C', ''], ['K<sub>w</sub> = K<sub>a</sub> × K<sub>b</sub>', 'conjugate pair'], ['pH = −log[H⁺], pOH = −log[OH⁻]', ''], ['14 = pH + pOH', 'at 25 °C'], ['pH = pK<sub>a</sub> + log([A⁻]/[HA])', 'Henderson–Hasselbalch'], ['pK<sub>a</sub> = −log K<sub>a</sub>, pK<sub>b</sub> = −log K<sub>b</sub>', '']]],
      ];
      const C = [['Avogadro’s number', 'N<sub>A</sub> = 6.022 × 10²³ mol⁻¹'], ['Gas constant', 'R = 8.314 J/(mol·K) = 0.08206 L·atm/(mol·K) = 62.36 L·torr/(mol·K)'], ['Planck’s constant', 'h = 6.626 × 10⁻³⁴ J·s'], ['Speed of light', 'c = 2.998 × 10⁸ m/s'], ['Faraday’s constant', 'F = 96,485 C/mol e⁻'], ['Pressure', '1 atm = 760 mm Hg = 760 torr = 101.325 kPa'], ['STP', '0 °C (273.15 K) and 1 atm'], ['Specific heat of water', '4.18 J/(g·°C)'], ['Temperature', 'K = °C + 273.15']];
      b.append(h('div', { class: 'grid2' }, ...G.map(([t, list]) => U.panel(t, U.table(['Equation', 'Meaning'], list))), U.panel('Constants & conversions', U.table(['Quantity', 'Value'], C))));
    }

    function poly(b) {
      const IONS = [['NH4^+', 'ammonium'], ['H3O^+', 'hydronium'], ['Hg2^2+', 'mercury(I)'], ['OH^-', 'hydroxide'], ['NO3^-', 'nitrate'], ['NO2^-', 'nitrite'], ['CN^-', 'cyanide'], ['SCN^-', 'thiocyanate'], ['MnO4^-', 'permanganate'], ['CH3COO^-', 'acetate'], ['HCO3^-', 'hydrogen carbonate (bicarbonate)'], ['HSO4^-', 'hydrogen sulfate'], ['H2PO4^-', 'dihydrogen phosphate'],
        ['ClO^-', 'hypochlorite'], ['ClO2^-', 'chlorite'], ['ClO3^-', 'chlorate'], ['ClO4^-', 'perchlorate'], ['CO3^2-', 'carbonate'], ['SO4^2-', 'sulfate'], ['SO3^2-', 'sulfite'], ['S2O3^2-', 'thiosulfate'], ['CrO4^2-', 'chromate'], ['Cr2O7^2-', 'dichromate'], ['C2O4^2-', 'oxalate'], ['HPO4^2-', 'hydrogen phosphate'], ['O2^2-', 'peroxide'], ['PO4^3-', 'phosphate']];
      const q = U.textInput({ placeholder: 'Filter ions…', onInput: v => draw(v) });
      const box = h('div');
      b.append(U.panel('Common polyatomic ions', q.el, box));
      function draw(f = '') {
        U.clear(box);
        const rows = IONS.filter(([a, n]) => !f || (a + n).toLowerCase().includes(f.toLowerCase())).map(([a, n]) => [U.chem(a), n]);
        box.appendChild(U.table(['Ion', 'Name'], rows));
      }
      draw();
    }

    function acids(b) {
      b.append(h('div', { class: 'grid2' },
        U.panel('Strong acids (ionize completely)', U.table(['Formula', 'Name'], [['HCl', 'hydrochloric'], ['HBr', 'hydrobromic'], ['HI', 'hydroiodic'], ['HNO<sub>3</sub>', 'nitric'], ['HClO<sub>4</sub>', 'perchloric'], ['HClO<sub>3</sub>', 'chloric'], ['H<sub>2</sub>SO<sub>4</sub>', 'sulfuric (first proton)']])),
        U.panel('Strong bases (dissociate completely)', U.table(['Formula', 'Note'], [['LiOH, NaOH, KOH, RbOH, CsOH', 'group 1 hydroxides'], ['Ca(OH)<sub>2</sub>, Sr(OH)<sub>2</sub>, Ba(OH)<sub>2</sub>', 'heavier group 2 hydroxides']]),
          h('p', { class: 'small muted' }, 'Other bases such as NH₃ and amines are weak bases.')),
        U.panel('Solubility rules', U.table(['Always soluble', 'Notes'], [['Na⁺, K⁺, NH₄⁺ (all group 1) compounds', 'required on the AP exam'], ['NO₃⁻ (nitrate) compounds', 'required on the AP exam'], ['Cl⁻, Br⁻, I⁻ compounds', 'except Ag⁺, Pb²⁺, Hg₂²⁺'], ['SO₄²⁻ compounds', 'except Ba²⁺, Pb²⁺, Ca²⁺, Sr²⁺, Ag⁺'], ['CO₃²⁻, PO₄³⁻, S²⁻, OH⁻', 'mostly insoluble unless with group 1 or NH₄⁺']])),
        U.panel('Acid–base indicators', U.table(['Indicator', 'pH range', 'Color change'], [['Methyl orange', '3.1–4.4', 'red → yellow'], ['Methyl red', '4.4–6.2', 'red → yellow'], ['Bromothymol blue', '6.0–7.6', 'yellow → blue'], ['Phenol red', '6.8–8.4', 'yellow → red'], ['Phenolphthalein', '8.2–10.0', 'colorless → pink']])),
        U.panel('Common K<sub>a</sub> and K<sub>b</sub> values (25 °C)', U.table(['Species', 'K', 'pK'], [['HF', '6.8 × 10⁻⁴', '3.17'], ['HNO₂', '4.5 × 10⁻⁴', '3.35'], ['CH₃COOH', '1.8 × 10⁻⁵', '4.74'], ['H₂CO₃ (Ka1)', '4.3 × 10⁻⁷', '6.37'], ['HClO', '3.0 × 10⁻⁸', '7.52'], ['NH₄⁺', '5.6 × 10⁻¹⁰', '9.25'], ['HCN', '6.2 × 10⁻¹⁰', '9.21'], ['NH₃ (Kb)', '1.8 × 10⁻⁵', '4.74'], ['CH₃NH₂ (Kb)', '4.4 × 10⁻⁴', '3.36']], { num: [1, 2] }))));
    }
  },
});
