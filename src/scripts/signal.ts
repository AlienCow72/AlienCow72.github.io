import {
  createSignalShapes,
  spinRecord,
  type Particle,
  type Sculpture,
} from './signal-shapes';
import { setupSignalTilt } from './signal-tilt';

const canvas = document.querySelector<HTMLCanvasElement>('#signal-canvas');
const ctx = canvas?.getContext('2d');
if (canvas && ctx) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const toggle = document.querySelector<HTMLButtonElement>('.motion-toggle')!;
  const modes = document.querySelectorAll<HTMLButtonElement>('[data-mode]');
  let paused = reducedMotion.matches;
  let mode = 'code';
  let width = 0;
  let height = 0;
  let frame = 0;
  let time = 0;
  let lastTime = 0;
  let visible = true;
  let pointerX = 0;
  let pointerY = 0;
  let tiltX = 0;
  let tiltY = 0;
  let rotationX = 0;
  let rotationY = 0;

  const shapes = createSignalShapes();
  const tilt = setupSignalTilt({
    isActive: () => !paused && visible && !document.hidden,
    isPaused: () => paused,
    onChange: (x, y) => {
      tiltX = x;
      tiltY = y;
    },
  });

  function draw() {
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, width, height);
    const radius = Math.min(width * 0.32, height * 0.39);
    // The deck rocks as one object; the record also spins in its local plane.
    // Positive pitch keeps the top edge farther away, leaning the deck back.
    const angleY =
      mode === 'music'
        ? 0.12 + Math.sin(time * 0.32) * 0.18 + rotationX * 0.35
        : Math.sin(time * 0.32) * 0.32 + rotationX + 0.3;
    const angleX =
      mode === 'music'
        ? 0.4 + Math.sin(time * 0.25) * 0.06 + rotationY * 0.2
        : -0.12 + rotationY;
    const color =
      mode === 'music'
        ? '192,183,211'
        : mode === 'ai'
          ? '57,255,20'
          : '228,188,120';
    const project = ({ x, y, z, glow = 1 }: Particle): Particle => {
      const xx = x * Math.cos(angleY) + z * Math.sin(angleY);
      const zz = -x * Math.sin(angleY) + z * Math.cos(angleY);
      const yy = y * Math.cos(angleX) - zz * Math.sin(angleX);
      const depth = y * Math.sin(angleX) + zz * Math.cos(angleX);
      const perspective = 3.7 / (3.7 - depth);
      return {
        x: width / 2 + xx * radius * perspective,
        y: height / 2 + yy * radius * perspective,
        z: depth,
        glow,
      };
    };
    const points: Particle[] = [];
    function render(shape: Sculpture, transform = (p: Particle) => p) {
      if (!ctx) return;
      points.push(...shape.points.map((p) => project(transform(p))));
      for (const contour of shape.contours) {
        ctx.beginPath();
        contour.forEach((p, i) => {
          const projected = project(transform(p));
          if (i === 0) ctx.moveTo(projected.x, projected.y);
          else ctx.lineTo(projected.x, projected.y);
        });
        // Extruded symbols have closed contours; deck paths may be open.
        if (mode !== 'music') ctx.closePath();
        ctx.strokeStyle = `rgba(${color},${mode === 'music' ? 0.16 : 0.3})`;
        ctx.lineWidth = 0.7;
        ctx.stroke();
      }
    }
    if (mode === 'music') {
      render(shapes.deck);
      render(shapes.record, (p) => spinRecord(p, time));
    } else {
      render(mode === 'ai' ? shapes.ai : shapes.code);
    }
    points.sort((a, b) => a.z - b.z);
    for (const p of points) {
      const alpha = Math.min(
        1,
        (0.18 + ((p.z + 1.3) / 2.6) * 0.68) * (p.glow ?? 1),
      );
      ctx.fillStyle = `rgba(${color},${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.z > 0.6 ? 1.05 : 0.65, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  function tick(timestamp: number) {
    frame = 0;
    if (paused || !visible || document.hidden) return;
    if (lastTime) time += Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;
    rotationX += ((tilt.enabled ? tiltX : pointerX) - rotationX) * 0.045;
    rotationY += ((tilt.enabled ? tiltY : pointerY) - rotationY) * 0.045;
    draw();
    frame = requestAnimationFrame(tick);
  }
  function schedule() {
    cancelAnimationFrame(frame);
    lastTime = 0;
    tilt.syncActivity();
    if (!paused && visible && !document.hidden)
      frame = requestAnimationFrame(tick);
  }
  function syncToggle() {
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.setAttribute(
      'aria-label',
      paused ? 'Play animation' : 'Pause animation',
    );
    toggle.textContent = paused ? '▷' : 'Ⅱ';
  }
  new ResizeObserver(() => {
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw();
  }).observe(canvas);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    schedule();
  }).observe(canvas);
  canvas.addEventListener('pointermove', (event) => {
    if (paused) return;
    const rect = canvas.getBoundingClientRect();
    pointerX = ((event.clientX - rect.left) / width - 0.5) * 1.3;
    pointerY = ((event.clientY - rect.top) / height - 0.5) * 0.9;
  });
  canvas.addEventListener('pointerleave', () => {
    pointerX = 0;
    pointerY = 0;
  });
  modes.forEach((button) =>
    button.addEventListener('click', () => {
      mode = button.dataset.mode || 'code';
      modes.forEach((item) =>
        item.setAttribute('aria-pressed', String(item === button)),
      );
      canvas.setAttribute(
        'aria-label',
        mode === 'code'
          ? 'A three-dimensional particle sculpture of a code symbol.'
          : mode === 'music'
            ? 'A three-dimensional particle turntable with a gently rocking deck and independently spinning record.'
            : 'A three-dimensional particle sculpture of Kyle Anderson’s brandmark.',
      );
      draw();
    }),
  );
  toggle.addEventListener('click', () => {
    paused = !paused;
    syncToggle();
    draw();
    schedule();
  });
  reducedMotion.addEventListener('change', () => {
    paused = reducedMotion.matches;
    syncToggle();
    draw();
    schedule();
  });
  document.addEventListener('visibilitychange', schedule);
  syncToggle();
  schedule();
}
