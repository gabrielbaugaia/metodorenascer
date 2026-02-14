import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { History, RotateCcw } from "lucide-react";

interface Version {
  id: string;
  protocol_id: string;
  version_number: number;
  status: string;
  created_at: string;
  content: any;
}

interface Props {
  clientId: string;
  refreshTrigger: number;
  onRestore: () => void;
}

export function MqoVersionHistory({ clientId, refreshTrigger, onRestore }: Props) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [protocolNames, setProtocolNames] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetch = async () => {
      const { data: protocols } = await supabase
        .from("mqo_protocols")
        .select("id, title")
        .eq("client_id", clientId);

      if (!protocols?.length) return;

      const names: Record<string, string> = {};
      protocols.forEach((p: any) => { names[p.id] = p.title; });
      setProtocolNames(names);

      const { data: vers } = await supabase
        .from("mqo_protocol_versions")
        .select("*")
        .in("protocol_id", protocols.map((p: any) => p.id))
        .order("created_at", { ascending: false })
        .limit(20);

      if (vers) setVersions(vers as Version[]);
    };
    fetch();
  }, [clientId, refreshTrigger]);

  const handleRestore = async (version: Version) => {
    await supabase
      .from("mqo_protocols")
      .update({ content: version.content, status: version.status })
      .eq("id", version.protocol_id);

    toast.success(`Restaurado para v${version.version_number}`);
    onRestore();
  };

  if (!versions.length) return null;

  return (
    <div className="border border-gray-200 rounded-lg p-5 space-y-4">
      <h3 className="font-bold text-sm uppercase tracking-wider text-gray-500 flex items-center gap-2">
        <div className="w-1 h-4 bg-[#FFC400] rounded-sm" />
        Versionamento
      </h3>

      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {versions.map((v) => (
          <div key={v.id} className="flex items-center justify-between bg-gray-50 rounded px-3 py-2 text-sm">
            <div className="flex items-center gap-2">
              <History size={14} className="text-[#FFC400]" />
              <span className="font-medium">{protocolNames[v.protocol_id] || "Protocolo"}</span>
              <span className="text-xs text-gray-400">v{v.version_number}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded ${
                v.status === "publicado" ? "bg-green-100 text-green-700" :
                v.status === "editado" ? "bg-[#FFC400]/20" : "bg-gray-100"
              }`}>{v.status}</span>
              <span className="text-xs text-gray-400">
                {new Date(v.created_at).toLocaleDateString("pt-BR")}
              </span>
            </div>
            <Button
              variant="ghost" size="sm"
              onClick={() => handleRestore(v)}
              className="text-gray-500 hover:text-black"
            >
              <RotateCcw size={14} />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
