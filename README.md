# HoopRoutine

HoopRoutine is a responsive basketball training app for players who want a prepared daily routine and a simple way to record and review their work. This Week 2 version supports accounts, today's workout, active workout recording, workout summaries, history, and progress statistics.

## Week 2 status

### Working now

- Create an account, log in, and log out.
- Keep workout data connected to the authenticated player.
- View a prepared daily workout and its ordered drills.
- Start or resume an unfinished workout.
- Cancel an unfinished workout and remove its saved draft results after confirmation.
- Record makes, attempts, repetitions, time, completed status, and notes.
- Finish a workout and save it to PostgreSQL.
- Review a completed session with shooting accuracy and workout totals.
- Browse completed and unfinished sessions in Workout History.
- Resume an unfinished workout from History.
- View accumulated workouts, training time, completed drills, accuracy trends, and category results in Progress.
- Use the working screens on phone, tablet, and desktop.

### Remaining before the final

- Route and database integration tests
- Updated Week 2 screenshots
- Accessibility and physical-device testing
- Deployment and production configuration
- Final loading, error-state, and visual polish

Summary, History, and Progress now use the authenticated player's saved PostgreSQL data. The remaining work is testing, documentation, deployment, and final quality—not placeholder implementation.

## Technology

- Client: React 18, Vite, React Router, and plain CSS
- Server: Node.js and Express
- Database: PostgreSQL
- Authentication: bcrypt password hashing and a signed JWT stored in an HTTP-only cookie

## Setup and installation

### Requirements

- Node.js 20 or newer
- npm
- A free hosted PostgreSQL database, such as Neon
- An internet connection
- Git

### 1. Get the code

```bash
git clone https://github.com/Jaycenn/Hoop-Routine.git
cd Hoop-Routine
```

### 2. Create the PostgreSQL database

Create a PostgreSQL project in Neon and select a nearby region. From the Neon dashboard, open **Connect**, keep connection pooling enabled, and copy the complete connection string. Keep this value private and never paste it into a public file or commit it to GitHub.

### 3. Configure the server

```powershell
cd server
npm install
Copy-Item .env.example .env
```

Update `server/.env`:

```env
PORT=3005
DATABASE_URL="PASTE_YOUR_PRIVATE_NEON_CONNECTION_STRING_HERE"
JWT_SECRET=replace-this-with-at-least-32-random-characters
CORS_ORIGINS=http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174
COOKIE_SAME_SITE=lax
DATABASE_SSL=true
```

Create the tables and starter workout:

```powershell
npm run db:schema
npm run db:seed
```

`npm run db:reset` deletes existing HoopRoutine data before rebuilding the database. Use it only when you intentionally want a fresh database.

### 4. Configure the client

Open another terminal in the repository root:

```powershell
cd client
npm install
Copy-Item .env.example .env
```

The default client configuration is:

```env
VITE_API_URL=http://localhost:3005/api
```

## How to run it

Start the API from `server/`:

```powershell
npm run dev
```

Start React from `client/` in a second terminal:

```powershell
npm run dev
```

Open the `Local:` URL printed by Vite, normally `http://localhost:5173` or `http://localhost:5174`. Create an account, open Today's Workout, and start recording drill results.

## Current usage flow

1. Create an account or log in.
2. Review the workout on **Today**.
3. Select **Start workout**.
4. Enter the active drill's result and select **Save and continue**.
5. If needed, select **Cancel workout** and confirm to delete the unfinished session.
6. After the last drill, select **Finish workout**.
7. Review the completed session on **Workout Summary**.
8. Open **History** to revisit completed sessions or resume an unfinished one.
9. Open **Progress** to review totals, recent accuracy, and category results.

## Current API endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Check the API and database connection |
| `POST` | `/api/auth/register` | Create an account and start a session |
| `POST` | `/api/auth/login` | Authenticate an existing account |
| `GET` | `/api/auth/me` | Return the authenticated user |
| `POST` | `/api/auth/logout` | Clear the authentication cookie |
| `GET` | `/api/workouts/today` | Return today's workout and ordered drills |
| `POST` | `/api/sessions` | Start or resume a workout session |
| `GET` | `/api/sessions` | Return the authenticated player's recent sessions |
| `GET` | `/api/sessions/:sessionId` | Return one owned session and its drill results |
| `DELETE` | `/api/sessions/:sessionId` | Cancel and delete one owned unfinished session |
| `PATCH` | `/api/sessions/:sessionId/drills/:drillId` | Save one drill result |
| `POST` | `/api/sessions/:sessionId/complete` | Complete an owned workout session |
| `GET` | `/api/progress` | Return totals, recent accuracy, and category results |

## Project structure

```text
Hoop-Routine/
├── client/
│   └── src/
│       ├── components/    reusable interface pieces
│       ├── context/       authentication state
│       ├── pages/         account, workout, summary, history, and progress screens
│       ├── api.js         API request helper
│       └── styles.css     shared and responsive styles
├── server/
│   ├── db/                schema, seed data, and database pool
│   ├── lib/               authentication and validation helpers
│   ├── routes/            current REST API routes
│   └── test/              starter unit tests
├── REPORT.md              current weekly increment report
└── WEEK-PLAN.md           planned development increments
```

## Validation and security

- Passwords are hashed with bcrypt.
- Authentication uses an HTTP-only cookie.
- SQL queries use parameters.
- Workout sessions are restricted by the authenticated user's ID.
- Numeric results must be non-negative whole numbers.
- Makes cannot be greater than attempts.
- Notes are limited to 500 characters.

## Checks

```powershell
cd server
npm test
npm run check

cd ../client
npm run build
```

## Known issues and next steps

- Week 2 Summary, History, and Progress still need realistic multi-session testing against Neon.
- Route and database integration tests have not been added yet.
- The project still needs final loading, error, responsive, and accessibility testing.
- The app is not deployed yet.

## Screenshots

### Login and account creation

![HoopRoutine login page](docs/screenshots/Login_Page.png)

### Today’s Workout

![HoopRoutine Today's Workout page](docs/screenshots/Today_Page.png)

Updated screenshots of Workout Summary, Workout History, and Progress will be added after the Week 2 Neon test run. The existing History and Progress image files are retained as Week 1 evidence and are not presented here as current functionality.
