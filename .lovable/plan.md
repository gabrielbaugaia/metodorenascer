
Objetivo: corrigir de forma real o fluxo de importação dos prints da semana para que os dados enviados hoje entrem no histórico correto do cliente, atualizem métricas/gráficos e não gerem datas erradas.

O que identifiquei
- O problema principal não é só “não atualizar a tela”: os uploads estão sendo salvos com datas erradas.
- No cadastro do cliente `gabrielbaugaia@gmail.com`, encontrei registros criados hoje com datas como:
  - `2020-03-13`
  - `2020-03-14`
  - `2020-03-16`
  - `2020-03-17`
  - `2024-03-18`
  - `2025-03-12`
  - `2025-03-18`
- Isso explica por que os dados “sobem”, mas não aparecem na semana atual do cliente nem impactam corretamente os painéis recentes.
- Também há inconsistência no código:
  1. o OCR aceita datas antigas/ambíguas sem validar;
  2. o batch salva 1 print por dia, mas sem trava para “últimos 7 dias”;
  3. o histórico detalhado ainda está parcialmente preso à lógica antiga de 3 prints;
  4. a edição pelo histórico ainda sincroniza `health_daily` de forma incompleta.

Plano de correção
1. Corrigir a extração de data no OCR
- Ajustar `supabase/functions/extract-fitness-data/index.ts` para o modo “Recuperar Semana”:
  - priorizar dia/mês recentes;
  - quando a imagem trouxer apenas dia e mês ou nome do dia da semana, assumir a ocorrência mais recente dentro da última semana;
  - rejeitar datas muito antigas/futuras;
  - retornar sinalização de “data ambígua” quando a IA não tiver confiança.
- Resultado esperado: parar de gravar anos como 2020/2024/2025 em uploads semanais feitos hoje.

2. Adicionar validação forte no salvamento em lote
- Atualizar `src/components/renascer/BatchFitnessUpload.tsx` para:
  - validar que cada data detectada esteja dentro de uma janela segura (ex.: últimos 7 ou 10 dias);
  - bloquear salvamento automático quando a data vier fora da janela;
  - exibir revisão manual da data antes de salvar quando a leitura estiver ambígua;
  - impedir que múltiplos prints da semana sejam aceitos com datas absurdas.
- Isso evita “falsas correções” em que o upload parece funcionar, mas grava tudo no período errado.

3. Reparar os dados já salvos incorretamente do Gabriel
- Fazer correção dos registros já criados hoje para o cliente:
  - localizar os registros inseridos pelo upload em lote de hoje com datas erradas;
  - remapear para as datas corretas da última semana;
  - atualizar `manual_day_logs`;
  - atualizar `health_daily`;
  - recalcular `sis_scores_daily` nas datas corrigidas.
- Esse passo é essencial para resolver o caso atual, não só prevenir os próximos.

4. Padronizar a sincronização entre tabelas
- Garantir que toda importação de print atualize corretamente:
  - `manual_day_logs`
  - `health_daily`
  - recomputação do SIS
  - invalidação de cache das queries da interface
- Revisar também `src/components/renascer/RecentLogsHistory.tsx`, porque ele ainda usa lógica antiga de 3 prints e sincronização parcial.

5. Ajustar a visualização para refletir o que foi importado
- Revisar os componentes que mostram “Hoje” e “Últimos 7 dias” para assegurar que:
  - dados importados retroativamente apareçam na semana correta;
  - passos/calorias/exercício/distância apareçam juntos;
  - a origem continue marcada como manual, mas com consistência visual.

Arquivos a revisar
- `supabase/functions/extract-fitness-data/index.ts`
- `src/components/renascer/BatchFitnessUpload.tsx`
- `src/components/renascer/RecentLogsHistory.tsx`
- `src/components/renascer/ManualInput.tsx`
- `src/hooks/useHealthData.ts`
- `src/components/health/HealthDashboardTab.tsx`

Ação no banco
- Não precisa nova mudança estrutural para resolver a causa principal.
- Será necessário corrigir dados já gravados incorretamente do cliente atual e recalcular os scores correspondentes.

Detalhe técnico importante
- A causa raiz está na interpretação da data do print, não no upload da imagem em si.
- Hoje o sistema consegue:
  - subir a imagem;
  - extrair números;
  - gravar linhas.
- Mas como a data detectada está errada, os dados entram fora da janela atual e parecem “sumir”.
- Vou focar em:
  1. impedir datas erradas no OCR;
  2. exigir revisão quando a data for ambígua;
  3. consertar agora os registros errados do Gabriel para a última semana ficar contabilizada corretamente.
