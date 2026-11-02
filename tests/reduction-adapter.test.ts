import { describe, expect, it } from 'vitest';
import { applyMove, createCube, cubeToFacelets, type Cubie, type Vec3 } from '../src/cube';
import { fromReductionMoves, toReductionColors, type ReductionMove } from '../src/reduction-adapter';

// Independent direct right-hand rotation reference: it does not use the adapter,
// parseMove, or the app's quarter-turn implementation to derive expected results.
function referenceTurn(cube: Cubie[], order: number, { axis, layer, dir }: ReductionMove): void {
  const rotate = (v: Vec3): Vec3 => {
    const [x, y, z] = v;
    if (axis === 0) return [x, -dir * z || 0, dir * y || 0];
    if (axis === 1) return [dir * z || 0, y, -dir * x || 0];
    return [-dir * y || 0, dir * x || 0, z];
  };
  for (const cubie of cube) if (cubie.position[axis] === 2 * layer - (order - 1)) {
    cubie.position = rotate(cubie.position);
    for (const sticker of cubie.stickers) sticker.normal = rotate(sticker.normal);
  }
}

function mixedState(order: number): Cubie[] {
  const cube = createCube(order);
  for (const move of ['R', "2U'", 'F2', '2B', "L'", ...(order === 5 ? ['3R', '3F2'] : [])]) applyMove(cube, move);
  return cube;
}

describe('reduction sticker-state adapter', () => {
  for (const order of [4, 5]) {
    it(`${order}: emits exact U D F B L R solved face blocks and palette values`, () => {
      const colors = toReductionColors(cubeToFacelets(createCube(order)), order);
      expect(colors).toBeInstanceOf(Uint8Array);
      expect(Array.from(colors)).toEqual([0, 1, 2, 3, 4, 5].flatMap(color => Array(order * order).fill(color)));
    });
    it(`${order}: preserves every row-major cell while reordering a mixed state`, () => {
      const input = cubeToFacelets(mixedState(order));
      const output = toReductionColors(input, order);
      const mapping: Record<string, number> = { U: 0, R: 5, F: 2, D: 1, L: 4, B: 3 };
      const blockIndices = [0, 3, 2, 5, 4, 1];
      const size = order * order;
      for (let face = 0; face < 6; face++) for (let cell = 0; cell < size; cell++) {
        expect(output[face * size + cell]).toBe(mapping[input[blockIndices[face] * size + cell]]);
      }
      expect(cubeToFacelets(mixedState(order))).toBe(input);
    });
    it(`${order}: rejects wrong length, invalid symbols, and unbalanced colors`, () => {
      const solved = cubeToFacelets(createCube(order));
      for (const bad of ['', solved.slice(1), solved + 'U', 'X' + solved.slice(1), 'u' + solved.slice(1), 'R' + solved.slice(1)]) {
        expect(() => toReductionColors(bad, order)).toThrow();
      }
      for (const bad of [null, undefined, 6, {}, new Uint8Array(solved.length)]) {
        expect(() => toReductionColors(bad as unknown as string, order)).toThrow();
      }
    });
  }
  it.each([0, 2, 3, 6, 10, 4.5, NaN, Infinity, '4', null])('rejects unsupported order %s', order => {
    expect(() => toReductionColors(cubeToFacelets(createCube(4)), order as number)).toThrow();
    expect(() => fromReductionMoves([], order as number)).toThrow();
  });
});

describe('reduction single-slice move adapter', () => {
  for (const order of [4, 5]) for (const axis of [0, 1, 2]) for (let layer = 0; layer < order; layer++) for (const dir of [-1, 1]) {
    it(`${order}: axis ${axis}, layer ${layer}, dir ${dir} matches independent rotation`, () => {
      const source = mixedState(order);
      const expected = structuredClone(source);
      const move = { axis, layer, dir };
      referenceTurn(expected, order, move);
      const converted = fromReductionMoves([move], order);
      expect(converted).toHaveLength(1);
      for (const step of converted) applyMove(source, step);
      expect(source).toEqual(expected);
      expect(cubeToFacelets(source)).toBe(cubeToFacelets(expected));
    });
  }
  for (const order of [4, 5]) {
    it(`${order}: folds half turns, inverses and complete turns without mutating input`, () => {
      const r = { axis: 0, layer: order - 1, dir: -1 };
      const ri = { ...r, dir: 1 };
      const u = { axis: 1, layer: order - 1, dir: -1 };
      expect(fromReductionMoves([], order)).toEqual([]);
      expect(fromReductionMoves([r, r], order)).toEqual(['R2']);
      expect(fromReductionMoves([ri, ri], order)).toEqual(['R2']);
      expect(fromReductionMoves([r, r, r], order)).toEqual(["R'"]);
      expect(fromReductionMoves([r, ri], order)).toEqual([]);
      expect(fromReductionMoves([r, r, r, r], order)).toEqual([]);
      const input = [r, u, { ...u, dir: 1 }, ri];
      const saved = structuredClone(input);
      expect(fromReductionMoves(input, order)).toEqual([]);
      expect(input).toEqual(saved);
    });
    it(`${order}: preserves noncommuting turns and distinct parallel slices`, () => {
      const moves = [
        { axis: 0, layer: order - 1, dir: -1 },
        { axis: 1, layer: order - 1, dir: -1 },
        { axis: 0, layer: order - 1, dir: 1 },
        { axis: 0, layer: order - 2, dir: -1 },
      ];
      expect(fromReductionMoves(moves, order)).toEqual(['R', 'U', "R'", '2R']);
      const expected = mixedState(order), actual = structuredClone(expected);
      for (const move of moves) referenceTurn(expected, order, move);
      for (const move of fromReductionMoves(moves, order)) applyMove(actual, move);
      expect(actual).toEqual(expected);
    });
    it(`${order}: rejects malformed move fields and out-of-range values`, () => {
      const valid = { axis: 0, layer: 0, dir: 1 };
      for (const bad of [null, undefined, true, 1, 'R', {}, [],
        ...[-1, 3, 0.5, NaN, Infinity, '0', null].map(axis => ({ ...valid, axis })),
        ...[-1, order, 0.5, NaN, Infinity, '0', null].map(layer => ({ ...valid, layer })),
        ...[0, 2, -2, 0.5, NaN, Infinity, '1', null].map(dir => ({ ...valid, dir })),
      ]) expect(() => fromReductionMoves([bad], order)).toThrow();
      for (const bad of [null, undefined, {}, 'R', new Uint8Array(3), Array(100001).fill(valid)]) {
        expect(() => fromReductionMoves(bad, order)).toThrow();
      }
    });
  }
});
