import { useState } from "react";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useHyroxPrograms } from "@/hooks/useHyrox90";
import { HyroxBoard } from "@/components/hyrox/HyroxBoard";
import { dateBR } from "@/lib/hyrox90";
export default function MeuProtocolo90() {
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useHyroxPrograms(user?.id);
  const [selected, setSelected] = useState("");
  const current = data?.find((p) => p.id === selected) ?? data?.[0];
  return (
    <ClientLayout>
      <div className="space-y-8">
        <PageHeader title="Meu protocolo" eyebrow="Acompanhamento de 90 dias" />
        {isLoading ? (
          <p role="status">Carregando protocolo…</p>
        ) : error ? (
          <div role="alert">
            <p>Não foi possível carregar seu protocolo.</p>
            <Button variant="outline" onClick={() => refetch()}>
              Tentar novamente
            </Button>
          </div>
        ) : !current ? (
          <p className="text-muted-foreground py-8">
            Seu protocolo de 90 dias aparece aqui após a aprovação do treinador.
          </p>
        ) : (
          <>
            {data && data.length > 1 && (
              <label className="block text-sm space-y-2">
                <span>Versão do protocolo</span>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3"
                  value={current.id}
                  onChange={(e) => setSelected(e.target.value)}
                >
                  {data.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} · {dateBR(p.start_date)}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <HyroxBoard key={current.id} program={current} admin={false} />
          </>
        )}
      </div>
    </ClientLayout>
  );
}
