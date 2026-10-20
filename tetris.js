/* Tetris for the home-page terminal: window.Tetris.start(termEl, onExit) */
(function () {
  var COLS = 10, ROWS = 20;
  var SH = {
    I: [[0, 1], [1, 1], [2, 1], [3, 1]], O: [[1, 0], [2, 0], [1, 1], [2, 1]], T: [[1, 0], [0, 1], [1, 1], [2, 1]],
    S: [[1, 0], [2, 0], [0, 1], [1, 1]], Z: [[0, 0], [1, 0], [1, 1], [2, 1]], J: [[0, 0], [0, 1], [1, 1], [2, 1]], L: [[2, 0], [0, 1], [1, 1], [2, 1]]
  };
  var NAMES = Object.keys(SH);
  var COL = { I: '#22d3ee', O: '#fbbf24', T: '#a78bfa', S: '#4ade80', Z: '#f87171', J: '#60a5fa', L: '#fb923c' };
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function put(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  function rot(cells, n) {            /* rotate clockwise inside an n x n box */
    return cells.map(function (c) { return [n - 1 - c[1], c[0]]; });
  }
  function box(name) { return name === 'I' ? 4 : name === 'O' ? 4 : 3; }

  function start(term, onExit) {
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var ov = document.createElement('div');
    ov.className = 'tt'; ov.tabIndex = -1;
    ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', 'Tetris');
    ov.innerHTML = '<div class="tt-top"><span class="tt-ps">$</span> ./tetris.sh <span class="tt-dim">--seed random</span><span class="tt-toast" aria-live="polite"></span><span class="tt-pid">pid 4242 · <i></i> live</span></div>'
      + '<div class="tt-main">'
      + '<div class="tt-l"><div class="tt-box" data-t="score"><div class="tt-big" data-k="s">0</div></div>'
      + '<div class="tt-box" data-t="stats"><div class="tt-st">lines <b data-k="l">0</b></div><div class="tt-st">level <b data-k="v">1</b></div><div class="tt-st">best <b data-k="b">0</b></div><div class="tt-st">time <b data-k="t">00:00</b></div></div>'
      + '<div class="tt-box tt-load" data-t="load"><div class="tt-st">lvl <span class="tt-bar" data-k="bl"></span></div><div class="tt-st">stack <span class="tt-bar" data-k="bs"></span></div><div class="tt-st">speed <span class="tt-bar" data-k="bv"></span></div></div></div>'
      + '<div class="tt-mid"><div class="tt-bw"><canvas class="tt-c" aria-hidden="true"></canvas><div class="tt-msg" hidden></div></div></div>'
      + '<div class="tt-r"><div class="tt-box" data-t="next"><canvas class="tt-n" aria-hidden="true"></canvas></div>'
      + '<div class="tt-box tt-logb" data-t="log"><div class="tt-log" aria-live="off"></div></div>'
      + '<div class="tt-box tt-keys" data-t="keys"><div><kbd>←</kbd><kbd>→</kbd> move</div><div><kbd>↑</kbd> rotate</div><div><kbd>↓</kbd> soft drop</div><div><kbd>space</kbd> slam</div><div><kbd>P</kbd> pause <kbd>Q</kbd> quit</div></div>'
      + '<div class="tt-pad"><button type="button" data-a="L" aria-label="Left">◀</button><button type="button" data-a="RT" aria-label="Right">▶</button><button type="button" data-a="U" aria-label="Rotate">⟳</button>'
      + '<button type="button" data-a="D" aria-label="Down">▼</button><button type="button" data-a="S" aria-label="Slam">⤓</button><button type="button" data-a="Q" aria-label="Quit">✕</button></div></div>'
      + '</div><div class="tt-sb"><span class="tt-mode">PLAYING</span><span class="tt-sp"></span><span class="tt-hint">[tetris] 0:play* · best saved in this browser</span></div>';
    var bar = term.querySelector('.term-bar');
    if (bar) ov.style.top = bar.offsetHeight + 'px';
    var th = Math.round(Math.max(440, Math.min(window.innerWidth <= 760 ? 600 : 640, window.innerHeight - 110)));
    term.style.setProperty('--tth', th + 'px'); term.classList.add('tt-on');
    term.appendChild(ov);
    try { ov.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' }); } catch (e) {}
    var cv = ov.querySelector('.tt-c'), cx = cv.getContext('2d'), nv = ov.querySelector('.tt-n'), nx = nv.getContext('2d');
    var bw = ov.querySelector('.tt-bw'), mid = ov.querySelector('.tt-mid'), msg = ov.querySelector('.tt-msg');
    var mode = ov.querySelector('.tt-mode'), toastEl = ov.querySelector('.tt-toast'), toastT;
    var el = {}; ['s', 'l', 'v', 'b', 't', 'bl', 'bs', 'bv'].forEach(function (k) { el[k] = ov.querySelector('[data-k=' + k + ']'); });
    var cell = 16, parts = [];
    function size() {
      var narrow = window.matchMedia('(hover: none), (max-width: 760px)').matches;
      var hA = ov.clientHeight - ov.querySelector('.tt-top').offsetHeight - ov.querySelector('.tt-sb').offsetHeight - 34;
      var wA = ov.clientWidth - (narrow ? 36 + 118 : 36 + 2 * 200 + 36);
      if (hA < 120 || wA < 60) return;
      var nc = Math.max(10, Math.min(36, Math.floor(Math.min(hA / ROWS, wA / COLS))));
      if (nc === cell && cv.width) return;
      cell = nc;
      var d = window.devicePixelRatio || 1;
      cv.width = COLS * cell * d; cv.height = ROWS * cell * d;
      cv.style.width = COLS * cell + 'px'; cv.style.height = ROWS * cell + 'px';
      cx.setTransform(d, 0, 0, d, 0, 0);
      mid.style.width = COLS * cell + 12 + 'px';
      nv.width = 76 * d; nv.height = 138 * d; nv.style.width = '76px'; nv.style.height = '138px'; nx.setTransform(d, 0, 0, d, 0, 0);
      draw(); if (queue.length) drawNext();
    }
    var css = getComputedStyle(document.documentElement);
    function cvar(n, f) { return (css.getPropertyValue(n) || '').trim() || f; }
    var logEl = ov.querySelector('.tt-log'), play = 0;
    function clock() { var t = Math.floor(play / 1000); return ('0' + Math.floor(t / 60)).slice(-2) + ':' + ('0' + t % 60).slice(-2); }
    function log(t) { var d = document.createElement('div'); d.innerHTML = '<i>' + clock() + '</i> ' + t; logEl.insertBefore(d, logEl.firstChild); while (logEl.children.length > 7) logEl.removeChild(logEl.lastChild); }
    function meter(f) { var n = Math.max(0, Math.min(10, Math.round(f * 10))); return new Array(n + 1).join('\u2588') + new Array(11 - n).join('\u2591'); }
    function setMode(t) { mode.textContent = t; }
    function toast(t) { toastEl.textContent = t; clearTimeout(toastT); toastT = setTimeout(function () { toastEl.textContent = ''; }, 1400); }
    function shake() { if (reduce) return; bw.classList.remove('shake'); void bw.offsetWidth; bw.classList.add('shake'); }

    var grid, bag = [], queue = [], cur, score, lines, level, over, paused, acc, last, raf, flash, quit = false;
    var best = parseInt(get('tetris-best') || '0', 10) || 0;
    function showMsg(h) { msg.innerHTML = h; msg.hidden = false; }
    function draw7() { if (!bag.length) { bag = NAMES.slice(); for (var i = bag.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = bag[i]; bag[i] = bag[j]; bag[j] = t; } } return bag.pop(); }
    function mk(name) { return { n: name, c: SH[name].map(function (c) { return c.slice(); }), x: 3, y: name === 'I' ? -1 : 0 }; }
    function fits(p, dx, dy, cells) {
      cells = cells || p.c;
      for (var i = 0; i < cells.length; i++) {
        var x = p.x + cells[i][0] + dx, y = p.y + cells[i][1] + dy;
        if (x < 0 || x >= COLS || y >= ROWS) return false;
        if (y >= 0 && grid[y][x]) return false;
      }
      return true;
    }
    function spawn() {
      while (queue.length < 4) queue.push(draw7());
      cur = mk(queue.shift());
      if (!fits(cur, 0, 0)) { finish(); }
      drawNext();
    }
    function reset() {
      grid = []; for (var r = 0; r < ROWS; r++) grid.push(new Array(COLS).fill(0));
      score = 0; lines = 0; level = 1; play = 0; logEl.innerHTML = ''; over = false; paused = false; acc = 0; flash = null; queue = []; bag = []; parts = []; setMode('PLAYING');
      msg.hidden = true; spawn(); stats(); log('game started');
    }
    function stats() {
      var top = ROWS; for (var r = 0; r < ROWS; r++) if (grid[r].some(Boolean)) { top = r; break; }
      el.bl.textContent = meter((lines % 10) / 10); el.bs.textContent = meter((ROWS - top) / ROWS); el.bv.textContent = meter((level - 1) / 9); el.t.textContent = clock();
      el.s.textContent = score; el.l.textContent = lines; el.v.textContent = level; el.b.textContent = Math.max(best, score);
    }
    function interval() { return Math.max(70, 780 - (level - 1) * 68); }
    function lock() {
      cur.c.forEach(function (c) { var y = cur.y + c[1], x = cur.x + c[0]; if (y >= 0) grid[y][x] = cur.n; });
      var full = [];
      for (var r = 0; r < ROWS; r++) if (grid[r].every(Boolean)) full.push(r);
      if (full.length) { flash = { rows: full, until: performance.now() + 190 }; burst(full); }
      else spawn();
    }
    function clearRows() {
      var n = flash.rows.length;
      flash.rows.forEach(function (r) { grid.splice(r, 1); grid.unshift(new Array(COLS).fill(0)); });
      flash = null; lines += n; score += [0, 100, 300, 500, 800][n] * level;
      log('cleared ' + n + (n > 1 ? ' lines' : ' line') + ' <b>+' + [0, 100, 300, 500, 800][n] * level + '</b>'); var lv = 1 + Math.floor(lines / 10); if (lv > level) { toast('LEVEL ' + lv); log('level up <b>' + lv + '</b>'); } else if (n === 4) toast('TETRIS!'); else if (n > 1) toast(['', '', 'DOUBLE', 'TRIPLE'][n]);
      level = lv; stats(); spawn();
    }
    function finish() {
      over = true; setMode('GAME OVER');
      if (score > best) { best = score; put('tetris-best', String(best)); log('new best <b>' + best + '</b>'); }
      log('game over'); stats();
      showMsg('<b>game over</b><span>score ' + score + '</span><span>tap or R to play again</span><span>Q to quit</span>');
    }
    function move(dx) { if (cur && !flash && fits(cur, dx, 0)) { cur.x += dx; draw(); } }
    function turn() {
      if (!cur || flash) return;
      var n = box(cur.n), r = rot(cur.c.map(function (c) { return [c[0], c[1]]; }), n);
      if (cur.n === 'O') return;
      var kicks = [0, -1, 1, -2, 2];
      for (var i = 0; i < kicks.length; i++) { if (fits(cur, kicks[i], 0, r)) { cur.c = r; cur.x += kicks[i]; draw(); return; } }
    }
    function drop(soft) {
      if (!cur || flash) return;
      if (fits(cur, 0, 1)) { cur.y++; if (soft) { score += 1; stats(); } acc = 0; }
      else { lock(); acc = 0; }
      draw();
    }
    function slam() {
      if (!cur || flash) return;
      var n = 0; while (fits(cur, 0, 1)) { cur.y++; n++; }
      score += n * 2; lock(); acc = 0; stats(); shake(); draw();
    }
    function act(a) {
      if (a === 'Q') return close();
      if (over) { if (a === 'N') reset(); return; }
      if (a === 'P') { paused = !paused; if (paused) { setMode('PAUSED'); showMsg('<b>paused</b><span>tap or P to resume</span>'); } else { setMode('PLAYING'); msg.hidden = true; } return; }
      if (paused) return;
      if (a === 'L') move(-1); else if (a === 'RT') move(1); else if (a === 'U') turn(); else if (a === 'D') drop(true); else if (a === 'S') slam();
    }
    var KEYS = { ArrowLeft: 'L', a: 'L', A: 'L', ArrowRight: 'RT', d: 'RT', D: 'RT', ArrowUp: 'U', w: 'U', W: 'U', x: 'U', X: 'U', ArrowDown: 'D', s: 'D', S: 'D', ' ': 'S', p: 'P', P: 'P', q: 'Q', Q: 'Q', Escape: 'Q', r: 'N', R: 'N' };
    function onKey(e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      var a = KEYS[e.key]; if (!a) return;
      if (a === 'N' && !over) return;
      e.preventDefault(); act(a);
    }
    document.addEventListener('keydown', onKey);
    ov.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-a]'); if (b) { act(b.getAttribute('data-a')); return; }
      if (e.target.closest('.tt-msg')) { if (over) reset(); else if (paused) act('P'); }
    });
    function onVis() { if (document.hidden && !over && !paused) { paused = true; setMode('PAUSED'); showMsg('<b>paused</b><span>tap or P to resume</span>'); } }
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('resize', size);
    var ro = window.ResizeObserver ? new ResizeObserver(size) : null; if (ro) ro.observe(ov);

    function burst(rows) {
      if (reduce) return;
      rows.forEach(function (r) { for (var i = 0; i < 14; i++) parts.push({ x: Math.random() * COLS * cell, y: r * cell + cell / 2, vx: (Math.random() - .5) * 240, vy: -60 - Math.random() * 160, life: .6 + Math.random() * .3, t: 0, c: COL[NAMES[Math.floor(Math.random() * 7)]] }); });
    }
    function block(c, x, y, col, s, a) {
      var pad = Math.max(1, Math.round(s * 0.07)), w = s - pad * 2, hl = Math.max(2, s * 0.16);
      c.globalAlpha = a || 1; c.fillStyle = col; c.fillRect(x * s + pad, y * s + pad, w, w);
      c.fillStyle = 'rgba(255,255,255,.34)'; c.fillRect(x * s + pad, y * s + pad, w, hl); c.fillRect(x * s + pad, y * s + pad, hl, w);
      c.fillStyle = 'rgba(0,0,0,.28)'; c.fillRect(x * s + pad, y * s + s - pad - hl, w, hl); c.fillRect(x * s + s - pad - hl, y * s + pad, hl, w);
      c.fillStyle = 'rgba(255,255,255,.16)'; c.fillRect(x * s + pad + hl, y * s + pad + hl, w - hl * 2, w - hl * 2);
      c.globalAlpha = 1;
    }
    function drawNext() {
      nx.clearRect(0, 0, 76, 138);
      for (var q = 0; q < 3; q++) {
        var nm = queue[q]; if (!nm) continue;
        var s = q ? 11 : 14, cells = SH[nm], minx = 9, maxx = 0, miny = 9, maxy = 0;
        cells.forEach(function (c) { minx = Math.min(minx, c[0]); maxx = Math.max(maxx, c[0]); miny = Math.min(miny, c[1]); maxy = Math.max(maxy, c[1]); });
        var slotH = q ? 38 : 56, top = q ? 56 + (q - 1) * 38 : 0;
        var ox = (76 - (maxx - minx + 1) * s) / 2 / s - minx, oy = (top + (slotH - (maxy - miny + 1) * s) / 2) / s - miny;
        cells.forEach(function (c) { block(nx, c[0] + ox, c[1] + oy, COL[nm], s, q ? 0.6 : 1); });
      }
    }
    function draw() {
      if (!grid) return;
      var W = COLS * cell, H = ROWS * cell, ac = cvar('--accent', '#3dff9a');
      cx.clearRect(0, 0, W, H);
      cx.fillStyle = cvar('--bg', '#050b08'); cx.fillRect(0, 0, W, H);
      cx.fillStyle = cvar('--accent', '#3dff9a'); cx.globalAlpha = 0.2;
      for (var i = 0; i < COLS; i++) for (var j = 0; j < ROWS; j++) cx.fillRect(i * cell + cell / 2 - 1, j * cell + cell / 2 - 1, 2, 2);
      cx.globalAlpha = 1;
      for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) if (grid[r][c]) block(cx, c, r, COL[grid[r][c]], cell);
      if (flash) {
        var k = Math.max(0, (flash.until - performance.now()) / 190);
        flash.rows.forEach(function (r) { cx.globalAlpha = 0.5 + 0.4 * k; cx.fillStyle = '#fff'; cx.fillRect(0, r * cell, W, cell); cx.globalAlpha = 1; cx.fillStyle = ac; cx.fillRect(0, r * cell + cell / 2 - 1, W * (1 - k), 2); });
      }
      if (cur && !over && !flash) {
        var g = 0; while (fits(cur, 0, g + 1)) g++;
        cx.strokeStyle = COL[cur.n]; cx.lineWidth = 1.5; cx.globalAlpha = 0.55;
        cur.c.forEach(function (c) { if (cur.y + c[1] + g >= 0 && g) cx.strokeRect((cur.x + c[0]) * cell + 2.5, (cur.y + c[1] + g) * cell + 2.5, cell - 5, cell - 5); });
        cx.globalAlpha = 1;
        cx.shadowColor = COL[cur.n]; cx.shadowBlur = 10;
        cur.c.forEach(function (c) { if (cur.y + c[1] >= 0) block(cx, cur.x + c[0], cur.y + c[1], COL[cur.n], cell); });
        cx.shadowBlur = 0;
      }
      parts.forEach(function (p) { cx.globalAlpha = Math.max(0, 1 - p.t / p.life); cx.fillStyle = p.c; cx.fillRect(p.x, p.y, 3, 3); });
      cx.globalAlpha = 1;
    }
    function loop(ts) {
      if (quit) return;
      var dt = Math.min(100, ts - (last || ts)); last = ts;
      if (parts.length) { parts = parts.filter(function (p) { p.t += dt / 1000; p.x += p.vx * dt / 1000; p.y += p.vy * dt / 1000; p.vy += 520 * dt / 1000; return p.t < p.life; }); if (!flash) draw(); }
      if (!over && !paused) {
        if (flash) { if (ts >= flash.until) clearRows(); draw(); }
        else { play += dt; if (Math.floor(play / 1000) !== Math.floor((play - dt) / 1000)) el.t.textContent = clock(); acc += dt; if (acc >= interval()) { acc = 0; drop(false); } }
      }
      raf = requestAnimationFrame(loop);
    }
    function close() {
      if (quit) return; quit = true; cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKey); document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('resize', size); if (ro) ro.disconnect(); clearTimeout(toastT);
      term.classList.remove('tt-on'); term.style.removeProperty('--tth');
      ov.remove(); if (onExit) onExit(score);
    }
    el.b.textContent = best;
    reset(); size(); draw(); ov.focus({ preventScroll: true });
    raf = requestAnimationFrame(loop);
    return { close: close };
  }
  window.Tetris = { start: start };
})();
