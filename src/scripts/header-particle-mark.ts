import brandMark from '../assets/brand/personal-mark.svg?raw';

type Particle = { x: number; y: number; z: number };

const canvas = document.querySelector<HTMLCanvasElement>(
  '.header-particle-canvas',
);
const context = canvas?.getContext('2d');

if (canvas && context) {
  // Independent geometry and lifecycle: the hero field owns its own controls.
  const svg = new DOMParser().parseFromString(brandMark, 'image/svg+xml');
  const [left, top, width, height] = svg.documentElement
    .getAttribute('viewBox')!
    .split(/\s+/)
    .map(Number);
  const scale = Math.max(width, height) / 2;
  const particles: Particle[] = [];
  const add = (x: number, y: number, z: number) =>
    particles.push({
      x: (x - left - width / 2) / scale,
      y: (y - top - height / 2) / scale,
      z,
    });
  // Wider sampling and two depth layers keep individual dots distinct and
  // reduce projection, sorting, and canvas draw calls during pointer motion.
  const sample = document.createElement('canvas').getContext('2d')!;
  for (const path of svg.querySelectorAll('path')) {
    const data = path.getAttribute('d')!;
    const silhouette = new Path2D(data);
    for (let y = top; y <= top + height; y += 10) {
      for (let x = left; x <= left + width; x += 10) {
        if (sample.isPointInPath(silhouette, x, y, 'evenodd')) {
          add(x, y, -0.1);
          add(x, y, 0.1);
        }
      }
    }
    for (const contour of data.match(/[Mm][^Mm]*/g) ?? []) {
      const outline = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'path',
      );
      outline.setAttribute('d', `${contour} Z`);
      const length = outline.getTotalLength();
      const count = Math.ceil(length / 9);
      for (let i = 0; i < count; i++) {
        const point = outline.getPointAtLength((i / count) * length);
        for (const depth of [-0.1, 0.1]) add(point.x, point.y, depth);
      }
    }
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let size = 0;
  let yaw = 0;
  let pitch = 0;
  let targetYaw = 0;
  let targetPitch = 0;
  let visible = false;
  let frame = 0;
  let lastTime = 0;

  function draw() {
    if (!context || !size) return;
    context.clearRect(0, 0, size, size);
    const radius = size * 0.45;
    const projected = particles.map(({ x, y, z }) => {
      const horizontal = x * Math.cos(yaw) + z * Math.sin(yaw);
      const depth = -x * Math.sin(yaw) + z * Math.cos(yaw);
      const vertical = y * Math.cos(pitch) - depth * Math.sin(pitch);
      const finalDepth = y * Math.sin(pitch) + depth * Math.cos(pitch);
      const perspective = 4 / (4 - finalDepth);
      return {
        x: size / 2 + horizontal * radius * perspective,
        y: size / 2 + vertical * radius * perspective,
        z: finalDepth,
      };
    });
    projected.sort((a, b) => a.z - b.z);
    for (const point of projected) {
      context.fillStyle = `rgba(228,188,120,${0.48 + (point.z + 0.5) * 0.35})`;
      context.beginPath();
      context.arc(point.x, point.y, size / 110, 0, Math.PI * 2);
      context.fill();
    }
  }

  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
  }

  function tick(timestamp: number) {
    frame = 0;
    if (!visible || document.hidden || reducedMotion.matches) return;
    const elapsed = lastTime ? Math.min(timestamp - lastTime, 50) : 16;
    lastTime = timestamp;
    const easing = 1 - Math.exp(-elapsed / 110);
    yaw += (targetYaw - yaw) * easing;
    pitch += (targetPitch - pitch) * easing;
    draw();
    // Rest once settled; no continuous animation or idle spinning.
    if (Math.abs(targetYaw - yaw) + Math.abs(targetPitch - pitch) > 0.0005) {
      frame = requestAnimationFrame(tick);
    } else {
      lastTime = 0;
    }
  }

  function schedule() {
    if (!frame && visible && !document.hidden && !reducedMotion.matches)
      frame = requestAnimationFrame(tick);
  }

  function reset() {
    targetYaw = 0;
    targetPitch = 0;
    schedule();
  }

  new ResizeObserver(() => {
    size = canvas.parentElement!.getBoundingClientRect().width;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(size * ratio);
    canvas.height = Math.round(size * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw();
    canvas.parentElement?.setAttribute('data-ready', '');
  }).observe(canvas.parentElement!);

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) schedule();
    else stop();
  }).observe(canvas.parentElement!);

  window.addEventListener(
    'pointermove',
    (event) => {
      if (event.pointerType === 'touch' || reducedMotion.matches) return;
      const rect = canvas.getBoundingClientRect();
      // Aim toward the pointer relative to the mark, anywhere in the viewport.
      // Bound the tilt to about 16 degrees so the small silhouette stays clear.
      targetYaw =
        Math.tanh(
          (event.clientX - rect.left - rect.width / 2) / (innerWidth * 0.45),
        ) * 0.28;
      targetPitch =
        -Math.tanh(
          (event.clientY - rect.top - rect.height / 2) / (innerHeight * 0.45),
        ) * 0.28;
      schedule();
    },
    { passive: true },
  );
  document.documentElement.addEventListener('pointerleave', reset);
  window.addEventListener('blur', reset);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else schedule();
  });
  reducedMotion.addEventListener('change', () => {
    stop();
    yaw = pitch = targetYaw = targetPitch = 0;
    draw();
  });
}
