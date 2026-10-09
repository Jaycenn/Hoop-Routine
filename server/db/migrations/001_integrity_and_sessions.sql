-- Applied only by an explicitly invoked migration command. No user rows are deleted.
-- Existing duplicate active sessions require a human decision; never silently merge results.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM workout_sessions WHERE status = 'in_progress'
             GROUP BY user_id, workout_id HAVING COUNT(*) > 1) THEN
    RAISE EXCEPTION 'Duplicate active sessions exist. Review them before applying migration 001; no records were removed.';
  END IF;
END $$;

ALTER TABLE workouts ALTER COLUMN focus TYPE TEXT;
ALTER TABLE workouts DROP CONSTRAINT IF EXISTS workouts_estimated_minutes_check;
ALTER TABLE workouts ADD CONSTRAINT workouts_estimated_minutes_check CHECK (estimated_minutes >= 1);
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS request_key UUID;
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS request_fingerprint TEXT;
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS replaces_workout_id BIGINT REFERENCES workouts(id) ON DELETE RESTRICT;
CREATE UNIQUE INDEX IF NOT EXISTS workouts_request_key_idx ON workouts(owner_user_id, request_key);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'workouts'::regclass AND conname = 'workouts_owner_valid') THEN
    ALTER TABLE workouts ADD CONSTRAINT workouts_owner_valid CHECK (
      (source = 'preset' AND owner_user_id IS NULL) OR (source = 'custom' AND owner_user_id IS NOT NULL)
    ) NOT VALID;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS sessions_one_active_idx
  ON workout_sessions(user_id, workout_id) WHERE status = 'in_progress';
CREATE INDEX IF NOT EXISTS sessions_user_history_idx ON workout_sessions(user_id, id DESC);
ALTER TABLE workout_sessions ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE workout_sessions ADD COLUMN IF NOT EXISTS focus TEXT;
UPDATE workout_sessions s SET title = w.title, focus = w.focus
  FROM workouts w WHERE w.id = s.workout_id AND s.title IS NULL;
ALTER TABLE workout_sessions ALTER COLUMN title SET NOT NULL;
ALTER TABLE workout_sessions ALTER COLUMN focus SET NOT NULL;

CREATE TABLE IF NOT EXISTS session_drills (
  session_id BIGINT NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  drill_id BIGINT NOT NULL REFERENCES drills(id) ON DELETE RESTRICT,
  position INTEGER NOT NULL CHECK (position > 0),
  name TEXT NOT NULL, category TEXT NOT NULL, instructions TEXT NOT NULL, equipment TEXT NOT NULL,
  target_makes INTEGER, target_attempts INTEGER, target_repetitions INTEGER, target_seconds INTEGER,
  PRIMARY KEY (session_id, drill_id), UNIQUE (session_id, position)
);
-- Historical snapshots use the definitions available at migration time.
INSERT INTO session_drills
SELECT s.id, d.id, wd.position, d.name, d.category, d.instructions, d.equipment,
       d.target_makes, d.target_attempts, d.target_repetitions, d.target_seconds
FROM workout_sessions s JOIN workout_drills wd ON wd.workout_id = s.workout_id
JOIN drills d ON d.id = wd.drill_id ON CONFLICT (session_id, drill_id) DO NOTHING;
-- Preserve recorded drills even if a preset's current membership changed earlier.
INSERT INTO session_drills
SELECT r.session_id, d.id,
       (COALESCE((SELECT MAX(sd.position) FROM session_drills sd WHERE sd.session_id = r.session_id), 0)
       + ROW_NUMBER() OVER (PARTITION BY r.session_id ORDER BY d.id))::int,
       d.name, d.category, d.instructions, d.equipment,
       d.target_makes, d.target_attempts, d.target_repetitions, d.target_seconds
FROM drill_results r JOIN drills d ON d.id = r.drill_id
WHERE NOT EXISTS (SELECT 1 FROM session_drills sd WHERE sd.session_id = r.session_id AND sd.drill_id = r.drill_id);
ALTER TABLE drill_results ADD CONSTRAINT results_session_drill_fk
  FOREIGN KEY (session_id, drill_id) REFERENCES session_drills(session_id, drill_id) ON DELETE CASCADE;
-- Preserve legacy incomplete measurements, but reject new invalid pairs.
ALTER TABLE drill_results DROP CONSTRAINT IF EXISTS results_attempts_valid;
ALTER TABLE drill_results ADD CONSTRAINT results_attempts_valid
  CHECK (makes IS NULL OR (attempts IS NOT NULL AND makes <= attempts)) NOT VALID;

CREATE TABLE IF NOT EXISTS auth_sessions (
  id UUID PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS auth_sessions_expiry_idx ON auth_sessions(expires_at);
