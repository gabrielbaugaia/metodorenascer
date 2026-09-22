import { ClientLayout } from "@/components/layout/ClientLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PrescriptionConfigPanel } from "@/components/admin/PrescriptionConfigPanel";
import { PrescriptionSimulator } from "@/components/admin/PrescriptionSimulator";

export default function AdminMotor() {
  return (
    <ClientLayout>
      <div className="max-w-5xl mx-auto space-y-6 p-4 sm:p-6">
        <header className="space-y-1">
          <p className="eyebrow-label">Prescrição</p>
          <h1 className="display-title text-2xl sm:text-3xl">Motor de Prescrição</h1>
          <p className="text-sm text-muted-foreground">
            Parâmetros da dose de treino e simulação sem gerar protocolo.
          </p>
        </header>

        <Tabs defaultValue="parametros">
          <TabsList>
            <TabsTrigger value="parametros">Parâmetros</TabsTrigger>
            <TabsTrigger value="simulacao">Simulação</TabsTrigger>
          </TabsList>
          <TabsContent value="parametros" className="mt-6">
            <PrescriptionConfigPanel />
          </TabsContent>
          <TabsContent value="simulacao" className="mt-6">
            <PrescriptionSimulator />
          </TabsContent>
        </Tabs>
      </div>
    </ClientLayout>
  );
}
