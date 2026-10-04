# Valence

**AP Chemistry, visualized.** Named for valence electrons, the idea behind almost every tool here.

Interactive visualizations for every unit of the AP Chemistry course: 38 tools covering all 9 units, plus a reference sheet and a practice quiz. Each topic page lists the key ideas for the AP exam next to the interactive model.

No install, no build step, no internet needed (except for web fonts).

## Open it

- **Easiest:** download [`dist/valence.html`](dist/valence.html) and double-click it. It is one self-contained file.
- **From the source:** open `index.html` in any modern browser.
- **Host it:** in the GitHub repo go to *Settings → Pages*, choose *Deploy from a branch*, pick your branch and the `/ (root)` folder. The site appears at `https://<user>.github.io/<repo>/`.

Press <kbd>/</kbd> to search topics. Use the moon/sun button for dark mode. Every topic has a direct link such as `index.html#imf` or `index.html#titration`.

## What's inside

| Unit | Tools |
| --- | --- |
| 1 Atomic Structure | Moles & molar mass · Mass spectrometry · Periodic table & trends · Electron configurations · Photoelectron spectroscopy (PES) · Coulomb's law & shell model |
| 2 Compound Structure | Bond types & electronegativity · Potential-energy curves · Ionic/metallic/network solids & lattice energy · Lewis structures (step-by-step, formal charge, resonance, type your own) · VSEPR 3D viewer (all 13 shapes, multi-center molecules, hybridization, polarity, type your own) |
| 3 IMFs & Properties | Intermolecular forces (animated forces, particle simulation, boiling-point comparisons, trends) · Phase diagrams & vapor pressure · Gas laws & KMT · Maxwell–Boltzmann · Solutions & chromatography · Spectroscopy, photoelectric effect & Beer's law |
| 4 Chemical Reactions | Equation balancer & reaction types · Precipitation & net ionic equations · Stoichiometry & limiting reactant · Oxidation numbers, redox & half-reaction balancer |
| 5 Kinetics | Collision theory simulation · Rate laws, half-life & initial rates · Energy profiles, mechanisms & catalysis |
| 6 Thermodynamics | Heating curves · Calorimetry · Bond enthalpy, ΔH°f & Hess's law puzzles |
| 7 Equilibrium | Dynamic equilibrium & Q vs K · Le Châtelier's principle · ICE tables & Kp/Kc · Ksp, common ion & precipitation |
| 8 Acids & Bases | pH scale, strong vs weak, structure & acid strength · Titration curves (strong, weak, polyprotic, indicators) · Buffers, speciation & buffer design |
| 9 Applications of Thermodynamics | Entropy & Gibbs free energy (ΔG vs T, ΔG° ↔ K, coupling) · Electrochemical cells (galvanic, Nernst, electrolysis & Faraday's law) |
| Study tools | Reference sheet (equations, constants, ions, solubility rules, indicators, Ka/Kb) · Practice quiz (60+ questions with explanations) |

### Try your own molecules

Type a formula into the Lewis, VSEPR or IMF tools and the app builds the molecule itself: it counts valence electrons, completes octets, forms multiple bonds where needed, minimizes formal charges on expanded-octet atoms and finds resonance forms. It accepts:

- one-central-atom formulas and ions: `PF5`, `XeO3`, `SO3^2-`, `NH4+`, oxyacids like `H2SO4` and `HNO3`
- condensed organic formulas: `CH3CH2OH`, `CH3COOH`, `(CH3)2CHOH`, `CH3(CH2)2CH3`, `CH2=CH2`
- straight-chain hydrocarbons from a molecular formula: `C3H8`, `C3H6`
- single atoms and monatomic ions as Lewis dot symbols: `N`, `Cl-`

Molecules with several central atoms get a 3D model too. In the IMF tools your molecule's boiling point is estimated from its electron count, polarity and hydrogen bonding, or measured data is used if the substance is in the built-in list. Other tools take your own input as well: any reaction for stoichiometry and bond-enthalpy ΔH, any gas for Maxwell–Boltzmann, any Ka/Kb for titrations and pH, and any ionic compound for Ksp and net ionic equations.

The calculators do real chemistry, not lookups: equations are balanced with exact rational linear algebra, redox half-reactions are balanced in acid or base, pH comes from a full charge-balance solve (so titration curves, buffers and very dilute acids come out right), and equilibrium shifts are solved numerically from K.

## Project layout

```
index.html            app shell; loads every script in order
css/style.css         design tokens (light + dark) and components
js/core.js            module registry, DOM/control helpers, canvas + plotting
js/data/              periodic table, molecule library, and the formula → structure builder
js/modules/u1-*.js …  one file per topic, grouped by unit
js/app.js             navigation, search, routing, home page
tools/build.mjs       bundles everything into dist/*.html
```

### Adding a topic

Create `js/modules/uN-name.js`, add a `<script>` tag for it in `index.html` (before `js/app.js`), and register it:

```js
App.register({
  id: 'my-topic', unit: 5, sym: 'Mt', title: 'My Topic',
  desc: 'One-line description.', tags: ['search', 'words'],
  keyIdeas: ['What students should remember.'],
  render(el, scope) { /* build UI inside el; animate with scope.loop(dt => ...) */ },
});
```

Then rebuild the single-file version with `node tools/build.mjs`.

### Checking for errors

`tools/check.mjs` opens every topic and every tab in headless Chromium, drives each slider, select, checkbox and button, and reports console errors, `NaN`/`undefined` text and horizontal overflow:

```
npm i -D playwright && npx playwright install chromium
node tools/check.mjs            # desktop width
node tools/check.mjs 390        # phone width
```
