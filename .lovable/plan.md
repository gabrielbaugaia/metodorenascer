
# Refatoracao Premium Executiva Completa -- Renascer App

## Analise do Estado Atual

Muitas das solicitacoes ja foram implementadas em mensagens anteriores:
- Admin Dashboard ja esta no formato executivo (status bar + quick actions + insights colapsado)
- Student Dashboard ja tem ScoreRing + acao do dia + progresso + quick access
- Sidebar do aluno ja tem a estrutura limpa (Hoje, Evolucao, Treino, etc.)
- BodyPremiumIndicators ja existe em DadosCorpo
- ManualInput ja faz upsert por data em manual_day_logs
- Timer de descanso ja persiste via localStorage
- Source transparency ja existe no HealthDashboardTab
- CSS tokens ja estao definidos (dark mode, --card, --border, --primary)

Este plano foca APENAS no que ainda NAO foi feito.

---

## FASE 1 -- Design System: Componentes Reutilizaveis

**Arquivo novo:** `src/components/ui/page-header.tsx`

Componente PageHeader padrao para todas as paginas:
- Props: title, subtitle?, actions? (ReactNode)
- Layout: flex between, titulo h1 text-xl font-semibold, subtitulo text-sm text-muted-foreground
- Elimina headers inconsistentes entre paginas

**Arquivo novo:** `src/components/ui/kpi-chip.tsx`

Componente KPIChip reutilizavel (pilula compacta):
- Props: label, value, icon?, trend? (up/down/stable)
- Estilo: inline-flex, bg-card, border border-border/50, rounded-lg, p-2
- Substitui cards ad-hoc repetidos em Dashboard, DadosCorpo, etc.

**Arquivo novo:** `src/components/ui/stat-card-mini.tsx`

StatCardMini para grids de metricas:
- Props: label, value, icon, onClick?, color?
- Estilo flat: bg-card border border-border/50 hover:border-primary/30, sem gradientes
- Substitui os cards com gradientes coloridos da pagina Treino e Nutricao

**Arquivo novo:** `src/components/ui/empty-state.tsx`

EmptyState padronizado:
- Props: icon, title, description, ctaLabel?, ctaAction?
- Centralizado, icone discreto, texto curto
- Substitui empty states inconsistentes (Treino, Nutricao, Evolucao todos diferentes)

---

## FASE 2 -- Padronizar Paginas com Design System

### 2.1 Treino (`src/pages/Treino.tsx`)

Mudancas:
- Substituir header com gradiente laranja-vermelho por PageHeader simples
- Substituir 4 stats cards com gradientes coloridos por 4 StatCardMini flat (sem bg-gradient-to-br)
- Remover StreakDisplay separado (o streak ja aparece nos stats)
- Substituir empty state customizado por EmptyState padrao
- Remover console.logs de debug

### 2.2 Nutricao (`src/pages/Nutricao.tsx`)

Mudancas:
- Substituir header com gradiente verde por PageHeader simples
- MacroCard: remover cores vividas (bg-blue-500/10, bg-green-500/10) e usar bg-card com border padrao
- MealMacrosBar: substituir badges coloridos (bg-blue-50, bg-green-50) por badges neutros com border-border/50
- Hidratacao card: remover bg-cyan-50/30 e usar bg-card padrao
- Pre-sono: remover bg-indigo-50/30 e usar bg-card padrao
- Empty state: usar EmptyState padrao

### 2.3 Evolucao (`src/pages/Evolucao.tsx`)

Mudancas:
- Substituir header por PageHeader
- Grid de fotos iniciais: manter thumbs mas com altura max-h-[160px] e rounded-lg padrao
- Formulario "Enviar evolucao": converter para drawer/sheet em vez de bloco grande inline
- Empty state: usar EmptyState padrao

### 2.4 DadosCorpo (`src/pages/DadosCorpo.tsx`)

Mudancas:
- Substituir header por PageHeader
- Manter BodyPremiumIndicators e tabs como estao (ja corretos)

### 2.5 Renascer/Hoje (`src/pages/Renascer.tsx`)

