import brandMark from '../assets/brand/personal-mark.svg?raw';

type Point3D = { x: number; y: number; z: number };

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
  let rotationX = 0;
  let rotationY = 0;

  // Sample the same SVG used in the navigation. Its cutouts remain empty
  // on both faces and every contour gets a shallow extruded wall.
  const svg = new DOMParser().parseFromString(brandMark, 'image/svg+xml');
  const [minX, minY, markWidth, markHeight] = svg.documentElement
    .getAttribute('viewBox')!
    .split(/\s+/)
    .map(Number);
  const scale = Math.max(markWidth, markHeight) / 2;
  const thickness = 0.13;
  const markPoints: Point3D[] = [];
  const markContours: Point3D[][] = [];
  const point = (x: number, y: number, z: number): Point3D => ({
    x: (x - minX - markWidth / 2) / scale,
    y: (y - minY - markHeight / 2) / scale,
    z,
  });
  const samplingContext = document.createElement('canvas').getContext('2d')!;
  for (const path of svg.querySelectorAll('path')) {
    const data = path.getAttribute('d')!;
    const silhouette = new Path2D(data);
    for (let y = minY; y <= minY + markHeight; y += 3) {
      for (let x = minX; x <= minX + markWidth; x += 3) {
        if (!samplingContext.isPointInPath(silhouette, x, y, 'evenodd'))
          continue;
        markPoints.push(point(x, y, -thickness), point(x, y, thickness));
      }
    }
    // Each move starts a separate closed contour, including the inner cutouts.
    for (const contour of data.match(/[Mm][^Mm]*/g) ?? []) {
      const outline = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'path',
      );
      outline.setAttribute('d', `${contour} Z`);
      const length = outline.getTotalLength();
      const count = Math.ceil(length / 2.5);
      const front: Point3D[] = [];
      const back: Point3D[] = [];
      for (let i = 0; i < count; i++) {
        const p = outline.getPointAtLength((i / count) * length);
        front.push(point(p.x, p.y, thickness));
        back.push(point(p.x, p.y, -thickness));
        if (i % 2 === 0) {
          for (let layer = -2; layer <= 2; layer++) {
            markPoints.push(point(p.x, p.y, (layer / 2) * thickness));
          }
        }
      }
      markContours.push(front, back);
    }
  }

  function draw() {
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, width, height);
    const radius = Math.min(width * 0.32, height * 0.39);
    const angleY =
      (mode === 'code' ? Math.sin(time * 0.32) * 0.32 : time * 0.16) +
      rotationX +
      0.3;
    const angleX = (mode === 'code' ? -0.12 : 0.5) + rotationY;
    const project = ({ x, y, z }: Point3D) => {
      const xx = x * Math.cos(angleY) + z * Math.sin(angleY);
      const zz = -x * Math.sin(angleY) + z * Math.cos(angleY);
      const yy = y * Math.cos(angleX) - zz * Math.sin(angleX);
      const depth = y * Math.sin(angleX) + zz * Math.cos(angleX);
      const perspective = 3.7 / (3.7 - depth);
      return {
        x: width / 2 + xx * radius * perspective,
        y: height / 2 + yy * radius * perspective,
        z: depth,
      };
    };
    const points: Point3D[] = [];
    const bands = 22;
    const count = 66;
    if (mode === 'code') {
      points.push(...markPoints.map(project));
      for (const contour of markContours) {
        const projected = contour.map(project);
        ctx.beginPath();
        projected.forEach((p, i) => {
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.closePath();
        ctx.strokeStyle = 'rgba(228,188,120,0.3)';
        ctx.lineWidth = 0.7;
        ctx.stroke();
      }
    } else {
      for (let band = 0; band < bands; band++) {
        for (let i = 0; i < count; i++) {
          const u = (i / count) * Math.PI * 2;
          const v = (band / bands) * Math.PI * 2;
          let x, y, z;
          if (mode === 'music') {
            const wave =
              Math.sin(u * 5 + time * 1.4) * 0.14 +
              Math.cos(u * 3 - time) * 0.09;
            const r = 0.8 + wave + Math.cos(v) * 0.25;
            x = r * Math.cos(u);
            y = r * Math.sin(u);
            z = Math.sin(v) * 0.38;
          } else {
            const latitude = (band / (bands - 1)) * Math.PI;
            const r = 1 + Math.sin(u * 4 + latitude * 3 + time) * 0.12;
            x = r * Math.sin(latitude) * Math.cos(u);
            y = r * Math.cos(latitude);
            z = r * Math.sin(latitude) * Math.sin(u);
          }
          points.push(project({ x, y, z }));
        }
      }
      // Fine latitude traces keep the form legible even when motion is disabled.
      for (let band = 0; band < bands; band += 2) {
        ctx.beginPath();
        for (let i = 0; i <= count; i++) {
          const p = points[band * count + (i % count)];
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.strokeStyle =
          mode === 'ai'
            ? 'rgba(167,191,172,0.11)'
            : mode === 'music'
              ? 'rgba(192,183,211,0.13)'
              : 'rgba(228,188,120,0.12)';
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }
    }
    points.sort((a, b) => a.z - b.z);
    for (const p of points) {
      const alpha = 0.18 + ((p.z + 1.3) / 2.6) * 0.68;
      const color =
        mode === 'ai'
          ? '167,191,172'
          : mode === 'music'
            ? '192,183,211'
            : '228,188,120';
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
    rotationX += (pointerX - rotationX) * 0.045;
    rotationY += (pointerY - rotationY) * 0.045;
    draw();
    frame = requestAnimationFrame(tick);
  }
  function schedule() {
    cancelAnimationFrame(frame);
    lastTime = 0;
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
          ? 'A three-dimensional particle sculpture of Kyle Anderson’s brandmark.'
          : mode === 'music'
            ? 'A rippling orbital particle sculpture.'
            : 'An undulating spherical particle sculpture.',
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
