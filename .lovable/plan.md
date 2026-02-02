

# Plano: Correção do Módulo Suporte - Chats (Admin) + Limite de 1 Conversa por Cliente

## Resumo

Corrigir o módulo de suporte admin para funcionar corretamente no mobile, adicionar status visual das conversas, modo de intervenção admin, e garantir que cada cliente tenha apenas UMA conversa de suporte ativa.

---

## Arquivos a Modificar

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `src/pages/admin/AdminSuporteChats.tsx` | **EDITAR** | Redesenhar layout mobile, adicionar status e intervencao |
| `src/pages/Suporte.tsx` | **EDITAR** | Corrigir logica para garantir 1 conversa por cliente |
| Migracao SQL | **CRIAR** | Adicionar constraint UNIQUE e campo status |

---

## Parte 1: Limite de 1 Conversa por Cliente

### Problema Atual

```typescript
// Linha 261-271 de Suporte.tsx - CRIA NOVA sem verificar duplicatas
const { data } = await supabase
  .from("conversas")
  .insert({
    user_id: user.id,
    tipo: "suporte",
    mensagens: messages as any
  })
```

### Solucao

**1. Migracao SQL - Adicionar UNIQUE constraint:**

```sql
-- Remover conversas duplicadas (manter apenas a mais recente)
DELETE FROM conversas a
USING conversas b
WHERE a.user_id = b.user_id
  AND a.tipo = b.tipo
  AND a.created_at < b.created_at;

-- Adicionar constraint para prevenir duplicatas futuras
ALTER TABLE conversas
ADD CONSTRAINT unique_user_tipo UNIQUE (user_id, tipo);

-- Adicionar campo status para controle
ALTER TABLE conversas
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
```

**2. Corrigir Suporte.tsx - Usar UPSERT:**

```typescript
// ANTES: INSERT simples
const { data } = await supabase
  .from("conversas")
  .insert({...})

// DEPOIS: UPSERT com on conflict
const { data } = await supabase
  .from("conversas")
  .upsert({
    user_id: user.id,
    tipo: "suporte",
    mensagens: messages as any,
    updated_at: new Date().toISOString()
  }, {
    onConflict: 'user_id,tipo',
    ignoreDuplicates: false
  })
  .select("id")
  .single();
```

---

## Parte 2: Layout Mobile Responsivo

### Cards Clicaveis no Mobile

```text
+---------------------------------------------------+
| [Verde] Rosangela Garcia                          |
| zanarebeca78@gmail.com                            |
| Status: Respondido pela IA                        |
| "Sobre alimentacao, eu como de manha..."          |
| ha 2 horas • 2 mensagens                          |
|                                     [Ver Chat ->] |
+---------------------------------------------------+
```

Cada card:
- Totalmente clicavel para abrir o chat
- Badge de status colorido
- Preview da ultima mensagem

---

## Parte 3: Sistema de Status

| Status | Indicador | Cor | Condicao |
|--------|-----------|-----|----------|
| **Respondido pela IA** | `Check` | Verde | Ultima mensagem e `role: assistant` |
| **Aguardando IA** | `Clock` | Amarelo | Ultima mensagem e `role: user` ha menos de 5 min |
| **Requer Intervencao** | `AlertTriangle` | Vermelho | Ultima mensagem e `role: user` ha mais de 5 min |
| **Intervencao Admin** | `User` | Azul | Ultima mensagem e `role: admin` |

### Funcao de Calculo

```typescript
const getConversationStatus = (conversa: Conversa) => {
  const msgs = conversa.mensagens;
  if (!Array.isArray(msgs) || msgs.length === 0) {
    return { label: 'Vazia', color: 'gray', icon: Circle };
  }
  
  const lastMsg = msgs[msgs.length - 1];
  const lastUpdate = new Date(conversa.updated_at);
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  
  if (lastMsg.role === 'admin') {
    return { label: 'Intervencao Admin', color: 'blue', icon: User };
  }
  
  if (lastMsg.role === 'assistant') {
    return { label: 'Respondido pela IA', color: 'green', icon: Check };
  }
  
  if (lastMsg.role === 'user') {
    if (lastUpdate < fiveMinutesAgo) {
      return { label: 'Requer Intervencao', color: 'red', icon: AlertTriangle };
    }
    return { label: 'Aguardando IA', color: 'yellow', icon: Clock };
  }
  
  return { label: 'Ativa', color: 'gray', icon: Circle };
};
```

