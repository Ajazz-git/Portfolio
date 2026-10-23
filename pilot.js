/* Packet, an original penguin sysadmin. A small 3D character built from layered SVG parts in a CSS 3D scene.
   He cruises on a rocket board, parks beside widgets, hops off, runs a diagnostic on his laptop and flies on.
   He follows the cursor with his head, reacts to clicks, and has a temper if you keep poking him.
   Plain JavaScript, no libraries. Turned off entirely for visitors who prefer reduced motion. */
(function () {
  var toggles = Array.prototype.slice.call(document.querySelectorAll('[data-packet]'));
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    toggles.forEach(function (b) { b.hidden = true; });
    return;
  }

  var W = 76, K = W / 140, H = 100 * K;      /* sprite box, and its scale from the 140 x 100 drawing */
  var PX = 122 * K, PY = 60 * K;             /* laptop port position inside the sprite */
  var HOP = 42 * K;                          /* how far he steps out in front of the rocket */
  var SEL = '.node, .port, .dev, .card, .term, .photos, .handled li';
  var DIAG = ['ping 1.1.1.1 ... 9ms', 'RF scan: ch 6 clean', 'thermal: 41C  ok', 'audit: 0 open ports', 'link: 1 Gbps full', 'dns lookup: 12ms', 'link up, no errors', 'config saved'];
  var HELLO = ['Hi! Packet here 👋', 'ping received. hello!', 'All systems nominal.', 'Have you tried turning it off and on again?', 'Need a sysadmin? I know a guy.'];
  var NS = 'http://www.w3.org/2000/svg';
  var INK = '#0b1a12';
  var ACC = 'var(--accent)';

  function st(w) { return ' stroke="' + INK + '" stroke-width="' + (w || 1.6) + '" stroke-linejoin="round"'; }

  /* shared gradients, referenced by every part */
  var DEFS = '<svg class="defs" width="0" height="0" focusable="false"><defs>'
    + '<radialGradient id="pk-body" cx="0.35" cy="0.28" r="0.85"><stop offset="0" stop-color="#4b82a8"/><stop offset="0.55" stop-color="#244a66"/><stop offset="1" stop-color="#0f2536"/></radialGradient>'
    + '<radialGradient id="pk-belly" cx="0.4" cy="0.3" r="0.85"><stop offset="0" stop-color="#ffffff"/><stop offset="0.7" stop-color="#e3ece8"/><stop offset="1" stop-color="#b4c6bf"/></radialGradient>'
    + '<linearGradient id="pk-metal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbfdfc"/><stop offset="0.45" stop-color="#b9c8c2"/><stop offset="0.62" stop-color="#7d8f88"/><stop offset="1" stop-color="#cfdad5"/></linearGradient>'
    + '<linearGradient id="pk-dark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a6a64"/><stop offset="1" stop-color="#1c2622"/></linearGradient>'
    + '<linearGradient id="pk-acc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--accent)"/><stop offset="1" style="stop-color:color-mix(in srgb, var(--accent) 52%, #000)"/></linearGradient>'
    + '<linearGradient id="pk-beak" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd978"/><stop offset="1" stop-color="#f08a12"/></linearGradient>'
    + '<linearGradient id="pk-screen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0a1c14"/><stop offset="1" stop-color="#143b28"/></linearGradient>'
    + '<radialGradient id="pk-glass" cx="0.3" cy="0.3" r="0.9"><stop offset="0" stop-color="#d8f6ff"/><stop offset="1" stop-color="#5aa9c9"/></radialGradient>'
    + '<linearGradient id="pk-flame" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#fff6c8"/><stop offset="0.45" stop-color="#ffb020"/><stop offset="1" stop-color="#ff5d2a" stop-opacity="0"/></linearGradient>'
    + '</defs></svg>';

  var ROCKET = '<svg class="lyr rkt" viewBox="0 0 140 100" focusable="false">'
    + '<g class="flame f1"><path d="M36 62 Q-2 66 36 71 Z" fill="url(#pk-flame)"/></g>'
    + '<g class="flame f2"><path d="M36 75 Q-2 79 36 84 Z" fill="url(#pk-flame)"/></g>'
    + '<path d="M48 62 L35 46 L62 62 Z" fill="url(#pk-acc)"' + st() + '/>'
    + '<path d="M46 84 L31 99 L64 84 Z" fill="url(#pk-acc)"' + st() + '/>'
    + '<rect x="33" y="62" width="9" height="9" rx="2" fill="url(#pk-dark)"' + st(1.4) + '/>'
    + '<rect x="33" y="75" width="9" height="9" rx="2" fill="url(#pk-dark)"' + st(1.4) + '/>'
    + '<rect x="40" y="61" width="60" height="24" rx="12" fill="url(#pk-metal)"' + st() + '/>'
    + '<path d="M90 61 Q110 62 121 73 Q110 84 90 85 Z" fill="url(#pk-acc)"' + st() + '/>'
    + '<rect x="50" y="72" width="34" height="3" rx="1.5" fill="url(#pk-acc)" opacity="0.9"/>'
    + '<path d="M48 65 Q70 62 92 65" stroke="#fff" stroke-opacity="0.75" stroke-width="2" fill="none" stroke-linecap="round"/>'
    + '<circle cx="62" cy="78" r="3.4" fill="url(#pk-glass)"' + st(1.2) + '/>'
    + '<circle cx="73" cy="78.5" r="1.2" fill="' + ACC + '"/><circle cx="78" cy="78.5" r="1.2" fill="#ffb020"/>'
    + '<rect x="50" y="57.5" width="46" height="4.5" rx="2.2" fill="#1b2b24"' + st(1.2) + '/>'
    + '<path d="M54 60 H92" stroke="' + ACC + '" stroke-width="1.2" stroke-linecap="round" opacity="0.9"/>'
    + '</svg>';

  /* ---- Packet v3: a cool three-quarter-view penguin. Sleek goggle visor, smirk, flowing scarf, an ethernet cable for a tail.
     One drawing (100 x 100 box, facing right) shared by the flying sprite and the chat avatar. ---- */
  var IK = '#0b1622';
  var TF = 'translate(37 -4) scale(0.62)';
  var G = 'var(--accent)';
  var BAR = function (x, y, w, h, c) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + (w / 2) + '" fill="' + (c || G) + '"/>'; };
  var LN = function (d, w, c) { return '<path d="' + d + '" stroke="' + (c || G) + '" stroke-width="' + (w || 2.4) + '" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'; };
  var HALF = function (x) { return '<path d="M' + (x - 3.6) + ' 37 H' + (x + 3.6) + ' V39.4 a3.6 3.6 0 0 1 -7.2 0Z" fill="' + G + '"/>'; };
  var HRT = function (x) { return '<path d="M' + x + ' 42.5 C' + (x - 7) + ' 38 ' + (x - 5.6) + ' 31.5 ' + x + ' 34.6 C' + (x + 5.6) + ' 31.5 ' + (x + 7) + ' 38 ' + x + ' 42.5Z" fill="#ff6fa8"/>'; };
  var SPI = function (x) { return LN('M' + x + ' 37 a1 1 0 1 1 2 0 a2.2 2.2 0 1 1 -4.4 0 a3.4 3.4 0 1 1 6.8 0', 1.6); };
  var X1 = 55, X2 = 70.5;
  var MOODS = {
    normal: BAR(X1 - 2.4, 32.4, 4.8, 9.2) + BAR(X2 - 2.4, 32.4, 4.8, 9.2) + LN('M65 29.6 L77 31.6', 1.8),
    smug: HALF(X1) + HALF(X2) + LN('M50 36.6 H60 M65.5 36.6 H76', 2),
    sly: HALF(X1 + 2) + HALF(X2 + 2) + LN('M51 33.6 H60.5', 1.8) + LN('M66 32 L78 28.6', 2),
    happy: LN('M51.5 41 Q55 32 58.5 41 M67 41 Q70.5 32 74 41', 2.6),
    wink: BAR(X1 - 2.8, 31.5, 5.6, 10.5) + LN('M67 41 Q70.5 32 74 41', 2.6),
    angry: '<path d="M50.5 31.5 L58.5 35 L58.5 41.5 L50.5 41.5Z" fill="#ff5d4a"/><path d="M75.5 31.5 L67.5 35 L67.5 41.5 L75.5 41.5Z" fill="#ff5d4a"/>',
    annoyed: BAR(50.5, 36.4, 8, 3, G) + BAR(66.5, 36.4, 8, 3, G) + LN('M49 33.6 H60 M65.5 33.6 H76', 1.8),
    focus: '<rect x="52" y="34" width="6" height="6" rx="1.4" fill="' + G + '"/><rect x="67.5" y="34" width="6" height="6" rx="1.4" fill="' + G + '"/>' + LN('M50 31.6 H60 M65.5 31.6 H76', 1.6),
    dead: LN('M51.5 33 L58.5 41 M58.5 33 L51.5 41 M67 33 L74 41 M74 33 L67 41', 2.4, '#ff5d4a'),
    surprised: '<circle cx="' + X1 + '" cy="37" r="4.4" fill="' + G + '"/><circle cx="' + X2 + '" cy="37" r="4.4" fill="' + G + '"/>' + LN('M50 30.4 Q55 27.6 60 30.4 M65.5 30.4 Q70.5 27.6 75.5 30.4', 1.6),
    curious: BAR(X1 - 2.8, 32, 5.6, 9.5) + BAR(X2 - 3, 30.5, 6, 12) + LN('M65 27.6 Q71 24 77 27.6', 2),
    sleepy: LN('M50.5 38.4 H59.5 M66 38.4 H75') + '<text x="80" y="27" font-size="9" font-family="monospace" font-weight="700" fill="' + G + '" class="zz">z</text>',
    sad: BAR(X1 - 2.8, 33, 5.6, 8.5) + BAR(X2 - 2.8, 33, 5.6, 8.5) + LN('M49.5 32 L60 28.6 M76.5 32 L66 28.6', 1.8),
    love: HRT(X1) + HRT(X2),
    dizzy: SPI(X1) + SPI(X2)
  };
  var EYES = '<g class="eyes"><g class="blinker">' + Object.keys(MOODS).map(function (k) { return '<g data-m="' + k + '">' + MOODS[k] + '</g>'; }).join('') + '</g></g>';
  var PARTS = {
    flipL: '<g class="fl fl1"><path d="M31 56 C18 60 12 76 16 86 C25 81 32 71 36 61Z" fill="url(#pk-body)" stroke="' + IK + '" stroke-width="2.2" stroke-linejoin="round"/></g>',
    flipR: '<g class="fl fl2"><path d="M70 56 C84 58 93 74 88 88 C80 84 73 74 66 64Z" fill="url(#pk-body)" stroke="' + IK + '" stroke-width="2.2" stroke-linejoin="round"/><path d="M76 62 C82 66 85 74 84 80" stroke="#fff" stroke-opacity="0.2" stroke-width="2.2" fill="none" stroke-linecap="round"/></g>',
    body: '<ellipse class="pad" cx="52" cy="104" rx="42" ry="5" fill="' + G + '" fill-opacity="0.35" stroke="' + G + '" stroke-width="2"/>'
      + '<g class="cab"><path d="M27 90 C14 96 4 90 3 80" stroke="#2f9bff" stroke-width="3.4" fill="none" stroke-linecap="round"/><path d="M27 90 C14 96 4 90 3 80" stroke="#fff" stroke-opacity="0.35" stroke-width="1" fill="none" stroke-linecap="round"/><rect x="-1.5" y="68" width="9" height="10" rx="1.6" fill="#dfe6ec" stroke="' + IK + '" stroke-width="1.6"/><path d="M1 70 V73 M3.5 70 V73 M6 70 V73" stroke="#e0a21d" stroke-width="1.2"/></g>'
      + '<g class="ft ft1"><path d="M28 96 Q40 90 52 96 Q50 104 38 104 Q27 104 28 96Z" fill="url(#pk-beak)" stroke="' + IK + '" stroke-width="2" stroke-linejoin="round"/></g>'
      + '<g class="ft ft2"><path d="M54 96 Q66 90 78 96 Q76 104 64 104 Q53 104 54 96Z" fill="url(#pk-beak)" stroke="' + IK + '" stroke-width="2" stroke-linejoin="round"/></g>'
      + '<path d="M23 68 C19 42 34 24 54 24 C74 24 85 44 81 70 C79 90 67 99 52 99 C36 99 25 90 23 68Z" fill="url(#pk-body)" stroke="' + IK + '" stroke-width="2.4" stroke-linejoin="round"/>'
      + '<path d="M60 44 C77 48 83 68 74 88 C69 96 57 98 48 93 C61 80 64 62 60 44Z" fill="url(#pk-belly)"/>'
      + '<ellipse class="spec" cx="34" cy="58" rx="3.6" ry="9" transform="rotate(14 34 58)" fill="#fff" opacity="0.2"/>'
      + '<path class="rim" d="M80 52 Q88 70 78 90" stroke="' + G + '" stroke-width="2.4" fill="none" stroke-linecap="round" opacity="0"/>'
      + '<g class="scarf"><path d="M34 56 C22 50 9 54 0 66 C13 64 24 68 36 68Z" fill="#ff4d3d" stroke="' + IK + '" stroke-width="2" stroke-linejoin="round"/><path d="M8 62 Q18 62 28 64" stroke="#fff" stroke-opacity="0.35" stroke-width="1.6" fill="none" stroke-linecap="round"/></g>'
      + '<path d="M27 50 C42 62 64 63 82 51 L85 62 C65 76 40 74 25 62Z" fill="#ff4d3d" stroke="' + IK + '" stroke-width="2.2" stroke-linejoin="round"/>'
      + '<path d="M33 62 C48 70 64 69 79 60" stroke="#fff" stroke-opacity="0.4" stroke-width="2" fill="none" stroke-linecap="round"/>',
    head: '<ellipse cx="57" cy="52" rx="17" ry="7.5" fill="url(#pk-belly)"/>'
      + '<path d="M29 40 C26 15 52 3 71 13 C82 19 85 32 83 44 C66 38 46 38 29 40Z" fill="url(#pk-acc)" stroke="' + IK + '" stroke-width="2.4" stroke-linejoin="round"/>'
      + '<path d="M38 17 C50 8 64 10 73 18" stroke="#fff" stroke-opacity="0.55" stroke-width="2.6" fill="none" stroke-linecap="round"/>'
      + '<path d="M50 9 L47 -1" stroke="' + IK + '" stroke-width="2" stroke-linecap="round"/><circle class="led" cx="46.6" cy="-2" r="2.6" fill="' + G + '" stroke="' + IK + '" stroke-width="1.2"/>'
      + '<path d="M40 31 L25 34 L25 43 L40 43Z" fill="#16222d" stroke="' + IK + '" stroke-width="2" stroke-linejoin="round"/>'
      + '<rect x="38" y="26" width="48" height="20" rx="10" fill="url(#pk-screen)" stroke="' + G + '" stroke-width="2.2"/>'
      + EYES
      + '<path d="M44 29.6 H62 M66 29.4 L80 31.4" stroke="#fff" stroke-opacity="0.25" stroke-width="1.6" stroke-linecap="round" fill="none"/>'
      + '<path d="M78 47 C90 46 98 51 101 55.5 C93 60 84 59.5 77 58Z" fill="url(#pk-beak)" stroke="' + IK + '" stroke-width="2" stroke-linejoin="round"/>'
      + '<path d="M79 53.6 C87 54.4 94 55 100 55.6" stroke="' + IK + '" stroke-width="1.5" fill="none" stroke-linecap="round"/>'
      + '<path class="smile" d="M66 59.5 Q73 64.5 81 59" stroke="' + IK + '" stroke-width="2.2" fill="none" stroke-linecap="round"/>'
  };
  var lyr = function (cls, inner) { return '<svg class="lyr ' + cls + '" viewBox="0 0 140 100" focusable="false"><g transform="' + TF + '">' + inner + '</g></svg>'; };
  var BACK = lyr('pfar', PARTS.flipL);
  var BODY = lyr('pbody', PARTS.body);
  var HEAD = lyr('pheadf', PARTS.head);
  var FLIP = lyr('pflip', PARTS.flipR);

  var LAP = '<svg class="lyr plap" viewBox="0 0 140 100" focusable="false"><g class="lap">'
    + '<path d="M95 60 H122 L120 64 H93 Z" fill="url(#pk-metal)"' + st() + '/>'
    + '<g class="lid"><rect x="98" y="38" width="21" height="22" rx="2" fill="#10231a"' + st() + '/>'
    + '<rect class="scr" x="100.5" y="40.5" width="16" height="16.5" rx="1" fill="' + ACC + '"/>'
    + '<path d="M103 45 H112 M103 49 H109 M103 53 H111" stroke="#10231a" stroke-width="1.5" stroke-linecap="round"/></g>'
    + '<circle class="lp" cx="122" cy="60" r="1.9" fill="#ffb020"/>'
    + '</g></svg>';

  /* stacked slices make a solid ellipsoid: each slice is the same shape, a little smaller and darker the further it sits from the middle,
     so when Packet turns, you see his thickness instead of a flat card */
  function slices(zs, mk) {
    var out = '';
    for (var i = 0; i < zs.length; i++) {
      out += '<svg class="lyr sl" viewBox="0 0 140 100" focusable="false" style="transform:translateZ(' + zs[i][0] + 'px)">' + mk(zs[i][1], zs[i][2]) + '</svg>';
    }
    return out;
  }
  function shape(cx, cy, k, inner) { return '<g transform="translate(' + cx + ' ' + cy + ') scale(' + k.toFixed(3) + ') translate(' + (-cx) + ' ' + (-cy) + ')">' + inner + '</g>'; }
  function sliceSet(zc, R, ds) {
    return ds.map(function (d) {
      var k = Math.sqrt(1 - Math.pow(d / R, 2));
      return [(zc + d).toFixed(1), k, clamp(0.12 + (-d + 9) / 40, 0.0, 0.62)];
    });
  }
  var BODYSL = slices(sliceSet(-3, 15, [-12, -9, -6, -3, 0, 3]), function (k, dk) {
    return shape(66, 38, k, '<ellipse cx="66" cy="38" rx="20" ry="25" fill="url(#pk-body)" stroke="#06121b" stroke-opacity="0.5" stroke-width="0.9"/><ellipse cx="66" cy="38" rx="20" ry="25" fill="#000" opacity="' + dk.toFixed(2) + '"/>');
  });
  var HEADSL = slices(sliceSet(0, 13, [-9, -6, -3, 0, 3]), function (k, dk) {
    return shape(67, 22, k, '<ellipse cx="67" cy="22" rx="17" ry="15" fill="url(#pk-body)" stroke="#06121b" stroke-opacity="0.5" stroke-width="0.9"/><ellipse cx="67" cy="22" rx="17" ry="15" fill="#000" opacity="' + dk.toFixed(2) + '"/>');
  });
  var RKTSL = slices([[-12, 1, 0.45], [-9.5, 1, 0.3]].map(function (a) { return a; }), function (k, dk) {
    return '<rect x="40" y="61" width="60" height="24" rx="12" fill="url(#pk-metal)" stroke="#06121b" stroke-opacity="0.5" stroke-width="1"/><rect x="40" y="61" width="60" height="24" rx="12" fill="#000" opacity="' + dk.toFixed(2) + '"/>';
  });
  var FFAR = '<svg class="lyr sl pfar" viewBox="0 0 140 100" focusable="false">'
    + '<ellipse cx="86" cy="50" rx="5.2" ry="11.5" transform="rotate(-24 86 50)" fill="url(#pk-body)"' + st(1.2) + '/><ellipse cx="86" cy="50" rx="5.2" ry="11.5" transform="rotate(-24 86 50)" fill="#000" opacity="0.5"/>'
    + '</svg>';

  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function put(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

  var pilot = document.createElement('div');
  pilot.id = 'pilot';
  pilot.setAttribute('aria-hidden', 'true');
  pilot.setAttribute('data-mood', 'normal');
  pilot.innerHTML = DEFS
    + '<div class="scene"><div class="rig"><div class="flip">'
    + '<div class="rk">' + ROCKET + '</div>'
    + '<div class="pg">' + BACK + BODY + '<div class="phead">' + HEAD + '</div>' + FLIP + LAP + '</div>'
    + '</div></div></div><div class="hit"></div>';
  var rig = pilot.querySelector('.rig');
  var flip = pilot.querySelector('.flip');
  var pg = pilot.querySelector('.pg');
  var head = pilot.querySelector('.phead');
  var specs = pilot.querySelectorAll('.spec'), rim = pilot.querySelector('.rim');
  var ft1 = pilot.querySelector('.ft1'), ft2 = pilot.querySelector('.ft2'), farFl = pilot.querySelector('.pfar');
  var shadow = document.createElement('div');
  shadow.id = 'pshadow';
  shadow.setAttribute('aria-hidden', 'true');
  var eyes = pilot.querySelector('.eyes');
  var fl = pilot.querySelector('.pflip');
  var hit = pilot.querySelector('.hit');
  var portEl = pilot.querySelector('.lp');
  var nozzles = pilot.querySelectorAll('.rkt rect[x="33"]');

  var layer = document.createElementNS(NS, 'svg');
  layer.id = 'cables';
  layer.setAttribute('aria-hidden', 'true');
  layer.innerHTML = '<path id="cable" d=""/><circle id="plug" r="4" cx="-20" cy="-20"/>';
  var cable = layer.firstChild;
  var plug = layer.lastChild;

  var say = document.createElement('div');
  say.className = 'say';
  say.setAttribute('aria-hidden', 'true');

  var fxl = document.createElement('div');
  fxl.id = 'fxl';
  fxl.setAttribute('aria-hidden', 'true');

  document.body.appendChild(shadow);
  document.body.appendChild(layer);
  document.body.appendChild(fxl);
  document.body.appendChild(pilot);
  document.body.appendChild(say);

  /* ---- state ---- */
  var pos = { x: -W - 20, y: 160 };
  var face = 1, turn = 0, turnTo = 0;
  var on = false, gen = 0, busy = false;
  var visited = new Set(), last = null;
  var speedMul = 1, speedTimer = 0;
  var S = { hx: 0, hy: 0, hz: 0, hry: 0, z: 0, pitch: 0, yaw: 0, roll: 0, rx: 0, wave: 0, head: 0, tap: 0, sq: 0, walk: 0 };
  var born = performance.now();
  var speedNow = 0, flySpeed = 0, moodAt = 0, nextBeat = 0, mood = 'normal';
  var mot = { roll: 0, pitch: 0, yaw: 0, z: 0 }, motT = { roll: 0, pitch: 0, yaw: 0, z: 0 };
  var look = { x: 0, y: 0 }, mouse = { x: -9999, y: -9999, t: 0 };
  var perk = 0, perkT = 0;
  var anims = [];
  var lastNow = 0, emitAt = 0, sayAt = 0, particles = 0;
  var sayX = 0, sayY = 0, sayW = 0, sayOn = false, sayTok = 0, sayAnchor = null;
  var annoy = 0, annoyAt = 0, lastClick = 0, single = 0;
  var blackout = null, crt = null, big = 1, bigT = 1;

  function setMood(m) { mood = m; pilot.setAttribute('data-mood', m); }
  /* between actions his face has a life of its own: curious when the cursor is near, a smug glance now and then */
  function autoMood(now) {
    if (busy || pilot.classList.contains('out') || (mood !== 'normal' && mood !== 'curious' && mood !== 'smug' && mood !== 'sleepy')) return;
    var idle = now - Math.max(mouse.t, born);
    if (mood === 'sleepy') { if (idle < 3000) { setMood('normal'); nextBeat = now + 4000; } return; }
    if (idle > 45000 && mood === 'normal') { setMood('sleepy'); return; }
    var near = now - mouse.t < 2500 && Math.hypot(mouse.x - (pos.x + W / 2), mouse.y - (pos.y + H * 0.4)) < 220 && !pilot.classList.contains('fly');
    if (near && mood !== 'curious') { setMood('curious'); moodAt = now; }
    else if (!near && mood === 'curious') { setMood('normal'); moodAt = now; }
    else if (mood === 'smug' && now - moodAt > 1600) { setMood('normal'); moodAt = now; }
    else if (mood === 'normal' && now > nextBeat) {
      nextBeat = now + 6000 + Math.random() * 9000;
      if (Math.random() < 0.5) { setMood('smug'); moodAt = now; }
    }
  }
  function setFace(f) { face = f; turnTo = f === 1 ? 0 : 180; }
  function place(x, y) { pos.x = x; pos.y = y; }

  function randomPoint() {
    var vw = window.innerWidth, vh = window.innerHeight;
    return { x: rnd(12, Math.max(13, vw - W - 12)), y: rnd(70, Math.max(71, vh - H - 12)) };
  }

  /* ---- one frame loop for everything that is drawn: idle hover, cursor look, flight attitude, action offsets ---- */
  function tween(my, dur, fn) {
    return new Promise(function (res) {
      anims.push({ my: my, t0: 0, dur: dur, fn: fn, res: res });
    });
  }

  function render(now) {
    requestAnimationFrame(render);
    if (!on) { lastNow = now; return; }
    var dt = Math.min(0.05, (now - (lastNow || now)) / 1000);
    lastNow = now;
    var t = now / 1000;
    var i, a;
    for (i = anims.length - 1; i >= 0; i--) {
      a = anims[i];
      if (a.my !== gen) { anims.splice(i, 1); a.res(false); continue; }
      if (!a.t0) a.t0 = now;
      var p = Math.min(1, (now - a.t0) / a.dur);
      a.fn(p);
      if (p >= 1) { anims.splice(i, 1); a.res(true); }
    }
    var flying = pilot.classList.contains('fly');
    var k = Math.min(1, dt * 7);
    mot.roll += (motT.roll - mot.roll) * k; mot.pitch += (motT.pitch - mot.pitch) * k;
    mot.yaw += (motT.yaw - mot.yaw) * k; mot.z += (motT.z - mot.z) * k;
    if (!flying) { motT.roll = motT.pitch = motT.yaw = motT.z = 0; }
    turn += (turnTo - turn) * Math.min(1, dt * 8);
    perk += (perkT - perk) * Math.min(1, dt * 9);

    /* cursor look */
    var cxp = pos.x + W / 2 + S.hx * face, cyp = pos.y + H * 0.4;
    var tx = 0, ty = 0;
    if (!flying && !busy && now - mouse.t < 7000) {
      var dx = mouse.x - cxp, dy = mouse.y - cyp, d = Math.sqrt(dx * dx + dy * dy);
      if (d < 460) {
        var s = d < 70 ? d / 70 : 1;
        tx = clamp(dx / 170, -1, 1) * face * s; ty = clamp(dy / 170, -1, 1) * s;
      }
    }
    look.x += (tx - look.x) * Math.min(1, dt * 6); look.y += (ty - look.y) * Math.min(1, dt * 6);

    /* zero-g idle: slow organic pitch, yaw, roll and depth drift, calmer while flying */
    var amp = flying ? 0.45 : 1;
    var bob = Math.sin(t * 2.1) * 2.4 * amp;
    var iP = Math.sin(t * 1.3) * 2.6 * amp, iY = Math.sin(t * 0.9 + 1) * 4 * amp, iR = Math.sin(t * 1.1 + 2) * 2.2 * amp;
    var iZ = Math.sin(t * 1.7) * 3.5 * amp;
    var z = mot.z + iZ + S.z + perk * 12;
    var pitch = mot.pitch + iP + S.pitch - perk * 6 - look.y * 5;
    var yaw = mot.yaw + iY + S.yaw + look.x * 7 * (face === 1 ? 1 : -1);
    var roll = mot.roll + iR + S.roll;
    /* squash and stretch: he breathes, stretches along the line of flight when he speeds up, and squashes on landings */
    speedNow += (flySpeed - speedNow) * Math.min(1, dt * 6);
    var stretch = clamp(speedNow / 16, 0, 1) * 0.07;
    var breath = Math.sin(t * 2.2) * 0.014;
    var sy = 1 + breath - stretch * 0.7 - S.sq * 0.12, sx = 1 - breath * 0.5 + stretch + S.sq * 0.08;
    big += (bigT - big) * Math.min(1, dt * 5);
    pilot.style.transform = 'translate3d(' + pos.x.toFixed(1) + 'px,' + (pos.y + bob).toFixed(1) + 'px,0)' + (Math.abs(big - 1) > 0.002 ? ' scale(' + big.toFixed(3) + ')' : '');
    rig.style.transform = 'translateZ(' + z.toFixed(1) + 'px) rotateX(' + (pitch * 0.35 + S.rx).toFixed(1) + 'deg) rotateY(' + (yaw * 0.25).toFixed(1) + 'deg) rotateZ(' + roll.toFixed(1) + 'deg)';
    var tcs = Math.cos(turn * Math.PI / 180), tm = 1 - Math.abs(tcs); if (Math.abs(tcs) < 0.74) tcs = tcs < 0 ? -0.74 : 0.74;
    flip.style.transform = 'rotate(' + (tm * -7).toFixed(1) + 'deg) scaleX(' + tcs.toFixed(3) + ')';
    pg.style.transform = 'translate3d(' + S.hx.toFixed(1) + 'px,' + S.hy.toFixed(1) + 'px,' + S.hz.toFixed(1) + 'px) rotateY(' + S.hry.toFixed(1) + 'deg) scale3d(' + sx.toFixed(3) + ',' + sy.toFixed(3) + ',1)';
    var hyaw = look.x * 24 + S.head, hpit = -look.y * 14;
    head.style.transform = 'rotateY(' + (hyaw * 0.32).toFixed(1) + 'deg) rotateX(' + (hpit * 0.3).toFixed(1) + 'deg) rotateZ(' + (look.x * -5 + Math.sin(t * 1.4) * 0.8).toFixed(1) + 'deg)';
    eyes.style.transform = 'translate(' + (look.x * 5.5).toFixed(2) + 'px,' + (look.y * 2.6).toFixed(2) + 'px)';
    var flap = flying ? -speedNow * 1.8 : 0;
    var fa = S.wave + Math.sin(t * 1.6) * 3 + S.tap * Math.sin(t * 38) * 4;
    fl.style.transform = 'rotate(' + (fa + flap).toFixed(1) + 'deg)';
    if (farFl) farFl.style.transform = 'rotate(' + (-fa * 0.6 + flap * 0.8 + Math.sin(t * 1.5 + 1) * 3).toFixed(1) + 'deg)';
    /* a light source fixed at the top left: highlights slide across his body as he turns, a rim light flicks on at the edge */
    var tot = yaw + look.x * 10;
    for (i = 0; i < specs.length; i++) specs[i].style.transform = 'translate(' + (-tot * 0.28).toFixed(2) + 'px,' + (-(pitch + look.y * 8) * 0.22).toFixed(2) + 'px)';
    rim.style.opacity = clamp((Math.abs(tot) - 6) / 22, 0, 0.9).toFixed(2);
    /* feet shuffle while he is out of the rocket and walking */
    var wk = S.walk ? Math.sin(t * 16) * S.walk : 0;
    ft1.style.transform = 'translateY(' + (wk > 0 ? -wk * 2.2 : 0).toFixed(2) + 'px)';
    ft2.style.transform = 'translateY(' + (wk < 0 ? wk * 2.2 : 0).toFixed(2) + 'px)';
    /* a soft shadow on the page: smaller and fainter the higher he is, so he really floats above it */
    var lift = clamp(-S.hy / 20, 0, 1) + clamp(z / 80, 0, 0.5);
    shadow.style.transform = 'translate3d(' + (pos.x + W * 0.1 + S.hx * face * 0.5).toFixed(1) + 'px,' + (pos.y + H + 20 + (bob - 2.4) * -0.5).toFixed(1) + 'px,0) scale(' + (1 - lift * 0.35 - (flying ? 0.15 : 0)).toFixed(3) + ')';
    shadow.style.opacity = on && pilot.classList.contains('on') ? (0.42 - lift * 0.2 - (flying ? 0.1 : 0)).toFixed(2) : '0';
    autoMood(now);

    /* thruster plasma while flying */
    if (flying && now > emitAt) {
      emitAt = now + 42;
      for (i = 0; i < nozzles.length; i++) puff('plasma', nozzles[i]);
    }
    if (sayOn) placeSay();
  }

  function rectCenter(el) {
    var r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  /* small 3D particles: plasma behind the rocket, steam off his cap. random depth, scale decays */
  function puff(kind, from) {
    if (particles > 40) return;
    var c = rectCenter(from);
    if (from === head) { var hr = head.getBoundingClientRect(); c = { x: hr.left + hr.width * 0.5, y: hr.top + hr.height * 0.1 }; }
    var z0 = rnd(-30, 30), z1 = z0 - rnd(30, 90);
    var dx = (kind === 'steam' ? rnd(-10, 10) : -face * rnd(24, 52)), dy = kind === 'steam' ? -rnd(26, 50) : rnd(-6, 8);
    var s = rnd(0.7, 1.3);
    var el = document.createElement('i');
    el.className = 'pf ' + kind;
    el.style.left = (c.x - 4) + 'px'; el.style.top = (c.y - 4) + 'px';
    fxl.appendChild(el);
    particles++;
    var an = el.animate([
      { transform: 'translate3d(0,0,' + z0.toFixed(0) + 'px) scale(' + s.toFixed(2) + ')', opacity: kind === 'steam' ? 0.85 : 0.9 },
      { transform: 'translate3d(' + dx.toFixed(0) + 'px,' + dy.toFixed(0) + 'px,' + z1.toFixed(0) + 'px) scale(' + (s * 0.15).toFixed(2) + ')', opacity: 0 }
    ], { duration: kind === 'steam' ? rnd(700, 1000) : rnd(380, 620), easing: 'ease-out' });
    an.onfinish = an.oncancel = function () { el.remove(); particles--; };
  }

  /* ---- the speech bubble: a little CRT, typed one key at a time ---- */
  function placeSay() {
    var ax = sayAnchor ? sayAnchor.x : pos.x + W - W * big / 2 + S.hx * face;
    var ay = sayAnchor ? sayAnchor.y : pos.y + H - H * big - 6 + S.hy - 6 - (big > 1.02 ? 8 : 0);
    var w = sayW || say.offsetWidth;
    var x = clamp(ax - w / 2, 6, window.innerWidth - w - 6);
    var y = Math.max(8, ay - say.offsetHeight);
    say.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
  }
  async function typeSay(my, text, hold, speed) {
    var tok = ++sayTok;
    say.textContent = '';
    say.classList.add('show');
    sayOn = true; sayW = 0;
    var typing = true;
    pilot.classList.add('talk');
    for (var i = 1; i <= text.length; i++) {
      if (my !== gen || tok !== sayTok || !on) { if (tok === sayTok) hideSay(); return false; }
      say.textContent = text.slice(0, i);
      sayW = say.offsetWidth;
      S.tap = 1;
      await wait((speed || 34) + Math.random() * 26);
    }
    S.tap = 0; typing = false;
    pilot.classList.remove('talk');
    if (hold === undefined) hold = 900;
    if (hold) {
      await wait(hold);
      if (my !== gen || tok !== sayTok || !on) { if (tok === sayTok) hideSay(); return false; }
      hideSay();
    }
    return true;
  }
  function hideSay() {
    sayTok++; sayOn = false; sayAnchor = null; S.tap = 0;
    say.classList.remove('show');
    pilot.classList.remove('talk');
  }

  /* ---- flight: attitude comes from the velocity (bank, pitch, yaw); long hops swoop toward the camera ---- */
  function flyTo(my, getTarget, faceAtEnd, opts) {
    opts = opts || {};
    return new Promise(function (res) {
      var from = { x: pos.x, y: pos.y };
      var first = getTarget();
      var dx0 = first.x - from.x;
      var dist = Math.sqrt(dx0 * dx0 + (first.y - from.y) * (first.y - from.y));
      var dur = clamp(800 + dist * 1.2, 900, 2400) * speedMul * (opts.dur || 1);
      var swoop = dist > 320 || opts.swoop;
      if (Math.abs(dx0) > 10) setFace(dx0 > 0 ? 1 : -1);
      pilot.classList.add('fly');
      var t0 = null;
      function step(ts) {
        if (!on || my !== gen) { flySpeed = 0; return res(false); }
        if (t0 === null) t0 = ts;
        var p = Math.min(1, (ts - t0) / dur);
        var e = ease(p);
        var tg = getTarget();
        var x = from.x + (tg.x - from.x) * e;
        var y = from.y + (tg.y - from.y) * e + Math.sin(p * Math.PI * 3) * Math.sin(p * Math.PI) * 12;
        var vx = x - pos.x, vy = y - pos.y, sp = Math.sqrt(vx * vx + vy * vy);
        var dirSign = vx >= 0 ? 1 : -1;
        motT.roll = clamp(Math.atan2(vy, Math.abs(vx) + 0.001) * 57.3 * 0.55 * dirSign, -24, 24);
        motT.pitch = clamp(vy * 1.5, -16, 16);
        motT.yaw = dirSign * Math.min(1, sp / 12) * -16;
        motT.z = swoop ? Math.sin(p * Math.PI) * 32 : 0;
        place(x, y);
        flySpeed = sp;
        if (p < 1) { requestAnimationFrame(step); return; }
        flySpeed = 0;
        pilot.classList.remove('fly');
        tween(my, 360, function (q) { S.sq = Math.sin(q * Math.PI) * (1 - q * 0.3); });
        place(x, y);
        if (faceAtEnd !== undefined) setFace(faceAtEnd);
        res(true);
      }
      requestAnimationFrame(step);
    });
  }

  /* where the sprite and the cable end sit, for a given side of a widget */
  function geo(kind, f, R) {
    var vw = window.innerWidth, vh = window.innerHeight, GAP = 46;
    var vt = Math.max(R.top, 70), vb = Math.min(R.bottom, vh - 30), cy = (vt + vb) / 2;
    var ax = clamp(clamp(R.left + R.width / 2, R.left + 16, R.right - 16), 24, vw - 24);
    var g;
    if (kind === 'r') g = { px: R.right + GAP, py: cy, ax: R.right, ay: cy };
    else if (kind === 'l') g = { px: R.left - GAP, py: cy, ax: R.left, ay: cy };
    else if (kind === 't') g = { px: ax + (f === 1 ? -34 : 34), py: R.top - 40, ax: ax, ay: R.top };
    else g = { px: ax + (f === 1 ? -34 : 34), py: R.bottom + 34, ax: ax, ay: R.bottom };
    g.x = f === 1 ? g.px - PX : g.px - (W - PX);
    g.y = g.py - PY;
    return g;
  }

  function fits(kind, f, R) {
    var g = geo(kind, f, R);
    var vw = window.innerWidth, vh = window.innerHeight;
    if (g.x - (f === -1 ? HOP : 0) < 8 || g.x + W + (f === 1 ? HOP : 0) > vw - 8 || g.y < 58 || g.y + H > vh - 8) return false;
    var m = 6;
    return g.x + W < R.left - m || g.x > R.right + m || g.y + H < R.top - m || g.y > R.bottom + m;
  }

  function planFor(el) {
    var R = el.getBoundingClientRect();
    var opts = [['r', -1], ['l', 1], ['t', 1], ['t', -1], ['b', 1], ['b', -1]].filter(function (o) { return fits(o[0], o[1], R); });
    if (!opts.length) return null;
    var o = pick(opts);
    return { el: el, kind: o[0], face: o[1] };
  }

  function pickWidget() {
    var all = Array.prototype.slice.call(document.querySelectorAll(SEL));
    var vis = all.filter(function (el) {
      var r = el.getBoundingClientRect();
      return r.width > 60 && r.height > 24 && r.bottom > 120 && r.top < window.innerHeight - 70;
    });
    var fresh = vis.filter(function (el) { return !visited.has(el); });
    if (!fresh.length) { visited.clear(); fresh = vis.filter(function (el) { return el !== last; }); }
    for (var i = fresh.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = fresh[i]; fresh[i] = fresh[j]; fresh[j] = t;
    }
    for (var k = 0; k < fresh.length; k++) {
      var pl = planFor(fresh[k]);
      if (pl) return pl;
    }
    return null;
  }

  function drawCable(p, g) {
    var r = portEl.getBoundingClientRect();
    var x1 = r.left + r.width / 2, y1 = r.top + r.height / 2, x2 = g.ax, y2 = g.ay;
    var sag = 26 + Math.abs(x2 - x1) * 0.12;
    var low = Math.max(y1, y2) + sag;
    var d = 'M' + x1.toFixed(1) + ' ' + y1.toFixed(1)
      + ' C' + (x1 + (x2 - x1) * 0.3).toFixed(1) + ' ' + low.toFixed(1)
      + ' ' + (x1 + (x2 - x1) * 0.7).toFixed(1) + ' ' + low.toFixed(1)
      + ' ' + x2.toFixed(1) + ' ' + y2.toFixed(1);
    cable.setAttribute('d', d);
    var len = cable.getTotalLength();
    cable.style.strokeDasharray = len;
    cable.style.strokeDashoffset = len * (1 - p);
    plug.setAttribute('cx', x2);
    plug.setAttribute('cy', y2);
    plug.style.opacity = p > 0.97 ? 1 : 0;
  }
  function clearCable() { cable.setAttribute('d', ''); plug.style.opacity = 0; }

  /* hop off the board into 3D space, open the laptop, plug in, run a scan, hop back on */
  function dock(my, p) {
    return new Promise(function (res) {
      var w = p.el;
      var t0 = null, opened = false, scanning = false, said = false, happy = false;
      var txt = pick(DIAG);
      function finish(v) {
        S.walk = 0;
        pilot.classList.remove('open', 'out');
        S.hx = S.hy = S.hz = S.hry = 0;
        setMood('normal');
        w.classList.remove('scanning');
        hideSay();
        clearCable();
        res(v);
      }
      function frame(ts) {
        if (!on || my !== gen) { return finish(false); }
        if (t0 === null) t0 = ts;
        var t = ts - t0;
        var g = geo(p.kind, p.face, w.getBoundingClientRect());
        place(g.x, g.y);
        var hx = 0, lift = 0;
        if (t < 250) hx = 0;
        else if (t < 750) { var a = (t - 250) / 500; hx = HOP * ease(a); lift = Math.sin(a * Math.PI) * 15; }
        else if (t < 4100) hx = HOP;
        else if (t < 4600) { var b = (t - 4100) / 500; hx = HOP * (1 - ease(b)); lift = Math.sin(b * Math.PI) * 15; }
        S.hx = hx; S.hy = -lift;
        S.walk = (hx > 1 && hx < HOP - 1) ? 1 : 0;
        S.hz = 22 * (hx / HOP); S.hry = 10 * (hx / HOP);
        var out = t >= 700 && t < 4150;
        if (out !== pilot.classList.contains('out')) pilot.classList.toggle('out', out);
        if (t > 800 && t < 3750 && !opened) { opened = true; pilot.classList.add('open'); setMood('focus'); }
        if (t >= 3750 && opened) { opened = false; pilot.classList.remove('open'); }
        var cp = 0;
        if (t >= 1150 && t < 1750) cp = (t - 1150) / 600;
        else if (t >= 1750 && t < 3300) cp = 1;
        else if (t >= 3300 && t < 3750) cp = 1 - (t - 3300) / 450;
        if (cp > 0) drawCable(cp, g); else clearCable();
        var sc = t >= 1750 && t < 3300;
        if (sc !== scanning) { scanning = sc; w.classList.toggle('scanning', sc); }
        if (sc && !said) { said = true; typeSay(my, txt, 700, 30); }
        if (t >= 3300 && !happy) { happy = true; setMood('happy'); }
        if (t >= 4200 && happy) { happy = false; setMood('normal'); }
        if (t < 4750) { requestAnimationFrame(frame); return; }
        finish(true);
      }
      requestAnimationFrame(frame);
    });
  }

  async function inspect(my, p) {
    var w = p.el;
    function target() { var g = geo(p.kind, p.face, w.getBoundingClientRect()); return { x: g.x, y: g.y }; }
    var arrived = await flyTo(my, target, p.face);
    if (!arrived) return false;
    visited.add(w);
    last = w;
    return await dock(my, p);
  }

  async function run(my, resume) {
    if (!resume) {
      await wait(2600);
      if (my !== gen || !on) return;
      setFace(1); turn = 0;
      place(-W - 20, rnd(120, Math.max(160, window.innerHeight * 0.5)));
      pilot.classList.add('on');
    }
    while (my === gen && on) {
      while (document.hidden) {
        await wait(600);
        if (my !== gen || !on) return;
      }
      var hops = 1 + Math.floor(Math.random() * 2);
      for (var i = 0; i < hops; i++) {
        var pt = randomPoint();
        var ok = await flyTo(my, function () { return pt; });
        if (!ok) return;
        await wait(rnd(150, 500) * speedMul);
        if (my !== gen || !on) return;
      }
      var plan = pickWidget();
      if (!plan) { await wait(800); continue; }
      var done = await inspect(my, plan);
      if (!done) return;
    }
  }

  /* ---- poking Packet ---- */
  function resetPose() {
    pilot.classList.remove('open', 'out', 'fly', 'talk');
    S.hx = S.hy = S.hz = S.hry = S.z = S.pitch = S.yaw = S.roll = S.rx = S.wave = S.head = S.tap = S.sq = S.walk = 0;
    motT.roll = motT.pitch = motT.yaw = motT.z = 0;
    var s = document.querySelectorAll('.scanning');
    for (var i = 0; i < s.length; i++) s[i].classList.remove('scanning');
    clearCable();
    hideSay();
    setMood('normal');
  }

  /* take over the roaming loop for an action, then hand it back */
  function interrupt(fn) {
    if (!on || busy) return;
    var my = ++gen;
    resetPose();
    pilot.classList.add('on');
    fn(my).then(function () {
      busy = false;
      if (on && my === gen) { gen++; run(gen, true).catch(function () {}); }
    }, function () { busy = false; });
  }

  async function greet(my) {
    setMood(Math.random() < 0.3 ? 'love' : 'happy');
    speedMul = 2.2; clearTimeout(speedTimer);
    speedTimer = setTimeout(function () { speedMul = 1; }, 6000);
    /* an elastic spring bounce while the flipper waves */
    var wave = tween(my, 1300, function (p) { S.wave = Math.sin(p * 17) * 42 * (1 - p); });
    var hop = tween(my, 1100, function (p) {
      S.hy = -(17 * Math.exp(-3.2 * p) * Math.abs(Math.sin(p * Math.PI * 3)));
      S.z = 14 * Math.exp(-3 * p) * Math.abs(Math.sin(p * Math.PI * 3));
      S.roll = Math.sin(p * Math.PI * 4) * 5 * (1 - p);
    });
    var talk = typeSay(my, pick(HELLO), 1000, 32);
    await Promise.all([wave, hop, talk]);
    S.hy = S.z = S.roll = S.wave = 0;
    setMood('normal');
  }

  /* stage 1: recoil into the screen, turn a shoulder, huff */
  async function huff(my) {
    setMood('annoyed');
    await tween(my, 420, function (p) { var e = ease(p); S.z = -30 * e; S.yaw = 34 * e; S.head = -28 * e; S.pitch = 5 * e; });
    await typeSay(my, 'quit bugging me 😒', 1100, 36);
    await tween(my, 520, function (p) { var e = 1 - ease(p); S.z = -30 * e; S.yaw = 34 * e; S.head = -28 * e; S.pitch = 5 * e; });
    S.z = S.yaw = S.head = S.pitch = 0;
    setMood('sad');
    await wait(900);
    setMood('normal');
  }

  /* stage 2: stomp through the depth and steam from the cap */
  async function stomp(my) {
    setMood('angry');
    var steam = true;
    var talk = typeSay(my, 'stop it or there will be consequence ⚠️', 900, 32);
    var steamer = (async function () {
      while (steam && my === gen && on) { puff('steam', head); await wait(70); }
    })();
    await tween(my, 1900, function (p) {
      var s = Math.abs(Math.sin(p * Math.PI * 6));
      S.z = 30 * s - 4; S.hy = -5 * s; S.pitch = -9 * s; S.roll = Math.sin(p * Math.PI * 12) * 3;
    });
    steam = false;
    S.z = S.hy = S.pitch = S.roll = 0;
    await talk; await steamer;
    setMood('normal');
  }

  function el(cls, parent) { var d = document.createElement('div'); d.className = cls; (parent || document.body).appendChild(d); return d; }

  async function typeInto(my, node, text, speed) {
    for (var i = 1; i <= text.length; i++) {
      if (my !== gen || !on) return false;
      node.textContent = text.slice(0, i);
      S.tap = 1;
      await wait(speed + Math.random() * 30);
    }
    S.tap = 0;
    return true;
  }

  /* stage 3: the prank. Everything here is a harmless animation; nothing on the page or your computer is touched */
  async function takeover(my) {
    busy = true;
    setMood('angry');
    await typeSay(my, "that's it, I'm taking it all down, you bugger! 😤", 1400, 30);
    if (my !== gen || !on) return;
    /* step off the board, open the laptop */
    pilot.classList.add('out');
    await tween(my, 520, function (p) { var e = ease(p); S.hx = HOP * e; S.hy = -Math.sin(p * Math.PI) * 15; S.hz = 22 * e; S.hry = 10 * e; });
    pilot.classList.add('open'); setMood('focus');
    await wait(450);
    /* a floating mini terminal beside him */
    var side = pos.x + W + HOP * face + 20 + 230 < window.innerWidth ? 1 : -1;
    crt = el('crt');
    crt.innerHTML = '<div class="crt-bar"><i></i><i></i><i></i><span>root@packet:~#</span></div><pre class="crt-body"></pre>';
    var body = crt.querySelector('.crt-body');
    var cx0 = pos.x + (side === 1 ? W + HOP * face + 16 : -236 + HOP * face);
    crt.style.transform = 'translate3d(' + clamp(cx0, 6, window.innerWidth - 232).toFixed(0) + 'px,' + clamp(pos.y - 70, 8, window.innerHeight - 150).toFixed(0) + 'px,0)';
    requestAnimationFrame(function () { if (crt) crt.classList.add('show'); });
    await wait(300);
    if (!(await typeInto(my, body, '# ', 40))) return;
    if (!(await typeInto(my, body, '# rm -rf / --no-preserve-root', 55))) return;
    await wait(500);
    body.textContent += '\n';
    body.innerHTML += '<b class="bad">Kernel panic - not syncing:\nAttempted to kill init!\nCRITICAL: system halted</b>';
    setMood('dead');
    await wait(900);
    /* five seconds of dark */
    blackout = el('blackout');
    blackout.innerHTML = '<span class="cur">_</span>';
    var dismissed = false;
    function skip() { dismissed = true; }
    blackout.addEventListener('pointerdown', skip);
    document.addEventListener('keydown', skip, { once: true });
    requestAnimationFrame(function () { if (blackout) blackout.classList.add('show'); });
    var tEnd = performance.now() + 5000;
    while (performance.now() < tEnd && !dismissed) {
      if (my !== gen || !on) { document.removeEventListener('keydown', skip); return; }
      await wait(80);
    }
    document.removeEventListener('keydown', skip);
    if (blackout) { blackout.classList.remove('show'); var bo = blackout; blackout = null; setTimeout(function () { bo.remove(); }, 350); }
    if (crt) { var cw = crt; crt = null; cw.classList.remove('show'); setTimeout(function () { cw.remove(); }, 300); }
    /* back on, and he turns to face the camera */
    setMood('wink');
    await tween(my, 600, function (p) { var e = ease(p); S.yaw = -34 * e; S.z = 18 * e; S.head = 0; });
    await typeSay(my, 'just kidding! 😂', 1500, 40);
    pilot.classList.remove('open');
    await tween(my, 480, function (p) {
      var e = ease(p), b = 1 - e;
      S.hx = HOP * b; S.hy = -Math.sin(p * Math.PI) * 15; S.hz = 22 * b; S.hry = 10 * b; S.yaw = -34 * b; S.z = 18 * b;
    });
    pilot.classList.remove('out');
    S.hx = S.hy = S.hz = S.hry = S.yaw = S.z = 0;
    setMood('happy');
    await wait(250);
    /* and off, in a full barrel roll with a swoop toward the camera */
    var vw = window.innerWidth;
    var outX = face === 1 ? vw + 120 : -W - 120;
    var roll = tween(my, 1500, function (p) {
      var e = ease(p), s = Math.sin(p * Math.PI);
      S.rx = 360 * e; S.yaw = 40 * s * face; S.roll = -30 * s; S.z = 60 * s;
      if (p > 0.55 && mood !== 'dizzy') setMood('dizzy');
    });
    var fly = flyTo(my, function () { return { x: outX, y: clamp(pos.y - 40, 70, window.innerHeight - H - 12) }; }, undefined, { dur: 0.9, swoop: true });
    await Promise.all([roll, fly]);
    S.rx = S.yaw = S.roll = S.z = 0;
    setMood('normal');
    pilot.classList.remove('fly');
    busy = false;
  }

  function annoyed() {
    var now = performance.now();
    if (now - annoyAt > 25000) annoy = 0;
    annoyAt = now;
    annoy = Math.min(3, annoy + 1);
    if (annoy === 1) interrupt(huff);
    else if (annoy === 2) interrupt(stomp);
    else { annoy = 0; interrupt(takeover); }
  }

  /* one click greets him, two quick clicks make him cross, and he gets crosser with each pair */
  hit.addEventListener('click', function (e) {
    e.stopPropagation();
    var now = performance.now();
    if (now - lastClick < 330) {
      clearTimeout(single); lastClick = 0;
      annoyed();
      return;
    }
    lastClick = now;
    clearTimeout(single);
    single = setTimeout(function () { interrupt(greet); }, 335);
  });
  hit.addEventListener('pointerenter', function () { perkT = 1; if (!busy && (mood === 'normal' || mood === 'curious' || mood === 'smug' || mood === 'sleepy')) setMood('surprised'); });
  hit.addEventListener('pointerleave', function () { perkT = 0; if (mood === 'surprised') setMood('normal'); });
  window.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') return;
    mouse.x = e.clientX; mouse.y = e.clientY; mouse.t = performance.now();
  }, { passive: true });

  /* ---- call avatar and chat ---- */
  var ME = "I'm Packet, a penguin who lives in this network. I carry data around and keep Ajas's site tidy. 🐧";
  var AJAS = "Ajas is an IT specialist in Kochi: networks, servers, devices and accounts, on Windows, Linux and macOS. He keeps offices running.";
  var JOKES = ["Why did the router go to therapy? Too many connection issues.", "There are 10 kinds of people: those who know binary and those who don't.", "It's not DNS. There's no way it's DNS. ...It was DNS.", "A SQL query walks into a bar, sees two tables and asks: can I join you?", "I would tell you a UDP joke, but you might not get it.", "My other computer is a data center. 🐧"];
  var BYE = ['See you around! 🐧', 'Back to my rounds. Ping me anytime!', 'Bye! Mind the cables.'];
  var FISHL = ['Nom nom nom 🐟', 'Ooh, fresh! Thank you!', 'That one was salmon. Fancy!', '*gulp* ...more?', 'Best. Human. Ever.'];
  var TOUR = [
    ['about', 'This is the human behind the keyboard. Short, honest, no buzzwords.'],
    ['experience', 'Four roles, from the support desk to senior admin. Tap one for the story.'],
    ['skills', 'What he uses every day, and what he is still learning. Try the skill map!'],
    ['roadmap', 'Learning, working, daily: where each skill sits today.'],
    ['fixit', 'Packet Park starts here. Real help-desk problems. Pick the right call, or cause downtime. 😬'],
    ['lab', 'A tiny network you can poke. Go on, cut the ISP line. I dare you.'],
    ['docs', 'Sample runbooks and checklists. The boring stuff, done properly.'],
    ['contact', 'And this is where you say hi. He replies. 🐧']
  ];
  var WHERE = { home: "This is the front door. Try the terminal: type help, or tetris!", about: TOUR[0][1], experience: TOUR[1][1], skills: TOUR[2][1], roadmap: TOUR[3][1], fixit: TOUR[4][1], lab: TOUR[5][1], docs: TOUR[6][1], resume: 'The resume lives here. Ajas is still polishing it, so check back soon. 📄', contact: TOUR[7][1] };
  var NAMEOF = { home: 'Home', about: 'About', experience: 'Experience', skills: 'Skills', roadmap: 'Roadmap', fixit: 'Fix it', lab: 'Network lab', docs: 'Docs', resume: 'Resume', contact: 'Contact' };

  function mkAv() {
    return '<svg class="pk-svg" viewBox="-4 -8 112 112" focusable="false" aria-hidden="true"><g class="av-body">' + PARTS.flipL + PARTS.body.replace(/<ellipse class="pad"[^>]*\/>/, '') + PARTS.head + PARTS.flipR + '</g></svg>';
  }
  var AV = mkAv();
  var callBtn = document.createElement('button');
  callBtn.type = 'button';
  callBtn.setAttribute('aria-label', 'Call Packet the penguin to chat');
  callBtn.className = 'pk-call pkav';
  callBtn.setAttribute('data-mood', 'normal');
  callBtn.innerHTML = '<span class="pk-ping" aria-hidden="true"></span><span class="pk-ring" aria-hidden="true"></span><span class="pk-glass" aria-hidden="true">' + AV + '</span><span class="pk-dot" aria-hidden="true"></span><span class="pk-tip" aria-hidden="true">psst... talk to me</span>';
  var chat = document.createElement('div');
  chat.className = 'pk-chat'; chat.hidden = true;
  chat.setAttribute('role', 'dialog'); chat.setAttribute('aria-label', 'Chat with Packet');
  chat.innerHTML = '<div class="pk-hd"><span class="pk-hav pkav" data-mood="normal">' + AV + '</span><div class="pk-who"><b>Packet</b><small><i></i>online · resident troublemaker</small></div><button type="button" class="pk-x" aria-label="Close chat">✕</button></div>'
    + '<div class="pk-log" aria-live="polite"></div><div class="pk-acts"></div>'
    + '<form class="pk-form"><input type="text" maxlength="60" placeholder="say something to Packet" aria-label="Message to Packet" autocomplete="off"><button class="chip" type="submit">send</button></form>';
  document.body.appendChild(callBtn);
  document.body.appendChild(chat);
  var hav = chat.querySelector('.pk-hav'), log = chat.querySelector('.pk-log'), acts = chat.querySelector('.pk-acts');
  var form = chat.querySelector('.pk-form'), field = form.querySelector('input');
  var chatMy = 0, chatBusy = false, closeFn = null, visitNoted = false;

  /* the avatar looks at you, wakes up, winks, falls asleep when you leave it alone */
  var avT = 0, lastAct = performance.now(), asleep = false, pend = null;
  function avMood(m) { callBtn.setAttribute('data-mood', m); }
  function avLook() {
    pend = null;
    var targets = [callBtn, hav];
    targets.forEach(function (el) {
      var r = el.getBoundingClientRect(); if (!r.width) return;
      var dx = mouse.x - (r.left + r.width / 2), dy = mouse.y - (r.top + r.height / 2), d = Math.sqrt(dx * dx + dy * dy) || 1, k = Math.min(1, d / 140) * 6;
      el.style.setProperty('--lx', (dx / d * k).toFixed(2)); el.style.setProperty('--ly', (dy / d * k * 0.5).toFixed(2));
    });
  }
  function poke() {
    lastAct = performance.now();
    if (asleep) { asleep = false; avMood('surprised'); clearTimeout(avT); avT = setTimeout(function () { avMood('normal'); }, 700); }
    if (!pend) pend = requestAnimationFrame(avLook);
  }
  window.addEventListener('pointermove', poke, { passive: true });
  window.addEventListener('scroll', poke, { passive: true });
  window.addEventListener('keydown', poke);
  callBtn.addEventListener('pointerenter', function () { clearTimeout(avT); avMood('surprised'); avT = setTimeout(function () { avMood('happy'); }, 320); });
  callBtn.addEventListener('pointerleave', function () { clearTimeout(avT); avMood('normal'); });
  callBtn.addEventListener('focus', function () { avMood('happy'); });
  callBtn.addEventListener('blur', function () { avMood('normal'); });
  setInterval(function () {
    if (callBtn.hidden || document.hidden || callBtn.matches(':hover, :focus-visible')) return;
    if (performance.now() - lastAct > 45000) { if (!asleep) { asleep = true; avMood('sleepy'); } return; }
    avMood('wink'); setTimeout(function () { if (!asleep && !callBtn.matches(':hover')) avMood('normal'); }, 750);
  }, 7000);

  function bubble(cls, html) { var b = document.createElement('div'); b.className = 'pk-b ' + cls; if (html) b.innerHTML = html; log.appendChild(b); log.scrollTop = log.scrollHeight; return b; }
  function alive(my) { return my === chatMy && !chat.hidden; }
  /* body language: short, springy things he does while he talks */
  function doAct(a) {
    var my = chatMy; if (!my || !on || !a) return;
    if (a === 'giggle' || a === 'laugh') {
      hav.classList.remove('giggle'); void hav.offsetWidth; hav.classList.add('giggle');
      setTimeout(function () { hav.classList.remove('giggle'); }, a === 'laugh' ? 1300 : 1000);
    }
    var sn = Math.sin, PI = Math.PI;
    var D = {
      giggle: [950, function (p) { S.hy = -3.2 * Math.abs(sn(6 * PI * p)) * (1 - 0.4 * p); S.sq = sn(12 * PI * p) * 0.3 * (1 - p); S.wave = sn(14 * PI * p) * 14 * (1 - p); }],
      laugh: [1500, function (p) { S.hy = -5 * Math.abs(sn(8 * PI * p)) * (1 - 0.3 * p); S.sq = sn(16 * PI * p) * 0.4 * (1 - p); S.roll = sn(8 * PI * p) * 8 * (1 - p); S.wave = sn(18 * PI * p) * 30 * (1 - p); }],
      dance: [1900, function (p) { S.hy = -8 * Math.abs(sn(4 * PI * p)); S.roll = sn(4 * PI * p) * 12; S.wave = sn(10 * PI * p) * 45; S.head = sn(4 * PI * p) * 22; }],
      shy: [1300, function (p) { S.head = -28 * sn(PI * p); S.sq = sn(PI * p) * 0.1; S.wave = sn(PI * p) * 10; }],
      gasp: [700, function (p) { S.hy = -12 * sn(PI * p) * (1 - p); S.sq = -sn(PI * p) * 0.2; S.pitch = -8 * sn(PI * p); }],
      sulk: [1400, function (p) { S.pitch = 10 * sn(PI * p); S.head = 18 * sn(PI * p); }],
      think: [1100, function (p) { S.head = sn(2 * PI * p) * 16; S.roll = sn(2 * PI * p) * 4; }],
      smirk: [900, function (p) { S.head = -18 * sn(PI * p); S.roll = 5 * sn(PI * p); S.wave = 12 * sn(PI * p); }],
      shrug: [900, function (p) { S.hy = -4 * sn(PI * p); S.wave = 26 * sn(PI * p); S.head = 10 * sn(PI * p); }],
      nod: [700, function (p) { S.pitch = sn(2 * PI * p) * 7; }],
      hug: [1500, function (p) { S.wave = -50 * sn(PI * p); S.sq = sn(PI * p) * 0.22; }]
    };
    var d = D[a]; if (!d) return;
    tween(my, d[0], d[1]).then(function () { S.hy = S.sq = S.wave = S.head = S.roll = S.pitch = 0; });
  }
  async function reply(text, mood, act) {
    var my = chatMy; if (!my) return;
    chatBusy = true; chat.classList.add('busy'); hav.setAttribute('data-mood', mood || 'happy');
    setMood(mood || 'happy');
    var b = bubble('pk', '<i class="dots"><i></i><i></i><i></i></i>');
    var chars = Array.from(text);
    await wait(380 + Math.min(650, chars.length * 8)); if (!alive(my)) return;
    if (act) doAct(act);
    var step = Math.max(1, Math.ceil(chars.length / 50));
    for (var i = 0; i < chars.length; i += step) { b.textContent = chars.slice(0, i + step).join(''); log.scrollTop = log.scrollHeight; await wait(18); if (!alive(my)) return; }
    chatBusy = false; chat.classList.remove('busy'); hav.setAttribute('data-mood', 'normal');
    setTimeout(function () { if (on && alive(my) && !busy) return; if (on && alive(my)) setMood('normal'); }, 1400);
    nudge();
  }
  var idleT = 0, nudged = 0;
  function nudge() {
    clearTimeout(idleT);
    if (nudged >= 2) return;
    idleT = setTimeout(function () {
      if (chat.hidden || chatBusy) return;
      nudged++;
      reply(pick(['Psst... still there? I was about to do something naughty.', "You're quiet. Suspicious. 😏", 'Say "tour" or I start rearranging your cables.']), 'sly', 'smirk');
    }, 32000);
  }
  function setActs(list) {
    acts.textContent = '';
    list.forEach(function (it) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'pk-act';
      b.innerHTML = '<span class="e"></span><span class="t"><b></b><small></small></span>';
      b.querySelector('.e').textContent = it[0]; b.querySelector('b').textContent = it[1]; b.querySelector('small').textContent = it[2];
      b.addEventListener('click', function () { if (!chatBusy) { bubble('me').textContent = it[1]; it[3](); } });
      acts.appendChild(b);
    });
  }
  function here() { var cur = 'home'; Array.prototype.forEach.call(document.querySelectorAll('.part'), function (p) { if (p.getBoundingClientRect().top <= window.innerHeight * 0.4) cur = p.id; }); return cur; }
  function fishUp() {
    var n = (parseInt(get('pk-fish'), 10) || 0) + 1; put('pk-fish', String(n));
    var f = document.createElement('span'); f.className = 'pk-fish'; f.textContent = '🐟'; chat.appendChild(f); setTimeout(function () { f.remove(); }, 1100);
    setMood('love'); setTimeout(function () { if (on && !busy) setMood('normal'); }, 1600);
    return n;
  }
  async function feed() {
    var n = fishUp();
    await reply(n === 5 ? "I'm full! ...okay, one more. 🐟" : n === 10 ? "You're my favourite human. 💙 That's " + n + " fish!" : FISHL[(n - 1) % FISHL.length] + (n > 1 ? '  (fish eaten: ' + n + ')' : ''), 'love', 'giggle');
    setActs(TOP);
  }
  async function tourStep(i) {
    if (i >= TOUR.length) { await reply("That's the whole tour! Questions? I live here. 🐧"); setActs(TOP); return; }
    var t = document.getElementById(TOUR[i][0]); if (t) t.scrollIntoView({ behavior: 'smooth' });
    await reply('(' + (i + 1) + '/' + TOUR.length + ') ' + TOUR[i][1]);
    setActs([['▶', 'Next stop', (i + 1) + ' of ' + TOUR.length + ' done', function () { tourStep(i + 1); }], ['✕', 'End tour', 'back to chat', function () { reply('Okay! Back to chatting.'); setActs(TOP); }]]);
  }
  async function playGame() {
    await reply('Tetris! In the terminal. Arrows to move, space to slam. Good luck!');
    if (closeFn && alive(chatMy)) {
      var go = function () {
        var h = document.getElementById('home'); if (h) h.scrollIntoView({ behavior: 'smooth' });
        setTimeout(function () { var i = document.getElementById('cmd'), f = document.getElementById('form'); if (i && f) { i.value = 'tetris'; if (f.requestSubmit) f.requestSubmit(); } }, 700);
      };
      closeFn(); go();
    }
  }
  function ctx() {
    var id = here();
    reply('You are in ' + NAMEOF[id] + '. ' + WHERE[id]).then(function () { setActs(TOP); });
  }
  var TOP;
  function mkTop() {
    var id = here();
    return [
      ['🧭', 'Show me around', 'a guided tour', function () { tourStep(0); }],
      ['📍', 'What is this part?', "you're in " + NAMEOF[id], ctx],
      ['🎮', 'Play Tetris', 'inside the terminal', playGame],
      ['🐟', 'Feed Packet', 'fish eaten: ' + (parseInt(get('pk-fish'), 10) || 0), feed],
      ['💼', 'Who is Ajas?', 'the quick version', function () { reply(AJAS, 'happy', 'nod').then(function () { setActs(TOP); }); }],
      ['😂', 'Tell a joke', 'network humour', function () { reply(pick(JOKES) + '  *ba-dum-tss*', 'smug', 'smirk').then(function () { setActs(TOP); }); }]
    ];
  }
  function refresh() { TOP = mkTop(); setActs(TOP); }
  function goSec(id) { var t = document.getElementById(id); if (t) t.scrollIntoView({ behavior: 'smooth' }); }
  function mail() {
    var q = (window.PacketBrain && PacketBrain.mailq()) || '';
    window.location.href = 'mailto:ajasm397@gmail.com?subject=' + encodeURIComponent('A question from your portfolio') + '&body=' + encodeURIComponent('Hi Ajas,\n\nPacket passed me this one:\n\n' + q + '\n\n');
  }
  async function talk(t) {
    nudge();
    bubble('me').textContent = t;
    var r = window.PacketBrain ? PacketBrain.think(t, { here: here() }) : { t: pick(HELLO), m: 'happy' };
    if (r.d === 'close') { if (closeFn) closeFn(); return; }
    if (r.d === 'where') { ctx(); return; }
    if (r.t) await reply(r.t, r.m, r.a);
    if (!alive(chatMy)) return;
    var d = r.d || '';
    if (d === 'tour') { tourStep(0); return; }
    if (d === 'game') { playGame(); return; }
    if (d === 'feed') { feed(); return; }
    if (d === 'theme') { var tb = document.getElementById('theme'); if (tb) tb.click(); }
    if (d.indexOf('goto:') === 0) goSec(d.slice(5));
    if (d === 'mail') { mail(); }
    var extra = [];
    if (r.offer === 'mail') extra = [['✉️', 'Ask Ajas', 'opens an email', function () { reply('Opening an email for you. 📧', 'happy', 'nod'); setTimeout(mail, 900); }]];
    else if (r.o && r.o.indexOf('goto:') === 0) { var id = r.o.slice(5); extra = [['➡️', 'Take me there', NAMEOF[id] || id, function () { goSec(id); reply('Off we go! 🚀', 'happy', 'nod'); setActs(TOP); }]]; }
    else if (r.o === 'game') extra = [['🎮', 'Play Tetris', 'inside the terminal', playGame]];
    setActs(extra.concat(TOP).slice(0, 6));
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var t = field.value.trim(); field.value = '';
    if (!t || chatBusy) return;
    talk(t);
  });
  chat.querySelector('.pk-x').addEventListener('click', function () { if (closeFn && !chatBusy) closeFn(); });
  function hideChat() {
    chat.hidden = true; chat.classList.remove('busy', 'show');
    say.classList.remove('chat');
    chatBusy = false; closeFn = null; chatMy = 0;
    callBtn.classList.remove('away'); bigT = 1;
  }
  function greeting() {
    var h = new Date().getHours(), part = h < 5 ? 'Up late' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : h < 22 ? 'Good evening' : 'Up late';
    var v = parseInt(get('pk-visits'), 10) || 0;
    if (!visitNoted) { visitNoted = true; v++; put('pk-visits', String(v)); }
    return part + '! ' + (v > 1 ? "Visit #" + v + ". Missed me? Obviously." : "First time here? Don't touch anything. ...Okay, touch everything.");
  }
  async function summon(my) {
    busy = true; chatMy = my;
    setMood('happy');
    log.textContent = '';
    chat.hidden = false; callBtn.classList.add('away');
    refresh(); chat.classList.add('busy');
    requestAnimationFrame(function () { chat.classList.add('show'); });
    say.classList.add('chat');
    bigT = window.innerWidth < 760 ? 1.3 : 1.5; pilot.style.transformOrigin = '100% 100%';
    /* he stands beside the box, bottom-aligned, so the box growing upwards never covers him; on a narrow screen he sits above its full height */
    var spot = function () {
      var left = chat.offsetLeft, bottom = chat.offsetTop + chat.offsetHeight;
      var x = left - W - 12;
      if (x >= 6) return { x: x, y: clamp(bottom - H, 70, window.innerHeight - H - 6) };
      var full = chat.offsetHeight - log.offsetHeight + Math.min(170, window.innerHeight * 0.2);
      return { x: clamp(chat.offsetLeft + chat.offsetWidth - W - 14, 6, window.innerWidth - W - 6), y: clamp(bottom - full - H * bigT - 6, 70, window.innerHeight - H - 6) };
    };
    var ok = await flyTo(my, spot, 1, { swoop: true, dur: 0.9 });
    if (!ok) { hideChat(); return; }
    var hop = tween(my, 900, function (p) {
      S.hy = -(14 * Math.exp(-3 * p) * Math.abs(Math.sin(p * Math.PI * 3)));
      S.wave = Math.sin(p * 15) * 38 * (1 - p);
    });
    var hi = typeSay(my, "You called? What's up? 🐧", 0, 26);
    await Promise.all([hop, hi]);
    S.hy = S.wave = 0;
    setMood('normal');
    await reply(greeting(), 'smug', 'smirk');
    if (!alive(my)) return;
    chat.classList.remove('busy');
    var first = chat.querySelector('.pk-act'); if (first) first.focus({ preventScroll: true });
    await new Promise(function (res) { closeFn = res; });
    chat.classList.add('busy');
    setMood('happy');
    await typeSay(my, pick(BYE), 1000, 26);
    hideChat();
    callBtn.focus({ preventScroll: true });
  }
  callBtn.addEventListener('click', function () { interrupt(summon); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !chat.hidden && closeFn && !chatBusy) closeFn();
  });

  function stopVisuals() {
    resetPose();
    hideChat();
    pilot.classList.remove('on');
    clearTimeout(single);
    anims.length = 0;
    busy = false; speedMul = 1;
    if (blackout) { blackout.remove(); blackout = null; }
    if (crt) { crt.remove(); crt = null; }
    fxl.textContent = ''; particles = 0;
    shadow.style.opacity = '0';
    setFace(1); turn = 0; turnTo = 0;
  }

  function setOn(v, remember) {
    on = v;
    gen++;
    toggles.forEach(function (b) {
      b.textContent = 'packet: ' + (v ? 'on' : 'off');
      b.setAttribute('aria-pressed', v ? 'true' : 'false');
    });
    callBtn.hidden = !v;
    if (remember) put('pilot', v ? 'on' : 'off');
    if (v) { run(gen).catch(function () {}); } else { stopVisuals(); }
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { fxl.textContent = ''; particles = 0; }
  });

  /* ---- reactions: cheers a right answer, glances at the section, perches by a hovered map device ---- */
  var QUIP = { about: 'that is the guy who built me', experience: 'real jobs, real networks', skills: 'he runs all of that', lab: 'go on, cut a cable', fixit: 'think like a sysadmin', docs: 'he writes it all down', resume: 'file soon, promise', contact: 'say hello, he replies' };
  var DVQ = { about: 'who is this guy', experience: 'where he worked', skills: 'the toolbox', lab: 'poke the network', fixit: 'break it, fix it', docs: 'write-ups', resume: 'PDF coming soon', contact: 'say hello' };
  var reactAt = 0, seenSec = {}, dvT = 0;
  function calmNow() { return busy || !on || document.hidden || chat.classList.contains('open') || Date.now() - reactAt < 12000; }
  async function cheer(my) {
    setMood('love');
    var hop = tween(my, 900, function (p) { S.hy = -(15 * Math.exp(-3 * p) * Math.abs(Math.sin(p * Math.PI * 3))); S.roll = Math.sin(p * Math.PI * 4) * 6 * (1 - p); S.wave = Math.sin(p * 17) * 40 * (1 - p); });
    var t = typeSay(my, pick(['Nailed it!', 'That is the fix!', 'Ticket closed!', 'Ha, he would approve.']), 800, 28);
    await Promise.all([hop, t]);
    S.hy = S.roll = S.wave = 0; setMood('normal');
  }
  document.addEventListener('pk:cheer', function () { if (on && !busy) { reactAt = Date.now(); interrupt(cheer); } });
  document.addEventListener('sec', function (e) {
    var id = e.detail;
    if (!on || busy) return;
    if (mood === 'normal') { setMood('curious'); moodAt = performance.now(); }
    if (!QUIP[id] || seenSec[id] || calmNow()) return;
    seenSec[id] = 1; reactAt = Date.now();
    setTimeout(function () { if (!busy && on) interrupt(async function (my) { setMood('smug'); await typeSay(my, QUIP[id], 900, 28); setMood('normal'); }); }, 700);
  });
  async function perch(my, el, id) {
    var R = el.getBoundingClientRect();
    var o = [['r', -1], ['l', 1], ['t', 1], ['b', 1]].filter(function (k) { return fits(k[0], k[1], R); })[0];
    if (!o) return;
    var ok = await flyTo(my, function () { var g = geo(o[0], o[1], el.getBoundingClientRect()); return { x: g.x, y: g.y }; }, o[1]);
    if (!ok) return;
    setMood('curious');
    await typeSay(my, DVQ[id] || 'ooh', 1100, 28);
    setMood('normal');
  }
  document.addEventListener('pointerover', function (e) {
    var a = e.target.closest && e.target.closest('a.dv');
    clearTimeout(dvT);
    if (!a || e.pointerType === 'touch') return;
    dvT = setTimeout(function () {
      if (calmNow() || !a.matches(':hover')) return;
      reactAt = Date.now();
      interrupt(function (my) { return perch(my, a.querySelector('.bx') || a, ((a.getAttribute('href') || '').split('#')[1] || '').split('~')[0]); });
    }, 900);
  });

  requestAnimationFrame(render);
  toggles.forEach(function (b) { b.addEventListener('click', function () { setOn(!on, true); }); });
  setOn(get('pilot') !== 'off', false);
})();
