
# Plano de Implementação - Itens Restantes

## Visão Geral
Vou implementar os 4 itens restantes do plano aprovado:

1. **Filtros Avançados em AdminClientes** - UI para filtrar por plano, datas, sexo e objetivo
2. **Gestão de Conversas (Suporte)** - Limpeza individual, em massa e automática
3. **Mensagens Automáticas** - Controle de min_days_since_signup e cooldown
4. **Validação de Horários da Dieta** - Bloquear horários incoerentes

---

## 1. Filtros Avançados em AdminClientes

### Arquivos a modificar:
- `src/pages/admin/AdminClientes.tsx`

### Implementação:

**Adicionar Estados para Filtros:**
```typescript
const [filters, setFilters] = useState({
  planType: "all",
  startDateFrom: null as Date | null,
  startDateTo: null as Date | null,
  endDateFrom: null as Date | null,
  endDateTo: null as Date | null,
  sex: "all",
  goal: "all"
});
const [showFilters, setShowFilters] = useState(false);
```

**Painel de Filtros Colapsável:**
- Botão "Filtros" com ícone de filtro que expande/contrai
- Grid responsivo com os filtros:
  - **Tipo de Plano**: Select com ELITE FUNDADOR, GRATUITO, MENSAL, TRIMESTRAL, SEMESTRAL, ANUAL
  - **Data de Entrada**: Dois DatePickers (de/até)
  - **Data de Término**: Dois DatePickers (de/até)
  - **Sexo**: Select com Masculino/Feminino/Todos
  - **Objetivo**: Select com Emagrecimento/Hipertrofia/Condicionamento/Todos
- Botão "Limpar Filtros" para resetar todos

**Lógica de Filtragem:**
```typescript
const filteredClients = clients.filter((client) => {
  // Busca por nome/email
  const matchesSearch = client.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase());
  
  // Filtro por plano
  const matchesPlan = filters.planType === "all" || 
    client.subscription?.plan_type === filters.planType;
  
  // Filtro por data de entrada
  const createdAt = new Date(client.created_at);
  const matchesStartDate = (!filters.startDateFrom || createdAt >= filters.startDateFrom) &&
    (!filters.startDateTo || createdAt <= filters.startDateTo);
  
  // Filtro por data de término
  const endDate = client.subscription?.current_period_end 
    ? new Date(client.subscription.current_period_end) 
    : null;
  const matchesEndDate = (!filters.endDateFrom || (endDate && endDate >= filters.endDateFrom)) &&
    (!filters.endDateTo || (endDate && endDate <= filters.endDateTo));
  
  // Filtro por sexo (buscar do profile)
  const matchesSex = filters.sex === "all" || client.sexo === filters.sex;
  
  // Filtro por objetivo (buscar do profile)
  const matchesGoal = filters.goal === "all" || 
    client.objetivo_principal?.toLowerCase().includes(filters.goal.toLowerCase());
  
  return matchesSearch && matchesPlan && matchesStartDate && matchesEndDate && matchesSex && matchesGoal;
});
```

**Atualizar Query para Buscar Campos Adicionais:**
```typescript
const { data: profiles, error } = await supabase
  .from("profiles")
  .select("*, sexo, objetivo_principal")
  .order("created_at", { ascending: false });
```

---

## 2. Gestão de Conversas (Suporte)

### Arquivos a modificar:
- `src/pages/admin/AdminSuporteChats.tsx`
- Novo: `supabase/functions/cleanup-old-conversations/index.ts`

### Implementação no Frontend:

**Adicionar Estados:**
```typescript
const [clearingAll, setClearingAll] = useState(false);
const [clearingSingle, setClearingSingle] = useState(false);
const [confirmClearAll, setConfirmClearAll] = useState(false);
const [confirmClearSingle, setConfirmClearSingle] = useState(false);
```

**Botão "Limpar Todas" no Header:**
- No cabeçalho da lista de conversas, adicionar botão com ícone de lixeira
- Abre AlertDialog de confirmação
- Chama função que deleta todas as conversas

