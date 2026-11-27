# Comparar avaliações físicas por data (Admin e aluno) com PDF

## O que muda para você
- **Admin → Avaliações (ex.: Rodrigo):** cada data do histórico vira um cartão clicável. Ao clicar, abre a avaliação completa daquela data. Marque duas datas ("Comparar") e abre a tela de comparação.
- **Tela de comparação (Admin e aluno), visual premium Gabriel Baú:**
  - Cabeçalho "Antes → Depois" com as duas datas e o intervalo em dias.
  - Cartões grandes com a variação de % gordura, massa gorda, massa magra, peso, IMC, RCQ e RCE (seta e cor só onde a leitura é objetiva; peso, IMC e medidas ficam neutros).
  - Barras lado a lado para dobras e circunferências.
  - Fotos da mesma posição lado a lado (frente, lado, costas).
  - Botão "Baixar PDF da comparação".
- **Área do aluno (Minhas Avaliações):** as datas viram cartões; o aluno abre qualquer avaliação, baixa o PDF dela e escolhe duas datas para ver a comparação e baixar o PDF. Só aparecem avaliações publicadas.

## PDF da comparação
- Capa no padrão Gabriel Baú (grafite/bronze), nome do cliente, as duas datas.
- Quadro resumo com as variações, tabela completa (indicador, antes, depois, diferença, %), barras visuais das dobras e circunferências, fotos lado a lado sem distorção, observações e recomendações da avaliação mais recente, nota do método e rodapé Equipe GB.
- O PDF individual de cada avaliação continua igual.

## Fora do escopo
- Nenhuma mudança no banco de dados nem nas regras de acesso (aluno continua vendo só as suas publicadas).
- Cálculos não mudam.

## Detalhes técnicos
- Novo `src/components/assessment/AssessmentCompare.tsx` (seleção de duas datas + visual), reaproveitando `METRICS`, `diff`, `trend`, `PhotoGrid` e `useAssessmentPhotos`.
- `ComparisonPanel` substituído por esse componente em AdminAvaliacoes, AdminEvolucaoFisica e MinhasAvaliacoes.
- AdminAvaliacoes: estado `selectedId` para abrir qualquer data em `AssessmentSummary` (hoje mostra só a última); rascunhos ficam fora da comparação do aluno.
- Novo `exportComparisonPdf(a, b, photosA, photosB, nome)` em `src/lib/assessmentPdf.ts` usando `pdfTheme`; fotos com proporção preservada.
- Função pura `buildComparison(a, b)` com teste (ex.: avaliação com 20% e outra com 17,96% → −2,04 p.p.; intervalo em dias correto).
- Verificação com Playwright: admin abre data, compara duas, baixa PDF; visualização em 375px e desktop.
