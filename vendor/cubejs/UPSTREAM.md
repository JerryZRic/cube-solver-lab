# Vendored cubejs 1.3.2 runtime

Source: npm package `cubejs@1.3.2`, upstream https://github.com/ldez/cubejs.
License: MIT, included verbatim in LICENSE.

`index.js`, `lib/cube.js` and `lib/solve.js` are copied byte-for-byte from the published package. Only package metadata is replaced. The upstream package incorrectly includes the old `npm` CLI as a production dependency, which the browser solver does not use. Vendoring only the runtime avoids shipping/installing that unrelated vulnerable dependency tree. No solver algorithm code was modified.

SHA-256 checksums:
fdc16361b11721a77167f34f845d9f7b36f21f29520228f1f67cdd237acaa222  vendor/cubejs/index.js
450a53a9acf5033fde7ca23be8fd08ac37d30f04c58aac63f053a1c05a7f5802  vendor/cubejs/lib/cube.js
faa0ccffca78f80a5fe7a197a9676af02d79d8ddece9cf3506154fea616fc445  vendor/cubejs/lib/solve.js
