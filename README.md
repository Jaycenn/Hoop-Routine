# HoopRoutine

HoopRoutine is a responsive basketball training app for players who want a prepared daily routine and a simple way to record their work. This Week 1 version supports accounts, today's workout, an active workout, and saved drill results.

## Week 1 status

### Working now

- Create an account, log in, and log out.
- Keep workout data connected to the authenticated player.
- View a prepared daily workout and its ordered drills.
- Start or resume an unfinished workout.
- Record makes, attempts, repetitions, time, completed status, and notes.
- Finish a workout and save it to PostgreSQL.
- Use the working screens on phone, tablet, and desktop.

### Planned next

- Workout Summary
- Workout History
- Progress totals and accuracy trends
- More complete validation, route tests, screenshots, deployment, and final visual polish

The three planned screens are included as honest placeholders so the navigation matches the approved five-screen plan without presenting unfinished features as complete.

## Technology

- Client: React 18, Vite, React Router, and plain CSS
- Server: Node.js and Express
- Database: PostgreSQL
- Authentication: bcrypt password hashing and a signed JWT stored in an HTTP-only cookie

## Setup and installation

### Requirements

- Node.js 20 or newer
- npm
- PostgreSQL 15 or newer, or Docker Desktop
- Git

### 1. Get the code

```bash
git clone https://github.com/Jaycenn/Hoop-Routine.git
cd Hoop-Routine
```

### 2. Start PostgreSQL

Copy the root environment example and replace the placeholder password.

```powershell
Copy-Item .env.example .env
docker compose up -d db
```

You can also use an existing PostgreSQL installation. Create a database named `hooproutine` and put its connection URL in `server/.env`.

### 3. Configure the server

```powershell
cd server
npm install
Copy-Item .env.example .env
```

Update `server/.env`:

```env
PORT=3001
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/hooproutine
JWT_SECRET=replace-this-with-at-least-32-random-characters
CORS_ORIGINS=http://localhost:5173
COOKIE_SAME_SITE=lax
DATABASE_SSL=false
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
VITE_API_URL=http://localhost:3001/api
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

Open `http://localhost:5173`. Create an account, open Today's Workout, and start recording drill results.

## Current usage flow

1. Create an account or log in.
2. Review the workout on **Today**.
3. Select **Start workout**.
4. Enter the active drill's result and select **Save and continue**.
5. After the last drill, select **Finish workout**.
6. Return to Today with confirmation that the session was saved.

History, Progress, and the detailed Workout Summary are planned for the next increment.

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
| `GET` | `/api/sessions/:sessionId` | Return one owned session and its drill results |
| `PATCH` | `/api/sessions/:sessionId/drills/:drillId` | Save one drill result |
| `POST` | `/api/sessions/:sessionId/complete` | Complete an owned workout session |

## Project structure

```text
Hoop-Routine/
├── client/
│   └── src/
│       ├── components/    reusable interface pieces
│       ├── context/       authentication state
│       ├── pages/         account, workout, and planned screens
│       ├── api.js         API request helper
│       └── styles.css     shared and responsive styles
├── server/
│   ├── db/                schema, seed data, and database pool
│   ├── lib/               authentication and validation helpers
│   ├── routes/            current REST API routes
│   └── test/              starter unit tests
├── REPORT.md              Week 1 increment report
└── WEEK-PLAN.md           planned development increments
```

## Validation and security completed in Week 1

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

## Screenshots

Screenshots of Login, Today's Workout, and Active Workout still need to be captured from the app running with PostgreSQL and added under `docs/screenshots/`.

## Known issues and next steps

- Summary, History, and Progress are placeholders in this increment.
- PostgreSQL setup still needs to be tested on the final development computer.
- Route and database integration tests have not been added yet.
- The project still needs final loading, error, responsive, and accessibility testing.
- The app is not deployed yet.

## Screenshots

### Login and account creation

![HoopRoutine login page](docs/screenshots/Login_Page.png)

### Today’s Workout

![HoopRoutine Today's Workout page](docs/screenshots/Today_Page.png)

### Active Workout

![HoopRoutine active workout page](docs/screenshots/Workout_Page.png)

### Workout History — Week 2 placeholder

![Workout History placeholder](docs/screenshots/History_Page.png)

### Progress — Week 2 placeholder

![Progress placeholder](docs/screenshots/Progress_Page.png)