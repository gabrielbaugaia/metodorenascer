
# Plano de Correções e Melhorias - Método Renascer

## Diagnóstico Completo

Analisei todos os 9 pontos solicitados e identifiquei as causas raízes dos problemas:

---

## 1. BUG CRÍTICO - DOWNLOAD DE PDF (ADMIN)

### Problema Identificado
O erro de download de PDF da cliente Larissa acontece porque o arquivo `generateAnamnesePdf.ts` tenta fazer `fetch()` de URLs assinadas do bucket `body-photos`, mas:
1. As URLs assinadas podem expirar durante a geração do PDF
2. Erros de CORS ou timeout não são tratados adequadamente
3. A função não loga qual cliente está causando o erro

### Solução
Modificar `src/lib/generateAnamnesePdf.ts`:
- Adicionar try/catch robusto em torno de cada carregamento de imagem
- Gerar URLs assinadas fresh no momento da geração
- Adicionar logs detalhados para debug
- Aumentar o tempo de expiração das URLs assinadas para 1 hora
- Tratar graciosamente erros de imagem (continuar gerando PDF sem as fotos falhas)

**Arquivo**: `src/lib/generateAnamnesePdf.ts`

---

## 2. PLANO GRATUITO - DURAÇÃO SELECIONÁVEL

### Problema Identificado
Atualmente, o plano gratuito tem duração fixa. O admin não pode escolher a duração ao enviar convite.

### Solução
Modificar `src/pages/admin/AdminConvites.tsx`:
- Adicionar campo de seleção de duração que aparece quando plano = "free"
- Opções: 7, 14, 21, 30, 60, 90, 120, 180, 365 dias
- Enviar duração selecionada para a Edge Function `send-invitation`

Modificar `supabase/functions/send-invitation/index.ts`:
- Receber novo parâmetro `free_duration_days`
- Usar essa duração para calcular `invitation_expires_at`
- Atualizar o planConfig para aceitar duração dinâmica

Modificar `supabase/functions/admin-create-user/index.ts`:
- Mesma lógica para criação manual de clientes

**Arquivos**:
- `src/pages/admin/AdminConvites.tsx`
- `src/pages/admin/AdminCriarCliente.tsx`
- `supabase/functions/send-invitation/index.ts`
- `supabase/functions/admin-create-user/index.ts`

---

## 3. LISTA DE CLIENTES - FILTROS AVANÇADOS

### Problema Identificado
A lista de clientes só tem busca por nome/email. Faltam filtros por tipo de plano, datas, sexo e objetivo.

### Solução
Modificar `src/pages/admin/AdminClientes.tsx`:
- Adicionar painel de filtros colapsável acima da tabela
- Filtros implementados:
  - **Tipo de Plano**: Select com ELITE FUNDADOR, GRATUITO, MENSAL, TRIMESTRAL, SEMESTRAL, ANUAL
  - **Data de Entrada**: DatePicker com range (de/até)
  - **Data de Término**: DatePicker com range (de/até)
  - **Sexo**: Select com Masculino/Feminino/Todos
  - **Objetivo Principal**: Select com Emagrecimento/Hipertrofia/Condicionamento/Todos
- Filtros são combináveis (AND lógico)
- Botão "Limpar Filtros" para resetar

**Arquivo**: `src/pages/admin/AdminClientes.tsx`

---

## 4. BUG - PROTOCOLOS E FOTOS (CLIENTE VINICIUS)

### Problema Identificado - DESCOBERTA CRÍTICA
As fotos do Vinicius são arquivos **.DNG** (formato RAW de câmera):
- `frente-1769486740768.dng`
- `lado-1769486743876.dng`
- `costas-1769486752289.dng`

Arquivos DNG **não são suportados pelos navegadores** (nem Chrome nem qualquer outro). Isso causa:
1. Erros 406 ao tentar carregar
2. Imagens aparecem quebradas no PC
3. No celular pode funcionar se o app de galeria fizer conversão automática

