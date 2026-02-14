import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Users } from "lucide-react";

interface MqoClient {
  id: string;
  name: string;
  profile_id: string | null;
  summary: string | null;
  objectives: string | null;
  strengths: string | null;
  attention_points: string | null;
  suggested_strategy: string | null;
  trainer_direction: string | null;
}

interface Props {
  selectedClient: MqoClient | null;
  onSelect: (client: MqoClient) => void;
}

export function MqoClientSelector({ selectedClient, onSelect }: Props) {
  const [clients, setClients] = useState<MqoClient[]>([]);
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [profiles, setProfiles] = useState<{ id: string; full_name: string }[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchClients();
    fetchProfiles();
  }, []);

  const fetchClients = async () => {
    const { data } = await supabase
      .from("mqo_clients")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setClients(data as MqoClient[]);
  };

  const fetchProfiles = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name")
      .order("full_name");
    if (data) setProfiles(data);
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("mqo_clients")
      .insert({
        name: newName.trim(),
        profile_id: selectedProfileId || null,
      })
      .select()
      .single();

    if (error) {
      toast.error("Erro ao criar cliente");
    } else if (data) {
      toast.success("Cliente criado");
      onSelect(data as MqoClient);
      setOpen(false);
      setNewName("");
      setSelectedProfileId("");
      fetchClients();
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
        <Users size={16} />
        Cliente:
      </div>
      
      <Select
        value={selectedClient?.id || ""}
        onValueChange={(val) => {
          const c = clients.find((c) => c.id === val);
          if (c) onSelect(c);
        }}
      >
        <SelectTrigger className="w-[240px] border-gray-300 focus:ring-[#FFC400] focus:border-[#FFC400]">
          <SelectValue placeholder="Selecionar cliente" />
        </SelectTrigger>
        <SelectContent>
          {clients.map((c) => (
            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="border-[#FFC400] text-black hover:bg-[#FFC400]/10">
            <Plus size={14} className="mr-1" /> Novo Cliente
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-black">Novo Cliente MQO</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nome do cliente"
                className="border-gray-300 focus:ring-[#FFC400]"
              />
            </div>
            <div>
              <Label>Vincular a perfil existente (opcional)</Label>
              <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
                <SelectTrigger className="border-gray-300">
                  <SelectValue placeholder="Sem vínculo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sem vínculo</SelectItem>
                  {profiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleCreate}
              disabled={!newName.trim() || loading}
              className="w-full bg-[#FFC400] text-black hover:bg-[#FFC400]/90 font-semibold"
            >
              Criar Cliente
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
