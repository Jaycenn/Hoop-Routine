# HoopRoutine — Week 1 Project Increment Report

## Week of: September 21–24, 2026

## What changed this week

- Set up the HoopRoutine repository with a React and Vite client, an Express server, and PostgreSQL database scripts.
- Built one combined Login/Create Account screen so each player's workout records can be stored separately.
- Added password hashing, an HTTP-only authentication cookie, logout, and a protected current-user endpoint.
- Created the first database schema for users, workouts, drills, workout sessions, and drill results.
- Added a starter daily workout with warm-up, shooting, layup, ball-handling, and conditioning drills.
- Built the working Today's Workout screen with the workout details and ordered drill list.
- Built the working Active Workout screen and result form.
- Added fields for makes, attempts, repetitions, time, completed status, and notes.
- Added basic validation and ownership checks before results are saved.
- Added starter responsive layouts for phone, tablet, and desktop.
- Added placeholders for Workout Summary, Workout History, and Progress so the navigation still matches the approved project plan.
- Added basic validation tests and confirmed that the React project produces a production build.

## Why

The goal for Week 1 was to establish the app's foundation and prove its most important flow. A player can now create an account, view a prepared workout, work through the drills, enter results, and save the completed session.

Authentication is included because saved results must belong to the correct player. Today's Workout remains the main screen, so a separate landing page or dashboard was not added. Summary, History, and Progress are still part of the approved HoopRoutine plan, but they will be built from the session data in later increments.

## What broke or what I got stuck on

- The repository began without application code, so the client, server, database structure, and documentation all had to be set up first.
- The client needs a running PostgreSQL-backed API for the complete flow. PostgreSQL or Docker is not available in the current testing environment, so the real database connection still has to be verified on the development computer.
- The active-workout form saves the required fields, but the app does not yet show the saved data in a summary, history list, or progress calculation.
- The responsive layout has a working foundation, but it still needs more testing on a physical phone and at tablet widths.
- Error states are basic and need clearer messages before the final version.

## What is left

- Build the Workout Summary screen from a completed session.
- Build the Workout History endpoint and screen.
- Build progress totals, shooting accuracy, and category statistics.
- Add route and database integration tests.
- Improve loading, empty, validation, and network-error states.
- Run the schema and seed scripts using a real PostgreSQL database.
- Capture real screenshots of Login, Today's Workout, and Active Workout.
- Test and polish the phone, tablet, and desktop layouts.
- Configure deployment environment variables and deploy the client, server, and database.
- Update the documentation with the live URL and final screenshots.

