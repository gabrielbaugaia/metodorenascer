import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface ProtocolData {
  id: string;
  tipo: string;
  titulo: string;
  conteudo: Record<string, unknown>;
  data_geracao: string | null;
  ativo: boolean | null;
}

type ProtocolType = "treino" | "nutricao" | "mindset";

async function fetchProtocol(userId: string, tipo: ProtocolType): Promise<ProtocolData | null> {
  const { data, error } = await supabase
    .from("protocolos")
    .select("id, tipo, titulo, conteudo, data_geracao, ativo")
    .eq("user_id", userId)
    .eq("tipo", tipo)
    .eq("ativo", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error(`Error fetching ${tipo} protocol:`, error);
    throw error;
  }

  return data as ProtocolData | null;
}

export function useProtocol(tipo: ProtocolType) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["protocol", tipo, user?.id],
    queryFn: () => fetchProtocol(user!.id, tipo),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutos - protocolos raramente mudam
    gcTime: 30 * 60 * 1000, // 30 minutos no cache
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["protocol", tipo, user?.id] });
  };

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["protocol"] });
  };

  return {
    protocol: query.data,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    invalidate,
    invalidateAll,
  };
}

// Hook para buscar todos os protocolos de uma vez
export function useAllProtocols() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["protocols", "all", user?.id],
    queryFn: async () => {
      if (!user?.id) return { treino: null, nutricao: null, mindset: null };
      
      const [treino, nutricao, mindset] = await Promise.all([
        fetchProtocol(user.id, "treino"),
        fetchProtocol(user.id, "nutricao"),
        fetchProtocol(user.id, "mindset"),
      ]);

      return { treino, nutricao, mindset };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  return {
    protocols: query.data,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
