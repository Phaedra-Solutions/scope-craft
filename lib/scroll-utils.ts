let activeScrollRafId: number | null = null;
let cleanupUserListeners: (() => void) | null = null;

function cancelActiveScroll(): void {
  if (activeScrollRafId !== null && typeof window !== 'undefined') {
    window.cancelAnimationFrame(activeScrollRafId);
    activeScrollRafId = null;
  }
  if (cleanupUserListeners) {
    cleanupUserListeners();
    cleanupUserListeners = null;
  }
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Smoothly scrolls the window to the top with a calm, controlled duration.
 * Cancels automatically if the user manually scrolls or triggers another scroll.
 */
export function smoothScrollToTop(durationMs?: number): void {
  if (typeof window === 'undefined') return;

  cancelActiveScroll();

  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    window.scrollTo(0, 0);
    return;
  }

  activeScrollRafId = window.requestAnimationFrame(() => {
    const startY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
    if (startY <= 0) {
      activeScrollRafId = null;
      return;
    }

    const totalDuration =
      typeof durationMs === 'number'
        ? durationMs
        : Math.min(900, Math.max(600, Math.round(startY * 0.75)));

    let startTime: number | null = null;

    const onUserInterrupt = () => {
      cancelActiveScroll();
    };

    window.addEventListener('wheel', onUserInterrupt, { passive: true, once: true });
    window.addEventListener('touchstart', onUserInterrupt, { passive: true, once: true });

    cleanupUserListeners = () => {
      window.removeEventListener('wheel', onUserInterrupt);
      window.removeEventListener('touchstart', onUserInterrupt);
    };

    const step = (timestamp: number) => {
      if (startTime === null) {
        startTime = timestamp;
      }

      const elapsed = timestamp - startTime;
      const progress = Math.min(1, elapsed / totalDuration);
      const eased = easeInOutCubic(progress);
      const nextY = Math.round(startY * (1 - eased));

      window.scrollTo(0, nextY);

      if (progress < 1) {
        activeScrollRafId = window.requestAnimationFrame(step);
      } else {
        cancelActiveScroll();
      }
    };

    activeScrollRafId = window.requestAnimationFrame(step);
  });
}
