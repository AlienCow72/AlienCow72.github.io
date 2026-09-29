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

  function draw() {
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, width, height);
    const radius = Math.min(width * 0.32, height * 0.39);
    const angleY = time * 0.16 + rotationX + 0.4;
    const angleX = 0.5 + rotationY;
    const points: { x: number; y: number; z: number; band: number }[] = [];
    const bands = 22;
    const count = 66;
    for (let band = 0; band < bands; band++) {
      for (let i = 0; i < count; i++) {
        const u = (i / count) * Math.PI * 2;
        const v = (band / bands) * Math.PI * 2;
        let x, y, z;
        if (mode === 'music') {
          const wave =
            Math.sin(u * 5 + time * 1.4) * 0.14 + Math.cos(u * 3 - time) * 0.09;
          const r = 0.8 + wave + Math.cos(v) * 0.25;
          x = r * Math.cos(u);
          y = r * Math.sin(u);
          z = Math.sin(v) * 0.38;
        } else if (mode === 'ai') {
          const latitude = (band / (bands - 1)) * Math.PI;
          const r = 1 + Math.sin(u * 4 + latitude * 3 + time) * 0.12;
          x = r * Math.sin(latitude) * Math.cos(u);
          y = r * Math.cos(latitude);
          z = r * Math.sin(latitude) * Math.sin(u);
        } else {
          const r = 0.73 + Math.cos(v) * 0.32;
          x = r * Math.cos(u);
          y = r * Math.sin(u);
          z = Math.sin(v) * 0.32;
        }
        const xx = x * Math.cos(angleY) + z * Math.sin(angleY);
        const zz = -x * Math.sin(angleY) + z * Math.cos(angleY);
        const yy = y * Math.cos(angleX) - zz * Math.sin(angleX);
        const depth = y * Math.sin(angleX) + zz * Math.cos(angleX);
        const perspective = 3.7 / (3.7 - depth);
        points.push({
          x: width / 2 + xx * radius * perspective,
          y: height / 2 + yy * radius * perspective,
          z: depth,
          band,
        });
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
