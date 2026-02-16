import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getToken, clearToken, getLastSync, saveLastSync } from "@/services/authStore";
import { syncHealthData, type SyncResult } from "@/services/healthSync";
import SyncButton from "@/components/connect/SyncButton";
import StatusCard from "@/components/connect/StatusCard";
import { Button } from "@/components/ui/button";
import { Heart, LogOut } from "lucide-react";

const ConnectDashboard = () => {
  const navigate = useNavigate();
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [userName, setUserName] = useState<string>("");

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
    };
    init();
  }, [navigate]);

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

        {/* Sync button */}
        <SyncButton onSync={handleSync} loading={loading} />

        {/* Info */}
        <p className="text-xs text-center text-muted-foreground">
          Dados mock — HealthKit nativo será ativado em breve
        </p>
      </div>
    </div>
  );
};

export default ConnectDashboard;
