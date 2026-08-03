---
description: Break a feature into a 3-step action plan before any implementation
---

# /alt3 — Structured 3-Step Planning Protocol

Scope of this run: $ARGUMENTS

You are planning, not building. Produce a plan document, not code.

1. **Ground in reality first.** Inspect the actual codebase and
   `docs/personal-guardian/` before planning. If the request conflicts with what
   exists, the codebase wins — flag the conflict explicitly.
2. **Produce exactly 3 steps.** For each step write: goal, concrete deliverables,
   what is explicitly out of scope, and a "done when" condition that includes passing
   `/redteam`.
3. **Anti-scope-creep rules:** each step must be independently completable and
   reviewable; no step may start before the previous one passed `/redteam` and got
   owner approval; anything not named in a step's deliverables is out of scope.

Output: write the plan to `docs/personal-guardian/` as a numbered markdown file,
commit, push, and present a Hebrew summary to the owner. **Stop and wait for approval
before implementing step 1.**
