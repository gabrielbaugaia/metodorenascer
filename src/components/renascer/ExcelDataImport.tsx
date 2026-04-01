import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import * as XLSX from "xlsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileSpreadsheet, Upload, Loader2, AlertTriangle, Check } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface ParsedRow {
  date: string;
  sleep_hours?: number | null;
  stress_level?: number | null;
  energy_focus?: number | null;
  trained_today?: boolean | null;
  rpe?: number | null;
  steps?: number | null;
  active_calories?: number | null;
  exercise_minutes?: number | null;
  standing_hours?: number | null;
  distance_km?: number | null;
  resting_hr?: number | null;
  hrv_ms?: number | null;
  avg_hr_bpm?: number | null;
}

const COLUMN_MAP: Record<string, keyof ParsedRow> = {
  data: "date", date: "date", dia: "date",
  sono: "sleep_hours", sleep: "sleep_hours", sleep_hours: "sleep_hours", "horas sono": "sleep_hours",
  estresse: "stress_level", stress: "stress_level", stress_level: "stress_level",
  energia: "energy_focus", energy: "energy_focus", energy_focus: "energy_focus", foco: "energy_focus",
  treinou: "trained_today", trained: "trained_today", trained_today: "trained_today",
  rpe: "rpe",
  passos: "steps", steps: "steps",
  calorias: "active_calories", active_calories: "active_calories", "calorias ativas": "active_calories",
  exercicio: "exercise_minutes", exercise_minutes: "exercise_minutes", "minutos exercicio": "exercise_minutes", "min exercício": "exercise_minutes",
  "em pe": "standing_hours", standing_hours: "standing_hours", "horas em pe": "standing_hours",
  distancia: "distance_km", distance: "distance_km", distance_km: "distance_km",
  fc_repouso: "resting_hr", resting_hr: "resting_hr", "fc repouso": "resting_hr",
  vfc: "hrv_ms", hrv: "hrv_ms", hrv_ms: "hrv_ms",
  fc_media: "avg_hr_bpm", avg_hr_bpm: "avg_hr_bpm", "fc media": "avg_hr_bpm",
};

function normalizeCol(col: string): string {
  return col.toLowerCase().trim()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[_\-]/g, " ").replace(/\s+/g, " ").trim();
}

function parseDate(val: unknown): string | null {
  if (!val) return null;
  if (typeof val === "number") {
    // Excel serial date
    const d = XLSX.SSF.parse_date_code(val);
    if (d) return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
  }
  const s = String(val).trim();
  // Try yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // Try dd/mm/yyyy
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return null;
}

function parseNum(val: unknown): number | null {
  if (val == null || val === "") return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
}

function parseBool(val: unknown): boolean | null {
  if (val == null || val === "") return null;
  const s = String(val).toLowerCase().trim();
  if (["sim", "yes", "true", "1", "s"].includes(s)) return true;
  if (["não", "nao", "no", "false", "0", "n"].includes(s)) return false;
  return null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetUserId?: string; // Admin can import for another user
}