A mensagem "Estrutura do protocolo não reconhecida" indica que o frontend não consegue renderizar o conteúdo porque o carregamento das dependências falha.

### Solução
**Parte A - Validação no Upload**:
Modificar `src/components/anamnese/PhotoUploadSection.tsx`:
- Restringir tipos aceitos para JPEG/PNG/WEBP apenas
- Exibir erro claro se o usuário tentar enviar DNG, HEIC ou outros formatos não suportados
- Adicionar accept="image/jpeg,image/png,image/webp" no input

**Parte B - Tratamento de Erro na Exibição**:
Modificar componentes que exibem fotos:
- `src/pages/admin/AdminClienteDetalhes.tsx`
- `src/pages/admin/AdminPlanos.tsx`
- Adicionar fallback quando URL da foto retorna erro
- Exibir mensagem "Formato não suportado" ou placeholder

**Parte C - Correção Manual**:
Para o Vinicius especificamente, o admin precisará:
1. Solicitar ao cliente que reenvie as fotos em formato JPG/PNG
2. OU converter manualmente os arquivos DNG para JPG e fazer upload via bucket

**Arquivos**:
- `src/components/anamnese/PhotoUploadSection.tsx`
- `src/pages/admin/AdminClienteDetalhes.tsx`
- `src/components/admin/ClientAnamneseCard.tsx`

---

## 5. PRESCRIÇÃO DE DIETA - REGRA OBRIGATÓRIA

### Status Atual
O código já implementa o motor determinístico `buildMealSchedule` em `supabase/functions/generate-protocol/prompts/nutricao.ts`. Os horários são calculados baseados em:
- `horario_acorda` -> Primeira refeição em acordar + 30min
- `horario_treino` -> Pré-treino em treino - 90min, Pós-treino em treino + 90min
- `horario_dorme` -> Última refeição em dormir - 60min

### Problema Identificado
A validação não está bloqueando horários incoerentes. O prompt avisa a IA para não alterar, mas não há validação no backend.

### Solução
Modificar `supabase/functions/generate-protocol/index.ts`:
- Adicionar validação antes de gerar o protocolo de nutrição
- Verificar que `horario_acorda` < primeira refeição < pré-treino < treino < pós-treino < última refeição < `horario_dorme`
- Retornar erro se houver incoerência (ex: acordar 04:00 mas primeira refeição 07:00)
- Logar os horários calculados para debug

Modificar `src/pages/Anamnese.tsx`:
- Validar horários no frontend antes de salvar
- Exibir erro se horários forem incoerentes

**Arquivos**:
- `supabase/functions/generate-protocol/index.ts`
- `src/pages/Anamnese.tsx`

---

## 6. SUPORTE - GESTÃO DE CONVERSAS (ADMIN)

### Problema Identificado
O admin pode editar/deletar mensagens individuais, mas não pode:
1. Limpar conversa inteira de um cliente
2. Limpar todas as conversas de uma vez
3. Auto-limpeza de conversas antigas

### Solução
Modificar `src/pages/admin/AdminSuporteChats.tsx`:
- Adicionar botão "Limpar Conversa" no dialog de visualização de chat
- Adicionar botão "Limpar Todas" no cabeçalho da lista
- Ambos com confirmação via AlertDialog

Criar Edge Function `supabase/functions/cleanup-old-conversations/index.ts`:
- Deletar mensagens de conversas com mais de 5 dias
- Pode ser agendado via pg_cron ou chamado manualmente

Adicionar cron job para limpeza automática:
- Executar diariamente às 03:00
- Chamar a Edge Function de limpeza

**Arquivos**:
- `src/pages/admin/AdminSuporteChats.tsx`
- `supabase/functions/cleanup-old-conversations/index.ts` (novo)

---

## 7. MENSAGENS AUTOMÁTICAS - CONTROLE TOTAL

