/**
 * DH TISSU — Premium Interactions
 */

(function () {
  'use strict';

  /* ── Preloader ── */
  const preloader = document.getElementById('preloader');
  const hidePreloader = () => {
    if (preloader) preloader.classList.add('hidden');
  };
  window.addEventListener('load', () => setTimeout(hidePreloader, 800));
  setTimeout(hidePreloader, 3000);

  /* ── Header scroll ── */
  const header = document.getElementById('header');
  const handleScroll = () => {
    if (header) header.classList.toggle('scrolled', window.scrollY > 60);
  };
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  /* ── Mobile nav ── */
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');
  const navContainer = document.querySelector('.nav.container');
  const mobileNavMq = window.matchMedia('(max-width: 1024px)');

  let navBackdrop = document.querySelector('.nav__backdrop');
  if (!navBackdrop) {
    navBackdrop = document.createElement('div');
    navBackdrop.className = 'nav__backdrop';
    navBackdrop.setAttribute('aria-hidden', 'true');
    document.body.appendChild(navBackdrop);
  }

  const closeMobileNav = () => {
    if (!navMenu || !navToggle) return;
    navMenu.classList.remove('active');
    navToggle.classList.remove('active');
    navToggle.setAttribute('aria-expanded', 'false');
    navMenu.setAttribute('aria-hidden', 'true');
    navBackdrop.classList.remove('visible');
    navBackdrop.setAttribute('aria-hidden', 'true');
    if (header) header.classList.remove('nav-open');
    document.body.classList.remove('nav-open');
    document.body.style.overflow = '';
  };

  const syncNavPlacement = () => {
    if (!navMenu || !navContainer) return;
    if (mobileNavMq.matches) {
      if (navMenu.parentElement !== document.body) document.body.appendChild(navMenu);
    } else if (navMenu.parentElement !== navContainer) {
      navContainer.appendChild(navMenu);
      closeMobileNav();
    }
  };

  if (navToggle && navMenu) {
    navMenu.setAttribute('aria-hidden', 'true');
    syncNavPlacement();
    mobileNavMq.addEventListener('change', syncNavPlacement);

    navToggle.addEventListener('click', () => {
      syncNavPlacement();
      const isOpen = navMenu.classList.toggle('active');
      navToggle.classList.toggle('active', isOpen);
      navToggle.setAttribute('aria-expanded', isOpen);
      navMenu.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
      navBackdrop.classList.toggle('visible', isOpen);
      navBackdrop.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
      if (header) header.classList.toggle('nav-open', isOpen);
      document.body.classList.toggle('nav-open', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    navMenu.querySelectorAll('.nav__link').forEach(link => {
      link.addEventListener('click', closeMobileNav);
    });

    navBackdrop.addEventListener('click', closeMobileNav);

    window.addEventListener('resize', () => {
      syncNavPlacement();
      if (window.innerWidth > 1024) closeMobileNav();
    }, { passive: true });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMobileNav();
    });
  }

  /* ── Scroll reveal ── */
  const revealElements = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => entry.target.classList.add('visible'), i * 80);
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );
  revealElements.forEach(el => revealObserver.observe(el));

  /* ── Hero video ── */
  function autoplayHeroVideo(video) {
    if (!video) return;
    video.play().catch(() => {
      document.addEventListener('click', () => video.play(), { once: true });
    });
  }

  autoplayHeroVideo(document.getElementById('heroVideo'));
  autoplayHeroVideo(document.getElementById('catalogHeroVideo'));

  /* ── Hero slideshow (legacy slides) ── */
  const slides = document.querySelectorAll('.hero__slide');
  let currentSlide = 0;

  if (slides.length > 1) {
    setInterval(() => {
      slides[currentSlide].classList.remove('hero__slide--active');
      currentSlide = (currentSlide + 1) % slides.length;
      slides[currentSlide].classList.add('hero__slide--active');
    }, 6000);
  }

  /* ── Testimonials slider ── */
  const track = document.getElementById('testimonialsTrack');
  const prevBtn = document.getElementById('testimonialPrev');
  const nextBtn = document.getElementById('testimonialNext');
  const dotsContainer = document.getElementById('testimonialsDots');

  if (track && prevBtn && nextBtn && dotsContainer) {
  const testimonials = track.querySelectorAll('.testimonial');
  let currentTestimonial = 0;

  testimonials.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.classList.add('testimonials__dot');
    dot.setAttribute('aria-label', `Témoignage ${i + 1}`);
    if (i === 0) dot.classList.add('active');
    dot.addEventListener('click', () => goToTestimonial(i));
    dotsContainer.appendChild(dot);
  });

  const dots = dotsContainer.querySelectorAll('.testimonials__dot');

  function goToTestimonial(index) {
    currentTestimonial = index;
    track.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === index));
  }

  prevBtn.addEventListener('click', () => {
    goToTestimonial((currentTestimonial - 1 + testimonials.length) % testimonials.length);
  });

  nextBtn.addEventListener('click', () => {
    goToTestimonial((currentTestimonial + 1) % testimonials.length);
  });

  let testimonialAuto = setInterval(() => {
    goToTestimonial((currentTestimonial + 1) % testimonials.length);
  }, 7000);

  [prevBtn, nextBtn, dotsContainer].forEach(el => {
    el.addEventListener('mouseenter', () => clearInterval(testimonialAuto));
    el.addEventListener('mouseleave', () => {
      testimonialAuto = setInterval(() => {
        goToTestimonial((currentTestimonial + 1) % testimonials.length);
      }, 7000);
    });
  });
  }

  /* ── Appointment form ── */
  const form = document.getElementById('appointmentForm');
  const modal = document.getElementById('successModal');
  const modalClose = document.getElementById('modalClose');

  if (form && modal && modalClose) form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = form.name.value.trim();
    const phone = form.phone.value.trim();
    const project = form.project.value;

    if (!name || !phone || !project) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    const projectLabels = {
      mariage: 'Mariage',
      caftan: 'Caftan',
      soiree: 'Soirée',
      styliste: 'Styliste / Créateur',
      autre: 'Autre projet'
    };

    const whatsappMessage = encodeURIComponent(
      `Bonjour DH TISSU,\n\n` +
      `Nom: ${name}\n` +
      `Téléphone: ${phone}\n` +
      `Projet: ${projectLabels[project] || project}\n` +
      `Message: ${form.message.value.trim() || '—'}`
    );

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Envoi en cours…';
    }

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: name,
          phone,
          project_type: project,
          message: form.message.value.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Envoi impossible');
    } catch (err) {
      alert(err.message || 'Impossible d\'envoyer votre demande. Réessayez ou contactez-nous sur WhatsApp.');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Envoyer ma Demande';
      }
      return;
    }

    if (typeof fbq === 'function') fbq('track', 'Lead');
    if (typeof gtag === 'function') gtag('event', 'generate_lead', { event_category: 'appointment' });

    form.reset();
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Envoyer ma Demande';
    }

    const waLink = modal.querySelector('a[href*="wa.me"]');
    const waNum = window.DH_WHATSAPP?.getNumber?.() || '212600000000';
    if (waLink) waLink.href = `https://wa.me/${waNum}?text=${whatsappMessage}`;
  });

  if (modal && modalClose) {
  function closeModal() {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
  }

  modalClose.addEventListener('click', closeModal);
  modal.querySelector('.modal__backdrop').addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
  });
  }

  /* ── Smooth anchor offset for fixed header ── */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (!target) return;
      e.preventDefault();
      const offset = (header?.offsetHeight || 80) + 20;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: top, behavior: 'smooth' });
    });
  });

  /* ── Collection card parallax light on mouse ── */
  document.querySelectorAll('.collection-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const shine = card.querySelector('.collection-card__shine');
      if (shine) {
        shine.style.transform = `translateX(${x - 50}%)`;
        shine.style.opacity = '0.3';
      }
    });
    card.addEventListener('mouseleave', () => {
      const shine = card.querySelector('.collection-card__shine');
      if (shine) {
        shine.style.transform = 'translateX(-100%)';
        shine.style.opacity = '';
      }
    });
  });

})();
