# HoopRoutine — Week 2 Project Increment Report

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
