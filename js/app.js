'use strict';
// Каркас мини-приложения: загрузка сцен, интерфейс, цикл анимации.
(() => {
  const $ = s => document.querySelector(s);
  const tg = window.Telegram && Telegram.WebApp;
  if (tg) { try { tg.ready(); tg.expand(); if (tg.colorScheme === 'dark') document.documentElement.classList.add('dark'); } catch (e) {} }
  else if (matchMedia('(prefers-color-scheme: dark)').matches) document.documentElement.classList.add('dark');

  const cv = $('#cv'), ctx = cv.getContext('2d');
  const q = new URLSearchParams(location.search);
  let scenes = [], group = [], cur = null, idx = 0, time = 0, playing = true, st = null, microCache = {}, last = performance.now(), dim = { W: 960, H: 600, s: 1, ox: 0, oy: 0, dpr: 1 };
  const HOLD = 2.5;

  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1), rr = cv.getBoundingClientRect(), r = { width: rr.width, height: Math.max(200, rr.height - 64) };
    cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
    const portrait = r.width / r.height < 1.1, W = portrait ? 600 : 960, H = portrait ? 760 : 600, s = Math.min(r.width / W, r.height / H);
    dim = { W, H, s, dpr, ox: (r.width - W * s) / 2, oy: (r.height - H * s) * (portrait ? .3 : .5), portrait }; microCache = {};
  }
  addEventListener('resize', resize);

  const fmt = s => s ? CH.uni(s) : '';
  function setCtrl() {
    const box = $('#ctrl'); box.innerHTML = ''; const R = CH.R[cur.type];
    if (R && R.ctrl) R.ctrl(cur, st).forEach(o => {
      if (o.t === 'btn') { const b = document.createElement('button'); b.textContent = o.label; if (o.on) b.classList.add('on'); b.onclick = () => o.fn(b); box.appendChild(b); }
      else { const l = document.createElement('label'); l.append(o.label + ' '); const i = document.createElement('input'); i.type = 'range'; i.min = o.min; i.max = o.max; i.step = o.step || 1; i.value = o.val; i.oninput = () => o.fn(i.value); l.appendChild(i); box.appendChild(l); }
    });
  }
  function load(i, instant) {
    idx = Math.max(0, Math.min(group.length - 1, i)); cur = group[idx]; time = 0; microCache = {};
    const R = CH.R[cur.type]; st = R && R.init ? R.init(cur) : {}; playing = true; setPlay();
    $('#card .lab').textContent = (cur.tag || 'Анимация') + ' · ' + (/^\d+$/.test(cur.par) ? '§' + cur.par : cur.par || '');
    $('#card h2').textContent = cur.t; $('#card .eq').textContent = /[→⇌]/.test(cur.t) ? '' : fmt(cur.eq); $('#card p').textContent = cur.d;
    $('#bar').classList.toggle('nosk', !!(R && R.stateful)); setCtrl();
    document.querySelectorAll('#menu button').forEach((b, k) => b.classList.toggle('on', k === idx));
    history.replaceState(null, '', '?s=' + cur.id);
  }
  function setPlay() { $('#play').innerHTML = playing ? '<svg viewBox="0 0 24 24"><path d="M8 5v14M16 5v14"/></svg>' : '<svg viewBox="0 0 24 24"><path d="M7 4l13 8-13 8z"/></svg>'; }

  function frame(now) {
    const dt = Math.min(.1, (now - last) / 1000); last = now;
    if (cur) {
      const dur = cur.dur || 10, R = CH.R[cur.type];
      if (playing) { time += dt; if (time > dur + HOLD) time = 0; }
      const p = Math.min(1, time / dur); if (!R || !R.stateful) $('#seek').value = Math.round(p * 1000);
      const { W, H, s, ox, oy, dpr } = dim; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.setTransform(dpr * s, 0, 0, dpr * s, ox * dpr, oy * dpr);
      try {
        const t = cur.type === 'reaction' || !(R && R.stateful) ? time : performance.now() / 1000;
        if (cur.type === 'reaction') drawReaction(p, time);
        else if (R) { R.draw(ctx, W, H, p, t, cur, st, playing ? dt : 0); const lv = R.live ? R.live(p, cur, st) : ''; setLive(lv); }
      } catch (e) { console.error(cur.id, e); }
    }
    requestAnimationFrame(frame);
  }
  let liveTxt = ''; function setLive(s) { if (s !== liveTxt) { liveTxt = s; $('#card .live').textContent = s; } }

  function drawReaction(p, t) {
    const { W, H, portrait } = dim, hasMic = cur.eq && cur.mic !== false && cur.m !== false || false, noMac = cur.mac === false;
    let rm, ri;
    if (noMac) { ri = { x: 0, y: 0, w: W, h: H }; }
    else if (!hasMic) { rm = { x: 0, y: 0, w: W, h: H }; }
    else if (portrait) { rm = { x: 0, y: 0, w: W, h: H * .6 }; ri = { x: 0, y: H * .6, w: W, h: H * .4 }; }
    else { rm = { x: 0, y: 0, w: W * .56, h: H }; ri = { x: W * .56, y: 0, w: W * .44, h: H }; }
    if (rm) CH.drawMacro(ctx, rm, cur.m || cur, p, t);
    if (ri) CH.drawMicro(ctx, ri, cur, p, t, microCache);
    const ph = p < .12 ? 'до реакции' : p < .85 ? 'идёт реакция' : 'результат';
    setLive(cur.live ? (p > .6 ? cur.live : '') : ph);
  }

  function buildMenu() {
    const ol = $('#menu ol'); ol.innerHTML = '';
    group.forEach((g, i) => { const li = document.createElement('li'), b = document.createElement('button'); b.innerHTML = '<em>' + (i + 1) + '</em>'; b.append(g.t); b.onclick = () => { load(i); $('#menu').hidden = true; }; li.appendChild(b); ol.appendChild(li); });
  }

  $('#prev').onclick = () => load(idx - 1); $('#next').onclick = () => load(idx + 1);
  $('#play').onclick = () => { playing = !playing; setPlay(); };
  $('#redo').onclick = () => { time = 0; playing = true; setPlay(); const R = CH.R[cur.type]; if (R && R.init) { st = R.init(cur); setCtrl(); } };
  $('#list').onclick = () => { $('#menu').hidden = !$('#menu').hidden; };
  $('#seek').oninput = e => { time = (e.target.value / 1000) * (cur.dur || 10); playing = false; setPlay(); };
  $('#cardx').onclick = () => $('#card').classList.toggle('min');
  cv.onclick = () => { $('#menu').hidden = true; };
  addEventListener('keydown', e => { if (e.key === 'ArrowRight') load(idx + 1); if (e.key === 'ArrowLeft') load(idx - 1); if (e.key === ' ') $('#play').click(); });

  fetch('scenes.json').then(r => r.json()).then(all => {
    scenes = all; const id = q.get('s'), par = q.get('p'); const s0 = scenes.find(x => x.id === id);
    const pk = s0 ? s0.par : par; group = pk ? scenes.filter(x => x.par === pk) : scenes; if (!group.length) group = scenes;
    buildMenu(); resize(); load(s0 ? group.indexOf(s0) : 0); if (!s0) $('#menu').hidden = false; requestAnimationFrame(frame);
  }).catch(e => { $('#card p').textContent = 'Не удалось загрузить сцены: ' + e; });
})();
