CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  display_name VARCHAR(80) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT users_display_name_not_blank CHECK (BTRIM(display_name) <> '')
);

CREATE TABLE IF NOT EXISTS workouts (
  id BIGSERIAL PRIMARY KEY,
  slug VARCHAR(80) NOT NULL UNIQUE,
  title VARCHAR(120) NOT NULL,
  focus VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  estimated_minutes INTEGER NOT NULL CHECK (estimated_minutes BETWEEN 1 AND 300),
  difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS drills (
  id BIGSERIAL PRIMARY KEY,
  slug VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  category VARCHAR(40) NOT NULL,
  instructions TEXT NOT NULL,
  target_makes INTEGER CHECK (target_makes >= 0),
  target_attempts INTEGER CHECK (target_attempts >= 0),
  target_repetitions INTEGER CHECK (target_repetitions >= 0),
  target_seconds INTEGER CHECK (target_seconds >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT drills_attempt_target_valid CHECK (
    target_makes IS NULL OR target_attempts IS NULL OR target_makes <= target_attempts
  )
);

CREATE TABLE IF NOT EXISTS workout_drills (
  workout_id BIGINT NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  drill_id BIGINT NOT NULL REFERENCES drills(id) ON DELETE RESTRICT,
  position INTEGER NOT NULL CHECK (position > 0),
  PRIMARY KEY (workout_id, drill_id),
  UNIQUE (workout_id, position)
);

CREATE TABLE IF NOT EXISTS workout_sessions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workout_id BIGINT NOT NULL REFERENCES workouts(id) ON DELETE RESTRICT,
  status VARCHAR(20) NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'completed')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  total_seconds INTEGER CHECK (total_seconds >= 0),
  CONSTRAINT sessions_completion_valid CHECK (
    (status = 'in_progress' AND completed_at IS NULL)
    OR (status = 'completed' AND completed_at IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS drill_results (
  id BIGSERIAL PRIMARY KEY,
  session_id BIGINT NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  drill_id BIGINT NOT NULL REFERENCES drills(id) ON DELETE RESTRICT,
  makes INTEGER CHECK (makes >= 0),
  attempts INTEGER CHECK (attempts >= 0),
  repetitions INTEGER CHECK (repetitions >= 0),
  time_seconds INTEGER CHECK (time_seconds >= 0),
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  notes VARCHAR(500) NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, drill_id),
  CONSTRAINT results_attempts_valid CHECK (
    makes IS NULL OR attempts IS NULL OR makes <= attempts
  )
);

CREATE INDEX IF NOT EXISTS sessions_user_completed_idx
  ON workout_sessions(user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS results_session_idx ON drill_results(session_id);

