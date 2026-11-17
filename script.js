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

// Footer year.
document.querySelector('[data-year]').textContent = new Date().getFullYear();
