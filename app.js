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
    var tipIdx = -1, tipW = 0, tipH = 0;
    var raf = 0, t0 = 0, px = 0, py = 0, cx = 0, cy = 0;
    var NR = 23;

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
      measure();
      draw(0);
      if (!rm) startLoop();
    }

    function measure() {
      W = inner.clientWidth; H = inner.clientHeight;
      svg.setAttribute('viewBox', '0 0 ' + (W || 1) + ' ' + (H || 1));
    }

    /* every node sits on a tilted ring and drifts a little; lines are redrawn from the same numbers, so they stay attached */
    function draw(t) {
      if (!W || !H || !nodes.length) return;
      var n = nodes.length, mx = NR * 1.12 + 16;
      var rx = Math.min(185, W / 2 - mx), ry = Math.min(150, H / 2 - mx);
      var ay = 0.1 * Math.sin(t * 0.35) + cx * 0.13, ax = 0.08 * Math.sin(t * 0.27 + 1) + cy * 0.1;
      var cyaw = Math.cos(ay), syaw = Math.sin(ay), cpit = Math.cos(ax), spit = Math.sin(ax);
      var hx = W / 2, hy = H / 2, pts = [];
      for (var i = 0; i < n; i++) {
        var a = -Math.PI / 2 + i * 2 * Math.PI / n;
        var x = Math.cos(a) * rx, y = Math.sin(a) * ry, z = (i % 2 ? 1 : -1) * 20;
        var x1 = x * cyaw + z * syaw, z1 = -x * syaw + z * cyaw;
        var y1 = y * cpit - z1 * spit, z2 = y * spit + z1 * cpit;
        var s = 480 / (480 - z2);
        var A = 4 + (i % 3) * 2;
        var dx = A * Math.sin(t * (0.45 + (i % 4) * 0.09) + i * 1.7);
        var dy = A * Math.cos(t * (0.38 + (i % 3) * 0.11) + i * 2.3);
        var X = hx + x1 * s + dx, Y = hy + y1 * s + dy, sc = Math.max(0.92, Math.min(1.1, s));
        pts.push([X, Y]);
        nodes[i].style.transform = 'translate(' + (X - NR).toFixed(1) + 'px,' + (Y - NR).toFixed(1) + 'px) scale(' + sc.toFixed(3) + ')';
        spokes[i].setAttribute('x1', hx); spokes[i].setAttribute('y1', hy);
        spokes[i].setAttribute('x2', X.toFixed(1)); spokes[i].setAttribute('y2', Y.toFixed(1));
      }
      for (var j = 0; j < n; j++) {
        var p = pts[j], q = pts[(j + 1) % n];
        bonds[j].setAttribute('x1', p[0].toFixed(1)); bonds[j].setAttribute('y1', p[1].toFixed(1));
        bonds[j].setAttribute('x2', q[0].toFixed(1)); bonds[j].setAttribute('y2', q[1].toFixed(1));
      }
      if (tipIdx >= 0 && pts[tipIdx]) placeTip(pts[tipIdx]);
    }

    function placeTip(p) {
      var left = Math.max(6, Math.min(W - tipW - 6, p[0] - tipW / 2));
      var top = p[1] - NR - 10 - tipH;
      if (top < 6) top = p[1] + NR + 10;
      tip.style.transform = 'translate(' + left.toFixed(1) + 'px,' + top.toFixed(1) + 'px)';
    }

    function showTip(i) {
      if (i === tipIdx) return;
      tipIdx = i;
      nodes.forEach(function (n, j) { n.classList.toggle('on', j === i); });
      spokes.forEach(function (l, j) { l.classList.toggle('on', j === i); });
      if (i < 0) { tip.classList.remove('show'); return; }
      tip.textContent = names[i];
      tipW = tip.offsetWidth; tipH = tip.offsetHeight;
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
        a.href = p.href;
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
        'linkedin  linkedin.com/in/ajas',
        [{ text: 'Open the contact page', href: 'index.html#contact' }]
      ];
    },
    location: function () { return ['Kochi, Kerala, India']; },
    ls: function () {
      return [
        [{ text: 'about/', href: 'index.html#about' }, '  ', { text: 'experience/', href: 'index.html#experience' }, '  ', { text: 'skills/', href: 'index.html#skills' }, '  ', { text: 'contact/', href: 'index.html#contact' }],
        'case-studies/  resume/  (in progress)'
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
