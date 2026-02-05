
# Plano: Sistema de Planos Comerciais + Free Trial com Controle Granular

## Resumo Executivo

Este e um projeto de media-alta complexidade que envolve a criacao de uma nova arquitetura de controle de acesso por modulo, sistema de trial com limites granulares, e fluxo de upgrade integrado.

---

## Arquitetura Proposta

### Nova Estrutura de Dados

**1. Tabela `commercial_plans` (novos planos comerciais)**

| Campo | Tipo | Descricao |
|-------|------|-----------|
| id | uuid | PK |
| slug | text | Identificador unico (treino, treino_dieta, completo, nutricao_receitas) |
| name | text | Nome exibido |
| price_cents | integer | Preco em centavos |
| stripe_price_id | text | ID do Stripe |
| features | jsonb | Lista de features |
| modules_access | jsonb | Modulos liberados |
| is_active | boolean | Ativo para venda |
| is_popular | boolean | Destacado na UI |
| sort_order | integer | Ordem de exibicao |

**2. Tabela `trial_campaigns` (campanhas de trial)**

| Campo | Tipo | Descricao |
|-------|------|-----------|
| id | uuid | PK |
| name | text | Nome da campanha |
| duration_days | integer | Duracao (ex: 7) |
| is_active | boolean | Campanha ativa |
| module_limits | jsonb | Limites por modulo |
| created_at | timestamp | Data de criacao |

**3. Tabela `user_module_access` (controle granular por usuario)**

| Campo | Tipo | Descricao |
|-------|------|-----------|
| id | uuid | PK |
| user_id | uuid | FK para usuario |
| module | text | Nome do modulo |
| access_level | text | full, limited, none |
| limits | jsonb | Limites especificos |
| trial_campaign_id | uuid | Campanha de trial (se aplicavel) |

---

## Modulos e Niveis de Acesso

| Modulo | Completo | Trial | Bloqueado |
|--------|----------|-------|-----------|
| **Treino** | Todos os treinos, PDF, historico | 1 treino apenas | Tela de upgrade |
| **Nutricao** | Plano completo, ajustes, PDF | Preview de 1 dia | Tela de upgrade |
| **Mindset** | Todos os modulos | 1 modulo | Tela de upgrade |
| **Receitas** | Gerador ilimitado | 3 receitas | Tela de upgrade |
| **Dashboard** | Sempre liberado | Sempre liberado | - |
| **Check-ins** | Sempre liberado | Sempre liberado | - |
| **Suporte** | Chat com mentor | Chat com mentor | - |

---

## Planos Comerciais

### Plano 1: Treino (R$ XX/mes)
```json
{
  "modules_access": {
    "treino": "full",
    "dashboard": "full",
    "checkins": "full",
    "nutricao": "none",
    "mindset": "none",
    "receitas": "none"
  }
}
```

### Plano 2: Treino + Dieta (R$ XX/mes)
```json
{
  "modules_access": {
    "treino": "full",
    "nutricao": "full",
    "dashboard": "full",
    "checkins": "full",
    "mindset": "none",
    "receitas": "none"
  }
}
```

### Plano 3: Completo (R$ XX/mes)
```json
{
  "modules_access": {
    "treino": "full",
    "nutricao": "full",
    "mindset": "full",
    "receitas": "full",
    "dashboard": "full",
    "checkins": "full",
    "protocolos": "full"
  }
}
```

### Plano 4: Nutricao + Receitas (R$ XX/mes)
```json
{
  "modules_access": {
    "nutricao": "full",
    "receitas": "full",
    "dashboard": "full",
    "checkins": "full",
    "treino": "none",
    "mindset": "none"
  }
}
```

---

## Sistema de Free Trial (7 dias)

### Configuracao de Limites (Editavel pelo Admin)

```json
{
  "trial_limits": {
    "treino": {
      "access_level": "limited",
      "max_workouts_visible": 1,
      "allow_pdf_download": false,
      "allow_history": false
    },
    "nutricao": {
      "access_level": "limited",
      "max_meals_visible": 2,
      "show_full_plan": false,
      "allow_pdf_download": false
    },
    "mindset": {
      "access_level": "limited",
      "max_modules_visible": 1
    },
    "receitas": {
      "access_level": "limited",
      "max_recipes_per_day": 1,
      "total_recipes_allowed": 3
    }
  }
}
```

---

## Fluxo de Upgrade (Conteudo Bloqueado)

Quando usuario trial clicar em conteudo bloqueado:

```text
+---------------------------------------------------+
|                  [X]                              |
|                                                   |
|           Desbloqueie Acesso Completo             |
|                                                   |
|   Voce esta no periodo de teste gratuito.         |
|   Faca upgrade para ter acesso a:                 |
|                                                   |
|   [check] Todos os treinos personalizados         |
|   [check] Plano nutricional completo              |
|   [check] Biblioteca de receitas ilimitada        |
|   [check] Mindset e desenvolvimento pessoal       |
|   [check] Suporte prioritario com mentor          |
|                                                   |
|         [VER PLANOS E FAZER UPGRADE]              |
|                                                   |
|   Seu trial termina em X dias                     |
+---------------------------------------------------+
```

