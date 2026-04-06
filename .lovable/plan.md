

# Plano: Pop-up de renovação de protocolo na área do cliente (30 e 90 dias)

## Objetivo
Criar um modal/pop-up que aparece automaticamente quando o cliente entra no dashboard, nos marcos de 30 e 90 dias do protocolo ativo, explicando a importância de enviar dados de evolução para renovar/ajustar o treino.

## Alterações

### 1. Novo componente `ProtocolRenewalPopup.tsx`
- Modal (Dialog) que aparece automaticamente ao abrir o dashboard
- **30 dias**: tom motivacional — "Seu protocolo completou 30 dias! Para ajustarmos seu treino, nutrição e mentalidade, envie suas fotos e medidas de evolução."
- **90 dias**: tom urgente — "Seu protocolo completou 90 dias! Um novo protocolo é essencial para continuar evoluindo. Envie seus dados agora."
- Explica em 3-4 bullet points por que a troca é importante (adaptação muscular, platô, novos estímulos)
- Botão principal "Enviar Evolução" → navega para `/evolucao`
- Botão secundário "Lembrar depois"
- Controle via `localStorage` para não mostrar mais de 1x por semana (chave com timestamp do último dismiss)

### 2. Atualizar `Dashboard.tsx`
- Importar e renderizar `ProtocolRenewalPopup` passando `daysSinceLastProtocol` (já calculado)
- O pop-up aparece se dias ≥ 28 (pré-30) ou ≥ 85 (pré-90) e não foi dispensado nos últimos 7 dias

### 3. Atualizar Edge Function `check-protocol-renewal`
- Adicionar marco de 90 dias (além dos 30 e 60 já existentes) com mensagem específica de "novo protocolo completo"

## Arquivos
- **Novo**: `src/components/dashboard/ProtocolRenewalPopup.tsx`
- **Editar**: `src/pages/Dashboard.tsx`
- **Editar**: `supabase/functions/check-protocol-renewal/index.ts`

