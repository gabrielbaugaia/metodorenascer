# Auditoria — App Consultoria Baú

Diagnóstico completo, sem alterações no código. Base: leitura das telas do aluno, sistema visual, hooks de dados, funções de bastidores e políticas de acesso ao banco.

---

## 1. O que está forte hoje

- **Identidade visual madura e coerente no núcleo.** Paleta grafite/bronze, tipografia editorial e componentes premium (`src/components/ui/premium.tsx`, `src/index.css`) entregam a percepção de consultoria, não de aplicativo genérico.
- **Tela de Treino é o padrão-ouro do app.** É a única com o ciclo completo: carregamento, estado vazio com convite para falar com o mentor, tela de erro com "tentar de novo", tempo limite de 10s e animação de sucesso ao concluir (`src/pages/Treino.tsx:122-306`).
- **PDFs client-facing já estão no nível do produto.** Treino, nutrição e mindset saem com cabeçalho discreto, tabelas legíveis e rodapé de marca (`src/lib/pdfTheme.ts`, `src/lib/generateProtocolPdf.ts`).
- **Lembretes e reengajamento bem construídos.** Inatividade de 3 dias, foto a cada 30 dias, renovação de protocolo em 30/60/85 dias e mensagens adaptadas ao perfil comportamental do aluno já rodam automaticamente.
- **Gamificação adulta na interface.** Sequência de dias, conquistas e jornada de 90 dias ("Instalação de Hábitos", "Consolidação", "Identidade") usam linguagem séria, sem confete nem infantilização.
- **Privacidade tecnicamente sólida.** Fotos corporais, exames de coração e capturas de saúde ficam em áreas privadas, cada aluno só acessa a própria pasta.
- **Carregamento sob demanda das telas.** Praticamente todas as páginas só são baixadas quando abertas.

---

## 2. Principais problemas e por que prejudicam a experiência

### 2.1 Existem duas telas "Hoje" concorrentes (crítico)
`/dashboard` é chamada de "Hoje" no menu lateral, mas no menu inferior do celular ela vira "Início" e o rótulo "Hoje" aponta para outra tela, `/renascer`. As duas mostram um anel de pontuação do dia — porém com contas diferentes (`useGabrielBauScore` vs `useSisScore`). O aluno não sabe qual número vale e o registro do dia mora fora da tela principal.

### 2.2 O plano alimentar e o diário não se falam
Quem está vendo o plano em `/nutricao` não tem nenhum caminho para registrar a refeição: o diário vive em `/nutricao-diario`, só existe no menu lateral e nem aparece no celular. Duas metades de uma mesma tarefa em endereços distintos.

### 2.3 Menu longo demais para um produto premium
13 itens na barra lateral do aluno e 10 destinos no celular, com listas que não coincidem. "Evolução", "Dados do Corpo" e o teste de condicionamento tratam do mesmo assunto — o corpo do aluno — em três lugares.

### 2.4 O aeróbico conta e o aluno não vê
Sessões de aeróbico entram no mesmo histórico do treino, mas a sequência de dias só aparece dentro da tela de Treino. O esforço é registrado e não é reconhecido.

### 2.5 Estados de erro e vazio faltam fora do Treino
Nutrição, Diário, Aeróbico, Evolução, Receitas e Mindset não têm tela de erro nem convite quando não há nada registrado — se a internet falhar, o aluno vê uma tela vazia sem explicação.

### 2.6 A tela Hoje disputa atenção consigo mesma
O botão principal muda de acordo com o dia, mas ao lado há um botão secundário ("Registrar o dia") conceitualmente mais frequente, mais um anel de pontuação largo, mais uma grade de "pilares", mais um bloco de progresso da semana com terceiro caminho para Evolução. Há ainda uma lista de atalhos definida no código e nunca exibida (`src/pages/Dashboard.tsx:397`).

### 2.7 Quase nenhum uso real é medido
Estão prontos ~25 eventos de acompanhamento, mas só 4 disparam de fato. Não se registra anamnese concluída, protocolo gerado, foto enviada, refeição marcada, tarefa de mindset feita nem intenção de cancelar. Sem isso não dá para saber onde o aluno trava nem antecipar cancelamento.

