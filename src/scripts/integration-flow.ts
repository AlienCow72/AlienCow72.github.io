// The thumbnail plays on hover or keyboard focus. Layout coordinates are measured
// before the diagram's rotation so the packet follows the actual connector/box.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

document.querySelectorAll<HTMLElement>('.art-integration').forEach((art) => {
  const diagram = art.querySelector<HTMLElement>('.integration-diagram')!;
  const nodes = diagram.querySelectorAll<HTMLElement>('.diagram-node');
  const erp = nodes[0];
  const tax = nodes[1];
  const logo = diagram.querySelector<HTMLElement>('.diagram-core')!;
  const svg = diagram.querySelector<SVGSVGElement>('.integration-flow')!;
  const motion = svg.querySelector<SVGAnimationElement>('animateMotion')!;
  const animations = svg.querySelectorAll<SVGAnimationElement>(
    'animateMotion, animate',
  );
  const completion = svg.querySelector<SVGRectElement>('.flow-completion')!;
  const area = svg.querySelector<SVGRectElement>('.flow-area')!;
  const mask = svg.querySelector<SVGRectElement>('.flow-logo-mask')!;
  const link = art.closest('a');
  const hoverTarget = link ?? art;
  let visible = false;
  let started = false;
  let hovered = false;
  let focused = false;

  function updatePlayback() {
    const active =
      visible &&
      !document.hidden &&
      !reducedMotion.matches &&
      (hovered || focused);
    art.toggleAttribute('data-flow-active', active);
    if (active) {
      if (!started) {
        animations.forEach((animation) => animation.beginElement());
        started = true;
      }
      svg.unpauseAnimations();
    } else {
      svg.pauseAnimations();
      svg.setCurrentTime(0);
      started = false;
    }
  }

  function updatePath() {
    const startX = erp.offsetLeft + erp.offsetWidth;
    const centerY = tax.offsetTop + tax.offsetHeight / 2;
    const left = tax.offsetLeft + 0.5;
    const right = tax.offsetLeft + tax.offsetWidth - 0.5;
    const top = tax.offsetTop + 0.5;
    const bottom = tax.offsetTop + tax.offsetHeight - 0.5;
    const radius = Math.min(5, tax.offsetHeight / 2, tax.offsetWidth / 2);
    motion.setAttribute(
      'path',
      `M ${startX} ${centerY} H ${left}
       V ${top + radius} Q ${left} ${top} ${left + radius} ${top}
       H ${right - radius} Q ${right} ${top} ${right} ${top + radius}
       V ${bottom - radius} Q ${right} ${bottom} ${right - radius} ${bottom}
       H ${left + radius} Q ${left} ${bottom} ${left} ${bottom - radius}
       V ${centerY} H ${startX}`,
    );
    area.setAttribute('width', String(diagram.offsetWidth));
    area.setAttribute('height', String(diagram.offsetHeight));
    completion.setAttribute('x', String(erp.offsetLeft + 0.5));
    completion.setAttribute('y', String(erp.offsetTop + 0.5));
    completion.setAttribute('width', String(erp.offsetWidth - 1));
    completion.setAttribute('height', String(erp.offsetHeight - 1));
    mask.setAttribute('x', String(logo.offsetLeft - 3));
    mask.setAttribute('y', String(logo.offsetTop - 3));
    mask.setAttribute('width', String(logo.offsetWidth + 6));
    mask.setAttribute('height', String(logo.offsetHeight + 6));
    updatePlayback();
  }

  new ResizeObserver(updatePath).observe(diagram);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    updatePlayback();
  }).observe(art);
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
  updatePath();
});
