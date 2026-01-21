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
  Check
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
                  {/* Action buttons overlay */}
                  {!isEditing && (
                    <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setExpandedGif(gif.id)}
                        className="p-1.5 bg-black/60 rounded-full hover:bg-black/80"
                        title="Expandir"
                      >
                        <Expand className="h-3 w-3 text-white" />
                      </button>
                      <button
                        onClick={() => startEditing(gif)}
                        className="p-1.5 bg-black/60 rounded-full hover:bg-black/80"
                        title="Editar"
                      >
                        <Pencil className="h-3 w-3 text-white" />
                      </button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            className="p-1.5 bg-destructive/80 rounded-full hover:bg-destructive"
                            title="Excluir"
                          >
                            <Trash2 className="h-3 w-3 text-white" />
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
                      className="absolute bottom-1 right-1 p-1.5 bg-green-600/80 rounded-full hover:bg-green-600 opacity-0 group-hover:opacity-100 transition-opacity"
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
    <div className="flex flex-col h-full">
      <Tabs defaultValue="active" className="flex-1 flex flex-col min-h-0">
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

        <ScrollArea className="flex-1 h-[50vh] pr-4">
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
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onClose}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="flex items-center gap-2">
              {group}
              <Badge variant="outline">{groupGifs.length} exercícios</Badge>
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-4 flex-1 overflow-hidden">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            GIFs de {group}
            <Badge variant="outline">{groupGifs.length} exercícios</Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden min-h-0">
          {content}
        </div>
      </DialogContent>
    </Dialog>
  );
}
