import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAssessments } from "@/hooks/usePhysicalAssessments";
import { ComparisonPanel, EvolutionCharts, METRICS, PhotoGrid, dateBR } from "@/components/assessment/AssessmentEvolution";
import { diff, fmt } from "@/lib/physicalAssessment";

const db = supabase as any;
const KEY = ["bf", "fat", "lean", "weight", "bmi", "waist"];

export default function AdminEvolucaoFisica() {
  const [params, setParams] = useSearchParams();
  const studentId = params.get("aluno") ?? "";
  const [search, setSearch] = useState("");

  const students = useQuery({
    queryKey: ["evolution-students"],
    queryFn: async () => {
      const { data, error } = await db.from("physical_assessments").select("user_id").eq("status", "published");
      if (error) throw error;
      const ids = [...new Set((data ?? []).map((r: any) => r.user_id))];
      if (!ids.length) return [];
      const { data: p, error: e2 } = await db.from("profiles").select("id, full_name, email").in("id", ids).order("full_name");
      if (e2) throw e2;
      return p as { id: string; full_name: string | null; email: string | null }[];
    },
  });
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (students.data ?? []).filter((s) => !q || `${s.full_name} ${s.email}`.toLowerCase().includes(q));
  }, [students.data, search]);
  const student = students.data?.find((s) => s.id === studentId);

  const list = useAssessments(studentId || undefined, "admin");
  const items = (list.data ?? []).filter((x) => x.status === "published");
  const first = items[0], last = items[items.length - 1];

  return (
    <ClientLayout>
      <div className="space-y-8">
        <PageHeader eyebrow="Avaliação física" title="Evolução Física" subtitle="Progresso de cada aluno a partir das avaliações publicadas e das fotos." />

        <Card>
          <CardHeader><CardTitle className="text-lg">Aluno</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Buscar por nome ou e-mail" value={search} onChange={(e) => setSearch(e.target.value)} className="min-h-11" />
            {students.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : !filtered.length ? (
              <p className="text-sm text-muted-foreground">Nenhum aluno com avaliação publicada.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {filtered.map((s) => (
                  <Button key={s.id} size="sm" variant={s.id === studentId ? "default" : "outline"} className="min-h-11" onClick={() => setParams({ aluno: s.id })}>
                    {s.full_name || s.email}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {student && (list.isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : !items.length ? (
          <p className="text-sm text-muted-foreground">Sem avaliações publicadas.</p>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between space-y-0">
                <CardTitle className="text-lg min-w-0 break-words">{student.full_name || student.email} · {items.length} avaliação(ões)</CardTitle>
                <Button asChild variant="outline" size="sm" className="self-start min-h-11"><Link to={`/admin/avaliacoes?aluno=${student.id}`}>Abrir avaliações</Link></Button>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3">Da primeira ({dateBR(first.assessed_at)}) à última ({dateBR(last.assessed_at)}).</p>
                <dl className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {METRICS.filter((m) => KEY.includes(m.key)).map((m) => {
                    const d = diff(m.get(first), m.get(last));
                    return (
                      <div key={m.key} className="rounded-lg border border-border p-3">
                        <dt className="text-xs text-muted-foreground">{m.label}</dt>
                        <dd className="text-base font-semibold mt-0.5">{fmt(m.get(last), m.digits)} {m.unit}</dd>
                        <dd className="text-xs text-muted-foreground tabular-nums">{d.abs == null || items.length < 2 ? "—" : `${d.abs > 0 ? "+" : ""}${fmt(d.abs, m.digits)} ${m.unit}`}</dd>
                      </div>
                    );
                  })}
                </dl>
              </CardContent>
            </Card>

            <EvolutionCharts items={items} />

            <Card>
              <CardHeader><CardTitle className="text-lg">Linha do tempo de fotos</CardTitle></CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {[...items].reverse().map((a) => <PhotoGrid key={a.id} assessment={a} label={`${dateBR(a.assessed_at)} · ${fmt(a.results?.body_fat_pct, 1)}%`} />)}
              </CardContent>
            </Card>

            <ComparisonPanel items={items} />
          </>
        ))}
      </div>
    </ClientLayout>
  );
}
