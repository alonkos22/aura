# CLAUDE.md — Aura Project Context

> ## ⚠️ THIS REPO IS AN ARCHIVE (as of 2026-07-08)
> Active development moved to **`alonkos22/aura-nextjs`** (private), which contains the
> full Next.js 16 + TypeScript migration and the unified two-phase Guardian roadmap
> (`docs/00-unified-roadmap.md` there). The design docs in this repo's
> `docs/personal-guardian/` were copied there under `docs/cloud-design/` and continue
> to evolve **there, not here**. Do not develop in this repo; it stays only as history
> and as the source of the currently-deployed Vercel prototype site (`main`).

*Historical context below (accurate up to 2026-07-08):*

## 1. What Aura is
A "Life Intelligence" system whose active MVP is **family financial management and
financial literacy for children**. Core philosophy: the **"30-Second Dashboard"** —
extreme minimalism, one insight at a time, zero clutter. UI language: Hebrew (RTL).

## 2. Current exclusive focus — the Personal Guardian («החונך»)
An AI financial mentor for a child (~12). This is the product's USP — not one feature
among many. **Do not touch the adult modules** (life simulator, profile wizard) until
the Guardian MVP is stable and has passed its own `/redteam`.

## 3. Design progress (see docs/personal-guardian/)
| Step | Doc | Status |
|------|-----|--------|
| /alt3 plan | `00-alt3-plan.md` | ✅ done |
| Step 1 — foundations + child 30-sec dashboard | `01-design-foundations.md` | ✅ passed `/redteam` (`02-…`) |
| Step 2 — Guardian conversation design (master prompt, flows, abuse flows) | `04-conversation-design.md` | ✅ passed `/redteam` (`05-…`) |
| Step 3 — implementation blueprint | `06-implementation-blueprint.md` | ✅ passed `/redteam` (`07-…`) |
| Code — Phase A (infra: src/ restructure + AI proxy) | blueprint §6 | ⏳ awaiting owner approval |
| Code — Phase B (screens, no AI) → Phase C (Guardian chat) | blueprint §6 | ⛔ sequential, after A |

Latest session recap: `docs/personal-guardian/03-recap-2026-07-06.md`.

## 4. True codebase state (verified 2026-07-06 — trust this over any older summary)
- Stack: **Vite + React 18** single-file app (`App.jsx`), Hebrew RTL. **Not Next.js.**
- **Broken:** all AI calls go to `api.anthropic.com` directly from the browser with no
  API key (`App.jsx:90` + inline in `index.html`) → always 401. There is **no backend**.
  Never "fix" this by putting a key in client code — it would be publicly exposed.
- **Inconsistent structure:** root `index.html` is a standalone Babel-in-browser copy of
  the app; that's what Vercel serves. `App.jsx`/`main.jsx` at root are currently dead
  code (proper `src/` layout exists only inside `aura-deploy.zip`).
- `main` branch = owner's last state (2026-05-25). Guardian work lives on branch
  `claude/personal-guardian-design-tm11yf`.

## 5. Hard rules (inherited from red-team gates — blocking)
1. No Guardian chat code before a **server-side AI proxy** exists (RT-1 / SB-8).
2. All safety boundaries SB-1…SB-10 in `01-design-foundations.md` are non-negotiable.
3. Numbers shown/said by the Guardian are server-computed; the model never does ledger
   math (RT-13).
4. Distress detection with fail-open-to-safe fixed message is a mandatory Step-3
   deliverable (RT-12).
5. Adding any screen requires updating the screen inventory in `01` first (scope gate).

## 6. Protocols (slash commands in .claude/commands/)
- **/alt3** — before implementing any feature: produce a 3-step plan, get owner
  approval, implement one step at a time.
- **/redteam** — adversarial audit of the latest completed step; every CRITICAL/HIGH
  finding must be fixed or explicitly gated before the next step.
- **/recap** — end every session by writing a dated recap file to
  `docs/personal-guardian/` and pushing it.

## 7. Workflow rules
- Owner = architect and approver; Claude = technical co-pilot. Present plans before
  code; one step per approval.
- Always commit and push completed work to GitHub (`alonkos22/aura`) — cloud sessions
  are ephemeral; GitHub is the only shared memory between the owner's computer, phone
  sessions, and cloud sessions.
- Work on a feature branch, never directly on `main` (protects the Vercel deployment).
- **Do not merge the Guardian branch to `main` before Phase-C sign-off (RT-26).** Use
  Vercel branch preview URLs to try work-in-progress.

## 8. Open owner decisions
1. Backend timing: server proxy inside Step 3 vs. separate infra task first (§8.1 of `01`).
2. Parent oversight granularity: full transcripts (recommended) vs. topic summaries (§8.2).
3. Platform: responsive web → PWA is the working recommendation; formal decision in Step 3.
4. Real app-store benchmark audit before public launch (§8.3).

## 9. Quality bar
Functional stability over experimental features. The 30-second test
(`01-design-foundations.md` §5) is the UX definition of done for the child dashboard.
