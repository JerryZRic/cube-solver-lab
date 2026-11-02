import { describe, expect, it, vi } from 'vitest';
import Cube from 'cubejs';
import { applyMove, createCube, cubeToFacelets, isSolved, parseAlgorithm, scramble } from '../src/cube';
import { cubeFrom2x2Facelets, solveSmallCube } from '../src/small-solver';

function seeded(seed: number): () => number {
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
}
const corners = (facelets: string): string => Array.from({ length: 6 }, (_, face) => [0, 2, 6, 8].map(slot => facelets[face * 9 + slot]).join('')).join('');
const solved2 = 'UUUURRRRFFFFDDDDLLLLBBBB';

function verify2(facelets: string): void {
  const algorithm = solveSmallCube(facelets, 2);
  const state = cubeFrom2x2Facelets(facelets);
  expect(cubeToFacelets(state)).toBe(facelets);
  const moves = parseAlgorithm(algorithm, 2);
  expect(moves.every(move => /^[URFDLB][2']?$/.test(move))).toBe(true);
  moves.forEach(move => applyMove(state, move));
  expect(isSolved(state)).toBe(true);
  expect(cubeToFacelets(state)).toBe(solved2);
}

describe('history-independent small-cube solver', () => {
  it('returns empty algorithms for already solved 2×2 and 3×3 states', () => {
    expect(solveSmallCube(solved2, 2)).toBe('');
    expect(solveSmallCube(new Cube().asString(), 3)).toBe('');
    expect(solveSmallCube(new Cube().asString())).toBe('');
  });

  it('solves an odd corner permutation by adjusting virtual edges only', () => {
    const state = new Cube().toJSON();
    [state.cp[0], state.cp[1]] = [state.cp[1], state.cp[0]];
    verify2(corners(new Cube(state).asString()));
  }, 30000);

  for (let seed = 1; seed <= 24; seed++) {
    it(`solves arbitrary corner-state fixture ${seed} with no move-history input`, () => {
      // Cube.random constructs a cubie-state fixture, not a scramble history.
      const random = vi.spyOn(Math, 'random').mockImplementation(seeded(seed * 1021));
      let facelets: string;
      try { facelets = corners(Cube.random().asString()); } finally { random.mockRestore(); }
      verify2(facelets);
    }, 30000);
  }

  for (const seed of [11, 29, 101, 2081]) {
    it(`solves current 2×2 model state after scramble and extra edits, seed ${seed}`, () => {
      const state = createCube(2);
      [...scramble(30, seeded(seed), 2), ...parseAlgorithm("R U2 F' L B2", 2)].forEach(move => applyMove(state, move));
      const algorithm = solveSmallCube(cubeToFacelets(state), 2);
      parseAlgorithm(algorithm, 2).forEach(move => applyMove(state, move));
      expect(isSolved(state)).toBe(true);
    }, 30000);
  }

  it('rejects malformed 2×2 states, a twist, a mirrored corner, and duplicates with valid color counts', () => {
    const twisted = [...solved2];
    [twisted[3], twisted[4], twisted[9]] = [twisted[4], twisted[9], twisted[3]];
    const mirrored = [...solved2];
    [mirrored[4], mirrored[9]] = [mirrored[9], mirrored[4]];
    const duplicateState = new Cube().toJSON();
    duplicateState.cp = [0, 0, 2, 3, 4, 5, 6, 6];
    for (const invalid of ['URFDLB', 'X' + solved2.slice(1), 'R' + solved2.slice(1), twisted.join(''), mirrored.join(''), corners(new Cube(duplicateState).asString())]) {
      expect(() => solveSmallCube(invalid, 2)).toThrow();
      expect(() => cubeFrom2x2Facelets(invalid)).toThrow();
    }
  });

  it('preserves 3×3 state-based solving and strict legality checks', () => {
    const original = new Cube().move("R U F2 D' B L2 R' U2 B2");
    expect(original.clone().move(solveSmallCube(original.asString(), 3)).isSolved()).toBe(true);
    const solved = new Cube().asString();
    const edgeFlip = [...solved];
    [edgeFlip[5], edgeFlip[10]] = [edgeFlip[10], edgeFlip[5]];
    const twist = [...solved];
    [twist[8], twist[9], twist[20]] = [twist[9], twist[20], twist[8]];
    const oddParity = [...solved];
    [oddParity[10], oddParity[19]] = [oddParity[19], oddParity[10]];
    for (const invalid of [solved2, edgeFlip.join(''), twist.join(''), oddParity.join('')]) expect(() => solveSmallCube(invalid, 3)).toThrow();
  }, 30000);

  it('rejects mismatched facelet order and unsupported orders instead of silently falling back', () => {
    expect(() => solveSmallCube(new Cube().asString(), 2)).toThrow();
    expect(() => solveSmallCube(solved2, 3)).toThrow();
    for (const order of [0, 1, 4, 5, 10, NaN, Infinity, 2.5]) expect(() => solveSmallCube(solved2, order)).toThrow();
  });
});
