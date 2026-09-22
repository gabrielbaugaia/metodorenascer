import { ClientLayout } from "@/components/layout/ClientLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PrescriptionConfigPanel } from "@/components/admin/PrescriptionConfigPanel";
import { PrescriptionSimulator } from "@/components/admin/PrescriptionSimulator";
import { PrescriptionShadowMode } from "@/components/admin/PrescriptionShadowMode";
import { PrescriptionOverridesPanel } from "@/components/admin/PrescriptionOverridesPanel";
import { PrescriptionRunsHistory } from "@/components/admin/PrescriptionRunsHistory";

export default function AdminMotor() {
  return (
    <ClientLayout>
      <div className="max-w-6xl mx-auto space-y-6 p-4 sm:p-6">
        <header className="space-y-1">
          <p className="eyebrow-label">Prescrição</p>
          <h1 className="display-title text-2xl sm:text-3xl">Motor de Prescrição</h1>
          <p className="text-sm text-muted-foreground">
            Parâmetros da dose, modo sombra, travas manuais e histórico de decisões.
          </p>
        </header>

        <Tabs defaultValue="parametros">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="parametros">Parâmetros</TabsTrigger>
            <TabsTrigger value="sombra">Modo sombra</TabsTrigger>
            <TabsTrigger value="travas">Travas</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
            <TabsTrigger value="simulacao">Perfis de teste</TabsTrigger>
          </TabsList>
          <TabsContent value="parametros" className="mt-6">
            <PrescriptionConfigPanel />
          </TabsContent>
          <TabsContent value="sombra" className="mt-6">
            <PrescriptionShadowMode />
          </TabsContent>
          <TabsContent value="travas" className="mt-6">
            <PrescriptionOverridesPanel />
          </TabsContent>
          <TabsContent value="historico" className="mt-6">
            <PrescriptionRunsHistory />
          </TabsContent>
          <TabsContent value="simulacao" className="mt-6">
            <PrescriptionSimulator />
          </TabsContent>
        </Tabs>
      </div>
    </ClientLayout>
  );
}
