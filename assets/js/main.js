/* Totem Automobili — redesign test. Vanilla JS, no dependencies, no network calls. */
(function () {
  'use strict';
  var doc = document.documentElement;
  doc.classList.remove('no-js');
  doc.classList.add('js');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var CFG = window.TOTEM_CONFIG || {};

  /* ---------- Configurable links (configurator, contacts) ---------- */
  $$('[data-configure]').forEach(function (a) {
    var key = a.getAttribute('data-configure');
    var url = (CFG.configurator && CFG.configurator[key]) || CFG.configuratorFallback;
    if (url) { a.href = url; a.target = '_blank'; a.rel = 'noopener'; }
  });

  /* ---------- Header: solid on scroll, hide on scroll down ---------- */
  var header = $('.header');
  var lastY = window.scrollY;
  var subnav = $('.subnav');
  function onScrollHeader() {
    var y = window.scrollY;
    if (!header) return;
    header.classList.toggle('is-solid', y > 40 || !!subnav && y > 10);
    if (!doc.classList.contains('menu-open')) {
      header.classList.toggle('is-hidden', y > lastY && y > 400);
    }
    lastY = y;
  }
  window.addEventListener('scroll', onScrollHeader, { passive: true });
  onScrollHeader();

  /* ---------- Mega menu ---------- */
  $$('.nav__item--mega').forEach(function (item) {
    var btn = $('.nav__link', item);
    var timer;
    function open() { clearTimeout(timer); item.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true'); }
    function close() { timer = setTimeout(function () { item.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); }, 160); }
    item.addEventListener('mouseenter', open);
    item.addEventListener('mouseleave', close);
    btn.addEventListener('click', function (e) { e.preventDefault(); item.classList.contains('is-open') ? close() : open(); });
    item.addEventListener('focusout', function (e) { if (!item.contains(e.relatedTarget)) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && item.classList.contains('is-open')) { item.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); btn.focus(); } });
  });

  /* ---------- Mobile drawer ---------- */
  var menuBtn = $('.menu-btn');
  var drawer = $('.drawer');
  if (menuBtn && drawer) {
    menuBtn.addEventListener('click', function () {
      var open = !doc.classList.contains('menu-open');
      doc.classList.toggle('menu-open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      drawer.setAttribute('aria-hidden', String(!open));
      if (open) { header.classList.remove('is-hidden'); var f = $('a', drawer); f && f.focus(); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && doc.classList.contains('menu-open')) { menuBtn.click(); menuBtn.focus(); }
    });
    $$('a', drawer).forEach(function (a) { a.addEventListener('click', function () { if (doc.classList.contains('menu-open')) menuBtn.click(); }); });
  }

  /* ---------- Split words for headline reveals ---------- */
  $$('[data-split]').forEach(function (el) {
    var label = el.textContent.replace(/\s+/g, ' ').trim();
    el.setAttribute('aria-label', label);
    var i = 0;
    function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span'); w.className = 'w'; w.setAttribute('aria-hidden', 'true');
            var s = document.createElement('span'); s.textContent = part; s.style.setProperty('--i', i++);
            w.appendChild(s); frag.appendChild(w);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') { walk(n); }
      });
    }
    walk(el);
    el.classList.add('split-words');
  });

  /* ---------- Reveal on scroll ---------- */
  var revealEls = $$('.reveal, .reveal-media, .split-words');
  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Model hero zoom-out on load ---------- */
  var heroModel = $('.hero--model');
  if (heroModel) {
    var himg = $('img', heroModel);
    var done = function () { requestAnimationFrame(function () { heroModel.classList.add('is-loaded'); }); };
    if (himg && !himg.complete) himg.addEventListener('load', done); else done();
  }

  /* ---------- Manifesto: words light up with scroll ---------- */
  $$('.manifesto__text').forEach(function (el) {
    var text = el.textContent.trim();
    el.setAttribute('aria-label', text);
    el.textContent = '';
    text.split(/\s+/).forEach(function (w) {
      var s = document.createElement('span'); s.className = 'word'; s.textContent = w;
      el.appendChild(s); el.appendChild(document.createTextNode(' '));
    });
    $$('.word', el).forEach(function (w) { w.setAttribute('aria-hidden', 'true'); });
    if (reduced) return;
    var words = $$('.word', el);
    function update() {
      var r = el.getBoundingClientRect();
      var vh = window.innerHeight;
      var p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height + vh * 0.35)));
      var lit = Math.round(p * words.length);
      words.forEach(function (w, i) { w.classList.toggle('is-lit', i < lit); });
    }
    window.addEventListener('scroll', function () { requestAnimationFrame(update); }, { passive: true });
    update();
  });

  /* ---------- Counters ---------- */
  function fmt(n, dec, sep) {
    var s = n.toFixed(dec);
    if (sep) s = s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return s;
  }
  var counters = $$('[data-count]');
  if ('IntersectionObserver' in window && !reduced) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target; cio.unobserve(el);
        var target = parseFloat(el.getAttribute('data-count'));
        var dec = (el.getAttribute('data-count').split('.')[1] || '').length;
        var sep = target >= 1000;
        var t0 = performance.now(), dur = 1600;
        (function tick(t) {
          var k = Math.min(1, (t - t0) / dur); k = 1 - Math.pow(1 - k, 4);
          el.textContent = fmt(target * k, dec, sep);
          if (k < 1) requestAnimationFrame(tick);
        })(t0);
      });
    }, { threshold: 0.4 });
    counters.forEach(function (c) { c.textContent = '0'; cio.observe(c); });
  }

  /* ---------- Videos: autoplay muted, pause off-screen, art-directed source ---------- */
  function pickSource(v) {
    var portrait = v.getAttribute('data-src-portrait');
    var land = v.getAttribute('data-src');
    var usePortrait = portrait && window.matchMedia('(max-aspect-ratio: 4/5)').matches;
    var src = usePortrait ? portrait : land;
    // A measured slow downlink gets the lighter cut of the same film.
    var c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    var liteSrc = v.getAttribute(usePortrait ? 'data-src-portrait-lite' : 'data-src-lite');
    if (liteSrc && c && ((c.downlink && c.downlink < 5) || /(^|-)(2g|3g)$/.test(c.effectiveType || ''))) src = liteSrc;
    if (usePortrait && v.getAttribute('data-poster-portrait')) v.poster = v.getAttribute('data-poster-portrait');
    if (src && v.getAttribute('src') !== src) { v.src = src; }
  }
  var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  var slow = !!conn && (conn.saveData || /(^|-)(2g|3g)$/.test(conn.effectiveType || ''));
  var vids = $$('video[data-src]');
  vids.forEach(function (v) {
    v.muted = true; v.setAttribute('muted', ''); v.playsInline = true; v.preload = 'none';
    var pp = v.getAttribute('data-poster-portrait');
    if (pp && window.matchMedia('(max-aspect-ratio: 4/5)').matches) v.poster = pp;
    // Reduced motion, data saver or a slow network: the poster stays, the film waits for a tap.
    if (reduced || slow) v.dataset.userPaused = '1';
  });
  if ('IntersectionObserver' in window) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var v = en.target;
        if (v.dataset.userPaused === '1') return;
        if (en.isIntersecting) { if (!v.getAttribute('src')) pickSource(v); var p = v.play(); p && p.catch && p.catch(function () {}); } else { v.pause(); }
      });
    }, { threshold: 0.15 });
    vids.forEach(function (v) { vio.observe(v); });
  }
  $$('[data-video-toggle]').forEach(function (btn) {
    var v = document.getElementById(btn.getAttribute('data-for'));
    if (!v) return;
    function sync() {
      var paused = v.paused;
      btn.classList.toggle('is-paused', paused);
      btn.setAttribute('aria-label', paused ? 'Play video' : 'Pause video');
      var l = $('.lbl', btn); if (l) l.textContent = paused ? 'Play' : 'Pause';
    }
    btn.addEventListener('click', function () {
      if (v.paused) { v.dataset.userPaused = '0'; if (!v.getAttribute('src')) pickSource(v); v.play(); } else { v.dataset.userPaused = '1'; v.pause(); }
    });
    v.addEventListener('play', sync); v.addEventListener('pause', sync); sync();
  });

  /* ---------- Range carousel ---------- */
  $$('[data-range]').forEach(function (root) {
    var track = $('.range__track', root);
    var cards = $$('.model-card', track);
    var prev = $('.prev', root), next = $('.next', root), count = $('.range__count', root), bar = $('.range__bar i', root);
    function idx() {
      var l = track.scrollLeft, best = 0, bd = 1e9;
      if (l + track.clientWidth >= track.scrollWidth - 4) return cards.length - 1;
      cards.forEach(function (c, i) { var dd = Math.abs(c.offsetLeft - cards[0].offsetLeft - l); if (dd < bd) { bd = dd; best = i; } });
      return best;
    }
    function upd() {
      var i = idx();
      if (count) count.textContent = String(i + 1).padStart(2, '0') + ' / ' + String(cards.length).padStart(2, '0');
      if (bar) { bar.style.width = (100 / cards.length) + '%'; bar.style.transform = 'translateX(' + (i * 100) + '%)'; }
      if (prev) prev.disabled = i === 0;
      if (next) next.disabled = i === cards.length - 1;
    }
    function go(d) { var i = Math.max(0, Math.min(cards.length - 1, idx() + d)); track.scrollTo({ left: cards[i].offsetLeft - cards[0].offsetLeft, behavior: reduced ? 'auto' : 'smooth' }); }
    prev && prev.addEventListener('click', function () { go(-1); });
    next && next.addEventListener('click', function () { go(1); });
    track.addEventListener('scroll', function () { requestAnimationFrame(upd); }, { passive: true });
    track.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { e.preventDefault(); go(1); } if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); } });
    // drag to scroll on desktop
    var down = false, sx = 0, sl = 0, moved = false;
    track.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl = track.scrollLeft; track.style.scrollSnapType = 'none'; });
    window.addEventListener('pointermove', function (e) { if (!down) return; var dx = e.clientX - sx; if (Math.abs(dx) > 5) moved = true; track.scrollLeft = sl - dx; });
    window.addEventListener('pointerup', function () { if (!down) return; down = false; track.style.scrollSnapType = ''; if (moved) { var i = idx(); track.scrollTo({ left: cards[i].offsetLeft - cards[0].offsetLeft, behavior: 'smooth' }); } });
    track.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
    upd();
  });

  /* ---------- Sub-nav scrollspy + reading progress ---------- */
  if (subnav) {
    var links = $$('.subnav__links a', subnav);
    var targets = links.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); }).filter(Boolean);
    var prog = $('.progress', subnav);
    function spy() {
      var y = window.scrollY + window.innerHeight * 0.3, cur = -1;
      targets.forEach(function (t, i) { if (t.offsetTop <= y) cur = i; });
      links.forEach(function (a, i) {
        var on = i === cur; a.classList.toggle('is-active', on);
        if (on) { a.setAttribute('aria-current', 'true'); } else { a.removeAttribute('aria-current'); }
      });
      if (cur === -1 && links[0]) { links[0].parentNode.scrollLeft = 0; }
      if (cur > -1) { var al = links[cur]; var wrap = al.parentNode; var off = al.offsetLeft - wrap.clientWidth / 2 + al.clientWidth / 2; if (Math.abs(wrap.scrollLeft - off) > 40) wrap.scrollTo({ left: off, behavior: 'smooth' }); }
      if (prog) { var h = document.documentElement.scrollHeight - window.innerHeight; prog.style.transform = 'scaleX(' + (window.scrollY / h) + ')'; }
    }
    window.addEventListener('scroll', function () { requestAnimationFrame(spy); }, { passive: true });
    spy();
  }

  /* ---------- Subtle vertical drift on detail figures (whole figure moves, never cropped) ---------- */
  var drift = $$('[data-drift]');
  if (drift.length && !reduced && window.matchMedia('(min-width: 900px)').matches) {
    function d() {
      var vh = window.innerHeight;
      drift.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        var k = parseFloat(el.getAttribute('data-drift')) || 0.08;
        var c = (r.top + r.height / 2 - vh / 2);
        el.style.transform = 'translate3d(0,' + (-c * k).toFixed(1) + 'px,0)';
      });
    }
    window.addEventListener('scroll', function () { requestAnimationFrame(d); }, { passive: true });
    d();
  }

  /* ---------- Tabs ---------- */
  $$('[role="tablist"]').forEach(function (list) {
    var tabs = $$('[role="tab"]', list);
    function sel(t, focus) {
      tabs.forEach(function (x) {
        var on = x === t; x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1;
        var p = document.getElementById(x.getAttribute('aria-controls')); if (p) p.hidden = !on;
      });
      if (focus) t.focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { sel(t); });
      t.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') sel(tabs[(i + 1) % tabs.length], true);
        if (e.key === 'ArrowLeft') sel(tabs[(i - 1 + tabs.length) % tabs.length], true);
      });
    });
  });

  /* ---------- Finish chips: swap image ---------- */
  $$('[data-chips]').forEach(function (root) {
    var target = document.getElementById(root.getAttribute('data-chips'));
    var label = document.getElementById(root.getAttribute('data-chips') + '-label');
    $$('.chip', root).forEach(function (c) {
      c.addEventListener('click', function () {
        $$('.chip', root).forEach(function (x) { x.setAttribute('aria-pressed', String(x === c)); });
        if (target) {
          target.style.opacity = '0';
          setTimeout(function () {
            target.srcset = c.getAttribute('data-srcset'); target.src = c.getAttribute('data-src'); target.alt = c.getAttribute('data-alt');
            target.onload = function () { target.style.opacity = '1'; };
            setTimeout(function () { target.style.opacity = '1'; }, 400);
          }, 200);
        }
        if (label) label.textContent = c.getAttribute('data-label');
      });
    });
  });

  /* ---------- Lightbox ---------- */
  var lb = $('#lightbox');
  if (lb && lb.showModal) {
    var lbImg = $('img', lb), lbCap = $('.lightbox__cap', lb), lbCount = $('.lightbox__count', lb);
    var group = [], gi = 0, opener = null;
    function show(i) {
      gi = (i + group.length) % group.length;
      var el = group[gi];
      lbImg.removeAttribute('srcset');
      lbImg.src = el.getAttribute('data-full');
      lbImg.alt = el.getAttribute('data-alt') || '';
      lbCap.textContent = el.getAttribute('data-caption') || '';
      lbCount.textContent = String(gi + 1).padStart(2, '0') + ' / ' + String(group.length).padStart(2, '0');
    }
    $$('[data-lightbox]').forEach(function (el) {
      el.addEventListener('click', function () {
        var g = el.getAttribute('data-lightbox');
        group = $$('[data-lightbox="' + g + '"]').filter(function (x) { return !x.closest('[hidden]'); });
        opener = el; lb.showModal(); show(group.indexOf(el));
      });
    });
    $('.lightbox__close', lb).addEventListener('click', function () { lb.close(); });
    $('.lightbox__prev', lb).addEventListener('click', function () { show(gi - 1); });
    $('.lightbox__next', lb).addEventListener('click', function () { show(gi + 1); });
    lb.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') show(gi + 1); if (e.key === 'ArrowLeft') show(gi - 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
    lb.addEventListener('close', function () { opener && opener.focus(); });
    var tx = 0;
    lb.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) { var dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 50) show(gi + (dx < 0 ? 1 : -1)); });
  }

  /* ---------- Brochure viewer (native browser PDF viewer) ---------- */
  var viewer = $('#viewer');
  var mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.matchMedia('(max-width: 760px)').matches;
  $$('[data-view-pdf]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      var url = btn.getAttribute('href');
      if (!viewer || !viewer.showModal || mobile) return; // phones: open the PDF directly in a new tab
      e.preventDefault();
      $('iframe', viewer).src = url + '#view=FitH';
      $('.viewer__title', viewer).textContent = btn.getAttribute('data-title') || 'Brochure';
      $('[data-viewer-download]', viewer).href = url;
      viewer.showModal();
    });
  });
  if (viewer) {
    $('[data-viewer-close]', viewer).addEventListener('click', function () { viewer.close(); });
    viewer.addEventListener('close', function () { $('iframe', viewer).src = 'about:blank'; });
  }

  /* ---------- Commission filters ---------- */
  $$('[data-filter-group]').forEach(function (root) {
    var items = $$('[data-model]', document.getElementById(root.getAttribute('data-filter-group')));
    $$('button', root).forEach(function (b) {
      b.addEventListener('click', function () {
        $$('button', root).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        var f = b.getAttribute('data-filter');
        items.forEach(function (it) { it.hidden = !(f === 'all' || it.getAttribute('data-model') === f); });
      });
    });
  });

  /* ---------- Contact form → e-mail (no backend required) ---------- */
  var form = $('#enquiry');
  if (form) {
    var params = new URLSearchParams(location.search);
    var m = params.get('model'), t = params.get('topic');
    if (m && form.model) form.model.value = m;
    if (t && form.topic) form.topic.value = t;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form.website && form.website.value) return; // honeypot: filled only by bots
      if (!form.reportValidity()) return;
      var to = (CFG.contact && CFG.contact.email) || 'info@totemautomobili.com';
      var subj = 'Enquiry · ' + form.topic.value + (form.model.value ? ' · ' + form.model.value : '');
      var body = [
        'Name: ' + form.name.value,
        'E-mail: ' + form.email.value,
        'Phone: ' + (form.phone.value || '-'),
        'Country: ' + (form.country.value || '-'),
        'Model: ' + (form.model.value || '-'),
        'Topic: ' + form.topic.value,
        'Privacy Policy read: yes',
        'News and invitations: ' + (form.marketing && form.marketing.checked ? 'yes, consent given' : 'no'),
        '',
        form.message.value
      ].join('\n');
      if (CFG.formEndpoint) {
        fetch(CFG.formEndpoint, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
          .then(function (r) { $('#form-status').textContent = r.ok ? 'Thank you. The atelier will be in touch shortly.' : 'Something went wrong, please write to ' + to + '.'; })
          .catch(function () { $('#form-status').textContent = 'Something went wrong, please write to ' + to + '.'; });
        return;
      }
      location.href = 'mailto:' + to + '?subject=' + encodeURIComponent(subj) + '&body=' + encodeURIComponent(body);
      $('#form-status').textContent = 'Your e-mail application has opened with the enquiry ready to send.';
    });
  }

  /* ---------- Year ---------- */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
