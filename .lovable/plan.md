## ETAPA 3 — `whatsapp-send` (envio via Cloud API da Meta)

Criar a Edge Function que envia mensagens pelo WhatsApp Cloud API usando secrets do Supabase. Sem frontend nesta etapa — só o endpoint + persistência outbound.

### Escopo

1 Edge Function nova: `supabase/functions/whatsapp-send/index.ts`
+ 1 entrada em `supabase/config.toml`
+ 2 secrets novos (via tool de secrets, com aprovação do user)

### Secrets necessários

- `WHATSAPP_ACCESS_TOKEN` — token permanente do app da Meta (System User token)
- `WHATSAPP_PHONE_NUMBER_ID` — ID do número WhatsApp Business (encontrado no painel da Meta)

Token NUNCA vai pro frontend. Fica só no server.

### Autenticação da função

`verify_jwt = true`. Apenas chamadores autenticados podem disparar envio. Dentro da função, valido também que o user é **admin** via `has_role` (reaproveitando o padrão `requireAdminOrService` do `_shared/auth.ts`). Aluno não envia mensagem em nome do número oficial.

### Contrato da requisição

`POST /functions/v1/whatsapp-send`
```json
{
  "to": "+5511999999999",        // obrigatório, E.164
  "user_id": "uuid-opcional",    // se omitido, tenta resolver pelo telefone
  "conversa_id": "uuid-opcional",
  "type": "text",                // por enquanto só "text"
  "body": "Olá, tudo bem?"       // obrigatório quando type=text
}
```

Validação com Zod (mesmo padrão das outras functions). Erros → 400 com mensagem clara.

### Fluxo

1. Validar JWT + admin (`requireAdminOrService`).
2. Validar body (Zod).
3. Chamar Cloud API:
   ```
   POST https://graph.facebook.com/v21.0/{PHONE_NUMBER_ID}/messages
   Authorization: Bearer {WHATSAPP_ACCESS_TOKEN}
   { messaging_product: "whatsapp", to, type: "text", text: { body } }
   ```
4. Capturar `messages[0].id` da resposta (= `wa_message_id`).
5. Resolver `user_id` se não veio (busca em `profiles.whatsapp`/`telefone`, mesma lógica do webhook).
6. Resolver `conversa_id` se não veio (`ensureConversa` tipo `whatsapp`).
7. Inserir em `whatsapp_messages`:
   - `direction='outbound'`, `from_phone` = display do número, `to_phone`, `body`, `payload_json` = resposta da API, `status='sent'` (ou `failed` em erro), `wa_message_id`.
8. `appendConversaMessage` com `role:'assistant', channel:'whatsapp'` para refletir no painel de conversas.
9. Retornar `{ ok: true, wa_message_id, conversa_id }`.

Erros da Meta (token inválido, número fora da janela de 24h, etc.) → gravar registro `status='failed'` + `payload_json` com o erro, e retornar 502 com `{ ok:false, error }`.

### Fora do escopo desta etapa

- Nenhuma UI nova (painel admin é Etapa 4).
- Sem templates/HSM ainda — apenas mensagem livre dentro da janela de 24h.
- Sem mídia (imagem/áudio/documento) — só `text`.
- Sem IA/auto-resposta — quem dispara é admin manualmente (ou outra função no futuro).

### Validação após deploy

1. Curl autenticado como admin com `to` válido → 200, mensagem chega no WhatsApp real, linha em `whatsapp_messages` com `direction='outbound'`.
2. Curl sem auth → 401.
3. Curl autenticado como user comum → 403.
4. `to` inválido (sem +) → 400.
5. Token Meta errado (forçando) → 502 + registro `failed` no banco.

### Arquivos

- `supabase/functions/whatsapp-send/index.ts` (novo)
- `supabase/config.toml` (adicionar bloco `[functions.whatsapp-send]` com `verify_jwt = true`)
- Secrets: `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` (pedidos via `add_secret` quando você aprovar o plano)

Após aprovação, executo na ordem: pedir secrets → criar função → atualizar config → deploy → smoke test via curl.
