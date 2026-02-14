

# Anotar Cargas, Cronometro de Intervalo e Tempo de Treino

Sistema completo de acompanhamento de treino em tempo real com registro de cargas, cronometro de descanso obrigatorio entre series e medicao do tempo total da sessao.

---

## Visao Geral do Fluxo

Ao abrir um treino (WorkoutCard), o aluno entra em um "modo sessao ativa":

1. Um timer global comeca a contar o tempo total do treino
2. Para cada exercicio, o aluno registra a carga (kg) usada em cada serie
3. Ao concluir uma serie, um cronometro decrescente de intervalo e acionado automaticamente
4. O aluno NAO pode marcar a proxima serie como feita ate o cronometro zerar
5. O aluno NAO pode marcar o treino como concluido ate completar todas as series de todos os exercicios
6. Ao finalizar, o tempo total e exibido em um resumo e salvo para analises futuras

---

## Fase 1: Banco de Dados

### Nova tabela `workout_set_logs`

Registra cada serie individualmente com carga e tempo.

| Coluna | Tipo | Descricao |
|---|---|---|
| id | uuid PK | |
| user_id | uuid | FK auth user |
| workout_completion_id | uuid | FK workout_completions (preenchido apos conclusao) |
| exercise_name | text | Nome do exercicio |
| set_number | integer | Numero da serie (1, 2, 3...) |
| weight_kg | numeric | Carga usada em kg |
| reps_done | integer | Repeticoes realizadas |
| rest_seconds | integer | Tempo de descanso prescrito |
| rest_respected | boolean | Se o intervalo foi respeitado |
| created_at | timestamptz | |

RLS: usuarios podem inserir/ver/atualizar apenas seus proprios registros. Admins podem ver todos.

### Alterar tabela `workout_completions`

Adicionar coluna:
- `total_duration_seconds` (integer, nullable) -- tempo real cronometrado da sessao

---

## Fase 2: Hook `useWorkoutSession`

Novo hook dedicado ao controle da sessao ativa de treino.

### Estado gerenciado

- `sessionActive`: boolean -- sessao iniciada ou nao
- `sessionStartTime`: Date -- quando o treino comecou
- `elapsedSeconds`: number -- tempo total decorrido (timer crescente)
- `exerciseProgress`: mapa de exercicio -> array de series completadas com carga
- `restTimer`: objeto com { active, remainingSeconds, exerciseName, setNumber }
- `allSetsCompleted`: boolean -- se todas as series de todos exercicios foram feitas

### Funcoes expostas

- `startSession()` -- inicia o timer global
- `logSet(exerciseName, setNumber, weightKg, repsDone, restSeconds)` -- registra serie e dispara cronometro
- `skipRest()` -- NAO disponivel (intervalo obrigatorio)
- `canLogNextSet(exerciseName)` -- retorna false se cronometro ativo
- `canCompleteWorkout()` -- retorna true somente se todas series foram registradas E nenhum timer ativo
- `finishSession()` -- para o timer, calcula tempo total, retorna resumo
- `getExerciseLog(exerciseName)` -- retorna series ja registradas

---

## Fase 3: Componentes Frontend

### `WorkoutSessionManager` (novo)

Wrapper que aparece quando o aluno clica "Iniciar Treino" no WorkoutCard. Substitui a visualizacao estatica por uma interativa.

Exibe:
- Timer global no topo (tempo decorrido)
- Lista de exercicios com campos de carga por serie
- Cronometro decrescente animado quando ativo
- Botao de conclusao bloqueado ate tudo estar preenchido

### `ExerciseSetTracker` (novo)

Componente por exercicio que mostra:
- Nome do exercicio
- Para cada serie: campo de carga (kg) + campo de reps realizadas + botao "Concluir Serie"
- Indicador visual de series completadas (check verde) vs pendentes
- Campo de carga com valor padrao editavel

### `RestCountdown` (novo)

Overlay/modal com cronometro decrescente:
- Circulo animado com contagem regressiva
- Tempo restante em numeros grandes
- Mensagem motivacional
- SEM botao de pular -- obrigatorio esperar
- Som/vibracao ao finalizar (opcional, via navigator.vibrate)

### `WorkoutSummary` (novo)

