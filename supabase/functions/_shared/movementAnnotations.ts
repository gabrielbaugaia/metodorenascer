export type PostureAnnotation = {
  id: string;
  media_id: string;
  label: string;
  points: { x: number; y: number }[];
  observation: string;
  explanation: string;
  confidence: string;
};

// Validate geometry and ownership after model output; no numerical metrics are inferred.
export function sanitizePostureAnnotations(items: PostureAnnotation[], photoIds: string[]): PostureAnnotation[] {
  return items.filter(a => photoIds.includes(a.media_id) && a.label.trim() && a.observation.trim() && a.explanation.trim()
    && a.points.length === 2 && a.points.every(p => Number.isFinite(p.x) && Number.isFinite(p.y) && p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1)
    && Math.hypot(a.points[0].x - a.points[1].x, a.points[0].y - a.points[1].y) > 0.005)
    .filter((a, i, all) => all.slice(0, i).filter(b => b.media_id === a.media_id).length < 6)
    .map((a, i) => ({ ...a, id: `posture-${i + 1}`, label: a.label.slice(0, 80), observation: a.observation.slice(0, 600), explanation: a.explanation.slice(0, 600) }));
}