---
description: Add a skin analyzer to analysis-core (tests first, UV-space output)
---
1. Read `docs/ROADMAP.md` section 6 and the `analyzer-authoring` skill.
2. Produce a plan artifact: method, inputs, output schema, failure modes, test plan. Wait for approval.
3. Write failing tests first: synthetic perturbation (monotonic response), test-retest, cross-lighting.
4. Implement in `packages/analysis-core` as a pure module behind the `Analyzer` interface. No React or DOM imports.
5. Output a Zod-validated result in UV space: per-region scores, map, confidence, analyzer version.
6. Register the analyzer in the worker pipeline.
7. Benchmark in the worker against the budgets in rule 40 and record the numbers.
8. Run `/pre-pr`.
