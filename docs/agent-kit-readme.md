# DermaLens agent kit

## Install
1. Unzip at the repo root so `.agent/` and `docs/` land beside each other.
2. Commit on a branch (`chore/agent-kit`) and merge.
3. Open the repo in Antigravity, then open Customizations. Confirm the rules, workflows and skills are detected. Folder names and activation modes can change between versions, so check them against the current Antigravity docs.
4. Suggested activation: rules 00, 10, 20, 30 always on; 40-70 on by model decision or glob if you prefer fewer tokens per run.

## First prompt (Phase 0)
> Read `docs/ROADMAP.md` sections 3-5 and Phase 0 in section 9, and everything in `.agent/rules`. Produce a plan artifact for the monorepo skeleton. Do not implement until I approve. Do not add dependencies that are not listed in section 4. Ask me about anything that is a requirement-level decision instead of assuming.

## Workflows
`/new-analyzer`, `/new-screen`, `/add-adr`, `/perf-check`, `/privacy-audit`, `/pre-pr`

## Skills
`analyzer-authoring`, `mobile-camera-qa`

## Still open
D8 domain, D9 target market, D11 analytics. Rule 30 defaults to no analytics until D11 is decided.
