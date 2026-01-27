
Contexto e compromisso com o seu protocolo (sem “chute”)
- Você pediu reprodução + prova em 3 níveis (DB, API, Front) e confirmação da causa raiz.
- Neste modo (read-only) eu já consigo entregar a Prova A (Banco) e a identificação exata do “endpoint” que a aba Treino chama.
- Para Prova B (API com status+body real) e Prova C (Front com console+state real), você escolheu “Criar Endpoint de Auditoria”. Vou usar isso para produzir evidência B e parte de C sem depender do DevTools do cliente.

A partir daqui, o objetivo do hotfix é:
1) Provar onde o fluxo quebra para usuários pós-mudança A/B/C/D/E (não só “parece”).
2) Corrigir sem quebrar legado (compatibilidade dupla).
3) Deixar um smoke test para não regredir e evitar gastar mais crédito.

────────────────────────────────────────────────────────────
1️⃣ Reprodução (obrigatório) — usuários pós-mudança + IDs

Usuários (Produção / domínio oficial) informados por você:
- vinicius.hs@outlook.com
- bau@gabrielbau.com.br

IDs internos (Produção / Live) — PROVA:
- vinicius.hs@outlook.com
  - user_id: ad095bfc-429b-4467-8dd2-966123f5650e
- bau@gabrielbau.com.br
  - user_id: 739b8591-0db7-4002-9c1a-c0582db55e41

IDs do plano de treino gerado (tabela protocolos, tipo='treino') — PROVA:
- Vinicius
  - protocolo_treino_id: bf0bcafd-5c74-489a-bc6c-d7beca8349d0
- Bau
  - protocolo_treino_id: f0474c9a-2159-4789-b40e-829c78677a1a

Endpoint exato chamado ao abrir a aba Treino (caminho lógico do app)
A aba Treino hoje faz a leitura via Supabase client:
- Tabela: protocolos
- Filtros: user_id=authUser.id, tipo='treino', ativo=true
- Ordenação: created_at desc
- limit 1 + maybeSingle

Na prática, isso vira uma chamada HTTP (REST) equivalente a:
GET /rest/v1/protocolos?select=id,conteudo&user_id=eq.<USER_ID>&tipo=eq.treino&ativo=eq.true&order=created_at.desc&limit=1

Observação: o “black screen” que vocês veem pode acontecer mesmo quando a query responde OK, se o front der crash ao transformar/renderizar o JSON.

────────────────────────────────────────────────────────────
2️⃣ Prova em 3 níveis

A) BANCO DE DADOS (Prova entregue agora)

Verificação: existe treino vinculado ao user_id e está em formato A/B/C/D/E
- Vinicius (bf0bcafd-5c74-489a-bc6c-d7beca8349d0)
  - ativo=true
  - conteudo.treinos: array (len=6)
  - treino[0].letra = "A"
  - treino[0].foco  = "Peito e Tríceps"
  - conteudo.semanas inexistente/len=0 (não é semanal)
- Bau (f0474c9a-2159-4789-b40e-829c78677a1a)
  - ativo=true
  - conteudo.treinos: array (len=5)
  - treino[0].letra = "A"
  - treino[0].foco  = "Peito e Tríceps"

E ainda validei um exercício do Vinicius para bater com o parser do front:
- exercicios[0] possui keys esperadas: nome, series, repeticoes, descanso, dicas, video_url

Conclusão (com evidência): NÃO é “treino não existe” nem “modelo semanal”.
O banco tem o modelo novo A/B/C/D/E para ambos.

B) API (Prova a entregar via Endpoint de Auditoria)

Como você pediu “não gastar mais crédito”, vou implementar um backend function de auditoria que:
- retorna (status + body) para esses user_ids
- mostra a mesma seleção que o front faz
- inclui diagnóstico do JSON (ex.: treinos_len, semanas_len, campos ausentes, tipos errados)
- inclui tempo de execução (ms) para provar performance

Resultado esperado do endpoint:
- status 200
- body com:
  - user_id, protocolo_id selecionado, created_at, ativo
  - resumo do JSON (treinos_len, letras encontradas)
  - “render_ready”: true/false (se o JSON tem o mínimo para o front renderizar)
  - “suspected_front_crash_reasons”: lista (ex.: treino.exercicios não-array, ex.nome ausente, etc.)