### Problema Identificado
O sistema de mensagens automáticas em `process-automated-messages` tem falhas:
1. Não verifica se o cliente acabou de entrar (pode mandar mensagem de inatividade no primeiro dia)
2. Mensagens continuam sendo enviadas mesmo quando desativadas (possível race condition)
3. Falta controle granular de quando enviar

### Solução
Modificar `supabase/functions/process-automated-messages/index.ts`:
- Adicionar verificação de `created_at` do profile
- Se `created_at` < 3 dias, não enviar mensagens de inatividade
- Se `created_at` < 30 dias, não enviar solicitação de fotos
- Verificar `is_active = true` em tempo real antes de cada envio
- Adicionar logs detalhados de por que cada mensagem foi/não foi enviada

Modificar tabela `automated_messages`:
- Adicionar coluna `min_days_since_signup` (mínimo de dias desde cadastro para enviar)
- Adicionar coluna `cooldown_days` (dias entre envios para mesmo usuário)

Modificar UI em `src/components/admin/AdminMensagens.tsx`:
- Adicionar campos para configurar os novos parâmetros

**Arquivos**:
- `supabase/functions/process-automated-messages/index.ts`
- Migration SQL para novas colunas
- UI de configuração (se existir)

---

## 8. CRM - PADRONIZAÇÃO DE PLANOS (REGRA DE NEGÓCIO)

### Problema Identificado - DESCOBERTA CRÍTICA
A query no banco mostrou duplicidade grave:

| plan_type | plan_name | count |
|-----------|-----------|-------|
| free | Gratuito | 15 |
| embaixador | Elite Fundador | 1 |
| embaixador | NULL | 1 |
| free | ELITE - Fundador | 1 |
| free | NULL | 1 |

Problemas:
1. `plan_type = "embaixador"` no Stripe mas `plan_type = "elite_founder"` no código de convites
2. Múltiplos nomes: "Elite Fundador", "ELITE Fundador", "ELITE - Fundador"
3. Múltiplos nomes para gratuito: "free", "Gratuito", "Free"
4. Um registro tem `plan_type = "free"` com `plan_name = "ELITE - Fundador"` (erro grave)

### Solução

**Parte A - Padronização no Código**:
Criar arquivo centralizado `src/lib/planConstants.ts`:
```typescript
export const PLAN_TYPES = {
  ELITE_FUNDADOR: "elite_fundador",
  GRATUITO: "gratuito",
  MENSAL: "mensal",
  TRIMESTRAL: "trimestral",
  SEMESTRAL: "semestral",
  ANUAL: "anual"
} as const;

export const PLAN_NAMES = {
  elite_fundador: "ELITE FUNDADOR",
  gratuito: "GRATUITO",
  mensal: "MENSAL",
  trimestral: "TRIMESTRAL",
  semestral: "SEMESTRAL",
  anual: "ANUAL"
} as const;
```

Atualizar todos os arquivos que usam plan_type:
- `supabase/functions/_shared/priceMappings.ts`: Mudar `embaixador` para `elite_fundador`
- `supabase/functions/check-subscription/index.ts`: Usar mapeamento centralizado
- `supabase/functions/stripe-webhook/index.ts`: Usar mapeamento centralizado
- `supabase/functions/sync-stripe-subscription/index.ts`: Usar mapeamento centralizado
- `supabase/functions/finalize-checkout/index.ts`: Usar mapeamento centralizado
- `src/pages/admin/AdminConvites.tsx`: Usar constantes
- `src/pages/admin/AdminCriarCliente.tsx`: Usar constantes
- `src/components/landing/PricingSection.tsx`: Mudar de `embaixador` para `elite_fundador`
- `src/pages/Assinatura.tsx`: Mudar de `embaixador` para `elite_fundador`

