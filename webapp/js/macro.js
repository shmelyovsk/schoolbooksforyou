'use strict';
// «Опыт»: лабораторная посуда, реактивы и наблюдаемые эффекты (цвет, осадок, газ, пламя…).
// Всё считается как функция прогресса p∈[0,1] и времени t, поэтому анимацию можно перематывать.
(() => {
  const { clamp, lerp, sm, H, mix, rgba, circle, rrect, stroke, LINE } = CH;
  const KIND = { tube: [.2, .85], beaker: [.5, .62], flask: [.62, .78], jar: [.5, .72], dish: [.82, .2], cruc: [.36, .24], bottle: [.34, .8] };

  function geom(kind, cx, by, S) {
    const [w, h] = KIND[kind] || KIND.beaker; const W = w * S, Hh = h * S;
    const m = { kind, l: cx - W / 2, r: cx + W / 2, top: by - Hh, bot: by, cx, W, H: Hh };
    if (kind === 'flask') { m.nl = cx - W * .13; m.nr = cx + W * .13; m.ny = m.top + Hh * .32; }
    if (kind === 'bottle') { m.nl = cx - W * .2; m.nr = cx + W * .2; m.ny = m.top + Hh * .28; }
    return m;
  }
  function vpath(c, m) {
    c.beginPath(); const rb = Math.min(m.W * .3, 26);
    if (m.kind === 'flask' || m.kind === 'bottle') {
      c.moveTo(m.nl, m.top); c.lineTo(m.nl, m.ny); c.lineTo(m.l, m.bot - rb); c.quadraticCurveTo(m.l, m.bot, m.l + rb, m.bot); c.lineTo(m.r - rb, m.bot);
      c.quadraticCurveTo(m.r, m.bot, m.r, m.bot - rb); c.lineTo(m.nr, m.ny); c.lineTo(m.nr, m.top);
    } else if (m.kind === 'tube') {
      const R = m.W / 2; c.moveTo(m.l, m.top); c.lineTo(m.l, m.bot - R); c.arc(m.cx, m.bot - R, R, Math.PI, 0, true); c.lineTo(m.r, m.top);
    } else if (m.kind === 'cruc') {
      c.moveTo(m.l, m.top); c.lineTo(m.l + m.W * .12, m.bot - 4); c.quadraticCurveTo(m.l + m.W * .15, m.bot, m.l + m.W * .3, m.bot); c.lineTo(m.r - m.W * .3, m.bot);
      c.quadraticCurveTo(m.r - m.W * .15, m.bot, m.r - m.W * .12, m.bot - 4); c.lineTo(m.r, m.top);
    } else {
      c.moveTo(m.l, m.top); c.lineTo(m.l, m.bot - rb); c.quadraticCurveTo(m.l, m.bot, m.l + rb, m.bot); c.lineTo(m.r - rb, m.bot);
      c.quadraticCurveTo(m.r, m.bot, m.r, m.bot - rb); c.lineTo(m.r, m.top);
    }
  }
  const win = (s, d) => s.win || d || [.15, .8];
  const prog = (s, p) => sm(win(s)[0], win(s)[1], p);

  // ---------- твёрдые тела ----------
  function lump(c, x, y, r, col, seed = 1, k = 1) {
    c.beginPath(); const n = 8;
    for (let i = 0; i < n; i++) { const a = i / n * TAU, rr = r * (.75 + .35 * H(seed * 7 + i)); const px = x + Math.cos(a) * rr * 1.15, py = y + Math.sin(a) * rr * .85; i ? c.lineTo(px, py) : c.moveTo(px, py); }
    c.closePath(); c.fillStyle = col; c.fill(); stroke(c, 2);
    c.fillStyle = 'rgba(255,255,255,.35)'; circle(c, x - r * .3, y - r * .3, r * .22); c.fill();
  }
  function solid(c, m, s, q, p, t, lev) {
    if (!s) return;
    const k = 1 - (s.gone || 0) * q; if (k <= .02) return;
    const f = s.f || 'lump', col = s.c2 ? mix(s.c || '#9aa6b2', s.c2, q) : (s.c || '#9aa6b2'), n = s.n || 5, u = m.W;
    const surf = m.bot - lev * m.H * (m.kind === 'tube' ? 1 : 1);
    let x = m.cx + (s.dx || 0) * u, y = m.bot - u * .1;
    if (s.pos === 'float') { y = surf - u * .04 + Math.sin(t * 2.2) * 2; x += Math.sin(t * .8) * u * .12 * (s.roam === false ? 0 : 1); }
    c.save();
    if (f === 'lump') lump(c, x, y - u * .04, u * .13 * k, col, 3);
    else if (f === 'gran') for (let i = 0; i < n; i++) lump(c, x + (H(i) - .5) * u * .5, y - H(i + 4) * u * .06, u * .06 * k, col, i + 2);
    else if (f === 'pellets') for (let i = 0; i < n; i++) { const px = x + (H(i + 1) - .5) * u * .5, py = y - H(i + 8) * u * .1; c.beginPath(); c.ellipse(px, py, u * .06 * k, u * .04 * k, 0, 0, TAU); c.fillStyle = col; c.fill(); stroke(c, 1.5); }
    else if (f === 'powder') {
      const hh = u * .13 * k; c.beginPath(); c.moveTo(x - u * .32, y + u * .06); c.quadraticCurveTo(x, y - hh * 2.2, x + u * .32, y + u * .06); c.closePath(); c.fillStyle = col; c.fill(); stroke(c, 2);
      for (let i = 0; i < 14; i++) { c.fillStyle = 'rgba(255,255,255,.28)'; circle(c, x + (H(i) - .5) * u * .45, y + u * .04 - H(i + 3) * hh * 1.4, 1.6); c.fill(); }
    } else if (f === 'crystal') for (let i = 0; i < n; i++) {
      const px = x + (H(i) - .5) * u * .5, py = y - H(i + 5) * u * .1, r = u * .06 * k; c.save(); c.translate(px, py); c.rotate(H(i + 9) * 2); c.beginPath();
      c.moveTo(0, -r * 1.2); c.lineTo(r, 0); c.lineTo(0, r * 1.2); c.lineTo(-r, 0); c.closePath(); c.fillStyle = col; c.fill(); stroke(c, 1.6); c.restore();
    } else if (f === 'strip' || f === 'nail' || f === 'wire') {
      const top = m.top - u * .22, len = (s.len || .85) * m.H * k, w = (f === 'wire' ? u * .035 : f === 'nail' ? u * .05 : u * .09), xx = m.cx + (s.dx || 0) * u;
      const col2 = s.coat ? mix(col, s.coat, q) : col;
      c.beginPath(); if (f === 'nail') { c.moveTo(xx - w, top); c.lineTo(xx + w, top); c.lineTo(xx + w * .5, top + len - w * 2); c.lineTo(xx, top + len); c.lineTo(xx - w * .5, top + len - w * 2); }
      else if (f === 'wire') { for (let i = 0; i <= 10; i++) { const yy = top + len * i / 10, off = Math.sin(i * 1.7) * w; i ? c.lineTo(xx + off, yy) : c.moveTo(xx + off, yy); } }
      else c.rect(xx - w, top, w * 2, len);
      if (f === 'wire') { c.lineWidth = w; c.strokeStyle = col2; c.lineCap = 'round'; c.stroke(); } else { c.fillStyle = col2; c.fill(); stroke(c, 2); }
      if (s.tree) { // «серебряное дерево»
        c.strokeStyle = s.tree; c.lineWidth = 1.6; const nb = Math.round(26 * q);
        for (let i = 0; i < nb; i++) { const yy = top + len * (.2 + .75 * H(i + 2)), dir = i % 2 ? 1 : -1, L = u * (.05 + .1 * H(i + 7)) * q * 1.3; c.beginPath(); c.moveTo(xx, yy); c.lineTo(xx + dir * L, yy - L * .6); c.lineTo(xx + dir * L * 1.5, yy - L * .5); c.stroke(); }
      }
    } else if (f === 'ball') { circle(c, x, y - u * .02, u * .08 * k); c.fillStyle = col; c.fill(); stroke(c, 2); c.fillStyle = 'rgba(255,255,255,.55)'; circle(c, x - u * .025, y - u * .05, u * .02); c.fill(); }
    else if (f === 'ingot') { c.beginPath(); c.moveTo(x - u * .2, y); c.lineTo(x - u * .14, y - u * .12 * k); c.lineTo(x + u * .14, y - u * .12 * k); c.lineTo(x + u * .2, y); c.closePath(); c.fillStyle = col; c.fill(); stroke(c, 2); }
    c.restore();
  }

  // ---------- эффекты ----------
  function bubbles(c, m, x0, x1, yb, yt, t, n, col, sz, k) {
    for (let i = 0; i < n * k; i++) {
      const ph = (t * (.28 + .45 * H(i)) + H(i + 9)) % 1, y = yb - (yb - yt) * ph;
      const x = x0 + (x1 - x0) * H(i + 3) + Math.sin(t * 3 + i) * 3, r = sz * (.5 + H(i + 5));
      circle(c, x, y, r); c.fillStyle = 'rgba(255,255,255,.55)'; c.fill(); c.lineWidth = 1.2; c.strokeStyle = col; c.stroke();
    }
  }
  function flame(c, x, y, s, col, t, seed = 0) {
    const f = 1 + .08 * Math.sin(t * 17 + seed) + .06 * Math.sin(t * 9 + seed * 2);
    const layer = (k, cc, a) => {
      c.beginPath(); c.moveTo(x, y - s * 1.6 * f * k); c.bezierCurveTo(x + s * .5 * k, y - s * .7 * k, x + s * .55 * k, y, x, y); c.bezierCurveTo(x - s * .55 * k, y, x - s * .5 * k, y - s * .7 * k, x, y - s * 1.6 * f * k);
      c.fillStyle = rgba(cc, a); c.fill();
    };
    layer(1, col, .9); layer(.62, '#ffd36b', .95); layer(.3, '#ffffff', .9);
  }
  function glowCircle(c, x, y, r, col, a) {
    const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0)); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
  }
  function smoke(c, x, y, h, t, col, k, w = 22) {
    for (let i = 0; i < 12; i++) { const ph = (t * .3 + i / 12) % 1; circle(c, x + Math.sin(ph * 6 + i) * w * ph + (H(i) - .5) * w, y - ph * h, 6 + ph * 22); c.fillStyle = rgba(col, .35 * k * (1 - ph)); c.fill(); }
  }
  function sparks(c, x, y, t, col, k, R) {
    for (let i = 0; i < 26; i++) { const a = H(i) * TAU, ph = (t * .9 + H(i + 4)) % 1, d = R * ph * (.4 + H(i + 7)); circle(c, x + Math.cos(a) * d, y + Math.sin(a) * d * .8 - ph * 10, 2 * (1 - ph)); c.fillStyle = rgba(col, k * (1 - ph)); c.fill(); }
  }
  function burner(c, x, y, S, on, t) {
    const w = S * .16; c.beginPath(); c.moveTo(x - w, y); c.lineTo(x - w * .5, y - S * .13); c.lineTo(x + w * .5, y - S * .13); c.lineTo(x + w, y); c.closePath(); c.fillStyle = '#8d8a84'; c.fill(); stroke(c, 2);
    rrect(c, x - w * .22, y - S * .26, w * .44, S * .14, 3); c.fillStyle = '#b7b3aa'; c.fill(); stroke(c, 2);
    if (on > 0) { c.save(); c.globalAlpha = on; flame(c, x, y - S * .26, S * .06, '#6aa7ff', t, 1); c.restore(); }
  }
  function dropper(c, m, s, p, t, a1) {
    const x = m.cx, tip = m.top - m.W * .45; c.save();
    const out = 1 - sm(a1 * .85, a1, p); c.globalAlpha = clamp(out + .0);
    c.fillStyle = 'rgba(255,255,255,.7)'; rrect(c, x - 5, tip - 46, 10, 40, 3); c.fill(); stroke(c, 2);
    c.beginPath(); c.moveTo(x - 5, tip - 6); c.lineTo(x, tip + 12); c.lineTo(x + 5, tip - 6); c.closePath(); c.fill(); stroke(c, 2);
    c.fillStyle = '#c9544a'; circle(c, x, tip - 52, 9); c.fill(); stroke(c, 2);
    c.fillStyle = rgba(s.c, .85); c.fillRect(x - 3.5, tip - 28, 7, 22);
    const nd = s.n || 5;
    for (let i = 0; i < nd; i++) { const per = a1 / nd, lt = (p - i * per) / per * 1.1; if (lt > 0 && lt < 1) { const y = tip + 12 + lt * (m.bot - m.H * .4 - tip - 12); circle(c, x, y, 4 + (1 - lt) * 1.5); c.fillStyle = rgba(s.c, .95); c.fill(); } }
    c.restore();
  }
  function powderFall(c, m, s, p, a1) {
    if (p > a1 * 1.02) return; const x = m.cx;
    for (let i = 0; i < 26; i++) { const lt = (p / a1 * 1.2 - i / 30); if (lt < 0 || lt > 1) continue; const y = m.top - m.W * .35 + lt * (m.bot - m.H * .3 - m.top + m.W * .35); circle(c, x + (H(i) - .5) * 18, y, 2.4); c.fillStyle = s.c; c.fill(); }
    c.save(); c.translate(x, m.top - m.W * .5); c.rotate(-.5); rrect(c, -14, -18, 28, 22, 5); c.fillStyle = '#e8e0d0'; c.fill(); stroke(c, 2); c.restore();
  }

  // ---------- одна ёмкость ----------
  function vessel(c, s, cx, by, S, p, t, lab, rectTop) {
    const q = prog(s, p), kind = s.v || 'beaker', m = geom(kind, cx, by, S); const lev = s.lev == null ? .55 : s.lev;
    const liqs = Array.isArray(s.liq) ? s.liq : [s.liq || '#dff0ff', s.liq || '#dff0ff'];
    const surfY = m.bot - lev * m.H * (kind === 'cruc' ? .8 : 1); const heat = s.heat;
    const hot = heat ? sm(.05, .4, p) : 0;
    // подставка/горелка
    if (heat) { burner(c, cx, m.bot + S * .3, S, hot > 0 ? 1 : 0, t); c.lineWidth = 3; c.strokeStyle = LINE; c.beginPath(); c.moveTo(cx - S * .2, m.bot + 2); c.lineTo(cx + S * .2, m.bot + 2); c.moveTo(cx - S * .18, m.bot + 2); c.lineTo(cx - S * .24, m.bot + S * .3); c.moveTo(cx + S * .18, m.bot + 2); c.lineTo(cx + S * .24, m.bot + S * .3); c.stroke(); }
    // фон-свечение
    if (s.glow) { const g = s.glow; glowCircle(c, cx, m.bot - m.H * .3, S * .7, g.c || '#ff7a2a', (g.a == null ? .5 : g.a) * (g.t ? sm(g.t[0], g.t[1], p) : q)); }
    // емкость: содержимое
    c.save(); vpath(c, m); c.clip();
    c.fillStyle = 'rgba(255,255,255,.22)'; c.fillRect(m.l, m.top, m.W, m.H);
    // атмосфера (газ)
    if (s.gasfill) { const g = s.gasfill, gq = g.t ? sm(g.t[0], g.t[1], p) : q, col = g.c1 ? CH.mixA(g.c0 || g.c, g.c1, gq) : CH.rgb(g.c0 || g.c); c.fillStyle = CH.col(col, (g.a == null ? .6 : g.a) * (g.c1 ? 1 : gq)); c.fillRect(m.l, m.top, m.W, m.H * 1.01); for (let i = 0; i < 4; i++) { c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 8; c.beginPath(); const yy = m.top + m.H * (.2 + .2 * i); c.moveTo(m.l, yy + Math.sin(t + i) * 5); c.bezierCurveTo(m.l + m.W * .3, yy - 10 + Math.sin(t * .7 + i) * 6, m.l + m.W * .6, yy + 12, m.r, yy + Math.cos(t + i) * 5); c.stroke(); } }
    // жидкость
    if (lev > 0 && !s.dry) {
      const lc = CH.mixA(liqs[0], liqs[1], q), la = s.liqA == null ? .72 : s.liqA;
      const g = c.createLinearGradient(0, surfY, 0, m.bot); g.addColorStop(0, CH.col(lc.map(v => Math.min(255, v + 18)), la)); g.addColorStop(1, CH.col(lc.map(v => v * .88), Math.min(1, la + .1)));
      c.fillStyle = g; c.beginPath(); c.moveTo(m.l - 4, m.bot + 4); c.lineTo(m.l - 4, surfY);
      for (let i = 0; i <= 12; i++) c.lineTo(m.l - 4 + (m.W + 8) * i / 12, surfY + Math.sin(t * 2 + i * 1.3) * (1.2 + (s.gas ? 1.2 * q : 0)));
      c.lineTo(m.r + 4, m.bot + 4); c.closePath(); c.fill();
      // эмульсия
      if (s.emul) { const e = s.emul, sh = sm(0, .3, p) * (1 - sm(.4, .55, p)), st = sm(.45, .9, p); const hL = m.H * lev * .3; const yTopL = surfY;
        for (let i = 0; i < 46; i++) { const sx = m.l + 6 + (m.W - 12) * H(i), sy = surfY + 6 + (m.bot - surfY - 10) * H(i + 7) + Math.sin(t * 6 + i) * 3 * sh; const ty = yTopL + hL * .5 * H(i + 3); const y = lerp(sy, ty, st), r = 3 + 3 * H(i + 2) + st * 4; const vis = p < .05 ? 0 : 1; if (vis) { circle(c, sx, y, r * (1 - .1 * st)); c.fillStyle = rgba(e.c, .85); c.fill(); c.lineWidth = 1; c.strokeStyle = 'rgba(0,0,0,.25)'; c.stroke(); } }
        if (st > 0) { c.fillStyle = rgba(e.c, .8 * st); c.fillRect(m.l, yTopL, m.W, hL * st); }
        if (p < .05) { c.fillStyle = rgba(e.c, .85); c.fillRect(m.l, yTopL, m.W, hL); }
      }
      // осадок: хлопья и слой
      if (s.ppt) {
        const pp = Object.assign({}, s.ppt), a = pp.a || [.2, .5], gn = pp.gone, q1 = sm(a[0], a[1], p), qg = gn ? sm(gn[0], gn[1], p) : 0, vis = q1 * (1 - qg);
        if (pp.c2) pp.c = CH.col(CH.mixA(pp.c, pp.c2, q)).replace(/rgba\((\d+),(\d+),(\d+),1\)/, (z, r, g, b) => '#' + [r, g, b].map(v => (+v).toString(16).padStart(2, '0')).join(''));
        if (vis > 0) {
          const turb = pp.turb == null ? .5 : pp.turb; const settle = pp.noSettle ? 0 : sm(a[1] - .05, Math.min(1, a[1] + .3), p) * (1 - qg);
          c.fillStyle = rgba(pp.c, turb * vis * (1 - settle * .75)); c.fillRect(m.l, surfY, m.W, m.bot - surfY);
          if (pp.flakes) for (let i = 0; i < 30; i++) { const ph = (t * .25 + H(i)) % 1; const y = surfY + ph * (m.bot - surfY - 8); circle(c, m.l + 6 + (m.W - 12) * H(i + 3), y, 2.4); c.fillStyle = rgba(pp.c, vis * (1 - settle)); c.fill(); }
          const hh = (pp.amt || 1) * m.H * .1 * Math.max(settle, q1 * .3) * (1 - qg);
          if (hh > .5) { c.beginPath(); c.moveTo(m.l - 2, m.bot + 2); for (let i = 0; i <= 10; i++) c.lineTo(m.l + m.W * i / 10, m.bot - hh - Math.sin(i * 2.3) * 2); c.lineTo(m.r + 2, m.bot + 2); c.closePath(); c.fillStyle = rgba(pp.c, .95); c.fill(); stroke(c, 1.5); }
        }
      }
      // кристаллы/покрытие на дне — через sol
    }
    if (s.mirror) { const mq = prog(s, p); c.fillStyle = rgba(s.mirror, .75 * mq); c.fillRect(m.l, m.top + m.H * .08, m.W * .14, m.H * .3); c.fillRect(m.r - m.W * .14, m.top + m.H * .08, m.W * .14, m.H * .3); for (let i = 0; i < 6; i++) { circle(c, m.l + m.W * (.1 + .8 * H(i)), m.top + m.H * (.45 + .1 * H(i + 2)) + 2, 2.2 * mq); c.fillStyle = rgba(s.mirror, .95); c.fill(); } }
    // твёрдое
    if (s.sol && !(s.sol.pos === 'hang' && false)) solid(c, m, s.sol, q, p, t, lev);
    if (s.sol2) solid(c, m, s.sol2, q, p, t, lev);
    // пузырьки
    if (s.gas) { const g = s.gas, ga = g.a || [.15, .8], act = sm(ga[0], ga[0] + .06, p) * (1 - sm(ga[1], ga[1] + .12, p)) * (g.rate == null ? 1 : g.rate); const x0 = m.l + m.W * .2, x1 = m.r - m.W * .2; bubbles(c, m, g.src === 'sol' && s.sol ? m.cx - m.W * .15 : x0, g.src === 'sol' && s.sol ? m.cx + m.W * .15 : x1, m.bot - 6, surfY, t * (g.speed || 1), 20, g.c || '#9ac', Math.max(2.5, m.W * .028), act); }
    if (s.foam) { const f = s.foam, fq = sm(f.t ? f.t[0] : .15, f.t ? f.t[1] : .85, p); const hh = m.H * .5 * fq; for (let i = 0; i < 44; i++) { const px = m.l + m.W * (.05 + .9 * H(i)), py = surfY - hh * H(i + 5) * 1.2 - 4; const r = 4 + 6 * H(i + 8); if ((surfY - py) < hh + 4) { circle(c, px, py, r); c.fillStyle = rgba(f.c || '#ffffff', .9); c.fill(); c.lineWidth = 1; c.strokeStyle = 'rgba(0,0,0,.25)'; c.stroke(); } } }
    c.restore();
    // пена выходит за край
    if (s.foam && s.foam.over) { const fq = sm(.5, .95, p); const hh = m.H * .25 * fq; for (let i = 0; i < 28; i++) { const ml = m.nl || m.l, mw = (m.nr || m.r) - ml; const px = ml - 8 + (mw + 16) * H(i + 20), py = m.top - hh * H(i + 22); circle(c, px, py, 5 + 5 * H(i + 24)); c.fillStyle = rgba(s.foam.c || '#fff', .92); c.fill(); c.lineWidth = 1; c.strokeStyle = 'rgba(0,0,0,.25)'; c.stroke(); } }
    // контур
    vpath(c, m); c.lineWidth = 3; c.strokeStyle = LINE; c.lineJoin = 'round'; c.stroke();
    c.beginPath(); c.moveTo(m.l + 5, m.top + m.H * .12); c.lineTo(m.l + 5, m.top + m.H * .55); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 3; c.stroke();
    // обод
    c.beginPath(); c.moveTo((m.nl || m.l) - 3, m.top); c.lineTo((m.nr || m.r) + 3, m.top); c.lineWidth = 3; c.strokeStyle = LINE; c.stroke();
    if (kind === 'jar' && s.lid !== false && s.lid) { rrect(c, m.l - 4, m.top - 12, m.W + 8, 12, 4); c.fillStyle = '#b6b0a2'; c.fill(); stroke(c, 2.5); }
    if (kind === 'tube' || kind === 'flask') { /* пробка не рисуем: видно содержимое */ }
    // жар
    if (hot > 0 && s.steam !== false) { for (let i = 0; i < 4; i++) { const ph = (t * .4 + i / 4) % 1; c.strokeStyle = `rgba(255,255,255,${.5 * hot * (1 - ph)})`; c.lineWidth = 3; c.beginPath(); const xx = m.cx + (i - 1.5) * m.W * .18; c.moveTo(xx, m.top - 8 - ph * 40); c.bezierCurveTo(xx + 6, m.top - 22 - ph * 40, xx - 6, m.top - 30 - ph * 40, xx, m.top - 44 - ph * 40); c.stroke(); } }
    // пламя / вспышка / дым
    if (s.fire) {
      const f = s.fire, ft = f.t || [.15, .85], fa = sm(ft[0], ft[0] + .05, p) * (1 - sm(ft[1], ft[1] + .08, p)); const fx = cx + (f.dx || 0) * S, fy = f.at === 'surface' ? surfY : f.at === 'top' ? m.top : (m.bot - m.H * (f.h == null ? .2 : f.h));
      if (fa > 0) {
        if (f.flash) { const pk = Math.sin(clamp((p - ft[0]) / (ft[1] - ft[0])) * Math.PI); glowCircle(c, fx, fy - S * .1, S * (.5 + .9 * pk), f.c || '#fffbe0', .95 * pk * fa); if (!f.noFlame) { c.save(); c.globalAlpha = fa; flame(c, fx, fy, S * .14 * (f.size || 1), f.c2 || '#ffffff', t, 2); c.restore(); } }
        else { c.save(); c.globalAlpha = fa; glowCircle(c, fx, fy - S * .1, S * .35 * (f.size || 1), f.c || '#ff9a3d', .45); flame(c, fx, fy, S * .09 * (f.size || 1), f.c || '#ff9a3d', t, 3); c.restore(); }
        if (f.sparks) sparks(c, fx, fy - S * .08, t, f.sparks, fa, S * .55);
        if (f.smoke) smoke(c, fx, fy - S * .1, S * .6, t, f.smoke, fa * (f.smoke_k || 1));
      }
    }
    if (s.smoke) { const sk = s.smoke, sa = sm(sk.t ? sk.t[0] : .2, (sk.t ? sk.t[0] : .2) + .1, p) * (sk.t ? 1 - sm(sk.t[1], sk.t[1] + .1, p) : 1); if (sa > 0) smoke(c, cx, m.top + 4, S * .7, t, sk.c, sa, m.W * .4); }
    if (s.spark) { const sp = s.spark, ph = (p - sp.t[0]) / (sp.t[1] - sp.t[0]); if (ph > 0 && ph < 1) { c.save(); vpath(c, m); c.clip(); const n = 5; for (let i = 0; i < n; i++) { const a = (H(i) * .8 + .1) * Math.PI, xx = m.cx + (H(i + 3) - .5) * m.W * .5; c.strokeStyle = rgba('#ffe27a', Math.random() < .3 ? .3 : .9 * Math.sin(ph * Math.PI)); c.lineWidth = 2; c.beginPath(); c.moveTo(xx, m.top + 10); c.lineTo(xx + Math.sin(i * 7 + t * 20) * 14, m.top + m.H * .4); c.lineTo(xx + Math.cos(i * 5 + t * 20) * 14, m.bot - 10); c.stroke(); } c.restore(); } }
    // реагент: пипетка / порошок
    if (s.drip) dropper(c, m, s.drip, p, t, (s.drip.t || .15));
    if (s.add) powderFall(c, m, s.add, p, s.add.t || .15);
    // подпись
    if (lab) CH.pill(c, lab, cx, by + (heat ? S * .3 : 0) + 22, Math.max(11, Math.min(14, S * .075)));
  }

  // подставка-стол
  function bench(c, r, y) {
    rrect(c, r.x + 14, y, r.w - 28, 10, 5); c.fillStyle = document.documentElement.classList.contains('dark') ? '#5b5448' : '#d9c9a8'; c.fill(); stroke(c, 2);
  }

  CH.drawMacro = (c, r, spec, p, t) => {
    CH.panel(c, r, spec.v === 'look' ? '' : 'Опыт');
    const arr = spec.vs || [spec]; const n = arr.length; const S = Math.min(r.h * .66, r.w / n * 1.5, 360);
    const y = r.y + r.h * .84; bench(c, r, y);
    arr.forEach((s, i) => {
      const cx = r.x + r.w * (i + .5) / n;
      c.save(); CH.rrect(c, r.x + 6, r.y + 6, r.w - 12, r.h - 12, 16); c.clip();
      vessel(c, Object.assign({}, spec.vs ? { win: spec.win } : {}, s), cx, s.heat ? y - S * .3 : y, S, p, t, s.lab, r.y);
      c.restore();
    });
    if (spec.tag) CH.pill(c, spec.tag, r.x + r.w / 2, r.y + 20, 13, true);
  };
  CH.vesselGeom = geom; CH.vesselPath = vpath; CH.flame = flame; CH.glow = glowCircle; CH.smoke = smoke; CH.sparks = sparks; CH.bubbles = bubbles; CH.bench = bench; CH.lump = lump;
})();