C) FRONT-END (Prova a entregar com instrumentação + captura confiável)

Hoje o Treino.tsx já tem logs detalhados (console.log) que deveriam aparecer se o bundle carregou:
- “[Treino] Component mounted”
- “[Treino] Fetching protocol…”
- “[Treino] Protocol fetch completed in …ms”
- “Rendering main content, workouts count: …”

Mas o relato “fica preto e não abre” sugere um destes cenários (precisa prova):
1) O bundle nem chega a executar (cache/service worker ou falha de carregamento de assets)
2) O app quebra antes de montar o componente Treino (erro em rota/layout/guard)
3) O componente monta, mas dá crash dentro de render de algum filho (WorkoutCard/Modal/etc.)

Para transformar isso em evidência sem depender do DevTools do cliente:
- Vou adicionar um “logger persistente” (telemetria leve) que grava no backend um evento “treino_page_trace” com:
  - timestamps (t0 mount, t1 start protocol fetch, t2 end protocol fetch, t3 render workouts)
  - outcome (success/error/timeout)
  - counts (workouts_len, treinos_len)
  - erro resumido (message/stack resumido)
- E vou expor isso no endpoint de auditoria (admin consegue consultar o último trace por user_id).

Assim você terá Prova C (estado esperado + logs) mesmo que o cliente não consiga abrir o DevTools.

────────────────────────────────────────────────────────────
3️⃣ Confirmar causa raiz (uma dessas) — como vamos provar (sem chute)

Com a Prova A, já eliminamos:
- “treino não existe”
- “query busca modelo semanal” (o banco tem treinos e o front já tem parser de treinos)

Restam as hipóteses reais e como vou provar cada uma:

H1) Cache/Service Worker servindo front antigo (muito provável quando “tela preta” e sem logs do Treino)
Prova:
- Instrumentar no app o “build/version stamp” (ex.: __APP_VERSION__)
- Logar/reportar via trace: versão do app + versão do SW + CACHE_NAME detectado
- Se usuários com problema estiverem em versão diferente da atual, é cache.

Correção:
- Bump de CACHE_NAME (v4 -> v5) + mecanismo de SKIP_WAITING + auto-reload quando detectar SW novo.
- Garantir cache-control do index.html (já existe, mas vamos reforçar a atualização ativa do SW).

H2) Crash de runtime ao renderizar (um campo inesperado em algum treino/exercício)
Prova:
- Endpoint de auditoria vai validar schema mínimo para render e listar violações.
- Trace do front vai registrar “crash before render” e o erro.

Correção:
- Compatibilidade dupla + normalização defensiva: aceitar treinos com pequenas variações (ex.: nome/name, series/sets, repeticoes/reps) sem quebrar.
- Nunca renderizar acesso direto a campos sem fallback.

H3) Guard/redirect (SubscriptionGuard/Admin redirect) disparando loop ou levando para rota inválida
Prova:
- Trace registra rota, redirects e motivo (subscribed/localSub/admin).
- Endpoint pode correlacionar status da assinatura e se houve access_blocked/pending_payment.

Correção:
- Ajustar guard para não criar loop e exibir erro explícito em vez de “preto”.

H4) Request 406/4xx/timeout intermitente (já vimos 406 em relatos anteriores)
Prova:
- Trace registra status e duração.
- Endpoint de auditoria registra se a mesma query via service role funciona e se via client falha (quando possível).

Correção:
- Retry com backoff e UX de erro já existente; completar com fallback “Recarregar dados” e instrução para limpar cache quando for caso de SW.

────────────────────────────────────────────────────────────
4️⃣ Correção obrigatória (compatibilidade dupla, sem quebrar legado)

O front já tem compatibilidade dupla na extração:
- Se conteudo.treinos[] => renderiza modelo A/B/C/D/E
- Se conteudo.semanas[] => renderiza legado semanal
- Se nenhum => mensagem clara

O que falta para ficar “à prova de formato” (hotfix):
- Normalização defensiva de exercícios:
  - aceitar campos alternativos (nome/name, series/sets, repeticoes/reps, descanso/rest, video_url/videoUrl)
  - garantir sempre Array.isArray(exercicios)
- Proteções de render (nenhuma tela preta):
  - se workouts_len === 0 mas existe treinos_len>0 => exibir “Treino existe, mas não conseguiu renderizar” + botão de “Reportar” (gera trace e mostra código para suporte)
