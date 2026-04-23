import { useEffect, useMemo, useRef, useState } from "react";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ReelsBatchUpload } from "@/components/admin/ReelsBatchUpload";
import { EditReelModal, EditableReel } from "@/components/admin/EditReelModal";
import { MuscleGroupMultiSelect } from "@/components/admin/MuscleGroupMultiSelect";
import { MUSCLE_GROUPS } from "@/lib/muscleGroups";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getSWVersion, APP_VERSION } from "@/lib/appVersion";
import {
  Trash2,
  Eye,
  EyeOff,
  Search,
  Plus,
  Film,
  Pencil,
  Sparkles,
  FileText,
  Dumbbell,
  Loader2,
  X,
  CheckSquare,
} from "lucide-react";
import { captureKeyFrames } from "@/lib/reelsVideoUtils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Reel {
  id: string;
  title: string;
  description: string | null;
  show_description: boolean;
  category: string;
  muscle_group: string | null;
  muscle_groups: string[] | null;
  video_url: string;
  thumbnail_url: string | null;
  is_published: boolean;
  created_at: string;
  duration_seconds: number | null;
  audio_removed: boolean;
}

const CATEGORY_LABEL: Record<string, string> = {
  execucao: "Execução",
  dica: "Dica",
  explicativo: "Explicativo",
};

type SortKey = "created_desc" | "created_asc" | "title_asc" | "title_desc";

const SORT_LABEL: Record<SortKey, string> = {
  created_desc: "Mais recentes",
  created_asc: "Mais antigos",
  title_asc: "Título A-Z",
  title_desc: "Título Z-A",
};

const SORT_STORAGE_KEY = "reels-admin-sort";
const PAGE_SIZE = 48;
const MAX_LOAD_ALL = 1000;

function readStoredSort(): SortKey {
  try {
    const raw = localStorage.getItem(SORT_STORAGE_KEY);
    if (raw && raw in SORT_LABEL) return raw as SortKey;
  } catch { /* noop */ }
  return "created_desc";
}

interface AiResponse {
  title?: string;
  description?: string;
  muscle_groups?: string[];
}

/** Baixa um vídeo público do storage e retorna como File para reuso em captureKeyFrames */
async function fetchVideoAsFile(url: string, fallbackName = "reel.mp4"): Promise<File> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const blob = await res.blob();
  const name = url.split("/").pop()?.split("?")[0] || fallbackName;
  return new File([blob], name, { type: blob.type || "video/mp4" });
}

