/* =============================================================
   STAR CAR Werkstatt — Scripts
   ============================================================= */

(function () {
  'use strict';

  // ---------- Helpers ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- HARTER FIX: Overlay-Menü zuverlässig schließbar machen ----------
  // Erzwingt, dass das mobile Menü bei [hidden] wirklich verschwindet (überschreibt
  // konkurrierendes CSS) und auf dem Desktop gar nicht erst über der Seite liegt.
  (function injectMenuFix() {
    const css = `
      #navMobile[hidden]{ display:none !important; }
      @media (min-width: 861px){
        #navMobile{ display:none !important; }
        #navToggle{ display:none !important; }
      }
    `;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  })();

  // ---------- Navbar Scroll-Effect ----------
  const navbar = $('#navbar');
  const onScroll = () => {
    if (!navbar) return;
    if (window.scrollY > 30) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---------- Mobile Menu ----------
  const navToggle = $('#navToggle');
  const navMobile = $('#navMobile');

  const closeMenu = () => {
    if (!navMobile) return;
    navMobile.hidden = true;
    if (navToggle) {
      navToggle.classList.remove('active');
      navToggle.setAttribute('aria-expanded', 'false');
    }
    document.body.style.overflow = '';
  };
  const openMenu = () => {
    if (!navMobile) return;
    navMobile.hidden = false;
    if (navToggle) {
      navToggle.classList.add('active');
      navToggle.setAttribute('aria-expanded', 'true');
    }
  };

  // Beim Laden IMMER geschlossen starten
  if (navMobile) navMobile.hidden = true;

  if (navToggle && navMobile) {
    navToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      if (navMobile.hidden) openMenu(); else closeMenu();
    });

    // Klick auf einen Menüpunkt schließt das Menü
    $$('#navMobile a').forEach(a => a.addEventListener('click', closeMenu));

    // Schließen-Button (X) im Overlay — falls vorhanden (mehrere mögliche IDs/Klassen)
    [$('#navClose'), $('.nav-close'), $('.nav-mobile-close')].forEach(btn => {
      if (btn) btn.addEventListener('click', (e) => { e.stopPropagation(); closeMenu(); });
    });

    // Escape schließt
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

    // Klick auf den dunklen Hintergrund (Overlay selbst) schließt
    navMobile.addEventListener('click', (e) => { if (e.target === navMobile) closeMenu(); });

    // Beim Wechsel auf Desktop-Breite immer schließen
    window.addEventListener('resize', () => {
      if (window.innerWidth >= 861) closeMenu();
    });
  }

  // ---------- WhatsApp Popup ----------
  const waBtn = $('#waBtn');
  const waPopup = $('#waPopup');
  const waClose = $('#waClose');
  const WA_NUMBER = '491771383020';

  const closePopup = () => { if (waPopup) waPopup.hidden = true; };
  const openPopup  = () => { if (waPopup) waPopup.hidden = false; };

  if (waBtn) {
    waBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (waPopup.hidden) openPopup(); else closePopup();
    });
  }
  if (waClose) waClose.addEventListener('click', closePopup);
  document.addEventListener('click', (e) => {
    if (!waPopup || waPopup.hidden) return;
    if (!waPopup.contains(e.target) && e.target !== waBtn) closePopup();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePopup(); });

  $$('.wa-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const msg = encodeURIComponent(chip.dataset.msg || '');
      const url = `https://wa.me/${WA_NUMBER}?text=${msg}`;
      if (window.trackConversion) window.trackConversion('whatsapp_click');
      window.open(url, '_blank', 'noopener');
      closePopup();
    });
  });

  // ---------- Conversion Tracking Hook ----------
  // Trage hier dein Google-Ads-Conversion-Snippet ein.
  window.trackConversion = function (label) {
    // Beispiel (auskommentiert):
    // gtag('event', 'conversion', { 'send_to': 'AW-XXXXXXXXX/YYYYYYYYY', 'event_callback': () => {} });
    // console.log('Conversion:', label);
  };

  // ---------- Smooth Anchor Offset ----------
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length > 1) {
        const target = document.querySelector(id);
        if (target) {
          e.preventDefault();
          const y = target.getBoundingClientRect().top + window.scrollY - 70;
          window.scrollTo({ top: y, behavior: reducedMotion ? 'auto' : 'smooth' });
        }
      }
    });
  });

  // ---------- Termin-Formular (Formspree) ----------
  const terminForm = $('#terminForm');
  const formSuccess = $('#formSuccess');
  const formError = $('#formError');
  if (terminForm) {
    terminForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const action = terminForm.getAttribute('action');
      if (!action || action.includes('FORMSPREE_ID')) {
        alert('Hinweis an Betreiber: Bitte FORMSPREE_ID in index.html durch deine echte Formspree-ID ersetzen.');
        return;
      }
      const submitBtn = terminForm.querySelector('.form-submit');
      const original = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sende…';
      try {
        const res = await fetch(action, {
          method: 'POST',
          body: new FormData(terminForm),
          headers: { 'Accept': 'application/json' }
        });
        if (res.ok) {
          terminForm.querySelectorAll('input, select, textarea, .form-submit, .form-hint, .form-checkbox').forEach(el => el.style.display = 'none');
          formSuccess.hidden = false;
          formSuccess.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
          if (window.trackConversion) window.trackConversion('form_submit');
        } else {
          formError.hidden = false;
          submitBtn.disabled = false;
          submitBtn.textContent = original;
        }
      } catch (err) {
        formError.hidden = false;
        submitBtn.disabled = false;
        submitBtn.textContent = original;
      }
    });
  }

  // ---------- Schnellanfrage (Quick Form, Formspree) ----------
  const quickForm = $('#quickForm');
  const quickSuccess = $('#quickSuccess');
  const quickError = $('#quickError');
  if (quickForm) {
    quickForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const action = quickForm.getAttribute('action');
      if (!action || action.includes('FORMSPREE_ID')) {
        alert('Hinweis an Betreiber: Bitte FORMSPREE_ID in index.html durch deine echte Formspree-ID ersetzen.');
        return;
      }
      const submitBtn = quickForm.querySelector('button[type="submit"]');
      const original = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sende…';
      if (quickError) quickError.hidden = true;
      try {
        const res = await fetch(action, {
          method: 'POST',
          body: new FormData(quickForm),
          headers: { 'Accept': 'application/json' }
        });
        if (res.ok) {
          quickForm.querySelectorAll('input:not([type=hidden]), select, button[type="submit"]').forEach(el => el.style.display = 'none');
          quickSuccess.hidden = false;
          if (window.trackConversion) window.trackConversion('quick_form_submit');
        } else {
          quickError.hidden = false;
          submitBtn.disabled = false;
          submitBtn.textContent = original;
        }
      } catch (err) {
        quickError.hidden = false;
        submitBtn.disabled = false;
        submitBtn.textContent = original;
      }
    });
  }

  // ---------- Reveal on Scroll (IntersectionObserver) ----------
  const revealEls = $$('[data-reveal]');
  if (revealEls.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          const idx = Array.from(entry.target.parentElement?.children || []).indexOf(entry.target);
          entry.target.style.transitionDelay = `${Math.min(idx, 8) * 60}ms`;
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in-view'));
  }

  // ---------- Swiper ----------
  if (typeof Swiper !== 'undefined' && $('.ergebnisse-swiper')) {
    new Swiper('.ergebnisse-swiper', {
      slidesPerView: 'auto',
      spaceBetween: 20,
      centeredSlides: true,
      loop: true,
      grabCursor: true,
      speed: 700,
      autoplay: { delay: 3800, disableOnInteraction: false, pauseOnMouseEnter: true },
      pagination: { el: '.ergebnisse-swiper .swiper-pagination', clickable: true },
      navigation: {
        nextEl: '.ergebnisse-swiper .swiper-button-next',
        prevEl: '.ergebnisse-swiper .swiper-button-prev'
      },
      breakpoints: {
        600: { spaceBetween: 24 },
        1000: { spaceBetween: 28 }
      }
    });
  }

  // ---------- Lightbox ----------
  const lightbox = $('#lightbox');
  if (lightbox) {
    const lbImg = lightbox.querySelector('img');
    const lbClose = lightbox.querySelector('.lightbox-close');
    $$('[data-lightbox]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        lbImg.src = el.dataset.lightbox;
        lbImg.alt = el.querySelector('img')?.alt || '';
        lightbox.hidden = false;
        document.body.style.overflow = 'hidden';
      });
    });
    const closeLb = () => {
      lightbox.hidden = true;
      document.body.style.overflow = '';
      lbImg.src = '';
    };
    lbClose.addEventListener('click', closeLb);
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLb(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !lightbox.hidden) closeLb(); });
  }

  // ---------- Count-Up Preise ----------
  const countEls = $$('[data-count]');
  if (countEls.length && 'IntersectionObserver' in window) {
    const animate = (el) => {
      const target = parseInt(el.dataset.count, 10) || 0;
      const dur = 1100;
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
        el.textContent = Math.round(target * eased).toString();
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = target.toString();
      };
      if (reducedMotion) { el.textContent = target.toString(); return; }
      requestAnimationFrame(tick);
    };
    const cio = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animate(entry.target);
          cio.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    countEls.forEach(el => cio.observe(el));
  }

})();