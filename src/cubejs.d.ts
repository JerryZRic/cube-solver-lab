declare module 'cubejs' {
  interface CubeState { center: number[]; cp: number[]; co: number[]; ep: number[]; eo: number[] }
  class Cube {
    constructor(state?: Cube | Partial<CubeState>);
    static fromString(facelets: string): Cube;
    static initSolver(): void;
    static random(): Cube;
    static inverse(algorithm: string): string;
    asString(): string;
    toJSON(): CubeState;
    clone(): Cube;
    move(algorithm: string): Cube;
    solve(maxDepth?: number): string;
    isSolved(): boolean;
  }
  export default Cube;
}
