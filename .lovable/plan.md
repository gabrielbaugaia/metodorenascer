## ETAPA 1 — Banco de dados WhatsApp

Criar apenas a fundação no banco. Sem frontend, sem Edge Functions, sem token. Migrations Supabase com RLS, índices e triggers.

### Escopo

Criar 3 tabelas novas em `public`, todas com RLS habilitada e policies coerentes com o padrão do projeto (admin via `has_role(auth.uid(), 'admin'::app_role)`; usuário enxerga apenas o que está vinculado ao próprio `user_id`).

**Importante:** o projeto liga FKs em `public.profiles(id)` (regra de arquitetura), não em `auth.users`. Vou seguir essa convenção, igual ao restante do schema.

### Tabelas

**1. `whatsapp_contacts`**
- `id uuid pk default gen_random_uuid()`
- `user_id uuid null references profiles(id) on delete set null`
- `phone_e164 text not null unique`
- `wa_id text null`
- `display_name text null`
- `opt_in_at timestamptz null`
- `opt_out_at timestamptz null`
- `status text not null default 'active'`
- `created_at`, `updated_at` (com trigger `update_updated_at_column`)

**2. `whatsapp_messages`**
- `id uuid pk default gen_random_uuid()`
- `user_id uuid null references profiles(id) on delete set null`
- `conversa_id uuid null references conversas(id) on delete set null`
- `wa_message_id text unique null`
- `direction text not null check (direction in ('inbound','outbound'))`
- `from_phone text null`
- `to_phone text null`
- `message_type text not null default 'text'`
- `body text null`
- `payload_json jsonb not null default '{}'::jsonb`
- `status text null`
- `created_at timestamptz not null default now()`

**3. `whatsapp_webhook_events`**
- `id uuid pk default gen_random_uuid()`
- `event_hash text unique`
- `payload_json jsonb not null`
- `processed_at timestamptz null`
- `created_at timestamptz not null default now()`

### Índices

- `whatsapp_contacts(user_id)`, `whatsapp_contacts(phone_e164)` (já único)
- `whatsapp_messages(user_id)`, `(conversa_id)`, `(wa_message_id)`, `(created_at desc)`
- `whatsapp_webhook_events(created_at desc)`, `(processed_at)`

### RLS

- **whatsapp_contacts**
  - Admin: ALL via `has_role(auth.uid(),'admin')`
  - User SELECT: `auth.uid() = user_id`
- **whatsapp_messages**
  - Admin: ALL
  - User SELECT: `auth.uid() = user_id`
- **whatsapp_webhook_events**
  - Admin: ALL
  - Sem acesso para usuários comuns (dados brutos do webhook)

Inserts/updates ficam por conta de service role (Edge Functions nas próximas etapas) — RLS bloqueia anon/authenticated por padrão.

### Triggers

- `update_updated_at_column` em `whatsapp_contacts` (BEFORE UPDATE).
- Tabelas `whatsapp_messages` e `whatsapp_webhook_events` não têm `updated_at` (imutáveis após gravação).

### Fora do escopo desta etapa

- Não criar Edge Functions.
- Não tocar em `conversas` (a inclusão de `tipo='whatsapp'` no CHECK fica para Etapa 2, quando o webhook realmente precisar gravar lá).
- Não mexer em frontend, secrets ou `profiles`.

### Como validar após aplicar

1. Em `Connectors → Lovable Cloud → View Backend`, conferir que existem as 3 tabelas com RLS habilitada.
2. `select * from whatsapp_contacts limit 1;` retorna vazio sem erro.
3. Tentar inserir como usuário autenticado comum deve falhar (RLS); admin consegue.
4. `\d whatsapp_messages` mostra a FK para `conversas(id)` e o check de `direction`.

### Arquivos

- 1 migration nova criada via tool de migration (sem edição de código frontend).
