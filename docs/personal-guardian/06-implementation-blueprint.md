# Step 3 — Implementation Blueprint (Personal Guardian MVP)

**Status:** Implemented per `/alt3` plan · **Date:** 2026-07-06 · Owner approved Step 3.
**This is still a spec.** Code starts only after this document passes `/redteam`
(`07-redteam-step3.md`) and the owner green-lights Phase A.
**Blocking inheritances honored here:** RT-1 (server proxy), RT-12 (distress detection),
RT-13 (server-computed numbers), RT-14 (per-child keying), RT-16 (semantic filter).

---

## 0. Stack decision (working decision — owner ratifies before Phase A)

**Stay on Vite + React 18, add Vercel Serverless Functions (`/api`) for the proxy.**

Why not Next.js now: the only thing we need a server for is the AI proxy; Vercel
functions give exactly that without migrating the whole app, relearning a framework, or
touching the working deployment. A Next.js migration remains possible later; nothing in
this blueprint locks us out of it.

**Repo restructuring (Phase A):** adopt the proper layout that already exists inside
`aura-deploy.zip` — `src/App.jsx`, `src/main.jsx`, thin root `index.html` that loads the
Vite entry. The current standalone Babel-in-browser `index.html` is retired to
`legacy/index-standalone.html` (kept for reference, not served). **`main` and the live
Vercel deployment stay untouched until Phase C is verified on the feature branch** —
Vercel builds preview deployments per branch, which is how we test without risk.

**Platform (owner decision §8.3 of CLAUDE.md):** responsive web now → PWA manifest
after MVP stabilizes. Native is out of scope.

---

## 1. Architecture

```
Child/Parent browser (React SPA, localStorage)
        │  POST /api/guardian   { profile, ledgerSummary, messages, childMessage, appToken }
        ▼
Vercel Serverless Function  (env: ANTHROPIC_API_KEY, APP_SECRET)
   1. auth: appToken === APP_SECRET (family install token)
   2. validate & cap inputs (childMessage ≤ 500 chars, ≤ 10 history messages)
   3. distress pre-net (Hebrew keyword list) → on hit: fixed safe reply + flag,
      NO model call
   4. compute derived numbers (balance, remaining, weeks-at-rate) — RT-13
   5. assemble system prompt (master prompt from 04 + context fields) — server-side only
   6. call model (max_tokens ≈ 300, no tools, no streaming for MVP)
   7. judge pass: cheap second model call classifies the reply (and the child message)
      against the §4 blocklist of 04 + distress; any hit or judge failure →
      fixed fallback reply (fail-open-to-safe, RT-12/RT-16)
   8. return { reply, flags[] }
        ▼
Anthropic API (key never leaves the server)
```

- **No streaming in MVP:** the full reply is filtered before the child sees a word.
- **Cost guards:** `max_tokens` caps, judge uses the cheapest adequate model, Anthropic
  console spend limit set by owner, soft per-IP rate limit + client-side daily message
  cap (50/day per family) enforced in both places.
- **Model ids** come from env config, not hardcoded strings (the codebase currently
  hardcodes a stale model id — do not copy).

## 2. Data model (localStorage v0 → Supabase v1)

MVP is a **single-family, same-device or same-browser** product. All state lives in
localStorage under versioned keys; every schema carries `schemaVersion` for the v1
migration to a hosted DB (needed only when parent and child use separate devices).

```
aura.meta            { schemaVersion: 1 }
aura.family          { parentPinHash, consentAt, oversightMode: "full"|"summary",
                       appToken }
aura.children        [ { id, nickname, ageBand: "10-12"|"12-14", avatarColor,
                         weeklyAllowance, createdAt } ]
aura.ledger.<id>     [ { id, ts, type: "allowance"|"deposit"|"spend", amount, note } ]
aura.goals.<id>      [ { id, name, target, createdAt, status: "pending"|"active"|
                         "reached", approvedAt } ]
aura.chat.<id>       [ { id, ts, role: "child"|"guardian", text, flags[] } ]
aura.flags           [ { id, ts, childId, kind: "distress"|"blocked", seenByParent } ]
```

- **Balance is always derived** from the ledger (single source of truth, SB-1); one
  shared util computes balance/remaining/weeks — the same math the server re-computes
  for chat context (RT-13). The model never calculates.
- **Per-child keying** (RT-14): every store is namespaced by child id; switching the
  active child requires the parent PIN.
