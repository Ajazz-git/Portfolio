/* motion base for the home page: scroll signal bar, boot-in reveals, link-up tag */
(function () {
  if (!document.getElementById('home')) return;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hd = document.querySelector('.top');
  var sig = document.createElement('i'); sig.className = 'sig'; sig.setAttribute('aria-hidden', 'true');
  if (hd) hd.appendChild(sig);
  var tk = false;
  function prog() { tk = false; var m = document.documentElement.scrollHeight - window.innerHeight; sig.style.setProperty('--p', m > 0 ? Math.min(1, window.pageYOffset / m).toFixed(4) : 0); }
  window.addEventListener('scroll', function () { if (!tk) { tk = true; requestAnimationFrame(prog); } }, { passive: true });
  window.addEventListener('resize', prog); prog();
  if (reduce || !('IntersectionObserver' in window)) return;

  /* boot-in reveals: each section fades and rises once; sections above the view show at once */
  var els = document.querySelectorAll('.part > .wrap:not(.hero):not(.next)');
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (e.isIntersecting || e.boundingClientRect.top < 0) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.06, rootMargin: '0px 0px -6% 0px' });
  Array.prototype.forEach.call(els, function (el) { el.classList.add('rv'); io.observe(el); });
  document.documentElement.classList.add('mo');
  setTimeout(function () { Array.prototype.forEach.call(document.querySelectorAll('.rv:not(.in)'), function (el) { if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('in'); }); }, 1500);

  /* link-up tag: when you settle on a new section, its nav link pings and a small tag ticks in */
  var tag = document.createElement('div'); tag.className = 'sigtag'; tag.setAttribute('aria-hidden', 'true');
  document.body.appendChild(tag);
  var t1, t2, t0 = Date.now(), first = true;
  document.addEventListener('sec', function (e) {
    var id = e.detail; clearTimeout(t1);
    if (first) { first = false; if (Date.now() - t0 < 2500) return; }
    t1 = setTimeout(function () {
      var a = document.querySelector('.nav a[aria-current], .nav .dd-b[aria-current]');
      if (a) { a.classList.remove('ping'); void a.offsetWidth; a.classList.add('ping'); }
      var l = document.querySelector('.nav a[href*="#' + id + '"]');
      tag.innerHTML = '<i></i>link up · ' + ((l && l.textContent.trim()) || id);
      tag.classList.add('on'); clearTimeout(t2); t2 = setTimeout(function () { tag.classList.remove('on'); }, 1500);
    }, 320);
  });
})();

/* site map and patch panel behaviour */
(function () {
  var wrap = document.querySelector('.mapwrap'); if (!wrap) return;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var maps = wrap.querySelectorAll('svg.map');
  var con = document.getElementById('pp-con'), ports = document.querySelectorAll('.pp .port');
  function pad(s, n) { s = String(s); while (s.length < n) s += ' '; return s; }
  function show(p) {
    if (!con) return;
    var d = p ? p.dataset : null;
    con.innerHTML = '<span class="h">' + pad('Port', 8) + pad('Name', 13) + pad('Status', 12) + 'Speed</span>\n'
      + (d ? '<b>' + pad(d.if, 8) + '</b>' + pad(d.n, 13) + pad(d.st, 12) + d.sp + '\n<span class="h">' + d.d + '</span>' : '<span class="h">hover or focus a port to inspect it</span>\n');
  }
  show(null);
  Array.prototype.forEach.call(ports, function (p) {
    p.addEventListener('mouseenter', function () { show(p); }); p.addEventListener('focus', function () { show(p); });
    p.addEventListener('mouseleave', function () { show(null); }); p.addEventListener('blur', function () { show(null); });
  });
  function pauseAll(on) { Array.prototype.forEach.call(maps, function (m) { try { if (on) m.pauseAnimations(); else m.unpauseAnimations(); } catch (e) {} }); }
  function done() { Array.prototype.forEach.call(maps, function (m) { m.classList.remove('pre'); }); }
  if (reduce || !('IntersectionObserver' in window)) { done(); } else {
    var booted = false;
    new IntersectionObserver(function (es) {
      var v = es[0].isIntersecting;
      if (v && !booted) { booted = true; Array.prototype.forEach.call(maps, function (m) { m.classList.remove('pre'); m.classList.add('boot'); }); }
      pauseAll(!v);
    }, { threshold: 0.25 }).observe(wrap);
  }
  /* click: a packet races down the cable, then the page goes there */
  wrap.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a.dv');
    if (!a || a._go || a._busy || reduce || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault(); e.stopPropagation(); a._busy = true;
    var path = a.querySelector('.cab'), svg = a.ownerSVGElement, len = path.getTotalLength();
    var c = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); c.setAttribute('r', 5); c.setAttribute('class', 'rpk'); svg.appendChild(c);
    var t0 = performance.now();
    (function step(now) {
      var k = Math.min(1, (now - t0) / 420), pt = path.getPointAtLength(len * k);
      c.setAttribute('cx', pt.x); c.setAttribute('cy', pt.y);
      if (k < 1) requestAnimationFrame(step);
      else { c.remove(); a._busy = false; a._go = true; a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 })); a._go = false; }
    })(t0);
  }, true);
})();

