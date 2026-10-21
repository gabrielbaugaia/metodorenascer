export type Severity = "leve" | "moderada" | "importante";

export const MOVEMENT_FINDINGS = [
  { key: "valgo_joelho", label: "Valgo dinâmico de joelho", region: "Joelhos" },
  { key: "joelho_frente", label: "Joelho ultrapassa muito a ponta do pé", region: "Joelhos" },
  { key: "dorsiflexao", label: "Dorsiflexão de tornozelo limitada", region: "Tornozelos" },
  { key: "pronacao", label: "Pronação / colapso do arco", region: "Pés" },
  { key: "butt_wink", label: "Retroversão pélvica no fundo do agachamento", region: "Quadril e lombar" },
  { key: "hiperlordose", label: "Hiperlordose / anteversão pélvica", region: "Quadril e lombar" },
  { key: "shift_lateral", label: "Deslocamento lateral do quadril", region: "Quadril e lombar" },
  { key: "trendelenburg", label: "Queda de pelve no apoio unipodal", region: "Quadril e lombar" },
  { key: "tronco_inclinado", label: "Inclinação excessiva do tronco", region: "Tronco" },
  { key: "cifose", label: "Hipercifose torácica", region: "Tronco" },
  { key: "ombro_protuso", label: "Ombros protusos / rotação interna", region: "Ombros" },
  { key: "escapula_alada", label: "Escápula alada", region: "Ombros" },
  { key: "bracos_caem", label: "Braços caem à frente no overhead", region: "Ombros" },
  { key: "cabeca_anteriorizada", label: "Cabeça anteriorizada", region: "Cervical" },
  { key: "assimetria", label: "Assimetria esquerda/direita relevante", region: "Geral" },
] as const;

export const PHOTO_POSITIONS = [
  { key: "anterior", label: "Anterior" },
  { key: "posterior", label: "Posterior" },
  { key: "lateral_d", label: "Lateral direita" },
  { key: "lateral_e", label: "Lateral esquerda" },
] as const;

export const VIDEO_POSITIONS = [
  { key: "squat_frontal", label: "Agachamento frontal" },
  { key: "squat_lateral", label: "Agachamento lateral" },
  { key: "marcha", label: "Marcha" },
  { key: "single_leg_d", label: "Apoio unipodal D" },
  { key: "single_leg_e", label: "Apoio unipodal E" },
  { key: "supino_maquina", label: "Supino máquina" },
] as const;

// Labels remain available for immutable historical reports, not new test slots.
export const LEGACY_VIDEO_POSITIONS = [
  { key: "rosca_scott", label: "Rosca Scott" },
  { key: "desenvolvimento_maquina", label: "Desenvolvimento máquina" },
] as const;
export const movementPositionLabel = (key: string) => [...PHOTO_POSITIONS, ...VIDEO_POSITIONS, ...LEGACY_VIDEO_POSITIONS].find(p => p.key === key)?.label ?? key;

export type AnglePoint = { x: number; y: number };
export type MovementAngle = { id: string; media_id: string; label: string; second: number | null; points: AnglePoint[]; degrees: number; aspect_ratio: number; method: "manual_3_points" };
export function angleFromPoints(points: AnglePoint[], aspectRatio: number): number | null {
  if (points.length !== 3 || !Number.isFinite(aspectRatio) || aspectRatio <= 0 || points.some(p => !Number.isFinite(p.x) || !Number.isFinite(p.y) || p.x < 0 || p.x > 1 || p.y < 0 || p.y > 1)) return null;
  const [a, b, c] = points;
  const ax = (a.x - b.x) * aspectRatio, ay = a.y - b.y;
  const cx = (c.x - b.x) * aspectRatio, cy = c.y - b.y;
  const lengths = Math.hypot(ax, ay) * Math.hypot(cx, cy);
  if (lengths < 1e-10) return null;
  return Math.acos(Math.max(-1, Math.min(1, (ax * cx + ay * cy) / lengths))) * 180 / Math.PI;
}

export type Finding = { key: string; label: string; region: string; severity: Severity };
