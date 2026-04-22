import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, Save, Loader2, Sparkles, VolumeX, FileText } from "lucide-react";
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

interface AiResponse {
  title?: string;
  description?: string;
  muscle_groups?: string[];
}

function applyAiResult(prev: ReelDraft, data: AiResponse): Partial<ReelDraft> {
  const patch: Partial<ReelDraft> = { status: "idle" };
  if (data.title) patch.title = data.title;
  if (Array.isArray(data.muscle_groups) && data.muscle_groups.length > 0) {
    patch.muscleGroups = data.muscle_groups;
  }
  if (data.description) {
    patch.description = data.description;
    // Se o admin ainda não escreveu nada, ativa automaticamente o toggle
    if (!prev.description) {
      patch.showDescription = true;
    }
  }
  return patch;
}

export function ReelsBatchUpload({ onUploaded }: ReelsBatchUploadProps) {
  const [drafts, setDrafts] = useState<ReelDraft[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [bulkAi, setBulkAi] = useState<{ running: boolean; current: number; total: number }>({ running: false, current: 0, total: 0 });
  const [bulkDesc, setBulkDesc] = useState<{ running: boolean; current: number; total: number }>({ running: false, current: 0, total: 0 });
  const [bulkStrip, setBulkStrip] = useState<{ running: boolean; current: number; total: number }>({ running: false, current: 0, total: 0 });
  const inputRef = useRef<HTMLInputElement>(null);

  const updateDraft = useCallback((id: string, patch: Partial<ReelDraft> | ((d: ReelDraft) => Partial<ReelDraft>)) => {
    setDrafts((prev) => prev.map((d) => {
      if (d.id !== id) return d;
      const resolved = typeof patch === "function" ? patch(d) : patch;
      return { ...d, ...resolved };
    }));
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
        URL.revokeObjectURL(url);
        const previewUrl = URL.createObjectURL(file);
        newDrafts.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          file,
          previewUrl,
          title: file.name.replace(/\.[^.]+$/, ""),
          description: "",
          showDescription: false,
          category: "execucao",
          muscleGroups: [],
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
        body: {
          frames,
          category: draft.category,
          muscleGroups: draft.muscleGroups.length ? draft.muscleGroups : undefined,
        },
      });
      if (error) throw error;
      const result = data as AiResponse;
      updateDraft(draft.id, (prev) => applyAiResult(prev, result));
      toast.success("Metadados gerados pela IA");
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Falha ao sugerir metadados";
      updateDraft(draft.id, { status: "idle", error: msg });
      toast.error(msg);
    }
  };

  const handleGenerateDescription = async (draft: ReelDraft) => {
    updateDraft(draft.id, { status: "describing", error: undefined });
    try {
      const { frames } = await captureKeyFrames(draft.file);
      const { data, error } = await supabase.functions.invoke("reels-suggest-title", {
        body: {
          frames,
          mode: "description_only",
          category: draft.category,
          muscleGroups: draft.muscleGroups.length ? draft.muscleGroups : undefined,
          currentTitle: draft.title || undefined,
        },
      });
      if (error) throw error;
      const result = data as AiResponse;
      if (result.description) {
        updateDraft(draft.id, (prev) => ({
          status: "idle",
          description: result.description!,
          showDescription: prev.showDescription || true,
        }));
        toast.success("Descrição gerada");
      } else {
        updateDraft(draft.id, { status: "idle" });
        toast.warning("IA não retornou descrição");
      }
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Falha ao gerar descrição";
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
        description: draft.showDescription ? draft.description.trim() || null : draft.description.trim() || null,
        show_description: draft.showDescription,
        category: draft.category,
        muscle_group: draft.muscleGroups[0] ?? null,
        muscle_groups: draft.muscleGroups,
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
      const queue = [...pending];
      const workers = Array.from({ length: Math.min(MAX_PARALLEL, queue.length) }, async () => {
        while (queue.length) {
          const next = queue.shift();
          if (!next) break;
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

  const handleBulkSuggestTitles = async () => {
    const targets = drafts.filter((d) => d.status === "idle" || d.status === "error");
    if (!targets.length) {
      toast.info("Nenhum vídeo na fila");
      return;
    }
    setBulkAi({ running: true, current: 0, total: targets.length });
    let ok = 0;
    let fail = 0;
    for (let i = 0; i < targets.length; i++) {
      const draft = targets[i];
      setBulkAi({ running: true, current: i + 1, total: targets.length });
      try {
        updateDraft(draft.id, { status: "suggesting", error: undefined });
        // eslint-disable-next-line no-await-in-loop
        const { frames } = await captureKeyFrames(draft.file);
        // eslint-disable-next-line no-await-in-loop
        const { data, error } = await supabase.functions.invoke("reels-suggest-title", {
          body: {
            frames,
            category: draft.category,
            muscleGroups: draft.muscleGroups.length ? draft.muscleGroups : undefined,
          },
        });
        if (error) throw error;
        const result = data as AiResponse;
        if (result.title) {
          updateDraft(draft.id, (prev) => applyAiResult(prev, result));
          ok++;
        } else {
          updateDraft(draft.id, { status: "idle" });
          fail++;
        }
      } catch (err) {
        console.error("bulk title err", err);
        updateDraft(draft.id, { status: "idle", error: "IA falhou" });
        fail++;
      }
    }
    setBulkAi({ running: false, current: 0, total: 0 });
    if (fail === 0) toast.success(`${ok} vídeos atualizados pela IA`);
    else toast.warning(`${ok} atualizados, ${fail} falharam`);
  };

  const handleBulkGenerateDescription = async () => {
    const targets = drafts.filter((d) => d.status === "idle" || d.status === "error");
    if (!targets.length) {
      toast.info("Nenhum vídeo na fila");
      return;
    }
    setBulkDesc({ running: true, current: 0, total: targets.length });
    let ok = 0;
    let fail = 0;
    for (let i = 0; i < targets.length; i++) {
      const draft = targets[i];
      setBulkDesc({ running: true, current: i + 1, total: targets.length });
      try {
        updateDraft(draft.id, { status: "describing", error: undefined });
        // eslint-disable-next-line no-await-in-loop
        const { frames } = await captureKeyFrames(draft.file);
        // eslint-disable-next-line no-await-in-loop
        const { data, error } = await supabase.functions.invoke("reels-suggest-title", {
          body: {
            frames,
            mode: "description_only",
            category: draft.category,
            muscleGroups: draft.muscleGroups.length ? draft.muscleGroups : undefined,
            currentTitle: draft.title || undefined,
          },
        });
        if (error) throw error;
        const result = data as AiResponse;
        if (result.description) {
          updateDraft(draft.id, (prev) => ({
            status: "idle",
            description: result.description!,
            showDescription: prev.showDescription || true,
          }));
          ok++;
        } else {
          updateDraft(draft.id, { status: "idle" });
          fail++;
        }
      } catch (err) {
        console.error("bulk description err", err);
        updateDraft(draft.id, { status: "idle", error: "IA falhou" });
        fail++;
      }
    }
    setBulkDesc({ running: false, current: 0, total: 0 });
    if (fail === 0) toast.success(`Descrição gerada para ${ok} vídeos`);
    else toast.warning(`${ok} atualizados, ${fail} falharam`);
  };
    const targets = drafts.filter((d) => !d.audioRemoved && (d.status === "idle" || d.status === "error"));
    if (!targets.length) {
      toast.info("Todos os vídeos já estão sem áudio");
      return;
    }
    setBulkStrip({ running: true, current: 0, total: targets.length });
    let done = 0;
    let fail = 0;
    const STRIP_PARALLEL = 2;
    const queue = [...targets];

    const worker = async () => {
      while (queue.length) {
        const draft = queue.shift();
        if (!draft) break;
        try {
          updateDraft(draft.id, { status: "stripping", error: undefined });
          // eslint-disable-next-line no-await-in-loop
          const blob = await stripAudio(draft.file);
          if (!blob) {
            updateDraft(draft.id, { status: "idle", error: "Sem suporte" });
            fail++;
          } else {
            const newFile = new File(
              [blob],
              draft.file.name.replace(/\.[^.]+$/, "") + "-muted.webm",
              { type: blob.type }
            );
            const previewUrl = URL.createObjectURL(newFile);
            try { URL.revokeObjectURL(draft.previewUrl); } catch { /* noop */ }
            updateDraft(draft.id, {
              file: newFile,
              previewUrl,
              audioRemoved: true,
              status: "idle",
            });
            done++;
          }
        } catch (err) {
          console.error("bulk strip err", err);
          updateDraft(draft.id, { status: "idle", error: "Falha ao remover áudio" });
          fail++;
        }
        setBulkStrip((prev) => ({ ...prev, current: done + fail }));
      }
    };

    const workers = Array.from({ length: Math.min(STRIP_PARALLEL, queue.length) }, worker);
    await Promise.all(workers);
    setBulkStrip({ running: false, current: 0, total: 0 });
    if (fail === 0) toast.success(`Áudio removido de ${done} vídeos`);
    else toast.warning(`${done} processados, ${fail} falharam`);
  };

  const totalDone = drafts.filter((d) => d.status === "done").length;
  const totalUploading = drafts.filter((d) => d.status === "uploading").length;
  const bulkBusy = bulkAi.running || bulkStrip.running || isSavingAll;
  const hasQueue = drafts.some((d) => d.status === "idle" || d.status === "error");
  const canBulkStrip = drafts.some((d) => !d.audioRemoved && (d.status === "idle" || d.status === "error"));

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
          {drafts.length >= 2 && (
            <Card className="p-3 bg-muted/40">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <div className="text-xs text-muted-foreground flex-1">
                  Ações em lote para os {drafts.length} vídeos:
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleBulkSuggestTitles}
                    disabled={bulkBusy || !hasQueue}
                  >
                    {bulkAi.running ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        Processando {bulkAi.current} de {bulkAi.total}…
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                        Reescrever todos com IA
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleBulkStripAudio}
                    disabled={bulkBusy || !canBulkStrip}
                  >
                    {bulkStrip.running ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        Removendo áudio {bulkStrip.current} de {bulkStrip.total}…
                      </>
                    ) : (
                      <>
                        <VolumeX className="h-3.5 w-3.5 mr-1.5" />
                        Remover áudio de todos
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>{totalDone} de {drafts.length} enviados</span>
                {totalUploading > 0 && <span>Enviando {totalUploading}…</span>}
              </div>
              <Progress value={(totalDone / drafts.length) * 100} className="h-1.5" />
            </div>
            <Button onClick={handleSaveAll} disabled={bulkBusy || drafts.every((d) => d.status === "done")}>
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
