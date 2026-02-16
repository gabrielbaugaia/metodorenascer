import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Checkbox } from "@/components/ui/checkbox";
import { Smartphone, Shield, Server, Activity, Apple, MonitorSmartphone, CheckSquare, FlaskConical, Lock, CircleDot } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const CodeBlock = ({ children, title }: { children: string; title?: string }) => (
  <div className="rounded-lg overflow-hidden my-3">
    {title && <div className="bg-zinc-800 text-zinc-300 text-xs px-4 py-1.5 font-mono">{title}</div>}
    <pre className="bg-zinc-900 text-green-400 text-sm p-4 overflow-x-auto font-mono leading-relaxed whitespace-pre">
      {children}
    </pre>
  </div>
);

const SectionIcon = ({ icon: Icon, label }: { icon: React.ElementType; label: string }) => (
  <span className="flex items-center gap-2 text-base font-semibold">
    <Icon className="h-5 w-5 text-primary" />
    {label}
  </span>
);

const checklist = {
  fase1: [
    'Criar projeto Capacitor ou Swift chamado "Renascer Connect"',
    "Implementar tela Login",
    "Integrar Supabase Auth",
    "Salvar JWT com segurança",
  ],
  fase2: [
    "Solicitar permissões HealthKit",
    "Ler steps",
    "Ler active calories",
    "Ler sleep",
    "Ler resting HR",
    "Ler HRV",
    "Ler workouts",
  ],
  fase3: [
    "Implementar função montar payload",
    "Implementar POST health-sync",
    "Tratar erros",
    "Confirmar inserção no Supabase",
  ],
  fase4: [
    "Tela status",
    "Botão sincronizar agora",
    "Mostrar última sync",
  ],
};

