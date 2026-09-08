# Redesign premium do App Consultoria Baú

## Objetivo
Transformar a área interna em uma experiência editorial premium para alunos 30+, mantendo integralmente autenticação, banco, rotas, regras de acesso, formulários, PDFs, uploads, vídeos, check-ins e demais ações existentes.

## Direção aprovada
- Sidebar fixa escura em grafite profundo, com marca “GABRIEL BAÚ” e “CONSULTORIA”, ícones lineares e seleção discreta em bronze.
- Área principal clara/off-white, com superfícies claras e blocos escuros apenas quando houver hierarquia real.
- Manrope como fonte principal; títulos fortes e sem texto pequeno demais.
- Bronze limitado a ações, foco, progresso e pequenos marcadores.
- Bordas sutis, sombra mínima, raios entre 14 e 18px e espaçamento generoso.
- Sem emojis, neon, gradientes chamativos ou excesso de mini-cards e círculos de progresso.

## Implementação
1. **Base visual e componentes reutilizáveis**
   - Atualizar tokens globais para a paleta clara/escura definida, incluindo estados, sidebar, bordas, inputs e elevação.
   - Atualizar tipografia, escala, espaçamentos e raios.
   - Padronizar `PageHeader`, botões, cards, métricas, barras de progresso, campos, abas, accordions, estados vazios e rótulos de status.
   - Criar componentes auxiliares apenas onde reduzirem repetição, sem reescrever regras funcionais.

2. **Estrutura principal**
   - Refinar sidebar desktop de 264px e manter recolhimento por ícones.
   - Aplicar canvas off-white ao conteúdo e preservar a navegação móvel.
   - Ajustar largura, respiro e hierarquia do conteúdo em desktop e mobile.

3. **Página Hoje como referência**
   - Organizar saudação, foco do dia, ação principal e registro/check-in.
   - Substituir a centralidade do anel por métricas editoriais e barras lineares quando possível, sem remover o score funcional.
   - Criar faixa semanal com apenas métricas relevantes.
   - Apresentar Treino, Nutrição, Aeróbico e Mindset em blocos amplos.
   - Manter pendências, risco, recuperação, renovação e orientação do treinador de forma contextual e discreta.

4. **Propagação por tela**
   - **Evolução:** métricas essenciais, histórico/timeline, comparativos e fotos com tratamento premium.
   - **Treino:** resumo do ciclo, sessões amplas e prescrição detalhada; manter conclusão, vídeos, observações e PDF.
   - **Aeróbico:** resumo, registro e histórico em fluxo editorial.
   - **Nutrição:** faixa de kcal/macros/hidratação, alternância treino/descanso, refeições e orientações em accordions.
   - **Diário Nutricional:** consumido/meta/restante, macros, refeições e ação de adicionar alimento sem excesso de gráficos circulares.
   - **Receitas:** busca por ingredientes, filtros e resultado como ficha editorial, sem aparência de gerador genérico.
   - **Vídeos:** biblioteca com filtros claros, thumbnails consistentes e cards discretos.
   - **Mindset:** progresso linear, orientação central e práticas maduras, sem ícones lúdicos.
   - **Meu Perfil e Configurações:** agrupar formulários e preferências em seções leves e legíveis.

5. **Consistência e validação**
   - Remover emojis e resíduos visuais antigos nas telas do escopo.
   - Preservar todos os campos, estados, ações e controles atuais.
   - Validar compilação e fluxos públicos; validar telas autenticadas com sessão de teste disponível.
   - Conferir desktop e mobile para evitar cortes, colisões e texto ilegível.

## Limites técnicos
- Nenhuma alteração em tabelas, políticas, autenticação, pagamentos, funções ou regras de negócio.
- Nenhuma rota ou recurso será removido.
- Mudanças restritas à apresentação, organização visual e composição dos componentes.
