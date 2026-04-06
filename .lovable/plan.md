

# Plano: Mensagem direta do Admin + Benefícios flexíveis na campanha

## Parte 1 — Sistema de mensagem direta do Admin no Suporte

### Problema
Hoje o admin só consegue responder conversas existentes. Não há como iniciar uma conversa com um cliente que ainda não abriu um chat de suporte.

### Solução
Adicionar um botão "Nova Mensagem" no topo da página AdminSuporteChats que abre um modal com:
- Campo de busca que filtra clientes ativos (por nome ou email) da tabela `profiles`
- Ao selecionar um cliente, abre campo de texto para escrever a mensagem
- Ao enviar, cria uma nova entrada na tabela `conversas` com `tipo: 'admin_direct'` e a mensagem do admin
- O cliente verá essa mensagem ao abrir o suporte normalmente

### Alteração em `src/pages/admin/AdminSuporteChats.tsx`
- Novo estado para modal de "Nova Mensagem"
- Busca de clientes via `profiles` com filtro de texto
- Lista selecionável de clientes
- Criação de nova conversa via `supabase.from("conversas").insert()`

---

## Parte 2 — Benefícios flexíveis no pop-up de campanha

### Problema
O formulário de criação de campanha (`ReferralCampaignManager`) só permite regras de cashback com `plan_type` + `cashback_amount` (multiplicador numérico). O admin quer poder definir benefícios variados como:
- 10%, 20%, 30% de desconto no plano
- Consulta de 30 min com Gabriel Baú
- Texto livre personalizado

### Solução
Alterar a estrutura de `cashback_rules` para aceitar benefícios flexíveis:

```typescript
interface BenefitRule {
  benefit_type: "discount_percent" | "consultation" | "custom";
  label: string;        // ex: "20% de desconto", "Consulta 30min"
  description: string;  // texto livre do admin
  value?: number;       // percentual ou valor numérico (opcional)
}
```

### Alterações em `src/components/admin/ReferralCampaignManager.tsx`
- Substituir interface `CashbackRule` por `BenefitRule`
- Adicionar select de tipo de benefício (Desconto %, Consulta, Personalizado)
- Campo `label` editável pelo admin
- Campo `description` com texto livre
- Campo numérico condicional (só para desconto %)

### Alterações em `src/components/referral/ReferralCampaignPopup.tsx`
- Atualizar renderização para mostrar os novos campos (`label` + `description`) em vez de `plan_type: Nx cashback`
- Manter retrocompatibilidade com regras antigas (se `plan_type` existir, renderiza no formato antigo)

## Arquivos modificados
- `src/pages/admin/AdminSuporteChats.tsx`
- `src/components/admin/ReferralCampaignManager.tsx`
- `src/components/referral/ReferralCampaignPopup.tsx`

Nenhuma migração necessária — os campos JSONB já suportam qualquer estrutura.

