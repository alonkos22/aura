# /redteam — Step 3 Audit (Implementation Blueprint)

**Target:** `06-implementation-blueprint.md` · **Date:** 2026-07-06
**Method:** adversarial pass as a hostile 12-year-old with devtools, a stranger on the
internet who found the endpoint, a sibling on the shared device, and a careless future
developer. Findings RT-19…RT-26 (numbering continues from Step 2).

---

## Findings

### RT-19 · HIGH · The appToken is a static shared secret, visible to the child
**Attack:** The token sits in localStorage and rides every request — readable in
devtools' network tab by the same tech-savvy child §2 already worries about, or by
anyone she shares it with. There is no revocation; a leaked token is a permanently open
LLM proxy on the owner's bill.
**Resolution: RESOLVED (mitigations folded into §3) + ACCEPTED RESIDUAL** — added to the
blueprint: the token must never be logged; a rotation procedure (change `APP_SECRET` env
var → re-pair in P1) is a Phase-A deliverable; the judge/blocklist still constrain what
a token-holder can extract (it's a child-safe Guardian, not a raw model); and the
Anthropic spend cap (RT-22) bounds the blast radius to a fixed cost. Residual risk
accepted for single-family MVP; the v1 server DB replaces the shared secret with real
per-user auth.

### RT-20 · HIGH · The repository is PUBLIC — the master prompt and endpoint design are world-readable
**Attack:** `alonkos22/aura` is public. The master prompt (04-§2), blocklist, payload
shape, and endpoint path are all published. An attacker crafts injections with the
prompt in hand; a future dev assumes prompt secrecy is a defense.
**Resolution: RESOLVED (by design stance, now explicit) + OWNER DECISION** — added to
§3: **prompt secrecy is NOT a security boundary**; every defense must hold with the
prompt fully known (boundary-3 behavior, server-side judge, auth, spend caps — none rely
on secrecy). Keeping the prompt out of the client bundle remains required, but as
hygiene, not defense. `.env`/env-vars are the only secret store and `.gitignore` must
cover them (Phase-A checklist). Making the repo private is logged as owner decision
§8 — recommended, not required.

### RT-21 · MEDIUM · Judge-failure mode silently kills the chat
**Attack:** The judge call hits a rate limit for an hour → every reply fails safe to the
fallback → the child experiences a dead Guardian, the parent sees nothing, nobody knows
why.
**Resolution: RESOLVED** — §5/P4 amended: `blocked` flags are aggregated, and repeated
judge failures in a day surface a "system degraded" notice in parent mode. Fail-safe
stays (a dead Guardian is the correct failure for a child product); it just can't stay
*silent* anymore.

### RT-22 · MEDIUM · Cost controls were advisory, not blocking
**Attack:** Client-side daily cap is trivially bypassed (it's localStorage); per-IP
limits are weak on stateless serverless. The only real backstop — the Anthropic console
spend limit — was phrased as advice.
**Resolution: RESOLVED** — promoted to the §7 acceptance checklist as a blocking item:
Phase C may not go live before the owner sets a hard spend limit in the Anthropic
console. `max_tokens` caps and soft limits remain as friction, correctly labeled as
friction.

### RT-23 · MEDIUM · The broken adult AI call is a key-pasting trap for a future dev
**Attack:** Phase A ships `src/adult/` with the old direct `api.anthropic.com` fetch
still in it. Six months from now someone "fixes" the 401 by pasting a key into the
client — the exact catastrophe SB-8 exists to prevent.
**Resolution: RESOLVED** — kept untouched functionally (it already fails with a graceful
Hebrew error, and adult modules are out of scope), but Phase A adds one guard: a
prominent comment block above that fetch pointing to SB-8/CLAUDE.md §4 («never put a key
here — route through /api like the Guardian»). Cheap, zero behavior change, kills the
trap.

### RT-24 · MEDIUM · A distress flag can sit unseen for weeks
**Attack:** Child hits the distress protocol on Tuesday; the flag lands in a P4 inbox
the parent opens twice a month. The escalation channel exists but has no urgency — the
worst place to be slow.
**Resolution: RESOLVED** — §5 amended: distress flags are exempt from the ≤1/day
notification cap (that cap protects the *child* surface; parent safety alerts are a
different channel), and unseen distress flags render as a prominent badge at parent-mode
entry (PIN screen), not only inside P4. Same-device MVP reality: the badge is the
channel; push comes with PWA.

### RT-25 · LOW · The backup file leaks the child's transcripts in plaintext
**Attack:** Export lands in a shared computer's Downloads as readable JSON containing a
minor's conversations.
**Resolution: RESOLVED (documented)** — §2 amended: neutral filename, P4 copy warns the
parent to store it privately; passphrase-encrypted export logged as a v1 item. Accepted
for MVP: the exporter is the consent-holding parent by construction (P4 is PIN-gated).

### RT-26 · LOW · Premature merge to main ships an untested restructure
**Attack:** Owner merges the branch mid-Phase-A from the GitHub mobile UI; Vercel
rebuilds production from a half-restructured tree; the live site breaks.
**Resolution: RESOLVED (documented)** — §0/§6 amended: explicit **"do not merge to
`main` before Phase-C sign-off"** rule; branch preview URLs are the sanctioned way to
try work-in-progress. (Repo has no branch protection on the free plan; the rule is
procedural and lives in CLAUDE.md's workflow section too.)

---

## Verdict

| Severity | Count | Status |
|----------|-------|--------|
| CRITICAL | 0 | — |
| HIGH | 2 | RT-19 resolved + accepted residual (bounded by spend cap); RT-20 resolved by explicit design stance + owner decision (repo visibility) |
| MEDIUM | 4 | All resolved, folded into §§3, 5, 7 of the blueprint |
| LOW | 2 | Both resolved/documented |

**Step 3 PASSES** the red-team gate. All three design steps are now complete and
audited. **Coding may begin with Phase A upon owner approval**, with these Phase-A
blocking deliverables carried in: token rotation procedure (RT-19), `.gitignore` for env
files + no-secrets-in-repo check (RT-20), the SB-8 guard comment (RT-23), and the
do-not-merge rule (RT-26). Phase-C go-live is blocked on the Anthropic spend cap (RT-22).
