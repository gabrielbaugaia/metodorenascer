## Por que o menu não aparecia

O item "WhatsApp" que adicionei na Etapa 4 foi parar só nos **quick actions do `AdminDashboard.tsx`** (cards de atalho dentro da página `/admin`). Mas o menu lateral de verdade é o **`ClientSidebar.tsx`**, que tem seu próprio array `adminSections` separado — e ele não foi atualizado. Por isso você não vê nada no menu.

---

## Parte A — Fix rápido do menu (5 min)

Adicionar item "WhatsApp" na seção **SUPORTE** do `ClientSidebar.tsx` (`src/components/layout/ClientSidebar.tsx`, linhas 103-109):

```ts
{
  label: "SUPORTE",
  items: [
    { title: "Chats", url: "/admin/suporte", icon: MessageCircle },
    { title: "WhatsApp", url: "/admin/whatsapp", icon: MessageSquare }, // ← novo
    { title: "Documentação", url: "/admin/docs/conector-mobile", icon: BookOpen },
  ],
},
```

Usa ícone `MessageSquare` (já no lucide-react) pra diferenciar do "Chats" (`MessageCircle` do suporte interno).

---

## Parte B — Etapa 5: Cliente acessa treino e check-in pelo WhatsApp

### Visão

Cliente já vinculado (profile.whatsapp casado com o número que envia) consegue, **sem abrir o app**:

| Comando do cliente | Bot responde |
|---|---|
| `treino`, `treino de hoje`, `qual meu treino` | Texto com os exercícios do dia (nome, séries × reps, descanso) |
| `feito`, `terminei`, `concluí` | Marca workout_completion do dia + responde "✅ Treino registrado. Streak: 5 dias" |
| `check-in`, `como tô` | Pergunta as 3 métricas rápidas (energia, sono, estresse) em sequência |
| `7 8 4` (resposta numérica após check-in) | Salva em manual_day_logs + confirma |
| `?`, `ajuda`, `menu` | Lista os comandos disponíveis |
| Qualquer outra coisa | Resposta padrão: "Não entendi. Digite *ajuda* pra ver opções, ou aguarda que o Gabriel responde." → fica como inbound normal pro admin tratar no painel |

**Fora do escopo desta etapa:** IA livre (LLM respondendo qualquer pergunta), envio de mídia (foto do treino, vídeo), nutrição, mindset, recibos. Tudo isso vira Etapa 6+.

### Arquitetura

```text
WhatsApp Cloud API
       │
       ▼
whatsapp-webhook (já existe)
       │  insere em whatsapp_messages (inbound)
       │  se body começa com comando reconhecido E user_id != null
       ▼
whatsapp-bot-router (NOVO — invocado in-process pelo webhook)
       │
       ├─ parse intent (regex simples, sem LLM)
       ├─ executa ação no banco (read protocolos / insert workout_completions / insert manual_day_logs)
       ├─ monta resposta em texto
       │
       ▼
whatsapp-send (já existe) → cliente recebe
       │
       └─ insere whatsapp_messages outbound → painel admin vê tudo
```

**Decisões-chave:**

1. **Sem LLM nesta etapa** — parser determinístico (regex/keywords pt-BR). Mais rápido, previsível, barato, e o painel admin já existe pra fallback humano.
2. **Estado de conversa** efêmero numa nova tabela `whatsapp_bot_sessions` (user_id, current_flow, step, data jsonb, expires_at) com TTL de 10 min — necessário pra fluxo de check-in multi-turno.
3. **Toda resposta do bot é logada como outbound em `whatsapp_messages`** com flag `meta.bot_generated = true`, então o admin vê no painel da Etapa 4 e pode interromper digitando manualmente.
4. **Se o user não está vinculado** (`profile.whatsapp` não bate), o bot não responde — cai no fluxo normal de inbound que admin trata na mão. Sem onboarding automático nesta etapa.

### Mudanças no banco

```sql
-- Sessão de bot pra fluxos multi-turno (check-in)
CREATE TABLE public.whatsapp_bot_sessions (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  flow text NOT NULL,                    -- 'checkin' | 'workout_log' | etc.
  step int NOT NULL DEFAULT 0,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes'),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.whatsapp_bot_sessions ENABLE ROW LEVEL SECURITY;
-- Só service role manipula (edge functions). Admin pode ler pra debug.
CREATE POLICY "admin_read_bot_sessions" ON public.whatsapp_bot_sessions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Coluna em whatsapp_messages pra marcar mensagens do bot (se não existir já)
ALTER TABLE public.whatsapp_messages
  ADD COLUMN IF NOT EXISTS bot_generated boolean NOT NULL DEFAULT false;
```

