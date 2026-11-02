/** Original adapter for AdamNolle/Cube-Solver's public sticker/move ABI. */
import type { Move } from './cube';
const FACE_ORDER = 'URFDLB';
const UPSTREAM_FACE_ORDER = 'UDFBLR';
const COLORS: Record<string, number> = { U: 0, D: 1, F: 2, B: 3, L: 4, R: 5 };
export interface ReductionMove { axis: number; layer: number; dir: number }
export function toReductionColors(facelets: string, order: number): Uint8Array {
  if (order !== 4 && order !== 5) throw new Error('降阶求解仅支持 4 / 5 阶');
  const size = order * order;
  if (typeof facelets !== 'string' || facelets.length !== 6 * size || !/^[URFDLB]+$/.test(facelets)) throw new Error('贴纸状态格式错误');
  for (const face of FACE_ORDER) if ([...facelets].filter(x => x === face).length !== size) throw new Error('贴纸颜色数量错误');
  return new Uint8Array([...UPSTREAM_FACE_ORDER].flatMap(face => [...facelets.slice(FACE_ORDER.indexOf(face) * size, (FACE_ORDER.indexOf(face) + 1) * size)].map(color => COLORS[color])));
}
export function fromReductionMoves(moves: unknown, order: number): Move[] {
  if ((order !== 4 && order !== 5) || !Array.isArray(moves) || moves.length > 100000) throw new Error('求解步骤格式错误');
  const result: {base: string; amount: number}[] = [];
  for (const move of moves) {
    if (!move || typeof move !== 'object') throw new Error('求解步骤格式错误');
    const {axis, layer, dir} = move as ReductionMove;
    if (!Number.isInteger(axis) || axis < 0 || axis > 2 || !Number.isInteger(layer) || layer < 0 || layer >= order || (dir !== 1 && dir !== -1)) throw new Error('求解步骤超出范围');
    const positive = layer >= Math.floor(order / 2), face = (positive ? 'RUF' : 'LDB')[axis];
    const depth = positive ? order - layer : layer + 1;
    const base = (depth === 1 ? '' : String(depth)) + face;
    const amount = dir === (positive ? -1 : 1) ? 1 : 3;
    const previous = result.at(-1);
    if (previous?.base === base) { previous.amount = (previous.amount + amount) % 4; if (previous.amount === 0) result.pop(); }
    else result.push({base, amount});
  }
  return result.map(({base, amount}) => base + (amount === 2 ? '2' : amount === 3 ? "'" : '')) as Move[];
}
