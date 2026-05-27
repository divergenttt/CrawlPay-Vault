// Custom cursor with lagging ring
function useCursor() {
  React.useEffect(() => {
    const dot = document.querySelector('.cursor-dot');
    const ring = document.querySelector('.cursor-ring');
    if (!dot || !ring) return;

    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let rx = mx, ry = my;
    let raf;

    const onMove = (e) => {
      mx = e.clientX;
      my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
    };

    const loop = () => {
      rx += (mx - rx) * 0.1;
      ry += (my - ry) * 0.1;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      raf = requestAnimationFrame(loop);
    };

    const onOver = (e) => {
      const t = e.target;
      if (t.closest('a, button, .hoverable')) {
        dot.classList.add('hover');
        ring.classList.add('hover');
      }
    };
    const onOut = (e) => {
      const t = e.target;
      if (t.closest('a, button, .hoverable')) {
        dot.classList.remove('hover');
        ring.classList.remove('hover');
      }
    };

    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseover', onOver);
    document.addEventListener('mouseout', onOut);
    loop();

    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseout', onOut);
      cancelAnimationFrame(raf);
    };
  }, []);
}

// IntersectionObserver: mark .fade-up with [data-faded] when visible.
// Using a data attribute (instead of a class) so React reconciliation of
// className on parent components can't strip it.
function useFadeIn() {
  React.useEffect(() => {
    const observed = new WeakSet();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.setAttribute('data-faded', 'in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    const scan = () => {
      document.querySelectorAll('.fade-up').forEach((el) => {
        if (!observed.has(el)) { observed.add(el); io.observe(el); }
      });
    };
    scan();

    // Re-scan when React adds new fade-up nodes (e.g. on state change)
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => { io.disconnect(); mo.disconnect(); };
  }, []);
}

// Nav scrolled state
function useScrolled(threshold = 40) {
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);
  return scrolled;
}

Object.assign(window, { useCursor, useFadeIn, useScrolled });
