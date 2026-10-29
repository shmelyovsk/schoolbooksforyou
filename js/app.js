'use strict';
// Каркас мини-приложения: загрузка сцен, интерфейс, цикл анимации.
(() => {
  const $ = s => document.querySelector(s);
  const tg = window.Telegram && Telegram.WebApp;
  if (tg) { try { tg.ready(); tg.expand(); if (tg.colorScheme === 'dark') document.documentElement.classList.add('dark'); } catch (e) {} }
  else if (matchMedia('(prefers-color-scheme: dark)').matches) document.documentElement.classList.add('dark');

  const cv = $('#cv'), ctx = cv.getContext('2d');
  const q = new URLSearchParams(location.search), BOOK = (q.get('b') || 'chem').replace(/[^a-z]/g, '');
  document.documentElement.dataset.book = BOOK;
  document.title = ({ chem: 'Химия 11', phys: 'Физика 11', geom: 'Геометрия 10–11' }[BOOK] || 'Учебник') + ' — анимации';
  let scenes = [], group = [], cur = null, idx = 0, time = 0, playing = true, st = null, microCache = {}, last = performance.now(), dim = { W: 960, H: 600, s: 1, ox: 0, oy: 0, dpr: 1 };
  const HOLD = 2.5;

  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1), rr = cv.getBoundingClientRect(), r = { width: rr.width, height: Math.max(160, rr.height) };
    cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
    const portrait = r.width / r.height < 1.1, W = portrait ? 600 : 960, H = portrait ? 760 : 600, s = Math.min(r.width / W, r.height / H);
    dim = { W, H, s, dpr, ox: (r.width - W * s) / 2, oy: (r.height - H * s) * (portrait ? .3 : .5), portrait }; microCache = {};
  }
  addEventListener('resize', resize);
  if (window.ResizeObserver) new ResizeObserver(() => resize()).observe(document.querySelector('#stage'));

  const fmt = s => s ? CH.uni(s) : '';
  function setCtrl() {
    const box = $('#ctrl'); box.innerHTML = ''; const R = CH.R[cur.type];
    // физика: переключатели режимов и ползунки величин из описания сцены
    const MODES = R && (typeof R.modes === 'function' ? R.modes(cur) : R.modes);
    if (MODES) MODES.forEach(m => { const g = document.createElement('div'); g.className = 'seg';
      m.o.forEach(([val, label]) => { const b = document.createElement('button'); b.textContent = label; b.classList.toggle('on', st.v[m.k] === val);
        b.onclick = () => { st.v[m.k] = val; g.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); }; g.appendChild(b); }); box.appendChild(g); });
    if (R && R.params) R.params.forEach(pr => { if (cur.hide && cur.hide.includes(pr.k)) return;
      const l = document.createElement('label'); l.className = 'prm'; const name = document.createElement('span'); const val = document.createElement('b');
      const show = () => { val.textContent = CH.num(st.v[pr.k], pr.d) + (pr.u ? ' ' + pr.u : ''); };
      name.textContent = pr.l; const i = document.createElement('input'); i.type = 'range'; i.min = pr.min; i.max = pr.max; i.step = pr.step || (pr.max - pr.min) / 100; i.value = st.v[pr.k];
      i.oninput = () => { st.v[pr.k] = +i.value; show(); }; show(); l.append(name, i, val); box.appendChild(l); });
    if (R && R.ctrl) R.ctrl(cur, st).forEach(o => {
      if (o.t === 'btn') { const b = document.createElement('button'); b.textContent = o.label; if (o.on) b.classList.add('on'); b.onclick = () => o.fn(b); box.appendChild(b); }
      else { const l = document.createElement('label'); l.append(o.label + ' '); const i = document.createElement('input'); i.type = 'range'; i.min = o.min; i.max = o.max; i.step = o.step || 1; i.value = o.val; i.oninput = () => o.fn(i.value); l.appendChild(i); box.appendChild(l); }
    });
  }
  function load(i, instant) {
    idx = Math.max(0, Math.min(group.length - 1, i)); cur = group[idx]; time = 0; microCache = {};
    const R = CH.R[cur.type]; st = R && R.init ? R.init(cur) : {}; playing = true; setPlay();
    if (R && (R.params || R.modes)) { st.v = {}; (R.params || []).forEach(p => st.v[p.k] = p.v); ((typeof R.modes === 'function' ? R.modes(cur) : R.modes) || []).forEach(m => st.v[m.k] = m.o[0][0]); Object.assign(st.v, cur.v || {}); }
    st.clock = 0;
    $('#card .lab').textContent = (cur.tag || 'Анимация') + ' · ' + (/^\d+$/.test(cur.par) ? '§' + cur.par : cur.par || '');
    $('#card h2').textContent = BOOK === 'geom' ? CH.uni(cur.t) : cur.t; $('#card .eq').textContent = /[→⇌]/.test(cur.t) ? '' : fmt(cur.eq); $('#card p').textContent = cur.task ? CH.uni(cur.task) : cur.d;
    $('#card p').classList.toggle('task', !!cur.task);
    // геометрия на телефоне: карточка свёрнута, по нажатию раскрывается условие задачи
    if (cur.task && !load.done) { load.done = true; if (matchMedia('(max-aspect-ratio: 11/10), (max-width: 759px)').matches) $('#card').classList.add('min'); }
    $('#bar').classList.toggle('nosk', !!(R && (R.stateful || R.phys))); setCtrl(); resize();
    document.querySelectorAll('#menu button').forEach((b, k) => b.classList.toggle('on', k === idx));
    history.replaceState(null, '', '?b=' + BOOK + '&s=' + cur.id);
  }
  function setPlay() { $('#play').innerHTML = playing ? '<svg viewBox="0 0 24 24"><path d="M8 5v14M16 5v14"/></svg>' : '<svg viewBox="0 0 24 24"><path d="M7 4l13 8-13 8z"/></svg>'; }

  function frame(now) {
    const dt = Math.min(.1, (now - last) / 1000); last = now;
    if (cur) {
      const dur = cur.dur || 10, R = CH.R[cur.type];
      if (playing) { time += dt; if (time > dur + HOLD) time = 0; }
      const p = Math.min(1, time / dur); if (!R || !(R.stateful || R.phys)) $('#seek').value = Math.round(p * 1000);
      if (playing) st.clock += dt;
      const { W, H, s, ox, oy, dpr } = dim; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.setTransform(dpr * s, 0, 0, dpr * s, ox * dpr, oy * dpr);
      try {
        const t = R && R.phys ? st.clock : cur.type === 'reaction' || !(R && R.stateful) ? time : performance.now() / 1000;
        if (cur.type === 'reaction') drawReaction(p, time);
        else if (R) { R.draw(ctx, W, H, p, t, cur, st, playing ? dt : 0); const lv = R.formula ? R.formula(st.v, st, cur) : R.live ? R.live(p, cur, st) : ''; setLive(lv); }
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
  $('#card h2').onclick = () => { if ($('#card').classList.contains('min')) $('#card').classList.remove('min'); };
  cv.onclick = () => { $('#menu').hidden = true; };
  // вращение чертежа пальцем/мышью (сцены с R.drag)
  let drag = null;
  cv.addEventListener('pointerdown', e => { const R = cur && CH.R[cur.type]; if (!R || !R.drag) return; drag = { x: e.clientX, y: e.clientY }; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', e => { if (!drag) return; const R = CH.R[cur.type]; R.onDrag(st, e.clientX - drag.x, e.clientY - drag.y); drag = { x: e.clientX, y: e.clientY }; });
  const endDrag = () => { drag = null; }; cv.addEventListener('pointerup', endDrag); cv.addEventListener('pointercancel', endDrag);
  cv.addEventListener('dblclick', () => { const R = cur && CH.R[cur.type]; if (R && R.drag && R.init) { const v = st.v; st = R.init(cur); st.v = v; st.clock = 0; } });
  addEventListener('keydown', e => { if (e.key === 'ArrowRight') load(idx + 1); if (e.key === 'ArrowLeft') load(idx - 1); if (e.key === ' ') $('#play').click(); });

  fetch('books/' + BOOK + '/scenes.json?v=7').then(r => r.json()).then(all => {
    scenes = all; const id = q.get('s'), par = q.get('p'); const s0 = scenes.find(x => x.id === id);
    const pk = s0 ? s0.par : par; group = pk ? scenes.filter(x => x.par === pk) : scenes; if (!group.length) group = scenes;
    buildMenu(); load(s0 ? group.indexOf(s0) : 0); resize(); if (!s0) $('#menu').hidden = false; requestAnimationFrame(frame);
  }).catch(e => { $('#card p').textContent = 'Не удалось загрузить сцены: ' + e; });
})();
