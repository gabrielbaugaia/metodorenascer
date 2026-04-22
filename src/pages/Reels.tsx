import { useEffect, useMemo, useRef, useState } from "react";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Volume2, VolumeX, Film } from "lucide-react";
import { cn } from "@/lib/utils";

interface Reel {
  id: string;
  title: string;
  description: string | null;
  show_description: boolean;
  category: string;
  muscle_group: string | null;
  video_url: string;
  thumbnail_url: string | null;
}

const CATEGORY_LABEL: Record<string, string> = {
  execucao: "Execução",
  dica: "Dica",
  explicativo: "Explicativo",
};

export default function Reels() {
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterMuscle, setFilterMuscle] = useState<string>("all");
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("reels_videos")
        .select("id, title, description, show_description, category, muscle_group, video_url, thumbnail_url")
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      setReels((data ?? []) as Reel[]);
      setLoading(false);
    };
    load();
  }, []);

  const muscleOptions = useMemo(() => {
    const set = new Set<string>();
    reels.forEach((r) => r.muscle_group && set.add(r.muscle_group));
    return Array.from(set).sort();
  }, [reels]);

  const filtered = reels.filter((r) => {
    const c = filterCategory === "all" || r.category === filterCategory;
    const m = filterMuscle === "all" || r.muscle_group === filterMuscle;
    return c && m;
  });

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

        <div className="flex flex-wrap gap-3">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              <SelectItem value="execucao">Execução</SelectItem>
              <SelectItem value="dica">Dica</SelectItem>
              <SelectItem value="explicativo">Explicativo</SelectItem>
            </SelectContent>
          </Select>
          {muscleOptions.length > 0 && (
            <Select value={filterMuscle} onValueChange={setFilterMuscle}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos grupos</SelectItem>
                {muscleOptions.map((g) => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground py-12">Carregando…</p>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center">
            <Film className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Nenhum vídeo disponível ainda.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map((reel) => (
              <ReelTile key={reel.id} reel={reel} muted={muted} />
            ))}
          </div>
        )}
      </div>
    </ClientLayout>
  );
}

function ReelTile({ reel, muted }: { reel: Reel; muted: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().then(() => setPlaying(true)).catch(() => {});
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-[9/16] bg-muted">
        <video
          ref={videoRef}
          src={reel.video_url}
          poster={reel.thumbnail_url ?? undefined}
          className="absolute inset-0 w-full h-full object-cover cursor-pointer"
          playsInline
          loop
          muted={muted}
          onClick={toggle}
        />
        {!playing && (
          <button
            type="button"
            onClick={toggle}
            className="absolute inset-0 flex items-center justify-center bg-background/20 hover:bg-background/30 transition-colors"
            aria-label="Reproduzir vídeo"
          >
            <div className="h-12 w-12 rounded-full bg-background/80 backdrop-blur flex items-center justify-center">
              <div className="w-0 h-0 ml-1 border-y-[8px] border-y-transparent border-l-[12px] border-l-foreground" />
            </div>
          </button>
        )}
        <Badge variant="secondary" className="absolute top-2 left-2 text-[10px]">
          {CATEGORY_LABEL[reel.category] ?? reel.category}
        </Badge>
        {reel.show_description && reel.description && (
          <div className="absolute left-0 right-0 bottom-0 bg-gradient-to-t from-background/95 to-transparent p-3">
            <p className="text-xs text-foreground line-clamp-3">{reel.description}</p>
          </div>
        )}
      </div>
      <div className="p-2">
        <p className="text-sm font-medium line-clamp-2">{reel.title}</p>
        {reel.muscle_group && (
          <p className="text-[11px] text-muted-foreground mt-0.5">{reel.muscle_group}</p>
        )}
      </div>
    </Card>
  );
}
