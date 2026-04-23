import { useEffect, useState } from "react";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ReelsBatchUpload } from "@/components/admin/ReelsBatchUpload";
import { EditReelModal, EditableReel } from "@/components/admin/EditReelModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, Eye, EyeOff, Search, Plus, Film, Pencil } from "lucide-react";
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
const PAGE_SIZE = 50;

function readStoredSort(): SortKey {
  try {
    const raw = localStorage.getItem(SORT_STORAGE_KEY);
    if (raw && raw in SORT_LABEL) return raw as SortKey;
  } catch { /* noop */ }
  return "created_desc";
}

export default function AdminReels() {
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>(readStoredSort);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingReel, setEditingReel] = useState<EditableReel | null>(null);

  // Persiste critério de ordenação independente dos filtros
  useEffect(() => {
    try { localStorage.setItem(SORT_STORAGE_KEY, sortKey); } catch { /* noop */ }
  }, [sortKey]);

  const load = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      let query = supabase
        .from("reels_videos")
        .select(
          "id, title, description, show_description, category, muscle_group, muscle_groups, video_url, thumbnail_url, is_published, created_at, duration_seconds, audio_removed"
        );

      // Filtros server-side
      if (search.trim()) {
        // ilike escape: % e _ tratados como literais
        const safe = search.trim().replace(/[%_]/g, (c) => `\\${c}`);
        query = query.ilike("title", `%${safe}%`);
      }
      if (filterCategory !== "all") {
        query = query.eq("category", filterCategory);
      }
      if (filterStatus !== "all") {
        query = query.eq("is_published", filterStatus === "active");
      }

      // Ordenação
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

      const { data, error } = await query.range(0, PAGE_SIZE - 1);
      if (error) {
        // RLS / permissão -> mensagem clara
        const isPermission = /permission|rls|denied|policy/i.test(error.message);
        setLoadError(isPermission ? "Sem permissão para listar reels." : "Erro ao carregar reels");
        if (!isPermission) toast.error("Erro ao carregar reels");
        setReels([]);
      } else {
        setReels((data ?? []) as Reel[]);
      }
    } catch (err) {
      console.error("load reels err", err);
      setLoadError("Erro inesperado ao carregar reels");
      setReels([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filterCategory, filterStatus, sortKey]);

  // filtros já aplicados na query — usamos resultado direto
  const filtered = reels;

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

    // Try to remove storage object too (best-effort)
    if (target?.video_url) {
      try {
        const url = new URL(target.video_url);
        // Path inside the bucket comes after /reels-videos/
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
  };

  return (
    <ClientLayout>
      <div className="space-y-6">
        <PageHeader
          title="Reels"
          subtitle="Vídeos curtos verticais para os alunos (execuções, dicas, explicativos)"
          actions={
            <Button onClick={() => setShowUpload((v) => !v)}>
              <Plus className="h-4 w-4 mr-2" />
              {showUpload ? "Fechar upload" : "Adicionar em lote"}
            </Button>
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
        </div>

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
              return (
                <Card key={reel.id} className="overflow-hidden group">
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
                    <div className="absolute top-1 left-1 flex flex-col gap-1">
                      <Badge variant="secondary" className="text-[10px]">
                        {CATEGORY_LABEL[reel.category] ?? reel.category}
                      </Badge>
                      {!reel.is_published && (
                        <Badge variant="outline" className="text-[10px] bg-background/80">Desativado</Badge>
                      )}
                    </div>
                    <div className="absolute inset-0 bg-background/90 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(reel)} className="w-full">
                        <Pencil className="h-3 w-3 mr-1" /> Editar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => togglePublish(reel)} className="w-full">
                        {reel.is_published ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                        {reel.is_published ? "Desativar" : "Ativar"}
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => setDeleteId(reel.id)} className="w-full">
                        <Trash2 className="h-3 w-3 mr-1" /> Excluir
                      </Button>
                    </div>
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-medium line-clamp-2">{reel.title}</p>
                    {groups.length > 0 && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                        {groups.join(" • ")}
                      </p>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <EditReelModal
        reel={editingReel}
        open={!!editingReel}
        onOpenChange={(open) => !open && setEditingReel(null)}
        onSaved={() => {
          setEditingReel(null);
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
    </ClientLayout>
  );
}
