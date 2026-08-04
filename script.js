// ============================================================
// Lead With Real - shared behaviour
// ============================================================

// ---------- Theme toggle ----------
(function () {
  const root = document.documentElement;
  const stored = localStorage.getItem('lwr-theme');
  // Default to dark on first visit, regardless of system preference.
  // A saved manual choice (from the toggle) always wins after that.
  const initial = stored || 'dark';
  root.setAttribute('data-theme', initial);

  document.addEventListener('DOMContentLoaded', function () {
    const toggles = document.querySelectorAll('.theme-toggle');
    function updateIcon() {
      const isDark = root.getAttribute('data-theme') === 'dark';
      toggles.forEach(function (btn) {
        btn.innerHTML = isDark
          ? '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path></svg>'
          : '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
      });
    }
    updateIcon();
    toggles.forEach(function (btn) {
      btn.addEventListener('click', function () {
        const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        localStorage.setItem('lwr-theme', next);
        updateIcon();
      });
    });
  });
})();

// ---------- Stat carousel ----------
document.addEventListener('DOMContentLoaded', function () {
  const slides = document.querySelectorAll('.stat-slide');
  const dots = document.querySelectorAll('.carousel-dots span');
  if (!slides.length) return;
  let i = 0;
  setInterval(function () {
    slides[i].classList.remove('active');
    dots[i] && dots[i].classList.remove('active');
    i = (i + 1) % slides.length;
    slides[i].classList.add('active');
    dots[i] && dots[i].classList.add('active');
  }, 1500);
});

// ---------- Newsletter chip select ----------
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.chip-row').forEach(function (row) {
    row.querySelectorAll('.chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        row.querySelectorAll('.chip').forEach(function (c) { c.classList.remove('selected'); });
        chip.classList.add('selected');
      });
    });
  });
});

// ---------- Cal.com CTAs ----------
// NOTE: We deliberately do NOT use Cal.com's popup/modal embed. Their own
// embed-core package documents that "opening an embed, closing it, and then
// opening another embed isn't supported yet" - this is a real, acknowledged
// limitation in Cal's library, not something fixable from our side, and it's
// what caused the double-close / stuck-scroll bug. Plain navigation to the
// real Cal.com booking page has none of that state to manage - nothing to
// get stuck, nothing to close twice. Every [data-cal-link] button already
// has a real href, so this requires no JS at all: they just work as normal
// links.
