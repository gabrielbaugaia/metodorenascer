
# Correção de Dois Bugs Críticos: PDF Nutrição e Persistência de Treino

## Diagnóstico Confirmado

### Bug 1: PDF de Nutrição incompleto

**Causa raiz:** A função `generateNutricaoPdf()` em `src/lib/generateProtocolPdf.ts` só conhece o **formato legado** do protocolo:
- `conteudo.refeicoes`
- `conteudo.macros`
- `conteudo.calorias_diarias`
- `conteudo.suplementacao`

A tela `Nutricao.tsx` já renderiza corretamente o **formato expandido** (gerado pelos protocolos mais recentes):
- `conteudo.plano_dia_treino.refeicoes[]`
- `conteudo.plano_dia_descanso.refeicoes[]`
- `conteudo.macros_diarios`
- `conteudo.refeicao_pre_sono.opcoes[]`
- `conteudo.hidratacao.distribuicao[]`
- `conteudo.lista_compras_semanal`
- `conteudo.substituicoes[]`
- `conteudo.estrategia_anti_compulsao`

O PDF pula tudo isso. Quando não há campos legados, o documento sai quase vazio ou com apenas suplementação.

---

### Bug 2: Perda de progresso no treino ao sair do app

**Causa raiz:** Todo o estado do treino vive apenas em memória React (`useState` dentro de `useWorkoutSession`). O iOS Safari pode descartar o contexto JS ao colocar a aba em background. Ao retornar, o componente remonta com estado zerado.

O banco de dados **já persiste corretamente** cada série registrada em `workout_set_logs` e o `active_workout_sessions` com `status: "active"`. Mas não existe lógica de **rehydration** — o app não tenta recuperar uma sessão em andamento ao montar.

Adicionalmente:
- O `sessionStartRef` é perdido → o cronômetro reinicia do zero
- O `restTimer.endsAt` é perdido → o cronômetro de descanso some
- Os `logs[]` são perdidos → as séries marcadas desaparecem visualmente

---

## Plano de Implementação

### Fix 1: PDF Nutrição — Suporte ao Formato Expandido

**Arquivo:** `src/lib/generateProtocolPdf.ts`

Reescrever a função `generateNutricaoPdf()` para detectar o formato do protocolo e renderizar corretamente:

**Lógica de detecção:**
```
isExpandedFormat = conteudo.plano_dia_treino || conteudo.macros_diarios existem
```

**Estrutura do PDF expandido (mesma ordem da tela):**

1. **Resumo Macros Diários** — ler de `macros_diarios` (calorias, proteína, carboidrato, gordura, água)
2. **Plano Dia de Treino** — iterar `plano_dia_treino.refeicoes[]`, com alimentos, horário, macros por refeição e substituições
3. **Plano Dia de Descanso** — iterar `plano_dia_descanso.refeicoes[]`, com nota de ajuste se existir
4. **Refeição Pré-Sono** — iterar `refeicao_pre_sono.opcoes[]` com alimentos e macros de cada opção
5. **Hidratação** — ler `hidratacao.calculo`, `hidratacao.litros_dia`, e lista `distribuicao` ou `dicas`
6. **Lista de Compras Semanal** — iterar `lista_compras_semanal` (proteínas, carboidratos, gorduras, frutas, vegetais, outros)
7. **Substituições** — iterar `substituicoes[]` por categoria com equivalências
8. **Estratégia Anti-Compulsão** — exibir orientações se existir
9. **Suplementação** — manter lógica existente (já funciona)
10. **Dicas** — manter lógica existente

**Para protocolo legado** (sem campos expandidos): manter exatamente o comportamento atual.

**Função helper auxiliar** para renderizar um bloco de refeição no PDF:
```
renderMealBlockPdf(refeicao, helpers) →
  subsectionTitle com nome + horário + calorias
  lista de alimentos
  macros por refeição (badge compacto)
  substituições em itálico
```

---

### Fix 2: Persistência de Sessão de Treino

**Problema central:** Estado efêmero em memória. Solução: salvar e restaurar do banco de dados ao montar.

#### Parte A — Persistência incremental por série (já implementada)

Cada série já é salva em `workout_set_logs` no momento do `logSet()`. Isso é correto. O que falta é **não salvar só no `finishSession()`**, mas **também ler de volta** ao montar.

