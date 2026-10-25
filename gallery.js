/* photo gallery lightbox: click a frame to enlarge; arrows, swipe, Esc. Used on any page with .shots */
(function () {
  var shots = [].slice.call(document.querySelectorAll('.shots .shot'));
  if (!shots.length) return;
  var dlg = document.createElement('dialog'); dlg.className = 'lb'; dlg.setAttribute('aria-label', 'Photo viewer');
  dlg.innerHTML = '<button type="button" class="lb-x" aria-label="Close photo">✕</button><button type="button" class="lb-p" aria-label="Previous photo">‹</button><button type="button" class="lb-n" aria-label="Next photo">›</button>'
    + '<figure class="lb-f"><div class="lb-img"><img alt=""></div><figcaption><span class="lb-c"></span><b class="lb-t"></b></figcaption></figure>';
  document.body.appendChild(dlg);
  var img = dlg.querySelector('img'), cnt = dlg.querySelector('.lb-c'), ttl = dlg.querySelector('.lb-t'), cur = 0, last = null;
  function show(i) {
    cur = (i + shots.length) % shots.length; var s = shots[cur], a = s.querySelector('img');
    img.classList.remove('in'); img.src = s.dataset.full; img.alt = a.alt; img.width = +s.dataset.w; img.height = +s.dataset.h;
    cnt.textContent = ('0' + (cur + 1)).slice(-2) + ' / ' + ('0' + shots.length).slice(-2); ttl.textContent = s.querySelector('figcaption').textContent;
    var go = function () { img.classList.add('in'); }; if (img.complete) go(); else img.onload = go;
    var nx = new Image(); nx.src = shots[(cur + 1) % shots.length].dataset.full;
  }
  function open(i, from) { last = from; show(i); if (!dlg.open) dlg.showModal(); }
  shots.forEach(function (s, i) { s.querySelector('button').addEventListener('click', function (e) { open(i, e.currentTarget); }); });
  dlg.querySelector('.lb-x').addEventListener('click', function () { dlg.close(); });
  dlg.querySelector('.lb-p').addEventListener('click', function () { show(cur - 1); });
  dlg.querySelector('.lb-n').addEventListener('click', function () { show(cur + 1); });
  dlg.addEventListener('click', function (e) { if (e.target === dlg || e.target.classList.contains('lb-f') || e.target.classList.contains('lb-img')) dlg.close(); });
  dlg.addEventListener('close', function () { if (last && last.focus) last.focus(); });
  dlg.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') show(cur - 1); else if (e.key === 'ArrowRight') show(cur + 1); });
  var x0 = null;
  dlg.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  dlg.addEventListener('touchend', function (e) { if (x0 === null) return; var d = e.changedTouches[0].clientX - x0; x0 = null; if (Math.abs(d) > 50) show(cur + (d < 0 ? 1 : -1)); }, { passive: true });
})();
