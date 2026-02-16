
# Pagina de Documentacao Tecnica — /admin/docs/conector-mobile

## Resumo

Criar uma pagina interna no painel admin contendo a especificacao tecnica completa do "Renascer Connect" (conector mobile). A pagina sera somente leitura, acessivel apenas para admins, com layout tecnico e organizado.

**Nenhuma funcionalidade existente sera alterada.**

---

## Arquivos a Criar

### 1. `src/pages/admin/AdminConectorMobileDocs.tsx`

Pagina unica contendo todas as 10 secoes da documentacao:

- Verificacao de admin via `useAdminCheck()` (mesmo padrao das demais paginas admin)
- Redirecionamento para `/entrar` se nao for admin
- Layout usando `ClientLayout` (padrao admin existente)
- Conteudo renderizado com componentes Card, Badge, Tabs e blocos de codigo estilizados
- Secoes: Visao Geral, Autenticacao, Endpoint, Metricas, iOS, Android, Checklist, Teste, Seguranca, Status
- Checklist interativo (visual apenas, sem persistencia)
- Blocos de codigo com fundo escuro e fonte mono
- Diagrama de fluxo em texto (Apple Watch -> HealthKit -> App -> Edge Function -> DB -> /dados-corpo)
- Badges de status (pronto/pendente) na secao 10

---

## Arquivos a Modificar

### 2. `src/App.tsx`

- Adicionar lazy import para `AdminConectorMobileDocs`
- Adicionar rota: `<Route path="/admin/docs/conector-mobile" element={<AdminConectorMobileDocs />} />`
- Inserido na secao de rotas admin existente

---

## Secao Tecnica

- A pagina usa os mesmos hooks e componentes do projeto (useAuth, useAdminCheck, ClientLayout, Card, Badge, Tabs)
- Nenhuma tabela de banco de dados e criada ou modificada
- Nenhuma edge function e criada ou modificada
- O conteudo e estatico (hardcoded) — nao depende de dados do banco
- A URL do Supabase e anon key serao referenciadas via `import.meta.env.VITE_SUPABASE_URL` e `import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY` para exibicao dinamica na documentacao
- Layout mobile-friendly com scroll vertical e secoes colapsaveis via Accordion
