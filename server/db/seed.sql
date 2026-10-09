-- Run through db:seed / the migration runner, inside one transaction.
-- Existing workout metadata and ALL existing assignments are preserved.
-- Only shared drill instructions and equipment are refreshed on matching slugs.
CREATE TEMP TABLE hooproutine_seed_workouts (
  slug TEXT PRIMARY KEY, title TEXT, focus TEXT, description TEXT,
  estimated_minutes INTEGER, difficulty TEXT, source TEXT, owner_user_id BIGINT,
  training_type TEXT, equipment TEXT
) ON COMMIT DROP;
CREATE TEMP TABLE hooproutine_seed_drills (
  slug TEXT PRIMARY KEY, name TEXT, category TEXT, instructions TEXT,
  target_makes INTEGER, target_attempts INTEGER, target_repetitions INTEGER, target_seconds INTEGER,
  training_type TEXT, equipment TEXT
) ON COMMIT DROP;
CREATE TEMP TABLE hooproutine_seed_assignments (
  workout_slug TEXT, drill_slug TEXT, position INTEGER CHECK (position > 0),
  PRIMARY KEY (workout_slug, drill_slug), UNIQUE (workout_slug, position)
) ON COMMIT DROP;
CREATE TEMP TABLE hooproutine_seed_new_workouts (id BIGINT PRIMARY KEY, slug TEXT UNIQUE) ON COMMIT DROP;

INSERT INTO hooproutine_seed_workouts
  (slug, title, focus, description, estimated_minutes, difficulty, source, owner_user_id)
VALUES
  (
    'complete-guard-workout',
    'Complete Guard Workout',
    'Shooting, finishing, ball handling, and conditioning',
    'A balanced session that develops game-ready guard skills from warm-up through conditioning.',
    45,
    'Intermediate',
    'preset',
    NULL
  ),
  (
    'shooters-touch',
    'Shooter''s Touch',
    'Shooting',
    'A focused shooting session for mechanics, range, movement, and pressure free throws.',
    42,
    'Intermediate',
    'preset',
    NULL
  ),
  (
    'finish-strong',
    'Finish Strong',
    'Finishing',
    'Build touch, footwork, and confidence around the rim with finishes from both sides.',
    38,
    'Intermediate',
    'preset',
    NULL
  ),
  (
    'handle-the-pressure',
    'Handle the Pressure',
    'Ball handling',
    'Improve control, pace changes, and direction changes while keeping your eyes up.',
    36,
    'Intermediate',
    'preset',
    NULL
  ),
  (
    'game-shape',
    'Game Shape',
    'Conditioning',
    'Train repeat sprint ability, defensive movement, and recovery between hard efforts.',
    35,
    'Advanced',
    'preset',
    NULL
  ),
  (
    'quick-skill-tuneup',
    'Quick Skill Tune-up',
    'Warm-up, shooting, and recovery',
    'A shorter fundamentals session for days when you want focused work without skipping preparation or recovery.',
    26,
    'Beginner',
    'preset',
    NULL
  ),
  (
    'three-level-scorer',
    'Three-level Scorer',
    'Shooting and scoring',
    'Build a complete scoring package with catch-and-shoot work, pull-ups, step-backs, floaters, and pressure free throws.',
    64,
    'Advanced',
    'preset',
    NULL
  ),
  (
    'two-way-guard',
    'Two-way Guard',
    'Ball handling, defense, and conditioning',
    'Combine game-speed ball control with defensive footwork, closeouts, and full-court conditioning.',
    54,
    'Advanced',
    'preset',
    NULL
  ),
  (
    'weak-hand-builder',
    'Weak-hand Builder',
    'Weak-hand control and finishing',
    'Give your weaker hand a full session of control, pace changes, and finishes from both sides of the rim.',
    43,
    'Intermediate',
    'preset',
    NULL
  ),
  (
    'full-court-challenge',
    'Full-court Challenge',
    'Conditioning and game-speed execution',
    'A demanding full-court workout that mixes shooting, finishing, defense, sprints, and pressure free throws.',
    68,
    'Advanced',
    'preset',
    NULL
  ),
  (
    'post-workout-recovery',
    'Post-workout Recovery',
    'Cooldown, mobility, and recovery',
    'Bring your heart rate down, restore comfortable movement, and finish training with a repeatable recovery routine.',
    28,
    'Beginner',
    'preset',
    NULL
  ),
  (
    'at-home-ball-handling',
    'At-home Ball Handling',
    'Control and coordination in a small space',
    'Develop a tighter handle with stationary and low-space combinations that do not require a basketball court.',
    39,
    'Intermediate',
    'preset',
    NULL
  ),
  (
    'basketball-core-balance',
    'Basketball Core and Balance',
    'Core control, balance, and body stability',
    'Build the body control needed to absorb contact, change direction, and finish from unstable positions.',
    36,
    'Intermediate',
    'preset',
    NULL
  ),
  (
    'lower-body-strength',
    'Lower-body Strength',
    'Basketball strength and single-leg control',
    'Train the legs and hips used for acceleration, deceleration, defensive stance, and controlled takeoffs.',
    43,
    'Intermediate',
    'preset',
    NULL
  ),
  (
    'jump-landing-fundamentals',
    'Jump and Landing Fundamentals',
    'Landing control and low-volume jumping',
    'Practice quiet, balanced landings and controlled elastic movement before progressing to harder jump training.',
    32,
    'Intermediate',
    'preset',
    NULL
  ),
  (
    'defensive-footwork-anywhere',
    'Defensive Footwork Anywhere',
    'Agility, stance, and closeout mechanics',
    'Train basketball defensive movement in a driveway, gym, yard, or any clear non-slip training space.',
    44,
    'Intermediate',
    'preset',
    NULL
  )
;

UPDATE hooproutine_seed_workouts AS workout
SET training_type = seeded.training_type,
    equipment = seeded.equipment
FROM (
  VALUES
    ('complete-guard-workout', 'on_court', 'Basketball, hoop, and full court'),
    ('shooters-touch', 'on_court', 'Basketball and hoop'),
    ('finish-strong', 'on_court', 'Basketball and hoop'),
    ('handle-the-pressure', 'on_court', 'Basketball and cones or floor markers'),
    ('game-shape', 'on_court', 'Full court and cones or floor markers'),
    ('quick-skill-tuneup', 'on_court', 'Basketball, hoop, and an exercise mat or towel'),
    ('three-level-scorer', 'on_court', 'Basketball and hoop'),
    ('two-way-guard', 'on_court', 'Basketball, hoop, full court, and cones'),
    ('weak-hand-builder', 'on_court', 'Basketball and hoop'),
    ('full-court-challenge', 'on_court', 'Basketball, hoop, full court, and cones'),
    ('post-workout-recovery', 'recovery', 'No special equipment; an exercise mat or towel is optional'),
    ('at-home-ball-handling', 'off_court', 'Basketball and a small clear space'),
    ('basketball-core-balance', 'off_court', 'Exercise mat; basketball optional'),
    ('lower-body-strength', 'off_court', 'Bodyweight; sturdy chair or light dumbbells optional'),
    ('jump-landing-fundamentals', 'off_court', 'Clear non-slip space and a floor line'),
    ('defensive-footwork-anywhere', 'off_court', 'Cones or household floor markers')
) AS seeded(slug, training_type, equipment)
WHERE workout.slug = seeded.slug;

