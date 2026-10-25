/* custom cursor: a neon reticle by default, plus an arcade mode (rocket, pointer, orb, Byte, Glitch).
   Mouse only, never on touch. The real cursor stays in text fields and over dialogs. */
(function () {
  if (!matchMedia('(hover:hover) and (pointer:fine)').matches) return;
  var rm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var MODES = ['reticle', 'rocket', 'pointer', 'orb', 'byte', 'glitch'];
  var LABEL = { reticle: 'neon reticle', rocket: 'rocket', pointer: 'terminal pointer', orb: 'orb', byte: 'Byte', glitch: 'Glitch', off: 'off' };
  var mode = 'reticle';
  try { var s = localStorage.getItem('cursor'); if (s === 'off' || MODES.indexOf(s) > -1) mode = s; } catch (e) {}

  var NS = 'http://www.w3.org/2000/svg';
  var D = '#04120a', LT = '#eafff1';
  function G(id, a, b, c) { return '<radialGradient id="' + id + '" cx="35%" cy="28%" r="80%"><stop offset="0" stop-color="' + a + '"/><stop offset=".45" stop-color="' + b + '"/><stop offset="1" stop-color="' + c + '"/></radialGradient>'; }
  var SVG = {
    reticle: '<svg viewBox="-28 -28 56 56"><defs><radialGradient id="cuh"><stop offset="0" stop-color="currentColor" stop-opacity=".42"/><stop offset=".55" stop-color="currentColor" stop-opacity=".12"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></radialGradient></defs>'
      + '<circle r="27" fill="url(#cuh)"/>'
      + '<g class="rt" fill="none" stroke="currentColor" stroke-linecap="round"><circle r="19" stroke-width="1.3" stroke-dasharray="24 5.85" opacity=".95"/>'
      + '<path d="M0-23v4M0 23v-4M-23 0h4M23 0h-4" stroke-width="2"/><g opacity=".5" stroke-width="1"><path d="M16.3-16.3l2.2-2.2M-16.3-16.3l-2.200-2.200M16.300 16.300l2.200 2.200M-16.300 16.300l-2.200 2.200"/></g></g>'
      + '<g class="rt2" fill="none" stroke="currentColor" stroke-linecap="round"><circle r="12.500" stroke-width=".8" stroke-dasharray="1.100 3.360" opacity=".7"/></g>'
      + '<g fill="none" stroke="currentColor" stroke-linecap="round"><circle r="8" stroke-width="1.5" opacity=".95"/><path d="M0-15v9M0 15v-9M-15 0h9M15 0h-9" stroke-width="1.700"/></g>'
      + '<g class="br" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M-22-14v-8h8M22-14v-8h-8M-22 14v8h8M22 14v8h-8"/></g>'
      + '<circle r="4.600" fill="currentColor" opacity=".25"/><circle r="2.500" fill="currentColor"/><circle r="1" fill="#fff"/></svg>',
    rocket: '<svg viewBox="-24 -26 48 54"><defs><linearGradient id="cub" x1="0" x2="1"><stop offset="0" stop-color="#9fb6aa"/><stop offset=".35" stop-color="#ffffff"/><stop offset=".7" stop-color="#d3e3da"/><stop offset="1" stop-color="#7e978a"/></linearGradient><linearGradient id="cun" x1="0" x2="1"><stop offset="0" stop-color="currentColor"/><stop offset="1" stop-color="#0c6b36"/></linearGradient>' + G('cuw', '#ffffff', '#7dffc0', '#0a5a3a') + '</defs>'
      + '<g class="rk"><g class="fl"><path d="M-5 12q5 20 10 0z" fill="#ff7a1a" opacity=".9"/><path d="M-3.4 12q3.4 14 6.8 0z" fill="#ffc83a"/><path d="M-1.7 12q1.7 8 3.4 0z" fill="#fff6c8"/></g>'
      + '<path d="M-7 3l-9 10 3 2 7-3zM7 3l9 10-3 2-7-3z" fill="url(#cun)" stroke="' + D + '" stroke-width=".8"/>'
      + '<path d="M-4 12h8l-1 3h-6z" fill="#42564c" stroke="' + D + '" stroke-width=".8"/>'
      + '<path d="M0-22c7 5 9 15 7 28l-3 6h-8l-3-6c-2-13 0-23 7-28z" fill="url(#cub)" stroke="' + D + '" stroke-width="1"/>'
      + '<path d="M0-22c3 2.2 5 5 6 8.4h-12c1-3.400 3-6.200 6-8.400z" fill="url(#cun)"/>'
      + '<path d="M-6.600 6.500h13.200M-7 3.500h14" stroke="currentColor" stroke-width="1.4"/>'
      + '<circle cy="-5" r="4.200" fill="' + D + '" stroke="currentColor" stroke-width="1.4"/><circle cy="-5" r="3" fill="url(#cuw)"/><path d="M-1.600-6.400a2.400 2.400 0 0 1 2-1" stroke="#fff" stroke-width=".9" fill="none" stroke-linecap="round"/></g></svg>',
    pointer: '<svg viewBox="-6 -6 38 42"><defs><linearGradient id="cup" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1b4a2e"/><stop offset=".5" stop-color="#082616"/><stop offset="1" stop-color="#03100a"/></linearGradient></defs>'
      + '<path d="M2 2v23l6.200-5.400 4 9.400 4.600-2-4-9.200 8.200-.2z" fill="url(#cup)" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>'
      + '<path d="M4.600 7.200v13.400l3.800-3.400" fill="none" stroke="currentColor" stroke-width="1" opacity=".55" stroke-linecap="round" stroke-linejoin="round"/>'
      + '<path d="M2 2l15.500 15.600" stroke="#fff" stroke-width=".7" opacity=".35"/><rect class="cr" x="21" y="23" width="6" height="8" fill="currentColor"/></svg>',
    orb: '<svg viewBox="-26 -26 52 52"><defs>' + G('cuo', '#f4fff8', 'currentColor', '#02210f') + '<radialGradient id="cug"><stop offset="0" stop-color="currentColor" stop-opacity=".45"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></radialGradient></defs>'
      + '<circle r="25" fill="url(#cug)"/><g class="ob" fill="none" stroke="currentColor"><ellipse rx="21" ry="7" transform="rotate(-24)" stroke-width="1" opacity=".5"/></g>'
      + '<circle r="12.500" fill="url(#cuo)"/><circle r="12.500" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width=".8"/>'
      + '<ellipse cx="-4" cy="-5.500" rx="4.500" ry="2.600" fill="#fff" opacity=".7" transform="rotate(-30 -4 -5.500)"/>'
      + '<g class="ob2"><g transform="rotate(-24)"><circle cx="21" r="2.600" fill="' + LT + '"/><circle cx="21" r="1.100" fill="currentColor"/></g></g></svg>',
    byte: '<svg viewBox="-22 -22 44 44"><defs>' + G('cuy', '#ffffff', 'currentColor', '#08522a') + '<linearGradient id="cuj" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b5ffd2"/><stop offset=".5" stop-color="currentColor"/><stop offset="1" stop-color="#0a6b38"/></linearGradient></defs>'
      + '<g class="by"><path d="M-14-1h26v3h-26z" fill="' + D + '"/>'
      + '<g class="jt"><path d="M-14-1v-7q0-6 7-6h14q7 0 7 6v7l-3.500 4.500-3-4.500-3 4.500-3-4.500-3 4.500-3-4.500-3 4.500-3-4.500z" fill="url(#cuj)" stroke="' + D + '" stroke-width="1"/><path d="M-8-11h13" stroke="#fff" stroke-opacity=".6" stroke-width="1.600" stroke-linecap="round"/><rect x="2" y="-8" width="5" height="5" rx="1.200" fill="' + D + '"/><rect x="3.200" y="-7" width="2.400" height="2.400" fill="' + LT + '"/><path d="M-12-14l-2-4M-9-14.500l-1-4" stroke="currentColor" stroke-width="1.200" stroke-linecap="round"/></g>'
      + '<g class="jb"><path d="M-14 3h26v4q0 6-7 6h-14q-5 0-5-6z" fill="url(#cuj)" stroke="' + D + '" stroke-width="1"/><path d="M-9 3v3.500M-3.500 3v3.500M2 3v3.500M7.500 3v3.500" stroke="' + D + '" stroke-width=".9"/></g></g></svg>',
    glitch: '<svg viewBox="-26 -26 52 52"><defs>' + G('cug2', '#eafff1', 'currentColor', '#05381d') + '</defs>'
      + '<g class="gl"><g class="gx" opacity=".7"><ellipse cx="-1.600" cy="2" rx="10" ry="12" fill="#ff2e93" style="mix-blend-mode:screen"/><ellipse cx="1.600" cy="2" rx="10" ry="12" fill="#18e4ff" style="mix-blend-mode:screen"/></g>'
      + '<path d="M-4-10l-6-9M4-10l6-9" stroke="currentColor" stroke-width="1.500" stroke-linecap="round" fill="none"/><circle cx="-10.500" cy="-19.500" r="2" fill="' + LT + '"/><circle cx="10.500" cy="-19.500" r="2" fill="' + LT + '"/>'
      + '<g class="lg" stroke="currentColor" stroke-width="1.600" stroke-linecap="round" fill="none"><path d="M-9 -2l-9-3 M-10 3l-10 2 M-9 8l-8 7 M9 -2l9-3 M10 3l10 2 M9 8l8 7"/></g>'
      + '<ellipse cy="2" rx="10.500" ry="13" fill="url(#cug2)" stroke="' + D + '" stroke-width="1"/><path d="M0-10v24" stroke="' + D + '" stroke-opacity=".35" stroke-width=".9"/><path d="M-7 5q7 3 14 0M-6.500 9q6.500 2.500 13 0" stroke="' + D + '" stroke-opacity=".3" stroke-width=".9" fill="none"/>'
      + '<g class="ey"><ellipse cx="-4.200" cy="-4" rx="3" ry="3.600" fill="' + D + '"/><ellipse cx="4.200" cy="-4" rx="3" ry="3.600" fill="' + D + '"/><circle cx="-3.200" cy="-5.200" r="1" fill="#fff"/><circle cx="5.200" cy="-5.200" r="1" fill="#fff"/></g></g></svg>'
  };

  var el = document.createElement('div'); el.className = 'cur'; el.setAttribute('aria-hidden', 'true'); el.hidden = true;
  var cv = document.createElement('canvas'); cv.className = 'cur-cv'; cv.setAttribute('aria-hidden', 'true');
  var cx = cv.getContext('2d'), dpr = Math.min(2, window.devicePixelRatio || 1), W = 0, H = 0;
  function size() { W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px'; cx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  var mx = -100, my = -100, x = -100, y = -100, vx = 0, vy = 0, ang = 0, seen = false, down = false, hov = false, text = false, raf = 0, last = 0, col = '#3dff8b', still = 0;
  var dots = [], bits = [], rings = [], scans = [];

  function accent() { col = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#3dff8b'; el.style.color = col; }
  function paint() {
    el.innerHTML = SVG[mode] || ''; el.setAttribute('data-m', mode);
    document.documentElement.classList.toggle('cur-hide', mode !== 'reticle' && mode !== 'off');
    accent();
  }
  function enable() {
    if (mode === 'off') { el.hidden = true; cv.hidden = true; document.documentElement.classList.remove('cur-hide'); return; }
    cv.hidden = rm; paint(); el.hidden = !seen;
  }
  function setMode(m) {
    if (m === 'next') m = mode === 'off' ? 'reticle' : MODES[(MODES.indexOf(mode) + 1) % MODES.length];
    else if (m === 'on') m = 'reticle';
    if (m !== 'off' && MODES.indexOf(m) < 0) return mode;
    mode = m; try { localStorage.setItem('cursor', mode); } catch (e) {}
    enable(); burst(x, y, 8); return mode;
  }

  var TRAIL = { reticle: 'sq', rocket: 'fire', pointer: 'line', orb: 'glow', byte: 'sq', glitch: 'mix' };
  var FIRE = ['#ffd24a', '#ff9a2a', '#ff6a1a'], GL = ['#ff2e93', '#18e4ff'];
  function bit(px, py, a, sp, o) { o = o || {}; bits.push({ x: px, y: py, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, l: 1, c: o.c || 0, s: o.s || (2 + Math.floor(Math.random() * 3)), k: o.k || null, f: o.f || .95 }); }
  function burst(px, py, n) {
    if (rm || mode === 'off') return;
    var i, a;
    if (mode === 'reticle') {
      for (i = 0; i < n; i++) bit(px, py, Math.random() * 6.283, 1 + Math.random() * 2.8, { c: Math.random() < .3 ? 1 : 0 });
      rings.push({ x: px, y: py, r: 4, l: 1, m: 30 }); scans.push({ x: px, y: py, l: 1 });
    } else if (mode === 'rocket') {
      for (i = 0; i < n * 2; i++) bit(px, py, Math.random() * 6.283, .8 + Math.random() * 3.4, { c: 1, s: 2 + Math.random() * 3, k: FIRE[i % 3] });
      rings.push({ x: px, y: py, r: 4, l: 1, m: 26, k: '#ff9a2a' });
    } else if (mode === 'pointer') {
      for (i = 0; i < n; i++) bit(px, py, Math.random() * 6.283, 1 + Math.random() * 2.2, { s: 3 });
      scans.push({ x: px, y: py, l: 1 });
    } else if (mode === 'orb') {
      for (i = 0; i < 5; i++) bit(px, py, i * 1.257, 1.4, { c: 1, s: 2 });
      rings.push({ x: px, y: py, r: 4, l: 1, m: 34 }); rings.push({ x: px, y: py, r: 2, l: .8, m: 22 });
    } else if (mode === 'byte') {
      for (i = 0; i < n; i++) { a = -Math.PI / 2 + (Math.random() - .5) * 2.4; bit(px, py, a, 1.4 + Math.random() * 2.4, { s: 3 }); }
      rings.push({ x: px, y: py, r: 6, l: .7, m: 20 });
    } else {
      for (i = 0; i < n + 3; i++) bit(px, py, Math.random() * 6.283, 1.2 + Math.random() * 3, { s: 3 + Math.floor(Math.random() * 4), k: i % 3 ? GL[i % 2] : null });
    }
    kick();
  }
  function kick() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } }

  function tick(now) {
    raf = 0;
    var dt = Math.min(0.05, (now - last) / 1000); last = now;
    var k = rm ? 1 : (mode === 'reticle' ? 0.34 : mode === 'pointer' ? 0.8 : 0.24);
    var px = x, py = y; x += (mx - x) * k; y += (my - y) * k;
    vx += ((x - px) / Math.max(dt, .008) - vx) * 0.25; vy += ((y - py) / Math.max(dt, .008) - vy) * 0.25;
    var sp = Math.hypot(vx, vy), moving = sp > 40;
    if (moving && mode !== 'pointer') ang += (((Math.atan2(vy, vx) * 180 / Math.PI + 90 - ang + 540) % 360) - 180) * 0.18;
    var rot = mode === 'rocket' ? ang : mode === 'glitch' ? Math.max(-25, Math.min(25, vx / 40)) : 0;
    var fl = mode === 'byte' && vx < -20 ? -1 : 1;
    var sc = (down ? 0.82 : hov && mode === 'reticle' ? 1.35 : hov ? 1.15 : 1);
    var off = mode === 'pointer' ? '0,0' : '-50%,-50%';
    el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) translate(' + off + ') rotate(' + rot.toFixed(1) + 'deg) scale(' + (sc * fl).toFixed(2) + ',' + sc.toFixed(2) + ')';
    el.classList.toggle('mv', moving); el.classList.toggle('hv', hov); el.classList.toggle('dn', down);
    if (!rm && mode !== 'off') {
      if (moving && now % 2 < 1.5) {
        var tt = TRAIL[mode], hx = Math.sin(ang * Math.PI / 180), hy = -Math.cos(ang * Math.PI / 180), bo = mode === 'rocket' ? 17 : 0;
        dots.push({ x: x - hx * bo + (Math.random() - .5) * (tt === 'fire' ? 5 : 7), y: y - hy * bo + (Math.random() - .5) * (tt === 'fire' ? 5 : 7), l: 1, s: 2 + Math.floor(Math.random() * 2), t: tt === 'mix' ? (Math.random() < .5 ? 'sq' : 'glow') : tt, k: tt === 'fire' ? FIRE[Math.floor(Math.random() * 3)] : tt === 'mix' && Math.random() < .35 ? GL[Math.floor(Math.random() * 2)] : null, a: Math.atan2(vy, vx) });
      }
      if (dots.length > 70) dots.splice(0, dots.length - 70);
      cx.clearRect(0, 0, W, H);
      var i, d;
      for (i = dots.length - 1; i >= 0; i--) {
        d = dots[i]; d.l -= dt * (d.t === 'line' ? 3 : 2); if (d.l <= 0) { dots.splice(i, 1); continue; }
        cx.fillStyle = cx.strokeStyle = d.k || col;
        if (d.t === 'glow' || d.t === 'fire') { cx.globalAlpha = d.l * 0.2; cx.beginPath(); cx.arc(d.x, d.y, d.s * 2.6 * d.l + 1, 0, 6.283); cx.fill(); cx.globalAlpha = d.l * 0.9; cx.beginPath(); cx.arc(d.x, d.y, d.s * .7 * d.l + .4, 0, 6.283); cx.fill(); }
        else if (d.t === 'line') { cx.globalAlpha = d.l * .8; cx.lineWidth = 1.6; cx.beginPath(); cx.moveTo(d.x, d.y); cx.lineTo(d.x - Math.cos(d.a) * 12 * d.l, d.y - Math.sin(d.a) * 12 * d.l); cx.stroke(); }
        else { cx.globalAlpha = d.l * 0.8; cx.fillRect(Math.round(d.x), Math.round(d.y), d.s, d.s); }
      }
      for (i = bits.length - 1; i >= 0; i--) {
        d = bits[i]; d.l -= dt * 1.7; if (d.l <= 0) { bits.splice(i, 1); continue; }
        d.x += d.vx; d.y += d.vy; d.vx *= d.f; d.vy *= d.f; cx.fillStyle = d.k || col;
        if (d.c) { cx.globalAlpha = d.l * .25; cx.beginPath(); cx.arc(d.x, d.y, d.s * 2, 0, 6.283); cx.fill(); cx.globalAlpha = d.l; cx.beginPath(); cx.arc(d.x, d.y, d.s * .55, 0, 6.283); cx.fill(); }
        else { cx.globalAlpha = d.l; cx.fillRect(Math.round(d.x), Math.round(d.y), d.s, d.s); }
      }
      cx.lineWidth = 1.5;
      for (i = rings.length - 1; i >= 0; i--) { d = rings[i]; d.l -= dt * 2.2; if (d.l <= 0) { rings.splice(i, 1); continue; } d.r += ((d.m || 30) - d.r) * .14; cx.strokeStyle = d.k || col; cx.globalAlpha = d.l * .8; cx.beginPath(); cx.arc(d.x, d.y, d.r, 0, 6.283); cx.stroke(); }
      cx.strokeStyle = col; cx.lineWidth = 1.2;
      for (i = scans.length - 1; i >= 0; i--) { d = scans[i]; d.l -= dt * 3.2; if (d.l <= 0) { scans.splice(i, 1); continue; } var L = 10 + (1 - d.l) * 44; cx.globalAlpha = d.l * .85; cx.beginPath(); cx.moveTo(d.x - L, d.y); cx.lineTo(d.x + L, d.y); cx.moveTo(d.x, d.y - L); cx.lineTo(d.x, d.y + L); cx.stroke(); }
      cx.globalAlpha = 1;
    }
    still = moving || dots.length || bits.length || rings.length || scans.length || Math.hypot(mx - x, my - y) > 0.4 ? 0 : still + 1;
    if (still < 4) raf = requestAnimationFrame(tick);
  }

  var HOVSEL = 'a[href], button, [role="button"], [role="tab"], [role="option"], summary, label, select, .card, .port, .nd, .dv, .bx';
  function sense(t) {
    var inDlg = document.querySelector('dialog[open]');
    text = !!(t && t.closest && t.closest('input, textarea, [contenteditable="true"], select')) || !!inDlg;
    hov = !!(t && t.closest && t.closest(HOVSEL));
    document.documentElement.classList.toggle('cur-native', text);
  }
  addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') return;
    mx = e.clientX; my = e.clientY; el.classList.remove('out');
    if (!seen) { seen = true; x = mx; y = my; enable(); }
    sense(e.target); kick();
  }, { passive: true });
  addEventListener('pointerdown', function (e) { if (e.pointerType === 'touch' || e.button) return; down = true; burst(e.clientX, e.clientY, 9); kick(); }, { passive: true });
  addEventListener('pointerup', function () { down = false; kick(); }, { passive: true });
  document.addEventListener('mouseleave', function () { el.classList.add('out'); });
  document.addEventListener('mouseenter', function () { el.classList.remove('out'); });
  addEventListener('resize', size);
  document.addEventListener('cursor:set', function (e) { var m = setMode(e.detail || 'next'); document.dispatchEvent(new CustomEvent('cursor:changed', { detail: m })); });
  new MutationObserver(accent).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  /* nav picker: a small button that opens a menu with a live preview of each style */
  var wrap = document.createElement('span'); wrap.className = 'cpk';
  var chip = document.createElement('button'); chip.type = 'button'; chip.className = 'chip'; chip.id = 'cursor-btn';
  chip.setAttribute('aria-haspopup', 'true'); chip.setAttribute('aria-expanded', 'false');
  var menu = document.createElement('div'); menu.className = 'cpk-m'; menu.hidden = true; menu.setAttribute('role', 'menu'); menu.setAttribute('aria-label', 'Cursor style');
  function pv(m) { return (SVG[m] || '').replace(/id="(cu\w+)"/g, 'id="$1p"').replace(/url\(#(cu\w+)\)/g, 'url(#$1p)'); }
  var items = {};
  MODES.concat('off').forEach(function (m) {
    var b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'menuitemradio'); b.dataset.m = m;
    b.innerHTML = '<span class="cpv">' + (m === 'off' ? '<i>Aa</i>' : pv(m)) + '</span><b>' + (m === 'off' ? 'normal' : LABEL[m]) + '</b>';
    b.addEventListener('click', function () { setMode(m); chg(); menuOpen(false); chip.focus(); });
    menu.appendChild(b); items[m] = b;
  });
  function chipText() {
    chip.textContent = 'cursor ▾'; chip.setAttribute('aria-label', 'Change cursor style. Now: ' + LABEL[mode]); chip.title = 'Cursor style: ' + LABEL[mode];
    for (var k in items) { items[k].setAttribute('aria-checked', String(k === mode)); items[k].classList.toggle('on', k === mode); }
  }
  function chg() { document.dispatchEvent(new CustomEvent('cursor:changed', { detail: mode })); }
  function menuOpen(o) { menu.hidden = !o; chip.setAttribute('aria-expanded', String(o)); if (o) { var on = items[mode]; if (on) on.focus(); } }
  chip.addEventListener('click', function () { menuOpen(menu.hidden); });
  document.addEventListener('pointerdown', function (e) { if (!menu.hidden && !wrap.contains(e.target)) menuOpen(false); });
  wrap.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !menu.hidden) { menuOpen(false); chip.focus(); e.stopPropagation(); }
    if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && !menu.hidden) {
      var l = [].slice.call(menu.children), i = l.indexOf(document.activeElement); i = (i + (e.key === 'ArrowDown' ? 1 : -1) + l.length) % l.length; l[i].focus(); e.preventDefault();
    }
  });
  document.addEventListener('cursor:changed', chipText);
  wrap.appendChild(chip); wrap.appendChild(menu);
  var th = document.getElementById('theme'); if (th && th.parentNode) th.parentNode.insertBefore(wrap, th); chipText();
  document.body.appendChild(cv); document.body.appendChild(el); size(); enable();
  window.PktCursor = { set: setMode, mode: function () { return mode; }, label: function (m) { return LABEL[m || mode]; } };
})();
