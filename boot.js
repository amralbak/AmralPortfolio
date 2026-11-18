// Runs in <head>, before the page paints. No inline scripts, so the
// Content-Security-Policy can allow scripts from this site only.
(() => {
  const root = document.documentElement;
  root.classList.replace('no-js', 'js');
  // Start states for the landing animation; motion.js animates them in.
  // Removed after 2.5s in case the animation scripts fail to load.
  root.classList.add('js-motion');
  setTimeout(() => root.classList.remove('js-motion'), 2500);

  document.addEventListener('DOMContentLoaded', () => {
    const year = document.querySelector('[data-year]');
    if (year) year.textContent = new Date().getFullYear();
  });
})();
