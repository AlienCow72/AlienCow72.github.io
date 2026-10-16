export {};

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

document.querySelectorAll<HTMLElement>('.art-data').forEach((art) => {
  const graph = art.querySelector<HTMLElement>('.data-diagram')!;
  const bars = Array.from(graph.querySelectorAll<HTMLElement>('[data-height]'));
  const sorted = [...bars].sort(
    (a, b) => Number(a.dataset.height) - Number(b.dataset.height),
  );
  const link = art.closest('a');
  const hoverTarget = link ?? art;
  let visible = false;
  let hovered = false;
  let focused = false;
  let animations: Animation[] = [];

  function reset() {
    animations.forEach((animation) => animation.cancel());
    animations = [];
  }

  function updatePlayback() {
    const active =
      visible &&
      !document.hidden &&
      !reducedMotion.matches &&
      (hovered || focused);
    if (!active) {
      reset();
    } else if (animations.length === 0) {
      // Move each bar into its ranked slot, preserving its original height.
      // All bars finish together, then hold the sorted graph until pointer exit.
      animations = bars.map((bar) =>
        bar.animate(
          [
            { transform: 'translateX(0)' },
            {
              transform: `translateX(${bars[sorted.indexOf(bar)].offsetLeft - bar.offsetLeft}px)`,
            },
          ],
          { duration: 2500, easing: 'ease-in-out', fill: 'forwards' },
        ),
      );
    }
  }

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    updatePlayback();
  }).observe(art);
  new ResizeObserver(() => {
    reset();
    updatePlayback();
  }).observe(graph);
  hoverTarget.addEventListener('pointerenter', () => {
    hovered = true;
    updatePlayback();
  });
  hoverTarget.addEventListener('pointerleave', () => {
    hovered = false;
    focused = false;
    updatePlayback();
  });
  link?.addEventListener('focus', () => {
    focused = true;
    updatePlayback();
  });
  link?.addEventListener('blur', () => {
    focused = false;
    updatePlayback();
  });
  reducedMotion.addEventListener('change', updatePlayback);
  document.addEventListener('visibilitychange', updatePlayback);
});
