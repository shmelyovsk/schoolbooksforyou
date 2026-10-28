'use strict';
// Общие «приборы» для физических сцен: стрелки, графики, пружины, катушки, магниты, лампочки, цвет по длине волны.
(() => {
  const P = CH.P = {};
  const { circle, rrect, stroke, LINE } = CH;
  P.C = { blue: '#1f6fd1', red: '#e0533d', green: '#2fa36b', orange: '#f2a23a', purple: '#7a57ff', ink: '#2b2823', muted: '#6b655b', field: '#1f6fd1', cur: '#e0533d', cu: '#c8703a', steel: '#9aa6b2' };
  P.mu0 = 4e-7 * Math.PI; P.c = 3e8; P.h = 6.63e-34; P.e = 1.6e-19; P.me = 9.11e-31; P.mp = 1.67e-27;
  P.n = (x, d) => CH.num(x, d);

  P.line = (c, x1, y1, x2, y2, col = LINE, w = 2, dash) => { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.lineWidth = w; c.strokeStyle = col; c.setLineDash(dash || []); c.stroke(); c.setLineDash([]); };
  P.arrow = (c, x1, y1, x2, y2, col = LINE, w = 3, label, head) => {
    const L = Math.hypot(x2 - x1, y2 - y1); if (L < 2) return; const a = Math.atan2(y2 - y1, x2 - x1), hd = head || Math.min(14, 6 + w * 2, L * .5);
    c.lineCap = 'round'; P.line(c, x1, y1, x2 - Math.cos(a) * hd * .6, y2 - Math.sin(a) * hd * .6, col, w);
    c.beginPath(); c.moveTo(x2, y2); c.lineTo(x2 - Math.cos(a - .42) * hd, y2 - Math.sin(a - .42) * hd); c.lineTo(x2 - Math.cos(a + .42) * hd, y2 - Math.sin(a + .42) * hd); c.closePath(); c.fillStyle = col; c.fill();
    if (label) P.lab(c, label, x2 + Math.cos(a) * 14 + (Math.abs(Math.cos(a)) < .3 ? 14 : 0), y2 + Math.sin(a) * 14 - 2, 15, col);
  };
  P.lab = (c, s, x, y, size = 14, col = LINE, align = 'center', font = 'Georgia,"Times New Roman",serif', weight = 600) => {
    c.font = `${weight} italic ${size}px ${font}`; if (/^[А-Яа-яЁё]/.test(s)) c.font = `${weight} ${size}px system-ui,sans-serif`;
    c.fillStyle = col; c.textAlign = align; c.textBaseline = 'middle'; c.fillText(s, x, y);
  };
  P.small = (c, s, x, y, col = P.C.muted, align = 'center', size = 12) => { c.font = `500 ${size}px system-ui,sans-serif`; c.fillStyle = col; c.textAlign = align; c.textBaseline = 'middle'; c.fillText(s, x, y); };
  P.dot = (c, x, y, r, col) => { circle(c, x, y, r); c.fillStyle = col; c.fill(); c.lineWidth = 1.5; c.strokeStyle = LINE; c.stroke(); };
  // ток/поле перпендикулярно плоскости: точка — «к нам», крест — «от нас»
  P.perp = (c, x, y, r, out, col = LINE) => {
    circle(c, x, y, r); c.fillStyle = 'rgba(255,255,255,.85)'; c.fill(); c.lineWidth = 2; c.strokeStyle = col; c.stroke();
    if (out) { circle(c, x, y, r * .28); c.fillStyle = col; c.fill(); }
    else { const k = r * .55; P.line(c, x - k, y - k, x + k, y + k, col, 2); P.line(c, x - k, y + k, x + k, y - k, col, 2); }
  };
  P.fieldMarks = (c, r, out, step = 46, col = 'rgba(31,111,209,.5)') => {
    for (let x = r.x + step / 2; x < r.x + r.w; x += step) for (let y = r.y + step / 2; y < r.y + r.h; y += step) {
      if (out) { circle(c, x, y, 2.5); c.fillStyle = col; c.fill(); } else { P.line(c, x - 4, y - 4, x + 4, y + 4, col, 1.6); P.line(c, x - 4, y + 4, x + 4, y - 4, col, 1.6); }
    }
  };
  P.panel = (c, W, H) => CH.panel(c, { x: 0, y: 0, w: W, h: H }, '');
  P.box = (c, x, y, w, h, fill = 'rgba(255,255,255,.85)', r = 8) => { rrect(c, x, y, w, h, r); c.fillStyle = fill; c.fill(); stroke(c, 2.2); };

  // график: fns = [{f, col, lab}], r — прямоугольник
  P.graph = (c, r, fns, o = {}) => {
    const t0 = o.t0 ?? 0, t1 = o.t1 ?? 1, y0 = o.y0 ?? -1, y1 = o.y1 ?? 1, X = t => r.x + (t - t0) / (t1 - t0) * r.w, Y = v => r.y + r.h - (v - y0) / (y1 - y0) * r.h;
    rrect(c, r.x - 8, r.y - 8, r.w + 16, r.h + 16, 10); c.fillStyle = 'rgba(255,255,255,.55)'; c.fill();
    const zy = Y(Math.max(y0, Math.min(y1, 0)));
    P.line(c, r.x, zy, r.x + r.w, zy, 'rgba(43,40,35,.55)', 1.4); P.line(c, r.x, r.y, r.x, r.y + r.h, 'rgba(43,40,35,.55)', 1.4);
    if (o.xl) P.small(c, o.xl, r.x + r.w, zy + 12, P.C.muted, 'right'); if (o.yl) P.small(c, o.yl, r.x + 4, r.y + 2, P.C.muted, 'left');
    fns.forEach(({ f, col, lab, w, dash }) => { c.beginPath(); let started = false; const N = Math.max(60, r.w / 2);
      for (let i = 0; i <= N; i++) { const t = t0 + (t1 - t0) * i / N, v = f(t); if (v == null || !isFinite(v)) { started = false; continue; } const yy = Math.max(r.y - 4, Math.min(r.y + r.h + 4, Y(v))); started ? c.lineTo(X(t), yy) : c.moveTo(X(t), yy); started = true; }
      c.lineWidth = w || 2.6; c.strokeStyle = col; c.setLineDash(dash || []); c.stroke(); c.setLineDash([]); if (lab) P.small(c, lab, r.x + r.w - 2, Y(f(t1)) - 10, col, 'right'); });
    if (o.now != null) { P.line(c, X(o.now), r.y, X(o.now), r.y + r.h, 'rgba(91,63,208,.6)', 1.5, [4, 4]); fns.forEach(({ f, col }) => { const v = f(o.now); if (isFinite(v)) P.dot(c, X(o.now), Math.max(r.y, Math.min(r.y + r.h, Y(v))), 4.5, col); }); }
    return { X, Y };
  };
  // пружина между двумя точками
  P.spring = (c, x1, y1, x2, y2, n = 12, amp = 10, col = '#6b7480') => {
    const L = Math.hypot(x2 - x1, y2 - y1), a = Math.atan2(y2 - y1, x2 - x1); c.save(); c.translate(x1, y1); c.rotate(a); c.beginPath(); c.moveTo(0, 0); c.lineTo(L * .08, 0);
    for (let i = 0; i <= n; i++) c.lineTo(L * .08 + (L * .84) * i / n, i === 0 || i === n ? 0 : (i % 2 ? -amp : amp)); c.lineTo(L, 0); c.lineWidth = 3; c.strokeStyle = col; c.lineJoin = 'round'; c.stroke(); c.restore();
  };
  // постоянный магнит: N — красный, S — синий
  P.magnet = (c, x, y, w, h, vertical, nFirst = true) => {
    const a = nFirst ? ['#e0533d', 'N'] : ['#1f6fd1', 'S'], b = nFirst ? ['#1f6fd1', 'S'] : ['#e0533d', 'N'];
    if (vertical) { rrect(c, x - w / 2, y - h / 2, w, h / 2, 4); c.fillStyle = a[0]; c.fill(); stroke(c, 2.2); rrect(c, x - w / 2, y, w, h / 2, 4); c.fillStyle = b[0]; c.fill(); stroke(c, 2.2); P.lab(c, a[1], x, y - h / 4, 16, '#fff', 'center', 'system-ui', 800); P.lab(c, b[1], x, y + h / 4, 16, '#fff', 'center', 'system-ui', 800); }
    else { rrect(c, x - w / 2, y - h / 2, w / 2, h, 4); c.fillStyle = a[0]; c.fill(); stroke(c, 2.2); rrect(c, x, y - h / 2, w / 2, h, 4); c.fillStyle = b[0]; c.fill(); stroke(c, 2.2); P.lab(c, a[1], x - w / 4, y, 16, '#fff', 'center', 'system-ui', 800); P.lab(c, b[1], x + w / 4, y, 16, '#fff', 'center', 'system-ui', 800); }
  };
  // катушка (вид сбоку): витки — эллипсы
  P.coil = (c, x, y, w, h, turns = 8, col = '#c8703a', back = true) => {
    for (let i = 0; i < turns; i++) { const xx = x - w / 2 + w * (i + .5) / turns; c.beginPath(); c.ellipse(xx, y, w / turns * .45, h / 2, 0, back ? Math.PI / 2 : -Math.PI / 2, back ? Math.PI * 1.5 : Math.PI / 2); c.lineWidth = 4; c.strokeStyle = col; c.stroke(); }
  };
  P.coilFront = (c, x, y, w, h, turns = 8, col = '#c8703a') => {
    for (let i = 0; i < turns; i++) { const xx = x - w / 2 + w * (i + .5) / turns; c.beginPath(); c.ellipse(xx, y, w / turns * .45, h / 2, 0, -Math.PI / 2, Math.PI / 2); c.lineWidth = 4.5; c.strokeStyle = LINE; c.stroke(); c.lineWidth = 3; c.strokeStyle = col; c.stroke(); }
  };
  P.bulb = (c, x, y, r, b) => {
    b = Math.max(0, Math.min(1, b)); if (b > .02) CH.glow(c, x, y, r * (2 + 3 * b), '#ffd36b', .7 * b);
    circle(c, x, y, r); c.fillStyle = CH.mix('#eeeeea', '#fff3b0', b); c.fill(); stroke(c, 2.2);
    c.beginPath(); c.moveTo(x - r * .35, y + r * .2); c.lineTo(x - r * .15, y - r * .25); c.lineTo(x + r * .15, y + r * .2); c.lineTo(x + r * .35, y - r * .25); c.lineWidth = 1.6; c.strokeStyle = b > .1 ? '#e08a1c' : '#8d8a84'; c.stroke();
    rrect(c, x - r * .5, y + r * .85, r, r * .6, 3); c.fillStyle = '#9aa6b2'; c.fill(); stroke(c, 2);
  };
  // стрелочный прибор: v ∈ [-1,1]
  P.meter = (c, x, y, r, v, lab = 'G') => {
    circle(c, x, y, r); c.fillStyle = '#fbfaf6'; c.fill(); stroke(c, 2.5);
    for (let i = -4; i <= 4; i++) { const a = -Math.PI / 2 + i * .17; P.line(c, x + Math.cos(a) * r * .72, y + Math.sin(a) * r * .72, x + Math.cos(a) * r * .86, y + Math.sin(a) * r * .86, '#8d8a84', i ? 1.2 : 2); }
    const a = -Math.PI / 2 + Math.max(-1, Math.min(1, v)) * .7; P.line(c, x, y + r * .25, x + Math.cos(a) * r * .8, y + Math.sin(a) * r * .8, P.C.red, 2.6); P.dot(c, x, y + r * .25, 3.5, LINE); P.lab(c, lab, x, y + r * .55, 13, P.C.muted);
  };
  // цвет по длине волны (нм)
  P.wl = (nm, a = 1) => {
    let r = 0, g = 0, b = 0;
    if (nm < 440) { r = -(nm - 440) / 60; b = 1; } else if (nm < 490) { g = (nm - 440) / 50; b = 1; } else if (nm < 510) { g = 1; b = -(nm - 510) / 20; } else if (nm < 580) { r = (nm - 510) / 70; g = 1; } else if (nm < 645) { r = 1; g = -(nm - 645) / 65; } else r = 1;
    let f = nm < 420 ? .3 + .7 * (nm - 380) / 40 : nm > 700 ? .3 + .7 * (780 - nm) / 80 : 1; f = Math.max(.15, f);
    return `rgba(${Math.round(255 * r * f)},${Math.round(255 * g * f)},${Math.round(255 * b * f)},${a})`;
  };
  // цвет нагретого тела по температуре (К), приближённо
  P.tcolor = T => { const t = T / 100; let r, g, b; if (t <= 66) { r = 255; g = 99.47 * Math.log(t) - 161.1; b = t <= 19 ? 0 : 138.5 * Math.log(t - 10) - 305; } else { r = 329.7 * Math.pow(t - 60, -.133); g = 288.1 * Math.pow(t - 60, -.0755); b = 255; } const k = v => Math.round(Math.max(0, Math.min(255, v))); return `rgb(${k(r)},${k(g)},${k(b)})`; };
  P.slow = (real, shown) => real / shown;  // во сколько раз замедлено/ускорено
  P.def = (id, R) => { R.phys = true; CH.R[id] = R; };
})();
