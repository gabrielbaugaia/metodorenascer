

# Plano: 3 Ajustes — Pop-up limitado, Edição de campanha, Mensagem direta no suporte

## 1. Pop-up de renovação: máximo 2 exibições (nunca mais)

**Arquivo**: `src/components/dashboard/ProtocolRenewalPopup.tsx`

Trocar a lógica de cooldown de 7 dias para um contador permanente:
- Nova chave `localStorage`: `protocol_renewal_popup_show_count` (número)
- A cada exibição, incrementa o contador
- Se contador >= 2, nunca mais exibe
- Remover a lógica de cooldown por tempo

## 2. Edição de campanhas de indicação

**Arquivo**: `src/components/admin/ReferralCampaignManager.tsx`

- Adicionar estado `editingCampaign: Campaign | null`
- Botão de editar (ícone lápis) ao lado do toggle/delete na listagem de campanhas
- Ao clicar em editar, preenche o formulário existente com os dados da campanha selecionada
- Botão muda de "Criar Campanha" para "Salvar Alterações"
- No save, usa `.update()` em vez de `.insert()` quando `editingCampaign` existe
- Ao cancelar, limpa o estado de edição

## 3. Suporte: mensagem direta para qualquer cliente cadastrado

**Arquivo**: `src/pages/admin/AdminSuporteChats.tsx`

O modal de "Nova Mensagem" já existe (linha 536), mas precisa melhorias:
- Garantir que o modal busca clientes da tabela `profiles` independente de terem conversa
- Verificar que ao enviar, se não existe conversa para aquele `user_id`, cria uma nova com `tipo: 'admin_direct'`
- A lógica já está implementada (linhas 429-481) — verificar se funciona corretamente e se o cliente vê a notificação na área de suporte

Revisando o código, a funcionalidade de mensagem direta **já está implementada** (busca de clientes, criação/atualização de conversa). O foco será garantir que o modal esteja acessível e funcional, e que o cliente veja a mensagem ao abrir o suporte.

## Arquivos modificados
- `src/components/dashboard/ProtocolRenewalPopup.tsx`
- `src/components/admin/ReferralCampaignManager.tsx`
- `src/pages/admin/AdminSuporteChats.tsx` (verificação/ajuste menor se necessário)

