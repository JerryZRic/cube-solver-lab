import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import Cube from 'cubejs';
import { applyMove, createCube, cubeToFacelets, isSolved, parseAlgorithm } from '../src/cube';

type Reply = { id: number; algorithm?: string; error?: string };
let replies: Reply[] = [];
const workerScope = {
  onmessage: (_event: { data: { id: number; facelets: string; order?: number } }) => {},
  postMessage: (reply: Reply) => { replies.push(reply); },
};
beforeAll(async () => {
  vi.stubGlobal('self', workerScope);
  await import('../src/solver.worker');
});
afterAll(() => vi.unstubAllGlobals());
async function request(id: number, facelets: string, order?: number): Promise<Reply> {
  replies = [];
  await workerScope.onmessage({ data: { id, facelets, order } });
  expect(replies).toHaveLength(1);
  expect(replies[0].id).toBe(id);
  return replies[0];
}

describe('solver worker message contract and legality checks', () => {
  it('solves current facelets and returns the matching request ID', async () => {
    const cube = new Cube().move("R U F2 D' B L2 R' F U2 L'");
    const reply = await request(17, cube.asString());
    expect(reply.error).toBeUndefined();
    expect(typeof reply.algorithm).toBe('string');
    expect(cube.move(reply.algorithm!).isSolved()).toBe(true);
  }, 30000);

  it('returns an empty solution for a solved cube', async () => {
    expect(await request(18, new Cube().asString())).toEqual({ id: 18, algorithm: '' });
  });

  it('solves explicit 2×2 requests without requiring a history field', async () => {
    const state = createCube(2);
    parseAlgorithm("R U2 F' L B2", 2).forEach(move => applyMove(state, move));
    const reply = await request(23, cubeToFacelets(state), 2);
    expect(reply.error).toBeUndefined();
    parseAlgorithm(reply.algorithm!, 2).forEach(move => applyMove(state, move));
    expect(isSolved(state)).toBe(true);
    expect(await request(24, cubeToFacelets(state), 2)).toEqual({ id: 24, algorithm: '' });
  }, 30000);

  it('rejects wrong-order and unsupported-order requests with the matching ID', async () => {
    expect((await request(25, new Cube().asString(), 2)).error).toBeTruthy();
    expect((await request(26, cubeToFacelets(createCube(2)), 3)).error).toBeTruthy();
    expect((await request(27, new Cube().asString(), 4)).error).toBeTruthy();
  });

  it('rejects malformed input, flipped edge, twisted corner, and odd parity', async () => {
    const solved = new Cube().asString();
    expect((await request(19, 'bad input')).error).toBeTruthy();
    const flipped = [...solved];
    [flipped[5], flipped[10]] = [flipped[10], flipped[5]];
    expect((await request(20, flipped.join(''))).error).toBeTruthy();
    const twisted = [...solved];
    [twisted[8], twisted[9], twisted[20]] = [twisted[9], twisted[20], twisted[8]];
    expect((await request(21, twisted.join(''))).error).toBeTruthy();
    const odd = [...solved];
    [odd[10], odd[19]] = [odd[19], odd[10]];
    expect((await request(22, odd.join(''))).error).toBeTruthy();
  });
});
