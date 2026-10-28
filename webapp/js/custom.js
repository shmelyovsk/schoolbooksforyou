'use strict';
// Специальные сцены: модели строения вещества (атом, связи, решётки, полимеры, ДНК…).
// Каждая сцена: draw(c, W, H, p, t, S, st, dt) — p∈[0,1] прогресс, t — секунды, S — описание из scenes.json.
(() => {
  const R = CH.R = CH.R || {};
  const { clamp, lerp, sm, ease, H: HS, circle, rrect, stroke, text, pill, atom, mix, rgba, LINE } = CH;
  const MUTED = '#6b655b';

  // ---------- вспомогательное ----------
  function ring(c, x, y, r, col = 'rgba(60,55,48,.55)', w = 1.6, dash) {
    circle(c, x, y, r); c.lineWidth = w; c.strokeStyle = col; if (dash) c.setLineDash(dash); c.stroke(); c.setLineDash([]);
  }
  function electron(c, x, y, col = '#3a6df0', r = 5.5) { circle(c, x, y, r); c.fillStyle = col; c.fill(); c.lineWidth = 1.5; c.strokeStyle = LINE; c.stroke(); }
  function badge(c, x, y, s, col) { c.save(); circle(c, x, y, 13); c.fillStyle = col; c.fill(); stroke(c, 2); c.fillStyle = '#fff'; c.font = '700 14px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(s, x, y + 1); c.restore(); }
  CH.rot3 = (a, th, tilt) => { const c = Math.cos(th), s = Math.sin(th); const x = a.x * c + a.z * s, z = -a.x * s + a.z * c, ct = Math.cos(tilt), st = Math.sin(tilt); return { x, y: a.y * ct - z * st, z: a.y * st + z * ct }; };
  CH.drawMol = (c, mol, cx, cy, k, th, f = 1, al = 1) => {
    const P = mol.atoms.map(a => { const q = CH.rot3(a, th, .35); return { x: cx + q.x * k, y: cy + q.y * k, z: q.z, s: a.s }; });
    c.save(); c.globalAlpha *= al; c.lineCap = 'round';
    mol.bonds.forEach(([i, j, o]) => { const A = P[i], B = P[j], dx = B.x - A.x, dy = B.y - A.y, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L; const offs = o === 3 ? [-5, 0, 5] : o === 2 ? [-3.5, 3.5] : [0];
      offs.forEach(d => { c.beginPath(); c.moveTo(A.x + nx * d, A.y + ny * d); c.lineTo(B.x + nx * d, B.y + ny * d); c.lineWidth = o > 1 ? 5 : 8; c.strokeStyle = LINE; c.stroke(); });
      offs.forEach(d => { c.beginPath(); c.moveTo(A.x + nx * d, A.y + ny * d); c.lineTo(B.x + nx * d, B.y + ny * d); c.lineWidth = o > 1 ? 2.2 : 4.5; c.strokeStyle = '#e6e1d6'; c.stroke(); }); });
    P.map((a, i) => i).sort((a, b) => P[a].z - P[b].z).forEach(i => { const a = P[i], e = CH.EL[a.s] || ['#bbb', 16]; atom(c, a.x, a.y, e[1] * f * (1 + a.z * .03), e[0], f > .8 ? a.s : ''); });
    c.restore();
  };
  const ext = mol => Math.max(.6, ...mol.atoms.map(a => Math.hypot(a.x, a.y, a.z))) + .5;

  // ---------- атом: ядро и электронные слои ----------
  R.atom = {
    draw(c, W, Hh, p, t, S) {
      const cx = W / 2, cy = Hh * .46, sh = S.sh, n = sh.length, Rmax = Math.min(W, Hh) * .4, r0 = Rmax * .26, dr = (Rmax - r0) / n;
      const total = sh.reduce((a, b) => a + b, 0), shown = Math.floor(clamp(p / .85) * total + .001);
      glow(c, cx, cy, Rmax * .5);
      let left = shown; const np = S.Z, nn = S.N || Math.round(S.Z * 1.1);
      sh.forEach((cnt, i) => { const r = r0 + dr * (i + .5); ring(c, cx, cy, r, i === n - 1 ? 'rgba(91,63,208,.7)' : 'rgba(60,55,48,.45)', i === n - 1 ? 2.2 : 1.5, [5, 5]);
        const k = Math.min(cnt, left); left -= k; for (let j = 0; j < k; j++) { const a = j / cnt * TAU + t * (.9 - i * .18) * (i % 2 ? -1 : 1) + i; electron(c, cx + Math.cos(a) * r, cy + Math.sin(a) * r * .96, i === n - 1 ? '#7a57ff' : '#3a6df0'); } });
      // ядро
      circle(c, cx, cy, r0 * .8); c.fillStyle = 'rgba(255,255,255,.55)'; c.fill(); stroke(c, 2);
      const m = Math.min(26, np + nn); for (let i = 0; i < m; i++) { const a = i * 2.4, rr = r0 * .55 * Math.sqrt((i + .5) / m); const isP = i % 2 === 0; circle(c, cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 4.4); c.fillStyle = isP ? '#e8665b' : '#a7a29a'; c.fill(); c.lineWidth = 1; c.strokeStyle = LINE; c.stroke(); }
      text(c, S.el, cx, cy + Rmax + 22, 22, '#2b2823');
      pill(c, `ядро +${np}   электронов ${total}   слои: ${sh.join(' · ')}`, cx, cy - Rmax - 14, 13);
      text(c, '● протон   ● нейтрон   ● электрон', cx, Hh - 14, 11, MUTED, 'center', 500);
    },
    live: (p, S) => `Заряд ядра +${S.Z}. Электроны по слоям: ${S.sh.join(', ')}. Внешний слой (фиолетовый) определяет химические свойства.`
  };
  function glow(c, x, y, r) { const g = c.createRadialGradient(x, y, 0, x, y, r * 2.2); g.addColorStop(0, 'rgba(143,123,255,.18)'); g.addColorStop(1, 'rgba(143,123,255,0)'); c.fillStyle = g; c.fillRect(x - r * 2.2, y - r * 2.2, r * 4.4, r * 4.4); }

  // ---------- изотопы ----------
  R.isotopes = {
    draw(c, W, Hh, p, t, S) {
      const n = S.list.length; S.list.forEach((it, i) => {
        const tot0 = it.p + it.n, pr = Math.min(15, W / n * .05), cx = W * (i + .5) / n, cy = Hh * .45, a = sm(i / n * .6, i / n * .6 + .3, p), r = pr * (1.6 + 1.25 * Math.sqrt(tot0)) * (.6 + .4 * a);
        c.save(); c.globalAlpha = a; circle(c, cx, cy, r); c.fillStyle = 'rgba(255,255,255,.6)'; c.fill(); stroke(c, 2);
        const tot = it.p + it.n; for (let k = 0; k < tot; k++) { const ang = k * 2.4 + t * .2, rr = (r - pr * 1.2) * Math.sqrt((k + .5) / tot); circle(c, cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr, pr); c.fillStyle = k < it.p ? '#e8665b' : '#a7a29a'; c.fill(); c.lineWidth = 1; c.strokeStyle = LINE; c.stroke(); }
        text(c, `${it.A}${S.el}`.replace(/^(\d+)/, m => [...m].map(d => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]).join('')), cx, cy + r + 28, 24, '#2b2823');
        text(c, it.name, cx, cy + r + 54, 14, MUTED, 'center', 500); text(c, `p⁺=${it.p}, n⁰=${it.n}`, cx, cy + r + 74, 13, MUTED, 'center', 500); c.restore();
      });
      if (S.foot) pill(c, S.foot, W / 2, Hh - 28, 13);
    }
  };

  // ---------- орбитали ----------
  R.orbital = {
    draw(c, W, Hh, p, t, S) {
      const kinds = S.kinds || ['s', 'p', 'd'], n = kinds.length;
      kinds.forEach((k, i) => {
        const cx = W * (i + .5) / n, cy = Hh * .44, u = Math.min(W / n * .4, Hh * .26), a = sm(i * .25, i * .25 + .3, p);
        c.save(); c.globalAlpha = a; c.translate(cx, cy);
        const dots = (fn, N) => { for (let j = 0; j < N; j++) { const q = fn(j); circle(c, q[0], q[1], 1.8); c.fillStyle = 'rgba(91,63,208,.55)'; c.fill(); } };
        const lobes = (list, col) => list.forEach(([ax, ay, rx, ry, rot]) => { c.save(); c.translate(ax, ay); c.rotate(rot); c.beginPath(); c.ellipse(0, 0, rx, ry, 0, 0, TAU); const g = c.createRadialGradient(0, 0, 0, 0, 0, rx); g.addColorStop(0, col + 'cc'); g.addColorStop(1, col + '33'); c.fillStyle = g; c.fill(); c.lineWidth = 1.8; c.strokeStyle = 'rgba(43,40,35,.6)'; c.stroke(); c.restore(); });
        const wob = Math.sin(t * 1.2 + i) * .06;
        if (k === 's') { circle(c, 0, 0, u * .62 * (1 + wob)); const g = c.createRadialGradient(0, 0, 0, 0, 0, u * .62); g.addColorStop(0, '#8f7bffdd'); g.addColorStop(1, '#8f7bff22'); c.fillStyle = g; c.fill(); c.lineWidth = 1.8; c.strokeStyle = 'rgba(43,40,35,.6)'; c.stroke(); dots(j => { const a2 = HS(j) * TAU, r2 = u * .6 * Math.sqrt(HS(j + 9)); return [Math.cos(a2 + t * .5) * r2, Math.sin(a2 + t * .5) * r2]; }, 60); }
        else if (k === 'p') { lobes([[-u * .5, 0, u * .5, u * .26, 0], [u * .5, 0, u * .5, u * .26, 0]], '#e8665b'); lobes([[0, -u * .5, u * .26, u * .5, 0], [0, u * .5, u * .26, u * .5, 0]], '#3a6df0'); lobes([[-u * .35, u * .35, u * .4, u * .17, .78], [u * .35, -u * .35, u * .4, u * .17, .78]], '#3dbf9a'); }
        else lobes([[u * .42, u * .42, u * .4, u * .2, .78], [-u * .42, -u * .42, u * .4, u * .2, .78], [-u * .42, u * .42, u * .4, u * .2, -.78], [u * .42, -u * .42, u * .4, u * .2, -.78]], '#f2b23a');
        c.restore();
        text(c, { s: 's-орбиталь', p: 'p-орбитали', d: 'd-орбитали' }[k], cx, cy + u + 34, 17, '#2b2823');
        text(c, { s: 'шаровая форма', p: 'гантели вдоль осей x, y, z', d: '«клеверные листья»' }[k], cx, cy + u + 58, 12.5, MUTED, 'center', 500);
        text(c, { s: 'до 2 электронов', p: 'до 6 электронов', d: 'до 10 электронов' }[k], cx, cy + u + 78, 12.5, MUTED, 'center', 500);
      });
      text(c, 'Орбиталь — область, где электрон находится с наибольшей вероятностью', W / 2, 24, 13, MUTED, 'center', 500);
    }
  };

  // ---------- ионная связь ----------
  function shellAtom(c, x, y, sh, rad, col, sym, ct, opts = {}) {
    const n = sh.length, r0 = rad * .3, dr = (rad - r0) / n; const upto = opts.hideLast ? n - 1 : n;
    for (let i = 0; i < upto; i++) { const r = r0 + dr * (i + .5); const last = i === n - 1; c.save(); if (last && opts.fade != null) c.globalAlpha = opts.fade; ring(c, x, y, r, last ? 'rgba(91,63,208,.7)' : 'rgba(60,55,48,.4)', last ? 2 : 1.4, [4, 4]);
      const cnt = last && opts.outer != null ? opts.outer : sh[i]; for (let j = 0; j < cnt; j++) { const a = j / sh[i] * TAU + ct * (.8 - i * .15) * (i % 2 ? -1 : 1) + i; electron(c, x + Math.cos(a) * r, y + Math.sin(a) * r, last ? '#7a57ff' : '#3a6df0', 4.5); } c.restore(); }
    atom(c, x, y, r0 * .9, col, sym);
  }
  R.ionic = {
    draw(c, W, Hh, p, t, S) {
      const A = S.a, B = S.b, g = S.give, rad = Math.min(W * .17, Hh * .22), ay = Hh * .42;
      const approach = sm(.55, .85, p), xa = lerp(W * .25, W * .5 - rad * .55, approach), xb = lerp(W * .75, W * .5 + rad * .55, approach);
      const tr = clamp((p - .25) / .3), done = p > .55;
      // атом-донор
      const aOuter = A.sh[A.sh.length - 1], bOuter = B.sh[B.sh.length - 1];
      const flown = Math.floor(tr * g + .0001);
      shellAtom(c, xa, ay, A.sh, rad * (A.sh.length > 3 ? 1.15 : 1), A.col, A.el, t, { outer: aOuter - Math.min(g, Math.ceil(tr * g - .001 > 0 ? tr * g : 0)), fade: done ? 1 - sm(.55, .7, p) : 1, hideLast: false });
      shellAtom(c, xb, ay, B.sh, rad, B.col, B.el, t, { outer: bOuter + flown });
      // летящие электроны
      for (let k = 0; k < g; k++) { const s0 = k / g * .6, q = clamp((tr - s0) / (1 - s0 * 1.0)); if (q > 0 && q < 1) { const x = lerp(xa + rad * .8, xb - rad * .8, ease(q)), y = ay - Math.sin(q * Math.PI) * 50 - k * 14; electron(c, x, y, '#7a57ff', 6); } }
      if (done) { const a = sm(.55, .7, p); c.save(); c.globalAlpha = a; badge(c, xa, ay - rad - 18, g > 1 ? g + '+' : '+', '#e8665b'); badge(c, xb, ay - rad - 18, g > 1 ? g + '−' : '−', '#3a6df0'); c.restore(); }
      if (approach > .5) { c.save(); c.globalAlpha = (approach - .5) * 2; c.beginPath(); c.moveTo(W * .5 - 6, ay + rad * 1.1); c.lineTo(W * .5 + 6, ay + rad * 1.1); c.strokeStyle = '#8f7bff'; c.lineWidth = 4; c.stroke(); c.restore(); }
      // подписи
      const cap = p < .25 ? `${A.el} — металл: легко отдаёт внешние электроны` : p < .55 ? `${A.el} отдаёт ${g} e⁻ атому ${B.el}` : p < .85 ? 'образуются противоположно заряженные ионы' : 'ионы притягиваются: возникает ионная связь';
      pill(c, cap, W / 2, Hh * .86, 14);
      // кристаллик после связи
      if (p > .85) { const a = sm(.85, 1, p); const q = Math.min(3, Math.max(2, S.cell || 3)); for (let i = 0; i < q; i++) for (let j = 0; j < 2; j++) { const x = W / 2 + (i - q / 2 + .5) * 38, y = Hh * .66 + j * 34, cat = (i + j) % 2 === 0; c.save(); c.globalAlpha = a; atom(c, x, y, cat ? 13 : 17, cat ? A.col : B.col, cat ? '+' : '−'); c.restore(); } }
    },
    live: (p, S) => `${S.a.el}${S.give > 1 ? '' : ''}⁰ − ${S.give}e⁻ → ${S.a.el}${S.give > 1 ? S.give : ''}⁺ ;  ${S.b.el}⁰ + ${S.give}e⁻ → ${S.b.el}${S.give > 1 ? S.give : ''}⁻`.replace(/(\d)⁺/g, (m, d) => ['⁰', '¹', '²', '³'][d] + '⁺').replace(/(\d)⁻/g, (m, d) => ['⁰', '¹', '²', '³'][d] + '⁻')
  };

  // ---------- ковалентная связь ----------
  R.covalent = {
    draw(c, W, Hh, p, t, S) {
      const Ra = Math.min(W * .16, Hh * .2), cy = Hh * .42, n = S.bonds, ap = ease(clamp((p - .1) / .45));
      const d = lerp(W * .3, Ra * (n > 2 ? 1 : 1.2), ap), xa = W / 2 - d / 2 - (S.a.el === S.b.el ? 0 : 0), xb = W / 2 + d / 2;
      const ra = Ra * (S.a.r || 1), rb = Ra * (S.b.r || 1);
      const ca = rgba(CH.elc(S.a.el) === '#ffffff' ? '#7aa7ff' : CH.elc(S.a.el), .22), cb = rgba(CH.elc(S.b.el) === '#ffffff' ? '#7aa7ff' : CH.elc(S.b.el), .22);
      circle(c, xa, cy, ra); c.fillStyle = ca; c.fill(); ring(c, xa, cy, ra, 'rgba(60,55,48,.6)', 2); circle(c, xb, cy, rb); c.fillStyle = cb; c.fill(); ring(c, xb, cy, rb, 'rgba(60,55,48,.6)', 2);
      atom(c, xa, cy, 17, CH.elc(S.a.el), S.a.el); atom(c, xb, cy, 17, CH.elc(S.b.el), S.b.el);
      const shared = sm(.5, .72, p), shift = (S.polar ? (S.shift || .3) : 0) * shared;
      // электроны: общие пары в «линзе», остальные — по кольцу
      const mid = (xa + xb) / 2 + shift * Ra * .5;
      const draw = (x, v, ra_, dir, col) => { const free = v - n; for (let j = 0; j < free; j++) { const a = (j + .5) / Math.max(1, free) * 2.2 - 1.1 + (dir > 0 ? 0 : Math.PI) + (dir > 0 ? 0 : 0); const aa = dir > 0 ? Math.PI + (-1.15 + j * 2.3 / Math.max(1, free - 1 || 1)) * (free > 1 ? 1 : 0) + (free === 1 ? 0 : 0) : (-1.15 + j * 2.3 / Math.max(1, free - 1 || 1)) * (free > 1 ? 1 : 0); const th = (dir > 0 ? Math.PI : 0) + (free === 1 ? 0 : -1.2 + j * 2.4 / (free - 1)) + Math.sin(t * 2 + j) * .06; electron(c, x + Math.cos(th) * ra_ * (1 - 0), cy + Math.sin(th) * ra_, col); } };
      draw(xa, S.a.v, ra, 1, '#3a6df0'); draw(xb, S.b.v, rb, -1, '#e8665b');
      for (let k = 0; k < n; k++) {
        const yy = cy + (k - (n - 1) / 2) * 20; const e1x = lerp(xa - ra * .9, mid - 6, shared), e2x = lerp(xb + rb * .9, mid + 6, shared);
        const jy = Math.sin(t * 5 + k) * 1.2 * shared; electron(c, e1x, lerp(cy - 10 + k * 7, yy, shared) + jy, '#3a6df0'); electron(c, e2x, lerp(cy + 10 - k * 7, yy, shared) - jy, '#e8665b');
      }
      if (S.polar && shared > .5) { text(c, 'δ+', xa - ra * .2, cy - ra - 14, 20, '#e8665b'); text(c, 'δ−', xb + rb * .2, cy - rb - 14, 20, '#3a6df0'); }
      const f = S.formula; if (p > .75) { c.save(); c.globalAlpha = sm(.75, .95, p); text(c, f, W / 2, Hh * .72, 26, '#2b2823'); text(c, S.lewis, W / 2, Hh * .8, 20, '#5b3fd0'); c.restore(); }
      pill(c, p < .3 ? 'у каждого атома есть неспаренные электроны' : p < .6 ? 'электронные облака перекрываются' : `общих электронных пар: ${n}${S.polar ? ' (смещена к более электроотрицательному атому)' : ''}`, W / 2, Hh * .92, 13);
    }
  };

  // ---------- кристаллические решётки (3D) ----------
  function latticeData(kind) {
    const pts = [], bonds = [];
    if (kind === 'nacl') { const N = 3; for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) for (let k = 0; k < N; k++) pts.push({ x: i - 1, y: j - 1, z: k - 1, na: (i + j + k) % 2 === 0 });
      pts.forEach((a, i) => pts.forEach((b, j) => { if (j > i && Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + Math.abs(a.z - b.z) === 1) bonds.push([i, j]); })); }
    else if (kind === 'diamond') { const base = [[0, 0, 0], [0, .5, .5], [.5, 0, .5], [.5, .5, 0], [.25, .25, .25], [.25, .75, .75], [.75, .25, .75], [.75, .75, .25]]; const seen = new Map();
      [0, 1].forEach(i => [0, 1].forEach(j => [0, 1].forEach(k => base.forEach(b => { const q = [i + b[0], j + b[1], k + b[2]]; seen.set(q.join(','), q); }))));
      [0, 1, 2].forEach(i => [0, 1, 2].forEach(j => [0, 1, 2].forEach(k => { const q = [i, j, k]; if (!seen.has(q.join(',')) && ((i + j + k) % 1 === 0)) { const fc = (i % 1 === 0); } })));
      seen.forEach(q => pts.push({ x: q[0] * 1.6 - 1.6, y: q[1] * 1.6 - 1.6, z: q[2] * 1.6 - 1.6 }));
      const dd = Math.sqrt(3) / 4 * 1.6 * 1.05; pts.forEach((a, i) => pts.forEach((b, j) => { if (j > i && Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) < dd) bonds.push([i, j]); })); }
    else if (kind === 'graphite') { for (let L = 0; L < 3; L++) { const base = pts.length; const hx = 1, off = L % 2 ? .5 : 0;
        for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) for (const s of [0, 1]) { const x = (a * 1.5 + (b % 2 ? .75 : 0)) * hx, z = b * .87 * hx * 1 + (s ? .5 : 0) * 0; void x; }
        const hex = []; for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const cx = a * 1.73 + (b % 2 ? .866 : 0) + off, cz = b * 1.5 + off * .6; for (let k = 0; k < 6; k++) { const an = k * Math.PI / 3 + Math.PI / 6; hex.push([cx + Math.cos(an) * 1, cz + Math.sin(an) * 1]); } }
        const uniq = []; hex.forEach(h => { if (!uniq.some(u => Math.hypot(u[0] - h[0], u[1] - h[1]) < .1)) uniq.push(h); });
        uniq.forEach(u => pts.push({ x: u[0] * .8, y: (L - 1) * 1.5, z: u[1] * .8 }));
        for (let i = base; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) if (Math.hypot(pts[i].x - pts[j].x, pts[i].z - pts[j].z) < .8 * 1.05 && Math.abs(pts[i].y - pts[j].y) < .01) bonds.push([i, j]); } }
    return { pts, bonds };
  }
  R.lattice = {
    init(S) { return { d: latticeData(S.kind), r: null }; },
    draw(c, W, Hh, p, t, S, st) {
      const d = st.d, kind = S.kind, sc = Math.min(W, Hh) * (kind === 'graphite' ? .13 : kind === 'diamond' ? .17 : .2), cx = W / 2, cy = Hh * .46, th = t * .45 + .5, tilt = kind === 'graphite' ? .55 : .45;
      const asm = ease(clamp(p / .55));
      const P = d.pts.map((a, i) => { const hs = HS(i * 3.3), ang = HS(i + 5) * TAU, far = 4 + 3 * hs, ox = Math.cos(ang) * far, oy = (HS(i + 9) - .5) * far * 2, oz = Math.sin(ang) * far; const k = 1 - asm;
        const q = CH.rot3({ x: a.x + ox * k, y: a.y + oy * k, z: a.z + oz * k }, th, tilt); return { x: cx + q.x * sc, y: cy + q.y * sc, z: q.z, a }; });
      c.lineCap = 'round';
      if (asm > .7) { c.save(); c.globalAlpha = (asm - .7) / .3; d.bonds.forEach(([i, j]) => { c.beginPath(); c.moveTo(P[i].x, P[i].y); c.lineTo(P[j].x, P[j].y); c.lineWidth = kind === 'nacl' ? 2 : 4; c.strokeStyle = kind === 'nacl' ? 'rgba(60,55,48,.45)' : '#2b2823'; c.stroke(); }); c.restore(); }
      P.map((a, i) => i).sort((a, b) => P[a].z - P[b].z).forEach(i => { const a = P[i];
        if (kind === 'nacl') { const na = a.a.na; atom(c, a.x, a.y, (na ? 12 : 17) * (1 + a.z * .04 / 1), na ? '#9a6be8' : '#4fcf6a', ''); }
        else atom(c, a.x, a.y, kind === 'diamond' ? 9 : 8, '#5c5c60', ''); });
      const cap = { nacl: ['Na⁺', 'Cl⁻'], diamond: ['каждый атом C связан с 4 соседями (sp³)'], graphite: ['слои из шестиугольников, между слоями слабая связь'] }[kind];
      if (kind === 'nacl') { atom(c, W / 2 - 80, Hh * .9, 11, '#9a6be8', ''); text(c, 'Na⁺', W / 2 - 58, Hh * .9, 14, '#2b2823', 'left'); atom(c, W / 2 + 20, Hh * .9, 15, '#4fcf6a', ''); text(c, 'Cl⁻', W / 2 + 44, Hh * .9, 14, '#2b2823', 'left'); }
      else pill(c, cap[0], W / 2, Hh * .9, 13);
      pill(c, S.cap || '', W / 2, Hh * .08, 13);
    }
  };

  // ---------- сухой лёд / иод: молекулярная решётка и сублимация ----------
  R.molecular = {
    draw(c, W, Hh, p, t, S) {
      const cols = 7, rows = 5, sp = Math.min(W / (cols + 1), Hh * .5 / rows), x0 = W / 2 - (cols - 1) * sp / 2, y0 = Hh * .62 - (rows - 1) * sp / 2 - Hh * .08;
      const heat = sm(.25, .9, p); const mol = S.mol || 'CO2'; const m = CH.mol(mol); const kk = sp * .21;
      c.save(); rrect(c, x0 - sp, y0 - sp * .6, (cols + 1) * sp, (rows + .2) * sp, 14); c.fillStyle = 'rgba(180,215,255,' + (.18 - heat * .1) + ')'; c.fill(); c.restore();
      for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
        const i = r * cols + q, esc = clamp((heat - (1 - r / rows) * .55 - HS(i) * .25) * 3.2), vib = (.5 + heat * 5) * (1 + HS(i));
        const x = x0 + q * sp + Math.sin(t * 9 + i) * vib + Math.sin(esc * 3 + i) * 30 * esc, y = y0 + r * sp + Math.cos(t * 8 + i * 1.3) * vib - esc * (Hh * .5) * (.4 + HS(i + 3));
        if (y < 14) continue; CH.drawMol(c, m, x, y, kk * 1.5, t * .3 + i, .6, 1 - esc * .5);
      }
      pill(c, p < .25 ? 'молекулы удерживаются слабыми силами притяжения' : p < .85 ? 'нагревание: колебания усиливаются, молекулы покидают решётку' : 'твёрдое вещество сразу переходит в газ — сублимация', W / 2, Hh * .94, 13);
    }
  };

  // ---------- металлическая связь ----------
  R.metal = {
    draw(c, W, Hh, p, t, S) {
      const cols = 7, rows = 5, sp = Math.min(W / (cols + 1.5), Hh * .5 / rows), x0 = W / 2 - (cols - 1) * sp / 2, y0 = Hh * .42 - (rows - 1) * sp / 2;
      const field = sm(.35, .5, p) * (1 - sm(.68, .72, p)), shiftQ = sm(.72, .9, p);
      c.save(); rrect(c, x0 - sp, y0 - sp * .7, (cols + 1) * sp, (rows) * sp + sp * .4, 14); c.fillStyle = 'rgba(190,200,215,.25)'; c.fill(); c.restore();
      for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) { const sh = r < 2 ? shiftQ * sp * .9 : 0; const x = x0 + q * sp + sh + (r % 2 ? sp / 2 : 0) * 0, y = y0 + r * sp; atom(c, x, y, sp * .3, S.c || '#c9ccd1', '+'); }
      // электронный газ
      for (let i = 0; i < 38; i++) { const bx = x0 + HS(i) * (cols - 1) * sp, by = y0 + HS(i + 4) * (rows - 1) * sp, ax = Math.sin(t * 1.3 + i * 2) * sp * .45, ay = Math.cos(t * 1.1 + i * 3) * sp * .45;
        let x = bx + ax, y = by + ay; const drift = ((t * 70 + HS(i) * 500) % (cols * sp)) ; if (field > 0) x = lerp(x, x0 + drift - sp * .3, field * .85); x = x0 - sp * .4 + ((x - (x0 - sp * .4)) % ((cols) * sp) + cols * sp) % (cols * sp); electron(c, x, y, '#3a6df0', 4); }
      if (field > 0) { c.save(); c.globalAlpha = field; text(c, '− ← источник тока → +', W / 2, y0 + rows * sp + 10, 14, '#5b3fd0'); c.restore(); }
      pill(c, p < .35 ? 'электроны свободно перемещаются между катионами («электронный газ»)' : p < .7 ? 'в электрическом поле электроны движутся направленно — это электрический ток' : 'слои катионов сдвигаются, связь сохраняется — металл ковкий и пластичный', W / 2, Hh * .88, 13);
    }
  };

  // ---------- водородные связи, вода и лёд ----------
  R.hbond = {
    draw(c, W, Hh, p, t, S) {
      const n = 16, fr = S.freeze ? ease(sm(.45, .9, p)) : 0, cx = W / 2, cy = Hh * .46, sc = Math.min(W, Hh) * .095;
      // положения: лёд — узлы «пчелиных сот», жидкость — те же молекулы плотнее и в беспорядке
      if (!R.hbond.pts) { const P = [], a0 = 1.9; for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) { const x = Math.sqrt(3) * a0 * (i + j / 2), y = 1.5 * a0 * j; for (let k = 0; k < 6; k++) P.push([x + a0 * Math.cos(k * Math.PI / 3 + Math.PI / 6), y + a0 * Math.sin(k * Math.PI / 3 + Math.PI / 6)]); }
        const U = []; P.sort((A, B) => Math.hypot(...A) - Math.hypot(...B)).forEach(q => { if (!U.some(u => Math.hypot(u[0] - q[0], u[1] - q[1]) < .5)) U.push(q); }); R.hbond.pts = U.slice(0, n); }
      const pts = R.hbond.pts.map(([ix, iy], i) => { const lx = ix * .78 + Math.sin(t * 1.3 + i * 2.1) * .55, ly = iy * .78 + Math.cos(t * 1.1 + i * 1.7) * .55;
        return { x: cx + lerp(lx, ix, fr) * sc * .72, y: cy + lerp(ly, iy, fr) * sc * .72, th: lerp(t * .9 + i * 1.3, Math.atan2(iy, ix) + Math.PI / 2, fr) }; });
      // водородные связи — между O и ближайшими H
      const m = CH.mol('H2O');
      pts.forEach((A, i) => pts.forEach((B, j) => { if (j <= i) return; const d = Math.hypot(A.x - B.x, A.y - B.y); const lim = sc * .72 * 1.95 * lerp(1.15, 1.05, fr); if (d < lim) { c.beginPath(); c.moveTo(A.x, A.y); c.lineTo(B.x, B.y); c.setLineDash([5, 5]); c.lineDashOffset = -t * 10; c.lineWidth = 3; c.strokeStyle = `rgba(91,63,208,${(1 - d / lim * .5) * .9})`; c.stroke(); c.setLineDash([]); } }));
      pts.forEach(P => { const k = sc * .55; const mc = { atoms: m.atoms.map(a => ({ ...a })), bonds: m.bonds }; c.save(); c.translate(P.x, P.y); c.rotate(P.th); CH.drawMol(c, mc, 0, 0, k, 0, .62); c.restore(); });
      pill(c, S.freeze ? (fr < .3 ? 'жидкая вода: связи постоянно рвутся и образуются' : 'лёд: связи фиксированы, каркас «ажурный» → плотность меньше, чем у воды') : 'между молекулами воды — водородные связи (пунктир)', W / 2, Hh * .92, 13);
    }
  };

  // ---------- ДНК ----------
  R.dna = {
    draw(c, W, Hh, p, t, S) {
      const n = 22, cx = W / 2, top = Hh * .08, bot = Hh * .9, amp = Math.min(W * .18, 90), unz = sm(.5, .95, p);
      const pairs = [['#f2a23a', '#3a9fe8'], ['#3dbf6a', '#e8665b']];
      const pos = i => { const f = i / (n - 1); const y = top + (bot - top) * f; const th = f * 4.2 * Math.PI + t * 1.1; return { y, th }; };
      const rows = []; for (let i = 0; i < n; i++) { const { y, th } = pos(i); const split = unz * clamp(1.4 - (i / (n - 1)) * 1.4 + .15) * 1; rows.push({ i, y, x1: cx + Math.cos(th) * amp - split * W * .14, x2: cx - Math.cos(th) * amp + split * W * .14, z: Math.sin(th), split }); }
      rows.sort((a, b) => a.z - b.z).forEach(r => {
        const pc = pairs[r.i % 2]; const a = r.z * .5 + .75; const s1 = 9 + r.z * 2.5;
        c.save(); c.globalAlpha = a;
        const midx = (r.x1 + r.x2) / 2;
        if (r.split < .4) { c.beginPath(); c.moveTo(r.x1, r.y); c.lineTo(midx, r.y); c.lineWidth = 6; c.strokeStyle = pc[0]; c.stroke(); c.beginPath(); c.moveTo(midx, r.y); c.lineTo(r.x2, r.y); c.strokeStyle = pc[1]; c.stroke(); for (let k = -1; k <= 1; k += 2) { circle(c, midx + k * 4, r.y, 2); c.fillStyle = '#fff'; c.fill(); } }
        else { c.beginPath(); c.moveTo(r.x1, r.y); c.lineTo(r.x1 + 26, r.y); c.lineWidth = 6; c.strokeStyle = pc[0]; c.stroke(); c.beginPath(); c.moveTo(r.x2, r.y); c.lineTo(r.x2 - 26, r.y); c.strokeStyle = pc[1]; c.stroke();
          const nw = sm(.6, .95, p); c.globalAlpha = a * nw; c.beginPath(); c.moveTo(r.x1 + 28, r.y); c.lineTo(r.x1 + 54, r.y); c.strokeStyle = pc[1]; c.stroke(); c.beginPath(); c.moveTo(r.x2 - 28, r.y); c.lineTo(r.x2 - 54, r.y); c.strokeStyle = pc[0]; c.stroke(); c.globalAlpha = a; }
        circle(c, r.x1, r.y, s1); c.fillStyle = '#d9d4c9'; c.fill(); stroke(c, 2); circle(c, r.x2, r.y, s1); c.fillStyle = '#d9d4c9'; c.fill(); stroke(c, 2); c.restore();
      });
      const lab = (s, x, y) => pill(c, s, x, y, 12.5);
      lab('аденин ↔ тимин (A=T)', W * .2, Hh * .2); lab('гуанин ↔ цитозин (G≡C)', W * .2, Hh * .26);
      pill(c, p < .5 ? 'две цепи удерживаются водородными связями между основаниями' : 'при репликации цепи расходятся, каждая достраивает свою пару', W / 2, Hh * .96, 13);
    }
  };

  // ---------- полимеризация ----------
  R.polymer = {
    draw(c, W, Hh, p, t, S) {
      const N = S.n || 6, sp = Math.min(60, (W - 80) / (N * 2)), x0 = W / 2 - (N * 2 - 1) * sp / 2, yc = Hh * .55, subCol = S.subCol || '#4fcf6a', sub = S.sub || 'H';
      const units = []; for (let i = 0; i < N; i++) units.push({ i, sx: W * (.15 + .7 * HS(i * 1.7 + 1)), sy: Hh * (.15 + .22 * HS(i * 3.1 + 2)) });
      const jn = i => sm(.12 + i / N * .6, .24 + i / N * .6, p);
      units.forEach(u => {
        const q = ease(jn(u.i)), bx = lerp(u.sx + Math.sin(t * 1.3 + u.i) * 12, x0 + u.i * 2 * sp + 0, q), by = lerp(u.sy + Math.cos(t * 1.1 + u.i) * 8, yc, q);
        const c1 = { x: bx, y: by + (0) }, c2 = { x: bx + sp, y: by + (u.i % 2 ? 0 : 0) };
        const dbl = 1 - sm(.55, .9, q);
        // связь C=C → C–C
        c.lineCap = 'round'; [-1, 1].forEach(sg => { c.beginPath(); const off = sg * 3.5 * dbl; c.moveTo(c1.x, c1.y + off); c.lineTo(c2.x, c2.y + off); c.lineWidth = 5; c.strokeStyle = LINE; c.stroke(); c.beginPath(); c.moveTo(c1.x, c1.y + off); c.lineTo(c2.x, c2.y + off); c.lineWidth = 2; c.strokeStyle = '#e6e1d6'; c.stroke(); });
        if (q > .9 && u.i > 0) { c.beginPath(); c.moveTo(x0 + (u.i * 2 - 1) * sp, yc); c.lineTo(c1.x, c1.y); c.lineWidth = 8; c.strokeStyle = LINE; c.stroke(); c.beginPath(); c.moveTo(x0 + (u.i * 2 - 1) * sp, yc); c.lineTo(c1.x, c1.y); c.lineWidth = 4.5; c.strokeStyle = '#e6e1d6'; c.stroke(); }
        // заместители
        [[c1, -1, 'H'], [c1, 1, 'H'], [c2, -1, 'H'], [c2, 1, sub]].forEach(([P, s, lab]) => { const off = s * sp * .8; c.beginPath(); c.moveTo(P.x, P.y); c.lineTo(P.x, P.y + off); c.lineWidth = 4; c.strokeStyle = LINE; c.stroke(); atom(c, P.x, P.y + off, lab === 'H' ? 9 : 13, lab === 'H' ? '#ffffff' : subCol, lab === 'H' ? '' : lab); });
        atom(c, c1.x, c1.y, 14, '#5c5c60', ''); atom(c, c2.x, c2.y, 14, '#5c5c60', '');
      });
      if (p > .85) { const a = sm(.85, 1, p); c.save(); c.globalAlpha = a; text(c, '[', x0 - sp * 1.2, yc, 78, '#5b3fd0'); text(c, ']n', x0 + (N * 2 - 1) * sp + sp * 1.5, yc + 14, 48, '#5b3fd0'); c.restore(); }
      pill(c, p < .15 ? `мономеры: ${S.mon}` : p < .85 ? 'двойные связи раскрываются, молекулы соединяются в цепь' : `полимер: ${S.pol}`, W / 2, Hh * .92, 14);
    }
  };

  // ---------- эффект Тиндаля ----------
  R.tyndall = {
    draw(c, W, Hh, p, t, S) {
      const y0 = Hh * .55, cw = Math.min(W * .2, 130), ch = Hh * .34, xs = [W * .42, W * .72], on = sm(.1, .25, p);
      // лазер
      rrect(c, W * .08, y0 - 16, 70, 32, 8); c.fillStyle = '#4a4f5a'; c.fill(); stroke(c, 2.5); circle(c, W * .08 + 70, y0, 5); c.fillStyle = '#ff3b3b'; c.fill();
      xs.forEach((x, i) => { const left = x - cw / 2; c.save(); rrect(c, left, y0 - ch / 2, cw, ch, 10); c.clip();
        c.fillStyle = i ? 'rgba(235,235,225,.78)' : 'rgba(190,225,255,.5)'; c.fillRect(left, y0 - ch / 2, cw, ch);
        if (i) for (let k = 0; k < 70; k++) { const px = left + cw * HS(k) + Math.sin(t * 2 + k) * 4, py = y0 - ch / 2 + ch * HS(k + 6) + Math.cos(t * 2.3 + k) * 4; circle(c, px, py, 1.6 + HS(k + 2)); c.fillStyle = 'rgba(120,115,100,.55)'; c.fill(); }
        if (on > 0) { const bx = left; const g = c.createLinearGradient(bx, 0, bx + cw, 0); const a = i ? .85 : 0; g.addColorStop(0, `rgba(255,60,60,${a * on})`); g.addColorStop(1, `rgba(255,60,60,${a * on * .6})`); c.fillStyle = g; c.fillRect(bx, y0 - 6, cw, 12); }
        c.restore(); rrect(c, left, y0 - ch / 2, cw, ch, 10); stroke(c, 2.5); pill(c, i ? 'коллоидный раствор' : 'истинный раствор', x, y0 + ch / 2 + 26, 12.5); });
      c.beginPath(); c.moveTo(W * .08 + 75, y0); c.lineTo(xs[0] - cw / 2, y0); c.strokeStyle = `rgba(255,60,60,${.9 * on})`; c.lineWidth = 3; c.stroke(); c.beginPath(); c.moveTo(xs[0] + cw / 2, y0); c.lineTo(xs[1] - cw / 2, y0); c.stroke();
      pill(c, p < .1 ? 'лазерная указка включается…' : 'в коллоидном растворе частицы рассеивают свет — виден «светящийся путь»', W / 2, Hh * .9, 13);
    }
  };
})();
