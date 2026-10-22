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
      function swap() { window.siteTheme.set(window.siteTheme.get() === 'light' ? 'dark' : 'light'); label(); }
      /* a circular wipe from the button where the browser supports view transitions */
      if (document.startViewTransition && !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) {
        var r = tbtn.getBoundingClientRect(), st = document.documentElement.style;
        st.setProperty('--wx', (r.left + r.width / 2) + 'px'); st.setProperty('--wy', (r.top + r.height / 2) + 'px');
        try { var de = document.documentElement; de.classList.add('vt-theme'); var vt = document.startViewTransition(swap); vt.finished.then(function () { de.classList.remove('vt-theme'); }, function () { de.classList.remove('vt-theme'); }); return; } catch (e) { document.documentElement.classList.remove('vt-theme'); }
      }
      swap();
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

  /* the philosophy card: touching the card breaks things, then fixes them */
  var oops = document.getElementById('oops');
  var hint = document.getElementById('hint');
  var fig = document.getElementById('philosophy');
  if (oops && fig) {
    var steps = [
      { say: 'You touched it. It was working five seconds ago.', broke: true },
      { say: 'Restoring from backup... (there is a backup, right?)', broke: true },
      { say: 'Restored. Lesson learned. Until next time.', broke: false }
    ];
    var n = 0;
    var poke = function () {
      var st = steps[n];
      oops.textContent = st.say;
      if (hint) hint.hidden = true;
      fig.classList.toggle('broke', st.broke);
      fig.classList.remove('shake');
      void fig.offsetWidth;
      if (n === 0) fig.classList.add('shake');
      n = (n + 1) % steps.length;
    };
    fig.addEventListener('click', poke);
    fig.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); poke(); }
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

  /* company page stories: click toggles a card, scrolling reveals them one after another */
  (function () {
    var cs = document.querySelectorAll('[data-story]');
    if (!cs.length) return;
    Array.prototype.forEach.call(cs, function (c) {
      var b = c.querySelector('.story-h');
      b.addEventListener('click', function () {
        var on = !c.classList.contains('open');
        c.classList.toggle('open', on);
        b.setAttribute('aria-expanded', on ? 'true' : 'false');
      });
    });
    var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (calm || !('IntersectionObserver' in window)) return;
    document.documentElement.classList.add('js-reveal');
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        io.unobserve(e.target);
      });
    }, { threshold: 0.2 });
    Array.prototype.forEach.call(cs, function (c, i) { c.style.setProperty('--d', (i * 0.12) + 's'); io.observe(c); });
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
  var lastMark = '';
  function mark(id) {
    if (id && id !== lastMark) { lastMark = id; document.dispatchEvent(new CustomEvent('sec', { detail: id })); }
    Array.prototype.forEach.call(navLinks, function (l) {
      if (secOf(l.getAttribute('href')) === id) l.setAttribute('aria-current', 'page');
      else l.removeAttribute('aria-current');
    });
    var ddb = document.querySelector('.dd-b');
    if (ddb) {
      if (/^(fixit|lab|docs)$/.test(id)) ddb.setAttribute('aria-current', 'page'); else ddb.removeAttribute('aria-current');
    }
    var cta = document.querySelector('.nav .cta');
    if (cta && id === 'resume') cta.setAttribute('aria-current', 'page');
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
    d.className = cls + (cls === 'res' && parts.length === 1 && typeof parts[0] === 'string' && /^[A-Z][A-Za-z ]*:$/.test(parts[0]) ? ' hd' : '');
    var row = cls === 'res' && parts.length === 1 && typeof parts[0] === 'string' && /^  ([a-z][^ ]*(?: <[a-z]+>)?) {2,}(\S.*)$/.exec(parts[0]);
    if (row) {
      var cm = document.createElement('span'); cm.className = 'cm'; cm.textContent = row[1];
      d.appendChild(cm); d.appendChild(document.createTextNode(row[2])); d.classList.add('row');
      out.appendChild(d); out.scrollTop = out.scrollHeight; return;
    }
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
        'About me:',
        '  whoami      who I am',
        '  skills      what I work with',
        '  experience  where I have worked',
        '  resume      the PDF',
        '  contact     reach me',
        'Look around:',
        '  ls          list the sections',
        '  cd <place>  jump to a section',
        '  cat <file>  read a file',
        'System:',
        '  neofetch    system info',
        '  ping        check the network',
        '  date        also uname, uptime, ifconfig',
        'Fun:',
        '  tetris      play Tetris',
        '  packet      call Packet',
        '  theme       dark or light',
        '  fortune     random wisdom',
        '  palette     press / or Ctrl+K',
        '  clear       wipe the screen (Tab completes)'
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
        [{ text: 'fixit/', href: 'index.html#fixit' }, '  ', { text: 'lab/', href: 'index.html#lab' }, '  ', { text: 'docs/', href: 'index.html#docs' }]
      ];
    },
    pwd: function () { return ['/home/ajas']; },
    hostname: function () { return ['kochi']; },
    id: function () { return ['uid=1000(ajas) gid=1000(ajas) groups=1000(ajas),27(sudo),999(coffee)']; },
    date: function () { return [new Date().toString()]; },
    uname: function () { return ['Linux kochi 6.1.0-packet #1 SMP x86_64 GNU/Linux']; },
    uptime: function () { return ['up since June 2023, 3 jobs, load average: 0.42, 0.37, 0.31', 'no reboots without a change window.']; },
    ifconfig: function () {
      return ['eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500', '      inet 192.168.1.10  netmask 255.255.255.0  broadcast 192.168.1.255', '      status: connected, firewall: on, VPN: ready'];
    },
    neofetch: function () {
      var art = ['   .--.', '  |o_o |', '  |:_/ |', ' //   \\ \\', '(|     | )', "/'\\_   _/'\\", '\\___)=(___/'];
      var info = ['ajas@kochi', '---------', 'OS: Windows, Linux, macOS', 'Role: IT Specialist', 'Shell: bash, PowerShell', 'Uptime: since 2023', 'Mascot: Packet the penguin'];
      return art.map(function (a, n) { return (a + '            ').slice(0, 13) + info[n]; });
    },
    fortune: function () {
      return [pick(['Have you tried turning it off and on again?', 'It is always DNS. Except when it is the cable.', 'Back up before you fix it. Always.', 'The best outage is the one users never notice.', 'Document it now, thank yourself at 2 a.m.', 'A reboot fixes everything except understanding.'])];
    },
    theme: function () { var b = document.getElementById('theme'); if (b) b.click(); return ['Theme switched.']; },
    packet: function () { var b = document.querySelector('.pk-call'); if (b && !b.hidden && b.offsetParent) { setTimeout(function () { b.click(); }, 250); return ['Calling Packet...']; } return ['Packet is off. Turn him on with the packet button up top.']; },
    history: function () { return hist.length ? hist.map(function (h, n) { return '  ' + (n + 1) + '  ' + h; }) : ['(empty)']; },
    palette: function () { setTimeout(function () { document.dispatchEvent(new KeyboardEvent('keydown', { key: '/', bubbles: true })); }, 60); return ['Opening the command palette. Press / or Ctrl+K any time.']; },
    tetris: function () { return startGame(); },
    play: function () { return startGame(); },
    exit: function () { return ['There is no escape. Try the Contact button instead.']; },
    rm: function () { return ['rm: permission denied. Packet guards this server.']; },
    sudo: function () { return ['ajas is not in the sudoers file. This incident will be reported.']; }
  };
  C.ls = (function (old) { return function () { var r = old(); r.splice(1, 0, 'summary.txt  skills.txt  about.txt  readme.md'); return r; }; })(C.ls);
  var FILES = {
    'summary.txt': ['Working in IT since 2023. From the support desk to systems administration: networks, servers, endpoints, backups and monitoring.'],
    'skills.txt': null, 'about.txt': ['IT specialist based in Kochi. I look after the networks, servers, devices and accounts that keep an office running, across Windows, Linux and macOS.'],
    'readme.md': ['This is a portfolio built as a network. Poke around: try tetris, or call Packet.']
  };
  var PLACES = ['home', 'about', 'experience', 'skills', 'roadmap', 'fixit', 'lab', 'docs', 'resume', 'contact'];
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function goTo(p) { var t = document.getElementById(p); if (t) t.scrollIntoView({ behavior: 'smooth' }); }
  var ARGS = {
    echo: function (a) { return [a.join(' ')]; },
    cat: function (a) {
      if (!a.length) return ['cat: missing file. Try cat summary.txt'];
      var f = a[0].toLowerCase();
      if (f === 'skills.txt') return C.skills();
      return FILES.hasOwnProperty(f) ? FILES[f] : ['cat: ' + a[0] + ': No such file'];
    },
    cd: function (a) {
      var p = (a[0] || '~').replace(/\/$/, '').toLowerCase();
      if (p === '~' || p === '..' || p === '') { goTo('home'); return []; }
      if (p === 'fix-it' || p === 'fix') p = 'fixit';
      if (PLACES.indexOf(p) < 0) return ['cd: ' + a[0] + ': No such directory. Try ls'];
      goTo(p); return ['Heading to ' + p + '...'];
    },
    open: function (a) { return ARGS.cd(a); },
    ping: function (a) {
      var h = a[0] || 'ajasmhd.in', r = [];
      r.push('PING ' + h + ' 56 bytes of data');
      for (var i = 0; i < 4; i++) r.push('64 bytes from ' + h + ': icmp_seq=' + (i + 1) + ' ttl=58 time=' + (8 + Math.random() * 9).toFixed(1) + ' ms');
      r.push('4 packets sent, 4 received, 0% loss');
      r.slow = true; return r;
    },
    man: function (a) { return [a.length ? 'No manual entry for ' + a[0] + '. Try help.' : 'What manual page do you want?']; }
  };
  function startGame() {
    if (!window.Tetris) return ['The game did not load. Try reloading.'];
    var term = document.getElementById('term');
    form.hidden = true;
    window.Tetris.start(term, function (sc) {
      form.hidden = false; input.focus({ preventScroll: true });
      add('res', ['tetris: final score ' + (sc || 0) + '. Type tetris to play again.']);
    });
    return ['Starting tetris... arrows to move, up to rotate, space to slam, Q to quit.'];
  }

  var hist = [];
  var hi = 0;
  /* ghost suggestion: the rest of a matching earlier command or command name, in grey; Right arrow accepts */
  var gw = document.createElement('div'); gw.className = 'gw'; input.parentNode.insertBefore(gw, input); gw.appendChild(input);
  var gh = document.createElement('span'); gh.className = 'ghost'; gh.setAttribute('aria-hidden', 'true'); gw.insertBefore(gh, input);
  function suggest() {
    var v = input.value, low = v.toLowerCase(), best = '', i;
    if (v) {
      for (i = hist.length - 1; i >= 0; i--) if (hist[i].length > v.length && hist[i].toLowerCase().indexOf(low) === 0) { best = hist[i]; break; }
      if (!best && v.indexOf(' ') < 0) {
        var names = Object.keys(C).concat(Object.keys(ARGS)).sort();
        for (i = 0; i < names.length; i++) if (names[i].length > v.length && names[i].indexOf(low) === 0) { best = names[i]; break; }
      }
    }
    gh.textContent = ''; if (best) { var s = document.createElement('i'); s.textContent = v; gh.appendChild(s); gh.appendChild(document.createTextNode(best.slice(v.length))); }
    return best;
  }
  input.addEventListener('input', suggest);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight' && input.selectionStart === input.value.length) { var b = suggest(); if (b) { e.preventDefault(); input.value = b; suggest(); } }
  });
  form.addEventListener('submit', function () { setTimeout(suggest, 0); });
  var cgen = 0, calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function run(raw) {
    var cmd = raw.trim();
    if (!cmd) return;
    hist.push(cmd);
    hi = hist.length;
    add('line', [{ cls: 'ps', text: '$ ' }, cmd]);
    var parts = cmd.split(/\s+/), key = parts[0].toLowerCase(), args = parts.slice(1);
    if (key === 'sudo' && /rm\s+-rf?\s+\//.test(cmd)) { add('res', ['Nice try. Packet is watching.']); return; }
    if (key === 'clear') { cgen++; out.innerHTML = ''; return; }
    var lines = null;
    if (ARGS.hasOwnProperty(key)) lines = ARGS[key](args);
    else if (key === 'ls' && args.length) lines = C.ls();
    else if (C.hasOwnProperty(key)) lines = C[key]();
    if (!lines) { add('res', ['command not found: ' + parts[0] + '. Type help to see the commands.']); return; }
    var put = function (ln) { add('res', Array.isArray(ln) ? ln : [ln]); };
    if (lines.slow) { lines.forEach(function (ln, n) { setTimeout(function () { put(ln); }, n * 330); }); }
    else if (lines.length > 3 && !calm) { var cg = cgen; lines.forEach(function (ln, n) { setTimeout(function () { if (cg === cgen) put(ln); }, n * 34); }); }
    else lines.forEach(put);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    run(input.value);
    input.value = '';
  });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Tab' && input.value && input.value.indexOf(' ') < 0) {
      var v = input.value.toLowerCase(), names = Object.keys(C).concat(Object.keys(ARGS), ['clear']);
      var m = names.filter(function (n) { return n.indexOf(v) === 0; });
      if (m.length === 1) { e.preventDefault(); input.value = m[0]; }
      else if (m.length > 1) { e.preventDefault(); add('res', [m.join('  ')]); }
      return;
    }
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

