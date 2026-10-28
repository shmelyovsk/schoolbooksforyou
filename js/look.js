'use strict';
// «Как выглядит в жизни»: витрина веществ и материалов + несколько сцен-картинок (салют, пещера, туман).
(() => {
  const R = CH.R;
  const { clamp, lerp, sm, ease, H: HS, circle, rrect, stroke, text, pill, mix, rgba, LINE } = CH;

  function star(c, x, y, r, a) { c.save(); c.globalAlpha = a; c.beginPath(); c.moveTo(x, y - r); c.lineTo(x + r * .25, y - r * .25); c.lineTo(x + r, y); c.lineTo(x + r * .25, y + r * .25); c.lineTo(x, y + r); c.lineTo(x - r * .25, y + r * .25); c.lineTo(x - r, y); c.lineTo(x - r * .25, y - r * .25); c.closePath(); c.fillStyle = '#fff'; c.fill(); c.restore(); }
  function vessel(c, kind, x, y, u, fn) {
    const m = CH.vesselGeom(kind, x, y, u); c.save(); CH.vesselPath(c, m); c.clip(); c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(m.l, m.top, m.W, m.H); fn(m); c.restore();
    CH.vesselPath(c, m); c.lineWidth = 3; c.strokeStyle = LINE; c.stroke(); c.beginPath(); c.moveTo((m.nl || m.l) - 3, m.top); c.lineTo((m.nr || m.r) + 3, m.top); c.stroke(); return m;
  }
  const F = {
    crystals(c, x, y, u, it, t) {
      c.beginPath(); c.ellipse(x, y, u * .5, u * .1, 0, 0, TAU); c.fillStyle = 'rgba(255,255,255,.7)'; c.fill(); stroke(c, 2.5);
      const n = it.n || 22; for (let i = 0; i < n; i++) { const px = x + (HS(i) - .5) * u * .72, py = y - 6 - HS(i + 3) * u * .22 * (1 - Math.abs(px - x) / (u * .5)) * 1.6, r = u * (.035 + .03 * HS(i + 6)); c.save(); c.translate(px, py); c.rotate(HS(i + 9) * 2); if (it.shape === 'prism') { c.beginPath(); c.moveTo(0, -r * 2.4); c.lineTo(r, -r); c.lineTo(r, r); c.lineTo(-r, r); c.lineTo(-r, -r); c.closePath(); } else { c.beginPath(); c.rect(-r, -r, r * 2, r * 2); } c.fillStyle = it.c; c.fill(); stroke(c, 1.4); c.restore(); }
      for (let k = 0; k < 5; k++) star(c, x + (HS(k + 40) - .5) * u * .6, y - u * .15 - HS(k + 50) * u * .15, 7, Math.pow(Math.sin(t * 2.5 + k * 2), 4));
    },
    powder(c, x, y, u, it) { c.beginPath(); c.moveTo(x - u * .42, y); c.quadraticCurveTo(x, y - u * .65, x + u * .42, y); c.closePath(); c.fillStyle = it.c; c.fill(); stroke(c, 2.5); for (let i = 0; i < 24; i++) { circle(c, x + (HS(i) - .5) * u * .6, y - HS(i + 3) * u * .22, 1.8); c.fillStyle = 'rgba(255,255,255,.3)'; c.fill(); } },
    lump(c, x, y, u, it) { CH.lump(c, x, y - u * .2, u * .32, it.c, it.seed || 4); if (it.c2) { CH.lump(c, x + u * .3, y - u * .1, u * .2, it.c2, 8); } },
    stone(c, x, y, u, it) { c.save(); circle(c, x, y - u * .3, u * .32); c.clip(); for (let i = 0; i < 9; i++) { c.beginPath(); c.arc(x + Math.sin(i) * 6, y - u * .3 + Math.cos(i) * 4, u * .34 - i * u * .035, 0, TAU); c.fillStyle = i % 2 ? it.c : it.c2; c.fill(); } c.restore(); circle(c, x, y - u * .3, u * .32); stroke(c, 2.5); },
    liquid(c, x, y, u, it, t) {
      const m = vessel(c, it.glass || 'flask', x, y, u, m => { const lv = m.bot - m.H * (it.lev || .5); c.fillStyle = rgba(it.c, .78); c.beginPath(); c.moveTo(m.l, m.bot); c.lineTo(m.l, lv); for (let i = 0; i <= 10; i++) c.lineTo(m.l + m.W * i / 10, lv + Math.sin(t * 2 + i) * 1.4); c.lineTo(m.r, m.bot); c.closePath(); c.fill(); if (it.vapor) { c.fillStyle = rgba(it.vapor, .28); c.fillRect(m.l, m.top, m.W, lv - m.top); } });
      if (it.vapor) for (let i = 0; i < 5; i++) { const ph = (t * .25 + i / 5) % 1; circle(c, m.cx + Math.sin(ph * 6 + i) * 10, m.top - ph * u * .3, 5 + ph * 9); c.fillStyle = rgba(it.vapor, .25 * (1 - ph)); c.fill(); }
    },
    gas(c, x, y, u, it, t) { vessel(c, 'jar', x, y, u, m => { c.fillStyle = rgba(it.c, .6); c.fillRect(m.l, m.top, m.W, m.H); for (let i = 0; i < 4; i++) { c.strokeStyle = 'rgba(255,255,255,.25)'; c.lineWidth = 9; c.beginPath(); const yy = m.top + m.H * (.2 + .2 * i); c.moveTo(m.l, yy + Math.sin(t + i) * 5); c.quadraticCurveTo(m.cx, yy - 14 + Math.sin(t * .8 + i) * 8, m.r, yy + Math.cos(t + i) * 5); c.stroke(); } }); rrect(c, x - u * .28, y - u * .72 - 12, u * .56, 12, 4); c.fillStyle = '#b6b0a2'; c.fill(); stroke(c, 2.5); },
    ingot(c, x, y, u, it, t) { c.beginPath(); c.moveTo(x - u * .38, y); c.lineTo(x - u * .26, y - u * .22); c.lineTo(x + u * .26, y - u * .22); c.lineTo(x + u * .38, y); c.closePath(); const g = c.createLinearGradient(x - u * .38, 0, x + u * .38, 0); g.addColorStop(0, CH.shade(it.c, -.2)); g.addColorStop(.35, CH.shade(it.c, .45)); g.addColorStop(.7, it.c); g.addColorStop(1, CH.shade(it.c, -.25)); c.fillStyle = g; c.fill(); stroke(c, 2.5); const sx = x - u * .4 + ((t * .5) % 1.6) * u * .5; if (sx < x + u * .3) star(c, sx, y - u * .12, 10, 1); },
    drop(c, x, y, u, it, t) { [[0, 0, .2], [-.28, .04, .07], [.3, .05, .09], [.12, .06, .05]].forEach(([dx, dy, r]) => { const cx = x + dx * u, cy = y - r * u * .8 + dy * u, g = c.createRadialGradient(cx - r * u * .3, cy - r * u * .3, 1, cx, cy, r * u); g.addColorStop(0, '#fff'); g.addColorStop(.4, '#c5ccd4'); g.addColorStop(1, '#6f7886'); circle(c, cx, cy, r * u); c.fillStyle = g; c.fill(); stroke(c, 2); }); },
    wire(c, x, y, u, it) { c.beginPath(); for (let i = 0; i <= 80; i++) { const a = i / 80 * TAU * 5, px = x + (i / 80 - .5) * u * .8, py = y - u * .12 + Math.sin(a) * u * .1; i ? c.lineTo(px, py) : c.moveTo(px, py); } c.lineWidth = 7; c.strokeStyle = LINE; c.stroke(); c.lineWidth = 4; c.strokeStyle = it.c; c.stroke(); },
    sheet(c, x, y, u, it, t) { c.beginPath(); c.moveTo(x - u * .4, y - u * .05); c.lineTo(x - u * .2, y - u * .4); c.lineTo(x + u * .45, y - u * .4); c.lineTo(x + u * .25, y - u * .05); c.closePath(); const g = c.createLinearGradient(x - u * .4, y, x + u * .45, y - u * .4); g.addColorStop(0, CH.shade(it.c, -.15)); g.addColorStop(.5, CH.shade(it.c, .5)); g.addColorStop(1, it.c); c.fillStyle = g; c.fill(); stroke(c, 2.5); star(c, x + Math.sin(t) * u * .2, y - u * .22, 9, .9); },
    tube(c, x, y, u, it, t) { const w = u * .9, h = u * .16, f = .75 + .25 * Math.sin(t * 9 + (it.seed || 0)); CH.glow(c, x, y - h * 2, u * .8, it.c, .55 * f); rrect(c, x - w / 2, y - h * 2.4, w, h, h / 2); c.fillStyle = rgba(it.c, .85 * f); c.fill(); stroke(c, 3); rrect(c, x - w / 2 - 14, y - h * 2.2, 14, h * .6, 3); c.fillStyle = '#6a6a70'; c.fill(); stroke(c, 2); rrect(c, x + w / 2, y - h * 2.2, 14, h * .6, 3); c.fill(); stroke(c, 2); },
    ice(c, x, y, u, it, t) { vessel(c, 'beaker', x, y, u, m => { const lv = m.bot - m.H * .62; c.fillStyle = 'rgba(160,205,245,.7)'; c.fillRect(m.l, lv, m.W, m.bot - lv); const by = lv + Math.sin(t * 1.5) * 1.5 - m.W * .08; rrect(c, m.cx - m.W * .22, by - m.W * .18, m.W * .44, m.W * .36, 6); c.fillStyle = 'rgba(235,248,255,.88)'; c.fill(); stroke(c, 2); }); },
    gem(c, x, y, u, it, t) { const r = u * .26, cy = y - u * .3; c.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + .39; i ? c.lineTo(x + Math.cos(a) * r, cy + Math.sin(a) * r) : c.moveTo(x + Math.cos(a) * r, cy + Math.sin(a) * r); } c.closePath(); const g = c.createLinearGradient(x - r, cy - r, x + r, cy + r); g.addColorStop(0, CH.shade(it.c, .6)); g.addColorStop(.5, it.c); g.addColorStop(1, CH.shade(it.c, -.3)); c.fillStyle = g; c.fill(); stroke(c, 2.5); c.lineWidth = 1.3; c.strokeStyle = 'rgba(43,40,35,.55)'; circle(c, x, cy, r * .5); c.stroke(); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + .39; c.beginPath(); c.moveTo(x + Math.cos(a) * r * .5, cy + Math.sin(a) * r * .5); c.lineTo(x + Math.cos(a) * r, cy + Math.sin(a) * r); c.stroke(); } star(c, x + Math.cos(t) * r * .5, cy - r * .3, 12, .6 + .4 * Math.sin(t * 3)); },
    bottle(c, x, y, u, it) { const m = vessel(c, 'bottle', x, y, u, m => { c.fillStyle = rgba(it.c, .45); c.fillRect(m.l, m.top, m.W, m.H); }); rrect(c, m.cx - m.W * .2, m.top - 12, m.W * .4, 12, 3); c.fillStyle = it.cap || '#3a6df0'; c.fill(); stroke(c, 2); },
    pipe(c, x, y, u, it) { rrect(c, x - u * .4, y - u * .3, u * .8, u * .24, 6); c.fillStyle = it.c; c.fill(); stroke(c, 2.5); rrect(c, x - u * .44, y - u * .34, u * .12, u * .32, 4); c.fill(); stroke(c, 2.5); c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(x - u * .3, y - u * .27, u * .6, 4); },
    bag(c, x, y, u, it, t) { c.beginPath(); c.moveTo(x - u * .26, y); c.bezierCurveTo(x - u * .38, y - u * .3, x - u * .3, y - u * .55, x - u * .2, y - u * .62); c.lineTo(x + u * .2, y - u * .62); c.bezierCurveTo(x + u * .3, y - u * .55, x + u * .38, y - u * .3, x + u * .26, y); c.closePath(); c.fillStyle = rgba(it.c, .55); c.fill(); stroke(c, 2.5); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 3; c.beginPath(); c.moveTo(x - u * .1, y - u * .5); c.quadraticCurveTo(x - u * .16, y - u * .3, x - u * .08, y - u * .1); c.stroke(); },
    thread(c, x, y, u, it, t) { for (let k = 0; k < 9; k++) { c.beginPath(); for (let i = 0; i <= 30; i++) { const a = i / 30, px = x + (a - .5) * u * .8, py = y - u * .15 + Math.sin(a * 9 + k * .7 + t * .6) * u * .06 + (k - 4) * 3; i ? c.lineTo(px, py) : c.moveTo(px, py); } c.lineWidth = 3; c.strokeStyle = mix(it.c, '#ffffff', k / 14); c.stroke(); } },
    jelly(c, x, y, u, it, t) { const w = 1 + Math.sin(t * 5) * .025 * (1 - sm(0, 6, t % 8)), h = 1 - Math.sin(t * 5) * .03; c.save(); c.translate(x, y); c.scale(w, h); c.beginPath(); c.moveTo(-u * .3, 0); c.bezierCurveTo(-u * .32, -u * .5, u * .32, -u * .5, u * .3, 0); c.closePath(); c.fillStyle = rgba(it.c, .8); c.fill(); stroke(c, 2.5); c.fillStyle = 'rgba(255,255,255,.45)'; c.beginPath(); c.ellipse(-u * .1, -u * .25, u * .06, u * .12, .5, 0, TAU); c.fill(); c.restore(); },
    foam(c, x, y, u, it, t) { vessel(c, 'beaker', x, y, u, m => { c.fillStyle = rgba(it.liq || '#cfe8ff', .6); c.fillRect(m.l, m.bot - m.H * .4, m.W, m.H * .4); }); const m = CH.vesselGeom('beaker', x, y, u); for (let i = 0; i < 40; i++) { const px = m.l + m.W * (HS(i) * 1.1 - .05), py = m.top - HS(i + 4) * u * .16 + 6, r = 5 + 7 * HS(i + 7); circle(c, px, py, r); c.fillStyle = 'rgba(255,255,255,.9)'; c.fill(); c.lineWidth = 1; c.strokeStyle = 'rgba(0,0,0,.25)'; c.stroke(); } },
    fog(c, x, y, u, it, t) { for (let i = 0; i < 8; i++) { const px = x + Math.sin(t * .3 + i) * u * .3 + (i - 4) * u * .08, py = y - u * .15 - (i % 3) * u * .08; const g = c.createRadialGradient(px, py, 0, px, py, u * .3); g.addColorStop(0, 'rgba(255,255,255,.7)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(px - u * .3, py - u * .3, u * .6, u * .6); } c.beginPath(); c.moveTo(x - u * .5, y); c.lineTo(x + u * .5, y); c.lineWidth = 3; c.strokeStyle = 'rgba(60,110,160,.7)'; c.stroke(); },
    rust(c, x, y, u, it) { rrect(c, x - u * .06, y - u * .6, u * .12, u * .6, 3); c.fillStyle = '#9b4a22'; c.fill(); stroke(c, 2); for (let i = 0; i < 14; i++) { circle(c, x + (HS(i) - .5) * u * .1, y - HS(i + 2) * u * .55, 2.4); c.fillStyle = '#c0622a'; c.fill(); } }
  };

  function items(c, W, Hh, p, t, S) {
    const its = S.items, n = its.length, u = Math.min(W / n * .78, Hh * .5, 260), y = Hh * .66;
    rrect(c, W * .05, y + 2, W * .9, 12, 6); c.fillStyle = document.documentElement.classList.contains('dark') ? '#5b5448' : '#d9c9a8'; c.fill(); stroke(c, 2);
    its.forEach((it, i) => { const x = W * (i + .5) / n, a = ease(sm(i * .12, i * .12 + .25, p)); c.save(); c.globalAlpha = a; c.translate(x, y + (1 - a) * 30); (F[it.f] || F.lump)(c, 0, 0, u, it, t); c.restore();
      c.save(); c.globalAlpha = a; text(c, it.lab, x, y + 38, 15, '#2b2823'); if (it.sub) text(c, it.sub, x, y + 58, 12, '#6b655b', 'center', 500); if (it.e) { c.font = '26px system-ui'; c.textAlign = 'center'; c.fillStyle = '#000'; c.fillText(it.e, x, y + 92); } c.restore(); });
  }

  const SC = {
    fireworks(c, W, Hh, p, t, S) {
      c.fillStyle = 'rgba(14,18,36,.92)'; c.fillRect(0, 0, W, Hh); for (let i = 0; i < 40; i++) { circle(c, W * HS(i), Hh * .6 * HS(i + 3), 1.2); c.fillStyle = `rgba(255,255,255,${.4 + .4 * Math.sin(t + i)})`; c.fill(); }
      c.fillStyle = '#10131f'; c.fillRect(0, Hh * .86, W, Hh * .14);
      const cols = S.cols;
      for (let b = 0; b < 4; b++) { const ph = ((t * .32 + b * .26) % 1), cx = W * (.18 + .21 * b + .03 * Math.sin(b * 5)), cy = Hh * (.28 + .1 * HS(b + 2)), col = cols[b % cols.length][0];
        if (ph < .25) { const a = ph / .25; circle(c, cx, lerp(Hh * .86, cy, a), 3); c.fillStyle = '#ffd36b'; c.fill(); } else { const e = (ph - .25) / .75; for (let k = 0; k < 40; k++) { const a = k / 40 * TAU, d = e * Hh * .24 * (.8 + .2 * HS(k + b)); const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d + e * e * 40; circle(c, x, y, 3 * (1 - e)); c.fillStyle = rgba(col, 1 - e); c.fill(); } CH.glow(c, cx, cy, Hh * .3 * (1 - e), col, .25 * (1 - e)); } }
      cols.forEach((cc, i) => { const x = W * (i + .5) / cols.length; circle(c, x, Hh * .94, 8); c.fillStyle = cc[0]; c.fill(); text(c, cc[1], x + 14, Hh * .94, 12, '#f1ede6', 'left', 500); });
    },
    cave(c, W, Hh, p, t, S) {
      c.fillStyle = '#4a4338'; c.fillRect(0, 0, W, Hh); const g = c.createLinearGradient(0, 0, 0, Hh); g.addColorStop(0, '#2d2822'); g.addColorStop(1, '#5a5043'); c.fillStyle = g; c.fillRect(0, 0, W, Hh);
      const gr = ease(clamp(p)); for (let i = 0; i < 9; i++) { const x = W * (.08 + .105 * i), L = Hh * (.1 + .22 * HS(i + 1)) * (.4 + .6 * gr), w = 14 + 14 * HS(i + 5); c.beginPath(); c.moveTo(x - w, 0); c.lineTo(x + w, 0); c.lineTo(x, L); c.closePath(); c.fillStyle = '#e8dfc9'; c.fill(); stroke(c, 2);
        const dp = (t * .6 + HS(i)) % 1; if (gr > .2) { circle(c, x, L + dp * (Hh * .86 - L), 3); c.fillStyle = 'rgba(150,200,255,.9)'; c.fill(); }
        const M = Hh * (.06 + .16 * HS(i + 8)) * (.3 + .7 * gr), x2 = x + 20 * Math.sin(i); c.beginPath(); c.moveTo(x2 - w * .9, Hh * .9); c.lineTo(x2 + w * .9, Hh * .9); c.lineTo(x2, Hh * .9 - M); c.closePath(); c.fillStyle = '#ddd2b8'; c.fill(); stroke(c, 2); }
      pill(c, 'капли воды с Ca(HCO₃)₂ теряют CO₂ и оставляют CaCO₃ — сталактиты растут сверху, сталагмиты снизу', W / 2, Hh * .96, 12.5);
    }
  };

  R.look = {
    draw(c, W, Hh, p, t, S) { if (S.scene) return SC[S.scene](c, W, Hh, p, t, S); CH.panel(c, { x: 0, y: 0, w: W, h: Hh }, ''); items(c, W, Hh, p, t, S); if (S.cap) pill(c, S.cap, W / 2, Hh * .08, 13); }
  };
})();
