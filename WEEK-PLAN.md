# HoopRoutine development plan

This plan records the three increments using the separate Week 1 AI log, the Week 2 report, and the current Week 3 files. Status is current as of October 9, 2026.

## Week 1 — Foundation and primary flow

- [x] Separate React client, Express server, and PostgreSQL database
- [x] Login and account creation
- [x] Today's Workout and Active Workout
- [x] Save basic drill results for the signed-in player
- [x] First responsive layout and setup instructions

## Week 2 — Results and progress

- [x] Workout Summary with session totals
- [x] History for completed and unfinished sessions
- [x] Progress totals, accuracy trends, and drill-category results
- [x] Confirmed cancellation of an unfinished session
- [x] Empty states, responsive layouts, and clearer documentation
- [ ] Physical-device and accessibility review; the earlier report left this open

## Week 3 — Expanded workouts and final submission

- [x] Sixteen preset workouts, a 46-drill library, filters, equipment, and expandable guidance in local code
- [x] Private custom routines with ordered drills and history-safe editing
- [x] Session snapshots, safer result saving/completion, validation, authentication, and regression tests
- [x] Private Neon backup, isolated restore and Migration 001 rehearsal
- [x] Migration 001 applied to Neon by the student; status reported as `applied`
- [ ] Confirm login, saving, completion, History, and Progress end to end against the migrated database
- [ ] Decide whether to run the separately reviewed seed; it has **not** been applied to live Neon, so the revised drill wording is not yet live
- [ ] Refresh screenshots and finish the slides, 3–5 minute video, and 1080 × 1080 named project image
- [ ] Review the security checklist and AI authorship evidence, then submit public repository and presentation links

Deployment is optional under the supplied finals instructions. Do not use `db:reset` or `db:schema` on the existing Neon database.

