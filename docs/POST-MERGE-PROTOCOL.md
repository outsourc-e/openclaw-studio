# Post-Merge Protocol

Standard procedure for every PR merge or meaningful change to OpenClaw Studio.
Execute strictly and in order. Do NOT expand scope.

## Phase A — Classify
1. Change type: Phase 0 (trust) / Phase 1 (wiring) / Phase 2 (features) / Docs-only
2. State: what changed, what did NOT change, runtime behavior impact (yes/no)

## Phase B — Documentation (Minimal)
3. Update README.md status table if needed (factual, no marketing)
4. Add/update docs note describing the phase and demo vs wired vs planned

## Phase C — Release Tagging
5. If milestone complete: git tag (semver), GitHub Release with what shipped + what's excluded
6. If not release-worthy: state reason

## Phase D — Sanity & Trust
7. Verify: repo description intact, no secrets, UI reflects real state, no misleading labels
8. Report: build status, warnings (new vs existing)

## Constraints
- No features, no unrelated refactors, no licensing/visibility/CI changes
- No marketing language, no roadmap promises
- Do not expand scope beyond merged PR
