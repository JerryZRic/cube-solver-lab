import { applyMove, createCube, inverseMove, isSolved, type Cubie, type Move } from './cube';

export interface RequestToken { epoch: number; id: number }

/** Authoritative state, completed-turn history, and cancellation boundaries. */
export class CubeSession {
  cube: Cubie[];
  order: number;
  history: Move[] = [];
  epoch = 0;
  requestId = 0;

  constructor(order = 3) {
    this.cube = createCube(order);
    this.order = order;
  }

  reset(order = this.order): void {
    // Validate and build first: invalid input must not cancel or alter the session.
    const cube = createCube(order);
    this.cube = cube;
    this.order = order;
    this.history = [];
    this.epoch++;
    this.requestId++;
  }

  beginRequest(): RequestToken {
    return { epoch: this.epoch, id: ++this.requestId };
  }

  acceptsRequest(token: RequestToken): boolean {
    return token.epoch === this.epoch && token.id === this.requestId;
  }

  /** Commit only a completed animation from the still-current order/session. */
  commit(move: Move, epoch = this.epoch): boolean {
    if (epoch !== this.epoch) return false;
    applyMove(this.cube, move);
    const previous = this.history.at(-1);
    if (previous !== undefined && inverseMove(previous) === move) this.history.pop();
    else this.history.push(move);
    // A visually solved state is a new valid baseline; equivalent center/wing
    // permutations need not be preserved in an inverse-history playback.
    if (isSolved(this.cube)) this.history = [];
    return true;
  }

  /** This is recorded-history reversal, never an independent NxN solver. */
  inverseHistory(): Move[] {
    return this.history.slice().reverse().map(inverseMove);
  }
}
