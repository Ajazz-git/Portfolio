/* Theme: dark by default, switchable. Runs before the page paints.
   The choice travels in the page address of internal links as "#theme" or "#section~theme"
   (works even when storage is blocked), and is also kept in localStorage / sessionStorage.
   If the viewer sets its own data-theme, ours wins. */
(function () {
  var root = document.documentElement;
  var KEY = 'theme';
  var fixes = 0;

  function ok(v) { return v === 'light' || v === 'dark'; }
  function read(store) {
    try { var v = window[store].getItem(KEY); return ok(v) ? v : null; } catch (e) { return null; }
  }
  function save(v) {
    try { localStorage.setItem(KEY, v); } catch (e) {}
    try { sessionStorage.setItem(KEY, v); } catch (e) {}
  }
  /* "#experience~dark" -> {sec:'experience', theme:'dark'}; "#dark" -> {sec:'', theme:'dark'} */
  function parts(hash) {
    var h = (hash || '').replace(/^#/, '');
    var i = h.lastIndexOf('~');
    var sec = i >= 0 ? h.slice(0, i) : h;
    var th = i >= 0 ? h.slice(i + 1) : '';
    if (i < 0 && ok(h)) { sec = ''; th = h; }
    return { sec: sec, theme: ok(th) ? th : '' };
  }

  /* can this browser keep the choice? if not, fall back to carrying it in the address */
  function canStore(store) { try { var k = '_t'; window[store].setItem(k, '1'); window[store].removeItem(k); return true; } catch (e) { return false; } }
  var carry = !(canStore('localStorage') || canStore('sessionStorage'));

  var p0 = parts(location.hash);
  var current = p0.theme || read('localStorage') || read('sessionStorage') || 'dark';
  if (p0.theme) save(current);

  /* keep the address bar tidy: no theme tag, no section tag, no ".html" on the live site.
     The section a visitor arrived with is kept in siteTheme.entry for the page script. */
  (function tidy() {
    try {
      if (carry) return;
      var path = location.pathname;
      if (/^https?:$/.test(location.protocol) && !/\/404\.html$/.test(path)) path = path.replace(/(^|\/)index\.html$/, '$1').replace(/\.html$/, '');
      var want = path + location.search;
      if (want !== location.pathname + location.search || location.hash) history.replaceState(history.state, '', want);
    } catch (e) {}
  })();

  function apply() {
    if (root.getAttribute('data-theme') !== current) root.setAttribute('data-theme', current);
  }
  apply();

  try {
    new MutationObserver(function () {
      if (root.getAttribute('data-theme') !== current && fixes < 40) { fixes++; apply(); }
    }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  } catch (e) {}

  function tag(a) {
    if (!carry) return;
    var href = a.getAttribute('href') || '';
    var m = /^([\w-]+\.html)(#.*)?$/.exec(href);
    if (!m) return;
    var sec = parts(m[2]).sec;
    a.setAttribute('href', m[1] + '#' + (sec ? sec + '~' : '') + current);
  }
  function tagAll() {
    var list = document.querySelectorAll('a[href]');
    for (var i = 0; i < list.length; i++) tag(list[i]);
  }
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (a) tag(a);
  }, true);
  document.addEventListener('DOMContentLoaded', tagAll);

  window.siteTheme = {
    get: function () { return current; },
    parts: parts,
    entry: p0.sec,
    set: function (v) {
      if (!ok(v)) return;
      current = v;
      fixes = 0;
      apply();
      save(v);
      tagAll();
    }
  };
})();
