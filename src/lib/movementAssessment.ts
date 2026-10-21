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
] as const;

export type Finding = { key: string; label: string; region: string; severity: Severity };