INSERT INTO hooproutine_seed_drills
  (slug, name, category, instructions, target_makes, target_attempts, target_repetitions, target_seconds)
VALUES
  ('dynamic-court-warmup', 'Dynamic Court Warm-up', 'Warm-up',
   E'1. Choose a clear floor area and start jogging easily in place or around the court.\n2. For high knees, lift a knee with each step; for heel kicks, gently bring a heel toward your backside. Shuffle sideways without crossing your feet, then make small circles with your arms.\n3. Follow the workload below. Count a round only after completing its listed movements on both sides where stated.\nTip: Keep the pace easy enough to talk; this prepares you for the harder drills.\nWorkload: 2 rounds. In each round, do 30 seconds each of easy jogging, high knees, heel kicks, side shuffles, and arm circles. Walk for 30 seconds between rounds.\nRecording: Enter completed rounds in Rounds completed; leave shooting fields blank.',
   NULL, NULL, 2, 480),
  ('form-shooting', 'Form Shooting', 'Shooting',
   E'1. Stand about one step from the basket, facing it with your feet comfortably apart. Put your shooting hand under the ball and your other hand lightly on its side.\n2. Bend your knees slightly, then extend your legs and shooting arm together. Release the ball toward the hoop and hold your shooting hand up until it lands.\n3. Rebound and repeat from close range for 30 shots, aiming to make 20 before moving farther away.\nTip: The guide hand steadies the ball; it should not push the shot.\nWorkload: Take 30 shots in total; 20 makes is a goal, not an instruction to keep shooting beyond that total. Pause to recover and reset your balance as needed. Record your actual makes and attempts.\nRecording: Enter Makes and Attempts; leave Rounds completed blank.',
   20, 30, NULL, 600),
  ('five-spot-shooting', 'Five-spot Shooting', 'Shooting',
   E'1. Use five spots around the hoop: left corner, left wing, straight ahead, right wing, and right corner. Start close enough to shoot with good form.\n2. At each spot, set both feet toward the basket, bend your knees, shoot, and follow through. Rebound after each shot.\n3. Take eight shots from each spot for 40 attempts total. Record how many go in; the goal is 25 makes.\nTip: Reset your balance before every shot instead of rushing to the next spot.\nWorkload: Take 40 shots in total; 25 makes is a goal, not an instruction to keep shooting beyond that total. Pause to recover and reset your balance as needed. Record your actual makes and attempts.\nRecording: Enter Makes and Attempts; leave Rounds completed blank.',
   25, 40, NULL, 720),
  ('one-dribble-pullups', 'One-dribble Pull-ups', 'Shooting',
   E'1. Start on one wing with the ball in a ready stance. Face the basket and choose a direction to attack.\n2. Take one strong dribble to that side, plant your feet under control, and rise straight up for a jump shot. Rebound your ball.\n3. Alternate left and right attacks until you have taken 30 shots; count your makes toward the goal of 16.\nTip: Slow down during the stop so your body is balanced before you shoot.\nWorkload: Take 30 shots in total; 16 makes is a goal, not an instruction to keep shooting beyond that total. Pause to recover and reset your balance as needed. Record your actual makes and attempts.\nRecording: Enter Makes and Attempts; leave Rounds completed blank.',
   16, 30, NULL, 600),
  ('pressure-free-throws', 'Pressure Free Throws', 'Shooting',
   E'1. Stand behind the free-throw line. Take a breath and use the same simple routine before every shot.\n2. Shoot two free throws, rebound both, and note the number made in that pair.\n3. Repeat for ten pairs, giving you 20 attempts and a goal of 16 makes.\nTip: Focus on one shot at a time; use your legs and hold your follow-through.\nWorkload: Take 20 shots in total; 16 makes is a goal, not an instruction to keep shooting beyond that total. Pause to recover and reset your balance as needed. Record your actual makes and attempts.\nRecording: Enter Makes and Attempts; leave Rounds completed blank.',
   16, 20, NULL, 480),
  ('mikans', 'Mikan Finishing', 'Finishing',
   E'1. Stand directly under the basket with the ball near your chest. Step to the right side of the hoop and make a close right-hand layup off the backboard.\n2. Catch the rebound before it drops far, step across under the hoop, and make a left-hand layup from the left side.\n3. Keep alternating sides until you have taken 30 finishes; count makes toward the goal of 20.\nTip: Stay close to the rim and use the hand nearest the side you are finishing on.\nWorkload: Take 30 shots in total; 20 makes is a goal, not an instruction to keep shooting beyond that total. Pause to recover and reset your balance as needed. Record your actual makes and attempts.\nRecording: Enter Makes and Attempts; leave Rounds completed blank.',
   20, 30, NULL, 420),
  ('reverse-finishes', 'Reverse Finishes', 'Finishing',
   E'1. Start a few steps to one side of the basket and dribble toward the baseline under the rim.\n2. Pass under the basket and finish on the far side of the backboard with the hand farthest from an imagined defender. Aim the ball softly off the glass.\n3. Rebound, return to your start, and alternate approach sides for 30 attempts. Aim for 20 makes.\nTip: The backboard and rim help shield the ball; do not drift so far under the hoop that you lose balance.\nWorkload: Take 30 shots in total; 20 makes is a goal, not an instruction to keep shooting beyond that total. Pause to recover and reset your balance as needed. Record your actual makes and attempts.\nRecording: Enter Makes and Attempts; leave Rounds completed blank.',
   20, 30, NULL, 480),
  ('floater-series', 'Floater Series', 'Finishing',
   E'1. Begin a few steps outside the lane on either side. Dribble toward the paint at a comfortable speed.\n2. Before reaching the basket, step off one foot and release a soft, high-arching shot with one hand over an imagined defender.\n3. Land under control, rebound, and alternate sides for 30 attempts. Aim for 16 makes.\nTip: Release the ball before you get directly beneath the rim.\nWorkload: Take 30 shots in total; 16 makes is a goal, not an instruction to keep shooting beyond that total. Pause to recover and reset your balance as needed. Record your actual makes and attempts.\nRecording: Enter Makes and Attempts; leave Rounds completed blank.',
   16, 30, NULL, 540),
  ('contact-finishes', 'Contact Finishes', 'Finishing',
   E'1. Start near the lane with a ball. If you have a partner, ask them to hold a soft pad at your side; otherwise imagine light contact.\n2. Drive toward the hoop, take a gentle side bump before takeoff, keep your eyes on the target, and finish a layup.\n3. Rebound and alternate sides for 30 attempts. Count makes toward the goal of 16.\nTip: Contact should be light and controlled. Skip the bump if you do not have a safe partner and pad.\nWorkload: Take 30 shots in total; 16 makes is a goal, not an instruction to keep shooting beyond that total. Pause to recover and reset your balance as needed. Record your actual makes and attempts.\nRecording: Enter Makes and Attempts; leave Rounds completed blank.',
   16, 30, NULL, 540),
  ('two-ball-control', 'Two-ball Control', 'Ball Handling',
   E'1. Stand with knees bent and one basketball in each hand. Keep your eyes up rather than watching the balls.\n2. Dribble both balls together for a short set, then alternate them so one rises while the other falls. Finally keep one dribble low and one higher.\n3. Follow the workload below. Count a round only after completing its listed movements on both sides where stated.\nTip: Start slowly and keep the dribbles below your waist before increasing speed.\nWorkload: 3 rounds. Each round is 20 seconds of simultaneous dribbles, 20 seconds alternating, and 20 seconds with one ball low and one high. Rest 30 seconds between rounds.\nRecording: Enter completed rounds in Rounds completed; leave shooting fields blank.',
   NULL, NULL, 3, 480),
  ('change-of-direction', 'Change of Direction', 'Ball Handling',
   E'1. Place a few cones in a line several steps apart. Start at the first cone with your knees bent and the ball at your side.\n2. Dribble to each cone and change direction with a crossover, a between-the-legs dribble, or a behind-the-back dribble. Move past the cone before speeding up.\n3. Follow the workload below. Count a round only after completing its listed movements on both sides where stated.\nTip: Practice each move slowly first; keep the ball close to your body while changing direction.\nWorkload: 4 rounds. One round is one trip through the cones and a walk back to the start. Alternate the starting hand; rest 30 seconds between rounds.\nRecording: Enter completed rounds in Rounds completed; leave shooting fields blank.',
   NULL, NULL, 4, 600),
  ('retreat-and-attack', 'Retreat and Attack', 'Ball Handling',
   E'1. Face a cone or imagined defender while dribbling forward in an athletic stance.\n2. Take two backward dribbles to create space, plant your outside foot, then change speed and drive past one side of the cone.\n3. Follow the workload below. Count a round only after completing its listed movements on both sides where stated.\nTip: Keep dribbling throughout; do not pick up the ball during the retreat.\nWorkload: 3 rounds of 5 attacks to each side. Reset after every attack. Rest 30 seconds between rounds.\nRecording: Enter completed rounds in Rounds completed; leave shooting fields blank.',
   NULL, NULL, 3, 480),
  ('weak-hand-control', 'Weak-hand Control', 'Ball Handling',
   E'1. Use only your less comfortable dribbling hand. Begin in a low stance with slow, firm dribbles beside your hip.\n2. Dribble in place, then walk forward and back. Add a change of pace once you can keep the ball under control.\n3. Follow the workload below. Count a round only after completing its listed movements on both sides where stated.\nTip: Keep your eyes forward. If the ball gets away, slow down before trying to go faster.\nWorkload: 4 rounds. Each round is 20 seconds stationary, 20 seconds walking forward/back, and 20 seconds changing pace. Rest 30 seconds between rounds.\nRecording: Enter completed rounds in Rounds completed; leave shooting fields blank.',
   NULL, NULL, 4, 540),
  ('baseline-suicides', 'Baseline Suicides', 'Conditioning',
   E'1. Start behind one baseline. Sprint to the near free-throw line, touch it, and sprint back to the starting baseline.\n2. Repeat the out-and-back run to half court, the far free-throw line, and finally the opposite baseline.\n3. Follow the workload below. Count a round only after completing its listed movements on both sides where stated.\nTip: Touch each line and turn with short steps so you do not slide past it.\nWorkload: 3 rounds. Each round visits all four lines and returns after each line. Walk and recover for at least 60 seconds between rounds; resume when you can speak comfortably.\nRecording: Enter completed rounds in Rounds completed; leave shooting fields blank.',
   NULL, NULL, 3, 600),
  ('defensive-slide-series', 'Defensive Slide Series', 'Conditioning',
   E'1. Start beside one lane line with feet wider than shoulders, knees bent, and hands ready.\n2. Push off the outside foot and slide sideways to the other lane line. Touch the line, then slide back without crossing your feet.\n3. Follow the workload below. Count a round only after completing its listed movements on both sides where stated.\nTip: Keep your chest up and take short quick slides instead of bouncing upward.\nWorkload: 4 rounds of 20 seconds sliding side to side. Rest 40 seconds between rounds.\nRecording: Enter completed rounds in Rounds completed; leave shooting fields blank.',
   NULL, NULL, 4, 480),
  ('court-sprint-intervals', 'Court Sprint Intervals', 'Conditioning',
   E'1. Start at a baseline and check that the full court is clear.\n2. Sprint to the opposite baseline, then walk all the way back to recover.\n3. Follow the workload below. Count a round only after completing its listed movements on both sides where stated.\nTip: Slow down before each line and turn; the walk back is your recovery.\nWorkload: 8 rounds. Each round is one court-length run followed by a walk back. Recover before the next run and record the number of runs completed.\nRecording: Enter completed rounds in Rounds completed; leave shooting fields blank.',
   NULL, NULL, 8, 600),
  ('closeout-recovery', 'Closeout and Recovery', 'Conditioning',
   E'1. Start in the paint facing a cone or imagined shooter on the wing.\n2. Sprint toward the cone, then use several short steps to stop in a low defensive stance with one hand raised. Slide two steps to contain an imagined drive.\n3. Follow the workload below. Count a round only after completing its listed movements on both sides where stated.\nTip: Arrive balanced; do not jump into the imagined shooter.\nWorkload: 5 rounds. One round is a closeout, two slide steps, and a return to the paint. Alternate the slide direction and rest 30 seconds between rounds.\nRecording: Enter completed rounds in Rounds completed; leave shooting fields blank.',
   NULL, NULL, 5, 420),
  ('catch-and-shoot', 'Catch-and-shoot Reps', 'Shooting',
   E'1. Choose five shooting spots around the basket. Have a partner pass to you, or toss the ball slightly ahead and catch it yourself.\n2. Move into a spot, catch with both hands, set your feet toward the hoop, and shoot without taking a dribble.\n3. Take eight shots at each spot for 40 attempts total. Aim for 24 makes and rebound between shots.\nTip: Bend your knees as the ball arrives so you can shoot in one smooth motion.\nWorkload: Take 40 shots in total; 24 makes is a goal, not an instruction to keep shooting beyond that total. Pause to recover and reset your balance as needed. Record your actual makes and attempts.\nRecording: Enter Makes and Attempts; leave Rounds completed blank.',
   24, 40, NULL, 600),
  ('stepback-footwork', 'Step-back Footwork', 'Shooting',
   E'1. Begin a few steps from the basket with the ball. Dribble toward an imagined defender.\n2. Plant your lead foot, push backward into a short step to create space, bring your feet under you, and shoot.\n3. Rebound and repeat from both sides for 24 attempts. Aim for 12 makes.\nTip: Make the step small enough that you can land balanced and shoot without leaning backward.\nWorkload: Take 24 shots in total; 12 makes is a goal, not an instruction to keep shooting beyond that total. Pause to recover and reset your balance as needed. Record your actual makes and attempts.\nRecording: Enter Makes and Attempts; leave Rounds completed blank.',
   12, 24, NULL, 540),
  ('euro-step-finishes', 'Euro-step Finishes', 'Finishing',
   E'1. Drive toward the lane with the ball. Pick it up as you prepare to take your two layup steps.\n2. Take the first step to one side of an imagined defender, then the second step across to the other side. Finish at the rim without adding another step.\n3. Rebound and alternate approach sides for 30 attempts. Aim for 16 makes.\nTip: Learn the footwork slowly before adding speed; keep the ball protected close to your body.\nWorkload: Take 30 shots in total; 16 makes is a goal, not an instruction to keep shooting beyond that total. Pause to recover and reset your balance as needed. Record your actual makes and attempts.\nRecording: Enter Makes and Attempts; leave Rounds completed blank.',
   16, 30, NULL, 540),
  ('weak-hand-finishes', 'Weak-hand Finishes', 'Finishing',
   E'1. Start near the basket on one side with the ball in your less comfortable hand.\n2. Take a controlled approach and finish a layup using that hand only. Aim softly at the backboard square.\n3. Rebound and repeat from both sides for 35 attempts. Aim for 20 makes.\nTip: Begin close to the rim; move farther away only when the motion feels controlled.\nWorkload: Take 35 shots in total; 20 makes is a goal, not an instruction to keep shooting beyond that total. Pause to recover and reset your balance as needed. Record your actual makes and attempts.\nRecording: Enter Makes and Attempts; leave Rounds completed blank.',
   20, 35, NULL, 540),
  ('cone-slalom', 'Cone Slalom', 'Ball Handling',
   E'1. Set several cones in a straight line with enough space to dribble around each one.\n2. Weave around them with your knees bent. Change hands in front of your body as you pass each cone, keeping the ball below your waist.\n3. Follow the workload below. Count a round only after completing its listed movements on both sides where stated.\nTip: Look ahead to the next cone instead of staring at the ball.\nWorkload: 5 rounds. Each round is one trip through the cone line and back. Alternate the starting hand and rest 30 seconds between rounds.\nRecording: Enter completed rounds in Rounds completed; leave shooting fields blank.',
   NULL, NULL, 5, 600),
  ('pace-change-combos', 'Pace-change Combos', 'Ball Handling',
   E'1. Start in a clear space with the ball. A hesitation means briefly rising and slowing your dribble as if you might stop.\n2. Follow the hesitation with an in-and-out dribble, crossover, or backward retreat dribble, then accelerate for a few steps.\n3. Follow the workload below. Count a round only after completing its listed movements on both sides where stated.\nTip: The change from slow to fast is the main skill; do the moves cleanly before going full speed.\nWorkload: 4 rounds of 30 seconds linking the moves. Rest 30 seconds between rounds.\nRecording: Enter completed rounds in Rounds completed; leave shooting fields blank.',
   NULL, NULL, 4, 540),
  ('defensive-mirror', 'Defensive Mirror', 'Defense',
   E'1. Face a partner a few steps away. If training alone, choose a point ahead and imagine a dribbler moving side to side.\n2. Bend your knees and slide in the same direction as the partner without crossing your feet. Keep your chest facing them and your hands active.\n3. Follow the workload below. Count a round only after completing its listed movements on both sides where stated.\nTip: Stay an arm length away and react to the body, not just the ball.\nWorkload: 5 rounds of 20 seconds following your partner, or changing direction between two markers. Rest 40 seconds between rounds.\nRecording: Enter completed rounds in Rounds completed; leave shooting fields blank.',
   NULL, NULL, 5, 480),
  ('closeout-boxout', 'Closeout and Box Out', 'Defense',
   E'1. Start in the paint facing a partner or marker on the wing. Sprint toward them and slow down with short steps, one hand up.\n2. Slide sideways to contain one imagined drive. When a shot goes up, turn so your back is between the opponent and the basket.\n3. Follow the workload below. Count a round only after completing its listed movements on both sides where stated.\nTip: Keep contact controlled; the goal is to claim space, not shove a partner.\nWorkload: 4 rounds of 3 complete closeout-slide-box-out sequences. Hold each box-out stance for 2 seconds; rest 30 seconds between rounds.\nRecording: Enter completed rounds in Rounds completed; leave shooting fields blank.',
   NULL, NULL, 4, 480),
  ('mobility-reset', 'Mobility Reset', 'Recovery',
   E'1. Stand tall and slowly rock each ankle forward over the toes while keeping the heel down. Make small hip circles next.\n2. Hinge at the hips for a gentle hamstring stretch, then circle each shoulder without shrugging.\n3. Follow the workload below. Count a round only after completing its listed movements on both sides where stated.\nTip: Move within an easy range; stretching should not feel sharp or painful.\nWorkload: 2 rounds. Each round: 8 ankle rocks per side, 5 hip circles each way, 20 seconds of gentle hamstring reach per side, 5 shoulder circles each way, and 3 slow breaths. Rest as needed.\nRecording: Enter completed rounds in Rounds completed; leave shooting fields blank.',
   NULL, NULL, 2, 480),
  ('walk-breathe-reset', 'Walk and Breathe Reset', 'Recovery',
   E'1. Walk at an easy pace for about five minutes, letting your breathing gradually slow.\n2. Relax your shoulders and keep your head upright. Breathe in and out comfortably without forcing a long breath.\n3. Follow the workload below. Count a round only after completing its listed movements on both sides where stated.\nTip: This is recovery, so there is no need to walk fast.\nWorkload: 1 round: walk easily for 4 minutes, then stand or sit comfortably for 1 minute of relaxed breathing. Record 1 round when finished.\nRecording: Enter completed rounds in Rounds completed; leave shooting fields blank.',
   NULL, NULL, 1, 300),
  ('lower-body-stretch-flow', 'Lower-body Stretch Flow', 'Recovery',
   E'1. Stretch the calves by stepping one foot back and pressing its heel gently toward the floor. For the front of the thigh, hold a wall, bend one knee, and gently hold that ankle behind you with both knees pointing down.\n2. For the hamstrings, place one heel ahead with a soft knee and hinge from the hips. For the glutes, sit on a sturdy chair, place one ankle across the opposite knee, and lean forward slightly. For the front of the hip, take a short split stance, tuck the pelvis gently, and shift forward a little. Hold each position for 20 seconds per side.\n3. Follow the workload below. Count a round only after completing its listed movements on both sides where stated.\nTip: Ease into each stretch and stop before discomfort becomes pain.\nWorkload: 2 rounds. In each round, hold each listed stretch gently for 20 seconds per side. Release slowly and rest as needed; do not force a stretch.\nRecording: Enter completed rounds in Rounds completed; leave shooting fields blank.',
   NULL, NULL, 2, 360),
  ('ankle-hip-mobility', 'Ankle and Hip Mobility', 'Mobility',
   E'1. Place one foot forward and gently move that knee over the toes while the heel stays down. Repeat on the other ankle.\n2. Stand tall and make slow circles with one raised knee at a time. Then lower into a comfortable squat while holding a stable support if needed.\n3. Follow the workload below. Count a round only after completing its listed movements on both sides where stated.\nTip: Keep the movement smooth; do not force a deep squat.\nWorkload: 2 rounds of 8 ankle rocks per side, 5 hip circles in each direction, and a comfortable 20-second squat hold. Rest 30 seconds between rounds.\nRecording: Enter completed rounds in Rounds completed; leave shooting fields blank.',
   NULL, NULL, 2, 300),
  ('upper-body-release', 'Upper-body Release', 'Recovery',
   E'1. Stand or sit tall and roll your shoulders slowly backward, then forward.\n2. Open your arms wide across the chest, return to center, and rotate your upper back gently left and right while your hips stay mostly still.\n3. Follow the workload below. Count a round only after completing its listed movements on both sides where stated.\nTip: Keep the motions small and relaxed rather than pulling hard.\nWorkload: 2 rounds of 5 shoulder circles each direction, 5 chest-opening reaches, and 5 upper-back turns per side. Move slowly and rest as needed.\nRecording: Enter completed rounds in Rounds completed; leave shooting fields blank.',
   NULL, NULL, 2, 240),
  ('stationary-pound-series', 'Stationary Pound Series', 'Ball Handling',
   E'1. Stand with feet apart and knees bent. Dribble firmly with your right hand below waist height for a short set, then do the same with your left.\n2. Alternate hands in front of you, then practice low crossovers from one hand to the other.\n3. Follow the workload below. Count a round only after completing its listed movements on both sides where stated.\nTip: Keep your hand on top or slightly behind the ball and look ahead, not down.\nWorkload: 4 rounds. Each round has 20 seconds each of right-hand, left-hand, alternating, and crossover dribbles. Rest 30 seconds between rounds.\nRecording: Enter completed rounds in Rounds completed; leave shooting fields blank.',
   NULL, NULL, 4, 480),
  ('low-space-combo-handles', 'Low-space Combo Handles', 'Ball Handling',
   E'1. Mark a small clear area and stay inside it with knees bent. Start with slow crossovers in front of your body.\n2. Add a between-the-legs dribble, a behind-the-back dribble, and a hesitation, linking one move into the next without stopping.\n3. Follow the workload below. Count a round only after completing its listed movements on both sides where stated.\nTip: Control matters more than speed; use one move at a time until the sequence feels familiar.\nWorkload: 4 rounds of 30 seconds linking the listed moves. Start with a single move if needed. Rest 30 seconds between rounds.\nRecording: Enter completed rounds in Rounds completed; leave shooting fields blank.',
   NULL, NULL, 4, 600),
  ('ball-wrap-coordination', 'Ball-wrap Coordination', 'Coordination',
   E'1. Stand still holding the ball. Pass it hand to hand around your head, then reverse direction.\n2. Wrap the ball around your waist, both knees, and one leg at a time without letting it fall.\n3. Follow the workload below. Count a round only after completing its listed movements on both sides where stated.\nTip: Keep the ball close to your body and slow down when changing levels.\nWorkload: 4 rounds. Each round: 5 wraps each direction at your head, waist, knees, and each leg. Rest 30 seconds between rounds.\nRecording: Enter completed rounds in Rounds completed; leave shooting fields blank.',
   NULL, NULL, 4, 420),
  ('dead-bug-ball-control', 'Dead Bug Ball Control', 'Core',
   E'1. Lie on your back with knees above your hips and bent about 90 degrees. Hold the basketball in one hand above your chest; keep your lower back comfortably close to the floor.\n2. Slowly reach the ball-holding arm overhead while extending the opposite leg. Return both to the start, then switch the ball to the other hand and repeat on the other side.\n3. Follow the workload below. Count a round only after completing its listed movements on both sides where stated.\nTip: Shorten the reach if your back arches or you cannot keep the ball steady.\nWorkload: 3 rounds of 6 slow reaches per side. A reach out and return counts as one repetition. Rest 30 seconds between rounds.\nRecording: Enter completed rounds in Rounds completed; leave shooting fields blank.',
   NULL, NULL, 3, 480),
  ('plank-shoulder-taps', 'Plank Shoulder Taps', 'Core',
   E'1. Place your hands under your shoulders in a high plank. Step your feet a little wider than your hips for balance and keep your body in a straight line.\n2. Lift one hand to tap the opposite shoulder, put it back down, then tap with the other hand.\n3. Follow the workload below. Count a round only after completing its listed movements on both sides where stated.\nTip: Move slowly enough that your hips stay mostly level instead of rocking side to side.\nWorkload: 3 rounds of 6 taps per shoulder. One touch and return counts as one tap. Rest 45 seconds between rounds.\nRecording: Enter completed rounds in Rounds completed; leave shooting fields blank.',
   NULL, NULL, 3, 420),
  ('single-leg-balance-reach', 'Single-leg Balance Reach', 'Balance',
   E'1. Stand on one leg near a wall or chair if you need balance. Keep the standing knee softly bent.\n2. Reach the free foot forward, diagonally, and sideways, lightly touching the floor each time before returning to center.\n3. Follow the workload below. Count a round only after completing its listed movements on both sides where stated.\nTip: Keep the standing knee pointing in the same direction as the toes.\nWorkload: 3 rounds. On each leg, reach forward, diagonally, and sideways 3 times each. Work both legs before counting the round; rest 30 seconds.\nRecording: Enter completed rounds in Rounds completed; leave shooting fields blank.',
   NULL, NULL, 3, 480),
  ('split-squat-series', 'Split-squat Series', 'Strength',
   E'1. Stand with one foot forward and the other a step behind, with both feet pointing ahead. Hold a chair for balance if needed.\n2. Bend both knees to lower straight down, then press through the whole front foot to stand again.\n3. Follow the workload below. Count a round only after completing its listed movements on both sides where stated.\nTip: Keep your front knee tracking over the foot and use a shorter range if balance is difficult.\nWorkload: 3 rounds of 8 repetitions per leg. Lower and stand once for one repetition. Work both legs, then rest 45 seconds.\nRecording: Enter completed rounds in Rounds completed; leave shooting fields blank.',
   NULL, NULL, 3, 600),
  ('single-leg-glute-bridge', 'Single-leg Glute Bridge', 'Strength',
   E'1. Lie on your back with one knee bent and that foot flat on the floor. Lift the other foot slightly and keep your arms beside you.\n2. Press through the planted heel to raise your hips until your body forms a gentle line from shoulder to knee. Pause, then lower slowly.\n3. Follow the workload below. Count a round only after completing its listed movements on both sides where stated.\nTip: Keep your hips level; lift only as high as you can without arching your lower back.\nWorkload: 3 rounds of 8 lifts per leg, pausing 1 second at the top. Work both legs, then rest 30 seconds.\nRecording: Enter completed rounds in Rounds completed; leave shooting fields blank.',
   NULL, NULL, 3, 480),
  ('calf-raise-hold', 'Calf Raise and Hold', 'Strength',
   E'1. Stand with feet about hip-width apart beside a wall or chair if you need support.\n2. Press through the balls of both feet to lift your heels, pause briefly at the top, then lower them slowly.\n3. Follow the workload below. Count a round only after completing its listed movements on both sides where stated.\nTip: Keep your weight spread across the front of each foot instead of rolling outward.\nWorkload: 3 rounds of 12 raises. Hold the top for 2 seconds and lower slowly. Rest 30 seconds between rounds.\nRecording: Enter completed rounds in Rounds completed; leave shooting fields blank.',
   NULL, NULL, 3, 360),
  ('lateral-lunge-control', 'Lateral Lunge Control', 'Strength',
   E'1. Stand tall with feet together and enough room to step sideways.\n2. Take a wide step to one side, send your hips back, and bend that knee while the other leg stays straighter. Keep the stepping foot flat.\n3. Follow the workload below. Count a round only after completing its listed movements on both sides where stated.\nTip: Keep your knee pointing with your toes and shorten the step if you lose balance.\nWorkload: 3 rounds of 6 lunges per side. Step out and return for one repetition. Rest 45 seconds between rounds.\nRecording: Enter completed rounds in Rounds completed; leave shooting fields blank.',
   NULL, NULL, 3, 480),
  ('snap-down-landing', 'Snap-down Landing', 'Plyometrics',
   E'1. Stand tall with feet about shoulder-width apart and arms reaching upward.\n2. Quickly bring your arms down while bending your hips and knees into a low athletic stance. Plant both feet flat and hold the position for two seconds.\n3. Follow the workload below. Count a round only after completing its listed movements on both sides where stated.\nTip: Land quietly with knees pointing over your feet; this drill does not require a jump.\nWorkload: 3 rounds of 5 snap-downs. Hold each stance for 2 seconds, then reset fully. Rest 30 seconds between rounds.\nRecording: Enter completed rounds in Rounds completed; leave shooting fields blank.',
   NULL, NULL, 3, 420),
  ('pogo-jump-control', 'Pogo Jump Control', 'Plyometrics',
   E'1. Stand tall on a clear, non-slip surface with feet about hip-width apart and knees slightly bent.\n2. Make small repeated hops using mostly your ankles, landing softly on the balls of your feet before the heels lower lightly.\n3. Follow the workload below. Count a round only after completing its listed movements on both sides where stated.\nTip: Keep the jumps low and stop the set when landings become loud or uncontrolled.\nWorkload: 3 rounds of 10 small hops. Stop the round if control slips. Rest 45 seconds between rounds.\nRecording: Enter completed rounds in Rounds completed; leave shooting fields blank.',
   NULL, NULL, 3, 360),
  ('lateral-bound-stick', 'Lateral Bound and Stick', 'Plyometrics',
   E'1. Stand on one leg with space to your side. Bend that knee slightly and push sideways toward the other leg.\n2. Land on the opposite foot with a soft knee and hold still for two seconds before moving again.\n3. Follow the workload below. Count a round only after completing its listed movements on both sides where stated.\nTip: Begin with a small distance; keep the landing knee aligned over the foot.\nWorkload: 3 rounds of 5 small bounds to each side. Hold each landing for 2 seconds. Rest 45 seconds between rounds.\nRecording: Enter completed rounds in Rounds completed; leave shooting fields blank.',
   NULL, NULL, 3, 480),
  ('quick-feet-line-steps', 'Quick-feet Line Steps', 'Agility',
   E'1. Find a floor line or place tape on the ground. Start with feet apart and knees slightly bent.\n2. Step both feet across the line and back as quickly as you can control. Then turn sideways and step across and back in that direction.\n3. Follow the workload below. Count a round only after completing its listed movements on both sides where stated.\nTip: Keep the steps short and light; slow down if your feet tangle.\nWorkload: 4 rounds. Each round is 15 seconds forward/back and 15 seconds side to side. Rest 30 seconds between rounds.\nRecording: Enter completed rounds in Rounds completed; leave shooting fields blank.',
   NULL, NULL, 4, 420),
  ('three-cone-defensive-drops', 'Three-cone Defensive Drops', 'Agility',
   E'1. Put three cones in a wide triangle and start at the front cone in a defensive stance.\n2. Open your hips with a backward drop step, sprint to a back cone, then turn to face forward and slide across to the other back cone.\n3. Follow the workload below. Count a round only after completing its listed movements on both sides where stated.\nTip: Take short steps when changing direction so you stay balanced.\nWorkload: 4 rounds. Each round is one complete triangle route back to the front cone. Alternate the first back cone; rest 30 seconds.\nRecording: Enter completed rounds in Rounds completed; leave shooting fields blank.',
   NULL, NULL, 4, 600),
  ('closeout-chop-steps', 'Closeout Chop Steps', 'Defense',
   E'1. Put a cone several steps away and start facing it in an athletic stance.\n2. Sprint toward the cone, then shorten your final steps into quick choppy steps. Stop with bent knees, one hand raised, and your weight balanced.\n3. Follow the workload below. Count a round only after completing its listed movements on both sides where stated.\nTip: Stop before the cone; do not jump or let your momentum carry you past it.\nWorkload: 4 rounds of 3 closeouts. Reset fully after every repetition and rest 30 seconds between rounds.\nRecording: Enter completed rounds in Rounds completed; leave shooting fields blank.',
   NULL, NULL, 4, 480)
