'use strict';
// «Молекулы»: перестройка атомов по уравнению реакции. Строится автоматически из строки eq.
(() => {
  const { clamp, lerp, sm, ease, H, circle, stroke } = CH;

  function build(eq, r) {
    const P = CH.parseEq(eq); if (!P || !P.L.length || !P.R.length) return null;
    const inst = side => {
      let list = []; const tot = side.reduce((a, s) => a + s.coef * s.mol.atoms.length, 0); const cap = tot > 26 ? 1 : 4;
      side.forEach(sp => { for (let i = 0; i < Math.min(sp.coef, cap); i++) list.push({ mol: sp.mol, txt: sp.txt }); });
      return list;
    };
    const L = inst(P.L), R = inst(P.R);
    // раскладка по сетке
    const place = (list, x0, x1) => {
      const n = list.length, cols = Math.ceil(Math.sqrt(n * (x1 - x0) / (r.h * .62))), rows = Math.ceil(n / cols);
      const cw = (x1 - x0) / cols, ch = r.h * .62 / rows;
      list.forEach((m, i) => { const cI = i % cols, rI = Math.floor(i / cols); const inRow = Math.min(cols, n - rI * cols); const off = (cols - inRow) * cw / 2;
        m.cx = x0 + off + cw * (cI + .5); m.cy = r.y + r.h * .5 + (rI + .5 - rows / 2) * ch - r.h * .02; m.cw = cw; m.ch = ch; });
    };
    place(L, r.x + r.w * .04, r.x + r.w * .45); place(R, r.x + r.w * .55, r.x + r.w * .96);
    // общий масштаб (px на Å)
    let k = 1e9;
    [...L, ...R].forEach(m => { const ext = Math.max(.6, ...m.mol.atoms.map(a => Math.hypot(a.x, a.y, a.z))) + .6; k = Math.min(k, Math.min(m.cw, m.ch * .85) / (2 * ext)); });
    k = clamp(k, 12, 64);
    // сопоставление атомов
    const atomsOf = list => list.flatMap((m, mi) => m.mol.atoms.map((a, ai) => ({ s: a.s, m, mi, ai, a })));
    const RA = atomsOf(L), PA = atomsOf(R), used = new Set(), pairs = [];
    RA.forEach(ra => {
      let best = -1, bd = 1e18;
      PA.forEach((pa, i) => { if (used.has(i) || pa.s !== ra.s) return; const d = Math.hypot(pa.m.cx - ra.m.cx, pa.m.cy - ra.m.cy) + (pa.ai === ra.ai ? -5 : 0); if (d < bd) { bd = d; best = i; } });
      if (best >= 0) { used.add(best); pairs.push({ s: ra.s, from: ra, to: PA[best] }); } else pairs.push({ s: ra.s, from: ra, to: null });
    });
    PA.forEach((pa, i) => { if (!used.has(i)) pairs.push({ s: pa.s, from: null, to: pa }); });
    return { L, R, pairs, k, eq };
  }
  const rot = (a, th, tilt) => { const c = Math.cos(th), s = Math.sin(th); let x = a.x * c + a.z * s, z = -a.x * s + a.z * c, y = a.y; const ct = Math.cos(tilt), st = Math.sin(tilt); return { x, y: y * ct - z * st, z: y * st + z * ct }; };
  const posOf = (ref, k, t) => { if (!ref) return null; const th = t * .55 + ref.mi * .7, q = rot(ref.a, th, .35); return { x: ref.m.cx + q.x * k, y: ref.m.cy + q.y * k, z: q.z }; };

  function bond(c, A, B, o, a) {
    const dx = B.x - A.x, dy = B.y - A.y, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L; const offs = o === 3 ? [-5, 0, 5] : o === 2 ? [-3.5, 3.5] : [0];
    c.save(); c.globalAlpha *= a; c.lineCap = 'round';
    offs.forEach(d => { c.beginPath(); c.moveTo(A.x + nx * d, A.y + ny * d); c.lineTo(B.x + nx * d, B.y + ny * d); c.lineWidth = o > 1 ? 5 : 8; c.strokeStyle = CH.LINE; c.stroke(); });
    offs.forEach(d => { c.beginPath(); c.moveTo(A.x + nx * d, A.y + ny * d); c.lineTo(B.x + nx * d, B.y + ny * d); c.lineWidth = o > 1 ? 2.2 : 4.5; c.strokeStyle = '#e6e1d6'; c.stroke(); });
    c.restore();
  }

  CH.drawMicro = (c, r, spec, p, t, cache) => {
    CH.panel(c, r, 'Молекулы');
    if (!cache.m || cache.w !== r.w || cache.h !== r.h) { cache.m = build(typeof spec.mic === 'string' ? spec.mic : spec.eq, r); cache.w = r.w; cache.h = r.h; }
    const M = cache.m; if (!M) return;
    const f = Math.max(.68, Math.min(1.2, M.k / 26)), e = ease(clamp((p - .3) / .45));
    const so = 1 - sm(.3, .42, p), eo = sm(.62, .74, p), jig = (1 - sm(.1, .3, p)) * 1.5 + .8;
    c.save(); CH.rrect(c, r.x + 6, r.y + 6, r.w - 12, r.h - 12, 16); c.clip();
    // «столкновение»
    const fl = clamp((p - .42) / .3); if (fl > 0 && fl < 1) { circle(c, r.x + r.w / 2, r.y + r.h * .48, 14 + fl * 90); c.strokeStyle = `rgba(143,123,255,${.8 * (1 - fl)})`; c.lineWidth = 4; c.stroke(); }
    // стрелка
    c.fillStyle = '#7a7468'; c.font = '700 26px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('→', r.x + r.w / 2, r.y + r.h * .48);
    // положения
    const cur = M.pairs.map((pr, i) => {
      const A = posOf(pr.from, M.k, t), B = posOf(pr.to, M.k, t), jx = Math.sin(t * 7 + i * 1.9) * jig, jy = Math.cos(t * 6 + i * 2.3) * jig;
      let x, y, z, al = 1;
      if (A && B) { x = lerp(A.x, B.x, e); y = lerp(A.y, B.y, e) - Math.sin(Math.PI * e) * 24 * (i % 2 ? 1 : -1); z = lerp(A.z, B.z, e); }
      else if (A) { x = A.x + (r.x + r.w * .5 - A.x) * e * .2; y = A.y; z = A.z; al = 1 - sm(.35, .6, p); }
      else { x = B.x; y = B.y; z = B.z; al = sm(.5, .75, p); }
      return { x: x + jx, y: y + jy, z, al, s: pr.s };
    });
    // связи
    const idx = new Map(); M.pairs.forEach((pr, i) => { if (pr.from) idx.set('L' + pr.from.mi + '_' + pr.from.ai, i); if (pr.to) idx.set('R' + pr.to.mi + '_' + pr.to.ai, i); });
    const drawBonds = (list, tag, a) => { if (a <= .01) return; list.forEach((m, mi) => m.mol.bonds.forEach(([i, j, o]) => { const A = idx.get(tag + mi + '_' + i), B = idx.get(tag + mi + '_' + j); if (A != null && B != null) bond(c, cur[A], cur[B], o, a); })); };
    drawBonds(M.L, 'L', so); drawBonds(M.R, 'R', eo);
    // атомы по глубине
    const order = cur.map((a, i) => i).sort((a, b) => cur[a].z - cur[b].z);
    order.forEach(i => { const a = cur[i]; const [col, rad] = CH.EL[a.s] || ['#bbb', 16]; CH.atom(c, a.x, a.y, rad * f * (1 + a.z * .03), col, f > .8 ? a.s : '', a.al); });
    // заряды и подписи
    const lab = (list, al) => list.forEach(m => {
      const txt = (m.mol.charge ? m.mol.name.split('^')[0] + '^' + m.mol.charge : m.mol.name); c.globalAlpha = al; CH.text(c, txt, m.cx, m.cy + Math.min(m.ch * .42, r.h * .3), 13, '#2b2823'); c.globalAlpha = 1;
    });
    lab(M.L, 1 - sm(.3, .5, p)); lab(M.R, sm(.6, .8, p));
    c.restore();
  };
})();
