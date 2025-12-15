import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useActivityTracker = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const updateActivity = async () => {
      const now = new Date().toISOString();
      
      // Tenta atualizar, se não existir, insere
      const { error: updateError } = await supabase
        .from("user_activity")
        .update({ last_access: now })
        .eq("user_id", user.id);

      if (updateError) {
        // Provavelmente não existe, então insere
        await supabase
          .from("user_activity")
          .insert({ 
            user_id: user.id, 
            last_access: now 
          });
      }
    };

    // Atualiza ao carregar
    updateActivity();

    // Atualiza a cada 5 minutos enquanto ativo
    const interval = setInterval(updateActivity, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user]);
};
