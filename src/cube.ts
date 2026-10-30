/** The authoritative cube is integer-valued; rendering never feeds back into it. */
export type Face = 'U' | 'R' | 'F' | 'D' | 'L' | 'B';
export type Move = string;
export type Vec3 = [number, number, number];
export type Axis = 'x' | 'y' | 'z';
export interface Sticker { normal: Vec3; face: Face }
export interface Cubie { id: string; position: Vec3; stickers: Sticker[] }
export interface ParsedMove { face: Face; axis: Axis; layer: number; quarters: number; depth: number }

export const MIN_ORDER = 2;
export const MAX_ORDER = 10;
export const FACES: Face[] = ['U', 'R', 'F', 'D', 'L', 'B'];
const normals: Record<Face, Vec3> = {
  U: [0, 1, 0], R: [1, 0, 0], F: [0, 0, 1],
  D: [0, -1, 0], L: [-1, 0, 0], B: [0, 0, -1],
};
const definitions: Record<Face, { axis: Axis; layer: 1 | -1 }> = {
  U: { axis: 'y', layer: 1 }, R: { axis: 'x', layer: 1 },
  F: { axis: 'z', layer: 1 }, D: { axis: 'y', layer: -1 },
  L: { axis: 'x', layer: -1 }, B: { axis: 'z', layer: -1 },
};
export const axisIndex = (axis: Axis): number => ({ x: 0, y: 1, z: 2 })[axis];

function validateOrder(order: number): void {
  if (!Number.isInteger(order) || order < MIN_ORDER || order > MAX_ORDER) {
    throw new Error(`魔方阶数须为 ${MIN_ORDER}–${MAX_ORDER} 之间的整数`);
  }
}

/** Doubled grid coordinates keep both even and odd orders exactly integral. */
export function createCube(order = 3): Cubie[] {
  validateOrder(order);
  const extent = order - 1;
  const cubies: Cubie[] = [];
  for (let x = -extent; x <= extent; x += 2) for (let y = -extent; y <= extent; y += 2) for (let z = -extent; z <= extent; z += 2) {
    if (Math.max(Math.abs(x), Math.abs(y), Math.abs(z)) !== extent) continue;
    const position: Vec3 = [x, y, z];
    cubies.push({ id: `${x},${y},${z}`, position, stickers: FACES
      .filter(face => position[axisIndex(definitions[face].axis)] === definitions[face].layer * extent)
      .map(face => ({ face, normal: [...normals[face]] as Vec3 })) });
  }
  return cubies;
}

export function getOrder(cubies: Cubie[]): number {
  let extent = 0;
  for (const cubie of cubies) for (const value of cubie.position) extent = Math.max(extent, Math.abs(value));
  const order = extent + 1;
  validateOrder(order);
  return order;
}

/** A prefix is one slice's depth from the named face, not a wide turn. */
export function parseMove(move: Move, order = 3): ParsedMove {
  validateOrder(order);
  const match = /^([1-9]\d*)?([URFDLB])([2']?)$/.exec(move);
  if (!match) throw new Error(`不支持的转动记号：${move}`);
  const depth = match[1] ? Number(match[1]) : 1;
  if (!Number.isInteger(depth) || depth > order) throw new Error(`转动层数须为 1–${order} 之间的整数`);
  const face = match[2] as Face;
  const { axis, layer: sign } = definitions[face];
  const layer = sign * (order - 1 - 2 * (depth - 1));
  // Clockwise is viewed from outside the named face, toward the cube's center.
  const amount = match[3] === '2' ? 2 : match[3] === "'" ? -1 : 1;
  return { face, axis, layer: layer || 0, quarters: -sign * amount, depth };
}

export function parseAlgorithm(algorithm: string, order = 3): Move[] {
  validateOrder(order);
  const text = algorithm.trim();
  if (!text) return [];
  const moves = text.split(/\s+/);
  moves.forEach(move => parseMove(move, order));
  return moves;
}

function rotateQuarter([x, y, z]: Vec3, axis: Axis): Vec3 {
  // +90° right-hand rotation, with no floating-point trigonometry.
  if (axis === 'x') return [x, -z || 0, y];
  if (axis === 'y') return [z, y, -x || 0];
  return [-y || 0, x, z];
}

export function applyMove(cubies: Cubie[], move: Move): void {
  const { axis, layer, quarters } = parseMove(move, getOrder(cubies));
  const count = ((quarters % 4) + 4) % 4;
  for (const cubie of cubies) {
    if (cubie.position[axisIndex(axis)] !== layer) continue;
    for (let i = 0; i < count; i++) {
      cubie.position = rotateQuarter(cubie.position, axis);
      for (const sticker of cubie.stickers) sticker.normal = rotateQuarter(sticker.normal, axis);
    }
  }
}

export function inverseMove(move: Move): Move {
  // Inversion is order-independent; the target model validates the actual depth.
  parseMove(move, MAX_ORDER);
  return move.endsWith('2') ? move : move.endsWith("'") ? move.slice(0, -1) : `${move}'`;
}

/** URFDLB facelet order used by cubejs and the Kociemba solver. */
function faceletPosition(face: Face, row: number, col: number, order: number): Vec3 {
  const extent = order - 1;
  const across = 2 * col - extent;
  const down = 2 * row - extent;
  if (face === 'U') return [across, extent, down];
  if (face === 'R') return [extent, -down || 0, -across || 0];
  if (face === 'F') return [across, -down || 0, extent];
  if (face === 'D') return [across, -extent, -down || 0];
  if (face === 'L') return [-extent, -down || 0, across];
  return [-across || 0, -down || 0, -extent];
}

const sameVector = (a: Vec3, b: Vec3): boolean => a.every((n, i) => n === b[i]);

export function cubeToFacelets(cubies: Cubie[]): string {
  const order = getOrder(cubies);
  const byPosition = new Map(cubies.map(cubie => [cubie.position.join(','), cubie]));
  let facelets = '';
  for (const face of FACES) for (let row = 0; row < order; row++) for (let col = 0; col < order; col++) {
    const cubie = byPosition.get(faceletPosition(face, row, col, order).join(','));
    const sticker = cubie?.stickers.find(s => sameVector(s.normal, normals[face]));
    if (!sticker) throw new Error('魔方状态缺少贴纸');
    facelets += sticker.face;
  }
  return facelets;
}

export function isSolved(cubies: Cubie[]): boolean {
  return cubies.every(cubie => cubie.stickers.every(s => sameVector(s.normal, normals[s.face])));
}

/** Legal random-move scramble, not a competition-grade random-state scramble. */
export function scramble(length = 20, random: () => number = Math.random, order = 3): Move[] {
  validateOrder(order);
  if (!Number.isInteger(length) || length < 0 || length > 1000) throw new Error('打乱长度超出范围');
  const moves: Move[] = [];
  let previousAxis: Axis | undefined;
  for (let i = 0; i < length; i++) {
    const choices = FACES.filter(face => definitions[face].axis !== previousAxis);
    const face = choices[Math.min(choices.length - 1, Math.floor(random() * choices.length))];
    const suffix = ['', "'", '2'][Math.min(2, Math.floor(random() * 3))];
    // Opposite faces cover the far half; odd orders also include the middle slice.
    const maxDepth = order >= 4 ? Math.ceil(order / 2) : 1;
    const depth = maxDepth === 1 ? 1 : 1 + Math.min(maxDepth - 1, Math.floor(random() * maxDepth));
    moves.push((depth === 1 ? '' : String(depth)) + face + suffix);
    previousAxis = definitions[face].axis;
  }
  return moves;
}