;

-- Equipment/classification below completes the staged catalog.
UPDATE hooproutine_seed_drills AS drill
SET training_type = seeded.training_type,
    equipment = seeded.equipment
FROM (
  VALUES
    ('dynamic-court-warmup', 'on_court', 'Court or clear non-slip floor'),
    ('form-shooting', 'on_court', 'Basketball and hoop'),
    ('five-spot-shooting', 'on_court', 'Basketball, hoop, and court markings'),
    ('one-dribble-pullups', 'on_court', 'Basketball, hoop, and clear approach space'),
    ('pressure-free-throws', 'on_court', 'Basketball, hoop, and free-throw line'),
    ('mikans', 'on_court', 'Basketball and hoop'),
    ('reverse-finishes', 'on_court', 'Basketball, hoop, and clear baseline space'),
    ('floater-series', 'on_court', 'Basketball and hoop'),
    ('contact-finishes', 'on_court', 'Basketball and hoop; trained partner with soft pad optional'),
    ('two-ball-control', 'on_court', 'Two basketballs and clear dribbling space'),
    ('change-of-direction', 'on_court', 'Basketball and cones or flat markers'),
    ('retreat-and-attack', 'on_court', 'Basketball; cone or marker optional'),
    ('weak-hand-control', 'on_court', 'Basketball and clear dribbling space'),
    ('baseline-suicides', 'on_court', 'Basketball court with marked lines'),
    ('defensive-slide-series', 'on_court', 'Two court lines or floor markers'),
    ('court-sprint-intervals', 'on_court', 'Clear basketball court'),
    ('closeout-recovery', 'on_court', 'Court space; cone or marker optional'),
    ('catch-and-shoot', 'on_court', 'Basketball and hoop; passer optional'),
    ('stepback-footwork', 'on_court', 'Basketball, hoop, and clear landing space'),
    ('euro-step-finishes', 'on_court', 'Basketball and hoop'),
    ('weak-hand-finishes', 'on_court', 'Basketball and hoop'),
    ('cone-slalom', 'on_court', 'Basketball and cones or flat markers'),
    ('pace-change-combos', 'on_court', 'Basketball and clear dribbling space'),
    ('defensive-mirror', 'on_court', 'Clear floor space; partner or two markers'),
    ('closeout-boxout', 'on_court', 'Clear court space; partner optional'),
    ('mobility-reset', 'recovery', 'Exercise mat or towel optional'),
    ('walk-breathe-reset', 'recovery', 'No equipment'),
    ('lower-body-stretch-flow', 'recovery', 'Exercise mat or towel optional'),
    ('ankle-hip-mobility', 'recovery', 'No equipment'),
    ('upper-body-release', 'recovery', 'No equipment'),
    ('stationary-pound-series', 'off_court', 'Basketball and a small clear space'),
    ('low-space-combo-handles', 'off_court', 'Basketball and a small clear space'),
    ('ball-wrap-coordination', 'off_court', 'Basketball'),
    ('dead-bug-ball-control', 'off_court', 'Exercise mat and basketball'),
    ('plank-shoulder-taps', 'off_court', 'Exercise mat optional'),
    ('single-leg-balance-reach', 'off_court', 'No equipment'),
    ('split-squat-series', 'off_court', 'Sturdy chair or light dumbbells optional'),
    ('single-leg-glute-bridge', 'off_court', 'Exercise mat optional'),
    ('calf-raise-hold', 'off_court', 'Wall or chair for balance optional'),
    ('lateral-lunge-control', 'off_court', 'No equipment'),
    ('snap-down-landing', 'off_court', 'Clear non-slip space'),
    ('pogo-jump-control', 'off_court', 'Clear non-slip space'),
    ('lateral-bound-stick', 'off_court', 'Clear non-slip space'),
    ('quick-feet-line-steps', 'off_court', 'Floor line or tape'),
    ('three-cone-defensive-drops', 'off_court', 'Three cones or household markers'),
    ('closeout-chop-steps', 'off_court', 'One cone or household marker')
) AS seeded(slug, training_type, equipment)
WHERE drill.slug = seeded.slug;