- **Backup:** parent mode has an export/import button (JSON download) so a cleared
  browser cache can't destroy the family's data. **RT-25:** the export contains the
  child's transcripts — neutral filename, P4 copy tells the parent to store it
  privately; passphrase-encrypted export is a v1 item.
- **Known accepted risk (documented):** localStorage is editable by a tech-savvy child
  via devtools (own ledger inflation, PIN removal). Accepted for single-family MVP —
  the ledger mirrors parent-known reality, so cheating is self-defeating and visible in
  P3; fixed structurally by the v1 server DB. The PIN is a soft gate, not security.

## 3. The proxy — `/api/guardian.js` (single function, full spec)

| Concern | Spec |
|---|---|
| Auth | `appToken` issued at P1 setup (random, stored in `aura.family`), checked against `APP_SECRET` env var. Wrong/missing → 401. Keeps the endpoint from being a free public LLM proxy. **RT-19:** the token is never logged; rotation procedure (new `APP_SECRET` → re-pair in P1) is a Phase-A deliverable; leak blast-radius is bounded by the spend cap (§7) and by the judge/blocklist (a token-holder still only gets a child-safe Guardian). |
| Secrets stance (RT-20) | This repo is **public**: the master prompt, blocklist and endpoint design are world-readable. **Prompt secrecy is NOT a security boundary** — every defense must hold with the prompt fully known. Keeping prompts/keys out of the client bundle stays required as hygiene. Env vars are the only secret store; `.gitignore` must cover `.env*` (Phase-A checklist). Making the repo private = owner decision (§8, recommended). |
| Input validation | Reject >500-char messages, >10 history items, malformed payloads. User text enters the prompt only inside a delimited inert `child_message` block. |
| Distress detection (RT-12) | Two nets: (a) Hebrew keyword pre-net on input — hit skips the model entirely and returns the fixed supportive message from 04-A4 + writes a `distress` flag; (b) the judge pass classifies both input and reply — "uncertain" counts as a hit. **Fail-open-to-safe:** any error in detection → fixed message, never an improvised reply. |
| Output filter (RT-16) | Judge model grades the Guardian reply against the 04-§4 blocklist semantically (Hebrew/English/translit). Hit or judge error → fixed fallback («זו שאלה למבוגרים — כדאי לשאול את אבא או אמא 🙂») + `blocked` flag. |
| Prompt assembly | Master prompt (04-§2) is a server-side constant; context fields (nickname, ageBand, balance, goal, remaining, weeksAtRate) injected as structured data. |
| Errors | Any 4xx/5xx from the model → 04-A9 friendly fallback text, HTTP 200 to the client (a child never sees an error state). Server logs stay server-side. |

## 4. Component map (all new files < ~300 lines; Vite, so the old Babel bug class is moot)

```
src/
├── main.jsx, App.jsx          # mode router: child-mode default when device is bound,
│                              # parent mode behind PIN gate
├── shared/
│   ├── tokens.js              # C palette + crd/btn/INP styles (extracted from App.jsx)
│   ├── Ring.jsx               # REUSED + new percent variant (RT-8)
│   ├── Toast.jsx              # REUSED as-is
│   ├── store.js               # localStorage schemas, derived math, export/import
│   └── api.js                 # the ONLY fetch in the app → /api/guardian
├── child/
│   ├── ChildApp.jsx           # 3-tab shell (הבית / החונך / היעד שלי)
│   ├── Dashboard.jsx          # 30-second dashboard per 01-§5 (4 blocks, all states)
│   ├── GuardianChat.jsx       # chat UI; F1 scripted locally; F2-F5 via proxy
│   ├── GoalWizard.jsx         # 2-step create → pending parent approval
│   ├── GoalDetail.jsx         # ring, remaining, simple history list
│   └── Celebration.jsx        # one-time goal-reached moment
├── parent/
│   ├── ParentGate.jsx         # PIN entry / first-time PIN setup
│   ├── Consent.jsx            # P1: disclosure + consent + appToken generation
│   ├── ChildProfile.jsx       # P2
│   ├── Ledger.jsx             # P3: the only balance write-path
│   └── Oversight.jsx          # P4: transcripts, flags inbox, goal approvals, pause
api/
└── guardian.js                # the proxy (§3)
legacy/
└── index-standalone.html      # retired Babel copy, unreferenced
```

