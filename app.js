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

  /* skills: show one level at a time */
  var lv = document.querySelectorAll('.levels [data-level]');
  Array.prototype.forEach.call(lv, function (b) {
    b.addEventListener('click', function () {
      var want = b.getAttribute('data-level');
      Array.prototype.forEach.call(lv, function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
      Array.prototype.forEach.call(document.querySelectorAll('.skill-group'), function (g) {
        g.hidden = !(want === 'all' || g.getAttribute('data-level') === want);
      });
    });
  });

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
