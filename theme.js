/* Theme: dark by default, switchable. Runs before the page paints.
   The choice is kept in the page address of internal links (works even when storage is blocked),
   and in localStorage / sessionStorage. If the viewer sets its own data-theme, ours wins. */
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

  var h = (location.hash || '').replace('#', '');
  var current = ok(h) ? h : (read('localStorage') || read('sessionStorage') || 'dark');
  if (ok(h)) save(current);

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
    if (/^[\w-]+\.html(#.*)?$/.test(href)) a.setAttribute('href', href.split('#')[0] + '#' + current);
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
