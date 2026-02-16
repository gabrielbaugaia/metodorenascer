import { Watch, Smartphone, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface HealthConnectTabProps {
  lastSync: { date: string; source: string } | null;
}

export function HealthConnectTab({ lastSync }: HealthConnectTabProps) {
  const sourceLabel = (s: string) => {
    if (s === "apple") return "Apple Watch";
    if (s === "google") return "Android Watch";
    return s;
  };

  return (
    <div className="space-y-6">
      {/* Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Watch className="h-5 w-5 text-primary" />
            Status da Sincronização
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lastSync ? (
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">
                  Última sincronização: {format(new Date(lastSync.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
                <p className="text-xs text-muted-foreground">Fonte: {sourceLabel(lastSync.source)}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              <p className="text-sm text-muted-foreground">Nenhuma sincronização encontrada</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instruções */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Como conectar seu relógio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Para sincronizar seus dados de saúde, use o Conector Renascer no celular.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <Button variant="outline" className="justify-start gap-2 h-auto py-3">
              <Smartphone className="h-5 w-5" />
              <div className="text-left">
                <p className="font-medium text-sm">iPhone</p>
                <p className="text-xs text-muted-foreground">Apple HealthKit</p>
              </div>
            </Button>

            <Button variant="outline" className="justify-start gap-2 h-auto py-3">
              <Smartphone className="h-5 w-5" />
              <div className="text-left">
                <p className="font-medium text-sm">Android</p>
                <p className="text-xs text-muted-foreground">Health Connect</p>
              </div>
            </Button>
          </div>

          <div className="rounded-lg bg-muted/50 p-4 text-sm space-y-2">
            <p className="font-medium">Passos:</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Baixe o Conector Renascer na App Store ou Play Store</li>
              <li>Faça login com sua conta Renascer</li>
              <li>Permita acesso aos dados de saúde</li>
              <li>Os dados serão sincronizados automaticamente</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
