import { useState } from "react";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useHealthData } from "@/hooks/useHealthData";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { HealthConnectTab } from "@/components/health/HealthConnectTab";
import { HealthDashboardTab } from "@/components/health/HealthDashboardTab";
import { HealthReadinessTab } from "@/components/health/HealthReadinessTab";
import { HeartPulse, Loader2 } from "lucide-react";
import { BodyPremiumIndicators } from "@/components/health/BodyPremiumIndicators";

function DadosCorpo() {
  const [activeTab, setActiveTab] = useState("painel");
  const [inserting, setInserting] = useState(false);
  const { user } = useAuth();
  const { isAdmin } = useAdminCheck();
  const { dailyData, todayData, readiness, lastSync, isLoading, formatSleep, refetch } = useHealthData();

  const insertSampleData = async () => {
    if (!user?.id) return;
    setInserting(true);
    try {
      const days: any[] = [];
      const now = new Date();
      for (let i = 0; i < 7; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        days.push({
          user_id: user.id,
          date: dateStr,
          steps: 5000 + Math.floor(Math.random() * 8000),
          active_calories: 200 + Math.floor(Math.random() * 500),
          sleep_minutes: 300 + Math.floor(Math.random() * 180),
          resting_hr: 55 + Math.floor(Math.random() * 15),
          hrv_ms: 40 + Math.floor(Math.random() * 40),
          source: "manual",
        });
      }

      const { error: dailyError } = await supabase
        .from("health_daily")
        .upsert(days, { onConflict: "user_id,date" });
      if (dailyError) throw dailyError;

      // 1 workout ontem
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const startTime = new Date(yesterday);
      startTime.setHours(10, 0, 0, 0);
      const endTime = new Date(yesterday);
      endTime.setHours(11, 0, 0, 0);

      const { error: workoutError } = await supabase
        .from("health_workouts")
        .insert({
          user_id: user.id,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          type: "strength_training",
          calories: 320,
          source: "manual",
        });
      if (workoutError) throw workoutError;

      toast.success("Dados de exemplo inseridos!");
      refetch();
    } catch (e: any) {
      toast.error("Erro ao inserir dados: " + e.message);
    } finally {
      setInserting(false);
    }
  };

  return (
    <ClientLayout>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HeartPulse className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Dados do Corpo</h1>
          </div>
          {isAdmin && (
            <Button size="sm" variant="outline" onClick={insertSampleData} disabled={inserting}>
              {inserting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Inserir dados de exemplo
            </Button>
          )}
        </div>

        {user?.id && <BodyPremiumIndicators userId={user.id} />}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="painel" className="flex-1">Painel</TabsTrigger>
            <TabsTrigger value="prontidao" className="flex-1">Prontidão</TabsTrigger>
            <TabsTrigger value="conectar" className="flex-1">Conectar</TabsTrigger>
          </TabsList>

          <TabsContent value="painel">
            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : (
              <HealthDashboardTab
                todayData={todayData}
                dailyData={dailyData}
                formatSleep={formatSleep}
                onConnectClick={() => setActiveTab("conectar")}
              />
            )}
          </TabsContent>

          <TabsContent value="prontidao">
            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : (
              <HealthReadinessTab
                score={readiness.score}
                recommendation={readiness.recommendation}
                hasData={dailyData.length > 0}
              />
            )}
          </TabsContent>

          <TabsContent value="conectar">
            <HealthConnectTab lastSync={lastSync} />
          </TabsContent>
        </Tabs>
      </div>
    </ClientLayout>
  );
}

export default DadosCorpo;
