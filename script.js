// ============================================================
// Lead With Real - shared behaviour
// ============================================================

// ---------- Theme toggle ----------
(function () {
  const root = document.documentElement;
  const stored = localStorage.getItem('lwr-theme');
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initial = stored || (systemDark ? 'dark' : 'light');
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

// ---------- Cal.com popup embed ----------
(function (C, A, L) {
  let p = function (a, ar) { a.q.push(ar); };
  let d = C.document;
  C.Cal = C.Cal || function () {
    let cal = C.Cal;
    let ar = arguments;
    if (!cal.loaded) {
      cal.ns = {};
      cal.q = cal.q || [];
      d.head.appendChild(d.createElement('script')).src = A;
      cal.loaded = true;
    }
    if (ar[0] === L) {
      const api = function () { p(api, arguments); };
      const namespace = ar[1];
      api.q = api.q || [];
      if (typeof namespace === 'string') {
        cal.ns[namespace] = cal.ns[namespace] || api;
        p(cal.ns[namespace], ar);
        p(cal, ['initNamespace', namespace]);
      } else p(cal, ar);
      return;
    }
    p(cal, ar);
  };
})(window, 'https://app.cal.com/embed/embed.js', 'init');

Cal('init', { origin: 'https://cal.com' });
Cal('ui', {
  styles: { branding: { brandColor: '#1F3A2E' } },
  hideEventTypeDetails: false,
  layout: 'month_view'
});

document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('[data-cal-link]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      if (el.dataset.calBusy) return;
      el.dataset.calBusy = '1';

      const originalText = el.textContent;
      el.textContent = 'Loading…';
      el.style.opacity = '0.7';

      Cal('modal', {
        calLink: el.getAttribute('data-cal-link'),
        config: { layout: 'month_view' }
      });

      // Restore button once the embed has visibly opened.
      const restore = function () {
        el.textContent = originalText;
        el.style.opacity = '';
        delete el.dataset.calBusy;
      };

      // Poll briefly for the Cal iframe; if it never appears (slow network,
      // ad-blocker, embed failure), fall back to opening the real booking
      // page directly rather than leaving the button stuck.
      let attempts = 0;
      const poll = setInterval(function () {
        attempts++;
        const opened = document.querySelector('iframe[src*="cal.com"]');
        if (opened) {
          clearInterval(poll);
          restore();
        } else if (attempts >= 14) { // ~3.5s at 250ms
          clearInterval(poll);
          restore();
          window.open(el.getAttribute('href'), '_blank', 'noopener');
        }
      }, 250);
    });
  });
});
