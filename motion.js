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
