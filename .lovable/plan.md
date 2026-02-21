# Arquitetura Final Renascer (Aluno) -- Navegacao Premium + Source Transparency

## Resumo

Reorganizar a navegacao do aluno para ficar limpa e premium, mover "Dados do Corpo" para dentro de Configuracoes como "Conectar Dispositivos", e adicionar transparencia de fonte nos cards de metricas.

---

## 1. Menu lateral do aluno (ClientSidebar)

**Arquivo:** `src/components/layout/ClientSidebar.tsx`

Atualizar `clientMenuItems` para a estrutura final:

```text
Hoje           /renascer      Flame
Evolucao       /evolucao      Camera
Treino         /treino        Dumbbell
Nutricao       /nutricao      Apple
Mindset        /mindset       Brain
Meu Perfil     /meu-perfil    User
Configuracoes  /configuracoes Settings
Suporte        /suporte       MessageCircle
Assinatura     /assinatura    CreditCard
```

Remover: Dashboard (/dashboard), Receitas (/receitas), Dados do Corpo (foi para Configuracoes).

---

## 2. BottomNav (mobile)

**Arquivo:** `src/components/navigation/BottomNav.tsx`

Manter os 5 itens atuais (ja esta com "Hoje"). Sem alteracao necessaria.

---

## 3. "Dados do Corpo" vira secao dentro de Configuracoes

**Arquivo:** `src/pages/Configuracoes.tsx`

Adicionar um novo Card "Conectar Dispositivos" com:

- Icone Smartphone
- Status: "Nao conectado" (badge neutra)
- Dois botoes lado a lado: "Android (Health Connect)" e "Apple (HealthKit)"
- Ambos abrem um Dialog informativo explicando que a integracao estara disponivel em breve
- Nao navega para /dados-corpo; tudo inline na pagina de Configuracoes

A rota /dados-corpo continua existindo (nao quebra nada), mas nao aparece no menu.

---

## 4. Link "Painel Avancado" no Renascer

**Arquivo:** `src/pages/Renascer.tsx`

O link ja existe apontando para /dados-corpo. Manter como esta -- funciona como acesso secundario para quem precisa.

---

## 5. Source Transparency nos cards de metricas

**Arquivo:** `src/components/health/HealthDashboardTab.tsx`

Modificar o `MetricCard` para suportar fonte e valor nulo:

- Adicionar props opcionais: `source?: "manual" | "auto" | "estimado" | "indisponivel"` e `emptyValue?: boolean`
- Se `emptyValue` for true, mostrar "--" em vez de 0
- Renderizar badge pequena abaixo do valor com o texto da fonte
- Cores das badges: todas neutras (bg-muted text-muted-foreground), sem vermelho
- Texto em caps minusculo, tamanho text-[10px]

Logica de exibicao no `HealthDashboardTab`:

- Passos: se `todayData.steps === 0` e source nao e "auto" -> mostrar "--" com badge "indisponivel" e subtexto "Fonte: indisponivel"
- Calorias: se 0 e nao auto -> "--" com "Estimativa disponivel apos registrar treinos ou conectar dispositivo"
- Sono: se valor > 0 e source e manual -> badge "manual"
- FC/HRV: manter como esta (ja condicional)

Determinar source: verificar campo `source` do `todayData` (ja existe no schema health_daily). Se `source === "manual"`, badge manual. Se auto, badge automatico. Se null/undefined, badge indisponivel.

---

## 6. Rotas -- sem quebrar nada

- /dashboard continua existindo no App.tsx (apenas sai do menu)
- /dados-corpo continua existindo (acessivel via link "Painel Avancado")
- /receitas continua existindo (pode ser acessado via URL direta)
- Nenhuma rota e removida do App.tsx

---

## Arquivos a modificar


| Arquivo                                        | Mudanca                                      |
| ---------------------------------------------- | -------------------------------------------- |
| `src/components/layout/ClientSidebar.tsx`      | Remover Dashboard, Receitas do menu do aluno |
| `src/pages/Configuracoes.tsx`                  | Adicionar card "Conectar Dispositivos"       |
| `src/components/health/HealthDashboardTab.tsx` | Source badges + tratar valores zero          |


## Sem alteracoes

