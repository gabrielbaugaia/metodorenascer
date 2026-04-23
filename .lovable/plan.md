

## Vídeos do aluno + Preview no admin — v8

Dois ajustes pra completar o ciclo: (1) ver no admin como o vídeo vai aparecer pro aluno antes de salvar, (2) melhorar a página `/reels` do aluno.

### 1. Preview "Como o aluno vê" dentro do EditReelModal

Hoje o admin edita título/legenda/grupos no modal mas só descobre como ficou abrindo `/reels` em outra aba. Solução: painel de preview **lado a lado** com os campos.

- Layout do `DialogContent`: passa de `max-w-lg` (uma coluna) pra `max-w-3xl` com grid `lg:grid-cols-[1fr_240px]` — formulário à esquerda, preview à direita
- No mobile (<lg): preview vira accordion no topo "👁 Pré-visualizar como aluno" (recolhido por padrão pra não atrapalhar)
- Componente novo `<ReelPreviewCard>` reusa exatamente a estrutura visual do `ReelTile` da página `/reels`:
  - Card 9:16, vídeo com poster, badge categoria canto superior, overlay de descrição embaixo (só se `show_description=true`), título + grupos abaixo do vídeo
  - Recebe os valores **dos states do form** (não do banco) → atualiza em tempo real conforme admin digita
  - Vídeo silenciado, com botão play/pause centralizado igual ao do aluno
- Benefício: admin vê instantaneamente se a descrição cobre demais o vídeo, se o título corta, se os grupos estão coerentes

### 2. Página `/reels` do aluno — usabilidade

Problemas atuais:
- **Sem busca**: 197 vídeos, único filtro é categoria + grupo (combo cheio demais)
- **Som global mas confuso**: botão fica isolado no topo, fácil esquecer
- **Tap em vídeo dá play, mas sem indicador de tempo/progresso**: usuário não sabe se carregou
- **Descrição overlay tampa metade do vídeo** quando `show_description=true` — atrapalha execução
- **Sem fullscreen**: vídeo fica pequeno em desktop, e no mobile não dá pra expandir
- **Carrega tudo de uma vez**: 197 vídeos = 197 `<video>` elements simultâneos = lentidão

Mudanças concretas:

**a. Busca por texto** (campo `<Input>` no topo, ícone 🔍):
- Filtra `title` + `description` + `muscle_groups` localmente (case-insensitive)
- Combina com filtros de categoria/grupo já existentes
- Contador "X vídeos" ao lado dos filtros

**b. Lazy loading de vídeo via IntersectionObserver**:
- Trocar `<video src=...>` por carregamento sob demanda: enquanto fora do viewport, mostra só `<img src={poster}>`
- Quando entra no viewport (`rootMargin: 200px`), monta o `<video>` real
- Reduz drasticamente o consumo de memória/rede em listas grandes

**c. Modal fullscreen ao tocar no vídeo**:
- Substituir o play inline por abertura de modal `Dialog` em tela cheia (`max-w-2xl`, fundo preto)
- Modal mostra: vídeo grande 9:16 com controles nativos (`controls`), título, descrição completa (sem truncate), grupos como badges
- Botão "Próximo" / "Anterior" pra navegar entre vídeos filtrados sem fechar o modal (estilo TikTok lite)
- Tap no card abre modal; play inline fica como "preview" silencioso ao passar o mouse (desktop) ou desabilitado no mobile

**d. Descrição: trocar overlay por toggle "ⓘ"**:
- Em vez do overlay fixo cobrindo o vídeo, mostrar ícone "ⓘ" pequeno no canto superior direito do card quando há descrição
- Tap no ícone abre o modal já na seção de descrição (ou simplesmente expande um bottom sheet curto)
- Mantém a thumb do vídeo limpa, descrição vira opt-in

**e. Filtro de grupo como chips horizontais (mobile-friendly)**:
- Trocar o `<Select>` de grupos por uma row scroll-x de `<Badge variant="outline">` clicáveis
- Toque no chip ativa filtro; chip ativo fica filled. Mais rápido que abrir dropdown

**f. Header sticky com filtros**:
- O bloco filtros vira `sticky top-12 z-30` com `bg-background/95 backdrop-blur` pra ficar acessível durante o scroll

**g. Empty state melhor**:
- Quando filtro retorna 0, mostrar botão "Limpar filtros" que reseta tudo

### Detalhes técnicos

**Arquivos editados:**
- `src/components/admin/EditReelModal.tsx`:
  - Mudar `DialogContent` para `max-w-3xl` + grid responsivo
  - Adicionar `<ReelPreviewCard>` (componente local no mesmo arquivo) que recebe `{title, description, showDescription, category, groups, videoUrl, posterUrl}` e renderiza idêntico ao tile do aluno
  - No mobile, envolver preview em `<Collapsible>` recolhível

- `src/pages/Reels.tsx`:
  - Adicionar `searchQuery` state + `<Input>` com ícone Search
  - Refatorar `ReelTile` para usar IntersectionObserver e renderizar `<img poster>` até entrar em view
  - Adicionar `selectedReel` state + `<Dialog>` fullscreen com navegação prev/next (botões + swipe se possível via touch events)
  - Trocar overlay de descrição por ícone Info clicável no canto
  - Substituir `<Select>` de grupos por `<ScrollArea>` horizontal com chips
  - Adicionar `sticky` + backdrop no header de filtros
  - Empty state com botão de reset

**Sem mudanças em:** banco, RLS, edge functions, painel admin (fora do EditReelModal), upload, categorias.

