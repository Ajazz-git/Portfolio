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

  var p0 = parts(location.hash);
  var current = p0.theme || read('localStorage') || read('sessionStorage') || 'dark';
  if (p0.theme) save(current);

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
