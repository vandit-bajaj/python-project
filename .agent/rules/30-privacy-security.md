# Privacy and security (hard constraints)

- No network request may carry image data, pixels, landmarks or analysis results. The app has no backend.
- Do not add analytics, telemetry, error-reporting SDKs, session replay or third-party scripts. Analytics (D11) is undecided; the default is none.
- CSP: `default-src 'self'`; `connect-src 'self'`; `worker-src 'self' blob:`; `img-src 'self' data: blob:`; nonce-based `script-src` plus `'wasm-unsafe-eval'` (follow current Next.js docs for nonces). Do not loosen without an ADR.
- `Permissions-Policy: camera=(self), microphone=(), geolocation=()`.
- Self-host fonts, models and WASM. No runtime CDNs.
- Never log or persist image data or landmarks. Stored history is results only; a thumbnail only if the user opts in.
- A Playwright test fails on any non-same-origin request during a scan. Keep it green.
- The repo is public: never commit secrets, real face photos or datasets. `fixtures/` holds synthetic or explicitly consented images only.
- Dependencies: permissive licences only (MIT, Apache-2.0, BSD, ISC). Block GPL/AGPL. Ask before adding LGPL or MPL. Exact version pins and a frozen lockfile.
- Production stays `noindex` and unannounced until v1.0.
