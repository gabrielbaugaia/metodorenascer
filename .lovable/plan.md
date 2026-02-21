

# Refatoracao Executive Premium — Admin Dashboard + Student Dashboard

## Resumo

Refatorar ambos os dashboards para modelo executivo premium: limpo, silencioso e orientado a acao. Nenhuma funcionalidade removida — apenas reorganizacao visual e hierarquia.

---

## PARTE 1 — Admin Dashboard

### Arquivo: `src/pages/admin/AdminDashboard.tsx`

Reescrever completamente o JSX mantendo a mesma logica de fetch (useEffect com stats). Estrutura final:

**1.1 Header minimalista**
- Titulo "Dashboard" (sem subtitulo verbose)
- Botao "Relatorio Semanal" discreto ao lado

**1.2 Executive Status Bar (4 cards clicaveis em linha)**
- Layout: `grid grid-cols-2 md:grid-cols-4 gap-3`
- Cada card: icone discreto (strokeWidth 1.5) + label pequena (text-xs) + valor medio (text-lg font-semibold)
- Sem circulos coloridos grandes, sem gradientes
- Cards clicaveis com navigate:

```text
Clientes      → /admin/clientes      (Users)
Receita       → /admin/metricas      (DollarSign)
Protocolos    → /admin/planos        (FileText)
Assinaturas   → /admin/planos-venda  (Activity)
```

- Estilo: `bg-card border border-border/50 hover:border-primary/30 transition-colors cursor-pointer`

**1.3 Quick Actions — "Operacoes"**
- Titulo: `<h2 class="text-sm font-medium text-muted-foreground uppercase tracking-wider">Operacoes</h2>`
- Grid `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2`
- Cada acao: icone monocromatico + texto pequeno, sem gradientes de fundo
- Acoes: Novo Cliente, Ver Clientes, Protocolos, Banco de Videos, Planos Comerciais, Campanhas Trial, Connector Docs
- Estilo flat: `bg-card border border-border/50 hover:border-primary/30`

**1.4 Insights — Colapsado por padrao**
- Usar `Collapsible` do Radix (ja instalado)
- Trigger: `<CollapsibleTrigger>` com texto "Ver insights" + icone ChevronDown
- Conteudo colapsado contem:
  - AdminAlertsPanel
  - 6 mini-cards financeiros (ticket medio, conversao, churn, MRR, LTV, pendentes)
  - Gargalos
  - Distribuicao por plano (pie chart)
  - Graficos receita mensal e novos vs cancelados
  - Clientes recentes
- Tudo que ja existe, apenas dentro do Collapsible

**1.5 Performance**
- O fetch de stats ja carrega tudo (nao e lazy). Manter assim por ora — os dados sao leves (counts + subs). A diferenca e que graficos e listas ficam escondidos visualmente ate o usuario abrir.

**REMOVER da visao principal (movidos para dentro de Insights):**
- Ticket medio, conversao, churn, MRR, LTV, pendentes
- Graficos
- Lista de clientes recentes
- Gargalos
- Distribuicao por plano

---

## PARTE 2 — Student Dashboard

### Arquivo: `src/pages/Dashboard.tsx`

Refatorar o bloco de retorno do usuario subscrito (linhas 391-515). Manter intactos: pending payment flow, plan selection flow, useEffects, estados.

**2.1 Executive Status — ScoreRing centralizado**
- Importar `ScoreRing` e `useRenascerScore`
- Bloco superior: ScoreRing grande + StatusBadge + recomendacao curta (1 linha)
- Sem paragrafos longos
- Layout centralizado, card unico

**2.2 Acao do Dia**
- Card unico abaixo do score com logica condicional:
  - Se `canDoWeeklyCheckin` → "Check-in pendente" + botao "Registrar hoje"
  - Se `needsEvolutionPhotos` → "Fotos de evolucao" + botao "Enviar fotos"
  - Senao → "Treino disponivel" + botao "Iniciar treino" (link para /treino)
- Apenas UMA acao, a mais prioritaria

**2.3 Progresso — 3 indicadores compactos**
- Grid `grid-cols-3 gap-3`
- Consistencia: usar `computeBodyIndicators` de `src/lib/bodyIndicators.ts` (ja existe) — fetch dos ultimos 7 dias de `manual_day_logs`
- Sequencia: usar `streak.current_streak` (ja disponivel via useAchievements)
- Evolucao: usar ultimo checkin/peso — query simples para mostrar delta. Se nao tiver, mostrar "--"
- Cards pequenos, valor em `text-primary`, label em `text-xs text-muted-foreground`

**2.4 Quick Access — Grid Apple**
- Grid `grid-cols-2 gap-3`
- 4 itens apenas: Treino, Nutricao, Evolucao, Dados do Corpo
- Icone + label, sem descricao
- Estilo flat: `bg-card border border-border/50 hover:border-primary/30`
- Navega para: /treino, /nutricao, /evolucao, /dados-corpo

**REMOVER da visao principal:**
- Welcome header com nome gigante em uppercase
- DASHBOARD_CARDS com 5 cards grandes (Treino, Nutricao, Mindset, Receitas, Fale com Mentor)
- StreakDisplay full (manter apenas o numero compacto)
- Bloco de conquistas expansivel
- SubscriptionStatusCard (mover para /assinatura)
- OnboardingTour (manter, mas nao impacta visualmente)

---

## Arquivos a criar/modificar

| Arquivo | Acao |
|---------|------|
| `src/pages/admin/AdminDashboard.tsx` | Reescrever JSX: status bar + quick actions + insights colapsado |
| `src/pages/Dashboard.tsx` | Reescrever bloco subscrito: score + acao + progresso + quick access |

## Sem alteracoes
- Banco de dados
- Rotas (App.tsx)
- Sidebar / BottomNav
- Componentes existentes (ScoreRing, StreakDisplay, etc.)
- Edge functions