**Parte B - Migração de Dados Existentes (SQL)**:
```sql
-- Padronizar plan_type
UPDATE subscriptions SET plan_type = 'elite_fundador' WHERE plan_type = 'embaixador';
UPDATE subscriptions SET plan_type = 'gratuito' WHERE plan_type = 'free';

-- Padronizar plan_name
UPDATE subscriptions SET plan_name = 'ELITE FUNDADOR' WHERE plan_type = 'elite_fundador';
UPDATE subscriptions SET plan_name = 'GRATUITO' WHERE plan_type = 'gratuito';
UPDATE subscriptions SET plan_name = 'MENSAL' WHERE plan_type = 'mensal';
UPDATE subscriptions SET plan_name = 'TRIMESTRAL' WHERE plan_type = 'trimestral';
UPDATE subscriptions SET plan_name = 'SEMESTRAL' WHERE plan_type = 'semestral';
UPDATE subscriptions SET plan_name = 'ANUAL' WHERE plan_type = 'anual';

-- Corrigir o registro com erro (plan_type=free mas plan_name=ELITE - Fundador)
UPDATE subscriptions 
SET plan_type = 'elite_fundador', plan_name = 'ELITE FUNDADOR' 
WHERE plan_name = 'ELITE - Fundador';
```

**Arquivos principais**:
- `src/lib/planConstants.ts` (novo)
- `supabase/functions/_shared/priceMappings.ts`
- `supabase/functions/send-invitation/index.ts`
- `supabase/functions/admin-create-user/index.ts`
- `src/pages/admin/AdminConvites.tsx`
- `src/pages/admin/AdminCriarCliente.tsx`
- Migration SQL para padronização de dados

---

## Resumo de Arquivos a Modificar

| Área | Arquivos | Tipo de Alteração |
|------|----------|-------------------|
| PDF Download | `src/lib/generateAnamnesePdf.ts` | Correção de tratamento de erro |
| Plano Gratuito | `AdminConvites.tsx`, `AdminCriarCliente.tsx`, `send-invitation/index.ts` | Nova funcionalidade |
| Filtros Clientes | `AdminClientes.tsx` | Nova funcionalidade |
| Fotos | `PhotoUploadSection.tsx`, `AdminClienteDetalhes.tsx` | Validação e fallback |
| Dieta Horários | `generate-protocol/index.ts`, `Anamnese.tsx` | Validação |
| Suporte Chats | `AdminSuporteChats.tsx`, nova Edge Function | Nova funcionalidade |
| Mensagens Auto | `process-automated-messages/index.ts`, migration | Correção de lógica |
| Planos CRM | Múltiplos arquivos, novo `planConstants.ts`, migration SQL | Padronização |

---

## Ordem de Implementação Recomendada

1. **Padronização de Planos (Item 8)** - Base para os demais
2. **Bug de Fotos (Item 4)** - Impacto imediato em clientes
3. **Bug de PDF (Item 1)** - Funcionalidade admin crítica
4. **Plano Gratuito Duração (Item 2)** - Melhoria operacional
5. **Filtros de Clientes (Item 3)** - Melhoria operacional
6. **Gestão de Conversas (Item 6)** - Melhoria operacional
7. **Mensagens Automáticas (Item 7)** - Correção de comportamento
8. **Validação de Dieta (Item 5)** - Já parcialmente implementado

---

## Notas Técnicas Importantes

1. **Sobre o problema de cache**: O plano anterior para atualizar o Service Worker (`renascer-cache-v2`) ainda é válido e deve ser aplicado junto com estas correções para garantir que os clientes recebam o código atualizado.

2. **Sobre arquivos DNG**: Não há como converter DNG no frontend. O cliente Vinicius precisará reenviar as fotos em formato suportado (JPG/PNG).

3. **Sobre a constraint UNIQUE**: A migration que adicionou `subscriptions_user_id_key UNIQUE (user_id)` já foi aplicada - isso permite que o upsert funcione corretamente.
