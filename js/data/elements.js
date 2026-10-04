/* Periodic table data. Columns: Z|Sym|Name|Mass|Pauling EN|Covalent radius (pm)|1st IE (kJ/mol)|Electron affinity (kJ/mol, energy released) */
'use strict';
const ELEMENTS = (() => {
  const raw = `1|H|Hydrogen|1.008|2.20|31|1312|73
2|He|Helium|4.0026||28|2372|0
3|Li|Lithium|6.94|0.98|128|520|60
4|Be|Beryllium|9.0122|1.57|96|900|0
5|B|Boron|10.81|2.04|84|801|27
6|C|Carbon|12.011|2.55|76|1086|122
7|N|Nitrogen|14.007|3.04|71|1402|0
8|O|Oxygen|15.999|3.44|66|1314|141
9|F|Fluorine|18.998|3.98|57|1681|328
10|Ne|Neon|20.180||58|2081|0
11|Na|Sodium|22.990|0.93|166|496|53
12|Mg|Magnesium|24.305|1.31|141|738|0
13|Al|Aluminum|26.982|1.61|121|578|42
14|Si|Silicon|28.085|1.90|111|787|134
15|P|Phosphorus|30.974|2.19|107|1012|72
16|S|Sulfur|32.06|2.58|105|1000|200
17|Cl|Chlorine|35.45|3.16|102|1251|349
18|Ar|Argon|39.948||106|1521|0
19|K|Potassium|39.098|0.82|203|419|48
20|Ca|Calcium|40.078|1.00|176|590|2
21|Sc|Scandium|44.956|1.36|170|633|18
22|Ti|Titanium|47.867|1.54|160|659|8
23|V|Vanadium|50.942|1.63|153|651|51
24|Cr|Chromium|51.996|1.66|139|653|65
25|Mn|Manganese|54.938|1.55|139|717|0
26|Fe|Iron|55.845|1.83|132|763|15
27|Co|Cobalt|58.933|1.88|126|760|64
28|Ni|Nickel|58.693|1.91|124|737|112
29|Cu|Copper|63.546|1.90|132|746|119
30|Zn|Zinc|65.38|1.65|122|906|0
31|Ga|Gallium|69.723|1.81|122|579|41
32|Ge|Germanium|72.630|2.01|120|762|119
33|As|Arsenic|74.922|2.18|119|947|78
34|Se|Selenium|78.971|2.55|120|941|195
35|Br|Bromine|79.904|2.96|120|1140|325
36|Kr|Krypton|83.798|3.00|116|1351|0
37|Rb|Rubidium|85.468|0.82|220|403|47
38|Sr|Strontium|87.62|0.95|195|550|5
39|Y|Yttrium|88.906|1.22|190|600|30
40|Zr|Zirconium|91.224|1.33|175|640|41
41|Nb|Niobium|92.906|1.6|164|652|86
42|Mo|Molybdenum|95.95|2.16|154|684|72
43|Tc|Technetium|98|1.9|147|702|53
44|Ru|Ruthenium|101.07|2.2|146|710|101
45|Rh|Rhodium|102.91|2.28|142|720|110
46|Pd|Palladium|106.42|2.20|139|804|54
47|Ag|Silver|107.87|1.93|145|731|126
48|Cd|Cadmium|112.41|1.69|144|868|0
49|In|Indium|114.82|1.78|142|558|37
50|Sn|Tin|118.71|1.96|139|709|107
51|Sb|Antimony|121.76|2.05|139|834|101
52|Te|Tellurium|127.60|2.1|138|869|190
53|I|Iodine|126.90|2.66|139|1008|295
54|Xe|Xenon|131.29|2.6|140|1170|0
55|Cs|Cesium|132.91|0.79|244|376|46
56|Ba|Barium|137.33|0.89|215|503|14
57|La|Lanthanum|138.91|1.10|207|538|48
58|Ce|Cerium|140.12|1.12|204|534|50
59|Pr|Praseodymium|140.91|1.13|203|527|
60|Nd|Neodymium|144.24|1.14|201|533|
61|Pm|Promethium|145|1.13|199|540|
62|Sm|Samarium|150.36|1.17|198|545|
63|Eu|Europium|151.96|1.2|198|547|
64|Gd|Gadolinium|157.25|1.2|196|593|
65|Tb|Terbium|158.93|1.1|194|566|
66|Dy|Dysprosium|162.50|1.22|192|573|
67|Ho|Holmium|164.93|1.23|192|581|
68|Er|Erbium|167.26|1.24|189|589|
69|Tm|Thulium|168.93|1.25|190|597|
70|Yb|Ytterbium|173.05|1.1|187|603|
71|Lu|Lutetium|174.97|1.27|187|524|
72|Hf|Hafnium|178.49|1.3|175|659|0
73|Ta|Tantalum|180.95|1.5|170|761|31
74|W|Tungsten|183.84|2.36|162|770|79
75|Re|Rhenium|186.21|1.9|151|760|14
76|Os|Osmium|190.23|2.2|144|840|104
77|Ir|Iridium|192.22|2.20|141|880|151
78|Pt|Platinum|195.08|2.28|136|870|205
79|Au|Gold|196.97|2.54|136|890|223
80|Hg|Mercury|200.59|2.00|132|1007|0
81|Tl|Thallium|204.38|1.62|145|589|36
82|Pb|Lead|207.2|2.33|146|716|35
83|Bi|Bismuth|208.98|2.02|148|703|91
84|Po|Polonium|209|2.0|140|812|183
85|At|Astatine|210|2.2|150|899|270
86|Rn|Radon|222|2.2|150|1037|0
87|Fr|Francium|223|0.7|260|393|47
88|Ra|Radium|226|0.9|221|509|10
89|Ac|Actinium|227|1.1|215|499|
90|Th|Thorium|232.04|1.3|206|587|
91|Pa|Protactinium|231.04|1.5|200|568|
92|U|Uranium|238.03|1.38|196|598|
93|Np|Neptunium|237|1.36|190|605|
94|Pu|Plutonium|244|1.28|187|585|
95|Am|Americium|243|1.3|180|578|
96|Cm|Curium|247|1.3|169|581|
97|Bk|Berkelium|247|1.3||601|
98|Cf|Californium|251|1.3||608|
99|Es|Einsteinium|252|1.3||619|
100|Fm|Fermium|257|1.3||627|
101|Md|Mendelevium|258|1.3||635|
102|No|Nobelium|259|1.3||642|
103|Lr|Lawrencium|266|1.3||470|
104|Rf|Rutherfordium|267||||
105|Db|Dubnium|268||||
106|Sg|Seaborgium|269||||
107|Bh|Bohrium|270||||
108|Hs|Hassium|277||||
109|Mt|Meitnerium|278||||
110|Ds|Darmstadtium|281||||
111|Rg|Roentgenium|282||||
112|Cn|Copernicium|285||||
113|Nh|Nihonium|286||||
114|Fl|Flerovium|289||||
115|Mc|Moscovium|290||||
116|Lv|Livermorium|293||||
117|Ts|Tennessine|294||||
118|Og|Oganesson|294||||`;

  const num = s => (s === '' || s == null ? null : +s);
  const list = raw.split('\n').map(line => {
    const [Z, sym, name, mass, en, r, ie, ea] = line.split('|');
    return { Z: +Z, sym, name, mass: +mass, en: num(en), radius: num(r), ie: num(ie), ea: num(ea) };
  });

  const starts = [1, 3, 11, 19, 37, 55, 87, 119];
  const CAT = {
    alkali: [3, 11, 19, 37, 55, 87], alkaline: [4, 12, 20, 38, 56, 88],
    metalloid: [5, 14, 32, 33, 51, 52], halogen: [9, 17, 35, 53, 85, 117],
    noble: [2, 10, 18, 36, 54, 86, 118], nonmetal: [1, 6, 7, 8, 15, 16, 34],
    post: [13, 31, 49, 50, 81, 82, 83, 84, 113, 114, 115, 116],
  };
  const CAT_NAMES = {
    alkali: 'Alkali metal', alkaline: 'Alkaline earth metal', transition: 'Transition metal', post: 'Post-transition metal',
    metalloid: 'Metalloid', nonmetal: 'Nonmetal', halogen: 'Halogen', noble: 'Noble gas', lanthanide: 'Lanthanide', actinide: 'Actinide',
  };
  const CAT_COLORS = {
    alkali: '#f07b6c', alkaline: '#f5a65b', transition: '#e8c75a', post: '#9fc7a8', metalloid: '#7cc9b8',
    nonmetal: '#78b4ec', halogen: '#a99cf0', noble: '#d68fd8', lanthanide: '#d9b48a', actinide: '#d79a9a',
  };

  for (const e of list) {
    let p = 0; while (e.Z >= starts[p + 1]) p++;
    e.period = p + 1;
    const i = e.Z - starts[p];
    if (e.period === 1) e.group = e.Z === 1 ? 1 : 18;
    else if (e.period <= 3) e.group = i < 2 ? i + 1 : i + 11;
    else if (e.period <= 5) e.group = i + 1;
    else {
      if (i < 2) e.group = i + 1;
      else if (i <= 16) { e.group = null; e.fblock = true; e.fcol = i - 2; }
      else e.group = i - 13;
    }
    let cat = null;
    for (const k in CAT) if (CAT[k].includes(e.Z)) cat = k;
    if (!cat) cat = e.fblock ? (e.period === 6 ? 'lanthanide' : 'actinide') : 'transition';
    e.cat = cat;
    e.catName = CAT_NAMES[cat];
    e.state = [1, 2, 7, 8, 9, 10, 17, 18, 36, 54, 86].includes(e.Z) ? 'gas' : [35, 80].includes(e.Z) ? 'liquid' : 'solid';
    if (e.group && e.group <= 2) e.valence = e.group;
    else if (e.group && e.group >= 13) e.valence = e.Z === 2 ? 2 : e.group - 10;
    else e.valence = null;
  }
  const bySym = {}, byZ = {};
  list.forEach(e => { bySym[e.sym] = e; byZ[e.Z] = e; });

  /* ---- electron configurations ---- */
  const ORDER = ['1s', '2s', '2p', '3s', '3p', '4s', '3d', '4p', '5s', '4d', '5p', '6s', '4f', '5d', '6p', '7s', '5f', '6d', '7p'];
  const CAP = { s: 2, p: 6, d: 10, f: 14 };
  const EXC = {
    24: { '4s': 1, '3d': 5 }, 29: { '4s': 1, '3d': 10 }, 41: { '5s': 1, '4d': 4 }, 42: { '5s': 1, '4d': 5 },
    44: { '5s': 1, '4d': 7 }, 45: { '5s': 1, '4d': 8 }, 46: { '5s': 0, '4d': 10 }, 47: { '5s': 1, '4d': 10 },
    57: { '4f': 0, '5d': 1 }, 58: { '4f': 1, '5d': 1 }, 64: { '4f': 7, '5d': 1 }, 78: { '6s': 1, '5d': 9 },
    79: { '6s': 1, '5d': 10 }, 89: { '5f': 0, '6d': 1 }, 90: { '5f': 0, '6d': 2 }, 91: { '5f': 2, '6d': 1 },
    92: { '5f': 3, '6d': 1 }, 93: { '5f': 4, '6d': 1 }, 96: { '5f': 7, '6d': 1 }, 103: { '6d': 0, '7p': 1 },
  };
  /** returns ordered list [{sub:'1s', n:1, l:'s', e:2}] for a neutral atom (or ion with charge) */
  function config(Z, charge = 0) {
    const occ = {};
    let left = Z;
    for (const s of ORDER) { const c = Math.min(CAP[s[1]], left); occ[s] = c; left -= c; if (!left) break; }
    if (EXC[Z]) Object.assign(occ, EXC[Z]);
    if (charge > 0) { // remove from highest n first; within the same n, highest l first (4s before 3d, 5p before 5s)
      let k = charge;
      while (k > 0) {
        const filled = Object.keys(occ).filter(s => occ[s] > 0);
        const rank = s => +s[0] * 10 + ({ s: 0, p: 1, d: 2, f: 3 })[s[1]];
        filled.sort((a, b) => rank(b) - rank(a));
        if (!filled.length) break;
        occ[filled[0]]--; k--;
      }
    } else if (charge < 0) {
      let k = -charge;
      for (const s of ORDER) {
        const room = CAP[s[1]] - (occ[s] || 0);
        const add = Math.min(room, k);
        if (add > 0) { occ[s] = (occ[s] || 0) + add; k -= add; }
        if (!k) break;
      }
    }
    return ORDER.filter(s => occ[s] > 0).map(s => ({ sub: s, n: +s[0], l: s[1], e: occ[s] }));
  }
  const NOBLE = [2, 10, 18, 36, 54, 86];
  function configString(Z, charge = 0, short = true, html = true) {
    const c = config(Z, charge);
    const fmt = x => html ? x.sub + '<sup>' + x.e + '</sup>' : x.sub + U.supText(x.e);
    if (!short) return c.map(fmt).join(' ');
    let core = 0;
    for (const n of NOBLE) if (n < Z - charge) core = n;
    // core must be fully contained in this configuration
    while (core) {
      const cc = config(core);
      const mine = Object.fromEntries(c.map(x => [x.sub, x.e]));
      if (cc.every(x => mine[x.sub] === x.e)) break;
      core = NOBLE[NOBLE.indexOf(core) - 1] || 0;
    }
    if (!core) return c.map(fmt).join(' ');
    const coreSubs = new Set(config(core).map(x => x.sub));
    const rest = c.filter(x => !coreSubs.has(x.sub));
    return '[' + byZ[core].sym + '] ' + (rest.length ? rest.map(fmt).join(' ') : '');
  }

  return { list, bySym, byZ, CAT_NAMES, CAT_COLORS, ORDER, CAP, config, configString };
})();
