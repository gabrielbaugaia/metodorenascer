import { useEffect, useMemo, useRef, useState } from "react";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Volume2, VolumeX, Film, Search, Info, ChevronLeft, ChevronRight, X, Play } from "lucide-react";

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
}

const CATEGORY_LABEL: Record<string, string> = {
  execucao: "Execução",
  dica: "Dica",
  explicativo: "Explicativo",
};

function getGroups(r: Reel): string[] {
  if (r.muscle_groups && r.muscle_groups.length) return r.muscle_groups;
  if (r.muscle_group) return [r.muscle_group];
  return [];
}

export default function Reels() {
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterMuscle, setFilterMuscle] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [muted, setMuted] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("reels_videos")
        .select("id, title, description, show_description, category, muscle_group, muscle_groups, video_url, thumbnail_url")
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      setReels((data ?? []) as Reel[]);
      setLoading(false);
    };
    load();
  }, []);

  const muscleOptions = useMemo(() => {
    const set = new Set<string>();
    reels.forEach((r) => getGroups(r).forEach((g) => set.add(g)));
    return Array.from(set).sort();
  }, [reels]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reels.filter((r) => {
      const c = filterCategory === "all" || r.category === filterCategory;
      const m = filterMuscle === "all" || getGroups(r).includes(filterMuscle);
      if (!c || !m) return false;
      if (!q) return true;
      const hay = [
        r.title,
        r.description ?? "",
        ...getGroups(r),
      ].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [reels, filterCategory, filterMuscle, search]);

  const resetFilters = () => {
    setFilterCategory("all");
    setFilterMuscle("all");
    setSearch("");
  };

  const selectedReel = selectedIndex !== null ? filtered[selectedIndex] : null;
  const goPrev = () => setSelectedIndex((i) => (i === null ? null : Math.max(0, i - 1)));
  const goNext = () => setSelectedIndex((i) => (i === null ? null : Math.min(filtered.length - 1, i + 1)));

  return (
    <ClientLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-display tracking-tight">Vídeos</h1>
            <p className="text-sm text-muted-foreground">Execuções, dicas e explicativos</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? "Ativar som" : "Silenciar"}
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
        </div>

        {/* Sticky filters */}
        <div className="sticky top-12 z-30 -mx-4 sm:mx-0 px-4 sm:px-0 py-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome, descrição ou grupo…"
                className="pl-8 h-9"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="execucao">Execução</SelectItem>
                <SelectItem value="dica">Dica</SelectItem>
                <SelectItem value="explicativo">Explicativo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {muscleOptions.length > 0 && (
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex items-center gap-1.5 pb-1.5">
                <Badge
                  variant={filterMuscle === "all" ? "default" : "outline"}
                  className="cursor-pointer shrink-0"
                  onClick={() => setFilterMuscle("all")}
                >
                  Todos
                </Badge>
                {muscleOptions.map((g) => (
                  <Badge
                    key={g}
                    variant={filterMuscle === g ? "default" : "outline"}
                    className="cursor-pointer shrink-0"
                    onClick={() => setFilterMuscle(g)}
                  >
                    {g}
                  </Badge>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          )}

          <p className="text-[11px] text-muted-foreground">
            {loading ? "Carregando…" : `${filtered.length} vídeo${filtered.length === 1 ? "" : "s"}`}
          </p>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground py-12">Carregando…</p>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center">
            <Film className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-3">Nenhum vídeo encontrado.</p>
            <Button variant="outline" size="sm" onClick={resetFilters}>
              Limpar filtros
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filtered.map((reel, idx) => (
              <ReelTile
                key={reel.id}
                reel={reel}
                muted={muted}
                onOpen={() => setSelectedIndex(idx)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen viewer */}
      <Dialog open={selectedReel !== null} onOpenChange={(o) => !o && setSelectedIndex(null)}>
        <DialogContent className="max-w-2xl p-0 bg-black border-0 sm:rounded-lg overflow-hidden [&>button]:hidden">
          <DialogTitle className="sr-only">{selectedReel?.title ?? "Vídeo"}</DialogTitle>
          {selectedReel && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setSelectedIndex(null)}
                className="absolute top-2 right-2 z-20 h-9 w-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>

              {selectedIndex !== null && selectedIndex > 0 && (
                <button
                  type="button"
                  onClick={goPrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                  aria-label="Anterior"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}
              {selectedIndex !== null && selectedIndex < filtered.length - 1 && (
                <button
                  type="button"
                  onClick={goNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                  aria-label="Próximo"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              )}

              <div className="relative bg-black flex items-center justify-center max-h-[80vh]">
                <video
                  key={selectedReel.id}
                  src={selectedReel.video_url}
                  poster={selectedReel.thumbnail_url ?? undefined}
                  className="max-h-[80vh] w-auto max-w-full"
                  controls
                  autoPlay
                  playsInline
                />
              </div>

              <div className="p-3 bg-background space-y-2">
                <div className="flex items-start gap-2">
                  <Badge variant="secondary" className="text-[10px] shrink-0 mt-0.5">
                    {CATEGORY_LABEL[selectedReel.category] ?? selectedReel.category}
                  </Badge>
                  <p className="text-sm font-medium flex-1">{selectedReel.title}</p>
                </div>
                {getGroups(selectedReel).length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {getGroups(selectedReel).map((g) => (
                      <Badge key={g} variant="outline" className="text-[10px]">{g}</Badge>
                    ))}
                  </div>
                )}
                {selectedReel.description && (
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                    {selectedReel.description}
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </ClientLayout>
  );
}

function ReelTile({ reel, muted, onOpen }: { reel: Reel; muted: boolean; onOpen: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [inView, setInView] = useState(false);
  const groups = getGroups(reel);
  const hasDescription = !!reel.description;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            obs.disconnect();
            break;
          }
        }
      },
      { rootMargin: "200px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted, inView]);

  return (
    <Card className="overflow-hidden">
      <div
        ref={containerRef}
        className="relative aspect-[9/16] bg-muted cursor-pointer group"
        onClick={onOpen}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onOpen()}
      >
        {inView ? (
          <video
            ref={videoRef}
            src={reel.video_url}
            poster={reel.thumbnail_url ?? undefined}
            className="absolute inset-0 w-full h-full object-cover"
            playsInline
            preload="metadata"
            muted={muted}
          />
        ) : reel.thumbnail_url ? (
          <img
            src={reel.thumbnail_url}
            alt={reel.title}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Film className="h-8 w-8 text-muted-foreground/40" />
          </div>
        )}

        <div className="absolute inset-0 flex items-center justify-center bg-background/10 group-hover:bg-background/20 transition-colors">
          <div className="h-11 w-11 rounded-full bg-background/85 backdrop-blur flex items-center justify-center">
            <Play className="h-5 w-5 text-foreground ml-0.5" fill="currentColor" />
          </div>
        </div>

        <Badge variant="secondary" className="absolute top-2 left-2 text-[10px]">
          {CATEGORY_LABEL[reel.category] ?? reel.category}
        </Badge>

        {hasDescription && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
            className="absolute top-2 right-2 h-7 w-7 rounded-full bg-background/80 backdrop-blur flex items-center justify-center hover:bg-background"
            aria-label="Ver descrição"
          >
            <Info className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <div className="p-2">
        <p className="text-xs font-medium line-clamp-2 leading-tight">{reel.title}</p>
        {groups.length > 0 && (
          <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
            {groups.join(" • ")}
          </p>
        )}
      </div>
    </Card>
  );
}
