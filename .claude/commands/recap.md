---
description: End-of-session recap so the next session continues from an accurate point
---

# /recap — Session Continuation Point

Write (or update) a dated recap file in `docs/personal-guardian/` containing exactly
four sections:

1. **Topic** — what this session was about, one paragraph.
2. **Completed** — what was actually finished and verified (with file names / commits).
   Report honestly: skipped or failed items are listed as such, not as done.
3. **Open issues** — owner decisions pending, known bugs, gates inherited from
   `/redteam` findings.
4. **Next steps** — the exact next action and what approval it is waiting on.

Then update the progress table in `CLAUDE.md` if step statuses changed, commit
everything, and push. Close with a short Hebrew summary to the owner including the
one-line message they can use to resume in any future session.
