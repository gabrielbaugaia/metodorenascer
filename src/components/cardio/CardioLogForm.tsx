import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Loader2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CARDIO_TYPES = [
  { value: "rua", label: "Corrida / Rua" },
  { value: "esteira", label: "Esteira" },
  { value: "bike", label: "Bike" },
  { value: "eliptico", label: "Elíptico" },
  { value: "natacao", label: "Natação" },
  { value: "caminhada", label: "Caminhada" },
  { value: "outro", label: "Outro" },
];

interface CardioFormData {
  cardio_type: string;
  session_date: string;
  duration_minutes: string;
  distance_km: string;
  calories_burned: string;
  avg_hr_bpm: string;
  max_hr_bpm: string;
  fasting: boolean;
  notes: string;
}

interface Props {
  onSubmit: (data: CardioFormData, screenshotUrl: string | null) => void;
  isSubmitting: boolean;
  userId: string;
}

export function CardioLogForm({ onSubmit, isSubmitting, userId }: Props) {
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState<CardioFormData>({
    cardio_type: "rua",
    session_date: today,
    duration_minutes: "",
    distance_km: "",
    calories_burned: "",
    avg_hr_bpm: "",
    max_hr_bpm: "",
    fasting: false,
    notes: "",
  });
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleScreenshot = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScreenshotFile(file);
    setScreenshotPreview(URL.createObjectURL(file));

    // OCR extraction
    setIsExtracting(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke("extract-fitness-data", {
        body: { images: [base64] },
      });

      if (error) throw error;

      const day = data?.days?.[0];
      if (day) {
        setForm((prev) => ({
          ...prev,
          calories_burned: day.active_calories ? String(day.active_calories) : prev.calories_burned,
          distance_km: day.distance_km ? String(day.distance_km) : prev.distance_km,
          duration_minutes: day.exercise_minutes ? String(day.exercise_minutes) : prev.duration_minutes,
          avg_hr_bpm: day.avg_hr_bpm ? String(day.avg_hr_bpm) : prev.avg_hr_bpm,
        }));
        toast.success("Dados extraídos do print!");
      }
    } catch (err) {
      console.error("OCR error:", err);
      toast.error("Não foi possível extrair dados do print");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.duration_minutes && !form.distance_km) {
      toast.error("Informe pelo menos duração ou distância");
      return;
    }

    let screenshotUrl: string | null = null;
    if (screenshotFile) {
      const ext = screenshotFile.name.split(".").pop();
      const path = `${userId}/cardio/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("fitness-screenshots").upload(path, screenshotFile);
      if (!error) screenshotUrl = path;
    }

    onSubmit(form, screenshotUrl);

    // Reset
    setForm({
      cardio_type: "rua",
      session_date: today,
      duration_minutes: "",
      distance_km: "",
      calories_burned: "",
      avg_hr_bpm: "",
      max_hr_bpm: "",
      fasting: false,
      notes: "",
    });
    setScreenshotFile(null);
    setScreenshotPreview(null);
  };

  const update = (field: keyof CardioFormData, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <Card className="p-4 space-y-4">
      <h3 className="font-semibold text-foreground">Registrar sessão aeróbica</h3>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Tipo</Label>
          <Select value={form.cardio_type} onValueChange={(v) => update("cardio_type", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CARDIO_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Data</Label>
          <Input type="date" value={form.session_date} onChange={(e) => update("session_date", e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Duração (min)</Label>
          <Input type="number" placeholder="30" value={form.duration_minutes} onChange={(e) => update("duration_minutes", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Distância (km)</Label>
          <Input type="number" step="0.1" placeholder="5.0" value={form.distance_km} onChange={(e) => update("distance_km", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Calorias</Label>
          <Input type="number" placeholder="300" value={form.calories_burned} onChange={(e) => update("calories_burned", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">FC média (bpm)</Label>
          <Input type="number" placeholder="140" value={form.avg_hr_bpm} onChange={(e) => update("avg_hr_bpm", e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">FC máx (bpm)</Label>
          <Input type="number" placeholder="170" value={form.max_hr_bpm} onChange={(e) => update("max_hr_bpm", e.target.value)} />
        </div>
        <div className="flex items-center gap-3 pt-5">
          <Switch checked={form.fasting} onCheckedChange={(v) => update("fasting", v)} />
          <Label className="text-xs">Em jejum</Label>
        </div>
      </div>

      <Textarea
        placeholder="Observações (opcional)"
        value={form.notes}
        onChange={(e) => update("notes", e.target.value)}
        className="min-h-[60px]"
      />

      {/* Screenshot */}
      <div className="flex items-center gap-3">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleScreenshot} />
        <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={isExtracting}>
          {isExtracting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Camera className="h-4 w-4 mr-2" />}
          {isExtracting ? "Extraindo..." : "Anexar print"}
        </Button>
        {screenshotPreview && (
          <img src={screenshotPreview} alt="preview" className="h-10 w-10 rounded object-cover border" />
        )}
      </div>

      <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
        Salvar sessão
      </Button>
    </Card>
  );
}
