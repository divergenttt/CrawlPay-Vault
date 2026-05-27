// Page transition — black overlay fade between landing ↔ dashboard.
// Works across plain HTML navigations by:
//   1. On load: overlay is opaque, fade it out
//   2. On click of [data-page-link]: cancel nav, fade overlay in, then navigate
// Both pages include this script so they hand off cleanly.

(function () {
  // Inject overlay element + styles once
  const style = document.createElement('style');
  style.textContent = `
    .page-transition {
      position: fixed;
      inset: 0;
      background: #06060a;
      z-index: 100000;
      pointer-events: none;
      opacity: 1;
      transition: opacity 0.55s cubic-bezier(0.22, 1, 0.36, 1);
    }
    .page-transition.ready { opacity: 0; }
    .page-transition.leaving { opacity: 1; pointer-events: auto; }

    /* Soft inner ring / pulse so the overlay isn't dead black */
    .page-transition::before {
      content: '';
      position: absolute;
      top: 50%; left: 50%;
      width: 56px; height: 56px;
      transform: translate(-50%, -50%);
      border-radius: 50%;
      border: 1px solid rgba(255, 255, 255, 0.15);
      box-shadow:
        -3px 0 18px rgba(255, 77, 99, 0.4),
         3px 0 18px rgba(94, 142, 255, 0.4);
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    .page-transition.leaving::before { opacity: 1; }

    /* While transitioning out, keep the body from showing a flash of moved content */
    html.page-leaving { overflow: hidden; }
    html.page-leaving body { pointer-events: none; }
  `;
  document.head.appendChild(style);

  const overlay = document.createElement('div');
  overlay.className = 'page-transition';
  document.documentElement.appendChild(overlay);

  // Fade in (overlay out) once the page is painted
  requestAnimationFrame(() => {
    requestAnimationFrame(() => overlay.classList.add('ready'));
  });

  // Intercept page-link clicks
  function handleClick(e) {
    const a = e.target.closest('a[data-page-link]');
    if (!a) return;
    // Ignore modified clicks / target=_blank etc
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target && a.target !== '' && a.target !== '_self') return;
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#')) return;

    e.preventDefault();
    document.documentElement.classList.add('page-leaving');
    overlay.classList.remove('ready');
    overlay.classList.add('leaving');
    setTimeout(() => { window.location.href = href; }, 520);
  }
  document.addEventListener('click', handleClick);

  // When user comes back via bfcache (back button), make sure we fade in
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) {
      document.documentElement.classList.remove('page-leaving');
      overlay.classList.remove('leaving');
      requestAnimationFrame(() => overlay.classList.add('ready'));
    }
  });
})();