Adult modules (`SimulatorScreen`, `ProfileScreen`) move under `src/adult/` **unmodified**
— they stay reachable only from parent mode, and their broken AI call is out of scope
(fixing it later can reuse this same proxy pattern).

## 5. Parent controls (P1–P4 behaviors)

- **P1 Consent:** plain-Hebrew disclosure (what the Guardian is, what data exists, what
  the child will be told about oversight); consent checkbox writes `consentAt`;
  generates `appToken`; sets parent PIN (hashed; soft gate per §2).
- **P3 Ledger:** add allowance/deposit/spend with note; weekly-allowance quick button;
  14-day staleness nudge lives here (RT-4 — the nudge targets the parent, never the child).
- **P4 Oversight:** transcript view honoring `oversightMode` (recommendation: `full`;
  owner decision §8.2 — F1's disclosure line ships in the matching variant, RT-17);
  **flags inbox** for `distress`/`blocked` events (RT-12 — parent visibility is the
  escalation channel); goal approve/reject; module pause switch; export/import backup.
- **Distress urgency (RT-24):** distress flags are exempt from the ≤1/day notification
  cap (that cap protects the child surface; parent safety alerts are a separate
  channel). Unseen distress flags render as a prominent badge on the parent PIN screen
  itself — not only inside P4. Push notifications arrive with the PWA phase.
- **Degraded-mode visibility (RT-21):** repeated judge/proxy failures in a day surface
  a "system degraded" notice in parent mode, so a fail-safe dead Guardian is never a
  silent mystery.

## 6. Build phases (each = one approval + verification; /redteam after C)

- **Phase A — infrastructure:** restructure to `src/` layout; extract shared components;
  adult modules moved unmodified — except one guard: a prominent SB-8 warning comment
  above the legacy direct-API fetch («never put a key here — route through /api», RT-23);
  `.gitignore` covering `.env*` + no-secrets-in-repo check (RT-20); token rotation
  procedure documented (RT-19); `api/guardian.js` deployed with env vars; **verify:**
  branch preview deployment renders the old adult app unchanged, `grep` of built `dist/`
  proves no API key or master prompt in the client bundle, proxy answers a test call.
- **Phase B — child & parent surfaces (no AI):** store.js, parent P1–P4, child shell,
  dashboard with all states, goal wizard/detail/celebration; **verify:** 30-second test
  walkthrough on a phone-sized viewport; full flow parent-creates-child → allowance →
  goal → ring updates.
- **Phase C — the Guardian:** chat UI, F1 scripted flow, proxy wiring, distress/filter
  nets, flags inbox live; **verify:** scripted abuse-flow test list (A1–A9 from 04) run
  manually and results logged; then full `/redteam` of the built MVP.

## 7. Acceptance checklist (definition of done for the coded MVP)

- [ ] No API key, master prompt, or blocklist text present in the built client bundle
- [ ] All Guardian-visible numbers arrive as server-computed fields (RT-13)
- [ ] Distress path returns the fixed message with the model unavailable (RT-12 fail-safe)
- [ ] A2/A3 abuse probes (incl. English + «אבא אמר שמותר») get the designed redirects
- [ ] Child mode renders zero adult data even after profile switches (RT-6/RT-14)
- [ ] 30-second test passes on a real phone (01-§5 criterion)
- [ ] ≤1 notification/day, tips are content not pings (SB-7/RT-15)
- [ ] Parent flags inbox shows distress/blocked events (RT-12)
- [ ] Export/import round-trips the full family state
- [ ] **BLOCKING (RT-22):** owner has set a hard spend limit in the Anthropic console
      before Phase C goes live — client/IP caps are friction, this is the backstop
- [ ] `main` + live Vercel site unchanged until owner merges after Phase C — **do not
      merge this branch to `main` before Phase-C sign-off (RT-26)**; use the branch
      preview URL to try work-in-progress

## 8. Decisions ratified in this step / still open

| Decision | Status |
|---|---|
| Stack: Vite + serverless proxy (not Next.js) | Working decision — owner ratifies with Phase A approval |
| Platform: responsive web → PWA later | Working decision (recommended in session) |
| Oversight granularity (§8.2) | **Still open** — default build: `full` transcripts |
| Real store audit before launch (§8.3) | Open, pre-launch |
| Repo visibility (RT-20) | **Still open** — recommended: make `alonkos22/aura` private (Settings → General → Danger Zone) |
