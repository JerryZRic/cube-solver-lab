import Cube from 'cubejs';
import { applyMove, createCube, cubeToFacelets, isSolved, parseAlgorithm, type Cubie, type Face, type Vec3 } from './cube';

const FACES: Face[] = ['U', 'R', 'F', 'D', 'L', 'B'];
const CORNER_SLOTS = [0, 2, 6, 8];
const SOLVED_2 = FACES.map(face => face.repeat(4)).join('');
let initialized = false;

function parity(permutation: number[]): number {
  let inversions = 0;
  for (let i = 0; i < permutation.length; i++) for (let j = i + 1; j < permutation.length; j++) {
    if (permutation[i] > permutation[j]) inversions++;
  }
  return inversions % 2;
}

const validPermutation = (values: number[], length: number): boolean =>
  values.length === length && new Set(values).size === length &&
  values.every(value => Number.isInteger(value) && value >= 0 && value < length);

function validate2x2Facelets(facelets: string): { cp: number[]; co: number[]; cornerParity: number } {
  if (typeof facelets !== 'string' || !/^[URFDLB]{24}$/.test(facelets)) throw new Error('二阶状态须包含 24 个有效面片');
  if (FACES.some(face => [...facelets].filter(value => value === face).length !== 4)) throw new Error('二阶每种颜色须恰好有 4 个面片');
  const synthetic = [...new Cube().asString()];
  FACES.forEach((_, faceIndex) => CORNER_SLOTS.forEach((slot, cornerIndex) => {
    synthetic[faceIndex * 9 + slot] = facelets[faceIndex * 4 + cornerIndex];
  }));
  const syntheticString = synthetic.join('');
  const decoded = Cube.fromString(syntheticString);
  const { cp, co } = decoded.toJSON();
  if (!validPermutation(cp, 8)) throw new Error('二阶的 8 个角块须各出现一次');
  if (co.length !== 8 || co.some(value => !Number.isInteger(value) || value < 0 || value > 2) || co.reduce((a, b) => a + b, 0) % 3 !== 0) {
    throw new Error('二阶角块朝向不符合合法转动约束');
  }
  if (decoded.asString() !== syntheticString) throw new Error('二阶角块贴纸排列无效');
  return { cp: [...cp], co: [...co], cornerParity: parity(cp) };
}

/** Build a fresh 2×2 from current stickers alone, independent of any move history. */
export function cubeFrom2x2Facelets(facelets: string): Cubie[] {
  validate2x2Facelets(facelets);
  const cube = createCube(2);
  const byPosition = new Map(cube.map(cubie => [cubie.position.join(','), cubie]));
  const facePositions: Record<Face, Vec3[]> = {
    U: [[-1, 1, -1], [1, 1, -1], [-1, 1, 1], [1, 1, 1]],
    R: [[1, 1, 1], [1, 1, -1], [1, -1, 1], [1, -1, -1]],
    F: [[-1, 1, 1], [1, 1, 1], [-1, -1, 1], [1, -1, 1]],
    D: [[-1, -1, 1], [1, -1, 1], [-1, -1, -1], [1, -1, -1]],
    L: [[-1, 1, -1], [-1, 1, 1], [-1, -1, -1], [-1, -1, 1]],
    B: [[1, 1, -1], [-1, 1, -1], [1, -1, -1], [-1, -1, -1]],
  };
  const normals: Record<Face, Vec3> = { U: [0, 1, 0], R: [1, 0, 0], F: [0, 0, 1], D: [0, -1, 0], L: [-1, 0, 0], B: [0, 0, -1] };
  FACES.forEach((face, faceIndex) => facePositions[face].forEach((position, cornerIndex) => {
    const cubie = byPosition.get(position.join(','))!;
    const sticker = cubie.stickers.find(value => value.normal.every((n, i) => n === normals[face][i]))!;
    sticker.face = facelets[faceIndex * 4 + cornerIndex] as Face;
  }));
  if (cubeToFacelets(cube) !== facelets) throw new Error('二阶状态重建校验失败');
  return cube;
}

function virtual3x3From2x2(facelets: string): Cube {
  const { cp, co, cornerParity } = validate2x2Facelets(facelets);
  const virtualState = new Cube().toJSON();
  virtualState.cp = cp;
  virtualState.co = co;
  // A 2×2 permits odd corner parity. Match it using two VIRTUAL edges so the
  // lifted 3×3 is legal, without altering the supplied corner state at all.
  if (cornerParity === 1) [virtualState.ep[0], virtualState.ep[1]] = [virtualState.ep[1], virtualState.ep[0]];
  return new Cube(virtualState);
}

function validated3x3(facelets: string): Cube {
  if (typeof facelets !== 'string' || !/^[URFDLB]{54}$/.test(facelets)) throw new Error('无效的三阶魔方状态');
  if (FACES.some((face, i) => facelets[9 * i + 4] !== face || [...facelets].filter(value => value === face).length !== 9)) {
    throw new Error('颜色数量或中心块不正确');
  }
  const cube = Cube.fromString(facelets);
  const { cp, co, ep, eo } = cube.toJSON();
  if (!validPermutation(cp, 8) || !validPermutation(ep, 12) ||
    co.length !== 8 || co.some(value => !Number.isInteger(value) || value < 0 || value > 2) || co.reduce((a, b) => a + b, 0) % 3 !== 0 ||
    eo.length !== 12 || eo.some(value => value !== 0 && value !== 1) || eo.reduce((a, b) => a + b, 0) % 2 !== 0 ||
    parity(cp) !== parity(ep) || cube.asString() !== facelets) throw new Error('此三阶状态无法由合法转动得到');
  return cube;
}

/** State-based, non-optimal solving; synchronous work belongs inside a Worker. */
export function solveSmallCube(facelets: string, order = 3): string {
  if (order !== 2 && order !== 3) throw new Error('此求解器仅支持二阶和三阶');
  const cube = order === 2 ? virtual3x3From2x2(facelets) : validated3x3(facelets);
  if (cube.isSolved()) return '';
  if (!initialized) { Cube.initSolver(); initialized = true; }
  const algorithm = cube.solve();
  if (typeof algorithm !== 'string' || !cube.clone().move(algorithm).isSolved()) throw new Error('解法校验失败，请重试');
  if (order === 2) {
    // Independently verify the projected outer turns against the real 2×2 model.
    const moves = parseAlgorithm(algorithm, 2);
    if (moves.some(move => !/^[URFDLB][2']?$/.test(move))) throw new Error('二阶解法包含不支持的转动');
    const replay = cubeFrom2x2Facelets(facelets);
    moves.forEach(move => applyMove(replay, move));
    if (!isSolved(replay) || cubeToFacelets(replay) !== SOLVED_2) throw new Error('二阶回放校验失败，请重试');
  }
  return algorithm;
}
