# Módulo Teste de VO2 Máx — Aeróbico

Adicionar submódulo "Teste de VO2 Máx" dentro da página `/cardio`, com 3 protocolos (Cooper, Bruce, Astrand-Rhyming), cálculo automático, classificação por idade/sexo, salvamento no perfil, card no dashboard "Hoje" e gráfico em Evolução.

## Banco de dados

Nova tabela `vo2max_tests`:
- `user_id` (FK → profiles.id)
- `protocolo` (text: 'cooper' | 'bruce' | 'astrand')
- `valor_ml_kg_min` (numeric)
- `classificacao` (text)
- `test_date` (date)
- `local` (text, nullable)
- `dados_brutos` (jsonb — campos do teste)
- `screenshot_url` (text, nullable — bucket fitness-screenshots)
- `notas` (text, nullable)

RLS: usuário CRUD nos próprios registros; admin pode ler tudo.

## Estrutura de arquivos

```
src/pages/Vo2Max.tsx                          (rota /vo2max — fluxo)
src/components/vo2max/
  Vo2MaxEntryButton.tsx                       (botão na página /cardio)
  Vo2MaxProtocolSelector.tsx                  (3 cards de seleção)
  Vo2MaxCooperForm.tsx                        (instruções + form Cooper)
  Vo2MaxBruceForm.tsx                         (instruções + tabela estágios + form Bruce)
  Vo2MaxAstrandForm.tsx                       (instruções + form Astrand)
  Vo2MaxResultCard.tsx                        (resultado com counter animado + badge)
  Vo2MaxHistoryList.tsx                       (histórico + gráfico linha)
  Vo2MaxDashboardCard.tsx                     (card para Renascer/Hoje)
src/lib/vo2maxCalc.ts                         (fórmulas + classificação)
```

## Fórmulas (em `vo2maxCalc.ts`)

- **Cooper**: `(distancia_m − 504.9) / 44.73`
- **Bruce** (T em min decimal):
  - M: `14.8 − 1.379·T + 0.451·T² − 0.012·T³`
  - F: `4.38·T − 3.9`
- **Astrand** (ACSM simplificada): `(watts · 10.8 / peso_kg) + 7`
- **Classificação**: tabela por sexo × faixa etária × VO2 (do PDF) retornando label + cor semântica.

## Integrações

1. **`/cardio`** (`src/pages/Cardio.tsx`): inserir `<Vo2MaxEntryButton />` abaixo de `<CardioLogForm />`. Botão navega para `/vo2max`.
2. **Dashboard "Hoje"** (`src/pages/Renascer.tsx`): inserir `<Vo2MaxDashboardCard />` mostrando o último teste com badge colorido.
3. **Evolução** (`src/pages/Evolucao.tsx`): adicionar seção "VO2 Máx" com gráfico de linha (Recharts) + tabela do histórico.
4. **Navegação**: adicionar rota `/vo2max` em `src/App.tsx` (com `AuthGuard` + `SubscriptionGuard` no padrão de `/cardio`).

## Fluxo UX

1. `/cardio` → clica "🧪 Realizar Teste de VO2 Máx"
2. `/vo2max` → seletor de protocolo (3 cards)
3. Tela do protocolo escolhido: instruções + barra "Passo 1 de 2" → formulário "Passo 2 de 2"
4. Resultado animado (counter), badge classificação, botões "Salvar" e "Ver histórico"
5. Após salvar → invalida queries do Renascer e Evolução, toast de sucesso, volta para `/cardio`

## Design

- Reusar tokens do design system Renascer (sem cores hardcoded; usar `bg-card`, `text-primary`, etc. — paleta já mapeada para #171614 / #E8632A em `index.css`)
- Lucide icons (`Activity`, `Footprints`, `Bike`, `FlaskConical`)
- Disclaimer no rodapé: "Este teste é uma estimativa indireta. Para resultado laboratorial preciso, consulte um profissional de saúde."
- Print upload reaproveita bucket `fitness-screenshots` (path `${userId}/vo2max/`)

## Validações

- Cooper: distância > 0
- Bruce: tempo total > 0, sexo obrigatório
- Astrand: peso, watts, sexo obrigatórios; idade vinda do `profiles.birth_date` (fallback campo manual)
- Toast de erro se campos faltando

## Out of scope

- Não implementa integração com Apple Watch/Garmin para FC ao vivo
- Não implementa timer in-app de 12min do Cooper (apenas registro pós-teste) — pode entrar em iteração futura se você quiser
