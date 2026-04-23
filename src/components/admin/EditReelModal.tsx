import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Loader2, Save, Sparkles, FileText, Eye, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { MUSCLE_GROUPS } from "@/lib/muscleGroups";
import { MuscleGroupMultiSelect } from "./MuscleGroupMultiSelect";
import { captureKeyFrames } from "@/lib/reelsVideoUtils";

export interface EditableReel {
  id: string;
  title: string;
  description: string | null;
  show_description: boolean;
  category: string;
  muscle_groups: string[] | null;
  thumbnail_url?: string | null;
}

interface EditReelModalProps {
  reel: EditableReel | null;
  videoUrl?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

interface AiResponse {
  title?: string;
  description?: string;
  muscle_groups?: string[];
}

const CATEGORY_LABEL: Record<string, string> = {
  execucao: "Execução",
  dica: "Dica",
  explicativo: "Explicativo",
};

async function fetchVideoAsFile(url: string, fallbackName = "reel.mp4"): Promise<File> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const blob = await res.blob();
  const name = url.split("/").pop()?.split("?")[0] || fallbackName;
  return new File([blob], name, { type: blob.type || "video/mp4" });
}

interface PreviewProps {
  title: string;
  description: string;
  showDescription: boolean;
  category: string;
  groups: string[];
  videoUrl?: string;
  posterUrl?: string | null;
}

