import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw, CheckCircle2, XCircle, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getToken } from "@/services/authStore";
import { syncHealthData } from "@/services/healthSync";

type SyncState = "idle" | "syncing" | "success" | "error";

const ConnectSync = () => {
  const navigate = useNavigate();
  const [state, setState] = useState<SyncState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const runSync = async () => {
    setState("syncing");
    setErrorMsg("");
    try {
      const token = await getToken();
      if (!token) {
        navigate("/connect/login", { replace: true });
        return;
      }
      await syncHealthData(token);
      setState("success");
    } catch (err: any) {
      setState("error");
      setErrorMsg(err?.message || "Erro desconhecido ao sincronizar.");
    }
  };

  useEffect(() => {
    // Check auth then auto-sync on mount
    (async () => {
      const token = await getToken();
      if (!token) {
        navigate("/connect/login", { replace: true });
        return;
      }
      runSync();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardContent className="pt-6 space-y-6 text-center">
          {state === "syncing" && (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
              <p className="text-lg font-semibold text-foreground">Sincronizando...</p>
              <p className="text-sm text-muted-foreground">Enviando dados de saúde para o servidor.</p>
            </>
          )}

          {state === "success" && (
            <>
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
              <p className="text-lg font-semibold text-foreground">Sincronização concluída!</p>
              <p className="text-sm text-muted-foreground">Seus dados foram enviados com sucesso.</p>
            </>
          )}

          {state === "error" && (
            <>
              <XCircle className="h-12 w-12 text-destructive mx-auto" />
              <p className="text-lg font-semibold text-foreground">Erro na sincronização</p>
              <p className="text-sm text-destructive">{errorMsg}</p>
            </>
          )}

          {state !== "syncing" && (
            <div className="space-y-3">
              <Button onClick={runSync} className="w-full gap-2">
                <RefreshCw className="h-4 w-4" />
                Sincronizar novamente
              </Button>
              <Button variant="outline" className="w-full gap-2" onClick={() => navigate("/connect/dashboard")}>
                <ArrowLeft className="h-4 w-4" />
                Voltar ao Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ConnectSync;
