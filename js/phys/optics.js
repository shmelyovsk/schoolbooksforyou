'use strict';
// Физика 11: механические и электромагнитные волны, оптика.
(() => {
  const P = CH.P, { def, C, n, line, arrow, lab, small, dot, graph } = P, { circle, rrect, stroke, LINE, clamp, lerp } = CH;
  const TAU = Math.PI * 2, rad = d => d * Math.PI / 180, deg = r => r * 180 / Math.PI;
  const split = (W, H, k = .58) => W > H ? { a: { x: 0, y: 0, w: W * k, h: H }, b: { x: W * k, y: 0, w: W * (1 - k), h: H } } : { a: { x: 0, y: 0, w: W, h: H * k }, b: { x: 0, y: H * k, w: W, h: H * (1 - k) } };
  const inner = (r, m = 36) => ({ x: r.x + m, y: r.y + m, w: r.w - 2 * m, h: r.h - 2 * m });
  // поле волн: считает значения в сетке и рисует картинкой
  const off = document.createElement('canvas'), oc = off.getContext('2d');
  function field(c, r, gw, gh, fn, pal) {
    off.width = gw; off.height = gh; const img = oc.createImageData(gw, gh), d = img.data;
    for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) { const v = fn(r.x + (i + .5) / gw * r.w, r.y + (j + .5) / gh * r.h), k = (j * gw + i) * 4, [R, G, B] = pal(v); d[k] = R; d[k + 1] = G; d[k + 2] = B; d[k + 3] = 255; }
    oc.putImageData(img, 0, 0); c.save(); c.imageSmoothingEnabled = true; rrect(c, r.x, r.y, r.w, r.h, 12); c.clip(); c.drawImage(off, r.x, r.y, r.w, r.h); c.restore(); rrect(c, r.x, r.y, r.w, r.h, 12); stroke(c, 2);
  }
  const water = v => { const k = clamp(v * .5 + .5); return [lerp(20, 205, k), lerp(70, 235, k), lerp(140, 255, k)]; };
  const rgbOf = s => s.match(/\d+/g).slice(0, 3).map(Number);

  // ===== § 29. Поперечные и продольные волны =====
  def('waves_tl', {
    params: [{ k: 'nu', l: 'Частота ν', min: .2, max: 1.5, step: .05, v: .5, u: 'Гц' }, { k: 'lam', l: 'Длина волны λ', min: 1, max: 4, step: .1, v: 2, u: 'м' }],
    modes: [{ k: 'm', o: [['t', 'Поперечная'], ['l', 'Продольная']] }],
    formula: v => `v = λ·ν = ${n(v.lam)} · ${n(v.nu)} = ${n(v.lam * v.nu)} м/с,   T = 1/ν = ${n(1 / v.nu)} с\n${v.m === 't' ? 'Частицы колеблются поперёк направления распространения волны.' : 'Частицы колеблются вдоль направления волны — сгущения и разрежения.'}`,
    draw(c, W, H, p, t, S, st) {
      const v = st.v, x0 = 40, x1 = W - 40, cy = H * .45, scale = (x1 - x0) / 8, N = 46, A = 46; P.panel(c, W, H);
      for (let i = 0; i < N; i++) { const xm = i / (N - 1) * 8, ph = TAU * (v.nu * t - xm / v.lam), s = Math.sin(ph); const x = x0 + xm * scale + (v.m === 'l' ? s * 14 : 0), y = cy + (v.m === 't' ? -s * A : 0);
        if (v.m === 'l') for (let r = -3; r <= 3; r++) dot(c, x, cy + r * 18, 4, i === 12 ? C.red : '#7aa7d8'); else dot(c, x, y, i === 12 ? 8 : 5.5, i === 12 ? C.red : '#7aa7d8'); }
      if (v.m === 't') { c.beginPath(); for (let i = 0; i <= 200; i++) { const xm = i / 200 * 8; const y = cy - Math.sin(TAU * (v.nu * t - xm / v.lam)) * A; i ? c.lineTo(x0 + xm * scale, y) : c.moveTo(x0, y); } c.strokeStyle = 'rgba(31,111,209,.35)'; c.lineWidth = 2; c.stroke(); }
      const lx = x0 + 1 * scale, ly = cy + 90; line(c, lx, ly, lx + v.lam * scale, ly, C.purple, 2); line(c, lx, ly - 8, lx, ly + 8, C.purple, 2); line(c, lx + v.lam * scale, ly - 8, lx + v.lam * scale, ly + 8, C.purple, 2); lab(c, 'λ', lx + v.lam * scale / 2, ly + 16, 18, C.purple);
      arrow(c, W - 160, cy - 110, W - 60, cy - 110, C.ink, 3, 'v'); small(c, 'красная частица остаётся на месте и только колеблется', W / 2, H - 22, C.muted, 'center', 13);
    }
  });

  // ===== § 30. Уравнение бегущей волны =====
  def('wave_eq', {
    params: [{ k: 'A', l: 'Амплитуда A', min: .2, max: 1, step: .05, v: .7, u: 'м' }, { k: 'lam', l: 'Длина волны λ', min: 1, max: 6, step: .1, v: 3, u: 'м' }, { k: 'v', l: 'Скорость v', min: .5, max: 4, step: .1, v: 1.5, u: 'м/с' }],
    formula: v => `y = A·sin ω(t − x/v),  ω = 2πv/λ = ${n(TAU * v.v / v.lam, 3)} рад/с\nТочка на расстоянии x повторяет колебания источника с опозданием x/v.`,
    draw(c, W, H, p, t, S, st) {
      const v = st.v, w = TAU * v.v / v.lam, x0 = 3, sp = split(W, H, .55); P.panel(c, W, H);
      const g1 = inner(sp.a, 34); graph(c, g1, [{ f: x => v.A * Math.sin(w * (t - x / v.v)), col: C.blue, lab: 'y(x) в момент t' }], { t0: 0, t1: 10, y0: -1.1, y1: 1.1, now: x0, xl: 'x, м' });
      const g2 = inner(sp.b, 34); graph(c, g2, [{ f: tt => v.A * Math.sin(w * (tt - x0 / v.v)), col: C.red, lab: 'y(t) точки x = 3 м' }], { t0: t - 8, t1: t, y0: -1.1, y1: 1.1, now: t, xl: 't, с' });
    }
  });

  // ===== § 31. Звук =====
  let actx, osc, gain;
  def('sound', {
    params: [{ k: 'nu', l: 'Частота ν (высота)', min: 100, max: 2000, step: 10, v: 440, u: 'Гц' }, { k: 'A', l: 'Амплитуда (громкость)', min: .1, max: 1, step: .05, v: .5 }],
    ctrl: (S, st) => [{ t: 'btn', label: '🔊 Слушать', fn: b => { try { if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)(); if (osc) { osc.stop(); osc = null; b.classList.remove('on'); return; } osc = actx.createOscillator(); gain = actx.createGain(); osc.connect(gain); gain.connect(actx.destination); osc.start(); st.snd = true; b.classList.add('on'); } catch (e) {} } }],
    formula: v => `λ = v/ν = 340 / ${n(v.nu)} = ${n(340 / v.nu, 3)} м (скорость звука в воздухе ≈ 340 м/с)\nВысота тона определяется частотой, громкость — амплитудой.`,
    draw(c, W, H, p, t, S, st) {
      const v = st.v; if (osc) { osc.frequency.value = v.nu; gain.gain.value = v.A * .15; }
      const sp = split(W, H, .58), a = sp.a, cx = a.x + 70, cy = a.y + a.h / 2, k = 3 / (v.nu / 440); P.panel(c, W, H);
      const mem = Math.sin(t * 9) * 6 * v.A; rrect(c, cx - 60, cy - 50, 40, 100, 6); c.fillStyle = '#4a4f5a'; c.fill(); stroke(c, 2); c.beginPath(); c.moveTo(cx - 20, cy - 30); c.lineTo(cx + 10 + mem, cy - 70); c.lineTo(cx + 10 + mem, cy + 70); c.lineTo(cx - 20, cy + 30); c.closePath(); c.fillStyle = '#8d8a84'; c.fill(); stroke(c, 2);
      for (let i = 0; i < 360; i++) { const bx = cx + 24 + CH.H(i) * (a.w - 110), by = a.y + 30 + CH.H(i + 7) * (a.h - 60), ph = TAU * (t * .9 - (bx - cx) / (40 * k)); const x = bx + Math.sin(ph) * 9 * v.A; circle(c, x, by, 2.2); c.fillStyle = 'rgba(43,40,35,.6)'; c.fill(); }
      const g = inner(sp.b, 30); graph(c, g, [{ f: x => v.A * Math.sin(TAU * (t * .9 - x / k)), col: C.blue, lab: 'давление' }], { t0: 0, t1: 12, y0: -1.1, y1: 1.1, xl: 'x' });
    }
  });

  // ===== § 33. Интерференция волн от двух источников =====
  def('interf2', {
    params: [{ k: 'd', l: 'Расстояние между источниками', min: 20, max: 160, step: 5, v: 80, u: 'мм' }, { k: 'lam', l: 'Длина волны λ', min: 10, max: 50, step: 1, v: 24, u: 'мм' }],
    formula: v => `Максимум: Δd = kλ (волны приходят в фазе), минимум: Δd = (2k+1)·λ/2\nЧем больше расстояние между источниками и меньше λ, тем больше полос.`,
    draw(c, W, H, p, t, S, st) {
      const v = st.v, r = { x: 20, y: 20, w: W - 40, h: H - 70 }, s = r.w / 400, cx = W / 2, sy = r.y + 14, k = TAU / (v.lam * s); P.panel(c, W, H);
      const s1 = cx - v.d / 2 * s, s2 = cx + v.d / 2 * s;
      field(c, r, 150, Math.round(150 * r.h / r.w), (x, y) => { const d1 = Math.hypot(x - s1, y - sy), d2 = Math.hypot(x - s2, y - sy); return (Math.sin(k * d1 - t * 5) / Math.sqrt(1 + d1 * .01) + Math.sin(k * d2 - t * 5) / Math.sqrt(1 + d2 * .01)) * .7; }, water);
      dot(c, s1, sy, 7, C.red); dot(c, s2, sy, 7, C.red); CH.pill(c, 'светлые и тёмные «лучи» — линии максимумов, спокойные полосы — минимумы', W / 2, H - 22, 12.5);
    }
  });

  // ===== § 33. Дифракция волн на щели =====
  def('slit_wave', {
    params: [{ k: 'a', l: 'Ширина щели', min: 10, max: 120, step: 5, v: 30, u: 'мм' }, { k: 'lam', l: 'Длина волны λ', min: 10, max: 40, step: 1, v: 20, u: 'мм' }],
    formula: v => v.a < v.lam * 2 ? 'Щель сравнима с длиной волны — волна сильно огибает края (дифракция заметна).' : 'Щель много больше λ — за щелью почти «прямой пучок», дифракция слабая.',
    draw(c, W, H, p, t, S, st) {
      const v = st.v, r = { x: 20, y: 20, w: W - 40, h: H - 70 }, s = r.w / 400, by = r.y + r.h * .3, k = TAU / (v.lam * s), cx = W / 2, hw = v.a / 2 * s; P.panel(c, W, H);
      const src = []; for (let i = 0; i < 9; i++) src.push(cx - hw + hw * 2 * i / 8);
      field(c, r, 150, Math.round(150 * r.h / r.w), (x, y) => { if (y < by) return Math.sin(k * (y - by) - t * 5) * .8; let s2 = 0; src.forEach(sx => { const d = Math.hypot(x - sx, y - by); s2 += Math.sin(k * d - t * 5) / Math.sqrt(1 + d * .02); }); return s2 / 9 * 1.6; }, water);
      c.fillStyle = '#4a4f5a'; c.fillRect(r.x, by - 6, cx - hw - r.x, 12); c.fillRect(cx + hw, by - 6, r.x + r.w - cx - hw, 12);
      CH.pill(c, 'Принцип Гюйгенса: каждая точка щели — источник вторичной волны', W / 2, H - 22, 12.5);
    }
  });

  // ===== § 35. Электромагнитная волна =====
  def('emwave', {
    params: [{ k: 'lam', l: 'Длина волны λ', min: 1, max: 6, step: .1, v: 3, u: 'м' }],
    formula: v => `c = λ·ν → ν = c/λ = 3·10⁸ / ${n(v.lam)} = ${n(3e8 / v.lam)} Гц\nВекторы E и B перпендикулярны друг другу и направлению распространения — волна поперечная.`,
    draw(c, W, H, p, t, S, st) {
      const v = st.v, x0 = 50, x1 = W - 40, cy = H * .48, sc = (x1 - x0) / 12, A = Math.min(110, H * .2); P.panel(c, W, H);
      const pt = (x, y, z) => [x0 + x * sc + z * .45, cy - y + z * -.32]; // косоугольная проекция
      line(c, ...pt(0, 0, 0), ...pt(12, 0, 0), LINE, 2); arrow(c, ...pt(11.2, 0, 0), ...pt(12, 0, 0), LINE, 2, 'c');
      for (let i = 0; i <= 120; i++) { const x = i / 10, ph = TAU * (x / v.lam - t * .4), e = Math.sin(ph) * A, b = Math.sin(ph) * A * .8;
        if (i % 3 === 0) { line(c, ...pt(x, 0, 0), ...pt(x, e, 0), 'rgba(224,83,61,.55)', 2); line(c, ...pt(x, 0, 0), ...pt(x, 0, b), 'rgba(31,111,209,.55)', 2); } }
      ['E', 'B'].forEach((nm, j) => { c.beginPath(); for (let i = 0; i <= 240; i++) { const x = i / 20, ph = TAU * (x / v.lam - t * .4), q = j ? pt(x, 0, Math.sin(ph) * A * .8) : pt(x, Math.sin(ph) * A, 0); i ? c.lineTo(...q) : c.moveTo(...q); } c.lineWidth = 3; c.strokeStyle = j ? C.blue : C.red; c.stroke(); });
      lab(c, 'E', x0 - 14, cy - A, 18, C.red); lab(c, 'B', x0 + A * .5, cy + A * .45, 18, C.blue);
      CH.pill(c, 'Переменное электрическое поле порождает магнитное, а то — снова электрическое', W / 2, H - 22, 12.5);
    }
  });

  // ===== § 36. Опыты Герца =====
  def('hertz', {
    formula: () => 'Искра в вибраторе Герца создаёт быстрые колебания — излучается электромагнитная волна, и в резонаторе на расстоянии тоже проскакивает искра.',
    draw(c, W, H, p, t, S, st) {
      P.panel(c, W, H); const cy = H * .45, xa = W * .2, xb = W * .8, ph = (t * .7) % 1, spark = ph < .08;
      line(c, xa, cy - 120, xa, cy - 10, LINE, 6); line(c, xa, cy + 10, xa, cy + 120, LINE, 6); dot(c, xa, cy - 120, 16, '#c4c9ce'); dot(c, xa, cy + 120, 16, '#c4c9ce'); dot(c, xa, cy - 10, 6, '#c4c9ce'); dot(c, xa, cy + 10, 6, '#c4c9ce');
      if (spark) { CH.glow(c, xa, cy, 40, '#bcd4ff', .9); line(c, xa, cy - 8, xa + 4, cy, '#fff', 2); line(c, xa + 4, cy, xa - 3, cy + 8, '#fff', 2); }
      for (let k = 0; k < 4; k++) { const r = ((ph + k * .25) % 1) * (xb - xa); circle(c, xa, cy, r); c.strokeStyle = `rgba(31,111,209,${.6 * (1 - r / (xb - xa))})`; c.lineWidth = 2.5; c.stroke(); }
      circle(c, xb, cy, 70); c.lineWidth = 5; c.strokeStyle = LINE; c.stroke(); c.clearRect(xb - 76, cy - 6, 14, 12); const rs = ((ph - .55 + 1) % 1) < .08; if (rs) CH.glow(c, xb - 70, cy, 26, '#bcd4ff', .9);
      small(c, 'вибратор', xa, cy + 160); small(c, 'резонатор', xb, cy + 100);
    }
  });

  // ===== § 38. Амплитудная модуляция и детектирование =====
  def('modulation', {
    params: [{ k: 'm', l: 'Глубина модуляции', min: 0, max: 1, step: .05, v: .6 }, { k: 'f', l: 'Несущая / звук', min: 5, max: 30, step: 1, v: 14 }],
    formula: () => 'Звуковой сигнал «записывают» в амплитуду высокочастотной несущей волны. В приёмнике детектор выпрямляет сигнал, а фильтр выделяет огибающую — звук.',
    draw(c, W, H, p, t, S, st) {
      const v = st.v; P.panel(c, W, H); const rows = [['звук', x => Math.sin(TAU * x)], ['несущая', x => Math.sin(TAU * v.f * x)], ['модулированный сигнал', x => (1 + v.m * Math.sin(TAU * x)) * Math.sin(TAU * v.f * x) / (1 + v.m)], ['после детектора', x => Math.max(0, (1 + v.m * Math.sin(TAU * x)) * Math.sin(TAU * v.f * x)) / (1 + v.m)], ['выделенный звук', x => (1 + v.m * Math.sin(TAU * x)) / (1 + v.m) * .64]];
      const h = (H - 40) / rows.length; rows.forEach(([nm, f], i) => { const r = { x: 50, y: 24 + i * h + 8, w: W - 100, h: h - 34 }; graph(c, r, [{ f: x => f(x + t * .2), col: [C.green, C.blue, C.purple, C.orange, C.red][i] }], { t0: 0, t1: 2, y0: i > 2 ? -.2 : -1.1, y1: 1.1 }); small(c, nm, r.x, r.y - 6, C.ink, 'left', 12.5); });
    }
  });

  // ===== § 40. Радиолокация =====
  def('radar', {
    params: [{ k: 'R', l: 'Расстояние до цели', min: 10, max: 300, step: 5, v: 120, u: 'км' }],
    formula: v => `R = c·t/2  →  t = 2R/c = 2·${n(v.R * 1e3)} / 3·10⁸ = ${n(2 * v.R * 1e3 / 3e8)} с\nРадиолокатор посылает короткий импульс и измеряет время до прихода эха.`,
    draw(c, W, H, p, t, S, st) {
      const v = st.v, x0 = 70, y0 = H * .78, xt = lerp(x0 + 80, W - 60, v.R / 300), yt = H * .26, ph = (t * .5) % 1; P.panel(c, W, H);
      line(c, 20, y0 + 30, W - 20, y0 + 30, '#8aa66a', 6); line(c, x0, y0 + 30, x0, y0 - 10, LINE, 5); c.beginPath(); c.ellipse(x0, y0 - 20, 34, 12, -.5, 0, TAU); c.fillStyle = '#cfd5db'; c.fill(); stroke(c, 2);
      c.save(); c.translate(xt, yt); c.fillStyle = '#4a4f5a'; c.beginPath(); c.moveTo(-30, 0); c.lineTo(30, -4); c.lineTo(34, 2); c.lineTo(-30, 6); c.closePath(); c.fill(); c.fillRect(-6, -18, 10, 34); c.restore();
      const D = Math.hypot(xt - x0, yt - y0), ux = (xt - x0) / D, uy = (yt - y0) / D, go = ph < .5, f = go ? ph * 2 : (ph - .5) * 2, px = go ? x0 + ux * D * f : xt - ux * D * f, py = go ? y0 + uy * D * f : yt - uy * D * f;
      circle(c, px, py, 10); c.fillStyle = go ? 'rgba(224,83,61,.8)' : 'rgba(47,163,107,.8)'; c.fill(); small(c, go ? 'импульс' : 'эхо', px, py - 20, go ? C.red : C.green);
      line(c, x0, y0 - 20, xt, yt, 'rgba(91,63,208,.35)', 1.5, [5, 6]); small(c, `R = ${v.R} км`, (x0 + xt) / 2 + 20, (y0 + yt) / 2);
    }
  });

  // ===== § 44. Скорость света: опыт Физо =====
  def('fizeau', {
    params: [{ k: 'nu', l: 'Обороты колеса', min: 0, max: 30, step: .5, v: 6, u: 'об/с (в модели)' }],
    formula: v => `Свет проходит между зубцами, отражается от далёкого зеркала и возвращается. При нужной скорости колеса обратный луч упирается в зубец.\nc = 2L / t = 4·L·N·ν ≈ 3·10⁸ м/с`,
    draw(c, W, H, p, t, S, st) {
      const v = st.v, cy = H * .45, wx = W * .22, mx = W - 50, R = 70, N = 12; P.panel(c, W, H); const ang = t * v.nu * .5;
      const open = a => Math.cos(N * a) > 0; const passOut = open(ang), passBack = open(ang + v.nu * .02);
      line(c, 30, cy, wx, cy, '#ffd36b', 4); if (passOut) { line(c, wx, cy, mx, cy, 'rgba(255,200,60,.9)', 3); if (passBack) line(c, wx - 60, cy + 4, mx, cy + 4, 'rgba(255,160,40,.9)', 3); }
      c.save(); c.translate(wx, cy - R); for (let k = 0; k < N; k++) { const a = ang + k * TAU / N; c.fillStyle = '#7d8590'; c.save(); c.rotate(a); c.fillRect(-6, R - 4, 12, 20); c.restore(); } circle(c, 0, 0, R); c.fillStyle = '#cfd5db'; c.fill(); stroke(c, 2); c.restore();
      rrect(c, mx, cy - 50, 14, 100, 3); c.fillStyle = '#9fc6e8'; c.fill(); stroke(c, 2); small(c, 'зеркало', mx, cy + 70);
      P.bulb(c, 40, cy - 60, 14, 1); small(c, passOut && passBack ? 'наблюдатель видит свет' : 'свет перекрыт зубцом', W / 2, H - 22, passOut && passBack ? C.green : C.red, 'center', 13);
    }
  });

  // ===== § 45. Закон отражения =====
  def('reflection', {
    params: [{ k: 'a', l: 'Угол падения α', min: 0, max: 85, step: 1, v: 40, u: '°' }],
    formula: v => `Угол отражения β = α = ${v.a}°. Падающий луч, отражённый луч и перпендикуляр к зеркалу лежат в одной плоскости.`,
    draw(c, W, H, p, t, S, st) {
      const v = st.v, cx = W / 2, cy = H * .7, L = Math.min(W, H) * .45, a = rad(v.a); P.panel(c, W, H);
      rrect(c, 40, cy, W - 80, 14, 3); c.fillStyle = '#9fc6e8'; c.fill(); stroke(c, 2); for (let x = 50; x < W - 40; x += 14) line(c, x, cy + 14, x - 8, cy + 26, C.muted, 1.4);
      line(c, cx, cy, cx, cy - L, C.muted, 1.5, [6, 5]);
      const sx = cx - Math.sin(a) * L, sy = cy - Math.cos(a) * L, ex = cx + Math.sin(a) * L, ey = sy, f = (t * .5) % 1;
      line(c, sx, sy, cx, cy, '#e0a020', 4); line(c, cx, cy, ex, ey, '#e0a020', 4); arrow(c, lerp(sx, cx, .4), lerp(sy, cy, .4), lerp(sx, cx, .55), lerp(sy, cy, .55), '#c07a10', 3); arrow(c, lerp(cx, ex, .45), lerp(cy, ey, .45), lerp(cx, ex, .6), lerp(cy, ey, .6), '#c07a10', 3);
      dot(c, f < .5 ? lerp(sx, cx, f * 2) : lerp(cx, ex, f * 2 - 1), f < .5 ? lerp(sy, cy, f * 2) : lerp(cy, ey, f * 2 - 1), 6, '#ffd36b');
      c.beginPath(); c.arc(cx, cy, 60, -Math.PI / 2 - a, -Math.PI / 2); c.strokeStyle = C.red; c.lineWidth = 2.5; c.stroke(); c.beginPath(); c.arc(cx, cy, 70, -Math.PI / 2, -Math.PI / 2 + a); c.strokeStyle = C.blue; c.stroke();
      lab(c, 'α', cx - Math.sin(a / 2) * 82, cy - Math.cos(a / 2) * 82, 18, C.red); lab(c, 'β', cx + Math.sin(a / 2) * 92, cy - Math.cos(a / 2) * 92, 18, C.blue);
    }
  });

  // ===== § 47. Закон преломления =====
  const MAT = { water: [1.33, 'вода'], glass: [1.5, 'стекло'], diamond: [2.42, 'алмаз'] };
  def('refraction', {
    params: [{ k: 'a', l: 'Угол падения α', min: 0, max: 85, step: 1, v: 45, u: '°' }],
    modes: [{ k: 'm', o: [['water', 'Вода'], ['glass', 'Стекло'], ['diamond', 'Алмаз']] }],
    formula: v => { const nn = MAT[v.m][0], g = deg(Math.asin(Math.sin(rad(v.a)) / nn)); return `sin α / sin γ = n = ${n(nn)}  →  γ = ${n(g, 1)}°\nПри переходе в оптически более плотную среду луч приближается к перпендикуляру.`; },
    draw(c, W, H, p, t, S, st) {
      const v = st.v, nn = MAT[v.m][0], cx = W / 2, cy = H * .48, L = Math.min(W, H) * .42, a = rad(v.a), g = Math.asin(Math.sin(a) / nn); P.panel(c, W, H);
      c.fillStyle = v.m === 'water' ? 'rgba(80,150,230,.25)' : v.m === 'glass' ? 'rgba(160,210,220,.35)' : 'rgba(210,235,255,.5)'; c.fillRect(20, cy, W - 40, H - cy - 50); line(c, 20, cy, W - 20, cy, LINE, 2);
      small(c, 'воздух, n = 1', 40, cy - 16, C.ink, 'left', 13); small(c, `${MAT[v.m][1]}, n = ${n(nn)}`, 40, cy + 18, C.ink, 'left', 13);
      line(c, cx, cy - L, cx, cy + L, C.muted, 1.5, [6, 5]);
      const sx = cx - Math.sin(a) * L, sy = cy - Math.cos(a) * L, ex = cx + Math.sin(g) * L, ey = cy + Math.cos(g) * L, R = .04 + .2 * ((nn - 1) / (nn + 1)) ** 2 * 4;
      line(c, sx, sy, cx, cy, '#e0a020', 4); line(c, cx, cy, ex, ey, '#e0a020', 4); line(c, cx, cy, cx + Math.sin(a) * L, sy, `rgba(224,160,32,${R})`, 3);
      arrow(c, lerp(sx, cx, .45), lerp(sy, cy, .45), lerp(sx, cx, .6), lerp(sy, cy, .6), '#c07a10', 3); arrow(c, lerp(cx, ex, .45), lerp(cy, ey, .45), lerp(cx, ex, .6), lerp(cy, ey, .6), '#c07a10', 3);
      c.beginPath(); c.arc(cx, cy, 60, -Math.PI / 2 - a, -Math.PI / 2); c.strokeStyle = C.red; c.lineWidth = 2.5; c.stroke(); lab(c, 'α', cx - Math.sin(a / 2) * 80, cy - Math.cos(a / 2) * 80, 18, C.red);
      c.beginPath(); c.arc(cx, cy, 60, Math.PI / 2 - g, Math.PI / 2); c.strokeStyle = C.blue; c.stroke(); lab(c, 'γ', cx + Math.sin(g / 2) * 80, cy + Math.cos(g / 2) * 80, 18, C.blue);
    }
  });

  // ===== § 48. Полное внутреннее отражение =====
  def('tir', {
    params: [{ k: 'a', l: 'Угол падения α', min: 0, max: 85, step: 1, v: 30, u: '°' }, { k: 'n', l: 'Показатель n среды', min: 1.2, max: 2.4, step: .01, v: 1.5 }],
    modes: [{ k: 'm', o: [['b', 'Граница стекло — воздух'], ['f', 'Световод']] }],
    formula: v => { const a0 = deg(Math.asin(1 / v.n)); return `Предельный угол: sin α₀ = 1/n → α₀ = ${n(a0, 1)}°\n${v.a >= a0 ? 'α > α₀ — свет полностью отражается, во второй среде луча нет.' : 'α < α₀ — часть света выходит наружу.'}`; },
    draw(c, W, H, p, t, S, st) {
      const v = st.v, a0 = Math.asin(1 / v.n); P.panel(c, W, H);
      if (v.m === 'f') { const y0 = H * .4, h = 70; rrect(c, 30, y0, W - 60, h, h / 2); c.fillStyle = 'rgba(160,210,220,.4)'; c.fill(); stroke(c, 2); let x = 40, y = y0 + h / 2, dy = -1; const ang = rad(90 - v.a); c.beginPath(); c.moveTo(x, y);
        while (x < W - 40) { const nx = x + (dy < 0 ? (y - y0 - 4) : (y0 + h - 4 - y)) / Math.tan(ang); const ny = dy < 0 ? y0 + 4 : y0 + h - 4; if (nx > W - 40) { c.lineTo(W - 40, y + dy * (W - 40 - x) * Math.tan(ang)); break; } c.lineTo(nx, ny); x = nx; y = ny; dy = -dy; }
        c.lineWidth = 3.5; c.strokeStyle = v.a >= deg(a0) ? '#e0a020' : 'rgba(224,160,32,.5)'; c.stroke(); small(c, v.a >= deg(a0) ? 'свет «бежит» внутри волокна, многократно отражаясь' : 'угол слишком мал — свет выходит наружу через стенку', W / 2, y0 + h + 40, C.ink, 'center', 13); return; }
      const cx = W / 2, cy = H * .45, L = Math.min(W, H) * .4, a = rad(v.a); c.fillStyle = 'rgba(160,210,220,.4)'; c.fillRect(20, cy, W - 40, H - cy - 50); line(c, 20, cy, W - 20, cy, LINE, 2); line(c, cx, cy - L, cx, cy + L, C.muted, 1.5, [6, 5]);
      small(c, `стекло, n = ${n(v.n)}`, 40, cy + 18, C.ink, 'left', 13); small(c, 'воздух', 40, cy - 16, C.ink, 'left', 13);
      const sx = cx - Math.sin(a) * L, sy = cy + Math.cos(a) * L; line(c, sx, sy, cx, cy, '#e0a020', 4);
      const total = a >= a0, refl = total ? 1 : .15 + .85 * Math.pow(a / a0, 6); line(c, cx, cy, cx + Math.sin(a) * L, sy, `rgba(224,160,32,${refl})`, 4);
      if (!total) { const g = Math.asin(v.n * Math.sin(a)); line(c, cx, cy, cx + Math.sin(g) * L, cy - Math.cos(g) * L, `rgba(224,160,32,${1 - refl})`, 4); }
      c.beginPath(); c.arc(cx, cy, 50, Math.PI / 2, Math.PI / 2 + a); c.strokeStyle = C.red; c.lineWidth = 2.5; c.stroke(); lab(c, 'α', cx - Math.sin(a / 2) * 68, cy + Math.cos(a / 2) * 68, 18, C.red);
      c.beginPath(); c.arc(cx, cy, 90, Math.PI / 2, Math.PI / 2 + a0); c.strokeStyle = C.purple; c.setLineDash([4, 4]); c.stroke(); c.setLineDash([]); small(c, 'α₀', cx - Math.sin(a0) * 104, cy + Math.cos(a0) * 104, C.purple);
    }
  });

  // ===== § 50–51. Линза, формула тонкой линзы =====
  def('lens', {
    params: [{ k: 'F', l: 'Фокусное расстояние F', min: 5, max: 20, step: .5, v: 10, u: 'см' }, { k: 'd', l: 'Расстояние до предмета d', min: 2, max: 40, step: .5, v: 25, u: 'см' }],
    modes: [{ k: 'm', o: [['c', 'Собирающая'], ['d', 'Рассеивающая']] }],
    formula: v => { const F = v.m === 'c' ? v.F : -v.F, f = 1 / (1 / F - 1 / v.d), G = Math.abs(f / v.d); const kind = !isFinite(f) || Math.abs(f) > 1e4 ? 'изображения нет (предмет в фокусе)' : f > 0 ? 'действительное, перевёрнутое' : 'мнимое, прямое'; return `1/F = 1/d + 1/f → f = ${isFinite(f) && Math.abs(f) < 1e4 ? n(f, 1) + ' см' : '∞'}\nУвеличение Γ = |f/d| = ${isFinite(G) && G < 1e3 ? n(G) : '∞'};  изображение: ${kind}${f > 0 && G > 1 ? ', увеличенное' : f > 0 ? ', уменьшенное' : ''}`; },
    draw(c, W, H, p, t, S, st) {
      const v = st.v, cx = W / 2, cy = H * .5, s = Math.min(W / 90, 9), F = v.m === 'c' ? v.F : -v.F, f = 1 / (1 / F - 1 / v.d), h = 6, X = x => cx + x * s, Y = y => cy - y * s; P.panel(c, W, H);
      line(c, 20, cy, W - 20, cy, C.muted, 1.5); [F, -F].forEach(x => { dot(c, X(x), cy, 4, LINE); small(c, x === F ? 'F' : 'F', X(x), cy + 16, C.ink, 'center', 13); dot(c, X(2 * x), cy, 3, C.muted); small(c, '2F', X(2 * x), cy + 16, C.muted); });
      c.beginPath(); if (v.m === 'c') { c.ellipse(cx, cy, 12, Math.min(H * .38, 26 * s), 0, 0, TAU); } else { const hh = Math.min(H * .38, 26 * s); c.moveTo(cx - 14, cy - hh); c.quadraticCurveTo(cx - 4, cy, cx - 14, cy + hh); c.lineTo(cx + 14, cy + hh); c.quadraticCurveTo(cx + 4, cy, cx + 14, cy - hh); c.closePath(); }
      c.fillStyle = 'rgba(160,210,240,.45)'; c.fill(); stroke(c, 2);
      const ox = X(-v.d); arrow(c, ox, cy, ox, Y(h), C.green, 4, ''); small(c, 'предмет', ox, cy + 30, C.green);
      const ok = isFinite(f) && Math.abs(f) < 300, ix = X(f), iy = Y(-h * f / v.d);
      const ray = (x1, y1, x2, y2, dash) => line(c, x1, y1, x2, y2, '#e0a020', 2.6, dash);
      // луч 1: параллельно оси → через фокус; луч 2: через центр
      ray(ox, Y(h), cx, Y(h)); const k1 = (cy - Y(h)) / (X(F) - cx); ray(cx, Y(h), W - 20, Y(h) + k1 * (W - 20 - cx));
      if (F < 0 || f < 0) ray(cx, Y(h), cx - 400, Y(h) - k1 * 400, [5, 5]);
      const k2 = (Y(h) - cy) / (ox - cx); ray(ox, Y(h), W - 20, cy + k2 * (W - 20 - cx)); if (f < 0) ray(cx, cy, 20, cy + k2 * (20 - cx), [5, 5]);
      if (ok) { arrow(c, ix, cy, ix, iy, f > 0 ? C.red : 'rgba(224,83,61,.6)', 4, ''); small(c, f > 0 ? 'изображение' : 'мнимое изображение', ix, cy + (iy > cy ? -18 : 30), C.red); }
      small(c, `d = ${n(v.d, 1)} см`, (ox + cx) / 2, cy + 52, C.ink, 'center', 13); if (ok) small(c, `f = ${n(f, 1)} см`, (ix + cx) / 2, cy + 70, C.ink, 'center', 13);
    }
  });

  // ===== § 53. Дисперсия света в призме =====
  def('prism', {
    params: [{ k: 'a', l: 'Угол падения', min: 20, max: 70, step: 1, v: 45, u: '°' }],
    formula: () => 'Показатель преломления стекла зависит от длины волны: фиолетовый свет преломляется сильнее красного — белый свет раскладывается в спектр. (Разброс цветов на рисунке усилен.)',
    draw(c, W, H, p, t, S, st) {
      const v = st.v, cx = W / 2, cy = H * .5, s = Math.min(W, H) * .34; P.panel(c, W, H);
      const A = [cx, cy - s * .8], B = [cx - s * .75, cy + s * .5], Cc = [cx + s * .75, cy + s * .5];
      c.beginPath(); c.moveTo(...A); c.lineTo(...B); c.lineTo(...Cc); c.closePath(); c.fillStyle = 'rgba(190,220,240,.5)'; c.fill(); stroke(c, 2.5);
      const unit = (x, y) => { const L = Math.hypot(x, y); return [x / L, y / L]; }, rot = ([x, y], a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)], dotp = (u, w) => u[0] * w[0] + u[1] * w[1];
      const refr = (d, nn, n1, n2) => { const ci = -dotp(nn, d), r = n1 / n2, k = 1 - r * r * (1 - ci * ci); if (k < 0) return null; const f = r * ci - Math.sqrt(k); return unit(r * d[0] + f * nn[0], r * d[1] + f * nn[1]); };
      const hit = (o, d, P1, P2) => { const ex = P2[0] - P1[0], ey = P2[1] - P1[1], den = d[0] * ey - d[1] * ex; if (Math.abs(den) < 1e-9) return null; const tt = ((P1[0] - o[0]) * ey - (P1[1] - o[1]) * ex) / den, u = ((P1[0] - o[0]) * d[1] - (P1[1] - o[1]) * d[0]) / den; return tt > 1 && u >= 0 && u <= 1 ? [o[0] + d[0] * tt, o[1] + d[1] * tt] : null; };
      const M = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2], nOutL = unit(-(B[1] - A[1]), B[0] - A[0]), nInL = [-nOutL[0], -nOutL[1]];
      const nOut = dotp(nOutL, [M[0] - cx, M[1] - cy]) > 0 ? nOutL : nInL, nIn = [-nOut[0], -nOut[1]];
      const d = rot(nIn, -v.a * Math.PI / 180), src = [M[0] - d[0] * 300, M[1] - d[1] * 300];
      line(c, src[0], src[1], M[0], M[1], LINE, 7); line(c, src[0], src[1], M[0], M[1], '#ffffff', 5); small(c, 'белый свет', M[0] - d[0] * 110, M[1] - d[1] * 110 - 20, C.ink, 'center', 13);
      const nR0 = unit(-(Cc[1] - A[1]), Cc[0] - A[0]), Mr = [(A[0] + Cc[0]) / 2, (A[1] + Cc[1]) / 2], nOutR = dotp(nR0, [Mr[0] - cx, Mr[1] - cy]) > 0 ? nR0 : [-nR0[0], -nR0[1]];
      [700, 650, 600, 570, 540, 500, 460, 420].forEach(l => { const nn = 1.62 - (l - 400) / 300 * .08, t1 = refr(d, nOut, 1, nn); if (!t1) return;
        const q = hit(M, t1, A, Cc) || hit(M, t1, B, Cc); if (!q) return; line(c, M[0], M[1], q[0], q[1], P.wl(l, .7), 2.2);
        const t2 = refr(t1, [-nOutR[0], -nOutR[1]], nn, 1); if (!t2) return; line(c, q[0], q[1], q[0] + t2[0] * 600, q[1] + t2[1] * 600, P.wl(l), 4); });
    }
  });

  // ===== § 54. Интерференция: опыт Юнга =====
  def('young', {
    params: [{ k: 'lam', l: 'Длина волны λ', min: 400, max: 700, step: 5, v: 550, u: 'нм' }, { k: 'd', l: 'Расстояние между щелями d', min: .1, max: 1, step: .05, v: .3, u: 'мм' }, { k: 'L', l: 'Расстояние до экрана L', min: .5, max: 3, step: .1, v: 1.5, u: 'м' }],
    formula: v => { const dx = v.lam * 1e-9 * v.L / (v.d * 1e-3); return `Ширина полосы Δx = λL/d = ${n(dx * 1e3, 2)} мм\nСветлая полоса — где разность хода равна целому числу длин волн.`; },
    draw(c, W, H, p, t, S, st) {
      const v = st.v, sp = split(W, H, .55), a = sp.a, dx = v.lam * 1e-9 * v.L / (v.d * 1e-3) * 1e3; P.panel(c, W, H);
      const sx = a.x + 60, scx = a.x + a.w - 40, cy = a.y + a.h / 2, gap = 20 + v.d * 60; line(c, sx + 60, a.y + 30, sx + 60, cy - gap / 2 - 4, LINE, 6); line(c, sx + 60, cy - gap / 2 + 4, sx + 60, cy + gap / 2 - 4, LINE, 6); line(c, sx + 60, cy + gap / 2 + 4, sx + 60, a.y + a.h - 30, LINE, 6);
      for (let k = 0; k < 5; k++) { const r = ((t * 40 + k * 30) % 150); [cy - gap / 2, cy + gap / 2].forEach(y => { c.beginPath(); c.arc(sx + 60, y, r, -1.2, 1.2); c.strokeStyle = P.wl(v.lam, .5 * (1 - r / 150)); c.lineWidth = 2; c.stroke(); }); line(c, sx + r * .4, a.y + 40, sx + r * .4, a.y + a.h - 40, P.wl(v.lam, .2), 2); }
      const hh = a.h - 40; for (let y = 0; y < hh; y++) { const xmm = (y - hh / 2) / hh * 20, I = Math.cos(Math.PI * xmm / dx) ** 2; c.fillStyle = P.wl(v.lam, I); c.fillRect(scx, a.y + 20 + y, 18, 1); } rrect(c, scx, a.y + 20, 18, hh, 3); stroke(c, 1.5); small(c, 'экран', scx + 9, a.y + 10);
      const g = inner(sp.b, 30); graph(c, g, [{ f: x => Math.cos(Math.PI * x / dx) ** 2, col: P.wl(v.lam) }], { t0: -10, t1: 10, y0: 0, y1: 1.1, xl: 'x, мм' });
    }
  });

  // ===== § 54–55. Кольца Ньютона =====
  def('newton', {
    params: [{ k: 'lam', l: 'Длина волны λ', min: 400, max: 700, step: 5, v: 590, u: 'нм' }, { k: 'R', l: 'Радиус линзы R', min: 1, max: 10, step: .5, v: 4, u: 'м' }],
    formula: v => `Радиус k-го тёмного кольца: r = √(kλR) → r₁ = ${n(Math.sqrt(v.lam * 1e-9 * v.R) * 1e3, 2)} мм\nСвет отражается от двух поверхностей тонкого воздушного зазора и интерферирует.`,
    draw(c, W, H, p, t, S, st) {
      const v = st.v, cx = W / 2, cy = H * .48, R = Math.min(W, H) * .4, sc = R / 3; P.panel(c, W, H);
      for (let r = R; r > 0; r -= .7) { const rm = r / sc, d = rm * rm * 1e-6 / (2 * v.R), I = Math.sin(TAU * d / (v.lam * 1e-9)) ** 2; circle(c, cx, cy, r); c.fillStyle = P.wl(v.lam, .15 + .85 * I); c.fill(); }
      circle(c, cx, cy, R); stroke(c, 2); small(c, 'вид сверху: светлые и тёмные кольца', W / 2, H - 24, C.muted, 'center', 13);
    }
  });

  // ===== § 56. Дифракция на щели =====
  def('single_slit', {
    params: [{ k: 'lam', l: 'Длина волны λ', min: 400, max: 700, step: 5, v: 630, u: 'нм' }, { k: 'a', l: 'Ширина щели a', min: .02, max: .3, step: .01, v: .08, u: 'мм' }],
    formula: v => `Первый минимум: a·sin φ = λ → φ ≈ ${n(deg(Math.asin(Math.min(1, v.lam * 1e-9 / (v.a * 1e-3)))), 2)}°\nЧем уже щель, тем шире центральная полоса — свет огибает края.`,
    draw(c, W, H, p, t, S, st) {
      const v = st.v, sp = split(W, H, .5), a = sp.a, k = v.lam * 1e-9 / (v.a * 1e-3) * 400; P.panel(c, W, H);
      const hh = a.h - 60, x0 = a.x + a.w / 2 - 70; for (let y = 0; y < hh; y++) { const u = (y - hh / 2) / hh * 6 / k * 4, I = u === 0 ? 1 : (Math.sin(Math.PI * u) / (Math.PI * u)) ** 2; c.fillStyle = P.wl(v.lam, Math.min(1, I * 1.3 + .02)); c.fillRect(x0, a.y + 30 + y, 140, 1); }
      rrect(c, x0, a.y + 30, 140, hh, 6); stroke(c, 2); small(c, 'картина на экране', x0 + 70, a.y + 18);
      const g = inner(sp.b, 30); graph(c, g, [{ f: x => { const u = x / k * 4; return u === 0 ? 1 : (Math.sin(Math.PI * u) / (Math.PI * u)) ** 2; }, col: P.wl(v.lam) }], { t0: -3, t1: 3, y0: 0, y1: 1.1, xl: 'угол' });
    }
  });

  // ===== § 58. Дифракционная решётка =====
  def('grating', {
    params: [{ k: 'N', l: 'Штрихов на 1 мм', min: 50, max: 600, step: 10, v: 300 }, { k: 'lam', l: 'Длина волны λ', min: 400, max: 700, step: 5, v: 550, u: 'нм' }],
    modes: [{ k: 'm', o: [['mono', 'Один цвет'], ['white', 'Белый свет']] }],
    formula: v => { const d = 1e-3 / v.N, s1 = v.lam * 1e-9 / d; return `Период d = 1/N = ${n(d * 1e6, 2)} мкм;  максимумы: d·sin φ = kλ\nφ₁ = ${s1 <= 1 ? n(deg(Math.asin(s1)), 1) + '°' : 'нет (λ > d)'}${v.m === 'white' ? '. В белом свете максимумы — радужные спектры, красный дальше фиолетового.' : ''}`; },
    draw(c, W, H, p, t, S, st) {
      const v = st.v, d = 1e-3 / v.N, cx = W / 2, cy = H * .42, R = Math.min(W * .44, H * .38); P.panel(c, W, H);
      line(c, cx, cy + R + 10, cx, H - 40, '#ffffff', 6); rrect(c, cx - 70, cy + R + 4, 140, 10, 2); c.fillStyle = '#7d8590'; c.fill(); small(c, 'решётка', cx + 100, cy + R + 9);
      c.beginPath(); c.arc(cx, cy + R + 9, R, Math.PI, 0); c.strokeStyle = 'rgba(43,40,35,.3)'; c.lineWidth = 12; c.stroke();
      const ls = v.m === 'white' ? [410, 450, 490, 530, 570, 610, 650, 690] : [v.lam];
      for (let k = -3; k <= 3; k++) ls.forEach(l => { const s = k * l * 1e-9 / d; if (Math.abs(s) > 1) return; const ph = Math.asin(s), x = cx + Math.sin(ph) * R, y = cy + R + 9 - Math.cos(ph) * R; line(c, cx, cy + R + 9, x, y, P.wl(l, k === 0 && v.m === 'white' ? .15 : .55), 3); dot(c, x, y, 6, k === 0 && v.m === 'white' ? '#ffffff' : P.wl(l)); if (l === ls[ls.length - 1] || ls.length === 1) small(c, 'k=' + k, x, y - 16, C.ink); });
    }
  });

  // ===== § 60. Поляризация света =====
  def('polarizer', {
    params: [{ k: 'f', l: 'Угол между поляроидами φ', min: 0, max: 180, step: 1, v: 30, u: '°' }],
    formula: v => `I = I₀·cos²φ = I₀·${n(Math.cos(rad(v.f)) ** 2, 3)} (закон Малюса)\nСветовая волна поперечная: поляроид пропускает колебания только одного направления.`,
    draw(c, W, H, p, t, S, st) {
      const v = st.v, cy = H * .45, x1 = W * .35, x2 = W * .65, R = Math.min(W, H) * .16, I = Math.cos(rad(v.f)) ** 2; P.panel(c, W, H);
      for (let k = 0; k < 8; k++) { const a = k * Math.PI / 8 + t; line(c, 60 + Math.cos(a) * 26, cy + Math.sin(a) * 26, 60 - Math.cos(a) * 26, cy - Math.sin(a) * 26, 'rgba(224,160,32,.6)', 2); } small(c, 'естественный свет', 60, cy + 48);
      line(c, 100, cy, x1 - R, cy, 'rgba(255,200,60,.9)', 6); line(c, x1, cy, x2, cy, 'rgba(255,200,60,.65)', 5); line(c, x2, cy, W - 40, cy, `rgba(255,200,60,${I * .9})`, 5);
      const pol = (x, ang, nm) => { circle(c, x, cy, R); c.fillStyle = 'rgba(120,130,150,.25)'; c.fill(); stroke(c, 3); for (let k = -4; k <= 4; k++) { const o = k * R / 5; line(c, x + Math.cos(ang) * -R * .9 + Math.sin(ang) * o, cy + Math.sin(ang) * -R * .9 - Math.cos(ang) * o, x + Math.cos(ang) * R * .9 + Math.sin(ang) * o, cy + Math.sin(ang) * R * .9 - Math.cos(ang) * o, 'rgba(43,40,35,.35)', 1.5); } small(c, nm, x, cy + R + 20); };
      pol(x1, -Math.PI / 2, 'поляризатор'); pol(x2, -Math.PI / 2 + rad(v.f), 'анализатор');
      line(c, (x1 + x2) / 2, cy - 30 * Math.sin(t * 6), (x1 + x2) / 2, cy + 30 * Math.sin(t * 6), '#e0a020', 3);
      const ex = (x2 + W - 40) / 2, A2 = 30 * Math.cos(rad(v.f)) * Math.sin(t * 6), ang = -Math.PI / 2 + rad(v.f); line(c, ex - Math.cos(ang) * A2, cy - Math.sin(ang) * A2, ex + Math.cos(ang) * A2, cy + Math.sin(ang) * A2, '#e0a020', 3);
      circle(c, W - 40, cy, 22); c.fillStyle = `rgba(255,220,120,${I})`; c.fill(); stroke(c, 2); small(c, `I = ${n(I * 100, 0)} %`, W - 40, cy + 40, C.ink, 'center', 13);
    }
  });
  P.inner = inner; P.split = split; P.field = field; P.rgbOf = rgbOf;
})();
