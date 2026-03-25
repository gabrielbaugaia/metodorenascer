

# Plano: 3 Melhorias no Treino e Saúde

## 1. Registro de cargas pós-treino (sem sessão ao vivo)

**Problema**: Hoje só é possível registrar cargas durante uma sessão ativa com cronômetro. Se o aluno treinou e não anotou na hora, não consegue registrar depois.

**Solução**: Adicionar botão "Registrar Cargas" no WorkoutCard (ao lado de "Iniciar Treino") que abre um formulário simplificado para anotar peso e reps de cada exercício sem cronômetro nem timer de descanso, e marcar o treino como concluído.

**Arquivos**:
- `src/components/treino/WorkoutCard.tsx` — adicionar botão "Registrar Cargas" e estado para modo manual
- Novo `src/components/treino/ManualSetLogger.tsx` — formulário compacto que lista todos os exercícios com inputs de peso/reps para cada série, sem timer, sem cronômetro, com botão "Salvar e Concluir"
- `src/hooks/useWorkoutSession.ts` — criar função `saveManualLogs()` que insere os set_logs e cria um `workout_completion` sem sessão ativa (ou com sessão de duração 0)

**Lógica**: Cria uma sessão com status "manual", insere os `workout_set_logs` de uma vez, registra em `workout_completions` com `duration_minutes = null` e flag de registro manual.

---

## 2. Timer de descanso não-bloqueante

**Problema**: O `RestCountdown` em modo fullscreen bloqueia toda a tela, impedindo o aluno de navegar no app.

**Solução**: Substituir o overlay fullscreen por um banner compacto fixo no topo da tela (tipo notificação) que mostra o countdown e, quando faltam 10 segundos, exibe alerta visual + vibração com mensagem "Volte para o foco agora!".

**Arquivos**:
- `src/components/treino/RestCountdown.tsx` — mudar o modo `fullscreen` para um banner fixo no topo (~60px altura) com progresso circular pequeno, tempo restante e nome do exercício. Manter o app navegável por baixo. Adicionar alerta especial nos últimos 10 segundos (cor diferente + texto "Volte para o foco!")
- `src/components/treino/WorkoutSessionManager.tsx` — remover lógica de overlay condicional; o banner sempre aparece no topo sem bloquear
- `src/hooks/useWorkoutSession.ts` — remover restrição de `canLogSet()` que bloqueia durante descanso (o aluno pode continuar logando se quiser pular o descanso)

---

## 3. VFC, BPM e ECG no dashboard de saúde

**Problema**: O OCR dos prints de fitness não extrai VFC (variabilidade de frequência cardíaca), FC de repouso nem FC diária. Também não há como anexar ECG do Apple Watch.

**Solução**:

### 3a. Expandir OCR para extrair dados cardíacos
- `supabase/functions/extract-fitness-data/index.ts` — adicionar campos `resting_hr`, `hrv_ms` e `avg_hr_bpm` ao schema do tool call da IA
- `src/components/renascer/BatchFitnessUpload.tsx` — exibir os novos campos na revisão e sincronizá-los com `health_daily`
- `src/components/renascer/RecentLogsHistory.tsx` — sincronizar `resting_hr` e `hrv_ms` ao editar/salvar

### 3b. Dashboard cardiovascular
- `src/components/health/HealthDashboardTab.tsx` — sempre mostrar cards de FC Repouso, HRV e BPM Diário (não só quando > 0); adicionar seção "Saúde Cardiovascular" com mini-gráfico de tendência dos últimos 7 dias (sparkline)
- `src/hooks/useHealthData.ts` — adicionar `avg_hr_bpm` ao tipo HealthDaily (requer coluna no banco)

### 3c. Upload de ECG
- Migration SQL: adicionar coluna `avg_hr_bpm` em `health_daily`; criar tabela `ecg_records` (id, user_id, recorded_at, file_url, heart_rate_bpm, classification, notes, created_at) com RLS
- Criar bucket storage `ecg-records` para PDFs/imagens de ECG
- Novo `src/components/health/EcgUploadCard.tsx` — card com upload de arquivo (PDF/imagem do ECG Apple), campo para BPM e classificação, listagem dos ECGs anteriores
- Integrar no `HealthDashboardTab` como seção "Eletrocardiograma"

### Tabela `ecg_records`:
```text
id          uuid PK
user_id     uuid NOT NULL
recorded_at timestamptz NOT NULL DEFAULT now()
file_url    text NOT NULL
heart_rate_bpm integer
classification text  -- 'normal', 'afib', 'inconclusive'
notes       text
created_at  timestamptz DEFAULT now()
```

---

## Resumo de arquivos

| Arquivo | Mudança |
|---|---|
| `src/components/treino/WorkoutCard.tsx` | Botão "Registrar Cargas" |
| Novo `src/components/treino/ManualSetLogger.tsx` | Formulário pós-treino |
| `src/components/treino/RestCountdown.tsx` | Banner compacto no topo |
| `src/components/treino/WorkoutSessionManager.tsx` | Remover overlay bloqueante |
| `src/hooks/useWorkoutSession.ts` | `saveManualLogs()` + liberar `canLogSet` |
| `supabase/functions/extract-fitness-data/index.ts` | Extrair HR/HRV do print |
| `src/components/renascer/BatchFitnessUpload.tsx` | Exibir e salvar HR/HRV |
| `src/components/renascer/RecentLogsHistory.tsx` | Sync HR/HRV |
| `src/components/health/HealthDashboardTab.tsx` | Seção cardiovascular + ECG |
| `src/hooks/useHealthData.ts` | Tipo + query com avg_hr_bpm |
| Novo `src/components/health/EcgUploadCard.tsx` | Upload e histórico ECG |
| Migration SQL | Coluna avg_hr_bpm + tabela ecg_records + bucket |

