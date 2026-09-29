/* ============================================================
   Jake Pulitzer — motion layer
   1. Bauhaus shape field   (interactive canvas)
   2. Kinetic hero type     (cursor-reactive letters)
   3. Scroll reveals        (IntersectionObserver)
   4. Counters, scrollspy, progress bar, motion toggle
   ============================================================ */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ==========================================================
     1. THE FIELD
     ========================================================== */

  var canvas = document.getElementById('field');
  var ctx = canvas.getContext('2d');

/* Weighted bag: the pastels carry the field, ink is an accent. Too much ink
   and the shapes start competing with the body copy for attention. */
  var PALETTE = [
    'rgba(228,135,111,0.55)',  /* red    */
    'rgba(228,135,111,0.55)',
    'rgba(143,182,214,0.55)',  /* blue   */
    'rgba(143,182,214,0.55)',
    'rgba(239,207,134,0.58)',  /* yellow */
    'rgba(239,207,134,0.58)',
    'rgba(167,191,158,0.52)',  /* sage   */
    'rgba(167,191,158,0.52)',
    'rgba(21,18,14,0.45)'      /* ink    */
  ];

  var TYPES = ['circle', 'ring', 'square', 'triangle', 'half', 'arc', 'bar', 'cross'];

  var W = 0, H = 0, DPR = 1;
  var shapes = [];
  var ripples = [];
  var running = !reduceMotion;
  var userPaused = false;
  var scrollY = window.pageYOffset;

  var pointer = { x: -9999, y: -9999, active: false };

  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }

  function shapeCount() {
    var area = W * H;
    var n = Math.round(area / 34000);
    return Math.max(12, Math.min(44, n));
  }

  function makeShape() {
    var type = pick(TYPES);
    var depth = rand(0.28, 1);            /* far -> near */
    var vScale = Math.max(0.5, Math.min(1, Math.min(W, H * 1.4) / 1200));
    var size = rand(16, 74) * (0.45 + depth * 0.8) * vScale;
    return {
      type: type,
      bx: rand(0, W),
      by: rand(0, H),
      ox: 0, oy: 0,
      vx: rand(-0.22, 0.22) * depth,
      vy: rand(-0.22, 0.22) * depth,
      size: size,
      rot: rand(0, Math.PI * 2),
      rotV: rand(-0.0045, 0.0045),
      depth: depth,
      color: pick(PALETTE),
      stroke: Math.random() < 0.34
    };
  }

  function build() {
    shapes = [];
    var n = shapeCount();
    for (var i = 0; i < n; i++) shapes.push(makeShape());
  }

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    build();
  }

  function drawShape(s, x, y) {
    var r = s.size / 2;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(s.rot);

    if (s.stroke) {
      ctx.strokeStyle = s.color;
      ctx.lineWidth = Math.max(1.4, s.size * 0.055);
      ctx.fillStyle = 'transparent';
    } else {
      ctx.fillStyle = s.color;
    }

    ctx.beginPath();

    switch (s.type) {
      case 'circle':
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        break;
      case 'ring':
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.strokeStyle = s.color;
        ctx.lineWidth = Math.max(2, s.size * 0.14);
        ctx.stroke();
        ctx.restore();
        return;
      case 'square':
        ctx.rect(-r, -r, s.size, s.size);
        break;
      case 'triangle':
        ctx.moveTo(0, -r);
        ctx.lineTo(r, r);
        ctx.lineTo(-r, r);
        ctx.closePath();
        break;
      case 'half':
        ctx.arc(0, 0, r, Math.PI, Math.PI * 2);
        ctx.closePath();
        break;
      case 'arc':
        ctx.strokeStyle = s.color;
        ctx.lineWidth = Math.max(2, s.size * 0.12);
        ctx.arc(0, 0, r, 0, Math.PI * 0.85);
        ctx.stroke();
        ctx.restore();
        return;
      case 'bar':
        ctx.rect(-r, -Math.max(1.2, s.size * 0.045), s.size, Math.max(2.4, s.size * 0.09));
        break;
      case 'cross':
        var t = Math.max(1.6, s.size * 0.09);
        ctx.rect(-r, -t / 2, s.size, t);
        ctx.rect(-t / 2, -r, t, s.size);
        break;
    }

    if (s.stroke) ctx.stroke(); else ctx.fill();
    ctx.restore();
  }

  function step() {
    ctx.clearRect(0, 0, W, H);

    var i, s, x, y;
    var pad = 120;

    /* --- update --- */
    for (i = 0; i < shapes.length; i++) {
      s = shapes[i];

      if (running) {
        s.bx += s.vx;
        s.by += s.vy;
        s.rot += s.rotV;
      }

      /* wrap */
      if (s.bx < -pad) s.bx = W + pad;
      if (s.bx > W + pad) s.bx = -pad;
      if (s.by < -pad) s.by = H + pad;
      if (s.by > H + pad) s.by = -pad;

      /* parallax against scroll */
      var par = (scrollY * 0.06) * s.depth;

      x = s.bx + s.ox;
      y = s.by + s.oy - (par % (H + pad * 2));
      if (y < -pad) y += H + pad * 2;

      /* cursor repulsion */
      if (pointer.active) {
        var dx = x - pointer.x;
        var dy = y - pointer.y;
        var d2 = dx * dx + dy * dy;
        var R = 190;
        if (d2 < R * R && d2 > 0.01) {
          var d = Math.sqrt(d2);
          var force = (1 - d / R) * 16 * s.depth;
          s.ox += (dx / d) * force * 0.14;
          s.oy += (dy / d) * force * 0.14;
        }
      }

      /* ripple push */
      for (var k = 0; k < ripples.length; k++) {
        var rp = ripples[k];
        var rdx = x - rp.x, rdy = y - rp.y;
        var rd = Math.sqrt(rdx * rdx + rdy * rdy) || 1;
        var band = Math.abs(rd - rp.r);
        if (band < 50) {
          var f = (1 - band / 50) * rp.life * 3.2;
          s.ox += (rdx / rd) * f;
          s.oy += (rdy / rd) * f;
        }
      }

      /* spring the offset back to zero */
      s.ox *= 0.92;
      s.oy *= 0.92;

      s.px = x;
      s.py = y;
    }

    /* --- connective lines --- */
    ctx.lineWidth = 1;
    for (i = 0; i < shapes.length; i++) {
      for (var j = i + 1; j < shapes.length; j++) {
        var a = shapes[i], b = shapes[j];
        var ddx = a.px - b.px, ddy = a.py - b.py;
        var dist2 = ddx * ddx + ddy * ddy;
        if (dist2 < 24000) {
          var alpha = (1 - dist2 / 24000) * 0.17;
          ctx.strokeStyle = 'rgba(21,18,14,' + alpha.toFixed(3) + ')';
          ctx.beginPath();
          ctx.moveTo(a.px, a.py);
          ctx.lineTo(b.px, b.py);
          ctx.stroke();
        }
      }
    }

    /* --- shapes --- */
    for (i = 0; i < shapes.length; i++) drawShape(shapes[i], shapes[i].px, shapes[i].py);

    /* --- ripples --- */
    for (i = ripples.length - 1; i >= 0; i--) {
      var rr = ripples[i];
      rr.r += 9;
      rr.life -= 0.022;
      if (rr.life <= 0) { ripples.splice(i, 1); continue; }
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(21,18,14,' + (rr.life * 0.35).toFixed(3) + ')';
      ctx.lineWidth = 2;
      ctx.arc(rr.x, rr.y, rr.r, 0, Math.PI * 2);
      ctx.stroke();
    }

    requestAnimationFrame(step);
  }

  /* pointer */
  window.addEventListener('pointermove', function (e) {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.active = true;
  }, { passive: true });

  window.addEventListener('pointerleave', function () { pointer.active = false; });

  window.addEventListener('pointerdown', function (e) {
    if (e.target.closest('a, button')) return;
    ripples.push({ x: e.clientX, y: e.clientY, r: 4, life: 1 });
    if (ripples.length > 5) ripples.shift();
  }, { passive: true });

  /* resize (debounced) */
  var rTimer;
  window.addEventListener('resize', function () {
    clearTimeout(rTimer);
    rTimer = setTimeout(resize, 180);
  });

  resize();
  requestAnimationFrame(step);

  /* ==========================================================
     2. KINETIC HERO TYPE
     ========================================================== */

  var chars = Array.prototype.slice.call(document.querySelectorAll('.giant .ch'));

  /* entrance */
  chars.forEach(function (ch, i) {
    ch.style.transform = 'translateY(0.65em) rotate(6deg)';
    ch.style.opacity = '0';
    ch.style.transition = 'transform .9s cubic-bezier(.16,1,.3,1) ' + (i * 45 + 120) + 'ms, opacity .7s ease ' + (i * 45 + 120) + 'ms';
  });

  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      chars.forEach(function (ch) {
        ch.style.transform = '';
        ch.style.opacity = '1';
      });
    });
  });

  /* cursor-reactive letters */
  if (!reduceMotion && window.matchMedia('(hover: hover)').matches) {
    var charBoxes = [];
    var boxTimer;

    function measure() {
      charBoxes = chars.map(function (ch) {
        var r = ch.getBoundingClientRect();
        return { el: ch, cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
      });
    }

    setTimeout(measure, 1400);
    window.addEventListener('resize', function () {
      clearTimeout(boxTimer);
      boxTimer = setTimeout(measure, 200);
    });
    window.addEventListener('scroll', function () {
      clearTimeout(boxTimer);
      boxTimer = setTimeout(measure, 120);
    }, { passive: true });

    var ticking = false;
    window.addEventListener('pointermove', function (e) {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        for (var i = 0; i < charBoxes.length; i++) {
          var c = charBoxes[i];
          var dx = c.cx - e.clientX;
          var dy = c.cy - e.clientY;
          var d = Math.sqrt(dx * dx + dy * dy);
          var R = 260;
          if (d < R) {
            var f = (1 - d / R);
            c.el.style.transform =
              'translate(' + (dx / d * f * 26).toFixed(2) + 'px,' +
              (dy / d * f * 20).toFixed(2) + 'px) rotate(' + (f * (dx > 0 ? 7 : -7)).toFixed(2) + 'deg)';
            c.el.style.transition = 'transform .35s cubic-bezier(.22,.8,.3,1)';
          } else if (c.el.style.transform) {
            c.el.style.transform = '';
          }
        }
        ticking = false;
      });
    }, { passive: true });
  }

  /* ==========================================================
     3. SCROLL REVEALS
     ========================================================== */

  var revealables = document.querySelectorAll('.reveal');

  /* Content is only hidden while we are certain we can bring it back.
     If the observer never reports - a crawler, a headless renderer, a
     browser with IO disabled - we drop the 'js' class and every .reveal
     falls back to plain visible text. */
  function showEverything() {
    document.documentElement.classList.remove('js');
    runCounters(document);
  }

  if ('IntersectionObserver' in window && !reduceMotion) {
    var ioDelivered = false;

    var io = new IntersectionObserver(function (entries) {
      ioDelivered = true;
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        runCounters(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.16, rootMargin: '0px 0px -8% 0px' });

    revealables.forEach(function (el) { io.observe(el); });

    /* Failsafe: a healthy observer reports on every observed element within
       a frame or two, whether it is intersecting or not. Silence means the
       observer is not running, so stop hiding anything. */
    setTimeout(function () {
      if (!ioDelivered) showEverything();
    }, 1500);

    /* A page loaded in a background tab gets no render steps, so the observer
       stays quiet until the tab is looked at. Catch up when it is. */
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) return;
      setTimeout(function () {
        Array.prototype.forEach.call(revealables, function (el) {
          if (el.classList.contains('is-in')) return;
          var r = el.getBoundingClientRect();
          if (r.top < window.innerHeight && r.bottom > 0) {
            el.classList.add('is-in');
            runCounters(el);
            io.unobserve(el);
          }
        });
      }, 80);
    });

  } else {
    showEverything();
  }

  /* ==========================================================
     4. COUNTERS
     ========================================================== */

  function runCounters(root) {
    var nums = root.querySelectorAll('[data-count]');
    Array.prototype.forEach.call(nums, function (el) {
      if (el.dataset.done) return;
      el.dataset.done = '1';

      var target = parseFloat(el.dataset.count);
      var prefix = el.dataset.prefix || '';
      var suffix = el.dataset.suffix || '';

      if (reduceMotion) { el.textContent = prefix + target + suffix; return; }

      /* The markup already carries the real figure, so a visitor whose JS
         never gets this far still reads the true number. Only wind it back
         to zero once we are certain we can count it up again. */
      el.textContent = prefix + '0' + suffix;

      var dur = 1300;
      var t0 = null;
      var settled = false;

      function settle() {
        settled = true;
        el.textContent = prefix + target + suffix;
      }

      function tick(t) {
        if (settled) return;
        if (t0 === null) t0 = t;
        var p = Math.min((t - t0) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = prefix + Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(tick); else settled = true;
      }
      requestAnimationFrame(tick);

      /* These are real figures from the resume. If rAF is throttled mid-count
         - a backgrounded tab, a stalled renderer - the number must never be
         left frozen at a wrong value, so a timer settles it either way. */
      setTimeout(settle, dur + 150);
    });
  }

  /* ==========================================================
     5. SCROLL PROGRESS + SCROLLSPY
     ========================================================== */

  var bar = document.getElementById('progress-bar');
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.sidenav a'));
  var targets = navLinks.map(function (a) {
    return document.getElementById(a.getAttribute('href').slice(1));
  });

  var scrollTicking = false;

  function onScroll() {
    scrollY = window.pageYOffset;
    if (scrollTicking) return;
    scrollTicking = true;

    requestAnimationFrame(function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var pct = max > 0 ? scrollY / max : 0;
      bar.style.width = (pct * 100).toFixed(2) + '%';

      var mid = scrollY + window.innerHeight * 0.36;
      var current = 0;
      for (var i = 0; i < targets.length; i++) {
        if (targets[i] && targets[i].offsetTop <= mid) current = i;
      }
      navLinks.forEach(function (a, i) {
        a.classList.toggle('is-active', i === current);
      });

      scrollTicking = false;
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ==========================================================
     6. MOTION TOGGLE
     ========================================================== */

  var toggle = document.getElementById('motion-toggle');

  function setMotion(on) {
    running = on;
    userPaused = !on;
    toggle.setAttribute('aria-pressed', String(on));
    document.documentElement.classList.toggle('motion-off', !on);
  }

  toggle.addEventListener('click', function () { setMotion(!running); });
  if (reduceMotion) setMotion(false);

  /* pause the field when the tab is hidden */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) running = false;
    else if (!userPaused && !reduceMotion) running = true;
  });

  /* ==========================================================
     7. ODDS AND ENDS
     ========================================================== */

  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

})();
