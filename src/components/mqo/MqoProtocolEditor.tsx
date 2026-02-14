import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Save, Loader2 } from "lucide-react";
import { PrescriptionAuditPanel } from "@/components/admin/PrescriptionAuditPanel";

interface Protocol {
  id: string;
  type: string;
  title: string;
  content: any;
  status: string;
  audit_result?: any;
}

interface Props {
  clientId: string;
  refreshTrigger: number;
}

export function MqoProtocolEditor({ clientId, refreshTrigger }: Props) {
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [editedContent, setEditedContent] = useState<Record<string, string>>({});
  const [editedTitles, setEditedTitles] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const fetchProtocols = useCallback(async () => {
    const { data } = await supabase
      .from("mqo_protocols")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });
    if (data) {
      setProtocols(data as Protocol[]);
      const contents: Record<string, string> = {};
      const titles: Record<string, string> = {};
      data.forEach((p: any) => {
        contents[p.id] = JSON.stringify(p.content, null, 2);
        titles[p.id] = p.title;
      });
      setEditedContent(contents);
      setEditedTitles(titles);
    }
  }, [clientId]);

  useEffect(() => { fetchProtocols(); }, [fetchProtocols, refreshTrigger]);

  const handleSave = async (protocol: Protocol) => {
    setSaving(protocol.id);
    try {
      let parsedContent;
      try {
        parsedContent = JSON.parse(editedContent[protocol.id]);
      } catch {
        toast.error("JSON inválido");
        setSaving(null);
        return;
      }

      // Save version before updating
      const { data: versions } = await supabase
        .from("mqo_protocol_versions")
        .select("version_number")
        .eq("protocol_id", protocol.id)
        .order("version_number", { ascending: false })
        .limit(1);

      const nextVersion = (versions?.[0]?.version_number || 0) + 1;

      await supabase.from("mqo_protocol_versions").insert({
        protocol_id: protocol.id,
        version_number: nextVersion,
        content: parsedContent,
        status: "editado",
      });

      await supabase
        .from("mqo_protocols")
        .update({
          title: editedTitles[protocol.id],
          content: parsedContent,
          status: "editado",
        })
        .eq("id", protocol.id);

      toast.success("Protocolo salvo (v" + nextVersion + ")");
      fetchProtocols();
    } catch (e) {
      toast.error("Erro ao salvar");
    }
    setSaving(null);
  };

  const typeLabels: Record<string, string> = {
    treino: "Treino",
    dieta: "Dieta",
    mentalidade: "Mentalidade",
  };

  const grouped = protocols.reduce((acc, p) => {
    if (!acc[p.type]) acc[p.type] = [];
    acc[p.type].push(p);
    return acc;
  }, {} as Record<string, Protocol[]>);

  if (!protocols.length) return null;

  return (
    <div className="border border-gray-200 rounded-lg p-5 space-y-4">
      <h3 className="font-bold text-sm uppercase tracking-wider text-gray-500 flex items-center gap-2">
        <div className="w-1 h-4 bg-[#FFC400] rounded-sm" />
        Editor de Protocolos
      </h3>

      <Tabs defaultValue={Object.keys(grouped)[0]} className="w-full">
        <TabsList className="bg-gray-100">
          {Object.keys(grouped).map((type) => (
            <TabsTrigger key={type} value={type} className="data-[state=active]:bg-[#FFC400] data-[state=active]:text-black">
              {typeLabels[type] || type}
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.entries(grouped).map(([type, protos]) => (
          <TabsContent key={type} value={type} className="space-y-4">
            {protos.map((p) => (
              <div key={p.id} className="border border-gray-100 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Input
                    value={editedTitles[p.id] || ""}
                    onChange={(e) => setEditedTitles((prev) => ({ ...prev, [p.id]: e.target.value }))}
                    className="font-semibold border-gray-300"
                  />
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    p.status === "publicado" ? "bg-green-100 text-green-700" :
                    p.status === "editado" ? "bg-[#FFC400]/20 text-black" :
                    "bg-gray-100 text-gray-600"
                  }`}>
                    {p.status}
                  </span>
                </div>
                <Textarea
                  value={editedContent[p.id] || ""}
                  onChange={(e) => setEditedContent((prev) => ({ ...prev, [p.id]: e.target.value }))}
                  rows={15}
                  className="font-mono text-xs border-gray-300"
                />
                <Button
                  onClick={() => handleSave(p)}
                  disabled={saving === p.id}
                  className="bg-black text-white hover:bg-gray-800"
                  size="sm"
                >
                  {saving === p.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Salvar Alterações
                </Button>
                <PrescriptionAuditPanel auditResult={p.audit_result} />
              </div>
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