const AdminConectorMobileDocs = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const toggle = (key: string) => setChecked((prev) => ({ ...prev, [key]: !prev[key] }));

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/entrar" replace />;
  }

  return (
    <ClientLayout>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Conector Mobile Renascer</h1>
          <p className="text-muted-foreground text-sm mt-1">Documentação Técnica Oficial — Renascer Connect</p>
        </div>

        <Accordion type="multiple" defaultValue={["visao-geral"]} className="space-y-3">
          {/* SEÇÃO 1 */}
          <AccordionItem value="visao-geral" className="border rounded-lg px-1">
            <AccordionTrigger className="hover:no-underline">
              <SectionIcon icon={Smartphone} label="1. Visão Geral" />
            </AccordionTrigger>
            <AccordionContent>
              <Card className="border-0 shadow-none">
                <CardContent className="pt-2 space-y-4 text-sm text-muted-foreground">
                  <p>
                    O <strong className="text-foreground">Conector Mobile Renascer</strong> é um aplicativo nativo (iOS e Android) responsável por sincronizar dados de saúde do dispositivo do usuário com o backend do Renascer.
                  </p>
                  <p className="font-medium text-foreground">Fluxo iOS:</p>
                  <CodeBlock>{`Apple Watch
  → Apple Health (HealthKit)
    → Renascer Connect (app mobile)
      → Edge Function health-sync
        → Banco de Dados
          → Página /dados-corpo no Renascer`}</CodeBlock>
                  <p className="font-medium text-foreground">Fluxo Android:</p>
                  <CodeBlock>{`Android Watch
  → Health Connect
    → Renascer Connect (app mobile)
      → Edge Function health-sync
        → Banco de Dados
          → Página /dados-corpo no Renascer`}</CodeBlock>
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                    ⚠ O app Renascer (Lovable/web) NÃO acessa HealthKit diretamente. O conector mobile é obrigatório.
                  </p>
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>

          {/* SEÇÃO 2 */}
          <AccordionItem value="autenticacao" className="border rounded-lg px-1">
            <AccordionTrigger className="hover:no-underline">
              <SectionIcon icon={Shield} label="2. Autenticação" />
            </AccordionTrigger>
            <AccordionContent>
              <Card className="border-0 shadow-none">
                <CardContent className="pt-2 space-y-4 text-sm text-muted-foreground">
                  <p>O Conector Mobile deve autenticar usando o sistema de autenticação do backend.</p>
                  <div className="space-y-1">
                    <p className="font-medium text-foreground text-xs">SUPABASE_URL</p>
                    <code className="block bg-muted px-3 py-1.5 rounded text-xs break-all">{SUPABASE_URL}</code>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-foreground text-xs">SUPABASE_ANON_KEY</p>
                    <code className="block bg-muted px-3 py-1.5 rounded text-xs break-all">{SUPABASE_ANON_KEY}</code>
                  </div>
                  <CodeBlock title="Login endpoint">{`POST ${SUPABASE_URL}/auth/v1/token?grant_type=password`}</CodeBlock>
                  <CodeBlock title="Payload">{`{
  "email": "usuario@email.com",
  "password": "senha"
}`}</CodeBlock>
                  <CodeBlock title="Resposta">{`{
  "access_token": "JWT_TOKEN",
  "refresh_token": "...",
  "expires_in": 3600
}`}</CodeBlock>
                  <CodeBlock title="Header obrigatório">{`Authorization: Bearer JWT_TOKEN`}</CodeBlock>
                  <div className="mt-2">
                    <p className="font-medium text-foreground text-xs mb-1">Armazenamento seguro recomendado:</p>
                    <ul className="list-disc list-inside space-y-0.5 text-xs">
                      <li><strong>iOS:</strong> Keychain</li>
                      <li><strong>Android:</strong> EncryptedSharedPreferences</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>

          {/* SEÇÃO 3 */}
          <AccordionItem value="endpoint" className="border rounded-lg px-1">
            <AccordionTrigger className="hover:no-underline">
              <SectionIcon icon={Server} label="3. Endpoint de Sincronização" />
            </AccordionTrigger>
            <AccordionContent>
              <Card className="border-0 shadow-none">
                <CardContent className="pt-2 space-y-4 text-sm text-muted-foreground">
                  <CodeBlock title="Endpoint">{`POST ${SUPABASE_URL}/functions/v1/health-sync`}</CodeBlock>
                  <CodeBlock title="Headers">{`Authorization: Bearer JWT_TOKEN
Content-Type: application/json`}</CodeBlock>
                  <CodeBlock title="Payload oficial">{`{
  "date": "YYYY-MM-DD",
  "daily": {
    "steps": 8000,
    "active_calories": 560,
    "sleep_minutes": 390,
    "resting_hr": 58,
    "hrv_ms": 62.5,
    "source": "apple"
  },
  "workouts": [
    {
      "start_time": "2026-02-16T10:00:00Z",
      "end_time": "2026-02-16T11:00:00Z",
      "type": "strength_training",
      "calories": 320,
      "source": "apple"
    }
  ]
}`}</CodeBlock>
                  <CodeBlock title="Resposta esperada">{`{
  "ok": true,
  "daily_upserted": true,
  "workouts_inserted": 1
}`}</CodeBlock>
                  <p className="text-xs"><strong>Timezone padrão:</strong> America/Sao_Paulo</p>
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>

          {/* SEÇÃO 4 */}
          <AccordionItem value="metricas" className="border rounded-lg px-1">
            <AccordionTrigger className="hover:no-underline">
              <SectionIcon icon={Activity} label="4. Métricas Obrigatórias (MVP)" />
            </AccordionTrigger>
            <AccordionContent>
              <Card className="border-0 shadow-none">
                <CardContent className="pt-2 space-y-4 text-sm">
                  <div>
                    <p className="font-medium text-foreground mb-2">Daily</p>
                    <div className="bg-muted rounded-lg p-3 space-y-1 font-mono text-xs text-muted-foreground">
                      <p>steps → integer</p>
                      <p>active_calories → integer</p>
                      <p>sleep_minutes → integer</p>
                      <p>resting_hr → integer <Badge variant="secondary" className="text-[10px] ml-1">opcional</Badge></p>
                      <p>hrv_ms → number <Badge variant="secondary" className="text-[10px] ml-1">opcional</Badge></p>
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-foreground mb-2">Workouts</p>
                    <div className="bg-muted rounded-lg p-3 space-y-1 font-mono text-xs text-muted-foreground">
                      <p>start_time → ISO string</p>
                      <p>end_time → ISO string</p>
                      <p>type → string</p>
                      <p>calories → integer <Badge variant="secondary" className="text-[10px] ml-1">opcional</Badge></p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>

          {/* SEÇÃO 5 */}
          <AccordionItem value="ios" className="border rounded-lg px-1">
            <AccordionTrigger className="hover:no-underline">
              <SectionIcon icon={Apple} label="5. iOS — Apple HealthKit" />
            </AccordionTrigger>
            <AccordionContent>
              <Card className="border-0 shadow-none">
                <CardContent className="pt-2 space-y-4 text-sm text-muted-foreground">
                  <div>
                    <p className="font-medium text-foreground mb-2">Permissões necessárias:</p>
                    <CodeBlock>{`HKQuantityTypeIdentifier.stepCount
HKQuantityTypeIdentifier.activeEnergyBurned
HKCategoryTypeIdentifier.sleepAnalysis
HKQuantityTypeIdentifier.restingHeartRate
HKQuantityTypeIdentifier.heartRateVariabilitySDNN
HKWorkoutType.workoutType()`}</CodeBlock>
                  </div>
                  <div>
                    <p className="font-medium text-foreground mb-2">Fluxo:</p>
                    <ol className="list-decimal list-inside space-y-1 text-xs">
                      <li>Solicitar permissões HealthKit</li>
                      <li>Ler dados do dia atual</li>
                      <li>Agregar métricas daily</li>
                      <li>Ler workouts últimas 24h</li>
                      <li>Enviar para health-sync endpoint</li>
                    </ol>
                  </div>
                  <div>
                    <p className="font-medium text-foreground mb-2">Frequência recomendada:</p>
                    <ul className="list-disc list-inside space-y-0.5 text-xs">
                      <li>Ao abrir app</li>
                      <li>Botão manual "Sincronizar agora"</li>
                      <li>Opcional: background sync a cada 4h</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>

          {/* SEÇÃO 6 */}
          <AccordionItem value="android" className="border rounded-lg px-1">
            <AccordionTrigger className="hover:no-underline">
              <SectionIcon icon={MonitorSmartphone} label="6. Android — Health Connect" />
            </AccordionTrigger>
            <AccordionContent>
              <Card className="border-0 shadow-none">
                <CardContent className="pt-2 space-y-4 text-sm text-muted-foreground">
                  <div>
                    <p className="font-medium text-foreground mb-2">Permissões:</p>
                    <div className="bg-muted rounded-lg p-3 space-y-1 font-mono text-xs">
                      <p>Steps</p>
                      <p>ActiveCaloriesBurned</p>
                      <p>SleepSession</p>
                      <p>HeartRate</p>
                      <p>ExerciseSession</p>
                    </div>
                  </div>
                  <p className="text-xs">O fluxo de leitura e envio é idêntico ao iOS.</p>
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>

          {/* SEÇÃO 7 */}
          <AccordionItem value="checklist" className="border rounded-lg px-1">
            <AccordionTrigger className="hover:no-underline">
              <SectionIcon icon={CheckSquare} label="7. Checklist de Engenharia" />
            </AccordionTrigger>
            <AccordionContent>
              <Card className="border-0 shadow-none">
                <CardContent className="pt-2 space-y-5 text-sm">
                  {Object.entries(checklist).map(([fase, items], fi) => (
                    <div key={fase}>
                      <p className="font-medium text-foreground mb-2">
                        Fase {fi + 1} — {["Base do Projeto", "HealthKit", "Sync", "UI Mínima"][fi]}
                      </p>
                      <div className="space-y-2">
                        {items.map((item, i) => {
                          const key = `${fase}-${i}`;
                          return (
                            <label key={key} className="flex items-start gap-2 cursor-pointer text-xs text-muted-foreground">
                              <Checkbox checked={!!checked[key]} onCheckedChange={() => toggle(key)} className="mt-0.5" />
                              <span className={checked[key] ? "line-through opacity-50" : ""}>{item}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>

          {/* SEÇÃO 8 */}
          <AccordionItem value="teste" className="border rounded-lg px-1">
            <AccordionTrigger className="hover:no-underline">
              <SectionIcon icon={FlaskConical} label="8. Teste" />
            </AccordionTrigger>
            <AccordionContent>
              <Card className="border-0 shadow-none">
                <CardContent className="pt-2 space-y-3 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">Teste manual:</p>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>Login no Conector Mobile</li>
                    <li>Permitir acesso ao HealthKit</li>
                    <li>Tocar em "Sincronizar agora"</li>
                    <li>Verificar dados em <code className="bg-muted px-1.5 py-0.5 rounded">/dados-corpo</code></li>
                  </ol>
                  <p className="font-medium text-foreground mt-3">Confirmar:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-xs">
                    <li><code className="bg-muted px-1.5 py-0.5 rounded">health_daily</code> preenchido</li>
                    <li><code className="bg-muted px-1.5 py-0.5 rounded">health_workouts</code> preenchido</li>
                    <li>Score de prontidão atualizado</li>
                  </ul>
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>

          {/* SEÇÃO 9 */}
          <AccordionItem value="seguranca" className="border rounded-lg px-1">
            <AccordionTrigger className="hover:no-underline">
              <SectionIcon icon={Lock} label="9. Segurança" />
            </AccordionTrigger>
            <AccordionContent>
              <Card className="border-0 shadow-none">
                <CardContent className="pt-2 space-y-2 text-sm text-muted-foreground">
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>O conector <strong>nunca</strong> deve aceitar <code className="bg-muted px-1 py-0.5 rounded">user_id</code> manual no payload.</li>
                    <li>O backend usa o JWT para determinar o usuário autenticado.</li>
                    <li>Toda requisição deve usar <strong>HTTPS</strong>.</li>
                    <li>Tokens devem ser armazenados com segurança (Keychain / EncryptedSharedPreferences).</li>
                  </ul>
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>

          {/* SEÇÃO 10 */}
          <AccordionItem value="status" className="border rounded-lg px-1">
            <AccordionTrigger className="hover:no-underline">
              <SectionIcon icon={CircleDot} label="10. Status do Projeto" />
            </AccordionTrigger>
            <AccordionContent>
              <Card className="border-0 shadow-none">
                <CardContent className="pt-2 space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Infraestrutura backend</span>
                    <Badge className="bg-green-600 hover:bg-green-600 text-white">✅ Pronta</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Telas frontend</span>
                    <Badge className="bg-green-600 hover:bg-green-600 text-white">✅ Prontas</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Conector mobile</span>
                    <Badge variant="destructive">❌ Pendente</Badge>
                  </div>
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </ClientLayout>
  );
};

export default AdminConectorMobileDocs;
