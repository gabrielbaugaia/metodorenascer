

# 90-Day Behavioral Transformation + Nutrition Tracking

This is a large system. I'll break it into focused deliverables that integrate with the existing SIS infrastructure.

## What Already Exists (no rebuild needed)
- Behavioral profiles (explorer/executor/resistant/consistent) + classify-behavior edge function
- Micro Wins card (workout, sleep, mental check-in)
- Active Challenge card with streak progress
- SIS score with 6 pillars (mechanical, recovery, structural, body_comp, cognitive, consistency)
- Manual day logs (sleep, stress, energy, RPE, training)
- Streak tracking via `sis_streaks`

## What's New

### Database Migration (1 migration file)

**Table: `transformation_journeys`** — tracks each user's 90-day journey
```
user_id (uuid, unique, FK profiles)
started_at (timestamptz, default now())
current_day (integer, default 1)
current_phase (text: 'installation' | 'consolidation' | 'identity')
status (text: 'active' | 'completed' | 'paused')
badges_earned (jsonb, default '[]')
```

**Table: `food_logs`** — individual food entries per meal
```
id (uuid)
user_id (uuid, FK profiles)
date (date)
meal_type (text: 'breakfast' | 'lunch' | 'dinner' | 'snack')
food_name (text)
calories (numeric)
protein_g (numeric)
carbs_g (numeric)
fat_g (numeric)
portion_size (text)
created_at (timestamptz)
```

**Table: `daily_nutrition_targets`** — user's daily calorie/macro targets
```
user_id (uuid, unique, FK profiles)
calories_target (numeric, default 2000)
protein_target_g (numeric, default 120)
carbs_target_g (numeric, default 200)
fat_target_g (numeric, default 65)
updated_at (timestamptz)
```

**Table: `foods_database`** — searchable food catalog
```
id (uuid)
food_name (text)
calories (numeric)
protein_g (numeric)
carbs_g (numeric)
fat_g (numeric)
portion_size (text, default '100g')
category (text)
```

Insert ~50 common Brazilian foods (arroz, feijão, frango, ovo, batata doce, etc.) as seed data.

RLS: users CRUD own food_logs and nutrition_targets. Everyone can SELECT foods_database.

### 1. 90-Day Transformation Journey

**New component: `TransformationPhaseCard.tsx`**
- Shows current day (e.g., "Dia 23 / 90"), current phase name, phase-specific motivational message
- Phase logic: days 1-30 = Installation, 31-60 = Consolidation, 61-90 = Identity
- Badge milestones at 7, 14, 30, 60, 90 days
- Progress bar spanning the full 90-day arc

**New hook: `useTransformationJourney.ts`**
- Fetches `transformation_journeys` for user
- Auto-creates journey on first visit if none exists
- Calculates current_day from `started_at` to today
- Determines phase and phase-specific messaging
- Tracks badge unlocks

**Integration**: Add to Renascer.tsx dashboard, placed above the SIS Score Ring.

### 2. Enhanced Daily Progress

**Update `MicroWinsCard.tsx`**:
- Add "Nutrition log" as 4th micro win (check if any food_logs exist for today)
- Show "4/4" progress counter
- Display phase-aware motivational toast on each action completion

**New component: `MotivationalToast.tsx`**:
- Pool of positive messages (from spec: "Consistency creates transformation", "Small actions build transformation", etc.)
- Randomly selected on each positive action
- Displayed via `sonner` toast

### 3. Nutrition Tracking Page

**New page: `NutricaoTracking.tsx`** (route: `/nutricao-diario`)
- Top section: circular calorie gauge (consumed / target / remaining)
- Macro distribution: 3 small circular charts (Protein, Carbs, Fat) using recharts PieChart
- 4 meal sections (Breakfast, Lunch, Dinner, Snacks) each with:
  - List of logged foods with calories
  - "Add food" button → opens search modal
- Behavioral feedback toast after each food log

**New component: `FoodSearchModal.tsx`**:
- Search input filtering `foods_database`
- Shows matching foods with portion info
- Single-tap to add → inserts into `food_logs`
- Target: < 5 seconds to log a food

**New component: `CalorieGauge.tsx`**:
- Circular progress showing consumed vs target
- Remaining calories displayed prominently

**New component: `MacroDonutChart.tsx`**:
- Three small donut charts for P/C/F using recharts

**New hook: `useNutritionTracking.ts`**:
- Fetches today's `food_logs` grouped by meal_type
- Fetches `daily_nutrition_targets`
- Calculates consumed totals, remaining
- Provides `addFood` and `removeFood` mutations

### 4. SIS Score Integration

**Update `compute-sis-score` edge function**:
- Add nutrition_score sub-component:
  - Check if user logged any foods today → base score
  - Adherence to calorie target (within ±15% = high score)
  - Meal distribution (logged across ≥3 meal types = bonus)
- Adjust SIS weights to match spec:
  - Training: 25%, Recovery/Sleep: 20%, Cognitive: 15%, Consistency: 20%, Nutrition: 20%
  - Remove structural (15%) and body_comp (15%), redistribute to consistency (20%) and nutrition (20%)

**Update `sis_scores_daily`**: Add `nutrition_score` column via migration.

**Update `SisSubScoreCards.tsx`**: Add Nutrition sub-score card.

### 5. Navigation & Routing

- Add `/nutricao-diario` route in App.tsx (behind SubscriptionGuard)
- Add link in ClientSidebar to "Diário Nutricional"
- Add link from Renascer dashboard to nutrition tracking

## Files Changed

| File | Action |
|---|---|
| New migration SQL | Create tables + seed foods + add nutrition_score column |
| `src/pages/NutricaoTracking.tsx` | New — nutrition tracking page |
| `src/hooks/useTransformationJourney.ts` | New — 90-day journey logic |
| `src/hooks/useNutritionTracking.ts` | New — food log CRUD + targets |
| `src/components/renascer/TransformationPhaseCard.tsx` | New — phase display |
| `src/components/nutrition/FoodSearchModal.tsx` | New — food search + add |
| `src/components/nutrition/CalorieGauge.tsx` | New — circular calorie display |
| `src/components/nutrition/MacroDonutChart.tsx` | New — P/C/F donuts |
| `src/components/nutrition/MealSection.tsx` | New — meal category with foods |
| `src/components/renascer/MicroWinsCard.tsx` | Update — add nutrition win |
| `src/pages/Renascer.tsx` | Add transformation phase card |
| `src/App.tsx` | Add /nutricao-diario route |
| `src/components/layout/ClientSidebar.tsx` | Add nav link |
| `supabase/functions/compute-sis-score/index.ts` | Add nutrition_score pillar |
| `src/hooks/useSisScore.ts` | Expose nutrition score |
| `src/components/sis/SisSubScoreCards.tsx` | Add nutrition card |
| `src/hooks/useBehaviorProfile.ts` | Add nutrition to micro wins |

## Implementation Order

Due to the size, I recommend implementing in 2 batches:

**Batch 1**: Database migration + 90-day transformation + enhanced micro wins + motivational feedback
**Batch 2**: Nutrition tracking module (food database, logging, charts, SIS integration)

Shall I proceed with Batch 1 first, or implement everything in one go?

