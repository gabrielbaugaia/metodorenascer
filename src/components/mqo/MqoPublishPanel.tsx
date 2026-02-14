import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Send, Download, Loader2 } from "lucide-react";
import { generateMqoProtocolPdf } from "@/lib/generateMqoProtocolPdf";

interface Protocol {
  id: string;
  type: string;
  title: string;
  content: any;
  status: string;
  client_id: string;
}

interface Props {
  clientId: string;
  clientName: string;
  profileId: string | null;
  refreshTrigger: number;
  onPublished: () => void;
}

export function MqoPublishPanel({ clientId, clientName, profileId, refreshTrigger, onPublished }: Props) {
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("mqo_protocols")
        .select("*")
        .eq("client_id", clientId)
        .in("status", ["rascunho", "editado"])
        .order("created_at", { ascending: false });
      if (data) setProtocols(data as Protocol[]);
    };
    fetch();
  }, [clientId, refreshTrigger]);

  const handlePublish = async () => {
    if (!protocols.length) return;
    setPublishing(true);

    try {
      for (const p of protocols) {
        // Update status
        await supabase
          .from("mqo_protocols")
          .update({ status: "publicado", published_at: new Date().toISOString() })
          .eq("id", p.id);

        // Save version
        const { data: versions } = await supabase
          .from("mqo_protocol_versions")
          .select("version_number")
          .eq("protocol_id", p.id)
          .order("version_number", { ascending: false })
          .limit(1);

        const nextV = (versions?.[0]?.version_number || 0) + 1;
        await supabase.from("mqo_protocol_versions").insert({
          protocol_id: p.id,
          version_number: nextV,
          content: p.content,
          status: "publicado",
        });

        // If linked to profile, sync to protocolos table
        if (profileId) {
          await supabase.from("protocolos").insert({
            user_id: profileId,
            tipo: p.type === "dieta" ? "nutricao" : p.type,
            titulo: p.title,
            conteudo: p.content,
            ativo: true,
          });
        }
      }

      toast.success("Protocolos publicados para o cliente!");
      onPublished();
    } catch (e) {
      toast.error("Erro ao publicar");
    }
    setPublishing(false);
  };

  const handleDownloadPdf = () => {
    if (!protocols.length) return;
    generateMqoProtocolPdf(protocols, clientName);
  };

  if (!protocols.length) return null;

  return (
    <div className="border border-gray-200 rounded-lg p-5 space-y-4">
      <h3 className="font-bold text-sm uppercase tracking-wider text-gray-500 flex items-center gap-2">
        <div className="w-1 h-4 bg-[#FFC400] rounded-sm" />
        Publicação
      </h3>

      <p className="text-sm text-gray-500">
        {protocols.length} protocolo(s) prontos para publicação
      </p>

      <div className="flex gap-2">
        <Button
          onClick={handleDownloadPdf}
          variant="outline"
          className="border-[#FFC400] text-black hover:bg-[#FFC400]/10"
        >
          <Download className="mr-2 h-4 w-4" /> Baixar PDF MQO
        </Button>

        <Button
          onClick={handlePublish}
          disabled={publishing}
          className="bg-[#FFC400] text-black hover:bg-[#FFC400]/90 font-semibold"
        >
          {publishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          Publicar para o cliente
        </Button>
      </div>
    </div>
  );
}
