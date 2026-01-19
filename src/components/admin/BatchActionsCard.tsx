import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Badge } from "@/components/ui/badge";
import {
  Wand2,
  AlertTriangle,
  Zap,
  CheckCircle,
  Link2Off,
  RefreshCw,
} from "lucide-react";

interface BatchActionsCardProps {
  // Counts
  pendingNamesCount: number;
  externalUrlsCount: number;
  readyToActivateCount: number;
  brokenUrlsCount: number;
  
  // States
  batchRenaming: boolean;
  batchRenameProgress: { current: number; total: number };
  checkingUrls: boolean;
  checkingUrlsProgress: { current: number; total: number };
  
  // Handlers
  onStartBatchRename: () => void;
  onCheckBrokenUrls: () => void;
  onActivateReady: () => void;
  activatingAll: boolean;
}

export function BatchActionsCard({
  pendingNamesCount,
  externalUrlsCount,
  readyToActivateCount,
  brokenUrlsCount,
  batchRenaming,
  batchRenameProgress,
  checkingUrls,
  checkingUrlsProgress,
  onStartBatchRename,
  onCheckBrokenUrls,
  onActivateReady,
  activatingAll,
}: BatchActionsCardProps) {
  return (
    <Card className="mb-6 border-amber-500/30 bg-amber-500/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-amber-700">
          <Wand2 className="h-5 w-5" />
          Ações em Lote com IA
        </CardTitle>
        <CardDescription>
          Automatize a renomeação de exercícios e detecção de URLs quebradas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Batch Rename Action */}
          <div className="p-4 rounded-lg border bg-card">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-medium text-sm flex items-center gap-1.5">
                  <Wand2 className="h-4 w-4 text-purple-500" />
                  Renomear com IA
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {pendingNamesCount} pendente(s)
                </p>
              </div>
              <Badge variant="outline" className="text-purple-600 border-purple-300">
                {pendingNamesCount}
              </Badge>
            </div>
            
            {batchRenaming ? (
              <div className="space-y-2">
                <Progress
                  value={batchRenameProgress.total > 0 
                    ? (batchRenameProgress.current / batchRenameProgress.total) * 100 
                    : 0
                  }
                  className="h-2"
                />
                <p className="text-xs text-center text-muted-foreground">
                  {batchRenameProgress.current}/{batchRenameProgress.total}
                </p>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
                onClick={onStartBatchRename}
                disabled={pendingNamesCount === 0}
              >
                Iniciar Renomeação
              </Button>
            )}
          </div>

          {/* Check Broken URLs Action */}
          <div className="p-4 rounded-lg border bg-card">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-medium text-sm flex items-center gap-1.5">
                  <Link2Off className="h-4 w-4 text-red-500" />
                  URLs Externas
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {externalUrlsCount} para verificar
                </p>
              </div>
              <Badge variant="outline" className="text-red-600 border-red-300">
                {brokenUrlsCount > 0 ? `${brokenUrlsCount} quebradas` : externalUrlsCount}
              </Badge>
            </div>
            
            {checkingUrls ? (
              <div className="space-y-2">
                <Progress
                  value={checkingUrlsProgress.total > 0 
                    ? (checkingUrlsProgress.current / checkingUrlsProgress.total) * 100 
                    : 0
                  }
                  className="h-2"
                />
                <p className="text-xs text-center text-muted-foreground">
                  {checkingUrlsProgress.current}/{checkingUrlsProgress.total}
                </p>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="w-full border-red-300 text-red-700 hover:bg-red-50"
                onClick={onCheckBrokenUrls}
                disabled={externalUrlsCount === 0}
              >
                Verificar Quebradas
              </Button>
            )}
          </div>

          {/* Activate Ready GIFs */}
          <div className="p-4 rounded-lg border bg-card">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-medium text-sm flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-green-500" />
                  Ativar Prontos
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  URL válida + nome + grupo
                </p>
              </div>
              <Badge variant="outline" className="text-green-600 border-green-300">
                {readyToActivateCount}
              </Badge>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              className="w-full border-green-300 text-green-700 hover:bg-green-50"
              onClick={onActivateReady}
              disabled={readyToActivateCount === 0 || activatingAll}
            >
              {activatingAll ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Ativar {readyToActivateCount}
            </Button>
          </div>

          {/* Info Card */}
          <div className="p-4 rounded-lg border bg-muted/30">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-sm">Como funciona</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  A IA analisa cada GIF e sugere o nome correto em português. 
                  URLs externas são verificadas e as quebradas podem ser desativadas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
