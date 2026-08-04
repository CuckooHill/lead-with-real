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

// ---------- Cal.com popup embed ----------
window.calEmbedReady = false;
window.calEmbedFailed = false;

(function (C, A, L) {
  let p = function (a, ar) { a.q.push(ar); };
  let d = C.document;
  C.Cal = C.Cal || function () {
    let cal = C.Cal;
    let ar = arguments;
    if (!cal.loaded) {
      cal.ns = {};
      cal.q = cal.q || [];
      const script = d.createElement('script');
      script.src = A;
      // These are the ONLY reliable signals that the embed actually works:
      // onload = script downloaded and ran; onerror = blocked (ad-blocker,
      // network failure, CSP, etc). Everything below keys off these, not
      // off arbitrary timers.
      script.onload = function () { window.calEmbedReady = true; };
      script.onerror = function () { window.calEmbedFailed = true; };
      d.head.appendChild(script);
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
  window.calModalActive = false;

  // Watches for the Cal iframe leaving the DOM (modal closed) and, once it
  // does, clears our own "modal open" flag AND force-restores page scroll.
  // This is the actual fix for the double-close bug: if two modal instances
  // ever got stacked, the page's scroll lock would only release after BOTH
  // closed. Restoring scroll ourselves, independent of Cal's own internal
  // state, guarantees the page is always usable the moment nothing Cal-
  // related is left in the DOM - no dependence on Cal closing cleanly.
  function watchForClose() {
    let checks = 0;
    const poll = setInterval(function () {
      checks++;
      const stillOpen = document.querySelector('iframe[src*="cal.com"]');
      if (!stillOpen || checks > 200) { // hard cap: ~60s, never hang forever
        clearInterval(poll);
        window.calModalActive = false;
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
        document.body.style.position = '';
      }
    }, 300);
  }

  document.querySelectorAll('[data-cal-link]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      const calLink = el.getAttribute('data-cal-link');
      const realUrl = el.getAttribute('href');

      // A modal is already open or mid-open from a previous click (possibly
      // on a different button). Cal.com stacks a second instance rather
      // than replacing the first if called again here, which is exactly
      // what caused "needs closing twice". Block it outright instead -
      // the user should finish with the modal that's already up.
      if (window.calModalActive) {
        e.preventDefault();
        return;
      }

      function openModal() {
        try {
          window.calModalActive = true;
          Cal('modal', { calLink: calLink, config: { layout: 'month_view' } });
          watchForClose();
        } catch (err) {
          window.calModalActive = false;
          window.location.href = realUrl;
        }
      }

      // Already confirmed blocked (ad-blocker etc) - don't fight it a
      // second time, just let this click through as a normal link.
      if (window.calEmbedFailed) return;

      // Already confirmed working - open instantly, no delay at all.
      if (window.calEmbedReady) {
        e.preventDefault();
        openModal();
        return;
      }

      // Script hasn't confirmed ready or failed yet. This window is
      // normally a couple hundred ms at most (embed.js starts downloading
      // the moment the page loads, well before any click is possible).
      // Wait briefly; if it doesn't resolve, fall through to a REAL
      // same-tab navigation - never an async window.open(), since browsers
      // (especially mobile) block popups that aren't a direct, synchronous
      // response to the click. window.location.href has no such
      // restriction, so this fallback always works.
      e.preventDefault();
      if (el.dataset.calWaiting) return; // already waiting on this button
      el.dataset.calWaiting = '1';
      const originalText = el.textContent;
      el.textContent = 'Loading…';
      el.style.opacity = '0.7';

      let waited = 0;
      const check = setInterval(function () {
        waited += 100;
        if (window.calEmbedReady) {
          clearInterval(check);
          el.textContent = originalText;
          el.style.opacity = '';
          delete el.dataset.calWaiting;
          openModal();
        } else if (window.calEmbedFailed || waited >= 1800) {
          clearInterval(check);
          el.textContent = originalText;
          el.style.opacity = '';
          delete el.dataset.calWaiting;
          window.location.href = realUrl;
        }
      }, 100);
    });
  });
});
