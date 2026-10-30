import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { applyMove, axisIndex, createCube, FACES, parseMove } from '../src/cube';
import { CubeView } from '../src/view';

// Only platform/GPU boundaries are mocked. Scene graph transforms, geometry,
// meshes, quaternions and materials below remain the real Three.js classes.
// These tests deliberately make no claim about WebGL pixels or GPU rendering.
vi.mock('three', async (importOriginal) => {
  const actual = await importOriginal<typeof import('three')>();
  return {
    ...actual,
    WebGLRenderer: class {
      domElement = {
        addEventListener: vi.fn(),
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }),
      };
      loop?: (time: number) => void;
      setPixelRatio = vi.fn();
      setClearColor = vi.fn();
      setSize = vi.fn();
      render = vi.fn();
      setAnimationLoop(callback: (time: number) => void) { this.loop = callback; }
    },
  };
});

vi.mock('three/addons/controls/OrbitControls.js', () => ({
  OrbitControls: class {
    target = { set: vi.fn() };
    update = vi.fn();
  },
}));

interface TestRenderer {
  loop: (time: number) => void;
  render: ReturnType<typeof vi.fn>;
  setSize: ReturnType<typeof vi.fn>;
}

function makeView(): CubeView {
  const container = {
    append: vi.fn(),
    getBoundingClientRect: () => ({ width: 800, height: 600 }),
  } as unknown as HTMLElement;
  return new CubeView(container);
}

function finishAnimation(view: CubeView, duration = 250): void {
  const renderer = view.renderer as unknown as TestRenderer;
  renderer.loop(performance.now() + duration + 1);
}

beforeEach(() => {
  vi.stubGlobal('window', { devicePixelRatio: 1 });
  vi.stubGlobal('ResizeObserver', class {
    observe = vi.fn();
    disconnect = vi.fn();
  });
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('NxN view geometry and scene-graph transforms (no WebGL)', () => {
  for (let order = 2; order <= 10; order++) {
    it(`${order}×${order}: has correct surface meshes, integer-grid placement, and constant fit`, () => {
      const cube = createCube(order);
      const view = makeView();
      view.sync(cube);
      const expectedCubies = order ** 3 - (order - 2) ** 3;
      expect(view.root.scale.toArray()).toEqual([3 / order, 3 / order, 3 / order]);
      expect(view.groups.size).toBe(expectedCubies);
      expect(view.root.children).toHaveLength(expectedCubies);
      expect(view.stickers).toHaveLength(6 * order ** 2);
      expect(view.root).toBeInstanceOf(THREE.Group);
      expect(view.scene).toBeInstanceOf(THREE.Scene);
      view.scene.updateMatrixWorld(true);
      const expectedCenterExtent = 3 * (order - 1) / (2 * order);
      for (const cubie of cube) {
        const group = view.groups.get(cubie.id)!;
        expect(group.position.toArray()).toEqual(cubie.position.map(value => value / 2));
        expect(group.children).toHaveLength(1 + cubie.stickers.length);
        expect(group.parent).toBe(view.root);
        const world = group.getWorldPosition(new THREE.Vector3());
        cubie.position.forEach((value, axis) => expect(world.getComponent(axis)).toBeCloseTo(value * 3 / (2 * order), 12));
        expect(Math.max(...world.toArray().map(Math.abs))).toBeLessThanOrEqual(expectedCenterExtent + 1e-12);
      }
      // Actual shared body and sticker geometries also stay within the fitted
      // three-unit envelope (not just their group centers).
      const size = new THREE.Box3().setFromObject(view.root).getSize(new THREE.Vector3());
      for (const extent of size.toArray()) { expect(extent).toBeLessThanOrEqual(3.001); expect(extent).toBeGreaterThan(2.9); }
      expect((view.renderer as unknown as TestRenderer).setSize).toHaveBeenCalledWith(800, 600);
      expect(view.camera.aspect).toBe(800 / 600);
    });

    it(`${order}×${order}: animates precisely the selected layer on all six faces`, async () => {
      const cube = createCube(order);
      const pristine = structuredClone(cube);
      const view = makeView();
      for (const face of FACES) for (let depth = 1; depth <= order; depth++) {
        view.sync(cube);
        // Across depths/orders, cover clockwise, inverse, and half-turn targets.
        const suffix = ['', "'", '2'][(depth - 1) % 3];
        const move = `${depth === 1 ? '' : depth}${face}${suffix}`;
        const parsed = parseMove(move, order);
        const expected = cube.filter(cubie => cubie.position[axisIndex(parsed.axis)] === parsed.layer);
        const promise = view.animate(cube, move, 250);
        const pivot = view.root.children.find(child => ![...view.groups.values()].includes(child as THREE.Group)) as THREE.Group;
        expect(pivot).toBeInstanceOf(THREE.Group);
        expect(pivot.parent).toBe(view.root);
        expect(pivot.children).toHaveLength(depth === 1 || depth === order ? order ** 2 : 4 * order - 4);
        expect(new Set(pivot.children)).toEqual(new Set(expected.map(cubie => view.groups.get(cubie.id)!)));
        expect(view.root.children).toHaveLength(cube.length - expected.length + 1);
        for (const cubie of cube) {
          const group = view.groups.get(cubie.id)!;
          expect(group.parent).toBe(expected.includes(cubie) ? pivot : view.root);
        }
        finishAnimation(view);
        await expect(promise).resolves.toBe(true);
        expect(pivot.rotation[parsed.axis]).toBeCloseTo(parsed.quarters * Math.PI / 2, 12);
        for (const axis of ['x', 'y', 'z'] as const) if (axis !== parsed.axis) expect(pivot.rotation[axis]).toBe(0);
        expect(cube).toEqual(pristine); // Floating-point animation never mutates the integer model.
        const completedAngle = pivot.rotation[parsed.axis];
        finishAnimation(view, 1000);
        expect(pivot.rotation[parsed.axis]).toBe(completedAngle);
      }
    }, 15_000);
  }

  it('aborts an in-flight turn, removes its pivot on resync, and does not affect a new order', async () => {
    const view = makeView();
    const original = createCube(4);
    view.sync(original);
    const pending = view.animate(original, '2R', 250);
    const oldPivot = view.root.children.find(child => ![...view.groups.values()].includes(child as THREE.Group)) as THREE.Group;
    view.abort();
    await expect(pending).resolves.toBe(false);
    const newCube = createCube(10);
    view.sync(newCube);
    finishAnimation(view, 2000);
    expect(oldPivot.parent).toBeNull();
    expect(view.root.children).toHaveLength(10 ** 3 - 8 ** 3);
    expect([...view.groups.values()].every(group => group.parent === view.root)).toBe(true);
    expect(view.root.scale.toArray()).toEqual([.3, .3, .3]);
    expect(oldPivot.rotation.x).toBe(0);
    view.abort(); // Idle cancellation is harmless.
    const next = view.animate(newCube, '5U2', 250);
    finishAnimation(view);
    await expect(next).resolves.toBe(true);
    applyMove(newCube, '5U2');
    view.sync(newCube);
    expect(view.root.children).toHaveLength(newCube.length);
    expect([...view.groups.values()].every(group => group.parent === view.root)).toBe(true);
    expect(view.stickers).toHaveLength(600);
  });
});
