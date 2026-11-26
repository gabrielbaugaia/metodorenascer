import { useState } from "react";
import { Link } from "react-router-dom";
import { jsPDF } from "jspdf";
import { Activity, ClipboardList, Download, FileCheck, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

type Exam = { id: string; name: string; date: string; done: boolean };

export default function AdminAcompanhamentoHormonal() {
  const [profile, setProfile] = useState({ reference: "", doctor: "", date: "", history: "", prescription: "", symptoms: "", questions: "" });
  const [exams, setExams] = useState<Exam[]>([]);
  const [examName, setExamName] = useState("");
  const [tab, setTab] = useState("registro");
  const update = (key: keyof typeof profile, value: string) => setProfile((current) => ({ ...current, [key]: value }));
  const completed = exams.filter((exam) => exam.done).length;

  function addExam() {
    if (!examName.trim()) return toast.error("Informe o nome do exame solicitado pelo médico.");
    setExams((current) => [...current, { id: crypto.randomUUID(), name: examName.trim(), date: "", done: false }]);
    setExamName("");
  }

  function exportReport() {
    const pdf = new jsPDF();
    let y = 22;
    const text = (content: string, size = 10) => {
      pdf.setFontSize(size);
      const lines: string[] = pdf.splitTextToSize(content, 174);
      for (const line of lines) {
        if (y > 275) { pdf.addPage(); y = 22; }
        pdf.text(line, 18, y);
        y += size * 0.5;
      }
      y += 4;
    };
    text("Gabriel Baú Consultoria", 17);
    text("Registro de acompanhamento hormonal", 13);
    text(`Data do relatório: ${new Date().toLocaleDateString("pt-BR")}`);
    text("Registro informativo. Não constitui prescrição, diagnóstico ou validação de segurança de ciclos ou TPC.");
    const sections = [
      ["Referência", profile.reference], ["Médico responsável", profile.doctor], ["Data da consulta", profile.date],
      ["Histórico informado", profile.history], ["Prescrição médica transcrita", profile.prescription],
      ["Sintomas e observações", profile.symptoms], ["Questões para a próxima consulta", profile.questions],
    ];
    for (const [title, value] of sections) {
      pdf.setFont("helvetica", "bold"); text(title, 11);
      pdf.setFont("helvetica", "normal"); text(value || "Não informado");
    }
    pdf.setFont("helvetica", "bold"); text("Exames solicitados pelo médico", 11);
    pdf.setFont("helvetica", "normal");
    if (!exams.length) text("Nenhum exame registrado.");
    exams.forEach((exam) => text(`${exam.done ? "Realizado" : "Pendente"} — ${exam.name}${exam.date ? ` — ${exam.date}` : ""}`));
    pdf.save("registro-acompanhamento-hormonal.pdf");
    toast.success("Relatório baixado.");
  }

  return (
    <ClientLayout>
      <div className="space-y-8 min-w-0">
        <header className="border-b border-border pb-6 space-y-4">
          <p className="text-xs uppercase text-primary">Gabriel Baú · Acompanhamento</p>
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div className="min-w-0 space-y-2">
              <h1 className="font-serif text-3xl sm:text-4xl break-words">Acompanhamento hormonal</h1>
              <p className="text-muted-foreground text-sm">Registro médico, observações e exames · Rascunho desta sessão</p>
            </div>
            <Button variant="outline" onClick={exportReport} className="shrink-0 self-start"><Download /> Baixar relatório PDF</Button>
          </div>
        </header>

        <aside className="flex gap-3 border-l-2 border-primary pl-4 text-sm">
          <ShieldCheck className="size-5 shrink-0 text-primary" />
          <p className="text-muted-foreground">Ciclos, doses, associações e TPC exigem avaliação e prescrição médica individual. Este registro não calcula nem recomenda medicamentos. Não inicie ou altere tratamento por conta própria.</p>
        </aside>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full h-auto flex flex-wrap justify-start gap-1 bg-transparent border-b border-border rounded-none p-0 pb-2">
            <TabsTrigger value="registro" className="gap-2 py-3"><ClipboardList className="size-4" />Registro médico</TabsTrigger>
            <TabsTrigger value="acompanhamento" className="gap-2 py-3"><Activity className="size-4" />Acompanhamento</TabsTrigger>
            <TabsTrigger value="exames" className="gap-2 py-3"><FileCheck className="size-4" />Exames</TabsTrigger>
          </TabsList>

          <TabsContent value="registro" className="pt-6 space-y-6">
            <h2 className="font-serif text-2xl">Informações da consulta</h2>
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
            <h2 className="font-serif text-2xl">Observações para a consulta</h2>
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
            <div><h2 className="font-serif text-2xl">Exames solicitados</h2><p className="text-sm text-muted-foreground mt-2">Registre somente os exames solicitados pelo médico responsável.</p></div>
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
            setProfile({ reference: "", doctor: "", date: "", history: "", prescription: "", symptoms: "", questions: "" });
            setExams([]); setExamName(""); setTab("registro");
          }}><Trash2 /> Descartar rascunho</Button>
        </footer>
      </div>
    </ClientLayout>
  );
}