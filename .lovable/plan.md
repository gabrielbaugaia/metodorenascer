## ETAPA 4 — Painel admin de WhatsApp

Criar UI para o admin (você) ver conversas recebidas pelo WhatsApp e responder direto pelo painel, usando a função `whatsapp-send` da Etapa 3.

### Escopo

Página nova `/admin/whatsapp` com layout de duas colunas (padrão chat):
- **Coluna esquerda** — lista de contatos/conversas (mais recente primeiro)
- **Coluna direita** — timeline da conversa selecionada + campo de resposta

Sem mudanças no banco, sem novas Edge Functions. Apenas frontend consumindo:
- `whatsapp_contacts` + `whatsapp_messages` (leitura via RLS admin)
- `whatsapp-send` (envio)
- Realtime em `whatsapp_messages` para mensagens novas chegarem ao vivo

### Componentes/arquivos

- `src/pages/admin/AdminWhatsApp.tsx` — página principal
- Registro em `src/App.tsx`:
  ```tsx
  const AdminWhatsApp = lazy(() => import("./pages/admin/AdminWhatsApp"));
  <Route path="/admin/whatsapp" element={<AdminGuard><AdminWhatsApp /></AdminGuard>} />
  ```
- Link no menu admin (procurar `ClientSidebar`/`Admin.tsx` e adicionar item "WhatsApp" com ícone `MessageCircle` apontando pra `/admin/whatsapp`)

### Layout

```text
┌─────────────────────────────────────────────────────────┐
│ WhatsApp                                                │
├──────────────┬──────────────────────────────────────────┤
│ [busca]      │  Nome / +55 11 9...                      │
│              │  vinculado a: aluno X (se houver)        │
│ ▸ Contato A  ├──────────────────────────────────────────┤
│   última msg │                                          │
│   há 2 min   │   [bolha inbound]                        │
│ ▸ Contato B  │           [bolha outbound]               │
│   ...        │                                          │
│              │                                          │
│              ├──────────────────────────────────────────┤
│              │  [textarea]                  [Enviar]    │
└──────────────┴──────────────────────────────────────────┘
```

Mobile: lista vira tela cheia, ao tocar abre a conversa em rota empilhada (mesma página com estado).

### Dados — coluna esquerda

Query inicial: agrupar `whatsapp_messages` por `from_phone`/`to_phone` para listar contatos com última mensagem:

```sql
-- pseudo, feito no client em 2 selects:
select * from whatsapp_contacts order by updated_at desc nulls last limit 100;
-- para cada contato, pegar última msg via:
select body, created_at, direction
from whatsapp_messages
where from_phone = ? or to_phone = ?
order by created_at desc limit 1;
```

Quando o volume crescer, criar uma view. Por ora, 2 queries simples.

Mostrar:
- `display_name` (fallback `phone_e164`)
- preview da última mensagem (60 chars)
- horário relativo (`formatDistanceToNow` pt-BR)
- badge de "não lido" se houver inbound `created_at` > `last_read_at` local (armazenar `last_read_at` por conversa em `localStorage` por ora — sem alterar banco nesta etapa)

### Dados — coluna direita

Ao selecionar um contato, buscar:
```sql
select * from whatsapp_messages
where from_phone = '+55...' or to_phone = '+55...'
order by created_at asc
limit 200;
```

Renderizar bolhas:
- `direction='inbound'` → bolha cinza à esquerda
- `direction='outbound'` → bolha laranja (#FF6A3D) à direita, com ícone `status` (sent/failed)

### Envio

Campo `Textarea` + botão "Enviar":
1. Validar 1–4096 chars.
2. `supabase.functions.invoke('whatsapp-send', { body: { to, body } })`.
3. Em sucesso, otimistic-append já é dispensável porque o realtime traz o INSERT da própria `whatsapp_messages` outbound.
4. Em erro, toast com `meta_status` + mensagem da API.

### Realtime

```ts
supabase.channel('wa-admin')
  .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'whatsapp_messages' },
      payload => { /* atualizar lista + conversa aberta se bater */ })
  .subscribe();
```

Migration mínima necessária:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_messages;
ALTER TABLE public.whatsapp_messages REPLICA IDENTITY FULL;
```
(Única alteração de banco desta etapa — sem novas tabelas, sem novas policies.)

### Acesso

Página protegida por `AdminGuard` (igual `AdminSuporteChats`). RLS já garante que só admin lê `whatsapp_messages`/`whatsapp_contacts`.

### Fora do escopo

- Sem busca de mensagens por texto (só por contato).
- Sem envio de mídia (imagem/áudio/documento) — Etapa 5 quando precisar.
- Sem templates aprovados (HSM) — só mensagem livre dentro da janela 24h.
- Sem IA respondendo automático — Etapa 6.
- Sem marcar "lido" persistente no banco — usa `localStorage` por ora.

### Como validar

1. Você envia mensagem do seu WhatsApp pessoal pro número Business.
2. Em até 2s, a conversa aparece no `/admin/whatsapp` com sua mensagem.
3. Você responde pelo painel → chega no seu WhatsApp.
4. A bolha outbound aparece na timeline com status `sent`.
5. `whatsapp_messages` no banco tem as 2 linhas (`inbound` + `outbound`) ligadas ao mesmo telefone.

### Arquivos editados

- 1 migration curta (realtime publication).
- `src/pages/admin/AdminWhatsApp.tsx` (novo, ~300 linhas).
- `src/App.tsx` (rota + lazy import).
- 1 sidebar/menu admin (1 linha).
