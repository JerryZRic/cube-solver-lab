import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import Cube from 'cubejs';

type Reply = { id: number; algorithm?: string; error?: string };
let replies: Reply[] = [];
const workerScope = {
  onmessage: (_event: { data: { id: number; facelets: string } }) => {},
  postMessage: (reply: Reply) => { replies.push(reply); },
};
beforeAll(async () => {
  vi.stubGlobal('self', workerScope);
  await import('../src/solver.worker');
});
afterAll(() => vi.unstubAllGlobals());
function request(id: number, facelets: string): Reply {
  replies = [];
  workerScope.onmessage({ data: { id, facelets } });
  expect(replies).toHaveLength(1);
  expect(replies[0].id).toBe(id);
  return replies[0];
}

describe('solver worker message contract and legality checks', () => {
  it('solves current facelets and returns the matching request ID', () => {
    const cube = new Cube().move("R U F2 D' B L2 R' F U2 L'");
    const reply = request(17, cube.asString());
    expect(reply.error).toBeUndefined();
    expect(typeof reply.algorithm).toBe('string');
    expect(cube.move(reply.algorithm!).isSolved()).toBe(true);
  }, 30000);

  it('returns an empty solution for a solved cube', () => {
    expect(request(18, new Cube().asString())).toEqual({ id: 18, algorithm: '' });
  });

  it('rejects malformed input, flipped edge, twisted corner, and odd parity', () => {
    const solved = new Cube().asString();
    expect(request(19, 'bad input').error).toBeTruthy();
    const flipped = [...solved];
    [flipped[5], flipped[10]] = [flipped[10], flipped[5]];
    expect(request(20, flipped.join('')).error).toBeTruthy();
    const twisted = [...solved];
    [twisted[8], twisted[9], twisted[20]] = [twisted[9], twisted[20], twisted[8]];
    expect(request(21, twisted.join('')).error).toBeTruthy();
    const odd = [...solved];
    [odd[10], odd[19]] = [odd[19], odd[10]];
    expect(request(22, odd.join('')).error).toBeTruthy();
  });
});
