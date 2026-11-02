import { solveSmallCube } from './small-solver';
import { solveReduction } from './reduction-solver';

self.onmessage = async (event: MessageEvent<{ id: number; order?: number; facelets: string }>) => {
  const { id, order = 3, facelets } = event.data;
  try {
    // Validate before constructing the WASM model (whose upstream ceiling is larger).
    if (!Number.isInteger(order) || order < 2 || order > 5) throw new Error('独立求解仅支持 2–5 阶');
    const algorithm = order <= 3 ? solveSmallCube(facelets, order) : await solveReduction(facelets, order);
    self.postMessage({ id, algorithm });
  } catch (error) {
    self.postMessage({ id, error: error instanceof Error ? error.message : '求解失败，请重试' });
  }
};
