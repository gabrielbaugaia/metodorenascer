
# Redesign Completo — Estetica Ultra Minimalista Premium

## Escopo

Redesenho total da interface (Admin + App Aluno) seguindo as especificacoes de paleta, tipografia, layout e componentes descritos. Devido ao tamanho do projeto (~30 paginas, ~50+ componentes), a implementacao sera dividida em fases sequenciais.

---

## Fase 1 — Design System (fundacao)

Alterar os arquivos de base que afetam TUDO automaticamente:

### 1.1 Paleta de cores (`src/index.css`)
Substituir todas as CSS variables para a nova paleta:
- `--background`: #050609
- `--card`: #101319
- `--border`: #1E2430
- `--primary`: #FF6A3D (converter para HSL)
- `--foreground`: #F5F7FA
- `--muted-foreground`: #A3AEC2
- Adicionar tokens para verde sucesso (#27D980), amarelo (#FFC857), vermelho (#FF4B4B)
- Remover gradientes coloridos (gradient-fire, gradient-dark, etc.)
- Remover shadow-glow, shadow-hover e efeitos exagerados

### 1.2 Tipografia (`src/index.css` + `tailwind.config.ts`)
- Substituir `Bebas Neue` por `Montserrat` (SemiBold para titulos)
- Manter `Inter` para textos
- Remover `letter-spacing: 0.03em` dos headings
- Headings usam `font-weight: 600` em vez de display weight

### 1.3 Componentes base
- `src/components/ui/card.tsx`: Remover variantes glass/dashboard. Card unico com bg `#101319`, borda `#1E2430`, sem sombras exageradas
- `src/components/ui/button.tsx`: Remover variante `fire`. Botao primario usa `#FF6A3D` solido, sem gradiente
- `src/components/ui/badge.tsx`: Estilo minimalista, sem gradientes

### 1.4 Classes utilitarias (`src/index.css`)
- Remover `.glass-card`, `.glass-card-hover`, `.text-gradient`, `.btn-fire`, `.section-dark`, `.section-graphite`, `.section-light`
- Remover animacoes `pulseGlow`, `pulseShadow`, `float`
- Scrollbar: usar cores da nova paleta

---

## Fase 2 — Layout Shell (sidebar + header + bottom nav)

### 2.1 Admin Sidebar (`src/components/layout/ClientSidebar.tsx`)
Redesenhar completamente para admins:
- Largura 260px desktop, icone colapsado mobile
- Topo: logo + "Painel Admin"
- Secoes com labels em CAPS pequenos: CLIENTES, CONTEUDO, VENDAS, AUTOMACOES, SUPORTE
- Item ativo: fundo levemente mais claro + barra fina a esquerda na cor primaria
- Icones monocromaticos, traco fino
- Reorganizar itens conforme especificacao:
  - CLIENTES: Dashboard, Clientes, Leads
  - CONTEUDO: Biblioteca de Videos, Biblioteca de GIFs, Blog
  - VENDAS: Planos, Campanhas Trial, Metricas
  - AUTOMACOES: Mensagens Automaticas
  - SUPORTE: Chats, Documentacao
  - Sair (bottom)

### 2.2 Client Layout (`src/components/layout/ClientLayout.tsx`)
- Header mobile: simplificar, remover efeitos visuais excessivos
- Background: `#050609`

### 2.3 Bottom Nav do Aluno (`src/components/navigation/BottomNav.tsx`)
- Manter minimalista, sem efeitos de scale
- Icones de traco fino consistentes

---

## Fase 3 — Admin Dashboard (`src/pages/admin/AdminDashboard.tsx`)

Reescrever a pagina inteira:

### 3.1 Header
- Esquerda: titulo "Dashboard Admin" + subtitulo
- Centro: seletor de periodo (7d / 30d / 90d) — componente novo
- Direita: icone notificacoes + avatar + nome
- Mobile: coluna unica, seletor abaixo do titulo

### 3.2 Barra de KPIs com icones
- Linha horizontal com 5 icones pequenos (MRR, Clientes, Assinaturas, Conversao, Churn)
- Tooltip ao hover com valor
- Click leva para /admin/metricas
- Mobile: carrossel horizontal

### 3.3 Bloco "O que voce precisa fazer hoje"
- Ate 3 cards finos com alertas
- Linha lateral amarelo/vermelho por severidade
- Substituir `AdminAlertsPanel` atual

### 3.4 Acoes rapidas (grid 2x2)
- 4 cards: Clientes, Produtos & Planos, Conteudo, Marketing & Trials
- Pouco texto, links internos discretos
- Mobile: 1 por linha

### 3.5 Grafico "Saude do negocio"
- Um unico grafico com 3 linhas (MRR, novos, cancelamentos)
- Botao "Ver metricas completas"

### 3.6 Bloco "Ultimos clientes"
- Lista compacta: avatar iniciais, nome, email, badge plano, ponto verde status
- Sem botoes grandes

---

## Fase 4 — Dashboard do Aluno (`src/pages/Dashboard.tsx`)

Reescrever completamente:

### 4.1 Cabecalho
- Nome do aluno + frase motivacional
- Tags: "sequencia: X dias" e "pontos: XX" (direita, ou abaixo no mobile)
- Remover StreakDisplay atual, integrar como tags simples

### 4.2 Card "Hoje"
- Card unico e enxuto
- Linha treino do dia: nome + duracao + botao "Iniciar"
- Linha check-in: "Check-in diario" + botao "Fazer check-in"
- Remover cards gigantes separados

### 4.3 Grid de icones (estilo app)
- 6 icones: Treino, Nutricao, Mindset, Receitas, Check-in, Mentor
- Cada item: icone + label 1 palavra
- Mobile: grid 2x3; desktop: 3x2
- Substituir `DashboardCardsGrid` atual (cards grandes com descricao)

### 4.4 Progresso da semana
- 7 marcadores (Seg-Dom) mostrando dias com treino/check-in
- Visual minimalista, sem graficos pesados
- Substituir StreakDisplay completo

---

## Fase 5 — Paginas secundarias (ajustes de estilo)

Com o design system da Fase 1 aplicado, as paginas secundarias herdam automaticamente as novas cores e tipografia. Ajustes pontuais:

- Remover todas as classes `from-X-500 to-Y-500` (gradientes de cor)
- Remover `text-gradient` de todos os arquivos
- Remover `variant="glass"` e `variant="dashboard"` (usar card padrao)
- Remover `variant="fire"` de botoes
- Substituir icones inconsistentes por Lucide com `strokeWidth={1.5}` (traco fino)
- Paginas afetadas: Treino, Nutricao, Mindset, Receitas, Suporte, MeuPerfil, Assinatura, Evolucao, Renascer, Configuracoes, todas as paginas admin

---

## Fase 6 — Landing Page (`src/pages/Index.tsx` e componentes `landing/`)

- Adaptar secoes para nova paleta (sem emojis, sem gradientes fora da paleta)
- Manter ritmo visual preto/grafite mas usando #050609 e #101319
- Remover section-light / section-graphite, usar classes inline da paleta

---

## Arquivos Principais Afetados

| Arquivo | Mudanca |
|---------|---------|
| `src/index.css` | Paleta completa, tipografia, remover classes decorativas |
| `tailwind.config.ts` | Font family, remover gradientes, ajustar sombras |
| `src/components/ui/card.tsx` | Simplificar variantes |
| `src/components/ui/button.tsx` | Remover fire, padronizar |
| `src/components/layout/ClientSidebar.tsx` | Redesenhar admin sidebar com secoes |
| `src/components/layout/ClientLayout.tsx` | Ajustar shell |
| `src/components/navigation/BottomNav.tsx` | Minimalista |
| `src/pages/admin/AdminDashboard.tsx` | Reescrever completo |
| `src/pages/Dashboard.tsx` | Reescrever completo |
| `src/components/dashboard/DashboardCardsGrid.tsx` | Substituir por grid icones |
| `src/components/gamification/StreakDisplay.tsx` | Simplificar ou remover |
| ~20 paginas adicionais | Remover classes obsoletas |

## Recomendacao de Execucao

Devido ao volume de mudancas, recomendo implementar **fase por fase**, comecando pela Fase 1 (design system) pois ela propaga mudancas automaticamente para todas as paginas. Depois Fase 2 (layout), Fase 3 (admin dashboard), Fase 4 (aluno dashboard), e por ultimo as fases 5 e 6.

Posso comecar pela Fase 1 + Fase 2 juntas (fundacao + layout) na primeira mensagem de implementacao.
