// Mobile menu: one nav, toggled by an accessible button.
const toggle = document.querySelector('.menu-toggle');
const nav = document.getElementById('site-nav');

function setMenu(open) {
  toggle.setAttribute('aria-expanded', String(open));
  nav.classList.toggle('is-open', open);
}

toggle.addEventListener('click', () => {
  setMenu(toggle.getAttribute('aria-expanded') !== 'true');
});

// Close after choosing a link, or on Escape (returning focus to the button).
nav.addEventListener('click', (event) => {
  if (event.target.closest('a')) setMenu(false);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
    setMenu(false);
    toggle.focus();
  }
});

// Copy email: only shown when the Clipboard API is available.
const copyButton = document.querySelector('.copy-email');
const copyStatus = document.querySelector('.copy-status');

if (copyButton && navigator.clipboard) {
  copyButton.hidden = false;
  copyButton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(copyButton.dataset.copy);
      copyStatus.textContent = 'Email copied';
    } catch {
      copyStatus.textContent = 'Couldn’t copy. Select the address instead.';
    }
  });
}

const motionOK = matchMedia('(prefers-reduced-motion: no-preference)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

// Nav: mark the link for the section in the middle of the screen.
const navLinks = new Map(
  [...nav.querySelectorAll('a[href^="#"]')].map((a) => [a.hash.slice(1), a])
);

function setCurrent(id) {
  navLinks.forEach((a, key) => {
    a.classList.toggle('is-current', key === id);
    if (key === id) a.setAttribute('aria-current', 'location');
    else a.removeAttribute('aria-current');
  });
}

const spy = new IntersectionObserver((entries) => {
  for (const entry of entries) if (entry.isIntersecting) setCurrent(entry.target.id);
}, { rootMargin: '-45% 0px -50% 0px' });
navLinks.forEach((_, id) => {
  const section = document.getElementById(id);
  if (section) spy.observe(section);
});

// The contact band is short, so mark it once the footer comes into view.
new IntersectionObserver(([entry]) => {
  if (entry.isIntersecting) setCurrent('contact');
}).observe(document.querySelector('.site-footer'));

// In-page links glide to their section. This is done in script because
// Chrome and Edge on Windows skip CSS smooth scrolling when the system's
// animation effects are off.
function glideTo(target) {
  const start = scrollY;
  const headerHeight = document.querySelector('.site-header').offsetHeight;
  const maxScroll = document.documentElement.scrollHeight - innerHeight;
  const end = Math.max(0, Math.min(maxScroll, target.getBoundingClientRect().top + scrollY - headerHeight));
  const distance = end - start;
  const duration = Math.min(900, 400 + Math.abs(distance) / 8);
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
  const startTime = performance.now();

  requestAnimationFrame(function step(now) {
    const t = Math.min((now - startTime) / duration, 1);
    scrollTo({ top: start + distance * ease(t), behavior: 'instant' });
    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      if (navLinks.has(target.id)) requestAnimationFrame(() => setCurrent(target.id));
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true }); // keyboard and screen-reader users continue from here
    }
  });
}

document.addEventListener('click', (event) => {
  const link = event.target.closest('a[href^="#"]');
  if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
  const target = document.getElementById(link.hash.slice(1));
  if (!target) return;
  event.preventDefault();
  history.pushState(null, '', link.hash);
  glideTo(target);
});

// Scroll reveal: fade content up once as it arrives.
if (motionOK) {
  const reveal = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-visible');
      reveal.unobserve(entry.target);
    }
  }, { rootMargin: '0px 0px -8% 0px' });

  document.querySelectorAll(
    '.section h2, .about, .facts, .entries > li, .research, .project, .contact .section-body'
  ).forEach((el) => {
    if (el.classList.contains('project')) {
      el.style.transitionDelay = `${[...el.parentElement.children].indexOf(el) % 2 * 60}ms`;
    }
    el.classList.add('reveal');
    reveal.observe(el);
  });
}

// Cursor light on the hero and on cards (mouse only).
if (motionOK && finePointer) {
  document.documentElement.classList.add('has-glow');
  const backdrop = document.querySelector('.hero-backdrop');

  document.addEventListener('pointermove', (event) => {
    const card = event.target.closest('.card');
    if (card) {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--x', `${event.clientX - r.left}px`);
      card.style.setProperty('--y', `${event.clientY - r.top}px`);
    } else if (backdrop && event.target.closest('.hero')) {
      const r = backdrop.getBoundingClientRect();
      backdrop.style.setProperty('--mx', `${event.clientX - r.left}px`);
      backdrop.style.setProperty('--my', `${event.clientY - r.top}px`);
    }
  }, { passive: true });
}

// Hero photo: clicking it shows a short thank-you message.
const photoButton = document.querySelector('.photo-button');
const toast = document.querySelector('.photo-toast');
if (photoButton && toast) {
  const messages = [
    'Thanks for stopping by.',
    'Glad you’re here.',
    'Hope your day’s going well.',
    'Thanks for visiting. Say hi anytime.',
  ];
  let next = 0;
  let hideTimer;

  photoButton.addEventListener('click', () => {
    toast.classList.remove('is-shown');
    void toast.offsetWidth; // restart the entrance if a message is already showing
    toast.textContent = messages[next];
    next = (next + 1) % messages.length;
    toast.classList.add('is-shown');
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => toast.classList.remove('is-shown'), 2500);
  });
}

// Footer year.
document.querySelector('[data-year]').textContent = new Date().getFullYear();
