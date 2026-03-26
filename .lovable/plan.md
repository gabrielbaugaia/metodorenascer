

# Plano: Pop-up de Campanha "Indique e Ganhe" + Gestão Admin de Banners

## O que será criado

1. **Admin Dashboard**: Seção para criar/gerenciar campanhas de indicação com upload de banner (imagem), texto, e definição de benefícios/cashback por plano fechado
2. **Pop-up no cliente**: Ao logar, o aluno vê um modal com o banner da campanha ativa, seu código de indicação, e botão para compartilhar. Aparece uma vez por sessão (controlado via localStorage)
3. **Regras de cashback por plano**: O admin define qual plano gera cashback e quanto, vinculando ao sistema de referral já existente

## Estrutura técnica

### 1. Tabela `referral_campaigns` (migration)

```
id, title, description, banner_image_url, 
cashback_rules (jsonb - ex: [{ plan_type: "trimestral", cashback_amount: 1 }]),
active (boolean), starts_at, ends_at, created_at, updated_at
```

RLS: admin ALL, usuários autenticados SELECT (apenas campanhas ativas).

### 2. Storage

Reutilizar bucket `blog-assets` (público) para upload dos banners de campanha.

### 3. Componente Pop-up: `src/components/referral/ReferralCampaignPopup.tsx`

- Ao montar o Dashboard do cliente, busca campanha ativa (`active = true` e dentro do período)
- Se existe e não foi vista nesta sessão (`sessionStorage`), exibe modal com:
  - Banner (imagem full-width)
  - Código de indicação do aluno (já existe em `referral_codes`)
  - Botões "Copiar Link" e "Compartilhar WhatsApp"
  - Botão fechar / "Não mostrar novamente"
- Exibido para TODOS os clientes autenticados com assinatura ativa

### 4. Admin: `src/components/admin/ReferralCampaignManager.tsx`

- Card no AdminDashboard para gerenciar campanhas
- Upload de imagem (banner)
- Campos: título, descrição, regras de cashback por plano
- Toggle ativo/inativo
- Apenas 1 campanha ativa por vez (ao ativar uma, desativa as outras)

### 5. Integração com cashback existente

O sistema de cashback já funciona (`increment_cashback_balance`, `profiles.cashback_balance`). A novidade é que as `cashback_rules` da campanha definem QUAIS planos geram cashback e quanto, refinando o comportamento atual.

## Arquivos

| Arquivo | Ação |
|---|---|
| Migration SQL | Criar tabela `referral_campaigns` com RLS |
| `src/components/referral/ReferralCampaignPopup.tsx` | Novo - modal/pop-up para o cliente |
| `src/components/admin/ReferralCampaignManager.tsx` | Novo - gestão de campanhas no admin |
| `src/pages/Dashboard.tsx` | Adicionar `<ReferralCampaignPopup />` |
| `src/pages/admin/AdminDashboard.tsx` | Adicionar seção de campanhas de indicação |

