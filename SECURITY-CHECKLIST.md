# HoopRoutine security checklist

Prepared on 2026-10-09 from the supplied HAU APSI template. The student must review the evidence and express the final submission in their own words. These answers distinguish inspected local code from unverified hosting settings. The new database migration has **not** been applied to the existing database.

## Secrets and credentials

| # | Check | Yes / No / N/A | Evidence |
| --- | --- | --- | --- |
| 1 | .env is gitignored and is not in the repository | Yes | `.gitignore` excludes private environment files; read-only `git ls-files` found no tracked private `.env`. |
| 2 | A .env.example with placeholder values only is committed | Yes | Existing tracked root/client/server examples use placeholders; this pass's template updates remain uncommitted. |
| 3 | No real connection string, key, token or password is hardcoded in source or comments | Yes | Inspected application source uses environment settings; authentication test keys are explicitly fictional test fixtures. |
| 4 | Git history was searched for passwords, secrets, API keys and PostgreSQL URLs | Yes | Local reachable history was inspected with `git log --all -p`; identified database URLs were local examples. This is not a scan of unavailable remote history. |
| 5 | Any credential ever committed has been rotated | N/A | No actual credential was identified in the examined local history; the student must confirm any exposure outside that history. |
| 6 | Production credentials live only in hosting environment settings | N/A | No production deployment was performed or inspected; local development credentials remain in ignored files. |

## GitHub Actions

There are no workflow files in this project. Per the supplied template, these workflow checks are N/A. Repository-wide secret scanning and push protection still need a manual GitHub settings review.

| # | Check | Yes / No / N/A | Evidence |
| --- | --- | --- | --- |
| 7 | No secret literal in workflow YAML | N/A | No workflows exist. |
| 8 | Workflows read repository Actions secrets | N/A | No workflows exist. |
| 9 | Workflow steps and a recent run log do not print secrets | N/A | No workflow runs were available or inspected. |
| 10 | Uploaded build artifacts contain no private environment/key files | N/A | No workflow artifacts were uploaded; the local Vite build uses public client configuration only. |
| 11 | Third-party actions are pinned to commit SHAs | N/A | No actions are used. |
| 12 | Secret scanning and push protection enabled | N/A | No Actions workflow applies; repository-level settings remain unverified and must be checked before submission. |

## Database

| # | Check | Yes / No / N/A | Evidence |
| --- | --- | --- | --- |
| 13 | User-input queries use parameters | Yes | Route/service queries use `$1` parameters; request values are not concatenated into SQL. |
| 14 | Database network access is restricted appropriately | No | Provider firewall/network policy was not inspected; verify it in the database dashboard. |
| 15 | Application database role has least privilege | No | The existing role's grants were not queried. Review application versus migration permissions. |
| 16 | Seed/sample data is invented | Yes | Seeds contain workout/drill definitions; automated test accounts use `example.invalid`. |
| 17 | Debug, seed and reset HTTP routes removed | Yes | No such HTTP routes exist; SQL/reset tools are CLI-only and reset requires an explicit destructive confirmation value. |

## Access control

| # | Check | Yes / No / N/A | Evidence |
| --- | --- | --- | --- |
| 18 | The app has an access layer | Yes | Login uses bcrypt, a signed HTTP-only cookie, and revocable database authentication sessions in the updated implementation. |
| 19 | Supabase/Firebase row-level security tested signed out | N/A | The app uses an Express API with PostgreSQL, not a Supabase/Firebase client access model. |
| 20 | Zero Trust instructor policy or shared app password in private workspace | N/A | The app uses individual accounts; it has no Zero Trust gate or shared application password. |
| 21 | Gate covers data routes, including mutations | Yes | Workout, session, and progress routers require authentication and ownership checks; health and login/register intentionally remain public. |
| 22 | Gate secrets are not stored in source | Yes | JWT signing material comes from environment configuration; user passwords are stored as hashes. |

## Input and output

| # | Check | Yes / No / N/A | Evidence |
| --- | --- | --- | --- |
| 23 | Server-side input validation exists | Yes | Shared validation checks body shape, IDs, integer ranges, shooting pairs, names, notes and new-password UTF-8 byte length. |
| 24 | User text is escaped when rendered | Yes | User content is rendered through React text expressions; no unsafe HTML injection sink was found. |
| 25 | Error responses hide internal details | Yes | The API returns generic service errors and request IDs; HTTP tests check that private error text is not returned. |
| 26 | Mutation CORS is not wildcard | Yes | Exact allowed origins are configured; disallowed origins receive 403 before route processing. |

## Repository and privacy

| # | Check | Yes / No / N/A | Evidence |
| --- | --- | --- | --- |
| 27 | No student number, personal email, phone or address in repository/messages | No | Text and two screenshots were reviewed locally, but a final review of all binary assets and public Git metadata is still required. |
| 28 | No classmate personal data | No | None was identified in the inspected text; the student must confirm all asset contents and provenance. |
| 29 | Dependencies use official registries and node_modules is ignored | Yes | Inspected lockfile package URLs use registry.npmjs.org; `.gitignore` excludes node_modules. Vulnerability advisory status is not certified. |
| 30 | Images/fonts/assets owned, licensed or credited | No | Screenshots show the app; complete ownership/license confirmation for all existing submission assets remains a student review item. |
| 31 | Repository visibility checked after the last push | No | No push or remote visibility check was performed; the student must confirm the final repository is public. |

## Anything found and fixed

The review found unsafe optional shooting pairs, missing authentication throttling, and database TLS settings that could disable certificate verification. Code changes now address those checks and add revocable sessions; real PostgreSQL migration, provider permissions, deployment settings, and the remaining No answers still need review. No records were deleted and no secrets were published during this work.
