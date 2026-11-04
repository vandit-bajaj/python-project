# Code standards

- TypeScript strict, `noUncheckedIndexedAccess`. No `any`; no non-null assertions without a comment saying why.
- Named exports only, except where Next.js requires default exports.
- Zod at every boundary: worker messages, stored data, imports.
- Small modules, pure functions, explicit return types on exported functions.
- Errors are typed and handled, never swallowed. UI has error boundaries.
- Biome for lint and format. Conventional commits.
- Comments explain why, not what. No dead code; no TODO without an issue link.
- New dependency checklist: permissive licence, bundle-size impact, ADR line, exact version pin.
