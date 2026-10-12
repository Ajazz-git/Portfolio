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

  /* skills explorer: level filter, category widgets and the skill map */
  var ex = document.getElementById('explorer');
  if (ex) (function () {
    var NS = 'http://www.w3.org/2000/svg';
    var rm = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
    var mqNarrow = matchMedia('(max-width: 860px)');
    var mqHover = matchMedia('(hover: hover) and (pointer: fine)');
    var cats = Array.prototype.slice.call(ex.querySelectorAll('.cat'));
    var chipsEl = ex.querySelectorAll('.levels [data-level]');
    var grid = ex.querySelector('.explorer-grid');
    var list = ex.querySelector('.cat-list');
    var slot = ex.querySelector('.stage-slot');
    var stage = document.getElementById('stage');
    var wrap = stage.querySelector('.mol-wrap');
    var mol = stage.querySelector('.mol');
    var closeBtn = stage.querySelector('.stage-close');
    ex.classList.add('js');

    var active = null, pinned = null, timer = 0, raf = 0, built = null;
    var lines = [], nodes = [], orbit = null, svg = null, center = null;

    function isNarrow() { return mqNarrow.matches; }
    function canHover() { return mqHover.matches && !isNarrow(); }
    function shown() { return cats.filter(function (c) { return !c.hidden; }); }
    function btnOf(c) { return c.querySelector('.cat-btn'); }
    function skillsOf(c) {
      return Array.prototype.map.call(c.querySelectorAll('.cat-skills li'), function (li) { return li.textContent; });
    }

    /* the map: a centre node, skill bubbles around it, lines in between */
    function build(c) {
      var names = skillsOf(c);
      mol.textContent = '';
      lines = []; nodes = [];
      svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('class', 'links');
      orbit = document.createElementNS(NS, 'ellipse');
      svg.appendChild(orbit);
      names.forEach(function () {
        var ln = document.createElementNS(NS, 'line');
        svg.appendChild(ln);
        lines.push(ln);
      });
      mol.appendChild(svg);
      center = document.createElement('div');
      center.className = 'center';
      var ico = c.querySelector('.ico svg');
      if (ico) center.appendChild(ico.cloneNode(true));
      mol.appendChild(center);
      names.forEach(function (n, i) {
        var nd = document.createElement('div');
        nd.className = 'node';
        nd.setAttribute('data-i', i);
        var b = document.createElement('div');
        b.className = 'bub';
        b.textContent = n;
        b.style.setProperty('--d', (6 + (i % 3) * 1.3).toFixed(1) + 's');
        b.style.setProperty('--l', (-i * 1.1).toFixed(1) + 's');
        b.style.setProperty('--i', i);
        nd.style.setProperty('--z', i % 2 ? 9 : 6);
        nd.appendChild(b);
        mol.appendChild(nd);
        nodes.push(nd);
      });
      built = c;
      layout();
    }

    function layout() {
      if (!built || !nodes.length) return;
      var W = mol.clientWidth, H = mol.clientHeight;
      if (!W || !H) return;
      var n = nodes.length;
      var pill = nodes[0].firstChild.offsetWidth || 108;
      var rx = Math.min(250, (W / 2 - 18 - pill / 2) / 0.866);
      var ry = Math.min(150, H / 2 - 40);
      var cx = W / 2, cy = H / 2;
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      orbit.setAttribute('cx', cx); orbit.setAttribute('cy', cy);
      orbit.setAttribute('rx', Math.max(10, rx * 0.93)); orbit.setAttribute('ry', Math.max(10, ry * 0.93));
      center.style.left = cx + 'px'; center.style.top = cy + 'px';
      for (var i = 0; i < n; i++) {
        var ang = (-90 + i * (360 / n)) * Math.PI / 180;
        var x = cx + Math.cos(ang) * rx, y = cy + Math.sin(ang) * ry;
        nodes[i].style.left = x.toFixed(1) + 'px';
        nodes[i].style.top = y.toFixed(1) + 'px';
        lines[i].setAttribute('x1', cx); lines[i].setAttribute('y1', cy);
        lines[i].setAttribute('x2', x.toFixed(1)); lines[i].setAttribute('y2', y.toFixed(1));
      }
    }

    /* put the stage beside the list on wide screens, or right under the open widget on narrow ones */
    function place() {
      if (isNarrow() && active) {
        if (stage.previousElementSibling !== active) list.insertBefore(stage, active.nextSibling);
      } else if (stage.parentNode !== slot) {
        slot.appendChild(stage);
      }
    }

    function render() {
      cats.forEach(function (c) {
        var on = c === active;
        btnOf(c).setAttribute('aria-expanded', on ? 'true' : 'false');
        c.classList.toggle('is-active', on);
        c.classList.toggle('is-pinned', c === pinned);
      });
      place();
      if (!active) {
        built = null;
        mol.textContent = '';
        stage.classList.add('empty');
        stage.hidden = isNarrow();
        return;
      }
      var lvl = active.getAttribute('data-level');
      stage.hidden = false;
      stage.classList.remove('empty');
      stage.querySelector('.stage-level').textContent = lvl;
      stage.querySelector('.stage-title').textContent = active.querySelector('.cat-t b').textContent;
      stage.querySelector('.stage-desc').textContent = active.querySelector('.cat-t small').textContent;
      var sr = stage.querySelector('.stage-list');
      sr.textContent = '';
      skillsOf(active).forEach(function (s) { var li = document.createElement('li'); li.textContent = s; sr.appendChild(li); });
      build(active);
    }

    function setActive(c, pin) {
      active = c;
      if (pin !== undefined) pinned = pin;
      render();
    }

    function filter(level) {
      Array.prototype.forEach.call(chipsEl, function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-level') === level ? 'true' : 'false'); });
      cats.forEach(function (c) { c.hidden = !(level === 'all' || c.getAttribute('data-level') === level); });
      if (pinned && pinned.hidden) pinned = null;
      if (isNarrow()) active = null;
      else if (!active || active.hidden) active = shown()[0] || null;
      render();
    }

    Array.prototype.forEach.call(chipsEl, function (b) {
      b.addEventListener('click', function () { filter(b.getAttribute('data-level')); });
    });

    cats.forEach(function (c) {
      var b = btnOf(c);
      b.addEventListener('click', function () {
        if (!canHover()) {
          setActive(active === c ? null : c, null);
          if (active) requestAnimationFrame(function () {
            stage.scrollIntoView({ block: 'nearest', behavior: rm ? 'auto' : 'smooth' });
          });
        } else {
          clearTimeout(timer);
          setActive(c, pinned === c ? null : c);
        }
      });
      b.addEventListener('pointerenter', function (e) {
        if (e.pointerType !== 'mouse' || !canHover() || active === c) return;
        clearTimeout(timer);
        timer = setTimeout(function () { setActive(c); }, 110);
      });
      b.addEventListener('pointerleave', function () { clearTimeout(timer); });
    });

    /* leaving the whole explorer returns to the pinned category, if there is one */
    grid.addEventListener('pointerleave', function (e) {
      if (e.pointerType !== 'mouse' || !canHover()) return;
      clearTimeout(timer);
      if (pinned && active !== pinned) setActive(pinned);
    });

    function close(refocus) {
      var was = active;
      clearTimeout(timer);
      setActive(null, null);
      if (refocus && was) btnOf(was).focus();
    }
    closeBtn.addEventListener('click', function () { close(true); });
    ex.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && active) { e.preventDefault(); close(true); }
    });

    /* hovering a bubble lights its line (one listener, not one per bubble) */
    function light(e, on) {
      var nd = e.target.closest ? e.target.closest('.node') : null;
      if (nd && lines[nd.getAttribute('data-i')]) lines[nd.getAttribute('data-i')].classList.toggle('on', on);
    }
    mol.addEventListener('pointerover', function (e) { light(e, true); });
    mol.addEventListener('pointerout', function (e) { light(e, false); });

    /* a light parallax that follows the mouse, desktop only */
    if (!rm) {
      var px = 0, py = 0;
      stage.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse' || !built) return;
        var r = wrap.getBoundingClientRect();
        px = Math.max(-1, Math.min(1, (e.clientX - r.left) / r.width * 2 - 1));
        py = Math.max(-1, Math.min(1, (e.clientY - r.top) / r.height * 2 - 1));
        if (!raf) raf = requestAnimationFrame(function () {
          raf = 0;
          mol.style.setProperty('--px', px.toFixed(2));
          mol.style.setProperty('--py', py.toFixed(2));
        });
      });
      stage.addEventListener('pointerleave', function () {
        if (raf) { cancelAnimationFrame(raf); raf = 0; }
        mol.style.setProperty('--px', '0');
        mol.style.setProperty('--py', '0');
      });
    }

    /* keep the map inside its panel when the panel changes size */
    if (window.ResizeObserver) new ResizeObserver(function () { layout(); }).observe(mol);
    else window.addEventListener('resize', layout);

    var onMq = function () { filter(ex.querySelector('.levels [aria-pressed="true"]').getAttribute('data-level')); };
    if (mqNarrow.addEventListener) mqNarrow.addEventListener('change', onMq); else mqNarrow.addListener(onMq);

    filter('all');
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
