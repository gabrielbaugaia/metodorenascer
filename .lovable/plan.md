

# Fix: Fitness Screenshot Attachment + Yesterday History Not Refreshing

## Problems Found

### 1. Fitness screenshot upload fails
The `fitness-screenshots` storage bucket has INSERT and SELECT policies but **no UPDATE policy**. The code uses `upload(path, file, { upsert: true })` which requires UPDATE permission. Without it, the upload fails silently, causing the save mutation to error out.

### 2. Yesterday's registration doesn't appear in history
In `ManualInput.tsx` line 215, `onSuccess` only invalidates `["renascer-score"]`. The `RecentLogsHistory` component uses query key `["recent-logs-history"]`, which is never invalidated after saving. So the history list stays stale.

## Fixes

### Migration: Add UPDATE storage policy for fitness-screenshots
```sql
CREATE POLICY "Users can update own fitness screenshots"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'fitness-screenshots'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### `src/components/renascer/ManualInput.tsx`
In `onSuccess` (line 215), add:
```typescript
queryClient.invalidateQueries({ queryKey: ["recent-logs-history"] });
```

This ensures the history list refreshes immediately after saving any day's data (today, yesterday, or custom date).

## Files Changed

| File | Action |
|---|---|
| New migration SQL | Add UPDATE storage policy for fitness-screenshots |
| `src/components/renascer/ManualInput.tsx` | Invalidate `recent-logs-history` query on save success |

