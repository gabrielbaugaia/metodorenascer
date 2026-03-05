

# Adaptive Behavioral AI System

## Overview

This is a large feature set. I'll break it into 5 deliverables that integrate with existing infrastructure (the `events` table, `user_streaks`, `useAchievements`, and the SIS scoring system).

## Architecture Decision: Reuse vs. New Tables

The app already tracks events in the `events` table and has `user_streaks` + `user_achievements`. Instead of duplicating, I'll:
- **Reuse `events`** for behavioral event tracking (it already captures `app_open`, `page_view`, etc.)
- **Create `behavior_profiles`** table for classification results
- **Create `adaptive_challenges`** table for challenge milestones
- **Modify `compute-sis-score`** to incorporate behavioral discipline

## Deliverables

### 1. Database: New Tables + Migration

**`behavior_profiles`** — stores computed behavioral classification per user:
```
user_id (uuid, unique, FK profiles)
profile_type (text: explorer | executor | resistant | consistent)
confidence_score (numeric 0-100)
metrics_snapshot (jsonb — raw counts used for classification)
computed_at (timestamptz)
```

**`adaptive_challenges`** — tracks unlocked challenges per user:
```
user_id (uuid, FK profiles)
challenge_type (text: streak_10 | streak_21 | streak_30)
unlocked_at (timestamptz)
completed_at (timestamptz, nullable)
status (text: active | completed | expired)
```

RLS: users see own data, admins see all.

### 2. Edge Function: `classify-behavior`

New edge function that:
1. Queries `events` for the last 14 days (app_open, workout_completed counts)
2. Queries `user_streaks` for streak_breaks detection
3. Queries `manual_day_logs` for sleep/mental checkin frequency
4. Applies classification logic:
   - **consistent**: workouts ≥ 4/week
   - **explorer**: app_open > 5/week but workouts < 2/week
   - **resistant**: streak resets > 2 in 14 days
   - **executor**: default fallback (workouts 2-3/week, steady usage)
5. Upserts into `behavior_profiles`
6. Checks streak milestones → inserts into `adaptive_challenges`
7. Returns profile + any new challenges unlocked

Called after each `compute-sis-score` or on dashboard load.

### 3. Edge Function: `send-adaptive-push`

New edge function (cron-triggered) that:
1. Reads all `behavior_profiles`
2. Maps profile → notification template (consistent/explorer/resistant/executor messages from the spec)
3. Calls existing `send-push` function logic to deliver

### 4. Behavioral Score Integration into SIS

Modify `compute-sis-score` to add a **behavioral_discipline** sub-component:
- workout_completion rate (last 14d)
- sleep_log frequency
- mental_checkin frequency
- daily consistency (days with any activity / 14)
- streak length bonus

This replaces/enhances the existing `consistency_score` (currently 10% weight). I'll increase its sophistication without changing the SIS weight distribution.

### 5. Dashboard UI Updates (`Renascer.tsx`)

Add to the SIS dashboard:
- **Behavioral Profile Badge** — shows current classification with icon
- **Consistency Streak** — already exists via `useSisScore().currentStreak`, will enhance display
- **Today's Micro Wins** — small card showing completed actions today (workout, sleep log, mental checkin)
- **Active Challenge** — shows current adaptive challenge progress (e.g., "Day 12 of 21-Day Challenge")

### 6. Hook: `useBehaviorProfile`

New React hook that:
- Fetches `behavior_profiles` for current user
- Fetches active `adaptive_challenges`
- Provides `profile`, `challenges`, `microWins` (today's completed events)

## Files Changed

| File | Action |
|---|---|
| New migration SQL | Create `behavior_profiles` + `adaptive_challenges` tables |
| `supabase/functions/classify-behavior/index.ts` | New — classification + challenge unlock logic |
| `supabase/functions/send-adaptive-push/index.ts` | New — profile-based push notifications |
| `supabase/functions/compute-sis-score/index.ts` | Enhance consistency_score with behavioral metrics |
| `src/hooks/useBehaviorProfile.ts` | New — fetch profile + challenges + micro wins |
| `src/components/renascer/BehaviorProfileBadge.tsx` | New — profile type display |
| `src/components/renascer/MicroWinsCard.tsx` | New — today's completed actions |
| `src/components/renascer/ActiveChallengeCard.tsx` | New — challenge progress |
| `src/pages/Renascer.tsx` | Add new cards to dashboard |
| `supabase/config.toml` | Add verify_jwt config for new functions |

No changes to `events` table — it already captures the needed event types.

