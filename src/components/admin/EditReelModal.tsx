import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { MUSCLE_GROUPS } from "@/lib/muscleGroups";
import { MuscleGroupMultiSelect } from "./MuscleGroupMultiSelect";

export interface EditableReel {
  id: string;
  title: string;
  description: string | null;
  show_description: boolean;
  category: string;
  muscle_groups: string[] | null;
}

interface EditReelModalProps {
  reel: EditableReel | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

export function EditReelModal({ reel, open, onOpenChange, onSaved }: EditReelModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [showDescription, setShowDescription] = useState(false);
  const [category, setCategory] = useState("execucao");
  const [groups, setGroups] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (reel) {
      setTitle(reel.title || "");
      setDescription(reel.description || "");
      setShowDescription(reel.show_description);
      setCategory(reel.category || "execucao");
      setGroups(reel.muscle_groups || []);
    }
  }, [reel]);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar vídeo</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
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
