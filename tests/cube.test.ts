import { beforeAll, describe, expect, it } from 'vitest';
import Cube from 'cubejs';
import { applyMove, createCube, cubeToFacelets, FACES, inverseMove, isSolved, parseAlgorithm, parseMove, scramble } from '../src/cube';

function seeded(seed: number): () => number {
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
}

describe('exact integer cube model', () => {
  it('creates 26 unique cubies and 54 stickers in a solved state', () => {
    const cube = createCube();
    expect(cube).toHaveLength(26);
    expect(new Set(cube.map(c => c.id)).size).toBe(26);
    expect(cube.flatMap(c => c.stickers)).toHaveLength(54);
    expect(isSolved(cube)).toBe(true);
    expect(cubeToFacelets(cube)).toBe(new Cube().asString());
  });

  for (const face of FACES) for (const suffix of ['', "'", '2']) {
    const move = face + suffix;
    it(`${move}: matches the independent cubejs move convention`, () => {
      const state = createCube();
      applyMove(state, move);
      expect(cubeToFacelets(state)).toBe(new Cube().move(move).asString());
      expect(state.flatMap(c => [...c.position, ...c.stickers.flatMap(s => s.normal)]).every(Number.isInteger)).toBe(true);
    });
    it(`${move}: fourth power and inverse both restore the complete model`, () => {
      const original = createCube();
      const state = createCube();
      for (let i = 0; i < 4; i++) applyMove(state, move);
      expect(state).toEqual(original);
      applyMove(state, move);
      applyMove(state, inverseMove(move));
      expect(state).toEqual(original);
    });
  }

  it('matches cubejs across 2000 independent legal turns without drift', () => {
    const state = createCube();
    const reference = new Cube();
    const random = seeded(20261030);
    const moves = [...scramble(1000, random), ...scramble(1000, random)];
    for (const move of moves) { applyMove(state, move); reference.move(move); }
    expect(cubeToFacelets(state)).toBe(reference.asString());
    expect(new Set(state.map(c => c.position.join(','))).size).toBe(26);
    for (const move of moves.reverse().map(inverseMove)) applyMove(state, move);
    expect(state).toEqual(createCube());
  });

  it('scrambles avoid consecutive same-axis turns and parse strictly', () => {
    const moves = scramble(1000, seeded(7));
    expect(moves).toHaveLength(1000);
    for (let i = 1; i < moves.length; i++) expect(parseMove(moves[i]).axis).not.toBe(parseMove(moves[i - 1]).axis);
    expect(parseAlgorithm(" U  R2\nF' ")).toEqual(['U', 'R2', "F'"]);
    expect(parseAlgorithm(' ')).toEqual([]);
    expect(() => parseMove('X')).toThrow();
    expect(() => parseAlgorithm('U R3')).toThrow();
  });
});

describe('real current-state Kociemba solving', () => {
  beforeAll(() => { Cube.initSolver(); }, 30000);
  for (const seed of [1, 7, 42, 2026, 90210, 0xc0ffee]) {
    it(`solves legal scramble + extra edits, seed ${seed}, with no inverse-history solver`, () => {
      const state = createCube();
      for (const move of scramble(25, seeded(seed))) applyMove(state, move);
      // Manual moves are part of the CURRENT state, not a stored scramble to undo.
      for (const move of parseAlgorithm("R U2 F' L B2")) applyMove(state, move);
      const facelets = cubeToFacelets(state);
      const solution = Cube.fromString(facelets).solve();
      const moves = parseAlgorithm(solution);
      expect(moves.length).toBeGreaterThan(0);
      expect(Cube.fromString(facelets).move(solution).isSolved()).toBe(true);
      moves.forEach(move => applyMove(state, move));
      expect(isSolved(state)).toBe(true);
      expect(cubeToFacelets(state)).toBe(new Cube().asString());
    }, 30000);
  }
});
