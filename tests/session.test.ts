import { describe, expect, it } from 'vitest';
import { cubeToFacelets, createCube, inverseMove, isSolved, scramble } from '../src/cube';
import { CubeSession } from '../src/session';

const seeded = (initial: number): (() => number) => {
  let seed = initial;
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
};

describe('session cancellation and request isolation', () => {
  it('accepts only the latest request in the same epoch', () => {
    const session = new CubeSession();
    const first = session.beginRequest();
    expect(session.acceptsRequest(first)).toBe(true);
    const second = session.beginRequest();
    expect(session.acceptsRequest(first)).toBe(false);
    expect(session.acceptsRequest(second)).toBe(true);
    expect(second.id).toBeGreaterThan(first.id);
  });

  it('rejects late solver responses and completed turns after order switching', () => {
    const session = new CubeSession(3);
    session.commit('R');
    const oldCube = session.cube;
    const oldEpoch = session.epoch;
    const pending = session.beginRequest();
    session.reset(4);
    expect(session.order).toBe(4);
    expect(session.epoch).toBe(oldEpoch + 1);
    expect(session.acceptsRequest(pending)).toBe(false);
    expect(session.commit('U', oldEpoch)).toBe(false);
    expect(session.cube).not.toBe(oldCube);
    expect(cubeToFacelets(session.cube)).toBe(cubeToFacelets(createCube(4)));
    expect(session.history).toEqual([]);
    const fresh = session.beginRequest();
    expect(session.acceptsRequest(fresh)).toBe(true);
    expect(session.commit('2R')).toBe(true);
    expect(isSolved(session.cube)).toBe(false);
  });

  it('invalidates the same-order reset and cannot resurrect an earlier epoch', () => {
    const session = new CubeSession(5);
    session.commit('2F');
    const epoch = session.epoch;
    const request = session.beginRequest();
    session.reset();
    session.reset(2);
    session.reset(5);
    expect(session.order).toBe(5);
    expect(session.commit("2F'", epoch)).toBe(false);
    expect(session.acceptsRequest(request)).toBe(false);
    expect(isSolved(session.cube)).toBe(true);
  });

  it.each([1, 11, 2.5, NaN, Infinity])('rejects invalid order %s without changing a live session', (order) => {
    const session = new CubeSession(4);
    session.commit('2R');
    const token = session.beginRequest();
    const cube = session.cube;
    const facelets = cubeToFacelets(cube);
    const history = [...session.history];
    expect(() => session.reset(order)).toThrow();
    expect(session.cube).toBe(cube);
    expect(cubeToFacelets(session.cube)).toBe(facelets);
    expect(session.order).toBe(4);
    expect(session.history).toEqual(history);
    expect(session.acceptsRequest(token)).toBe(true);
  });

  it('invalid moves do not enter completed history or change state', () => {
    const session = new CubeSession(4);
    const before = cubeToFacelets(session.cube);
    expect(() => session.commit('5R')).toThrow();
    expect(session.history).toEqual([]);
    expect(cubeToFacelets(session.cube)).toBe(before);
  });
});

describe('truthful recorded-history reversal', () => {
  for (let order = 2; order <= 10; order++) {
    it(`${order}×${order}: reverses scramble, manual edits, and partial playback`, () => {
      const session = new CubeSession(order);
      const original = cubeToFacelets(session.cube);
      for (const move of scramble(30, seeded(10_000 + order), order)) session.commit(move);
      session.commit('R');
      session.commit('U2');
      if (order >= 4) { session.commit('2F'); session.commit(`${order - 1}L'`); }
      const planned = session.inverseHistory();
      expect(planned.length).toBeGreaterThan(0);
      const historyBefore = [...session.history];
      // Reading the reverse plan must not mutate the underlying history.
      expect(session.history).toEqual(historyBefore);
      // A partial inverse playback, a reverse step, and another manual edit all
      // become part of the CURRENT history, not merely the original scramble.
      const played = planned.slice(0, 4);
      for (const move of played) session.commit(move);
      session.commit(inverseMove(played.at(-1)!));
      session.commit('B');
      for (const move of session.inverseHistory()) session.commit(move);
      expect(isSolved(session.cube)).toBe(true);
      expect(cubeToFacelets(session.cube)).toBe(original);
      expect(session.history).toEqual([]);
    });
  }

  it('compacts adjacent inverses but does not drop unrelated manual turns', () => {
    const session = new CubeSession(4);
    session.commit('R');
    session.commit('2U');
    session.commit("2U'");
    expect(session.history).toEqual(['R']);
    session.commit('F2');
    session.commit('F2');
    expect(session.history).toEqual(['R']);
    session.commit("R'");
    expect(session.history).toEqual([]);
  });

  it('clears history at a solved baseline even without pairwise cancellation', () => {
    const session = new CubeSession(4);
    for (let i = 0; i < 4; i++) session.commit('2R');
    expect(isSolved(session.cube)).toBe(true);
    expect(session.history).toEqual([]);
    expect(session.inverseHistory()).toEqual([]);
  });
});
