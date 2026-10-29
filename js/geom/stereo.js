'use strict';
// Стереометрия: вращаемый чертёж фигуры из условия задачи и построение сечений.
// Описание чертежа (scenes.json): solid {k, names, n, ...}, pts — особые точки, segs — отрезки, secs — сечения.
(() => {
  const { circle, rrect, stroke, LINE, clamp, lerp } = CH;
  const TAU = Math.PI * 2;
  const V = { add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], mul: (a, k) => [a[0] * k, a[1] * k, a[2] * k],
    dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
    len: a => Math.hypot(a[0], a[1], a[2]), lerp: (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)] };
  V.unit = a => V.mul(a, 1 / (V.len(a) || 1));
  const avg = ps => V.mul(ps.reduce((s, p) => V.add(s, p), [0, 0, 0]), 1 / ps.length);
  const ACC = '#1e8f6e', SEC = '#e0533d', HI = '#1f6fd1';

  // ---------- фигуры ----------
  const ngon = (n, r, y, rot = 0) => Array.from({ length: n }, (_, i) => { const a = rot + Math.PI / 2 + i * TAU / n; return [r * Math.cos(a), y, r * Math.sin(a)]; });
  function polyFaces(base, top) { const n = base.length, F = [base.slice().reverse(), top.slice()]; for (let i = 0; i < n; i++) F.push([base[i], base[(i + 1) % n], top[(i + 1) % n], top[i]]); return F; }
  function build(S) {
    const so = S.solid, k = so.k; let names = so.names, P = {}, F = [], base = null, apex = null, curved = null, order = [], vec = [], lines = [], rightAt = null;
    const put = (nm, p) => { P[nm] = p; order.push(nm); };
    if (k === 'cube' || k === 'box') {
      names = names || 'A B C D A1 B1 C1 D1'.split(' ');
      const [w, h, d] = k === 'cube' ? [1.2, 1.2, 1.2] : [1.45, 1, .95], sh = k === 'box' && so.skew ? [.45, 0, -.25] : [0, 0, 0];
      const b = [[-w, -h, d], [-w, -h, -d], [w, -h, -d], [w, -h, d]];
      b.forEach((p, i) => put(names[i], p)); b.forEach((p, i) => put(names[i + 4], V.add([p[0], h, p[2]], sh)));
      F = polyFaces(names.slice(0, 4), names.slice(4, 8)); base = names.slice(0, 4);
    } else if (k === 'prism' || k === 'frustum') {
      const n = so.n || 3; names = names && names.length === 2 * n ? names : [...'ABCDEF'.slice(0, n)].flatMap(x => [x]).concat([...'ABCDEF'.slice(0, n)].map(x => x + '1'));
      const r = n === 3 ? 1.35 : 1.25, b = ngon(n, r, -1.05, n === 4 ? Math.PI / 4 : 0), t = k === 'frustum' ? ngon(n, r * .55, 1.05, n === 4 ? Math.PI / 4 : 0) : b.map(p => V.add([p[0], 1.05, p[2]], so.skew ? [.55, 0, -.2] : [0, 0, 0]));
      b.forEach((p, i) => put(names[i], p)); t.forEach((p, i) => put(names[n + i], p));
      F = polyFaces(names.slice(0, n), names.slice(n)); base = names.slice(0, n);
    } else if (k === 'pyr' || k === 'tetra') {
      let n = k === 'tetra' ? 3 : so.n || 4, ap, bs;
      if (k === 'tetra') { names = names || 'D A B C'.split(' '); if (so.apex0 || names[0] === 'D' || names[0] === 'S' || names[0] === 'M' || names[0] === 'P') { ap = names[0]; bs = names.slice(1); } else { ap = names[3]; bs = names.slice(0, 3); } }
      else { names = names && names.length === n + 1 ? names : ['P', ...'ABCDEF'.slice(0, n)]; ap = names[0]; bs = names.slice(1); }
      const reg = so.reg || k === 'tetra' && so.reg, b = ngon(n, 1.35, -.95, n === 4 ? Math.PI / 4 : 0);
      if (!reg && n === 3) { b[0] = [-.2, -.95, 1.35]; b[1] = [-1.3, -.95, -.6]; b[2] = [1.3, -.95, -.75]; }
      const apx = reg ? [0, k === 'tetra' ? .95 : 1.35, 0] : [.25, 1.3, .15];
      bs.forEach((nm, i) => put(nm, b[i])); put(ap, apx); apex = ap; base = bs;
      F = [bs.slice().reverse()]; for (let i = 0; i < n; i++) F.push([bs[i], bs[(i + 1) % n], ap]);
      order = [ap, ...bs];
    } else if (k === 'flat') {
      const n = so.n, nm = so.names, sh = so.shape;
      const pts = sh === 'eq' ? [[-1.5, -.6, .85], [1.5, -.6, .85], [0, -.6, -1.75]] : sh === 'iso' ? [[0, -.6, -1.3], [-1.3, -.6, .9], [1.3, -.6, .9]] : sh === 'rt' ? [[-1.2, -.6, -1.3], [1.6, -.6, 1], [-1.2, -.6, 1]] : n === 3 ? [[-1.4, -.6, .9], [1.4, -.6, .9], [.1, -.6, -1.1]] : sh === 'квадрат' ? [[-1.1, -.6, 1.1], [1.1, -.6, 1.1], [1.1, -.6, -1.1], [-1.1, -.6, -1.1]] : sh === 'ромб' ? [[-1.5, -.6, 0], [0, -.6, 1], [1.5, -.6, 0], [0, -.6, -1]] : sh === 'трапец' ? [[-1.6, -.6, 1], [-.8, -.6, -1], [.8, -.6, -1], [1.6, -.6, 1]] : sh === 'параллелограмм' ? [[-1.6, -.6, 1], [1, -.6, 1], [1.6, -.6, -1], [-1, -.6, -1]] : [[-1.5, -.6, 1], [1.5, -.6, 1], [1.5, -.6, -1], [-1.5, -.6, -1]];
      nm.forEach((x, i) => put(x, pts[i])); F = [nm.slice()]; base = nm.slice(); curved = { plane: true };
      const ext = []; (S.segs || []).forEach(sg => sg.forEach(x => { if (!P[x] && !(S.pts || {})[x] && !ext.includes(x)) ext.push(x); }));
      const cen = avg(nm.map(x => P[x]));
      ext.forEach((x, i) => { const link = (S.segs || []).filter(sg => sg.includes(x)).map(sg => sg[0] === x ? sg[1] : sg[0]).filter(y => nm.includes(y)); const at = link.length === 1 && i === 0 ? P[link[0]] : cen; put(x, [at[0] + i * .6, 1.3 - i * .25, at[2]]); });
    } else if (k === 'coords') {
      // в учебнике ось Ox «на нас», Oy вправо, Oz вверх
      const C = so.P || {}, Vc = so.Vec || {}, m = Math.max(1, ...Object.values(C).flat().map(Math.abs), ...Object.values(Vc).flat().map(Math.abs)), sc = 1.5 / m, to = c => [c[1] * sc, c[2] * sc, c[0] * sc]; curved = { axes: m, sc };
      Object.entries(C).forEach(([nm, c]) => put(nm, to(c))); vec = Object.entries(Vc).map(([nm, c]) => [nm, to(c), c]);
      Object.keys(C).forEach(nm => { const q = P[nm]; if (Math.abs(q[1]) > 1e-6) lines.push({ a: q, b: [q[0], 0, q[2]], dash: [4, 4], col: 'rgba(43,40,35,.4)', w: 1.3 }); });
    } else if (k === 'perp') {
      const X = so.X, Hn = so.H, feet = so.feet || []; const sq = [[-1.8, -.8, 1.3], [1.8, -.8, 1.3], [1.8, -.8, -1.3], [-1.8, -.8, -1.3]];
      sq.forEach((q, i) => put('~p' + i, q)); base = ['~p0', '~p1', '~p2', '~p3']; F = [base.slice()]; curved = { plane: true, alpha: true };
      put(X, [0, 1.35, 0]); const Hp = [0, -.8, 0]; if (Hn) put(Hn, Hp);
      const ang = [3.6, 5.6, 1.2]; feet.forEach((f, i) => put(f, [Math.cos(ang[i]) * 1.35, -.8, Math.sin(ang[i]) * 1.05]));
      lines.push({ a: P[X], b: Hp, col: '#1e8f6e', w: 3 }); feet.forEach(f => { lines.push({ a: P[X], b: P[f], col: '#1f6fd1', w: 2.6 }); lines.push({ a: Hp, b: P[f], col: 'rgba(43,40,35,.55)', w: 1.6, dash: [6, 5] }); });
      rightAt = Hp;
    } else if (k === 'free') {
      // свободный чертёж: всё задаётся точками, плоскостями и прямыми (S.planes, S.lines, S.pts)
    } else if (k === 'dihedral') {
      put('A', [-1.6, 0, 0]); put('B', [1.6, 0, 0]); curved = { dihedral: true };
    } else {
      curved = { kind: k, r: k === 'sphere' ? 1.45 : 1.15, h: k === 'sphere' ? 0 : 2.3, r2: k === 'fcone' ? .65 : 0 };
      if (k === 'sphere') put('O', [0, 0, 0]);
    }
    // особые точки
    const facePts = f => f === 'base' ? (base || []).map(x => P[x]) : f.map(x => P[x]).filter(Boolean);
    const rights = [];  // прямые углы: [вершина угла, точка на одной стороне, точка на другой]
    let aboveN = 0;
    // плоскости: {n, y} — горизонтальная; {n, tilt, y} — повёрнута вокруг оси x; {n, vx} — вертикальная x = vx; {n, pts:[A,B,C]} — через точки
    const planes = [];
    const mkPlane = d => {
      if (d.pts) { const q = d.pts.map(x => P[x]); if (!q.every(Boolean)) return null; const c = avg(q), e1 = V.unit(V.sub(q[1], q[0])), nn = V.unit(V.cross(V.sub(q[1], q[0]), V.sub(q[2], q[0]))), e2 = V.cross(nn, e1);
        const ext = q.map(p => [Math.abs(V.dot(V.sub(p, c), e1)), Math.abs(V.dot(V.sub(p, c), e2))]); return { n: d.n, c, e1, e2, a: Math.max(...ext.map(e => e[0])) + (d.m || .9), b: Math.max(...ext.map(e => e[1])) + (d.m || .9), col: d.col }; }
      if (d.tilt != null) { const t = d.tilt * Math.PI / 180, y = d.y == null ? -.6 : d.y, e2 = [0, Math.sin(t), -Math.cos(t)]; return { n: d.n, c: V.add([0, y, 0], V.mul(e2, d.s == null ? 1 : d.s)), e1: [1, 0, 0], e2, a: d.a || 2.3, b: d.b || 1.3, col: d.col }; }
      if (d.vx != null) return { n: d.n, c: [d.vx, d.cy == null ? .3 : d.cy, 0], e1: [0, 0, 1], e2: [0, 1, 0], a: d.a || 1.6, b: d.b || 1.4, col: d.col };
      if (d.vz != null) return { n: d.n, c: [0, d.cy == null ? .3 : d.cy, d.vz], e1: [1, 0, 0], e2: [0, 1, 0], a: d.a || 2.2, b: d.b || 1.3, col: d.col };
      return { n: d.n, c: [d.x || 0, d.y == null ? -.6 : d.y, d.z || 0], e1: [1, 0, 0], e2: [0, 0, 1], a: d.a || 2.3, b: d.b || 1.6, col: d.col };
    };
    const planeAt = (nm, u, v) => { const pl = planes.find(q => q.n === nm); return pl ? V.add(V.add(pl.c, V.mul(pl.e1, u)), V.mul(pl.e2, v)) : null; };
    for (let pass = 0; pass < 3; pass++) {
      if (pass === 1) (S.planes || []).forEach(d => { if (!planes.some(q => q.n === d.n)) { const pl = mkPlane(d); if (pl) planes.push(pl); } });
      Object.entries(S.pts || {}).forEach(([nm, d]) => {
      if (P[nm]) return;
      let p = null;
      if (d.xyz) p = d.xyz.slice();
      else if (d.inpl) p = planeAt(d.inpl[0], d.inpl[1], d.inpl[2]);
      else if (d.up && P[d.up[0]]) { const f = P[d.up[0]]; p = [f[0], f[1] + d.up[1], f[2]]; lines.push({ a: f, b: p, col: d.ra === false ? '#1f6fd1' : '#1e8f6e', w: 2.8 }); if (d.ra !== false) { const side = (d.side && P[d.side]) || (base ? base.map(x => P[x]).find(b => V.len(V.sub(b, f)) > .2) : null) || V.add(f, [1, 0, 0]); rights.push([f, p, side]); } }
      else if (d.ext && P[d.ext[0]] && P[d.ext[1]]) p = V.lerp(P[d.ext[0]], P[d.ext[1]], d.t || 1.5);
      else if (d.mid && P[d.mid[0]] && P[d.mid[1]]) p = V.lerp(P[d.mid[0]], P[d.mid[1]], .5);
      else if (d.on && P[d.on[0]] && P[d.on[1]]) p = V.lerp(P[d.on[0]], P[d.on[1]], d.t || .4);
      else if (d.face) { const fp = facePts(d.face); if (fp.length >= 3) { p = avg(fp); if (d.off) p = V.lerp(p, fp[0], d.off); } }
      else if (d.above) {   // точка на перпендикуляре к плоскости фигуры
        const foot = d.above === 'center' ? (base ? avg(base.map(x => P[x])) : null) : P[d.above];
        if (foot) { const h = (d.h || 2) - aboveN * .25, q = [foot[0] + (d.above === 'center' ? aboveN * .45 : 0), foot[1] + h, foot[2]]; aboveN++; p = q;
          const side = base ? base.map(x => P[x]).find(b => V.len(V.sub(b, foot)) > .2) : null; if (d.above !== 'center' || !aboveN || true) { const fp = d.above === 'center' ? [q[0], foot[1], q[2]] : foot; if (side) rights.push([fp, q, side]); if (d.above === 'center' && aboveN > 1) lines.push({ a: q, b: fp, col: 'rgba(43,40,35,.4)', w: 1.4, dash: [4, 4] }); } }
      }
      if (p) put(nm, p);
    }); }
    return { P, F, base, apex, curved, order, names, vec, lines, rightAt, rights, planes };
  }

  // ---------- сечение: многоугольник пересечения выпуклого многогранника с плоскостью ----------
  function planeOf(sec, G, S) {
    const P = G.P, at = i => P[G.order[i]];
    const pt = nm => P[nm];
    const nrm3 = (a, b, c) => V.unit(V.cross(V.sub(b, a), V.sub(c, a)));
    const baseN = () => G.base ? nrm3(...G.base.slice(0, 3).map(pt)) : [0, 1, 0];
    if (sec.pts && sec.pts.length >= 3 && !sec.dir && !sec.perp) { const [a, b, c] = sec.pts.map(pt); if (a && b && c) return { p: a, n: nrm3(a, b, c) }; }
    if (sec.pts && sec.dir) { const [a, b] = sec.pts.map(pt), [c, d] = sec.dir.map(pt); if (a && b && c && d) return { p: a, n: V.unit(V.cross(V.sub(b, a), V.sub(d, c))) }; }
    if (sec.pts && sec.perp) { const [a, b] = sec.pts.map(pt), q = sec.perp.map(pt); if (a && b && q.every(Boolean)) return { p: a, n: V.unit(V.cross(V.sub(b, a), nrm3(...q))) }; }
    if (sec.pt && sec.dirs) { const p = pt(sec.pt), d = sec.dirs.map(x => x.map(pt)); if (p && d.flat().every(Boolean)) return { p, n: V.unit(V.cross(V.sub(d[0][1], d[0][0]), V.sub(d[1][1], d[1][0]))) }; }
    if (sec.pt && sec.nrm) { const p = pt(sec.pt), a = pt(sec.nrm[0]), b = pt(sec.nrm[1]); if (p && a && b) return { p, n: V.unit(V.sub(b, a)) }; }
    if (sec.pt && sec.par) { const p = pt(sec.pt), q = sec.par === 'base' ? null : sec.par.map(pt); if (p && (!q || q.every(Boolean))) return { p, n: q ? nrm3(...q) : baseN() }; }
    if (sec.par === 'base') { const ys = Object.values(P).map(q => q[1]), y = lerp(Math.min(...ys), Math.max(...ys), sec.at || .5); return { p: [0, G.curved && G.curved.kind ? lerp(-G.curved.h / 2, G.curved.h / 2, sec.at || .5) : y, 0], n: [0, 1, 0] }; }
    if (sec.idx) { const q = sec.idx.map(at); if (sec.dirIdx) { const d = sec.dirIdx.map(at); return { p: q[0], n: V.unit(V.cross(V.sub(q[1], q[0]), V.sub(d[1], d[0]))) }; } if (sec.center) q.push(avg(G.base.map(pt))); if (q.length >= 3 && q.every(Boolean)) return { p: q[0], n: nrm3(q[0], q[1], q[2]) }; }
    if (sec.perpEdge && G.base) { const a = pt(G.base[0]), b = pt(G.order[G.base.length]); const c = avg(Object.values(P)); return { p: c, n: V.unit(V.sub(b, a)) }; }
    return null;
  }
  function slice(G, pl) {
    const P = G.P, d = q => V.dot(V.sub(q, pl.p), pl.n), out = [], edges = new Set();
    G.F.forEach(f => f.forEach((a, i) => { const b = f[(i + 1) % f.length], key = [a, b].sort().join('|'); if (edges.has(key)) return; edges.add(key);
      const da = d(P[a]), db = d(P[b]); if (Math.abs(da) < 1e-6) out.push(P[a]); if (da * db < -1e-12) out.push(V.lerp(P[a], P[b], da / (da - db))); }));
    const uniq = []; out.forEach(p => { if (!uniq.some(q => V.len(V.sub(p, q)) < 1e-4)) uniq.push(p); });
    if (uniq.length < 3) return null;
    const c = avg(uniq), u = V.unit(V.sub(uniq[0], c)), w = V.cross(pl.n, u);
    return uniq.sort((p, q) => Math.atan2(V.dot(V.sub(p, c), w), V.dot(V.sub(p, c), u)) - Math.atan2(V.dot(V.sub(q, c), w), V.dot(V.sub(q, c), u)));
  }
  function curvedSlice(G, sec) {
    const c = G.curved, r = c.r, h = c.h, k = c.kind, ring = (y, rr, z0 = 0) => Array.from({ length: 48 }, (_, i) => [rr * Math.cos(i * TAU / 48), y, rr * Math.sin(i * TAU / 48) + z0]);
    if (k === 'sphere') { const y = r * (sec.sph || .5); return ring(y, Math.sqrt(r * r - y * y)); }
    if (sec.axial) { if (k === 'cyl') return [[-r, -h / 2, 0], [r, -h / 2, 0], [r, h / 2, 0], [-r, h / 2, 0]]; if (k === 'cone') return [[-r, -h / 2, 0], [r, -h / 2, 0], [0, h / 2, 0]]; return [[-r, -h / 2, 0], [r, -h / 2, 0], [c.r2, h / 2, 0], [-c.r2, h / 2, 0]]; }
    if (sec.cylpar) { const z = r * sec.cylpar, hw = Math.sqrt(r * r - z * z); return [[-hw, -h / 2, z], [hw, -h / 2, z], [hw, h / 2, z], [-hw, h / 2, z]]; }
    if (sec.chord) { const z = r * sec.chord, hw = Math.sqrt(r * r - z * z); return [[-hw, -h / 2, z], [hw, -h / 2, z], [0, h / 2, 0]]; }
    if (sec.par === 'base') { const t = sec.at || .5, y = lerp(-h / 2, h / 2, t), rr = k === 'cyl' ? r : k === 'cone' ? r * (1 - t) : lerp(r, c.r2, t); return ring(y, rr); }
    return null;
  }

  // ---------- проекция ----------
  function proj(st, W, H, scale) {
    const cy = Math.cos(st.yaw), sy = Math.sin(st.yaw), cp = Math.cos(st.pitch), sp = Math.sin(st.pitch), cx0 = W / 2, cy0 = H * .5;
    return p => { const x = p[0] * cy + p[2] * sy, z = -p[0] * sy + p[2] * cy, y = p[1] * cp - z * sp, zz = p[1] * sp + z * cp, f = 1 + zz * .06; return [cx0 + x * scale * f, cy0 - y * scale * f, zz]; };
  }

  const KIND = n => ({ 3: 'треугольник', 4: 'четырёхугольник', 5: 'пятиугольник', 6: 'шестиугольник' }[n] || n + '-угольник');
  const secName = x => x.pts && x.pts.length >= 3 && !x.dir && !x.perp && !x.pts.some(p => p[0] === '~') ? CH.uni(x.pts.join('')) : x.axial ? 'осевое' : '';

  CH.R.stereo = {
    phys: true, drag: true,
    modes: S => (S.secs && S.secs.length) ? [{ k: 'step', o: [['fig', 'Фигура'], ...S.secs.map((x, i) => ['s' + i, 'Сечение' + (S.secs.length > 1 ? ' ' + (i + 1) : '') + (secName(x) ? ' ' + secName(x) : '')])] }] : [],
    init(S) { return { yaw: -.55, pitch: .38, idle: 0, G: build(S) }; },
    onDrag(st, dx, dy) { st.yaw += dx * .01; st.pitch = clamp(st.pitch + dy * .01, -1.3, 1.3); st.idle = 0; },
    formula(v, st, S) {
      const step = v.step || 'fig', tri = (S.tris || []).length ? 'Цветом выделены ' + S.tris.map(t => '△' + CH.uni(t.join(''))).join(', ') + '. ' : '', ang = (S.angs || []).length ? 'Углы ' + S.angs.map(a => '∠' + CH.uni(a.join(''))).join(', ') + ' отмечены дугой. ' : '';
      if (step === 'fig') return tri + ang + (S.secs && S.secs.length ? 'Рассмотрите фигуру, затем нажмите «Сечение».' : 'Прямые углы отмечены квадратиком. Поворачивайте чертёж пальцем.');
      const poly = st.poly; if (!poly) return 'Это сечение не удалось построить автоматически — постройте его по чертежу.';
      if (poly.length > 12) return 'Сечение — круг. Его граница — окружность.';
      return `Сечение ${CH.uni(st.secLabel || '')} — ${KIND(poly.length)}. Новые вершины сечения — точки пересечения секущей плоскости с рёбрами.`;
    },
    draw(c, W, H, p, t, S, st, dt) {
      const G = st.G, step = (st.v && st.v.step) || 'fig'; st.idle += dt; if (st.idle > 3) st.yaw += dt * .35;
      CH.panel(c, { x: 0, y: 0, w: W, h: H }, '');
      const P = G.P, Rb = Math.max(1, ...Object.values(P).map(q => V.len(q)), ...(G.planes || []).map(pl => V.len(pl.c) + Math.hypot(pl.a, pl.b) * .85), G.curved && G.curved.kind ? Math.hypot(G.curved.r, G.curved.h / 2) : 0), scale = Math.min(W, H) * .4 / Rb, pr = proj(st, W, H, scale);
      // насколько направление n смотрит на зрителя
      const cyw = Math.cos(st.yaw), syw = Math.sin(st.yaw), cp = Math.cos(st.pitch), sp = Math.sin(st.pitch);
      const toward = n => { const x = n[0] * cyw + n[2] * syw, z = -n[0] * syw + n[2] * cyw, zz = n[1] * sp + z * cp; return zz; };
      // ось координат
      if (G.curved && G.curved.axes) { [['x', [0, 0, 2]], ['y', [2, 0, 0]], ['z', [0, 2, 0]]].forEach(([nm, e]) => { const a = pr(V.mul(e, -.4)), b = pr(e); CH.P ? CH.P.arrow(c, a[0], a[1], b[0], b[1], '#8d8a84', 2, '') : 0; lab(c, nm, b[0] + 10, b[1] - 8, 15, '#6b655b'); }); lab(c, 'O', pr([0, 0, 0])[0] - 12, pr([0, 0, 0])[1] + 12, 14, '#6b655b'); }
      // криволинейные тела
      if (G.curved && G.curved.kind) drawCurved(c, G.curved, pr, toward);
      if (G.curved && G.curved.dihedral) drawDihedral(c, pr);
      // плоскости α, β, γ… — полупрозрачные параллелограммы с подписью
      const PLC = ['rgba(30,143,110,.13)', 'rgba(31,111,209,.12)', 'rgba(242,162,58,.14)', 'rgba(122,87,255,.12)'], PLL = ['#1e8f6e', '#1f6fd1', '#c07a10', '#7a57ff'];
      (G.planes || []).forEach((pl, i) => { const cs = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([u, v]) => pr(V.add(V.add(pl.c, V.mul(pl.e1, u * pl.a)), V.mul(pl.e2, v * pl.b))));
        c.beginPath(); cs.forEach((q, j) => j ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.closePath(); c.fillStyle = pl.col || PLC[i % 4]; c.fill(); c.lineWidth = 1.8; c.strokeStyle = PLL[i % 4]; c.stroke();
        if (pl.n && pl.n !== '-') { const q = pr(V.add(V.add(pl.c, V.mul(pl.e1, pl.a * .82)), V.mul(pl.e2, pl.b * .72))); lab(c, pl.n, q[0], q[1], 21, PLL[i % 4]); } });
      // прямые a, b, c… — продолжены за точки
      (S.lines || []).forEach(l => { const A = P[l.p[0]], B = P[l.p[1]]; if (!A || !B) return; const d = V.sub(B, A), e1 = V.add(A, V.mul(d, -(l.k == null ? .45 : l.k))), e2 = V.add(B, V.mul(d, l.k == null ? .45 : l.k)); line(c, pr(e1), pr(e2), l.col || '#5b3fd0', 2.4); if (l.n) { const q = pr(e2); c.font = '700 19px "Times New Roman",serif'; c.fillStyle = l.col || '#5b3fd0'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(l.n, q[0] + 10, q[1] - 10); } });
      (S.polys || []).forEach((pg, i) => { const q = pg.map(x => P[x]); if (!q.every(Boolean)) return; c.beginPath(); q.map(pr).forEach((a, j) => j ? c.lineTo(a[0], a[1]) : c.moveTo(a[0], a[1])); c.closePath(); c.fillStyle = ['rgba(122,87,255,.18)', 'rgba(242,162,58,.2)', 'rgba(31,111,209,.16)'][i % 3]; c.fill(); c.lineWidth = 2.2; c.strokeStyle = ['#7a57ff', '#e08a1c', '#1f6fd1'][i % 3]; c.stroke(); });
      (S.dsegs || []).forEach(([a, b]) => { if (P[a] && P[b]) line(c, pr(P[a]), pr(P[b]), 'rgba(43,40,35,.6)', 1.8, [6, 5]); });
      if (G.curved && G.curved.plane && G.base) { const q = G.base.map(x => pr(P[x])); c.beginPath(); q.forEach((a, i) => i ? c.lineTo(a[0], a[1]) : c.moveTo(a[0], a[1])); c.closePath(); c.fillStyle = 'rgba(30,143,110,.10)'; c.fill(); }
      // многогранник: видимость граней по нормали
      const faces = G.F.map(f => { const q = f.map(x => P[x]); let nrm = V.unit(V.cross(V.sub(q[1], q[0]), V.sub(q[2], q[0]))); const cen = avg(q), out = V.sub(cen, avg(Object.values(P).slice(0, G.order.length))); if (V.dot(nrm, out) < 0) nrm = V.mul(nrm, -1); return { f, vis: G.curved && G.curved.plane ? true : toward(nrm) > 0 }; });
      faces.forEach(({ f, vis }) => { if (!vis) return; c.beginPath(); f.forEach((x, i) => { const q = pr(P[x]); i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); }); c.closePath(); c.fillStyle = 'rgba(30,143,110,.07)'; c.fill(); });
      const edges = {}; faces.forEach(({ f, vis }) => f.forEach((a, i) => { const b = f[(i + 1) % f.length], key = [a, b].sort().join('|'); edges[key] = edges[key] || { a, b, vis: false }; if (vis) edges[key].vis = true; }));
      // сечение
      let poly = null; if (step !== 'fig') { const sec = S.secs[+step.slice(1)]; if (sec) { if (G.curved && G.curved.kind) poly = curvedSlice(G, sec); else { const pl = planeOf(sec, G, S); poly = pl ? slice(G, pl) : null; } } }
      st.poly = poly; if (st.lastStep !== step) { st.lastStep = step; st.secT = 0; } st.secT = Math.min(1, (st.secT || 0) + dt * 1.2);
      Object.values(edges).forEach(e => { const a = pr(P[e.a]), b = pr(P[e.b]); line(c, a, b, e.vis ? LINE : 'rgba(43,40,35,.45)', e.vis ? 2.4 : 1.6, e.vis ? null : [6, 5]); });
      if (poly) { const q = poly.map(pr), k = CH.ease(st.secT); c.save(); c.globalAlpha = k; c.beginPath(); q.forEach((a, i) => i ? c.lineTo(a[0], a[1]) : c.moveTo(a[0], a[1])); c.closePath(); c.fillStyle = 'rgba(224,83,61,.28)'; c.fill(); c.lineWidth = 3.2; c.strokeStyle = SEC; c.lineJoin = 'round'; c.stroke(); if (poly.length <= 12) q.forEach(a => { circle(c, a[0], a[1], 4.5); c.fillStyle = SEC; c.fill(); }); c.restore(); }
      (G.lines || []).forEach(l => line(c, pr(l.a), pr(l.b), l.col, l.w, l.dash));
      if (G.rightAt) { const h = G.rightAt, a = pr(V.add(h, [.18, 0, 0])), b = pr(V.add(h, [.18, .18, 0])), d = pr(V.add(h, [0, .18, 0])); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo(d[0], d[1]); c.lineWidth = 1.5; c.strokeStyle = '#1e8f6e'; c.stroke(); }
      if (G.curved && G.curved.alpha) { const q = pr(P['~p1']); lab(c, 'α', q[0] - 22, q[1] - 10, 20, '#1e8f6e'); }
      (G.vec || []).forEach(([nm, tip, co]) => { const o = pr([0, 0, 0]), q = pr(tip); CH.P.arrow(c, o[0], o[1], q[0], q[1], '#e0533d', 3, ''); lab(c, nm, q[0] + 12, q[1] - 10, 18, '#e0533d'); CH.P.arrow(c, q[0] + 5, q[1] - 24, q[0] + 20, q[1] - 24, '#e0533d', 1.6, '', 5); small(c, '{' + co.map(x => String(x).replace('.', ',')).join('; ') + '}', q[0], q[1] + 18); });
      // треугольники из условия: заливка, стороны, прямые углы
      const TRI = ['rgba(122,87,255,.22)', 'rgba(242,162,58,.25)', 'rgba(31,111,209,.2)', 'rgba(224,83,61,.2)'], TRL = ['#7a57ff', '#e08a1c', '#1f6fd1', '#e0533d'];
      const rmark = (o, a, b, col) => { const u = V.mul(V.unit(V.sub(a, o)), .2), w = V.mul(V.unit(V.sub(b, o)), .2), p1 = pr(V.add(o, u)), p2 = pr(V.add(V.add(o, u), w)), p3 = pr(V.add(o, w)); c.beginPath(); c.moveTo(p1[0], p1[1]); c.lineTo(p2[0], p2[1]); c.lineTo(p3[0], p3[1]); c.lineWidth = 1.8; c.strokeStyle = col; c.stroke(); };
      (S.tris || []).forEach((tr, i) => { const q = tr.map(x => P[x]); if (!q.every(Boolean)) return; const s2 = q.map(pr); c.beginPath(); s2.forEach((a, j) => j ? c.lineTo(a[0], a[1]) : c.moveTo(a[0], a[1])); c.closePath(); c.fillStyle = TRI[i % 4]; c.fill(); c.lineWidth = 2.6; c.strokeStyle = TRL[i % 4]; c.lineJoin = 'round'; c.stroke();
        q.forEach((o, j) => { const a = q[(j + 1) % 3], b = q[(j + 2) % 3]; if (Math.abs(V.dot(V.unit(V.sub(a, o)), V.unit(V.sub(b, o)))) < .02) rmark(o, a, b, TRL[i % 4]); }); });
      (G.rights || []).forEach(([o, a, b]) => rmark(o, a, b, ACC));
      (S.ras || []).forEach(([a, o, b]) => { if (P[a] && P[o] && P[b]) rmark(P[o], P[a], P[b], SEC); });
      (S.angs || []).forEach(([a, o, b]) => { if (!P[a] || !P[o] || !P[b]) return; const O = P[o], u = V.unit(V.sub(P[a], O)), w = V.unit(V.sub(P[b], O)); line(c, pr(O), pr(P[a]), SEC, 2.2); line(c, pr(O), pr(P[b]), SEC, 2.2); const ang = Math.acos(clamp(V.dot(u, w), -1, 1)); c.beginPath(); for (let i = 0; i <= 16; i++) { const t2 = i / 16, d = V.unit(V.add(V.mul(u, Math.sin((1 - t2) * ang)), V.mul(w, Math.sin(t2 * ang)))), q = pr(V.add(O, V.mul(d, .35))); i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); } c.lineWidth = 2; c.strokeStyle = SEC; c.stroke(); });
      // отрезки из условия
      (S.segs || []).forEach(([a, b]) => { if (!P[a] || !P[b]) return; const key = [a, b].sort().join('|'), e = edges[key]; const A = pr(P[a]), B = pr(P[b]); line(c, A, B, HI, e ? 3.2 : 2.6, e && !e.vis ? [7, 5] : null); });
      // буквы на вершинах сечения: существующие точки или новые K, L, N…
      if (poly && poly.length <= 12 && st.secT > .3) { const used = new Set(Object.keys(P)), pool = 'KLNPQRSTEFGHUVWXYZ'.split('').filter(x => !used.has(x)); let j = 0; const nm = poly.map(p => { const hit = Object.keys(P).find(x => x[0] !== '~' && V.len(V.sub(P[x], p)) < 1e-3); return hit || pool[j++] || '?'; }); st.secLabel = nm.join('');
        const cq = pr(avg(poly)); poly.forEach((p, i) => { if (Object.keys(P).some(x => x[0] !== '~' && V.len(V.sub(P[x], p)) < 1e-3)) return; const q = pr(p); let dx = q[0] - cq[0], dy = q[1] - cq[1]; const L = Math.hypot(dx, dy) || 1; lab(c, CH.uni(nm[i]), q[0] + dx / L * 15, q[1] + dy / L * 15, 16, SEC); }); }
      // точки и подписи
      const cen = avg(Object.values(P)), cp0 = pr(cen);
      G.order.forEach(nm => { if (nm.startsWith('~p')) return; const q = pr(P[nm]); const isV = (G.names || []).includes(nm); circle(c, q[0], q[1], isV ? 3.4 : 5); c.fillStyle = isV ? LINE : ACC; c.fill();
        if (nm[0] === '~') return; let dx = q[0] - cp0[0], dy = q[1] - cp0[1]; const L = Math.hypot(dx, dy) || 1; dx /= L; dy /= L; lab(c, CH.uni(nm), q[0] + dx * 16, q[1] + dy * 16, 16, isV ? LINE : ACC); });
      if (G.curved && G.curved.axes) Object.entries(S.solid.P).forEach(([nm, co]) => { const q = pr(P[nm]); small(c, `(${co.map(x => String(x).replace('.', ',')).join('; ')})`, q[0], q[1] + 22); });
      if (st.idle < .5) CH.pill(c, 'вращение пальцем · двойное касание — сбросить', W / 2, H - 20, 12);
    }
  };
  const line = (c, a, b, col, w, dash) => { c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineWidth = w; c.strokeStyle = col; c.lineCap = 'round'; c.setLineDash(dash || []); c.stroke(); c.setLineDash([]); };
  const lab = (c, s, x, y, size, col) => { c.font = `600 italic ${size}px Georgia,"Times New Roman",serif`; c.fillStyle = col; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(s, x, y); };
  const small = (c, s, x, y) => { c.font = '500 11.5px system-ui,sans-serif'; c.fillStyle = '#6b655b'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(s, x, y); };

  function drawCurved(c, cv, pr, toward) {
    const { kind, r, h, r2 } = cv, ring = (y, rr) => Array.from({ length: 73 }, (_, i) => { const a = i * TAU / 72; return [rr * Math.cos(a), y, rr * Math.sin(a)]; });
    const drawRing = (y, rr, topFace) => { const pts = ring(y, rr); for (let i = 0; i < 72; i++) { const a = pts[i], b = pts[i + 1], mid = V.mul(V.add(a, b), .5); const front = topFace ? true : toward([mid[0], 0, mid[2]]) > -.02 || toward([0, topFace === false ? -1 : 1, 0]) > 0 && false; line(c, pr(a), pr(b), front ? LINE : 'rgba(43,40,35,.45)', front ? 2.4 : 1.6, front ? null : [6, 5]); } };
    if (kind === 'sphere') {
      const o = pr([0, 0, 0]), e = pr([r, 0, 0]), R0 = Math.hypot(e[0] - o[0], e[1] - o[1]) / (Math.hypot(1, 0) ) ; const s = Math.abs(pr([0, r, 0])[1] - o[1]); const Rs = Math.max(R0, s, Math.hypot(...[pr([0, 0, r])[0] - o[0], pr([0, 0, r])[1] - o[1]]));
      const g = c.createRadialGradient(o[0] - Rs * .35, o[1] - Rs * .35, Rs * .1, o[0], o[1], Rs); g.addColorStop(0, 'rgba(255,255,255,.7)'); g.addColorStop(1, 'rgba(30,143,110,.15)'); circle(c, o[0], o[1], Rs * 1.0); c.fillStyle = g; c.fill(); c.lineWidth = 2.4; c.strokeStyle = LINE; c.stroke();
      drawRing(0, r); return;
    }
    const yb = -h / 2, yt = h / 2, rt = kind === 'cyl' ? r : kind === 'cone' ? 0 : r2;
    // образующие-силуэт: точки окружности, где касательная направлена на зрителя
    let best = [0, Math.PI]; let mx = -1e9, mn = 1e9; for (let i = 0; i < 72; i++) { const a = i * TAU / 72, q = pr([Math.cos(a), 0, Math.sin(a)]); if (q[0] > mx) { mx = q[0]; best[0] = a; } if (q[0] < mn) { mn = q[0]; best[1] = a; } }
    best.forEach(a => line(c, pr([r * Math.cos(a), yb, r * Math.sin(a)]), pr([rt * Math.cos(a), yt, rt * Math.sin(a)]), LINE, 2.4));
    drawRing(yb, r, false); if (rt > 0) { const pts = ring(yt, rt); for (let i = 0; i < 72; i++) line(c, pr(pts[i]), pr(pts[i + 1]), LINE, 2.4); }
    const o1 = pr([0, yb, 0]), o2 = pr([0, yt, 0]); line(c, o1, o2, 'rgba(43,40,35,.4)', 1.4, [4, 5]); circle(c, o1[0], o1[1], 3); c.fillStyle = LINE; c.fill();
  }
  function drawDihedral(c, pr) {
    const A = [-1.6, 0, 0], B = [1.6, 0, 0], w = 1.6, ang = 1.05, p1 = [[-1.6, 0, 0], [1.6, 0, 0], [1.6, 0, w], [-1.6, 0, w]], d2 = [0, Math.sin(ang) * w, Math.cos(ang) * w * -1 * -1 * -1], p2 = [A, B, V.add(B, [0, Math.sin(ang) * w, -Math.cos(ang) * w]), V.add(A, [0, Math.sin(ang) * w, -Math.cos(ang) * w])]; void d2;
    [[p1, 'rgba(30,143,110,.15)', 'α'], [p2, 'rgba(31,111,209,.15)', 'β']].forEach(([poly, col, nm]) => { const q = poly.map(pr); c.beginPath(); q.forEach((a, i) => i ? c.lineTo(a[0], a[1]) : c.moveTo(a[0], a[1])); c.closePath(); c.fillStyle = col; c.fill(); c.lineWidth = 2; c.strokeStyle = LINE; c.stroke(); lab(c, nm, (q[2][0] + q[3][0]) / 2, (q[2][1] + q[3][1]) / 2 + 14, 18, '#6b655b'); });
    const O = [0, 0, 0], a1 = [0, 0, .8], a2 = [0, Math.sin(ang) * .8, -Math.cos(ang) * .8]; line(c, pr(O), pr(a1), SEC, 2.6); line(c, pr(O), pr(a2), SEC, 2.6);
    c.beginPath(); for (let i = 0; i <= 20; i++) { const t = i / 20 * (Math.PI - ang), q = pr([0, Math.sin(t) * .45, Math.cos(t) * .45]); i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); } c.strokeStyle = SEC; c.lineWidth = 2; c.stroke();
    line(c, pr(A), pr(B), LINE, 3.4); lab(c, 'линейный угол', pr([0, .6, .4])[0] + 40, pr([0, .6, .4])[1], 13, SEC);
  }
})();
