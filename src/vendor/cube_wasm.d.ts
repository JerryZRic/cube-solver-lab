/* tslint:disable */
/* eslint-disable */

export class CubeLab {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Apply one quarter turn in the web UI's `{axis, layer, dir}` convention,
     * which is identical to `cube_core`'s (axes X/Y/Z = 0/1/2, layer index along
     * the axis, dir ±1 = right-hand quarter turn). Used to mirror the on-screen
     * scramble into the solver's cube so the returned solution matches exactly.
     */
    apply_design_move(axis: number, layer: number, dir: number): void;
    /**
     * Apply the `i`-th move of the stored solution to the live cube.
     */
    apply_solution_step(i: number): boolean;
    /**
     * Flat color indices (0..6) for rendering: 6 faces × dim × dim, in
     * `Face::ALL` order (Up, Down, Front, Back, Left, Right), row-major. Faces
     * larger than `sample` are down-sampled.
     */
    face_colors(sample: number): Uint8Array;
    is_solved(): boolean;
    /**
     * Replace the model from a complete sticker-state buffer in `Face::ALL`
     * order. The solver worker uses this boundary so it receives no scramble
     * history to invert—only the same colors visible to the user.
     */
    load_face_colors(colors: Uint8Array): boolean;
    constructor(n: number);
    /**
     * Visible (surface) pieces: N³ minus the hidden inner core.
     */
    piece_count(): number;
    render_dim(sample: number): number;
    reset(): void;
    /**
     * Scramble from solved with `depth` random moves; returns the count applied.
     * Reproducible for a given `seed`.
     */
    scramble(depth: number, seed: bigint): number;
    set_size(n: number): void;
    size(): number;
    solution_len(): number;
    /**
     * Run the solver on the current state and store the winning (fewest-move,
     * replay-verified) solution. 3×3 uses the two-phase solver; 4×4+ (up to
     * `MAX_REDUCTION`) uses the reduction method; other sizes use the legacy engine
     * race. Returns a JSON summary.
     */
    solve(max_depth: number, time_ms: number): string;
    solved_percent(): number;
}

/**
 * A wall of independent trials all learning to solve the same scramble by
 * mutation/crossover hill-climbing. Each member improves over `step`s; when it
 * reaches solved it flashes, counts as converged, and reseeds with a fresh
 * trial — so the grid is a live picture of evolutionary search.
 */
export class Swarm {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Mean progress (0..1) across the swarm.
     */
    avg_progress(): number;
    /**
     * Cumulative number of times a trial has reached solved since the last
     * scramble (a running tally of convergence events, not the count of
     * currently-solved members).
     */
    converged(): number;
    member_count(): number;
    constructor(count: number, n: number, scramble_depth: number, seed: bigint);
    /**
     * Render buffer: per member, 62 bytes — progress, exact mismatch (u16),
     * genome length (u16), stagnation, solved-flash, last operator, then 54
     * sampled color indices. This lets the Swarm UI visualize how each lineage
     * is learning rather than showing only a cosmetic percentage.
     */
    render(): Uint8Array;
    /**
     * Reseed the whole swarm onto a fresh scramble.
     */
    reset(): void;
    /**
     * Seed the swarm from the Studio's exact scramble (the same `{axis,layer,dir}`
     * quarter-turns), so every trial is learning to solve the very cube on
     * screen. The scramble *moves* are only used to build the start state — the
     * trials never see them, they search from the resulting sticker state.
     */
    set_scramble(axes: Uint8Array, layers: Uint32Array, dirs: Int32Array): void;
    /**
     * Number of members not yet solved.
     */
    solving_now(): number;
    /**
     * Advance every trial one learning step.
     */
    step(): void;
}

/**
 * Build the 3×3 two-phase tables ahead of the first solve. The worker calls this
 * once at startup so the first real Solve isn't slowed by the ~one-time table build.
 */
export function warm_solver(): void;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_cubelab_free: (a: number, b: number) => void;
    readonly __wbg_swarm_free: (a: number, b: number) => void;
    readonly cubelab_apply_design_move: (a: number, b: number, c: number, d: number) => void;
    readonly cubelab_apply_solution_step: (a: number, b: number) => number;
    readonly cubelab_face_colors: (a: number, b: number, c: number) => void;
    readonly cubelab_is_solved: (a: number) => number;
    readonly cubelab_load_face_colors: (a: number, b: number, c: number) => number;
    readonly cubelab_new: (a: number) => number;
    readonly cubelab_piece_count: (a: number) => number;
    readonly cubelab_render_dim: (a: number, b: number) => number;
    readonly cubelab_reset: (a: number) => void;
    readonly cubelab_scramble: (a: number, b: number, c: bigint) => number;
    readonly cubelab_set_size: (a: number, b: number) => void;
    readonly cubelab_size: (a: number) => number;
    readonly cubelab_solution_len: (a: number) => number;
    readonly cubelab_solve: (a: number, b: number, c: number, d: number) => void;
    readonly cubelab_solved_percent: (a: number) => number;
    readonly swarm_avg_progress: (a: number) => number;
    readonly swarm_converged: (a: number) => number;
    readonly swarm_member_count: (a: number) => number;
    readonly swarm_new: (a: number, b: number, c: number, d: bigint) => number;
    readonly swarm_render: (a: number, b: number) => void;
    readonly swarm_reset: (a: number) => void;
    readonly swarm_set_scramble: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
    readonly swarm_solving_now: (a: number) => number;
    readonly swarm_step: (a: number) => void;
    readonly warm_solver: () => void;
    readonly __wbindgen_export: (a: number, b: number, c: number) => void;
    readonly __wbindgen_export2: (a: number, b: number) => number;
    readonly __wbindgen_export3: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