- Recovery de cache:
  - auto-update do SW e hard reload orientado (sem depender do usuário “adivinhar”)

────────────────────────────────────────────────────────────
5️⃣ Teste / Smoke test (para não gastar mais crédito e não voltar)

Vou criar dois tipos de teste:

T1) Smoke test de backend function (Deno test)
- Chama o endpoint de auditoria para user_id do Vinicius e do Bau
- Asserções:
  - status 200
  - protocolo_id presente
  - treinos_len > 0
  - render_ready === true

T2) Teste unitário do “mapper” (front)
- Dado um JSON mínimo com treinos A/B/C, garante que:
  - workouts.length >= 1
  - cada workout possui exercises[] com campos coerentes
Isso evita regressão quando mudar o prompt/IA e variar nomes de campos.

────────────────────────────────────────────────────────────
6️⃣ Entrega obrigatória — exatamente o que você pediu

Quando você aprovar a implementação (próximo passo em modo default), eu entrego no final:

1) Evidência A, B e C
- A (DB): já tenho e vou incluir novamente no relatório final com queries/prints (mascarando só o que for sensível)
- B (API): output real do endpoint de auditoria (status + body)
- C (Front): trace gravado (timestamps + versão + outcome + erro se houver)

2) Lista exata do que foi alterado (arquivos/rotas/queries)
- Arquivos do backend function de auditoria
- Ajustes no SW/atualização (se confirmado cache)
- Ajustes defensivos no parser de treinos (se confirmado crash)
- Test files

3) Resultado do teste (pass)
- Logs do runner do Deno test

4) Vídeo/GIF abrindo a aba Treino
Limitação técnica importante:
- Eu não consigo gravar vídeo do navegador real do cliente em produção por aqui.
Como vamos cumprir isso na prática sem “gastar mais crédito”:
- Eu implemento um “modo diagnóstico” que abre /treino e exibe no topo um “debug banner” com versão + status + workouts_len (somente para admin).
- Você (ou alguém do time) grava 10–15s de screen record no celular/desktop (é rápido) e me manda o arquivo/print.
- Alternativa: eu preparo um passo-a-passo “1 clique” para vocês coletarem esse GIF sem DevTools.

────────────────────────────────────────────────────────────
Sequência de execução (o que vou fazer assim que você aprovar mudar para modo default)

P0 — Auditoria + Provas
1) Criar backend function: audit-treino (admin-only)
   - Entrada: user_id (ou email)
   - Saída: DB snapshot + validação de schema + tempo + recomendação
2) Adicionar telemetria leve (events) “treino_page_trace”
3) Expor no Admin um botão “Auditar Treino” (ou somente endpoint, como você escolheu)

P0 — Fix conforme causa comprovada
4) Se for cache/SW: bump cache + auto update + reload controlado
5) Se for crash: normalização defensiva do mapper (sem quebrar legado)
6) Se for guard/redirect: logs + correção de loop + fallback visível

P0 — Tests
7) Adicionar Deno smoke test do endpoint audit-treino
8) Adicionar unit test do mapper treinos/semanas

────────────────────────────────────────────────────────────
Checklists de validação (objetivo: não gastar mais crédito)

Checklist técnico (automatizado)
- [ ] Deno test: audit-treino para Vinicius PASS
- [ ] Deno test: audit-treino para Bau PASS
- [ ] Unit test mapper: treinos PASS
- [ ] Unit test mapper: semanas PASS

Checklist de produção (manual, 3 minutos)
- [ ] Login como Vinicius -> /treino abre e renderiza A/B/C… (sem tela preta)
- [ ] Login como Bau -> /treino abre e renderiza
- [ ] 10 tentativas seguidas: /treino abre < 3s (verificado via trace ou Network timing)
- [ ] Se falhar: aparece erro com “Tentar novamente” (não infinito / não preto)

Notas finais (estado atual do diagnóstico)
- Hoje eu tenho evidência clara de que o modelo A/B/C/D/E foi gerado e está salvo corretamente para esses dois usuários, inclusive em produção.
- Portanto, a causa raiz mais provável não é “não gerou treino”, e sim “front não está conseguindo executar/renderizar” (cache/SW ou crash). O endpoint de auditoria + trace vai cravar qual das opções é a real com prova, não opinião.
