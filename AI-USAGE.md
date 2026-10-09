# HoopRoutine — AI Usage Log

## My work and Codex's role

HoopRoutine began with my basketball experience and my idea for an app that helps players plan workouts, record results, and track progress. I planned the features, drills, statistics, and user experience, and I personally worked on and coded much of the original foundation. I used **OpenAI Codex** throughout development to help improve my existing codebase. Its role grew from setup and debugging help to directly writing or substantially revising parts of the React interface, Express API, PostgreSQL code, tests, and documentation.

I directed the work, reviewed results, tested the app, and asked for corrections when something was wrong. Those decisions matter, but they are not the same as manually writing code. Because Codex also helped with the foundation, I cannot yet identify every function I wrote entirely myself or support a precise student-written percentage. The APSI requirement of at least 20% student-written code remains **unverified**. The README credits Codex and links to this log.

## How I used AI

Each entry names the tool, my request, what I kept or changed, and the related commit. Existing commits show project progress; they do not prove who typed each line. Week 3 commit links must be added after I review and commit that work.

### 1. Week 1 — Foundation and database setup

- **Tool:** OpenAI Codex.
- **Request:** Help set up my React, Express, and PostgreSQL project and resolve local Docker and database connection problems.
- **Kept or changed:** I kept the separate client/server structure and chose Neon for PostgreSQL hosting. I worked on the original foundation; Codex helped configure and troubleshoot it.
- **Commit:** [HoopRoutine foundation](https://github.com/Jaycenn/Hoop-Routine/commit/c92e28749b138fe2ac29ea2ebb850f9dd30e16b9).

### 2. Week 1 — Accounts and workout recording

- **Tool:** OpenAI Codex.
- **Request:** Help connect login to each player's data and build the Today and Active Workout flow for shooting makes, attempts, repetitions, completion, and notes.
- **Kept or changed:** I kept one Login/Create Account screen and the workout fields I planned. Codex helped implement and debug authentication, result validation, and saving results to the right session.
- **Commit:** [HoopRoutine foundation](https://github.com/Jaycenn/Hoop-Routine/commit/c92e28749b138fe2ac29ea2ebb850f9dd30e16b9).

### 3. Week 2 — Summary, History, and Progress

- **Tool:** OpenAI Codex.
- **Request:** Add useful views of completed and unfinished workouts, shooting accuracy, training time, and progress over several sessions.
- **Kept or changed:** I chose the statistics and navigation. Codex helped build and debug the React screens, API routes, and PostgreSQL totals. We kept “no attempts recorded” separate from a real 0% shooting result.
- **Commit:** [Week 2 history and progress features](https://github.com/Jaycenn/Hoop-Routine/commit/02796f5820c964d0ce112dab4ce7918397acccee).

### 4. Week 2 — Cancellation and documentation

- **Tool:** OpenAI Codex.
- **Request:** Let a player cancel an unfinished workout without changing completed history, and make the Week 2 documentation match the app.
- **Kept or changed:** I kept a confirmation step and restricted cancellation to the signed-in player's unfinished session. Codex helped review the route, error handling, README, and report.
- **Commits:** [Week 2 feature code](https://github.com/Jaycenn/Hoop-Routine/commit/02796f5820c964d0ce112dab4ce7918397acccee) and [Week 2 documentation](https://github.com/Jaycenn/Hoop-Routine/commit/4bce507f4dc9ed6f4eb1b25a4b4e444a21eeba35).

### 5. Week 3 — More workouts and clearer guidance

- **Tool:** OpenAI Codex.
- **Request:** Add preset and custom routines, drill selection and ordering, off-court and recovery training, and clearer instructions for people unfamiliar with a drill.
- **Kept or changed:** I kept HoopRoutine's visual style and chose how the basketball routines should work. Codex directly contributed the builder, API and database changes, filters, and expandable guides. The revised wording for 46 drills is in the local seed file; it has **not** been seeded to live Neon.
- **Commit:** Pending — add the real Week 3 source commit after I review and make it.

### 6. Week 3 — Reliability, tests, and migration safety

- **Tool:** OpenAI Codex.
- **Request:** Audit and strengthen saving, completion, login sessions, validation, migrations, and seeding while preserving all existing data.
- **Kept or changed:** I required the React/Express/PostgreSQL architecture and existing records to remain. Codex directly wrote substantial fixes, migration/seed safeguards, tests, and documentation. The private backup restored to an isolated PostgreSQL database, Migration 001 passed there, and I later ran only that migration on Neon. Its status showed `applied`; the live seed and reset were not run. The local safety run passed 45 test cases, but the full live-backed app flow still needs a final walkthrough.
- **Commit:** Pending — add the real Week 3 source commit after I review and make it. The database operation itself has no code commit.

## Where AI-assisted work needed correction

| AI output or behavior | Problem and correction | Fix commit |
| --- | --- | --- |
| An earlier Codex seed rewrite would have replaced existing preset drill assignments if run. | That could lose customized assignments or metadata. The revised `server/db/seed.sql` preserves existing workouts and assignments; isolated regression tests passed. The live seed was not run. | Pending Week 3 commit. |
| Codex changed the login button state to `aria-pressed` but initially left CSS targeting `aria-selected`. | The selected button could lose its styling. `client/src/styles.css` now targets the correct state; visual review is still needed. | Pending Week 3 commit. |
| Codex's earlier README and report still described Migration 001 as pending after I applied it. | That made the setup instructions misleading. I corrected the documents to record the applied migration and the still-pending seed. | Pending Week 3 documentation commit. |

These cases are why I reviewed AI output instead of accepting it automatically. The fixes are real, but I will not invent commit links before making the Week 3 commit.

## Who wrote what

I personally coded much of HoopRoutine's original working foundation, as well as developing its basketball concept and training requirements. The [foundation commit](https://github.com/Jaycenn/Hoop-Routine/commit/c92e28749b138fe2ac29ea2ebb850f9dd30e16b9) shows the early application, but a commit under my account cannot prove who manually typed each part because I also used Codex. These are six meaningful **candidate** contributions from that original code. Each one is **Awaiting student confirmation** of my manual authorship before I claim it as personally written. The explanations describe what the code does; they do not establish authorship by themselves.

1. **Database model — Awaiting student confirmation.** File: `server/db/schema.sql`; original code: the `users`, `workouts`, `drills`, `workout_drills`, `workout_sessions`, and `drill_results` table definitions in the [foundation commit](https://github.com/Jaycenn/Hoop-Routine/commit/c92e28749b138fe2ac29ea2ebb850f9dd30e16b9). I can explain how these tables connect a player to a workout session and its saved drill results. The `workout_drills` table keeps drills in order, while checks such as makes not exceeding attempts reject invalid numbers. These core tables remained in Week 2 and still exist in Week 3, with additional columns and a session snapshot table added later.

2. **Account routes — Awaiting student confirmation.** File: `server/routes/auth.js`; original code: `POST /register` and `POST /login` in the [foundation commit](https://github.com/Jaycenn/Hoop-Routine/commit/c92e28749b138fe2ac29ea2ebb850f9dd30e16b9). I can explain why registration validates the input, hashes the password, and saves the account, and why login checks the password before returning the user. Those routes gave players separate accounts for their workouts. They remained in Week 2; Codex substantially revised their Week 3 implementation for database-backed sessions and stronger checks.

3. **Today's workout API — Awaiting student confirmation.** File: `server/routes/workouts.js`; original code: `GET /today` in the [foundation commit](https://github.com/Jaycenn/Hoop-Routine/commit/c92e28749b138fe2ac29ea2ebb850f9dd30e16b9). I can explain how this route fetched an active workout, joined its assigned drills, and returned them in the right order for the frontend. It was the link between the stored training plan and the Today screen. Week 2 kept this route; Week 3 still has `GET /today`, but Codex expanded the loading logic for preset and user-owned custom workouts.

4. **Starting or resuming a session — Awaiting student confirmation.** File: `server/routes/sessions.js`; original code: `POST /` in the [foundation commit](https://github.com/Jaycenn/Hoop-Routine/commit/c92e28749b138fe2ac29ea2ebb850f9dd30e16b9). I can explain how it checked the workout, looked for an unfinished session belonging to the signed-in user, and either reused that session or created a new one. That let a player continue a workout instead of starting over. The Week 2 route kept this flow; in Week 3 Codex moved the main work into `server/lib/sessionOperations.js` and added a transaction and saved drill snapshots.

5. **Saving drill results — Awaiting student confirmation.** File: `server/routes/sessions.js`; original code: `normalizeResultBody` and `PATCH /:sessionId/drills/:drillId` in the [foundation commit](https://github.com/Jaycenn/Hoop-Routine/commit/c92e28749b138fe2ac29ea2ebb850f9dd30e16b9). I can explain why the code checked nonnegative numbers, prevented makes from exceeding attempts, and confirmed the drill belonged to that workout. The parameterized `INSERT ... ON CONFLICT DO UPDATE` saved a player's result again without creating a duplicate. Week 2 retained this approach; Week 3 moved validation and saving into shared helpers and `sessionOperations.save`.

6. **Active workout screen — Awaiting student confirmation.** File: `client/src/pages/WorkoutPage.jsx`; original code: `loadSession` and `saveResult` in the [foundation commit](https://github.com/Jaycenn/Hoop-Routine/commit/c92e28749b138fe2ac29ea2ebb850f9dd30e16b9). I can explain how the screen loaded a session, opened the next unfinished drill, sent the result to the API, and moved to the next drill or completed the workout. This was the player's main recording flow. Week 2 built on it; Week 3 still uses a `WorkoutPage` and `saveResult`, but Codex substantially changed them to handle drafts, retries, and safer completion.

One clear **AI-written** example is `server/lib/sessionOperations.js`, which Codex added in Week 3. My current understanding of its `complete` operation is that it starts a database transaction and locks the signed-in player's session row. A second save, cancellation, or completion request for that session must wait. If the workout is already complete, it returns without changing the original finish time. Otherwise, it can save the final drill result, checks that at least one drill is complete, and then records the finish time and duration. If a step fails, the transaction rolls back.

I need to confirm which of the six original examples I personally wrote, then keep only those claims and explain them in my own words. Git verifies when the code appeared and how it changed, but does not verify manual authorship or the required 20% share. Codex later made substantial changes to the same codebase; the Week 3 fix commit links also remain to be added after I make those commits.
