#!/usr/bin/env sh
# Rebuild the unchanged, GPL-3.0-only upstream solver. Run from project root.
set -eu
rustup target add wasm32-unknown-unknown
cargo install wasm-bindgen-cli --version 0.2.125 --locked
cargo build --manifest-path vendor/cube-solver/Cargo.toml -p cube_wasm --release --target wasm32-unknown-unknown --locked
wasm-bindgen vendor/cube-solver/target/wasm32-unknown-unknown/release/cube_wasm.wasm --target web --out-dir src/vendor --out-name cube_wasm
