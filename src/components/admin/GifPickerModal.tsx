import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Loader2, ImageOff, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ExerciseGif {
  id: string;
  exercise_name_pt: string;
  gif_url: string | null;
  muscle_group: string | null;
}

interface GifPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSearchTerm?: string;
  onSelect: (gifUrl: string, exerciseName: string) => void;
}

const MUSCLE_GROUPS = [
  "Todos",
  "Peito",
  "Costas",
  "Ombros",
  "Bíceps",
  "Tríceps",
  "Quadríceps",
  "Posterior de Coxa",
  "Glúteos",
  "Panturrilha",
  "Abdômen",
  "Core",
  "Corpo Inteiro",
  "Cardio",
  "Alongamento",
  "Mobilidade",
  "Trapézios",
];

const ITEMS_PER_PAGE = 20;

export function GifPickerModal({
  open,
  onOpenChange,
  initialSearchTerm = "",
  onSelect,
}: GifPickerModalProps) {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [muscleGroup, setMuscleGroup] = useState("Todos");
  const [gifs, setGifs] = useState<ExerciseGif[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setSearchTerm(initialSearchTerm);
      setMuscleGroup("Todos");
      setPage(0);
    }
  }, [open, initialSearchTerm]);

  // Debounced search
  const fetchGifs = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("exercise_gifs")
        .select("id, exercise_name_pt, gif_url, muscle_group", { count: "exact" })
        .eq("status", "active")
        .not("gif_url", "is", null);

      if (searchTerm.trim()) {
        query = query.ilike("exercise_name_pt", `%${searchTerm.trim()}%`);
      }

      if (muscleGroup !== "Todos") {
        query = query.eq("muscle_group", muscleGroup);
      }

      query = query
        .order("exercise_name_pt")
        .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      setGifs(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error("Error fetching GIFs:", error);
      setGifs([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, muscleGroup, page]);

  useEffect(() => {
    if (!open) return;
    
    const timeoutId = setTimeout(() => {
      fetchGifs();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [fetchGifs, open]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [searchTerm, muscleGroup]);

  const handleSelect = (gif: ExerciseGif) => {
    if (gif.gif_url) {
      onSelect(gif.gif_url, gif.exercise_name_pt);
      onOpenChange(false);
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Buscar GIF para Exercício
          </DialogTitle>
        </DialogHeader>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="gif-search">Buscar por nome</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="gif-search"
                placeholder="Ex: supino, agachamento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Grupo muscular</Label>
            <Select value={muscleGroup} onValueChange={setMuscleGroup}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {MUSCLE_GROUPS.map((group) => (
                  <SelectItem key={group} value={group}>
                    {group}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results count */}
        <div className="text-sm text-muted-foreground">
          {loading ? (
            "Buscando..."
          ) : (
            <>
              {totalCount} resultado{totalCount !== 1 ? "s" : ""} encontrado
              {totalCount !== 1 ? "s" : ""}
            </>
          )}
        </div>

        {/* Results grid */}
        <ScrollArea className="flex-1 min-h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center h-[300px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : gifs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
              <ImageOff className="h-12 w-12 mb-4" />
              <p>Nenhum GIF encontrado</p>
              <p className="text-sm">Tente ajustar os filtros de busca</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-1">
              {gifs.map((gif) => (
                <button
                  key={gif.id}
                  onClick={() => handleSelect(gif)}
                  className="group flex flex-col items-center p-2 rounded-lg border border-border bg-card hover:border-primary hover:bg-accent transition-colors cursor-pointer"
                >
                  <div className="relative w-full aspect-square rounded-md overflow-hidden bg-muted mb-2">
                    <img
                      src={gif.gif_url || ""}
                      alt={gif.exercise_name_pt}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      loading="lazy"
                    />
                  </div>
                  <span className="text-xs text-center font-medium line-clamp-2 group-hover:text-primary transition-colors">
                    {gif.exercise_name_pt}
                  </span>
                  {gif.muscle_group && (
                    <span className="text-[10px] text-muted-foreground mt-1">
                      {gif.muscle_group}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || loading}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              Página {page + 1} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1 || loading}
            >
              Próximo
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
