/* Totem Automobili — redesign test, v2 layer. Vanilla JS, no dependencies, no network calls, no storage. */
(function () {
  'use strict';
  var doc = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  var slow = !!conn && (conn.saveData || /(^|-)(2g|3g)$/.test(conn.effectiveType || ''));
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  function onScroll(fn) {
    var busy = false;
    window.addEventListener('scroll', function () { if (busy) return; busy = true; requestAnimationFrame(function () { busy = false; fn(); }); }, { passive: true });
    window.addEventListener('resize', fn);
    fn();
  }

  /* ---------- Reading progress (pages without a section menu, which has its own) ---------- */
  var bar = $('.scrollbar');
  if (bar && !$('.subnav')) {
    onScroll(function () {
      var h = doc.scrollHeight - window.innerHeight;
      bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, window.scrollY / h) : 0) + ')';
    });
  } else if (bar) { bar.remove(); }

  /* ---------- Home hero: depth on scroll ---------- */
  var hero = $('.hero--home');
  if (hero && !reduced) {
    onScroll(function () {
      var p = Math.min(1, Math.max(0, window.scrollY / (hero.offsetHeight || 1)));
      hero.style.setProperty('--p', p.toFixed(3));
    });
  }

  /* ---------- Showcase: preview on hover, swipe on touch, keep the chosen tab in view ---------- */
  $$('[data-hover-tabs]').forEach(function (list) {
    var tabs = $$('[role="tab"]', list), timer;
    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        if (list.scrollWidth > list.clientWidth + 4) { var lr = list.getBoundingClientRect(), tr = t.getBoundingClientRect(); list.scrollTo({ left: list.scrollLeft + tr.left - lr.left - (lr.width - tr.width) / 2, behavior: reduced ? 'auto' : 'smooth' }); }
      });
      t.addEventListener('keydown', function (e) {
        var i = tabs.indexOf(t);
        if (e.key === 'ArrowDown') { e.preventDefault(); var n = tabs[(i + 1) % tabs.length]; n.click(); n.focus(); }
        if (e.key === 'ArrowUp') { e.preventDefault(); var p = tabs[(i - 1 + tabs.length) % tabs.length]; p.click(); p.focus(); }
      });
    });
    var stage = list.closest('.showcase').querySelector('[data-swipe-tabs]');
    if (stage) swipe(stage, function (dir) {
      var i = tabs.findIndex(function (x) { return x.getAttribute('aria-selected') === 'true'; });
      var n = tabs[i + dir]; if (n) n.click();
    });
  });

  function swipe(el, cb) {
    var x0 = null, y0 = 0;
    el.addEventListener('touchstart', function (e) { if (e.touches.length === 1) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; } }, { passive: true });
    el.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; x0 = null;
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) cb(dx < 0 ? 1 : -1);
    }, { passive: true });
  }

  /* ---------- Commission galleries: one dialog, filled with the chosen car's photographs ---------- */
  var gal = $('#gallery'), gdata = $('#gallery-data');
  if (gal && gal.showModal && gdata) {
    var G = JSON.parse(gdata.textContent), cur = null, gi = 0, gopener = null;
    var gImg = $('.gallery__img', gal), gThumbs = $('.gallery__thumbs', gal);
    var SIZES = '(max-width: 900px) 100vw, calc(100vw - 240px)';
    var srcsetOf = function (p) { return p.ws.map(function (w) { return p.s + '-' + w + '.webp ' + w + 'w'; }).join(', '); };
    var srcOf = function (p, w) { var pick = p.ws.filter(function (x) { return x >= w; })[0] || p.ws[p.ws.length - 1]; return p.s + '-' + pick + '.webp'; };
    var pad = function (n) { return String(n).padStart(2, '0'); };
    function preload(p) { if (!p) return; var im = new Image(); im.sizes = SIZES; im.srcset = srcsetOf(p); im.src = srcOf(p, 1100); }
    function go(i) {
      var ps = cur.p; gi = (i + ps.length) % ps.length; var p = ps[gi];
      gImg.style.aspectRatio = p.w + ' / ' + p.h; gImg.style.backgroundColor = p.c;
      gImg.sizes = SIZES; gImg.srcset = srcsetOf(p); gImg.src = srcOf(p, 1100);
      gImg.alt = cur.a + ', photograph ' + (gi + 1) + ' of ' + ps.length;
      $('.gallery__count', gal).textContent = pad(gi + 1) + ' / ' + pad(ps.length);
      $('.gallery__credit', gal).textContent = p.cr ? 'Photo ' + p.cr : '';
      $$('button', gThumbs).forEach(function (b, j) { b.setAttribute('aria-current', j === gi ? 'true' : 'false'); });
      var tb = gThumbs.children[gi];
      if (tb) { var lr = gThumbs.getBoundingClientRect(), tr = tb.getBoundingClientRect(); gThumbs.scrollTo({ left: gThumbs.scrollLeft + tr.left - lr.left - (lr.width - tr.width) / 2, behavior: 'auto' }); }
      preload(ps[(gi + 1) % ps.length]); preload(ps[(gi - 1 + ps.length) % ps.length]);
    }
    function open(k, from) {
      cur = G[k]; if (!cur) return; gopener = from;
      $('.gallery__title', gal).textContent = cur.t; $('.gallery__meta', gal).textContent = cur.m;
      gThumbs.replaceChildren();
      cur.p.forEach(function (p, j) {
        var b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', 'Photograph ' + (j + 1));
        var t = document.createElement('img'); t.src = p.s + '-480.webp'; t.alt = ''; t.loading = 'lazy'; t.decoding = 'async'; t.width = 480; t.height = Math.round(480 * p.h / p.w); t.style.backgroundColor = p.c;
        b.appendChild(t); b.addEventListener('click', function () { go(j); }); gThumbs.appendChild(b);
      });
      gal.showModal(); doc.classList.add('gallery-open'); go(0);
    }
    $$('[data-gallery]').forEach(function (b) { b.addEventListener('click', function () { open(b.getAttribute('data-gallery'), b); }); });
    $('.gallery__close', gal).addEventListener('click', function () { gal.close(); });
    $('.gallery__prev', gal).addEventListener('click', function () { go(gi - 1); });
    $('.gallery__next', gal).addEventListener('click', function () { go(gi + 1); });
    gal.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { e.preventDefault(); go(gi + 1); } if (e.key === 'ArrowLeft') { e.preventDefault(); go(gi - 1); } });
    gal.addEventListener('close', function () { doc.classList.remove('gallery-open'); gopener && gopener.focus(); });
    swipe($('.gallery__stage', gal), function (dir) { go(gi + dir); });
  }

  /* ---------- Carousels: a single small nudge, the first time one comes into view, shows it can be moved ---------- */
  if ('IntersectionObserver' in window && !reduced) {
    var nio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var t = en.target; nio.unobserve(t);
        if (t.scrollWidth <= t.clientWidth + 8 || t.scrollLeft > 0) return;
        t.classList.add('is-nudge');
        setTimeout(function () { t.classList.remove('is-nudge'); }, 1300);
      });
    }, { threshold: 0.6 });
    $$('.range__track, .strip').forEach(function (t) { nio.observe(t); });
  }


  /* ---------- GT Series: the page scrolls, the pinned stage changes chapter ---------- */
  $$('[data-series]').forEach(function (sec) {
    var slides = $$('.series__slide', sec), panels = $$('.series__panel', sec), dots = $$('.series__index button', sec), fill = $('.series__bar i', sec);
    var n = slides.length, cur = -1;
    function load(i) {
      var im = slides[i] && $('img[data-src]', slides[i]);
      if (!im) return;
      im.srcset = im.getAttribute('data-srcset'); im.src = im.getAttribute('data-src');
      im.removeAttribute('data-src'); im.removeAttribute('data-srcset');
    }
    function set(i) {
      if (i === cur) return; cur = i;
      load(i); load(i + 1);
      slides.forEach(function (x, j) { x.classList.toggle('is-on', j === i); });
      panels.forEach(function (x, j) { x.classList.toggle('is-on', j === i); if (j === i) x.removeAttribute('aria-hidden'); else x.setAttribute('aria-hidden', 'true'); });
      dots.forEach(function (x, j) { if (j === i) x.setAttribute('aria-current', 'true'); else x.removeAttribute('aria-current'); });
    }
    function span() { return Math.max(1, sec.offsetHeight - window.innerHeight); }
    onScroll(function () {
      var r = sec.getBoundingClientRect();
      if (r.bottom < -200 || r.top > window.innerHeight + 600) return;
      var p = Math.min(1, Math.max(0, -r.top / span()));
      set(Math.min(n - 1, Math.floor(p * n * 0.9999)));
      if (fill) fill.style.transform = 'scaleX(' + ((cur + 1) / n).toFixed(3) + ')';
    });
    dots.forEach(function (d, i) {
      d.addEventListener('click', function () {
        var top = sec.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: top + span() * (i + 0.5) / n, behavior: reduced ? 'auto' : 'smooth' });
      });
    });
  });

  /* ---------- The studio: drag or use the arrows to turn the car, pick a paint to change it ---------- */
  $$('[data-studio]').forEach(function (st) {
    var paints = JSON.parse(st.getAttribute('data-paints')), views = JSON.parse(st.getAttribute('data-views')), base = st.getAttribute('data-base');
    var stage = $('.studio__stage', st), imgs = $$('.studio__img', st), vb = $$('.studio__views button', st), cb = $$('.studio__chips button', st), nameEl = $('.studio__name b', st);
    var front = 0, p = 0, v = 1, touched = false, TURN = 4;   // views 0…4 go round the car, 5 looks down on it
    vb.forEach(function (b, i) { if (b.getAttribute('aria-pressed') === 'true') v = i; });
    // Pick the rendering that matches the stage on this screen: 960, 1422 or the refined 2844 for dense displays.
    function size() {
      var need = stage.clientWidth * (window.devicePixelRatio || 1);
      var lite = !!conn && conn.downlink && conn.downlink < 5;
      return (slow || need <= 1000) ? 960 : (need <= 1500 || lite) ? 1422 : 2844;
    }
    function url(pi, vi) { return base + paints[pi].s + '-c' + vi + '-' + size() + '.webp'; }
    function warm(pi, vi) { if (vi < 0 || vi > 5) return; var im = new Image(); im.src = url(pi, vi); }
    function show() {
      var next = imgs[1 - front], prev = imgs[front];
      next.onload = function () { next.onload = null; next.classList.add('is-on'); prev.classList.remove('is-on'); front = 1 - front; };
      next.removeAttribute('srcset'); next.removeAttribute('sizes');
      next.alt = 'Totem GT Super in ' + paints[p].n + ', ' + views[v].toLowerCase(); prev.alt = '';
      next.src = url(p, v);
      vb.forEach(function (b, i) { b.setAttribute('aria-pressed', String(i === v)); });
      cb.forEach(function (b, i) { b.setAttribute('aria-pressed', String(i === p)); });
      if (nameEl) nameEl.textContent = paints[p].n;
      if (touched && !slow) { warm(p, v - 1); warm(p, v + 1); }
    }
    function turn(d) { var nv = v > TURN ? (d > 0 ? 0 : TURN) : Math.min(TURN, Math.max(0, v + d)); if (nv !== v) { v = nv; show(); } }
    vb.forEach(function (b, i) { b.addEventListener('click', function () { touched = true; if (i !== v) { v = i; show(); } }); });
    cb.forEach(function (b, i) { b.addEventListener('click', function () { touched = true; if (i !== p) { p = i; show(); } }); });
    stage.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); touched = true; turn(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); touched = true; turn(-1); }
    });
    var x0 = null;
    stage.addEventListener('pointerdown', function (e) { x0 = e.clientX; touched = true; });
    window.addEventListener('pointermove', function (e) {
      if (x0 === null) return;
      var step = Math.max(48, stage.clientWidth / 9), dx = e.clientX - x0;
      if (Math.abs(dx) >= step) { turn(dx < 0 ? 1 : -1); x0 = e.clientX; }
    }, { passive: true });
    ['pointerup', 'pointercancel'].forEach(function (t) { window.addEventListener(t, function () { x0 = null; }); });
    // Once, when the studio first comes into view, the car turns a step and back: the gesture explains itself.
    if ('IntersectionObserver' in window && !reduced && !slow) {
      var sio = new IntersectionObserver(function (en) {
        if (!en[0].isIntersecting) return; sio.disconnect();
        setTimeout(function () { if (touched) return; turn(1); setTimeout(function () { if (!touched) turn(-1); }, 1100); }, 900);
      }, { threshold: 0.6 });
      sio.observe(stage);
    }
  });

  /* ---------- Strips: drag with the mouse (touch scrolls natively) ---------- */
  $$('[data-drag]').forEach(function (el) {
    var sx = null, sl = 0, moved = false;
    el.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') return; sx = e.clientX; sl = el.scrollLeft; moved = false; });
    window.addEventListener('pointermove', function (e) {
      if (sx === null) return;
      if (Math.abs(e.clientX - sx) > 4) { moved = true; el.classList.add('is-drag'); }
      el.scrollLeft = sl - (e.clientX - sx);
    }, { passive: true });
    window.addEventListener('pointerup', function () { sx = null; el.classList.remove('is-drag'); });
    el.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
    el.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') el.scrollBy({ left: 320, behavior: reduced ? 'auto' : 'smooth' });
      if (e.key === 'ArrowLeft') el.scrollBy({ left: -320, behavior: reduced ? 'auto' : 'smooth' });
    });
  });

  /* ---------- Mobile action bar on model pages ---------- */
  var subnav = $('.subnav'), nameEl = subnav && $('.subnav__name img, .subnav__name .mark--text', subnav);
  if (subnav && nameEl && doc.querySelector('.hero--model')) {
    var name = (nameEl.getAttribute('alt') || nameEl.textContent || '').replace(/^Totem\s+/, '');
    var cta = $('.btn', subnav);
    var ab = document.createElement('nav'); ab.className = 'actionbar'; ab.setAttribute('aria-label', 'Quick actions');
    var a1 = document.createElement('a'); a1.href = '#specs'; a1.textContent = 'Specifications';
    var a2 = document.createElement('a');
    if (cta && cta.hasAttribute('data-configure')) { a2.href = cta.href; a2.target = '_blank'; a2.rel = 'noopener'; a2.textContent = 'Configure'; }
    else { a2.href = 'contact.html?model=' + encodeURIComponent(name); a2.textContent = 'Request info'; }
    if (!document.getElementById('specs')) { a1.href = 'contact.html?model=' + encodeURIComponent(name) + '&topic=Private%20presentation'; a1.textContent = 'Presentation'; }
    ab.appendChild(a1); ab.appendChild(a2); document.body.appendChild(ab); document.body.classList.add('has-actionbar');
    var foot = $('.footer');
    onScroll(function () {
      var nearEnd = foot && foot.getBoundingClientRect().top < window.innerHeight - 40;
      ab.classList.toggle('is-on', window.scrollY > window.innerHeight * 0.7 && !nearEnd && !doc.classList.contains('menu-open'));
    });
  }

  /* ---------- Back to top ---------- */
  $$('[data-top]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault(); window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
      var m = $('#main'); if (m) { m.setAttribute('tabindex', '-1'); m.focus({ preventScroll: true }); }
    });
  });

  /* ---------- Print: open every specification group ---------- */
  $$('[data-print]').forEach(function (b) { b.addEventListener('click', function () { window.print(); }); });
  var opened = [];
  window.addEventListener('beforeprint', function () { opened = $$('details:not([open])'); opened.forEach(function (d) { d.open = true; }); });
  window.addEventListener('afterprint', function () { opened.forEach(function (d) { d.open = false; }); opened = []; });
})();
