
-- Sync missing exercise_minutes, standing_hours, distance_km from manual_day_logs to health_daily for ALL users
UPDATE health_daily hd
SET 
  exercise_minutes = COALESCE(hd.exercise_minutes, mdl.exercise_minutes),
  standing_hours = COALESCE(hd.standing_hours, mdl.standing_hours),
  distance_km = COALESCE(hd.distance_km, mdl.distance_km)
FROM manual_day_logs mdl
WHERE hd.user_id = mdl.user_id
  AND hd.date = mdl.date
  AND (
    (hd.exercise_minutes IS NULL AND mdl.exercise_minutes IS NOT NULL)
    OR (hd.standing_hours IS NULL AND mdl.standing_hours IS NOT NULL)
    OR (hd.distance_km IS NULL AND mdl.distance_km IS NOT NULL)
  );

-- Also insert health_daily rows for manual_day_logs entries that have no corresponding health_daily record
INSERT INTO health_daily (user_id, date, steps, active_calories, sleep_minutes, exercise_minutes, standing_hours, distance_km, source)
SELECT 
  mdl.user_id,
  mdl.date,
  COALESCE(mdl.steps, 0),
  COALESCE(mdl.active_calories, 0),
  COALESCE(mdl.sleep_hours * 60, 0)::integer,
  mdl.exercise_minutes,
  mdl.standing_hours,
  mdl.distance_km,
  'manual'
FROM manual_day_logs mdl
LEFT JOIN health_daily hd ON hd.user_id = mdl.user_id AND hd.date = mdl.date
WHERE hd.id IS NULL
  AND (mdl.steps IS NOT NULL OR mdl.active_calories IS NOT NULL OR mdl.sleep_hours IS NOT NULL 
       OR mdl.exercise_minutes IS NOT NULL OR mdl.distance_km IS NOT NULL);