export default function AdminReels() {
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>(readStoredSort);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingReel, setEditingReel] = useState<EditableReel | null>(null);
  const [editingReelUrl, setEditingReelUrl] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [singleAiId, setSingleAiId] = useState<string | null>(null);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState<null | "ai" | "desc" | "muscles" | "publish" | "unpublish" | "delete" | "selectAll">(null);
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [bulkMuscles, setBulkMuscles] = useState<string[]>([]);
  const [bulkMusclesMode, setBulkMusclesMode] = useState<"replace" | "append">("append");
  const [musclesPopoverOpen, setMusclesPopoverOpen] = useState(false);

  // Persiste critério de ordenação independente dos filtros
  useEffect(() => {
    try { localStorage.setItem(SORT_STORAGE_KEY, sortKey); } catch { /* noop */ }
  }, [sortKey]);

  const buildBaseQuery = () => {
    let query = supabase
      .from("reels_videos")
      .select(
        "id, title, description, show_description, category, muscle_group, muscle_groups, video_url, thumbnail_url, is_published, created_at, duration_seconds, audio_removed",
        { count: "exact" }
      );

    if (search.trim()) {
      const safe = search.trim().replace(/[%_]/g, (c) => `\\${c}`);
      query = query.ilike("title", `%${safe}%`);
    }
    if (filterCategory !== "all") {
      query = query.eq("category", filterCategory);
    }
    if (filterStatus !== "all") {
      query = query.eq("is_published", filterStatus === "active");
    }
    switch (sortKey) {
      case "created_asc":
        query = query.order("created_at", { ascending: true });
        break;
      case "title_asc":
        query = query.order("title", { ascending: true });
        break;
      case "title_desc":
        query = query.order("title", { ascending: false });
        break;
      case "created_desc":
      default:
        query = query.order("created_at", { ascending: false });
    }
    return query;
  };

  const load = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const { data, error, count } = await buildBaseQuery().range(0, PAGE_SIZE - 1);
      if (error) {
        const isPermission = /permission|rls|denied|policy/i.test(error.message);
        setLoadError(isPermission ? "Sem permissão para listar reels." : "Erro ao carregar reels");
        if (!isPermission) toast.error("Erro ao carregar reels");
        setReels([]);
        setTotal(0);
      } else {
        setReels((data ?? []) as Reel[]);
        setTotal(count ?? (data?.length ?? 0));
      }
    } catch (err) {
      console.error("load reels err", err);
      setLoadError("Erro inesperado ao carregar reels");
      setReels([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (loadingMore || loading) return;
    if (total > 0 && reels.length >= total) return;
    setLoadingMore(true);
    try {
      const from = reels.length;
      const to = from + PAGE_SIZE - 1;
      const { data, error } = await buildBaseQuery().range(from, to);
      if (error) {
        toast.error("Erro ao carregar mais");
      } else {
        setReels((prev) => [...prev, ...((data ?? []) as Reel[])]);
      }
    } finally {
      setLoadingMore(false);
    }
  };

  const loadAll = async () => {
    if (loadingMore || loading) return;
    setLoadingMore(true);
    try {
      const from = reels.length;
      const to = Math.min(from + MAX_LOAD_ALL - 1, (total || from + MAX_LOAD_ALL) - 1);
      const { data, error } = await buildBaseQuery().range(from, to);
      if (error) {
        toast.error("Erro ao carregar todos");
      } else {
        setReels((prev) => [...prev, ...((data ?? []) as Reel[])]);
        toast.success(`${(data ?? []).length} vídeo(s) adicionados`);
      }
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filterCategory, filterStatus, sortKey]);

  // Infinite scroll: observe sentinel and trigger loadMore when near bottom
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    if (loading) return;
    if (total === 0) return;
    if (reels.length >= total) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && !loadingMore && !loading && reels.length < total) {
          loadMore();
        }
      },
      { rootMargin: "400px", threshold: 0 }
    );
    observer.observe(node);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingMore, loading, reels.length, total]);

  // Limpa seleções que não estão mais visíveis (após filtro/recarga)
  useEffect(() => {
    setSelectedIds((prev) => {
      const visible = new Set(reels.map((r) => r.id));
      let changed = false;
      const next = new Set<string>();
      prev.forEach((id) => {
        if (visible.has(id)) next.add(id);
        else changed = true;
      });
      return changed ? next : prev;
    });
  }, [reels]);

  const filtered = reels;
  const allSelected = filtered.length > 0 && filtered.every((r) => selectedIds.has(r.id));
  const someSelected = selectedIds.size > 0;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map((r) => r.id)));
  };

  const selectAllGlobal = async () => {
    setBulkBusy("selectAll");
    try {
      let query = supabase.from("reels_videos").select("id");
      if (search.trim()) {
        const safe = search.trim().replace(/[%_]/g, (c) => `\\${c}`);
        query = query.ilike("title", `%${safe}%`);
      }
      if (filterCategory !== "all") query = query.eq("category", filterCategory);
      if (filterStatus !== "all") query = query.eq("is_published", filterStatus === "active");
      const { data, error } = await query.range(0, MAX_LOAD_ALL - 1);
      if (error) {
        toast.error("Falha ao selecionar todos");
        return;
      }
      const ids = (data ?? []).map((r) => r.id as string);
      setSelectedIds(new Set(ids));
      toast.success(`${ids.length} vídeo(s) selecionados`);
    } finally {
      setBulkBusy(null);
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  const togglePublish = async (reel: Reel) => {
    const { error } = await supabase
      .from("reels_videos")
      .update({ is_published: !reel.is_published })
      .eq("id", reel.id);
    if (error) {
      toast.error("Erro ao atualizar");
    } else {
      toast.success(reel.is_published ? "Vídeo desativado" : "Vídeo ativado");
      load();
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const target = reels.find((r) => r.id === deleteId);

    if (target?.video_url) {
      try {
        const url = new URL(target.video_url);
        const marker = "/reels-videos/";
        const idx = url.pathname.indexOf(marker);
        if (idx >= 0) {
          const path = decodeURIComponent(url.pathname.slice(idx + marker.length));
          await supabase.storage.from("reels-videos").remove([path]);
        }
      } catch (err) {
        console.warn("falha ao remover arquivo do storage", err);
      }
    }

    const { error } = await supabase.from("reels_videos").delete().eq("id", deleteId);
    if (error) {
      toast.error("Erro ao excluir");
    } else {
      toast.success("Vídeo excluído");
      setDeleteId(null);
      load();
    }
  };

  const openEdit = (reel: Reel) => {
    setEditingReel({
      id: reel.id,
      title: reel.title,
      description: reel.description,
      show_description: reel.show_description,
      category: reel.category,
      muscle_groups:
        reel.muscle_groups && reel.muscle_groups.length
          ? reel.muscle_groups
          : reel.muscle_group
          ? [reel.muscle_group]
          : [],
    });
    setEditingReelUrl(reel.video_url);
  };

  const handleSingleAi = async (reel: Reel) => {
    setSingleAiId(reel.id);
    try {
      const file = await fetchVideoAsFile(reel.video_url);
      const { frames } = await captureKeyFrames(file);
      const { data, error } = await supabase.functions.invoke("reels-suggest-title", {
        body: {
          frames,
          category: reel.category,
          muscleGroups:
            reel.muscle_groups && reel.muscle_groups.length
              ? reel.muscle_groups
              : reel.muscle_group
              ? [reel.muscle_group]
              : undefined,
        },
      });
      if (error) throw error;
      const result = data as AiResponse;
      const update: Record<string, unknown> = {};
      if (result.title) update.title = result.title;
      if (result.description) {
        update.description = result.description;
        update.show_description = true;
      }
      if (Array.isArray(result.muscle_groups) && result.muscle_groups.length > 0) {
        update.muscle_groups = result.muscle_groups;
        update.muscle_group = result.muscle_groups[0];
      }
      if (Object.keys(update).length === 0) {
        toast.warning("IA não retornou conteúdo");
        return;
      }
      const { error: upErr } = await supabase.from("reels_videos").update(update).eq("id", reel.id);
      if (upErr) throw upErr;
      toast.success("Atualizado pela IA");
      load();
    } catch (err) {
      console.error("single ai err", err);
      toast.error("Falha ao processar com IA");
    } finally {
      setSingleAiId(null);
    }
  };

  // ==================== AÇÕES EM LOTE ====================

  const selectedReels = useMemo(
    () => reels.filter((r) => selectedIds.has(r.id)),
    [reels, selectedIds]
  );

  const handleBulkRewriteAi = async () => {
    if (!selectedReels.length) return;
    setBulkBusy("ai");
    setBulkProgress({ current: 0, total: selectedReels.length });
    let ok = 0;
    let fail = 0;
    for (let i = 0; i < selectedReels.length; i++) {
      const reel = selectedReels[i];
      setBulkProgress({ current: i + 1, total: selectedReels.length });
      try {
        // eslint-disable-next-line no-await-in-loop
        const file = await fetchVideoAsFile(reel.video_url);
        // eslint-disable-next-line no-await-in-loop
        const { frames } = await captureKeyFrames(file);
        // eslint-disable-next-line no-await-in-loop
        const { data, error } = await supabase.functions.invoke("reels-suggest-title", {
          body: {
            frames,
            category: reel.category,
            muscleGroups:
              reel.muscle_groups && reel.muscle_groups.length
                ? reel.muscle_groups
                : reel.muscle_group
                ? [reel.muscle_group]
                : undefined,
          },
        });
        if (error) throw error;
        const result = data as AiResponse;
        const update: Record<string, unknown> = {};
        if (result.title) update.title = result.title;
        if (result.description) {
          update.description = result.description;
          update.show_description = true;
        }
        if (Array.isArray(result.muscle_groups) && result.muscle_groups.length > 0) {
          update.muscle_groups = result.muscle_groups;
          update.muscle_group = result.muscle_groups[0];
        }
        if (Object.keys(update).length === 0) {
          fail++;
          continue;
        }
        // eslint-disable-next-line no-await-in-loop
        const { error: upErr } = await supabase.from("reels_videos").update(update).eq("id", reel.id);
        if (upErr) throw upErr;
        ok++;
      } catch (err) {
        console.error("bulk ai err", reel.id, err);
        fail++;
      }
    }
    setBulkBusy(null);
    setBulkProgress({ current: 0, total: 0 });
    if (fail === 0) toast.success(`${ok} vídeo(s) atualizados pela IA`);
    else toast.warning(`${ok} atualizados, ${fail} falharam`);
    load();
  };

  const handleBulkGenerateDescAi = async () => {
    if (!selectedReels.length) return;
    setBulkBusy("desc");
    setBulkProgress({ current: 0, total: selectedReels.length });
    let ok = 0;
    let fail = 0;
    for (let i = 0; i < selectedReels.length; i++) {
      const reel = selectedReels[i];
      setBulkProgress({ current: i + 1, total: selectedReels.length });
      try {
        // eslint-disable-next-line no-await-in-loop
        const file = await fetchVideoAsFile(reel.video_url);
        // eslint-disable-next-line no-await-in-loop
        const { frames } = await captureKeyFrames(file);
        // eslint-disable-next-line no-await-in-loop
        const { data, error } = await supabase.functions.invoke("reels-suggest-title", {
          body: {
            frames,
            mode: "description_only",
            category: reel.category,
            muscleGroups:
              reel.muscle_groups && reel.muscle_groups.length
                ? reel.muscle_groups
                : reel.muscle_group
                ? [reel.muscle_group]
                : undefined,
            currentTitle: reel.title || undefined,
          },
        });
        if (error) throw error;
        const result = data as AiResponse;
        if (!result.description) {
          fail++;
          continue;
        }
        // eslint-disable-next-line no-await-in-loop
        const { error: upErr } = await supabase
          .from("reels_videos")
          .update({ description: result.description, show_description: true })
          .eq("id", reel.id);
        if (upErr) throw upErr;
        ok++;
      } catch (err) {
        console.error("bulk desc err", reel.id, err);
        fail++;
      }
    }
    setBulkBusy(null);
    setBulkProgress({ current: 0, total: 0 });
    if (fail === 0) toast.success(`Descrição gerada para ${ok} vídeo(s)`);
    else toast.warning(`${ok} atualizados, ${fail} falharam`);
    load();
  };

  const handleBulkSetMuscles = async () => {
    if (!selectedReels.length) return;
    if (!bulkMuscles.length && bulkMusclesMode === "replace") {
      toast.warning("Selecione pelo menos 1 grupo (ou use modo Adicionar)");
      return;
    }
    setBulkBusy("muscles");
    setBulkProgress({ current: 0, total: selectedReels.length });
    let ok = 0;
    let fail = 0;
    for (let i = 0; i < selectedReels.length; i++) {
      const reel = selectedReels[i];
      setBulkProgress({ current: i + 1, total: selectedReels.length });
      try {
        let nextGroups: string[];
        if (bulkMusclesMode === "replace") {
          nextGroups = [...bulkMuscles];
        } else {
          const current =
            reel.muscle_groups && reel.muscle_groups.length
              ? reel.muscle_groups
              : reel.muscle_group
              ? [reel.muscle_group]
              : [];
          const merged = new Set([...current, ...bulkMuscles]);
          nextGroups = Array.from(merged);
        }
        // eslint-disable-next-line no-await-in-loop
        const { error: upErr } = await supabase
          .from("reels_videos")
          .update({ muscle_groups: nextGroups, muscle_group: nextGroups[0] ?? null })
          .eq("id", reel.id);
        if (upErr) throw upErr;
        ok++;
      } catch (err) {
        console.error("bulk muscles err", reel.id, err);
        fail++;
      }
    }
    setBulkBusy(null);
    setBulkProgress({ current: 0, total: 0 });
    setMusclesPopoverOpen(false);
    setBulkMuscles([]);
    if (fail === 0) toast.success(`Grupos atualizados em ${ok} vídeo(s)`);
    else toast.warning(`${ok} atualizados, ${fail} falharam`);
    load();
  };

  const handleBulkTogglePublish = async (publish: boolean) => {
    if (!selectedReels.length) return;
    setBulkBusy(publish ? "publish" : "unpublish");
    const ids = selectedReels.map((r) => r.id);
    const { error } = await supabase
      .from("reels_videos")
      .update({ is_published: publish })
      .in("id", ids);
    setBulkBusy(null);
    if (error) {
      toast.error("Falha ao atualizar status");
    } else {
      toast.success(`${ids.length} vídeo(s) ${publish ? "ativados" : "desativados"}`);
      load();
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedReels.length) return;
    setBulkBusy("delete");
    setBulkProgress({ current: 0, total: selectedReels.length });

    // Remove storage files (best-effort, em paralelo limitado a 3)
    const storagePaths: string[] = [];
    for (const reel of selectedReels) {
      try {
        const url = new URL(reel.video_url);
        const marker = "/reels-videos/";
        const idx = url.pathname.indexOf(marker);
        if (idx >= 0) {
          storagePaths.push(decodeURIComponent(url.pathname.slice(idx + marker.length)));
        }
      } catch { /* noop */ }
    }
    if (storagePaths.length) {
      try {
        await supabase.storage.from("reels-videos").remove(storagePaths);
      } catch (err) {
        console.warn("falha ao remover arquivos do storage em lote", err);
      }
    }

    const ids = selectedReels.map((r) => r.id);
    const { error } = await supabase.from("reels_videos").delete().in("id", ids);
    setBulkBusy(null);
    setBulkProgress({ current: 0, total: 0 });
    setConfirmBulkDelete(false);
    if (error) {
      toast.error("Falha ao excluir em lote");
    } else {
      toast.success(`${ids.length} vídeo(s) excluídos`);
      clearSelection();
      load();
    }
  };

  return (
    <ClientLayout>
      <div className="space-y-6">
        <PageHeader
          title={
            <div className="flex items-center gap-2">
              <span>Reels</span>
              <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 h-4 border-muted-foreground/30 text-muted-foreground">
                v{APP_VERSION} • {getSWVersion()}
              </Badge>
            </div>
          }
          subtitle="Vídeos curtos verticais para os alunos (execuções, dicas, explicativos)"
          actions={
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    if ('caches' in window) {
                      const names = await caches.keys();
                      await Promise.all(names.map((n) => caches.delete(n)));
                    }
                    if ('serviceWorker' in navigator) {
                      const regs = await navigator.serviceWorker.getRegistrations();
                      await Promise.all(regs.map((r) => r.unregister()));
                    }
                  } catch (e) {
                    console.error('[ForceUpdate] Error:', e);
                  } finally {
                    window.location.reload();
                  }
                }}
                title="Limpa cache do app e recarrega"
              >
                ↻ Atualizar app
              </Button>
              <Button onClick={() => setShowUpload((v) => !v)}>
                <Plus className="h-4 w-4 mr-2" />
                {showUpload ? "Fechar upload" : "Adicionar em lote"}
              </Button>
            </div>
          }
        />

        {showUpload && (
          <Card className="p-4">
            <ReelsBatchUpload onUploaded={() => { load(); }} />
          </Card>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              <SelectItem value="execucao">Execução</SelectItem>
              <SelectItem value="dica">Dica</SelectItem>
              <SelectItem value="explicativo">Explicativo</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos status</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="inactive">Desativados</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
                <SelectItem key={k} value={k}>{SORT_LABEL[k]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filtered.length > 0 && (
            <div className="flex gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="default"
                onClick={toggleSelectAll}
                title="Seleciona apenas o que está visível abaixo"
              >
                <CheckSquare className="h-4 w-4 mr-2" />
                {allSelected ? "Desmarcar página" : "Selecionar página"}
              </Button>
              {total > filtered.length && (
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  onClick={selectAllGlobal}
                  disabled={bulkBusy === "selectAll"}
                  title="Seleciona todos os vídeos que correspondem aos filtros atuais"
                >
                  {bulkBusy === "selectAll" ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckSquare className="h-4 w-4 mr-2" />
                  )}
                  Selecionar todos os {total}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Contador */}
        {!loading && total > 0 && (
          <p className="text-xs text-muted-foreground">
            Mostrando <span className="font-medium text-foreground">{reels.length}</span> de{" "}
            <span className="font-medium text-foreground">{total}</span> vídeo(s)
          </p>
        )}

        {/* Barra de ações em lote */}
        {someSelected && (
          <Card className="p-3 border-primary/40 bg-primary/5 sticky top-2 z-20">
            <div className="flex flex-wrap items-center gap-2 justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="default">{selectedIds.size} selecionado(s)</Badge>
                <Button variant="ghost" size="sm" onClick={clearSelection} className="h-7 text-xs">
                  <X className="h-3 w-3 mr-1" /> Limpar
                </Button>
                {bulkBusy && bulkProgress.total > 0 && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {bulkProgress.current} de {bulkProgress.total}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!!bulkBusy}
                  onClick={handleBulkRewriteAi}
                  className="h-8 text-xs"
                >
                  {bulkBusy === "ai" ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3 mr-1" />
                  )}
                  Reescrever com IA
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!!bulkBusy}
                  onClick={handleBulkGenerateDescAi}
                  className="h-8 text-xs"
                >
                  {bulkBusy === "desc" ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <FileText className="h-3 w-3 mr-1" />
                  )}
                  Gerar descrição
                </Button>
                <Popover open={musclesPopoverOpen} onOpenChange={setMusclesPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button size="sm" variant="outline" disabled={!!bulkBusy} className="h-8 text-xs">
                      {bulkBusy === "muscles" ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Dumbbell className="h-3 w-3 mr-1" />
                      )}
                      Grupos musculares
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[320px] space-y-3" align="end">
                    <div className="space-y-1">
                      <p className="text-xs font-medium">Modo</p>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant={bulkMusclesMode === "append" ? "default" : "outline"}
                          size="sm"
                          className="h-7 text-xs flex-1"
                          onClick={() => setBulkMusclesMode("append")}
                        >
                          Adicionar
                        </Button>
                        <Button
                          type="button"
                          variant={bulkMusclesMode === "replace" ? "default" : "outline"}
                          size="sm"
                          className="h-7 text-xs flex-1"
                          onClick={() => setBulkMusclesMode("replace")}
                        >
                          Substituir
                        </Button>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {bulkMusclesMode === "append"
                          ? "Adiciona aos grupos já existentes (sem duplicar)"
                          : "Sobrescreve os grupos atuais"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium">Grupos</p>
                      <MuscleGroupMultiSelect
                        value={bulkMuscles}
                        onChange={setBulkMuscles}
                        muscleGroups={[...MUSCLE_GROUPS]}
                        placeholder="Selecione..."
                        className="w-full"
                        compact
                      />
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      className="w-full h-8 text-xs"
                      onClick={handleBulkSetMuscles}
                      disabled={!!bulkBusy || (bulkMusclesMode === "append" && !bulkMuscles.length)}
                    >
                      Aplicar a {selectedIds.size} vídeo(s)
                    </Button>
                  </PopoverContent>
                </Popover>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!!bulkBusy}
                  onClick={() => handleBulkTogglePublish(true)}
                  className="h-8 text-xs"
                >
                  {bulkBusy === "publish" ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <Eye className="h-3 w-3 mr-1" />
                  )}
                  Ativar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!!bulkBusy}
                  onClick={() => handleBulkTogglePublish(false)}
                  className="h-8 text-xs"
                >
                  {bulkBusy === "unpublish" ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <EyeOff className="h-3 w-3 mr-1" />
                  )}
                  Desativar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={!!bulkBusy}
                  onClick={() => setConfirmBulkDelete(true)}
                  className="h-8 text-xs"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Excluir
                </Button>
              </div>
            </div>
          </Card>
        )}

        {loadError && (
          <Card className="p-4 border-destructive/50 bg-destructive/5">
            <p className="text-sm text-destructive">{loadError}</p>
          </Card>
        )}

        {loading ? (
          <p className="text-center text-muted-foreground py-8">Carregando…</p>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center">
            <Film className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              {reels.length === 0 ? "Nenhum reel cadastrado ainda." : "Nenhum reel encontrado."}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filtered.map((reel) => {
              const groups =
                reel.muscle_groups && reel.muscle_groups.length
                  ? reel.muscle_groups
                  : reel.muscle_group
                  ? [reel.muscle_group]
                  : [];
              const isSelected = selectedIds.has(reel.id);
              return (
                <Card
                  key={reel.id}
                  className={`overflow-hidden group ${isSelected ? "ring-2 ring-primary" : ""}`}
                >
                  <div className="relative aspect-[9/16] bg-muted">
                    {reel.thumbnail_url ? (
                      <img
                        src={reel.thumbnail_url}
                        alt={reel.title}
                        className="absolute inset-0 w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <video
                        src={reel.video_url}
                        className="absolute inset-0 w-full h-full object-cover"
                        muted
                        playsInline
                        preload="metadata"
                      />
                    )}

                    {/* Checkbox de seleção — sempre visível */}
                    <div
                      className="absolute top-1 right-1 z-10 bg-background/85 backdrop-blur-sm rounded-md p-1 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelect(reel.id);
                      }}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelect(reel.id)}
                        aria-label="Selecionar vídeo"
                      />
                    </div>

                    <div className="absolute top-1 left-1 flex flex-col gap-1">
                      <Badge variant="secondary" className="text-[10px]">
                        {CATEGORY_LABEL[reel.category] ?? reel.category}
                      </Badge>
                      {!reel.is_published && (
                        <Badge variant="outline" className="text-[10px] bg-background/80">Desativado</Badge>
                      )}
                    </div>
                  </div>
                  <div className="p-2 space-y-1.5">
                    <p className="text-xs font-medium line-clamp-2">{reel.title}</p>
                    {groups.length > 0 && (
                      <p className="text-[10px] text-muted-foreground line-clamp-1">
                        {groups.join(" • ")}
                      </p>
                    )}
                    {/* Toolbar sempre visível — mobile e desktop */}
                    <div className="grid grid-cols-4 gap-1 pt-1">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => openEdit(reel)}
                        className="h-7 w-full"
                        title="Editar"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => handleSingleAi(reel)}
                        disabled={singleAiId === reel.id}
                        className="h-7 w-full"
                        title="Reescrever com IA"
                      >
                        {singleAiId === reel.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => togglePublish(reel)}
                        className="h-7 w-full"
                        title={reel.is_published ? "Desativar" : "Ativar"}
                      >
                        {reel.is_published ? (
                          <EyeOff className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => setDeleteId(reel.id)}
                        className="h-7 w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                        title="Excluir"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Infinite scroll sentinel + load all shortcut */}
        {!loading && reels.length > 0 && reels.length < total && (
          <>
            <div ref={sentinelRef} aria-hidden="true" className="h-1 w-full" />
            <div className="flex flex-wrap items-center justify-center gap-3 py-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {loadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Carregando mais {Math.min(PAGE_SIZE, total - reels.length)}…</span>
                  </>
                ) : (
                  <span>Role para carregar mais ({total - reels.length} restantes)</span>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={loadAll}
                disabled={loadingMore}
                className="text-xs"
              >
                Carregar todos os restantes ({total - reels.length})
              </Button>
            </div>
          </>
        )}
        {!loading && reels.length > 0 && reels.length >= total && total > PAGE_SIZE && (
          <p className="text-center text-xs text-muted-foreground py-3">
            Todos os {total} vídeos carregados
          </p>
        )}
      </div>

      <EditReelModal
        reel={editingReel}
        videoUrl={editingReelUrl ?? undefined}
        open={!!editingReel}
        onOpenChange={(open) => {
          if (!open) {
            setEditingReel(null);
            setEditingReelUrl(null);
          }
        }}
        onSaved={() => {
          setEditingReel(null);
          setEditingReelUrl(null);
          load();
        }}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir reel?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O vídeo e o arquivo serão removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmBulkDelete} onOpenChange={setConfirmBulkDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {selectedIds.size} vídeo(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todos os vídeos selecionados e seus arquivos
              serão removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir tudo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ClientLayout>
  );
}
