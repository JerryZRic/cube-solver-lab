/** The authoritative cube is integer-valued; rendering never feeds back into it. */
export type Face = 'U' | 'R' | 'F' | 'D' | 'L' | 'B';
export type Move = string;
export type Vec3 = [number, number, number];
export type Axis = 'x' | 'y' | 'z';
export interface Sticker { normal: Vec3; face: Face }
export interface Cubie { id: string; position: Vec3; stickers: Sticker[] }
export interface ParsedMove { face: Face; axis: Axis; layer: 1 | -1; quarters: number }

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

export function createCube(): Cubie[] {
  const cubies: Cubie[] = [];
  for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) {
    if (x === 0 && y === 0 && z === 0) continue;
    const position: Vec3 = [x, y, z];
    cubies.push({ id: `${x},${y},${z}`, position, stickers: FACES
      .filter(face => position[axisIndex(definitions[face].axis)] === definitions[face].layer)
      .map(face => ({ face, normal: [...normals[face]] as Vec3 })) });
  }
  return cubies;
}

export function parseMove(move: Move): ParsedMove {
  const match = /^([URFDLB])([2']?)$/.exec(move);
  if (!match) throw new Error(`不支持的转动记号：${move}`);
  const face = match[1] as Face;
  const { axis, layer } = definitions[face];
  // Clockwise is viewed from outside the named face, toward the cube's center.
  const amount = match[2] === '2' ? 2 : match[2] === "'" ? -1 : 1;
  return { face, axis, layer, quarters: -layer * amount };
}

export function parseAlgorithm(algorithm: string): Move[] {
  const text = algorithm.trim();
  if (!text) return [];
  const moves = text.split(/\s+/);
  moves.forEach(parseMove);
  return moves;
}

function rotateQuarter([x, y, z]: Vec3, axis: Axis): Vec3 {
  // +90° right-hand rotation, with no floating-point trigonometry.
  if (axis === 'x') return [x, -z || 0, y];
  if (axis === 'y') return [z, y, -x || 0];
  return [-y || 0, x, z];
}

export function applyMove(cubies: Cubie[], move: Move): void {
  const { axis, layer, quarters } = parseMove(move);
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
  parseMove(move);
  return move.endsWith('2') ? move : move.endsWith("'") ? move[0] : `${move}'`;
}

/** URFDLB facelet order used by cubejs and the Kociemba solver. */
function faceletPosition(face: Face, row: number, col: number): Vec3 {
  if (face === 'U') return [col - 1, 1, row - 1];
  if (face === 'R') return [1, 1 - row, 1 - col];
  if (face === 'F') return [col - 1, 1 - row, 1];
  if (face === 'D') return [col - 1, -1, 1 - row];
  if (face === 'L') return [-1, 1 - row, col - 1];
  return [1 - col, 1 - row, -1];
}

const sameVector = (a: Vec3, b: Vec3): boolean => a.every((n, i) => n === b[i]);

export function cubeToFacelets(cubies: Cubie[]): string {
  const byPosition = new Map(cubies.map(cubie => [cubie.position.join(','), cubie]));
  let facelets = '';
  for (const face of FACES) for (let row = 0; row < 3; row++) for (let col = 0; col < 3; col++) {
    const cubie = byPosition.get(faceletPosition(face, row, col).join(','));
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
export function scramble(length = 20, random: () => number = Math.random): Move[] {
  if (!Number.isInteger(length) || length < 0 || length > 1000) throw new Error('打乱长度超出范围');
  const moves: Move[] = [];
  let previousAxis: Axis | undefined;
  for (let i = 0; i < length; i++) {
    const choices = FACES.filter(face => definitions[face].axis !== previousAxis);
    const face = choices[Math.min(choices.length - 1, Math.floor(random() * choices.length))];
    const suffix = ['', "'", '2'][Math.min(2, Math.floor(random() * 3))];
    moves.push(face + suffix);
    previousAxis = definitions[face].axis;
  }
  return moves;
}
