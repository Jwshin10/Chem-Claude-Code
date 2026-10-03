# AP Chem Visualizer

Interactive visualizations for every unit of the AP Chemistry course: 38 tools covering all 9 units, plus a reference sheet and a practice quiz. Each topic page lists the key ideas for the AP exam next to the interactive model.

No install, no build step, no internet needed (except for web fonts).

## Open it

- **Easiest:** download [`dist/ap-chem-visualizer.html`](dist/ap-chem-visualizer.html) and double-click it. It is one self-contained file.
- **From the source:** open `index.html` in any modern browser.
- **Host it:** in the GitHub repo go to *Settings → Pages*, choose *Deploy from a branch*, pick your branch and the `/ (root)` folder. The site appears at `https://<user>.github.io/<repo>/`.

Press <kbd>/</kbd> to search topics. Use the moon/sun button for dark mode. Every topic has a direct link such as `index.html#imf` or `index.html#titration`.

## What's inside

| Unit | Tools |
| --- | --- |
| 1 Atomic Structure | Moles & molar mass · Mass spectrometry · Periodic table & trends · Electron configurations · Photoelectron spectroscopy (PES) · Coulomb's law & shell model |
| 2 Compound Structure | Bond types & electronegativity · Potential-energy curves · Ionic/metallic/network solids & lattice energy · Lewis structures (step-by-step, formal charge, resonance) · VSEPR 3D viewer (all 13 shapes, hybridization, polarity) |
| 3 IMFs & Properties | Intermolecular forces (animated forces, particle simulation, boiling-point comparisons, trends) · Phase diagrams & vapor pressure · Gas laws & KMT · Maxwell–Boltzmann · Solutions & chromatography · Spectroscopy, photoelectric effect & Beer's law |
| 4 Chemical Reactions | Equation balancer & reaction types · Precipitation & net ionic equations · Stoichiometry & limiting reactant · Oxidation numbers, redox & half-reaction balancer |
| 5 Kinetics | Collision theory simulation · Rate laws, half-life & initial rates · Energy profiles, mechanisms & catalysis |
| 6 Thermodynamics | Heating curves · Calorimetry · Bond enthalpy, ΔH°f & Hess's law puzzles |
| 7 Equilibrium | Dynamic equilibrium & Q vs K · Le Châtelier's principle · ICE tables & Kp/Kc · Ksp, common ion & precipitation |
| 8 Acids & Bases | pH scale, strong vs weak, structure & acid strength · Titration curves (strong, weak, polyprotic, indicators) · Buffers, speciation & buffer design |
| 9 Applications of Thermodynamics | Entropy & Gibbs free energy (ΔG vs T, ΔG° ↔ K, coupling) · Electrochemical cells (galvanic, Nernst, electrolysis & Faraday's law) |
| Study tools | Reference sheet (equations, constants, ions, solubility rules, indicators, Ka/Kb) · Practice quiz (60+ questions with explanations) |

The calculators do real chemistry, not lookups: equations are balanced with exact rational linear algebra, redox half-reactions are balanced in acid or base, pH comes from a full charge-balance solve (so titration curves, buffers and very dilute acids come out right), and equilibrium shifts are solved numerically from K.

## Project layout

```
index.html            app shell; loads every script in order
css/style.css         design tokens (light + dark) and components
js/core.js            module registry, DOM/control helpers, canvas + plotting
js/data/              periodic table and molecule library (Lewis/VSEPR data)
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
