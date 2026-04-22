import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, Save, Loader2, Sparkles, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  REELS_ACCEPTED_TYPES,
  REELS_MAX_SIZE,
  captureKeyFrames,
  captureThumbnailBlob,
  loadVideoElement,
  stripAudio,
} from "@/lib/reelsVideoUtils";
import { ReelCard, ReelDraft } from "./ReelCard";

interface ReelsBatchUploadProps {
  onUploaded?: () => void;
}

const MAX_PARALLEL = 3;

export function ReelsBatchUpload({ onUploaded }: ReelsBatchUploadProps) {
  const [drafts, setDrafts] = useState<ReelDraft[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [bulkAi, setBulkAi] = useState<{ running: boolean; current: number; total: number }>({ running: false, current: 0, total: 0 });
  const [bulkStrip, setBulkStrip] = useState<{ running: boolean; current: number; total: number }>({ running: false, current: 0, total: 0 });
  const inputRef = useRef<HTMLInputElement>(null);

  const updateDraft = useCallback((id: string, patch: Partial<ReelDraft>) => {
    setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  }, []);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const incoming = Array.from(files);
    const valid: File[] = [];
    for (const file of incoming) {
      if (!REELS_ACCEPTED_TYPES.includes(file.type)) {
        toast.error(`${file.name}: tipo não suportado (mp4/mov/webm)`);
        continue;
      }
      if (file.size > REELS_MAX_SIZE) {
        toast.error(`${file.name}: maior que 100MB`);
        continue;
      }
      valid.push(file);
    }
    if (!valid.length) return;

    const newDrafts: ReelDraft[] = [];
    for (const file of valid) {
      try {
        const { meta, url } = await loadVideoElement(file);
        URL.revokeObjectURL(url); // já temos o meta
        const previewUrl = URL.createObjectURL(file);
        newDrafts.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          file,
          previewUrl,
          title: file.name.replace(/\.[^.]+$/, ""),
          description: "",
          showDescription: false,
          category: "execucao",
          muscleGroup: "",
          audioRemoved: false,
          isVertical: meta.isVertical,
          duration: meta.duration,
          status: "idle",
        });
      } catch (err) {
        console.error("erro ao ler vídeo", file.name, err);
        toast.error(`Falha ao ler ${file.name}`);
      }
    }
    setDrafts((prev) => [...prev, ...newDrafts]);
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
  };

  const handleSuggestTitle = async (draft: ReelDraft) => {
    updateDraft(draft.id, { status: "suggesting", error: undefined });
    try {
      const { frames } = await captureKeyFrames(draft.file);
      const { data, error } = await supabase.functions.invoke("reels-suggest-title", {
        body: { frames, category: draft.category, muscleGroup: draft.muscleGroup || undefined },
      });
      if (error) throw error;
      const title = (data as { title?: string })?.title;
      if (title) {
        updateDraft(draft.id, { title, status: "idle" });
        toast.success("Título sugerido pela IA");
      } else {
        updateDraft(draft.id, { status: "idle" });
      }
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Falha ao sugerir título";
      updateDraft(draft.id, { status: "idle", error: msg });
      toast.error(msg);
    }
  };

  const handleStripAudio = async (draft: ReelDraft) => {
    updateDraft(draft.id, { status: "stripping", error: undefined });
    try {
      const blob = await stripAudio(draft.file);
      if (!blob) {
        toast.error("Seu navegador não suporta remoção de áudio nesse formato");
        updateDraft(draft.id, { status: "idle" });
        return;
      }
      const newFile = new File([blob], draft.file.name.replace(/\.[^.]+$/, "") + "-muted.webm", {
        type: blob.type,
      });
      const previewUrl = URL.createObjectURL(newFile);
      // revoga preview anterior
      try { URL.revokeObjectURL(draft.previewUrl); } catch { /* noop */ }
      updateDraft(draft.id, {
        file: newFile,
        previewUrl,
        audioRemoved: true,
        status: "idle",
      });
      toast.success("Áudio removido");
    } catch (err) {
      console.error(err);
      updateDraft(draft.id, { status: "idle", error: "Falha ao remover áudio" });
      toast.error("Falha ao remover áudio");
    }
  };

  const uploadDraft = async (draft: ReelDraft, userId: string): Promise<void> => {
    updateDraft(draft.id, { status: "uploading", progress: 0, error: undefined });
    try {
      const ext = draft.file.name.split(".").pop()?.toLowerCase() || "mp4";
      const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("reels-videos")
        .upload(path, draft.file, { contentType: draft.file.type, upsert: false });
      if (upErr) throw upErr;
      updateDraft(draft.id, { progress: 60 });

      const { data: pub } = supabase.storage.from("reels-videos").getPublicUrl(path);
      const videoUrl = pub.publicUrl;

      // thumbnail
      let thumbnailUrl: string | null = null;
      try {
        const thumbBlob = await captureThumbnailBlob(draft.file);
        const thumbPath = path.replace(/\.[^.]+$/, ".jpg").replace(/^/, "thumbs/");
        const { error: tErr } = await supabase.storage
          .from("reels-videos")
          .upload(thumbPath, thumbBlob, { contentType: "image/jpeg", upsert: false });
        if (!tErr) {
          thumbnailUrl = supabase.storage.from("reels-videos").getPublicUrl(thumbPath).data.publicUrl;
        }
      } catch (err) {
        console.warn("thumbnail falhou", err);
      }
      updateDraft(draft.id, { progress: 85 });

      const { error: insErr } = await supabase.from("reels_videos").insert({
        title: draft.title.trim() || draft.file.name,
        description: draft.showDescription ? draft.description.trim() || null : null,
        show_description: draft.showDescription,
        category: draft.category,
        muscle_group: draft.muscleGroup.trim() || null,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        duration_seconds: draft.duration || null,
        audio_removed: draft.audioRemoved,
        original_filename: draft.file.name,
        file_size_bytes: draft.file.size,
        is_published: true,
        created_by: userId,
      });
      if (insErr) throw insErr;
      updateDraft(draft.id, { status: "done", progress: 100 });
    } catch (err) {
      console.error("upload error", err);
      const msg = err instanceof Error ? err.message : "Falha ao enviar";
      updateDraft(draft.id, { status: "error", error: msg });
    }
  };

  const handleSaveAll = async () => {
    const pending = drafts.filter((d) => d.status === "idle" || d.status === "error");
    if (!pending.length) {
      toast.info("Nenhum vídeo pendente");
      return;
    }
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      toast.error("Sessão expirada");
      return;
    }
    setIsSavingAll(true);
    try {
      // semáforo simples
      const queue = [...pending];
      const workers = Array.from({ length: Math.min(MAX_PARALLEL, queue.length) }, async () => {
        while (queue.length) {
          const next = queue.shift();
          if (!next) break;
          // pega versão atualizada
          const fresh = drafts.find((d) => d.id === next.id) ?? next;
          // eslint-disable-next-line no-await-in-loop
          await uploadDraft(fresh, userData.user!.id);
        }
      });
      await Promise.all(workers);
      toast.success("Lote processado");
      onUploaded?.();
    } finally {
      setIsSavingAll(false);
    }
  };

  const totalDone = drafts.filter((d) => d.status === "done").length;
  const totalUploading = drafts.filter((d) => d.status === "uploading").length;

  return (
    <div className="space-y-4">
      <Card
        className={`border-2 border-dashed transition-colors ${
          isDragging ? "border-primary bg-primary/5" : "border-border"
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
      >
        <div className="p-8 text-center">
          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm font-medium mb-1">Arraste vídeos verticais aqui</p>
          <p className="text-xs text-muted-foreground mb-3">
            mp4, mov ou webm — até 100MB cada
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
          >
            Selecionar arquivos
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept={REELS_ACCEPTED_TYPES.join(",")}
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
        </div>
      </Card>

      {drafts.length > 0 && (
        <>
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>{totalDone} de {drafts.length} enviados</span>
                {totalUploading > 0 && <span>Enviando {totalUploading}…</span>}
              </div>
              <Progress value={(totalDone / drafts.length) * 100} className="h-1.5" />
            </div>
            <Button onClick={handleSaveAll} disabled={isSavingAll || drafts.every((d) => d.status === "done")}>
              {isSavingAll ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Enviar todos
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {drafts.map((draft) => (
              <ReelCard
                key={draft.id}
                draft={draft}
                onChange={(patch) => updateDraft(draft.id, patch)}
                onRemove={() => {
                  try { URL.revokeObjectURL(draft.previewUrl); } catch { /* noop */ }
                  setDrafts((prev) => prev.filter((d) => d.id !== draft.id));
                }}
                onSuggestTitle={() => handleSuggestTitle(draft)}
                onStripAudio={() => handleStripAudio(draft)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