---

## Arquivos a Criar/Modificar

### Novos Arquivos

| Arquivo | Descricao |
|---------|-----------|
| `src/lib/moduleAccess.ts` | Logica central de verificacao de acesso |
| `src/hooks/useModuleAccess.ts` | Hook para verificar permissoes |
| `src/components/access/UpgradeModal.tsx` | Modal de upgrade |
| `src/components/access/LockedContent.tsx` | Wrapper para conteudo bloqueado |
| `src/components/access/TrialBadge.tsx` | Badge mostrando dias restantes |
| `src/pages/admin/AdminCommercialPlans.tsx` | Gestao de planos comerciais |
| `src/pages/admin/AdminTrialCampaigns.tsx` | Gestao de campanhas trial |

### Arquivos a Modificar

| Arquivo | Mudanca |
|---------|---------|
| `src/pages/Treino.tsx` | Adicionar verificacao de limite de treinos |
| `src/pages/Nutricao.tsx` | Adicionar verificacao de limite de refeicoes |
| `src/pages/Mindset.tsx` | Adicionar verificacao de limite de modulos |
| `src/pages/Receitas.tsx` | Adicionar contador de receitas geradas |
| `src/lib/planConstants.ts` | Adicionar novos tipos de plano |
| `src/components/auth/SubscriptionGuard.tsx` | Integrar com moduleAccess |

---

## Migracao SQL

```sql
-- 1. Tabela de planos comerciais
CREATE TABLE commercial_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  price_cents integer NOT NULL,
  stripe_price_id text,
  period_months integer DEFAULT 1,
  modules_access jsonb NOT NULL DEFAULT '{}',
  features jsonb DEFAULT '[]',
  is_active boolean DEFAULT true,
  is_popular boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Tabela de campanhas de trial
CREATE TABLE trial_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  duration_days integer NOT NULL DEFAULT 7,
  is_active boolean DEFAULT false,
  module_limits jsonb NOT NULL DEFAULT '{}',
  max_participants integer,
  current_participants integer DEFAULT 0,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Tabela de acesso por modulo do usuario
CREATE TABLE user_module_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module text NOT NULL,
  access_level text NOT NULL DEFAULT 'none',
  limits jsonb DEFAULT '{}',
  usage_count integer DEFAULT 0,
  trial_campaign_id uuid REFERENCES trial_campaigns(id),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, module)
);

-- 4. Adicionar plan_slug na subscriptions
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS commercial_plan_id uuid REFERENCES commercial_plans(id);

-- 5. Indices
CREATE INDEX idx_user_module_access_user ON user_module_access(user_id);
CREATE INDEX idx_user_module_access_module ON user_module_access(user_id, module);

-- 6. RLS
ALTER TABLE commercial_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE trial_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_module_access ENABLE ROW LEVEL SECURITY;

-- Politicas
CREATE POLICY "Anyone can view active plans" ON commercial_plans
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage plans" ON commercial_plans
FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own access" ON user_module_access
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage access" ON user_module_access
FOR ALL USING (has_role(auth.uid(), 'admin'));

-- 7. Inserir planos iniciais
INSERT INTO commercial_plans (slug, name, description, price_cents, modules_access, features, sort_order) VALUES
('treino', 'Treino', 'Acesso ao plano de treino personalizado', 9700, 
  '{"treino": "full", "dashboard": "full", "checkins": "full", "nutricao": "none", "mindset": "none", "receitas": "none"}',
  '["Treino personalizado", "Dashboard de progresso", "Check-ins semanais"]', 1),
  
('treino_dieta', 'Treino + Dieta', 'Treino e plano nutricional completo', 14700,
  '{"treino": "full", "nutricao": "full", "dashboard": "full", "checkins": "full", "mindset": "none", "receitas": "none"}',
  '["Treino personalizado", "Plano nutricional", "Dashboard", "Check-ins"]', 2),
  
('completo', 'Completo', 'Acesso total a todos os modulos', 19700,
  '{"treino": "full", "nutricao": "full", "mindset": "full", "receitas": "full", "dashboard": "full", "checkins": "full", "protocolos": "full"}',
  '["Treino", "Nutricao", "Mindset", "Receitas", "Suporte prioritario", "Atualizacoes futuras"]', 3),
  
('nutricao_receitas', 'Nutricao + Receitas', 'Foco em alimentacao saudavel', 12700,
  '{"nutricao": "full", "receitas": "full", "dashboard": "full", "checkins": "full", "treino": "none", "mindset": "none"}',
  '["Plano nutricional completo", "Gerador de receitas", "Biblioteca alimentar"]', 4);
```

