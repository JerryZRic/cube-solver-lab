# Cube-Solver provenance

- Upstream: https://github.com/AdamNolle/Cube-Solver
- Exact revision: `4f04c32e283a8c7cda838d8e01a9b09114227628`
- License: GPL-3.0-only (full text in LICENSE).
- Retained all five workspace crate source trees, Cargo.toml and Cargo.lock unchanged. No solver source changes.
- Browser output in `src/vendor/cube_wasm*` built with Rust 1.99.1 (58cf8f9c3 2026-10-13), wasm32-unknown-unknown and wasm-bindgen-cli 0.2.125.
- Rebuild: from project root run `sh scripts/build-wasm.sh`; requires official Rust tooling and network access to Cargo dependencies specified by lockfile. No desktop/GUI crates are built for the selected cube_wasm target.
- `src/reduction-adapter.ts` and `src/reduction-solver.ts` are new integration code written for this prototype on 2026-11-02. UI, worker routing and build/source packaging were changed on that date.
- The original upstream README describes its separate application, not this prototype's feature promises.
