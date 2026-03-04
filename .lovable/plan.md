IMPLEMENT SIS PHASE 2 (FOUNDATION + STUDENT DASHBOARD) — EVOLVE /RENASCER INTO SIS

GOAL

Evolve the existing /renascer page into the SIS dashboard (Shape Intelligence System™). Reuse existing tables where data already exists. Create new tables only for new domains. No admin views, no PDFs, no structural UI in this phase.

IMPORTANT CONSTRAINTS

- Do NOT break existing Renascer features (manual inputs, current flows).

- Keep existing workout/nutrition/mindset pages unchanged.

- Use the same visual system (typography, spacing, clean layout).

- Support existing students and historical data.

A) EXISTING DATA REUSE MAP (NO NEW TABLES)

Mechanical:

- Use workout_set_logs + workout_completions

- Create views/helpers to aggregate per day: total_volume, density, avg_rpe, avg_tech if available.

Recovery:

- Use manual_day_logs (sleep, stress, rpe, subjective fatigue if exists) + health_daily (hrv, rhr)

Body Composition:

- Use body_assessments + checkins (peso_atual)

Action: consume via queries/views inside the score function. No new log tables for these modules.

B) NEW TABLES (6 TOTAL)

NOTE: add BOTH student_id and user_id to avoid RLS mismatch.

Because auth.uid() matches user_id, not [students.id](http://students.id).

1) sis_cognitive_checkins

- id uuid pk default gen_random_uuid()

- student_id uuid not null references students(id)

- user_id uuid not null references auth.users(id)

- date date not null

- mental_energy int (1-5)

- mental_clarity int (1-5)

- focus int (1-5)

- irritability int (1-5)

- food_discipline int (1-5)

- alcohol boolean default false

- notes text

- created_at timestamptz default now()

Unique (user_id, date) optional if you want 1/day.

2) sis_structural_assessments (table only, no UI in this phase)

- id, student_id, user_id, date

- photo_front_url text

- photo_side_url text

- photo_back_url text

- video_url text nullable

- cervical_angle numeric nullable

- pelvic_tilt numeric nullable

- scapular_asymmetry numeric nullable

- squat_score int (1-5)

- hinge_score int (1-5)

- overhead_score int (1-5)

- mobility_score int (1-5)

- notes text

- created_at

3) sis_scores_daily

- id, student_id, user_id, date

- mechanical_score numeric(5,2)

- recovery_score numeric(5,2)

- structural_score numeric(5,2)

- body_comp_score numeric(5,2)

- cognitive_score numeric(5,2)

- consistency_score numeric(5,2)

- shape_intelligence_score numeric(5,2)

- classification text

- alerts jsonb default '[]'

- created_at

Unique (user_id, date)

4) sis_streaks (cognitive streak)

- user_id uuid pk references auth.users(id)

- student_id uuid references students(id)

- current_streak int default 0

- best_streak int default 0

- last_checkin_date date

5) sis_device_sources (stub)

- id, student_id, user_id

- provider text

- access_status text default 'disconnected'

- last_sync_at timestamptz nullable

- created_at

6) sis_wearable_raw (stub)

- id, student_id, user_id

- provider text

- date date

- payload jsonb

- created_at

INDEXES

All sis_* tables: index (user_id, date desc) and (student_id, date desc)

C) STORAGE

Create Supabase Storage bucket: sis-media

Path: sis-media/{user_id}/{module}/{yyyy-mm-dd}/{file}

RLS:

- student can read/write only their own {user_id} folder

- admin/coach can read all

D) RLS PATTERN (CRITICAL)

For ALL sis_* tables:

- Student: SELECT/INSERT/UPDATE/DELETE where user_id = auth.uid()

- Admin: full access via has_role(auth.uid(),'admin') OR existing role system

Do NOT use auth.uid() = student_id (these are different ids).

E) SCORE CALCULATION (EDGE FUNCTION)

Implement Supabase Edge Function:

supabase/functions/compute-sis-score/index.ts

Triggering:

- Call after any SIS data save (cognitive checkin insert/update)

- Also call after manual_day_logs save (if feasible) to keep score fresh

Edge function steps:

1) Resolve student_id from auth.uid() (via students.user_id)

2) Fetch last 30 days data from:

   - workout_set_logs/workout_completions (mechanical)

   - manual_day_logs + health_daily (recovery inputs)

   - body_assessments + checkins (body comp)

   - sis_cognitive_checkins (cognitive)

   - sis_structural_assessments latest within 90 days (structural; if none use 50)

3) Compute baselines mean/sd per metric (30d); if <7 samples use fallback.

4) Compute sub-scores using V2 model (zscore + clamp) and weights:

   - Mechanical 25%

   - Recovery 20%

   - Structural 15%

   - BodyComp 15%

   - Cognitive 15%

   - Consistency 10%

5) Generate alerts:

   - HRV below baseline 3 days

   - Recovery score < 60

   - Mechanical drop vs 14d avg

   - Sleep deficit 3 days (<6h)

   - Fatigue >=4 for 3 days

   - Stress >=4 for 3 days

6) Upsert sis_scores_daily by (user_id,date)

7) Update sis_streaks when cognitive checkin saved

RESILIENCE (IMPORTANT)

If compute fails:

- Do not break UI. UI should show last available sis_scores_daily and a subtle “update pending” state.

(You can implement a small boolean in UI if no score for today.)

F) UI — EVOLVE /RENASCER (STUDENT DASHBOARD)

Update src/pages/Renascer.tsx to become SIS dashboard:

- Replace existing ScoreRing with Shape Intelligence Score™ (0–100) + classification

- Add sub-score cards (Mechanical, Recovery, Structural, Body Comp, Cognitive, Consistency)

- Add sparkline or small trend indicators (7d/14d/30d) using sis_scores_daily

- Add alerts panel

- Keep ManualInput section (do not remove)

- Add quick action: “Check-in Cognitivo (1 min)” opens modal

New components:

- src/components/sis/SisScoreRing.tsx

- src/components/sis/SisSubScoreCards.tsx

- src/components/sis/SisAlerts.tsx

- src/components/sis/SisTrendChart.tsx (30-day line chart)

- src/components/sis/SisCognitiveCheckin.tsx (modal form)

New hook:

- src/hooks/useSisScore.ts

Fetches:

- today score from sis_scores_daily

- trend series (last 30 days)

- computed 7/14/30 averages and deltas

Shared util:

- src/lib/sisScoreCalc.ts (types + clamp/zscore helpers, reuse in edge function if helpful)

G) FILES TO CREATE/EDIT

1) Migration SQL:

- Create 6 tables + indexes + constraints

- Enable RLS + policies

- Create storage bucket policies

2) supabase/functions/compute-sis-score/index.ts

3) src/hooks/useSisScore.ts

4) src/lib/sisScoreCalc.ts

5) src/components/sis/* (5 components)

6) src/pages/Renascer.tsx

NOT IN THIS PHASE

- No admin/coach SIS views

- No PDF executive report

- No structural UI (table only)

- No wearable integrations (stub tables only)

- No backfill job (optional later)

DELIVERABLE

After implementation:

- Student sees SIS dashboard on /renascer with score, sub-scores, trends, alerts

- Cognitive quick checkin saves to sis_cognitive_checkins and recomputes score

- All secured by RLS and compatible with existing students