---
description: Verify the on-device guarantee still holds
---
1. Search the codebase for `fetch`, `XMLHttpRequest`, `sendBeacon`, WebSocket and third-party script tags. Justify or remove each hit.
2. Confirm CSP and Permissions-Policy match rule 30.
3. Run the Playwright zero-outbound-request test.
4. Search for `console.*`, logging and error reporting that could touch images or landmarks.
5. Check that no real face images or datasets are committed and `fixtures/` is clean.
6. Run the dependency-licence gate.
7. Report findings as pass/fail per item.
