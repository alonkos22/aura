# Step 1 — Design Foundations & the Child 30-Second Dashboard

**Status:** Implemented per `/alt3` plan (`00-alt3-plan.md`) · **Date:** 2026-07-06
**Red-team:** see `02-redteam-step1.md` — findings RT-1…RT-9 are resolved or logged below.
No code in this step. UI copy samples are in Hebrew because the product UI is Hebrew/RTL.

---

## 1. Personas

### The Child — "נועה", age 12 (design range: 10–14)
- Gets a weekly allowance (דמי כיס) in cash and/or via a parent's payment app; has no bank
  account of her own that this product touches.
- Mobile-first, short sessions (1–3 minutes), reads Hebrew comfortably at a 6th–7th grade
  level. Will not read paragraphs; will read one sentence attached to a number or picture.
- Motivation: saving toward a concrete thing (game, bike, phone accessories) — not
  "financial literacy" as an abstraction.

### The Parent — "אלון", age ~40
- Admin and legal consent-holder. Creates the child's profile, funds the virtual ledger,
  approves goals, and can review Guardian conversations.
- Wants visibility without micromanaging; will tolerate ~1 short weekly interaction with
  the app (top-up + glance), not a daily chore.

---

## 2. Benchmark takeaways — the clutter we refuse to ship

*Method note (honesty): desk-research from prior knowledge of Greenlight, GoHenry,
BusyKid, Rooster Money and FamZoo — not a fresh store audit. A real App Store / Play
Store pass is scheduled as follow-up (see §8). Findings below are the stable, well-known
patterns of the category.*

**Category clutter to avoid — each item below is a hard "no" for Aura's child module:**
1. **Home screens with 5–7 navigation items** (balance, chores, invest, shop, cards,
   learn…). Aura child nav is capped at **3 items** (§4).
2. **Commerce and upsell inside the child view** — gift-card shops, "invest" tabs, card
   upgrade banners. Aura's child view contains **zero commercial surfaces**.
3. **Gamification overload** — badge walls, streaks, leaderboards that shame lapses.
   Aura keeps exactly one progress metaphor: the goal ring.
4. **Notification spam** as an engagement lever. Aura: max **one** child notification per
   day, default off except goal milestones (SB-7).
5. **Adult finance leaking into the child UX** (real card controls, investing for kids).
   Aura's child money is a parent-managed virtual ledger only (SB-1).

**Worth keeping from the category:** the "goal jar" visualization (proven mental model —
our goal ring is its minimal version), and the parent-approval loop for money events.

**Positioning:** these products are US/UK, card-centric, and English-only. A Hebrew,
RTL, teach-first child module with a 30-second surface has no direct local competitor —
this is the USP, per the project brief.

---

## 3. Hard safety boundaries (SB) — non-negotiable, inherited by Steps 2–3

| # | Boundary |
|---|----------|
| SB-1 | The child module never connects to real bank accounts, cards, or payments. Child money is a **virtual ledger** written only by the parent. |
| SB-2 | The Guardian never recommends adult financial products: no stocks, crypto, loans, credit, leverage — not even "when you grow up you should buy…". |
| SB-3 | The Guardian never instructs a real-money action. Anything touching real money ends with routing to the parent («דברי על זה עם אבא/אמא»). |
| SB-4 | **Parent-first onboarding.** A child profile can only be created from inside a parent's account. There is no self-signup path for minors. |
| SB-5 | Data minimization for the child: nickname + age band + goals + ledger. No surname, school, address, photos, contacts, or location. |
| SB-6 | **Disclosed transparency:** the parent can review Guardian conversations, and the child is told this in the first-run flow, in child language. (Granularity — full transcript vs. topic summary — is an owner decision, see §8.) |
| SB-7 | No dark patterns: no streak-shaming, no sibling comparisons, no countdown pressure, ≤1 notification/day. |
| SB-8 | **All AI calls go through our server.** No Anthropic API key ever ships to the browser. (Driven by red-team finding RT-1; the current codebase violates this for the adult simulator and must not be copied.) |
| SB-9 | Language: Hebrew, ~12-year-old reading level, short sentences, no financial jargon without an immediate one-line explanation. |
| SB-10 | Distress, self-harm, bullying or abuse signals in chat → fixed supportive response (no improvised advice) + flag raised to the parent. |

---

## 4. Information architecture

One app, **two hard-separated modes**:

```
Aura
├── Parent mode  (everything that exists today + guardian admin)
│   ├── existing adult modules (untouched, out of scope)
│   └── "הילדים שלי" — child profiles, ledger top-ups, goal approvals,
│       conversation review, settings
└── Child mode   (what נועה sees — and the ONLY thing she sees)
    ├── 🏠 הבית      — the 30-second dashboard (§5)
    ├── 💬 החונך     — Guardian chat (designed in Step 2)
    └── 🎯 היעד שלי  — goal detail & history
```

**Rules (red-team-driven, RT-6):**
- Child mode must not render, route to, or preload any adult module or adult profile
  data (income, savings, health). Isolation is at the data layer, not just navigation.
- Entering parent mode from a shared device requires a parent PIN. Child mode is the
  default state of a device marked as the child's.
- Child bottom-nav is capped at 3 items. "Learning" is not a fourth tab — lessons arrive
  as Guardian conversation quests (Step 2), keeping the surface minimal.
- Everything in child mode is reachable in ≤2 taps from the dashboard.

---

## 5. The 30-Second Dashboard (child home screen)

