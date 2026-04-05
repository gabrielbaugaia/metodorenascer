
Plano: corrigir leitura do HeartWatch para importar valores diários reais e calcular a média corretamente

Diagnóstico real
- O problema principal está no `supabase/functions/extract-fitness-data/index.ts`: hoje ele só pode retornar 1 `hrv_ms` + 1 `detected_date` por imagem.
- O print do HeartWatch anexado não é “um dia só”; ele mostra um período com vários dias (ex.: 30=18, 31=23, 01=38) e também um resumo/média de 21 dias (`Média 31`).
- A função atual está misturando “valor diário” com “média do período”, porque o prompt não separa explicitamente:
  - valor do dia
  - média do período
  - intervalo visível
- Além disso, a função força datas dos “últimos 7/10 dias”, o que entra em conflito com prints de período como `23 de fev. - 5 de abr.`.
- No app, `useHealthData.ts` busca só 7 dias e o `HealthDashboardTab.tsx` calcula médias sobre esses 7 dias, então mesmo com importação correta ele nunca vai refletir uma média de 21 dias igual à do HeartWatch.

O que vou implementar
1. Tornar o OCR compatível com prints de período do HeartWatch
- Atualizar `supabase/functions/extract-fitness-data/index.ts` para reconhecer dois modos:
  - screenshot de 1 dia
  - screenshot de período/multi-dia
- Para HeartWatch, a resposta passará a separar:
  - `days[]`: lista de dias individuais visíveis no print
  - `summary`: média do período e intervalo visível
- Regra crítica no prompt:
  - nunca salvar a média de 21 dias como se fosse `hrv_ms` de um único dia
  - usar a média apenas como resumo/validação
- Exemplo esperado para o print:
```text
days:
- 2026-03-30 => hrv_ms 18
- 2026-03-31 => hrv_ms 23
- 2026-04-01 => hrv_ms 38
...
summary:
- metric: hrv_ms
- period_days: 21
- average: 31
- range_start / range_end
```

2. Corrigir a inferência de datas para telas com intervalo
- Remover a lógica rígida de “últimos 7 dias” para esse tipo de captura.
- Fazer a data vir do cabeçalho do período (`23 de fev. - 5 de abr.`), dos rótulos de mês (`março`, `abr.`) e dos dias do calendário.
- Marcar como ambíguo apenas quando realmente faltar contexto visual suficiente.

3. Salvar cada dia individualmente nas tabelas certas
- Atualizar os fluxos que hoje esperam apenas 1 dia por screenshot:
  - `src/components/renascer/ManualInput.tsx`
  - `src/components/renascer/BatchFitnessUpload.tsx`
  - `src/components/renascer/RecentLogsHistory.tsx`
- Quando o OCR retornar `days[]`, o sistema fará upsert de cada data em:
  - `manual_day_logs`
  - `health_daily`
- Isso mantém histórico, painel “Dados do Corpo” e score sincronizados.

4. Manter compatibilidade com prints simples
- Se a imagem tiver só 1 valor/dia, o comportamento continua como hoje.
- Se a imagem for um gráfico/calendário com vários dias, o sistema troca para importação multi-dia automaticamente.

5. Corrigir média exibida no app
- Atualizar `src/hooks/useHealthData.ts` para buscar histórico suficiente para métricas cardiovasculares (pelo menos 21 a 30 dias).
- Atualizar `src/components/health/HealthDashboardTab.tsx` para:
  - manter tendência visual de 7 dias, se quiser
  - calcular médias com a janela correta quando a métrica vier de um contexto de 21 dias
- A média exibida passará a ser calculada dos dias realmente salvos, em vez de depender do valor resumido lido do print.

6. Ajustar exibição e revisão dos dados importados
- Em `RecentLogsHistory.tsx`, mostrar corretamente os valores cardiovasculares importados por dia.
- Se o OCR trouxer resumo do período, usar isso só como conferência durante revisão/importação, não como dado diário.
- Opcionalmente, no drawer de detalhe (`HealthMetricDetailDrawer.tsx`), mostrar “média 7d” e “média 21d” separadas para evitar nova confusão.

Arquivos principais
- `supabase/functions/extract-fitness-data/index.ts`
- `src/components/renascer/ManualInput.tsx`
- `src/components/renascer/BatchFitnessUpload.tsx`
- `src/components/renascer/RecentLogsHistory.tsx`
- `src/hooks/useHealthData.ts`
- `src/components/health/HealthDashboardTab.tsx`
- possivelmente `src/components/health/HealthMetricDetailDrawer.tsx`

Banco de dados
- Não deve precisar de nova tabela para resolver isso.
- As tabelas atuais já suportam o essencial; o ajuste é principalmente de extração, mapeamento e cálculo.

Resultado esperado
- Um print de período do HeartWatch deixa de virar “1 valor errado”.
- O sistema passa a importar dia por dia corretamente.
- Exemplo: 30=18, 31=23, 01=38 serão gravados individualmente.
- A média mostrada no app será calculada a partir desses dias gravados, e não confundida com o resumo do print.
- “Hoje”, “Dados do Corpo” e histórico passam a refletir os valores reais.

Fluxo desejado
```text
Print HeartWatch do período
-> OCR identifica intervalo + dias individuais + média resumida
-> salva cada dia em manual_day_logs e health_daily
-> app recalcula médias a partir dos dias salvos
-> painel mostra valores corretos por dia e média correta
```
