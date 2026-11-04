---
description: Check bundle size and mobile performance against budgets
---
1. Build the app and run the bundle analyzer.
2. Run Lighthouse CI with mobile settings.
3. Compare with the budgets in rule 40: initial JS, LCP, INP, CLS.
4. Confirm MediaPipe, three.js and the PDF library are lazy-loaded.
5. Report each metric against its budget in a table. Flag regressions; do not fix them silently.
