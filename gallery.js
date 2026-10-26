/* photo gallery: lightbox, filter chips, "show all" and a develop-on-scroll reveal. Used on any page with .shots */
(function () {
  var root = document.querySelector('.shots'); if (!root) return;
  var shots = [].slice.call(root.querySelectorAll('.shot')), filt = 'all', list = shots.slice(), cur = 0, last = null, playing = false, timer = 0, DUR = 4200;
  var RM = matchMedia('(prefers-reduced-motion: reduce)').matches, FINE = matchMedia('(hover:hover) and (pointer:fine)').matches;
  var bar = document.querySelector('.shots-bar'), more = document.getElementById('shots-more');
  function pool() { return filt === 'all' ? shots.slice() : vis(); }
  function vis() { return shots.filter(function (s) { return !s.hidden && getComputedStyle(s).display !== 'none'; }); }
  var dlg = document.createElement('dialog'); dlg.className = 'lb'; dlg.setAttribute('aria-label', 'Photo viewer');
  dlg.innerHTML = '<i class="lb-bar" aria-hidden="true"></i><button type="button" class="lb-play" aria-pressed="false" aria-label="Play slideshow">▶ <span>play</span></button><button type="button" class="lb-x" aria-label="Close photo">✕</button><button type="button" class="lb-p" aria-label="Previous photo">‹</button><button type="button" class="lb-n" aria-label="Next photo">›</button>'
    + '<figure class="lb-f"><div class="lb-img"><img alt=""></div><figcaption><span class="lb-c"></span><b class="lb-t"></b></figcaption></figure>';
  document.body.appendChild(dlg);
  var img = dlg.querySelector('img'), cnt = dlg.querySelector('.lb-c'), ttl = dlg.querySelector('.lb-t'), bar0 = dlg.querySelector('.lb-bar'), pbtn = dlg.querySelector('.lb-play');
  function pad(n) { return ('0' + n).slice(-2); }
  function show(i) {
    cur = (i + list.length) % list.length; var s = list[cur], a = s.querySelector('img');
    img.classList.remove('in'); img.src = s.dataset.full; img.alt = a.alt; img.width = +s.dataset.w; img.height = +s.dataset.h;
    cnt.textContent = pad(cur + 1) + ' / ' + pad(list.length); ttl.textContent = s.querySelector('figcaption').textContent;
    var go = function () { img.classList.add('in'); schedule(); }; if (img.complete) go(); else img.onload = go;
    var nx = new Image(); nx.src = list[(cur + 1) % list.length].dataset.full;
  }
  function schedule() { clearTimeout(timer); bar0.classList.remove('run'); if (!playing || !dlg.open) return; void bar0.offsetWidth; bar0.classList.add('run'); timer = setTimeout(function () { show(cur + 1); }, DUR); }
  function setPlay(on) { playing = on; dlg.classList.toggle('playing', on); pbtn.setAttribute('aria-pressed', String(on)); pbtn.innerHTML = on ? '❚❚ <span>pause</span>' : '▶ <span>play</span>'; pbtn.setAttribute('aria-label', on ? 'Pause slideshow' : 'Play slideshow'); schedule(); }
  function openList(l, i, from, play) { list = l; last = from || null; if (!dlg.open) dlg.showModal(); show(i); setPlay(!!play); }
  shots.forEach(function (s) { s.querySelector('button').addEventListener('click', function (e) { var l = pool(); openList(l, l.indexOf(s), e.currentTarget); }); });
  pbtn.addEventListener('click', function () { setPlay(!playing); });
  dlg.querySelector('.lb-x').addEventListener('click', function () { dlg.close(); });
  dlg.addEventListener('close', function () { setPlay(false); });
  dlg.querySelector('.lb-p').addEventListener('click', function () { show(cur - 1); });
  dlg.querySelector('.lb-n').addEventListener('click', function () { show(cur + 1); });
  dlg.addEventListener('click', function (e) { var c = e.target.classList; if (e.target === dlg || c.contains('lb-f') || c.contains('lb-img')) dlg.close(); });
  dlg.addEventListener('close', function () { if (last && last.focus) last.focus(); });
  dlg.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') show(cur - 1); else if (e.key === 'ArrowRight') show(cur + 1); else if (e.key === ' ' && e.target !== pbtn) { e.preventDefault(); setPlay(!playing); } });
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

  /* a "play slideshow" chip next to the gallery details */
  var meta = document.querySelector('.shots-meta');
  if (meta) { var pc = document.createElement('button'); pc.type = 'button'; pc.className = 'chip shots-play'; pc.textContent = '▶ play slideshow'; pc.addEventListener('click', function (e) { openList(pool(), 0, e.currentTarget, true); }); meta.appendChild(pc); }

  /* drifting photo reel: two rows moving in opposite directions; hover pauses, click opens the photo */
  var mq = document.querySelector('.mq');
  if (mq && shots.length > 8) {
    var half = Math.min(14, Math.ceil(shots.length / 2)), rowsA = [shots.slice(0, half), shots.slice(half, half * 2)];
    rowsA.forEach(function (arr, r) {
      var row = document.createElement('div'); row.className = 'mq-r' + (r ? ' rev' : ''); var tr = document.createElement('div'); tr.className = 'mq-t';
      function add(s, clone) {
        var im = s.querySelector('img'), b = document.createElement('button'); b.type = 'button'; b.className = 'mq-i'; if (clone) { b.tabIndex = -1; b.setAttribute('aria-hidden', 'true'); }
        else b.setAttribute('aria-label', 'Open photo: ' + im.alt);
        var c = document.createElement('img'); c.src = im.currentSrc || im.src; c.alt = clone ? '' : im.alt; c.setAttribute('width', im.getAttribute('width')); c.setAttribute('height', im.getAttribute('height')); c.loading = 'lazy'; c.decoding = 'async'; b.appendChild(c);
        b.addEventListener('click', function (e) { openList(shots.slice(), shots.indexOf(s), e.currentTarget); }); tr.appendChild(b);
      }
      arr.forEach(function (s) { add(s, false); }); if (!RM) arr.forEach(function (s) { add(s, true); });
      row.appendChild(tr); mq.appendChild(row);
    });
    mq.classList.add('on'); if (RM) mq.classList.add('still');
  }

  /* tilt and glare on the grid tiles (mouse only, motion allowed) */
  if (root.classList.contains('jr') && FINE && !RM) {
    var tl = null;
    root.addEventListener('pointermove', function (e) {
      var s = e.target.closest && e.target.closest('.shot'); if (tl && tl !== s) { tl.style.transform = ''; } tl = s; if (!s) return;
      var r = s.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      s.style.setProperty('--mx', (px * 100).toFixed(0) + '%'); s.style.setProperty('--my', (py * 100).toFixed(0) + '%');
      s.style.transform = 'perspective(800px) rotateX(' + ((.5 - py) * 5).toFixed(2) + 'deg) rotateY(' + ((px - .5) * 6).toFixed(2) + 'deg) translateY(-3px)';
    }, { passive: true });
    root.addEventListener('pointerleave', function () { if (tl) tl.style.transform = ''; tl = null; });
  }
})();
