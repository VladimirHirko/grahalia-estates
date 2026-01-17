type Options = {
  duration?: number;
  offset?: number;
};

function clamp01(x: number) {
  return Math.min(1, Math.max(0, x));
}

// Разгон → быстро → торможение
function easeInOutCubic(t: number) {
  t = clamp01(t);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function smoothScrollToY(targetY: number, opts: Options = {}) {
  const startY = window.scrollY;
  const offset = opts.offset ?? 0;
  const finalY = targetY - offset;

  const distance = Math.abs(finalY - startY);
  const baseDuration = opts.duration ?? 800;
  const duration = Math.min(1400, Math.max(600, baseDuration + distance * 0.15));

  const start = performance.now();
  let cancelled = false;

  const cancel = () => (cancelled = true);
  window.addEventListener("wheel", cancel, { passive: true, once: true });
  window.addEventListener("touchstart", cancel, { passive: true, once: true });

  function step(now: number) {
    if (cancelled) return;

    const t = (now - start) / duration;
    const p = easeInOutCubic(t);

    window.scrollTo(0, startY + (finalY - startY) * p);

    if (t < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

export function scrollToHash(hash: string, opts: Options = {}) {
  const id = hash.replace("#", "");
  const el = document.getElementById(id);
  if (!el) return;

  const top = el.getBoundingClientRect().top + window.scrollY;
  smoothScrollToY(top, opts);

  history.pushState(null, "", `#${id}`);
}