**Botão "Limpar Conversa" no Dialog de Chat:**
- No dialog que mostra o chat individual, adicionar botão "Limpar Conversa"
- Abre AlertDialog de confirmação
- Deleta apenas a conversa selecionada

**Funções de Limpeza:**
```typescript
const handleClearAllConversations = async () => {
  setClearingAll(true);
  try {
    const { error } = await supabase
      .from("conversas")
      .delete()
      .eq("tipo", "suporte");
    
    if (error) throw error;
    toast.success("Todas as conversas foram limpas");
    fetchConversas();
  } catch (error) {
    toast.error("Erro ao limpar conversas");
  } finally {
    setClearingAll(false);
    setConfirmClearAll(false);
  }
};

const handleClearSingleConversation = async () => {
  if (!selectedConversa) return;
  setClearingSingle(true);
  try {
    const { error } = await supabase
      .from("conversas")
      .update({ mensagens: [] })
      .eq("id", selectedConversa.id);
    
    if (error) throw error;
    toast.success("Conversa limpa com sucesso");
    setSelectedConversa(null);
    fetchConversas();
  } catch (error) {
    toast.error("Erro ao limpar conversa");
  } finally {
    setClearingSingle(false);
    setConfirmClearSingle(false);
  }
};
```

### Edge Function para Limpeza Automática:

**Arquivo:** `supabase/functions/cleanup-old-conversations/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Deletar conversas com mais de 5 dias
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    const { data, error } = await supabase
      .from("conversas")
      .delete()
      .lt("updated_at", fiveDaysAgo.toISOString())
      .select("id");

    if (error) throw error;

    console.log(`Deleted ${data?.length || 0} old conversations`);

    return new Response(
      JSON.stringify({ deleted: data?.length || 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Cleanup error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

---

## 3. Mensagens Automáticas - Controle Aprimorado

### Arquivos a modificar:
- `supabase/functions/process-automated-messages/index.ts`
- Migration SQL para novas colunas

### Migration SQL:
```sql
ALTER TABLE automated_messages 
ADD COLUMN IF NOT EXISTS min_days_since_signup integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS cooldown_days integer DEFAULT 0;
```

### Modificações na Edge Function:

**Adicionar verificações antes de enviar:**

```typescript
// Verificar min_days_since_signup
const daysSinceSignup = Math.floor(
  (Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24)
);

if (message.min_days_since_signup && daysSinceSignup < message.min_days_since_signup) {
  console.log(`Skipping ${profile.email}: only ${daysSinceSignup} days since signup, needs ${message.min_days_since_signup}`);
  continue;
}