function ReelPreviewCard({ title, description, showDescription, category, groups, videoUrl, posterUrl }: PreviewProps) {
  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-[9/16] bg-muted">
        {videoUrl ? (
          <video
            src={videoUrl}
            poster={posterUrl ?? undefined}
            className="absolute inset-0 w-full h-full object-cover"
            playsInline
            muted
            controls
          />
        ) : posterUrl ? (
          <img src={posterUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : null}
        <Badge variant="secondary" className="absolute top-2 left-2 text-[10px]">
          {CATEGORY_LABEL[category] ?? category}
        </Badge>
        {showDescription && description && (
          <div className="absolute left-0 right-0 bottom-0 bg-gradient-to-t from-background/95 to-transparent p-3">
            <p className="text-xs text-foreground line-clamp-3">{description}</p>
          </div>
        )}
      </div>
      <div className="p-2">
        <p className="text-sm font-medium line-clamp-2">{title || "Sem título"}</p>
        {groups.length > 0 && (
          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
            {groups.join(" • ")}
          </p>
        )}
      </div>
    </Card>
  );
}

export function EditReelModal({ reel, videoUrl, open, onOpenChange, onSaved }: EditReelModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [showDescription, setShowDescription] = useState(false);
  const [category, setCategory] = useState("execucao");
  const [groups, setGroups] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [aiBusy, setAiBusy] = useState<null | "full" | "desc">(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (reel) {
      setTitle(reel.title || "");
      setDescription(reel.description || "");
      setShowDescription(reel.show_description);
      setCategory(reel.category || "execucao");
      setGroups(reel.muscle_groups || []);
    }
  }, [reel]);

  const runAi = async (mode: "full" | "desc") => {
    if (!reel || !videoUrl) {
      toast.error("Vídeo indisponível para IA");
      return;
    }
    setAiBusy(mode);
    try {
      const file = await fetchVideoAsFile(videoUrl);
      const { frames } = await captureKeyFrames(file);
      const { data, error } = await supabase.functions.invoke("reels-suggest-title", {
        body: {
          frames,
          mode: mode === "desc" ? "description_only" : undefined,
          category,
          muscleGroups: groups.length ? groups : undefined,
          currentTitle: mode === "desc" ? (title || undefined) : undefined,
        },
      });
      if (error) throw error;
      const result = data as AiResponse;
      if (mode === "desc") {
        if (result.description) {
          setDescription(result.description.slice(0, 200));
          setShowDescription(true);
          toast.success("Descrição gerada — revise e salve");
        } else {
          toast.warning("IA não retornou descrição");
        }
      } else {
        let any = false;
        if (result.title) {
          setTitle(result.title.slice(0, 60));
          any = true;
        }
        if (result.description) {
          setDescription(result.description.slice(0, 200));
          setShowDescription(true);
          any = true;
        }
        if (Array.isArray(result.muscle_groups) && result.muscle_groups.length) {
          setGroups(result.muscle_groups);
          any = true;
        }
        if (any) toast.success("Campos preenchidos pela IA — revise e salve");
        else toast.warning("IA não retornou conteúdo");
      }
    } catch (err) {
      console.error("ai err", err);
      toast.error("Falha ao processar com IA");
    } finally {
      setAiBusy(null);
    }
  };

  const handleSave = async () => {
    if (!reel) return;
    if (!title.trim()) {
      toast.error("Título obrigatório");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("reels_videos")
      .update({
        title: title.trim().slice(0, 60),
        description: description.trim() ? description.trim().slice(0, 200) : null,
        show_description: showDescription,
        category,
        muscle_groups: groups,
        muscle_group: groups[0] ?? null,
      })
      .eq("id", reel.id);
    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar");
      return;
    }
    toast.success("Vídeo atualizado");
    onOpenChange(false);
    onSaved?.();
  };

  const previewProps: PreviewProps = {
    title,
    description,
    showDescription,
    category,
    groups,
    videoUrl,
    posterUrl: reel?.thumbnail_url ?? null,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar vídeo</DialogTitle>
        </DialogHeader>

        {/* Mobile preview (collapsible) */}
        <div className="lg:hidden">
          <Collapsible open={previewOpen} onOpenChange={setPreviewOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="w-full justify-between h-9">
                <span className="flex items-center gap-2 text-xs">
                  <Eye className="h-3.5 w-3.5" />
                  Pré-visualizar como aluno
                </span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${previewOpen ? "rotate-180" : ""}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              <div className="max-w-[220px] mx-auto">
                <ReelPreviewCard {...previewProps} />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        <div className="grid lg:grid-cols-[1fr_240px] gap-5">
          <div className="space-y-4 min-w-0">
            {videoUrl && (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => runAi("full")}
                  disabled={!!aiBusy || saving}
                  className="h-8 text-xs"
                >
                  {aiBusy === "full" ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3 mr-1" />
                  )}
                  Reescrever tudo com IA
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => runAi("desc")}
                  disabled={!!aiBusy || saving}
                  className="h-8 text-xs"
                >
                  {aiBusy === "desc" ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <FileText className="h-3 w-3 mr-1" />
                  )}
                  Gerar só descrição
                </Button>
              </div>
            )}

            <div>
              <Label className="text-xs">Título</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={60}
                placeholder="Título do vídeo"
              />
              <p className="text-[10px] text-muted-foreground text-right mt-0.5">{title.length}/60</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Categoria</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="execucao">Execução</SelectItem>
                    <SelectItem value="dica">Dica</SelectItem>
                    <SelectItem value="explicativo">Explicativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Grupos musculares</Label>
                <MuscleGroupMultiSelect
                  value={groups}
                  onChange={setGroups}
                  muscleGroups={[...MUSCLE_GROUPS]}
                  placeholder="Selecionar..."
                  className="w-full"
                  compact
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="edit-show-desc"
                checked={showDescription}
                onCheckedChange={setShowDescription}
              />
              <Label htmlFor="edit-show-desc" className="text-xs cursor-pointer">
                Mostrar descrição para o aluno
              </Label>
            </div>

            <div>
              <Label className="text-xs">Descrição (até 200 caracteres)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 200))}
                maxLength={200}
                rows={3}
                placeholder="Descrição curta..."
              />
              <p className="text-[10px] text-muted-foreground text-right mt-0.5">{description.length}/200</p>
            </div>
          </div>

          {/* Desktop preview (sticky side panel) */}
          <div className="hidden lg:block">
            <div className="sticky top-0 space-y-2">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                <Eye className="h-3 w-3" /> Como o aluno vê
              </p>
              <ReelPreviewCard {...previewProps} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || !!aiBusy}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
