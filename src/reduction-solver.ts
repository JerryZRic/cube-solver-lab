import init, { CubeLab } from './vendor/cube_wasm.js';
import { fromReductionMoves, toReductionColors } from './reduction-adapter';
let ready: Promise<unknown> | undefined;
/** Only called in a disposable worker. Never receives operation history. */
export async function solveReduction(facelets: string, order: number): Promise<string> {
  const colors = toReductionColors(facelets, order);
  if (!ready) ready = init().catch(error => { ready = undefined; throw error; });
  await ready;
  const lab = new CubeLab(order);
  try {
    if (!lab.load_face_colors(colors)) throw new Error('求解器拒绝贴纸状态');
    const result = JSON.parse(lab.solve(1, 50));
    if (result.found !== true) throw new Error('本次未能在时间限制内找到解，请重试');
    return fromReductionMoves(result.moves, order).join(' ');
  } finally {
    lab.free();
  }
}
