export {};

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

document.querySelectorAll<HTMLElement>('.art-resume').forEach((art) => {
  const selections = art.querySelectorAll<SVGRectElement>('.resume-selection');
  const packets = art.querySelectorAll<SVGRectElement>('.resume-data-packet');
  const sections = art.querySelectorAll<SVGGElement>('.resume-result-section');
  const outputs = art.querySelectorAll<SVGGElement>('.resume-output');
  const note = art.querySelector<SVGGElement>('.resume-note')!;
  const source = art.querySelector<SVGGElement>('.resume-source')!;
  const branch = art.querySelector<SVGGElement>('.resume-branch')!;
  const link = art.closest('a');
  const hoverTarget = link ?? art;
  let visible = false;
  let hovered = false;
  let focused = false;
  let animations: Animation[] = [];
  const timing: KeyframeAnimationOptions = { duration: 2500, fill: 'forwards' };

  function reset() {
    animations.forEach((animation) => animation.cancel());
    animations = [];
  }

  function animate(element: Element, keyframes: Keyframe[]) {
    animations.push(element.animate(keyframes, timing));
  }

  function updatePlayback() {
    if (
      !visible ||
      document.hidden ||
      reducedMotion.matches ||
      (!hovered && !focused)
    ) {
      reset();
    } else if (animations.length === 0) {
      animate(source, [
        { transform: 'translate(58.5px, -5px)', offset: 0, easing: 'ease-out' },
        { transform: 'translate(0px, 0px)', offset: 0.22 },
        { transform: 'translate(0px, 0px)', offset: 1 },
      ]);
      animate(note, [
        { opacity: 1, offset: 0 },
        { opacity: 0, offset: 0.16 },
        { opacity: 0, offset: 1 },
      ]);
      animate(branch, [
        { opacity: 0, offset: 0 },
        { opacity: 0, offset: 0.2 },
        { opacity: 1, offset: 0.28 },
        { opacity: 1, offset: 1 },
      ]);
      outputs.forEach((output, version) => {
        const begin = 0.27 + version * 0.32;
        animate(output, [
          { opacity: 0, offset: 0 },
          { opacity: 0, offset: begin },
          { opacity: 1, offset: begin + 0.08 },
          { opacity: 1, offset: 1 },
        ]);
        animate(output.querySelector('.resume-ready')!, [
          { opacity: 0, offset: 0 },
          { opacity: 0, offset: begin + 0.29 },
          { opacity: 1, offset: begin + 0.37 },
          { opacity: 1, offset: 1 },
        ]);
      });
      sections.forEach((section, index) => {
        const row = index % 3;
        const version = Math.floor(index / 3);
        const begin = 0.24 + version * 0.32 + row * 0.07;
        const arrive = begin + 0.1;
        // Select source data once; use different excerpts in both outputs.
        if (version === 0)
          animate(selections[row], [
            { opacity: 0, offset: 0 },
            { opacity: 0, offset: begin },
            { opacity: 0.28, offset: begin + 0.06 },
            { opacity: 0.12, offset: arrive },
            { opacity: 0.12, offset: 1 },
          ]);
        const from = `translate(124px, ${88 + row * 46}px)`;
        const to = `translate(191px, ${51 + row * 22 + version * 120}px)`;
        animate(packets[index], [
          { opacity: 0, transform: from, offset: 0 },
          { opacity: 0, transform: from, offset: begin },
          { opacity: 1, transform: from, offset: begin + 0.03 },
          { opacity: 1, transform: to, offset: arrive - 0.02 },
          { opacity: 0, transform: to, offset: arrive },
          { opacity: 0, transform: to, offset: 1 },
        ]);
        animate(section, [
          { opacity: 0, offset: 0 },
          { opacity: 0, offset: arrive - 0.02 },
          { opacity: 1, offset: arrive + 0.04 },
          { opacity: 1, offset: 1 },
        ]);
        animate(section.querySelector('.resume-result-lines')!, [
          { strokeDashoffset: '1', offset: 0 },
          { strokeDashoffset: '1', offset: arrive },
          { strokeDashoffset: '0', offset: arrive + 0.13 },
          { strokeDashoffset: '0', offset: 1 },
        ]);
      });
    }
  }

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
});
