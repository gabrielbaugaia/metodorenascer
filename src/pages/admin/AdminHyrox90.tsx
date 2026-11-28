import { useState } from "react";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  StudyClientPicker,
  type StudyClient,
} from "@/components/admin/HormonalStudyPanel";
import { useHyroxPrograms, useRefreshHyrox } from "@/hooks/useHyrox90";
import { HyroxBoard } from "@/components/hyrox/HyroxBoard";
import { HyroxEditor } from "@/components/hyrox/HyroxEditor";
export default function AdminHyrox90() {
  const [client, setClient] = useState<StudyClient | null>(null);
  const [selected, setSelected] = useState("");
  const [creating, setCreating] = useState(false);
  const { data, isLoading, error, refetch } = useHyroxPrograms(
    client?.id,
    true,
  );
  const refresh = useRefreshHyrox();
  const current = data?.find((p) => p.id === selected) ?? data?.[0];
  async function onSaved(id: string) {
    await refresh();
    setSelected(id);
    setCreating(false);
  }
  return (
    <ClientLayout>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Equipe GB · Treinador"
          title="Protocolos de 90 dias"
          subtitle="Prescrição revisada, calendário e acompanhamento individual."
        />
        <StudyClientPicker
          client={client}
          onSelect={(next) => {
            if (
              creating &&
              !confirm(
                "Trocar de cliente descarta os campos não salvos. Continuar?",
              )
            )
              return;
            setClient(next);
            setSelected("");
            setCreating(false);
          }}
        />
        {error ? (
          <div role="alert">
            <p>Não foi possível carregar os protocolos.</p>
            <Button variant="outline" onClick={() => refetch()}>
              Tentar novamente
            </Button>
          </div>
        ) : isLoading ? (
          <p role="status">Carregando protocolos…</p>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                aria-label="Selecionar protocolo de 90 dias"
                className="h-10 min-w-0 flex-1 border border-input bg-background rounded-md px-3"
                value={current?.id ?? ""}
                onChange={(e) => {
                  setSelected(e.target.value);
                  setCreating(false);
                }}
              >
                <option value="" disabled>
                  Selecione um protocolo
                </option>
                {data?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} · {p.status === "draft" ? "Rascunho" : "Aprovado"}
                  </option>
                ))}
              </select>
              {client && (
                <Button variant="outline" onClick={() => setCreating(true)}>
                  <Plus />
                  Novo protocolo
                </Button>
              )}
            </div>
            {creating && client ? (
              <HyroxEditor
                key={client.id}
                userId={client.id}
                name={client.full_name}
                onSaved={onSaved}
              />
            ) : current ? (
              <HyroxBoard
                key={current.id}
                program={current}
                admin
                onSaved={onSaved}
              />
            ) : (
              <p className="text-muted-foreground">
                Selecione o cliente para criar um protocolo.
              </p>
            )}
          </>
        )}
      </div>
    </ClientLayout>
  );
}
