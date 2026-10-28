'use strict';
// Физика 11: теория относительности, излучение и спектры, кванты, атом и ядро, частицы, астрономия.
(() => {
  const P = CH.P, { def, C, n, line, arrow, lab, small, dot, graph } = P, { circle, rrect, stroke, LINE, clamp, lerp, H: HS } = CH;
  const TAU = Math.PI * 2, split = P.split, inner = P.inner;
  const nucleon = (c, x, y, r, pr) => { CH.atom(c, x, y, r, pr ? '#e0533d' : '#a7a29a', ''); };
  const nucleus = (c, x, y, Z, N, r = 7, seed = 0) => { const A = Z + N; for (let i = 0; i < A; i++) { const a = i * 2.39996 + seed, rr = r * 1.05 * Math.sqrt(i + .5); nucleon(c, x + Math.cos(a) * rr, y + Math.sin(a) * rr, r, (i * Z / A) % 1 < Z / A ? (Math.floor(i * Z / A) !== Math.floor((i + 1) * Z / A)) : false); } };
  const stars = (c, W, H, k = 60) => { for (let i = 0; i < k; i++) { circle(c, HS(i) * W, HS(i + 9) * H, .8 + HS(i + 3) * 1.4); c.fillStyle = `rgba(255,255,255,${.4 + .5 * HS(i + 5)})`; c.fill(); } };
  const space = (c, W, H) => { c.fillStyle = '#10142a'; c.fillRect(0, 0, W, H); stars(c, W, H, 90); };

  // ===== § 62–63. Световые часы: замедление времени, сокращение длины =====
  def('lightclock', {
    params: [{ k: 'b', l: 'Скорость v (доля от c)', min: 0, max: .99, step: .01, v: .6 }],
    modes: [{ k: 'm', o: [['t', 'Замедление времени'], ['l', 'Сокращение длины']] }],
    formula: v => { const g = 1 / Math.sqrt(1 - v.b * v.b); return v.m === 't' ? `τ = τ₀ / √(1 − v²/c²) = ${n(g, 3)}·τ₀\nДвижущиеся часы идут медленнее с точки зрения неподвижного наблюдателя.` : `l = l₀·√(1 − v²/c²) = ${n(1 / g, 3)}·l₀\nДлина движущегося тела сокращается в направлении движения.`; },
    draw(c, W, H, p, t, S, st, dt) {
      const v = st.v, g = 1 / Math.sqrt(1 - v.b * v.b); P.panel(c, W, H);
      if (v.m === 'l') { const L0 = W * .6, L = L0 / g, y1 = H * .3, y2 = H * .62; [[L0, y1, 'в покое: l₀'], [L, y2, `при v = ${n(v.b)}c: l`]].forEach(([L1, y, s], i) => { rrect(c, W / 2 - L1 / 2, y - 24, L1, 48, 10); c.fillStyle = i ? '#9fc6e8' : '#c9a97a'; c.fill(); stroke(c, 2.5); small(c, s, W / 2, y + 44, C.ink, 'center', 14); }); if (v.b) for (let k = 0; k < 4; k++) line(c, W / 2 - L / 2 - 30 - k * 20 - (t * 120) % 20, y2 - 12 + k * 8, W / 2 - L / 2 - 50 - k * 20 - (t * 120) % 20, y2 - 12 + k * 8, C.muted, 2); return; }
      const h = H * .32, y0 = H * .18; st.ph0 = ((st.ph0 || 0) + dt * .5) % 1; st.ph1 = ((st.ph1 || 0) + dt * .5 / g) % 1;
      const clock = (x, ph, moving) => { rrect(c, x - 24, y0 - 8, 48, 8, 2); c.fillStyle = '#9fc6e8'; c.fill(); stroke(c, 1.5); rrect(c, x - 24, y0 + h, 48, 8, 2); c.fillStyle = '#9fc6e8'; c.fill(); stroke(c, 1.5); const yy = ph < .5 ? y0 + h * ph * 2 : y0 + h * (2 - ph * 2); return yy; };
      const xs = W * .2; const y1 = clock(xs, st.ph0); dot(c, xs, y1, 7, '#ffd36b'); small(c, 'часы в покое', xs, y0 + h + 30);
      const travel = (W * .55) * ((t * .12 * v.b) % 1), xm = W * .38 + travel; const y2 = clock(xm, st.ph1);
      const cx = xm - (st.ph1 < .5 ? (1 - st.ph1 * 2) : (st.ph1 * 2 - 1) * 0) * 0; dot(c, cx, y2, 7, '#ffd36b'); line(c, cx - 50 * v.b, st.ph1 < .5 ? y0 : y0 + h, cx, y2, 'rgba(255,200,60,.6)', 2); small(c, 'движущиеся часы', xm, y0 + h + 30);
      if (v.b) arrow(c, xm - 30, y0 - 30, xm + 30, y0 - 30, C.ink, 2.5, 'v');
      const by = H * .78; [[1, 'тиканье в покое'], [1 / g, 'тиканье движущихся']].forEach(([f, s], i) => { rrect(c, 60, by + i * 34, (W - 120) * f, 18, 9); c.fillStyle = i ? C.red : C.blue; c.fill(); small(c, s, 70, by + i * 34 - 10, C.ink, 'left', 12); });
    }
  });

  // ===== § 63. Относительность одновременности =====
  def('simult', {
    formula: () => 'Вспышка в центре вагона: для пассажира свет доходит до обоих концов одновременно, а для человека на платформе — сначала до задней стенки (она движется навстречу свету).',
    draw(c, W, H, p, t, S, st) {
      P.panel(c, W, H); const ph = (t * .35) % 1, L = W * .5, cy = H * .38, vx = 120, x0 = W * .25 + ph * vx, cxw = x0 + L / 2;
      rrect(c, x0, cy - 50, L, 100, 12); c.fillStyle = '#cfe0f0'; c.fill(); stroke(c, 2.5); dot(c, x0 + 40, cy + 54, 12, '#4a4f5a'); dot(c, x0 + L - 40, cy + 54, 12, '#4a4f5a'); line(c, 20, cy + 66, W - 20, cy + 66, LINE, 4);
      const fl = W * .25 + L / 2 + 0, rr = ph * L * .9; dot(c, fl, cy, 6, '#ffd36b'); const left = fl - rr, right = fl + rr;
      const backHit = left <= x0, frontHit = right >= x0 + L; if (!backHit) dot(c, left, cy, 6, '#ffd36b'); if (!frontHit) dot(c, right, cy, 6, '#ffd36b'); if (backHit) CH.glow(c, x0, cy, 30, '#ffd36b', .8); if (frontHit) CH.glow(c, x0 + L, cy, 30, '#ffd36b', .8);
      arrow(c, cxw - 30, cy - 70, cxw + 30, cy - 70, C.ink, 2.5, 'v'); small(c, 'взгляд с платформы: задняя стенка освещается раньше передней', W / 2, H * .7, C.ink, 'center', 13);
    }
  });

  // ===== § 64. Релятивистская динамика, E = mc² =====
  def('emc2', {
    params: [{ k: 'm', l: 'Масса m', min: .001, max: 1, step: .001, v: .01, u: 'кг' }, { k: 'b', l: 'Скорость v/c', min: 0, max: .99, step: .01, v: .5 }],
    formula: v => { const g = 1 / Math.sqrt(1 - v.b * v.b), E0 = v.m * 9e16; return `E₀ = mc² = ${n(v.m)}·(3·10⁸)² = ${n(E0)} Дж (≈ ${n(E0 / 4.2e9 / 1e3)} тыс. т тротила)\nE = γmc², γ = 1/√(1 − v²/c²) = ${n(g, 3)};  кинетическая энергия Eₖ = (γ − 1)mc² = ${n((g - 1) * E0)} Дж`; },
    draw(c, W, H, p, t, S, st) {
      const v = st.v; P.panel(c, W, H); const g = inner({ x: 0, y: 0, w: W, h: H }, 50);
      graph(c, g, [{ f: x => x < .999 ? 1 / Math.sqrt(1 - x * x) - 1 : null, col: C.red, lab: 'по СТО' }, { f: x => x * x / 2, col: C.blue, lab: 'по Ньютону', dash: [5, 4] }], { t0: 0, t1: 1, y0: 0, y1: 4, now: v.b, xl: 'v/c', yl: 'Eₖ / mc²' });
      small(c, 'скорость света — предел: чтобы приблизиться к c, нужна бесконечная энергия', W / 2, H - 20, C.muted, 'center', 12.5);
    }
  });

  // ===== § 66. Тепловое излучение =====
  def('thermal', {
    params: [{ k: 'T', l: 'Температура T', min: 800, max: 10000, step: 100, v: 3000, u: 'К' }],
    formula: v => `λₘₐₓ ≈ 2,9·10⁻³ / T = ${n(2.9e-3 / v.T * 1e9, 0)} нм (закон смещения Вина)\nЧем горячее тело, тем ярче оно светится и тем «голубее» его свечение.`,
    draw(c, W, H, p, t, S, st) {
      const v = st.v, sp = split(W, H, .45), a = sp.a; P.panel(c, W, H); const col = P.tcolor(v.T), bright = clamp((v.T - 800) / 2500);
      { const gx = a.x + a.w / 2, gy = a.y + a.h / 2, gr = c.createRadialGradient(gx, gy, 0, gx, gy, 130); gr.addColorStop(0, col.replace('rgb(', 'rgba(').replace(')', `,${.75 * bright})`)); gr.addColorStop(1, col.replace('rgb(', 'rgba(').replace(')', ',0)')); c.fillStyle = gr; c.fillRect(gx - 130, gy - 130, 260, 260); }
      rrect(c, a.x + a.w / 2 - 70, a.y + a.h / 2 - 22, 140, 44, 10); c.fillStyle = v.T < 900 ? '#4a4d52' : col; c.fill(); stroke(c, 2); small(c, 'нагретый металл', a.x + a.w / 2, a.y + a.h / 2 + 46, C.ink, 'center', 13);
      const pl = (l, T) => { const x = 1.4388e-2 / (l * 1e-9 * T); return 1 / ((l / 1000) ** 5 * (Math.exp(x) - 1)); }, mx = pl(2.9e6 / v.T, v.T);
      const g = inner(sp.b, 30); for (let l = 380; l <= 750; l += 4) { const x = g.x + (l - 100) / 2900 * g.w; c.fillStyle = P.wl(l, .35); c.fillRect(x, g.y, g.w * 4 / 2900 + 1, g.h); }
      graph(c, g, [{ f: l => pl(l, v.T) / mx, col: C.red, lab: 'излучение' }], { t0: 100, t1: 3000, y0: 0, y1: 1.1, xl: 'λ, нм' });
    }
  });

  // ===== § 67. Спектры =====
  const LINES = { H: [656, 486, 434, 410], Na: [589, 589.6], He: [447, 471, 492, 502, 588, 668], Hg: [405, 436, 546, 577, 579], Ne: [585, 588, 603, 607, 616, 621, 626, 633, 640, 650, 660] };
  def('spectra', {
    modes: [{ k: 'el', o: [['H', 'Водород'], ['Na', 'Натрий'], ['He', 'Гелий'], ['Hg', 'Ртуть'], ['Ne', 'Неон']] }],
    formula: v => 'Каждый химический элемент излучает и поглощает свет строго своих длин волн — линейчатый спектр как «отпечаток пальца». На этом основан спектральный анализ.',
    draw(c, W, H, p, t, S, st) {
      const v = st.v, x0 = 40, x1 = W - 40, X = l => x0 + (l - 380) / 370 * (x1 - x0), rows = [['сплошной спектр (раскалённое твёрдое тело)', 'c'], ['линейчатый спектр излучения', 'e'], ['спектр поглощения', 'a']]; P.panel(c, W, H);
      rows.forEach(([nm, k], i) => { const y = 50 + i * (H - 100) / 3, h = (H - 100) / 3 - 46; small(c, nm, x0, y - 12, C.ink, 'left', 13);
        for (let l = 380; l < 750; l += 1) { c.fillStyle = k === 'e' ? '#0b0d16' : P.wl(l); c.fillRect(X(l), y, X(l + 1) - X(l) + .5, h); }
        LINES[v.el].forEach(l => { c.fillStyle = k === 'e' ? P.wl(l) : k === 'a' ? '#0b0d16' : 'transparent'; if (k !== 'c') c.fillRect(X(l) - 1.5, y, 3, h); });
        rrect(c, x0, y, x1 - x0, h, 4); stroke(c, 1.5); });
      [400, 500, 600, 700].forEach(l => small(c, l + ' нм', X(l), H - 30));
    }
  });

  // ===== § 68. Шкала электромагнитных волн =====
  const BANDS = [[-12, -10.5, 'гамма-излучение', '☢️', 'ядерные процессы'], [-10.5, -8, 'рентген', '🦴', 'медицина, досмотр'], [-8, -6.42, 'ультрафиолет', '🌞', 'загар, обеззараживание'], [-6.42, -6.1, 'видимый свет', '👁️', 'зрение'], [-6.1, -3, 'инфракрасное', '🔥', 'тепло, пульты, тепловизоры'], [-3, -1, 'СВЧ', '📡', 'микроволновка, Wi-Fi, радары'], [-1, 4, 'радиоволны', '📻', 'радио, ТВ, связь']];
  def('emscale', {
    params: [{ k: 'lg', l: 'lg λ (λ в метрах)', min: -12, max: 4, step: .05, v: -6.3 }],
    formula: v => { const l = 10 ** v.lg, b = BANDS.find(q => v.lg >= q[0] && v.lg < q[1]) || BANDS[6]; return `λ = ${n(l)} м,  ν = c/λ = ${n(3e8 / l)} Гц,  энергия кванта E = hν = ${n(6.63e-34 * 3e8 / l / 1.6e-19)} эВ\n${b[2]}: ${b[4]}`; },
    draw(c, W, H, p, t, S, st) {
      const v = st.v, x0 = 30, x1 = W - 30, X = lg => lerp(x0, x1, (lg + 12) / 16), y = H * .5; P.panel(c, W, H);
      BANDS.forEach(([a, b, nm], i) => { rrect(c, X(a), y - 30, X(b) - X(a) - 2, 60, 6); c.fillStyle = i === 3 ? 'transparent' : `hsla(${220 - i * 30},50%,70%,.6)`; c.fill(); if (i === 3) for (let k = 0; k < 20; k++) { c.fillStyle = P.wl(380 + k * 19); c.fillRect(X(a) + (X(b) - X(a)) * k / 20, y - 30, (X(b) - X(a)) / 20 + 1, 60); } stroke(c, 1.5); if (X(b) - X(a) > 50) small(c, nm, (X(a) + X(b)) / 2, y + 46, C.ink, 'center', 12); });
      const xx = X(v.lg), wl = Math.max(4, (v.lg + 13) * 9); c.beginPath(); for (let i = 0; i <= 200; i++) { const x = x0 + i / 200 * (x1 - x0); c.lineTo(x, y - 90 + Math.sin((x - x0) / wl * TAU - t * 4) * 20); } c.strokeStyle = C.purple; c.lineWidth = 2; c.stroke();
      line(c, xx, y - 60, xx, y + 30, C.red, 3); const b = BANDS.find(q => v.lg >= q[0] && v.lg < q[1]) || BANDS[6]; c.font = '48px system-ui'; c.textAlign = 'center'; c.fillStyle = '#000'; c.fillText(b[3], W / 2, H * .85);
      small(c, '← короче волна, больше энергия кванта', x0, y - 130, C.muted, 'left', 12); small(c, 'длиннее волна →', x1, y - 130, C.muted, 'right', 12);
    }
  });

  // ===== § 69. Фотоэффект =====
  const METALS = { Cs: [1.9, 'цезий'], Na: [2.3, 'натрий'], Zn: [4.2, 'цинк'] };
  def('photoeffect', {
    params: [{ k: 'lam', l: 'Длина волны λ', min: 200, max: 750, step: 5, v: 450, u: 'нм' }, { k: 'I', l: 'Интенсивность света', min: 0, max: 1, step: .05, v: .6 }],
    modes: [{ k: 'm', o: [['Cs', 'Цезий'], ['Na', 'Натрий'], ['Zn', 'Цинк']] }],
    formula: v => { const E = 1240 / v.lam, A = METALS[v.m][0], K = E - A; return `hν = A + mv²/2:  энергия фотона hν = ${n(E)} эВ, работа выхода A = ${n(A)} эВ\n${K > 0 ? `Eₖ = ${n(K)} эВ — электроны вылетают. Яркость влияет на число электронов, а не на их скорость.` : `hν < A — фотоэффекта нет при любой яркости (красная граница λ = ${n(1240 / A, 0)} нм).`}`; },
    draw(c, W, H, p, t, S, st, dt) {
      const v = st.v, E = 1240 / v.lam, A = METALS[v.m][0], K = E - A, cy = H * .48, px = W * .3; P.panel(c, W, H);
      rrect(c, 40, cy - 140, W - 80, 280, 140); c.fillStyle = 'rgba(200,225,250,.25)'; c.fill(); stroke(c, 2.5); small(c, 'вакуумная трубка', W / 2, cy - 152);
      rrect(c, px - 12, cy - 80, 24, 160, 4); c.fillStyle = '#9aa6b2'; c.fill(); stroke(c, 2); small(c, METALS[v.m][1], px, cy + 100); rrect(c, W * .78, cy - 80, 14, 160, 3); c.fillStyle = '#7d8590'; c.fill(); stroke(c, 2); small(c, 'анод', W * .78 + 7, cy + 100);
      const col = v.lam < 380 ? 'rgba(160,90,255,.85)' : P.wl(v.lam); for (let k = 0; k < 5; k++) { const ph = ((t * 1.2 + k / 5) % 1); const x = lerp(80, px - 14, ph), y = lerp(cy - 160, cy - 40 + k * 20, ph); c.beginPath(); for (let i = 0; i < 20; i++) c.lineTo(x - 30 + i * 1.5, y - 15 + i + Math.sin(i * 1.4 + t * 20) * 4); c.strokeStyle = col; c.globalAlpha = v.I; c.lineWidth = 2.5; c.stroke(); c.globalAlpha = 1; }
      small(c, v.lam < 380 ? 'ультрафиолет' : 'свет', 90, cy - 120, C.ink, 'center', 12);
      st.e = st.e || []; if (K > 0 && Math.random() < v.I * 0.3) st.e.push({ x: px + 14, y: cy + (Math.random() - .5) * 140, vx: 60 + Math.sqrt(K) * 140 }); st.e.forEach(q => q.x += q.vx * dt); st.e = st.e.filter(q => q.x < W * .78);
      st.e.forEach(q => { dot(c, q.x, q.y, 5, C.blue); small(c, '−', q.x, q.y - 9, C.blue, 'center', 10); });
      const ey = H - 40; rrect(c, 60, ey - 12, W - 120, 14, 7); c.fillStyle = 'rgba(0,0,0,.08)'; c.fill(); const sc = (W - 120) / 6.5; rrect(c, 60, ey - 12, Math.min(W - 120, E * sc), 14, 7); c.fillStyle = col; c.fill(); line(c, 60 + A * sc, ey - 22, 60 + A * sc, ey + 8, C.red, 3); small(c, 'A', 60 + A * sc, ey - 30, C.red); small(c, 'hν', 60 + Math.min(W - 120, E * sc) + 14, ey - 5, C.ink, 'left');
    }
  });

  // ===== § 71. Корпускулярно-волновой дуализм: фотоны по одному =====
  def('photon_slits', {
    params: [{ k: 'lam', l: 'Длина волны λ', min: 400, max: 700, step: 5, v: 520, u: 'нм' }],
    ctrl: (S, st) => [{ t: 'btn', label: '↻ Очистить экран', fn: () => { st.hits = []; } }],
    formula: (v, st) => `Фотонов на экране: ${(st.hits || []).length}.  E = hν = ${n(1240 / v.lam)} эВ,  p = h/λ = ${n(6.63e-34 / (v.lam * 1e-9))} кг·м/с\nКаждый фотон попадает в одну точку (частица), но вместе они рисуют интерференционные полосы (волна).`,
    draw(c, W, H, p, t, S, st, dt) {
      const v = st.v; P.panel(c, W, H); st.hits = st.hits || []; const sx = W - 70, top = 40, h = H - 120;
      for (let k = 0; k < Math.round(dt * 60 * 2); k++) { let y; do { y = (Math.random() - .5) * 2; } while (Math.random() > Math.cos(y * 9 * 520 / v.lam) ** 2 * Math.exp(-y * y * 2)); st.hits.push([sx + (Math.random() - .5) * 26, top + h / 2 + y * h / 2]); if (st.hits.length > 3000) st.hits.shift(); }
      rrect(c, sx - 16, top, 32, h, 4); c.fillStyle = '#10142a'; c.fill(); st.hits.forEach(([x, y]) => { c.fillStyle = P.wl(v.lam, .8); c.fillRect(x, y, 2, 2); });
      line(c, W * .4, top, W * .4, top + h / 2 - 30, LINE, 6); line(c, W * .4, top + h / 2 - 16, W * .4, top + h / 2 + 16, LINE, 6); line(c, W * .4, top + h / 2 + 30, W * .4, top + h, LINE, 6);
      const ph = (t * 1.5) % 1; dot(c, lerp(60, sx, ph), top + h / 2 + Math.sin(t * 7) * (ph > .4 ? 60 * (ph - .4) : 0), 5, P.wl(v.lam)); P.bulb(c, 50, top + h / 2, 16, 1); small(c, 'экран', sx, top + h + 16);
    }
  });

  // ===== § 72. Давление света =====
  def('lightpress', {
    params: [{ k: 'I', l: 'Яркость света', min: 0, max: 1, step: .05, v: .7 }],
    formula: () => 'Свет переносит импульс: падая на тело, он давит на него. Зеркальное крылышко получает вдвое больший импульс, чем чёрное (опыт П. Н. Лебедева).',
    draw(c, W, H, p, t, S, st, dt) {
      const v = st.v; P.panel(c, W, H); st.a = (st.a || 0) + v.I * dt * .6; const cx = W / 2, cy = H * .45;
      line(c, cx, 30, cx, cy, C.muted, 1.5); for (let k = 0; k < 4; k++) { const a = st.a + k * Math.PI / 2, x = cx + Math.cos(a) * 110, w = Math.abs(Math.sin(a)) * 30 + 6; rrect(c, x - w / 2, cy - 30, w, 60, 3); c.fillStyle = k % 2 ? '#2b2823' : '#dfe8f0'; c.fill(); stroke(c, 1.5); line(c, cx, cy, x, cy, LINE, 2); }
      for (let k = 0; k < 6; k++) { const ph = (t * 1.3 + k / 6) % 1; line(c, 30 + ph * (cx - 80), cy - 40 + k * 16, 60 + ph * (cx - 80), cy - 40 + k * 16, `rgba(255,200,60,${v.I})`, 3); }
      small(c, 'чёрное — поглощает, зеркальное — отражает', W / 2, H - 30, C.muted, 'center', 13);
    }
  });

  // ===== § 74. Опыт Резерфорда =====
  def('rutherford', {
    modes: [{ k: 'm', o: [['r', 'Модель Резерфорда'], ['t', 'Модель Томсона']] }],
    formula: v => v.m === 'r' ? 'Большинство α-частиц пролетают фольгу насквозь, но некоторые отскакивают назад — в центре атома крошечное массивное положительное ядро.' : 'Если бы заряд был «размазан» по атому (модель Томсона), α-частицы почти не отклонялись бы.',
    draw(c, W, H, p, t, S, st) {
      const v = st.v; P.panel(c, W, H); const cx = W * .55, cy = H * .48;
      for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) { const x = cx + i * 90, y = cy + j * 90; if (v.m === 't') { circle(c, x, y, 42); c.fillStyle = 'rgba(232,102,91,.18)'; c.fill(); } else { circle(c, x, y, 42); c.strokeStyle = 'rgba(43,40,35,.12)'; c.lineWidth = 1; c.stroke(); dot(c, x, y, 5, C.red); } }
      for (let k = 0; k < 14; k++) { const b0 = (HS(k) - .5) * 4 * 90, ph = (t * .35 + HS(k + 3)) % 1, x = lerp(40, W - 30, ph); const nearest = Math.round(b0 / 90) * 90, b = b0 - nearest; let y = cy + b0;
        if (v.m === 'r') { const xr = x - cx - Math.round((x - cx) / 90) * 90 * 0; const imp = Math.abs(b) < 6 && k % 7 === 0; if (imp && x > cx - 10) { const back = x - (cx - 10); dot(c, cx - 10 - back, cy + b0 - back * .3, 4.5, C.orange); continue; } const defl = 160 / (b + Math.sign(b || 1) * 8); y = cy + b0 + (x > cx ? (x - cx) * Math.atan(defl / 90) * .4 : 0); void xr; }
        dot(c, x, y, 4.5, C.orange); }
      small(c, 'α-частицы →', 70, cy - 190 < 30 ? 30 : cy - 190, C.orange, 'left', 13); small(c, 'золотая фольга', cx, H - 30, C.muted, 'center', 13);
    }
  });

  // ===== § 75. Атом водорода по Бору =====
  def('bohr', {
    params: [{ k: 'a', l: 'С уровня n', min: 2, max: 6, step: 1, v: 3 }, { k: 'b', l: 'на уровень n', min: 1, max: 5, step: 1, v: 2 }],
    formula: v => { const hi = Math.max(v.a, v.b + 1), lo = Math.min(v.b, hi - 1), dE = 13.6 * (1 / lo ** 2 - 1 / hi ** 2), l = 1240 / dE; return `Eₙ = −13,6 эВ / n²;  hν = E${hi} − E${lo} = ${n(dE)} эВ\nλ = ${n(l, 0)} нм — ${l < 380 ? 'ультрафиолет (серия Лаймана)' : l > 750 ? 'инфракрасное излучение' : 'видимый свет (серия Бальмера)'}`; },
    draw(c, W, H, p, t, S, st) {
      const v = st.v, hi = Math.max(v.a, v.b + 1), lo = Math.min(v.b, hi - 1), sp = split(W, H, .55), a = sp.a, cx = a.x + a.w / 2, cy = a.y + a.h / 2, r1 = Math.min(a.w, a.h) * .45 / 36; P.panel(c, W, H);
      for (let k = 1; k <= 6; k++) { circle(c, cx, cy, r1 * k * k); c.strokeStyle = k === hi || k === lo ? 'rgba(91,63,208,.7)' : 'rgba(43,40,35,.2)'; c.lineWidth = 1.5; c.stroke(); } dot(c, cx, cy, 6, C.red);
      const ph = (t * .4) % 1, rr = ph < .5 ? r1 * hi * hi : r1 * lo * lo, ang = t * 2; dot(c, cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr, 6, C.blue);
      const dE = 13.6 * (1 / lo ** 2 - 1 / hi ** 2), l = 1240 / dE, col = l < 380 ? 'rgba(150,90,255,.9)' : l > 750 ? 'rgba(160,40,30,.9)' : P.wl(l);
      if (ph > .5) { const d = (ph - .5) * 2 * a.w * .5, x0 = cx + Math.cos(ang) * rr, y0 = cy + Math.sin(ang) * rr; c.beginPath(); for (let i = 0; i < 40; i++) c.lineTo(x0 + (d - 40 + i) * .9, y0 - (d - 40 + i) * .4 + Math.sin(i * .9) * 5); c.strokeStyle = col; c.lineWidth = 3; c.stroke(); }
      const g = inner(sp.b, 34); for (let k = 1; k <= 6; k++) { const y = g.y + g.h * (1 - (13.6 - 13.6 / k / k) / 13.6) * .95; line(c, g.x + 40, y, g.x + g.w, y, k === hi || k === lo ? C.purple : 'rgba(43,40,35,.4)', 2); small(c, `n=${k}  ${n(-13.6 / k / k)} эВ`, g.x + 36, y, C.ink, 'right', 11); }
      const yh = g.y + g.h * (1 - (13.6 - 13.6 / hi / hi) / 13.6) * .95, yl = g.y + g.h * (1 - (13.6 - 13.6 / lo / lo) / 13.6) * .95; arrow(c, g.x + g.w * .6, yh, g.x + g.w * .6, yl, col, 3.5, 'hν');
    }
  });

  // ===== § 76. Лазер =====
  def('laser', {
    params: [{ k: 'pump', l: 'Накачка', min: 0, max: 1, step: .05, v: .7 }],
    formula: v => v.pump < .4 ? 'Накачка слабая — возбуждённых атомов мало, излучение спонтанное и хаотичное.' : 'Фотон вызывает вынужденное излучение такого же фотона — лавина одинаковых фотонов. Зеркала многократно проводят свет через среду: узкий яркий когерентный луч.',
    draw(c, W, H, p, t, S, st) {
      const v = st.v, cy = H * .42, x0 = 70, x1 = W - 70; P.panel(c, W, H); rrect(c, x0, cy - 70, x1 - x0, 140, 16); c.fillStyle = 'rgba(232,102,91,.12)'; c.fill(); stroke(c, 2);
      rrect(c, x0 - 16, cy - 80, 10, 160, 3); c.fillStyle = '#9fc6e8'; c.fill(); stroke(c, 2); rrect(c, x1 + 6, cy - 80, 10, 160, 3); c.fillStyle = 'rgba(159,198,232,.5)'; c.fill(); stroke(c, 2);
      for (let k = 0; k < 40; k++) { const x = x0 + 20 + HS(k) * (x1 - x0 - 40), y = cy - 55 + HS(k + 4) * 110, ex = HS(k + 9) < v.pump; dot(c, x, y, 6, ex ? C.red : '#a7a29a'); }
      const on = v.pump >= .4; for (let k = 0; k < (on ? 10 : 3); k++) { const ph = (t * .6 + k / 10) % 1, y = on ? cy - 30 + (k % 5) * 15 : cy - 55 + HS(k) * 110, x = on ? lerp(x0, x1, ph) : lerp(x0 + HS(k + 2) * 200, x0 + HS(k + 2) * 200 + 140 * Math.cos(k), ph); c.beginPath(); for (let i = 0; i < 16; i++) c.lineTo(x + i * 2, y + Math.sin(i * 1.2 + t * 15) * 4); c.strokeStyle = C.red; c.lineWidth = 2.5; c.stroke(); }
      if (on) { line(c, x1 + 16, cy, W - 10, cy, `rgba(224,40,30,${v.pump})`, 6); CH.glow(c, W - 10, cy, 30, '#ff3020', v.pump * .7); }
      small(c, '● возбуждённый атом   ● невозбуждённый', W / 2, cy + 100, C.muted, 'center', 12.5);
    }
  });

  // ===== § 78. Строение ядра =====
  const EL = ['n', 'H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne', 'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar', 'K', 'Ca'];
  def('nucleus', {
    params: [{ k: 'Z', l: 'Протонов Z', min: 1, max: 20, step: 1, v: 6 }, { k: 'N', l: 'Нейтронов N', min: 0, max: 24, step: 1, v: 6 }],
    formula: v => `Массовое число A = Z + N = ${v.Z + v.N};  ядро ${(v.Z + v.N)}${EL[v.Z]} (${v.Z} протонов определяют элемент)\nЯдерные силы притягивают нуклоны и действуют только на очень малых расстояниях (~10⁻¹⁵ м).`,
    draw(c, W, H, p, t, S, st) {
      const v = st.v, A = v.Z + v.N; P.panel(c, W, H); const cx = W / 2, cy = H * .45, r = Math.max(8, 16 - A * .15);
      for (let i = 0; i < A; i++) { const a = i * 2.39996 + Math.sin(t + i) * .02, rr = r * 1.05 * Math.sqrt(i + .5); const pr = Math.floor((i + 1) * v.Z / A) !== Math.floor(i * v.Z / A); nucleon(c, cx + Math.cos(a) * rr + Math.sin(t * 3 + i) * 1.2, cy + Math.sin(a) * rr, r, pr); }
      lab(c, `${A}${EL[v.Z]}`, cx, cy + Math.sqrt(A) * r * 1.2 + 40, 30, C.ink); small(c, '● протон   ● нейтрон', cx, H - 30, C.muted, 'center', 13);
    }
  });

  // ===== § 80. Энергия связи =====
  const BE = [[2, 1.1, 'H-2'], [4, 7.07, 'He-4'], [12, 7.68, 'C-12'], [16, 7.98, 'O-16'], [56, 8.79, 'Fe-56'], [120, 8.5, 'Sn-120'], [208, 7.87, 'Pb-208'], [235, 7.59, 'U-235']];
  def('binding', {
    params: [{ k: 'i', l: 'Ядро', min: 0, max: 7, step: 1, v: 4 }],
    formula: v => { const [A, e, nm] = BE[v.i]; return `${nm}: удельная энергия связи ≈ ${n(e)} МэВ на нуклон, полная Eсв ≈ ${n(e * A, 0)} МэВ\nEсв = Δm·c² — масса ядра меньше суммы масс нуклонов. Самые прочные ядра — около железа.`; },
    draw(c, W, H, p, t, S, st) {
      const v = st.v, g = inner({ x: 0, y: 0, w: W, h: H }, 50); P.panel(c, W, H);
      const f = A => A < 4 ? 1.1 + (A - 2) * 3 : 8.8 - 6.5 / Math.pow(A, .55) * 1.5 - (A > 56 ? (A - 56) * .0065 : 0);
      graph(c, g, [{ f, col: C.red }], { t0: 2, t1: 240, y0: 0, y1: 9.5, xl: 'A', yl: 'МэВ/нуклон', now: BE[v.i][0] });
      const X = A => g.x + (A - 2) / 238 * g.w, Y = e => g.y + g.h - e / 9.5 * g.h; BE.forEach(([A, e, nm], i) => { dot(c, X(A), Y(e), i === v.i ? 7 : 4, i === v.i ? C.purple : LINE); small(c, nm, X(A), Y(e) - 14, C.ink, 'center', 11); });
      small(c, '← синтез выгоден', X(30), g.y + g.h - 20, C.green, 'center', 12); small(c, 'деление выгодно →', X(190), g.y + g.h - 20, C.green, 'center', 12);
    }
  });

  // ===== § 82–83. Виды излучения: α, β, γ в магнитном поле =====
  def('abg', {
    modes: [{ k: 'm', o: [['B', 'В магнитном поле'], ['pen', 'Проникающая способность']] }],
    formula: v => v.m === 'B' ? 'α-частицы (ядра гелия, +) отклоняются слабо, β-частицы (электроны, −) — сильно в другую сторону, γ-лучи (фотоны) не отклоняются.' : 'α задерживает лист бумаги, β — тонкая алюминиевая пластинка, γ ослабляет только толстый слой свинца или бетона.',
    draw(c, W, H, p, t, S, st) {
      const v = st.v; P.panel(c, W, H); const x0 = 70, cy = H * .5;
      rrect(c, x0 - 30, cy - 30, 40, 60, 4); c.fillStyle = '#4a4f5a'; c.fill(); stroke(c, 2); dot(c, x0 - 4, cy, 7, '#7aff8a'); small(c, 'радий', x0 - 10, cy + 46);
      const rays = [['α', C.red, v.m === 'B' ? -.25 : 0, W * (v.m === 'B' ? .9 : .32)], ['β', C.blue, v.m === 'B' ? 1.1 : 0, W * (v.m === 'B' ? .55 : .55)], ['γ', C.green, 0, W * .95]];
      if (v.m === 'B') P.fieldMarks(c, { x: x0 + 40, y: 30, w: W - x0 - 60, h: H - 80 }, false, 40); else [[W * .3, '#f2ece0', 'бумага'], [W * .52, '#cfd5db', 'алюминий'], [W * .75, '#5a5d66', 'свинец']].forEach(([x, col, nm], i) => { rrect(c, x, cy - 120, 10 + i * 14, 240, 3); c.fillStyle = col; c.fill(); stroke(c, 2); small(c, nm, x + 5 + i * 7, cy + 140); });
      rays.forEach(([nm, col, k, xend], j) => { const dy = (j - 1) * (v.m === 'B' ? 0 : 50); c.beginPath(); for (let x = x0 + 10; x < xend; x += 4) { const s = (x - x0) / 300, y = cy + dy + k * s * s * 120; c.lineTo(x, y); } c.strokeStyle = col; c.lineWidth = 3; c.setLineDash([8, 6]); c.lineDashOffset = -t * 30; c.stroke(); c.setLineDash([]);
        const s = (xend - x0) / 300; lab(c, nm, xend + 14, cy + dy + k * s * s * 120, 20, col); });
    }
  });

  // ===== § 84. Закон радиоактивного распада =====
  def('halflife', {
    params: [{ k: 'T', l: 'Период полураспада T', min: 1, max: 10, step: .5, v: 3, u: 'с (в модели)' }],
    ctrl: (S, st) => [{ t: 'btn', label: '↻ Новые ядра', fn: () => { st.dec = null; st.t0 = null; } }],
    formula: (v, st) => `N = N₀·2^(−t/T);  осталось ${st.left ?? 400} из 400 ядер (t = ${n(st.tt || 0, 1)} с)\nЗа каждый период полураспада распадается половина оставшихся ядер — но какое именно, предсказать нельзя.`,
    draw(c, W, H, p, t, S, st) {
      const v = st.v, N0 = 400; if (!st.dec || st.T !== v.T) { st.T = v.T; st.dec = Array.from({ length: N0 }, () => -Math.log(Math.random()) * v.T / Math.LN2); st.t0 = t; } const tt = t - st.t0; st.tt = tt;
      const sp = split(W, H, .55), a = inner(sp.a, 30); P.panel(c, W, H); const cols = 20, cw = Math.min(a.w / cols, a.h / 20); let left = 0;
      st.dec.forEach((d, i) => { const x = a.x + (i % cols) * cw + cw / 2, y = a.y + Math.floor(i / cols) * cw + cw / 2, alive = d > tt; if (alive) left++; circle(c, x, y, cw * .38); c.fillStyle = alive ? C.red : '#c9c4ba'; c.fill(); }); st.left = left;
      const g = inner(sp.b, 34); graph(c, g, [{ f: x => Math.pow(2, -x / v.T), col: C.blue, lab: 'N/N₀' }], { t0: 0, t1: v.T * 5, y0: 0, y1: 1.05, now: Math.min(tt, v.T * 5), xl: 't' });
    }
  });

  // ===== § 86. Камера Вильсона =====
  def('cloud', {
    formula: () => 'Пролетая через пересыщенный пар, заряженная частица ионизирует молекулы — на ионах конденсируются капельки, и виден след (трек). Толстые короткие треки — α-частицы, тонкие длинные — электроны.',
    draw(c, W, H, p, t, S, st) {
      c.fillStyle = '#1a1d26'; c.fillRect(0, 0, W, H); const cx = W * .1, cy = H * .5;
      for (let k = 0; k < 8; k++) { const ph = ((t * .4 + HS(k)) % 1), a = (HS(k + 3) - .5) * 1.4, alpha = k % 3 !== 0, len = alpha ? W * .3 : W * .85, cur = alpha ? 0 : (HS(k + 7) - .5) * .004;
        c.beginPath(); let x = cx, y = cy, ang = a; for (let s = 0; s < len * Math.min(1, ph * 3); s += 3) { ang += cur * 3; x += Math.cos(ang) * 3; y += Math.sin(ang) * 3; c.lineTo(x + (HS(s + k) - .5) * 2, y); }
        c.strokeStyle = `rgba(240,240,255,${.75 * (1 - ph)})`; c.lineWidth = alpha ? 5 : 1.6; c.stroke(); }
      dot(c, cx, cy, 6, '#7aff8a'); small(c, 'источник', cx, cy + 22, '#ddd'); small(c, 'вид сверху в камеру Вильсона', W / 2, H - 24, '#bbb', 'center', 13);
    }
  });

  // ===== § 87. Ядерная реакция (опыт Резерфорда 1919 г.) =====
  def('nreact', {
    formula: () => '¹⁴₇N + ⁴₂He → ¹⁷₈O + ¹₁H\nСохраняются заряд (7 + 2 = 8 + 1) и массовое число (14 + 4 = 17 + 1).',
    draw(c, W, H, p, t, S, st) {
      P.panel(c, W, H); const ph = (t * .2) % 1, cy = H * .45, cx = W * .55;
      if (ph < .45) { nucleus(c, cx, cy, 7, 7, 9); nucleus(c, lerp(60, cx - 50, ph / .45), cy, 2, 2, 9, 1); lab(c, '¹⁴N', cx, cy + 70, 22); lab(c, 'α', lerp(60, cx - 50, ph / .45), cy + 40, 20, C.orange); }
      else { const q = (ph - .45) / .55; CH.glow(c, cx, cy, 80 * (1 - q), '#ffd36b', .7 * (1 - q)); nucleus(c, cx + q * 60, cy + q * 30, 8, 9, 9, 2); nucleon(c, cx + q * 260, cy - q * 150, 9, true); lab(c, '¹⁷O', cx + q * 60, cy + q * 30 + 70, 22); lab(c, 'p', cx + q * 260 + 20, cy - q * 150, 20, C.red); }
      small(c, 'превращение азота в кислород — первая искусственная ядерная реакция', W / 2, H - 26, C.muted, 'center', 13);
    }
  });

  // ===== § 88. Деление урана, цепная реакция =====
  def('fission', {
    params: [{ k: 'k', l: 'Коэффициент размножения k', min: .5, max: 2, step: .05, v: 1 }],
    ctrl: (S, st) => [{ t: 'btn', label: '↻ Запустить снова', fn: () => { st.gen = null; } }],
    formula: (v, st) => `²³⁵U + n → ¹⁴¹Ba + ⁹²Kr + 3n + ≈200 МэВ\nk = ${n(v.k)}: ${v.k < .98 ? 'реакция затухает' : v.k <= 1.02 ? 'реакция идёт с постоянной скоростью (как в реакторе)' : 'лавина нарастает (взрыв)'}. Делений в поколении: ${st.cnt || 1}`,
    draw(c, W, H, p, t, S, st, dt) {
      const v = st.v; P.panel(c, W, H); if (!st.gen) { st.gen = [{ x: 60, y: H / 2 }]; st.tm = 0; st.cnt = 1; st.all = []; }
      st.tm += dt; if (st.tm > 1.1) { st.tm = 0; const next = []; st.gen.forEach(q => { let kids = Math.floor(v.k); if (Math.random() < v.k - kids) kids++; for (let i = 0; i < kids; i++) next.push({ x: q.x + 90, y: clamp(q.y + (Math.random() - .5) * 160, 40, H - 60), px: q.x, py: q.y }); }); st.all.push(...st.gen); st.gen = next.slice(0, 60); st.cnt = st.gen.length; if (!st.gen.length || st.gen[0].x > W) st.gen = null; }
      st.all.slice(-200).forEach(q => { CH.atom(c, q.x, q.y, 9, '#5a8d4a', ''); });
      (st.gen || []).forEach(q => { const f = Math.min(1, st.tm / .6); if (q.px != null) { line(c, q.px, q.py, lerp(q.px, q.x, f), lerp(q.py, q.y, f), 'rgba(43,40,35,.4)', 1.5); dot(c, lerp(q.px, q.x, f), lerp(q.py, q.y, f), 4, '#a7a29a'); } if (f >= 1) { CH.glow(c, q.x, q.y, 24, '#ffd36b', .7); CH.atom(c, q.x, q.y, 12, '#2fa36b', 'U'); } });
    }
  });

  // ===== § 89. Ядерный реактор =====
  def('reactor', {
    params: [{ k: 'rod', l: 'Регулирующие стержни введены', min: 0, max: 100, step: 1, v: 50, u: '%' }],
    formula: (v, st) => { const k = 1.15 - v.rod / 100 * .3; return `k ≈ ${n(k)} → ${k < .99 ? 'мощность падает' : k > 1.01 ? 'мощность растёт — опасно!' : 'стабильная мощность'}\nСтержни из кадмия или бора поглощают нейтроны. Замедлитель (вода, графит) делает нейтроны медленными, теплоноситель уносит тепло.`; },
    draw(c, W, H, p, t, S, st, dt) {
      const v = st.v, k = 1.15 - v.rod / 100 * .3; st.P = clamp((st.P || .5) * Math.pow(k, dt * 3), .02, 1.5); P.panel(c, W, H);
      const x0 = W * .2, x1 = W * .8, y0 = H * .2, y1 = H * .75; rrect(c, x0, y0, x1 - x0, y1 - y0, 14); c.fillStyle = 'rgba(120,180,240,.3)'; c.fill(); stroke(c, 3);
      CH.glow(c, (x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) * .5, '#4aa8ff', .25 * st.P);
      for (let i = 0; i < 5; i++) { const x = lerp(x0 + 40, x1 - 40, i / 4); rrect(c, x - 10, y0 + 30, 20, y1 - y0 - 60, 4); c.fillStyle = '#5a8d4a'; c.fill(); stroke(c, 1.5); }
      for (let i = 0; i < 4; i++) { const x = lerp(x0 + 40, x1 - 40, (i + .5) / 4), d = (y1 - y0 - 40) * v.rod / 100; rrect(c, x - 7, y0 - 40, 14, 40 + d, 3); c.fillStyle = '#3a3d46'; c.fill(); stroke(c, 1.5); }
      for (let i = 0; i < 30 * st.P; i++) dot(c, x0 + 20 + HS(i + Math.floor(t * 4)) * (x1 - x0 - 40), y0 + 20 + HS(i * 3 + Math.floor(t * 4)) * (y1 - y0 - 40), 2.5, '#a7a29a');
      rrect(c, 40, H * .85, W - 80, 16, 8); c.fillStyle = 'rgba(0,0,0,.08)'; c.fill(); rrect(c, 40, H * .85, (W - 80) * Math.min(1, st.P / 1.5), 16, 8); c.fillStyle = st.P > 1.1 ? C.red : C.green; c.fill(); small(c, 'мощность реактора', W / 2, H * .85 + 32, C.ink, 'center', 13);
    }
  });

  // ===== § 90. Термоядерный синтез =====
  def('fusion', {
    params: [{ k: 'T', l: 'Температура плазмы', min: 1, max: 200, step: 1, v: 30, u: 'млн К' }],
    formula: v => `²H + ³H → ⁴He + n + 17,6 МэВ\n${v.T < 50 ? 'Ядра отталкиваются (кулоновский барьер) — синтез почти не идёт.' : 'При сотнях миллионов градусов ядра сближаются до действия ядерных сил — идёт синтез.'}`,
    draw(c, W, H, p, t, S, st, dt) {
      const v = st.v; P.panel(c, W, H); c.fillStyle = `rgba(255,150,60,${Math.min(.35, v.T / 400)})`; c.fillRect(0, 0, W, H); const ph = (t * .5) % 1, cx = W / 2, cy = H * .45, ok = v.T >= 50;
      const gap = ok ? Math.max(0, 1 - ph * 2) : .5 + .5 * Math.abs(Math.cos(ph * Math.PI)), dx = 30 + gap * 160;
      if (!ok || ph < .5) { nucleus(c, cx - dx, cy, 1, 1, 10); nucleus(c, cx + dx, cy, 1, 2, 10, 2); small(c, 'дейтерий', cx - dx, cy + 40); small(c, 'тритий', cx + dx, cy + 44); }
      else { const q = (ph - .5) * 2; CH.glow(c, cx, cy, 120 * (1 - q) + 20, '#ffd36b', .8 * (1 - q)); nucleus(c, cx - q * 80, cy, 2, 2, 10, 1); nucleon(c, cx + q * 260, cy - q * 60, 10, false); small(c, 'гелий', cx - q * 80, cy + 44); small(c, 'нейтрон', cx + q * 260, cy - q * 60 + 24); }
      small(c, 'так светят Солнце и звёзды', W / 2, H - 26, C.muted, 'center', 13);
    }
  });

  // ===== § 96. Позитрон, аннигиляция =====
  def('annihil', {
    modes: [{ k: 'm', o: [['a', 'Аннигиляция'], ['p', 'Рождение пары']] }],
    formula: v => v.m === 'a' ? 'e⁻ + e⁺ → 2γ: частица и античастица превращаются в два γ-кванта, энергия E = 2mc² ≈ 1,02 МэВ.' : 'γ → e⁻ + e⁺: γ-квант с энергией больше 1,02 МэВ вблизи ядра рождает электрон и позитрон; в магнитном поле их треки закручиваются в разные стороны.',
    draw(c, W, H, p, t, S, st) {
      const v = st.v; P.panel(c, W, H); const ph = (t * .4) % 1, cx = W / 2, cy = H * .45;
      if (v.m === 'a') { if (ph < .5) { const d = (1 - ph * 2) * W * .35; dot(c, cx - d, cy, 10, C.blue); lab(c, 'e⁻', cx - d, cy - 22, 16, C.blue); dot(c, cx + d, cy, 10, C.red); lab(c, 'e⁺', cx + d, cy - 22, 16, C.red); } else { const q = (ph - .5) * 2; CH.glow(c, cx, cy, 80 * (1 - q) + 10, '#ffffff', .9 * (1 - q)); [[-1, -1], [1, 1]].forEach(([sx, sy]) => { c.beginPath(); for (let i = 0; i < 30; i++) c.lineTo(cx + sx * (q * 250 - 60 + i * 2) * .9, cy + sy * (q * 250 - 60 + i * 2) * .4 + Math.sin(i + t * 20) * 5); c.strokeStyle = C.green; c.lineWidth = 3; c.stroke(); }); lab(c, 'γ', cx + q * 220, cy + q * 100 - 20, 18, C.green); lab(c, 'γ', cx - q * 220, cy - q * 100 - 20, 18, C.green); } return; }
      P.fieldMarks(c, { x: 20, y: 20, w: W - 40, h: H - 70 }, false, 44); const gx = lerp(20, cx, Math.min(1, ph * 2)); c.beginPath(); for (let i = 0; i < 30; i++) c.lineTo(gx - 60 + i * 2, cy + Math.sin(i + t * 20) * 5); c.strokeStyle = C.green; c.lineWidth = 3; c.stroke();
      if (ph > .5) { const q = (ph - .5) * 2; [[1, C.red, 'e⁺'], [-1, C.blue, 'e⁻']].forEach(([s, col, nm]) => { c.beginPath(); for (let a = 0; a < q * 5; a += .05) { const r = 120 * Math.exp(-a * .18); c.lineTo(cx + r * Math.sin(a), cy - s * (r * (1 - Math.cos(a)))); } c.strokeStyle = col; c.lineWidth = 2.5; c.stroke(); lab(c, nm, cx + 40, cy - s * 70, 16, col); }); }
    }
  });

  // ===== § 98. Кварки =====
  def('quarks', {
    modes: [{ k: 'm', o: [['p', 'Протон (uud)'], ['n', 'Нейтрон (udd)'], ['pi', 'π⁺-мезон (ud̄)']] }],
    formula: v => v.m === 'p' ? 'Заряд протона: +2/3 + 2/3 − 1/3 = +1' : v.m === 'n' ? 'Заряд нейтрона: +2/3 − 1/3 − 1/3 = 0' : 'Мезон — кварк и антикварк: +2/3 + 1/3 = +1',
    draw(c, W, H, p, t, S, st) {
      const v = st.v; P.panel(c, W, H); const cx = W / 2, cy = H * .45, R = Math.min(W, H) * .3, q = { p: [['u', '+2/3'], ['u', '+2/3'], ['d', '−1/3']], n: [['u', '+2/3'], ['d', '−1/3'], ['d', '−1/3']], pi: [['u', '+2/3'], ['d̄', '+1/3']] }[v.m], cols = ['#e0533d', '#2fa36b', '#1f6fd1'];
      circle(c, cx, cy, R); c.fillStyle = 'rgba(255,255,255,.4)'; c.fill(); c.setLineDash([6, 6]); stroke(c, 2); c.setLineDash([]);
      const pos = q.map((_, i) => { const a = i * TAU / q.length + t * .5; return [cx + Math.cos(a) * R * .5 + Math.sin(t * 3 + i) * 6, cy + Math.sin(a) * R * .5]; });
      pos.forEach((a, i) => pos.forEach((b, j) => { if (j > i) { c.beginPath(); for (let s = 0; s <= 20; s++) { const x = lerp(a[0], b[0], s / 20), y = lerp(a[1], b[1], s / 20) + Math.sin(s * 1.6 + t * 10) * 5; s ? c.lineTo(x, y) : c.moveTo(x, y); } c.strokeStyle = 'rgba(43,40,35,.5)'; c.lineWidth = 2; c.stroke(); } }));
      pos.forEach(([x, y], i) => { CH.atom(c, x, y, 26, cols[(i + Math.floor(t)) % 3], q[i][0]); small(c, q[i][1], x, y + 40, C.ink, 'center', 14); });
      small(c, 'пружинки — глюоны, удерживающие кварки', W / 2, H - 26, C.muted, 'center', 13);
    }
  });

  // ===== § 99. Законы Кеплера =====
  def('kepler', {
    params: [{ k: 'e', l: 'Эксцентриситет орбиты e', min: 0, max: .8, step: .02, v: .5 }],
    formula: v => `1) Орбита — эллипс, Солнце в одном из фокусов (e = ${n(v.e)}).\n2) Радиус-вектор планеты за равные времена описывает равные площади — у Солнца планета движется быстрее.\n3) T² / a³ одинаково для всех планет.`,
    draw(c, W, H, p, t, S, st, dt) {
      const v = st.v; space(c, W, H); const cx = W / 2, cy = H * .47, a = Math.min(W, H) * .4, b = a * Math.sqrt(1 - v.e * v.e), fx = cx + a * v.e;
      c.beginPath(); c.ellipse(cx, cy, a, b, 0, 0, TAU); c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 1.5; c.stroke(); CH.glow(c, fx, cy, 40, '#ffd36b', .8); dot(c, fx, cy, 14, '#ffd36b');
      // решаем уравнение Кеплера M = E − e sin E
      st.M = ((st.M || 0) + dt * .5) % TAU; let E = st.M; for (let k = 0; k < 8; k++) E = st.M + v.e * Math.sin(E); const px = cx + a * Math.cos(E), py = cy + b * Math.sin(E);
      st.sect = st.sect || []; const k0 = Math.floor(st.M / (TAU / 8)); for (let s = 0; s < 8; s++) { if (s % 2) continue; c.beginPath(); c.moveTo(fx, cy); for (let m = s * TAU / 8; m <= (s + 1) * TAU / 8 + .001; m += .02) { let e2 = m; for (let k = 0; k < 8; k++) e2 = m + v.e * Math.sin(e2); c.lineTo(cx + a * Math.cos(e2), cy + b * Math.sin(e2)); } c.closePath(); c.fillStyle = s === k0 ? 'rgba(122,87,255,.45)' : 'rgba(122,87,255,.18)'; c.fill(); }
      line(c, fx, cy, px, py, 'rgba(255,255,255,.7)', 1.5); dot(c, px, py, 9, '#4a8bd8'); small(c, 'закрашенные секторы проходятся за одинаковое время', W / 2, H - 24, '#ddd', 'center', 13);
    }
  });

  // ===== § 100. Фазы Луны и затмения =====
  def('moon', {
    formula: () => 'Луна светит отражённым светом Солнца. Мы видим разную долю освещённой половины — это фазы: новолуние, первая четверть, полнолуние, последняя четверть.',
    draw(c, W, H, p, t, S, st) {
      space(c, W, H); const cx = W * .5, cy = H * .42, R = Math.min(W, H) * .28, a = t * .4; for (let k = 0; k < 6; k++) line(c, 20, cy - 120 + k * 48, 60, cy - 120 + k * 48, 'rgba(255,220,120,.6)', 2); small(c, 'свет Солнца →', 60, cy - 150, '#ffd36b', 'center', 12);
      CH.atom(c, cx, cy, 26, '#4a8bd8', ''); const mx = cx + Math.cos(a) * R, my = cy + Math.sin(a) * R; circle(c, mx, my, 12); c.fillStyle = '#555'; c.fill(); c.beginPath(); c.arc(mx, my, 12, Math.PI / 2, Math.PI * 1.5, true); c.fillStyle = '#eee'; c.fill(); c.beginPath(); c.ellipse(cx, cy, R, R, 0, 0, TAU); c.strokeStyle = 'rgba(255,255,255,.25)'; c.stroke();
      // вид с Земли
      const vx = W * .5, vy = H * .82, r = 36, ph = ((a % TAU) + TAU) % TAU, k = Math.cos(ph); circle(c, vx, vy, r); c.fillStyle = '#333'; c.fill();
      c.save(); circle(c, vx, vy, r); c.clip(); c.fillStyle = '#eee'; c.beginPath(); if (ph < Math.PI) { c.arc(vx, vy, r, -Math.PI / 2, Math.PI / 2, false); c.ellipse(vx, vy, Math.abs(k) * r, r, 0, Math.PI / 2, -Math.PI / 2, k > 0); } else { c.arc(vx, vy, r, Math.PI / 2, Math.PI * 1.5, false); c.ellipse(vx, vy, Math.abs(k) * r, r, 0, -Math.PI / 2, Math.PI / 2, k > 0); } c.fill(); c.restore(); circle(c, vx, vy, r); c.strokeStyle = '#888'; c.stroke();
      const names = ['полнолуние', 'последняя четверть', 'новолуние', 'первая четверть']; small(c, 'вид с Земли: ' + names[Math.round(ph / (Math.PI / 2)) % 4], vx, vy + 52, '#ddd', 'center', 13);
    }
  });

  // ===== § 101. Планеты Солнечной системы =====
  const PL = [['Меркурий', .38, '#b0a090'], ['Венера', .95, '#e8c070'], ['Земля', 1, '#4a8bd8'], ['Марс', .53, '#d0603a'], ['Юпитер', 11.2, '#d8b088'], ['Сатурн', 9.4, '#e0c890'], ['Уран', 4, '#9fd8e0'], ['Нептун', 3.9, '#4a70d8']];
  def('planets', {
    formula: () => 'Планеты земной группы (Меркурий, Венера, Земля, Марс) — небольшие и каменные. Планеты-гиганты (Юпитер, Сатурн, Уран, Нептун) — огромные, в основном из газов и льдов. Размеры показаны в масштабе.',
    draw(c, W, H, p, t, S, st) {
      space(c, W, H); let x = 20; const k = Math.min((W - 40 - 8 * 12) / (2 * PL.reduce((s, q) => s + q[1], 0)), H / 30); PL.forEach(([nm, r, col], i) => { const R = Math.max(3, r * k); x += R + 6; const y = H * .5; if (nm === 'Сатурн') { c.beginPath(); c.ellipse(x, y, R * 1.9, R * .45, -.3, 0, TAU); c.strokeStyle = '#d8c8a0'; c.lineWidth = 4; c.stroke(); } CH.atom(c, x, y, R, col, ''); small(c, nm, x, y + (i % 2 ? -1 : 1) * (R + 18), '#ddd', 'center', 11.5); x += R + 6; });
    }
  });

  // ===== § 102. Солнце =====
  def('sun', {
    formula: () => 'В ядре идёт термоядерный синтез (≈15 млн К). Энергия выходит через зону лучистого переноса и конвективную зону к фотосфере (≈5800 К). Выше — хромосфера и корона.',
    draw(c, W, H, p, t, S, st) {
      space(c, W, H); const cx = W * .5, cy = H * .5, R = Math.min(W, H) * .4; CH.glow(c, cx, cy, R * 1.5, '#ffb040', .35);
      [[1, '#ff9a20', 'фотосфера'], [.92, '#ff7a1a', 'конвективная зона'], [.7, '#ffc040', 'зона лучистого переноса'], [.25, '#fff4c0', 'ядро']].forEach(([f, col, nm], i) => { c.beginPath(); c.moveTo(cx, cy); c.arc(cx, cy, R * f, -Math.PI / 2, i === 0 ? Math.PI * 1.5 : Math.PI * .5 * 0 - .01 + Math.PI * 0, false); c.closePath(); circle(c, cx, cy, R * f); c.fillStyle = col; c.fill(); small(c, nm, cx + R * f - 6, cy - 14 - i * 0, '#3a1a00', 'right', 12); });
      for (let k = 0; k < 10; k++) { const a = k * .6 + t * .2, r = R * .82; c.beginPath(); c.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 10, 0, TAU); c.strokeStyle = 'rgba(160,60,0,.4)'; c.stroke(); }
      for (let k = 0; k < 3; k++) { const a = -2 + k * .7; dot(c, cx + Math.cos(a) * R * .55, cy + Math.sin(a) * R * .55, 4, '#552200'); }
    }
  });

  // ===== § 103. Диаграмма «спектр — светимость» =====
  def('hr', {
    params: [{ k: 'T', l: 'Температура звезды', min: 3000, max: 30000, step: 100, v: 5800, u: 'К' }],
    formula: v => `Цвет звезды зависит от температуры: ${v.T < 4000 ? 'красная' : v.T < 5300 ? 'оранжевая' : v.T < 6500 ? 'жёлтая (как Солнце)' : v.T < 10000 ? 'белая' : 'голубая'}.\nНа диаграмме Герцшпрунга — Рассела большинство звёзд лежит на главной последовательности.`,
    draw(c, W, H, p, t, S, st) {
      const v = st.v; space(c, W, H); const g = inner({ x: 0, y: 0, w: W, h: H }, 50), X = T => g.x + g.w * (1 - (Math.log10(T) - 3.4) / 1.1), Y = L => g.y + g.h * (1 - (Math.log10(L) + 4) / 10);
      line(c, g.x, g.y + g.h, g.x + g.w, g.y + g.h, '#888', 1.5); line(c, g.x, g.y, g.x, g.y + g.h, '#888', 1.5); small(c, '← горячее   температура   холоднее →', g.x + g.w / 2, g.y + g.h + 20, '#ccc'); small(c, 'светимость', g.x, g.y - 12, '#ccc', 'left');
      for (let i = 0; i < 160; i++) { const T = 3000 * Math.pow(10, HS(i) * 1); const L = Math.pow(T / 5800, 5.5) * Math.pow(10, (HS(i + 5) - .5) * .8); circle(c, X(T), Y(L), 2 + HS(i + 2) * 2); c.fillStyle = P.tcolor(T); c.fill(); }
      for (let i = 0; i < 20; i++) { const T = 3500 + HS(i + 40) * 2000, L = Math.pow(10, 2 + HS(i + 41) * 2); circle(c, X(T), Y(L), 4); c.fillStyle = P.tcolor(T); c.fill(); } small(c, 'красные гиганты', X(4000), Y(1e4) - 20, '#f99');
      for (let i = 0; i < 14; i++) { const T = 8000 + HS(i + 70) * 15000, L = Math.pow(10, -3 + HS(i + 71) * 1.2); circle(c, X(T), Y(L), 2.5); c.fillStyle = '#fff'; c.fill(); } small(c, 'белые карлики', X(14000), Y(1e-3) + 20, '#ddd');
      const L = Math.pow(v.T / 5800, 5.5); CH.glow(c, X(v.T), Y(L), 26, '#ffffff', .5); dot(c, X(v.T), Y(L), 8, P.tcolor(v.T)); small(c, 'Солнце', X(5800), Y(1) + 18, '#ffd36b');
    }
  });

  // ===== § 105. Эволюция звёзд =====
  def('stellar', {
    params: [{ k: 'M', l: 'Масса звезды (в массах Солнца)', min: .5, max: 30, step: .5, v: 1 }],
    formula: v => v.M < 8 ? 'Звезда, как Солнце: протозвезда → главная последовательность (миллиарды лет) → красный гигант → планетарная туманность и белый карлик.' : v.M < 20 ? 'Массивная звезда: сверхгигант → взрыв сверхновой → нейтронная звезда.' : 'Очень массивная звезда: сверхгигант → сверхновая → чёрная дыра.',
    draw(c, W, H, p, t, S, st) {
      const v = st.v; space(c, W, H); const big = v.M >= 8, stages = big ? [['туманность', '#7a5aa8', 30], ['протозвезда', '#ff9a50', 16], ['голубая звезда', '#9fc6ff', 22], ['сверхгигант', '#ff6040', 46], ['сверхновая', '#ffffff', 50], [v.M < 20 ? 'нейтронная звезда' : 'чёрная дыра', v.M < 20 ? '#bcd4ff' : '#000000', 10]] : [['туманность', '#7a5aa8', 30], ['протозвезда', '#ff9a50', 16], ['звезда типа Солнца', '#ffd36b', 20], ['красный гигант', '#ff6040', 40], ['планетарная туманность', '#5ad0c0', 34], ['белый карлик', '#ffffff', 7]];
      const n6 = stages.length, cur = Math.floor((t * .25) % n6); stages.forEach(([nm, col, r], i) => { const x = 40 + (W - 80) * (i + .5) / n6, y = H * .45 + (i % 2 ? 40 : -40), on = i === cur; if (on) CH.glow(c, x, y, r * 2.5, col === '#000000' ? '#9fc6ff' : col, .5);
        if (nm === 'чёрная дыра') { circle(c, x, y, r + 4); c.strokeStyle = '#ffb040'; c.lineWidth = 3; c.stroke(); } if (nm.includes('туманность')) { for (let k = 0; k < 18; k++) { circle(c, x + Math.cos(k) * r * HS(k), y + Math.sin(k * 1.7) * r * HS(k + 1), 6); c.fillStyle = col + '66'; c.fill(); } } else { circle(c, x, y, r * (on ? 1.1 : 1)); c.fillStyle = col; c.fill(); }
        small(c, nm, x, y + (i % 2 ? r + 22 : -r - 18), on ? '#fff' : '#aaa', 'center', 12); if (i < n6 - 1) arrow(c, x + r + 6, y, x + (W - 80) / n6 - 30, y + (i % 2 ? -80 : 80) * .5, 'rgba(255,255,255,.35)', 1.5, '', 8); });
    }
  });

  // ===== § 106–107. Галактика =====
  def('galaxy', {
    modes: [{ k: 'm', o: [['s', 'Спиральная (Млечный Путь)'], ['e', 'Эллиптическая'], ['i', 'Неправильная']] }],
    formula: v => v.m === 's' ? 'Млечный Путь — спиральная галактика диаметром около 100 000 световых лет; Солнце находится в одном из рукавов, примерно в 26 000 св. лет от центра.' : v.m === 'e' ? 'Эллиптические галактики состоят в основном из старых звёзд, почти без газа и пыли.' : 'Неправильные галактики не имеют чёткой формы — например, Магеллановы Облака.',
    draw(c, W, H, p, t, S, st) {
      const v = st.v; space(c, W, H); const cx = W / 2, cy = H * .47, R = Math.min(W, H) * .42, rot = t * .05; CH.glow(c, cx, cy, R * .5, '#ffe8b0', .5);
      for (let i = 0; i < 1400; i++) { let x, y; const u = HS(i), w = HS(i + 7);
        if (v.m === 's') { const arm = i % 2, r = Math.pow(u, .6) * R, a = r / R * 5 + arm * Math.PI + rot + (w - .5) * .7; x = cx + Math.cos(a) * r; y = cy + Math.sin(a) * r * .55; }
        else if (v.m === 'e') { const r = Math.pow(u, 1.5) * R, a = w * TAU; x = cx + Math.cos(a) * r * 1; y = cy + Math.sin(a) * r * .6; }
        else { x = cx + (u - .5) * R * 1.4 + Math.sin(w * 9) * 30; y = cy + (w - .5) * R * .9; }
        circle(c, x, y, .9 + HS(i + 3) * 1.1); c.fillStyle = `rgba(${200 + HS(i + 4) * 55},${200 + HS(i + 5) * 55},255,${.35 + HS(i + 6) * .5})`; c.fill(); }
      if (v.m === 's') { const a = 1.9 + rot; dot(c, cx + Math.cos(a) * R * .6, cy + Math.sin(a) * R * .6 * .55, 5, '#ffd36b'); small(c, 'Солнце', cx + Math.cos(a) * R * .6, cy + Math.sin(a) * R * .33 + 16, '#ffd36b'); }
    }
  });

  // ===== § 108. Расширение Вселенной, закон Хаббла =====
  def('hubble', {
    params: [{ k: 'H', l: 'Постоянная Хаббла H', min: 50, max: 100, step: 1, v: 70, u: 'км/(с·Мпк)' }, { k: 'r', l: 'Расстояние до галактики r', min: 10, max: 1000, step: 10, v: 200, u: 'Мпк' }],
    formula: v => `v = H·r = ${v.H} · ${v.r} = ${n(v.H * v.r)} км/с\nГалактики разбегаются: чем дальше галактика, тем быстрее она удаляется. Возраст Вселенной ≈ 1/H ≈ ${n(978 / v.H, 1)} млрд лет.`,
    draw(c, W, H, p, t, S, st) {
      const v = st.v; space(c, W, H); const k = 1 + ((t * .08) % 1) * .6, cx = W / 2, cy = H / 2;
      for (let i = 0; i < 40; i++) { const x0 = (HS(i) - .5) * W * .7, y0 = (HS(i + 5) - .5) * H * .7, x = cx + x0 * k, y = cy + y0 * k; c.beginPath(); c.ellipse(x, y, 7, 4, HS(i + 2) * 3, 0, TAU); c.fillStyle = 'rgba(220,220,255,.8)'; c.fill(); line(c, cx + x0, cy + y0, x, y, 'rgba(255,120,90,.5)', 1.5); }
      dot(c, cx, cy, 6, '#ffd36b'); small(c, 'мы', cx, cy + 16, '#ffd36b'); small(c, 'красные следы — сдвиг галактик за одно и то же время: дальние уходят дальше', W / 2, H - 24, '#ddd', 'center', 12.5);
    }
  });
})();
