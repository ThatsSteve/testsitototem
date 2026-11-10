/* Opening curtain: shown only when arriving from outside the site. No storage is used. */
(function () {
  var el = document.querySelector('.intro');
  if (!el) return;
  var internal = document.referrer && document.referrer.indexOf(location.origin) === 0;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (internal || reduced || location.hash) { el.parentNode.removeChild(el); return; }
  el.addEventListener('animationend', function (e) { if (e.animationName === 'intro-out' && el.parentNode) el.parentNode.removeChild(el); });
})();
