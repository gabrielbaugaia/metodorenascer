

# Plano: Notificações automáticas de renovação de protocolo (30d ajuste / 60d novo)

## Objetivo

Notificar o cliente automaticamente quando o protocolo ativo completar 30 dias (enviar dados de evolução para ajuste) e 60 dias (protocolo novo necessário). Inclui notificação in-app + push + email.

## Como funciona

```text
Protocolo criado (dia 0)
  └─ Dia 30 → Push + banner: "Envie fotos e medidas para ajustarmos seu protocolo"
  └─ Dia 60 → Push + banner: "Seu protocolo expirou. Envie evolução para gerar o novo"
```

## Alterações

### 1. Nova Edge Function `check-protocol-renewal/index.ts`
- Busca todos os protocolos ativos (`ativo = true`) com `data_geracao`
- Calcula dias desde a geração
- Para cada usuário com protocolo ≥ 30 dias (e < 60): envia push + email de "ajuste" (se ainda não enviou nos últimos 7 dias)
- Para ≥ 60 dias: envia push + email de "novo protocolo"
- Usa `message_sends` para controle de cooldown (não reenviar se já notificou recentemente)
- Será agendada via `pg_cron` para rodar diariamente

### 2. Novo componente `ProtocolRenewalBanner.tsx`
- Card/banner exibido no Dashboard quando protocolo ativo tem ≥ 28 dias
- 28-59 dias: banner amarelo "Seu protocolo completa 30 dias. Envie seus dados de evolução para ajustarmos"
- ≥ 60 dias: banner vermelho "Protocolo expirado. Envie fotos e medidas para gerar seu novo protocolo"
- Botão de ação → direciona para página de Evolução

### 3. Atualizar `notification_preferences`
- Migração: adicionar coluna `protocol_renewal_enabled boolean default true`
- Toggle nas configurações de notificação

### 4. Atualizar `NotificationSettings.tsx`
- Novo toggle "Lembrete de renovação de protocolo"

### 5. Atualizar `Dashboard.tsx`
- Incluir `ProtocolRenewalBanner` no topo do dashboard

## Arquivos
- **Novo**: `supabase/functions/check-protocol-renewal/index.ts`
- **Novo**: `src/components/dashboard/ProtocolRenewalBanner.tsx`
- **Migração**: adicionar `protocol_renewal_enabled` em `notification_preferences`
- **Editar**: `src/components/notifications/NotificationSettings.tsx`
- **Editar**: `src/pages/Dashboard.tsx`
- **Editar**: `src/hooks/usePushNotifications.ts` (incluir novo campo)

