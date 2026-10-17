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
    var ov = document.createElement('div');
    ov.className = 'tt'; ov.tabIndex = -1;
    ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', 'Tetris');
    ov.innerHTML = '<canvas class="tt-c" aria-hidden="true"></canvas><div class="tt-side">'
      + '<div class="tt-t">TETRIS</div><div class="tt-st">score <b data-k="s">0</b></div><div class="tt-st">lines <b data-k="l">0</b></div>'
      + '<div class="tt-st">level <b data-k="v">1</b></div><div class="tt-st">best <b data-k="b">0</b></div>'
      + '<canvas class="tt-n" width="72" height="48" aria-hidden="true"></canvas>'
      + '<div class="tt-keys">← → move<br>↑ rotate · ↓ drop<br>space slam<br>P pause · Q quit</div>'
      + '<div class="tt-pad"><button type="button" data-a="L" aria-label="Left">◀</button><button type="button" data-a="RT" aria-label="Right">▶</button><button type="button" data-a="U" aria-label="Rotate">⟳</button>'
      + '<button type="button" data-a="D" aria-label="Down">▼</button><button type="button" data-a="S" aria-label="Slam">⤓</button><button type="button" data-a="Q" aria-label="Quit">✕</button></div></div>'
      + '<div class="tt-msg" hidden></div>';
    var bar = term.querySelector('.term-bar');
    if (bar) ov.style.top = bar.offsetHeight + 'px';
    term.appendChild(ov);
    var cv = ov.querySelector('.tt-c'), cx = cv.getContext('2d'), nv = ov.querySelector('.tt-n'), nx = nv.getContext('2d');
    var msg = ov.querySelector('.tt-msg');
    var el = {}; ['s', 'l', 'v', 'b'].forEach(function (k) { el[k] = ov.querySelector('[data-k=' + k + ']'); });
    var cell = 16;
    function size() {
      var h = ov.clientHeight - 16, w = ov.clientWidth - 140;
      cell = Math.max(10, Math.min(24, Math.floor(h / ROWS), Math.floor(w / COLS)));
      var d = window.devicePixelRatio || 1;
      cv.width = COLS * cell * d; cv.height = ROWS * cell * d;
      cv.style.width = COLS * cell + 'px'; cv.style.height = ROWS * cell + 'px';
      cx.setTransform(d, 0, 0, d, 0, 0);
      draw();
    }
    var css = getComputedStyle(document.documentElement);
    function cvar(n, f) { return (css.getPropertyValue(n) || '').trim() || f; }

    var grid, bag = [], cur, next, score, lines, level, over, paused, acc, last, raf, flash, quit = false;
    var best = parseInt(get('tetris-best') || '0', 10) || 0;
    function showMsg(h) {
      msg.innerHTML = h; msg.hidden = false;
      msg.style.cssText = 'left:' + cv.offsetLeft + 'px;top:' + cv.offsetTop + 'px;width:' + cv.offsetWidth + 'px;height:' + cv.offsetHeight + 'px;inset:auto;';
      msg.style.left = cv.offsetLeft + 'px'; msg.style.top = cv.offsetTop + 'px';
    }
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
      cur = next ? mk(next) : mk(draw7()); next = draw7();
      if (!fits(cur, 0, 0)) { finish(); }
      drawNext();
    }
    function reset() {
      grid = []; for (var r = 0; r < ROWS; r++) grid.push(new Array(COLS).fill(0));
      score = 0; lines = 0; level = 1; over = false; paused = false; acc = 0; flash = null; next = null; bag = [];
      msg.hidden = true; spawn(); stats();
    }
    function stats() { el.s.textContent = score; el.l.textContent = lines; el.v.textContent = level; el.b.textContent = Math.max(best, score); }
    function interval() { return Math.max(70, 780 - (level - 1) * 68); }
    function lock() {
      cur.c.forEach(function (c) { var y = cur.y + c[1], x = cur.x + c[0]; if (y >= 0) grid[y][x] = cur.n; });
      var full = [];
      for (var r = 0; r < ROWS; r++) if (grid[r].every(Boolean)) full.push(r);
      if (full.length) { flash = { rows: full, until: performance.now() + 170 }; }
      else spawn();
    }
    function clearRows() {
      var n = flash.rows.length;
      flash.rows.forEach(function (r) { grid.splice(r, 1); grid.unshift(new Array(COLS).fill(0)); });
      flash = null; lines += n; score += [0, 100, 300, 500, 800][n] * level;
      level = 1 + Math.floor(lines / 10); stats(); spawn();
    }
    function finish() {
      over = true;
      if (score > best) { best = score; put('tetris-best', String(best)); }
      stats();
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
      score += n * 2; lock(); acc = 0; stats(); draw();
    }
    function act(a) {
      if (a === 'Q') return close();
      if (over) { if (a === 'N') reset(); return; }
      if (a === 'P') { paused = !paused; if (paused) showMsg('<b>paused</b><span>tap or P to resume</span>'); else msg.hidden = true; return; }
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
    function onVis() { if (document.hidden && !over && !paused) { paused = true; showMsg('<b>paused</b><span>tap or P to resume</span>'); } }
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('resize', size);

    function block(c, x, y, col, s, a) {
      c.globalAlpha = a || 1; c.fillStyle = col; c.fillRect(x * s + 1, y * s + 1, s - 2, s - 2);
      c.fillStyle = 'rgba(255,255,255,.28)'; c.fillRect(x * s + 1, y * s + 1, s - 2, Math.max(2, s * 0.18));
      c.fillStyle = 'rgba(0,0,0,.22)'; c.fillRect(x * s + 1, y * s + s - 1 - Math.max(2, s * 0.18), s - 2, Math.max(2, s * 0.18));
      c.globalAlpha = 1;
    }
    function drawNext() {
      nx.clearRect(0, 0, 72, 48);
      var s = 12, cells = SH[next], minx = 9, maxx = 0, miny = 9, maxy = 0;
      cells.forEach(function (c) { minx = Math.min(minx, c[0]); maxx = Math.max(maxx, c[0]); miny = Math.min(miny, c[1]); maxy = Math.max(maxy, c[1]); });
      var ox = (72 - (maxx - minx + 1) * s) / 2 / s - minx, oy = (48 - (maxy - miny + 1) * s) / 2 / s - miny;
      cells.forEach(function (c) { block(nx, c[0] + ox, c[1] + oy, COL[next], s); });
    }
    function draw() {
      if (!grid) return;
      var W = COLS * cell, H = ROWS * cell;
      cx.clearRect(0, 0, W, H);
      cx.fillStyle = cvar('--bg', '#050b08'); cx.fillRect(0, 0, W, H);
      cx.strokeStyle = cvar('--line', '#1c3a2c'); cx.globalAlpha = 0.5; cx.lineWidth = 1;
      for (var i = 1; i < COLS; i++) { cx.beginPath(); cx.moveTo(i * cell + .5, 0); cx.lineTo(i * cell + .5, H); cx.stroke(); }
      for (var j = 1; j < ROWS; j++) { cx.beginPath(); cx.moveTo(0, j * cell + .5); cx.lineTo(W, j * cell + .5); cx.stroke(); }
      cx.globalAlpha = 1;
      for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) if (grid[r][c]) block(cx, c, r, COL[grid[r][c]], cell);
      if (flash) { cx.fillStyle = '#fff'; flash.rows.forEach(function (r) { cx.globalAlpha = 0.85; cx.fillRect(0, r * cell, W, cell); cx.globalAlpha = 1; }); }
      if (cur && !over && !flash) {
        var g = 0; while (fits(cur, 0, g + 1)) g++;
        cur.c.forEach(function (c) { if (cur.y + c[1] + g >= 0) block(cx, cur.x + c[0], cur.y + c[1] + g, COL[cur.n], cell, 0.22); });
        cur.c.forEach(function (c) { if (cur.y + c[1] >= 0) block(cx, cur.x + c[0], cur.y + c[1], COL[cur.n], cell); });
      }
      cx.strokeStyle = cvar('--accent', '#3dff9a'); cx.lineWidth = 2; cx.strokeRect(1, 1, W - 2, H - 2);
    }
    function loop(ts) {
      if (quit) return;
      var dt = Math.min(100, ts - (last || ts)); last = ts;
      if (!over && !paused) {
        if (flash) { if (ts >= flash.until) clearRows(); draw(); }
        else { acc += dt; if (acc >= interval()) { acc = 0; drop(false); } }
      }
      raf = requestAnimationFrame(loop);
    }
    function close() {
      if (quit) return; quit = true; cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKey); document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('resize', size);
      ov.remove(); if (onExit) onExit(score);
    }
    el.b.textContent = best;
    size(); reset(); draw(); ov.focus({ preventScroll: true });
    raf = requestAnimationFrame(loop);
    return { close: close };
  }
  window.Tetris = { start: start };
})();
