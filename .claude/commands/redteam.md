---
description: Adversarial security & logic audit of the most recent completed step
---

# /redteam — Mandatory Adversarial Audit

Target: $ARGUMENTS (default: the most recently completed step's deliverable)

Attack the target from these angles — as a hostile 12-year-old, a malicious peer with
the child's phone, a curious sibling, and a careless future developer:

1. **Child safety** — inappropriate content paths, jailbreaks/prompt injection
   (including multi-turn drift, claimed parental permission, language switching),
   emotional over-attachment, distress handling.
2. **Privacy & legal** — minor's data minimization, parental consent, transparency
   promises that could rot, PII leakage.
3. **Security architecture** — API keys/client exposure, missing server boundaries,
   cross-profile data leakage on shared devices.
4. **Product logic** — data drift vs. reality, wrong math shown to a child, states
   that teach the wrong lesson.
5. **Scope & USP integrity** — dark-pattern creep, clutter creep, violations of the
   30-second test or SB-1…SB-10 (`01-design-foundations.md`).

Rules:
- Number findings continuously across the project (RT-1, RT-2, …).
- Every finding gets a severity (CRITICAL/HIGH/MEDIUM/LOW) and a resolution status:
  **RESOLVED** (fix folded back into the target doc/code — actually edit it),
  **GATED** (named blocking requirement on a later step), or **OWNER DECISION**.
  Nothing is silently accepted.
- Verdict: the step PASSES only when every CRITICAL/HIGH finding is resolved or gated.

Output: write the audit to `docs/personal-guardian/` as a numbered markdown file,
apply the fold-back edits, commit, push, and present a Hebrew summary.
