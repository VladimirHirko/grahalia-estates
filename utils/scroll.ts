export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function flyToHash(hash: string, headerOffset = 90) {
  const id = hash.replace("#", "");
  const el = document.getElementById(id);
  if (!el) return;

  flyToElement(el, headerOffset);
  history.pushState(null, "", `#${id}`);
}

export function flyToElement(target: HTMLElement, headerOffset = 90) {
  const targetY =
    target.getBoundingClientRect().top + window.scrollY - headerOffset;

  const startY = window.scrollY;
  const distance = targetY - startY;

  if (Math.abs(distance) < 2) return;

  const abs = Math.abs(distance);
  const duration = clamp(220 + abs * 0.35, 260, 780);

  const startTime = performance.now();

  const easeCruise = (t: number) => {
    if (t < 0.08) {
      const p = t / 0.08;
      return 0.12 * (p * p);
    }
    if (t > 0.82) {
      const p = (t - 0.82) / 0.18;
      return 0.82 + 0.18 * (1 - (1 - p) * (1 - p));
    }
    return 0.12 + (t - 0.08) * (0.70 / 0.74);
  };

  let raf = 0;

  // “моментальный отклик” без паузы
  const nudge = clamp(distance * 0.02, -14, 14);
  window.scrollTo(0, startY + nudge);

  const step = (now: number) => {
    const t = clamp((now - startTime) / duration, 0, 1);
    const eased = easeCruise(t);
    window.scrollTo(0, startY + distance * eased);
    if (t < 1) raf = requestAnimationFrame(step);
  };

  raf = requestAnimationFrame(step);

  const cancel = () => cancelAnimationFrame(raf);
  window.addEventListener("wheel", cancel, { passive: true, once: true });
  window.addEventListener("touchstart", cancel, { passive: true, once: true });
}
