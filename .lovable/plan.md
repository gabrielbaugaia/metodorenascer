
# HOTFIX P0 - Método Renascer: Treinos, Performance e Padronização de Planos

## Diagnóstico Completo

### Problema 1: Treinos não aparecem corretamente
**Status**: Identificado e parcialmente corrigido

A página `/treino` estava crashando com `TypeError: Cannot read properties of undefined (reading 'filter')`. Já foi aplicada correção defensiva no `useWorkoutTracking.ts`.

**Problemas residuais identificados**:
1. **Dois formatos de protocolo coexistem**: Protocolos mais antigos usam formato `semanas[].dias[]`, enquanto os novos usam `treinos[]` com `letra`, `foco`, `exercicios`. O código já trata ambos, mas há inconsistência na experiência.
2. **Falta timeout nas requisições**: Sem timeout, a página pode ficar "travada" indefinidamente se o Supabase demorar a responder.
3. **Falta instrumentação de tempo**: Não há logs de performance para identificar gargalos.

### Problema 2: Performance (2+ minutos de carregamento)
**Causa identificada**:
1. **Múltiplas queries paralelas sem timeout**: A página de treino faz 2 queries separadas (protocolo + completions) sem limite de tempo.
2. **Service Worker está correto**: Já usa estratégia network-first para JS/CSS (evita bundles antigos).
3. **Falta estado de erro visível**: Usuário não vê feedback se algo falhar.

### Problema 3: Dados legados de planos
**Dados encontrados no banco**:
```text
plan_type=gratuito, plan_name=GRATUITO: 16 registros
plan_type=elite_fundador, plan_name=ELITE FUNDADOR: 1 registro
plan_type=free, plan_name=GRATUITO: 1 registro (LEGADO)
plan_type=embaixador, plan_name=ELITE Fundador: 1 registro (LEGADO)
```

Existem 2 registros com nomenclatura antiga que precisam de migração.

### Problema 4: Filtros de clientes
**Status**: Já implementado e funcional

O código em `AdminClientes.tsx` já possui filtros avançados para:
- Tipo de plano
- Sexo
- Objetivo
- Data de cadastro (De/Até)
- Data de término (De/Até)

O filtro está disponível clicando no botão "Filtros" no painel.

### Problema 5: Duração do plano gratuito
**Status**: Já implementado

O código em `AdminCriarCliente.tsx` e `AdminConvites.tsx` já permite selecionar duração do gratuito (7, 14, 21, 30, 60, 90, 120, 180, 365 dias).

---

## Plano de Implementação

### ETAPA 1: Correções de Performance e Estabilidade (P0)

#### 1.1 Adicionar timeout + retry no fetch de protocolo

**Arquivo**: `src/pages/Treino.tsx`

Modificar o `useEffect` de fetch do protocolo para incluir:
- Timeout de 10 segundos via `AbortController`
- Contador de retry (máx 2 tentativas)
- Log de tempo de resposta no console
- Estado de erro visível com botão de "Tentar novamente"

```typescript
const [error, setError] = useState<string | null>(null);
const [retryCount, setRetryCount] = useState(0);

useEffect(() => {
  const fetchProtocol = async () => {
    if (!user) return;
    
    setError(null);
    const startTime = performance.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    try {
      console.log("[Treino] Fetching protocol for user:", user.id);
      
      const { data, error } = await supabase
        .from("protocolos")
        .select("id, conteudo")
        .eq("user_id", user.id)
        .eq("tipo", "treino")
        .eq("ativo", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
        .abortSignal(controller.signal);
      
      clearTimeout(timeoutId);
      const elapsed = Math.round(performance.now() - startTime);
      console.log(`[Treino] Protocol fetch completed in ${elapsed}ms`);
      
      if (error) throw error;
      if (data) setProtocol(data as Protocol);
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error("[Treino] Error:", err);
      
      if (err.name === 'AbortError') {
        setError("Tempo esgotado. Verifique sua conexão.");
      } else {
        setError("Erro ao carregar treino.");
      }
    } finally {
      setLoading(false);
    }
  };

  fetchProtocol();
}, [user, retryCount]);
```

