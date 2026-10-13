(function () {
  /* theme is handled in theme.js so it applies before the page paints */
  var tbtn = document.getElementById('theme');
  function label() {
    if (tbtn && window.siteTheme) tbtn.textContent = window.siteTheme.get() === 'light' ? 'dark mode' : 'light mode';
  }
  label();
  if (tbtn) {
    tbtn.addEventListener('click', function () {
      if (!window.siteTheme) return;
      window.siteTheme.set(window.siteTheme.get() === 'light' ? 'dark' : 'light');
      label();
    });
  }

  /* copy buttons */
  var copies = document.querySelectorAll('[data-copy]');
  Array.prototype.forEach.call(copies, function (b) {
    b.addEventListener('click', function () {
      var el = document.querySelector(b.getAttribute('data-copy'));
      if (!el) return;
      function pick() {
        var r = document.createRange();
        r.selectNodeContents(el);
        var s = window.getSelection();
        s.removeAllRanges();
        s.addRange(r);
      }
      function flash(t) {
        var o = b.textContent;
        b.textContent = t;
        setTimeout(function () { b.textContent = o; }, 1600);
      }
      try {
        navigator.clipboard.writeText(el.textContent).then(function () { flash('copied'); }, function () { pick(); flash('selected'); });
      } catch (e) { pick(); flash('selected'); }
    });
  });

  /* the philosophy quote: a button that breaks things, then fixes them */
  var touch = document.getElementById('touch');
  var oops = document.getElementById('oops');
  var fig = document.getElementById('philosophy');
  if (touch && oops && fig) {
    var steps = [
      { say: 'You touched it. It was working five seconds ago.', btn: 'try to fix it', broke: true },
      { say: 'Restoring from backup... (there is a backup, right?)', btn: 'wait for it', broke: true },
      { say: 'Restored. Lesson learned. Until next time.', btn: 'touch it', broke: false }
    ];
    var n = 0;
    touch.addEventListener('click', function () {
      var st = steps[n];
      oops.textContent = st.say;
      touch.textContent = st.btn;
      fig.classList.toggle('broke', st.broke);
      fig.classList.remove('shake');
      void fig.offsetWidth;
      if (n === 0) fig.classList.add('shake');
      n = (n + 1) % steps.length;
    });
  }

  /* skills: a pyramid of seven cards; one opens into a small floating skill network */
  var sk = document.getElementById('explorer');
  if (sk) (function () {
    var NSV = 'http://www.w3.org/2000/svg';
    var ICONS = window.SKILL_ICONS || {};
    var rm = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
    var mqWide = matchMedia('(min-width: 980px)');
    var mqHover = matchMedia('(hover: hover) and (pointer: fine)');
    var pyr = sk.querySelector('.pyr');
    var cards = Array.prototype.slice.call(pyr.querySelectorAll('.pcard'));
    var net = document.getElementById('net');
    var inner = net.querySelector('.net-in');
    var svg = net.querySelector('.net-lines');
    var hub = net.querySelector('.hub');
    var tip = net.querySelector('.tip');
    var closeBtn = net.querySelector('.net-close');
    sk.classList.add('js');

    var active = null, pinned = false, settleUntil = 0;
    var hoverTimer = 0, closeTimer = 0, lastX = -1, lastY = -1, lastPT = 'mouse';

    function wide() { return mqWide.matches; }
    function hoverOK() { return mqHover.matches && wide(); }
    function svgFor(name) {
      return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + (ICONS[name] || ICONS.cloud || '') + '</svg>';
    }
    function card(n) { return cards.filter(function (c) { return +c.getAttribute('data-n') === n; })[0]; }
    function btnOf(c) { return c.querySelector('.pc-btn'); }

    Array.prototype.forEach.call(pyr.querySelectorAll('.pcard .ico'), function (el) {
      el.innerHTML = svgFor(el.getAttribute('data-icon'));
    });

    /* ---- the card layout: wide screens use three columns while open, smaller ones put the map under the card ---- */
    function applyLayout() {
      var open = !!active;
      pyr.classList.toggle('open', open);
      cards.forEach(function (c) {
        c.style.gridColumn = ''; c.style.gridRow = '';
        c.classList.toggle('is-active', c === active);
        c.classList.toggle('is-pinned', c === active && pinned);
        btnOf(c).setAttribute('aria-expanded', c === active ? 'true' : 'false');
      });
      net.style.gridColumn = ''; net.style.gridRow = '';
      net.hidden = !open;
      if (!open) return;
      active.parentNode.insertBefore(net, active.nextSibling);
      if (!wide()) return;
      var n = +active.getAttribute('data-n');
      var left = [2, 4, 6].filter(function (x) { return x !== n; });
      var right = [3, 5, 7].filter(function (x) { return x !== n; });
      if (n !== 1) { if (n % 2 === 0) left.unshift(1); else right.unshift(1); }
      active.style.gridColumn = '2'; active.style.gridRow = '1';
      net.style.gridColumn = '2'; net.style.gridRow = '2 / span 2';
      left.forEach(function (k, i) { var c = card(k); c.style.gridColumn = '1'; c.style.gridRow = String(i + 1); });
      right.forEach(function (k, i) { var c = card(k); c.style.gridColumn = '3'; c.style.gridRow = String(i + 1); });
    }

    /* move the cards with a short slide from where they were to where the new layout puts them */
    function transition(change) {
      var first = cards.map(function (c) { return c.getBoundingClientRect(); });
      cards.forEach(function (c) { if (c._anim) { c._anim.cancel(); c._anim = null; } });
      change();
      if (rm) return;
      cards.forEach(function (c, i) {
        var r = c.getBoundingClientRect();
        var dx = first[i].left - r.left, dy = first[i].top - r.top;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
        c._anim = c.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'none' }],
          { duration: 420, easing: 'cubic-bezier(0.22, 0.7, 0.2, 1)' });
      });
    }

    /* ---- the network ---- */
    var nodes = [], spokes = [], bonds = [], names = [], W = 0, H = 0;
    var tipIdx = -1, tipW = 0, tipH = 0, tipSide = 'up';
    var raf = 0, t0 = 0, px = 0, py = 0, cx = 0, cy = 0;
    var NR = 23, HUBR = 34, KMIN = 0.8, PULSE = 0.05;
    /* layout results, worked out once per size or count change and only read inside the animation loop */
    var P = [], link = [], ringOf = [], ringNext = [], K = 1, AMP = 0, baseH = 0, curH = 0;

    function build(c) {
      stopLoop();
      nodes = []; spokes = []; bonds = []; names = []; tipIdx = -1;
      tip.classList.remove('show');
      Array.prototype.forEach.call(inner.querySelectorAll('.nd'), function (n) { n.remove(); });
      svg.textContent = '';
      hub.innerHTML = svgFor(c.querySelector('.ico').getAttribute('data-icon'));
      var lis = c.querySelectorAll('.cat-skills li');
      var k = lis.length, i, ln;
      for (i = 0; i < k; i++) { ln = document.createElementNS(NSV, 'line'); ln.setAttribute('class', 'bond'); svg.appendChild(ln); bonds.push(ln); }
      for (i = 0; i < k; i++) { ln = document.createElementNS(NSV, 'line'); ln.setAttribute('class', 'spoke'); svg.appendChild(ln); spokes.push(ln); }
      Array.prototype.forEach.call(lis, function (li, j) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'nd';
        b.setAttribute('data-i', j);
        b.setAttribute('aria-label', li.textContent);
        b.innerHTML = svgFor(li.getAttribute('data-icon'));
        inner.appendChild(b);
        nodes.push(b);
        names.push(li.textContent);
      });
      /* a fixed motion profile per node (period, direction, phase), so nothing is random between frames */
      P = nodes.map(function (_, i) {
        return {
          fx: 0.30 + ((i * 7) % 5) * 0.07, fy: 0.26 + ((i * 3) % 4) * 0.08,
          px: i * 1.7, py: i * 2.3,
          fa: 0.7 + ((i * 5) % 4) * 0.1,
          fp: 2 * Math.PI / (5 + ((i * 3) % 5) * 1.1), pp: i * 2.1
        };
      });
      baseH = 0; net.style.removeProperty('--nh');
      measure();
      draw(0);
      if (!rm) startLoop();
    }

    /* points spread evenly by distance along an ellipse (equal angles would crowd the flat ends) */
    function ringPoints(m, rx, ry, phase) {
      var N = 240, acc = [0], i, a, x0 = 0, y0 = 0, out = [];
      for (i = 0; i <= N; i++) {
        a = i / N * 2 * Math.PI;
        var x = Math.cos(a) * rx, y = Math.sin(a) * ry;
        if (i) acc.push(acc[i - 1] + Math.hypot(x - x0, y - y0));
        x0 = x; y0 = y;
      }
      var total = acc[N], j = 0;
      for (i = 0; i < m; i++) {
        var d = ((i / m + phase) % 1) * total;
        while (j < N && acc[j + 1] < d) j++;
        if (d < acc[j]) j = 0, (function () { while (j < N && acc[j + 1] < d) j++; })();
        var f = (d - acc[j]) / ((acc[j + 1] - acc[j]) || 1);
        a = (j + f) / N * 2 * Math.PI - Math.PI / 2;
        out.push([Math.cos(a) * rx, Math.sin(a) * ry]);
      }
      return out;
    }

    function minGap(pts) {
      var m = Infinity, i, j;
      for (i = 0; i < pts.length; i++) {
        m = Math.min(m, Math.hypot(pts[i][0], pts[i][1]) - HUBR);
        for (j = i + 1; j < pts.length; j++) m = Math.min(m, Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]));
      }
      return m;
    }

    /* choose rings, node size and drift range for this count and panel size; true when everything fits at a good size */
    function layout() {
      var n = nodes.length, two = n > 8, best = null, ok = false;
      for (var k = 1; k >= KMIN - 0.001 && !ok; k -= 0.05) {
        var r = NR * k * (1 + PULSE);
        var mg = r + 10, rx = W / 2 - mg, ry = H / 2 - mg;
        if (rx < 20 || ry < 20) continue;
        var cands = [];
        if (!two) {
          cands.push({ pts: ringPoints(n, Math.min(185, rx), Math.min(150, ry), 0), ni: 0 });
        } else {
          var ni = Math.max(3, Math.round(n * 0.42)), no = n - ni;
          for (var q = 0.42; q <= 0.66; q += 0.03) {
            var irx = rx * q, iry = ry * q;
            if (Math.min(irx, iry) < HUBR + r + 6) continue;
            cands.push({ pts: ringPoints(ni, irx, iry, 0).concat(ringPoints(no, rx, ry, 0.5 / no)), ni: ni });
          }
        }
        var kBest = null;
        cands.forEach(function (c) { c.gap = minGap(c.pts) - 2 * r; c.k = k; if (!kBest || c.gap > kBest.gap) kBest = c; });
        if (!kBest) continue;
        if (!best || kBest.gap >= 12 || kBest.k === KMIN || kBest.gap > best.gap) best = kBest;
        /* need real spare room for drift: about 4px each way plus a small margin */
        if (kBest.gap >= 12) ok = true;
      }
      if (!best) return true;
      K = best.k;
      AMP = rm ? 0 : Math.max(0, Math.min(6, (best.gap - 5) / 3.1));
      /* inner nodes connect to the hub; outer nodes connect to the nearest inner node, so no line runs through another node */
      var ni2 = best.ni, i, j;
      for (i = 0; i < n; i++) {
        P[i].bx = best.pts[i][0]; P[i].by = best.pts[i][1];
        var outer = ni2 && i >= ni2;
        ringOf[i] = outer ? 1 : 0;
        link[i] = -1;
        if (outer) {
          var bd = Infinity;
          for (j = 0; j < ni2; j++) {
            var d = Math.hypot(best.pts[i][0] - best.pts[j][0], best.pts[i][1] - best.pts[j][1]);
            if (d < bd) { bd = d; link[i] = j; }
          }
        }
        var lo = outer ? ni2 : 0, hi = outer ? n : (ni2 || n);
        ringNext[i] = hi - lo > 2 ? (i + 1 < hi ? i + 1 : lo) : -1;
      }
      return best.gap >= 12;
    }

    function measure() {
      W = inner.clientWidth; H = inner.clientHeight;
      if (!W || !H || !nodes.length) return;
      if (!baseH) baseH = curH = H;
      var fit = layout();
      /* on narrow layouts the panel may grow a little (never past 460px) when the count needs it; wide layouts keep their set height */
      while (!fit && !wide() && curH < 460) {
        curH += 30; net.style.setProperty('--nh', curH + 'px');
        W = inner.clientWidth; H = inner.clientHeight;
        fit = layout();
      }
      svg.setAttribute('viewBox', '0 0 ' + (W || 1) + ' ' + (H || 1));
      pickTip();
    }

    /* every node floats on its own slow loop around its place, breathes a little, and the lines are redrawn from the same numbers */
    function draw(t) {
      if (!W || !H || !nodes.length || !P.length || P[0].bx === undefined) return;
      var n = nodes.length, hx = W / 2, hy = H / 2, i;
      var mo = rm ? 0 : 1, kx = cx * 4, ky = cy * 4;
      if (!draw.pts || draw.pts.length !== n) draw.pts = [];
      var pts = draw.pts;
      for (i = 0; i < n; i++) {
        var p = P[i], depth = ringOf[i] ? 0.6 : 1;
        var X = hx + p.bx + mo * (AMP * p.fa * Math.sin(t * p.fx + p.px) + kx * depth);
        var Y = hy + p.by + mo * (AMP * p.fa * Math.cos(t * p.fy + p.py) + ky * depth);
        var sc = K * (1 + mo * PULSE * (0.5 + 0.5 * Math.sin(t * p.fp + p.pp)));
        pts[i] = [X, Y];
        nodes[i].style.transform = 'translate(' + (X - NR).toFixed(1) + 'px,' + (Y - NR).toFixed(1) + 'px) scale(' + sc.toFixed(3) + ')';
      }
      for (i = 0; i < n; i++) {
        var from = link[i] >= 0 ? pts[link[i]] : null, s = spokes[i];
        s.setAttribute('x1', (from ? from[0] : hx).toFixed(1)); s.setAttribute('y1', (from ? from[1] : hy).toFixed(1));
        s.setAttribute('x2', pts[i][0].toFixed(1)); s.setAttribute('y2', pts[i][1].toFixed(1));
        var q = ringNext[i] >= 0 ? pts[ringNext[i]] : null, b = bonds[i];
        if (q) {
          b.setAttribute('x1', pts[i][0].toFixed(1)); b.setAttribute('y1', pts[i][1].toFixed(1));
          b.setAttribute('x2', q[0].toFixed(1)); b.setAttribute('y2', q[1].toFixed(1));
        }
      }
      if (tipIdx >= 0 && pts[tipIdx]) placeTip(pts[tipIdx]);
    }

    /* the label goes on whichever side of its node covers the fewest other nodes and stays inside the panel */
    function tipBox(p, side) {
      var g = NR * K + 8, x, y;
      if (side === 'up') { x = p[0] - tipW / 2; y = p[1] - g - tipH; }
      else if (side === 'down') { x = p[0] - tipW / 2; y = p[1] + g; }
      else if (side === 'right') { x = p[0] + g; y = p[1] - tipH / 2; }
      else if (side === 'left') { x = p[0] - g - tipW; y = p[1] - tipH / 2; }
      else { var h = NR * K * 0.5; x = side.charAt(1) === 'l' ? p[0] - tipW + h : p[0] - h; y = side.charAt(0) === 'u' ? p[1] - g - tipH : p[1] + g; }
      return [Math.max(6, Math.min(W - tipW - 6, x)), Math.max(6, Math.min(H - tipH - 6, y))];
    }
    function pickTip() {
      if (tipIdx < 0 || !P[tipIdx] || P[tipIdx].bx === undefined) return;
      var c = [W / 2 + P[tipIdx].bx, H / 2 + P[tipIdx].by], bestS = 'up', bestV = Infinity;
      ['up', 'down', 'right', 'left', 'ul', 'ur', 'dl', 'dr'].forEach(function (s) {
        var b = tipBox(c, s), v = 0, raw;
        for (var j = 0; j < nodes.length; j++) {
          if (j === tipIdx) continue;
          var o = [W / 2 + P[j].bx, H / 2 + P[j].by], rr = NR * K * 1.1 + 2;
          var ox = Math.max(0, Math.min(b[0] + tipW, o[0] + rr) - Math.max(b[0], o[0] - rr));
          var oy = Math.max(0, Math.min(b[1] + tipH, o[1] + rr) - Math.max(b[1], o[1] - rr));
          v += ox * oy;
        }
        /* the clamped box may have slid onto its own node: count that too */
        var sx = Math.max(0, Math.min(b[0] + tipW, c[0] + NR * K) - Math.max(b[0], c[0] - NR * K));
        var sy = Math.max(0, Math.min(b[1] + tipH, c[1] + NR * K) - Math.max(b[1], c[1] - NR * K));
        v += sx * sy * 4;
        if (v < bestV - 0.5) { bestV = v; bestS = s; }
      });
      tipSide = bestS;
    }

    function placeTip(p) {
      var b = tipBox(p, tipSide);
      tip.style.transform = 'translate(' + b[0].toFixed(1) + 'px,' + b[1].toFixed(1) + 'px)';
    }

    function showTip(i) {
      if (i === tipIdx) return;
      tipIdx = i;
      nodes.forEach(function (n, j) { n.classList.toggle('on', j === i); });
      spokes.forEach(function (l, j) { l.classList.toggle('on', j === i); });
      if (i < 0) { tip.classList.remove('show'); return; }
      tip.textContent = names[i];
      tipW = tip.offsetWidth; tipH = tip.offsetHeight;
      pickTip();
      tip.classList.add('show');
      draw((performance.now() - t0) / 1000);
    }

    function frame(now) {
      raf = requestAnimationFrame(frame);
      cx += (px - cx) * 0.06; cy += (py - cy) * 0.06;
      draw((now - t0) / 1000);
    }
    function startLoop() { if (!raf && !rm) { t0 = performance.now(); raf = requestAnimationFrame(frame); } }
    function stopLoop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }

    inner.addEventListener('pointermove', function (e) {
      if (rm || e.pointerType !== 'mouse') return;
      var r = inner.getBoundingClientRect();
      px = Math.max(-1, Math.min(1, (e.clientX - r.left) / r.width * 2 - 1));
      py = Math.max(-1, Math.min(1, (e.clientY - r.top) / r.height * 2 - 1));
    });
    inner.addEventListener('pointerleave', function () { px = 0; py = 0; });
    var downIdx = -1;
    inner.addEventListener('pointerdown', function (e) {
      lastPT = e.pointerType;
      downIdx = tipIdx;
    });
    inner.addEventListener('pointerover', function (e) {
      var nd = e.target.closest && e.target.closest('.nd');
      if (nd && e.pointerType === 'mouse') showTip(+nd.getAttribute('data-i'));
    });
    inner.addEventListener('pointerout', function (e) {
      var nd = e.target.closest && e.target.closest('.nd');
      if (nd && e.pointerType === 'mouse' && document.activeElement !== nd) showTip(-1);
    });
    inner.addEventListener('focusin', function (e) {
      var nd = e.target.closest && e.target.closest('.nd');
      if (nd) showTip(+nd.getAttribute('data-i'));
    });
    inner.addEventListener('focusout', function (e) {
      var nd = e.target.closest && e.target.closest('.nd');
      if (nd) showTip(-1);
    });
    inner.addEventListener('click', function (e) {
      var nd = e.target.closest && e.target.closest('.nd');
      if (!nd) { showTip(-1); return; }
      if (lastPT === 'touch' || lastPT === 'pen') {
        var i = +nd.getAttribute('data-i');
        showTip(downIdx === i ? -1 : i);
      }
    });

    if (window.ResizeObserver) new ResizeObserver(function () { if (active) { measure(); draw((performance.now() - t0) / 1000); } }).observe(inner);
    else window.addEventListener('resize', function () { if (active) { measure(); draw(0); } });

    /* ---- opening and closing ---- */
    function open(c, pin) {
      clearTimeout(hoverTimer); clearTimeout(closeTimer);
      if (active === c) {
        if (pin && !pinned) { pinned = true; c.classList.add('is-pinned'); }
        return;
      }
      transition(function () { active = c; pinned = !!pin; applyLayout(); });
      settleUntil = Date.now() + 700;
      build(c);
      if (!wide()) requestAnimationFrame(function () {
        net.scrollIntoView({ block: 'nearest', behavior: rm ? 'auto' : 'smooth' });
      });
    }
    function close(refocus) {
      clearTimeout(hoverTimer); clearTimeout(closeTimer);
      if (!active) return;
      var was = active;
      stopLoop(); showTip(-1);
      transition(function () { active = null; pinned = false; applyLayout(); });
      if (refocus) btnOf(was).focus();
    }

    cards.forEach(function (c) {
      btnOf(c).addEventListener('click', function () {
        if (active === c) { if (pinned) close(false); else open(c, true); }
        else open(c, true);
      });
    });
    closeBtn.addEventListener('click', function () { close(true); });
    sk.addEventListener('keydown', function (e) { if (e.key === 'Escape' && active) { e.preventDefault(); close(true); } });

    /* ---- hover on desktop: open on a real mouse move, keep open while the pointer is over the card or its network ---- */
    function inRegion(x, y) {
      var a = active.getBoundingClientRect(), b = net.getBoundingClientRect(), p = 12;
      var l = Math.min(a.left, b.left) - p, r = Math.max(a.right, b.right) + p;
      var t = Math.min(a.top, b.top) - p, bt = Math.max(a.bottom, b.bottom) + p;
      return x >= l && x <= r && y >= t && y <= bt;
    }
    function cardAt(x, y) {
      var el = document.elementFromPoint(x, y);
      return el && el.closest ? el.closest('.pcard') : null;
    }
    pyr.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse' || !hoverOK() || (!e.movementX && !e.movementY)) return;
      lastX = e.clientX; lastY = e.clientY;
      if (pinned) return;
      var c = e.target.closest ? e.target.closest('.pcard') : null;
      if (active && inRegion(lastX, lastY)) { clearTimeout(hoverTimer); clearTimeout(closeTimer); return; }
      if (c && c !== active) {
        clearTimeout(closeTimer);
        if (active && Date.now() < settleUntil) return;
        clearTimeout(hoverTimer);
        hoverTimer = setTimeout(function () {
          if (!pinned && cardAt(lastX, lastY) === c) open(c, false);
        }, active ? 220 : 80);
      } else if (active) {
        clearTimeout(hoverTimer);
        clearTimeout(closeTimer);
        closeTimer = setTimeout(function () {
          if (!pinned && active && !inRegion(lastX, lastY)) close(false);
        }, 260);
      } else {
        clearTimeout(hoverTimer);
      }
    });
    pyr.addEventListener('pointerleave', function (e) {
      if (e.pointerType !== 'mouse' || !hoverOK()) return;
      lastX = e.clientX; lastY = e.clientY;
      clearTimeout(hoverTimer);
      if (active && !pinned) {
        clearTimeout(closeTimer);
        closeTimer = setTimeout(function () { if (!pinned && active && !inRegion(lastX, lastY)) close(false); }, 260);
      }
    });

    var onMq = function () { if (active) { transition(applyLayout); measure(); draw(0); } };
    if (mqWide.addEventListener) mqWide.addEventListener('change', onMq); else mqWide.addListener(onMq);
  })();

  /* resume: the file path lives in data-resume on #resume. Empty means "not added yet", so both buttons stay in their coming-soon state */
  (function () {
    var sec = document.getElementById('resume');
    if (!sec) return;
    var prev = document.getElementById('res-preview'), dl = document.getElementById('res-download');
    var dlg = document.getElementById('res-dialog'), view = document.getElementById('res-view');
    var openA = document.getElementById('res-open'), dl2 = document.getElementById('res-dl2'), closeB = document.getElementById('res-close');
    var note = document.getElementById('res-note'), led = document.getElementById('res-led'), st = document.getElementById('res-status');
    var stamp = document.getElementById('res-stamp'), doc = document.getElementById('res-doc');
    var url = (sec.getAttribute('data-resume') || '').trim();
    var name = sec.getAttribute('data-resume-name') || 'Resume.pdf';
    var ready = false, lastFocus = null;

    function setReady() {
      ready = true;
      [prev, dl].forEach(function (b) { b.removeAttribute('aria-disabled'); });
      dl.setAttribute('href', url); dl.setAttribute('download', name); dl.removeAttribute('role'); dl.removeAttribute('tabindex');
      openA.setAttribute('href', url); dl2.setAttribute('href', url); dl2.setAttribute('download', name);
      led.classList.remove('off'); st.textContent = 'ready';
      stamp.textContent = 'ready'; doc.classList.add('ready');
      note.textContent = 'Preview opens it here. Download saves it as ' + name + '.';
    }
    /* switch on only when a path is set and the file is really there (a missing file answers 404; an unreachable check, such as opening from disk, is trusted) */
    if (url) {
      if (window.fetch) {
        fetch(url, { method: 'HEAD' }).then(function (r) { if (r.ok) setReady(); }, setReady);
      } else setReady();
    }

    function openPreview() {
      if (!ready) return;
      if (!dlg || typeof dlg.showModal !== 'function') { window.open(url, '_blank', 'noopener'); return; }
      lastFocus = document.activeElement;
      view.textContent = '';
      if (navigator.pdfViewerEnabled === false) {
        var fb = document.createElement('div'); fb.className = 'res-fallback';
        fb.innerHTML = '<p>This browser cannot show a PDF inside the page.</p><p>Open it in a new tab or download it instead.</p>';
        view.appendChild(fb);
      } else {
        var fr = document.createElement('iframe');
        fr.title = 'Resume preview'; fr.src = url;
        view.appendChild(fr);
      }
      document.documentElement.classList.add('modal-open');
      dlg.showModal();
      closeB.focus();
    }
    prev.addEventListener('click', function (e) { e.preventDefault(); openPreview(); });
    dl.addEventListener('click', function (e) { if (!ready) e.preventDefault(); });
    dl.addEventListener('keydown', function (e) { if (!ready && (e.key === 'Enter' || e.key === ' ')) e.preventDefault(); });
    if (dlg) {
      closeB.addEventListener('click', function () { dlg.close(); });
      /* a click on the dimmed backdrop (the dialog element itself) closes it */
      dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
      dlg.addEventListener('close', function () {
        view.textContent = '';
        document.documentElement.classList.remove('modal-open');
        if (lastFocus && lastFocus.focus) lastFocus.focus();
      });
    }
  })();

  /* one long page: smooth scrolling between sections, active nav link */
  var onHome = !!document.getElementById('home');
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var navLinks = document.querySelectorAll('.nav a');
  function secOf(href) {
    var m = /^index\.html#([\w-]+)/.exec(href || '');
    return m ? m[1] : '';
  }
  function mark(id) {
    Array.prototype.forEach.call(navLinks, function (l) {
      if (secOf(l.getAttribute('href')) === id) l.setAttribute('aria-current', 'page');
      else l.removeAttribute('aria-current');
    });
    var on = document.querySelector('.nav a[aria-current]');
    var nv = on && on.parentNode;
    if (nv && nv.scrollWidth > nv.clientWidth + 1) nv.scrollLeft = on.offsetLeft - (nv.clientWidth - on.offsetWidth) / 2;
  }
  /* keep the section offset equal to the real height of the sticky header */
  function sizeHeader() {
    var h = document.querySelector('.top');
    if (h) document.documentElement.style.setProperty('--hdr', h.offsetHeight + 'px');
  }
  sizeHeader();
  window.addEventListener('resize', sizeHeader);
  window.addEventListener('load', sizeHeader);
  function goTo(id, smooth) {
    var el = document.getElementById(id);
    if (!el) return false;
    el.scrollIntoView({ behavior: smooth && !reduce ? 'smooth' : 'auto', block: 'start' });
    mark(id);
    return true;
  }
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var id = secOf(a.getAttribute('href'));
    if (!id) return;
    if (onHome) {
      if (!goTo(id, true)) return;
      e.preventDefault();
      try { history.replaceState(null, '', '#' + id + '~' + window.siteTheme.get()); } catch (x) {}
    } else {
      try { sessionStorage.setItem('goto', id); } catch (x) {}
    }
  });
  if (onHome) {
    var want = (window.siteTheme ? window.siteTheme.parts(location.hash).sec : '');
    try { if (!want) want = sessionStorage.getItem('goto') || ''; sessionStorage.removeItem('goto'); } catch (x) {}
    if (want && document.getElementById(want)) {
      goTo(want, false);
      var y0 = window.pageYOffset;
      window.addEventListener('load', function () {
        if (Math.abs(window.pageYOffset - y0) < 4) goTo(want, false);
      });
    }
    var parts = Array.prototype.slice.call(document.querySelectorAll('.part'));
    var ticking = false;
    function spy() {
      ticking = false;
      var cur = parts[0].id;
      var line = window.innerHeight * 0.4;
      parts.forEach(function (p) { if (p.getBoundingClientRect().top <= line) cur = p.id; });
      if (window.innerHeight + window.pageYOffset >= document.documentElement.scrollHeight - 4) cur = parts[parts.length - 1].id;
      mark(cur);
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(spy); } }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    spy();
  }

  /* terminal on the home page */
  var out = document.getElementById('out');
  var form = document.getElementById('form');
  var input = document.getElementById('cmd');
  if (!out || !form || !input) return;

  function add(cls, parts) {
    var d = document.createElement('div');
    d.className = cls;
    parts.forEach(function (p) {
      if (typeof p === 'string') {
        d.appendChild(document.createTextNode(p));
      } else if (p.href) {
        var a = document.createElement('a');
        a.href = p.href; if (/^https?:/.test(p.href)) { a.target = '_blank'; a.rel = 'noopener'; }
        a.textContent = p.text;
        d.appendChild(a);
      } else {
        var s = document.createElement('span');
        s.className = p.cls;
        s.textContent = p.text;
        d.appendChild(s);
      }
    });
    out.appendChild(d);
    out.scrollTop = out.scrollHeight;
  }

  var C = {
    help: function () {
      return [
        'Commands:',
        '  whoami       who I am',
        '  skills       what I work with, and how well',
        '  experience   where I have worked',
        '  resume       my resume',
        '  contact      how to reach me',
        '  location     where I am based',
        '  ls           list the pages',
        '  clear        clear the screen'
      ];
    },
    whoami: function () { return ['Ajas Muhammed, IT Specialist and Systems Administrator.']; },
    skills: function () {
      return [
        'daily      systems and servers, networking and firewalls, documentation',
        'working    endpoints and assets, security, monitoring, phone and attendance systems',
        'learning   cloud (AWS), AI tools'
      ];
    },
    experience: function () {
      return [
        [{ text: 'Skolte Solutions', href: 'skolte.html' }, '   IT Specialist, 2026 to now'],
        [{ text: 'WebCastle and Zoople', href: 'webcastle.html' }, '   Senior IT Administrator, 2025 to 2026'],
        [{ text: 'HashRoot', href: 'hashroot.html' }, '   Junior Server Administrator (intern), 2024'],
        [{ text: 'Aabasoft Technologies', href: 'aabasoft.html' }, '   Technical Support Officer, 2023 to 2024']
      ];
    },
    contact: function () {
      return [
        'email     ajasm397@gmail.com',
        [ 'linkedin   ', { text: 'LinkedIn', href: 'https://www.linkedin.com/in/ajas-muhammed-pa-1413881bb' } ],
        [ 'instagram  ', { text: 'Instagram', href: 'https://www.instagram.com/_ajs.z_/' } ],
        [{ text: 'Open the contact page', href: 'index.html#contact' }]
      ];
    },
    resume: function () {
      return [
        'Ajas-Muhammed-Resume.pdf',
        [{ text: 'Open the resume section', href: 'index.html#resume' }]
      ];
    },
    location: function () { return ['Kochi, Kerala, India']; },
    ls: function () {
      return [
        [{ text: 'about/', href: 'index.html#about' }, '  ', { text: 'experience/', href: 'index.html#experience' }, '  ', { text: 'skills/', href: 'index.html#skills' }, '  ', { text: 'resume/', href: 'index.html#resume' }, '  ', { text: 'contact/', href: 'index.html#contact' }],
        'case-studies/  (in progress)'
      ];
    }
  };

  var hist = [];
  var hi = 0;

  function run(raw) {
    var cmd = raw.trim();
    if (!cmd) return;
    hist.push(cmd);
    hi = hist.length;
    add('line', [{ cls: 'ps', text: '$ ' }, cmd]);
    var key = cmd.toLowerCase();
    if (key === 'clear') { out.innerHTML = ''; return; }
    if (C.hasOwnProperty(key)) {
      C[key]().forEach(function (ln) { add('res', Array.isArray(ln) ? ln : [ln]); });
    } else {
      add('res', ['command not found: ' + cmd + '. Type help to see the commands.']);
    }
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    run(input.value);
    input.value = '';
  });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowUp' && hist.length) {
      e.preventDefault();
      hi = Math.max(0, hi - 1);
      input.value = hist[hi];
    } else if (e.key === 'ArrowDown' && hist.length) {
      e.preventDefault();
      hi = Math.min(hist.length, hi + 1);
      input.value = hi === hist.length ? '' : hist[hi];
    }
  });
  var chips = document.querySelectorAll('[data-run]');
  Array.prototype.forEach.call(chips, function (b) {
    b.addEventListener('click', function () { run(b.getAttribute('data-run')); });
  });
})();
