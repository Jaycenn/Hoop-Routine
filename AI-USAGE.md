# AI Usage Log

I continued using Codex in Week 2 whenever I had difficulty with my code or wanted another perspective on solving a problem. I mainly asked it to help me understand errors, debug issues, and correct parts of my code. Codex also gave me suggestions for improving the new Summary, History, Progress, and Cancel Workout features.

## Entry 1 — Local setup and Neon connection

- Tool: Codex
- My request: Help me understand why Docker would not run and connect my existing project to hosted PostgreSQL instead.
- My work: I developed the React, Express, and PostgreSQL project structure and chose Neon as the database service.
- What I kept or changed: I kept my client/server structure and replaced the local Docker database plan with my Neon connection. Codex helped me correct the environment-variable setup.
- Commit: Pending — no commit created yet.

## Entry 2 — Failed to fetch and CORS debugging

- Tool: Codex
- My request: Help me diagnose the repeated `Failed to fetch` message while both the client and server were running.
- My work: I ran the application, checked the API, and maintained the client and server environment files.
- What I kept or changed: I corrected the API port and allowed client origins after reviewing Codex's debugging suggestions. I tested the client on ports 5173 and 5174 and the API on port 3005.
- Commit: Pending — no commit created yet.

## Entry 3 — Authentication review

- Tool: Codex
- My request: Check my login and account-creation flow so each player's workout data stays connected to that person.
- My work: I developed the authentication screens, routes, PostgreSQL user records, protected API flow, and user-specific data behavior.
- What I kept or changed: I kept the combined Login/Create Account screen. Codex helped me review password validation, cookie settings, CORS, and error handling.
- Commit: Pending — no commit created yet.

## Entry 4 — Workout recording corrections

- Tool: Codex
- My request: Review the Active Workout flow and help correct result-saving or validation problems.
- My work: I developed Today's Workout and Active Workout, including Makes, Attempts, Repetitions, Time, Completed, and Notes.
- What I kept or changed: I kept my workout flow and field design. I used Codex's feedback to correct validation, make sure makes cannot exceed attempts, limit notes, and keep saved results attached to the correct session.
- Commit: Pending — no commit created yet.

## Entry 5 — Week 2 history and progress debugging

- Tool: Codex
- My request: Check the new Workout Summary, Workout History, and Progress calculations and help identify incorrect results.
- My work: I designed and developed the Week 2 screens, API routes, session totals, history behavior, progress statistics, and responsive layouts.
- What I kept or changed: I kept my selected statistics and navigation. Codex helped me check PostgreSQL aggregate queries, distinguish missing shooting data from a real 0% result, and verify that queries only return the authenticated user's sessions.
- Commit: Pending — no commit created yet.

## Entry 6 — Cancel workout and documentation corrections

- Tool: Codex
- My request: Help debug the Cancel Workout feature, stale error messages, and inconsistencies in the Week 2 documentation.
- My work: I developed the cancellation flow, confirmation step, incomplete-session behavior, and the Week 2 project increment.
- What I kept or changed: I kept cancellation limited to unfinished workouts and protected completed sessions. Codex helped me review the ownership check, correct stale `Failed to fetch` behavior, and improve the README and weekly report. I decided to leave preset and custom workout routines for Week 3.
- Commit: Pending — no commit created yet.

## Responsibility statement

The project concept, design choices, feature decisions, implementation, testing decisions, and final submitted work are mine. Codex was used for debugging assistance, code review, suggested corrections, and documentation feedback. I remained responsible for understanding, testing, accepting, changing, or rejecting every suggestion.