### Arquivos

**Novo:**
- `supabase/functions/_shared/whatsappBot.ts` — funções puras de parse de intent + handlers (read-only no banco usa service client passado por parâmetro).
- `supabase/functions/_shared/whatsappBot.test.ts` — testes Deno cobrindo cada intent.

**Editado:**
- `supabase/functions/whatsapp-webhook/index.ts` — depois de inserir inbound e identificar `userId`, chamar `runBot(supabase, userId, body)`. Se retornar resposta, chamar `whatsapp-send` (ou postar direto na Graph API reusando a lógica) e marcar `bot_generated=true`.
- `src/pages/admin/AdminWhatsApp.tsx` — badge "🤖 bot" nas bolhas com `bot_generated=true`.
- `src/components/layout/ClientSidebar.tsx` — Parte A.

### Intents reconhecidos (regex pt-BR, case-insensitive, trim)

```text
^(treino|meu treino|treino de hoje|qual( e|é|) meu treino)$  → INTENT_GET_WORKOUT
^(feito|terminei|conclu[ií]|fiz|✓|ok)$                       → INTENT_LOG_WORKOUT_DONE
^(check[- ]?in|como (tô|estou)|registrar|diario|diário)$     → INTENT_START_CHECKIN
^(\d{1,2})\s+(\d{1,2})\s+(\d{1,2})$                          → INTENT_CHECKIN_VALUES (se session ativa)
^(ajuda|menu|comandos|\?|help)$                              → INTENT_HELP
^cancelar$                                                    → INTENT_CANCEL (limpa session)
```

Qualquer outra coisa → bot **não responde**, deixa inbound puro pro admin.

### Fluxo check-in (multi-turno)

```text
Cliente: check-in
Bot   : Bora. Manda 3 números separados por espaço:
        energia (1-10), sono (horas), estresse (1-10).
        Ex: 7 8 4
        [cria session flow='checkin', step=1]

Cliente: 7 8 4
Bot   : ✅ Registrado. Energia 7 · Sono 8h · Estresse 4.
        [insert em manual_day_logs, deleta session]
```

Se o cliente mandar outra coisa no meio: bot responde "Esperando: energia sono estresse. Ex: 7 8 4. Digite *cancelar* pra abortar."

Session expira em 10 min → cleanup via condição `expires_at < now()` lida no início de cada execução.

### Como validar

1. Teu WhatsApp pessoal já está vinculado no profile.
2. Manda `treino` → recebe lista de exercícios de hoje em texto.
3. Manda `feito` → recebe confirmação + streak.
4. Manda `check-in` → bot pergunta → manda `8 7 5` → confirma e salva.
5. Manda `oi tudo bem` → bot fica em silêncio, admin vê o inbound no `/admin/whatsapp`.
6. No painel admin, as respostas do bot aparecem com badge "🤖".

### Riscos / decisões em aberto

- **Janela de 24h da Meta**: bot só responde se o último inbound do usuário foi < 24h. Isso é natural porque ele só é acionado por inbound. Sem risco.
- **Loop**: bot nunca responde a mensagens outbound (filtro `direction='inbound'` antes de invocar).
- **Race condition** (2 mensagens em <1s): cada execução é atômica e o webhook já dedupa por `wa_message_id`.
- **Vincular telefone**: se cliente novo manda sem ter `profile.whatsapp` preenchido, bot ignora. Etapa 6 trata onboarding via WhatsApp.

### Arquivos editados (resumo)

- 1 migration (tabela `whatsapp_bot_sessions` + coluna `bot_generated`)
- `supabase/functions/_shared/whatsappBot.ts` (novo, ~400 linhas)
- `supabase/functions/_shared/whatsappBot.test.ts` (novo, ~150 linhas)
- `supabase/functions/whatsapp-webhook/index.ts` (editado, ~30 linhas adicionadas)
- `src/pages/admin/AdminWhatsApp.tsx` (badge bot, ~5 linhas)
- `src/components/layout/ClientSidebar.tsx` (1 linha — Parte A)
