# HoopRoutine — Project Increment Report

**Project:** [HoopRoutine — Basketball Training and Performance Tracker](README.md)

**Development covered:** Weeks 1–3, through October 9, 2026

**Live app:** [hooproutine.vercel.app](https://hooproutine.vercel.app/)

HoopRoutine is my basketball training app for planning workouts, recording drill results, and reviewing progress. I developed the original idea, basketball routines, user flow, and much of the initial code foundation. I directed the later work and tested the results. OpenAI Codex substantially helped expand, revise, debug, and test the implementation, and directly wrote some later code. [AI-USAGE.md](AI-USAGE.md) explains that assistance; the exact student-written code share is still unverified.

## Progress across the three weeks

| Week | Main increment | Evidence |
| --- | --- | --- |
| **1 — foundation** | Built the initial React client, Express API, PostgreSQL schema, account flow, Today's Workout, and active workout recording. Summary, History, and Progress were still placeholders. | [Foundation commit `c92e287`](https://github.com/Jaycenn/Hoop-Routine/commit/c92e287) |
| **2 — review saved training** | Added a working Workout Summary, History with completed and unfinished sessions, Progress totals and accuracy trends, reusable interface components, and mobile layouts. | [Feature commit `02796f5`](https://github.com/Jaycenn/Hoop-Routine/commit/02796f5), [documentation `4bce507`](https://github.com/Jaycenn/Hoop-Routine/commit/4bce507) |
| **3 — reliability and release** | Improved custom workouts, drill guidance, transactions, validation, migration safety, tests, and documentation. Applied Migration 001 after an isolated rehearsal and deployed the client and API to Vercel with Neon. | [Week 3 source `46e8495`](https://github.com/Jaycenn/Hoop-Routine/commit/46e8495) |

These commits show when work entered Git; the commit author alone does not prove which individual lines I wrote without AI.

## Week 3 increment: October 5–9, 2026

### What changed and why

- **Workout flow:** Players can choose from 16 preset workouts or build a private custom routine from the 46-drill library. Custom edits preserve earlier session history. Draft recovery and clearer controls reduce lost input while recording.
- **Results and review:** Saving, finishing, and cancelling a session now use transactions and owned-session locks. A final drill and workout completion can save together; repeated completion keeps the original finish time. History pagination and corrected accuracy totals make older and incomplete data easier to read.
- **Guidance and layout:** The local catalog has clearer drill instructions, equipment, and targets. Tablet/mobile layouts, loading states, and progress labels were refined. The revised seed has **not** been run on live Neon, so existing live drill descriptions may still use the earlier wording.
- **Database and security:** Migration 001 adds session drill snapshots, stronger result constraints, revocable login sessions, and rules for active sessions. Server validation, TLS checks, authentication rate limits, and safe error responses were tightened. The React, Express, and PostgreSQL architecture stayed in place.
- **Deployment:** One Vercel Hobby project now serves the React site and existing Express API on the same HTTPS origin. Neon remains the database. The live [health endpoint](https://hooproutine.vercel.app/api/health) returned `{"status":"ok"}` after querying PostgreSQL.

### Problems I ran into and how they were handled

| Problem | Resolution or current status |
| --- | --- |
| An earlier seed could replace preset drill assignments or overwrite custom-workout metadata. | The seed was changed to preserve existing ownership, metadata, and assignments. Isolated tests passed; it was **not** run on live Neon. |
| Repeated or simultaneous workout requests could conflict or duplicate work. | Transactions, row locks, retry IDs, and idempotent completion made saves and finishes predictable. |
| Results with makes but no recorded attempts could make accuracy misleading. | Summary and Progress exclude those legacy makes from accuracy calculations while preserving the saved results. |
| A local login screen previously could not reach the API. | The local services were started with matching settings; production uses same-origin `/api` requests and secure cookies. The deployed API login flow passed. |
| The initial Vercel GitHub connection did not complete. | The CLI deployment works, but a later GitHub push alone will not redeploy the app. |

### Database protection and verification

A private Neon backup was restored into an isolated PostgreSQL database before live changes. Migration 001 passed there; the recorded comparison found the original table fingerprints unchanged and added eight historical drill snapshots. I then applied **only Migration 001** to live Neon. My terminal reported it as `applied`, and a subsequent Neon count check matched the expected pre-deployment account, workout, drill, assignment, session, result, and snapshot totals. No live schema reset or seed ran.

On October 9, the local checks passed **45 tests**, server syntax checks, and the React production build. The separate external PostgreSQL integration test was skipped by default. The public site and login page returned HTTP 200, the database-backed health endpoint returned HTTP 200, and signed-out protected routes returned HTTP 401.

With approval, I created one clearly named **HoopRoutine Deployment Test** account. Through the public API, registration, login, preset listing, drill listing, custom create/edit/reopen, result saving, completion, Summary data, History, Progress, logout, and login again passed. The test left one account and two completed sessions in Neon; it did not intentionally change earlier users or sessions. These were API checks, not a full browser click-through of every screen.

## What remains

- The seven [application screenshots](docs/screenshots/README.md) were captured on October 5 with illustrative demo data. They are real HoopRoutine screens, but they predate the latest code and should be compared with the current interface before final use. Physical phone/tablet, keyboard, and screen-reader checks remain.
- Live Neon still has the earlier drill wording because the revised seed was not run. Seeding is separate from Migration 001 and needs its own review.
- Email ownership is not verified by a confirmation link or code. A password-recovery flow is not implemented.
- The October 9 client audit reported a high-severity `source-map-js@1.2.1` advisory through the Vite/PostCSS build chain. It needs a reviewed dependency update and retest. The Vercel Git connection also remains unlinked.
- The presentation deck, demo video, and named 1080 × 1080 project image need final human review. Specific student-written functions and the course's manual-code threshold still need evidence in [AI-USAGE.md](AI-USAGE.md).

The report and README describe completed work and open limitations. They do not claim a manual authorship percentage or that the remaining presentation materials were submitted.