/* fix-it: a choose-your-own-outage incident console */
(function () {
  var root = document.getElementById('fx'); if (!root) return;
  var S = [
    { tab: 'Can\'t log in', alert: '🔒 "I\'ve typed my password 11 times. It\'s definitely right."', steps: [
      { q: 'First move?', o: [['Reset the password straight away', 0, 'Maybe. But if the account is locked, the new password locks too.'], ['Look at the account: locked, expired or disabled?', 1, 'Locked out after too many tries. Now you know what you are fixing.']] },
      { q: 'It is locked. Before unlocking, what do you ask?', o: [['Nothing. Unlock and move on', 0, 'Fast. Also how the same device locks them again in 10 minutes.'], ['Where did the wrong tries come from?', 1, 'An old phone with the previous password still syncing. Mystery solved.']] },
      { q: 'Last step?', o: [['Unlock it and walk away', 0, 'The phone will lock it again before lunch.'], ['Unlock, update the phone, confirm they are in', 1, 'Fixed once, not five times. And they get a polite reminder about MFA.']] }
    ], end: 'Most lockouts are a forgotten device, not a forgotten password.' },
    { tab: 'Printer', alert: '🖨️ "The printer is broken." (It is never the printer. Except when it is.)', steps: [
      { q: 'Where do you start?', o: [['Replace the printer', 0, 'Ambitious. The budget has opinions.'], ['Is it one person or everyone?', 1, 'Just one laptop. The printer is innocent.']] },
      { q: 'Their jobs sit in the queue and never print.', o: [['Reinstall Windows', 0, 'A hammer for a thumbtack.'], ['Clear the stuck job and restart the print service', 1, 'One stuck job was blocking everyone behind it.']] },
      { q: 'Prevent a repeat?', o: [['Hope', 0, 'A strategy, technically.'], ['Update the driver and give it a fixed address', 1, 'Printer keeps its address, laptops keep finding it.']] }
    ], end: 'Most printer problems are a stuck job or a changed address.' },
    { tab: 'Wi-Fi is slow', alert: '🐌 "The Wi-Fi is so slow. Fix it."', steps: [
      { q: 'What do you check first?', o: [['Buy a faster plan', 0, 'Expensive guess. Measure before you spend.'], ['Is it slow everywhere or in one spot, and wired too?', 1, 'Fine on cable, slow in one corner. It is the Wi-Fi, not the internet.']] },
      { q: 'One corner, lots of devices.', o: [['Move the router to the cupboard', 0, 'Cupboards are where signals go to die.'], ['Check access point coverage and channel crowding', 1, 'Two access points shouting on the same channel. Spread them out.']] },
      { q: 'After the fix?', o: [['Assume it is fixed', 0, 'Famous last words.'], ['Test from that corner again and note it down', 1, 'Fast again, and it is documented.']] }
    ], end: 'Measure first. Most slow Wi-Fi is placement, not the plan.' },
    { tab: 'Phishing email', alert: '🎣 "I think I clicked a link in an email..."', steps: [
      { q: 'What do you do first?', o: [['Tell them off', 0, 'Next time they will hide it. Calm first, lecture later.'], ['Thank them for saying so and act fast', 1, 'Reporting quickly is exactly what you want.']] },
      { q: 'Did they type their password into the page?', o: [['Probably not, skip it', 0, 'Probably is not a plan.'], ['Assume yes: reset it and sign out all sessions', 1, 'Locked the door before anyone used the key.']] },
      { q: 'Then?', o: [['Done, it is fixed', 0, 'The same email is sitting in thirty other inboxes.'], ['Remove it from every mailbox and warn the team', 1, 'Gone everywhere. One clicker saved the whole office.']] }
    ], end: 'Making it safe to report is the best security tool there is.' },
    { tab: 'Disk full', alert: '💾 "The server is crawling and says disk almost full."', steps: [
      { q: 'First?', o: [['Delete things until it works', 0, 'Delete the wrong folder and now you have a bigger problem.'], ['Find what is eating the space', 1, 'Old logs and forgotten backups. The usual.']] },
      { q: 'Logs are huge and nobody reads them.', o: [['Turn logging off', 0, 'Great until the day you need them.'], ['Archive the old ones and set rotation', 1, 'Space back, and it will not refill.']] },
      { q: 'Last touch?', o: [['Move on', 0, 'It fills up again in three months.'], ['Add a disk-space alert', 1, 'Next time it tells you at 80%, not at 100%.']] }
    ], end: 'A server telling you early beats a server telling you at 3am.' },
    { tab: 'The internet is gone', alert: '📵 Everyone: "Is the internet down?" (Yes. Everyone.)', steps: [
      { q: 'Where do you look first?', o: [['Reboot everything', 0, 'Bold. It also turns an outage into a mystery. Look first, reboot later.'], ['Check if it hits everyone, on Wi-Fi and wired', 1, 'Everyone, both. That points past the office walls.']] },
      { q: 'Can you reach the office router?', o: [['Blame the Wi-Fi password', 0, 'Nobody changed it. Nobody ever changes it.'], ['Yes, so check the line and the public IP', 1, 'Router is fine. The line is down: this is the ISP side.']] },
      { q: 'The line is down. Fastest way to get people working?', o: [['Wait for the ISP to call back', 0, 'Meanwhile 200+ people find out how long a minute is.'], ['Fail over to the secondary connection', 1, 'Back online. Restore first, root-cause second.']] }
    ], end: 'Then I raise it with the ISP and the router vendor, log it, and make sure it does not happen twice.' },
    { tab: 'The drive vanished', alert: '📁 "The shared drive is gone. I had a meeting on it."', steps: [
      { q: 'First question?', o: [['Restart the file server. It is Friday 5pm anyway.', 0, 'Bold. Also how one broken laptop becomes an outage.'], ['One user or everyone?', 1, 'Just a few. So the server is probably fine.']] },
      { q: 'By name it fails, by IP address it opens.', o: [['Rebuild the share from scratch', 0, 'Scorched earth. The server was fine.'], ['That is name resolution. Fix DNS.', 1, 'Names work again. Most "missing drives" are a missing name.']] },
      { q: 'One remote user still cannot connect.', o: [['Ask them to turn it off and on', 0, 'A classic. Not today.'], ['Check their VPN and the firewall rule for their network', 1, 'Found it. One rule, and the drive is back.']] }
    ], end: 'Then I confirm with the user and write it down, so the next person fixes it in two minutes.' }
  ];
  S.push.apply(S, S.splice(0, 5));
  S.push(
    { tab: 'Wi-Fi password', alert: '📶 "What\'s the Wi-Fi password? Also, my guest needs it. Also, my other guest."', steps: [
      { q: 'A visitor asks for the office Wi-Fi.', o: [['Read out the main password', 0, 'Now it is on every phone in the building, forever.'], ['Give them the guest network', 1, 'Guests get internet. Your servers stay out of reach.']] },
      { q: 'The guest password has been shared far and wide.', o: [['Ignore it', 0, 'It is now on a sticky note in a car park.'], ['Change it, and keep it separate from the staff network', 1, 'Changed in a minute. Staff devices never noticed.']] },
      { q: 'How do you stop this happening every month?', o: [['Put the password in the group chat', 0, 'See "forever" above.'], ['Rotate guest access on a schedule, with a short note on how to ask', 1, 'Nobody has to ask you, and nobody is locked out.']] }
    ], end: 'Keep guests on their own network. The password is the least interesting part.' },
    { tab: 'VPN won\'t connect', alert: '🔌 "I\'m working from home and the VPN just spins."', steps: [
      { q: 'First question?', o: [['Reinstall the VPN app', 0, 'Maybe later. Check the basics before the sledgehammer.'], ['Is their home internet working, and does it fail for others too?', 1, 'Internet is fine, and nobody else is affected. So it is their connection attempt.']] },
      { q: 'Wrong-password error, but they swear it is right.', o: [['Tell them to try harder', 0, 'Typing the same thing louder does not help.'], ['Check the account, the MFA prompt and the device clock', 1, 'Laptop clock was five minutes off, so the MFA code never matched. Fixed.']] },
      { q: 'Connected, but the shared drive still will not open.', o: [['Reboot the whole server', 0, 'The server was never the problem.'], ['Check the firewall rule and DNS for VPN users', 1, 'The VPN group was missing a rule. Added, and the drive opens.']] }
    ], end: 'VPN faults are usually the account, the clock or a missing rule, not the tunnel.' },
    { tab: 'Slow laptop', alert: '🐢 "My laptop takes ten minutes to start. It is useless."', steps: [
      { q: 'Where do you start?', o: [['Order a new laptop', 0, 'The budget would like a word.'], ['Look at what is actually using the CPU, memory and disk', 1, 'Disk at 100% and thirty things starting at login.']] },
      { q: 'Too many startup programs, and the disk is nearly full.', o: [['Delete random files', 0, 'That is how a laptop loses the quarterly report.'], ['Trim startup apps, clear temp files, check updates', 1, 'Starts in under a minute now.']] },
      { q: 'Still slow after that?', o: [['Shrug', 0, 'The user will not.'], ['Check disk health and RAM; upgrade only if needed', 1, 'A cheap SSD swap beats a whole new laptop.']] }
    ], end: 'Measure before replacing. Most slow laptops need a clean-up, not a new one.' }
  );
  var ICO = {"The internet is gone": "M2 8.8a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 20v.01M3 3l18 18", "The drive vanished": "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", "Can't log in": "M6 11h12v9H6zM8 11V8a4 4 0 0 1 8 0v3", "Printer": "M7 9V3h10v6M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M7 14h10v7H7z", "Wi-Fi is slow": "M4.5 10a11 11 0 0 1 15 0M8 13.5a6 6 0 0 1 8 0M12 18v.01", "Phishing email": "M3 6h18v12H3zM3 7l9 6 9-6", "Disk full": "M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6", "VPN won't connect": "M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z", "Slow laptop": "M4 5h16v11H4zM2 19h20", "Wi-Fi password": "M21 2l-2 2m-7.6 7.6a5.5 5.5 0 1 1-7.8 7.8 5.5 5.5 0 0 1 7.8-7.8zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"}, META = {"The internet is gone": ["P1", "Neha"], "The drive vanished": ["P2", "Rahul"], "Can't log in": ["P3", "Anjali"], "Printer": ["P3", "Suresh"], "Wi-Fi is slow": ["P2", "Divya"], "Phishing email": ["P1", "Meera"], "Disk full": ["P2", "the monitoring bot"], "VPN won't connect": ["P2", "Arun"], "Slow laptop": ["P3", "Fathima"], "Wi-Fi password": ["P4", "Reception"]};
  var NS = 'http://www.w3.org/2000/svg';
  var pick = root.querySelector('.fx-pick'), tk = root.querySelector('.fx-tk'), sev = root.querySelector('.fx-sev'), pill = root.querySelector('.fx-pill'),
      av = root.querySelector('.fx-av'), who = root.querySelector('.fx-who'), msg = root.querySelector('.fx-msg'), steps = root.querySelector('.fx-steps'),
      q = root.querySelector('.fx-q'), opts = root.querySelector('.fx-opts'), logEl = root.querySelector('.fx-log'), bar = root.querySelector('.fx-bar i'),
      dtEl = document.getElementById('fx-dt'), wrEl = document.getElementById('fx-wr'), body = root.querySelector('.fx-body');
  var sc = 0, st = 0, wrong = 0, done = {}, cards = [], gen = 0;
  S.forEach(function (s, i) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'fx-card' + (i ? '' : ' on'); b.setAttribute('role', 'tab');
    b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + (ICO[s.tab] || '') + '"/></svg><b></b><em></em>';
    b.querySelector('b').textContent = s.tab; b.querySelector('em').textContent = (META[s.tab] || ['P3'])[0] + ' INCIDENT';
    b.addEventListener('click', function () { sc = i; start(); });
    pick.appendChild(b); cards.push(b);
  });
  function health(n) { root.dataset.h = n; bar.style.width = [10, 38, 68, 100][n] + '%'; pill.textContent = ['DOWN', 'DEGRADED', 'RECOVERING', 'RESTORED'][n]; }
  function stats() { dtEl.textContent = wrong * 5; wrEl.textContent = wrong; }
  function start() {
    gen++; var s = S[sc], m = META[s.tab] || ['P3', 'A user']; st = 0; wrong = 0; stats();
    cards.forEach(function (c, i) { c.classList.toggle('on', i === sc); c.setAttribute('aria-selected', i === sc); });
    tk.textContent = 'INC-' + (4200 + sc * 7 + 11); sev.textContent = m[0];
    av.textContent = m[1].replace(/^the /, '').charAt(0).toUpperCase(); who.textContent = m[1];
    msg.textContent = s.alert.replace(/^[^\w"]+\s*/, '');
    body.querySelector('.fx-user').style.display = '';
    render();
  }
  function render() {
    var s = S[sc]; steps.textContent = ''; logEl.className = 'fx-log'; logEl.textContent = '';
    s.steps.forEach(function (x, i) { var e = document.createElement('i'); e.className = i < st ? 'on' : (i === st ? 'cur' : ''); steps.appendChild(e); });
    health(Math.min(3, st)); opts.textContent = '';
    if (st >= s.steps.length) { finish(); return; }
    var step = s.steps[st]; q.style.display = ''; opts.style.display = ''; q.textContent = step.q;
    step.o.slice().sort(function () { return Math.random() - 0.5; }).forEach(function (o, k) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'fx-opt'; b.style.animationDelay = (0.08 * k) + 's';
      b.innerHTML = '<kbd>' + 'AB'.charAt(k) + '</kbd><span></span>'; b.querySelector('span').textContent = o[0];
      b.addEventListener('click', function () {
        logEl.textContent = (o[1] ? '✓ ' : '✕ ') + o[2];
        if (o[1]) {
          logEl.className = 'fx-log good'; b.classList.add('good');
          document.dispatchEvent(new CustomEvent('pk:cheer'));
          opts.querySelectorAll('.fx-opt').forEach(function (x) { x.disabled = true; if (x !== b) x.classList.add('dim'); });
          var g = gen; setTimeout(function () { if (g !== gen) return; st++; render(); }, 1700);
        } else {
          wrong++; stats(); logEl.className = 'fx-log bad'; b.classList.remove('bad'); void b.offsetWidth; b.classList.add('bad'); b.disabled = true;
        }
      });
      opts.appendChild(b);
    });
  }
  function finish() {
    var s = S[sc]; done[s.tab] = 1; cards[sc].classList.add('done'); health(3);
    var rate = wrong === 0 ? 'FLAWLESS' : (wrong < 3 ? 'SMOOTH' : 'BUMPY BUT FIXED');
    q.style.display = 'none'; opts.style.display = 'none';
    var nxt = (sc + 1) % S.length;
    var e = document.createElement('div'); e.className = 'fx-end';
    e.innerHTML = '<span class="rate"></span><h3>Service restored ✔</h3><p></p><div class="btns"><button type="button" data-a="n"></button><button type="button" data-a="r">Replay this one</button></div>';
    e.querySelector('.rate').textContent = rate + ' · ' + wrong * 5 + ' min simulated downtime';
    e.querySelector('p').textContent = s.end; e.querySelector('[data-a="n"]').textContent = 'Next: ' + S[nxt].tab + ' →';
    e.addEventListener('click', function (ev) { var a = ev.target.getAttribute && ev.target.getAttribute('data-a'); if (a === 'n') { sc = nxt; start(); } else if (a === 'r') start(); });
    opts.after(e); e.id = 'fx-end'; logEl.style.display = 'none';
    var old = root.querySelectorAll('.fx-end'); if (old.length > 1) old[0].remove();
  }
  var _render = render; render = function () { var e = document.getElementById('fx-end'); if (e) e.remove(); logEl.style.display = ''; _render(); };
  start();
})();