export function ExcelDataImport({ open, onOpenChange, targetUserId }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [overwrite, setOverwrite] = useState(false);
  const [existingDates, setExistingDates] = useState<Set<string>>(new Set());
  const [step, setStep] = useState<"upload" | "review">("upload");

  const userId = targetUserId || user?.id;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);

      if (!json.length) { toast.error("Arquivo vazio"); return; }

      // Map columns
      const rawHeaders = Object.keys(json[0]);
      const colMapping: Record<string, keyof ParsedRow> = {};
      for (const h of rawHeaders) {
        const norm = normalizeCol(h);
        if (COLUMN_MAP[norm]) colMapping[h] = COLUMN_MAP[norm];
      }

      if (!Object.values(colMapping).includes("date")) {
        toast.error("Coluna de data não encontrada. Use 'Data', 'Date' ou 'Dia'.");
        return;
      }

      const parsed: ParsedRow[] = [];
      for (const row of json) {
        const entry: Partial<ParsedRow> = {};
        for (const [rawH, field] of Object.entries(colMapping)) {
          const val = row[rawH];
          if (field === "date") entry.date = parseDate(val) ?? "";
          else if (field === "trained_today") entry.trained_today = parseBool(val);
          else (entry as any)[field] = parseNum(val);
        }
        if (entry.date) parsed.push(entry as ParsedRow);
      }

      if (!parsed.length) { toast.error("Nenhuma linha válida encontrada"); return; }

      // Check existing dates
      const dates = parsed.map(r => r.date);
      const { data: existing } = await supabase
        .from("manual_day_logs")
        .select("date")
        .eq("user_id", userId)
        .in("date", dates);
      setExistingDates(new Set((existing ?? []).map(e => e.date)));

      setRows(parsed);
      setStep("review");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao ler o arquivo");
    }

    if (fileRef.current) fileRef.current.value = "";
  };

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("No user");

      for (const row of rows) {
        const hasExisting = existingDates.has(row.date);

        // manual_day_logs upsert
        const logData: Record<string, unknown> = { user_id: userId, date: row.date };
        if (row.sleep_hours != null) logData.sleep_hours = row.sleep_hours;
        if (row.stress_level != null) logData.stress_level = row.stress_level;
        if (row.energy_focus != null) logData.energy_focus = row.energy_focus;
        if (row.trained_today != null) logData.trained_today = row.trained_today;
        if (row.rpe != null) logData.rpe = row.rpe;
        if (row.steps != null) logData.steps = row.steps;
        if (row.active_calories != null) logData.active_calories = row.active_calories;
        if (row.exercise_minutes != null) logData.exercise_minutes = row.exercise_minutes;
        if (row.standing_hours != null) logData.standing_hours = row.standing_hours;
        if (row.distance_km != null) logData.distance_km = row.distance_km;

        if (!hasExisting || overwrite) {
          await supabase
            .from("manual_day_logs")
            .upsert(logData as any, { onConflict: "user_id,date" });
        }

        // health_daily upsert
        const healthData: Record<string, unknown> = {
          user_id: userId, date: row.date, source: "manual",
        };
        if (row.sleep_hours != null) healthData.sleep_minutes = Math.round(row.sleep_hours * 60);
        if (row.steps != null) healthData.steps = row.steps;
        if (row.active_calories != null) healthData.active_calories = row.active_calories;
        if (row.exercise_minutes != null) healthData.exercise_minutes = row.exercise_minutes;
        if (row.standing_hours != null) healthData.standing_hours = row.standing_hours;
        if (row.distance_km != null) healthData.distance_km = row.distance_km;
        if (row.resting_hr != null) healthData.resting_hr = row.resting_hr;
        if (row.hrv_ms != null) healthData.hrv_ms = row.hrv_ms;
        if (row.avg_hr_bpm != null) healthData.avg_hr_bpm = row.avg_hr_bpm;

        const hasHealthFields = Object.keys(healthData).length > 3;
        if (hasHealthFields && (!hasExisting || overwrite)) {
          await supabase
            .from("health_daily")
            .upsert(healthData as any, { onConflict: "user_id,date" });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recent-logs-history"] });
      queryClient.invalidateQueries({ queryKey: ["renascer-score"] });
      queryClient.invalidateQueries({ queryKey: ["health-daily"] });
      queryClient.invalidateQueries({ queryKey: ["sis-scores-30d"] });
      toast.success(`${rows.length} dias importados com sucesso!`);
      setRows([]);
      setStep("upload");
      onOpenChange(false);
    },
    onError: () => toast.error("Erro ao importar dados"),
  });

  const reset = () => { setRows([]); setStep("upload"); setOverwrite(false); };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Importar Dados via Excel
          </DialogTitle>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Envie um arquivo <strong>.xlsx</strong> ou <strong>.csv</strong> com os dados mensais
              extraídos do app do celular. O sistema reconhece colunas em português e inglês.
            </p>
            <div className="rounded-lg border-2 border-dashed border-border/50 p-6 text-center">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-3">Arraste ou clique para selecionar</p>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFile}
              />
              <Button variant="outline" onClick={() => fileRef.current?.click()}>
                Selecionar arquivo
              </Button>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium">Colunas aceitas:</p>
              <p>Data, Sono, Estresse, Energia, Treinou, RPE, Passos, Calorias, Exercício, Em Pé, Distância, FC Repouso, VFC, FC Média</p>
            </div>
          </div>
        )}

        {step === "review" && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{rows.length} dias encontrados</p>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Sobrescrever existentes</Label>
                <Switch checked={overwrite} onCheckedChange={setOverwrite} />
              </div>
            </div>

            <div className="rounded-lg border border-border/50 overflow-auto max-h-[40vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Data</TableHead>
                    <TableHead className="text-xs">Sono</TableHead>
                    <TableHead className="text-xs">Estresse</TableHead>
                    <TableHead className="text-xs">Energia</TableHead>
                    <TableHead className="text-xs">Passos</TableHead>
                    <TableHead className="text-xs">FC Rep.</TableHead>
                    <TableHead className="text-xs">VFC</TableHead>
                    <TableHead className="text-xs w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => {
                    const exists = existingDates.has(r.date);
                    return (
                      <TableRow key={r.date} className={exists && !overwrite ? "opacity-50" : ""}>
                        <TableCell className="text-xs font-medium py-1.5">
                          {format(new Date(r.date + "T12:00:00"), "dd/MM")}
                        </TableCell>
                        <TableCell className="text-xs py-1.5">{r.sleep_hours ?? "—"}</TableCell>
                        <TableCell className="text-xs py-1.5">{r.stress_level ?? "—"}</TableCell>
                        <TableCell className="text-xs py-1.5">{r.energy_focus ?? "—"}</TableCell>
                        <TableCell className="text-xs py-1.5">{r.steps?.toLocaleString() ?? "—"}</TableCell>
                        <TableCell className="text-xs py-1.5">{r.resting_hr ?? "—"}</TableCell>
                        <TableCell className="text-xs py-1.5">{r.hrv_ms ?? "—"}</TableCell>
                        <TableCell className="text-xs py-1.5">
                          {exists ? (
                            <Badge variant="outline" className="text-[9px] px-1 py-0">
                              <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                              Existe
                            </Badge>
                          ) : (
                            <Check className="h-3.5 w-3.5 text-green-500" />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {existingDates.size > 0 && !overwrite && (
              <p className="text-xs text-yellow-500 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                {existingDates.size} dia(s) já possuem dados e serão ignorados
              </p>
            )}

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={reset}>
                Voltar
              </Button>
              <Button
                className="flex-1 bg-primary text-primary-foreground"
                onClick={() => importMutation.mutate()}
                disabled={importMutation.isPending}
              >
                {importMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" />Importando...</>
                ) : (
                  <>Importar {overwrite ? rows.length : rows.length - existingDates.size} dias</>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
