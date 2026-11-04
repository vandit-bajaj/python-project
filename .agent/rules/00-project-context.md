# DermaLens: project context

DermaLens is a free, public, mobile-first web app. The user turns on the camera or uploads a face photo; the app analyses skin concerns and produces a detailed visual report, a PDF export and an approximate 3D face view.

## Non-negotiables
- Photos never leave the device. No uploads, no backend, no server-side image processing.
- Mobile-first: iPhone Safari and Android Chrome. Design and test at 390x844 and 360x800 first.
- Cosmetic insight only, never diagnosis. Never write "diagnose", "treat" or "cure" in UI copy.
- English only. All user-facing copy lives in one `content` module.
- The repo is public and all rights reserved: permissive-licence dependencies only.
- Ship everything together at v1.0. Nothing is announced or indexed before launch.

## v1 scope
Acne (classical CV, ML later), redness, pigmentation, oiliness, texture/pores, wrinkles and dark circles. Wrinkles and dark circles are a lower-confidence "beta" tier.

## How to work
- `docs/ROADMAP.md` is the source of truth. Read the relevant phase before planning.
- Do not assume requirements. If a requirement-level question is unanswered, stop and ask the owner. Undecided: D8 domain, D9 target market, D11 analytics (default is none).
- Produce a plan artifact first and wait for approval on architecture-level work.
- One package or feature slice per run. Run checks before proposing a PR.
