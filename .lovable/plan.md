## Cadastrar +55 43 99134-2004 no seu perfil e testar o bot

### O que vou fazer

1. **Vincular o número ao seu cadastro** na tabela `whatsapp_contacts` (formato E.164: `+5543991342004`), associado ao seu `user_id` de aluno (Gabriel Baú). É a tabela que o webhook usa para reconhecer o remetente.

2. **Enviar uma mensagem de teste** via edge function `whatsapp-send` para `+5543991342004` — algo como:  
   `"Olá Gabriel! Bot Renascer ativo. Responda: treino | feito | check-in | ajuda"`

3. **Você responde no WhatsApp** (do mesmo número 43 99134-2004) com `treino`. O webhook `whatsapp-webhook` recebe → identifica seu user_id pelo phone → dispara o parser → retorna a lista de exercícios do dia.

4. **Verifico no banco** se a mensagem entrou em `whatsapp_messages` (inbound + outbound) e mostro o resultado.

### Número que você envia mensagens

Você envia para **o número conectado ao WhatsApp Business no Meta** (o `WHATSAPP_PHONE_NUMBER_ID` configurado nos secrets). Esse número está no painel da Meta → WhatsApp Manager → Phone numbers. **Não está armazenado no código nem no banco** — só o ID interno da Meta. Se quiser, eu adiciono uma chamada à Graph API para exibir esse número em `/admin/whatsapp`.

### Pré-requisitos

- Secrets `WHATSAPP_ACCESS_TOKEN` e `WHATSAPP_PHONE_NUMBER_ID` precisam estar configurados (já estão, segundo o código de `whatsapp-send`).
- Seu número precisa ter aceito mensagens da conta business uma vez nas últimas 24h, OU usar um template aprovado para iniciar conversa. Vou usar template padrão `hello_world` se a janela de 24h estiver fechada.

### Comandos que você poderá testar

| Você envia | Bot responde |
|---|---|
| `treino` | Lista de exercícios do dia |
| `feito` | Confirma + streak |
| `check-in` | Pede 3 números (energia, sono, estresse) |
| `ajuda` | Lista de comandos |

Posso prosseguir?