Tela exibida apos finalizar o treino:
- Tempo total da sessao (formatado mm:ss)
- Total de series completadas
- Carga total levantada (soma de todas cargas x reps)
- Exercicios concluidos
- Botao "Salvar e Fechar"

### Alteracoes em `WorkoutCard`

- Adicionar botao "Iniciar Treino" que abre o WorkoutSessionManager
- O botao "Marcar como Concluido" so aparece apos passar pelo fluxo completo
- NAO e possivel concluir sem ter registrado todas as series

### Alteracoes em `ExerciseTable`

- Adicionar coluna "Carga" na visualizacao (exibe ultima carga usada se houver historico)
- Indicador visual de series completadas na sessao atual

---

## Fase 4: Regras de Bloqueio

### Intervalo obrigatorio

- Ao concluir uma serie, o cronometro decrescente inicia automaticamente com o tempo de descanso prescrito (campo `rest` do exercicio, ex: "60s", "90s")
- Enquanto o cronometro esta ativo, os botoes de "Concluir Serie" de TODOS os exercicios ficam desabilitados
- O cronometro e parseado do campo `rest` (ex: "60s" -> 60, "1:30" -> 90, "2min" -> 120)

### Conclusao do treino

- O botao "Marcar como Concluido" so fica habilitado quando:
  1. Todas as series de todos os exercicios foram registradas
  2. Nenhum cronometro de descanso esta ativo
- Ao clicar, salva o tempo total no `workout_completions.total_duration_seconds`

---

## Fase 5: Salvamento e Historico

### Ao finalizar o treino

1. Inserir registro em `workout_completions` com `total_duration_seconds`
2. Inserir todos os registros de series em `workout_set_logs`
3. Exibir WorkoutSummary com os dados

### Historico de cargas

- Na proxima vez que o aluno abrir o mesmo exercicio, mostrar a ultima carga usada como sugestao
- Query: buscar ultimo `workout_set_logs` para aquele `exercise_name` do usuario

---

## Arquivos a Criar

| Arquivo | Descricao |
|---|---|
| `src/hooks/useWorkoutSession.ts` | Hook de controle da sessao ativa |
| `src/components/treino/WorkoutSessionManager.tsx` | Tela de treino ativo |
| `src/components/treino/ExerciseSetTracker.tsx` | Registro de series por exercicio |
| `src/components/treino/RestCountdown.tsx` | Cronometro decrescente |
| `src/components/treino/WorkoutSummary.tsx` | Resumo final |

## Arquivos a Modificar

| Arquivo | Alteracao |
|---|---|
| `src/components/treino/WorkoutCard.tsx` | Adicionar botao "Iniciar Treino" e fluxo de sessao |
| `src/components/treino/ExerciseTable.tsx` | Coluna de carga, indicador de series |
| `src/hooks/useWorkoutTracking.ts` | Salvar `total_duration_seconds` |

## Migracao SQL

```text
-- Tabela de registro de series individuais
CREATE TABLE public.workout_set_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  workout_completion_id uuid REFERENCES public.workout_completions(id),
  exercise_name text NOT NULL,
  set_number integer NOT NULL,
  weight_kg numeric DEFAULT 0,
  reps_done integer DEFAULT 0,
  rest_seconds integer DEFAULT 60,
  rest_respected boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.workout_set_logs ENABLE ROW LEVEL SECURITY;

-- RLS
CREATE POLICY "Users can insert own set logs"
  ON public.workout_set_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own set logs"
  ON public.workout_set_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all set logs"
  ON public.workout_set_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Coluna de tempo total no workout_completions
ALTER TABLE public.workout_completions
  ADD COLUMN total_duration_seconds integer DEFAULT null;
```

---

## Secao Tecnica

- O timer global usa `setInterval` com 1s de precisao, armazenando `startTime` em ref para evitar drift
- O cronometro decrescente parseia o campo `rest` do exercicio (suporte a "60s", "1min", "1:30", "90s", "2min")
- `workout_set_logs` permite analises futuras: progressao de carga por exercicio ao longo do tempo, volume total, etc.
- O historico de cargas e carregado via query ao abrir a sessao (ultimo log por exercise_name)
- Nenhuma alteracao nos fluxos admin/MQO -- funcionalidade exclusiva da area do aluno
- RLS garante que cada aluno so ve seus proprios registros de series

