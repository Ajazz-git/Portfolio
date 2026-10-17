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

  var BACK = '<svg class="lyr pback" viewBox="0 0 140 100" focusable="false">'
    + '<ellipse cx="47" cy="40" rx="6" ry="13" transform="rotate(18 47 40)" fill="#16293a"' + st() + '/>'
    + '<rect x="45" y="27" width="11" height="22" rx="3.5" fill="url(#pk-dark)"' + st(1.4) + '/>'
    + '<path d="M47 27 L44 19" stroke="#2c3b35" stroke-width="1.6" stroke-linecap="round"/><circle cx="44" cy="18.5" r="1.7" fill="' + ACC + '"/>'
    + '<circle cx="50.5" cy="33" r="1.4" fill="' + ACC + '"/><circle cx="50.5" cy="38" r="1.4" fill="#ffb020"/><circle cx="50.5" cy="43" r="1.4" fill="' + ACC + '"/>'
    + '</svg>';

  var BODY = '<svg class="lyr pbody" viewBox="0 0 140 100" focusable="false">'
    + '<ellipse class="pad" cx="70" cy="67" rx="27" ry="3.8" fill="' + ACC + '" fill-opacity="0.35" stroke="' + ACC + '" stroke-width="1.4"/>'
    + '<ellipse cx="66" cy="38" rx="20" ry="25" fill="url(#pk-body)"' + st() + '/>'
    + '<ellipse cx="72" cy="43" rx="12.5" ry="16.5" fill="url(#pk-belly)"/>'
    + '<ellipse class="spec" cx="57" cy="29" rx="5" ry="10" transform="rotate(14 57 29)" fill="#fff" opacity="0.2"/>'
    + '<g class="scarf"><path d="M52 36 Q38 34 28 44 Q42 43 52 42 Z" fill="#ff5d4a"' + st() + '/></g>'
    + '<path d="M50 32 Q67 41 85 33 L86 38 Q67 47 50 38 Z" fill="#ff5d4a"' + st() + '/>'
    + '<path d="M55 36 Q67 41 80 35" stroke="#fff" stroke-opacity="0.35" stroke-width="1.2" fill="none"/>'
    + '<path class="rim" d="M83 20 Q92 38 82 56" stroke="' + ACC + '" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="0"/>'
    + '<g class="ft ft1"><ellipse cx="60" cy="62" rx="8.5" ry="3.4" fill="url(#pk-beak)"' + st() + '/></g>'
    + '<g class="ft ft2"><ellipse cx="80" cy="62" rx="8.5" ry="3.4" fill="url(#pk-beak)"' + st() + '/></g>'
    + '</svg>';

  var EYES = '<g class="eyes"><g class="blinker">'
    + '<g data-m="normal"><rect x="68" y="17" width="4.6" height="8" rx="2.3" fill="' + ACC + '"/><rect x="78" y="17" width="4.6" height="8" rx="2.3" fill="' + ACC + '"/></g>'
    + '<g data-m="happy"><path d="M67.5 23 Q70.3 16.5 73 23" stroke="' + ACC + '" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M77.5 23 Q80.3 16.5 83 23" stroke="' + ACC + '" stroke-width="2.2" fill="none" stroke-linecap="round"/></g>'
    + '<g data-m="angry"><path d="M66.5 17.5 L74 21 L74 25 L66.5 25 Z" fill="#ff5d4a"/><path d="M84 17.5 L76.5 21 L76.5 25 L84 25 Z" fill="#ff5d4a"/></g>'
    + '<g data-m="annoyed"><rect x="67.5" y="21" width="6" height="3.2" rx="1.2" fill="' + ACC + '"/><rect x="77.5" y="21" width="6" height="3.2" rx="1.2" fill="' + ACC + '"/><path d="M67 20.4 H74 M77 20.4 H84" stroke="' + INK + '" stroke-width="1.8" stroke-linecap="round"/></g>'
    + '<g data-m="wink"><rect x="68" y="17" width="4.6" height="8" rx="2.3" fill="' + ACC + '"/><path d="M77.5 23 Q80.3 16.5 83 23" stroke="' + ACC + '" stroke-width="2.2" fill="none" stroke-linecap="round"/></g>'
    + '<g data-m="focus"><rect x="68" y="20" width="4.6" height="5" rx="2" fill="' + ACC + '"/><rect x="78" y="20" width="4.6" height="5" rx="2" fill="' + ACC + '"/></g>'
    + '<g data-m="dead"><path d="M67.5 18 L72.5 24 M72.5 18 L67.5 24 M77.5 18 L82.5 24 M82.5 18 L77.5 24" stroke="#ff5d4a" stroke-width="1.8" stroke-linecap="round"/></g>'
    + '<g data-m="surprised"><circle cx="70.3" cy="21.5" r="3.5" fill="' + ACC + '"/><circle cx="80.3" cy="21.5" r="3.5" fill="' + ACC + '"/><path d="M66.5 14.8 Q70.3 12.6 74 14.8 M76.6 14.8 Q80.3 12.6 84 14.8" stroke="' + ACC + '" stroke-width="1.3" fill="none" stroke-linecap="round"/></g>'
    + '<g data-m="curious"><rect x="68" y="16" width="4.8" height="9.5" rx="2.4" fill="' + ACC + '"/><rect x="78" y="16" width="4.8" height="9.5" rx="2.4" fill="' + ACC + '"/><path d="M77 13.4 Q80.5 11.6 84 13.6" stroke="' + ACC + '" stroke-width="1.3" fill="none" stroke-linecap="round"/></g>'
    + '<g data-m="smug"><rect x="67.5" y="20.5" width="6" height="4.2" rx="1.6" fill="' + ACC + '"/><rect x="77.5" y="20.5" width="6" height="4.2" rx="1.6" fill="' + ACC + '"/><path d="M66.5 20.2 H74 M76.5 20.2 H84" stroke="' + INK + '" stroke-width="2" stroke-linecap="round"/><path d="M77 16 Q81 14 84.5 16.6" stroke="' + ACC + '" stroke-width="1.3" fill="none" stroke-linecap="round"/></g>'
    + '<g data-m="sleepy"><path d="M67.5 22.4 H73 M77.5 22.4 H83" stroke="' + ACC + '" stroke-width="2.2" stroke-linecap="round"/><text x="85" y="15" font-size="6" font-family="monospace" fill="' + ACC + '">z</text></g>'
    + '<g data-m="sad"><rect x="68" y="20" width="4.6" height="5" rx="2" fill="' + ACC + '"/><rect x="78" y="20" width="4.6" height="5" rx="2" fill="' + ACC + '"/><path d="M66.5 17.8 L73.5 14.8 M84 17.8 L77 14.8" stroke="' + ACC + '" stroke-width="1.3" fill="none" stroke-linecap="round"/></g>'
    + '<g data-m="love"><path d="M70.3 25 C65.5 21.6 66.2 17 70.3 19.2 C74.4 17 75.1 21.6 70.3 25Z" fill="#ff6fa8"/><path d="M80.3 25 C75.5 21.6 76.2 17 80.3 19.2 C84.4 17 85.1 21.6 80.3 25Z" fill="#ff6fa8"/></g>'
    + '<g data-m="dizzy"><path d="M70.3 21 a0.9 0.9 0 1 1 1.8 0 a1.9 1.9 0 1 1 -3.8 0 a2.9 2.9 0 1 1 5.8 0" stroke="' + ACC + '" stroke-width="1" fill="none" stroke-linecap="round"/><path d="M80.3 21 a0.9 0.9 0 1 1 1.8 0 a1.9 1.9 0 1 1 -3.8 0 a2.9 2.9 0 1 1 5.8 0" stroke="' + ACC + '" stroke-width="1" fill="none" stroke-linecap="round"/></g>'
    + '</g></g>';

  var HEAD = '<svg class="lyr pheadf" viewBox="0 0 140 100" focusable="false">'
    + '<ellipse cx="67" cy="22" rx="17" ry="15" fill="url(#pk-body)"' + st() + '/>'
    + '<ellipse class="spec" cx="60" cy="14" rx="6" ry="3.4" transform="rotate(-18 60 14)" fill="#fff" opacity="0.22"/>'
    + '<path d="M50.5 19 C49 3 81 1.5 83 19 Z" fill="url(#pk-acc)"' + st() + '/>'
    + '<path d="M53 17.5 L35 22 L37.5 25.5 L55 22.5 Z" fill="url(#pk-acc)"' + st() + '/>'
    + '<path d="M58 8 Q66 4 74 8" stroke="#fff" stroke-opacity="0.5" stroke-width="1.6" fill="none" stroke-linecap="round"/>'
    + '<circle cx="66" cy="4.6" r="1.6" fill="' + INK + '"/>'
    + '<path d="M49 24 Q58 28 63 24" stroke="#16222b" stroke-width="3.4" fill="none" stroke-linecap="round"/>'
    + '<rect class="lens" x="62" y="14" width="28" height="14" rx="7" fill="url(#pk-screen)" stroke="' + ACC + '" stroke-width="1.8"/>'
    + EYES
    + '<path d="M66 15.6 L74 15.6 L69.5 27.2 L63.5 27.2 Z" fill="#fff" opacity="0.2"/>'
    + '<path d="M80 15.5 Q86 16 88 21" stroke="#fff" stroke-opacity="0.55" stroke-width="1.2" fill="none" stroke-linecap="round"/>'
    + '<path d="M85 28 L100 31.5 L85 34 Z" fill="url(#pk-beak)"' + st(1.4) + '/>'
    + '<path class="beakLow" d="M85 34 L97 34.3 L86 37.6 Z" fill="url(#pk-beak)"' + st(1.4) + '/>'
    + '</svg>';

  var FLIP = '<svg class="lyr pflip" viewBox="0 0 140 100" focusable="false">'
    + '<ellipse cx="90" cy="48" rx="5.6" ry="12.5" transform="rotate(-30 90 48)" fill="url(#pk-body)"' + st() + '/>'
    + '<ellipse cx="88" cy="43" rx="1.8" ry="6" transform="rotate(-30 88 43)" fill="#fff" opacity="0.18"/>'
    + '</svg>';

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
  var blackout = null, crt = null;

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
    pilot.style.transform = 'translate3d(' + pos.x.toFixed(1) + 'px,' + (pos.y + bob).toFixed(1) + 'px,0)';
    rig.style.transform = 'translateZ(' + z.toFixed(1) + 'px) rotateX(' + (pitch + S.rx).toFixed(1) + 'deg) rotateY(' + yaw.toFixed(1) + 'deg) rotateZ(' + roll.toFixed(1) + 'deg)';
    flip.style.transform = 'rotateY(' + turn.toFixed(1) + 'deg)';
    pg.style.transform = 'translate3d(' + S.hx.toFixed(1) + 'px,' + S.hy.toFixed(1) + 'px,' + S.hz.toFixed(1) + 'px) rotateY(' + S.hry.toFixed(1) + 'deg) scale3d(' + sx.toFixed(3) + ',' + sy.toFixed(3) + ',1)';
    var hyaw = look.x * 24 + S.head, hpit = -look.y * 14;
    head.style.transform = 'rotateY(' + hyaw.toFixed(1) + 'deg) rotateX(' + hpit.toFixed(1) + 'deg) rotateZ(' + (look.x * -3 + Math.sin(t * 1.4) * 0.8).toFixed(1) + 'deg)';
    eyes.style.transform = 'translate(' + (look.x * 1.6).toFixed(2) + 'px,' + (look.y * 1.1).toFixed(2) + 'px)';
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
    var ax = sayAnchor ? sayAnchor.x : pos.x + W / 2 + S.hx * face;
    var ay = sayAnchor ? sayAnchor.y : pos.y - 6 + S.hy - 6;
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

  /* ---- call button and chat ---- */
  var ME = "I'm Packet, a penguin who lives in this network. I carry data around and keep Ajas's site tidy. 🐧";
  var AJAS = "Ajas is an IT specialist in Kochi: networks, servers, devices and accounts, on Windows, Linux and macOS.";
  var JOKES = ["Why did the router go to therapy? Too many connection issues.", "There are 10 kinds of people: those who know binary and those who don't.", "It's not DNS. There's no way it's DNS. ...It was DNS.", "A SQL query walks into a bar, sees two tables and asks: can I join you?", "I would tell you a UDP joke, but you might not get it."];
  var BYE = ['See you around! 🐧', 'Back to my rounds. ping me anytime!', 'Bye! Mind the cables.'];
  var callBtn = document.createElement('button');
  callBtn.type = 'button'; callBtn.className = 'pk-call';
  callBtn.setAttribute('aria-label', 'Call Packet the penguin to chat');
  var AVHEAD = HEAD.replace('class="lyr pheadf" viewBox="0 0 140 100"', 'class="pk-head" viewBox="34 0 68 40"');
  callBtn.setAttribute('data-mood', 'normal');
  callBtn.innerHTML = '<span class="pk-ping" aria-hidden="true"></span><span class="pk-ring" aria-hidden="true"></span><span class="pk-glass" aria-hidden="true">' + AVHEAD + '</span><span class="pk-dot" aria-hidden="true"></span><span class="pk-tip" aria-hidden="true">psst... talk to me</span>';
  var avT = 0;
  function avMood(m) { callBtn.setAttribute('data-mood', m); }
  callBtn.addEventListener('pointerenter', function () { clearTimeout(avT); avMood('surprised'); avT = setTimeout(function () { avMood('happy'); }, 320); });
  callBtn.addEventListener('pointerleave', function () { clearTimeout(avT); avMood('normal'); });
  callBtn.addEventListener('focus', function () { avMood('happy'); });
  callBtn.addEventListener('blur', function () { avMood('normal'); });
  setInterval(function () {
    if (callBtn.hidden || document.hidden || callBtn.matches(':hover, :focus-visible')) return;
    avMood('wink'); setTimeout(function () { if (!callBtn.matches(':hover')) avMood('normal'); }, 750);
  }, 7000);
  var chat = document.createElement('div');
  chat.className = 'pk-chat'; chat.hidden = true;
  chat.setAttribute('role', 'dialog'); chat.setAttribute('aria-label', 'Chat with Packet');
  chat.innerHTML = '<div class="pk-chips"></div><form class="pk-form"><input type="text" maxlength="60" placeholder="say something to Packet" aria-label="Message to Packet" autocomplete="off"><button type="submit" class="chip">send</button></form>';
  document.body.appendChild(callBtn);
  document.body.appendChild(chat);
  var chips = chat.querySelector('.pk-chips'), form = chat.querySelector('.pk-form'), field = form.querySelector('input');
  var chatMy = 0, chatBusy = false, closeFn = null;
  function setChips(list) {
    chips.textContent = '';
    list.forEach(function (it) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'chip'; b.textContent = it[0];
      b.addEventListener('click', it[1]);
      chips.appendChild(b);
    });
  }
  async function reply(text) {
    if (chatBusy) return;
    chatBusy = true; chat.classList.add('busy');
    setMood('happy');
    await typeSay(chatMy, text, 0, 22);
    chatBusy = false; chat.classList.remove('busy');
    if (on) setMood('normal');
  }
  function go(id) {
    var t = document.getElementById(id);
    if (t) t.scrollIntoView({ behavior: 'smooth' });
    reply('Off we go! 🚀');
    setChips(TOP);
  }
  var TOP = [
    ['Who are you?', function () { reply(ME); }],
    ['What does Ajas do?', function () { reply(AJAS); }],
    ['Tell me a joke', function () { reply(pick(JOKES)); }],
    ['Take me somewhere', function () { setChips(PLACES); }],
    ['Bye', function () { if (closeFn && !chatBusy) closeFn(); }]
  ];
  var PLACES = [['Fix it', 'fixit'], ['Network lab', 'lab'], ['Docs', 'docs'], ['Roadmap', 'roadmap'], ['Contact', 'contact']].map(function (p) {
    return [p[0], function () { go(p[1]); }];
  }).concat([['« back', function () { setChips(TOP); }]]);
  function think(t) {
    t = t.toLowerCase();
    if (/\b(bye|goodbye|see you|later)\b/.test(t)) { if (closeFn) closeFn(); return null; }
    if (/\b(hi|hello|hey|yo)\b/.test(t)) return pick(HELLO);
    if (/joke|funny|laugh/.test(t)) return pick(JOKES);
    if (/who are you|your name|packet|penguin/.test(t)) return ME;
    if (/ajas|ajaz|owner|who made|work|job|skill|does he/.test(t)) return AJAS;
    if (/hire|contact|email|mail|reach/.test(t)) return 'Hiring? Smart move. The Contact button up top goes straight to him.';
    if (/resume|cv/.test(t)) return 'The resume is coming soon. Ajas is still polishing it. 📄';
    if (/fish|food|hungry/.test(t)) return 'Fish. Always fish. 🐟';
    if (/thank|thanks|cool|nice|great|love/.test(t)) return 'Aw, thanks! 🐧';
    return pick(['I only speak packet. Ask about Ajas, a joke, or where to go.', "Hmm, that's above my bandwidth. Try the buttons!"]);
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var t = field.value.trim(); field.value = '';
    if (!t || chatBusy) return;
    var r = think(t);
    if (r) reply(r);
  });
  function hideChat() {
    chat.hidden = true; chat.classList.remove('busy', 'show');
    say.classList.remove('chat');
    chatBusy = false; closeFn = null;
    callBtn.classList.remove('away');
  }
  async function summon(my) {
    busy = true; chatMy = my;
    setMood('happy');
    chat.hidden = false; callBtn.classList.add('away');
    setChips(TOP); chat.classList.add('busy');
    requestAnimationFrame(function () { chat.classList.add('show'); });
    say.classList.add('chat');
    var spot = function () {
      var right = chat.offsetLeft + chat.offsetWidth, top = chat.offsetTop;
      return { x: clamp(right - W - 14, 6, window.innerWidth - W - 6), y: clamp(top - H - 8, 70, window.innerHeight - H - 6) };
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
    chat.classList.remove('busy');
    chat.querySelector('.chip').focus({ preventScroll: true });
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

  requestAnimationFrame(render);
  toggles.forEach(function (b) { b.addEventListener('click', function () { setOn(!on, true); }); });
  setOn(get('pilot') !== 'off', false);
})();
