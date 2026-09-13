# AGENTS.md

**Standing operating manual:** `../deeen_plans/` (sibling folder on this machine).

Any AI coding agent (Claude, GPT, DeepSeek, a local model, or a subagent) working
in this repo MUST read `../deeen_plans/AGENTS.md` first, then follow its read order:
`PROJECT → ARCHITECTURE → DECISIONS → TASKS → SECURITY → TESTING`.

This repo is **AfterHours** — 24/7 intelligence for tokenized stocks on Solana.
The product detects price gaps between on-chain markets and traditional reference
prices, explains them with an AI Analyst, evaluates portfolio risk via a Risk
Governor, and executes bounded actions on Solana after user approval.

## Differences from the generic deeen_plans template

- **Verify command:** `bash scripts/verify` (lint → typecheck → test → web build).
  Shims exist at `scripts/{lint,typecheck,test}`. Run before reporting done.
- **Decisions:** recorded in `docs/ADRs.md` (not repo-root `DECISIONS.md`).
- **Changelog:** `CHANGELOG.md` at repo root, seeded from the deeen_plans format.
- **Tasks/milestones:** `TASKS.md` at repo root, filled with AfterHours' real state.
- **Security off-limits:** follow `../deeen_plans/SECURITY.md` (no `.env`/keys/prod
  creds) AND `docs/SECURITY.md` (project threat model). Both apply.
- **Permission tiers:** Restricted (ask first) = dependency changes, migrations, CI
  changes, signer/key logic, anything in `docs/SECURITY.md`. Forbidden = production
  deploys, secret access, disabling the gate.

## Verify gate (definition of done)

```
bash scripts/verify      # lint + typecheck + test + web build, all green
```

Do not report a task complete without having run `scripts/verify` and seen it pass.
