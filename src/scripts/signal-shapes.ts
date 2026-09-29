import brandMark from '../assets/brand/personal-mark.svg?raw';

export type Particle = { x: number; y: number; z: number; glow?: number };
export type Sculpture = { points: Particle[]; contours: Particle[][] };

// Original vector geometry for the familiar code glyph, with rounded ends.
const codeSymbol = `<svg viewBox="0 0 240 240"><path d="
M 65 66 Q 72 61 77 69 Q 82 77 74 82 L 29 120 L 74 158 Q 82 163 77 171 Q 72 179 65 174 L 10 129 Q 0 120 10 111 Z
M 175 66 Q 168 61 163 69 Q 158 77 166 82 L 211 120 L 166 158 Q 158 163 163 171 Q 168 179 175 174 L 230 129 Q 240 120 230 111 Z
M 135 28 Q 137 18 147 21 Q 157 24 154 34 L 105 212 Q 102 222 92 219 Q 82 216 85 206 Z"/></svg>`;

function extrude(source: string): Sculpture {
  const svg = new DOMParser().parseFromString(source, 'image/svg+xml');
  const [left, top, width, height] = svg.documentElement
    .getAttribute('viewBox')!
    .split(/\s+/)
    .map(Number);
  const scale = Math.max(width, height) / 2;
  const result: Sculpture = { points: [], contours: [] };
  const sample = document.createElement('canvas').getContext('2d')!;
  const point = (x: number, y: number, z: number): Particle => ({
    x: (x - left - width / 2) / scale,
    y: (y - top - height / 2) / scale,
    z,
  });
  for (const path of svg.querySelectorAll('path')) {
    const data = path.getAttribute('d')!;
    const silhouette = new Path2D(data);
    for (let y = top; y <= top + height; y += 3) {
      for (let x = left; x <= left + width; x += 3) {
        if (sample.isPointInPath(silhouette, x, y, 'evenodd'))
          result.points.push(point(x, y, -0.13), point(x, y, 0.13));
      }
    }
    for (const contour of data.match(/[Mm][^Mm]*/g) ?? []) {
      const outline = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'path',
      );
      outline.setAttribute('d', `${contour} Z`);
      const length = outline.getTotalLength();
      const count = Math.ceil(length / 2.5);
      const front: Particle[] = [];
      const back: Particle[] = [];
      for (let i = 0; i < count; i++) {
        const p = outline.getPointAtLength((i / count) * length);
        front.push(point(p.x, p.y, 0.13));
        back.push(point(p.x, p.y, -0.13));
        if (i % 2 === 0)
          for (let layer = -2; layer <= 2; layer++)
            result.points.push(point(p.x, p.y, layer * 0.065));
      }
      result.contours.push(front, back);
    }
  }
  return result;
}

function trace(shape: Sculpture, points: Particle[], closed = false) {
  const vertices = closed ? [...points, points[0]] : points;
  const samples: Particle[] = [];
  for (let i = 1; i < vertices.length; i++) {
    const a = vertices[i - 1];
    const b = vertices[i];
    const count = Math.ceil(
      Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z) / 0.018,
    );
    for (let j = 0; j < count; j++) {
      const t = j / count;
      samples.push({
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
        z: a.z + (b.z - a.z) * t,
      });
    }
  }
  samples.push(vertices[vertices.length - 1]);
  shape.points.push(...samples);
  shape.contours.push(samples);
}

function ring(
  shape: Sculpture,
  x: number,
  y: number,
  r: number,
  z: number,
  start = 0,
  end = Math.PI * 2,
  glow = 1,
) {
  const count = Math.ceil(((end - start) * r) / 0.018);
  const points = Array.from({ length: count + 1 }, (_, i) => {
    const angle = start + (i / count) * (end - start);
    return { x: x + Math.cos(angle) * r, y: y + Math.sin(angle) * r, z, glow };
  });
  shape.points.push(...points);
  shape.contours.push(points);
}

