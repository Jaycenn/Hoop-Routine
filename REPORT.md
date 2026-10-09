# HoopRoutine — Project Increment Report

## Week 3: October 5–9, 2026

This section records Week 3 work through October 9. Codex directly implemented part of the local code and documentation; see [AI-USAGE.md](AI-USAGE.md). The new source changes remain uncommitted. After an isolated rehearsal, the student ran Migration 001 on Neon and showed its status as `applied`. The seed script has not been run on live Neon. The earlier Week 2 report is retained below as historical context.

### What changed this week

- Prepared a versioned database migration for longer custom-workout metadata, unique active sessions, immutable session drill snapshots, login-session revocation, and stronger result constraints.
- Wrapped saving, finishing, and cancelling sessions in transactions using the same owned-session row lock. Finishing the last drill and the workout can now happen atomically, and repeated completion keeps the original finish time.
- Added retry keys to custom-workout creation/editing and draft recovery to the workout form and builder.
- Tightened request validation, password byte limits, authentication rate limiting, startup environment validation, database TLS verification, and safe API error responses.
- Corrected shooting totals when legacy makes have no attempts; added History pagination and clearer authentication/network retry states.
- Expanded all 46 drill guides with equipment, explicit workloads, and recording instructions. Shared target formatting and clarified rounds in the interface.
- Adjusted tablet/mobile layouts, accessible control states, progress labels, and disabled/busy behavior.
- Added regression tests, an opt-in disposable PostgreSQL integration suite, complete setup instructions, the 31-row security checklist, and revised finals presentation/video outlines.
- Created and checked a private pre-migration Neon backup, restored it into an isolated PostgreSQL database, and rehearsed Migration 001 there. The original table fingerprints stayed the same and eight historical drill snapshots were added. Local API checks covered login, custom-workout saving, result saving, completion, History, and Progress.
- The student applied only Migration 001 to live Neon. Its reported status changed from `pending` to `applied`; a subsequent Neon count check showed the expected accounts, workouts, drills, assignments, sessions, results, and snapshots. No live seed or reset was run.

### Why

The student originated HoopRoutine's concept, basketball training content, feature direction, and original foundation. Codex substantially assisted with implementation. The Week 3 audit found cases where a valid workout could fail to save, concurrent requests could conflict, or the interface could lose inputs or misrepresent results. The fixes keep the React, Express, PostgreSQL, and HoopRoutine design. The documentation follows the APSI finals requirements supplied on October 9.

### What broke or what remains unverified

- The earlier seed would have replaced preset drill assignments and could have overwritten custom-workout metadata. The corrected seed passed isolated tests, but it has **not** been applied to live Neon; the new drill wording is therefore still only in the local seed file.
- The local safety run passed 45 test cases, with no failures. Node also counted the wrapper for an excluded external PostgreSQL test file. Server syntax checks and a React production build passed. The isolated restore and migration tested real PostgreSQL, while the default suite also used disposable PGlite and fake connections.
- The live migration status and counts were checked from the student's terminal and Neon SQL Editor. A complete post-migration login-to-progress walkthrough on the live-backed app has not yet been confirmed in this report. The server was reported to start successfully; an earlier login screenshot showed a client-to-server connection error.
- Screenshots, the five-slide deck, and the 1254 × 1254 draft project image predate the latest changes. The deck still needs explicit technology and challenges content; the final image needs the student's name and the required 1080 × 1080 size. Physical-device and accessibility checks are also open.
- Student-written code and a 20% authorship share cannot be established from the available notes or Git history alone. The student must identify their own functions and explain them. Week 3 commit links remain pending.

### What is left

1. With the backend running, confirm login, custom-workout saving, drill-result saving, completion, History, and Progress against the migrated Neon database. Do not rerun the migration, schema initializer, or reset.
2. Review the revised exercise wording. Run the seed only if the new guides are needed now and only after a separate decision; it is not required for the migrated schema to work. Then refresh screenshots with nonpersonal demo data.
3. Review all security-checklist evidence and identify the code the student personally wrote for `AI-USAGE.md`. Add only real commit links after the student makes those commits.
4. Update the slides, record the required 3–5 minute video with face/voice and a 2–3 minute AI segment, and make the named 1080 × 1080 image for the private presentation submission.
5. Verify the public repository and Drive links, then submit the final project, presentation, and AI badge links in Canvas by October 9, 2026 at 23:59 (UTC+8). Deployment is optional. No commit, push, or deployment was performed as part of this documentation edit.

