
Objetivo: corrigir o fluxo para que os dados apareçam e atualizem corretamente na aba “Dados do Corpo”, inclusive FC de Repouso, VFC e BPM médio.

1. Ajustar a origem dos dados
- Confirmar `health_daily` como fonte principal da aba `DadosCorpo`.
- Garantir que todos os fluxos que registram saúde sincronizem de forma completa para `health_daily`, não só passos/calorias/sono.

2. Corrigir o check-in principal (`src/components/renascer/ManualInput.tsx`)
- Incluir `resting_hr`, `hrv_ms` e `avg_hr_bpm` também no `manual_day_logs`, para manter consistência com histórico e revisão.
- Ampliar a lógica de “tem dados fitness” para considerar também FC repouso, VFC e BPM médio.
- Após salvar, invalidar também queries relacionadas que dependem desses dados além de `health-daily`, para refletir imediatamente em todos os painéis.

3. Corrigir histórico e edição de dias (`src/components/renascer/RecentLogsHistory.tsx`)
- Atualizar o `select` de `manual_day_logs` para buscar `resting_hr`, `hrv_ms` e `avg_hr_bpm`.
- Ao editar/salvar um dia, persistir esses campos também em `manual_day_logs`, não apenas em `health_daily`.
- Isso evita que o histórico mostre valores vazios enquanto a aba de saúde usa outra fonte.

4. Corrigir sincronização do conector móvel
- Em `src/services/healthSync.ts`, incluir no payload também:
  - `avg_hr_bpm`
  - `exercise_minutes`
  - `standing_hours`
  - `distance_km`
- Em `supabase/functions/health-sync/index.ts`, aceitar e salvar esses campos no `upsert` de `health_daily`.
- Hoje o sync do conector está incompleto, então parte dos dados nunca chega à aba.

5. Refinar atualização visual da aba Dados do Corpo
- Em `src/hooks/useHealthData.ts`, manter a leitura de 7 dias, mas revisar se o fallback do dia exibido prioriza o registro mais recente com dados cardiovasculares quando o dia atual não tiver esses campos.
- Assim evita aparecer “indisponível” mesmo quando existe dado recente válido.

6. Validar a interface da aba
- Em `src/components/health/HealthDashboardTab.tsx`, manter os cards atuais, mas garantir que os estados de vazio considerem corretamente os campos cardiovasculares.
- Verificar especialmente:
  - FC Repouso
  - VFC (HRV)
  - BPM Diário
  - cards do bloco “Saúde Cardiovascular — 7 dias”

Resultado esperado
- Quando o aluno registrar print/manual/importação/sincronização, a aba “Dados do Corpo” passa a atualizar de forma consistente.
- Se houver dado do dia, ele aparece.
- Se não houver dado do dia, mas houver dado recente válido, o painel mostra esse último registro.

Detalhes técnicos
- Arquivos principais:
  - `src/components/renascer/ManualInput.tsx`
  - `src/components/renascer/RecentLogsHistory.tsx`
  - `src/hooks/useHealthData.ts`
  - `src/components/health/HealthDashboardTab.tsx`
  - `src/services/healthSync.ts`
  - `supabase/functions/health-sync/index.ts`
- Não deve precisar de nova tabela.
- Pode exigir pequena atualização no backend function para o sync móvel ficar completo.
