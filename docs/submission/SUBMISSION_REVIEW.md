# Week 3 submission review

**Official deadline: Friday, October 9, 2026 at 23:59 (UTC+8), with no late window.** This review uses the finals instructions, documentation guide, templates, rubrics, and security checklist supplied by the student on October 9. Deployment is optional; a public project repository is required.

## Prepared locally

- Updated [project README](../../README.md) with setup, database upgrades, run commands, API usage, screenshots, and known limitations.
- Updated [REPORT.md](../../REPORT.md), retained the earlier Week 2 report, and disclosed this AI-assisted implementation pass in [AI-USAGE.md](../../AI-USAGE.md).
- Drafted the exact 31-row [SECURITY-CHECKLIST.md](../../SECURITY-CHECKLIST.md), with explicit unverified items. The student must review its evidence in their own words.
- Updated the [presentation outline](PRESENTATION_OUTLINE.md) to cover problem, demo, technology, challenges, and next steps.
- Updated the [video outline](DEMO_VIDEO_OUTLINE.md) for 4:45 total, including a 2:15 AI segment, face, voice, app walkthrough, and code explanation.
- Retained seven existing [screenshots](../screenshots/README.md), the editable [five-slide presentation](HoopRoutine_Week3_Presentation.pptx), and the [project image](HoopRoutine_Project_Image.png). **These binary assets were not refreshed in the October 9 code pass.** The image is 1254 × 1254 and does not yet meet the required 1080 × 1080 format or name requirement.

## Verification and limits

- Final safety command: `node --test --test-skip-pattern="PostgreSQL migrations, seed, snapshots, constraints, and concurrent session lifecycle" server/test/*.test.js client/test/*.test.js`. **45 test cases passed; 0 failed.** Node reports 46 passes including its wrapper for the excluded external database test file. Seven new cases run actual SQL in ephemeral PGlite databases; five new cases cover timeout configuration and transaction failure cleanup. HTTP tests use controlled database substitutes and temporary localhost ports. No private environment file is loaded by these tests.
- `npm --prefix server run check`: server syntax checks passed.
- `npm --prefix client run build`: production build passed.
- No live database writes were performed. A prior approved read-only inspection checked Neon compatibility; this local safety follow-up did not connect to Neon. No backup was created.
- Actual SQL and representative legacy upgrades pass in memory. Neon connectivity/pooling, multi-client lock contention, restoration of a real backup, physical-device layouts, keyboard/screen-reader behavior, and a complete running-app walkthrough remain unverified.

## Required final review, in order

1. **Database and app:** Review migration `server/db/migrations/001_integrity_and_sessions.sql`. Obtain the owner's approval before applying it to an existing database. First run the opt-in integration suite against a disposable local database named `hooproutine_test` using the README instructions. The updated server requires the migration. Apply the reviewed seed update separately for the new guides; do not reset the database. Existing login cookies will require signing in again.
2. **Screenshots:** After the upgrade and smoke test, refresh the main app screens with fictional demo data. Check all images for private information and stale UI. The previous capture note says a capture-only account was removed; this pass did not independently verify that old database cleanup.
3. **Slides — 25 points:** Edit the existing PPTX using the revised outline, especially explicit technology, challenges, and next steps. Review every slide visually, then provide a readable slides link or PDF. An updated outline alone is not an updated deck.
4. **Video — 60 points:** Record 3–5 minutes, show your face, use your own voice, demonstrate the app and code, and explain your choices. Include **2–3 minutes on AI usage and code you wrote yourself within that total**. Upload to Google Drive, enable public viewing, and test the link signed out. No video has been recorded or uploaded here.
5. **Square image — 15 points:** Make the final image exactly **1080 × 1080**, containing HoopRoutine's title, your name, and a screenshot or logo. The course also prohibits personal names in the public project repository: keep the named final asset in your private class workspace or presentation Drive folder. `docs/submission/private/` is ignored as an optional local staging location; no named image was created in this pass.
6. **AI badge — 100 points:** Review the existing log and the new disclosure. Supply at least six genuine entries with tool/request/kept-or-changed details and real commit links; three real AI mistakes with output/problem/fix/commit; student-written files/functions and commit evidence proving at least 20%; and your own explanation of an AI-written piece. The README credit and documentation badge are present. The documentation badge does not claim that the course badge has been awarded. Student authorship, attribution of earlier mistakes, and new commit evidence are still pending.
7. **Security and privacy:** Confirm all checklist rows, including database network restrictions, least-privilege role, asset licensing, sensitive data in repository history/assets, and GitHub visibility/protection settings. A drafted checklist is not independent proof of those external settings.
8. **Private class workspace:** Create/update its `project/README.md` using the supplied template, linking the correct public project repository, AI-USAGE.md, video, slides, and image. Keep real reports and personal weekly journals in the class workspace. This source repository is not assumed to be that private workspace; no personal journals or classroom links were invented.
9. **Public links and Canvas:** The student decides when to commit/push. Then verify the required repository and Drive links from a signed-out browser and submit the final project, presentation, and badge links in Canvas before the deadline. Repository visibility and template provenance were not verified remotely.

## Rubric readiness

| Requirement | Status |
| --- | --- |
| Node/Express/PostgreSQL implementation and API | Improved locally; real database and full app verification pending |
| Documentation's seven required sections | Present; new screenshots and clean setup walkthrough pending |
| Security checklist | All 31 rows drafted with answers/evidence; student/external checks pending |
| AI-USAGE.md and README credit | Present; 20% authorship and complete commit/mistake evidence pending |
| Video | Timing/content outline prepared; recording and public Drive link pending |
| Slides | Outline revised; existing PPTX still needs edits and visual review |
| 1080 × 1080 named image | Existing draft retained; final format/name pending |
| Private workspace bridge, reports, journals | Student must supply/verify in their actual class workspace |

All October 9 changes remain local. No commit, push, pull, fetch, branch change, deployment, or database reset was performed.
