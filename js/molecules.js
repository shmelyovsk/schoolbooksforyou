'use strict';
// Библиотека молекул (координаты в условных ангстремах) и разбор формул/уравнений.
(() => {
  const S = Math.sqrt;
  const tet = (r, c = 'H') => [[c, r, r, r], [c, -r, -r, r], [c, -r, r, -r], [c, r, -r, -r]];
  const tri = (R, c) => [0, 1, 2].map(k => [c, R * Math.cos(k * TAU / 3), R * Math.sin(k * TAU / 3), 0]);
  const ring = (n, R, sym, z = 0) => Array.from({ length: n }, (_, k) => [sym, R * Math.cos(k * TAU / n), R * Math.sin(k * TAU / n), k % 2 ? z : -z]);
  const diat = (a, b, d) => [[a, -d / 2, 0, 0], [b, d / 2, 0, 0]];
  const LIB = {
    H2: { a: diat('H', 'H', .74) }, O2: { a: diat('O', 'O', 1.21), o: [[0, 1, 2]] }, N2: { a: diat('N', 'N', 1.1), o: [[0, 1, 3]] },
    Cl2: { a: diat('Cl', 'Cl', 1.99) }, F2: { a: diat('F', 'F', 1.42) }, Br2: { a: diat('Br', 'Br', 2.28) }, I2: { a: diat('I', 'I', 2.66) },
    HCl: { a: diat('H', 'Cl', 1.27) }, HBr: { a: diat('H', 'Br', 1.41) }, HI: { a: diat('H', 'I', 1.61) }, HF: { a: diat('H', 'F', .92) },
    CO: { a: diat('C', 'O', 1.13), o: [[0, 1, 3]] }, NO: { a: diat('N', 'O', 1.15), o: [[0, 1, 2]] },
    H2O: { a: [['O', 0, 0, 0], ['H', .76, .59, 0], ['H', -.76, .59, 0]] },
    H2S: { a: [['S', 0, 0, 0], ['H', .96, .64, 0], ['H', -.96, .64, 0]] },
    H2O2: { a: [['O', -.74, 0, 0], ['O', .74, 0, 0], ['H', -1.05, .88, .45], ['H', 1.05, .88, -.45]] },
    CO2: { a: [['C', 0, 0, 0], ['O', -1.16, 0, 0], ['O', 1.16, 0, 0]], o: [[0, 1, 2], [0, 2, 2]] },
    NO2: { a: [['N', 0, 0, 0], ['O', 1.07, .5, 0], ['O', -1.07, .5, 0]], o: [[0, 1, 2]] },
    SO2: { a: [['S', 0, 0, 0], ['O', 1.25, .72, 0], ['O', -1.25, .72, 0]], o: [[0, 1, 2], [0, 2, 2]] },
    SO3: { a: [['S', 0, 0, 0], ['O', 1.42, 0, 0], ['O', -.71, 1.23, 0], ['O', -.71, -1.23, 0]], o: [[0, 1, 2], [0, 2, 2], [0, 3, 2]] },
    O3: { a: [['O', 0, .35, 0], ['O', 1.14, -.3, 0], ['O', -1.14, -.3, 0]] },
    N2O4: { a: [['N', -.88, 0, 0], ['N', .88, 0, 0], ['O', -1.5, 1.05, 0], ['O', -1.5, -1.05, 0], ['O', 1.5, 1.05, 0], ['O', 1.5, -1.05, 0]] },
    NH3: { a: [['N', 0, 0, 0], ['H', .94, -.33, 0], ['H', -.47, -.33, .81], ['H', -.47, -.33, -.81]] },
    CH4: { a: [['C', 0, 0, 0], ...tet(.63)] },
    C2H4: { a: [['C', -.67, 0, 0], ['C', .67, 0, 0], ['H', -1.24, .93, 0], ['H', -1.24, -.93, 0], ['H', 1.24, .93, 0], ['H', 1.24, -.93, 0]], o: [[0, 1, 2]] },
    C2H2: { a: [['C', -.6, 0, 0], ['C', .6, 0, 0], ['H', -1.66, 0, 0], ['H', 1.66, 0, 0]], o: [[0, 1, 3]] },
    C6H6: { a: [...ring(6, 1.4, 'C'), ...ring(6, 2.48, 'H')], o: [[0, 1, 2], [2, 3, 2], [4, 5, 2]] },
    CH3OH: { a: [['C', 0, 0, 0], ['O', 1.43, 0, 0], ['H', 1.75, .9, 0], ['H', -.37, 1.03, 0], ['H', -.37, -.51, .89], ['H', -.37, -.51, -.89]] },
    P4: { a: [['P', .77, .77, .77], ['P', .77, -.77, -.77], ['P', -.77, .77, -.77], ['P', -.77, -.77, .77]] },
    S8: { a: ring(8, 2.68, 'S', .5) },
    'OH^-': { a: diat('O', 'H', .96), q: '-' },
    'H3O^+': { a: [['O', 0, 0, 0], ['H', .94, -.33, 0], ['H', -.47, -.33, .81], ['H', -.47, -.33, -.81]], q: '+' },
    'NH4^+': { a: [['N', 0, 0, 0], ...tet(.58)], q: '+' },
    'CO3^2-': { a: [['C', 0, 0, 0], ...tri(1.29, 'O')], o: [[0, 1, 2]], q: '2-' },
    'HCO3^-': { a: [['C', 0, 0, 0], ...tri(1.3, 'O'), ['H', 2.1, .6, 0]], o: [[0, 1, 2]], q: '-' },
    'SO4^2-': { a: [['S', 0, 0, 0], ...tet(.85, 'O')], q: '2-' },
    'NO3^-': { a: [['N', 0, 0, 0], ...tri(1.24, 'O')], o: [[0, 1, 2]], q: '-' },
    'HS^-': { a: diat('S', 'H', 1.34), q: '-' }
  };
  // Формулы-обозначения «условно простых» частиц, которые лучше рисовать одним шаром
  CH.parseFormula = f => {
    const st = [[]]; const re = /([A-Z][a-z]?|\(|\))(\d*)/g; let m;
    while ((m = re.exec(f))) {
      if (m[1] === '(') st.push([]);
      else if (m[1] === ')') { const g = st.pop(), k = +m[2] || 1; for (let i = 0; i < k; i++) st[st.length - 1].push(...g); }
      else { const k = +m[2] || 1; for (let i = 0; i < k; i++) st[st.length - 1].push(m[1]); }
    }
    return st[0];
  };
  // Соли и основания (CuSO4, Cu(OH)2, NH4Cl…): ионы рядом, без «звезды» вокруг металла
  const METAL = /^(Li|Na|K|Rb|Cs|Mg|Ca|Sr|Ba|Al|Zn|Fe|Cu|Ag|Pb|Hg|Mn|Ni|Cr|Co|Sn|NH4)(\d*)(.+)$/;
  const ANION = { OH: 'OH^-', SO4: 'SO4^2-', NO3: 'NO3^-', CO3: 'CO3^2-', HCO3: 'HCO3^-', HS: 'HS^-' };
  function saltLayout(f) {
    const m = METAL.exec(f); if (!m) return null;
    const nc = +m[2] || 1; let rest = m[3], na = 1, g;
    const par = /^\(([A-Za-z0-9]+)\)(\d*)$/.exec(rest);
    if (par) { g = par[1]; na = +par[2] || 1; }
    else { const el = /^([A-Z][a-z]?)(\d*)$/.exec(rest); if (el) { g = el[1]; na = +el[2] || 1; } else g = rest; }
    const grp = ANION[g] ? LIB[ANION[g]] : (/^[A-Z][a-z]?$/.test(g) ? { a: [[g, 0, 0, 0]] } : null);
    if (!grp || nc + na > 7) return null;
    const cat = m[1] === 'NH4' ? LIB['NH4^+'] : { a: [[m[1], 0, 0, 0]] };
    const parts = [...Array(nc).fill(cat), ...Array(na).fill(grp)], a = [], o = [], part = [];
    const w = parts.map(pp => Math.max(.7, ...pp.a.map(t => Math.hypot(t[1], t[2]))) + .55);
    const tot = w.reduce((s, x) => s + 2 * x, 0); let x = -tot / 2;
    parts.forEach((pp, k) => {
      x += w[k]; const y = parts.length > 2 ? (k % 2 ? .9 : -.4) : 0, base = a.length;
      pp.a.forEach(t => { a.push([t[0], t[1] + x, t[2] + y, t[3]]); part.push(k); });
      (pp.o || []).forEach(([i, j, n]) => o.push([i + base, j + base, n])); x += w[k] - .5;
    });
    return { a, o, part };
  }
  const cache = {};
  CH.mol = spec => {
    if (cache[spec]) return cache[spec];
    const [f0, ch0] = spec.split('^'); let f = f0.replace(/[↑↓]/g, '').replace(/·.*$/, '').trim();
    const q = ch0 || '';
    const key = q ? f + '^' + q : f;
    let a, o = [], charge = q, hubMode = false;
    const salt = !LIB[key] && saltLayout(f);
    if (LIB[key]) { a = LIB[key].a; o = LIB[key].o || []; charge = LIB[key].q || q; }
    else if (salt) { a = salt.a; o = salt.o; }
    else {
      const el = CH.parseFormula(f); const n = el.length;
      if (n === 1) a = [[el[0], 0, 0, 0]];
      else if (n === 2 && el[0] === el[1] && !q) a = diat(el[0], el[1], 1.4);
      else {
        // центральный атом — единственный неводородный, встречающийся один раз; иначе кольцо
        const cnt = {}; el.forEach(s => cnt[s] = (cnt[s] || 0) + 1);
        const hub = el.findIndex(s => s !== 'H' && s !== 'O' && cnt[s] === 1) >= 0 ? el.findIndex(s => s !== 'H' && s !== 'O' && cnt[s] === 1) : el.findIndex(s => cnt[s] === 1 && s !== 'H');
        const rest = el.map((s, i) => i).filter(i => i !== hub);
        const R = 1.05 + .16 * rest.length;
        if (hub >= 0) { a = [[el[hub], 0, 0, 0]]; rest.forEach((i, k) => a.push([el[i], R * Math.cos(k * TAU / rest.length), R * Math.sin(k * TAU / rest.length), (k % 2 ? .35 : -.35)])); o = null; hubMode = true; }
        else { a = el.map((s, k) => [s, R * 1.3 * Math.cos(k * TAU / n), R * 1.3 * Math.sin(k * TAU / n), 0]); o = null; }
      }
    }
    const atoms = a.map(([s, x, y, z]) => ({ s, x, y, z }));
    const bonds = [];
    if (o === null && atoms.length > 2) {
      if (!hubMode) atoms.forEach((_, i) => bonds.push([i, (i + 1) % atoms.length, 1]));
      else for (let i = 1; i < atoms.length; i++) bonds.push([0, i, 1]);
    } else {
      for (let i = 0; i < atoms.length; i++) for (let j = i + 1; j < atoms.length; j++) {
        const A = atoms[i], B = atoms[j], d = Math.hypot(A.x - B.x, A.y - B.y, A.z - B.z);
        if (salt && salt.part[i] !== salt.part[j]) continue;
        const lim = ((CH.EL[A.s] || [0, 0, 1])[2] + (CH.EL[B.s] || [0, 0, 1])[2]) * 1.25;
        if (d < lim && d > .1) { const ob = (o || []).find(t => (t[0] === i && t[1] === j) || (t[0] === j && t[1] === i)); bonds.push([i, j, ob ? ob[2] : 1]); }
      }
    }
    return cache[spec] = { key, name: spec.replace(/[↑↓]/g, ''), atoms, bonds, charge };
  };
  // Уравнение → { L: [{coef, mol}], R: [...] }
  CH.parseEq = eq => {
    const parts = eq.split(/\s*(?:->|→|<=>|⇌|=)\s*/);
    if (parts.length < 2) return null;
    const side = s => s.split(/\s+\+\s+/).map(t => t.trim()).filter(t => t && !/^(t|hv|Q|катализатор|кат\.?)$/i.test(t) && !/^[-+]?\d*e(\^-|⁻)?$/.test(t)).map(t => {
      const m = /^(\d+)?\s*(.+)$/.exec(t); return { coef: +(m[1] || 1), mol: CH.mol(m[2]), txt: m[2] };
    });
    return { L: side(parts[0]), R: side(parts[1]) };
  };
})();
