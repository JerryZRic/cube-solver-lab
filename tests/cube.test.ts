import { beforeAll, describe, expect, it } from 'vitest';
import Cube from 'cubejs';
import { applyMove, createCube, cubeToFacelets, FACES, getOrder, inverseMove, isSolved, MAX_ORDER, MIN_ORDER, parseAlgorithm, parseMove, scramble } from '../src/cube';

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

describe('variable-order exact integer cube model', () => {
  it('rejects unsupported orders at every public order-taking entry point', () => {
    expect(MIN_ORDER).toBe(2);
    expect(MAX_ORDER).toBe(10);
    for (const invalid of [0, 1, -1, 11, 100, 2.5, NaN, Infinity, -Infinity, '3', null]) {
      const order = invalid as number;
      expect(() => createCube(order)).toThrow();
      expect(() => parseMove('R', order)).toThrow();
      expect(() => parseAlgorithm('', order)).toThrow();
      expect(() => scramble(20, Math.random, order)).toThrow();
    }
    expect(() => getOrder([])).toThrow();
  });

  it('parses single-slice depth separately from a half-turn suffix', () => {
    expect(parseMove('2R2', 4)).toEqual({ face: 'R', axis: 'x', layer: 1, quarters: -2, depth: 2 });
    expect(parseMove("3L'", 5)).toEqual({ face: 'L', axis: 'x', layer: 0, quarters: -1, depth: 3 });
    expect(parseMove('10B', 10)).toEqual({ face: 'B', axis: 'z', layer: 9, quarters: 1, depth: 10 });
    expect(parseAlgorithm("R 2U' 10F2", 10)).toEqual(['R', "2U'", '10F2']);
    expect(inverseMove("10R'")).toBe('10R');
    expect(inverseMove('10R')).toBe("10R'");
    expect(inverseMove('10R2')).toBe('10R2');
    for (const move of ['0R', '01R', '2.5R', '-2R', '11R', '2Rw', 'R3', '2', 'R 2']) {
      expect(() => parseMove(move, 10)).toThrow();
    }
    expect(() => parseMove('5R', 4)).toThrow();
    expect(() => applyMove(createCube(2), '3R')).toThrow();
  });

  for (let order = MIN_ORDER; order <= MAX_ORDER; order++) {
    it(`${order}×${order}: correct surface cubies, doubled coordinates, facelet count and colors`, () => {
      const state = createCube(order);
      expect(getOrder(state)).toBe(order);
      expect(state).toHaveLength(order ** 3 - (order - 2) ** 3);
      expect(new Set(state.map(cubie => cubie.id)).size).toBe(state.length);
      expect(new Set(state.map(cubie => cubie.position.join(','))).size).toBe(state.length);
      expect(state.flatMap(cubie => cubie.stickers)).toHaveLength(6 * order ** 2);
      expect(isSolved(state)).toBe(true);
      expect(cubeToFacelets(state)).toBe(FACES.map(face => face.repeat(order ** 2)).join(''));
      for (const cubie of state) {
        expect(cubie.position.every(value => Number.isInteger(value) && (value + order - 1) % 2 === 0)).toBe(true);
        expect(Math.max(...cubie.position.map(Math.abs))).toBe(order - 1);
      }
    });

    it(`${order}×${order}: every face/depth/suffix has fourth power identity and exact inverse`, () => {
      const original = JSON.stringify(createCube(order));
      for (let depth = 1; depth <= order; depth++) for (const face of FACES) for (const suffix of ['', "'", '2']) {
        const move = (depth === 1 ? '' : String(depth)) + face + suffix;
        const state = createCube(order);
        const { axis, layer } = parseMove(move, order);
        const axisNumber = { x: 0, y: 1, z: 2 }[axis];
        const untouchedBefore = JSON.stringify(state.filter(cubie => cubie.position[axisNumber] !== layer));
        applyMove(state, move);
        const untouchedAfter = JSON.stringify(state.filter(cubie => cubie.position[axisNumber] !== layer));
        expect(untouchedAfter, `${move} must not rotate adjacent slices`).toBe(untouchedBefore);
        const facelets = cubeToFacelets(state);
        for (const color of FACES) expect([...facelets].filter(face => face === color)).toHaveLength(order ** 2);
        for (let i = 1; i < 4; i++) applyMove(state, move);
        expect(JSON.stringify(state), `${move}^4`).toBe(original);
        applyMove(state, move);
        applyMove(state, inverseMove(move));
        expect(JSON.stringify(state), `${move} followed by its inverse`).toBe(original);
      }
    });

    it(`${order}×${order}: far/opposite slice notation gives the same physical turn`, () => {
      const opposites = { U: 'D', R: 'L', F: 'B', D: 'U', L: 'R', B: 'F' } as const;
      for (const face of FACES) for (let depth = 1; depth <= order; depth++) {
        const state = createCube(order);
        const reference = createCube(order);
        applyMove(state, `${depth}${face}`);
        applyMove(reference, `${order + 1 - depth}${opposites[face]}'`);
        expect(JSON.stringify(state)).toBe(JSON.stringify(reference));
      }
    });

    it(`${order}×${order}: random mixed-depth history reverses exactly, with no position drift`, () => {
      const random = seeded(0xc0ffee + order);
      const moves = Array.from({ length: 180 }, () => {
        const face = FACES[Math.floor(random() * FACES.length)];
        const depth = 1 + Math.floor(random() * order);
        return (depth === 1 ? '' : String(depth)) + face + ['', "'", '2'][Math.floor(random() * 3)];
      });
      const state = createCube(order);
      moves.forEach(move => applyMove(state, move));
      expect(getOrder(state)).toBe(order);
      expect(new Set(state.map(cubie => cubie.position.join(','))).size).toBe(state.length);
      expect(state.flatMap(cubie => [...cubie.position, ...cubie.stickers.flatMap(sticker => sticker.normal)]).every(Number.isInteger)).toBe(true);
      expect(cubeToFacelets(state)).toHaveLength(6 * order ** 2);
      moves.reverse().map(inverseMove).forEach(move => applyMove(state, move));
      expect(state).toEqual(createCube(order));
      expect(isSolved(state)).toBe(true);
    });

    it(`${order}×${order}: generated scramble is valid and non-adjacent-axis`, () => {
      const moves = scramble(100, seeded(201 + order), order);
      const state = createCube(order);
      for (let i = 0; i < moves.length; i++) {
        const parsed = parseMove(moves[i], order);
        if (i > 0) expect(parsed.axis).not.toBe(parseMove(moves[i - 1], order).axis);
        if (order <= 3) expect(parsed.depth).toBe(1);
        applyMove(state, moves[i]);
      }
      if (order >= 4) expect(moves.some(move => parseMove(move, order).depth > 1)).toBe(true);
      expect(cubeToFacelets(state)).toHaveLength(6 * order ** 2);
      moves.reverse().map(inverseMove).forEach(move => applyMove(state, move));
      expect(state).toEqual(createCube(order));
    });
  }
});
