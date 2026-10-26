/* photo gallery: lightbox, filter chips, "show all" and a develop-on-scroll reveal. Used on any page with .shots */
(function () {
  var root = document.querySelector('.shots'); if (!root) return;
  var shots = [].slice.call(root.querySelectorAll('.shot')), filt = 'all', list = shots.slice(), cur = 0, last = null;
  var bar = document.querySelector('.shots-bar'), more = document.getElementById('shots-more');
  function vis() { return shots.filter(function (s) { return !s.hidden && getComputedStyle(s).display !== 'none'; }); }
  var dlg = document.createElement('dialog'); dlg.className = 'lb'; dlg.setAttribute('aria-label', 'Photo viewer');
  dlg.innerHTML = '<button type="button" class="lb-x" aria-label="Close photo">✕</button><button type="button" class="lb-p" aria-label="Previous photo">‹</button><button type="button" class="lb-n" aria-label="Next photo">›</button>'
    + '<figure class="lb-f"><div class="lb-img"><img alt=""></div><figcaption><span class="lb-c"></span><b class="lb-t"></b></figcaption></figure>';
  document.body.appendChild(dlg);
  var img = dlg.querySelector('img'), cnt = dlg.querySelector('.lb-c'), ttl = dlg.querySelector('.lb-t');
  function pad(n) { return ('0' + n).slice(-2); }
  function show(i) {
    cur = (i + list.length) % list.length; var s = list[cur], a = s.querySelector('img');
    img.classList.remove('in'); img.src = s.dataset.full; img.alt = a.alt; img.width = +s.dataset.w; img.height = +s.dataset.h;
    cnt.textContent = pad(cur + 1) + ' / ' + pad(list.length); ttl.textContent = s.querySelector('figcaption').textContent;
    var go = function () { img.classList.add('in'); }; if (img.complete) go(); else img.onload = go;
    var nx = new Image(); nx.src = list[(cur + 1) % list.length].dataset.full;
  }
  shots.forEach(function (s) { s.querySelector('button').addEventListener('click', function (e) { list = vis(); last = e.currentTarget; if (!dlg.open) dlg.showModal(); show(list.indexOf(s)); }); });
  dlg.querySelector('.lb-x').addEventListener('click', function () { dlg.close(); });
  dlg.querySelector('.lb-p').addEventListener('click', function () { show(cur - 1); });
  dlg.querySelector('.lb-n').addEventListener('click', function () { show(cur + 1); });
  dlg.addEventListener('click', function (e) { var c = e.target.classList; if (e.target === dlg || c.contains('lb-f') || c.contains('lb-img')) dlg.close(); });
  dlg.addEventListener('close', function () { if (last && last.focus) last.focus(); });
  dlg.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') show(cur - 1); else if (e.key === 'ArrowRight') show(cur + 1); });
  var x0 = null;
  dlg.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  dlg.addEventListener('touchend', function (e) { if (x0 === null) return; var d = e.changedTouches[0].clientX - x0; x0 = null; if (Math.abs(d) > 50) show(cur + (d < 0 ? 1 : -1)); }, { passive: true });

  /* filter chips and the show-all toggle (only on galleries that have them) */
  function moreLabel() { if (!more) return; var open = !root.classList.contains('collapsed'); more.textContent = open ? 'Show fewer ↑' : 'Show all ' + shots.length + ' photos ↓'; more.setAttribute('aria-expanded', String(open)); }
  if (bar) bar.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-f]'); if (!b) return; filt = b.dataset.f;
    [].forEach.call(bar.querySelectorAll('button'), function (x) { x.setAttribute('aria-pressed', String(x === b)); });
    shots.forEach(function (s) { s.hidden = filt !== 'all' && s.dataset.cat !== filt; });
    if (filt !== 'all') root.classList.remove('collapsed'); else root.classList.add('collapsed');
    if (more) more.parentNode.hidden = filt !== 'all';
    moreLabel(); watch();
  });
  if (more) more.addEventListener('click', function () {
    var willOpen = root.classList.contains('collapsed'); root.classList.toggle('collapsed', !willOpen); moreLabel(); watch();
    if (!willOpen) root.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  });
  moreLabel();

  /* develop-on-scroll for justified galleries (the Aabasoft mosaic reveals with its section) */
  var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('dev'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -4% 0px', threshold: 0.12 }) : null;
  function watch() { shots.forEach(function (s) { if (!io) { s.classList.add('dev'); return; } if (!s.classList.contains('dev')) io.observe(s); }); }
  if (root.classList.contains('jr')) watch();
})();
