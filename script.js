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
// The hero (#top) is observed too, so no link is marked while it is in view.
['top', ...navLinks.keys()].forEach((id) => {
  const section = document.getElementById(id);
  if (section) spy.observe(section);
});

// The contact band is short, so mark it once the footer comes into view.
new IntersectionObserver(([entry]) => {
  if (entry.isIntersecting) setCurrent('contact');
}).observe(document.querySelector('.site-footer'));

// Soft light that follows the cursor inside cards (mouse only).
if (finePointer) {
  document.documentElement.classList.add('has-glow');
  document.addEventListener('pointermove', (event) => {
    const card = event.target.closest('.card');
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty('--x', `${event.clientX - r.left}px`);
    card.style.setProperty('--y', `${event.clientY - r.top}px`);
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