#### 1.2 Adicionar timeout no hook useWorkoutTracking

**Arquivo**: `src/hooks/useWorkoutTracking.ts`

Adicionar timeout de 8 segundos no `fetchCompletions`:

```typescript
const fetchCompletions = useCallback(async () => {
  if (!user) {
    setCompletions([]);
    setLoading(false);
    return;
  }

  const startTime = performance.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const { data, error } = await supabase
      .from("workout_completions")
      .select("*")
      .eq("user_id", user.id)
      .order("workout_date", { ascending: false })
      .abortSignal(controller.signal);

    clearTimeout(timeoutId);
    console.log(`[WorkoutTracking] Fetch completed in ${Math.round(performance.now() - startTime)}ms`);

    if (error) throw error;
    setCompletions(data || []);
    // ... resto do código
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error("[WorkoutTracking] Error:", error);
    setCompletions([]); // Fallback seguro
  } finally {
    setLoading(false);
  }
}, [user]);
```

#### 1.3 UI de erro com retry na página Treino

Adicionar estado de erro e botão de retry na renderização:

```typescript
if (error) {
  return (
    <ClientLayout>
      <div className="max-w-4xl mx-auto">
        <Card className="p-8 text-center border-destructive/50">
          <AlertTriangle className="w-16 h-16 mx-auto text-destructive mb-4" />
          <h3 className="text-xl font-semibold mb-2">Erro ao carregar</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => setRetryCount(c => c + 1)}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar novamente
            </Button>
            <Button variant="fire" onClick={() => navigate("/suporte")}>
              Falar com Suporte
            </Button>
          </div>
        </Card>
      </div>
    </ClientLayout>
  );
}
```

---

### ETAPA 2: Migração de Dados Legados (P1)

#### 2.1 Normalizar plan_type no banco

Executar migração SQL para padronizar os 2 registros legados:

```sql
-- Normalizar "free" para "gratuito"
UPDATE subscriptions 
SET plan_type = 'gratuito', plan_name = 'GRATUITO'
WHERE plan_type = 'free';

-- Normalizar "embaixador" para "elite_fundador"
UPDATE subscriptions 
SET plan_type = 'elite_fundador', plan_name = 'ELITE FUNDADOR'
WHERE plan_type = 'embaixador';
```

#### 2.2 Corrigir mapeamento no check-subscription

**Arquivo**: `supabase/functions/check-subscription/index.ts`

Atualizar o mapeamento de preços para usar nomes padronizados:

```typescript
const PRICE_TO_PLAN: Record<string, { type: string; name: string }> = {
  "price_1ScZqTCuFZvf5xFdZuOBMzpt": { type: "elite_fundador", name: "ELITE FUNDADOR" },
  "price_1ScZrECuFZvf5xFdfS9W8kvY": { type: "mensal", name: "MENSAL" },
  "price_1ScZsTCuFZvf5xFdbW8kJeQF": { type: "trimestral", name: "TRIMESTRAL" },
  "price_1ScZtrCuFZvf5xFd8iXDfbEp": { type: "semestral", name: "SEMESTRAL" },
  "price_1ScZvCCuFZvf5xFdjrs51JQB": { type: "anual", name: "ANUAL" },
};
```

---

### ETAPA 3: Auditoria de Protocolos para Admin (P1)

#### 3.1 Adicionar indicador visual de protocolo no Admin

**Arquivo**: `src/pages/admin/AdminClientes.tsx`

Adicionar badge na lista de clientes indicando se tem protocolo de treino:

