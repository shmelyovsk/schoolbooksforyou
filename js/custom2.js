'use strict';
// Динамические модели (скорость реакции, равновесие, электролиз, производство) и схемы.
(() => {
  const R = CH.R;
  const { clamp, lerp, sm, ease, H: HS, circle, rrect, stroke, text, pill, atom, mix, rgba, LINE } = CH;
  const MUTED = '#6b655b';
  const ionLab = (sym, q) => sym + (q > 1 ? ['', '', '²', '³'][q] : '') + '⁺';
  const anLab = (sym, q) => sym + (q > 1 ? ['', '', '²', '³'][q] : '') + '⁻';

  // ---------- скорость реакции: столкновения ----------
  R.collide = {
    stateful: true,
    init(S) { return { parts: [], eff: 0, tot: 0, T: S.T || 1, n: S.n || 10, cat: !!S.cat, acc: 0, hist: [], lastReset: 0, fresh: true }; },
    ctrl(S, st) {
      const o = [];
      if (S.ctl.includes('T')) o.push({ t: 'range', label: 'Температура', min: .4, max: 2.6, step: .1, val: st.T, fn: v => st.T = +v });
      if (S.ctl.includes('n')) o.push({ t: 'range', label: 'Концентрация', min: 4, max: 26, step: 1, val: st.n, fn: v => { st.n = +v; st.fresh = true; } });
      if (S.ctl.includes('cat')) o.push({ t: 'btn', label: 'Катализатор', on: st.cat, fn: (b) => { st.cat = !st.cat; b.classList.toggle('on', st.cat); } });
      o.push({ t: 'btn', label: '↻ Сначала', fn: () => { st.fresh = true; st.eff = st.tot = 0; } });
      return o;
    },
    live: (p, S, st) => `Столкновений A+B: ${st.tot} · из них эффективных: ${st.eff} (${st.tot ? Math.round(st.eff / st.tot * 100) : 0}%). Для реакции нужна энергия не меньше энергии активации.`,
    draw(c, W, Hh, p, t, S, st, dt) {
      const bw = Math.min(W * .78, Hh * 1.1), bh = Hh * .6, bx = W / 2 - bw / 2, by = Hh * .1, Ea = st.cat ? .45 : 1, v0 = 120 * Math.sqrt(st.T), r = 9;
      if (st.fresh) { st.fresh = false; st.parts = []; for (let i = 0; i < st.n; i++) for (const ty of ['A', 'B']) { const a = HS(i * 7 + (ty === 'A' ? 1 : 5) + st.lastReset) * TAU; st.parts.push({ x: bx + 20 + (bw - 40) * HS(i * 3 + (ty === 'A' ? 2 : 9) + st.lastReset), y: by + 20 + (bh - 40) * HS(i * 5 + (ty === 'A' ? 4 : 8) + st.lastReset), vx: Math.cos(a) * v0, vy: Math.sin(a) * v0, ty, flash: 0 }); } st.lastReset += 1; }
      const sp = Math.sqrt(st.T / (st._lastT || st.T)); st._lastT = st.T;
      dt = Math.min(dt, .05); const P = st.parts;
      P.forEach(a => { if (sp !== 1) { a.vx *= sp; a.vy *= sp; } a.x += a.vx * dt; a.y += a.vy * dt; if (a.x < bx + r) { a.x = bx + r; a.vx = Math.abs(a.vx); } if (a.x > bx + bw - r) { a.x = bx + bw - r; a.vx = -Math.abs(a.vx); } if (a.y < by + r) { a.y = by + r; a.vy = Math.abs(a.vy); } if (a.y > by + bh - r) { a.y = by + bh - r; a.vy = -Math.abs(a.vy); } a.flash = Math.max(0, a.flash - dt * 2); });
      for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) { const a = P[i], b = P[j]; if (a.ty === 'P' || b.ty === 'P' || a.ty === b.ty) continue; const dx = b.x - a.x, dy = b.y - a.y; if (dx * dx + dy * dy < 4 * r * r) {
        const rv = Math.hypot(a.vx - b.vx, a.vy - b.vy), E = (rv / (v0 * 1.15)) ** 2; st.tot++; a.flash = b.flash = 1;
        if (E > Ea * 1.0) { st.eff++; a.ty = 'P'; b.ty = 'P'; b.x = a.x + 2 * r * .9; b.y = a.y; b.vx = a.vx; b.vy = a.vy; } else { const t1 = a.vx, t2 = a.vy; a.vx = b.vx; a.vy = b.vy; b.vx = t1; b.vy = t2; a.x -= dx * .1; a.y -= dy * .1; b.x += dx * .1; b.y += dy * .1; } } }
      if (P.filter(a => a.ty === 'P').length >= P.length * .8) { st.timer = (st.timer || 0) + dt; if (st.timer > 1.5) { st.timer = 0; st.fresh = true; st.eff = st.tot = 0; } }
      rrect(c, bx, by, bw, bh, 18); c.fillStyle = 'rgba(255,255,255,.4)'; c.fill(); stroke(c, 3);
      P.forEach(a => { if (a.ty === 'P') { circle(c, a.x, a.y, r); c.fillStyle = '#3dbf6a'; c.fill(); stroke(c, 1.6); return; } const col = a.ty === 'A' ? '#3a6df0' : '#f2a23a'; const g = a.flash ? 3 + a.flash * 4 : 0; if (g) { circle(c, a.x, a.y, r + g); c.fillStyle = 'rgba(255,230,120,.5)'; c.fill(); } circle(c, a.x, a.y, r); c.fillStyle = col; c.fill(); stroke(c, 1.6); });
      // диаграмма энергии активации
      const dx = W / 2 - 130, dy = by + bh + 30; c.save(); c.translate(dx, dy);
      c.beginPath(); c.moveTo(0, 60); c.bezierCurveTo(60, 60, 80, 60 - 55 * Ea, 130, 60 - 55 * Ea); c.bezierCurveTo(180, 60 - 55 * Ea, 200, 60, 260, 60); c.lineWidth = 3; c.strokeStyle = st.cat ? '#3dbf6a' : '#e8665b'; c.stroke();
      c.setLineDash([4, 4]); c.beginPath(); c.moveTo(0, 60 - 55 * Ea); c.lineTo(260, 60 - 55 * Ea); c.lineWidth = 1; c.strokeStyle = MUTED; c.stroke(); c.setLineDash([]); c.restore();
      text(c, 'Eₐ ' + (st.cat ? '(с катализатором ниже)' : ''), dx + 130, dy - 6 + (st.cat ? 20 : 0), 12, MUTED);
      pill(c, `A + B → AB    ·    t = ${st.T.toFixed(1)}   ·   частиц каждого сорта: ${st.n}`, W / 2, Hh * .965, 12.5);
    }
  };

  // ---------- химическое равновесие 2NO₂ ⇌ N₂O₄ ----------
  R.equil = {
    stateful: true,
    init() { return { parts: [], T: 1, V: 1, na: 40, nb: 0, fresh: true, acc: 0 }; },
    ctrl(S, st) {
      const mk = (label, fn) => ({ t: 'btn', label, fn: () => { fn(); } });
      return [mk('🔥 Нагреть', () => st.T = Math.min(2.2, st.T * 1.5)), mk('❄ Охладить', () => st.T = Math.max(.4, st.T / 1.5)), mk('⏬ Сжать', () => { st.V = st.V === 1 ? .5 : 1; }), mk('➕ NO₂', () => { st.na += 10; st.fresh = true; }), mk('↻ Сначала', () => { st.na = 40; st.nb = 0; st.T = 1; st.V = 1; st.fresh = true; })];
    },
    live: (p, S, st) => `NO₂ (бурый): ${st.na} · N₂O₄ (бесцветный): ${st.nb}. Температура ×${st.T.toFixed(1)}, объём ×${st.V}. Система сама смещается так, чтобы ослабить внешнее воздействие.`,
    draw(c, W, Hh, p, t, S, st, dt) {
      dt = Math.min(dt, .05); const bw = Math.min(W * .56, Hh * .78), bh = Hh * .56 * st.V, bx = W * .08, by = Hh * .1 + (Hh * .56 - bh);
      st.acc += dt; const kf = .006, kb = .12 * st.T * st.T; const ev = (rate) => { let k = Math.floor(rate * dt); if (Math.random() < rate * dt - k) k++; return k; };
      const f = ev(kf * st.na * Math.max(0, st.na - 1) / st.V), b = ev(kb * st.nb);
      for (let i = 0; i < f && st.na >= 2; i++) { st.na -= 2; st.nb += 1; } for (let i = 0; i < b && st.nb >= 1; i++) { st.nb -= 1; st.na += 2; }
      // синхронизация частиц
      const want = st.na + st.nb; while (st.parts.length < want) st.parts.push({ x: bx + 20 + (bw - 40) * Math.random(), y: by + 20 + (bh - 40) * Math.random(), vx: (Math.random() - .5) * 140, vy: (Math.random() - .5) * 140, ty: 'A' });
      while (st.parts.length > want) st.parts.pop(); let ca = 0; st.parts.forEach(q => { if (q.ty === 'A') ca++; });
      st.parts.forEach(q => { if (ca > st.na && q.ty === 'A') { q.ty = 'B'; ca--; } }); ca = st.parts.filter(q => q.ty === 'A').length; st.parts.forEach(q => { if (ca < st.na && q.ty === 'B') { q.ty = 'A'; ca++; } });
      const sp = Math.sqrt(st.T); st.parts.forEach(q => { q.x += q.vx * sp * dt; q.y += q.vy * sp * dt; if (q.x < bx + 10 || q.x > bx + bw - 10) { q.vx *= -1; q.x = clamp(q.x, bx + 10, bx + bw - 10); } if (q.y < by + 10 || q.y > by + bh - 10) { q.vy *= -1; q.y = clamp(q.y, by + 10, by + bh - 10); } });
      // колба
      const fr = st.na / 40; rrect(c, bx, by, bw, bh, 14); c.fillStyle = `rgba(150,85,30,${.1 + .5 * fr * .8})`; c.fill(); stroke(c, 3);
      st.parts.forEach(q => { if (q.ty === 'A') { atom(c, q.x, q.y, 9, '#9a5a22', ''); } else { circle(c, q.x, q.y, 12); c.fillStyle = 'rgba(255,255,255,.7)'; c.fill(); stroke(c, 1.6); circle(c, q.x - 4, q.y, 5); circle(c, q.x + 4, q.y, 5); c.fillStyle = 'rgba(150,170,190,.6)'; c.fill(); } });
      // столбики
      const x0 = bx + bw + 40, bwd = 46, maxH = Hh * .5, yb = Hh * .66;
      [[st.na, '#9a5a22', 'NO₂', 1], [st.nb, '#9fb3c8', 'N₂O₄', 1]].forEach(([n, col, lab], i) => { const h = n / 40 * maxH * (i ? 2 : 1) * .6 + 2, x = x0 + i * (bwd + 24); rrect(c, x, yb - h, bwd, h, 6); c.fillStyle = col; c.fill(); stroke(c, 2); text(c, lab, x + bwd / 2, yb + 16, 13, '#2b2823'); text(c, String(n), x + bwd / 2, yb - h - 12, 14, '#2b2823'); });
      text(c, '2NO₂ ⇌ N₂O₄ + Q', W * .5, Hh * .9, 18, '#5b3fd0');
      pill(c, st.T > 1.2 ? 'нагрели → равновесие сместилось влево (больше NO₂, цвет темнее)' : st.T < .9 ? 'охладили → равновесие сместилось вправо (больше N₂O₄, светлее)' : st.V < 1 ? 'сжали → равновесие смещается к меньшему числу молекул газа' : 'прямая и обратная реакции идут с одинаковой скоростью', W / 2, Hh * .96, 12.5);
    }
  };

  // ---------- электролиз ----------
  R.electro = {
    draw(c, W, Hh, p, t, S) {
      const bw = Math.min(W * .62, 420), bh = Hh * .42, bx = W / 2 - bw / 2, by = Hh * .36, on = sm(.08, .2, p), q = clamp((p - .12) / .8);
      const ec = x => bx + bw * x, topy = by - Hh * .18;
      // батарея и провода
      const cxL = ec(.22), cxR = ec(.78);
      c.lineWidth = 3; c.strokeStyle = LINE; c.beginPath(); c.moveTo(cxL, topy); c.lineTo(cxL, Hh * .08); c.lineTo(W / 2 - 34, Hh * .08); c.moveTo(cxR, topy); c.lineTo(cxR, Hh * .08); c.lineTo(W / 2 + 34, Hh * .08); c.stroke();
      c.lineWidth = 5; c.beginPath(); c.moveTo(W / 2 - 34, Hh * .08 - 12); c.lineTo(W / 2 - 34, Hh * .08 + 12); c.stroke(); c.lineWidth = 3; c.beginPath(); c.moveTo(W / 2 + 34, Hh * .08 - 20); c.lineTo(W / 2 + 34, Hh * .08 + 20); c.stroke();
      text(c, '−', cxL - 16, Hh * .08 - 14, 18, '#3a6df0'); text(c, '+', cxR + 16, Hh * .08 - 14, 18, '#e8665b');
      // сосуд
      const ml = S.melt; c.save(); rrect(c, bx, by, bw, bh, 18); c.clip(); const g = c.createLinearGradient(0, by, 0, by + bh); g.addColorStop(0, ml ? 'rgba(255,170,90,.85)' : rgba(S.liq || '#dff0ff', .7)); g.addColorStop(1, ml ? 'rgba(235,120,50,.9)' : rgba(S.liq || '#dff0ff', .85)); c.fillStyle = g; c.fillRect(bx, by + 14, bw, bh);
      if (ml) { CH.glow(c, bx + bw / 2, by + bh, bw * .5, '#ff7a2a', .5); }
      // слой металла на катоде (до того как нарисуем электрод)
      const cat = S.cathode, an = S.anode;
      // ионы
      const nI = 8, span = bw * .56;
      const ions = (spec, dir, k) => { for (let i = 0; i < nI; i++) { const ph = (t * (.1 + .05 * HS(i + k)) * (on > 0 ? 1 : 0) + HS(i + k * 3)) % 1; const lin = dir < 0 ? 1 - ph : ph; const x = lerp(cxL + 16, cxR - 16, lin) + Math.sin(t * 2 + i) * 3, y = by + 36 + (bh - 60) * HS(i * 2 + k) + Math.sin(t * 1.5 + i * 2) * 5; const edge = dir < 0 ? lin < .04 : lin > .96;
          const near = dir < 0 ? sm(.15, 0, lin) : sm(.85, 1, lin); if (spec.hidden) continue; atom(c, x, y, spec.q > 1 ? 11 : 10, spec.c, ionLab2(spec, dir)); void edge; void near; } };
      const ionLab2 = (spec, dir) => dir < 0 ? (spec.q > 1 ? spec.q + '+' : '+') : (spec.q > 1 ? spec.q + '−' : '−');
      ions(S.catI, -1, 1); ions(S.anI, 1, 7); if (S.catI2) ions(S.catI2, -1, 13); if (S.anI2) ions(S.anI2, 1, 19);
      // осадок на катоде
      if (cat.kind === 'metal') { const th = 3 + 22 * q; c.fillStyle = cat.c; c.fillRect(cxL - 7 - th, by + 12, th * 2 + 14, bh * .56); c.fillStyle = cat.c; }
      if (cat.kind === 'gas') for (let i = 0; i < 12 * on; i++) { const ph = (t * .5 + HS(i)) % 1; circle(c, cxL + (HS(i + 2) - .5) * 24, by + bh * .6 - ph * bh * .55, 3 + HS(i + 4) * 2); c.fillStyle = 'rgba(255,255,255,.7)'; c.fill(); c.lineWidth = 1; c.strokeStyle = cat.c || '#9ac'; c.stroke(); }
      if (an.kind === 'gas') for (let i = 0; i < 14 * on; i++) { const ph = (t * .55 + HS(i + 5)) % 1; circle(c, cxR + (HS(i + 9) - .5) * 26, by + bh * .6 - ph * bh * .55, 3.5 + HS(i + 1) * 2.5); c.fillStyle = rgba(an.c || '#d6f06a', .75); c.fill(); c.lineWidth = 1; c.strokeStyle = 'rgba(60,60,40,.6)'; c.stroke(); }
      if (cat.kind === 'liquid') { const th = 4 + 28 * q; rrect(c, cxL - 16 - th, by + bh - 24, th * 2 + 32, 18 + 8 * q, 8); c.fillStyle = cat.c; c.fill(); stroke(c, 1.5); }
      c.restore(); rrect(c, bx, by, bw, bh, 18); stroke(c, 3);
      // электроды
      const el = (x, col, over) => { rrect(c, x - 7, topy, 14, bh * .62 + (by - topy), 4); c.fillStyle = col; c.fill(); stroke(c, 2.5); };
      if (cat.kind === 'object') { const base = cat.base || '#9aa6b2'; rrect(c, cxL - 14, topy, 28, 14, 4); c.fillStyle = '#7d7a72'; c.fill(); stroke(c, 2); c.beginPath(); c.ellipse(cxL, by + bh * .55, 22, 36, 0, 0, TAU); c.fillStyle = mix(base, cat.coat, q); c.fill(); stroke(c, 2.5); c.fillRect(cxL - 3, topy + 8, 6, by + bh * .55 - 36 - topy - 6); c.beginPath(); c.rect(cxL - 3, topy + 8, 6, by + bh * .55 - 36 - topy - 6); c.fillStyle = mix(base, cat.coat, q); c.fill(); stroke(c, 2); }
      else el(cxL, '#4a4a50');
      if (an.kind === 'dissolve') { const w = 14 * (1 - .6 * q); rrect(c, cxR - w / 2, topy, w, bh * .62 + (by - topy), 4); c.fillStyle = an.c; c.fill(); stroke(c, 2.5); } else el(cxR, '#4a4a50');
      text(c, 'катод (−)', cxL, by + bh + 20, 13, '#3a6df0'); text(c, 'анод (+)', cxR, by + bh + 20, 13, '#e8665b');
      if (S.catTxt) pill(c, S.catTxt, cxL, by + bh + 52, 12.5); if (S.anTxt) pill(c, S.anTxt, cxR, by + bh + 52, 12.5);
      pill(c, p < .1 ? 'ток выключен: ионы движутся хаотично' : 'ток включён: катионы идут к катоду, анионы — к аноду', W / 2, Hh * .94, 13);
    }
  };

  // ---------- химико-технологическая схема ----------
  R.plant = {
    draw(c, W, Hh, p, t, S) {
      const X = x => W * x, Y = y => Hh * y, boxes = S.boxes.map(b => ({ ...b, x: X(b.x), y: Y(b.y) }));
      const B = i => boxes[i];
      // трубы
      const path = [[X(.02), Y(.42)], [B(0).x, Y(.42)], [B(1).x, Y(.42)], [B(2).x, Y(.42)], [B(3).x, Y(.42)], [B(4).x, Y(.42)]];
      const recycle = [[B(4).x, Y(.42)], [B(4).x, Y(.14)], [B(0).x, Y(.14)], [B(0).x, Y(.42)]], exitp = [[B(4).x, Y(.42)], [B(4).x, Y(.84)]];
      c.lineCap = 'round'; c.lineJoin = 'round'; const poly = (pts, col) => { c.beginPath(); pts.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.lineWidth = 12; c.strokeStyle = LINE; c.stroke(); c.lineWidth = 8; c.strokeStyle = col; c.stroke(); };
      poly(path, '#e4e0d6'); poly(recycle, '#d9e3f0'); poly(exitp, '#d9f0df');
      const len = pts => { const L = []; let s = 0; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); L.push(d); s += d; } return { L, s }; };
      const at = (pts, f) => { const { L, s } = len(pts); let d = f * s; for (let i = 0; i < L.length; i++) { if (d <= L[i]) { const k = d / L[i]; return [lerp(pts[i][0], pts[i + 1][0], k), lerp(pts[i][1], pts[i + 1][1], k)]; } d -= L[i]; } return pts[pts.length - 1]; };
      const n = 26, rx = B(2).x;
      for (let i = 0; i < n; i++) {
        const conv = HS(i + 3) < (S.conv || .3), f = ((t * .07 + i / n) % 1);
        const pm = [[...path], ...[]][0]; const mainLen = len(path).s, recLen = len(recycle).s, exLen = len(exitp).s;
        const tot = conv ? mainLen + exLen : mainLen + recLen, d = f * tot; let pos, col;
        if (d < mainLen) { pos = at(path, d / mainLen); col = pos[0] < rx ? (i % 2 ? S.cA : S.cB) : conv ? S.cP : (i % 2 ? S.cA : S.cB); }
        else if (conv) { pos = at(exitp, (d - mainLen) / exLen); col = S.cP; } else { pos = at(recycle, (d - mainLen) / recLen); col = i % 2 ? S.cA : S.cB; }
        void pm; circle(c, pos[0], pos[1], 6); c.fillStyle = col; c.fill(); c.lineWidth = 1.5; c.strokeStyle = LINE; c.stroke();
      }
      // аппараты
      boxes.forEach((b, i) => { const w = b.w || 90, h = b.h || 110; rrect(c, b.x - w / 2, Y(.42) - h / 2, w, h, 14); c.fillStyle = b.fill || 'rgba(255,255,255,.88)'; c.fill(); stroke(c, 3); text(c, b.t, b.x, Y(.42) - h / 2 - 16, 13, '#2b2823'); if (b.sub) text(c, b.sub, b.x, Y(.42) + h / 2 + 16, 11, MUTED, 'center', 500);
        if (b.cat) { for (let k = 0; k < 18; k++) { circle(c, b.x + (HS(k) - .5) * w * .7, Y(.42) + (HS(k + 4) - .5) * h * .6, 3); c.fillStyle = '#8a8a90'; c.fill(); } }
        if (b.hot) { CH.glow(c, b.x, Y(.42), w * .9, '#ff7a2a', .35 + .1 * Math.sin(t * 3)); } });
      text(c, 'возврат непрореагировавших газов', (B(0).x + B(4).x) / 2, Y(.09), 12, MUTED, 'center', 500);
      text(c, S.out, B(4).x, Y(.92), 14, '#2b8a4b'); text(c, S.inp, X(.1), Y(.56), 12, MUTED, 'center', 500);
      // легенда
      [[S.cA, S.nA], [S.cB, S.nB], [S.cP, S.nP]].forEach(([col, nm], i) => { const x = W * .22 + i * W * .22; circle(c, x - 40, Hh * .96, 6); c.fillStyle = col; c.fill(); stroke(c, 1.5); text(c, nm, x - 28, Hh * .96, 13, '#2b2823', 'left'); });
    }
  };

  // ---------- шкала pH ----------
  R.ph = {
    draw(c, W, Hh, p, t, S) {
      const x0 = W * .07, x1 = W * .93, y = Hh * .5, h = 30, g = c.createLinearGradient(x0, 0, x1, 0);
      ['#e8372f', '#f26a2d', '#f6a52e', '#f4d93b', '#a8d84a', '#4fcf6a', '#3dbf9a', '#3a9fe8', '#4a5fd6', '#6b3fc4', '#7a2ea8'].forEach((cc, i, a) => g.addColorStop(i / (a.length - 1), cc));
      rrect(c, x0, y, x1 - x0, h, 15); c.fillStyle = g; c.fill(); stroke(c, 2.5);
      for (let i = 0; i <= 14; i++) { const x = lerp(x0, x1, i / 14); text(c, String(i), x, y + h + 16, 12, '#2b2823', 'center', 600); }
      text(c, 'кислотная среда', lerp(x0, x1, .18), y - 70, 13, '#c0392b'); text(c, 'нейтральная', lerp(x0, x1, .5), y - 70, 13, '#2b8a4b'); text(c, 'щелочная среда', lerp(x0, x1, .82), y - 70, 13, '#3a4fc4');
      S.items.forEach((it, i) => { const x = lerp(x0, x1, it.ph / 14); c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 18 - (i % 2) * 22); c.lineWidth = 1.5; c.strokeStyle = 'rgba(43,40,35,.5)'; c.stroke(); c.font = '20px system-ui'; c.textAlign = 'center'; c.fillStyle = '#000'; c.fillText(it.e, x, y - 28 - (i % 2) * 22); });
      const N = S.items.length, f = p * N, i = Math.min(N - 1, Math.floor(f)), it = S.items[i], q = ease(clamp(f - i)) , prev = S.items[Math.max(0, i - 1)], ph = lerp(i === 0 ? it.ph : prev.ph, it.ph, i === 0 ? 1 : clamp(f - i) * 1.6 > 1 ? 1 : clamp((f - i) * 1.6));
      const px = lerp(x0, x1, ph / 14); c.beginPath(); c.moveTo(px, y + h + 34); c.lineTo(px - 9, y + h + 50); c.lineTo(px + 9, y + h + 50); c.closePath(); c.fillStyle = '#5b3fd0'; c.fill(); stroke(c, 2);
      void q; c.font = '54px system-ui'; c.textAlign = 'center'; c.fillStyle = '#000'; c.fillText(it.e, W / 2, Hh * .78); text(c, it.n, W / 2, Hh * .88, 20, '#2b2823'); text(c, 'pH ≈ ' + it.ph, W / 2, Hh * .95, 16, '#5b3fd0');
    }
  };

  // ---------- закономерности по периоду/группе ----------
  R.trend = {
    draw(c, W, Hh, p, t, S) {
      const n = S.els.length, mx = Math.max(...S.els.map(e => e[1])), sp = (W - 60) / n, base = Hh * .62;
      S.els.forEach((e, i) => { const a = ease(sm(i / n * .7, i / n * .7 + .3, p)), r = Math.min(sp * .46, Hh * .2) * (e[1] / mx) * (.5 + .5 * a), x = 30 + sp * (i + .5);
        c.save(); c.globalAlpha = a; atom(c, x, base - r * 0 - Hh * .12, r, S.col || '#9a6be8', e[0]); text(c, e[0], x, base + 18, 18, '#2b2823'); text(c, `${e[1]} пм`, x, base + 40, 12.5, MUTED, 'center', 500); if (S.extra) text(c, S.extra[i], x, base + 60, 12.5, MUTED, 'center', 500); c.restore(); });
      c.beginPath(); c.moveTo(30, Hh * .88); c.lineTo(W - 30, Hh * .88); c.lineWidth = 3; c.strokeStyle = '#5b3fd0'; c.stroke(); const ax = W - 30; c.beginPath(); c.moveTo(ax - 10, Hh * .88 - 7); c.lineTo(ax, Hh * .88); c.lineTo(ax - 10, Hh * .88 + 7); c.stroke();
      pill(c, S.arrow, W / 2, Hh * .94, 13); pill(c, S.head, W / 2, Hh * .08, 13);
    }
  };

  // ---------- энергетический профиль реакции ----------
  R.energy = {
    draw(c, W, Hh, p, t, S) {
      const x0 = W * .12, x1 = W * .88, yb = Hh * .8, yt = Hh * .14, y1 = lerp(yb, yt, S.start || .35), y2 = y1 - (S.dH || 0) * (yb - yt) * .4, ea = (S.Ea || .35) * (yb - yt);
      const fy = (x, k) => lerp(y1, y2, CH.sm(.3, .7, x)) - ea * k * Math.exp(-(((x - .5) / .13) ** 2));
      c.lineWidth = 2; c.strokeStyle = LINE; c.beginPath(); c.moveTo(x0, yt); c.lineTo(x0, yb); c.lineTo(x1, yb); c.stroke(); text(c, 'энергия', x0 + 6, yt - 8, 12, MUTED, 'left', 500); text(c, 'ход реакции →', x1, yb + 18, 12, MUTED, 'right', 500);
      const curve = (k, col, dash) => { c.beginPath(); for (let i = 0; i <= 80; i++) { const x = i / 80, xx = lerp(x0, x1, x); i ? c.lineTo(xx, fy(x, k)) : c.moveTo(xx, fy(x, k)); } c.setLineDash(dash || []); c.lineWidth = 3.5; c.strokeStyle = col; c.stroke(); c.setLineDash([]); };
      curve(1, S.cat ? 'rgba(232,102,91,.6)' : '#e8665b', S.cat ? [6, 6] : null); if (S.cat) curve(.5, '#3dbf6a');
      const kk = S.cat && p > .5 ? .5 : 1, q = S.cat ? (p < .5 ? p / .5 : (p - .5) / .5) : p, bx = clamp(q), xx = lerp(x0, x1, bx);
      atom(c, xx, fy(bx, kk) - 12, 11, '#5b3fd0', ''); text(c, 'исходные вещества', x0 + 100, y1 - 18, 13, '#2b2823'); text(c, 'продукты', x1 - 60, y2 - 18, 13, '#2b2823');
      c.setLineDash([4, 4]); c.beginPath(); c.moveTo(x0, y1); c.lineTo(x1, y1); c.lineWidth = 1; c.strokeStyle = MUTED; c.stroke(); c.setLineDash([]);
      const top = fy(.5, 1); c.beginPath(); c.moveTo(lerp(x0, x1, .5), y1); c.lineTo(lerp(x0, x1, .5), top); c.lineWidth = 2; c.strokeStyle = '#e8665b'; c.stroke(); text(c, 'Eₐ', lerp(x0, x1, .5) + 18, (y1 + top) / 2, 15, '#e8665b');
      if (S.dH) { c.beginPath(); c.moveTo(x1 - 30, y1); c.lineTo(x1 - 30, y2); c.lineWidth = 2; c.strokeStyle = '#3a6df0'; c.stroke(); text(c, S.dH > 0 ? 'ΔH < 0 (выделяется Q)' : 'ΔH > 0 (поглощается Q)', x1 - 40, (y1 + y2) / 2, 12.5, '#3a6df0', 'right'); }
      pill(c, S.cap, W / 2, Hh * .93, 13);
    }
  };

  // ---------- перенос электронов ----------
  R.redox = {
    draw(c, W, Hh, p, t, S) {
      const a = S.red, b = S.ox, n = a.n, ay = Hh * .42, xa = W * .25, xb = W * .75, r = Math.min(W * .1, Hh * .14), tr = clamp((p - .25) / .35), pos = x => x;
      atom(c, xa, ay, r, a.c, a.el); atom(c, xb, ay, r, b.c, b.el);
      for (let k = 0; k < n; k++) {
        const kq = clamp((tr * (n + .6) - k * .6) / 1); const home = (k / n) * TAU + t * .6, hx = xa + Math.cos(home) * (r + 14), hy = ay + Math.sin(home) * (r + 14), tx = xb + Math.cos(Math.PI + (k - (n - 1) / 2) * .6) * (r + 14), ty = ay + Math.sin(Math.PI + (k - (n - 1) / 2) * .6) * (r + 14);
        const q = ease(clamp(kq)); const x = lerp(hx, tx, q), y = lerp(hy, ty, q) - Math.sin(q * Math.PI) * 60; electron(c, x, y, '#3a6df0', 7); }
      if (p > .6) { c.save(); c.globalAlpha = sm(.6, .75, p); badge(c, xa + r * .9, ay - r * .9, n > 1 ? n + '+' : '+', '#e8665b'); badge(c, xb + r * .9, ay - r * .9, '0', '#8d8a84'); c.restore(); }
      else badge(c, xb + r * .9, ay - r * .9, n > 1 ? n + '+' : '+', '#e8665b'), badge(c, xa + r * .9, ay - r * .9, '0', '#8d8a84');
      text(c, 'восстановитель', xa, ay + r + 34, 15, '#2b2823'); text(c, 'окислитель', xb, ay + r + 34, 15, '#2b2823');
      c.save(); c.globalAlpha = sm(.5, .7, p); text(c, S.redTxt, xa, Hh * .76, 15, '#e8665b'); text(c, S.oxTxt, xb, Hh * .76, 15, '#3a6df0'); c.restore();
      pill(c, 'Сколько электронов отдал восстановитель — столько принял окислитель', W / 2, Hh * .93, 13);
    }
  };
  function electron(c, x, y, col, r = 5.5) { circle(c, x, y, r); c.fillStyle = col; c.fill(); c.lineWidth = 1.5; c.strokeStyle = LINE; c.stroke(); }
  function badge(c, x, y, s, col) { c.save(); circle(c, x, y, 13); c.fillStyle = col; c.fill(); stroke(c, 2); c.fillStyle = '#fff'; c.font = '700 13px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(s, x, y + 1); c.restore(); }

  // ---------- сравнение: предсказано / найдено ----------
  R.compare = {
    draw(c, W, Hh, p, t, S) {
      const rows = S.rows, y0 = Hh * .26, rh = Math.min(54, (Hh * .6) / (rows.length + 1)), cw = [W * .3, W * .3, W * .3], xs = [W * .06, W * .38, W * .7];
      ['', S.h1, S.h2].forEach((h, i) => { if (h) pill(c, h, xs[i] + cw[i] / 2, y0 - 30, 14, i === 2); });
      rows.forEach((r, i) => { const a = sm(i / (rows.length + 1) * .8, i / (rows.length + 1) * .8 + .2, p), y = y0 + i * rh + rh / 2; c.save(); c.globalAlpha = a; rrect(c, W * .04, y - rh * .42, W * .92, rh * .84, 12); c.fillStyle = 'rgba(255,255,255,.6)'; c.fill(); text(c, r[0], xs[0], y, 14, MUTED, 'left', 600); text(c, r[1], xs[1] + cw[1] / 2, y, 16, '#2b2823'); const b = sm(.55 + i * .05, .8 + i * .04, p); c.globalAlpha = a * b; text(c, r[2], xs[2] + cw[2] / 2, y, 16, '#2b8a4b'); c.restore(); });
      pill(c, S.cap, W / 2, Hh * .93, 13);
    }
  };

  // ---------- вращающиеся молекулы ----------
  R.mol3d = {
    draw(c, W, Hh, p, t, S) {
      const n = S.mols.length, cols = n > 3 ? 2 : n, rows = Math.ceil(n / cols);
      S.mols.forEach((m, i) => { const mol = CH.mol(m.f), cx = W * ((i % cols) + .5) / cols, cy = Hh * (.1 + .8 * (Math.floor(i / cols) + .5) / rows) - 6, cell = Math.min(W / cols, Hh * .8 / rows), k = cell * .85 / (2 * Math.max(1, Math.max(...mol.atoms.map(a => Math.hypot(a.x, a.y, a.z))) + .5)), a = ease(sm(i * .12, i * .12 + .3, p));
        c.save(); c.globalAlpha = a; CH.drawMol(c, mol, cx, cy - 8, Math.min(k, 62), t * .7 + i, Math.min(1.1, Math.max(.7, k / 38))); text(c, m.n, cx, cy + cell * .34 + 8, 14, '#2b2823'); text(c, m.d, cx, cy + cell * .34 + 28, 12, MUTED, 'center', 500); c.restore(); });
    }
  };
})();
