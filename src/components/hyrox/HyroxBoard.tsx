import { useState } from "react";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  addMonths,
  eachDayOfInterval,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  ArrowUpRight,
  Activity as ActivityIcon,
  CheckCircle2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEntitlements } from "@/hooks/useEntitlements";
import {
  useHyroxData,
  useRefreshHyrox,
  type Program,
  type Activity,
} from "@/hooks/useHyrox90";
import {
  dateBR,
  dayDate,
  phaseDay,
  checkpoints,
  schedule90,
  kindLabel,
  participation,
  type SetEntry,
} from "@/lib/hyrox90";
import { generateHyroxPdf } from "@/lib/generateHyroxPdf";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { HyroxActivityForm } from "./HyroxActivityForm";
import { HyroxDocuments } from "./HyroxDocuments";
import { HyroxReviews } from "./HyroxReviews";
import { HyroxEditor } from "./HyroxEditor";
import { HyroxCheckin } from "./HyroxCheckin";
import { HyroxCharts } from "./HyroxCharts";
import {
  activeSpecialPeriod,
  checkinAlerts,
  durationOf,
  reviewStatusLabel,
} from "@/lib/hyrox90";
export function HyroxBoard({
  program,
  admin,
  onSaved,
}: {
  program: Program;
  admin: boolean;
  onSaved?: (id: string) => Promise<void>;
}) {
  const today = format(new Date(), "yyyy-MM-dd");
  const duration = durationOf(program.config);
  const day = phaseDay(program.start_date, today, duration);
  const cps = checkpoints(program.start_date, duration);
  const initial = day.upcoming
    ? program.start_date
    : day.ended
      ? cps[cps.length - 1].date
      : today;
  const [date, setDate] = useState(initial);
  const [month, setMonth] = useState(startOfMonth(parseISO(initial)));
  const [active, setActive] = useState<Activity | null>(null);
  const [tab, setTab] = useState("calendar");
  const [busy, setBusy] = useState(false);
  const [approval, setApproval] = useState(false);
  const { user } = useAuth();
  const { isFull } = useEntitlements();
  const { data, isLoading, error, refetch } = useHyroxData(program.id);
  const refresh = useRefreshHyrox();
  if (isLoading)
    return (
      <p role="status" className="py-10 text-muted-foreground">
        Carregando acompanhamento…
      </p>
    );
  if (error || !data)
    return (
      <div role="alert" className="space-y-3">
        <p>Não foi possível carregar o acompanhamento.</p>
        <Button variant="outline" onClick={() => refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  const activities = data.activities;
  const sessions = activities.filter((a) => a.planned_date === date);
  const days = eachDayOfInterval({
    start: startOfMonth(month),
    end: endOfMonth(month),
  });
  const pending = cps.filter(
    (c) =>
      c.date <= today &&
      !data.reviews.find((r) => r.checkpoint === c.day)?.reviewed_at,
  );
  const eligible = activities.filter((a) => a.planned_date <= today);
  const special = program.config.special_periods ?? [];
  const percent = participation(eligible, special);
  const period = activeSpecialPeriod(program.config, today);
  const recent = activities.filter((a) => a.status === "completed").slice(-7);
  const highFatigue = recent.some(
    (a) =>
      checkinAlerts({
        fatigue: a.fatigue,
        recovery: a.recovery,
        discomfort: a.discomfort,
        difficulty: a.difficulty,
      }).length > 0,
  );
  const strengthDone = activities.filter(
    (a) => a.kind === "strength" && a.status === "completed",
  );
  const rirPairs = strengthDone.flatMap((a) => {
    const w = program.config.workouts.find((x) => x.key === a.workout_key);
    return (a.set_entries as unknown as SetEntry[])
      .filter((e) => e.done && e.rir !== null)
      .map((e) => {
        const target = w?.exercises.find((x) => x.id === e.exercise_id)?.rir ?? "";
        const nums = target.match(/\d+/g)?.map(Number) ?? [];
        return nums.length ? { real: e.rir!, target: nums.reduce((t, n) => t + n, 0) / nums.length } : null;
      })
      .filter(Boolean) as { real: number; target: number }[];
  });
  const avg = (xs: number[]) => (xs.length ? (xs.reduce((t, x) => t + x, 0) / xs.length).toFixed(1) : "—");
  const weekAgo = format(new Date(Date.now() - 7 * 864e5), "yyyy-MM-dd");
  async function confirmTriage() {
    if (!user || !confirm("Confirmar que a triagem de saúde foi concluída?")) return;
    const { error } = await supabase
      .from("hyrox_programs")
      .update({ triage_confirmed_at: new Date().toISOString(), triage_confirmed_by: user.id })
      .eq("id", program.id);
    if (error) return toast.error("Não foi possível confirmar a triagem.");
    await refresh();
    toast.success("Triagem confirmada.");
  }
  const canRecord = admin || isFull;
  async function approve() {
    if (!user) return;
    if (!approval) return toast.error("Confirme sua revisão antes de liberar.");
    if (
      !program.config.workouts.length ||
      program.config.workouts.some((w) => !w.exercises.length)
    )
      return toast.error("Confira os exercícios antes de aprovar.");
    if (
      !confirm(
        "Liberar esta versão revisada ao aluno? Depois de aprovada, alterações serão feitas em uma nova versão.",
      )
    )
      return;
    setBusy(true);
    try {
      const { error } = await supabase
        .from("hyrox_programs")
        .update({
          status: "published",
          approved_at: new Date().toISOString(),
          approved_by: user.id,
        })
        .eq("id", program.id);
      if (error) throw error;
      await refresh();
      toast.success("Protocolo aprovado e disponível ao aluno.");
    } catch {
      toast.error("Não foi possível aprovar o protocolo.");
    } finally {
      setBusy(false);
    }
  }
  async function fillCalendar() {
    if (activities.length) return;
    const rows = schedule90(program.start_date, program.config.schedule, duration).map(
      (a) => ({ ...a, program_id: program.id }),
    );
    if (!rows.length)
      return toast.error("Cadastre a agenda semanal na prescrição.");
    setBusy(true);
    try {
      const { error } = await supabase.from("hyrox_activities").insert(rows);
      if (error) throw error;
      await refresh();
      toast.success("Agenda de referência criada, sem registros realizados.");
    } catch {
      toast.error("Não foi possível criar a agenda.");
    } finally {
      setBusy(false);
    }
  }
  const end = cps.length ? dayDate(program.start_date, duration) : program.start_date;
  return (
    <div className="space-y-8 min-w-0">
      <header className="space-y-4 border-b border-border pb-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs text-primary uppercase">
              Equipe GB ·{" "}
              {program.status === "draft"
                ? "Aguardando aprovação"
                : "Versão aprovada"}
            </p>
            <h2 className="font-serif text-3xl mt-2 break-words">
              {program.title}
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              {dateBR(program.start_date)} — {dateBR(end)} ·{" "}
              {day.upcoming
                ? "Início programado"
                : day.ended
                  ? `${duration} dias concluídos`
                  : `Dia ${day.day} de ${duration} · ${program.config.phases[day.phase]?.name ?? ""}`}
            </p>
            {!day.upcoming && (
              <div className="h-1 w-full max-w-sm bg-border mt-3" aria-label="Progresso do protocolo">
                <div className="h-1 bg-primary" style={{ width: `${Math.round((day.day / duration) * 100)}%` }} />
              </div>
            )}
          </div>
          <Button
            variant="outline"
            className="self-start shrink-0"
            onClick={() =>
              generateHyroxPdf(program, activities, data.reviews).save(
                "acompanhamento-90-dias.pdf",
              )
            }
          >
            <Download />
            Resumo PDF
          </Button>
        </div>
        <p className="text-sm text-muted-foreground whitespace-pre-line">
          {program.config.goal}
        </p>
      </header>
      <div className="grid md:grid-cols-3 gap-5 border-b border-border pb-6">
        {program.config.phases.slice(0, Math.max(1, duration / 30)).map((p, i) => (
          <section
            key={i}
            className={`border-l-2 pl-4 ${i === day.phase ? "border-primary" : "border-border"}`}
          >
            <p className="text-xs text-muted-foreground">
              {String(i + 1).padStart(2, "0")} · DIAS {i * 30 + 1}–
              {(i + 1) * 30}
            </p>
            <h3
              className={`font-serif text-xl mt-2 ${i === day.phase ? "text-primary" : ""}`}
            >
              {p.name}
            </h3>
            <p className="text-sm text-muted-foreground mt-2 whitespace-pre-line">
              {p.guidance}
            </p>
          </section>
        ))}
      </div>
      {period && (
        <aside className="border-l-2 border-primary pl-4 space-y-1">
          <p className="font-medium">{period.title}</p>
          <p className="text-sm text-muted-foreground whitespace-pre-line">{period.guidance}</p>
        </aside>
      )}
      {!program.triage_confirmed_at && (
        <aside className="border-l-2 border-border pl-4 space-y-2 text-sm">
          <p>Triagem de saúde ainda não confirmada pelo treinador. Não intensifique o treinamento até a confirmação.</p>
          {admin && (
            <Button variant="outline" size="sm" onClick={confirmTriage}>Confirmar triagem concluída</Button>
          )}
        </aside>
      )}
      {program.config.trainer_guidance && (
        <aside className="space-y-1">
          <p className="text-xs text-primary uppercase">Orientações do treinador</p>
          <p className="text-sm whitespace-pre-line">{program.config.trainer_guidance}</p>
          <p className="text-xs text-muted-foreground">Gabriel Baú | Treinador</p>
        </aside>
      )}
      {(pending.length > 0 || highFatigue) && (
        <aside className="border-l-2 border-primary pl-4 space-y-2">
          <p className="font-medium">
            {highFatigue
              ? "Atenção aos relatos de recuperação"
              : "Revisão de acompanhamento pendente"}
          </p>
          {pending.map((c) => (
            <Button
              key={c.day}
              variant="link"
              className="p-0 h-auto"
              onClick={() => setTab("reviews")}
            >
              Revisão {c.day} dias · {dateBR(c.date)} <ArrowUpRight />
            </Button>
          ))}
          {highFatigue && (
            <p className="text-sm text-muted-foreground">
              Há relato de desconforto ou fadiga elevada. Gabriel revisa;
              nenhuma carga foi alterada automaticamente.
            </p>
          )}
        </aside>
      )}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex flex-wrap h-auto justify-start bg-transparent rounded-none border-b border-border w-full gap-1 p-0 pb-2">
          {[
            ["calendar", "Calendário"],
            ["workouts", "Musculação"],
            ["evolution", "Evolução"],
            ["checkin", "Check-in"],
            ["documents", "Documentos"],
            ["reviews", "Revisões"],
            ...(admin ? [["coach", "Treinador"]] : []),
          ].map(([key, label]) => (
            <TabsTrigger key={key} value={key} className="py-3">
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="calendar" className="space-y-6 pt-5">
          <div className="grid lg:grid-cols-[1fr_1fr] gap-8">
            <section className="space-y-4">
              <div className="flex justify-between items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  title="Mês anterior"
                  aria-label="Mês anterior"
                  onClick={() => setMonth((m) => addMonths(m, -1))}
                >
                  <ChevronLeft />
                </Button>
                <h3 className="font-serif text-xl capitalize">
                  {format(month, "MMMM yyyy", { locale: ptBR })}
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Próximo mês"
                  aria-label="Próximo mês"
                  onClick={() => setMonth((m) => addMonths(m, 1))}
                >
                  <ChevronRight />
                </Button>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
                  <span
                    key={i}
                    className="text-xs text-muted-foreground text-center py-2"
                  >
                    {d}
                  </span>
                ))}
                {Array.from(
                  { length: startOfMonth(month).getDay() },
                  (_, i) => (
                    <span key={`blank-${i}`} />
                  ),
                )}
                {days.map((d) => {
                  const s = format(d, "yyyy-MM-dd");
                  const scheduled = activities.filter(
                    (a) => a.planned_date === s,
                  );
                  return (
                    <Button
                      key={s}
                      disabled={s < program.start_date || s > end}
                      variant={date === s ? "default" : "ghost"}
                      aria-label={`Selecionar ${dateBR(s)}`}
                      aria-pressed={date === s}
                      onClick={() => setDate(s)}
                      className="h-12 w-full min-w-0 p-0 flex-col rounded-md"
                    >
                      <span>{d.getDate()}</span>
                      <span
                        className={`h-1 w-1 rounded-full ${scheduled.length ? "bg-current" : "bg-transparent"}`}
                      />
                    </Button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                {dateBR(date)} · {sessions.length} sessões planejadas
              </p>
            </section>
            <section className="space-y-4">
              <h3 className="section-title flex items-center gap-2">
                <CalendarDays className="size-5 text-primary" />
                {dateBR(date)}
              </h3>
              {!sessions.length && (
                <p className="text-muted-foreground text-sm">
                  Sem sessão planejada para esta data.
                </p>
              )}
              {sessions.map((a) => (
                <article
                  key={a.id}
                  className="rounded-lg border border-border p-4 space-y-3"
                >
                  <div className="flex gap-3 items-start justify-between">
                    <div className="min-w-0">
                      <p className="text-xs text-primary">
                        {a.planned_time?.slice(0, 5) ?? "Horário livre"}
                      </p>
                      <h4 className="font-medium break-words">
                        {program.config.workouts.find(
                          (w) => w.key === a.workout_key,
                        )?.name ?? kindLabel[a.kind]}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {a.status === "completed"
                          ? "Realizado · declarado pelo aluno"
                          : a.status === "planned_absence"
                            ? "Ausência planejada / férias"
                            : "Planejado"}
                      </p>
                    </div>
                    {a.status === "completed" && (
                      <CheckCircle2 className="size-5 text-primary shrink-0" />
                    )}
                  </div>
                  <Button
                    variant="outline"
                    disabled={
                      !canRecord || (!admin && program.status !== "published")
                    }
                    onClick={() => setActive(a)}
                  >
                    <ActivityIcon />
                    {a.status === "completed"
                      ? "Ver / editar registro"
                      : "Abrir registro"}
                  </Button>
                </article>
              ))}
              {admin && !activities.length && (
                <Button onClick={fillCalendar} disabled={busy}>
                  Criar calendário de referência
                </Button>
              )}
              {!canRecord && (
                <p className="text-sm text-muted-foreground">
                  O registro de treinos requer acesso completo à consultoria.
                </p>
              )}
            </section>
          </div>
          <section className="border-t border-border pt-5 space-y-3">
            <h3 className="font-medium">
              Treino concorrente e rotina flexível
            </h3>
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {program.config.external_notes}
            </p>
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {program.config.safety}
            </p>
          </section>
        </TabsContent>
        <TabsContent value="workouts" className="space-y-6 pt-5">
          {program.config.workouts.map((w) => (
            <section
              key={w.key}
              className="space-y-4 border-b border-border pb-6"
            >
              <h3 className="section-title">{w.name}</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {w.instructions}
              </p>
              <ul className="divide-y divide-border">
                {w.exercises.map((e) => (
                  <li
                    key={e.id}
                    className="py-3 flex flex-col sm:flex-row sm:justify-between gap-1"
                  >
                    <p className="font-medium">{e.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {e.sets} × {e.reps} · RIR {e.rir} · {e.rest}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <Button variant="outline" asChild>
            <Link to={admin ? `/admin/clientes/${program.user_id}` : "/treino"}>
              Abrir {admin ? "cadastro e treino atual" : "treino atual"}
              <ArrowUpRight />
            </Link>
          </Button>
        </TabsContent>
        <TabsContent value="evolution" className="space-y-8 pt-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 border-b border-border pb-5">
            <div>
              <p className="text-xs text-muted-foreground">
                Sessões realizadas
              </p>
              <p className="font-serif text-3xl mt-1">
                {activities.filter((a) => a.status === "completed").length}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                Participação até hoje
              </p>
              <p className="font-serif text-3xl mt-1">
                {percent === null ? "—" : `${percent}%`}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                Revisões do treinador
              </p>
              <p className="font-serif text-3xl mt-1">
                {data.reviews.filter((r) => r.reviewed_at).length} / 3
              </p>
            </div>
          </div>
          <h3 className="section-title">Corrida, HYROX e cargas</h3>
          <HyroxCharts activities={activities} />
          <h3 className="section-title">Evolução corporal</h3>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              ["weight", "Peso (kg)"],
              ["fat", "Gordura (%)"],
            ].map(([key, label]) => (
              <section key={key} className="space-y-3 min-w-0">
                <h4 className="font-medium">{label}</h4>
                <div className="h-56 w-full">
                  {program.config.baseline.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={program.config.baseline}>
                        <CartesianGrid
                          stroke="hsl(var(--border))"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="date"
                          tickFormatter={dateBR}
                          tick={{
                            fill: "hsl(var(--muted-foreground))",
                            fontSize: 11,
                          }}
                        />
                        <YAxis
                          domain={["auto", "auto"]}
                          tick={{
                            fill: "hsl(var(--muted-foreground))",
                            fontSize: 11,
                          }}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "hsl(var(--card))",
                            borderColor: "hsl(var(--border))",
                            color: "hsl(var(--foreground))",
                          }}
                          labelFormatter={dateBR}
                        />
                        <Line
                          name={label}
                          dataKey={key}
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          isAnimationActive={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-muted-foreground text-sm py-8">
                      Sem medidas documentadas.
                    </p>
                  )}
                </div>
              </section>
            ))}
          </div>
          <ul className="divide-y divide-border">
            {program.config.baseline.map((b) => (
              <li key={b.date} className="py-4 space-y-1 text-sm">
                <p>
                  {dateBR(b.date)} · {b.weight ?? "—"} kg · {b.fat ?? "—"}%
                  gordura · {b.lean ?? "—"} kg massa magra estimada · cintura{" "}
                  {b.waist ?? "—"} cm · altura {b.height ?? "—"} cm
                </p>
                <p className="text-xs text-muted-foreground">
                  Fonte: {b.source}
                </p>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">
            Mudanças de massa magra estimada não equivalem automaticamente a
            hipertrofia muscular.
          </p>
          <h3 className="section-title">Histórico de registros</h3>
          <ul className="divide-y divide-border">
            {activities
              .filter((a) => a.status === "completed" && a.kind !== "checkin")
              .map((a) => (
                <li key={a.id} className="py-4 space-y-2 text-sm">
                  <div className="flex flex-wrap gap-3 items-center">
                    <p>
                      {dateBR(a.actual_date ?? a.planned_date)} ·{" "}
                      {kindLabel[a.kind]} · RPE {a.rpe ?? "—"} ·{" "}
                      {a.duration_min ?? "—"} min
                      {a.kind === "running"
                        ? ` · ${a.distance_km ?? "—"} km · pace ${a.pace ?? "—"}`
                        : ""}
                    </p>
                    <Button
                      variant="link"
                      onClick={() => setActive(a)}
                      disabled={!canRecord}
                    >
                      Abrir
                    </Button>
                  </div>
                  {(a.set_entries as unknown as SetEntry[])
                    .filter((e) => e.done)
                    .map((e) => (
                      <p
                        key={`${e.exercise_id}-${e.set}`}
                        className="text-muted-foreground"
                      >
                        {e.exercise_name} · série {e.set}: {e.weight ?? "—"} kg
                        × {e.reps ?? "—"} · RIR {e.rir ?? "—"}
                      </p>
                    ))}
                </li>
              ))}
          </ul>
        </TabsContent>
        <TabsContent value="checkin" className="pt-5">
          <HyroxCheckin program={program} activities={activities} admin={admin} canRecord={canRecord} refresh={refresh} />
        </TabsContent>
        <TabsContent value="documents" className="pt-5">
          <HyroxDocuments
            program={program}
            documents={data.documents}
            admin={admin}
            refresh={refresh}
          />
        </TabsContent>
        <TabsContent value="reviews" className="pt-5">
          <HyroxReviews
            program={program}
            reviews={data.reviews}
            admin={admin}
            refresh={refresh}
          />
        </TabsContent>
        {admin && (
          <TabsContent value="coach" className="space-y-8 pt-5">
            <section className="space-y-3">
              <h3 className="section-title">Indicadores</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 text-sm">
                <div><p className="text-xs text-muted-foreground">Adesão</p><p className="font-serif text-2xl">{percent === null ? "—" : `${percent}%`}</p></div>
                <div><p className="text-xs text-muted-foreground">Sessões nos últimos 7 dias</p><p className="font-serif text-2xl">{activities.filter((a) => a.status === "completed" && a.kind !== "checkin" && (a.actual_date ?? "") >= weekAgo).length}</p></div>
                <div><p className="text-xs text-muted-foreground">RIR prescrito × realizado</p><p className="font-serif text-2xl">{avg(rirPairs.map((p) => p.target))} × {avg(rirPairs.map((p) => p.real))}</p></div>
                <div><p className="text-xs text-muted-foreground">Check-ins com alerta</p><p className="font-serif text-2xl">{activities.filter((a) => a.kind === "checkin" && checkinAlerts({ fatigue: a.fatigue, recovery: a.recovery, discomfort: a.discomfort, difficulty: a.difficulty }).length).length}</p></div>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                {cps.map((c) => {
                  const r = data.reviews.find((x) => x.checkpoint === c.day);
                  return <li key={c.day}>Revisão {c.day} dias · {dateBR(c.date)} · {reviewStatusLabel[(r?.status ?? "pending") as keyof typeof reviewStatusLabel]}</li>;
                })}
              </ul>
            </section>
            <CoachNotes programId={program.id} />
            {program.status === "draft" && (
              <section className="border-y border-border py-5 space-y-4">
                <h3 className="section-title">Liberação ao aluno</h3>
                <label className="flex items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={approval}
                    onChange={(e) => setApproval(e.target.checked)}
                    className="mt-1"
                  />
                  Revisei os exercícios, a integração com os outros treinadores
                  e as pendências de triagem. Esta é a versão que desejo
                  liberar.
                </label>
                <Button disabled={busy || !approval} onClick={approve}>
                  Aprovar e liberar protocolo
                </Button>
              </section>
            )}
            {onSaved && (
              <HyroxEditor
                key={program.id}
                program={program}
                userId={program.user_id}
                name={program.title}
                onSaved={onSaved}
              />
            )}
          </TabsContent>
        )}
      </Tabs>
      {active && canRecord && (
        <HyroxActivityForm
          activities={activities}
          key={active.id}
          activity={active}
          program={program}
          close={() => setActive(null)}
          refresh={refresh}
        />
      )}
    </div>
  );
}
function CoachNotes({ programId }: { programId: string }) {
  const { user } = useAuth();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const { data, refetch, error } = useQuery({
    queryKey: ["hyrox-notes", programId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hyrox_coach_notes")
        .select("*")
        .eq("program_id", programId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  return (
    <section className="space-y-4">
      <h3 className="section-title">Anotações internas</h3>
      <p className="text-xs text-muted-foreground">
        Exclusivas do treinador; não aparecem para o aluno nem no PDF.
      </p>
      {error && <p role="alert">Não foi possível carregar as anotações.</p>}
      <ul className="divide-y divide-border">
        {data?.map((n) => (
          <li key={n.id} className="py-3 text-sm whitespace-pre-line">
            <span className="block text-xs text-muted-foreground mb-1">
              {format(parseISO(n.created_at), "dd/MM/yyyy HH:mm")}
            </span>
            {n.body}
          </li>
        ))}
      </ul>
      <Label htmlFor="coach-note">Nova anotação / pendência</Label>
      <Textarea
        id="coach-note"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <Button
        disabled={busy || !body.trim()}
        variant="outline"
        onClick={async () => {
          if (!user) return;
          setBusy(true);
          try {
            const { error } = await supabase
              .from("hyrox_coach_notes")
              .insert({
                program_id: programId,
                body: body.trim(),
                created_by: user.id,
              });
            if (error) throw error;
            setBody("");
            await refetch();
            toast.success("Anotação interna salva.");
          } catch {
            toast.error("Não foi possível salvar.");
          } finally {
            setBusy(false);
          }
        }}
      >
        Salvar anotação interna
      </Button>
    </section>
  );
}
