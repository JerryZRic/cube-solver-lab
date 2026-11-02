# Rust dependency source inventory

Collected on 2026-11-02 from the crates.io registry sources used for the fixed Cube-Solver revision `4f04c32e283a8c7cda838d8e01a9b09114227628`.

Selection command (run against that revision):

```
cargo tree -p cube_wasm --target wasm32-unknown-unknown --edges normal,build --prefix none --format '{p}'
```

This includes normal and build/proc-macro dependencies of the browser WASM target, not unrelated desktop workspace dependencies or the wasm-bindgen CLI's own tool dependencies. Local Cube-Solver path crates are retained separately in `../cube-solver/`.

Registry origin: https://github.com/rust-lang/crates.io-index (packages distributed by https://crates.io/). Exact package versions and registry archive checksums are recorded in `../cube-solver/Cargo.lock`. Source directories are copied verbatim from Cargo's downloaded registry cache, including license, copyright and notice files, except the local `.cargo-ok` installation marker. No dependency source code was modified. `SHA256SUMS` records each retained file's hash.

These copies accompany the compiled WASM for source/license availability. Cargo configuration and lockfiles are unchanged; the rebuild script still resolves its locked dependencies through Cargo's normal registry/cache mechanism, not this directory.

| Crate | Version | Declared license | License / notice files |
| --- | --- | --- | --- |
| bumpalo | 3.20.3 | MIT OR Apache-2.0 | `LICENSE-MIT`, `LICENSE-APACHE` |
| cfg-if | 1.0.4 | MIT OR Apache-2.0 | `LICENSE-MIT`, `LICENSE-APACHE` |
| console_error_panic_hook | 0.1.7 | Apache-2.0/MIT | `LICENSE-MIT`, `LICENSE-APACHE` |
| crossbeam-channel | 0.5.15 | MIT OR Apache-2.0 | `LICENSE-MIT`, `LICENSE-THIRD-PARTY`, `LICENSE-APACHE` |
| crossbeam-utils | 0.8.21 | MIT OR Apache-2.0 | `LICENSE-MIT`, `LICENSE-APACHE` |
| futures-core | 0.3.32 | MIT OR Apache-2.0 | `LICENSE-MIT`, `LICENSE-APACHE` |
| futures-task | 0.3.32 | MIT OR Apache-2.0 | `LICENSE-MIT`, `LICENSE-APACHE` |
| futures-util | 0.3.32 | MIT OR Apache-2.0 | `LICENSE-MIT`, `LICENSE-APACHE` |
| getrandom | 0.2.17 | MIT OR Apache-2.0 | `LICENSE-MIT`, `LICENSE-APACHE` |
| itoa | 1.0.18 | MIT OR Apache-2.0 | `LICENSE-MIT`, `LICENSE-APACHE` |
| js-sys | 0.3.102 | MIT OR Apache-2.0 | `LICENSE-MIT`, `LICENSE-APACHE` |
| memchr | 2.8.2 | Unlicense OR MIT | `LICENSE-MIT`, `UNLICENSE`, `COPYING` |
| once_cell | 1.21.4 | MIT OR Apache-2.0 | `LICENSE-MIT`, `LICENSE-APACHE` |
| pin-project-lite | 0.2.17 | Apache-2.0 OR MIT | `LICENSE-MIT`, `LICENSE-APACHE` |
| ppv-lite86 | 0.2.21 | MIT OR Apache-2.0 | `LICENSE-MIT`, `LICENSE-APACHE` |
| proc-macro2 | 1.0.106 | MIT OR Apache-2.0 | `LICENSE-MIT`, `LICENSE-APACHE` |
| quote | 1.0.45 | MIT OR Apache-2.0 | `LICENSE-MIT`, `LICENSE-APACHE` |
| rand | 0.8.6 | MIT OR Apache-2.0 | `LICENSE-MIT`, `COPYRIGHT`, `LICENSE-APACHE` |
| rand_chacha | 0.3.1 | MIT OR Apache-2.0 | `LICENSE-MIT`, `COPYRIGHT`, `LICENSE-APACHE` |
| rand_core | 0.6.4 | MIT OR Apache-2.0 | `LICENSE-MIT`, `COPYRIGHT`, `LICENSE-APACHE` |
| rustversion | 1.0.22 | MIT OR Apache-2.0 | `LICENSE-MIT`, `LICENSE-APACHE` |
| serde | 1.0.228 | MIT OR Apache-2.0 | `LICENSE-MIT`, `LICENSE-APACHE` |
| serde_core | 1.0.228 | MIT OR Apache-2.0 | `LICENSE-MIT`, `LICENSE-APACHE` |
| serde_derive | 1.0.228 | MIT OR Apache-2.0 | `LICENSE-MIT`, `LICENSE-APACHE` |
| serde_json | 1.0.150 | MIT OR Apache-2.0 | `LICENSE-MIT`, `LICENSE-APACHE` |
| slab | 0.4.12 | MIT | `LICENSE` |
| syn | 2.0.118 | MIT OR Apache-2.0 | `LICENSE-MIT`, `LICENSE-APACHE` |
| thiserror | 1.0.69 | MIT OR Apache-2.0 | `LICENSE-MIT`, `LICENSE-APACHE` |
| thiserror-impl | 1.0.69 | MIT OR Apache-2.0 | `LICENSE-MIT`, `LICENSE-APACHE` |
| unicode-ident | 1.0.24 | (MIT OR Apache-2.0) AND Unicode-3.0 | `LICENSE-MIT`, `LICENSE-APACHE`, `LICENSE-UNICODE` |
| wasm-bindgen | 0.2.125 | MIT OR Apache-2.0 | `LICENSE-MIT`, `LICENSE-APACHE` |
| wasm-bindgen-macro | 0.2.125 | MIT OR Apache-2.0 | `LICENSE-MIT`, `LICENSE-APACHE` |
| wasm-bindgen-macro-support | 0.2.125 | MIT OR Apache-2.0 | `LICENSE-MIT`, `LICENSE-APACHE` |
| wasm-bindgen-shared | 0.2.125 | MIT OR Apache-2.0 | `LICENSE-MIT`, `LICENSE-APACHE` |
| web-time | 1.1.0 | MIT OR Apache-2.0 | `LICENSE-MIT`, `LICENSE-APACHE` |
| zerocopy | 0.8.52 | BSD-2-Clause OR Apache-2.0 OR MIT | `LICENSE-MIT`, `LICENSE-BSD`, `LICENSE-APACHE` |
| zmij | 1.0.21 | MIT | `LICENSE-MIT` |
