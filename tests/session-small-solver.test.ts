import { describe, expect, it } from 'vitest';
import { applyMove, createCube, cubeToFacelets, inverseMove, isSolved, parseAlgorithm, scramble } from '../src/cube';
import { CubeSession, type RequestToken } from '../src/session';
import { solveSmallCube } from '../src/small-solver';

function seeded(initial: number): () => number {
  let seed = initial;
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
}

function importedSession(order: 2 | 3, seed: number): CubeSession {
  const session = new CubeSession(order);
  // Simulate a state received without its generating history. Deliberately do
  // not use session.commit: independent solving must not need that history.
  for (const move of scramble(23, seeded(seed), order)) applyMove(session.cube, move);
  for (const move of ['R', 'U2', "F'"]) applyMove(session.cube, move);
  expect(session.history).toEqual([]);
  expect(isSolved(session.cube)).toBe(false);
  return session;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(accept => { resolve = accept; });
  return { promise, resolve };
}

function acceptPlayback(session: CubeSession, token: RequestToken, algorithm: string): boolean {
  if (!session.acceptsRequest(token)) return false;
  for (const move of parseAlgorithm(algorithm, session.order)) {
    if (!session.commit(move, token.epoch)) return false;
  }
  return true;
}

describe('2×2 independent solving integrated with session boundaries', () => {
  for (const seed of [17, 1024, 20261030]) {
    it(`solves imported current 2×2 state without history, seed ${seed}`, () => {
      const session = importedSession(2, seed);
      expect(session.inverseHistory()).toEqual([]);
      const initialFacelets = cubeToFacelets(session.cube);
      const token = session.beginRequest();
      const algorithm = solveSmallCube(initialFacelets, 2);
      const moves = parseAlgorithm(algorithm, 2);
      expect(moves.length).toBeGreaterThan(0);
      expect(session.history).toEqual([]);
      expect(cubeToFacelets(session.cube)).toBe(initialFacelets);
      expect(acceptPlayback(session, token, algorithm)).toBe(true);
      expect(isSolved(session.cube)).toBe(true);
      expect(cubeToFacelets(session.cube)).toBe(cubeToFacelets(createCube(2)));
      expect(session.history).toEqual([]);
    }, 30_000);
  }

  it('can independently re-solve after partial playback, backward step, and new manual edits', () => {
    const session = importedSession(2, 77);
    const initial = parseAlgorithm(solveSmallCube(cubeToFacelets(session.cube), 2), 2);
    const played = initial.slice(0, Math.min(3, initial.length));
    for (const move of played) session.commit(move);
    session.commit(inverseMove(played.at(-1)!));
    session.commit('B2');
    session.commit('R');
    // Discarding all recorded operations cannot affect the solver's answer.
    session.history = [];
    const token = session.beginRequest();
    expect(acceptPlayback(session, token, solveSmallCube(cubeToFacelets(session.cube), 2))).toBe(true);
    expect(cubeToFacelets(session.cube)).toBe(cubeToFacelets(createCube(2)));
  }, 30_000);

  it('ignores a delayed 2×2 response after switching to a live 3×3 request', async () => {
    const session = importedSession(2, 8);
    const oldToken = session.beginRequest();
    const oldAnswer = solveSmallCube(cubeToFacelets(session.cube), 2);
    const response = deferred<string>();
    const pendingAcceptance = response.promise.then(algorithm => acceptPlayback(session, oldToken, algorithm));

    session.reset(3);
    session.commit('R');
    session.commit('F2');
    const currentToken = session.beginRequest();
    const currentState = cubeToFacelets(session.cube);
    const currentHistory = [...session.history];
    response.resolve(oldAnswer);
    expect(await pendingAcceptance).toBe(false);
    expect(session.order).toBe(3);
    expect(cubeToFacelets(session.cube)).toBe(currentState);
    expect(session.history).toEqual(currentHistory);
    expect(session.acceptsRequest(currentToken)).toBe(true);
    expect(acceptPlayback(session, currentToken, solveSmallCube(currentState, 3))).toBe(true);
    expect(isSolved(session.cube)).toBe(true);
  }, 30_000);

  it('does not revive an earlier 2×2 response or animation after 2→3→2 switching', async () => {
    const session = importedSession(2, 91);
    const oldToken = session.beginRequest();
    const oldAnswer = solveSmallCube(cubeToFacelets(session.cube), 2);
    const oldMove = parseAlgorithm(oldAnswer, 2)[0];
    const response = deferred<string>();
    const pendingAcceptance = response.promise.then(algorithm => acceptPlayback(session, oldToken, algorithm));
    session.reset(3);
    session.reset(2);
    session.commit('U');
    const freshState = cubeToFacelets(session.cube);
    const freshToken = session.beginRequest();
    expect(session.commit(oldMove, oldToken.epoch)).toBe(false);
    response.resolve(oldAnswer);
    expect(await pendingAcceptance).toBe(false);
    expect(cubeToFacelets(session.cube)).toBe(freshState);
    expect(session.acceptsRequest(freshToken)).toBe(true);
  }, 30_000);

  it('rejects out-of-order repeated 2×2 requests and a response arriving after reset', async () => {
    const session = importedSession(2, 42);
    const firstToken = session.beginRequest();
    const answer = solveSmallCube(cubeToFacelets(session.cube), 2);
    const first = deferred<string>();
    const second = deferred<string>();
    const secondToken = session.beginRequest();
    const firstAcceptance = first.promise.then(algorithm => acceptPlayback(session, firstToken, algorithm));
    const secondAcceptance = second.promise.then(algorithm => acceptPlayback(session, secondToken, algorithm));
    const before = cubeToFacelets(session.cube);
    first.resolve(answer);
    expect(await firstAcceptance).toBe(false);
    expect(cubeToFacelets(session.cube)).toBe(before);
    second.resolve(answer);
    expect(await secondAcceptance).toBe(true);
    expect(isSolved(session.cube)).toBe(true);

    session.commit('R');
    const afterReset = deferred<string>();
    const resetToken = session.beginRequest();
    const resetAnswer = solveSmallCube(cubeToFacelets(session.cube), 2);
    const afterResetAcceptance = afterReset.promise.then(algorithm => acceptPlayback(session, resetToken, algorithm));
    session.reset();
    afterReset.resolve(resetAnswer);
    expect(await afterResetAcceptance).toBe(false);
    expect(cubeToFacelets(session.cube)).toBe(cubeToFacelets(createCube(2)));
    expect(session.history).toEqual([]);
  }, 30_000);
});