- Banco de dados
- Score engine
- App.tsx (rotas)
- BottomNav (ja correto)  
  
  
+  
  

  REFATORAÇÃO PROFISSIONAL COMPLETA DO RENASCER APP
  Objetivo: transformar o Renascer em um produto com consistência visual, lógica precisa e padrão premium equivalente a Apple, Whoop e Tesla.
  NÃO alterar banco de dados existente.
  NÃO quebrar funcionalidades existentes.
  Refatorar apenas UI, lógica de exibição e regras de consistência.
  ====================================================
  PILAR 1 — DESIGN SYSTEM GLOBAL UNIFICADO
  ====================================================
  Problema atual:
  Cada página usa espaçamento, tamanho e hierarquia diferentes.
  Criar Design Tokens globais:
  spacing scale:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  card padrão:
  background: #0F172A
  border: 1px solid rgba(255,255,255,0.06)
  border-radius: 12px
  padding: 16px
  gap interno: 8px
  tipografia global:
  H1: 28px semibold
  H2: 20px semibold
  H3: 16px medium
  body: 14px regular
  caption: 12px muted
  NÃO usar múltiplas fontes.
  Fonte única: Inter.
  Aplicar isso em TODAS as páginas:
  - Dashboard
  - Evolução
  - Treino
  - Nutrição
  - Dados do Corpo
  ====================================================
  PILAR 2 — REFATORAÇÃO COMPLETA DA TELA EVOLUÇÃO
  ====================================================
  Problema:
  Cards gigantes, pouco informativo, desperdício de espaço.
  Nova estrutura:
  Fotos Iniciais:
  layout horizontal compacto
  cards menores
  altura máxima: 160px
  Fotos de Evolução:
  grid responsivo
  cards menores
  mostrar data como badge superior
  Timeline:
  layout vertical compacto
  cada entry máximo 56px altura
  mostrar:
  data
  peso
  status
  badge “Análise disponível”
  NÃO usar containers excessivamente grandes.
  ====================================================
  PILAR 3 — INTERVALOS INTELIGENTES POR PERFIL
  ====================================================
  Problema atual:
  intervalos fixos incorretos.
  Criar lógica dinâmica baseada no perfil:
  se nível == iniciante:
  musculo pequeno: 45s
  musculo grande: 60s
  se nível == intermediario:
  musculo pequeno: 30s
  musculo grande: 60s
  se nível == avancado:
  musculo pequeno: 30s
  musculo grande: 60–90s dependendo intensidade
  Classificação de músculos grandes:
  peito
  costas
  pernas
  músculos pequenos:
  bíceps
  tríceps
  ombro
  panturrilha
  Aplicar automaticamente ao gerar treino.
  ====================================================
  PILAR 4 — CORREÇÃO COMPLETA DO MOTOR DE NUTRIÇÃO (CRÍTICO)
  ====================================================
  Problema:
  horários não respeitam anamnese.
  Regra obrigatória:
  Usar os dados reais do perfil:
  wake_time
  training_time
  sleep_time
  Gerar refeições baseado nesses horários:
  pre-treino:
  60–90 minutos antes do treino
  pós-treino:
  até 60 minutos após treino
  pré-sono:
  30–60 minutos antes do sleep_time
  Exemplo correto:
  treino: 15:00
  pre-treino: 13:30–14:00
  pós-treino: 16:00
  pré-sono: baseado no sleep_time real
  NÃO usar horários fixos hardcoded.
  ====================================================
  PILAR 5 — CORREÇÃO COMPLETA DO PDF DE NUTRIÇÃO
  ====================================================
  Problema:
  múltiplas fontes e desalinhamento.
  Padronizar:
  Fonte única: Inter
  hierarquia:
  Título:
  16px semibold
  Subtítulo:
  14px medium
  Texto:
  12px regular
  Macros:
  11px medium
  Espaçamento consistente.
  Remover qualquer mistura de fontes.
  Garantir alinhamento vertical correto.
  ====================================================
  PILAR 6 — CORREÇÃO CRÍTICA DO TIMER DE INTERVALO (BUG)
  ====================================================
  Problema:
  timer quebra ao sair e voltar.
  Implementar persistência usando:
  localStorage ou banco:
  interval_started_at
  interval_duration
  Quando usuário retorna:
  recalcular tempo restante baseado em timestamp real
  Nunca resetar timer ao sair da tela.
  ====================================================
  CRITÉRIO DE ACEITE FINAL
  ====================================================
  Todas páginas devem:
  usar o mesmo sistema visual
  mesmo spacing
  mesma tipografia
  mesma lógica
  Resultado esperado:
  aparência equivalente a produto premium global
  consistência total
  comportamento previsível e confiável
  FIM  
    
  ajuste agora  incluindo esse final que coloquei agora 