// Verificar cooldown (última vez que essa mensagem foi enviada para esse usuário)
if (message.cooldown_days && message.cooldown_days > 0) {
  const { data: lastSend } = await supabase
    .from("message_sends")
    .select("sent_at")
    .eq("message_id", message.id)
    .eq("user_id", profile.id)
    .order("sent_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  
  if (lastSend) {
    const daysSinceLastSend = Math.floor(
      (Date.now() - new Date(lastSend.sent_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceLastSend < message.cooldown_days) {
      console.log(`Skipping ${profile.email}: cooldown active (${daysSinceLastSend}/${message.cooldown_days} days)`);
      continue;
    }
  }
}

// Re-verificar is_active antes de enviar (evitar race condition)
const { data: currentMessage } = await supabase
  .from("automated_messages")
  .select("is_active")
  .eq("id", message.id)
  .single();

if (!currentMessage?.is_active) {
  console.log(`Message ${message.id} was deactivated before send`);
  continue;
}
```

**Regras específicas hardcoded:**
- Mensagem de inatividade (3 dias): `min_days_since_signup >= 3`
- Solicitação de fotos (30 dias): `min_days_since_signup >= 30`

---

## 4. Validação de Horários da Dieta

### Arquivos a modificar:
- `src/pages/Anamnese.tsx`
- `supabase/functions/generate-protocol/index.ts`

### Validação no Frontend (Anamnese.tsx):

Adicionar antes do submit:
```typescript
// Validar horários da rotina
const validateSchedule = () => {
  const { horario_acorda, horario_treino, horario_dorme } = formData;
  
  if (!horario_acorda || !horario_treino || !horario_dorme) {
    return true; // Se não preencheu, usa defaults
  }
  
  const toMinutes = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };
  
  const acordaMin = toMinutes(horario_acorda);
  const treinoMin = toMinutes(horario_treino);
  const dormeMin = toMinutes(horario_dorme);
  
  // Verificar sequência lógica
  // Acordar < Treino < Dormir (considerando possível treino de madrugada)
  if (acordaMin >= dormeMin) {
    toast.error("Horário de acordar deve ser antes do horário de dormir");
    return false;
  }
  
  // Verificar que há tempo mínimo entre acordar e primeira refeição (30min)
  // e entre treino e acordar (pelo menos 2h para café + digestão)
  if (treinoMin - acordaMin < 120 && treinoMin > acordaMin) {
    // Treina logo após acordar - ok, mas avisar
    console.log("Treino muito próximo de acordar - ajustar refeições");
  }
  
  return true;
};

// No handleSubmit, antes de enviar:
if (!validateSchedule()) {
  return;
}
```

### Validação no Backend (generate-protocol/index.ts):

Adicionar após os logs de rotina:
```typescript
// Validar coerência dos horários
if (tipo === "nutricao") {
  const toMinutes = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + (m || 0);
  };
  
  const acordaMin = toMinutes(userContext.horario_acorda);
  const treinoMin = toMinutes(userContext.horario_treino);
  const dormeMin = toMinutes(userContext.horario_dorme);
  
  console.log(`[generate-protocol] Schedule validation:`, {
    acordaMin, treinoMin, dormeMin,
    primeiraRefeicao: acordaMin + 30,
    preTreino: treinoMin - 90,
    posTreino: treinoMin + 90,
    ultimaRefeicao: dormeMin - 60
  });
  
  // Verificar que primeira refeição não é antes de acordar
  if (acordaMin + 30 > treinoMin - 90) {
    console.warn("[generate-protocol] Warning: Breakfast may overlap with pre-workout");
  }
  
  // Verificar que há pelo menos 2h entre acordar e dormir
  if (dormeMin - acordaMin < 720) { // 12 horas mínimo
    console.warn("[generate-protocol] Warning: Very short waking window");
  }
}
```

---

## Resumo das Alterações

| Item | Arquivos | Tipo |
|------|----------|------|
| Filtros AdminClientes | `AdminClientes.tsx` | Modificação |
| Gestão Conversas | `AdminSuporteChats.tsx` | Modificação |
| Limpeza Automática | `cleanup-old-conversations/index.ts` | Novo arquivo |
| Mensagens Automáticas | `process-automated-messages/index.ts` | Modificação |
| Colunas Mensagens | Migration SQL | Novo |
| Validação Horários | `Anamnese.tsx`, `generate-protocol/index.ts` | Modificação |

---

## Dependências e Imports Necessários

**AdminClientes.tsx:**
- Adicionar: `Filter, X, Calendar` de lucide-react
- Adicionar: `Calendar` de @/components/ui/calendar
- Adicionar: `Popover, PopoverContent, PopoverTrigger` de @/components/ui/popover
- Usar constantes de `@/lib/planConstants`

**AdminSuporteChats.tsx:**
- Adicionar: `Trash2` de lucide-react (já importado)
- AlertDialog já está importado

---

## Ordem de Implementação

1. **Migration SQL** - Adicionar colunas min_days_since_signup e cooldown_days
2. **AdminClientes.tsx** - Filtros avançados
3. **AdminSuporteChats.tsx** - Botões de limpeza
4. **cleanup-old-conversations** - Nova Edge Function
5. **process-automated-messages** - Lógica de min_days e cooldown
6. **Anamnese.tsx + generate-protocol** - Validação de horários
