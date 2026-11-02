/* @ts-self-types="./cube_wasm.d.ts" */

export class CubeLab {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        CubeLabFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_cubelab_free(ptr, 0);
    }
    /**
     * Apply one quarter turn in the web UI's `{axis, layer, dir}` convention,
     * which is identical to `cube_core`'s (axes X/Y/Z = 0/1/2, layer index along
     * the axis, dir ±1 = right-hand quarter turn). Used to mirror the on-screen
     * scramble into the solver's cube so the returned solution matches exactly.
     * @param {number} axis
     * @param {number} layer
     * @param {number} dir
     */
    apply_design_move(axis, layer, dir) {
        wasm.cubelab_apply_design_move(this.__wbg_ptr, axis, layer, dir);
    }
    /**
     * Apply the `i`-th move of the stored solution to the live cube.
     * @param {number} i
     * @returns {boolean}
     */
    apply_solution_step(i) {
        const ret = wasm.cubelab_apply_solution_step(this.__wbg_ptr, i);
        return ret !== 0;
    }
    /**
     * Flat color indices (0..6) for rendering: 6 faces × dim × dim, in
     * `Face::ALL` order (Up, Down, Front, Back, Left, Right), row-major. Faces
     * larger than `sample` are down-sampled.
     * @param {number} sample
     * @returns {Uint8Array}
     */
    face_colors(sample) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.cubelab_face_colors(retptr, this.__wbg_ptr, sample);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var v1 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export(r0, r1 * 1, 1);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * @returns {boolean}
     */
    is_solved() {
        const ret = wasm.cubelab_is_solved(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Replace the model from a complete sticker-state buffer in `Face::ALL`
     * order. The solver worker uses this boundary so it receives no scramble
     * history to invert—only the same colors visible to the user.
     * @param {Uint8Array} colors
     * @returns {boolean}
     */
    load_face_colors(colors) {
        const ptr0 = passArray8ToWasm0(colors, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.cubelab_load_face_colors(this.__wbg_ptr, ptr0, len0);
        return ret !== 0;
    }
    /**
     * @param {number} n
     */
    constructor(n) {
        const ret = wasm.cubelab_new(n);
        this.__wbg_ptr = ret;
        CubeLabFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Visible (surface) pieces: N³ minus the hidden inner core.
     * @returns {number}
     */
    piece_count() {
        const ret = wasm.cubelab_piece_count(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {number} sample
     * @returns {number}
     */
    render_dim(sample) {
        const ret = wasm.cubelab_render_dim(this.__wbg_ptr, sample);
        return ret >>> 0;
    }
    reset() {
        wasm.cubelab_reset(this.__wbg_ptr);
    }
    /**
     * Scramble from solved with `depth` random moves; returns the count applied.
     * Reproducible for a given `seed`.
     * @param {number} depth
     * @param {bigint} seed
     * @returns {number}
     */
    scramble(depth, seed) {
        const ret = wasm.cubelab_scramble(this.__wbg_ptr, depth, seed);
        return ret >>> 0;
    }
    /**
     * @param {number} n
     */
    set_size(n) {
        wasm.cubelab_set_size(this.__wbg_ptr, n);
    }
    /**
     * @returns {number}
     */
    size() {
        const ret = wasm.cubelab_size(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    solution_len() {
        const ret = wasm.cubelab_solution_len(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Run the solver on the current state and store the winning (fewest-move,
     * replay-verified) solution. 3×3 uses the two-phase solver; 4×4+ (up to
     * `MAX_REDUCTION`) uses the reduction method; other sizes use the legacy engine
     * race. Returns a JSON summary.
     * @param {number} max_depth
     * @param {number} time_ms
     * @returns {string}
     */
    solve(max_depth, time_ms) {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.cubelab_solve(retptr, this.__wbg_ptr, max_depth, time_ms);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {number}
     */
    solved_percent() {
        const ret = wasm.cubelab_solved_percent(this.__wbg_ptr);
        return ret;
    }
}
if (Symbol.dispose) CubeLab.prototype[Symbol.dispose] = CubeLab.prototype.free;

/**
 * A wall of independent trials all learning to solve the same scramble by
 * mutation/crossover hill-climbing. Each member improves over `step`s; when it
 * reaches solved it flashes, counts as converged, and reseeds with a fresh
 * trial — so the grid is a live picture of evolutionary search.
 */
export class Swarm {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        SwarmFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_swarm_free(ptr, 0);
    }
    /**
     * Mean progress (0..1) across the swarm.
     * @returns {number}
     */
    avg_progress() {
        const ret = wasm.swarm_avg_progress(this.__wbg_ptr);
        return ret;
    }
    /**
     * Cumulative number of times a trial has reached solved since the last
     * scramble (a running tally of convergence events, not the count of
     * currently-solved members).
     * @returns {number}
     */
    converged() {
        const ret = wasm.swarm_converged(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    member_count() {
        const ret = wasm.swarm_member_count(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {number} count
     * @param {number} n
     * @param {number} scramble_depth
     * @param {bigint} seed
     */
    constructor(count, n, scramble_depth, seed) {
        const ret = wasm.swarm_new(count, n, scramble_depth, seed);
        this.__wbg_ptr = ret;
        SwarmFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Render buffer: per member, 62 bytes — progress, exact mismatch (u16),
     * genome length (u16), stagnation, solved-flash, last operator, then 54
     * sampled color indices. This lets the Swarm UI visualize how each lineage
     * is learning rather than showing only a cosmetic percentage.
     * @returns {Uint8Array}
     */
    render() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.swarm_render(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var v1 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export(r0, r1 * 1, 1);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Reseed the whole swarm onto a fresh scramble.
     */
    reset() {
        wasm.swarm_reset(this.__wbg_ptr);
    }
    /**
     * Seed the swarm from the Studio's exact scramble (the same `{axis,layer,dir}`
     * quarter-turns), so every trial is learning to solve the very cube on
     * screen. The scramble *moves* are only used to build the start state — the
     * trials never see them, they search from the resulting sticker state.
     * @param {Uint8Array} axes
     * @param {Uint32Array} layers
     * @param {Int32Array} dirs
     */
    set_scramble(axes, layers, dirs) {
        const ptr0 = passArray8ToWasm0(axes, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray32ToWasm0(layers, wasm.__wbindgen_export2);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passArray32ToWasm0(dirs, wasm.__wbindgen_export2);
        const len2 = WASM_VECTOR_LEN;
        wasm.swarm_set_scramble(this.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2);
    }
    /**
     * Number of members not yet solved.
     * @returns {number}
     */
    solving_now() {
        const ret = wasm.swarm_solving_now(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Advance every trial one learning step.
     */
    step() {
        wasm.swarm_step(this.__wbg_ptr);
    }
}
if (Symbol.dispose) Swarm.prototype[Symbol.dispose] = Swarm.prototype.free;

/**
 * Build the 3×3 two-phase tables ahead of the first solve. The worker calls this
 * once at startup so the first real Solve isn't slowed by the ~one-time table build.
 */
export function warm_solver() {
    wasm.warm_solver();
}
function __wbg_get_imports() {
    const import0 = {
        __proto__: null,
        __wbg___wbindgen_is_undefined_721f8decd50c87a3: function(arg0) {
            const ret = getObject(arg0) === undefined;
            return ret;
        },
        __wbg___wbindgen_throw_ea4887a5f8f9a9db: function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        },
        __wbg_error_a6fa202b58aa1cd3: function(arg0, arg1) {
            let deferred0_0;
            let deferred0_1;
            try {
                deferred0_0 = arg0;
                deferred0_1 = arg1;
                console.error(getStringFromWasm0(arg0, arg1));
            } finally {
                wasm.__wbindgen_export(deferred0_0, deferred0_1, 1);
            }
        },
        __wbg_new_227d7c05414eb861: function() {
            const ret = new Error();
            return addHeapObject(ret);
        },
        __wbg_now_e7c6795a7f81e10f: function(arg0) {
            const ret = getObject(arg0).now();
            return ret;
        },
        __wbg_performance_3fcf6e32a7e1ed0a: function(arg0) {
            const ret = getObject(arg0).performance;
            return addHeapObject(ret);
        },
        __wbg_stack_3b0d974bbf31e44f: function(arg0, arg1) {
            const ret = getObject(arg1).stack;
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_export2, wasm.__wbindgen_export3);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg_static_accessor_GLOBAL_THIS_2fee5048bcca5938: function() {
            const ret = typeof globalThis === 'undefined' ? null : globalThis;
            return isLikeNone(ret) ? 0 : addHeapObject(ret);
        },
        __wbg_static_accessor_GLOBAL_ce44e66a4935da8c: function() {
            const ret = typeof global === 'undefined' ? null : global;
            return isLikeNone(ret) ? 0 : addHeapObject(ret);
        },
        __wbg_static_accessor_SELF_44f6e0cb5e67cdad: function() {
            const ret = typeof self === 'undefined' ? null : self;
            return isLikeNone(ret) ? 0 : addHeapObject(ret);
        },
        __wbg_static_accessor_WINDOW_168f178805d978fe: function() {
            const ret = typeof window === 'undefined' ? null : window;
            return isLikeNone(ret) ? 0 : addHeapObject(ret);
        },
        __wbindgen_object_clone_ref: function(arg0) {
            const ret = getObject(arg0);
            return addHeapObject(ret);
        },
        __wbindgen_object_drop_ref: function(arg0) {
            takeObject(arg0);
        },
    };
    return {
        __proto__: null,
        "./cube_wasm_bg.js": import0,
    };
}

const CubeLabFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_cubelab_free(ptr, 1));
const SwarmFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_swarm_free(ptr, 1));

function addHeapObject(obj) {
    if (heap_next === heap.length) heap.push(heap.length + 1);
    const idx = heap_next;
    heap_next = heap[idx];

    heap[idx] = obj;
    return idx;
}

function dropObject(idx) {
    if (idx < 1028) return;
    heap[idx] = heap_next;
    heap_next = idx;
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

let cachedDataViewMemory0 = null;
function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

function getStringFromWasm0(ptr, len) {
    return decodeText(ptr >>> 0, len);
}

let cachedUint32ArrayMemory0 = null;
function getUint32ArrayMemory0() {
    if (cachedUint32ArrayMemory0 === null || cachedUint32ArrayMemory0.byteLength === 0) {
        cachedUint32ArrayMemory0 = new Uint32Array(wasm.memory.buffer);
    }
    return cachedUint32ArrayMemory0;
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function getObject(idx) { return heap[idx]; }

let heap = new Array(1024).fill(undefined);
heap.push(undefined, null, true, false);

let heap_next = heap.length;

function isLikeNone(x) {
    return x === undefined || x === null;
}

function passArray32ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 4, 4) >>> 0;
    getUint32ArrayMemory0().set(arg, ptr / 4);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8ArrayMemory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function passStringToWasm0(arg, malloc, realloc) {
    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }
    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = cachedTextEncoder.encodeInto(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

function takeObject(idx) {
    const ret = getObject(idx);
    dropObject(idx);
    return ret;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

const cachedTextEncoder = new TextEncoder();

if (!('encodeInto' in cachedTextEncoder)) {
    cachedTextEncoder.encodeInto = function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    };
}

let WASM_VECTOR_LEN = 0;

let wasmModule, wasmInstance, wasm;
function __wbg_finalize_init(instance, module) {
    wasmInstance = instance;
    wasm = instance.exports;
    wasmModule = module;
    cachedDataViewMemory0 = null;
    cachedUint32ArrayMemory0 = null;
    cachedUint8ArrayMemory0 = null;
    return wasm;
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);
            } catch (e) {
                const validResponse = module.ok && expectedResponseType(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else { throw e; }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);
    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };
        } else {
            return instance;
        }
    }

    function expectedResponseType(type) {
        switch (type) {
            case 'basic': case 'cors': case 'default': return true;
        }
        return false;
    }
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (module !== undefined) {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();
    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }
    const instance = new WebAssembly.Instance(module, imports);
    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (module_or_path !== undefined) {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (module_or_path === undefined) {
        module_or_path = new URL('cube_wasm_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync, __wbg_init as default };