/* network lab: hover to light up links, tap to pin, and three buttons to break things */
(function () {
  var box = document.getElementById('lab-box'); if (!box) return;
  var ICON = {"net": "<path d=\"M7 18a4 4 0 0 1-.5-7.97A5.5 5.5 0 0 1 17 9a4.5 4.5 0 0 1 .5 9H7z\"/>", "isp": "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M3 12h18M12 3c2.6 2.7 2.6 15.3 0 18M12 3c-2.6 2.7-2.6 15.3 0 18\"/>", "fw": "<path d=\"M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3z\"/><path d=\"M9 12l2 2 4-4\"/>", "br": "<path d=\"M5 21V5l7-2v18M12 9h7v12M8 8v.01M8 12v.01M8 16v.01M15 13v.01M15 17v.01\"/>", "core": "<rect x=\"3\" y=\"7\" width=\"18\" height=\"10\" rx=\"2\"/><path d=\"M7 12v.01M11 12v.01M15 12v.01M19 12v.01\"/>", "lan": "<rect x=\"3\" y=\"4\" width=\"18\" height=\"12\" rx=\"2\"/><path d=\"M8 21h8M12 16v5\"/>", "wifi": "<path d=\"M4.5 10a11 11 0 0 1 15 0M8 13.5a6 6 0 0 1 8 0M12 18v.01\"/>", "srv": "<rect x=\"4\" y=\"3\" width=\"16\" height=\"7\" rx=\"2\"/><rect x=\"4\" y=\"14\" width=\"16\" height=\"7\" rx=\"2\"/><path d=\"M8 6.5v.01M8 17.5v.01\"/>"};
  var D = {
    net: ['The internet', 'Everything outside the office. Everything below exists to reach it safely.', 'net', ['isp1', 'isp2']],
    isp1: ['ISP 1: the main line', 'The everyday connection. It is the one that fails at the worst moment, which is why there is a second one.', 'isp', ['net', 'fw']],
    isp2: ['ISP 2: the backup line', 'A second, independent connection. When the main line drops, traffic moves here and users barely notice. This is how downtime stays low.', 'isp', ['net', 'fw']],
    fw: ['Firewall / router', 'The front door. It decides what gets in and out, routes between the networks and holds the secure tunnel to the branch.', 'fw', ['isp1', 'isp2', 'core', 'br']],
    core: ['Core switch', 'Everything inside plugs in here. It carries each network separately, so a problem on one does not spill into the others.', 'core', ['fw', 'lan', 'wifi', 'srv']],
    lan: ['Wired network (VLAN)', 'Desks, printers and fixed devices on their own network, kept apart from Wi-Fi.', 'lan', ['core']],
    wifi: ['Wi-Fi network (VLAN)', 'Access points on a network of their own, with guests kept away from staff and servers.', 'wifi', ['core']],
    srv: ['Servers and storage', 'Files, accounts and backups, sitting behind the firewall where only the right people and devices can reach them.', 'srv', ['core']],
    br: ['Branch office', 'A second site joined over an encrypted tunnel, so it works like part of the same network. Setting one up from scratch is one of my favourite jobs.', 'br', ['fw']]
  };
  var NS = 'http://www.w3.org/2000/svg', svg = box.querySelector('.lab-svg'), fxg = document.getElementById('fxg');
  var nodes = {}; box.querySelectorAll('.nd').forEach(function (n) { nodes[n.dataset.k] = n; });
  var t = document.getElementById('lab-t'), d = document.getElementById('lab-d'), ch = document.getElementById('lab-ch'), lis = document.getElementById('li-svg');
  var st = document.getElementById('lab-state'), pinned = null, cutOn = false, busy = false;
  var DEF = { t: t.textContent, d: d.textContent, ic: 'net' };
  function setIcon(k) { lis.innerHTML = ICON[k] || ''; }
  function setState(txt) { st.querySelector('b').textContent = txt; }
  function clearHl() { box.classList.remove('hov'); box.querySelectorAll('.lk.hl').forEach(function (l) { l.classList.remove('hl'); }); Object.keys(nodes).forEach(function (k) { nodes[k].classList.remove('lit'); }); }
  function info(k) {
    var v = D[k]; t.textContent = v[0]; d.textContent = v[1]; setIcon(v[2]); ch.textContent = '';
    v[3].forEach(function (o) { var b = document.createElement('button'); b.type = 'button'; b.textContent = D[o][0].split(':')[0].split(' (')[0]; b.addEventListener('click', function () { pin(nodes[o]); }); ch.appendChild(b); });
  }
  function show(n) {
    info(n.dataset.k); clearHl(); box.classList.add('hov'); n.classList.add('lit');
    n.dataset.l.split(' ').forEach(function (id) { var l = document.getElementById(id); if (l) l.classList.add('hl'); });
    D[n.dataset.k][3].forEach(function (o) { nodes[o].classList.add('lit'); });
  }
  function rest() {
    clearHl();
    if (pinned) { show(pinned); return; }
    ch.textContent = '';
    if (cutOn) { t.textContent = 'Failover'; d.textContent = 'Main line cut. Traffic now flows through the backup. Everyone keeps working while the fault gets chased with the ISP.'; setIcon('isp'); }
    else { t.textContent = DEF.t; d.textContent = DEF.d; setIcon(DEF.ic); }
  }
  function pin(n) {
    pinned = pinned === n ? null : n;
    Object.keys(nodes).forEach(function (k) { nodes[k].classList.toggle('sel', nodes[k] === pinned); });
    if (pinned) show(pinned); else rest();
  }
  Object.keys(nodes).forEach(function (k) {
    var n = nodes[k];
    n.addEventListener('mouseenter', function () { show(n); });
    n.addEventListener('mouseleave', rest);
    n.addEventListener('focus', function () { show(n); });
    n.addEventListener('blur', rest);
    n.addEventListener('click', function () { pin(n); });
    n.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pin(n); } });
  });
  setIcon(DEF.ic);

  /* little animation helpers */
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function travel(dstr, bad, ms) {
    return new Promise(function (res) {
      var p = document.createElementNS(NS, 'path'); p.setAttribute('d', dstr); var L = p.getTotalLength();
      var c = document.createElementNS(NS, 'circle'); c.setAttribute('r', 7); c.setAttribute('class', 'fxp' + (bad ? ' bad' : '')); fxg.appendChild(c);
      var t0 = performance.now();
      (function f(now) {
        var k = Math.min(1, (now - t0) / ms), pt = p.getPointAtLength(L * k);
        c.setAttribute('cx', pt.x); c.setAttribute('cy', pt.y);
        if (k < 1) requestAnimationFrame(f); else { c.remove(); res(); }
      })(t0);
    });
  }
  function label(x, y, txt, bad) {
    var e = document.createElementNS(NS, 'text'); e.setAttribute('x', x); e.setAttribute('y', y); e.setAttribute('class', 'fxt' + (bad ? ' bad' : '')); e.textContent = txt; fxg.appendChild(e);
    e.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 220, fill: 'forwards' });
    return e;
  }
  function route() { return cutOn ? { a: 'M480 239 C480 212 630 215 630 187 L630 133 C630 108 480 112 480 84', x: 630 } : { a: 'M480 239 C480 212 330 215 330 187 L330 133 C330 108 480 112 480 84', x: 330 }; }
  function lock(on) { box.querySelectorAll('.lab-bar .chip').forEach(function (b) { b.disabled = on; }); busy = on; }

  document.getElementById('lab-cut').addEventListener('click', function () {
    cutOn = !cutOn; var b = this;
    b.setAttribute('aria-pressed', cutOn); b.textContent = cutOn ? '↺ restore main ISP line' : '✂ cut main ISP line';
    box.dataset.cut = cutOn ? '1' : '0';
    nodes.isp1.classList.toggle('down', cutOn);
    ['l1', 'l3'].forEach(function (id) { document.getElementById(id).classList.toggle('down', cutOn); });
    setState(cutOn ? 'main line down: running on backup' : 'all links up');
    rest();
  });
  document.getElementById('lab-ping').addEventListener('click', async function () {
    if (busy) return; lock(true); var r = route();
    var up = 'M200 459 C200 428 480 432 480 402 L480 301 L480 239 ' + r.a.replace(/^M[\d.]+ [\d.]+ /, '');
    var lab = label(200, 436, 'ping…');
    await travel(up, false, 1500);
    lab.remove(); var ok = label(480, 38, 'reply from the internet ✔'); await wait(250);
    await travel(reverse(up), false, 1500); ok.remove();
    setState('ping answered. all good'); await wait(900); fxg.textContent = ''; setState(cutOn ? 'main line down: running on backup' : 'all links up'); lock(false);
  });
  /* reverse a simple absolute path by sampling it, so the reply retraces the route */
  function reverse(dstr) {
    var p = document.createElementNS(NS, 'path'); p.setAttribute('d', dstr); var L = p.getTotalLength(), s = 'M', i;
    for (i = 0; i <= 60; i++) { var pt = p.getPointAtLength(L * (1 - i / 60)); s += (i ? ' L' : '') + pt.x.toFixed(1) + ' ' + pt.y.toFixed(1); }
    return s;
  }
  document.getElementById('lab-atk').addEventListener('click', async function () {
    if (busy) return; lock(true); box.classList.add('atk'); setState('intrusion attempt…');
    var r = route(), down = reverse(r.a);
    for (var i = 0; i < 3; i++) {
      await travel(down, true, 700);
      nodes.fw.classList.add('flash');
      var ring = document.createElementNS(NS, 'circle'); ring.setAttribute('cx', 480); ring.setAttribute('cy', 270); ring.setAttribute('r', 40); ring.setAttribute('class', 'fxr'); fxg.appendChild(ring);
      ring.animate([{ r: 40, opacity: 1 }, { r: 120, opacity: 0 }], { duration: 600, fill: 'forwards' });
      var l = label(480 + (i - 1) * 90, 214 + i * 0, 'BLOCKED ✕', true);
      await wait(380); nodes.fw.classList.remove('flash'); setTimeout(function (e, g) { e.remove(); g.remove(); }, 700, l, ring);
    }
    setState('3 attacks blocked at the firewall. nothing got in');
    await wait(1600); fxg.textContent = ''; box.classList.remove('atk'); setState(cutOn ? 'main line down: running on backup' : 'all links up'); lock(false);
  });
  var sc = box.querySelector('.lab-scroll');
  function center() { sc.scrollLeft = (sc.scrollWidth - sc.clientWidth) / 2; }
  center(); window.addEventListener('load', center);
})();