### The 30-second test — acceptance criterion
Within 30 seconds of opening the app, without scrolling and without any tap, the child
can answer three questions:
1. **כמה כסף יש לי?** (How much do I have?)
2. **כמה אני קרובה ליעד שלי?** (How close am I to my goal?)
3. **מה שווה לעשות או ללמוד היום?** (What's one thing worth doing today?)

If a design change makes any of the three require a tap or scroll — the change is
rejected. This test is the module's definition of done at the UX level.

### Content hierarchy (top → bottom, exactly four blocks)

```
┌──────────────────────────────────────┐
│  היי נועה 👋                          │   greeting, small
│                                      │
│           ₪ 142                      │   1) BALANCE — biggest element
│        הכסף שלי                       │      on screen, parent-fed ledger
│                                      │
│        ╭────────╮                    │   2) GOAL RING — reused Ring
│        │  68%   │  🚲 אופניים         │      component in % mode,
│        ╰────────╯  עוד ₪ 96          │      goal name + remaining
│                                      │
│  ┌────────────────────────────────┐  │   3) GUARDIAN CARD — one
│  │ 💡 החונך: ידעת שאם תחסכי         │  │      sentence, one idea per day
│  │ ₪10 בשבוע, תגיעי ליעד עוד       │  │
│  │ חודשיים? ספר לי עוד ←           │  │      tap → opens chat with this
│  └────────────────────────────────┘  │      topic preloaded
│                                      │
│  ┌────────────────────────────────┐  │   4) ONE action button
│  │      💬 לדבר עם החונך            │  │
│  └────────────────────────────────┘  │
│                                      │
│   🏠 הבית   💬 החונך   🎯 היעד שלי    │   3-item bottom nav
└──────────────────────────────────────┘
```

**What is deliberately NOT on this screen:** transaction lists, charts, badges, streaks,
multiple tips, shop/upsell of any kind, adult-module entry points, settings. History
lives one tap away inside «היעד שלי».

### States
- **No goal yet (first runs):** the ring block is replaced by a single card —
  «🎯 מה החלום שלך? בואי נבחר יעד ראשון» → 2-step goal wizard (C4).
- **Zero balance:** balance shows ₪0 with supportive copy «מתחילים! כל חיסכון מתחיל מ-0» —
  never an empty/red/error treatment.
- **Stale ledger** (parent hasn't updated in 14+ days, RT-4): child view unchanged; the
  *parent* gets the nudge «העדכן את הקופה של נועה». The child is never told her parent
  is neglecting the app.
- **Goal reached:** one-time celebration screen, then prompt to pick the next goal —
  the only "gamified" moment in the module.

### Visual & RTL notes
- Reuse existing tokens (`C`, card/btn styles) and the `Ring` component — `Ring`
  currently hardcodes a "/100" caption and must gain a `%` variant when reused (RT-8).
- Layout is RTL; amounts render as «₪ 142» with LTR digit runs inside RTL text —
  use `‎` (LRM) or `dir="ltr"` spans around amounts to prevent mis-ordering (RT-8).
- Child mode may use a brighter accent, but readability beats neon: body text contrast
  ≥ WCAG AA on the dark background.

---

## 6. Screen inventory — the complete MVP surface (9 screens)

**Parent mode (inside existing app):**
| ID | Screen | Purpose (one line) |
|----|--------|--------------------|
| P1 | Consent & intro | Parent reads what the module does, what data is kept, what the child will be told; explicit consent checkbox (SB-4). |
| P2 | Child profile | Nickname, age band, weekly allowance amount; generates child-mode access. |
| P3 | Ledger | Add allowance / deposit / spend entries to the virtual ledger; this is the only write-path to the child's balance (SB-1). |
| P4 | Oversight & settings | Review Guardian conversations (SB-6), approve goals, notification settings, pause module. |

**Child mode:**
| ID | Screen | Purpose (one line) |
|----|--------|--------------------|
| C1 | First-run welcome | ≤3 screens: meet the Guardian, «ההורים יכולים לראות את השיחות שלנו» disclosure (SB-6), pick avatar color. |
| C2 | 30-Second Dashboard | §5 — the home surface. |
| C3 | Guardian chat | Conversation with the Guardian; interaction design is Step 2's deliverable. |
| C4 | Goal wizard + detail | 2-step create (what? costs how much?) → parent approves (P4); detail shows ring, remaining amount, simple history list. |
| C5 | Goal celebration | One-time goal-reached moment; prompts next goal. |

Anything not in this table is out of MVP scope. Adding a screen requires updating this
document first — that is the anti-scope-creep gate.

---

## 7. Step-1 exit checklist

- [x] Personas defined (child + parent)
- [x] Benchmark clutter list → concrete "never ship" rules (§2)
- [x] Safety boundaries SB-1…SB-10 written and numbered for citation in Steps 2–3
- [x] IA with hard child/parent isolation and 3-item child nav
- [x] 30-Second Dashboard spec with testable acceptance criterion and all states
- [x] Complete screen inventory (9 screens) as the scope-creep gate
- [x] `/redteam` executed → `02-redteam-step1.md`

---

## 8. Open owner decisions (carried forward, do not block Step 2)

1. **Backend timing (from RT-1 / SB-8):** fix the missing server-side proxy as part of
   Step 3, or as a separate infrastructure task before it? *(Also fixes the broken adult
   simulator — currently every AI call in production fails with 401.)*
2. **Transcript granularity (SB-6):** parent sees full transcripts vs. topic summaries.
   Recommendation: full transcripts for MVP (simplest + safest), disclosed to the child.
3. **Benchmark follow-up:** schedule a real store audit to replace the desk-research
   pass in §2 before public launch.
