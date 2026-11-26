import { useState } from "react";
import { Link } from "react-router-dom";
import { Activity, ClipboardList, Download, FileCheck, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { HormonalStudyPanel, StudyClientPicker, type StudyClient } from "@/components/admin/HormonalStudyPanel";
import { createStudyNotes } from "@/lib/hormonalStudy";
import { PrescriptionTablePanel } from "@/components/admin/PrescriptionTablePanel";
import { createPrescriptionTable, hasPrescriptionDraft } from "@/lib/hormonalPrescription";
import { generateHormonalReportPdf, type HormonalExam } from "@/lib/generateHormonalReportPdf";

type Exam = HormonalExam;

export default function AdminAcompanhamentoHormonal() {
  const [profile, setProfile] = useState({ reference: "", doctor: "", date: "", history: "", prescription: "", symptoms: "", questions: "" });
  const [exams, setExams] = useState<Exam[]>([]);
  const [examName, setExamName] = useState("");
  const [tab, setTab] = useState("registro");
  const [client, setClient] = useState<StudyClient | null>(null);
  const [study, setStudy] = useState(createStudyNotes);
  const [prescriptionTable, setPrescriptionTable] = useState(createPrescriptionTable);
  const [draftVersion, setDraftVersion] = useState(0);
  function resetDraft(nextClient: StudyClient | null) {
    setClient(nextClient);
    setProfile({ reference: nextClient?.full_name ?? "", doctor: "", date: "", history: "", prescription: "", symptoms: "", questions: "" });
    setStudy(createStudyNotes()); setExams([]); setExamName("");
    setPrescriptionTable(createPrescriptionTable()); setDraftVersion((version) => version + 1);
  }
  function selectClient(nextClient: StudyClient | null) {
    if (client?.id === nextClient?.id) return;
    const hasDraft = Object.entries(profile).some(([key, value]) => key !== "reference" && Boolean(value.trim())) || exams.length > 0 || Object.values(study).some((value) => value.trim()) || hasPrescriptionDraft(prescriptionTable);
    if (hasDraft && !window.confirm("Trocar de cliente descarta o rascunho atual. Baixe o PDF antes se quiser guardar. Continuar?")) return;
    resetDraft(nextClient);
  }
  const update = (key: keyof typeof profile, value: string) => setProfile((current) => ({ ...current, [key]: value }));
  const completed = exams.filter((exam) => exam.done).length;

  function addExam() {
    if (!examName.trim()) return toast.error("Informe o nome do exame solicitado pelo médico.");
    setExams((current) => [...current, { id: crypto.randomUUID(), name: examName.trim(), date: "", done: false }]);
    setExamName("");
  }

  function exportReport() {
    const pdf = generateHormonalReportPdf({ profile, client, study, exams, table: prescriptionTable });
    pdf.save("registro-acompanhamento-hormonal.pdf");
    toast.success("Relatório baixado.");
  }

  return (
    <ClientLayout>
      <div className="space-y-8 min-w-0">
        <header className="border-b border-border pb-6 space-y-4">
          <p className="text-xs uppercase text-primary">Gabriel Baú · Consultoria</p>
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div className="min-w-0 space-y-2">
              <h1 className="display-title tracking-normal break-words">Acompanhamento hormonal</h1>
              <p className="text-muted-foreground text-sm">Prescrição médica transcrita, acompanhamento e estudo · Rascunho desta sessão</p>
            </div>
            <Button variant="outline" onClick={exportReport} className="shrink-0 self-start"><Download /> Baixar relatório PDF</Button>
          </div>
        </header>

        <aside className="flex gap-3 border-l-2 border-primary pl-4 text-sm">
          <ShieldCheck className="size-5 shrink-0 text-primary" />
          <p className="text-muted-foreground">Ciclos, doses, associações e TPC exigem avaliação e prescrição médica individual. Este registro não calcula nem recomenda medicamentos. Não inicie ou altere tratamento por conta própria.</p>
        </aside>

        <StudyClientPicker client={client} onSelect={selectClient} />

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full h-auto flex flex-wrap justify-start gap-1 bg-transparent border-b border-border rounded-none p-0 pb-2">
            <TabsTrigger value="registro" className="gap-2 py-3"><ClipboardList className="size-4" />Registro médico</TabsTrigger>
            <TabsTrigger value="prescricao" className="gap-2 py-3"><ClipboardList className="size-4" />Tabela da prescrição</TabsTrigger>
            <TabsTrigger value="acompanhamento" className="gap-2 py-3"><Activity className="size-4" />Acompanhamento</TabsTrigger>
            <TabsTrigger value="exames" className="gap-2 py-3"><FileCheck className="size-4" />Exames</TabsTrigger>
            <TabsTrigger value="estudo" className="gap-2 py-3"><ClipboardList className="size-4" />Base de estudo</TabsTrigger>
          </TabsList>

          <TabsContent value="estudo" className="pt-6"><HormonalStudyPanel value={study} onChange={setStudy} /></TabsContent>
          <TabsContent value="prescricao" className="pt-6"><PrescriptionTablePanel key={draftVersion} value={prescriptionTable} onChange={setPrescriptionTable} /></TabsContent>

          <TabsContent value="registro" className="pt-6 space-y-6">
            <h2 className="section-title tracking-normal">Informações da consulta</h2>
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="space-y-2"><Label htmlFor="reference">Referência do cliente</Label><Input id="reference" value={profile.reference} onChange={(event) => update("reference", event.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="doctor">Médico responsável / CRM</Label><Input id="doctor" value={profile.doctor} onChange={(event) => update("doctor", event.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="consult-date">Data da consulta</Label><Input id="consult-date" type="date" value={profile.date} onChange={(event) => update("date", event.target.value)} /></div>
            </div>
            <div className="space-y-2"><Label htmlFor="history">Histórico informado e restrições médicas</Label><Textarea id="history" rows={4} value={profile.history} onChange={(event) => update("history", event.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="prescription">Prescrição médica existente — transcrição fiel</Label><Textarea id="prescription" rows={5} value={profile.prescription} onChange={(event) => update("prescription", event.target.value)} /><p className="text-xs text-muted-foreground">Sem prescrição disponível, deixe em branco. A transcrição não valida o tratamento.</p></div>
            <Button onClick={() => setTab("acompanhamento")}>Ver acompanhamento <Activity /></Button>
          </TabsContent>

          <TabsContent value="acompanhamento" className="pt-6 space-y-6">
            <h2 className="section-title tracking-normal">Observações para a consulta</h2>
            <div className="grid sm:grid-cols-3 border-y border-border divide-y sm:divide-y-0 sm:divide-x divide-border">
              <div className="py-5 sm:pr-5"><p className="text-xs text-muted-foreground">Exames registrados</p><p className="text-3xl font-serif mt-2">{exams.length}</p></div>
              <div className="py-5 sm:px-5"><p className="text-xs text-muted-foreground">Realizados</p><p className="text-3xl font-serif mt-2 text-primary">{completed}</p></div>
              <div className="py-5 sm:pl-5"><p className="text-xs text-muted-foreground">Pendentes</p><p className="text-3xl font-serif mt-2">{exams.length - completed}</p></div>
            </div>
            <div className="space-y-2"><Label htmlFor="symptoms">Sintomas, desconfortos e observações</Label><Textarea id="symptoms" rows={5} value={profile.symptoms} onChange={(event) => update("symptoms", event.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="questions">Questões para o médico</Label><Textarea id="questions" rows={4} value={profile.questions} onChange={(event) => update("questions", event.target.value)} /></div>
            <p className="text-sm text-muted-foreground border-l-2 border-destructive pl-4">Dor no peito, falta de ar importante, desmaio ou sinais neurológicos súbitos exigem atendimento de urgência; no Brasil, SAMU 192.</p>
          </TabsContent>

          <TabsContent value="exames" className="pt-6 space-y-6">
            <div><h2 className="section-title tracking-normal">Exames solicitados</h2><p className="text-sm text-muted-foreground mt-2">Registre somente os exames solicitados pelo médico responsável.</p></div>
            <form onSubmit={(event) => { event.preventDefault(); addExam(); }} className="flex flex-col sm:flex-row items-end gap-3">
              <div className="space-y-2 flex-1 w-full"><Label htmlFor="exam-name">Nome do exame</Label><Input id="exam-name" value={examName} onChange={(event) => setExamName(event.target.value)} /></div>
              <Button type="submit" className="w-full sm:w-auto"><Plus /> Adicionar exame</Button>
            </form>
            {!exams.length ? <p className="py-8 border-y border-border text-muted-foreground text-sm">Nenhum exame registrado nesta sessão.</p> : (
              <ul className="divide-y divide-border border-y border-border">
                {exams.map((exam) => <li key={exam.id} className="py-4 flex flex-wrap items-center gap-3">
                  <Checkbox id={exam.id} checked={exam.done} onCheckedChange={(done) => setExams((current) => current.map((item) => item.id === exam.id ? { ...item, done: done === true } : item))} />
                  <Label htmlFor={exam.id} className="flex-1 min-w-0 break-words">{exam.name}<span className="block text-xs text-muted-foreground mt-1">{exam.done ? "Realizado" : "Pendente"}</span></Label>
                  <Input type="date" aria-label={`Data de ${exam.name}`} value={exam.date} className="w-auto max-w-full" onChange={(event) => setExams((current) => current.map((item) => item.id === exam.id ? { ...item, date: event.target.value } : item))} />
                  <Button variant="ghost" size="icon" aria-label={`Remover ${exam.name}`} title="Remover exame" onClick={() => setExams((current) => current.filter((item) => item.id !== exam.id))}><Trash2 /></Button>
                </li>)}
              </ul>
            )}
            <Button variant="outline" asChild><Link to="/admin/clientes"><ClipboardList /> Abrir cadastro de clientes</Link></Button>
            <p className="text-xs text-muted-foreground">Laudos e prescrições podem ser anexados em Avaliações e exames no cadastro do cliente.</p>
          </TabsContent>
        </Tabs>

        <footer className="border-t border-border pt-5 space-y-3">
          <p className="text-xs text-muted-foreground">As informações desta página não ficam salvas no cadastro e são descartadas ao sair. Baixe o relatório antes de fechar.</p>
          <Button variant="ghost" onClick={() => {
            if (!window.confirm("Descartar somente o rascunho desta página?")) return;
            resetDraft(null); setTab("registro");
          }}><Trash2 /> Descartar rascunho</Button>
        </footer>
      </div>
    </ClientLayout>
  );
}