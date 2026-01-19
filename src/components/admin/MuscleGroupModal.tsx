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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { CheckCircle, Clock, XCircle, Filter, X, Expand } from "lucide-react";

interface ExerciseGif {
  id: string;
  exercise_name_pt: string;
  exercise_name_en: string;
  gif_url: string | null;
  muscle_group: string;
  status: "active" | "pending" | "missing";
}

interface MuscleGroupModalProps {
  group: string;
  gifs: ExerciseGif[];
  open: boolean;
  onClose: () => void;
  onFilterList: (group: string, status?: string) => void;
}

export function MuscleGroupModal({
  group,
  gifs,
  open,
  onClose,
  onFilterList,
}: MuscleGroupModalProps) {
  const isMobile = useIsMobile();
  const [expandedGif, setExpandedGif] = useState<string | null>(null);

  const groupGifs = useMemo(() => {
    return gifs.filter((g) => g.muscle_group === group);
  }, [gifs, group]);

  const activeGifs = useMemo(() => groupGifs.filter((g) => g.status === "active"), [groupGifs]);
  const pendingGifs = useMemo(() => groupGifs.filter((g) => g.status === "pending"), [groupGifs]);
  const missingGifs = useMemo(() => groupGifs.filter((g) => g.status === "missing"), [groupGifs]);

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
        {items.map((gif) => (
          <div
            key={gif.id}
            className="relative group rounded-lg border bg-card overflow-hidden hover:border-primary/50 transition-colors"
          >
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
                <button
                  onClick={() => setExpandedGif(expandedGif === gif.id ? null : gif.id)}
                  className="absolute top-1 right-1 p-1 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Expand className="h-3 w-3 text-white" />
                </button>
              </div>
            ) : (
              <div className="aspect-square bg-muted flex items-center justify-center">
                <XCircle className="h-8 w-8 text-muted-foreground/50" />
              </div>
            )}
            <div className="p-2">
              <p className="text-xs font-medium truncate" title={gif.exercise_name_pt}>
                {gif.exercise_name_pt}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const content = (
    <div className="flex flex-col h-full">
      <Tabs defaultValue="active" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3 mb-4">
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

        <ScrollArea className="flex-1 pr-4">
          <TabsContent value="active" className="mt-0">
            <GifGrid items={activeGifs} emptyMessage="Nenhum GIF ativo neste grupo" />
          </TabsContent>
          <TabsContent value="pending" className="mt-0">
            <GifGrid items={pendingGifs} emptyMessage="Nenhum GIF pendente neste grupo" />
          </TabsContent>
          <TabsContent value="missing" className="mt-0">
            <GifGrid items={missingGifs} emptyMessage="Nenhum GIF faltando neste grupo" />
          </TabsContent>
        </ScrollArea>
      </Tabs>

      <div className="flex flex-col sm:flex-row gap-2 mt-4 pt-4 border-t">
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
        <div className="flex-1 overflow-hidden">
          {content}
        </div>
      </DialogContent>
    </Dialog>
  );
}