### 2.8 Tom quebra nas notificações
A interface é sóbria, mas os títulos de push e e-mail usam emojis chamativos ("🚨 Novo protocolo necessário", "🔥 Padrão forte") — é o ponto onde o produto volta a parecer aplicativo comum.

### 2.9 Acessibilidade e mobile com falhas mensuráveis
76 botões só com ícone e nenhum rótulo de leitura; 44 de 71 imagens sem descrição; nenhuma tela usa a altura correta de tela do celular (`h-dvh` = 0 ocorrências), o que corta conteúdo no iPhone; alvos de toque de 40px e 36px, abaixo do recomendado.

### 2.10 Módulo interno fora do padrão visual
As telas do MQO usam preto e amarelo fixos, ignorando o sistema de cores — é a maior fonte de inconsistência restante.

### 2.11 Direito sobre os próprios dados
Não há caminho para o aluno exportar ou apagar os próprios dados; a exclusão só existe como ação administrativa e não remove os arquivos de foto/exame guardados.

---

## 3. Roadmap priorizado

### P0 — corrigir agora (clareza e confiança)
1. Unificar as duas telas "Hoje" em uma só, com um único número do dia e o check-in dentro dela.
2. Ligar plano alimentar e diário: botão "Registrar refeição" dentro de Nutrição e entrada única no celular.
3. Padronizar erro, vazio e sucesso em todas as telas do aluno, replicando o padrão do Treino.
4. Rótulos iguais no menu lateral e no menu do celular.
5. Instrumentar os eventos que faltam (anamnese, protocolo, foto, refeição, mindset, intenção de cancelar).

### P1 — próximos (percepção de valor e retenção)
6. Reduzir o menu do aluno de 13 para 6–7 entradas, agrupando corpo/evolução/condicionamento em um só lugar e movendo Perfil, Configurações, Assinatura para o rodapé do menu.
7. Mostrar a sequência de dias de forma unificada, contando treino e aeróbico.
8. Gráfico de evolução (peso, energia, aderência) e comparação de fotos lado a lado.
9. Remover emojis das notificações e reescrever no tom da consultoria.
10. Corrigir acessibilidade: rótulos nos botões de ícone, descrições nas imagens, alvos de toque de 44px, altura de tela correta no celular.
11. Limpar a tela Hoje: um bloco herói, uma ação principal, um caminho para cada destino.

### P2 — depois (consolidação técnica)
12. Migrar o módulo MQO para os tokens do sistema visual.
13. Adotar de fato os componentes premium (cabeçalho de seção, faixa de métricas, rótulo de status) nas ~33 telas que ainda repetem o estilo à mão.
14. Quebrar os arquivos administrativos gigantes (3.082 e 1.675 linhas).
15. Unificar as animações duplicadas e remover as classes visuais legadas.
16. Exportação e exclusão de dados pelo próprio aluno, incluindo os arquivos guardados; política de retenção para exames e fotos.
17. Reengajamento por gatilho em tempo real (abandono de anamnese, teste acabando), não só por varredura diária.

---

## 4. Top 10 mudanças com maior impacto percebido pelo aluno

1. **Uma única tela "Hoje"**, com um número do dia e o check-in ali dentro.
2. **Registrar refeição a partir do plano alimentar**, sem procurar outra página.
3. **Menu enxuto de 6–7 itens**, igual no computador e no celular.
4. **Um só lugar para "meu corpo"**: fotos, medidas, peso e condicionamento juntos.
5. **Gráfico de evolução e comparação de fotos antes/depois** — é o que faz o aluno sentir resultado.
6. **Sequência de dias unificada**, contando treino e aeróbico, visível na tela inicial.
7. **Mensagens claras quando algo falha ou está vazio**, com o que fazer em seguida.
8. **Notificações no tom da consultoria**, sem emoji, com orientação concreta.
9. **App confortável no iPhone**: nada cortado, botões fáceis de acertar.
10. **Continuidade entre app e PDF**: cada plano visto na tela com o mesmo botão de baixar, com a mesma cara do documento.

---

## Observação

Este documento é diagnóstico. Nenhum arquivo do projeto foi alterado. Aprovar aqui significa apenas "li e concordo com a direção" — a execução de cada item precisa ser pedida separadamente, de preferência em blocos (P0 primeiro).