---

## Hook useModuleAccess

```typescript
// src/hooks/useModuleAccess.ts
export function useModuleAccess(module: ModuleName) {
  const { user } = useAuth();
  const [access, setAccess] = useState<ModuleAccess | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        setAccess({ level: 'none', limits: {} });
        setLoading(false);
        return;
      }

      // 1. Verificar se tem plano comercial ativo
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*, commercial_plans(*)')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (subscription?.commercial_plans) {
        const planAccess = subscription.commercial_plans.modules_access[module];
        setAccess({ level: planAccess || 'none', limits: {} });
      } else {
        // 2. Verificar se esta em trial
        const { data: trialAccess } = await supabase
          .from('user_module_access')
          .select('*, trial_campaigns(*)')
          .eq('user_id', user.id)
          .eq('module', module)
          .single();

        if (trialAccess) {
          setAccess({
            level: trialAccess.access_level,
            limits: trialAccess.limits,
            usageCount: trialAccess.usage_count,
            expiresAt: trialAccess.expires_at,
            isTrialing: !!trialAccess.trial_campaign_id
          });
        } else {
          setAccess({ level: 'none', limits: {} });
        }
      }
      setLoading(false);
    };

    checkAccess();
  }, [user, module]);

  return { access, loading, hasFullAccess: access?.level === 'full' };
}
```

---

## Componente LockedContent

```typescript
// src/components/access/LockedContent.tsx
export function LockedContent({ 
  module, 
  children, 
  previewContent 
}: LockedContentProps) {
  const { access, loading } = useModuleAccess(module);
  const [showUpgrade, setShowUpgrade] = useState(false);

  if (loading) return <Skeleton />;
  
  if (access?.level === 'full') {
    return <>{children}</>;
  }

  if (access?.level === 'limited' && previewContent) {
    return (
      <>
        {previewContent}
        <UpgradePrompt 
          module={module} 
          onClick={() => setShowUpgrade(true)} 
        />
        <UpgradeModal 
          open={showUpgrade} 
          onClose={() => setShowUpgrade(false)} 
        />
      </>
    );
  }

  return (
    <LockedOverlay onClick={() => setShowUpgrade(true)}>
      <Lock className="w-12 h-12" />
      <p>Conteudo bloqueado</p>
      <Button>Ver Planos</Button>
    </LockedOverlay>
  );
}
```

---

## Painel Admin: Campanhas de Trial

```text
+---------------------------------------------------+
| CAMPANHAS DE TRIAL                                |
| Gerencie campanhas de teste gratuito              |
+---------------------------------------------------+
| [+ Nova Campanha]                                 |
+---------------------------------------------------+
| Campanha: 7 Dias Gratis - Janeiro 2026            |
| Status: [Ativa]                                   |
| Duracao: 7 dias                                   |
| Participantes: 45/100                             |
|                                                   |
| Limites por Modulo:                               |
| - Treino: 1 treino liberado                       |
| - Nutricao: 2 refeicoes visiveis                  |
| - Mindset: 1 modulo                               |
| - Receitas: 3 receitas total                      |
|                                                   |
| [Editar] [Desativar]                              |
+---------------------------------------------------+
```

---

## Ordem de Implementacao

### Fase 1: Fundacao (Dia 1-2)
1. Criar migracao SQL com tabelas
2. Criar `src/lib/moduleAccess.ts`
3. Criar `src/hooks/useModuleAccess.ts`

### Fase 2: Componentes de UI (Dia 2-3)
1. Criar `UpgradeModal.tsx`
2. Criar `LockedContent.tsx`
3. Criar `TrialBadge.tsx`

### Fase 3: Integracao nas Paginas (Dia 3-4)
1. Modificar `Treino.tsx` com limites
2. Modificar `Nutricao.tsx` com limites
3. Modificar `Mindset.tsx` com limites
4. Modificar `Receitas.tsx` com contador

### Fase 4: Admin (Dia 4-5)
1. Criar `AdminCommercialPlans.tsx`
2. Criar `AdminTrialCampaigns.tsx`
3. Integrar no menu admin

### Fase 5: Checkout e Stripe (Dia 5-6)
1. Atualizar `create-checkout` para novos planos
2. Atualizar `stripe-webhook` para ativar modulos
3. Testar fluxo completo

---

## Resumo das Entregas

| Entrega | Descricao |
|---------|-----------|
| 4 Planos Comerciais | Treino, Treino+Dieta, Completo, Nutricao+Receitas |
| Sistema de Trial | 7 dias com limites granulares |
| Controle por Modulo | Acesso full, limited ou none |
| Modal de Upgrade | Tela de conversao ao clicar em bloqueado |
| Admin de Planos | CRUD de planos comerciais |
| Admin de Campanhas | Gestao de trials |
| Metricas de Trial | Contagem de uso e conversao |