/* documentation samples: a small docs viewer */
(function () {
  var list = document.getElementById('dx-list'); if (!list) return;
  var DOCS = [{"id": "onb", "ic": "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM19 8v6M22 11h-6", "name": "New user onboarding", "kind": "SOP", "ver": "v1.3", "blocks": [["p", "Get a new joiner productive on day one: account, device, access and a friendly hand-over."], ["meta", ["Owner", "IT support"], ["Audience", "IT team"], ["Time", "about 45 min"]], ["h", "Before day one"], ["check", ["Get the request form from HR: name, role, manager, start date", "Create the account and a temporary password", "Add them to the right groups for their team (access follows role, not favours)", "Prepare the device: updates, security tools, disk encryption on", "Create the mailbox and add to the relevant mailing lists"]], ["note", "warn", "Never send the temporary password and the username in the same message."], ["h", "On day one"], ["ol", ["Hand over the device and walk through first sign-in", "Enrol multi-factor sign-in on their phone and test it together", "Show them how to raise a ticket, and who to call if it is urgent", "Check printer, shared drive and VPN (if they need it) actually work for them"]], ["h", "Afterwards"], ["ul", ["Log the setup in the ticket and the asset list", "Check in after a week: anything missing or annoying?"]], ["note", "note", "If the checklist keeps growing, it belongs in the HR form, not in IT heads."]]}, {"id": "off", "ic": "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM17 8l5 5M22 8l-5 5", "name": "Offboarding", "kind": "SOP", "ver": "v1.1", "blocks": [["p", "Close access cleanly the moment someone leaves, without losing anything the business needs."], ["meta", ["Owner", "IT support"], ["Trigger", "HR leaving notice"], ["Time", "about 30 min"]], ["note", "warn", "Disable first, delete later. A disabled account can be undone. A deleted one often cannot."], ["h", "On the last day"], ["check", ["Disable the account and sign out all active sessions", "Reset the password and remove multi-factor devices", "Remove from groups, mailing lists and remote access", "Collect the laptop, phone and any badges. Tick them off the asset list", "Forward the mailbox to the manager for an agreed period"]], ["h", "Within a month"], ["ol", ["Copy any data the manager needs, then confirm in writing", "Wipe and re-image the returned device", "Delete the account only after the retention period"]], ["table", ["Item", "Who decides"], [["Mailbox forwarding length", "Manager + HR"], ["Data to keep", "Manager"], ["Final deletion", "IT, after retention"]]]]}, {"id": "net", "ic": "M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18", "name": "Network summary", "kind": "Overview", "ver": "v2.0", "blocks": [["p", "A one-page map of how a typical office network is laid out, so anyone can find their way around in five minutes."], ["meta", ["Owner", "IT"], ["Audience", "IT team, new admins"], ["Review", "every 6 months"]], ["h", "Layout"], ["ul", ["Two internet lines: one main, one backup that takes over automatically or by a quick manual switch", "One firewall at the edge doing routing, filtering and the VPN", "One core switch feeding wired desks, Wi-Fi access points and servers", "Each site has its own separate networks (VLANs) for wired and Wi-Fi"]], ["h", "Networks"], ["table", ["Network", "Used for", "Rule of thumb"], [["Wired", "Desks, printers", "Fixed addresses for printers and key devices"], ["Wi-Fi", "Staff and guests", "Guests never see internal systems"], ["Servers", "Files, accounts, backup", "Only IT and approved services reach it"], ["Branch (VPN)", "Second site", "Joined by an encrypted tunnel"]]], ["note", "note", "If you change anything here, update this page the same day."], ["h", "When the internet drops"], ["ol", ["Check whether it is everyone or one person", "Check the router and the main line", "Fail over to the backup line", "Raise it with the provider with times and evidence", "Write it up (see the incident report)"]]]}, {"id": "inc", "ic": "M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01", "name": "Incident report: internet outage", "kind": "Report", "ver": "sample", "blocks": [["p", "A sample of how I write up an incident: short, blameless and focused on what changes next time."], ["meta", ["Severity", "High (whole office)"], ["Status", "Resolved"], ["Type", "Provider line failure"]], ["h", "Summary"], ["p", "The main internet line dropped and the whole office lost access. Traffic was moved to the backup line, and the provider fixed the main line later the same day."], ["h", "Timeline"], ["table", ["When", "What happened"], [["T+0", "Users report no internet. Confirmed it is everyone, wired and Wi-Fi"], ["T+5 min", "Router reachable. Main line shows down"], ["T+10 min", "Traffic moved to the backup line. Service back"], ["T+30 min", "Ticket raised with the provider, with times and line status"], ["Later", "Provider restores the main line. Switched back and tested"]]], ["h", "Root cause"], ["p", "A fault on the provider side of the main line. Nothing inside the office was at fault."], ["h", "What we will do next time"], ["check", ["Add an alert when the main line drops, so we hear before users do", "Keep the failover steps in a one-page checklist at the front of the runbook", "Review the provider's response time against the agreed service level"]], ["note", "note", "Sample for illustration. It does not describe a specific company or event."]]}, {"id": "bak", "ic": "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3", "name": "Backup and restore", "kind": "Runbook", "ver": "v1.2", "blocks": [["p", "A backup that has never been restored is only a hope. This runbook covers what is backed up, how often, and how I prove it works."], ["meta", ["Owner", "IT"], ["Test", "every quarter"], ["Rule", "3 copies, 2 places, 1 offsite"]], ["h", "What gets backed up"], ["table", ["Data", "How often", "Kept for"], [["File shares", "Daily", "Weeks, with monthly copies"], ["Servers and databases", "Daily", "Weeks"], ["Configurations (firewall, switches)", "After every change", "Latest 10 versions"]]], ["h", "Check it every morning"], ["ol", ["Open the backup status report", "Look for failed or skipped jobs", "Rerun anything that failed and note why in the ticket"]], ["h", "Restore test"], ["check", ["Pick a random file and a random server", "Restore them to a safe test location", "Check they open and the data is correct", "Record the time it took and any surprises"]], ["note", "warn", "Never restore over live data first. Restore alongside, check it, then swap."]]}, {"id": "chg", "ic": "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z", "name": "Change request and rollback plan", "kind": "Plan", "ver": "v1.0", "blocks": [["p", "Every change is written down before it is made: what is changing, when, who it affects and exactly how to undo it."], ["meta", ["Owner", "IT"], ["Approval", "Manager"], ["Rule", "No rollback plan, no change"]], ["h", "The request"], ["table", ["Field", "Example"], [["What is changing", "Move the office Wi-Fi to new access points"], ["Why", "Better coverage in the far corner"], ["Who is affected", "Everyone on Wi-Fi"], ["Risk", "Medium"], ["When", "After hours, with a fixed time limit"]]], ["h", "Before the change"], ["check", ["Save a copy of the current configuration", "Tell affected people in advance, with the time and what to expect", "Walk through the rollback steps on paper", "Make sure a second person is reachable"]], ["note", "warn", "If you cannot say how to undo it, you are not ready to do it."], ["h", "Rollback plan"], ["ol", ["Stop and note the time", "Restore the saved configuration", "Test the same things you tested before the change", "Tell people it is back to normal", "Write down what went wrong"]], ["h", "After the change"], ["ul", ["Test from a wired and a Wi-Fi device", "Update the network documentation the same day", "Close the request with notes on what happened"]]]}, {"id": "brn", "ic": "M5 21V5l7-2v18M12 9h7v12M8 8v.01M8 12v.01M8 16v.01M15 13v.01M15 17v.01", "name": "New branch office setup", "kind": "Checklist", "ver": "v1.0", "blocks": [["p", "Everything to plan before a new site opens, from the internet lines to the first person signing in."], ["meta", ["Owner", "IT"], ["Audience", "IT team"], ["Start", "Before the fit-out finishes"]], ["h", "Plan before the visit"], ["check", ["Count users and devices, and leave room to grow", "Order two internet lines, from different providers if possible", "Draw the network: wired, Wi-Fi and guests kept apart", "Plan cabling and where the equipment will sit", "Decide how the site joins head office, usually an encrypted tunnel"]], ["note", "note", "Visit early. Moving a cable is easy before the walls are painted."], ["h", "On site"], ["check", ["Test cables and power", "Install the switch, firewall and access points", "Set up the separate wired and Wi-Fi networks", "Bring up the secure tunnel and test it", "Set up printers and phones"]], ["h", "Handover"], ["ol", ["Unplug the main line and check the backup takes over", "Create accounts and sign in on a real laptop", "Leave the site contact a one-page help sheet", "Add the site to monitoring and the documentation"]]]}, {"id": "hlt", "ic": "M22 12h-4l-3 9L9 3l-3 9H2", "name": "Monthly IT health check", "kind": "Routine", "ver": "v1.1", "blocks": [["p", "A short routine that finds small problems before they turn into outages."], ["meta", ["Owner", "IT"], ["Time", "about 1 hour"], ["Every", "Month"]], ["h", "Check"], ["check", ["Backups succeeded, and a test restore works", "Operating system and security updates are installed", "Disk space and server health look normal", "Internet and VPN uptime reviewed", "Security and endpoint tools report healthy", "Licences and renewals due soon are listed", "Leavers' accounts are disabled"]], ["h", "What to look for"], ["table", ["Area", "Look for", "Action"], [["Backups", "Failed or skipped jobs", "Rerun and record why"], ["Updates", "Devices missing patches", "Schedule and push"], ["Accounts", "Leavers still active", "Disable"], ["Licences", "Renewals coming up", "Renew or remove"]]], ["note", "note", "Write down what you found, even when everything is fine. A clean report is evidence too."]]}];
  var doc = document.getElementById('dx-doc'), q = document.getElementById('dx-q'), empty = document.getElementById('dx-empty'), cur = 0, btns = [];
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; }
  function md(d) {
    var o = '# ' + d.name + '\n\n';
    d.blocks.forEach(function (b) {
      var t = b[0];
      if (t === 'p') o += b[1] + '\n\n';
      else if (t === 'h') o += '## ' + b[1] + '\n\n';
      else if (t === 'ul') o += b[1].map(function (x) { return '- ' + x; }).join('\n') + '\n\n';
      else if (t === 'ol') o += b[1].map(function (x, i) { return (i + 1) + '. ' + x; }).join('\n') + '\n\n';
      else if (t === 'check') o += b[1].map(function (x) { return '- [ ] ' + x; }).join('\n') + '\n\n';
      else if (t === 'note') o += '> **' + (b[1] === 'warn' ? 'Warning' : 'Note') + ':** ' + b[2] + '\n\n';
      else if (t === 'meta') o += b.slice(1).map(function (m) { return '**' + m[0] + ':** ' + m[1]; }).join(' | ') + '\n\n';
      else if (t === 'table') { o += '| ' + b[1].join(' | ') + ' |\n|' + b[1].map(function () { return '---'; }).join('|') + '|\n'; b[2].forEach(function (r) { o += '| ' + r.join(' | ') + ' |\n'; }); o += '\n'; }
    });
    return o;
  }
  function open(i) {
    cur = i; var d = DOCS[i];
    btns.forEach(function (b, k) { b.classList.toggle('on', k === i); b.setAttribute('aria-current', k === i ? 'page' : 'false'); });
    var a = doc.cloneNode(false); a.id = 'dx-doc';
    var head = el('div', 'dx-head'); head.appendChild(el('span', 'dx-tag', d.kind.toUpperCase())); head.appendChild(el('span', 'dx-ver', d.ver));
    var cp = el('button', 'dx-copy', 'copy as markdown'); cp.type = 'button';
    cp.addEventListener('click', function () {
      var done = function () { cp.textContent = 'copied ✔'; setTimeout(function () { cp.textContent = 'copy as markdown'; }, 1600); };
      try { navigator.clipboard.writeText(md(d)).then(done, done); } catch (e) { done(); }
    });
    head.appendChild(cp); a.appendChild(head); a.appendChild(el('h3', 'dx-t', d.name));
    d.blocks.forEach(function (b) {
      var t = b[0], n;
      if (t === 'p') a.appendChild(el('p', '', b[1]));
      else if (t === 'h') a.appendChild(el('h4', '', b[1]));
      else if (t === 'ul' || t === 'ol') { n = el(t); b[1].forEach(function (x) { n.appendChild(el('li', '', x)); }); a.appendChild(n); }
      else if (t === 'note') { n = el('div', 'dx-note' + (b[1] === 'warn' ? ' warn' : '')); n.appendChild(el('b', '', b[1] === 'warn' ? 'WARNING' : 'NOTE')); n.appendChild(el('span', '', b[2])); a.appendChild(n); }
      else if (t === 'meta') { n = el('div', 'dx-meta'); b.slice(1).forEach(function (m) { var c = el('div'); c.appendChild(el('span', '', m[0])); c.appendChild(el('b', '', m[1])); n.appendChild(c); }); a.appendChild(n); }
      else if (t === 'table') {
        n = el('table', 'dx-table'); var th = el('thead'), tr = el('tr'); b[1].forEach(function (x) { tr.appendChild(el('th', '', x)); }); th.appendChild(tr); n.appendChild(th);
        var tb = el('tbody'); b[2].forEach(function (r) { var rr = el('tr'); r.forEach(function (x) { rr.appendChild(el('td', '', x)); }); tb.appendChild(rr); }); n.appendChild(tb);
        var w = el('div'); w.style.overflowX = 'auto'; w.appendChild(n); a.appendChild(w);
      } else if (t === 'check') {
        var pr = el('div', 'dx-prog'), bar = el('div'), fill = el('i'), lab = el('span', '', '0 / ' + b[1].length); bar.appendChild(fill); pr.appendChild(bar); pr.appendChild(lab);
        n = el('div', 'dx-check'); var boxes = [];
        b[1].forEach(function (x) {
          var l = el('label'), c = el('input'); c.type = 'checkbox'; boxes.push(c);
          c.addEventListener('change', function () {
            l.classList.toggle('done', c.checked);
            var k = boxes.filter(function (z) { return z.checked; }).length; fill.style.width = (k / boxes.length * 100) + '%'; lab.textContent = k === boxes.length ? 'all done ✔' : k + ' / ' + boxes.length;
          });
          l.appendChild(c); l.appendChild(el('span', '', x)); n.appendChild(l);
        });
        a.appendChild(pr); a.appendChild(n);
      }
    });
    doc.replaceWith(a); doc = a;
  }
  DOCS.forEach(function (d, i) {
    var b = el('button', 'dx-item'); b.type = 'button';
    b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + d.ic + '"/></svg><span><b></b><em></em></span>';
    b.querySelector('b').textContent = d.name; b.querySelector('em').textContent = d.kind.toUpperCase() + ' · ' + d.ver;
    b.addEventListener('click', function () { open(i); });
    list.appendChild(b); btns.push(b);
  });
  q.addEventListener('input', function () {
    var v = q.value.trim().toLowerCase(), n = 0;
    DOCS.forEach(function (d, i) {
      var hit = !v || (d.name + ' ' + d.kind + ' ' + JSON.stringify(d.blocks)).toLowerCase().indexOf(v) > -1;
      btns[i].style.display = hit ? '' : 'none'; if (hit) n++;
    });
    empty.hidden = n > 0;
  });
  /* cards on the page; the full viewer opens in a dialog */
  var dlg = document.getElementById('dx-dlg'), cards = document.getElementById('dx-cards'), lastCard = null;
  DOCS.forEach(function (d, i) {
    var c = el('button', 'dx-card'); c.type = 'button'; c.setAttribute('aria-haspopup', 'dialog');
    var heads = d.blocks.filter(function (b) { return b[0] === 'h'; }).map(function (b) { return b[1]; }).slice(0, 3);
    var items = 0; d.blocks.forEach(function (b) { if (b[0] === 'check' || b[0] === 'ol') items += b[1].length; });
    var intro = (d.blocks.filter(function (b) { return b[0] === 'p'; })[0] || ['', ''])[1];
    c.innerHTML = '<div class="ct"><div class="ci"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + d.ic + '"/></svg></div><span class="ck"></span></div><h3></h3><div class="co">OPEN <i aria-hidden="true">↗</i></div><div class="pk" aria-hidden="true"><p></p><div class="cs"></div></div>';
    c.querySelector('.ck').textContent = d.kind.toUpperCase(); c.querySelector('h3').textContent = d.name; c.querySelector('.pk p').textContent = intro;
    var cs = c.querySelector('.cs'); heads.forEach(function (x) { cs.appendChild(el('span', '', x)); }); if (items) cs.appendChild(el('span', '', items + ' steps'));
    c.addEventListener('click', function () { lastCard = c; open(i); if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', ''); doc.scrollTop = 0; });
    cards.appendChild(c);
  });
  document.getElementById('dx-x').addEventListener('click', function () { dlg.close(); });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('close', function () { if (lastCard) lastCard.focus(); });
  open(0);
})();

/* roadmap: tap an item to open it */
document.querySelectorAll('.rm-col li').forEach(function (li) {
  li.tabIndex = 0;
  function tog() { li.classList.toggle('open'); }
  li.addEventListener('click', tog);
  li.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tog(); } });
});

(function () {
  var dd = document.querySelector('.dd'); if (!dd) return;
  var b = dd.querySelector('.dd-b');
  function set(o) { dd.classList.toggle('open', o); b.setAttribute('aria-expanded', o ? 'true' : 'false'); }
  b.addEventListener('click', function (e) { e.stopPropagation(); set(!dd.classList.contains('open')); });
  document.addEventListener('click', function (e) { if (!dd.contains(e.target)) set(false); });
  dd.addEventListener('click', function (e) { if (e.target.closest('.dd-m a')) set(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && dd.classList.contains('open')) { set(false); b.focus(); } });
})();