- Buscar protocolos ativos junto com o fetch de clientes
- Mostrar badge "Treino ✓" ou "Sem Treino" na tabela
- Permitir filtro por "tem/não tem protocolo"

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/Treino.tsx` | Timeout, retry, estado de erro, logs de performance |
| `src/hooks/useWorkoutTracking.ts` | Timeout com AbortController, logs |
| `supabase/functions/check-subscription/index.ts` | Corrigir mapeamento de planos (embaixador → elite_fundador) |
| **Migração SQL** | Normalizar 2 registros legados no banco |

---

## Checklist de Validação

### Antes de Deploy
- [ ] Verificar que timeout funciona (simular rede lenta com DevTools)
- [ ] Confirmar que erro é exibido após 10s sem resposta
- [ ] Testar botão "Tentar novamente"
- [ ] Verificar logs no console com tempos de resposta

### Após Deploy - Testes Obrigatórios

#### Teste 1: Performance da Página de Treino
```text
1. Acessar metodo.renascerapp.com.br/treino
2. Medir tempo até exibição completa (deve ser < 3s)
3. Repetir 10 vezes seguidas
4. Verificar console para logs de tempo
```

#### Teste 2: Treinos Aparecem Corretamente
```text
1. Logar como cliente com protocolo gerado (ex: vinicius.hs@outlook.com)
2. Acessar /treino
3. Verificar que aparecem os treinos A, B, C, D, E, F
4. Clicar em um treino para expandir
5. Confirmar que exercícios aparecem com nome, séries, reps, descanso
```

#### Teste 3: Fluxo Admin → Cliente
```text
1. Logar como admin
2. Acessar /admin/clientes
3. Clicar em um cliente
4. Gerar protocolo de treino
5. Verificar que badge "Treino ✓" aparece
6. Logar como esse cliente
7. Acessar /treino e confirmar visualização
```

#### Teste 4: Planos Padronizados
```text
1. Executar query: SELECT DISTINCT plan_type, plan_name FROM subscriptions;
2. Confirmar que não existem mais "free" ou "embaixador"
3. Apenas: gratuito, elite_fundador, mensal, trimestral, semestral, anual
```

---

## Como Validar em Produção

### Passo 1: Verificar Performance
```bash
# No DevTools do navegador (F12):
# 1. Aba Network → limpar logs
# 2. Acessar /treino
# 3. Verificar tempo total de carregamento
# 4. Filtrar por "protocolos" para ver tempo da query
```

### Passo 2: Verificar Treinos
```bash
# Console do navegador:
# Procurar por logs iniciando com [Treino]
# Exemplo: "[Treino] Protocol fetch completed in 245ms"
```

### Passo 3: Verificar Migração SQL
```sql
-- Executar no painel Cloud View > Run SQL:
SELECT plan_type, plan_name, COUNT(*) 
FROM subscriptions 
GROUP BY plan_type, plan_name;
```

---

## Resumo das Prioridades

| # | Item | Status Atual | Ação |
|---|------|--------------|------|
| P0 | Treinos não aparecem | Parcialmente corrigido | Adicionar timeout + UI de erro |
| P0 | Performance 2+ min | Não resolvido | Implementar timeout e logs |
| P1 | Planos padronizados | Código OK, dados legados | Migração SQL |
| P2 | Filtros clientes | JÁ IMPLEMENTADO | Nenhuma - só validar |
| P2 | Duração gratuito | JÁ IMPLEMENTADO | Nenhuma - só validar |

---

## Seção Técnica Detalhada

### Estrutura do Protocolo de Treino

Formato novo (preferido):
```json
{
  "treinos": [
    {
      "letra": "A",
      "foco": "Peito e Tríceps",
      "duracao_minutos": 50,
      "exercicios": [
        {
          "nome": "Supino Reto",
          "series": 4,
          "repeticoes": "10-12",
          "descanso": "60s",
          "dicas": "Controle a descida",
          "video_url": "https://..."
        }
      ]
    }
  ]
}
```

Formato legado (ainda suportado):
```json
{
  "semanas": [
    {
      "semana": 1,
      "dias": [
        {
          "dia": "Segunda",
          "foco": "Peito",
          "exercicios": [...]
        }
      ]
    }
  ]
}
```

O código em `Treino.tsx` já trata ambos os formatos no `useMemo` (linhas 107-161).

### RLS Policies

A tabela `protocolos` já possui RLS corretamente configurada:
- Usuários veem apenas seus próprios protocolos
- Admins veem todos os protocolos
- Não há problema de permissão identificado
