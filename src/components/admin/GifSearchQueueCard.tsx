import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { 
  ListTodo, 
  Play, 
  Trash2, 
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Globe
} from "lucide-react";

interface QueueStatus {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  total: number;
}

interface GifSearchQueueCardProps {
  pendingGifsCount: number;
  pendingGifIds: string[];
  onQueueUpdated: () => void;
}

export function GifSearchQueueCard({ 
  pendingGifsCount, 
  pendingGifIds,
  onQueueUpdated 
}: GifSearchQueueCardProps) {
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [enqueueing, setEnqueueing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [clearing, setClearing] = useState(false);

  // Subscribe to realtime updates
  useEffect(() => {
    fetchQueueStatus();

    const channel = supabase
      .channel('gif_search_queue_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gif_search_queue'
        },
        () => {
          fetchQueueStatus();
          // Refresh parent if a job completed
          onQueueUpdated();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchQueueStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("process-gif-queue", {
        body: { action: "status" }
      });
      
      if (error) {
        console.error("Error fetching queue status:", error);
        return;
      }
      
      setQueueStatus(data);
    } catch (error) {
      console.error("Error fetching queue status:", error);
    }
  };

  const handleEnqueueAll = async () => {
    if (pendingGifIds.length === 0) {
      toast.info("Nenhum exercício pendente para adicionar à fila");
      return;
    }

    setEnqueueing(true);
    try {
      const { data, error } = await supabase.functions.invoke("process-gif-queue", {
        body: { 
          action: "enqueue",
          exerciseIds: pendingGifIds
        }
      });
      
      if (error) throw error;
      
      if (data?.added > 0) {
        toast.success(`${data.added} exercício(s) adicionado(s) à fila`);
        if (data.skipped > 0) {
          toast.info(`${data.skipped} já estavam na fila`);
        }
      } else {
        toast.info(data?.message || "Nenhum exercício adicionado");
      }
      
      fetchQueueStatus();
    } catch (error) {
      console.error("Error enqueueing:", error);
      toast.error("Erro ao adicionar à fila");
    } finally {
      setEnqueueing(false);
    }
  };

  const handleProcessQueue = async () => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("process-gif-queue", {
        body: { 
          action: "process",
          batchSize: 5
        }
      });
      
      if (error) throw error;
      
      if (data?.processed > 0) {
        toast.success(`${data.results.success} GIF(s) encontrado(s), ${data.results.failed} falha(s)`);
        onQueueUpdated();
      } else {
        toast.info(data?.message || "Nenhum job pendente");
      }
      
      fetchQueueStatus();
    } catch (error) {
      console.error("Error processing queue:", error);
      toast.error("Erro ao processar fila");
    } finally {
      setProcessing(false);
    }
  };

  const handleClearQueue = async () => {
    setClearing(true);
    try {
      const { data, error } = await supabase.functions.invoke("process-gif-queue", {
        body: { action: "clear" }
      });
      
      if (error) throw error;
      
      toast.success("Fila limpa");
      fetchQueueStatus();
    } catch (error) {
      console.error("Error clearing queue:", error);
      toast.error("Erro ao limpar fila");
    } finally {
      setClearing(false);
    }
  };

  const hasActiveJobs = queueStatus && (queueStatus.pending > 0 || queueStatus.processing > 0);
  const hasCompletedJobs = queueStatus && (queueStatus.completed > 0 || queueStatus.failed > 0);

  return (
    <Card className="mb-6 border-blue-500/30 bg-blue-500/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <ListTodo className="h-5 w-5" />
              Fila de Busca em Segundo Plano
            </CardTitle>
            <CardDescription>
              Processe buscas de GIFs de forma assíncrona, sem timeout
            </CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={fetchQueueStatus}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Queue Status */}
        {queueStatus && queueStatus.total > 0 && (
          <div className="grid grid-cols-4 gap-3 text-center">
            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <div className="flex items-center justify-center gap-1 text-yellow-600 mb-1">
                <Clock className="h-4 w-4" />
              </div>
              <p className="text-xl font-bold text-yellow-600">{queueStatus.pending}</p>
              <p className="text-xs text-muted-foreground">Pendentes</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
              <p className="text-xl font-bold text-blue-600">{queueStatus.processing}</p>
              <p className="text-xs text-muted-foreground">Processando</p>
            </div>
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                <CheckCircle className="h-4 w-4" />
              </div>
              <p className="text-xl font-bold text-green-600">{queueStatus.completed}</p>
              <p className="text-xs text-muted-foreground">Concluídos</p>
            </div>
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="flex items-center justify-center gap-1 text-red-600 mb-1">
                <XCircle className="h-4 w-4" />
              </div>
              <p className="text-xl font-bold text-red-600">{queueStatus.failed}</p>
              <p className="text-xs text-muted-foreground">Falhas</p>
            </div>
          </div>
        )}

        {/* Progress bar for active jobs */}
        {hasActiveJobs && queueStatus && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progresso da fila</span>
              <span className="font-medium">
                {queueStatus.completed + queueStatus.failed} / {queueStatus.total}
              </span>
            </div>
            <Progress 
              value={((queueStatus.completed + queueStatus.failed) / queueStatus.total) * 100} 
              className="h-2"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleEnqueueAll}
            disabled={enqueueing || pendingGifsCount === 0}
            className="flex-1"
          >
            {enqueueing ? (
              <LoadingSpinner size="sm" className="mr-2" />
            ) : (
              <Globe className="h-4 w-4 mr-2" />
            )}
            Adicionar {pendingGifsCount} à Fila
          </Button>
          
          <Button
            onClick={handleProcessQueue}
            disabled={processing || !hasActiveJobs}
            variant="secondary"
            className="flex-1"
          >
            {processing ? (
              <LoadingSpinner size="sm" className="mr-2" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Processar (5)
          </Button>

          {hasCompletedJobs && (
            <Button
              onClick={handleClearQueue}
              disabled={clearing}
              variant="outline"
              size="icon"
            >
              {clearing ? (
                <LoadingSpinner size="sm" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>

        {/* Help text */}
        <p className="text-xs text-muted-foreground">
          💡 Adicione exercícios à fila e processe em lotes de 5. O sistema busca GIFs automaticamente 
          via Firecrawl, valida com IA e salva no Storage. Ideal para grandes quantidades.
        </p>
      </CardContent>
    </Card>
  );
}