INSERT INTO hooproutine_seed_assignments (workout_slug, drill_slug, position)
  VALUES
    ('complete-guard-workout', 'dynamic-court-warmup', 1),
    ('complete-guard-workout', 'form-shooting', 2),
    ('complete-guard-workout', 'mikans', 3),
    ('complete-guard-workout', 'two-ball-control', 4),
    ('complete-guard-workout', 'baseline-suicides', 5),
    ('shooters-touch', 'dynamic-court-warmup', 1),
    ('shooters-touch', 'form-shooting', 2),
    ('shooters-touch', 'five-spot-shooting', 3),
    ('shooters-touch', 'one-dribble-pullups', 4),
    ('shooters-touch', 'pressure-free-throws', 5),
    ('finish-strong', 'dynamic-court-warmup', 1),
    ('finish-strong', 'mikans', 2),
    ('finish-strong', 'reverse-finishes', 3),
    ('finish-strong', 'floater-series', 4),
    ('finish-strong', 'contact-finishes', 5),
    ('handle-the-pressure', 'dynamic-court-warmup', 1),
    ('handle-the-pressure', 'two-ball-control', 2),
    ('handle-the-pressure', 'change-of-direction', 3),
    ('handle-the-pressure', 'retreat-and-attack', 4),
    ('handle-the-pressure', 'weak-hand-control', 5),
    ('game-shape', 'dynamic-court-warmup', 1),
    ('game-shape', 'defensive-slide-series', 2),
    ('game-shape', 'court-sprint-intervals', 3),
    ('game-shape', 'closeout-recovery', 4),
    ('game-shape', 'baseline-suicides', 5),
    ('quick-skill-tuneup', 'dynamic-court-warmup', 1),
    ('quick-skill-tuneup', 'form-shooting', 2),
    ('quick-skill-tuneup', 'mobility-reset', 3),
    ('three-level-scorer', 'dynamic-court-warmup', 1),
    ('three-level-scorer', 'form-shooting', 2),
    ('three-level-scorer', 'catch-and-shoot', 3),
    ('three-level-scorer', 'one-dribble-pullups', 4),
    ('three-level-scorer', 'stepback-footwork', 5),
    ('three-level-scorer', 'floater-series', 6),
    ('three-level-scorer', 'pressure-free-throws', 7),
    ('two-way-guard', 'dynamic-court-warmup', 1),
    ('two-way-guard', 'cone-slalom', 2),
    ('two-way-guard', 'change-of-direction', 3),
    ('two-way-guard', 'defensive-mirror', 4),
    ('two-way-guard', 'closeout-boxout', 5),
    ('two-way-guard', 'court-sprint-intervals', 6),
    ('weak-hand-builder', 'dynamic-court-warmup', 1),
    ('weak-hand-builder', 'weak-hand-control', 2),
    ('weak-hand-builder', 'pace-change-combos', 3),
    ('weak-hand-builder', 'weak-hand-finishes', 4),
    ('weak-hand-builder', 'reverse-finishes', 5),
    ('full-court-challenge', 'dynamic-court-warmup', 1),
    ('full-court-challenge', 'catch-and-shoot', 2),
    ('full-court-challenge', 'euro-step-finishes', 3),
    ('full-court-challenge', 'defensive-slide-series', 4),
    ('full-court-challenge', 'closeout-recovery', 5),
    ('full-court-challenge', 'baseline-suicides', 6),
    ('full-court-challenge', 'pressure-free-throws', 7),
    ('full-court-challenge', 'mobility-reset', 8),
    ('post-workout-recovery', 'mobility-reset', 1),
    ('post-workout-recovery', 'walk-breathe-reset', 2),
    ('post-workout-recovery', 'lower-body-stretch-flow', 3),
    ('post-workout-recovery', 'ankle-hip-mobility', 4),
    ('post-workout-recovery', 'upper-body-release', 5),
    ('at-home-ball-handling', 'ankle-hip-mobility', 1),
    ('at-home-ball-handling', 'stationary-pound-series', 2),
    ('at-home-ball-handling', 'low-space-combo-handles', 3),
    ('at-home-ball-handling', 'ball-wrap-coordination', 4),
    ('at-home-ball-handling', 'weak-hand-control', 5),
    ('basketball-core-balance', 'walk-breathe-reset', 1),
    ('basketball-core-balance', 'dead-bug-ball-control', 2),
    ('basketball-core-balance', 'plank-shoulder-taps', 3),
    ('basketball-core-balance', 'single-leg-balance-reach', 4),
    ('basketball-core-balance', 'single-leg-glute-bridge', 5),
    ('lower-body-strength', 'ankle-hip-mobility', 1),
    ('lower-body-strength', 'split-squat-series', 2),
    ('lower-body-strength', 'single-leg-glute-bridge', 3),
    ('lower-body-strength', 'calf-raise-hold', 4),
    ('lower-body-strength', 'lateral-lunge-control', 5),
    ('lower-body-strength', 'lower-body-stretch-flow', 6),
    ('jump-landing-fundamentals', 'ankle-hip-mobility', 1),
    ('jump-landing-fundamentals', 'snap-down-landing', 2),
    ('jump-landing-fundamentals', 'pogo-jump-control', 3),
    ('jump-landing-fundamentals', 'lateral-bound-stick', 4),
    ('jump-landing-fundamentals', 'calf-raise-hold', 5),
    ('defensive-footwork-anywhere', 'ankle-hip-mobility', 1),
    ('defensive-footwork-anywhere', 'quick-feet-line-steps', 2),
    ('defensive-footwork-anywhere', 'three-cone-defensive-drops', 3),
    ('defensive-footwork-anywhere', 'closeout-chop-steps', 4),
    ('defensive-footwork-anywhere', 'defensive-mirror', 5),
    ('defensive-footwork-anywhere', 'lower-body-stretch-flow', 6)
