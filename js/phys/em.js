'use strict';
// Физика 11: магнитное поле, электромагнитная индукция, колебания, переменный ток.
(() => {
  const P = CH.P, { def, C, n, line, arrow, lab, small, dot, graph } = P, { circle, rrect, stroke, LINE, clamp, lerp } = CH;
  const split = (W, H, k = .58) => W > H ? { a: { x: 0, y: 0, w: W * k, h: H }, b: { x: W * k, y: 0, w: W * (1 - k), h: H } } : { a: { x: 0, y: 0, w: W, h: H * k }, b: { x: 0, y: H * k, w: W, h: H * (1 - k) } };
  const inner = (r, m = 40) => ({ x: r.x + m, y: r.y + m, w: r.w - 2 * m, h: r.h - 2 * m });
  const TAU = Math.PI * 2;

  // ===== § 1. Поле прямого тока =====
  def('field_wire', {
    params: [{ k: 'I', l: 'Сила тока I', min: 1, max: 20, step: .5, v: 5, u: 'А' }, { k: 'r', l: 'Расстояние r', min: 1, max: 10, step: .5, v: 4, u: 'см' }],
    modes: [{ k: 'dir', o: [['out', 'Ток к нам ⊙'], ['in', 'Ток от нас ⊗']] }],
    formula: v => `B = μ₀I / (2πr) = 2·10⁻⁷ · ${n(v.I)} / ${n(v.r / 100, 3)} = ${n(2e-7 * v.I / (v.r / 100))} Тл\nЧем больше ток и ближе точка, тем сильнее поле.`,
    draw(c, W, H, p, t, S, st) {
      const v = st.v, cx = W / 2, cy = H * .48, R0 = Math.min(W, H) * .44, out = v.dir === 'out', sgn = out ? -1 : 1, k = R0 / 11;
      P.panel(c, W, H);
      const nl = Math.round(3 + v.I / 3);
      for (let i = 1; i <= nl; i++) { const r = R0 * i / nl * .95; circle(c, cx, cy, r); c.lineWidth = 1.6; c.strokeStyle = 'rgba(31,111,209,.55)'; c.stroke();
        for (let j = 0; j < 3; j++) { const a = j * TAU / 3 + sgn * t * (.6 + v.I / 12) / Math.sqrt(i) + i; const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r, ta = a + sgn * Math.PI / 2; arrow(c, x - Math.cos(ta) * 7, y - Math.sin(ta) * 7, x + Math.cos(ta) * 7, y + Math.sin(ta) * 7, C.blue, 2.2, '', 9); } }
      // компасы
      for (let i = 0; i < 8; i++) { const a = i * TAU / 8 + .2, r = R0 * .62, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r, na = a + sgn * Math.PI / 2;
        circle(c, x, y, 15); c.fillStyle = 'rgba(255,255,255,.9)'; c.fill(); stroke(c, 1.6);
        c.beginPath(); c.moveTo(x + Math.cos(na) * 12, y + Math.sin(na) * 12); c.lineTo(x + Math.cos(na + 1.57) * 3.5, y + Math.sin(na + 1.57) * 3.5); c.lineTo(x - Math.cos(na) * 12, y - Math.sin(na) * 12); c.lineTo(x - Math.cos(na + 1.57) * 3.5, y - Math.sin(na + 1.57) * 3.5); c.closePath(); c.fillStyle = '#ddd'; c.fill();
        c.beginPath(); c.moveTo(x + Math.cos(na) * 12, y + Math.sin(na) * 12); c.lineTo(x + Math.cos(na + 1.57) * 3.5, y + Math.sin(na + 1.57) * 3.5); c.lineTo(x - Math.cos(na + 1.57) * 3.5, y - Math.sin(na + 1.57) * 3.5); c.closePath(); c.fillStyle = C.red; c.fill(); }
      P.perp(c, cx, cy, 16, out, C.red); lab(c, 'I', cx + 24, cy - 18, 18, C.red);
      // точка наблюдения
      const pr = Math.min(R0, v.r * k), px = cx + pr * Math.cos(-.6), py = cy + pr * Math.sin(-.6), ba = -.6 + sgn * Math.PI / 2, bl = 20 + 900 * 2e-7 * v.I / (v.r / 100) * 10;
      line(c, cx, cy, px, py, C.muted, 1.4, [4, 4]); small(c, 'r', (cx + px) / 2 + 8, (cy + py) / 2 - 8); dot(c, px, py, 5, C.purple); arrow(c, px, py, px + Math.cos(ba) * Math.min(bl, 110), py + Math.sin(ba) * Math.min(bl, 110), C.purple, 3.5, 'B');
      CH.pill(c, 'Правило буравчика: буравчик вкручивается по току — ручка вращается по линиям B', W / 2, H - 22, 12.5);
    }
  });

  // ===== § 1. Опыт Эрстеда =====
  def('oersted', {
    params: [{ k: 'I', l: 'Сила тока I', min: 0, max: 10, step: .5, v: 4, u: 'А' }],
    modes: [{ k: 'dir', o: [['r', 'Ток →'], ['l', 'Ток ←']] }],
    formula: v => v.I ? `Ток ${n(v.I)} А — стрелка поворачивается перпендикулярно проводу.\nСменили направление тока — стрелка повернулась в другую сторону.` : 'Тока нет — стрелка смотрит на север вдоль провода.',
    draw(c, W, H, p, t, S, st) {
      const v = st.v, cx = W / 2, cy = H * .5, s = st.ang || 0, sgn = v.dir === 'r' ? 1 : -1;
      const target = v.I ? sgn * Math.atan(v.I / 1.5) : 0; st.w = (st.w || 0) + ((target - s) * 18 - (st.w || 0) * 3) * .016; st.ang = s + st.w * .016;
      P.panel(c, W, H);
      // компас
      const R = Math.min(W, H) * .26; circle(c, cx, cy + 20, R); c.fillStyle = '#fbfaf6'; c.fill(); stroke(c, 3);
      ['С', 'В', 'Ю', 'З'].forEach((s, i) => small(c, s, cx + Math.cos(i * Math.PI / 2 - Math.PI / 2) * (R - 16), cy + 20 + Math.sin(i * Math.PI / 2 - Math.PI / 2) * (R - 16), C.muted, 'center', 13));
      c.save(); c.translate(cx, cy + 20); c.rotate(st.ang); c.beginPath(); c.moveTo(0, -R * .8); c.lineTo(10, 0); c.lineTo(-10, 0); c.closePath(); c.fillStyle = C.red; c.fill(); stroke(c, 1.5);
      c.beginPath(); c.moveTo(0, R * .8); c.lineTo(10, 0); c.lineTo(-10, 0); c.closePath(); c.fillStyle = '#d9d4c9'; c.fill(); stroke(c, 1.5); c.restore(); dot(c, cx, cy + 20, 5, LINE);
      // провод над компасом (вдоль меридиана — вертикально на рисунке)
      c.lineCap = 'round'; line(c, cx, cy - R - 60, cx, cy + R + 90, LINE, 10); line(c, cx, cy - R - 60, cx, cy + R + 90, '#c8703a', 6);
      if (v.I) for (let i = 0; i < 6; i++) { const y = cy - R - 50 + ((t * 60 * v.I / 4 * -sgn + i * 50) % 300 + 300) % 300; dot(c, cx, y, 3.5, '#ffd36b'); }
      arrow(c, cx + 40, cy - R - 40, cx + 40, cy - R - 40 - sgn * 40 * (v.I ? 1 : 0), C.red, 3, v.I ? 'I' : '');
      CH.pill(c, 'Провод натянут над компасом вдоль стрелки (с севера на юг)', W / 2, H - 22, 12.5);
    }
  });

  // ===== § 1. Линии магнитного поля: магнит, катушка =====
  def('bar_magnet', {
    modes: [{ k: 'm', o: [['bar', 'Полосовой магнит'], ['coil', 'Катушка с током'], ['u', 'Подковообразный']] }],
    formula: v => v.m === 'coil' ? 'Катушка с током похожа на магнит: внутри поле почти однородное, линии замкнуты.' : 'Линии магнитной индукции выходят из N и входят в S, снаружи и внутри магнита они замкнуты.',
    draw(c, W, H, p, t, S, st) {
      const v = st.v, cx = W / 2, cy = H * .47, L = Math.min(W * .34, 260), poles = v.m === 'u' ? [[cx - L * .35, cy + 30, 1], [cx + L * .35, cy + 30, -1]] : [[cx + L / 2, cy, 1], [cx - L / 2, cy, -1]];
      P.panel(c, W, H);
      const B = (x, y) => { let bx = 0, by = 0; poles.forEach(([px, py, q]) => { const dx = x - px, dy = y - py, r = Math.max(14, Math.hypot(dx, dy)), k = q / (r * r * r); bx += dx * k; by += dy * k; }); return [bx, by]; };
      // опилки
      for (let x = 24; x < W - 10; x += 22) for (let y = 30; y < H - 50; y += 22) {
        const jx = x + (CH.H(x * 7 + y) - .5) * 8, jy = y + (CH.H(x + y * 3) - .5) * 8; if (v.m !== 'u' && Math.abs(jy - cy) < 30 && Math.abs(jx - cx) < L / 2 + 8 && v.m === 'bar') continue;
        const [bx, by] = B(jx, jy), m = Math.hypot(bx, by); if (!m) continue; const s = Math.min(9, 2.5 + Math.log10(m * 1e7 + 1) * 1.6); line(c, jx - bx / m * s, jy - by / m * s, jx + bx / m * s, jy + by / m * s, 'rgba(70,70,80,.55)', 1.6);
      }
      // силовые линии
      const N0 = poles.find(q => q[2] > 0);
      for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; let x = N0[0] + Math.cos(a) * 16, y = N0[1] + Math.sin(a) * 16; c.beginPath(); c.moveTo(x, y);
        for (let s = 0; s < 500; s++) { const [bx, by] = B(x, y), m = Math.hypot(bx, by); if (!m) break; x += bx / m * 4; y += by / m * 4; c.lineTo(x, y); if (poles.some(([px, py, q]) => q < 0 && Math.hypot(x - px, y - py) < 14) || x < 0 || x > W || y < 0 || y > H) break; }
        c.lineWidth = 2; c.strokeStyle = 'rgba(31,111,209,.7)'; c.stroke(); }
      if (v.m === 'bar') P.magnet(c, cx, cy, L, 46, false, false);
      else if (v.m === 'u') { c.lineWidth = 34; c.strokeStyle = LINE; c.beginPath(); c.moveTo(cx - L * .35, cy + 40); c.lineTo(cx - L * .35, cy - 50); c.arc(cx, cy - 50, L * .35, Math.PI, 0); c.lineTo(cx + L * .35, cy + 40); c.stroke(); c.lineWidth = 29; c.strokeStyle = '#9aa6b2'; c.stroke();
        rrect(c, cx - L * .35 - 15, cy + 10, 30, 36, 3); c.fillStyle = C.blue; c.fill(); stroke(c, 2); rrect(c, cx + L * .35 - 15, cy + 10, 30, 36, 3); c.fillStyle = C.red; c.fill(); stroke(c, 2); lab(c, 'S', cx - L * .35, cy + 28, 15, '#fff'); lab(c, 'N', cx + L * .35, cy + 28, 15, '#fff'); }
      else { P.coil(c, cx, cy, L, 70, 10); line(c, cx - L / 2 - 4, cy, cx + L / 2 + 4, cy, 'rgba(31,111,209,.7)', 2); P.coilFront(c, cx, cy, L, 70, 10); lab(c, 'S', cx - L / 2 - 26, cy, 18, C.blue); lab(c, 'N', cx + L / 2 + 26, cy, 18, C.red);
        for (let i = 0; i < 5; i++) { const x = cx - L / 2 + ((t * 50 + i * L / 5) % L); dot(c, x, cy + 36, 3, '#ffd36b'); } }
      // компас бегает по линии
      const a = t * .5, x0 = N0[0] + Math.cos(a % TAU) * 60, y0 = N0[1] + Math.sin(a % TAU) * 60 * .8, [bx, by] = B(x0, y0), ang = Math.atan2(by, bx);
      circle(c, x0, y0, 14); c.fillStyle = '#fff'; c.fill(); stroke(c, 1.6); arrow(c, x0 - Math.cos(ang) * 10, y0 - Math.sin(ang) * 10, x0 + Math.cos(ang) * 10, y0 + Math.sin(ang) * 10, C.red, 2.5, '', 7);
      CH.pill(c, 'Железные опилки и стрелка компаса выстраиваются вдоль линий поля', W / 2, H - 22, 12.5);
    }
  });

  // ===== § 2. Сила Ампера =====
  def('ampere', {
    params: [{ k: 'B', l: 'Индукция B', min: 0, max: 1, step: .05, v: .5, u: 'Тл' }, { k: 'I', l: 'Сила тока I', min: 0, max: 10, step: .5, v: 4, u: 'А' }, { k: 'l', l: 'Длина l', min: .05, max: .3, step: .01, v: .2, u: 'м' }, { k: 'a', l: 'Угол α', min: 0, max: 180, step: 5, v: 90, u: '°' }],
    formula: v => { const F = v.B * v.I * v.l * Math.sin(v.a * Math.PI / 180); return `F = B·I·l·sin α = ${n(v.B)} · ${n(v.I)} · ${n(v.l)} · sin ${v.a}° = ${n(F, 3)} Н\nПравило левой руки: B входит в ладонь, 4 пальца — по току, большой палец — сила.`; },
    draw(c, W, H, p, t, S, st) {
      const v = st.v, cx = W / 2, cy = H * .45, F = v.B * v.I * v.l * Math.sin(v.a * Math.PI / 180), a = v.a * Math.PI / 180;
      P.panel(c, W, H);
      // полюса и линии B (вправо)
      const pw = 46, ph = H * .55; rrect(c, 20, cy - ph / 2, pw, ph, 6); c.fillStyle = C.red; c.fill(); stroke(c, 2.2); lab(c, 'N', 20 + pw / 2, cy, 20, '#fff'); rrect(c, W - 20 - pw, cy - ph / 2, pw, ph, 6); c.fillStyle = C.blue; c.fill(); stroke(c, 2.2); lab(c, 'S', W - 20 - pw / 2, cy, 20, '#fff');
      for (let i = 0; i < 7; i++) { const y = cy - ph / 2 + ph * (i + .5) / 7; const k = v.B; if (k > 0) { line(c, 20 + pw + 6, y, W - 26 - pw, y, `rgba(31,111,209,${.25 + .6 * k})`, 1.5 + k * 2); arrow(c, cx - 140 + ((t * 40 + i * 37) % 280), y, cx - 128 + ((t * 40 + i * 37) % 280), y, C.blue, 2, '', 8); } }
      lab(c, 'B', W - 26 - pw - 18, cy - ph / 2 - 12, 18, C.blue);
      // проводник под углом α к B
      const L = 120 + v.l * 600, dx = Math.cos(a) * L / 2, dy = -Math.sin(a) * L / 2; c.lineCap = 'round'; line(c, cx - dx, cy - dy, cx + dx, cy + dy, LINE, 12); line(c, cx - dx, cy - dy, cx + dx, cy + dy, '#c8703a', 8);
      if (v.I) for (let i = 0; i < 6; i++) { const f = ((t * .25 * v.I / 4 + i / 6) % 1); dot(c, lerp(cx - dx, cx + dx, f), lerp(cy - dy, cy + dy, f), 3.5, '#ffd36b'); }
      arrow(c, cx + dx * .55, cy + dy * .55 - 18, cx + dx * .95, cy + dy * .95 - 18, C.red, 3, 'I');
      // угол
      c.beginPath(); c.arc(cx, cy, 34, -a, 0, false); c.strokeStyle = C.purple; c.lineWidth = 2; c.stroke(); small(c, 'α', cx + 44 * Math.cos(-a / 2), cy + 44 * Math.sin(-a / 2), C.purple, 'center', 15);
      // сила — перпендикулярно плоскости рисунка: «к нам»
      const R = 8 + Math.min(40, Math.abs(F) * 40); if (Math.abs(F) > .001) { P.perp(c, cx, cy + 120, R, true, C.green); small(c, `F = ${n(F, 3)} Н — направлена к нам`, cx, cy + 120 + R + 16, C.green, 'center', 13); } else small(c, 'F = 0: проводник параллелен линиям поля', cx, cy + 130, C.green, 'center', 13);
    }
  });

  // ===== § 2. Взаимодействие параллельных токов =====
  def('parallel', {
    params: [{ k: 'I1', l: 'Ток I₁', min: 1, max: 20, step: 1, v: 10, u: 'А' }, { k: 'I2', l: 'Ток I₂', min: 1, max: 20, step: 1, v: 10, u: 'А' }, { k: 'd', l: 'Расстояние d', min: 1, max: 10, step: .5, v: 3, u: 'см' }],
    modes: [{ k: 'm', o: [['same', 'Токи в одну сторону'], ['opp', 'Токи навстречу']] }],
    formula: v => `F/l = μ₀I₁I₂ / (2πd) = 2·10⁻⁷ · ${n(v.I1)}·${n(v.I2)} / ${n(v.d / 100, 3)} = ${n(2e-7 * v.I1 * v.I2 / (v.d / 100))} Н на 1 м\n${v.m === 'same' ? 'Токи одного направления притягиваются.' : 'Противоположные токи отталкиваются.'}`,
    draw(c, W, H, p, t, S, st) {
      const v = st.v, cx = W / 2, top = H * .12, bot = H * .82, gap = 40 + v.d * 14, att = v.m === 'same', F = 2e-7 * v.I1 * v.I2 / (v.d / 100), bend = clamp(F * 20000, 6, 40) * (att ? 1 : -1), mid = (top + bot) / 2;
      P.panel(c, W, H);
      [[-1, v.I1, 1], [1, v.I2, att ? 1 : -1]].forEach(([side, I, dir]) => { const x0 = cx + side * gap / 2, bx = x0 - side * bend; // притяжение — изгиб внутрь
        c.beginPath(); c.moveTo(x0, top); c.quadraticCurveTo(bx * 2 - x0, mid, x0, bot); c.lineCap = 'round'; c.lineWidth = 11; c.strokeStyle = LINE; c.stroke(); c.lineWidth = 7; c.strokeStyle = '#c8703a'; c.stroke();
        for (let i = 0; i < 6; i++) { const f = ((t * .2 * I / 8 * dir + i / 6) % 1 + 1) % 1, y = lerp(top, bot, f), xx = lerp(x0, bx, 4 * f * (1 - f)); dot(c, xx, y, 3.5, '#ffd36b'); }
        arrow(c, x0 + side * 34, mid + dir * 30, x0 + side * 34, mid - dir * 30, C.red, 3, 'I');
        const fl = 14 + Math.min(50, F * 60000); arrow(c, bx, mid + 70, bx - side * fl * (att ? 1 : -1), mid + 70, C.green, 3, 'F'); });
      small(c, 'd', cx, top + 20); line(c, cx - gap / 2, top + 32, cx + gap / 2, top + 32, C.muted, 1.2);
      CH.pill(c, 'Каждый ток создаёт магнитное поле, которое действует на другой ток', W / 2, H - 22, 12.5);
    }
  });

  // ===== § 2. Рамка с током в магнитном поле (принцип двигателя) =====
  def('motor', {
    params: [{ k: 'B', l: 'Индукция B', min: .1, max: 1, step: .05, v: .5, u: 'Тл' }, { k: 'I', l: 'Ток I', min: 0, max: 5, step: .1, v: 2, u: 'А' }, { k: 'S', l: 'Площадь S', min: 10, max: 100, step: 5, v: 50, u: 'см²' }],
    formula: (v, st) => { const M = v.B * v.I * v.S / 1e4; return `Mₘₐₓ = B·I·S = ${n(v.B)} · ${n(v.I)} · ${n(v.S / 1e4, 4)} = ${n(M, 4)} Н·м\nКоллектор меняет направление тока каждые пол-оборота — рамка крутится в одну сторону.`; },
    draw(c, W, H, p, t, S, st, dt) {
      const v = st.v, cx = W / 2, cy = H * .45, M = v.B * v.I * v.S / 1e4; st.w = (st.w || 0) + (M * 300 - (st.w || 0) * .8) * dt; st.ph = (st.ph || 0) + st.w * dt;
      P.panel(c, W, H); const R = Math.min(W, H) * .26, ang = st.ph;
      rrect(c, cx - R - 90, cy - R, 50, R * 2, 6); c.fillStyle = C.red; c.fill(); stroke(c, 2); lab(c, 'N', cx - R - 65, cy, 20, '#fff'); rrect(c, cx + R + 40, cy - R, 50, R * 2, 6); c.fillStyle = C.blue; c.fill(); stroke(c, 2); lab(c, 'S', cx + R + 65, cy, 20, '#fff');
      for (let i = 0; i < 6; i++) { const y = cy - R + R * 2 * (i + .5) / 6; line(c, cx - R - 36, y, cx + R + 36, y, 'rgba(31,111,209,.4)', 1.5); }
      // рамка: вид сверху — стороны движутся по окружности
      const w = R * Math.cos(ang), h = R * .9; c.lineWidth = 8; c.strokeStyle = LINE; rrect(c, cx - Math.abs(w), cy - h, Math.abs(w) * 2 + .01, h * 2, 4); c.stroke(); c.lineWidth = 5; c.strokeStyle = '#c8703a'; c.stroke();
      const sideOut = Math.sin(ang) > 0; P.perp(c, cx + w, cy, 9, sideOut, C.red); P.perp(c, cx - w, cy, 9, !sideOut, C.red);
      arrow(c, cx + w, cy - h - 16, cx + w, cy - h - 16 - 40 * Math.sign(Math.cos(ang) || 1) * (v.I ? 1 : 0), C.green, 3, 'F'); arrow(c, cx - w, cy + h + 16, cx - w, cy + h + 16 + 40 * Math.sign(Math.cos(ang) || 1) * (v.I ? 1 : 0), C.green, 3, 'F');
      small(c, `частота вращения ≈ ${n(Math.abs(st.w) / TAU, 1)} об/с (в модели)`, W / 2, H - 22, C.muted, 'center', 13);
    }
  });

  // ===== § 4. Сила Лоренца =====
  const PART = { e: { m: P.me, q: -P.e, nm: 'электрон', col: C.blue }, p: { m: P.mp, q: P.e, nm: 'протон', col: C.red }, a: { m: 4 * P.mp, q: 2 * P.e, nm: 'α-частица', col: C.orange } };
  def('lorentz', {
    params: [{ k: 'v', l: 'Скорость v', min: 1, max: 20, step: .5, v: 6, u: '·10⁶ м/с' }, { k: 'B', l: 'Индукция B', min: 1, max: 50, step: 1, v: 10, u: 'мТл' }],
    modes: [{ k: 'pt', o: [['e', 'Электрон'], ['p', 'Протон'], ['a', 'α-частица']] }],
    formula: v => { const q = PART[v.pt], r = q.m * v.v * 1e6 / (Math.abs(q.q) * v.B * 1e-3), T = TAU * q.m / (Math.abs(q.q) * v.B * 1e-3); return `F = |q|·v·B = ${n(Math.abs(q.q) * v.v * 1e6 * v.B * 1e-3)} Н — перпендикулярна скорости\nr = mv / (|q|B) = ${n(r)} м,  T = 2πm / (|q|B) = ${n(T)} с (от скорости не зависит)`; },
    draw(c, W, H, p, t, S, st, dt) {
      const v = st.v, q = PART[v.pt]; P.panel(c, W, H);
      const rr = { x: 20, y: 20, w: W - 40, h: H - 80 }; P.fieldMarks(c, rr, false, 44); lab(c, 'B ⊗ (от нас)', W - 80, 34, 14, C.blue);
      const r = q.m * v.v * 1e6 / (Math.abs(q.q) * v.B * 1e-3), rRef = { e: 3.4e-3, p: 6.26, a: 12.5 }[v.pt], R = clamp(120 * r / rRef, 14, Math.min(W, H) * .4);
      const key = v.pt + v.v + v.B; if (st.key !== key) { st.key = key; st.trail = []; st.ang = 0; }
      const sgn = q.q > 0 ? 1 : -1; st.ang += dt * (v.v / 6) * 160 / Math.max(R, 30);
      const cxr = W / 2, cyr = H * .46, a = st.ang, x = cxr - R * Math.sin(a) * sgn * -1, y = cyr + R * Math.cos(a);
      if (a > TAU) { st.ang = 0; st.trail = []; }
      st.trail.push([x, y]); if (st.trail.length > 400) st.trail.shift();
      c.beginPath(); st.trail.forEach(([a1, b1], i) => i ? c.lineTo(a1, b1) : c.moveTo(a1, b1)); c.lineWidth = 2.5; c.strokeStyle = q.col; c.setLineDash([6, 5]); c.stroke(); c.setLineDash([]);
      const vx = Math.cos(a) * sgn, vy = -Math.sin(a); arrow(c, x, y, x + vx * 55, y + vy * 55, C.ink, 3, 'v'); arrow(c, x, y, x + (cxr - x) / R * 45, y + (cyr - y) / R * 45, C.green, 3, 'F');
      P.dot(c, x, y, 9, q.col); lab(c, q.q > 0 ? '+' : '−', x, y, 13, '#fff');
      CH.pill(c, `${q.nm}: сила Лоренца направлена к центру, частица движется по окружности`, W / 2, H - 22, 12.5);
    }
  });

  // ===== § 6. Магнитные свойства вещества: домены =====
  def('domains', {
    params: [{ k: 'Bo', l: 'Внешнее поле', min: 0, max: 1, step: .05, v: .3 }, { k: 'T', l: 'Температура T/T_Кюри', min: 0, max: 1.6, step: .05, v: .4 }],
    modes: [{ k: 'm', o: [['f', 'Ферромагнетик'], ['p', 'Парамагнетик'], ['d', 'Диамагнетик']] }],
    formula: (v, st) => `Намагниченность ≈ ${n((st.M || 0) * 100, 0)} %\n${v.m === 'f' ? (v.T >= 1 ? 'Выше точки Кюри ферромагнетик теряет свои свойства.' : 'Домены поворачиваются по полю — поле внутри усиливается в сотни раз.') : v.m === 'p' ? 'Парамагнетик слабо усиливает поле (μ чуть больше 1).' : 'Диамагнетик слабо ослабляет поле (μ чуть меньше 1).'}`,
    draw(c, W, H, p, t, S, st) {
      const v = st.v, cols = 8, rows = 6, cw = Math.min((W - 80) / cols, (H - 160) / rows), x0 = W / 2 - cols * cw / 2, y0 = 40; let M = 0;
      P.panel(c, W, H);
      for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) { const k = i * cols + j, base = CH.H(k) * TAU, noise = Math.sin(t * (1 + CH.H(k + 3) * 2) + k) * (v.T > 1 || v.m !== 'f' ? 2.4 : .6 * v.T);
        let order = v.m === 'f' ? (v.T >= 1 ? 0 : clamp(v.Bo * 3 * (1 - v.T))) : v.m === 'p' ? v.Bo * .25 : v.Bo * .2; const tgt = v.m === 'd' ? Math.PI : 0;
        const a = Math.atan2(lerp(Math.sin(base + noise), Math.sin(tgt), order), lerp(Math.cos(base + noise), Math.cos(tgt), order)); M += Math.cos(a);
        const x = x0 + j * cw, y = y0 + i * cw; rrect(c, x + 2, y + 2, cw - 4, cw - 4, 6); c.fillStyle = `hsla(${(a * 180 / Math.PI + 360) % 360},55%,75%,.6)`; c.fill();
        arrow(c, x + cw / 2 - Math.cos(a) * cw * .3, y + cw / 2 - Math.sin(a) * cw * .3, x + cw / 2 + Math.cos(a) * cw * .3, y + cw / 2 + Math.sin(a) * cw * .3, C.ink, 2.4, '', 8); }
      st.M = M / (cols * rows);
      const yb = y0 + rows * cw + 30; if (v.Bo) arrow(c, W / 2 - 80, yb, W / 2 - 80 + 160 * v.Bo + 10, yb, C.blue, 4, 'B₀');
      rrect(c, 40, yb + 30, W - 80, 16, 8); c.fillStyle = 'rgba(0,0,0,.08)'; c.fill(); const mw = (W - 80) / 2 * st.M; rrect(c, W / 2 + Math.min(0, mw), yb + 30, Math.abs(mw), 16, 6); c.fillStyle = st.M >= 0 ? C.green : C.red; c.fill(); small(c, 'намагниченность', W / 2, yb + 62);
    }
  });

  // ===== § 7–8. Опыт Фарадея: магнит и катушка =====
  def('faraday', {
    params: [{ k: 'sp', l: 'Скорость магнита', min: 0, max: 3, step: .1, v: 1.2 }, { k: 'N', l: 'Число витков', min: 2, max: 14, step: 1, v: 8 }],
    formula: (v, st) => `εᵢ = −N·ΔΦ/Δt  (сейчас ε ≈ ${n(st.eps || 0)} у. е.)\nЧем быстрее движется магнит и чем больше витков, тем сильнее отклоняется стрелка. Магнит стоит — тока нет.`,
    draw(c, W, H, p, t, S, st) {
      const v = st.v, sp = split(W, H, .62), a = sp.a, cx = a.x + a.w * .6, cy = a.y + a.h * .45, L = Math.min(a.w * .42, 220);
      st.ph = (st.ph || 0) + v.sp * .016 * 2; const xm = cx - L * .55 + Math.sin(st.ph) * L * .55, vm = Math.cos(st.ph) * v.sp;
      const flux = x => 1 / (1 + Math.pow((x - cx) / (L * .35), 2)); const eps = -v.N * (flux(xm + vm) - flux(xm - vm)) * 1.2; st.eps = eps;
      P.panel(c, W, H); P.coil(c, cx, cy, L, 90, v.N); P.magnet(c, xm - L * .7, cy, L * .8, 40, false, false); P.coilFront(c, cx, cy, L, 90, v.N);
      // провода к гальванометру
      const gx = cx, gy = cy + 120; line(c, cx - L / 2, cy + 45, cx - L / 2, gy, LINE, 2); line(c, cx - L / 2, gy, gx - 40, gy, LINE, 2); line(c, cx + L / 2, cy + 45, cx + L / 2, gy, LINE, 2); line(c, cx + L / 2, gy, gx + 40, gy, LINE, 2); P.meter(c, gx, gy, 40, eps / 3);
      st.hist = st.hist || []; st.hist.push([flux(xm), eps]); if (st.hist.length > 240) st.hist.shift();
      const g = inner(sp.b, 34); const hs = st.hist;
      graph(c, { x: g.x, y: g.y, w: g.w, h: g.h * .42 }, [{ f: tt => (hs[Math.round(tt * (hs.length - 1))] || [0])[0], col: C.blue, lab: 'Φ' }], { y0: 0, y1: 1.1, xl: 't' });
      graph(c, { x: g.x, y: g.y + g.h * .58, w: g.w, h: g.h * .42 }, [{ f: tt => (hs[Math.round(tt * (hs.length - 1))] || [0, 0])[1], col: C.red, lab: 'ε' }], { y0: -4, y1: 4, xl: 't' });
    }
  });

  // ===== § 7. Магнитный поток =====
  def('flux', {
    params: [{ k: 'B', l: 'Индукция B', min: .1, max: 1, step: .05, v: .5, u: 'Тл' }, { k: 'S', l: 'Площадь S', min: 20, max: 200, step: 10, v: 100, u: 'см²' }, { k: 'a', l: 'Угол α (нормаль и B)', min: 0, max: 90, step: 5, v: 30, u: '°' }],
    formula: v => `Φ = B·S·cos α = ${n(v.B)} · ${n(v.S / 1e4, 4)} · cos ${v.a}° = ${n(v.B * v.S / 1e4 * Math.cos(v.a * Math.PI / 180), 5)} Вб\nПоток — это «сколько линий B пронизывает рамку».`,
    draw(c, W, H, p, t, S, st) {
      const v = st.v, cx = W / 2, cy = H * .47, a = v.a * Math.PI / 180, L = 80 + v.S * 1.1, nl = Math.round(6 + v.B * 14);
      P.panel(c, W, H);
      const proj = L * Math.cos(a); // ширина рамки, видимая поперёк линий
      for (let i = 0; i < nl; i++) { const x = cx - L * .9 + (i + .5) * L * 1.8 / nl, inside = Math.abs(x - cx) < proj / 2; line(c, x, 30, x, H - 70, inside ? C.blue : 'rgba(31,111,209,.35)', inside ? 3 : 1.6); arrow(c, x, cy + 100 + ((t * 30 + i * 17) % 60), x, cy + 112 + ((t * 30 + i * 17) % 60), inside ? C.blue : 'rgba(31,111,209,.4)', 2, '', 8); }
      // рамка, наклонённая на угол α (вид сбоку — отрезок + эллипс)
      c.save(); c.translate(cx, cy); c.beginPath(); c.ellipse(0, 0, L / 2, Math.max(4, L / 2 * Math.sin(a) * .5 + 6), 0, 0, TAU); c.fillStyle = 'rgba(242,162,58,.25)'; c.fill(); c.lineWidth = 6; c.strokeStyle = LINE; c.stroke(); c.lineWidth = 3.5; c.strokeStyle = '#c8703a'; c.stroke(); c.restore();
      // нормаль
      arrow(c, cx, cy, cx + Math.sin(a) * 90, cy - Math.cos(a) * 90 * -1 * -1, C.purple, 3, 'n'); arrow(c, cx + 150, cy + 40, cx + 150, cy - 50, C.blue, 3, 'B');
      c.beginPath(); c.arc(cx, cy, 40, -Math.PI / 2, -Math.PI / 2 + a); c.strokeStyle = C.purple; c.lineWidth = 2; c.stroke();
      small(c, `рамку пересекают ${Math.round(nl * Math.cos(a) * L / (L * 1.8))} линий из ${nl}`, W / 2, H - 22, C.muted, 'center', 13);
    }
  });

  // ===== § 8. Правило Ленца =====
  def('lenz', {
    modes: [{ k: 'm', o: [['in', 'Магнит приближаем'], ['out', 'Магнит удаляем'], ['cut', 'Кольцо с разрезом']] }],
    formula: v => v.m === 'cut' ? 'В разрезанном кольце ток не течёт — кольцо не реагирует на магнит.' : v.m === 'in' ? 'Поток растёт → индукционный ток создаёт поле, направленное против поля магнита → кольцо отталкивается.' : 'Поток убывает → индукционный ток «поддерживает» поток → кольцо притягивается к магниту.',
    draw(c, W, H, p, t, S, st) {
      const v = st.v, cy = H * .45, ph = (t * .5) % 1, dir = v.m === 'out' ? -1 : 1; const xm = v.m === 'out' ? W * .3 - ph * 120 : W * .18 + ph * 120, ring = W * .62 + (v.m === 'cut' ? 0 : dir * Math.sin(ph * Math.PI) * 26);
      P.panel(c, W, H); line(c, ring, H * .12, ring, cy - 70, LINE, 2); line(c, W * .5, H * .12, W * .8, H * .12, LINE, 6);
      P.magnet(c, xm, cy, 170, 46, false, false); arrow(c, xm + 100, cy + 50, xm + 100 + dir * 50, cy + 50, C.ink, 3, 'v');
      c.beginPath(); c.ellipse(ring, cy, 18, 70, 0, 0, TAU); c.lineWidth = 12; c.strokeStyle = LINE; c.stroke(); c.lineWidth = 8; c.strokeStyle = '#c4c9ce'; c.stroke();
      if (v.m === 'cut') { c.clearRect(ring - 12, cy - 78, 24, 14); return; }
      // индукционный ток и его поле
      for (let i = 0; i < 6; i++) { const a = t * 3 * dir + i * TAU / 6; dot(c, ring + Math.cos(a) * 18, cy + Math.sin(a) * 70, 3.5, '#ffd36b'); }
      const fdir = -dir; arrow(c, ring - 10, cy, ring - 10 + fdir * -1 * 70 * -1, cy, C.blue, 3.5, 'Bᵢ');
      lab(c, dir > 0 ? 'N' : 'S', ring - 34, cy - 84, 18, dir > 0 ? C.red : C.blue);
      CH.pill(c, dir > 0 ? 'Кольцо обращено к N магнита своим N — отталкивание' : 'Кольцо обращено к магниту полюсом S — притяжение', W / 2, H - 22, 12.5);
    }
  });

  // ===== § 9. ЭДС в движущемся проводнике =====
  def('rails', {
    params: [{ k: 'B', l: 'Индукция B', min: .1, max: 1, step: .05, v: .5, u: 'Тл' }, { k: 'v', l: 'Скорость v', min: 0, max: 10, step: .5, v: 4, u: 'м/с' }, { k: 'l', l: 'Длина l', min: .1, max: .5, step: .05, v: .3, u: 'м' }, { k: 'R', l: 'Сопротивление R', min: .5, max: 10, step: .5, v: 2, u: 'Ом' }],
    formula: v => { const e = v.B * v.v * v.l, I = e / v.R; return `εᵢ = B·v·l = ${n(v.B)}·${n(v.v)}·${n(v.l)} = ${n(e, 3)} В\nI = ε/R = ${n(I, 3)} А,  тормозящая сила F = I·B·l = ${n(I * v.B * v.l, 4)} Н`; },
    draw(c, W, H, p, t, S, st) {
      const v = st.v, top = H * .25, gap = 90 + v.l * 300, x0 = 90, x1 = W - 40, e = v.B * v.v * v.l; st.x = ((st.x || 0) + v.v * 12 * .016) % (x1 - x0 - 140);
      P.panel(c, W, H); P.fieldMarks(c, { x: 20, y: top - 50, w: W - 40, h: gap + 100 }, false, 44); lab(c, 'B ⊗', W - 60, top - 34, 15, C.blue);
      line(c, x0, top, x1, top, LINE, 6); line(c, x0, top + gap, x1, top + gap, LINE, 6); line(c, x0, top, x0, top + gap, LINE, 3);
      P.bulb(c, x0, top + gap / 2, 18, e / 4);
      const xr = x0 + 100 + st.x; line(c, xr, top - 14, xr, top + gap + 14, LINE, 12); line(c, xr, top - 14, xr, top + gap + 14, '#c8703a', 8);
      arrow(c, xr + 20, top + gap / 2, xr + 20 + 30 + v.v * 8, top + gap / 2, C.ink, 3, 'v'); if (v.v) arrow(c, xr - 20, top + gap / 2 + 40, xr - 20 - 20 - e * 30, top + gap / 2 + 40, C.green, 3, 'F');
      if (e > 0) for (let i = 0; i < 8; i++) { const f = ((t * e * .3 + i / 8) % 1); const per = 2 * (xr - x0) + 2 * gap; let d = f * per, x, y; if (d < gap) { x = xr; y = top + d; } else if (d < gap + xr - x0) { x = xr - (d - gap); y = top + gap; } else if (d < 2 * gap + xr - x0) { x = x0; y = top + gap - (d - gap - xr + x0); } else { x = x0 + (d - 2 * gap - xr + x0); y = top; } dot(c, x, y, 3.5, '#ffd36b'); }
      small(c, 'l', xr + 14, top + gap / 2 - 30, C.ink, 'left', 15);
      CH.pill(c, 'Сила Ампера тормозит проводник — это проявление правила Ленца', W / 2, H - 22, 12.5);
    }
  });

  // ===== § 11. Самоиндукция =====
  def('selfind', {
    params: [{ k: 'L', l: 'Индуктивность L', min: .1, max: 3, step: .1, v: 1, u: 'Гн' }, { k: 'R', l: 'Сопротивление R', min: 1, max: 10, step: .5, v: 4, u: 'Ом' }],
    formula: v => { const tau = v.L / v.R, I = 6 / v.R; return `τ = L/R = ${n(tau, 3)} с — время нарастания тока в ветви с катушкой\nI = ℰ/R = ${n(I)} А,  энергия поля W = L·I²/2 = ${n(v.L * I * I / 2)} Дж`; },
    draw(c, W, H, p, t, S, st) {
      const v = st.v, tau = v.L / v.R, per = Math.max(3, tau * 8), ph = t % (per * 2), on = ph < per, tl = on ? ph : ph - per;
      const i2 = on ? 1 - Math.exp(-tl / tau) : Math.exp(-tl / (tau * .4)) * (1);
      const sp = split(W, H, .6), a = inner(sp.a, 40); P.panel(c, W, H);
      const xL = a.x + 40, xR = a.x + a.w - 20, y1 = a.y + a.h * .25, y2 = a.y + a.h * .7;
      line(c, xL, y1, xR, y1, LINE, 2.5); line(c, xL, y2, xR, y2, LINE, 2.5); line(c, xL, y1, xL, y2, LINE, 2.5); line(c, xR, y1, xR, y2, LINE, 2.5);
      P.bulb(c, a.x + a.w * .7, y1, 18, on ? 1 : 0); P.box(c, a.x + a.w * .35, y1 - 10, 60, 20, '#e6e1d6', 4); small(c, 'R', a.x + a.w * .35 + 30, y1 - 22);
      P.bulb(c, a.x + a.w * .7, y2, 18, i2); P.coil(c, a.x + a.w * .38, y2, 90, 34, 7); P.coilFront(c, a.x + a.w * .38, y2, 90, 34, 7); small(c, 'L', a.x + a.w * .38, y2 - 30);
      P.box(c, xL - 22, (y1 + y2) / 2 - 28, 44, 56, '#f2d23a'); lab(c, 'ℰ', xL, (y1 + y2) / 2, 18); small(c, on ? 'ключ замкнут' : 'ключ разомкнут', xL + 80, (y1 + y2) / 2, on ? C.green : C.red, 'left', 13);
      const g = inner(sp.b, 34); graph(c, g, [{ f: x => x < .5 ? 1 - Math.exp(-x * per * 2 / tau) : Math.exp(-(x - .5) * per * 2 / (tau * .4)), col: C.red, lab: 'I в ветви с L' }, { f: x => x < .5 ? 1 : 0, col: C.blue, lab: 'с R', dash: [5, 4] }], { y0: 0, y1: 1.15, now: ph / (per * 2), xl: 't' });
    }
  });

  // ===== § 13–14. Пружинный маятник =====
  def('spring', {
    params: [{ k: 'm', l: 'Масса m', min: .1, max: 2, step: .05, v: .5, u: 'кг' }, { k: 'k', l: 'Жёсткость k', min: 5, max: 100, step: 1, v: 20, u: 'Н/м' }, { k: 'A', l: 'Амплитуда A', min: .02, max: .1, step: .005, v: .06, u: 'м' }],
    formula: (v, st) => { const T = TAU * Math.sqrt(v.m / v.k); return `T = 2π√(m/k) = ${n(T, 3)} с,  ν = ${n(1 / T, 3)} Гц\nEₚ = kx²/2, Eₖ = mv²/2; полная E = kA²/2 = ${n(v.k * v.A * v.A / 2, 4)} Дж — сохраняется`; },
    draw(c, W, H, p, t, S, st) {
      const v = st.v, w = Math.sqrt(v.k / v.m), x = v.A * Math.cos(w * t), vel = -v.A * w * Math.sin(w * t), sp = split(W, H, .55), a = sp.a;
      P.panel(c, W, H); const y = a.y + a.h * .45, x0 = a.x + 40, xc = a.x + a.w * .58, k = 1500, bx = xc + x * k, bs = 34 + v.m * 18;
      line(c, a.x + 30, y + bs / 2 + 2, a.x + a.w - 20, y + bs / 2 + 2, LINE, 3); rrect(c, x0 - 10, y - 60, 12, 80, 2); c.fillStyle = '#8d8a84'; c.fill();
      P.spring(c, x0, y, bx - bs / 2, y, 14, 12); rrect(c, bx - bs / 2, y - bs / 2, bs, bs, 5); c.fillStyle = '#c9a97a'; c.fill(); stroke(c, 2.5); lab(c, 'm', bx, y, 16);
      line(c, xc, y - 80, xc, y + 50, C.muted, 1.2, [4, 4]); small(c, 'x = 0', xc, y - 90);
      arrow(c, bx, y - bs / 2 - 14, bx + vel * 400, y - bs / 2 - 14, C.purple, 2.6, Math.abs(vel) > .02 ? 'v' : '');
      // энергия
      const Ep = v.k * x * x / 2, E = v.k * v.A * v.A / 2, bw = 26, by = a.y + a.h * .9, bh = 90;
      [[Ep / E, C.blue, 'Eₚ'], [1 - Ep / E, C.red, 'Eₖ']].forEach(([f, col, l], i) => { const xx = a.x + 50 + i * 50; rrect(c, xx, by - bh, bw, bh, 5); c.fillStyle = 'rgba(0,0,0,.06)'; c.fill(); rrect(c, xx, by - bh * f, bw, bh * f, 5); c.fillStyle = col; c.fill(); small(c, l, xx + bw / 2, by + 12, col); });
      const g = inner(sp.b, 34), T = TAU / w; graph(c, g, [{ f: tt => Math.cos(w * tt), col: C.blue, lab: 'x(t)' }], { t0: t - 2 * T, t1: t, y0: -1.2, y1: 1.2, now: t, xl: 't' });
    }
  });

  // ===== § 13. Математический маятник =====
  def('pendulum', {
    params: [{ k: 'l', l: 'Длина нити l', min: .2, max: 2.5, step: .05, v: 1, u: 'м' }, { k: 'g', l: 'Ускорение g', min: 1.6, max: 25, step: .1, v: 9.8, u: 'м/с²' }, { k: 'A', l: 'Угол отклонения', min: 2, max: 20, step: 1, v: 10, u: '°' }],
    formula: v => { const T = TAU * Math.sqrt(v.l / v.g); return `T = 2π√(l/g) = ${n(T, 3)} с — не зависит от массы и (при малых углах) от амплитуды\n${v.g < 2 ? 'g ≈ 1,6 — как на Луне' : v.g > 20 ? 'g ≈ 24,8 — как на Юпитере' : ''}`; },
    draw(c, W, H, p, t, S, st) {
      const v = st.v, w = Math.sqrt(v.g / v.l), th = v.A * Math.PI / 180 * Math.cos(w * t), sp = split(W, H, .58), a = sp.a;
      P.panel(c, W, H); const px = a.x + a.w / 2, py = a.y + 40, L = Math.min(a.h - 110, 140 + v.l * 120), bx = px + Math.sin(th) * L, by = py + Math.cos(th) * L;
      line(c, px - 70, py, px + 70, py, LINE, 6); line(c, px, py, px, py + L + 20, C.muted, 1.2, [4, 4]);
      c.beginPath(); c.arc(px, py, L, Math.PI / 2 - v.A * Math.PI / 180, Math.PI / 2 + v.A * Math.PI / 180); c.strokeStyle = 'rgba(91,63,208,.35)'; c.lineWidth = 2; c.stroke();
      line(c, px, py, bx, by, LINE, 2); CH.atom(c, bx, by, 18, '#c9a97a', ''); small(c, 'l', (px + bx) / 2 + 12, (py + by) / 2);
      arrow(c, bx, by, bx, by + 50, C.green, 2.6, 'mg');
      const g = inner(sp.b, 34), T = TAU / w; graph(c, g, [{ f: tt => Math.cos(w * tt), col: C.blue, lab: 'угол φ(t)' }], { t0: t - 2 * T, t1: t, y0: -1.2, y1: 1.2, now: t, xl: 't' });
    }
  });

  // ===== § 14. Гармонические колебания: проекция вращения =====
  def('harmonic', {
    params: [{ k: 'A', l: 'Амплитуда A', min: .2, max: 1, step: .05, v: .8 }, { k: 'nu', l: 'Частота ν', min: .1, max: 1, step: .05, v: .3, u: 'Гц' }, { k: 'f0', l: 'Начальная фаза φ₀', min: 0, max: 360, step: 15, v: 0, u: '°' }],
    formula: v => `x = A·cos(ωt + φ₀),  ω = 2πν = ${n(TAU * v.nu, 3)} рад/с,  T = 1/ν = ${n(1 / v.nu, 3)} с\nКолебание — это «тень» точки, равномерно бегущей по окружности.`,
    draw(c, W, H, p, t, S, st) {
      const v = st.v, ph = TAU * v.nu * t + v.f0 * Math.PI / 180, sp = split(W, H, .45), a = sp.a, R = Math.min(a.w, a.h) * .36 * v.A / .8 * .9, cx = a.x + a.w / 2, cy = a.y + a.h / 2;
      P.panel(c, W, H); circle(c, cx, cy, R); c.strokeStyle = 'rgba(31,111,209,.5)'; c.lineWidth = 2; c.stroke(); line(c, cx - R - 20, cy, cx + R + 20, cy, C.muted, 1.2); line(c, cx, cy - R - 20, cx, cy + R + 20, C.muted, 1.2);
      const px = cx + R * Math.cos(ph), py = cy - R * Math.sin(ph); line(c, cx, cy, px, py, C.purple, 3); line(c, px, py, px, cy, C.muted, 1.4, [4, 4]); dot(c, px, py, 7, C.purple); dot(c, px, cy, 7, C.red);
      c.beginPath(); c.arc(cx, cy, 26, 0, -ph % TAU, true); c.strokeStyle = C.purple; c.lineWidth = 1.6; c.stroke(); small(c, 'ωt+φ₀', cx + 40, cy - 16, C.purple);
      const g = inner(sp.b, 34); graph(c, g, [{ f: tt => v.A * Math.cos(TAU * v.nu * tt + v.f0 * Math.PI / 180), col: C.red, lab: 'x(t)' }], { t0: t - 2 / v.nu * 1, t1: t, y0: -1.1, y1: 1.1, now: t, xl: 't' });
    }
  });

  // ===== § 16. Затухающие колебания =====
  def('damped', {
    params: [{ k: 'b', l: 'Трение (затухание β)', min: 0, max: 1, step: .02, v: .2, u: '1/с' }],
    formula: v => `x = A·e^(−βt)·cos ωt\n${v.b < .03 ? 'Без трения колебания не затухают.' : v.b > .7 ? 'Сильное трение: колебания быстро прекращаются.' : 'Амплитуда уменьшается со временем — энергия переходит во внутреннюю.'}`,
    draw(c, W, H, p, t, S, st) {
      const v = st.v, per = 14, tt = t % per, w = TAU * .7, x = Math.exp(-v.b * tt) * Math.cos(w * tt), sp = split(W, H, .5), a = sp.a;
      P.panel(c, W, H); const px = a.x + a.w / 2, py = a.y + 30, L = a.h * .62, th = x * .5; line(c, px - 60, py, px + 60, py, LINE, 6); line(c, px, py, px + Math.sin(th) * L, py + Math.cos(th) * L, LINE, 2); CH.atom(c, px + Math.sin(th) * L, py + Math.cos(th) * L, 18, '#c9a97a', '');
      if (v.b > .3) { for (let i = 0; i < 6; i++) { const yy = py + L * .5 + i * 14; line(c, px - 90 + Math.sin(t * 3 + i) * 6, yy, px - 60 + Math.sin(t * 3 + i) * 6, yy, 'rgba(91,63,208,.35)', 2); } small(c, 'вязкая среда', px - 75, py + L * .5 - 14); }
      const g = inner(sp.b, 34); graph(c, g, [{ f: q => Math.exp(-v.b * q) * Math.cos(w * q), col: C.blue, lab: 'x(t)' }, { f: q => Math.exp(-v.b * q), col: C.red, dash: [5, 4] }, { f: q => -Math.exp(-v.b * q), col: C.red, dash: [5, 4] }], { t0: 0, t1: per, y0: -1.1, y1: 1.1, now: tt, xl: 't' });
    }
  });

  // ===== § 16. Вынужденные колебания и резонанс =====
  def('resonance', {
    params: [{ k: 'nu', l: 'Частота толчков ν', min: .1, max: 2, step: .02, v: .6, u: 'Гц' }, { k: 'b', l: 'Трение β', min: .05, max: 1, step: .05, v: .15 }],
    formula: v => { const n0 = .8; return `Собственная частота ν₀ = ${n(n0)} Гц,  частота силы ν = ${n(v.nu)} Гц\n${Math.abs(v.nu - n0) < .06 ? 'РЕЗОНАНС: частоты совпали — амплитуда максимальна!' : 'Амплитуда растёт при приближении ν к ν₀.'}`; },
    draw(c, W, H, p, t, S, st) {
      const v = st.v, w0 = TAU * .8, w = TAU * v.nu, Amp = nu => { const ww = TAU * nu; return 1 / Math.sqrt((w0 * w0 - ww * ww) ** 2 + 4 * v.b * v.b * ww * ww); }, Am = Amp(v.nu) / Amp(.8) * (1 / (1 + v.b * 2)) * 1.6;
      const sp = split(W, H, .5), a = sp.a; P.panel(c, W, H);
      const px = a.x + a.w / 2 + Math.sin(w * t) * 30, py = a.y + 34, L = a.h * .6, th = Math.min(1.1, Am * .7) * Math.sin(w * t - Math.atan2(2 * v.b * w, w0 * w0 - w * w));
      rrect(c, px - 50, py - 10, 100, 14, 4); c.fillStyle = '#8d8a84'; c.fill(); stroke(c, 2); arrow(c, a.x + a.w / 2 - 70, py - 24, a.x + a.w / 2 + 70, py - 24, C.purple, 2, ''); small(c, 'подвес раскачивают', a.x + a.w / 2, py - 40);
      line(c, px, py, px + Math.sin(th) * L, py + Math.cos(th) * L, LINE, 2); CH.atom(c, px + Math.sin(th) * L, py + Math.cos(th) * L, 18, '#c9a97a', '');
      const g = inner(sp.b, 34), mx = Amp(.8) * 1.05; graph(c, g, [{ f: q => Amp(q) / mx, col: C.red, lab: 'A(ν)' }], { t0: .1, t1: 2, y0: 0, y1: 1.05, now: v.nu, xl: 'ν, Гц' });
    }
  });

  // ===== § 17, 19. Колебательный контур, формула Томсона =====
  def('lc', {
    params: [{ k: 'L', l: 'Индуктивность L', min: 1, max: 100, step: 1, v: 20, u: 'мГн' }, { k: 'C', l: 'Ёмкость C', min: 1, max: 100, step: 1, v: 10, u: 'мкФ' }],
    formula: v => { const T = TAU * Math.sqrt(v.L * 1e-3 * v.C * 1e-6); return `T = 2π√(LC) = ${n(T)} с,  ν = ${n(1 / T)} Гц — формула Томсона\nЭнергия переходит из электрического поля конденсатора в магнитное поле катушки и обратно. (Показано замедленно.)`; },
    draw(c, W, H, p, t, S, st) {
      const v = st.v, Tr = TAU * Math.sqrt(v.L * v.C * 1e-9), Ts = 2 + 2 * Math.sqrt(v.L * v.C) / 45, ph = TAU * t / Ts, q = Math.cos(ph), i = -Math.sin(ph); void Tr;
      const sp = split(W, H, .58), a = inner(sp.a, 46); P.panel(c, W, H);
      const xl = a.x + 20, xr = a.x + a.w - 20, yt = a.y + 20, yb = a.y + a.h - 30, cxp = xl, cyc = (yt + yb) / 2;
      line(c, xl, yt, xr, yt, LINE, 2.5); line(c, xl, yb, xr, yb, LINE, 2.5); line(c, xl, yt, xl, cyc - 14, LINE, 2.5); line(c, xl, cyc + 14, xl, yb, LINE, 2.5); line(c, xr, yt, xr, yb, LINE, 2.5);
      // конденсатор
      line(c, cxp - 40, cyc - 14, cxp + 40, cyc - 14, LINE, 6); line(c, cxp - 40, cyc + 14, cxp + 40, cyc + 14, LINE, 6);
      for (let k = 0; k < 5; k++) { const x = cxp - 32 + k * 16; small(c, q > 0 ? '+' : '−', x, cyc - 26, q > 0 ? C.red : C.blue, 'center', 14 * Math.abs(q) + 4); small(c, q > 0 ? '−' : '+', x, cyc + 26, q > 0 ? C.blue : C.red, 'center', 14 * Math.abs(q) + 4); if (Math.abs(q) > .15) arrow(c, x, cyc - 9 * Math.sign(q), x, cyc + 9 * Math.sign(q), `rgba(224,83,61,${Math.abs(q)})`, 1.6, '', 6); }
      small(c, 'C', cxp - 56, cyc);
      // катушка
      const ly = cyc; P.coil(c, xr, ly, 50, 110, 1); c.save(); c.translate(xr, ly); c.rotate(Math.PI / 2); P.coil(c, 0, 0, 120, 40, 7); P.coilFront(c, 0, 0, 120, 40, 7); c.restore(); small(c, 'L', xr + 36, ly);
      if (Math.abs(i) > .1) for (let k = 0; k < 4; k++) { const yy = ly - 50 + k * 33; line(c, xr - 50, yy, xr + 50, yy, `rgba(31,111,209,${Math.abs(i) * .6})`, 1.5); }
      for (let k = 0; k < 10; k++) { const f = ((ph / TAU * 2 * 0 + k / 10) + Math.sin(ph) * -.08) % 1; const per = 2 * (xr - xl) + 2 * (yb - yt); let d = ((f + 1) % 1) * per, x, y; if (d < xr - xl) { x = xl + d; y = yt; } else if (d < xr - xl + yb - yt) { x = xr; y = yt + d - (xr - xl); } else if (d < 2 * (xr - xl) + yb - yt) { x = xr - (d - (xr - xl) - (yb - yt)); y = yb; } else { x = xl; y = yb - (d - 2 * (xr - xl) - (yb - yt)); } if (Math.abs(i) > .1) dot(c, x, y, 3.2, `rgba(255,211,107,${Math.abs(i)})`); }
      // энергия
      const bx = a.x + a.w * .45, by = yb - 20; [[q * q, C.red, 'Wэл'], [i * i, C.blue, 'Wмаг']].forEach(([f, col, l], k) => { const x = bx + k * 46; rrect(c, x, by - 90, 26, 90, 5); c.fillStyle = 'rgba(0,0,0,.06)'; c.fill(); rrect(c, x, by - 90 * f, 26, 90 * f, 5); c.fillStyle = col; c.fill(); small(c, l, x + 13, by + 12, col); });
      const g = inner(sp.b, 34); graph(c, g, [{ f: x => Math.cos(TAU * x / Ts), col: C.red, lab: 'q' }, { f: x => -Math.sin(TAU * x / Ts), col: C.blue, lab: 'i' }], { t0: t - Ts * 1.5, t1: t, y0: -1.2, y1: 1.2, now: t, xl: 't' });
    }
  });

  // ===== § 18. Аналогия механических и электромагнитных колебаний =====
  def('analogy', {
    formula: () => 'x ↔ q,  v ↔ i,  m ↔ L,  k ↔ 1/C,  Eₚ = kx²/2 ↔ q²/2C,  Eₖ = mv²/2 ↔ Li²/2',
    draw(c, W, H, p, t, S, st) {
      P.panel(c, W, H); const ph = t * 1.6, x = Math.cos(ph), vv = -Math.sin(ph), half = W > H ? { w: W / 2, h: H } : { w: W, h: H / 2 };
      const o1 = { x: 0, y: 0 }, o2 = W > H ? { x: W / 2, y: 0 } : { x: 0, y: H / 2 };
      // пружина
      { const y = o1.y + half.h * .4, x0 = o1.x + 40, xc = o1.x + half.w * .6, bx = xc + x * 60; P.spring(c, x0, y, bx - 22, y, 12, 10); rrect(c, bx - 22, y - 22, 44, 44, 5); c.fillStyle = '#c9a97a'; c.fill(); stroke(c, 2.2); line(c, o1.x + 30, y + 24, o1.x + half.w - 20, y + 24, LINE, 3);
        arrow(c, bx, y - 34, bx + vv * 50, y - 34, C.purple, 2.6, 'v'); small(c, 'пружинный маятник', o1.x + half.w / 2, o1.y + 24); }
      { const cx = o2.x + half.w * .3, cy = o2.y + half.h * .4; line(c, cx - 30, cy - 10, cx + 30, cy - 10, LINE, 5); line(c, cx - 30, cy + 10, cx + 30, cy + 10, LINE, 5); small(c, x > 0 ? '+ + +' : '− − −', cx, cy - 22, x > 0 ? C.red : C.blue, 'center', 12 + 6 * Math.abs(x)); small(c, x > 0 ? '− − −' : '+ + +', cx, cy + 24, x > 0 ? C.blue : C.red, 'center', 12 + 6 * Math.abs(x));
        c.save(); c.translate(o2.x + half.w * .7, cy); c.rotate(Math.PI / 2); P.coil(c, 0, 0, 90, 34, 6); P.coilFront(c, 0, 0, 90, 34, 6); c.restore();
        rrect(c, cx, cy - 60, o2.x + half.w * .7 - cx, 120, 4); c.strokeStyle = LINE; c.lineWidth = 2; c.stroke(); arrow(c, (cx + o2.x + half.w * .7) / 2 - vv * 30, cy - 60, (cx + o2.x + half.w * .7) / 2 + vv * 30, cy - 60, C.purple, 2.6, 'i'); small(c, 'колебательный контур', o2.x + half.w / 2, o2.y + 24); }
      const rows = [['смещение x', 'заряд q'], ['скорость v', 'сила тока i'], ['масса m', 'индуктивность L'], ['жёсткость k', '1 / ёмкость C']];
      const ty = W > H ? H * .72 : H * .82; rows.forEach((r, k) => { const y = ty + k * 24 - (W > H ? 0 : 60); small(c, r[0], W * .3, y, C.ink, 'center', 13); small(c, '↔', W / 2, y, C.purple, 'center', 14); small(c, r[1], W * .7, y, C.ink, 'center', 13); });
    }
  });

  // ===== § 21. Переменный ток, резистор =====
  def('ac_r', {
    params: [{ k: 'U', l: 'Амплитуда Uₘ', min: 50, max: 400, step: 10, v: 311, u: 'В' }, { k: 'R', l: 'Сопротивление R', min: 10, max: 500, step: 10, v: 100, u: 'Ом' }, { k: 'nu', l: 'Частота ν', min: 1, max: 60, step: 1, v: 50, u: 'Гц' }],
    formula: v => { const Im = v.U / v.R; return `Iₘ = Uₘ/R = ${n(Im, 3)} А;  действующие значения: U = Uₘ/√2 = ${n(v.U / Math.SQRT2)} В, I = ${n(Im / Math.SQRT2, 3)} А\nP = I²R = ${n(Im * Im / 2 * v.R)} Вт. На резисторе ток и напряжение совпадают по фазе.`; },
    draw(c, W, H, p, t, S, st) {
      const v = st.v, sp = split(W, H, .42), a = sp.a, sl = v.nu / 50 * .7, ph = TAU * sl * t;
      P.panel(c, W, H); P.bulb(c, a.x + a.w / 2, a.y + a.h * .45, 30, Math.abs(Math.sin(ph)) * Math.min(1, v.U / v.R / 2));
      small(c, `ток меняет направление ${v.nu * 2} раз в секунду (показано замедленно)`, a.x + a.w / 2, a.y + a.h * .85, C.muted, 'center', 12.5);
      const g = inner(sp.b, 30); graph(c, g, [{ f: q => Math.sin(TAU * sl * q), col: C.blue, lab: 'u' }, { f: q => Math.sin(TAU * sl * q) * .7, col: C.red, lab: 'i' }, { f: () => 1 / Math.SQRT2, col: 'rgba(91,63,208,.6)', dash: [4, 4] }], { t0: t - 2 / sl, t1: t, y0: -1.1, y1: 1.1, now: t, xl: 't' });
    }
  });

  // ===== § 22. Конденсатор и катушка в цепи переменного тока =====
  def('ac_xc', {
    params: [{ k: 'nu', l: 'Частота ν', min: 10, max: 1000, step: 10, v: 50, u: 'Гц' }, { k: 'C', l: 'Ёмкость C', min: 1, max: 100, step: 1, v: 20, u: 'мкФ' }, { k: 'L', l: 'Индуктивность L', min: .01, max: 1, step: .01, v: .3, u: 'Гн' }],
    modes: [{ k: 'm', o: [['C', 'Конденсатор'], ['L', 'Катушка'], ['R', 'Резистор']] }],
    formula: v => { const w = TAU * v.nu; return v.m === 'C' ? `X_C = 1/(ωC) = 1/(2π·${n(v.nu)}·${n(v.C * 1e-6, 6)}) = ${n(1 / (w * v.C * 1e-6))} Ом\nТок опережает напряжение на π/2 (четверть периода). Чем выше частота, тем меньше сопротивление.` : v.m === 'L' ? `X_L = ωL = 2π·${n(v.nu)}·${n(v.L)} = ${n(w * v.L)} Ом\nТок отстаёт от напряжения на π/2. Чем выше частота, тем больше сопротивление.` : 'На резисторе колебания тока и напряжения совпадают по фазе.'; },
    draw(c, W, H, p, t, S, st) {
      const v = st.v, sh = v.m === 'C' ? Math.PI / 2 : v.m === 'L' ? -Math.PI / 2 : 0, sp = split(W, H, .35), a = sp.a; P.panel(c, W, H);
      const cx = a.x + a.w / 2, cy = a.y + a.h * .5;
      if (v.m === 'C') { line(c, cx - 50, cy - 12, cx + 50, cy - 12, LINE, 6); line(c, cx - 50, cy + 12, cx + 50, cy + 12, LINE, 6); line(c, cx, cy - 12, cx, cy - 60, LINE, 2.5); line(c, cx, cy + 12, cx, cy + 60, LINE, 2.5); }
      else if (v.m === 'L') { c.save(); c.translate(cx, cy); c.rotate(Math.PI / 2); P.coil(c, 0, 0, 110, 40, 7); P.coilFront(c, 0, 0, 110, 40, 7); c.restore(); }
      else { P.box(c, cx - 20, cy - 45, 40, 90, '#e6e1d6', 4); }
      const g = inner(sp.b, 30); graph(c, g, [{ f: q => Math.sin(q * 2.2), col: C.blue, lab: 'u' }, { f: q => .7 * Math.sin(q * 2.2 + sh), col: C.red, lab: 'i' }], { t0: t - 6, t1: t, y0: -1.1, y1: 1.1, now: t, xl: 't' });
    }
  });

  // ===== § 23. Резонанс в электрической цепи =====
  def('rlc_res', {
    params: [{ k: 'nu', l: 'Частота генератора ν', min: 20, max: 200, step: 1, v: 80, u: 'Гц' }, { k: 'R', l: 'Сопротивление R', min: 2, max: 50, step: 1, v: 10, u: 'Ом' }],
    formula: v => { const L = .2, Cc = 20e-6, n0 = 1 / (TAU * Math.sqrt(L * Cc)), w = TAU * v.nu, Z = Math.sqrt(v.R ** 2 + (w * L - 1 / (w * Cc)) ** 2); return `ν₀ = 1/(2π√(LC)) = ${n(n0, 1)} Гц (L = 0,2 Гн, C = 20 мкФ)\nZ = √(R² + (X_L − X_C)²) = ${n(Z)} Ом,  Iₘ = Uₘ/Z = ${n(10 / Z, 3)} А при Uₘ = 10 В`; },
    draw(c, W, H, p, t, S, st) {
      const v = st.v, L = .2, Cc = 20e-6, I = nu => { const w = TAU * nu; return 10 / Math.sqrt(v.R ** 2 + (w * L - 1 / (w * Cc)) ** 2); }, n0 = 1 / (TAU * Math.sqrt(L * Cc));
      const sp = split(W, H, .4), a = sp.a; P.panel(c, W, H); const br = I(v.nu) / (10 / 2); P.bulb(c, a.x + a.w / 2, a.y + a.h * .45, 30, br * .9 * Math.abs(Math.sin(t * 6)) * .3 + br * .7);
      small(c, Math.abs(v.nu - n0) < 3 ? 'резонанс: лампа горит ярче всего' : 'подстройте частоту к ν₀', a.x + a.w / 2, a.y + a.h * .85, C.purple, 'center', 13);
      const g = inner(sp.b, 30); graph(c, g, [{ f: nu => I(nu) / (10 / 2), col: C.red, lab: 'Iₘ(ν)' }], { t0: 20, t1: 200, y0: 0, y1: 1.1, now: v.nu, xl: 'ν, Гц' });
    }
  });

  // ===== § 25. Автоколебания =====
  def('autoosc', {
    modes: [{ k: 'm', o: [['on', 'С подкачкой энергии'], ['off', 'Без подкачки']] }],
    formula: v => v.m === 'on' ? 'Источник энергии в нужный момент подталкивает маятник (как анкерный механизм часов) — колебания незатухающие.' : 'Без источника колебания затухают.',
    draw(c, W, H, p, t, S, st, dt) {
      const v = st.v; st.A = st.A == null ? .5 : st.A; st.ph = (st.ph || 0) + dt * 3; st.A += (v.m === 'on' ? (.5 - st.A) * .9 : -st.A * .25) * dt;
      const th = st.A * Math.sin(st.ph), px = W / 2, py = H * .12, L = H * .55; P.panel(c, W, H); line(c, px - 70, py, px + 70, py, LINE, 6);
      line(c, px, py, px + Math.sin(th) * L, py + Math.cos(th) * L, LINE, 3); CH.atom(c, px + Math.sin(th) * L, py + Math.cos(th) * L, 22, '#e0b83a', '');
      if (v.m === 'on') { const push = Math.cos(st.ph) > .95; P.box(c, px - 40, py + 26, 80, 30, push ? '#ffd36b' : '#e6e1d6'); small(c, 'анкер', px, py + 41); if (push) CH.glow(c, px, py + 40, 50, '#ffd36b', .5); }
      st.hist = st.hist || []; st.hist.push(th); if (st.hist.length > 300) st.hist.shift(); const g = { x: 40, y: H * .78, w: W - 80, h: H * .14 }, hs = st.hist; graph(c, g, [{ f: q => hs[Math.round(q * (hs.length - 1))], col: C.blue }], { y0: -.6, y1: .6, xl: 't' });
    }
  });

  // ===== § 26. Генератор переменного тока =====
  def('generator', {
    params: [{ k: 'B', l: 'Индукция B', min: .1, max: 1, step: .05, v: .5, u: 'Тл' }, { k: 'n', l: 'Частота вращения', min: .2, max: 2, step: .1, v: .6, u: 'об/с (в модели)' }, { k: 'N', l: 'Число витков N', min: 10, max: 200, step: 10, v: 100 }],
    formula: v => { const S = .01, w = TAU * v.n; return `e = εₘ·sin ωt,  εₘ = N·B·S·ω = ${n(v.N)}·${n(v.B)}·0,01·${n(w, 3)} = ${n(v.N * v.B * S * w)} В\nПри вращении рамки магнитный поток через неё всё время меняется — возникает переменная ЭДС.`; },
    draw(c, W, H, p, t, S, st) {
      const v = st.v, sp = split(W, H, .55), a = sp.a, ang = TAU * v.n * t, cx = a.x + a.w / 2, cy = a.y + a.h * .48, R = Math.min(a.w, a.h) * .28;
      P.panel(c, W, H); rrect(c, cx - R - 70, cy - R, 44, R * 2, 6); c.fillStyle = C.red; c.fill(); stroke(c, 2); lab(c, 'N', cx - R - 48, cy, 18, '#fff'); rrect(c, cx + R + 26, cy - R, 44, R * 2, 6); c.fillStyle = C.blue; c.fill(); stroke(c, 2); lab(c, 'S', cx + R + 48, cy, 18, '#fff');
      for (let i = 0; i < 5; i++) line(c, cx - R - 22, cy - R + R * 2 * (i + .5) / 5, cx + R + 22, cy - R + R * 2 * (i + .5) / 5, 'rgba(31,111,209,.35)', 1.5);
      const w = R * Math.cos(ang); c.lineWidth = 8; c.strokeStyle = LINE; rrect(c, cx - Math.abs(w), cy - R * .8, Math.abs(w) * 2 + .01, R * 1.6, 4); c.stroke(); c.lineWidth = 5; c.strokeStyle = '#c8703a'; c.stroke();
      line(c, cx, cy + R * .8, cx, cy + R * 1.2, LINE, 4); [-1, 1].forEach(s => { c.beginPath(); c.ellipse(cx + s * 10, cy + R * 1.25, 8, 4, 0, 0, TAU); c.fillStyle = '#c8703a'; c.fill(); stroke(c, 1.6); });
      P.bulb(c, cx, cy + R * 1.25 + 46, 16, Math.abs(Math.sin(ang)) * Math.min(1, v.B * v.N / 60));
      const g = inner(sp.b, 30); graph(c, g, [{ f: q => Math.sin(TAU * v.n * q), col: C.red, lab: 'e(t)' }, { f: q => Math.cos(TAU * v.n * q) * .6, col: C.blue, lab: 'Φ', dash: [5, 4] }], { t0: t - 2 / v.n, t1: t, y0: -1.1, y1: 1.1, now: t, xl: 't' });
    }
  });

  // ===== § 26. Трансформатор =====
  def('transformer', {
    params: [{ k: 'U1', l: 'Напряжение U₁', min: 10, max: 380, step: 10, v: 220, u: 'В' }, { k: 'N1', l: 'Витков N₁', min: 10, max: 200, step: 10, v: 100 }, { k: 'N2', l: 'Витков N₂', min: 10, max: 200, step: 10, v: 50 }],
    formula: v => { const k = v.N1 / v.N2; return `U₁/U₂ = N₁/N₂ = k = ${n(k, 2)}  →  U₂ = ${n(v.U1 / k)} В\n${k > 1 ? 'k > 1 — понижающий трансформатор' : k < 1 ? 'k < 1 — повышающий трансформатор' : 'k = 1 — напряжение не меняется'}`; },
    draw(c, W, H, p, t, S, st) {
      const v = st.v, cx = W / 2, cy = H * .45, cw = Math.min(W * .62, 380), ch = Math.min(H * .5, 280), th = 38, U2 = v.U1 * v.N2 / v.N1;
      P.panel(c, W, H); c.lineWidth = th; c.strokeStyle = '#7d8590'; rrect(c, cx - cw / 2, cy - ch / 2, cw, ch, 6); c.stroke(); c.lineWidth = 2; c.strokeStyle = LINE; rrect(c, cx - cw / 2 - th / 2, cy - ch / 2 - th / 2, cw + th, ch + th, 8); c.stroke(); rrect(c, cx - cw / 2 + th / 2, cy - ch / 2 + th / 2, cw - th, ch - th, 4); c.stroke();
      for (let i = 0; i < 10; i++) { const f = (t * .35 + i / 10) % 1, per = 2 * (cw + ch); let d = f * per, x, y; if (d < cw) { x = cx - cw / 2 + d; y = cy - ch / 2; } else if (d < cw + ch) { x = cx + cw / 2; y = cy - ch / 2 + d - cw; } else if (d < 2 * cw + ch) { x = cx + cw / 2 - (d - cw - ch); y = cy + ch / 2; } else { x = cx - cw / 2; y = cy + ch / 2 - (d - 2 * cw - ch); } dot(c, x, y, 3, `rgba(31,111,209,${.5 + .5 * Math.abs(Math.sin(t * 3))})`); }
      const coil = (x, N, col) => { const tn = Math.round(3 + N / 20); c.save(); c.translate(x, cy); c.rotate(Math.PI / 2); P.coil(c, 0, 0, ch * .8, th + 26, tn, col); P.coilFront(c, 0, 0, ch * .8, th + 26, tn, col); c.restore(); };
      coil(cx - cw / 2, v.N1, '#c8703a'); coil(cx + cw / 2, v.N2, '#2fa36b');
      small(c, `N₁ = ${v.N1}`, cx - cw / 2, cy + ch / 2 + 40, C.ink, 'center', 14); small(c, `N₂ = ${v.N2}`, cx + cw / 2, cy + ch / 2 + 40, C.ink, 'center', 14);
      small(c, `U₁ = ${n(v.U1)} В`, cx - cw / 2 - 70, cy, C.red, 'center', 14); P.bulb(c, cx + cw / 2 + 80, cy, 20, Math.min(1, U2 / 220)); small(c, `U₂ = ${n(U2)} В`, cx + cw / 2 + 80, cy + 44, C.green, 'center', 14);
      CH.pill(c, 'Переменный магнитный поток в сердечнике пронизывает обе обмотки', W / 2, H - 22, 12.5);
    }
  });

  // ===== § 27. Передача электроэнергии =====
  def('transmission', {
    params: [{ k: 'U', l: 'Напряжение в ЛЭП', min: 1, max: 500, step: 1, v: 10, u: 'кВ' }, { k: 'P', l: 'Передаваемая мощность', min: 1, max: 100, step: 1, v: 20, u: 'МВт' }, { k: 'R', l: 'Сопротивление линии', min: 1, max: 20, step: 1, v: 5, u: 'Ом' }],
    formula: v => { const I = v.P * 1e6 / (v.U * 1e3), dP = I * I * v.R, pc = Math.min(100, dP / (v.P * 1e6) * 100); return `I = P/U = ${n(I)} А;  потери ΔP = I²R = ${n(dP)} Вт (${n(pc, 1)} % мощности)\nПовышаем напряжение в 10 раз → ток в 10 раз меньше → потери в 100 раз меньше.`; },
    draw(c, W, H, p, t, S, st) {
      const v = st.v, I = v.P * 1e6 / (v.U * 1e3), pc = Math.min(1, I * I * v.R / (v.P * 1e6)), y = H * .42; P.panel(c, W, H);
      const xs = [W * .08, W * .26, W * .74, W * .92];
      P.box(c, xs[0] - 34, y - 40, 68, 80, '#e6e1d6'); small(c, 'ГЭС', xs[0], y, C.ink, 'center', 13);
      [xs[1], xs[2]].forEach((x, i) => { P.box(c, x - 26, y - 34, 52, 68, '#cfd5db'); small(c, i ? '↓ U' : '↑ U', x, y, C.ink, 'center', 13); });
      for (let k = 0; k < 3; k++) { const tx = lerp(xs[1] + 60, xs[2] - 60, k / 2); line(c, tx, y + 80, tx, y - 60, LINE, 4); line(c, tx - 26, y - 46, tx + 26, y - 46, LINE, 4); }
      const glow = Math.min(1, pc * 4); c.beginPath(); c.moveTo(xs[1] + 26, y - 46); for (let k = 0; k <= 20; k++) { const x = lerp(xs[1] + 26, xs[2] - 26, k / 20); c.lineTo(x, y - 46 + Math.sin(k / 20 * Math.PI) * 20); } c.lineWidth = 4; c.strokeStyle = CH.mix('#2b2823', '#ff5a2a', glow); c.stroke();
      if (glow > .05) for (let k = 0; k < 6; k++) { const x = lerp(xs[1] + 40, xs[2] - 40, (k + .5) / 6); const ph = (t * .6 + k / 6) % 1; c.strokeStyle = `rgba(255,90,42,${glow * (1 - ph)})`; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y - 40 - ph * 30); c.quadraticCurveTo(x + 6, y - 50 - ph * 30, x, y - 60 - ph * 30); c.stroke(); }
      line(c, xs[0] + 34, y, xs[1] - 26, y, LINE, 3); line(c, xs[2] + 26, y, xs[3] - 26, y, LINE, 3);
      for (let k = 0; k < 4; k++) { const x = xs[3] - 20 + (k % 2) * 30, yy = y - 30 + Math.floor(k / 2) * 34; rrect(c, x - 10, yy - 12, 20, 24, 3); c.fillStyle = `rgba(255,211,107,${1 - pc})`; c.fill(); stroke(c, 1.5); }
      small(c, 'город', xs[3] + 5, y + 50, C.ink, 'center', 13);
      rrect(c, 40, H * .78, W - 80, 18, 9); c.fillStyle = 'rgba(0,0,0,.08)'; c.fill(); rrect(c, 40, H * .78, (W - 80) * (1 - pc), 18, 9); c.fillStyle = C.green; c.fill(); rrect(c, 40 + (W - 80) * (1 - pc), H * .78, (W - 80) * pc, 18, 0); c.fillStyle = C.red; c.fill();
      small(c, `доходит до потребителя ${n((1 - pc) * 100, 1)} %   ·   теряется на нагрев проводов ${n(pc * 100, 1)} %`, W / 2, H * .78 + 34, C.ink, 'center', 13);
    }
  });
})();
