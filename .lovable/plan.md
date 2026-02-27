
# Fix: Sessao de Treino Persistente ao Voltar do Background

## Problema

Quando o usuario sai do app (vai pro Instagram, WhatsApp etc) e volta, o componente `WorkoutCard` remonta com `sessionMode = false` (estado local React). O resultado e que ele ve a tela "Pronto para treinar?" em vez de voltar direto para a sessao ativa. Os dados da sessao estao salvos no banco, mas a UI nao sabe que precisa reentrar no modo de sessao.

## Causa Raiz

`WorkoutCard.tsx` linha 52: `const [sessionMode, setSessionMode] = useState(false);` -- sempre inicia como `false` ao montar.

O `WorkoutSessionManager` tem logica de rehydrate que funciona, mas so e executada DEPOIS que `sessionMode = true`. Como `sessionMode` volta pra `false`, o manager nunca monta e nunca reidrata.

## Solucao

### Arquivo: `src/pages/Treino.tsx`

Adicionar uma verificacao no mount que busca sessoes ativas do usuario no banco. Se existir uma sessao ativa, identificar qual workout corresponde e passar essa informacao para o `WorkoutCard` correto.

- Novo estado: `activeSessionWorkout: string | null`
- Query no mount: buscar `active_workout_sessions` com `status = 'active'` e `user_id = user.id` (limite 1, mais recente)
- Se a sessao tiver mais de 4h, ignorar (consistente com logica existente)
- Passar prop `autoStartSession={true}` para o WorkoutCard cujo nome bate com o `workout_name` da sessao ativa

### Arquivo: `src/components/treino/WorkoutCard.tsx`

- Nova prop: `autoStartSession?: boolean`
- `useEffect` que seta `setSessionMode(true)` quando `autoStartSession` e `true`
- Isso faz o `WorkoutSessionManager` montar, que por sua vez chama `rehydrateSession` e recupera todos os dados (logs, timer, tempo decorrido)

## Fluxo Corrigido

```text
1. Usuario inicia treino A → sessionMode=true, sessao criada no banco
2. Usuario anota cargas, timer de descanso roda
3. Usuario sai pro Instagram
4. Usuario volta → Treino.tsx monta
5. Query encontra sessao ativa "Treino A - Peito..."
6. WorkoutCard do Treino A recebe autoStartSession=true
7. sessionMode=true automaticamente
8. WorkoutSessionManager monta e reidrata a sessao
9. Usuario volta exatamente onde parou (com timer geral correto)
```

## Detalhes Tecnicos

### Treino.tsx - Adicoes

```typescript
const [activeSessionWorkout, setActiveSessionWorkout] = useState<string | null>(null);

useEffect(() => {
  if (!user) return;
  const checkActiveSession = async () => {
    const { data } = await supabase
      .from("active_workout_sessions")
      .select("workout_name, started_at")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (data) {
      const age = Date.now() - new Date(data.started_at).getTime();
      if (age < 4 * 60 * 60 * 1000) {
        setActiveSessionWorkout(data.workout_name);
      }
    }
  };
  checkActiveSession();
}, [user]);
```

Na renderizacao do WorkoutCard, passar:
```typescript
autoStartSession={activeSessionWorkout === `${workout.day} — ${workout.focus}`}
```

### WorkoutCard.tsx - Adicoes

Nova prop e effect:
```typescript
interface WorkoutCardProps {
  // ... existentes
  autoStartSession?: boolean;
}

useEffect(() => {
  if (autoStartSession) {
    setSessionMode(true);
  }
}, [autoStartSession]);
```

## Resumo

| Arquivo | Mudanca |
|---------|---------|
| `src/pages/Treino.tsx` | Query para sessao ativa no mount; passa `autoStartSession` ao WorkoutCard correto |
| `src/components/treino/WorkoutCard.tsx` | Nova prop `autoStartSession`; effect que auto-entra em session mode |

Nenhuma mudanca no banco de dados. A logica de rehydrate do `useWorkoutSession` ja funciona -- so precisamos garantir que o componente monte.