;


-- Serialize with application writes while checking ownership and adding definitions.
-- The runner also takes the shared migration/seed advisory lock first.
LOCK TABLE workouts, drills, workout_drills IN SHARE ROW EXCLUSIVE MODE;
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM hooproutine_seed_workouts s JOIN workouts w ON w.slug = s.slug
    WHERE w.source IS DISTINCT FROM 'preset' OR w.owner_user_id IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Seed stopped: a preset slug belongs to an owned or non-preset workout. No ownership was changed.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM hooproutine_seed_assignments a
    LEFT JOIN hooproutine_seed_workouts w ON w.slug = a.workout_slug
    LEFT JOIN hooproutine_seed_drills d ON d.slug = a.drill_slug
    WHERE w.slug IS NULL OR d.slug IS NULL
  ) THEN
    RAISE EXCEPTION 'Seed stopped: an assignment references a missing catalog definition.';
  END IF;
END $$;

-- Keep names, ownership, active state, targets, equipment and other workout metadata
-- on every existing routine, even if it is inactive or has no assignments.
WITH added AS (
  INSERT INTO workouts (slug, title, focus, description, estimated_minutes, difficulty,
                        source, owner_user_id, training_type, equipment)
  SELECT s.slug, s.title, s.focus, s.description, s.estimated_minutes, s.difficulty,
         s.source, s.owner_user_id, s.training_type, s.equipment
  FROM hooproutine_seed_workouts s
  WHERE NOT EXISTS (SELECT 1 FROM workouts w WHERE w.slug = s.slug)
  ON CONFLICT (slug) DO NOTHING
  RETURNING id, slug
)
INSERT INTO hooproutine_seed_new_workouts SELECT id, slug FROM added;

INSERT INTO drills (slug, name, category, instructions, target_makes, target_attempts,
                    target_repetitions, target_seconds, training_type, equipment)
SELECT slug, name, category, instructions, target_makes, target_attempts,
       target_repetitions, target_seconds, training_type, equipment
FROM hooproutine_seed_drills
ON CONFLICT (slug) DO UPDATE SET
  instructions = EXCLUDED.instructions,
  equipment = EXCLUDED.equipment
WHERE drills.instructions IS DISTINCT FROM EXCLUDED.instructions
   OR drills.equipment IS DISTINCT FROM EXCLUDED.equipment;

-- Populate only routines created by THIS seed transaction. No existing assignment
-- is deleted, reordered, replaced, or supplemented, including non-catalog presets.
INSERT INTO workout_drills (workout_id, drill_id, position)
SELECT w.id, d.id, a.position
FROM hooproutine_seed_assignments a
JOIN hooproutine_seed_new_workouts w ON w.slug = a.workout_slug
JOIN drills d ON d.slug = a.drill_slug;
