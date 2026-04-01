

# Plano: Import Excel Mensal + Edição de Dados Diários

## Problema atual
1. Não existe forma de importar dados em massa via Excel (treino, sono, FC, etc.) extraídos do app do celular
2. O dialog de detalhe do dia (RecentLogsHistory) mostra dados read-only — não permite editar sono, estresse, energia, RPE, treinou

## O que será construído

### 1. Componente de Import Excel (`ExcelDataImport`)
- Modal acessível pela página Renascer (botão "Importar Excel" ao lado do botão de batch upload existente)
- Aceita arquivos `.xlsx` / `.csv`
- Lê as colunas do arquivo e mapeia para os campos do sistema:
  - `date`, `sleep_hours`, `stress_level`, `energy_focus`, `trained_today`, `rpe`
  - `steps`, `active_calories`, `exercise_minutes`, `standing_hours`, `distance_km`
  - `resting_hr`, `hrv_ms`, `avg_hr_bpm` (health_daily)
- Tela de revisão mostrando os dados lidos em tabela antes de salvar
- Indicação visual de quais dias já possuem dados (para o admin decidir se sobrescreve)
- Toggle "Sobrescrever dados existentes" (padrão: não — só preenche campos vazios)
- Upsert em `manual_day_logs` e `health_daily` para cada linha

### 2. Edição inline no dialog de detalhe do dia (`RecentLogsHistory`)
- Transformar os campos read-only (sono, estresse, energia, RPE, treinou) em campos editáveis
- Botão "Editar" no dialog que ativa modo de edição
- Campos: Input numérico para sono, Slider para estresse, botões 1-5 para energia, switch treinou, slider RPE
- Ao salvar, faz `UPDATE` em `manual_day_logs` + `UPSERT` em `health_daily` (sono → sleep_minutes)
- Invalida queries do SIS, Renascer Score, health-daily

## Arquivos

| Arquivo | Ação |
|---|---|
| `src/components/renascer/ExcelDataImport.tsx` | **Novo** — Modal de import Excel com preview e upsert |
| `src/components/renascer/RecentLogsHistory.tsx` | **Editar** — Adicionar modo edição no DayDetailDialog com campos editáveis para sono/estresse/energia/RPE/treinou |
| `src/pages/Renascer.tsx` | **Editar** — Adicionar botão "Importar Excel" e import do novo componente |

## Detalhes técnicos

- Usar biblioteca `xlsx` (SheetJS) já disponível via CDN ou npm para parse do Excel no client-side
- Mapeamento flexível de colunas: aceitar nomes em PT e EN (ex: "sono" ou "sleep", "passos" ou "steps")
- Validação: datas válidas, valores numéricos dentro de ranges aceitáveis
- Upsert usa `onConflict: "user_id,date"` tanto em `manual_day_logs` quanto `health_daily`
- Edição no dialog: estado local com `useState`, salva via mutation existente expandida

Sem migrations necessárias — as tabelas já suportam todos os campos.

