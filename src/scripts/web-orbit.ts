import brandMark from '../assets/brand/personal-mark.svg?raw';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const ns = 'http://www.w3.org/2000/svg';
const source = new DOMParser().parseFromString(brandMark, 'image/svg+xml');
const [left, top, width, height] = source.documentElement
  .getAttribute('viewBox')!
  .split(/\s+/)
  .map(Number);
const samples = 80;
// Sample each contour of the supplied brand asset, rather than approximating it.
const contours = Array.from(source.querySelectorAll('path')).flatMap((path) =>
  (path.getAttribute('d')!.match(/[Mm][^Mm]*/g) ?? []).map((contour) => {
    const trace = document.createElementNS(ns, 'path');
    trace.setAttribute('d', `${contour} Z`);
    const length = trace.getTotalLength();
    return Array.from({ length: samples }, (_, i) => {
      const point = trace.getPointAtLength((i * length) / samples);
      return {
        x: ((point.x - left) / width) * 100,
        y: ((point.y - top) / height) * 100,
      };
    });
  }),
);
const palette = [
  '#e4bc78',
  '#91dfbb',
  '#89d9ee',
  '#f39d99',
  '#c9acf3',
  '#a5c4ff',
];
const smooth = (value: number) => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
};

document.querySelectorAll<HTMLElement>('.art-web').forEach((art) => {
  const orbit = art.querySelector<HTMLElement>('.tiny-orbit')!;
  const morph = orbit.querySelector<SVGGElement>('.orbit-morph')!;
  const mark = orbit.querySelector<SVGGElement>('.orbit-brand')!;
  const paths = contours.map(() => {
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('stroke-width', '1');
    morph.append(path);
    return path;
  });
  const dots = Array.from({ length: 3 }, () => {
    const dot = document.createElementNS(ns, 'circle');
    dot.setAttribute('r', '3');
    dot.setAttribute('fill', 'currentColor');
    morph.append(dot);
    return dot;
  });
  const link = art.closest('a');
  const hoverTarget = link ?? art;
  let visible = false;
  let hovered = false;
  let focused = false;
  let frame = 0;
  let previousColor = '';

  function reset() {
    cancelAnimationFrame(frame);
    frame = 0;
    delete orbit.dataset.orbitState;
    orbit.style.removeProperty('--orbit-color');
    morph.style.opacity = '0';
    mark.style.opacity = '0';
  }

  function start() {
    const choices = palette.filter((color) => color !== previousColor);
    previousColor = choices[Math.floor(Math.random() * choices.length)];
    const target = previousColor
      .match(/\w\w/g)!
      .map((hex) => parseInt(hex, 16));
    const initial = [192, 183, 211];
    const started = performance.now();
    orbit.dataset.orbitState = 'running';

    function draw(now: number) {
      const progress = Math.min(1, (now - started) / 2500);
      const blend = smooth((progress - 0.45) / 0.45);
      const finish = smooth((progress - 0.9) / 0.1);
      const spin = Math.PI * 4 * smooth(Math.min(1, progress / 0.9));
      const color = initial.map((v, i) =>
        Math.round(v + (target[i] - v) * blend),
      );
      orbit.style.setProperty('--orbit-color', `rgb(${color.join(',')})`);
      morph.style.opacity = String(1 - finish);
      mark.style.opacity = String(finish);

      paths.forEach((path, index) => {
        const angle = spin + ((index % 3) * Math.PI) / 3;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const points = contours[index].map((point, i) => {
          const phase = (i / samples) * Math.PI * 2;
          const x = Math.cos(phase) * 44;
          const y = Math.sin(phase) * (20 + 5 * Math.sin(spin));
          const fromX = 50 + x * cos - y * sin;
          const fromY = 50 + x * sin + y * cos;
          return `${fromX + (point.x - fromX) * blend},${fromY + (point.y - fromY) * blend}`;
        });
        path.setAttribute('d', `M ${points.join(' L ')} Z`);
        path.style.opacity = String(0.3 + 0.7 * blend);
      });
      dots.forEach((dot, index) => {
        const point = paths[index].getPointAtLength(
          paths[index].getTotalLength() * ((progress * 3 + index / 3) % 1),
        );
        dot.setAttribute('cx', String(point.x));
        dot.setAttribute('cy', String(point.y));
        dot.style.opacity = String(1 - blend);
      });
      if (progress < 1) {
        frame = requestAnimationFrame(draw);
      } else {
        frame = 0;
        orbit.dataset.orbitState = 'complete';
      }
    }
    frame = requestAnimationFrame(draw);
  }

  function updatePlayback() {
    if (
      !visible ||
      document.hidden ||
      reducedMotion.matches ||
      (!hovered && !focused)
    ) {
      reset();
    } else if (!orbit.dataset.orbitState) {
      start();
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
