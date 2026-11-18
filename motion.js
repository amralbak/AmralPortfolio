// Motion for the experiment branch: Lenis smooth scrolling + GSAP ScrollTrigger.
// Note: this plays for every visitor, including those whose system asks for
// reduced motion. Add a reduced-motion fallback before shipping it.
(() => {
  const { gsap, ScrollTrigger, Lenis } = window;
  if (!gsap || !ScrollTrigger || !Lenis) return;
  gsap.registerPlugin(ScrollTrigger);

  const root = document.documentElement;
  const header = document.querySelector('.site-header');
  const headerHeight = () => header.offsetHeight;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  // ---------------------------------------------------------------- Smooth scroll
  const lenis = new Lenis({ lerp: 0.075, wheelMultiplier: 0.9 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
    const target = document.getElementById(link.hash.slice(1));
    if (!target) return;
    event.preventDefault();
    history.pushState(null, '', link.hash);
    lenis.scrollTo(target, { // Lenis already leaves room for the sticky header (scroll-padding-top)
      duration: 1.6,
      easing: easeInOutCubic,
      onComplete: () => {
        // after the section observers have reported, so the clicked section wins
        if (typeof navLinks !== 'undefined' && navLinks.has(target.id)) setTimeout(() => setCurrent(target.id), 150);
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      },
    });
  });

  // ---------------------------------------------------------------------- Landing
  gsap.timeline({
    defaults: { ease: 'expo.out' },
    onComplete: () => root.classList.remove('js-motion'),
  })
    .fromTo('.curtain', { yPercent: 0 }, { yPercent: -101, duration: 1.4, ease: 'expo.inOut' }, 0.2)
    .fromTo('.photo-button', { scale: 1.15 }, { scale: 1, duration: 2.4 }, 0.5)
    .fromTo('.hero h1 .w > span', { y: 0, yPercent: 110 }, { y: 0, yPercent: 0, duration: 1.5, stagger: 0.12 }, 0.95)
    .fromTo(['.hero-role', '.hero-line', '.actions', '.scroll-cue'],
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.3, stagger: 0.12, ease: 'power3.out' }, 1.25)
    .fromTo('.mark', { backgroundSize: '0% 0.36em' },
      { backgroundSize: '100% 0.36em', duration: 1.2, ease: 'power2.inOut' }, 1.8);

  // ------------------------------------------- Hero: layered parallax on scroll
  const hero = document.querySelector('.hero');
  const heroScroll = (end = 'bottom top') => ({
    trigger: hero,
    start: () => `top ${headerHeight()}px`,
    end,
    scrub: true,
  });
  gsap.to('.hero-media', { yPercent: 7, scale: 1.06, ease: 'none', scrollTrigger: heroScroll() });
  gsap.to('.hero-light', { yPercent: 30, ease: 'none', scrollTrigger: heroScroll() });
  gsap.to('.hero-text', { yPercent: -20, opacity: 0, ease: 'none', scrollTrigger: heroScroll('65% top') });
  // The whole hero pulls back into a rounded card as the page moves over it.
  gsap.fromTo(hero,
    { clipPath: 'inset(0% 0% 0% 0% round 0px)' },
    { clipPath: 'inset(0% 2.5% 4% 2.5% round 20px)', ease: 'none', scrollTrigger: heroScroll() });

  // ------------------------------------------------------------ Section reveals
  gsap.utils.toArray('.section h2').forEach((heading) => {
    gsap.from(heading, {
      y: 56,
      opacity: 0,
      duration: 1.6,
      ease: 'power3.out',
      scrollTrigger: { trigger: heading, start: 'top 88%' },
    });
  });

  const revealTargets = '.card, .facts, .research-text, .contact .section-body > *';
  gsap.set(revealTargets, { opacity: 0, y: 56 });
  ScrollTrigger.batch(revealTargets, {
    start: 'top 90%',
    once: true,
    onEnter: (batch) => gsap.to(batch, {
      opacity: 1, y: 0, duration: 1.4, stagger: 0.14, ease: 'power3.out', overwrite: true,
    }),
  });

  // About: the statement brightens word by word as it scrolls through.
  const statement = document.querySelector('.statement');
  if (statement) {
    const words = statement.textContent.trim().split(/\s+/);
    statement.textContent = '';
    words.forEach((word, i) => {
      const span = document.createElement('span');
      span.className = 'word';
      span.textContent = word;
      statement.append(span, i < words.length - 1 ? ' ' : '');
    });
    gsap.fromTo(statement.querySelectorAll('.word'), { opacity: 0.16 }, {
      opacity: 1,
      stagger: 0.1,
      ease: 'none',
      scrollTrigger: { trigger: statement, start: 'top 82%', end: 'bottom 48%', scrub: 1 },
    });
  }

  // Images expand from a cropped window to full size as they scroll in.
  const expand = (selector, inset) => {
    gsap.utils.toArray(selector).forEach((el) => {
      gsap.fromTo(el,
        { clipPath: `inset(${inset} round 8px)`, scale: 1.18 },
        {
          clipPath: 'inset(0% 0% 0% 0% round 8px)',
          scale: 1,
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top 95%', end: 'center 52%', scrub: 1.2 },
        });
    });
  };
  expand('.about-photo', '14% 14% 14% 14%');
  expand('.research-photo img', '18% 18% 18% 18%');
  expand('.entry-image', '12% 12% 12% 12%');

  // ------------------------------------------------- Cursor + magnetic buttons
  if (finePointer) {
    const ring = document.createElement('div');
    const label = document.createElement('div');
    ring.className = 'cursor-ring';
    label.className = 'cursor-label';
    ring.setAttribute('aria-hidden', 'true');
    label.setAttribute('aria-hidden', 'true');
    document.body.append(ring, label);

    const follow = (el, duration) => ({
      x: gsap.quickTo(el, 'x', { duration, ease: 'power3' }),
      y: gsap.quickTo(el, 'y', { duration, ease: 'power3' }),
    });
    const ringTo = follow(ring, 0.45);
    const labelTo = follow(label, 0.6);
    let shown = false;

    addEventListener('pointermove', (event) => {
      ringTo.x(event.clientX); ringTo.y(event.clientY);
      labelTo.x(event.clientX); labelTo.y(event.clientY);
      if (!shown) { shown = true; gsap.to(ring, { opacity: 1, duration: 0.4 }); }
    }, { passive: true });

    document.addEventListener('pointerover', (event) => {
      const tagged = event.target.closest('[data-cursor]');
      const hot = event.target.closest('a, button, .card');
      if (tagged) label.textContent = tagged.dataset.cursor;
      gsap.to(ring, { scale: tagged ? 0 : hot ? 1.7 : 1, duration: 0.5, ease: 'power3.out' });
      gsap.to(label, { opacity: tagged ? 1 : 0, scale: tagged ? 1 : 0.7, duration: 0.45, ease: 'power3.out' });
    });

    root.addEventListener('pointerleave', () => {
      shown = false;
      gsap.to([ring, label], { opacity: 0, duration: 0.3 });
    });

    // Buttons lean toward the cursor.
    document.querySelectorAll('.button').forEach((button) => {
      const xTo = gsap.quickTo(button, 'x', { duration: 0.6, ease: 'power3' });
      const yTo = gsap.quickTo(button, 'y', { duration: 0.6, ease: 'power3' });
      button.addEventListener('pointermove', (event) => {
        const r = button.getBoundingClientRect();
        xTo((event.clientX - r.left - r.width / 2) * 0.25);
        yTo((event.clientY - r.top - r.height / 2) * 0.35);
      });
      button.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });
  }

  addEventListener('load', () => ScrollTrigger.refresh());
})();
