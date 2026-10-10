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
        [{ text: 'Open the contact page', href: 'contact.html' }]
      ];
    },
    location: function () { return ['Kochi, Kerala, India']; },
    ls: function () {
      return [
        [{ text: 'experience/', href: 'experience.html' }, '  ', { text: 'contact/', href: 'contact.html' }],
        'about/  skills/  case-studies/  resume/  (in progress)'
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