---

## Parte 4: Modo Intervencao Admin

### Novo Campo de Entrada no Modal

```text
+---------------------------------------------------+
| Chat com Rosangela Garcia                [Fechar] |
| zanarebeca78@gmail.com                            |
+---------------------------------------------------+
| [Verde] Respondido pela IA                        |
| [Assumir Conversa]                                |
+---------------------------------------------------+
| HISTORICO                                         |
|                                                   |
| [Cliente] 12:29                                   |
| "Sobre alimentacao, eu como de manha 1 ovo..."    |
|                                                   |
| [IA] 12:29                          [Editar] [X]  |
| "Ola, Rosangela! Gabriel Bau aqui..."             |
+---------------------------------------------------+
| INTERVENCAO ADMIN                                 |
| [Digite sua resposta...]              [Enviar]    |
| Suas mensagens aparecerao como "Admin"            |
+---------------------------------------------------+
```

### Logica de Envio Admin

```typescript
const handleAdminReply = async (content: string) => {
  const adminMessage = {
    role: 'admin',
    content: content,
    timestamp: new Date().toISOString(),
    admin_name: 'Gabriel Bau'
  };
  
  const updatedMsgs = [...selectedConversa.mensagens, adminMessage];
  
  await supabase
    .from("conversas")
    .update({
      mensagens: updatedMsgs,
      status: 'admin_intervention',
      updated_at: new Date().toISOString()
    })
    .eq("id", selectedConversa.id);
};
```

---

## Parte 5: Contadores de Status

### Dashboard no Topo

```text
+---------------------------------------------------+
| SUPORTE - CHATS                                   |
| Monitore e intervenha nas conversas               |
+---------------------------------------------------+
| [2 Ativas] [0 Aguardando] [0 Intervencoes]       |
+---------------------------------------------------+
```

---

## Estrutura Final do Modal

```text
+---------------------------------------------------+
| Chat com [Nome do Cliente]              [X Fechar]|
| [email] • suporte                                 |
+---------------------------------------------------+
| STATUS: [Badge colorido]                          |
| [Assumir Conversa] [Limpar Historico]             |
+---------------------------------------------------+
| HISTORICO (ScrollArea)                            |
|                                                   |
| [12:29] Cliente                                   |
| "Mensagem do cliente..."                          |
|                                                   |
| [12:30] IA                      [Editar] [Excluir]|
| "Resposta da IA..."                               |
|                                                   |
| [12:35] Admin (Gabriel Bau)                       |
| "Intervencao do admin..."                         |
+---------------------------------------------------+
| RESPONDER COMO ADMIN                              |
| [_________________________________] [Enviar]      |
+---------------------------------------------------+
```

---

## Resumo das Alteracoes

1. **Constraint UNIQUE** no banco: Impede multiplas conversas por cliente
2. **UPSERT** no frontend: Garante reuso da conversa existente
3. **Layout mobile**: Cards clicaveis em vez de tabela
4. **Sistema de status**: Badges coloridos com deteccao automatica
5. **Timeout de 5 min**: Marca como "Requer Intervencao"
6. **Botao Assumir**: Admin pode tomar controle
7. **Campo de resposta**: Admin pode responder manualmente
8. **Contadores**: Dashboard com metricas de status

---

## Ordem de Implementacao

1. Criar migracao SQL (constraint + campo status)
2. Corrigir `Suporte.tsx` para usar UPSERT
3. Refatorar `AdminSuporteChats.tsx`:
   - Funcao `getConversationStatus()`
   - Layout mobile com cards
   - Contadores de status
   - Modal expandido com intervencao
   - Campo de resposta admin

