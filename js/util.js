'use strict';
// Общие помощники: математика, цвета, форматирование формул, рисование атомов.
const CH = window.CH = {};
const TAU = Math.PI * 2;
CH.LINE = '#2b2823';
CH.R = {};
// число по-русски: запятая, разумное число знаков, большие/малые — в виде a·10ⁿ
CH.num = (x, d) => {
  if (!isFinite(x)) return '∞'; const a = Math.abs(x);
  if (a !== 0 && (a >= 1e5 || a < 1e-3)) { const e = Math.floor(Math.log10(a)), m = x / 10 ** e; const sup = String(e).replace('-', '⁻').replace(/\d/g, k => '⁰¹²³⁴⁵⁶⁷⁸⁹'[k]); return m.toFixed(2).replace('.', ',') + '·10' + sup; }
  const k = d != null ? d : a >= 100 ? 0 : a >= 10 ? 1 : 2; return x.toFixed(k).replace('.', ',');
};
CH.clamp = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x;
CH.lerp = (a, b, t) => a + (b - a) * t;
CH.sm = (a, b, x) => { const t = CH.clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
CH.ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
CH.H = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
CH.rgb = h => {
  h = h.replace('#', ''); if (h.length === 3) h = [...h].map(c => c + c).join('');
  const n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255];
};
CH.mixA = (a, b, t) => { const A = CH.rgb(a), B = CH.rgb(b); return A.map((v, i) => v + (B[i] - v) * t); };
CH.col = (arr, a = 1) => `rgba(${arr.map(Math.round).join(',')},${a})`;
CH.mix = (a, b, t, al = 1) => CH.col(CH.mixA(a, b, t), al);
CH.rgba = (h, a) => CH.col(CH.rgb(h), a);
CH.shade = (h, k) => CH.col(CH.rgb(h).map(v => k >= 0 ? v + (255 - v) * k : v * (1 + k)));

const SUB = '₀₁₂₃₄₅₆₇₈₉', SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', '+': '⁺', '-': '⁻' };
// "Cu^2+ + 2H2O -> ..." → "Cu²⁺ + 2H₂O → ..."
CH.uni = s => String(s)
  .replace(/\^([0-9]*[+-])/g, (m, q) => [...q].map(c => SUP[c]).join(''))
  .replace(/([A-Za-z)\]])(\d+)/g, (m, a, d) => a + [...d].map(c => SUB[c]).join(''))
  .replace(/<=>/g, '⇌').replace(/->/g, '→');

// Простейшие фигуры
CH.circle = (c, x, y, r) => { c.beginPath(); c.arc(x, y, r, 0, TAU); };
CH.rrect = (c, x, y, w, h, r) => {
  r = Math.min(r, w / 2, h / 2); c.beginPath(); c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
};
CH.stroke = (c, w = 2.5) => { c.lineWidth = w; c.strokeStyle = CH.LINE; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); };

// Данные элементов: цвет (CPK), радиус для рисования, ковалентный радиус (Å)
CH.EL = {
  H: ['#ffffff', 10, .31], C: ['#5c5c60', 15, .76], N: ['#4a6fe3', 15, .71], O: ['#e8665b', 15, .66],
  F: ['#8ee06a', 13, .57], Cl: ['#4fcf6a', 18, 1.02], Br: ['#b5502d', 20, 1.2], I: ['#8a3fc4', 22, 1.39],
  S: ['#f2d23a', 18, 1.05], P: ['#ff9a3d', 17, 1.07], Si: ['#c9a97a', 18, 1.11], B: ['#f0b9a0', 14, .84],
  Na: ['#9a6be8', 20, 1.7], K: ['#8f4bd0', 24, 2.0], Li: ['#cc80ff', 17, 1.34], Mg: ['#4ec06a', 19, 1.4], Ca: ['#3dbf9a', 21, 1.7],
  Al: ['#bfa6a6', 19, 1.2], Zn: ['#7d86b8', 18, 1.2], Fe: ['#d9822b', 18, 1.25], Cu: ['#c8703a', 18, 1.32], Ag: ['#c4c9ce', 19, 1.45],
  Ba: ['#2fa05e', 23, 2.0], Pb: ['#575961', 21, 1.46], Hg: ['#b5b8d0', 20, 1.5], Mn: ['#9c7ac7', 18, 1.39], Cr: ['#8a99c7', 18, 1.39],
  Au: ['#e0b83a', 20, 1.36], Sn: ['#668080', 20, 1.4], Ni: ['#50d050', 18, 1.24], Co: ['#f090a0', 18, 1.26], Sr: ['#00ff90', 22, 1.9], Cs: ['#57178f', 26, 2.6],
  Ne: ['#b3e3f5', 14, .7], He: ['#d9ffff', 12, .3], Ar: ['#80d1e3', 17, 1.0]
};
CH.elc = s => (CH.EL[s] || ['#bbbbbb', 16, 1])[0];

// Шаровидный атом с контуром (стиль «мультяшный»)
CH.atom = (c, x, y, r, color, label, alpha = 1) => {
  if (r < .5) return;
  c.save(); c.globalAlpha *= alpha;
  const g = c.createRadialGradient(x - r * .35, y - r * .4, r * .1, x, y, r);
  g.addColorStop(0, CH.shade(color, .55)); g.addColorStop(.6, color); g.addColorStop(1, CH.shade(color, -.18));
  CH.circle(c, x, y, r); c.fillStyle = g; c.fill(); CH.stroke(c, 2);
  if (label && r > 9) {
    c.fillStyle = /^#?(fff|ffffff)$/i.test(color) || CH.rgb(color).reduce((a, b) => a + b) > 560 ? '#2b2823' : '#fff';
    c.font = `700 ${Math.round(r * .9)}px system-ui,sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(label, x, y + 1);
  }
  c.restore();
};

CH.text = (c, s, x, y, size = 14, color = '#2b2823', align = 'center', weight = 600) => {
  c.font = `${weight} ${size}px Georgia,"Times New Roman",serif`; c.fillStyle = color; c.textAlign = align; c.textBaseline = 'middle';
  c.fillText(CH.uni(s), x, y);
};
CH.pill = (c, s, x, y, size = 13, dark = false) => {
  c.font = `600 ${size}px system-ui,sans-serif`; const w = c.measureText(CH.uni(s)).width + 16;
  CH.rrect(c, x - w / 2, y - size * .85, w, size * 1.7, size * .85); c.fillStyle = dark ? 'rgba(35,32,28,.85)' : 'rgba(255,255,255,.78)'; c.fill();
  c.fillStyle = dark ? '#fff' : '#2b2823'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(CH.uni(s), x, y + 1);
};
// Стеклянная панель
CH.panel = (c, r, label) => {
  CH.rrect(c, r.x + 4, r.y + 4, r.w - 8, r.h - 8, 18);
  c.fillStyle = document.documentElement.classList.contains('dark') ? 'rgba(255,255,255,.07)' : 'rgba(255,255,255,.38)'; c.fill();
  if (label) { c.font = '700 11px system-ui,sans-serif'; c.fillStyle = 'rgba(90,85,77,.9)'; c.textAlign = 'left'; c.textBaseline = 'top'; c.fillText(label.toUpperCase(), r.x + 18, r.y + 14); }
};
