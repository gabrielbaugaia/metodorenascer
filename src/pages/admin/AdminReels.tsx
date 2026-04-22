import { useEffect, useState } from "react";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ReelsBatchUpload } from "@/components/admin/ReelsBatchUpload";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, Eye, EyeOff, Search, Plus, Film } from "lucide-react";
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

export default function AdminReels() {
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("reels_videos")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Erro ao carregar reels");
    } else {
      setReels((data ?? []) as Reel[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = reels.filter((r) => {
    const matchesSearch = !search || r.title.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filterCategory === "all" || r.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const togglePublish = async (reel: Reel) => {
    const { error } = await supabase
      .from("reels_videos")
      .update({ is_published: !reel.is_published })
      .eq("id", reel.id);
    if (error) {
      toast.error("Erro ao atualizar");
    } else {
      toast.success(reel.is_published ? "Despublicado" : "Publicado");
      load();
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("reels_videos").delete().eq("id", deleteId);
    if (error) {
      toast.error("Erro ao excluir");
    } else {
      toast.success("Excluído");
      setDeleteId(null);
      load();
    }
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
        </div>

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
            {filtered.map((reel) => (
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
                      <Badge variant="outline" className="text-[10px]">Oculto</Badge>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-background/90 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                    <Button size="sm" variant="outline" onClick={() => togglePublish(reel)} className="w-full">
                      {reel.is_published ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                      {reel.is_published ? "Ocultar" : "Publicar"}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => setDeleteId(reel.id)} className="w-full">
                      <Trash2 className="h-3 w-3 mr-1" /> Excluir
                    </Button>
                  </div>
                </div>
                <div className="p-2">
                  <p className="text-xs font-medium line-clamp-2">{reel.title}</p>
                  {reel.muscle_group && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">{reel.muscle_group}</p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir reel?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O vídeo será removido para os alunos.
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
