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
  var SVG = {
    reticle: '<svg viewBox="-20 -20 40 40"><g class="rt" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle r="11"/><path d="M0-17v-4M0 17v4M-17 0h-4M17 0h4" stroke-width="1.8"/></g><circle r="2.2" fill="currentColor"/></svg>',
    rocket: '<svg viewBox="-20 -20 40 40"><g class="rk"><path class="fl" d="M-4 11q4 14 8 0z" fill="#ffb02e"/><path d="M0-17c6 5 7 13 5 22h-10c-2-9-1-17 5-22z" fill="#e8fff1" stroke="currentColor" stroke-width="1.4"/><circle cy="-6" r="3" fill="currentColor"/><path d="M-5 3l-6 8 6-2zM5 3l6 8-6-2z" fill="currentColor"/></g></svg>',
    pointer: '<svg viewBox="-4 -4 32 36"><path d="M2 2l0 22 6-5 4 9 4-2-4-9 8 0z" fill="#04120a" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    orb: '<svg viewBox="-20 -20 40 40"><defs><radialGradient id="cuo" cx="35%" cy="30%"><stop offset="0" stop-color="#eafff1"/><stop offset=".35" stop-color="currentColor"/><stop offset="1" stop-color="#04301a"/></radialGradient></defs><circle r="11" fill="url(#cuo)"/></svg>',
    byte: '<svg viewBox="-20 -20 40 40"><g class="by"><rect x="-12" y="-1" width="24" height="5" fill="#04120a"/><path class="jt" d="M-12-1v-8h24v8l-3 4-3-4-3 4-3-4-3 4-3-4-3 4-3-4z" fill="currentColor"/><path class="jb" d="M-12 4h24v6h-24z" fill="currentColor"/><rect x="2" y="-7" width="4" height="4" fill="#04120a"/></g></svg>',
    glitch: '<svg viewBox="-20 -20 40 40"><g class="gl"><path d="M-5-9l-4-7M5-9l4-7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="-9" cy="-16" r="1.6" fill="currentColor"/><circle cx="9" cy="-16" r="1.6" fill="currentColor"/><path class="lg" d="M-9 2l-7 3M-9 7l-6 6M9 2l7 3M9 7l6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><ellipse ry="12" rx="10" cy="1" fill="currentColor"/><rect class="ey" x="-6" y="-5" width="4" height="5" fill="#04120a"/><rect class="ey" x="2" y="-5" width="4" height="5" fill="#04120a"/></g></svg>'
  };

  var el = document.createElement('div'); el.className = 'cur'; el.setAttribute('aria-hidden', 'true'); el.hidden = true;
  var cv = document.createElement('canvas'); cv.className = 'cur-cv'; cv.setAttribute('aria-hidden', 'true');
  var cx = cv.getContext('2d'), dpr = Math.min(2, window.devicePixelRatio || 1), W = 0, H = 0;
  function size() { W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px'; cx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  var mx = -100, my = -100, x = -100, y = -100, vx = 0, vy = 0, ang = 0, seen = false, down = false, hov = false, text = false, raf = 0, last = 0, col = '#3dff8b', still = 0;
  var dots = [], bits = [];

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

  function burst(px, py, n) {
    if (rm || mode === 'off') return;
    for (var i = 0; i < n; i++) { var a = Math.random() * 6.283, sp = 1 + Math.random() * 2.6; bits.push({ x: px, y: py, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, l: 1 }); }
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
      if (moving && now % 2 < 1.5) dots.push({ x: x + (Math.random() - .5) * 6, y: y + (Math.random() - .5) * 6, l: 1, s: 2 + Math.floor(Math.random() * 2) });
      if (dots.length > 60) dots.splice(0, dots.length - 60);
      cx.clearRect(0, 0, W, H); cx.fillStyle = col;
      var i, d;
      for (i = dots.length - 1; i >= 0; i--) { d = dots[i]; d.l -= dt * 2.2; if (d.l <= 0) { dots.splice(i, 1); continue; } cx.globalAlpha = d.l * 0.7; cx.fillRect(Math.round(d.x), Math.round(d.y), d.s, d.s); }
      for (i = bits.length - 1; i >= 0; i--) { d = bits[i]; d.l -= dt * 1.8; if (d.l <= 0) { bits.splice(i, 1); continue; } d.x += d.vx; d.y += d.vy; d.vx *= .96; d.vy *= .96; cx.globalAlpha = d.l; cx.fillRect(Math.round(d.x), Math.round(d.y), 3, 3); }
      cx.globalAlpha = 1;
    }
    still = moving || dots.length || bits.length || Math.hypot(mx - x, my - y) > 0.4 ? 0 : still + 1;
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

  document.body.appendChild(cv); document.body.appendChild(el); size(); enable();
  window.PktCursor = { set: setMode, mode: function () { return mode; }, label: function (m) { return LABEL[m || mode]; } };
})();
