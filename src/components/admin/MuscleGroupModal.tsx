import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { MuscleGroupMultiSelect } from "./MuscleGroupMultiSelect";
import { GifPickerModal } from "./GifPickerModal";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  Filter, 
  X, 
  Expand,
  Pencil,
  Trash2,
  Save,
  Check,
  RefreshCw
} from "lucide-react";

interface ExerciseGif {
  id: string;
  exercise_name_pt: string;
  exercise_name_en: string;
  gif_url: string | null;
  muscle_group: string[];
  status: "active" | "pending" | "missing";
}

interface MuscleGroupModalProps {
  group: string;
  gifs: ExerciseGif[];
  open: boolean;
  onClose: () => void;
  onFilterList: (group: string, status?: string) => void;
  onRefresh?: () => void;
  muscleGroups?: string[];
}

export function MuscleGroupModal({
  group,
  gifs,
  open,
  onClose,
  onFilterList,
  onRefresh,
  muscleGroups = [],
}: MuscleGroupModalProps) {
  const isMobile = useIsMobile();
  const [expandedGif, setExpandedGif] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editGroups, setEditGroups] = useState<string[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [changingGifFor, setChangingGifFor] = useState<ExerciseGif | null>(null);

  const groupGifs = useMemo(() => {
    return gifs.filter((g) => g.muscle_group.includes(group));
  }, [gifs, group]);

  const activeGifs = useMemo(() => groupGifs.filter((g) => g.status === "active"), [groupGifs]);
  const pendingGifs = useMemo(() => groupGifs.filter((g) => g.status === "pending"), [groupGifs]);
  const missingGifs = useMemo(() => groupGifs.filter((g) => g.status === "missing"), [groupGifs]);

  const startEditing = (gif: ExerciseGif) => {
    setEditingId(gif.id);
    setEditName(gif.exercise_name_pt);
    setEditGroups(gif.muscle_group || []);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditName("");
    setEditGroups([]);
  };

  const handleSave = async (id: string) => {
    setSaving(id);
    try {
      const { error } = await supabase
        .from("exercise_gifs")
        .update({
          exercise_name_pt: editName.trim(),
          muscle_group: editGroups,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Exercício atualizado!");
      cancelEditing();
      onRefresh?.();
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar alterações");
    } finally {
      setSaving(null);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase
        .from("exercise_gifs")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Exercício excluído!");
      onRefresh?.();
    } catch (error) {
      console.error("Erro ao excluir:", error);
      toast.error("Erro ao excluir exercício");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSwapGif = async (gifUrl: string, exerciseName: string) => {
    if (!changingGifFor) return;
    
    setSaving(changingGifFor.id);
    try {
      const { error } = await supabase
        .from("exercise_gifs")
        .update({
          gif_url: gifUrl,
          status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", changingGifFor.id);

      if (error) throw error;

      toast.success("GIF trocado com sucesso!");
      setChangingGifFor(null);
      onRefresh?.();
    } catch (error) {
      console.error("Erro ao trocar GIF:", error);
      toast.error("Erro ao trocar GIF");
    } finally {
      setSaving(null);
    }
  };

  const handleActivate = async (gif: ExerciseGif) => {
    if (!gif.gif_url) {
      toast.error("GIF não possui URL válida");
      return;
    }

    setSaving(gif.id);
    try {
      const { error } = await supabase
        .from("exercise_gifs")
        .update({
          status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", gif.id);

      if (error) throw error;

      toast.success("Exercício ativado!");
      onRefresh?.();
    } catch (error) {
      console.error("Erro ao ativar:", error);
      toast.error("Erro ao ativar exercício");
    } finally {
      setSaving(null);
    }
  };

  const GifGrid = ({ items, emptyMessage }: { items: ExerciseGif[]; emptyMessage: string }) => {
    if (items.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          {emptyMessage}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.map((gif) => {
          const isEditing = editingId === gif.id;
          const isSaving = saving === gif.id;
          const isDeleting = deletingId === gif.id;
          const canActivate = gif.status === "pending" && gif.gif_url;

          return (
            <div
              key={gif.id}
              className={`relative group rounded-lg border bg-card overflow-hidden transition-all ${
                isEditing ? "ring-2 ring-primary" : "hover:border-primary/50"
              }`}
            >
              {/* GIF Preview */}
              {gif.gif_url ? (
                <div className="aspect-square relative">
                  <img
                    src={gif.gif_url}
                    alt={gif.exercise_name_pt}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg";
                    }}
                  />
                  {/* Action buttons overlay - always visible on mobile */}
                  {!isEditing && (
                    <div className="absolute top-1 right-1 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setExpandedGif(gif.id)}
                        className="p-2 bg-black/70 rounded-full hover:bg-black/90 touch-manipulation"
                        title="Expandir"
                      >
                        <Expand className="h-4 w-4 text-white" />
                      </button>
                      <button
                        onClick={() => startEditing(gif)}
                        className="p-2 bg-black/70 rounded-full hover:bg-black/90 touch-manipulation"
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4 text-white" />
                      </button>
                      <button
                        onClick={() => setChangingGifFor(gif)}
                        className="p-2 bg-primary/80 rounded-full hover:bg-primary touch-manipulation"
                        title="Trocar GIF"
                      >
                        <RefreshCw className="h-4 w-4 text-white" />
                      </button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            className="p-2 bg-destructive/80 rounded-full hover:bg-destructive touch-manipulation"
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4 text-white" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir exercício?</AlertDialogTitle>
                            <AlertDialogDescription>
                              "{gif.exercise_name_pt}" será permanentemente removido.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(gif.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {isDeleting ? <LoadingSpinner size="sm" /> : "Excluir"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                  {/* Activate button for pending */}
                  {canActivate && !isEditing && (
                    <button
                      onClick={() => handleActivate(gif)}
                      className="absolute bottom-1 right-1 p-2 bg-green-600/80 rounded-full hover:bg-green-600 touch-manipulation"
                      title="Ativar"
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <LoadingSpinner size="sm" className="text-white" />
                      ) : (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </button>
                  )}
                </div>
              ) : (
                <div className="aspect-square bg-muted flex items-center justify-center">
                  <XCircle className="h-8 w-8 text-muted-foreground/50" />
                </div>
              )}

              {/* Content area */}
              <div className="p-2 space-y-2">
                {isEditing ? (
                  <>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Nome do exercício"
                      className="h-8 text-xs"
                    />
                    <MuscleGroupMultiSelect
                      value={editGroups}
                      onChange={setEditGroups}
                      muscleGroups={muscleGroups}
                      compact
                      className="w-full h-8 text-xs"
                    />
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        className="flex-1 h-7 text-xs"
                        onClick={() => handleSave(gif.id)}
                        disabled={isSaving}
                      >
                        {isSaving ? <LoadingSpinner size="sm" /> : <Save className="h-3 w-3 mr-1" />}
                        Salvar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        onClick={cancelEditing}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <p className="text-xs font-medium truncate" title={gif.exercise_name_pt}>
                    {gif.exercise_name_pt}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const content = (
    <div className="flex flex-col h-full overflow-hidden">
      <Tabs defaultValue="active" className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <TabsList className="grid w-full grid-cols-3 mb-4 flex-shrink-0">
          <TabsTrigger value="active" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            <span className="hidden sm:inline">Ativos</span>
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
              {activeGifs.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span className="hidden sm:inline">Pendentes</span>
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
              {pendingGifs.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="missing" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            <span className="hidden sm:inline">Faltando</span>
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
              {missingGifs.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 min-h-0 overflow-hidden">
          <ScrollArea className="h-full pr-4">
            <TabsContent value="active" className="mt-0 data-[state=inactive]:hidden">
              <GifGrid items={activeGifs} emptyMessage="Nenhum GIF ativo neste grupo" />
            </TabsContent>
            <TabsContent value="pending" className="mt-0 data-[state=inactive]:hidden">
              <GifGrid items={pendingGifs} emptyMessage="Nenhum GIF pendente neste grupo" />
            </TabsContent>
            <TabsContent value="missing" className="mt-0 data-[state=inactive]:hidden">
              <GifGrid items={missingGifs} emptyMessage="Nenhum GIF faltando neste grupo" />
            </TabsContent>
          </ScrollArea>
        </div>
      </Tabs>

      <div className="flex flex-col sm:flex-row gap-2 mt-4 pt-4 border-t flex-shrink-0">
        <Button
          variant="outline"
          onClick={() => {
            onFilterList(group);
            onClose();
          }}
          className="flex-1"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filtrar na Lista Principal
        </Button>
        <Button variant="ghost" onClick={onClose}>
          <X className="h-4 w-4 mr-2" />
          Fechar
        </Button>
      </div>

      {/* Expanded GIF Preview */}
      {expandedGif && (
        <Dialog open={!!expandedGif} onOpenChange={() => setExpandedGif(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {groupGifs.find((g) => g.id === expandedGif)?.exercise_name_pt}
              </DialogTitle>
            </DialogHeader>
            <div className="flex justify-center">
              <img
                src={groupGifs.find((g) => g.id === expandedGif)?.gif_url || ""}
                alt="Preview"
                className="max-h-[60vh] object-contain rounded-lg"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* GIF Picker Modal for swapping */}
      <GifPickerModal
        open={!!changingGifFor}
        onOpenChange={(open) => !open && setChangingGifFor(null)}
        initialSearchTerm={changingGifFor?.exercise_name_pt || ""}
        onSelect={handleSwapGif}
      />
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onClose}>
        <DrawerContent className="h-[90vh] flex flex-col">
          <DrawerHeader className="pb-2 flex-shrink-0">
            <DrawerTitle className="flex items-center gap-2">
              {group}
              <Badge variant="outline">{groupGifs.length} exercícios</Badge>
            </DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-hidden px-4 pb-4 min-h-0">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[85vh] !grid grid-rows-[auto_1fr] overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            GIFs de {group}
            <Badge variant="outline">{groupGifs.length} exercícios</Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="overflow-hidden min-h-0">
          {content}
        </div>
      </DialogContent>
    </Dialog>
  );
}
