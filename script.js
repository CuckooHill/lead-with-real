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
// ---------- Scroll reveal ----------
document.addEventListener('DOMContentLoaded', function () {
  const items = document.querySelectorAll('.reveal');
  if (!items.length) return;
  if (!('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('in-view'); });
    return;
  }
  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  items.forEach(function (el) { observer.observe(el); });
});

// ---------- Lead capture modal ----------
// SETUP REQUIRED before this goes live:
// 1. Create a Google Form with these fields, in this order:
//    Name (short answer), Email (short answer), Phone (short answer),
//    Platform (short answer), Link (short answer), Plan (short answer)
// 2. Open the live form, click the three dots > "Get pre-filled link",
//    fill in dummy values, click "Get link", then open that link and look
//    at the URL - each field will appear as entry.XXXXXXXXX=value.
// 3. Copy each entry.XXXXXXXXX id into the matching input's `name`
//    attribute in the hidden #lwrGoogleForm in index.html, and replace
//    REPLACE_WITH_YOUR_FORM_ID in the form's `action` with your form's ID
//    (the long string in the form's edit URL, before /edit).
// 4. In Google Forms, go to Responses > the green Sheets icon to link a
//    Sheet - the Plan column will show which of the 3 CTAs was used.
document.addEventListener('DOMContentLoaded', function () {
  const overlay = document.getElementById('lwrModalOverlay');
  const closeBtn = document.getElementById('lwrModalClose');
  const planLabel = document.getElementById('lwrModalPlan');
  const leadForm = document.getElementById('lwrLeadForm');
  const errorMsg = document.getElementById('lwrModalError');
  const googleForm = document.getElementById('lwrGoogleForm');
  const hiddenIframe = document.getElementById('lwr_hidden_iframe');
  const triggers = document.querySelectorAll('[data-plan-trigger]');

  if (!overlay || !triggers.length) return;

  const CAL_LINKS = {
    'power-hour': 'https://cal.com/lead-with-real/intro-call-power-hour',
    'masterclass': 'https://cal.com/lead-with-real/intro-call-masterclass',
    'retainer': 'https://cal.com/lead-with-real/intro-call-retainer',
    'intro': 'https://cal.com/lead-with-real/intro-call'
  };
  let activePlan = null;
  let activePlanName = '';

  function openModal(plan, planName) {
    activePlan = plan;
    activePlanName = planName;
    planLabel.textContent = planName;
    errorMsg.hidden = true;
    leadForm.reset();
    document.querySelectorAll('.lwr-radio-link').forEach(function (i) { i.disabled = true; i.value = ''; });
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    document.getElementById('lwrName').focus();
  }
  function closeModal() {
    overlay.hidden = true;
    document.body.style.overflow = '';
  }

  triggers.forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      openModal(btn.getAttribute('data-plan-trigger'), btn.getAttribute('data-plan-name') || '');
    });
  });
  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', function (e) { if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !overlay.hidden) closeModal(); });

  // Each checkbox now sits inside a platform group (LinkedIn / Instagram /
  // Other), each with two sub-options (Personal / Brand) sharing one link
  // field. The link field enables as soon as either sub-option in that
  // group is checked, and disables (clearing itself) only once both are
  // unchecked.
  leadForm.querySelectorAll('.lwr-platform-cb').forEach(function (cb) {
    cb.addEventListener('change', function () {
      const group = cb.closest('.lwr-platform-group');
      const linkInput = group.querySelector('.lwr-radio-link');
      const anyChecked = group.querySelectorAll('.lwr-platform-cb:checked').length > 0;
      linkInput.disabled = !anyChecked;
      if (anyChecked) {
        linkInput.focus();
      } else {
        linkInput.value = '';
      }
    });
  });

  leadForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const name = document.getElementById('lwrName').value.trim();
    const email = document.getElementById('lwrEmail').value.trim();
    const phone = document.getElementById('lwrPhone').value.trim();
    const checkedPlatforms = Array.from(leadForm.querySelectorAll('input[name="platform"]:checked'));

    if (!name || !email || checkedPlatforms.length === 0) {
      errorMsg.hidden = false;
      return;
    }
    errorMsg.hidden = true;

    // Multiple platforms can now be selected - combine them into the two
    // Sheet columns as "Platform: link" pairs, joined together, so nothing
    // is lost even though the Sheet only has one Platform and one Link
    // column each. Link is read from the shared field for that platform
    // group, since Personal and Brand checkboxes now share one link box.
    const pairs = checkedPlatforms.map(function (cb) {
      const group = cb.closest('.lwr-platform-group');
      const linkField = group ? group.querySelector('.lwr-radio-link') : null;
      const linkVal = linkField ? linkField.value.trim() : '';
      return { platform: cb.value, link: linkVal };
    });
    const platform = pairs.map(function (p) { return p.platform; }).join(', ');
    const link = pairs.map(function (p) { return p.platform + ': ' + (p.link || '-'); }).join(' | ');

    // Fill the hidden Google Form (field order matches the SETUP note above)
    const gInputs = googleForm.querySelectorAll('input');
    gInputs[0].value = name;
    gInputs[1].value = email;
    gInputs[2].value = phone;
    gInputs[3].value = platform;
    gInputs[4].value = link;
    gInputs[5].value = activePlanName;

    // Once the hidden iframe finishes loading the response, the Google
    // submission has gone through - only then send the user on to Cal.com.
    // A short fallback timer guarantees this always completes even if the
    // iframe's load event is delayed or doesn't fire (e.g. before the real
    // Google Form ID below is wired up) - the modal can never get stuck.
    let advanced = false;
    function goToCal() {
      if (advanced) return;
      advanced = true;
      closeModal();
      const dest = CAL_LINKS[activePlan];
      if (dest) window.open(dest, '_blank', 'noopener');
    }
    hiddenIframe.addEventListener('load', function onLoad() {
      hiddenIframe.removeEventListener('load', onLoad);
      goToCal();
    });
    googleForm.submit();
    setTimeout(goToCal, 2500);
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
