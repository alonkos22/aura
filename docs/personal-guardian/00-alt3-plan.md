# /alt3 — Personal Guardian Module: 3-Step Design Plan

**Scope:** *Design the Personal Guardian module — conversation flow, screens, and the child-facing 30-second dashboard.*
**Date:** 2026-07-06 · **Branch:** `claude/personal-guardian-design-tm11yf`
**Rule:** Implement one step at a time. Each step must pass `/redteam` before the next step begins.

---

## Reality check (codebase vs. brief) — read first

The repository currently contains **Aura Slim v1.0**: a single-file Hebrew/RTL React app
(`App.jsx`, ~40KB) on **Vite** (not Next.js), with a splash screen, a profile wizard, an
adult life-simulator, a dashboard, and a 3-item bottom nav. There is **no Next.js
scaffolding, no Prisma, no CLAUDE.md package** in this repo. Per the continuation brief
(Section 7), the codebase wins: this plan is written to be **stack-agnostic at the design
level**, and the stack decision (stay on Vite vs. migrate to Next.js 14) is deferred to
Step 3, where it becomes an implementation concern.

Reusable assets already in the codebase: the design-token object `C`, the `Ring` progress
component, `Toast`, `BottomNav`, and the card/button style helpers — all suitable for the
child module with palette adjustments.

**Known-broken state (found 2026-07-06, drives Step 3 decisions):**
1. Both app versions call `https://api.anthropic.com/v1/messages` directly from the
   browser **with no API key header** — every AI call fails with 401. There is no backend
   at all; a key added client-side would be publicly exposed. → The Guardian chat REQUIRES
   a server-side proxy (Vercel serverless function or Next.js route). This is the real
   root cause behind the "Vercel production debugging" noted in the brief §6.
2. Repo structure is inconsistent: `App.jsx`/`main.jsx` sit at the repo root, but the root
   `index.html` is a *standalone Babel-in-browser* copy of the app that never loads them.
   What Vercel deploys is the standalone `index.html`; the Vite `App.jsx` is currently
   dead code. The last two commits ("Update index.html") were hand-patches to that
   standalone file — that is exactly where previous work stopped.
3. `aura-deploy.zip` contains the correct Vite layout (`src/App.jsx`, `src/main.jsx`,
   630-byte entry `index.html`) — the root files appear to be an incomplete manual upload
   of that package.

---

## Step 1 — Design Foundations & the Child 30-Second Dashboard (THIS SESSION)

**Goal:** Lock the non-negotiables before any conversation or code exists: who the users
are, what the safety boundaries are, what the child sees in the first 30 seconds, and what
screens exist at all.

**Deliverables (documents, no code):**
1. Personas: the child user (~12), the parent/guardian (admin & consent-holder).
2. Competitive benchmark takeaways — the specific UX clutter to avoid (Section 4 of brief).
3. Hard safety boundaries — the rules the Guardian and the UI may never break.
4. Information architecture: child view vs. parent view, navigation model (max 4 items).
5. The child-facing **30-Second Dashboard** spec: content hierarchy, wireframe, and the
   "30-second test" acceptance criteria.
6. Screen inventory: every screen in the MVP, one line of purpose each. Nothing more.

**Explicitly out of scope for Step 1:** dialogue scripts, master-prompt text, data models,
component code, parent-app detail beyond what safety requires.

**Done when:** `/redteam` has been run against the foundations document and every
CRITICAL/HIGH finding is either fixed in the document or logged as an owner decision.

---

## Step 2 — Guardian Conversation Design

**Goal:** Design the AI interaction itself, inside the boundaries fixed in Step 1.

**Deliverables:**
1. The Guardian **master prompt** (system prompt): role, tone, pedagogical scaffolding
   rules ("explain how & why, don't hand out answers"), reading level (~12 y/o), Hebrew
   as the primary language, refusal & redirection behavior.
2. Conversation flows: first-run introduction, "ask about my goal", "why can't I buy X
   now", weekly reflection — each as a state/flow diagram plus 1 sample scripted dialogue.
3. Failure & abuse flows: off-topic requests, attempts to extract adult financial advice,
   prompt-injection attempts, distress signals → escalation to parent.
4. Topic allowlist/blocklist derived from Step 1 safety boundaries.

**Done when:** `/redteam` passes with focus on child-safety of the conversation design
(injection, inappropriate content, over-trust, data leakage into prompts).

---

## Step 3 — Implementation Blueprint

**Goal:** Turn Steps 1–2 into a build-ready spec — still a spec, with code starting only
after it passes review.

**Deliverables:**
1. Stack decision resolved: extend the existing Vite app vs. migrate to Next.js 14 —
   decided with the owner, based on the Vercel deployment issues (brief §6).
2. Component map: which existing components (`Ring`, `Toast`, `BottomNav`, tokens) are
   reused, which are new; file layout that respects the known ~35KB/file bug class if
   the Vite path is kept.
3. Data model: child profile, virtual ledger, goals, Guardian chat log, parent-consent
   records (Prisma schema draft if Next.js path wins; localStorage schema otherwise).
4. Parent controls spec: consent, allowance entry, transcript visibility, limits.
5. Acceptance checklist tying back to the 30-second test and safety boundaries.

**Done when:** `/redteam` passes on the blueprint; only then does implementation of the
child MVP begin, one component at a time. Adult modules stay untouched throughout
(brief §8.4).
