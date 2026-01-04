import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useActivityTracker = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const updateActivity = async () => {
      const now = new Date().toISOString();
      
      // Usa upsert para garantir criação ou atualização correta
      const { error } = await supabase
        .from("user_activity")
        .upsert(
          { user_id: user.id, last_access: now, updated_at: now },
          { onConflict: "user_id" }
        );

      if (error) {
        console.error("Error updating user activity:", error);
      }
    };

    // Atualiza ao carregar
    updateActivity();

    // Atualiza a cada 5 minutos enquanto ativo
    const interval = setInterval(updateActivity, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user]);
};