#### Parte B — Hook `useWorkoutSession.ts`: Adicionar rehydration

Ao montar, se existir uma sessão `active` no banco para o usuário:
1. Buscar `active_workout_sessions` com `status = 'active'` e `workout_name = workoutName`
2. Buscar todos os `workout_set_logs` com esse `session_id`
3. Restaurar: `sessionId`, `logs[]`, `sessionStartRef.current` (a partir de `started_at`)
4. `sessionActive = true` automaticamente → retomar o cronômetro onde parou

**Lógica de rehydration:**
```typescript
// Ao montar useWorkoutSession:
const existingSession = await supabase
  .from("active_workout_sessions")
  .select("id, started_at")
  .eq("user_id", user.id)
  .eq("status", "active")
  .eq("workout_name", workoutName)
  .maybeSingle();

if (existingSession) {
  const existingLogs = await supabase
    .from("workout_set_logs")
    .select("*")
    .eq("session_id", existingSession.id)
    .order("created_at");
  
  // Restaurar estado
  setSessionId(existingSession.id);
  sessionStartRef.current = new Date(existingSession.started_at);
  setLogs(existingLogs.map(...)); // mapear para SetLog[]
  setSessionActive(true);
}
```

#### Parte C — WorkoutSessionManager.tsx: Detectar sessão recuperada

Atualmente o componente tem uma tela "pré-início" e só mostra o treino ativo após `handleStart()`. Com rehydration, se o hook retornar com `sessionActive = true` no mount, o componente deve **pular** a tela de pré-início e mostrar diretamente o treino ativo.

Adicionar prop/estado `isRecovering` que é `true` enquanto o hook verifica se existe sessão ativa, e `false` após. Durante `isRecovering`, mostrar um spinner de "Verificando sessão anterior...".

#### Parte D — Salvar série no banco em tempo real (complemento)

Atualmente o `logSet()` só salva em memória (`setLogs(...)`). O `finishSession()` faz o insert em batch no final.

Adicionar insert incremental: ao chamar `logSet()`, além de atualizar o estado local, fazer um `supabase.from("workout_set_logs").insert(...)` assíncrono (fire-and-forget com try/catch silencioso). Isso garante que mesmo se o app for fechado no meio, os sets já estarão no banco para rehydration.

Quando `finishSession()` rodar, pular o insert se os logs já existirem (verificar por `session_id` + `set_number` + `exercise_name` — ou usar `upsert` com conflict target).

---

## Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/lib/generateProtocolPdf.ts` | Reescrever `generateNutricaoPdf()` para suportar formato expandido |
| `src/hooks/useWorkoutSession.ts` | Adicionar rehydration de sessão ativa ao montar + insert incremental por série |
| `src/components/treino/WorkoutSessionManager.tsx` | Detectar sessão recuperada, pular tela de pré-início, mostrar spinner de rehydration |

---

## Detalhes Técnicos Importantes

### PDF — Segurança contra campos ausentes

Cada seção do PDF expandido só é renderizada se o campo existir. Nenhuma seção lança erro se o campo estiver `undefined` ou `null`. Isso garante compatibilidade tanto com protocolos legados quanto expandidos.

### Treino — Race condition no insert incremental

O insert por série é `fire-and-forget`. O `finishSession()` usa `upsert` com `onConflict: "session_id,exercise_name,set_number"` para evitar duplicatas caso a série já tenha sido salva incrementalmente. Se o DB não tiver esse índice, usar um check simples antes do batch insert do `finishSession`.

### Treino — Cronômetro de descanso após rehydration

O `restTimer.endsAt` não é persistido no banco (seria complexo e de curta duração). Ao recuperar a sessão, o rest timer sempre começa inativo. O usuário pode registrar a próxima série normalmente.

### Treino — Segurança de múltiplas sessões ativas

Se houver mais de uma sessão `active` para o mesmo usuário + workout_name, usar a mais recente (`order("started_at", { ascending: false }).limit(1)`). Ao iniciar nova sessão, marcar sessões anteriores como `abandoned` antes.

---

## O que NÃO será feito

- Nenhuma alteração no banco de dados (schema já suporta tudo)
- Nenhuma alteração em Edge Functions
- Nenhum Service Worker ou cache offline complexo
- Sem alterar a tela `/dados-corpo`
- Sem alterar o formato de geração de protocolos
