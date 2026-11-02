# Third-party software

This prototype uses:

- **Three.js** — MIT license; https://github.com/mrdoob/three.js
- **cubejs** — MIT license; https://github.com/ldez/cubejs
  - Implements Herbert Kociemba's two-phase 3×3×3 solving algorithm.
  - The solver receives the current 54-facelet state; it does not reverse a stored scramble history.
- **Vite**, **TypeScript**, and **Vitest** — development/build/test dependencies; see each installed package's license.

The npm lockfile records the exact dependency versions. Package license files remain in the respective distributions. The cubejs MIT notice is reproduced below.

## cubejs MIT license

Copyright (c) 2013-2017 Petri Lehtinen <petri@digip.org>
Copyright (c) 2018 Ludovic Fernandez

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

## Three.js MIT license

The MIT License

Copyright © 2010-2025 three.js authors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

## Cube-Solver / WebAssembly reduction solver

Copyright and attribution: AdamNolle and the Cube-Solver contributors.
Source: https://github.com/AdamNolle/Cube-Solver
Revision: 4f04c32e283a8c7cda838d8e01a9b09114227628
License: GPL-3.0-only; full license at LICENSE (served as LICENSE.txt).

Unmodified upstream Rust workspace source is included in vendor/cube-solver.
WASM/JavaScript bindings were generated locally; build instructions and tool
versions are in vendor/cube-solver/UPSTREAM.md and scripts/build-wasm.sh.
The combined prototype is distributed under GPL-3.0-only; original MIT notices
for Three.js and cubejs remain applicable. No warranty is provided.
A matching project source archive is linked in the site footer, including the
integration, upstream source, manifests, lockfiles and build instructions.
Corresponding source is publicly available in the GPL-3.0-only GitHub repository
and the matching source archive linked from the GitHub Pages site.

Rust dependency versions are fixed in vendor/cube-solver/Cargo.lock. Exact source
and license/copyright notices for the 37 registry crates in the WASM normal/build
dependency graph are included in vendor/rust-dependencies, with provenance and
per-file SHA256SUMS. They retain their original licenses.