function turntable() {
  const deck: Sculpture = { points: [], contours: [] };
  const record: Sculpture = { points: [], contours: [] };
  // Rounded chassis, two rims, and vertical corner walls make the depth legible.
  const rim = (z: number) => {
    const points: Particle[] = [];
    const corners = [
      [1.04, -0.69, -Math.PI / 2],
      [1.04, 0.69, 0],
      [-1.04, 0.69, Math.PI / 2],
      [-1.04, -0.69, Math.PI],
    ];
    for (const [x, y, start] of corners)
      for (let i = 0; i <= 12; i++) {
        const angle = start + ((i / 12) * Math.PI) / 2;
        points.push({
          x: x + Math.cos(angle) * 0.16,
          y: y + Math.sin(angle) * 0.16,
          z,
        });
      }
    trace(deck, points, true);
    return points;
  };
  const top = rim(0);
  rim(-0.19);
  top.forEach((p, i) => {
    if (i % 4 === 0) trace(deck, [{ ...p, z: -0.19 }, p]);
  });
  // Fixed platter and spindle. The rotating vinyl is centered separately.
  ring(deck, -0.32, 0, 0.77, 0.025);
  ring(deck, -0.32, 0, 0.025, 0.15);
  for (let r = 0.28; r <= 0.73; r += 0.045)
    ring(record, 0, 0, r, 0.09, 0, Math.PI * 2, 0.65);
  ring(record, 0, 0, 0.74, 0.065);
  ring(record, 0, 0, 0.74, 0.11);
  ring(record, 0, 0, 0.23, 0.11);
  ring(record, 0, 0, 0.21, 0.11);
  // Asymmetric label and opposing groove highlights make rotation visible.
  trace(record, [
    { x: -0.12, y: -0.06, z: 0.12 },
    { x: 0.1, y: -0.06, z: 0.12 },
  ]);
  trace(record, [
    { x: -0.07, y: 0, z: 0.12 },
    { x: 0.07, y: 0, z: 0.12 },
  ]);
  for (let r = 0.32; r < 0.73; r += 0.045) {
    ring(record, 0, 0, r, 0.115, -0.38, 0.38, 1.5);
    ring(record, 0, 0, r, 0.115, Math.PI - 0.38, Math.PI + 0.38, 1.5);
  }
  // Tonearm and headshell remain part of the stationary deck.
  ring(deck, 0.65, -0.55, 0.16, 0.1);
  ring(deck, 0.65, -0.55, 0.07, 0.16);
  for (const dx of [-0.018, 0.018])
    trace(deck, [
      { x: 0.65 + dx, y: -0.55, z: 0.2 },
      { x: 0.65 + dx, y: 0.18, z: 0.2 },
      { x: 0.43 + dx, y: 0.52, z: 0.2 },
    ]);
  trace(
    deck,
    [
      { x: 0.4, y: 0.42, z: 0.22 },
      { x: 0.51, y: 0.49, z: 0.22 },
      { x: 0.37, y: 0.7, z: 0.22 },
      { x: 0.26, y: 0.63, z: 0.22 },
    ],
    true,
  );
  trace(
    deck,
    [
      { x: 0.9, y: -0.15, z: 0.08 },
      { x: 0.96, y: -0.15, z: 0.08 },
      { x: 0.96, y: 0.22, z: 0.08 },
      { x: 0.9, y: 0.22, z: 0.08 },
    ],
    true,
  );
  trace(deck, [
    { x: 0.85, y: 0.08, z: 0.12 },
    { x: 1.01, y: 0.08, z: 0.12 },
  ]);
  for (const y of [0.43, 0.65]) {
    ring(deck, 0.93, y, 0.075, 0.1);
    ring(deck, 0.93, y, 0.045, 0.1);
  }
  ring(deck, -0.99, 0.65, 0.045, 0.1);
  return { deck, record };
}

export function createSignalShapes() {
  return { code: extrude(codeSymbol), ai: extrude(brandMark), ...turntable() };
}

export function spinRecord(p: Particle, time: number): Particle {
  const angle = time * 1.1;
  return {
    ...p,
    x: -0.32 + p.x * Math.cos(angle) - p.y * Math.sin(angle),
    y: p.x * Math.sin(angle) + p.y * Math.cos(angle),
  };
}
