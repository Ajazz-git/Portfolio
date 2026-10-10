/* Packet, an original penguin pilot. Flies a small rocket around the page, parks beside a widget,
   hops off the rocket, opens a laptop, plugs a cable into the widget, checks it, hops back on and flies off. */
(function () {
  var toggle = document.getElementById('pilot-toggle');
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    if (toggle) toggle.hidden = true;
    return;
  }

  var W = 70.4, K = W / 140, H = 100 * K;     /* sprite box, and its scale from the 140 x 100 drawing */
  var PX = 122 * K, PY = 60 * K;            /* laptop port position inside the sprite */
  var HOP = 40 * K;                         /* how far the penguin steps out in front of the rocket */
  var SEL = '.node, .port, .dev, .card, .term, .photos, .handled li';
  var SAYS = ['link up', 'no errors', 'all green', 'checks passed', 'looks good', 'config saved'];
  var NS = 'http://www.w3.org/2000/svg';
  var INK = '#0b1a12';

  function st(w) { return ' stroke="' + INK + '" stroke-width="' + (w || 2) + '" stroke-linejoin="round"'; }

  var ROCKET = '<svg class="rkt" viewBox="0 0 140 100" focusable="false">'
    + '<g class="flame"><path d="M42 66 Q8 73 42 80 Z" fill="#ffb020"/><path d="M42 69 Q20 73 42 77 Z" fill="#fff3b8"/></g>'
    + '<path d="M46 62 L36 50 L58 62 Z" fill="#3dff8b"' + st() + '/>'
    + '<path d="M44 84 L32 97 L60 84 Z" fill="#3dff8b"' + st() + '/>'
    + '<rect x="40" y="62" width="58" height="22" rx="11" fill="#e6efe9"' + st() + '/>'
    + '<path d="M90 62 Q108 63 118 73 Q108 83 90 84 Z" fill="#3dff8b"' + st() + '/>'
    + '<circle cx="62" cy="73" r="5" fill="#8fdcff"' + st() + '/>'
    + '</svg>';

  var PENGUIN = '<svg viewBox="0 0 140 100" focusable="false">'
    + '<ellipse class="pad" cx="70" cy="67" rx="26" ry="3.6" fill="#3dff8b" fill-opacity="0.35" stroke="#3dff8b" stroke-width="1.4"/>'
    + '<ellipse cx="46" cy="40" rx="6" ry="13" transform="rotate(18 46 40)" fill="#1a3043"' + st() + '/>'
    + '<ellipse cx="66" cy="36" rx="20" ry="26" fill="#254a63"' + st() + '/>'
    + '<ellipse cx="71" cy="41" rx="12.5" ry="17" fill="#f4f8f6"/>'
    + '<path d="M48 25 C47 4 85 4 84 25 Z" fill="#3dff8b"' + st() + '/>'
    + '<rect x="64" y="16" width="24" height="11" rx="5.5" fill="#8fdcff"' + st() + '/>'
    + '<circle cx="77" cy="22" r="2" fill="' + INK + '"/>'
    + '<path d="M68 19.5 H73" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>'
    + '<path d="M86 28 L98 32 L86 36 Z" fill="#ffb020"' + st(1.6) + '/>'
    + '<path d="M50 31 Q67 39 84 32 L85 37 Q67 45 50 37 Z" fill="#ff5d4a"' + st(1.6) + '/>'
    + '<g class="scarf"><path d="M52 35 Q38 33 28 43 Q42 42 52 41 Z" fill="#ff5d4a"' + st(1.6) + '/></g>'
    + '<ellipse cx="60" cy="62" rx="8" ry="3.2" fill="#ffb020"' + st(1.6) + '/>'
    + '<ellipse cx="79" cy="62" rx="8" ry="3.2" fill="#ffb020"' + st(1.6) + '/>'
    + '<g class="lap">'
    + '<path d="M95 60 H122 L120 64 H93 Z" fill="#c9d6cf"' + st(1.6) + '/>'
    + '<g class="lid"><rect x="98" y="39" width="21" height="21" rx="2" fill="#10231a"' + st(1.6) + '/>'
    + '<rect class="scr" x="100.5" y="41.5" width="16" height="15.5" rx="1" fill="#3dff8b"/>'
    + '<path d="M103 46 H112 M103 50 H109" stroke="#10231a" stroke-width="1.6" stroke-linecap="round"/></g>'
    + '<circle class="lp" cx="122" cy="60" r="1.8" fill="#ffb020"/>'
    + '</g>'
    + '<ellipse cx="89" cy="47" rx="5.5" ry="12" transform="rotate(-32 89 47)" fill="#1a3043"' + st() + '/>'
    + '</svg>';

  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function put(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  var pilot = document.createElement('div');
  pilot.id = 'pilot';
  pilot.setAttribute('aria-hidden', 'true');
  pilot.innerHTML = '<div class="flip"><div class="tilt">' + ROCKET + '<div class="pg">' + PENGUIN + '</div></div></div>';
  var flip = pilot.firstChild;
  var tilt = flip.firstChild;
  var portEl = pilot.querySelector('.lp');
  var pg = pilot.querySelector('.pg');

  var layer = document.createElementNS(NS, 'svg');
  layer.id = 'cables';
  layer.setAttribute('aria-hidden', 'true');
  layer.innerHTML = '<path id="cable" d=""/><circle id="plug" r="4" cx="-20" cy="-20"/>';
  var cable = layer.firstChild;
  var plug = layer.lastChild;

  var say = document.createElement('div');
  say.className = 'say';
  say.setAttribute('aria-hidden', 'true');

  document.body.appendChild(layer);
  document.body.appendChild(pilot);
  document.body.appendChild(say);

  var pos = { x: -W - 20, y: 160 };
  var face = 1;
  var on = false;
  var gen = 0;
  var visited = new Set();
  var last = null;

  function place(x, y, rot) {
    pos.x = x;
    pos.y = y;
    pilot.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
    if (rot !== undefined) tilt.style.transform = 'rotate(' + rot.toFixed(1) + 'deg)';
  }
  function setFace(f) { face = f; flip.style.transform = 'scaleX(' + f + ')'; }

  function randomPoint() {
    var vw = window.innerWidth, vh = window.innerHeight;
    return {
      x: rnd(12, Math.max(13, vw - W - 12)),
      y: rnd(70, Math.max(71, vh - H - 12))
    };
  }

  function flyTo(my, getTarget, faceAtEnd) {
    return new Promise(function (res) {
      var from = { x: pos.x, y: pos.y };
      var first = getTarget();
      var dx0 = first.x - from.x;
      var dist = Math.sqrt(dx0 * dx0 + (first.y - from.y) * (first.y - from.y));
      var dur = clamp(800 + dist * 1.2, 900, 2400);
      if (Math.abs(dx0) > 10) setFace(dx0 > 0 ? 1 : -1);
      pilot.classList.add('fly');
      var t0 = null;
      function step(ts) {
        if (!on || my !== gen) { return res(false); }
        if (t0 === null) t0 = ts;
        var p = Math.min(1, (ts - t0) / dur);
        var e = ease(p);
        var tg = getTarget();
        var x = from.x + (tg.x - from.x) * e;
        var y = from.y + (tg.y - from.y) * e + Math.sin(p * Math.PI * 3) * Math.sin(p * Math.PI) * 12;
        var vx = x - pos.x, vy = y - pos.y;
        var rot = clamp(Math.atan2(vy, Math.abs(vx) + 0.001) * 57.3 * 0.6, -18, 18);
        place(x, y, rot);
        if (p < 1) { requestAnimationFrame(step); return; }
        pilot.classList.remove('fly');
        place(x, y, 0);
        if (faceAtEnd !== undefined) setFace(faceAtEnd);
        res(true);
      }
      requestAnimationFrame(step);
    });
  }

  /* where the sprite and the cable end sit, for a given side of a widget */
  function geo(kind, f, R) {
    var vw = window.innerWidth, vh = window.innerHeight, GAP = 43;
    var vt = Math.max(R.top, 70), vb = Math.min(R.bottom, vh - 30), cy = (vt + vb) / 2;
    var ax = clamp(clamp(R.left + R.width / 2, R.left + 16, R.right - 16), 24, vw - 24);
    var g;
    if (kind === 'r') g = { px: R.right + GAP, py: cy, ax: R.right, ay: cy };
    else if (kind === 'l') g = { px: R.left - GAP, py: cy, ax: R.left, ay: cy };
    else if (kind === 't') g = { px: ax + (f === 1 ? -32 : 32), py: R.top - 37, ax: ax, ay: R.top };
    else g = { px: ax + (f === 1 ? -32 : 32), py: R.bottom + 32, ax: ax, ay: R.bottom };
    g.x = f === 1 ? g.px - PX : g.px - (W - PX);
    g.y = g.py - PY;
    return g;
  }

  function fits(kind, f, R) {
    var g = geo(kind, f, R);
    var vw = window.innerWidth, vh = window.innerHeight;
    if (g.x - (f === -1 ? HOP : 0) < 8 || g.x + W + (f === 1 ? HOP : 0) > vw - 8 || g.y < 58 || g.y + H > vh - 8) return false;
    var m = 6;
    var apart = g.x + W < R.left - m || g.x > R.right + m || g.y + H < R.top - m || g.y > R.bottom + m;
    return apart;
  }

  function planFor(el) {
    var R = el.getBoundingClientRect();
    var opts = [['r', -1], ['l', 1], ['t', 1], ['t', -1], ['b', 1], ['b', -1]].filter(function (o) {
      return fits(o[0], o[1], R);
    });
    if (!opts.length) return null;
    var o = opts[Math.floor(Math.random() * opts.length)];
    return { el: el, kind: o[0], face: o[1] };
  }

  function pickWidget() {
    var all = Array.prototype.slice.call(document.querySelectorAll(SEL));
    var vis = all.filter(function (el) {
      var r = el.getBoundingClientRect();
      return r.width > 60 && r.height > 24 && r.bottom > 120 && r.top < window.innerHeight - 70;
    });
    var fresh = vis.filter(function (el) { return !visited.has(el); });
    if (!fresh.length) {
      visited.clear();
      fresh = vis.filter(function (el) { return el !== last; });
    }
    for (var i = fresh.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = fresh[i]; fresh[i] = fresh[j]; fresh[j] = t;
    }
    for (var k = 0; k < fresh.length; k++) {
      var pl = planFor(fresh[k]);
      if (pl) return pl;
    }
    return null;
  }

  function drawCable(p, g) {
    var r = portEl.getBoundingClientRect();
    var x1 = r.left + r.width / 2, y1 = r.top + r.height / 2, x2 = g.ax, y2 = g.ay;
    var sag = 26 + Math.abs(x2 - x1) * 0.12;
    var low = Math.max(y1, y2) + sag;
    var d = 'M' + x1.toFixed(1) + ' ' + y1.toFixed(1)
      + ' C' + (x1 + (x2 - x1) * 0.3).toFixed(1) + ' ' + low.toFixed(1)
      + ' ' + (x1 + (x2 - x1) * 0.7).toFixed(1) + ' ' + low.toFixed(1)
      + ' ' + x2.toFixed(1) + ' ' + y2.toFixed(1);
    cable.setAttribute('d', d);
    var len = cable.getTotalLength();
    cable.style.strokeDasharray = len;
    cable.style.strokeDashoffset = len * (1 - p);
    plug.setAttribute('cx', x2);
    plug.setAttribute('cy', y2);
    plug.style.opacity = p > 0.97 ? 1 : 0;
  }
  function clearCable() {
    cable.setAttribute('d', '');
    plug.style.opacity = 0;
  }

  function dock(my, p) {
    return new Promise(function (res) {
      var w = p.el;
      var t0 = null, opened = false, scanning = false;
      var txt = SAYS[Math.floor(Math.random() * SAYS.length)];
      var hx = 0;
      function finish(v) {
        pilot.classList.remove('open', 'out');
        pg.style.transform = '';
        w.classList.remove('scanning');
        say.classList.remove('show');
        clearCable();
        res(v);
      }
      function frame(ts) {
        if (!on || my !== gen) { return finish(false); }
        if (t0 === null) t0 = ts;
        var t = ts - t0;
        var g = geo(p.kind, p.face, w.getBoundingClientRect());
        place(g.x, g.y + Math.sin(ts / 260) * 2.5, 0);
        /* the penguin hops off the rocket, works, then hops back on */
        var lift = 0;
        if (t < 250) hx = 0;
        else if (t < 750) { var a = (t - 250) / 500; hx = HOP * ease(a); lift = Math.sin(a * Math.PI) * 14; }
        else if (t < 4100) hx = HOP;
        else if (t < 4600) { var b = (t - 4100) / 500; hx = HOP * (1 - ease(b)); lift = Math.sin(b * Math.PI) * 14; }
        else hx = 0;
        pg.style.transform = 'translate(' + hx.toFixed(1) + 'px,' + (-lift).toFixed(1) + 'px)';
        var out = t >= 700 && t < 4150;
        if (out !== pilot.classList.contains('out')) pilot.classList.toggle('out', out);
        if (t > 800 && t < 3750 && !opened) { opened = true; pilot.classList.add('open'); }
        if (t >= 3750 && opened) { opened = false; pilot.classList.remove('open'); }
        var cp = 0;
        if (t >= 1150 && t < 1750) cp = (t - 1150) / 600;
        else if (t >= 1750 && t < 3300) cp = 1;
        else if (t >= 3300 && t < 3750) cp = 1 - (t - 3300) / 450;
        if (cp > 0) drawCable(cp, g); else clearCable();
        var sc = t >= 1750 && t < 3300;
        if (sc !== scanning) {
          scanning = sc;
          w.classList.toggle('scanning', sc);
          say.classList.toggle('show', sc);
          if (sc) say.textContent = txt;
        }
        say.style.transform = 'translate3d(' + (pos.x + W / 2 + hx * face) + 'px,' + (pos.y - 6 - lift) + 'px,0) translate(-50%,-100%)';
        if (t < 4750) { requestAnimationFrame(frame); return; }
        finish(true);
      }
      requestAnimationFrame(frame);
    });
  }

  async function inspect(my, p) {
    var w = p.el;
    function target() {
      var g = geo(p.kind, p.face, w.getBoundingClientRect());
      return { x: g.x, y: g.y };
    }
    var arrived = await flyTo(my, target, p.face);
    if (!arrived) return false;
    visited.add(w);
    last = w;
    return await dock(my, p);
  }

  async function run(my) {
    await wait(2600);
    if (my !== gen || !on) return;
    setFace(1);
    place(-W - 20, rnd(120, Math.max(160, window.innerHeight * 0.5)), 0);
    pilot.classList.add('on');
    while (my === gen && on) {
      while (document.hidden) {
        await wait(600);
        if (my !== gen || !on) return;
      }
      var hops = 1 + Math.floor(Math.random() * 2);
      for (var i = 0; i < hops; i++) {
        var pt = randomPoint();
        var ok = await flyTo(my, function () { return pt; });
        if (!ok) return;
        await wait(rnd(150, 500));
        if (my !== gen || !on) return;
      }
      var plan = pickWidget();
      if (!plan) { await wait(800); continue; }
      var done = await inspect(my, plan);
      if (!done) return;
    }
  }

  function stopVisuals() {
    pilot.classList.remove('on', 'open', 'out', 'fly');
    pg.style.transform = '';
    say.classList.remove('show');
    clearCable();
    var s = document.querySelectorAll('.scanning');
    for (var i = 0; i < s.length; i++) s[i].classList.remove('scanning');
  }

  function setOn(v, remember) {
    on = v;
    gen++;
    if (toggle) {
      toggle.textContent = 'penguin: ' + (v ? 'on' : 'off');
      toggle.setAttribute('aria-pressed', v ? 'true' : 'false');
    }
    if (remember) put('pilot', v ? 'on' : 'off');
    if (v) { run(gen).catch(function () {}); } else { stopVisuals(); }
  }

  if (toggle) toggle.addEventListener('click', function () { setOn(!on, true); });
  setOn(get('pilot') !== 'off', false);
})();