---

# Archived Week 2 report

The following describes the earlier increment; its then-open tasks and behavior are not a statement of the current implementation.

## Week of: September 24–27, 2026

## What changed this week

- Replaced the Week 1 Workout Summary placeholder with a working summary screen that loads the completed session from the API.
- Added session totals for completed drills, training time, shots made, shooting attempts, shooting accuracy, and repetitions.
- Changed the end of the Active Workout flow so finishing the last drill opens the saved Workout Summary instead of returning directly to Today.
- Replaced the Workout History placeholder with a working history screen.
- Added `GET /api/sessions` to return up to 30 recent sessions belonging only to the authenticated player.
- Made completed history entries open their summaries and unfinished entries reopen the active workout.
- Added a confirmed Cancel Workout action that deletes only the authenticated player's unfinished session and its draft drill results.
- Replaced the Progress placeholder with a working progress dashboard.
- Added `GET /api/progress` to calculate total workouts, training minutes, completed drills, overall shooting accuracy, recent accuracy results, and results grouped by drill category.
- Added reusable `StatCard`, `HistoryListItem`, `AccuracyChart`, and `EmptyState` components.
- Added clear empty states for players who have not completed a workout or do not yet have shooting-attempt data.
- Added responsive styles for Summary, History, and Progress so the layouts stack on mobile without horizontal page scrolling.
- Removed the unused placeholder page from the Week 1 increment.
- Expanded the server syntax check to include the new progress route.
- Ran the server unit tests and syntax checks successfully and created a successful React production build.

## Why

Week 1 established authentication, Today's Workout, the Active Workout form, and database saving. The purpose of the Week 2 increment was to make the saved results useful after a workout. Players can now review one completed session, return to older sessions, resume an unfinished session, and see accumulated training statistics.

The new API queries keep every result connected to the authenticated user. The summary helps immediately after a workout, History makes earlier sessions accessible, and Progress turns several sessions into understandable totals and trends. Reusable cards, list items, charts, and empty states keep these screens consistent with the approved HoopRoutine design system.

## What broke or what I got stuck on

- Progress cannot treat “no shooting attempts recorded” as the same thing as `0%` accuracy. I had to keep accuracy as `null` when there are no attempts and display a dash or explanation instead of a misleading percentage.
- Workout History contains both completed and unfinished sessions. The screen needed separate behavior so a completed entry opens its summary while an unfinished entry returns to the active workout.
- Progress data required several related totals from PostgreSQL. The queries had to limit results to the authenticated player's completed sessions and group category totals without mixing data from other users.
- A useful accuracy trend needs more than one completed workout. The interface works with limited data, but the chart still needs realistic multi-session testing against the Neon database.
- The automated checks cover validation and confirm that the code parses and builds, but route-level database integration tests are still missing.

## What is left

- Test the complete Week 2 flow with several workouts stored in Neon, including unfinished sessions and sessions without shooting attempts.
- Add integration tests for authentication, session ownership, history queries, progress queries, and error responses.
- Improve loading, network-error, and validation messages.
- Perform a keyboard, focus, contrast, and screen-reader review.
- Test phone, tablet, and desktop layouts on physical devices and confirm there is no horizontal scrolling.
- Capture updated screenshots of Workout Summary, Workout History, and Progress for the Week 2 documentation update.
- Complete the required Week 2 security checklist in the private class workspace.
- Update `AI-USAGE.md` with the real commit links after the Week 2 changes are committed.
- Configure production environment variables, deploy the client and API, and test secure cookies and CORS on the live domains.
- Complete final visual polish, deployment documentation, presentation materials, and the demonstration video during Week 3.
