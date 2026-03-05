

# 90-Day Behavioral Transformation + Nutrition Tracking

## Status: ✅ IMPLEMENTED

### What was built:

#### Database
- `transformation_journeys` — 90-day user journey tracking with phases
- `food_logs` — per-meal food entries with macros
- `daily_nutrition_targets` — user calorie/macro goals
- `foods_database` — 50 common Brazilian foods seeded
- `nutrition_score` column added to `sis_scores_daily`

#### Frontend
- `TransformationPhaseCard` — 3-phase journey (Installation/Consolidation/Identity) with badges
- `NutricaoTracking` page at `/nutricao-diario` with CalorieGauge, MacroDonutCharts, MealSections
- `FoodSearchModal` — fast food search and logging (<5s target)
- `MicroWinsCard` updated with 4th "Nutrição" win
- `SisSubScoreCards` updated: removed structural/body_comp, added nutrition

#### SIS Score Rebalanced
- Training: 25%, Recovery: 20%, Cognitive: 15%, Consistency: 20%, Nutrition: 20%
- Nutrition score = logging (30pts) + calorie adherence (50pts) + meal distribution (20pts)

#### Navigation
- `/nutricao-diario` route added behind SubscriptionGuard
- "Diário Nutricional" added to ClientSidebar
