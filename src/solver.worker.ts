import Cube from 'cubejs';

let initialized = false;
const parity = (permutation: number[]): number => {
  let inversions = 0;
  for (let i = 0; i < permutation.length; i++) for (let j = i + 1; j < permutation.length; j++) {
    if (permutation[i] > permutation[j]) inversions++;
  }
  return inversions % 2;
};
const validPermutation = (values: number[], length: number): boolean =>
  values.length === length && new Set(values).size === length &&
  values.every(n => Number.isInteger(n) && n >= 0 && n < length);

self.onmessage = (event: MessageEvent<{ id: number; facelets: string }>) => {
  const { id, facelets } = event.data;
  try {
    if (typeof facelets !== 'string' || !/^[URFDLB]{54}$/.test(facelets)) throw new Error('无效的魔方状态');
    if ([...'URFDLB'].some((face, i) => facelets[9 * i + 4] !== face || [...facelets].filter(x => x === face).length !== 9)) {
      throw new Error('颜色数量或中心块不正确');
    }
    const cube = Cube.fromString(facelets);
    const { cp, co, ep, eo } = cube.toJSON();
    if (!validPermutation(cp, 8) || !validPermutation(ep, 12) ||
      co.some(n => !Number.isInteger(n) || n < 0 || n > 2) || co.reduce((a, b) => a + b, 0) % 3 !== 0 ||
      eo.some(n => n !== 0 && n !== 1) || eo.reduce((a, b) => a + b, 0) % 2 !== 0 ||
      parity(cp) !== parity(ep) || cube.asString() !== facelets) throw new Error('此状态无法由合法转动得到');
    if (!initialized) { Cube.initSolver(); initialized = true; }
    const algorithm = cube.isSolved() ? '' : cube.solve();
    if (!cube.clone().move(algorithm).isSolved()) throw new Error('解法校验失败，请重试');
    self.postMessage({ id, algorithm });
  } catch (error) {
    self.postMessage({ id, error: error instanceof Error ? error.message : '求解失败，请重试' });
  }
};