/* experience: timeline rail that fills as you scroll, cards that arrive in turn, figures that count up */
(function () {
  var devs = document.querySelector('.devs'); if (!devs) return;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cards = devs.querySelectorAll('.dev');
  Array.prototype.forEach.call(cards, function (c, i) { c.style.setProperty('--i', i); });
  function size() { var l = cards[cards.length - 1]; if (l) devs.style.setProperty('--rb', Math.max(0, l.offsetHeight - 36) + 'px'); }
  size(); window.addEventListener('resize', size); window.addEventListener('load', size);
  if (reduce) { devs.style.setProperty('--p', 1); Array.prototype.forEach.call(cards, function (c) { c.classList.add('lit'); }); }
  else {
    var tk = false;
    var upd = function () {
      tk = false;
      var r = devs.getBoundingClientRect(), line = window.innerHeight * 0.62;
      devs.style.setProperty('--p', Math.max(0, Math.min(1, (line - r.top - 36) / Math.max(1, r.height - 72))).toFixed(3));
      Array.prototype.forEach.call(cards, function (c) { c.classList.toggle('lit', c.getBoundingClientRect().top + 30 < line); });
    };
    window.addEventListener('scroll', function () { if (!tk) { tk = true; requestAnimationFrame(upd); } }, { passive: true });
    window.addEventListener('resize', upd); upd();
  }
  /* count-up for the numbers in the story figures */
  var figs = document.querySelectorAll('.story .fig'), st = document.querySelector('.stories');
  if (reduce || !st || !('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function (es) {
    if (!es[0].isIntersecting) return; io.disconnect();
    Array.prototype.forEach.call(figs, function (f) {
      var txt = f.textContent, nums = txt.match(/\d+/g); if (!nums) return;
      var t0 = performance.now(), dur = 900;
      (function step(now) {
        var k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3), n = 0;
        f.textContent = txt.replace(/\d+/g, function (m) { return Math.round(parseInt(m, 10) * e); });
        if (k < 1) requestAnimationFrame(step); else f.textContent = txt;
      })(t0);
      setTimeout(function () { f.textContent = txt; }, 1300);
    });
  }, { threshold: 0.3 });
  io.observe(st);
})();

/* skills: cards rise in turn, level meters fill, a soft spotlight follows the pointer */
(function () {
  var cards = document.querySelectorAll('.pcard'); if (!cards.length) return;
  var fine = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
  Array.prototype.forEach.call(cards, function (c, i) {
    c.style.setProperty('--i', i);
    var lv = { daily: 3, working: 2, learning: 1 }[c.getAttribute('data-level')] || 1, tag = c.querySelector('.lvl-tag');
    if (tag && !tag.querySelector('.mt')) {
      var m = document.createElement('span'); m.className = 'mt'; m.setAttribute('aria-hidden', 'true');
      for (var k = 0; k < 3; k++) { var b = document.createElement('i'); if (k < lv) b.className = 'f'; b.style.setProperty('--k', k); m.appendChild(b); }
      tag.insertBefore(m, tag.firstChild);
    }
    if (fine) c.addEventListener('pointermove', function (e) {
      var r = c.getBoundingClientRect(); c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }, { passive: true });
  });
})();