Mudancas:
- Substituir header com emoji (🔥) por PageHeader limpo sem emoji
- Adicionar data de hoje no header: "Hoje -- Sab, 22/02"
- Adicionar bloco "Historico" abaixo do ManualInput: ultimos 7 dias em ListRow compacto

---

## FASE 3 -- Historico de 7 Dias no "Hoje"

**Novo componente:** `src/components/renascer/RecentLogsHistory.tsx`

- Recebe os dados de `useRenascerScore` (scores7d + todayLog)
- Faz query adicional de manual_day_logs dos ultimos 7 dias
- Renderiza lista vertical compacta:
  - Cada linha: data (dd/mm) + 3 mini icones (sono/stress/energia) + score badge
  - Clicar abre dialog com detalhe do dia
- Se nao houver dados: "Registre seu primeiro dia"

**Integracao:** Inserir em Renascer.tsx abaixo do ManualInput

---

## FASE 4 -- Corrigir Passos/Calorias Falsos

**Arquivo:** `src/components/health/HealthDashboardTab.tsx`

A logica de SourceBadge ja existe. Falta:
- Para Passos: se todayData?.steps === 0 e source !== "auto", mostrar "--" com subtitle "Conecte para preencher"
- Para Calorias: mesma logica
- NAO exibir "0" quando nao ha fonte automatica real

Verificar que a logica condicional ja aplicada (emptyValue) esta sendo usada corretamente nos MetricCards de passos e calorias.

---

## FASE 5 -- Nutricao: Respeitar Horarios do Perfil

**Arquivo:** `supabase/functions/generate-protocol/prompts/nutricao.ts`

Verificar e reforcar no prompt que:
- As refeicoes DEVEM usar horario_acorda, horario_treino, horario_dorme do perfil
- Pre-treino: 60-90min antes de horario_treino
- Pos-treino: ate 60min depois
- Pre-sono: 30-60min antes de horario_dorme
- Proibido horarios fixos hardcoded

(Esta regra pode ja ter sido implementada -- verificar e corrigir se necessario)

---

## FASE 6 -- PDF: Fonte Unica e Alinhamento

**Arquivo:** `src/lib/generateProtocolPdf.ts`

- Garantir que TODA a geracao usa "helvetica" (ja e o padrao do jsPDF, sem importar fontes externas)
- Padronizar hierarquia:
  - Titulo: 14px bold
  - Subtitulo: 12px bold
  - Corpo: 10px normal
  - Caption: 9px normal
- Verificar espaçamento vertical consistente (yPos += 6 para titulos, += 5 para body)
- Remover qualquer mistura de setFont com fontes diferentes

---

## Arquivos a criar

| Arquivo | Descricao |
|---------|-----------|
| `src/components/ui/page-header.tsx` | Header padrao para todas as paginas |
| `src/components/ui/kpi-chip.tsx` | Pilula compacta de indicador |
| `src/components/ui/stat-card-mini.tsx` | Card de metrica flat estilo Apple |
| `src/components/ui/empty-state.tsx` | Estado vazio padronizado |
| `src/components/renascer/RecentLogsHistory.tsx` | Historico 7 dias compacto |

## Arquivos a modificar

| Arquivo | Mudanca |
|---------|---------|
| `src/pages/Treino.tsx` | PageHeader + StatCardMini flat + remover gradientes |
| `src/pages/Nutricao.tsx` | PageHeader + cores neutras + EmptyState |
| `src/pages/Evolucao.tsx` | PageHeader + fotos compactas + drawer para envio |
| `src/pages/DadosCorpo.tsx` | PageHeader |
| `src/pages/Renascer.tsx` | PageHeader com data + historico 7 dias + remover emoji |
| `src/components/health/HealthDashboardTab.tsx` | Corrigir exibicao passos/calorias zerados |
| `src/lib/generateProtocolPdf.ts` | Padronizar fonte e espacamento |
| `supabase/functions/generate-protocol/prompts/nutricao.ts` | Reforcar horarios do perfil |

## NAO alterar

- Banco de dados (tabelas existentes ja cobrem tudo)
- Rotas (App.tsx)
- Sidebar / BottomNav (ja corretos)
- Admin Dashboard (ja refatorado)
- Student Dashboard (ja refatorado)
- Score engine / bodyIndicators
- Edge functions (exceto prompt nutricao)
