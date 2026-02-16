import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getToken, clearToken, getLastSync, saveLastSync } from "@/services/authStore";
import { syncHealthData, type SyncResult } from "@/services/healthSync";
import { healthkitIsAvailable, requestPermissions } from "@/services/healthkit";
import SyncButton from "@/components/connect/SyncButton";
import StatusCard from "@/components/connect/StatusCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, LogOut, CheckCircle2, XCircle, AlertTriangle, Smartphone } from "lucide-react";

type HealthPermission = "unknown" | "granted" | "denied" | "unavailable" | "checking";

const PERMISSION_KEY = "renascer_health_permission";

function loadPermission(): HealthPermission {
  try {
    const v = localStorage.getItem(PERMISSION_KEY);
    if (v === "granted" || v === "denied") return v;
  } catch {}
  return "unknown";
}

function savePermission(v: HealthPermission) {
  try {
    localStorage.setItem(PERMISSION_KEY, v);
  } catch {}
}

const ConnectDashboard = () => {
  const navigate = useNavigate();
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [healthPermission, setHealthPermission] = useState<HealthPermission>("checking");
  const [permLoading, setPermLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      const token = await getToken();
      if (!token) {
        navigate("/connect/login", { replace: true });
        return;
      }
      setConnected(true);

      const saved = await getLastSync();
      if (saved) setLastSync(saved);

      // Get user name
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", data.user.id)
          .single();
        if (profile) setUserName(profile.full_name);
      }

      // Check HealthKit availability
      const available = await healthkitIsAvailable();
      if (!available) {
        setHealthPermission("unavailable");
      } else {
        const persisted = loadPermission();
        setHealthPermission(persisted);
      }
    };
    init();
  }, [navigate]);

  const handleRequestPermission = async () => {
    setPermLoading(true);
    try {
      const granted = await requestPermissions();
      const status: HealthPermission = granted ? "granted" : "denied";
      setHealthPermission(status);
      savePermission(status);
    } catch {
      setHealthPermission("denied");
      savePermission("denied");
    }
    setPermLoading(false);
  };

  const handleSync = async () => {
    setLoading(true);
    setSyncResult(null);

    const token = await getToken();
    if (!token) {
      navigate("/connect/login", { replace: true });
      return;
    }

    const result = await syncHealthData(token);
    setSyncResult(result);

    if (result.success) {
      await saveLastSync(result.timestamp);
      setLastSync(result.timestamp);
    }

    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    await clearToken();
    navigate("/connect/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background px-6 py-8">
      <div className="w-full max-w-sm mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Heart className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Renascer Connect</h1>
              {userName && (
                <p className="text-xs text-muted-foreground">Olá, {userName.split(" ")[0]}</p>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>

        {/* Status */}
        <StatusCard
          connected={connected}
          lastSync={lastSync}
          syncResult={syncResult}
        />

        {/* Apple Health Card */}
        <HealthPermissionCard
          status={healthPermission}
          loading={permLoading}
          onRequest={handleRequestPermission}
        />

        {/* Sync button */}
        <SyncButton onSync={handleSync} loading={loading} />

        {/* Info */}
        {healthPermission !== "granted" && (
          <p className="text-xs text-center text-muted-foreground">
            Dados mock — conecte o Apple Health para dados reais
          </p>
        )}
      </div>
    </div>
  );
};

// ---------- Apple Health Permission Card ----------

function HealthPermissionCard({
  status,
  loading,
  onRequest,
}: {
  status: HealthPermission;
  loading: boolean;
  onRequest: () => void;
}) {
  if (status === "checking") return null;

  return (
    <Card className="border">
      <CardContent className="pt-4 pb-4 space-y-3">
        {status === "granted" && (
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Apple Health conectado</p>
              <p className="text-xs text-muted-foreground">Dados reais serão sincronizados</p>
            </div>
          </div>
        )}

        {status === "unknown" && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Apple Health</p>
                <p className="text-xs text-muted-foreground">
                  Conecte para sincronizar passos, calorias e sono reais
                </p>
              </div>
            </div>
            <Button
              onClick={onRequest}
              disabled={loading}
              className="w-full"
              size="sm"
            >
              {loading ? "Solicitando..." : "Conectar Apple Health"}
            </Button>
          </div>
        )}

        {status === "denied" && (
          <div className="flex items-center gap-3">
            <XCircle className="h-5 w-5 text-amber-500 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Permissão negada</p>
              <p className="text-xs text-muted-foreground">
                Ative em Ajustes → Saúde → Acesso de dados
              </p>
            </div>
          </div>
        )}

        {status === "unavailable" && (
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Apple Health não disponível</p>
              <p className="text-xs text-muted-foreground">
                Não disponível neste dispositivo
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ConnectDashboard;
